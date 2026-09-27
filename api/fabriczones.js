// api/fabriczones.js
// تحليل قسم «تبديل القماش» — على طريقة Adstronaut.
//
// المنطقة = نوع قماش واحد، ومعها كل أجزاء القطعة المعمولة منه:
//   1 · Main Bodice — sweetheart bodice and waistband
//   2 · Sheer Ruffled Overlay — puff sleeves, overskirt, ruffles
// لكل منطقة: الاسم، الأجزاء، «Current» وصف القماش الحالي، 3 اقتراحات،
// ونقطة على الصورة لرقمها. وسطر «Detected» بيوصف القطعة.
//
// استدعاء واحد لـ claude-sonnet-5 بنفس شكل استدعاء colorzones الشغّال.

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 120,
};

const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 2000;
const CALL_TIMEOUT_MS = 55000;
const MAX_ZONES = 5;

const pickFile = (f) => (Array.isArray(f) ? f[0] : f) || null;
const str = (v) => (typeof v === 'string' ? v.trim() : (typeof v === 'number' ? String(v) : ''));

function detectImageType(buffer) {
  if (!buffer || buffer.length < 4) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer.length > 12 && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return 'image/jpeg';
}

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
  const t = str(v);
  let m = /#?([0-9a-fA-F]{6})\b/.exec(t);
  if (m) return '#' + m[1].toUpperCase();
  m = /^#?([0-9a-fA-F]{3})$/.exec(t);
  if (m) return ('#' + m[1][0] + m[1][0] + m[1][1] + m[1][1] + m[1][2] + m[1][2]).toUpperCase();
  return '';
}

function readPoint(v) {
  let x = null;
  let y = null;
  if (Array.isArray(v) && v.length >= 2) { x = numOf(v[0]); y = numOf(v[1]); }
  else if (v && typeof v === 'object') { x = numOf(v.x); y = numOf(v.y); }
  else if (typeof v === 'string') {
    const m = (v.match(/-?\d+(?:\.\d+)?/g) || []).map(parseFloat);
    if (m.length >= 2) { x = m[0]; y = m[1]; }
  }
  if (x === null || y === null) return null;
  if (x <= 1.5 && y <= 1.5) { x *= 100; y *= 100; }
  return { x: clamp(x), y: clamp(y) };
}

function readBox(v) {
  if (!v || typeof v !== 'object') return null;
  let a = Array.isArray(v) ? v.slice(0, 4).map(numOf) : [numOf(v.x1), numOf(v.y1), numOf(v.x2), numOf(v.y2)];
  if (a.length < 4 || a.some((n) => n === null)) return null;
  if (a.every((n) => n <= 1.5)) a = a.map((n) => n * 100);
  const box = {
    x1: clamp(Math.min(a[0], a[2])), y1: clamp(Math.min(a[1], a[3])),
    x2: clamp(Math.max(a[0], a[2])), y2: clamp(Math.max(a[1], a[3])),
  };
  return box.x2 > box.x1 && box.y2 > box.y1 ? box : null;
}

// ---------------------------------------------------------------------------
const TOOL = {
  name: 'report_fabric_zones',
  description: 'Report the fabric zones of the garment: one zone per distinct fabric.',
  input_schema: {
    type: 'object',
    properties: {
      detected: { type: 'string', description: 'One English sentence describing the garment.' },
      detected_ar: { type: 'string', description: 'The same sentence in Arabic.' },
      zones: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Zone name in English, 2 to 4 words, e.g. "Main Bodice", "Sheer Ruffled Overlay".' },
            name_ar: { type: 'string', description: 'The zone name in Arabic.' },
            colour: { type: 'string', description: 'The exact fashion colour name of this fabric, English, 1 to 3 words, e.g. "Pistachio Green".' },
            hex: { type: 'string', description: 'The colour as #RRGGBB, read from a normally lit spot.' },
            fabric: { type: 'string', description: 'The fabric type now, 1 to 3 English words, e.g. "duchess satin".' },
            parts: { type: 'string', description: 'Every garment part made of this fabric in this colour, English, comma-separated.' },
            parts_ar: { type: 'string', description: 'The same list in Arabic.' },
            current: { type: 'string', description: 'The current fabric: colour, opacity, weave or knit, finish. English, under 16 words.' },
            current_ar: { type: 'string', description: 'The same description in Arabic.' },
            suggestions: { type: 'array', items: { type: 'string' }, description: 'Exactly 3 alternative fabric names, English, 1 to 3 words each.' },
            point: {
              type: 'object',
              description: 'One point well inside this zone ON THE GARMENT, percent 0-100 of width and height.',
              properties: { x: { type: 'number' }, y: { type: 'number' } },
            },
            box: {
              type: 'object',
              description: 'Rough rectangle over this zone, percent 0-100.',
              properties: { x1: { type: 'number' }, y1: { type: 'number' }, x2: { type: 'number' }, y2: { type: 'number' } },
            },
          },
          required: ['name', 'name_ar', 'colour', 'hex', 'fabric', 'parts', 'parts_ar', 'current', 'current_ar', 'suggestions', 'point'],
        },
      },
    },
    required: ['detected', 'detected_ar', 'zones'],
  },
};

