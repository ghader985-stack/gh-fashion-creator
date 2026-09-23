// api/recolor.js
// إعادة رسم الصورة بالألوان الجديدة لقسم «تغيير الألوان».
//
// مُدخل واحد: الصورة الأصلية كما هي. ولا دليل ألوان ولا قناع ولا صورة
// ثانية — التجربة السابقة بيّنت أن الدليل المدهون هو نفسه سبب النتيجة
// المسطّحة، لأن النموذج يقلّد ما يراه.
//
// البديل: وصف دقيق بالنصّ في **استدعاء واحد** مهما كان عدد المناطق — كلفة
// ثابتة للنتيجة. كل منطقة سطر مستقل يبدأ بالجزء ثم لونه الحالي ثم الجديد،
// والأجزاء التي تبقى تُذكر بأسمائها وألوانها، وفي النهاية قائمة تحقّق.
//
// لماذا بهذه الصياغة: أول نتيجة حقيقية على النشرة كانت فوتوغرافية ممتازة
// لكن النموذج خلط أي جزء يأخذ أي لون، لأن وصف المكانين كان متداخلاً ولم
// يُذكر ما يبقى. التعريف بالجزء أولاً وذكر ما يبقى يزيلان هذا الالتباس.
//
// شكل الاستدعاء هو نفسه المستعمل في «الفلات سكتش» على النشرة:
// رفع الصورة لـ Replicate ثم predictions مع Prefer: wait.

import formidable from 'formidable';
import { put } from '@vercel/blob';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

// النموذج: سطر واحد.
//   google/nano-banana-2-lite  ← الافتراضي. مُثبت على حساب Replicate نفسه:
//                                تنبّؤات ناجحة بكلفة ‎$0.03 للصورة.
//   google/nano-banana-pro     ← أعلى جودة، ‎$0.15 للصورة.
const MODEL = 'google/nano-banana-2-lite';

const WAIT_SECONDS = 60;
const POLL_MS = 2000;
const TOTAL_TIMEOUT_MS = 270000;
const MAX_CHANGES = 8;           // كلها باستدعاء واحد: ‎$0.03 للنتيجة

const RATIOS = [
  ['1:1', 1], ['2:3', 2 / 3], ['3:2', 3 / 2], ['3:4', 3 / 4], ['4:3', 4 / 3],
  ['4:5', 4 / 5], ['5:4', 5 / 4], ['9:16', 9 / 16], ['16:9', 16 / 9],
];

const pickFile = (f) => (Array.isArray(f) ? f[0] : f) || null;
const getField = (f) => String((Array.isArray(f) ? f[0] : f) || '').trim();
const str = (v) => (typeof v === 'string' ? v.trim() : '');

function detectImageType(buffer) {
  if (!buffer || buffer.length < 4) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer.length > 12 && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return 'image/jpeg';
}

function nearestRatio(w, h) {
  if (!(w > 0) || !(h > 0)) return '3:4';
  const r = w / h;
  let best = RATIOS[0];
  let bd = Infinity;
  for (const item of RATIOS) {
    const d = Math.abs(Math.log(r / item[1]));
    if (d < bd) { bd = d; best = item; }
  }
  return best[0];
}

// ---------------------------------------------------------------------------
// رفع الصورة لـ Replicate: نفس الطريقة المشتغلة في techpack-images
async function uploadToReplicate(buffer, mediaType, token, signal) {
  const ext = ({ 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg' })[mediaType] || 'jpg';
  const boundary = '----gh' + Math.random().toString(36).slice(2);
  const head = Buffer.from(
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="content"; filename="source.' + ext + '"\r\n' +
    'Content-Type: ' + mediaType + '\r\n\r\n', 'utf8');
  const tail = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf8');

  const r = await fetch('https://api.replicate.com/v1/files', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
    },
    signal,
    body: Buffer.concat([head, buffer, tail]),
  });
  if (!r.ok) {
    let detail = '';
    try { detail = (await r.text()).slice(0, 200); } catch (e) { detail = ''; }
    if (typeof console !== 'undefined') console.warn('[gh] recolor upload', r.status, detail);
    return null;
  }
  const data = await r.json();
  return (data.urls && (data.urls.download || data.urls.get)) || null;
}

