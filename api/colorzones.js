// api/colorzones.js
// كشف مناطق الألوان في قسم «تغيير الألوان».
//
// استدعاء واحد لموديل رؤية على الصورة كما هي. يرجّع، لكل منطقة لونية:
// اسم اللون، لونه التقريبي، نوعها (قماش/إكسسوار/بشرة/شعر/خلفية)، وين
// بتقع على القطعة بالعربي وبالإنكليزي، خامتها، نقاط جوّاها، وصندوقها.
//
// النقاط تُستعمل في المتصفح لقراءة اللون الحقيقي من البكسلات — اللون
// المعروض والبانتون يُحسبان من الصورة نفسها لا من كلام النموذج.
//
// ملاحظة على القراءة: النموذج قد يعيد النقطة أو الصندوق بأكثر من شكل
// ({x,y} أو [x,y] أو نسبة 0–1). القراءة هنا تقبلها كلها، والنقطة تُشتقّ
// من مركز الصندوق إن غابت. المنطقة لا تُرمى إلا إذا لم يكن فيها موضع
// إطلاقاً. الرمي الصامت كان سبب «ما انكشفت مناطق لونية» رغم نجاح النموذج.

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 120,
};

const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 8000;
const CALL_TIMEOUT_MS = 100000;
const MAX_ZONES = 9;

const KINDS = ['garment', 'trim', 'skin', 'hair', 'background', 'other'];
const KIND_RANK = { garment: 0, trim: 1, other: 2, skin: 3, hair: 4, background: 5 };
const KIND_ALIAS = {
  fabric: 'garment', cloth: 'garment', dress: 'garment', gown: 'garment',
  garment: 'garment', clothing: 'garment', apparel: 'garment',
  trim: 'trim', hardware: 'trim', accessory: 'trim', embellishment: 'trim',
  skin: 'skin', body: 'skin', hair: 'hair', headscarf: 'hair',
  background: 'background', backdrop: 'background', wall: 'background', floor: 'background',
};

const pickFile = (f) => (Array.isArray(f) ? f[0] : f) || null;
const str = (v) => (typeof v === 'string' ? v.trim() : (typeof v === 'number' ? String(v) : ''));

function detectImageType(buffer) {
  if (!buffer || buffer.length < 4) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer.length > 12 && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return 'image/jpeg';
}

// ---------------------------------------------------------------------------
// قراءة متسامحة للأرقام والمواضع
const num = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const m = /-?\d+(?:\.\d+)?/.exec(v);
    return m ? parseFloat(m[0]) : null;
  }
  return null;
};
const clamp = (v) => Math.max(0, Math.min(100, v));

// النموذج قد يعطي النسب 0–1 بدل 0–100
function rescale(list) {
  if (!list.length) return list;
  const all = [];
  list.forEach((p) => { all.push(p.x, p.y); });
  const big = all.some((v) => v > 1.5);
  if (big) return list;
  return list.map((p) => ({ x: clamp(p.x * 100), y: clamp(p.y * 100) }));
}

function readPoints(v) {
  const out = [];
  const push = (x, y) => {
    const px = num(x);
    const py = num(y);
    if (px === null || py === null) return;
    out.push({ x: px, y: py });
  };
  const one = (p) => {
    if (Array.isArray(p)) push(p[0], p[1]);
    else if (p && typeof p === 'object') push(p.x ?? p.X ?? p.left ?? p[0], p.y ?? p.Y ?? p.top ?? p[1]);
    else if (typeof p === 'string') {
      const m = p.match(/-?\d+(?:\.\d+)?/g);
      if (m && m.length >= 2) push(m[0], m[1]);
    }
  };
  if (Array.isArray(v)) v.forEach(one);
  else if (typeof v === 'string') {
    const m = v.match(/-?\d+(?:\.\d+)?/g) || [];
    for (let i = 0; i + 1 < m.length; i += 2) push(m[i], m[i + 1]);
  } else if (v && typeof v === 'object') one(v);
  return rescale(out).map((p) => ({ x: clamp(p.x), y: clamp(p.y) })).slice(0, 4);
}

function readBox(v) {
  let a = null;
  if (Array.isArray(v) && v.length >= 4) a = [num(v[0]), num(v[1]), num(v[2]), num(v[3])];
  else if (v && typeof v === 'object') {
    if (v.x1 !== undefined || v.x2 !== undefined) a = [num(v.x1), num(v.y1), num(v.x2), num(v.y2)];
    else if (v.left !== undefined) a = [num(v.left), num(v.top), num(v.right), num(v.bottom)];
    else if (v.x !== undefined && (v.w !== undefined || v.width !== undefined)) {
      const x = num(v.x); const y = num(v.y);
      const w = num(v.w ?? v.width); const h = num(v.h ?? v.height);
      if (x !== null && y !== null && w !== null && h !== null) a = [x, y, x + w, y + h];
    }
  } else if (typeof v === 'string') {
    const m = (v.match(/-?\d+(?:\.\d+)?/g) || []).map(parseFloat);
    if (m.length >= 4) a = m.slice(0, 4);
  }
  if (!a || a.some((n) => n === null)) return null;
  const pts = rescale([{ x: a[0], y: a[1] }, { x: a[2], y: a[3] }]);
  return {
    x1: clamp(Math.min(pts[0].x, pts[1].x)),
    y1: clamp(Math.min(pts[0].y, pts[1].y)),
    x2: clamp(Math.max(pts[0].x, pts[1].x)),
    y2: clamp(Math.max(pts[0].y, pts[1].y)),
  };
}

