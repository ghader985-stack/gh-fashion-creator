// api/variation.js
// الرسم لقسم «تنويعات التصميم»: استدعاء واحد لنموذج الرسم.
//
// الصور المرسلة للنموذج:
//   image 1  ← الصورة الأمامية (هي اللي بترجع معدّلة)
//   image 2  ← الزاوية التانية (خلف أو جنب) — اختيارية، للمرجع بس
//
// التعديلات: خيار واحد من كل فئة (Silhouette → Ball Gown …) مع تعليمات
// المصممة الحرّة. البرومبت قصير وبصيغة أمر: سطر لكل تعديل، وجملة لما يبقى.
// نفس شكل استدعاء Replicate الشغّال بـ fabricswap.js.

import formidable from 'formidable';
import { put } from '@vercel/blob';
import fs from 'fs';

import { guard } from './_guard';
export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

// سطر واحد لتغيير النموذج. ‎$0.03 للصورة على نفس الحساب.
const MODEL = 'google/nano-banana-2-lite';

const WAIT_SECONDS = 60;
const POLL_MS = 2000;
const TOTAL_TIMEOUT_MS = 270000;

const RATIOS = [
  ['1:1', 1], ['2:3', 2 / 3], ['3:2', 3 / 2], ['3:4', 3 / 4], ['4:3', 4 / 3],
  ['4:5', 4 / 5], ['5:4', 5 / 4], ['9:16', 9 / 16], ['16:9', 16 / 9],
];

const pickFile = (f) => (Array.isArray(f) ? f[0] : f) || null;
const getField = (f) => String((Array.isArray(f) ? f[0] : f) || '').trim();
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const clean = (v, n) => str(v).replace(/[\r\n]+/g, ' ').slice(0, n);

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