// ---------------------------------------------------------------------------
// حفظ دائم: رابط Replicate ينتهي بعد ساعة، ورابط Blob يبقى.
// أي فشل هنا يرجّع الرابط الأصلي فلا يضيع عمل مدفوع.
async function persist(url) {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !/^https?:\/\//i.test(url)) return url;
  try {
    const r = await fetch(url);
    if (!r.ok) return url;
    const ct = (r.headers.get('content-type') || '').split(';')[0];
    if (!ct.startsWith('image/')) return url;
    const ext = ({ 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg' })[ct] || 'png';
    const key = 'recolor/' + Date.now() + '-' + Math.random().toString(36).slice(2, 9) + '.' + ext;
    const out = await put(key, Buffer.from(await r.arrayBuffer()), {
      access: 'public', contentType: ct, addRandomSuffix: false,
    });
    return (out && out.url) || url;
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] recolor persist', e && e.message);
    return url;
  }
}

// ---------------------------------------------------------------------------
// اسم عائلة اللون بالإنكليزي من الهيكس: «purple»، «yellow-green»، «dark blue».
// اسم البانتون («Evening Primrose») لا يقول للنموذج ما هو اللون، وهذا يقول.
function hexRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colourWord(hex) {
  const c = hexRgb(hex);
  if (!c) return '';
  const r = c[0] / 255;
  const g = c[1] / 255;
  const b = c[2] / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (s < 0.14 || d < 0.07) {
    if (l < 0.14) return 'black';
    if (l > 0.9) return 'white';
    if (l > 0.72) return 'light grey';
    if (l < 0.32) return 'charcoal';
    return 'grey';
  }
  let h = 0;
  if (mx === r) h = 60 * (((g - b) / d) % 6);
  else if (mx === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;
  const steps = [
    [14, 'red'], [38, 'orange'], [50, 'golden yellow'], [62, 'yellow'], [85, 'yellow-green'],
    [165, 'green'], [185, 'teal'], [200, 'cyan'], [222, 'sky blue'], [248, 'blue'],
    [268, 'indigo'], [318, 'purple'], [335, 'magenta'], [350, 'pink'], [361, 'red'],
  ];
  let base = 'red';
  for (const [lim, name] of steps) { if (h < lim) { base = name; break; } }
  if ((base === 'orange' || base === 'golden yellow' || base === 'red') && l < 0.42 && s < 0.75) base = 'brown';
  if ((base === 'yellow' || base === 'golden yellow' || base === 'yellow-green') && l < 0.36) return 'olive';
  const tone = l < 0.24 ? 'dark ' : (l > 0.74 ? 'light ' : '');
  return tone + base;
}

// ---------------------------------------------------------------------------
// البرومبت. كل سطر = جزء واحد من القطعة، يُعرَّف بمكانه أولاً ثم بلونه
// الحالي، ومعه امتداده. المكان هو المُعرِّف الأساسي لأن نفس اللون قد يظهر
// على أجزاء أخرى تبقى كما هي.
//
// من النتيجة الحقيقية الثانية: النموذج (1) يتجاوز الأجزاء الصغيرة المدفونة
// بين أجزاء كبيرة، و(2) يترك أثر اللون القديم على أطراف الجزء المتدرّج.
// لذلك: الجزء الصغير يُعلَّم «تفصيلة صغيرة» ويتصدّر قائمة التحقّق، وكل سطر
// يحمل امتداد الجزء، وقاعدة التغطية الكاملة تمنع بقاء أي أثر للون القديم.
const describe = (hex, name) => [colourWord(hex), name ? '"' + name + '"' : '', hex].filter(Boolean).join(' ');

function buildPrompt(changes, keeps, subject) {
  const line = (c, i) => {
    const now = describe(c.fromHex, c.fromName) || 'its current colour';
    const to = [
      colourWord(c.toHex),
      c.toName ? '"' + c.toName + '"' : '',
      c.toCode ? 'PANTONE ' + c.toCode : '',
      c.toHex,
    ].filter(Boolean).join(' ');
    const part = c.parts || 'this area of the garment';
    const mat = c.material ? ' (' + c.material + ')' : '';
    const reach = c.extent ? ' It covers ' + c.extent.replace(/\.$/, '') + '.' : '';
    const small = c.size === 'small' ? ' SMALL DETAIL — easy to miss, recolour all of it.' : '';
    return (i + 1) + '. ' + part + mat + ' — now ' + now + ' → becomes ' + to + '.' + reach + small;
  };

  const keepLines = keeps.map((k) => {
    const now = describe(k.hex, k.name);
    return '- ' + (k.parts || 'the rest of the garment') + ' — stays ' + (now || 'exactly as it is') + '.';
  });

  // التفاصيل الصغيرة أولاً في قائمة التحقّق: هي ما يُنسى
  const ordered = changes.slice().sort((a, b) => (a.size === 'small' ? 0 : 1) - (b.size === 'small' ? 0 : 1));
  const check = ordered.map((c) => {
    const was = colourWord(c.fromHex);
    const target = (colourWord(c.toHex) || 'the new colour') + ' (' + c.toHex + ')';
    return '- ' + (c.parts || 'recoloured area') + ': ' + target + ' over ALL of it' +
      (was ? ', with no ' + was + ' left anywhere on it — not at its tips, edges or hem' : '') + '.';
  }).concat(keeps.map((k) => '- ' + (k.parts || 'kept area') + ': unchanged, still ' + (colourWord(k.hex) || 'as before') + '.'));

  return `This is a real product photograph${subject ? ' — ' + subject : ''}. Recolour ONLY the garment parts listed below and return the same photograph, identical in every other respect.

RECOLOUR — each line is ONE garment part. Recolour that part and nothing else:
${changes.map(line).join('\n')}

All lines apply together, each to the ORIGINAL photograph. The same original colour may also appear on other parts of the garment: those other parts keep their own colour unless they have their own line above. A colour that one line produces never changes which part another line refers to.

COMPLETE COVERAGE:
- Recolour each listed part all of it: every petal, panel, fold, tip, underside, edge and inner surface, right to where it meets a different part.
- No trace of a listed part's old colour may remain on it: not at its tips, not along its hem or edges, not in its shadows, not where the fabric turns thin or translucent, not where it shades or fades.
- A part that shades from one colour into another is recoloured across its whole length, ends included.
- Small parts count as much as large ones. A part marked SMALL DETAIL must be fully recoloured, including its centre and inner petals.

KEEP EXACTLY AS IT IS:
${keepLines.length ? keepLines.join('\n') + '\n' : ''}- The model's face, skin, hair, hands, nails, jewellery and shoes.
- The background, the wall, the floor, the furniture and the light on them.
- The pose, the framing, the crop, the camera angle, the focus and the grain.
- The cut of the garment: no seam, ruffle, petal, pleat, fold or edge moves, and nothing is added or removed.

HOW TO APPLY THE COLOUR:
Replace the hue only. Inside each recoloured part every light and dark passage stays exactly where it is: highlights, the shading inside folds, the sheen and translucency of the material, the weave, seams and stitching, beading and embroidery. A fold that was dark stays dark, in the new colour. Where one part meets another, the boundary stays exactly where it is in the original. The result must read as the same cloth dyed differently and photographed under the same light — never as flat paint.

In normally lit areas each recoloured part must match its given hex.

FINAL CHECK — before answering, confirm every line is true:
${check.join('\n')}

Output the finished photograph only, at the same size and framing as the input.`;
}

// ---------------------------------------------------------------------------
async function settle(token, prediction, signal, deadline) {
  let p = prediction;
  while (p && (p.status === 'starting' || p.status === 'processing')) {
    if (Date.now() > deadline) return { timeout: true };
    const url = p.urls && p.urls.get;
    if (!url) return { failed: 'no poll url' };
    await new Promise((r) => setTimeout(r, POLL_MS));
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, signal });
    if (!r.ok) return { failed: 'poll ' + r.status };
    p = await r.json();
  }
  return { prediction: p };
}