const PROMPT = `Look at this photograph of a garment.

Split the garment into FABRIC ZONES the way a fabric-swapping tool does. A zone is ONE fabric in ONE colour, with every part of the garment made of it.

Rules:
- The same fabric in two colours is two zones (pistachio satin and purple satin are two zones).
- Two different fabrics are two zones even in the same colour (satin bodice and tulle skirt).
- Every part in that fabric and colour belongs to the same zone, wherever it is: bodice, drapes, folds at the waist, bows, panels, train.
- Light, shadow and folds never make a new zone.
- Beading, embroidery or sequins covering a clear area are their own zone.
- Usually 1 to 4 zones. Never more than 5. Every visible part of the garment belongs to one zone.
- Never include skin, face, hands, hair, the background, shoes or jewellery.

For every zone give:
- name: 2 to 4 English words naming the zone by its colour and role, like "Pistachio Satin Bodice", "Purple Satin Skirt", "Sheer Ruffled Overlay".
- name_ar: the same in Arabic.
- colour: the exact fashion colour name. Judge the true hue carefully: pistachio (light yellow-green) is not olive (dark brownish green); plum is not burgundy.
- hex: that colour as #RRGGBB, read from a normally lit spot of the cloth — not a highlight, not a shadow.
- fabric: the fabric type now, 1 to 3 words: "duchess satin", "silk organza", "tulle".
- parts: every garment part in this zone, English, comma-separated, left and right named separately.
- parts_ar: the same in Arabic.
- current: the fabric as it looks now — colour, opacity, weave or knit, finish — under 16 words.
- current_ar: the same in Arabic.
- suggestions: exactly 3 fabrics a designer could use instead for this zone, 1 to 3 English words each.
- point: {"x":..,"y":..} in percent of the image width and height, at the centre of the LARGEST clearly visible area of this zone, well inside it — never on its edge, never where it meets another zone, never on skin or background. It places the zone's number on the photograph.
- box: the rectangle over this zone, {"x1":..,"y1":..,"x2":..,"y2":..} in percent.

Also give detected: one English sentence describing the garment, and detected_ar, the same in Arabic.

Answer with the tool only.`;

const JSON_TAIL = 'Return ONLY one JSON object, no markdown fence, no other text:\n' +
  '{"detected":"A pale yellow evening dress.","detected_ar":"فستان سهرة أصفر فاتح.","zones":[{"name":"Main Bodice","name_ar":"الصدرية",' +
  '"colour":"Pale Yellow","hex":"#F3E7A1","fabric":"matte satin",' +
  '"parts":"bodice, waistband","parts_ar":"الصدرية، الخصر","current":"light yellow matte satin","current_ar":"ساتان مطفي أصفر فاتح",' +
  '"suggestions":["pleated chiffon","light satin","taffeta"],"point":{"x":50,"y":30},"box":{"x1":40,"y1":22,"x2":60,"y2":40}}]}';

// ---------------------------------------------------------------------------
export function normalise(parsed) {
  const raw = Array.isArray(parsed && parsed.zones) ? parsed.zones : [];
  const zones = raw.map((z) => {
    const o = z || {};
    const sug = (Array.isArray(o.suggestions) ? o.suggestions : String(o.suggestions || '').split(','))
      .map((s) => str(s).slice(0, 40)).filter(Boolean).slice(0, 3);
    return {
      name: str(o.name).slice(0, 50),
      nameAr: str(o.name_ar).slice(0, 50),
      colour: str(o.colour || o.color).slice(0, 40),
      hex: readHex(o.hex),
      fabric: str(o.fabric).slice(0, 40),
      parts: str(o.parts).slice(0, 200),
      partsAr: str(o.parts_ar).slice(0, 200),
      current: str(o.current).slice(0, 160),
      currentAr: str(o.current_ar).slice(0, 160),
      suggestions: sug,
      point: readPoint(o.point),
      box: readBox(o.box),
    };
  }).filter((z) => z.name && (z.parts || z.current));
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
    if (typeof console !== 'undefined') console.warn('[gh] fabriczones form', e && e.message);
    return res.status(400).json({ error: 'تعذّر استلام الصورة' });
  }

  const image = pickFile(files.image);
  if (!image) return res.status(400).json({ error: 'الصورة مطلوبة' });

  const buf = fs.readFileSync(image.filepath);
  const img = { type: 'image', source: { type: 'base64', media_type: detectImageType(buf), data: buf.toString('base64') } };

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
        if (typeof console !== 'undefined') console.warn('[gh] fabriczones http', r.status, detail);
        return { status: r.status };
      }

      const data = await r.json();
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
      if (typeof console !== 'undefined') console.warn('[gh] fabriczones call', e && e.name, e && e.message);
      return { failed: (e && e.name === 'AbortError') ? 'timeout' : 'network' };
    } finally {
      clearTimeout(timer);
    }
  };

  // نفس منطق colorzones: الأداة ثم JSON نصّي، والعطل العابر بينعاد بلا ما
  // ينحسب. سقف الاستدعاءات الناجحة المحاسَب عليها اثنين.
  const order = [true, false];
  let lastStatus = 0;
  let lastFail = '';
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
      if (norm.zones.length) {
        return res.status(200).json({
          detected: str(out.parsed.detected).slice(0, 300),
          detectedAr: str(out.parsed.detected_ar).slice(0, 300),
          zones: norm.zones,
        });
      }
    }
    idx++;
  }

  const why = lastStatus ? ('رمز ' + lastStatus)
    : lastFail === 'timeout' ? 'انتهت المهلة'
      : lastFail === 'network' ? 'انقطع الاتصال'
        : 'ردّ غير مقروء';
  return res.status(502).json({ error: 'تعذّر تحليل أقمشة القطعة — ' + why });
}