async function uploadToReplicate(buffer, mediaType, token, signal) {
  const ext = ({ 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg' })[mediaType] || 'jpg';
  const boundary = '----gh' + Math.random().toString(36).slice(2);
  const headPart = Buffer.from(
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="content"; filename="source.' + ext + '"\r\n' +
    'Content-Type: ' + mediaType + '\r\n\r\n', 'utf8');
  const tail = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf8');

  const r = await fetch('https://api.replicate.com/v1/files', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    signal,
    body: Buffer.concat([headPart, buffer, tail]),
  });
  if (!r.ok) {
    let detail = '';
    try { detail = (await r.text()).slice(0, 200); } catch (e) { detail = ''; }
    if (typeof console !== 'undefined') console.warn('[gh] variation upload', r.status, detail);
    return null;
  }
  const data = await r.json();
  return (data.urls && (data.urls.download || data.urls.get)) || null;
}

async function persist(url) {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !/^https?:\/\//i.test(url)) return url;
  try {
    const r = await fetch(url);
    if (!r.ok) return url;
    const ct = (r.headers.get('content-type') || '').split(';')[0];
    if (!ct.startsWith('image/')) return url;
    const ext = ({ 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg' })[ct] || 'png';
    const key = 'variation/' + Date.now() + '-' + Math.random().toString(36).slice(2, 9) + '.' + ext;
    const out = await put(key, Buffer.from(await r.arrayBuffer()), {
      access: 'public', contentType: ct, addRandomSuffix: false,
    });
    return (out && out.url) || url;
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] variation persist', e && e.message);
    return url;
  }
}

// ---------------------------------------------------------------------------
// اسم عائلة اللون من الهيكس («yellow-green»، «dark purple») — نفس دالة recolor.js.
// ---------------------------------------------------------------------------
// changes: [{ name: 'Silhouette', from: 'fit-and-flare', to: 'Ball Gown' }]
export function buildPrompt(changes, notes, subject, hasSecond) {
  const lines = changes.map((c, i) => (i + 1) + '. ' + c.name + ': ' +
    (c.from ? 'change from ' + c.from + ' to ' : 'make it ') + c.to + '.');
  if (notes) lines.push((lines.length + 1) + '. ' + notes);

  return `Redesign the garment in image 1${subject ? ' — ' + subject : ''} with these changes:

${lines.join('\n')}

Everything not changed above stays the same — fabric, colour, texture, embellishment and design details — adapted naturally to the new design. Keep the model, face, pose, lighting and background exactly as they are. Show the full garment.${hasSecond ? ' Image 2 shows the same garment from another angle, for reference only. Return image 1 edited.' : ''}`;
}

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

async function runOne(token, images, prompt, w, h, signal, deadline) {
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
    if (typeof console !== 'undefined') console.warn('[gh] variation status', r.status, detail);
    if (r.status === 402) return { status: 402, error: 'رصيد Replicate خلص' };
    if (r.status !== 400 && r.status !== 422) break;
  }
  if (!prediction) return { status: 502, error: 'تعذّر إنشاء النتيجة (' + (lastStatus || 502) + ')' };

  const done = await settle(token, prediction, signal, deadline);
  if (done.timeout) return { status: 504, error: 'انتهت مهلة الرسم' };
  if (done.failed) {
    if (typeof console !== 'undefined') console.warn('[gh] variation poll', done.failed);
    return { status: 502, error: 'تعذّر إنشاء النتيجة' };
  }
  const p = done.prediction;
  if (!p || p.status !== 'succeeded') {
    if (typeof console !== 'undefined') console.warn('[gh] variation end', p && p.status, p && p.error);
    return { status: 502, error: 'تعذّر إنشاء النتيجة' };
  }
  const out = Array.isArray(p.output) ? p.output[0] : p.output;
  if (!out || typeof out !== 'string') return { status: 502, error: 'النموذج ما رجّع صورة' };
  return { url: out };
}

// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // تحقق الحساب + خصم من كمية الأداة (api/_guard.js)
  const g = await guard(req, res, 'variation');
  if (!g) return;

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return res.status(500).json({ error: 'مفتاح Replicate غير مضبوط على الخادم' });

  let files;
  let fields;
  try {
    const form = formidable({ maxFileSize: 12 * 1024 * 1024, maxTotalFileSize: 24 * 1024 * 1024 });
    [fields, files] = await form.parse(req);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] variation form', e && e.message);
    return res.status(400).json({ error: 'تعذّر استلام الصور' });
  }

  const image = pickFile(files.image);
  if (!image) return res.status(400).json({ error: 'الصورة الأمامية مطلوبة' });
  const second = pickFile(files.second);

  // التحقق قبل أي استدعاء مدفوع
  let list = [];
  try { list = JSON.parse(getField(fields.changes) || '[]'); } catch (e) { list = []; }
  const changes = (Array.isArray(list) ? list : []).slice(0, 6).map((c) => ({
    name: clean(c && c.name, 30),
    from: clean(c && c.from, 40),
    to: clean(c && c.to, 40),
  })).filter((c) => c.name && c.to);
  const notes = clean(getField(fields.notes), 400);
  if (!changes.length && !notes) return res.status(400).json({ error: 'اختاري تعديل واحد عالأقل أو اكتبي تعليماتك' });

  const subject = clean(getField(fields.subject), 200).replace(/[.\s]+$/, '');
  const w = Number(getField(fields.w)) || 0;
  const h = Number(getField(fields.h)) || 0;

  const ctrl = new AbortController();
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;
  const timer = setTimeout(() => ctrl.abort(), TOTAL_TIMEOUT_MS + 5000);

  try {
    const buf = fs.readFileSync(image.filepath);
    const source = await uploadToReplicate(buf, detectImageType(buf), token, ctrl.signal);
    if (!source) {
      clearTimeout(timer);
      return res.status(502).json({ error: 'تعذّر رفع الصورة لخدمة الرسم' });
    }
    const images = [source];
    if (second) {
      const b2 = fs.readFileSync(second.filepath);
      const u2 = await uploadToReplicate(b2, detectImageType(b2), token, ctrl.signal);
      if (u2) images.push(u2);
    }

    const prompt = buildPrompt(changes, notes, subject, images.length > 1);
    const one = await runOne(token, images, prompt, w, h, ctrl.signal, deadline);
    clearTimeout(timer);
    if (!one.url) return res.status(one.status || 502).json({ error: one.error });

    return res.status(200).json({ url: await persist(one.url) });
  } catch (e) {
    clearTimeout(timer);
    const aborted = e && e.name === 'AbortError';
    if (typeof console !== 'undefined') console.warn('[gh] variation call', e && e.message);
    return res.status(504).json({ error: aborted ? 'انتهت مهلة الرسم' : 'تعذّر الاتصال بخدمة الرسم' });
  }
}
