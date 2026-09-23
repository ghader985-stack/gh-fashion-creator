// api/colorzones.js
// كشف ألوان القطعة في قسم «تغيير الألوان».
//
// المطلوب من هذا المسار شيء واحد: قائمة أقمشة القطعة، لكل قماش لونه واسمه
// ومكانه. ولا إحداثيات ولا صناديق ولا أقنعة — كل ما يُطلب من النموذج هو
// نصّ ولون.
//
// لماذا بهذا الضيق: كل فشل سابق في هذا المسار كان في الهندسة لا في اللون.
// النموذج يسمّي القماش بدقّة، وأي شيء يتطلّب إحداثيات كان يسقط ويأخذ معه
// القائمة كلها. فالإحداثي صار اختيارياً بالكامل: إن جاء يُستعمل للأرقام على
// الصورة، وإن لم يأتِ لا شيء يتعطّل.
//
// والقطعة وحدها: لا بشرة ولا شعر ولا خلفية. المصمّمة لا تغيّر لون الحائط.

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 120,
};

const MODEL = 'claude-sonnet-5';        // نفس موديل التيك باك، مُجرَّب مع الصور
const MAX_TOKENS = 2000;                // الخرج صغير: نصّ وألوان فقط
const CALL_TIMEOUT_MS = 55000;          // لكل محاولة على حدة
const MAX_ZONES = 8;

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
const numOf = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const m = /-?\d+(?:\.\d+)?/.exec(v);
    return m ? parseFloat(m[0]) : null;
  }
  return null;
};
const clamp = (v) => Math.max(0, Math.min(100, v));

function readHex(v) {
  const s = str(v);
  let m = /#?([0-9a-fA-F]{6})\b/.exec(s);
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

// الصندوق اختياري بالكامل: أي شكل مقبول، وغيابه لا يسقط المنطقة
function readBox(v) {
  let a = null;
  if (Array.isArray(v) && v.length >= 4) a = v.slice(0, 4).map(numOf);
  else if (v && typeof v === 'object') {
    if (v.x1 !== undefined) a = [numOf(v.x1), numOf(v.y1), numOf(v.x2), numOf(v.y2)];
    else if (v.left !== undefined) a = [numOf(v.left), numOf(v.top), numOf(v.right), numOf(v.bottom)];
    else if (v.x !== undefined && (v.w !== undefined || v.width !== undefined)) {
      const x = numOf(v.x); const y = numOf(v.y);
      const w = numOf(v.w !== undefined ? v.w : v.width);
      const h = numOf(v.h !== undefined ? v.h : v.height);
      if ([x, y, w, h].every((n) => n !== null)) a = [x, y, x + w, y + h];
    }
  } else if (typeof v === 'string') {
    const m = (v.match(/-?\d+(?:\.\d+)?/g) || []).map(parseFloat);
    if (m.length >= 4) a = m.slice(0, 4);
  }
  if (!a || a.some((n) => n === null || n === undefined)) return null;
  // النسب قد تأتي 0–1 بدل 0–100
  if (a.every((n) => n <= 1.5)) a = a.map((n) => n * 100);
  const box = {
    x1: clamp(Math.min(a[0], a[2])), y1: clamp(Math.min(a[1], a[3])),
    x2: clamp(Math.max(a[0], a[2])), y2: clamp(Math.max(a[1], a[3])),
  };
  return box.x2 > box.x1 && box.y2 > box.y1 ? box : null;
}

// ---------------------------------------------------------------------------
const TOOL = {
  name: 'report_fabrics',
  description: 'Report the fabrics of the garment and their colours.',
  input_schema: {
    type: 'object',
    properties: {
      description_ar: { type: 'string', description: 'One short Arabic sentence describing the garment and its colours.' },
      zones: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Colour name in English, 1 to 3 words.' },
            hex: { type: 'string', description: 'The colour as #RRGGBB.' },
            parts: { type: 'string', description: 'Where it sits on the garment, English, 3 to 8 words.' },
            parts_ar: { type: 'string', description: 'The same, in Arabic.' },
            material: { type: 'string', description: 'Material, 1 to 3 English words.' },
            trim: { type: 'boolean', description: 'true only for beads, crystals, zips, buttons or metal hardware.' },
            box: {
              type: 'object',
              description: 'Optional. Rough rectangle over this fabric, percent 0-100.',
              properties: { x1: { type: 'number' }, y1: { type: 'number' }, x2: { type: 'number' }, y2: { type: 'number' } },
            },
          },
          required: ['name', 'hex', 'parts', 'parts_ar', 'material'],
        },
      },
    },
    required: ['description_ar', 'zones'],
  },
};

const PROMPT = `Look at this photograph of a garment.

List the FABRICS the garment is made of — one entry per fabric colour that a designer would recolour on its own.

What counts as one entry:
- One cloth in one dye is ONE entry, however much the light and shadow change it across the photograph.
- A cloth that is dip-dyed or ombre, shading from one colour into another, is TWO entries: one for each end of the shading. Do not invent entries for the blend in between.
- Most gowns have 2 or 3 entries. Never more than 6.

What must NOT appear in the list, at all:
- the model's skin, face, hands or hair
- the background, the wall, the floor, any prop
- shadows, highlights or the blended middle of an ombre

For every entry:
- name: the colour in English, 1 to 3 words, the way a fashion colour card names it: "Magenta Pink", "Deep Navy", "Sage Green".
- hex: that colour as #RRGGBB, read from a normally lit part of the cloth — not from the highlight and not from the shadow. Be precise: this exact value is shown to the designer and matched to a Pantone.
- parts: where this fabric sits on the garment, in English, 3 to 8 words naming real garment parts: "right bust panel, centre front ruffles, skirt panels".
- parts_ar: the same text in Arabic, short.
- material: the material in 1 to 3 English words: "silk chiffon", "duchess satin", "beaded mesh".
- trim: true only for beading, crystals, zips, buttons or metal hardware. Otherwise false.
- box: optional. If you can, a rough rectangle covering where this fabric mostly sits, as {"x1":..,"y1":..,"x2":..,"y2":..} in percent of the image. Leave it out if unsure — it is only used to draw a marker.

Answer with the tool only.`;

