// api/colorzones.js
// كشف مناطق الألوان في قسم «تغيير الألوان».
//
// استدعاء واحد لموديل رؤية على الصورة كما هي. يرجّع، لكل منطقة لونية:
// اسم اللون، لونه التقريبي، نوعها (قماش/إكسسوار/بشرة/شعر/خلفية)، وين
// بتقع على القطعة بالعربي وبالإنكليزي، خامتها، نقاط جوّاها، وصندوقها.
//
// ليش بلا أقنعة ولا تقسيم بالمتصفح: التقسيم بالبكسل لا يعرف أين الدرزة،
// والمنتج النهائي يرسمه نموذج صور لا الكانفاس. فالمطلوب من هذا المسار
// وصف دقيق للمناطق يُبنى عليه برومبت الرسم، لا قناع.
//
// النقاط تُستعمل في المتصفح لقراءة اللون الحقيقي من البكسلات — اللون
// المعروض والبانتون يُحسبان من الصورة نفسها لا من كلام الموديل.

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 120,
};

const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 4000;
const CALL_TIMEOUT_MS = 90000;
const MAX_ZONES = 9;

const KINDS = ['garment', 'trim', 'skin', 'hair', 'background', 'other'];
const KIND_RANK = { garment: 0, trim: 1, other: 2, skin: 3, hair: 4, background: 5 };

const pickFile = (f) => (Array.isArray(f) ? f[0] : f) || null;
const str = (v) => (typeof v === 'string' ? v.trim() : '');

function detectImageType(buffer) {
  if (!buffer || buffer.length < 4) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer.length > 12 && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return 'image/jpeg';
}

// ---------------------------------------------------------------------------
// أداة واحدة مُلزِمة: الرد يرجع JSON صالحاً دائماً، بلا تحليل نصّ ولا أقواس
const TOOL = {
  name: 'report_color_zones',
  description: 'Report the colour zones found in the product photograph.',
  input_schema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'One sentence in English naming the garment and its colours.',
      },
      description_ar: {
        type: 'string',
        description: 'The same sentence in Arabic.',
      },
      zones: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            name_ar: { type: 'string' },
            hex: { type: 'string' },
            kind: { type: 'string', enum: KINDS },
            parts: { type: 'string' },
            parts_ar: { type: 'string' },
            material: { type: 'string' },
            points: {
              type: 'array',
              items: {
                type: 'object',
                properties: { x: { type: 'number' }, y: { type: 'number' } },
                required: ['x', 'y'],
              },
            },
            box: {
              type: 'object',
              properties: {
                x1: { type: 'number' }, y1: { type: 'number' },
                x2: { type: 'number' }, y2: { type: 'number' },
              },
              required: ['x1', 'y1', 'x2', 'y2'],
            },
          },
          required: ['name', 'name_ar', 'hex', 'kind', 'parts', 'parts_ar', 'material', 'points', 'box'],
        },
      },
    },
    required: ['description', 'description_ar', 'zones'],
  },
};

const PROMPT = `The image is one product photograph, usually a garment worn by a model.

Find the distinct COLOUR ZONES in it. A colour zone is one area of one colour that a fashion designer would recolour as a single unit: one cloth in one dye. Two areas are the same zone when they are the same cloth in the same colour, even when they sit apart in the picture and even when one is in bright light and the other deep in a fold. They are different zones when a seam, an edge or a change of material separates them, or when the colour is plainly different.

Rules:
- Give between 1 and 6 zones for the garment itself. A gown usually has 2 to 4.
- A cloth that is dip-dyed, ombre or printed and shades from one colour into another is more than one zone: split it where a designer would name a different colour.
- Also report, each as its own zone, the other things in the frame that carry their own colour: the model's skin, the model's hair, the background. At most 3 of these, and only when they are clearly visible.
- Order the zones by how much of the PRODUCT each one covers, largest first, and put every garment and trim zone before skin, hair and background.

For every zone give:
- name: the colour in English, 1 to 3 words, the way a fashion colour card names it: "Magenta Pink", "Deep Purple", "Sage Green".
- name_ar: the same colour name in Arabic.
- hex: the colour as it appears in a normally lit part of that zone, as #RRGGBB. Not the colour in the highlight and not the colour in the shadow.
- kind: one of garment, trim, skin, hair, background, other. Use trim for zippers, buttons, beads, crystals, piping, embroidery and metal hardware.
- parts: in English, where this zone sits on the product, naming the real garment parts, 3 to 10 words: "right bust panel, centre front ruffles, right skirt panel". For skin, hair or background, say plainly what it is.
- parts_ar: the same text in Arabic.
- material: the material in 1 to 3 English words: "silk chiffon", "duchess satin", "beaded mesh". Empty string when the zone is not a material.
- points: 1 to 4 points that land INSIDE this zone, on its widest and most clearly visible parts, away from edges, seams, deep shadow and bright glare. x and y in percent of the image width and height, 0 to 100. These points are read straight off the pixels to get the true colour of the zone, so a point that lands a few percent off and hits the neighbouring cloth gives a wrong colour. Place them with care.
- box: the rectangle that contains the whole zone, x1 y1 x2 y2 in percent of width and height.

Answer with the tool only.`;

// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'مفتاح Claude غير مضبوط على الخادم' });
  }

  let files;
  try {
    const form = formidable({ maxFileSize: 8 * 1024 * 1024, maxTotalFileSize: 10 * 1024 * 1024 });
    [, files] = await form.parse(req);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] colorzones form', e && e.message);
    return res.status(400).json({ error: 'تعذّر استلام الصورة' });
  }

  const image = pickFile(files.image);
  if (!image) return res.status(400).json({ error: 'الصورة مطلوبة' });

  const buf = fs.readFileSync(image.filepath);
  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    tools: [TOOL],
    tool_choice: { type: 'tool', name: TOOL.name },
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: detectImageType(buf), data: buf.toString('base64') } },
        { type: 'text', text: PROMPT },
      ],
    }],
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CALL_TIMEOUT_MS);
  let parsed = null;
  let lastStatus = 0;

  try {
    // محاولتان: عطل عابر من الخدمة (429/5xx) يُعاد، وغلط الطلب لا يُعاد
    for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 1200));
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: ctrl.signal,
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        lastStatus = r.status;
        let detail = '';
        try { detail = (await r.text()).slice(0, 300); } catch (e) { detail = ''; }
        if (typeof console !== 'undefined') console.warn('[gh] colorzones status', r.status, detail);
        if (r.status === 429 || r.status >= 500) continue;
        break;
      }

      const data = await r.json();
      const use = (data.content || []).find((b) => b && b.type === 'tool_use' && b.input);
      if (use) parsed = use.input;
      else if (typeof console !== 'undefined') console.warn('[gh] colorzones no tool_use', data && data.stop_reason);
    }
  } catch (e) {
    clearTimeout(timer);
    if (typeof console !== 'undefined') console.warn('[gh] colorzones call', e && e.message);
    return res.status(504).json({ error: 'تعذّر الاتصال بخدمة تحليل الألوان' });
  }
  clearTimeout(timer);

  if (!parsed) {
    return res.status(502).json({ error: 'تعذّر تحليل مناطق الألوان (' + (lastStatus || 502) + ')' });
  }

  // -------------------------------------------------------------------------
  // تنظيف: كل رقم محصور، وكل نصّ مقصوص، وأي منطقة ناقصة تُسقَط
  const pct = (v, d) => (Number.isFinite(+v) ? Math.max(0, Math.min(100, +v)) : d);
  const hex = (v) => {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(str(v));
    return m ? '#' + m[1].toUpperCase() : '';
  };

  const zones = (Array.isArray(parsed.zones) ? parsed.zones : [])
    .map((z) => {
      const o = z || {};
      const points = (Array.isArray(o.points) ? o.points : [])
        .map((p) => ({ x: pct(p && p.x, -1), y: pct(p && p.y, -1) }))
        .filter((p) => p.x >= 0 && p.y >= 0)
        .slice(0, 4);
      const b = o.box || {};
      const box = {
        x1: Math.min(pct(b.x1, 0), pct(b.x2, 100)),
        y1: Math.min(pct(b.y1, 0), pct(b.y2, 100)),
        x2: Math.max(pct(b.x1, 0), pct(b.x2, 100)),
        y2: Math.max(pct(b.y1, 0), pct(b.y2, 100)),
      };
      const kind = KINDS.includes(str(o.kind).toLowerCase()) ? str(o.kind).toLowerCase() : 'other';
      return {
        name: str(o.name).slice(0, 40),
        nameAr: str(o.name_ar).slice(0, 40),
        hex: hex(o.hex),
        kind,
        parts: str(o.parts).slice(0, 160),
        partsAr: str(o.parts_ar).slice(0, 160),
        material: str(o.material).slice(0, 60),
        points,
        box,
      };
    })
    // منطقة بلا نقطة لا يمكن قراءة لونها من البكسلات، ومنطقة بلا لون لا تُعرض
    .filter((z) => z.points.length > 0 && z.hex)
    .sort((a, b2) => (KIND_RANK[a.kind] || 2) - (KIND_RANK[b2.kind] || 2))
    .slice(0, MAX_ZONES);

  if (!zones.length) {
    return res.status(502).json({ error: 'ما انكشفت مناطق لونية بهالصورة — جرّبي صورة أوضح' });
  }

  return res.status(200).json({
    description: str(parsed.description).slice(0, 240),
    descriptionAr: str(parsed.description_ar).slice(0, 240),
    zones,
  });
}
