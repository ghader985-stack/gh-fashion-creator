// api/colorzones.js
// كشف مناطق الألوان في قسم «تغيير الألوان» — على طريقة Adstronaut.
//
// المنطقة = لون قماش واحد، ومعها كل أجزاء القطعة التي بهذا اللون:
// «Magenta: right bust panel, centre front ruffles, right skirt panel».
// هكذا يعرض المرجع نفس الفستان (3 مناطق)، ونتيجته صحيحة كاملة.
//
// التقسيم حسب الجزء جُرّب على النشرة ست مرات، وفي كل مرة سقط جزء: التنورة
// الداخلية، ثم السداة، ثم لوحة الصدر اليسرى. «كل الفوشي يصير أصفر» أمر
// لا يضيع منه جزء؛ سبعة أجزاء بأسمائها يضيع منها واحد دائماً.
//
// القماش المتدرّج بين لونين = منطقة لكل طرف، والتدرّج بينهما يُحفظ بالرسم.
// ولا بشرة ولا شعر ولا خلفية.

import formidable from 'formidable';
import fs from 'fs';

import { guard } from './_guard';
export const config = {
  api: { bodyParser: false },
  maxDuration: 120,
};

// sonnet: haiku جُرِّب على النشرة واخترع أجزاء غير موجودة (أكمام)، ووضع رقماً على
// الحائط، وأعطى أكثر من منطقة نفس الهيكس. فرق الكلفة ~سنتان، والتقسيم هو أساس القسم.
const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 2000;                // الخرج صغير: نصّ وألوان فقط
const CALL_TIMEOUT_MS = 55000;          // لكل محاولة على حدة
const MAX_ZONES = 6;

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

// النقطة اختيارية: {x,y} أو [x,y] أو نصّ، بالمئة أو 0–1
function readPoint(v) {
  let x = null;
  let y = null;
  if (Array.isArray(v) && v.length >= 2) { x = numOf(v[0]); y = numOf(v[1]); }
  else if (v && typeof v === 'object') {
    x = numOf(v.x !== undefined ? v.x : v[0]);
    y = numOf(v.y !== undefined ? v.y : v[1]);
  } else if (typeof v === 'string') {
    const m = (v.match(/-?\d+(?:\.\d+)?/g) || []).map(parseFloat);
    if (m.length >= 2) { x = m[0]; y = m[1]; }
  }
  if (x === null || y === null) return null;
  if (x <= 1.5 && y <= 1.5) { x *= 100; y *= 100; }
  return { x: clamp(x), y: clamp(y) };
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
  name: 'report_zones',
  description: 'Report the colour zones of the garment: one zone per garment part per colour.',
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
            parts: { type: 'string', description: 'EVERY garment part that has this colour, English, comma-separated.' },
            parts_ar: { type: 'string', description: 'The same, in Arabic.' },
            material: { type: 'string', description: 'Material, 1 to 3 English words.' },
            trim: { type: 'boolean', description: 'true only for beads, crystals, zips, buttons or metal hardware.' },
            size: { type: 'string', enum: ['large', 'medium', 'small'], description: 'How much of the garment this zone covers.' },
            point: {
              type: 'object',
              description: 'One point well inside this zone, percent 0-100 of width and height.',
              properties: { x: { type: 'number' }, y: { type: 'number' } },
            },
            box: {
              type: 'object',
              description: 'Optional. Rough rectangle over this zone, percent 0-100.',
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

List the garment's COLOUR ZONES the way a colour-changer tool does: one zone per fabric colour, and for each zone EVERY part of the garment that has that colour.

What a zone is:
- ONE fabric colour. Every part of the garment in that colour belongs to the same zone, wherever it is: bodice, straps, waistband, ruffles, skirt panels, lining. Example for a two-colour gown: zone 1 "Magenta Pink — right bust panel, centre front ruffles, right skirt panel, outer ruffle layers"; zone 2 "Deep Purple — left bust panel, halter strap, waistband, left ruffles, inner skirt".
- Light and shadow never make a new zone: the same cloth in a highlight and deep in a fold is one zone.
- A cloth that shades from one colour into another (ombre, dip-dye, petal tips darker than the petal) gives one zone for EACH END of the shading. Never make a zone for the blended middle.
- A small part in a clearly different colour from every fabric (gold hardware, a contrasting flower centre, a bow in another colour) is its own zone.
- Usually 2 to 4 zones. Never more than 6.
- Every visible part of the garment must belong to one zone. Check the whole garment, top to bottom, left and right, before answering: none may be left out.

Never include:
- the model's skin, face, hands or hair
- the background, the wall, the floor, furniture or props
- shoes or jewellery, unless they are clearly part of the design

For every zone give:
- name: the colour in English, 1 to 3 words, the way a fashion colour card names it: "Magenta Pink", "Deep Purple", "Chartreuse".
- hex: that colour as #RRGGBB, read from a normally lit spot of the cloth — not the highlight, not the shadow. Be precise: this value is shown to the designer and matched to a Pantone.
- parts: EVERY garment part that has this colour, in English, comma-separated, left and right named separately: "right bust panel, centre front ruffles, right skirt panel, outer ruffle layers".
- parts_ar: the same list in Arabic.
- material: the material in 1 to 3 English words: "silk crepe", "duchess satin", "silk organza".
- trim: true only for beading, crystals, zips, buttons or metal hardware. Otherwise false.
- size: "large" for a main fabric, "medium" for a clear secondary colour, "small" for a small detail.
- point: one point on a clearly visible spot of this colour ON THE GARMENT, as {"x":..,"y":..} in percent of the image width and height. It places the zone's number on the photograph, so it must sit on the fabric — never on skin, hair or the background.
- box: the rectangle over where this colour sits, {"x1":..,"y1":..,"x2":..,"y2":..} in percent.

Answer with the tool only.`;

const JSON_TAIL = 'Return ONLY one JSON object, no markdown fence, no other text:\n' +
  '{"description_ar":"فستان سهرة بلونين","zones":[{"name":"Chartreuse","hex":"#C8D23C",' +
  '"parts":"right bust panel, centre front ruffles, right skirt panel","parts_ar":"الصدر الأيمن، الكشكشات الأمامية، لوح التنورة الأيمن",' +
  '"material":"silk crepe","trim":false,"size":"large","point":{"x":60,"y":30}}]}';

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
      size: ['large', 'medium', 'small'].includes(str(o.size).toLowerCase()) ? str(o.size).toLowerCase() : 'medium',
      extent: str(o.extent).slice(0, 160),
      point: readPoint(o.point),
      box: readBox(o.box),
    };
    // الشرط الوحيد للبقاء: لون مقروء. لا إحداثي ولا أي شيء آخر.
  }).filter((z) => z.hex);
  return { zones: zones.slice(0, MAX_ZONES), raw: raw.length };
}

// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // تحقق الحساب + خصم من كمية الأداة (api/_guard.js)
  const g = await guard(req, res, 'analysis');
  if (!g) return;

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
