// api/variationoptions.js
// تحليل قسم «تنويعات التصميم» — على طريقة Adstronaut.
//
// بيقرأ القطعة وبيرجّع فئات التعديل المناسبة لنوعها، ولكل فئة القيمة الحالية
// و4 خيارات بديلة. للفستان مثلاً: Silhouette · Length · Sleeves · Neckline.
// للجاكيت: Fit · Length · Collar · Sleeves … يعني بيشتغل على أي قطعة.
//
// استدعاء واحد لـ claude-sonnet-5 بنفس شكل استدعاء colorzones الشغّال.

import formidable from 'formidable';
import fs from 'fs';

import { guard } from './_guard';
export const config = {
  api: { bodyParser: false },
  maxDuration: 120,
};

const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 2000;
const CALL_TIMEOUT_MS = 55000;
const MAX_CATS = 5;

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
const TOOL = {
  name: 'report_design_options',
  description: 'Report the design categories a designer can change on this garment, with the current value and 4 alternatives each.',
  input_schema: {
    type: 'object',
    properties: {
      detected: { type: 'string', description: 'One English sentence describing the garment.' },
      detected_ar: { type: 'string', description: 'The same sentence in Arabic.' },
      categories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Category name in English, 1 to 2 words, e.g. "Silhouette".' },
            name_ar: { type: 'string', description: 'The category name in Arabic.' },
            current: { type: 'string', description: 'The current value on this garment, English, 1 to 3 words, lowercase.' },
            current_ar: { type: 'string', description: 'The current value in Arabic.' },
            options: {
              type: 'array',
              description: 'Exactly 4 alternatives, each different from the current value.',
              items: {
                type: 'object',
                properties: {
                  en: { type: 'string', description: 'English, 1 to 3 words, Title Case, e.g. "Ball Gown".' },
                  ar: { type: 'string', description: 'The same in Arabic.' },
                },
                required: ['en', 'ar'],
              },
            },
          },
          required: ['name', 'name_ar', 'current', 'current_ar', 'options'],
        },
      },
    },
    required: ['detected', 'detected_ar', 'categories'],
  },
};

const PROMPT = `Look at this photograph of a garment.

List the design categories a fashion designer would change to create variations of THIS garment, the way a design-variation tool does.

Pick the 4 most useful categories for this type of garment:
- Dress or gown: Silhouette, Length, Sleeves, Neckline.
- Skirt: Silhouette, Length, Waist, Details.
- Trousers: Fit, Length, Waist, Leg.
- Jacket, coat or blazer: Fit, Length, Collar, Sleeves.
- Top, blouse or shirt: Fit, Neckline, Sleeves, Length.
- Abaya or kaftan: Silhouette, Sleeves, Neckline, Front.
For anything else, choose the 4 categories that change its look most.

For every category give:
- name and name_ar.
- current: what this garment has now, 1 to 3 words, lowercase: "fit-and-flare", "mini", "strapless".
- current_ar.
- options: exactly 4 real alternatives a designer would pick, each clearly different from the current value and from each other, 1 to 3 words, Title Case: "A-Line", "Ball Gown", "Empire", "Sheath". Each with its Arabic name.

Also give detected: one English sentence describing the garment ("A vibrant strapless dress with a unique petal design."), and detected_ar, the same in Arabic.

Answer with the tool only.`;

const JSON_TAIL = 'Return ONLY one JSON object, no markdown fence, no other text:\n' +
  '{"detected":"A strapless mini dress.","detected_ar":"فستان قصير بدون أكتاف.","categories":[{"name":"Length","name_ar":"الطول",' +
  '"current":"mini","current_ar":"قصير","options":[{"en":"Knee-Length","ar":"للركبة"},{"en":"Midi","ar":"ميدي"},' +
  '{"en":"Maxi","ar":"ماكسي"},{"en":"Floor-Length","ar":"للأرض"}]}]}';

// ---------------------------------------------------------------------------
export function normalise(parsed) {
  const raw = Array.isArray(parsed && parsed.categories) ? parsed.categories : [];
  const cats = raw.map((c) => {
    const o = c || {};
    const cur = str(o.current).toLowerCase();
    const seen = new Set();
    const options = (Array.isArray(o.options) ? o.options : []).map((x) => {
      if (typeof x === 'string') return { en: str(x).slice(0, 40), ar: '' };
      return { en: str(x && x.en).slice(0, 40), ar: str(x && x.ar).slice(0, 40) };
    }).filter((x) => {
      const k = x.en.toLowerCase();
      if (!k || k === cur || seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 4);
    return {
      name: str(o.name).slice(0, 30),
      nameAr: str(o.name_ar).slice(0, 30),
      current: str(o.current).slice(0, 40),
      currentAr: str(o.current_ar).slice(0, 40),
      options,
    };
  }).filter((c) => c.name && c.options.length >= 2);
  return { categories: cats.slice(0, MAX_CATS) };
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
    if (typeof console !== 'undefined') console.warn('[gh] variationoptions form', e && e.message);
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
        if (typeof console !== 'undefined') console.warn('[gh] variationoptions http', r.status, detail);
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
      if (typeof console !== 'undefined') console.warn('[gh] variationoptions call', e && e.name, e && e.message);
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
      if (norm.categories.length) {
        return res.status(200).json({
          detected: str(out.parsed.detected).slice(0, 300),
          detectedAr: str(out.parsed.detected_ar).slice(0, 300),
          categories: norm.categories,
        });
      }
    }
    idx++;
  }

  const why = lastStatus ? ('رمز ' + lastStatus)
    : lastFail === 'timeout' ? 'انتهت المهلة'
      : lastFail === 'network' ? 'انقطع الاتصال'
        : 'ردّ غير مقروء';
  return res.status(502).json({ error: 'تعذّر تحليل التصميم — ' + why });
}