function readHex(v) {
  const s = str(v);
  let m = /^#?([0-9a-fA-F]{6})\b/.exec(s);
  if (m) return '#' + m[1].toUpperCase();
  m = /^#?([0-9a-fA-F]{3})$/.exec(s);
  if (m) return ('#' + m[1][0] + m[1][0] + m[1][1] + m[1][1] + m[1][2] + m[1][2]).toUpperCase();
  m = /rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i.exec(s);
  if (m) {
    const h = (n) => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, '0');
    return ('#' + h(m[1]) + h(m[2]) + h(m[3])).toUpperCase();
  }
  return '';
}

// ---------------------------------------------------------------------------
const TOOL = {
  name: 'report_color_zones',
  description: 'Report the colour zones found in the product photograph.',
  input_schema: {
    type: 'object',
    properties: {
      description: { type: 'string', description: 'One sentence in English naming the garment and its colours.' },
      description_ar: { type: 'string', description: 'The same sentence in Arabic.' },
      zones: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Colour name in English, 1 to 3 words.' },
            hex: { type: 'string', description: 'Colour as #RRGGBB.' },
            kind: { type: 'string', enum: KINDS },
            parts: { type: 'string', description: 'Where this zone sits, in English, naming real garment parts.' },
            parts_ar: { type: 'string', description: 'The same text in Arabic.' },
            material: { type: 'string', description: 'Material in 1 to 3 English words, or empty.' },
            points: {
              type: 'array',
              description: '1 to 4 points inside the zone, x and y in percent 0-100.',
              items: {
                type: 'object',
                properties: { x: { type: 'number' }, y: { type: 'number' } },
                required: ['x', 'y'],
              },
            },
            box: {
              type: 'object',
              description: 'Rectangle containing the zone, in percent 0-100.',
              properties: { x1: { type: 'number' }, y1: { type: 'number' }, x2: { type: 'number' }, y2: { type: 'number' } },
              required: ['x1', 'y1', 'x2', 'y2'],
            },
          },
          required: ['name', 'hex', 'kind', 'parts', 'parts_ar', 'material', 'points', 'box'],
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
- Also report, each as its own zone, the other things in the frame that carry their own colour: the model's skin, the model's hair, the background. At most 3 of these, and only when clearly visible.
- Order the zones by how much of the PRODUCT each one covers, largest first, and put every garment and trim zone before skin, hair and background.

For every zone give:
- name: the colour in English, 1 to 3 words, the way a fashion colour card names it: "Magenta Pink", "Deep Purple", "Sage Green".
- hex: the colour as it appears in a normally lit part of that zone, as #RRGGBB. Not the colour in the highlight and not the colour in the shadow.
- kind: one of garment, trim, skin, hair, background, other. Use trim for zippers, buttons, beads, crystals, piping, embroidery and metal hardware.
- parts: in English, where this zone sits on the product, naming the real garment parts, 3 to 10 words: "right bust panel, centre front ruffles, right skirt panel". For skin, hair or background, say plainly what it is.
- parts_ar: the same text in Arabic, short.
- material: the material in 1 to 3 English words: "silk chiffon", "duchess satin", "beaded mesh". Empty string when the zone is not a material.
- points: REQUIRED. 1 to 4 points that land INSIDE this zone, on its widest and most clearly visible parts, away from edges, seams, deep shadow and bright glare. Each point is an object {"x": <number>, "y": <number>} where x and y are PERCENTAGES of the image width and height, from 0 to 100. Example: {"x": 62.5, "y": 31}. These points are read straight off the pixels to get the true colour of the zone, so a point that lands a few percent off and hits the neighbouring cloth gives a wrong colour. Place them with care.
- box: REQUIRED. The rectangle containing the whole zone as {"x1":..,"y1":..,"x2":..,"y2":..}, all four in percent from 0 to 100.

Keep parts and parts_ar short. Answer with the tool only.`;

const JSON_TAIL = 'Return ONLY one JSON object and nothing else, no markdown fence:\n' +
  '{"description":"...","description_ar":"...","zones":[{"name":"Magenta Pink","hex":"#B02E78","kind":"garment",' +
  '"parts":"right bust panel, centre front ruffles","parts_ar":"الصدر الأيمن، الكشكشات الأمامية","material":"silk chiffon",' +
  '"points":[{"x":62.5,"y":31}],"box":{"x1":20,"y1":22,"x2":86,"y2":99}}]}';

// ---------------------------------------------------------------------------
function normalise(parsed) {
  const raw = Array.isArray(parsed && parsed.zones) ? parsed.zones : [];
  let dropped = 0;

  const zones = raw.map((z) => {
    const o = z || {};
    const box = readBox(o.box);
    let points = readPoints(o.points);
    // بلا نقطة صالحة: مركز الصندوق يكفي لقراءة اللون ولوضع الرقم
    if (!points.length && box) {
      points = [{ x: (box.x1 + box.x2) / 2, y: (box.y1 + box.y2) / 2 }];
    }
    const kindRaw = str(o.kind).toLowerCase();
    const kind = KINDS.includes(kindRaw) ? kindRaw : (KIND_ALIAS[kindRaw] || 'other');
    return {
      name: str(o.name).slice(0, 40),
      hex: readHex(o.hex),
      kind,
      parts: str(o.parts).slice(0, 160),
      partsAr: str(o.parts_ar).slice(0, 160),
      material: str(o.material).slice(0, 60),
      points,
      box: box || null,
    };
  }).filter((z) => {
    // الشرط الوحيد للرمي: ما في موضع إطلاقاً، فلا يمكن قراءة لونها
    const ok = z.points.length > 0;
    if (!ok) dropped++;
    return ok;
  });

  zones.sort((a, b) => (KIND_RANK[a.kind] || 2) - (KIND_RANK[b.kind] || 2));
  return { zones: zones.slice(0, MAX_ZONES), raw: raw.length, dropped };
}

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
  const img = { type: 'image', source: { type: 'base64', media_type: detectImageType(buf), data: buf.toString('base64') } };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CALL_TIMEOUT_MS);

  const ask = async (useTool) => {
    const body = useTool
      ? {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: TOOL.name },
        messages: [{ role: 'user', content: [img, { type: 'text', text: PROMPT }] }],
      }
      : {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: [img, { type: 'text', text: PROMPT + '\n\n' + JSON_TAIL }] }],
      };

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      signal: ctrl.signal,
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      let detail = '';
      try { detail = (await r.text()).slice(0, 300); } catch (e) { detail = ''; }
      if (typeof console !== 'undefined') console.warn('[gh] colorzones status', r.status, detail);
      return { status: r.status };
    }

    const data = await r.json();
    if (typeof console !== 'undefined') console.warn('[gh] colorzones stop', data && data.stop_reason, 'tool', useTool);

    if (useTool) {
      const use = (data.content || []).find((b) => b && b.type === 'tool_use' && b.input);
      return { parsed: use ? use.input : null, stop: data && data.stop_reason };
    }
    const text = (data.content || []).filter((b) => b && b.type === 'text').map((b) => b.text).join('');
    const t = text.replace(/```(?:json)?/gi, '').trim();
    const a = t.indexOf('{');
    const b = t.lastIndexOf('}');
    if (a < 0 || b <= a) return { parsed: null, stop: data && data.stop_reason };
    try { return { parsed: JSON.parse(t.slice(a, b + 1)), stop: data && data.stop_reason }; }
    catch (e) { return { parsed: null, stop: data && data.stop_reason }; }
  };

  let best = null;
  let lastStatus = 0;

  try {
    // ثلاث محاولات على مسارين: الأداة أولاً، ثم JSON نصّي إن رجعت فاضية
    for (const useTool of [true, true, false]) {
      let out;
      try { out = await ask(useTool); } catch (e) {
        if (e && e.name === 'AbortError') throw e;
        if (typeof console !== 'undefined') console.warn('[gh] colorzones ask', e && e.message);
        continue;
      }
      if (out.status) {
        lastStatus = out.status;
        if (out.status !== 429 && out.status < 500) break;
        continue;
      }
      if (!out.parsed) continue;
      const norm = normalise(out.parsed);
      if (typeof console !== 'undefined') {
        console.warn('[gh] colorzones zones raw=' + norm.raw + ' kept=' + norm.zones.length + ' dropped=' + norm.dropped);
      }
      if (norm.zones.length) { best = { norm, parsed: out.parsed }; break; }
      if (!best) best = { norm, parsed: out.parsed };
    }
  } catch (e) {
    clearTimeout(timer);
    if (typeof console !== 'undefined') console.warn('[gh] colorzones call', e && e.message);
    return res.status(504).json({ error: 'تعذّر الاتصال بخدمة تحليل الألوان' });
  }
  clearTimeout(timer);

  if (!best) {
    return res.status(502).json({ error: 'تعذّر تحليل مناطق الألوان (' + (lastStatus || 502) + ')' });
  }
  if (!best.norm.zones.length) {
    // التشخيص في نصّ الخطأ نفسه، فلا نحتاج لتخمين إن تكرّر
    return res.status(502).json({
      error: 'الموديل رجّع ' + best.norm.raw + ' منطقة وما قدرت أقرا موضع ولا وحدة — ابعتيلي هالرسالة متل ما هي',
    });
  }

  return res.status(200).json({
    description: str(best.parsed.description).slice(0, 240),
    descriptionAr: str(best.parsed.description_ar).slice(0, 240),
    zones: best.norm.zones,
  });
}