const JSON_TAIL = 'Return ONLY one JSON object, no markdown fence, no other text:\n' +
  '{"description_ar":"فستان سهرة بلونين","zones":[{"name":"Magenta Pink","hex":"#B02E78",' +
  '"parts":"bodice, centre ruffles, skirt panels","parts_ar":"الصدر، الكشكشات الأمامية، ألواح التنورة",' +
  '"material":"duchess satin","trim":false}]}';

// ---------------------------------------------------------------------------
function normalise(parsed) {
  const raw = Array.isArray(parsed && parsed.zones) ? parsed.zones : [];
  const zones = raw.map((z) => {
    const o = z || {};
    return {
      name: str(o.name).slice(0, 40),
      hex: readHex(o.hex),
      kind: (o.trim === true || String(o.trim).toLowerCase() === 'true') ? 'trim' : 'garment',
      parts: str(o.parts).slice(0, 160),
      partsAr: str(o.parts_ar).slice(0, 160),
      material: str(o.material).slice(0, 60),
      box: readBox(o.box),
    };
    // الشرط الوحيد للبقاء: لون مقروء. لا إحداثي ولا أي شيء آخر.
  }).filter((z) => z.hex);
  return { zones: zones.slice(0, MAX_ZONES), raw: raw.length };
}

// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'مفتاح Claude غير مضبوط على الخادم' });

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

  // مهلة مستقلّة لكل محاولة: مهلة مشتركة كانت تقطع المحاولة الأخيرة
  const ask = async (useTool) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CALL_TIMEOUT_MS);
    try {
      const body = useTool
        ? { model: MODEL, max_tokens: MAX_TOKENS, tools: [TOOL], tool_choice: { type: 'tool', name: TOOL.name },
          messages: [{ role: 'user', content: [img, { type: 'text', text: PROMPT }] }] }
        : { model: MODEL, max_tokens: MAX_TOKENS,
          messages: [{ role: 'user', content: [img, { type: 'text', text: PROMPT + '\n\n' + JSON_TAIL }] }] };

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        signal: ctrl.signal,
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        let detail = '';
        try { detail = (await r.text()).slice(0, 300); } catch (e) { detail = ''; }
        if (typeof console !== 'undefined') console.warn('[gh] colorzones http', r.status, detail);
        return { status: r.status, detail };
      }

      const data = await r.json();
      if (typeof console !== 'undefined') console.warn('[gh] colorzones stop=' + (data && data.stop_reason) + ' tool=' + useTool);

      if (useTool) {
        const use = (data.content || []).find((b) => b && b.type === 'tool_use' && b.input);
        return { parsed: use ? use.input : null };
      }
      const text = (data.content || []).filter((b) => b && b.type === 'text').map((b) => b.text).join('');
      const t = text.replace(/```(?:json)?/gi, '').trim();
      const a = t.indexOf('{');
      const b = t.lastIndexOf('}');
      if (a < 0 || b <= a) return { parsed: null };
      try { return { parsed: JSON.parse(t.slice(a, b + 1)) }; } catch (e) { return { parsed: null }; }
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[gh] colorzones call', e && e.name, e && e.message);
      return { failed: (e && e.name === 'AbortError') ? 'timeout' : 'network' };
    } finally {
      clearTimeout(timer);
    }
  };

  let lastStatus = 0;
  let lastFail = '';
  let rawSeen = -1;

  // مساران: الأداة ثم JSON نصّي. العطل العابر يُعاد على المسار نفسه ولا
  // يُحاسَب عليه (الطلب الفاشل مجّاني)، والردّ الناجح الفارغ ينقل للمسار
  // التالي. سقف الاستدعاءات المحاسَب عليها اثنان.
  const order = [true, false];
  let charged = 0;
  let transient = 0;
  let idx = 0;

  while (idx < order.length && charged < 2) {
    const out = await ask(order[idx]);

    if (out.failed || (out.status && (out.status === 429 || out.status >= 500))) {
      if (out.status) lastStatus = out.status;
      if (out.failed) lastFail = out.failed;
      transient++;
      if (transient <= 2) continue;
      break;
    }
    if (out.status) { lastStatus = out.status; break; }

    charged++;
    if (out.parsed) {
      const norm = normalise(out.parsed);
      rawSeen = norm.raw;
      if (typeof console !== 'undefined') console.warn('[gh] colorzones raw=' + norm.raw + ' kept=' + norm.zones.length);
      if (norm.zones.length) {
        return res.status(200).json({
          descriptionAr: str(out.parsed.description_ar).slice(0, 240),
          zones: norm.zones,
        });
      }
    }
    idx++;
  }

  const why = lastStatus ? ('رمز ' + lastStatus)
    : lastFail === 'timeout' ? 'انتهت المهلة'
      : lastFail === 'network' ? 'انقطع الاتصال'
        : rawSeen >= 0 ? ('رجّع ' + rawSeen + ' قماش بلا لون مقروء')
          : 'ردّ غير مقروء';
  return res.status(502).json({ error: 'تعذّر تحليل ألوان القطعة — ' + why });
}
