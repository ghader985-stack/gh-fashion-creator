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

import { guard } from './_guard';
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

// LAB للمقارنة: درجتان من نفس القماش (مضوّية ومظلّلة) قريبتان بالصبغة
function hexLab(hex) {
  const c = hexRgb(hex);
  if (!c) return null;
  const lin = (v) => { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; };
  const r = lin(c[0]); const g = lin(c[1]); const b = lin(c[2]);
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const X = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
  const Y = f(r * 0.2126 + g * 0.7152 + b * 0.0722);
  const Z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
}
const SAME_CLOTH = 20;   // تحت هالفرق بالصبغة: نفس لون القماش
function sameCloth(h1, h2) {
  const a = hexLab(h1); const b = hexLab(h2);
  return Boolean(a && b) && Math.hypot(a[1] - b[1], a[2] - b[2]) < SAME_CLOTH;
}

// تجميع: أجزاء بنفس لون القماش رايحة لنفس اللون الجديد = سطر واحد
// «كل القماش الأخضر المصفر يصير أزرق». النتيجة الحقيقية بيّنت أن النموذج
// يضيّع جزءاً شفافاً بين أجزاء أكبر إذا جاء بسطر منفصل. لا يُجمَّع شيء
// إذا كان جزء باقٍ على حاله بنفس اللون، فهناك يلزم التمييز بالمكان.
function groupChanges(changes, keeps) {
  const groups = [];
  changes.forEach((c) => {
    // جزء باقٍ بنفس اللون: لازم التمييز بالمكان، فلا تجميع
    const kept = keeps.some((k) => k.hex && c.fromHex && sameCloth(k.hex, c.fromHex));
    const g = !kept && c.fromHex && groups.find((q) => !q.solo && q.to === c.toHex && sameCloth(q.items[0].fromHex, c.fromHex));
    if (g) g.items.push(c);
    else groups.push({ to: c.toHex, solo: kept || !c.fromHex, items: [c] });
  });
  // «كل هاللون وين ما كان» تُقال فقط إذا ما في جزء آخر بنفس اللون رايح للون مختلف
  groups.forEach((g) => {
    g.exclusive = !changes.some((o) => !g.items.includes(o) && o.fromHex && sameCloth(o.fromHex, g.items[0].fromHex));
  });
  return groups;
}

// البرومبت: قصير وبصيغة أمر.
//
// أربع نتائج حقيقية بـ lite والبرومبت طويل ومليء بالمنع («لا تغيّري»، «قائمة
// ما يبقى»، «قائمة تحقّق») — وكل مرة ترك النموذج أجزاء بلا تلوين. نموذج
// التعديل يقرأ كثرة المنع كتحذير فيعدّل أقل. البرومبت صار: ماذا يتلوّن،
// سطراً لكل مجموعة، ثم جملة واحدة لما يبقى.
function buildPrompt(changes, keeps, subject, closeup, refParts) {
  const now = (hex, name) => [colourWord(hex), name ? '"' + name + '"' : '', hex].filter(Boolean).join(' ');
  const target = (c) => [
    colourWord(c.toHex),
    c.toHex,
    c.toName ? '(' + (c.toCode ? 'PANTONE ' + c.toCode + ' ' : '') + c.toName + ')' : '',
  ].filter(Boolean).join(' ');

  const lines = groupChanges(changes, keeps).map((g, i) => {
    const c = g.items[0];
    const names = g.items.map((x) => x.parts).filter(Boolean);
    const parts = names.length ? names.join(', plus the ') : 'listed area';
    const smalls = g.items.filter((x) => x.size === 'small');
    let small = '';
    if (smalls.length === g.items.length) {
      small = ' — a small detail, do not skip it; change only its ' + (colourWord(c.fromHex) || 'listed-colour') + ' areas';
    } else if (smalls.length) {
      small = ' — the ' + smalls.map((x) => x.parts).join(' and ') + ' ' + (smalls.length > 1 ? 'are small details' : 'is a small detail') + ', do not skip ' + (smalls.length > 1 ? 'them' : 'it');
    }
    // منطقة لون (أو مجموعة) لا يشاركها لونَها أي جزء آخر: «كل هذا اللون أينما كان»
    if (g.exclusive && !keeps.some((k) => k.hex && c.fromHex && sameCloth(k.hex, c.fromHex))) {
      return (i + 1) + '. All the ' + now(c.fromHex, c.fromName) + ' fabric of the garment (' + parts + ')' + small + ': make all of it ' + target(c) + '.';
    }
    return (i + 1) + '. The ' + parts + ', now ' + now(c.fromHex, c.fromName) + small + ': make ' + (g.items.length > 1 ? 'all of them ' : 'it ') + target(c) + '.';
  });

  // الأجزاء الباقية تُذكر فقط إذا كانت بنفس لون جزء يتغيّر — هناك يلزم التمييز
  const stays = keeps
    .filter((k) => k.parts && k.hex && changes.some((c) => c.fromHex && sameCloth(c.fromHex, k.hex)))
    .map((k) => 'The ' + k.parts + ' stay ' + (colourWord(k.hex) || 'as they are') + '.');

  const refNote = (refParts && refParts.length)
    ? '\n\nImage 1 is the photo to edit and return. ' +
      refParts.map((pt, i) => 'Image ' + (i + 2) + ' is an enlarged close-up of the ' + pt + ' from image 1, so you can see it clearly').join('. ') +
      '. Return image 1 only.'
    : '';

  const opening = closeup
    ? 'Recolour the part in this close-up, cut from a garment photo. Return the same close-up at exactly the same framing.'
    : 'Recolour the garment in this photo' + (subject ? ' — ' + subject : '') + '.';

  return `${opening}

${lines.join('\n')}

Recolour every listed colour completely, edge to edge — including sheer layers, the parts seen between other layers, folds, petal tips and hems. Where the garment shades from one listed colour into another, keep the same smooth shading between their new colours. ${stays.length ? stays.join(' ') + ' ' : ''}Parts not listed keep their colour. Keep the design, folds, shading, sheen and fabric texture, the model, pose and background exactly as they are.${refNote}`;
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
async function runOne(token, imageUrl, prompt, w, h, signal, deadline, refs) {
  const images = [imageUrl].concat(refs || []);
  // الأول بنفس شكل الاستدعاء الشغّال في «الفلات سكتش»، والثاني أضيق منه
  const attempts = [
    { prompt, image_input: images, aspect_ratio: nearestRatio(w, h), output_format: 'jpg' },
    { prompt, image_input: images },
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

  // تحقق الحساب + خصم من كمية الأداة (api/_guard.js)
  const g = await guard(req, res, 'color');
  if (!g) return;

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
  // حتى قصّتين مرجع للأجزاء الصغيرة، بنفس الطلب — بلا استدعاء زيادة
  const refFiles = [files.ref0, files.ref1].map(pickFile).filter(Boolean);
  let refParts = [];
  try { refParts = JSON.parse(getField(fields.refParts) || '[]'); } catch (e) { refParts = []; }
  refParts = (Array.isArray(refParts) ? refParts : []).map(str).slice(0, refFiles.length);
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
  const closeup = getField(fields.detail) === '1';
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
    const refs = [];
    for (const f of refFiles) {
      const rb = fs.readFileSync(f.filepath);
      const u = await uploadToReplicate(rb, detectImageType(rb), token, ctrl.signal);
      if (u) refs.push(u);
    }
    const parts = refs.length ? refParts.slice(0, refs.length) : [];
    const one = await runOne(token, source, buildPrompt(changes, keeps, subject, closeup, parts), w, h, ctrl.signal, deadline, refs);
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