// ---------------------------------------------------------------------------
// استدعاء واحد للنموذج على صورة واحدة. يرجع { url } أو { error, status }.
// الطلب المرفوض قبل إنشاء الـprediction (400/422) لا يُحاسَب عليه رصيد.
async function runOne(token, imageUrl, prompt, w, h, signal, deadline) {
  // الأول بنفس شكل الاستدعاء الشغّال في «الفلات سكتش»، والثاني أضيق منه
  const attempts = [
    { prompt, image_input: [imageUrl], aspect_ratio: nearestRatio(w, h), output_format: 'jpg' },
    { prompt, image_input: [imageUrl] },
  ];

  let prediction = null;
  let lastStatus = 0;
  for (const input of attempts) {
    const r = await fetch('https://api.replicate.com/v1/models/' + MODEL + '/predictions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Prefer: 'wait=' + WAIT_SECONDS },
      signal,
      body: JSON.stringify({ input }),
    });
    if (r.ok) { prediction = await r.json(); break; }
    lastStatus = r.status;
    let detail = '';
    try { detail = (await r.text()).slice(0, 300); } catch (e) { detail = ''; }
    if (typeof console !== 'undefined') console.warn('[gh] recolor status', r.status, detail);
    if (r.status === 402) return { status: 402, error: 'رصيد Replicate خلص' };
    if (r.status !== 400 && r.status !== 422) break;
  }
  if (!prediction) return { status: 502, error: 'تعذّر إنشاء النتيجة (' + (lastStatus || 502) + ')' };

  const done = await settle(token, prediction, signal, deadline);
  if (done.timeout) return { status: 504, error: 'انتهت مهلة الرسم' };
  if (done.failed) {
    if (typeof console !== 'undefined') console.warn('[gh] recolor poll', done.failed);
    return { status: 502, error: 'تعذّر إنشاء النتيجة' };
  }
  const p = done.prediction;
  if (!p || p.status !== 'succeeded') {
    if (typeof console !== 'undefined') console.warn('[gh] recolor end', p && p.status, p && p.error);
    return { status: 502, error: 'تعذّر إنشاء النتيجة' };
  }
  const out = Array.isArray(p.output) ? p.output[0] : p.output;
  if (!out || typeof out !== 'string') return { status: 502, error: 'النموذج ما رجّع صورة' };
  return { url: out };
}

// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'مفتاح Replicate غير مضبوط على الخادم' });
  }

  let files;
  let fields;
  try {
    const form = formidable({ maxFileSize: 12 * 1024 * 1024, maxTotalFileSize: 14 * 1024 * 1024 });
    [fields, files] = await form.parse(req);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] recolor form', e && e.message);
    return res.status(400).json({ error: 'تعذّر استلام الصورة' });
  }

  const image = pickFile(files.image);
  if (!image) return res.status(400).json({ error: 'الصورة مطلوبة' });

  const parseList = (raw) => {
    try {
      const v = JSON.parse(raw || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  };

  const hexOk = (h) => /^#[0-9a-fA-F]{6}$/.test(h);

  const changes = parseList(getField(fields.changes)).slice(0, MAX_CHANGES).map((c) => ({
    parts: str(c && c.parts),
    material: str(c && c.material),
    size: ['large', 'medium', 'small'].includes(str(c && c.size)) ? str(c.size) : 'medium',
    extent: str(c && c.extent).slice(0, 160),
    fromName: str(c && c.fromName),
    fromHex: hexOk(str(c && c.fromHex)) ? str(c.fromHex).toUpperCase() : '',
    toHex: str(c && c.toHex).toUpperCase(),
    toName: str(c && c.toName),
    toCode: str(c && c.toCode),
  })).filter((c) => hexOk(c.toHex));

  if (!changes.length) return res.status(400).json({ error: 'ما في تغيير ألوان مطلوب' });

  const keeps = parseList(getField(fields.keeps)).slice(0, 10).map((k) => ({
    name: str(k && k.name),
    parts: str(k && k.parts),
    material: str(k && k.material),
    hex: hexOk(str(k && k.hex)) ? str(k.hex).toUpperCase() : '',
  }));

  const subject = str(getField(fields.subject)).slice(0, 200);
  const w = Number(getField(fields.w)) || 0;
  const h = Number(getField(fields.h)) || 0;

  const buf = fs.readFileSync(image.filepath);
  const mediaType = detectImageType(buf);

  const ctrl = new AbortController();
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;
  const timer = setTimeout(() => ctrl.abort(), TOTAL_TIMEOUT_MS + 5000);

  try {
    const source = await uploadToReplicate(buf, mediaType, token, ctrl.signal);
    if (!source) {
      clearTimeout(timer);
      return res.status(502).json({ error: 'تعذّر رفع الصورة لخدمة الرسم' });
    }

    // استدعاء واحد لكل التغييرات: كلفة ثابتة مهما كان عدد المناطق
    const one = await runOne(token, source, buildPrompt(changes, keeps, subject), w, h, ctrl.signal, deadline);
    clearTimeout(timer);
    if (!one.url) return res.status(one.status || 502).json({ error: one.error });

    return res.status(200).json({ url: await persist(one.url) });
  } catch (e) {
    clearTimeout(timer);
    const aborted = e && e.name === 'AbortError';
    if (typeof console !== 'undefined') console.warn('[gh] recolor call', e && e.message);
    return res.status(504).json({ error: aborted ? 'انتهت مهلة الرسم' : 'تعذّر الاتصال بخدمة الرسم' });
  }
}
