// api/fabricswap.js
// الرسم لقسم «تبديل القماش»: استدعاء واحد لنموذج الرسم مهما كان عدد المناطق.
//
// الصور المرسلة للنموذج:
//   image 1       ← صورة المنتج الأصلية (هي اللي بترجع معدّلة)
//   image 2, 3 …  ← عيّنة لكل قماش مختار: من المكتبة أو اللي رفعته المصممة
// القماش المكتوب بس (من الاقتراحات) بيتبدّل وبيحافظ على لونه الحالي.
//
// البرومبت قصير وبصيغة أمر: سطر لكل منطقة، وجملة وحدة لكل شي بيضل متل ما هو.
// نفس شكل استدعاء Replicate الشغّال بـ recolor.js.

import formidable from 'formidable';
import { put } from '@vercel/blob';
import fs from 'fs';
import { fabricById, ensureSwatch } from './_fabrics';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

// سطر واحد لتغيير النموذج. ‎$0.03 للصورة على نفس الحساب (مُثبت بتغيير الألوان).
const MODEL = 'google/nano-banana-2-lite';

const WAIT_SECONDS = 60;
const POLL_MS = 2000;
const TOTAL_TIMEOUT_MS = 270000;
const MAX_CHANGES = 5;

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
    if (typeof console !== 'undefined') console.warn('[gh] fabricswap upload', r.status, detail);
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
    const key = 'fabricswap/' + Date.now() + '-' + Math.random().toString(36).slice(2, 9) + '.' + ext;
    const out = await put(key, Buffer.from(await r.arrayBuffer()), {
      access: 'public', contentType: ct, addRandomSuffix: false,
    });
    return (out && out.url) || url;
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] fabricswap persist', e && e.message);
    return url;
  }
}

// ---------------------------------------------------------------------------
// changes: [{ parts, name, current, fabric: { kind: 'lib'|'up'|'text', name, desc, pattern, img } }]
// img = رقم الصورة المرجعية بالطلب (2، 3…) أو 0 إذا ما في صورة.
export function buildPrompt(changes, keeps, subject) {
  const lines = changes.map((c, i) => {
    const where = 'The ' + (c.parts || c.name) + (c.name && c.parts ? ' (' + c.name + ')' : '') +
      (c.current ? ', now ' + c.current : '');
    const f = c.fabric;
    let what;
    if (f.img) {
      const label = f.kind === 'up' ? '' : ' — ' + f.name + (f.desc ? ', ' + f.desc : '');
      what = 'remake in the fabric shown in image ' + f.img + label +
        '. Match its colour, ' + (f.pattern ? 'pattern, ' : '') + 'weave and surface exactly' +
        (f.pattern ? ', with the pattern at a realistic scale for the garment' : '') + '.';
    } else if (f.kind === 'text') {
      what = 'remake in ' + f.name + ', keeping its current colour.';
    } else {
      what = 'remake in ' + f.name + (f.desc ? ', ' + f.desc : '') + '.';
    }
    return (i + 1) + '. ' + where + ': ' + what;
  });

  const stays = keeps.filter((k) => k.parts).map((k) => k.parts);
  const refs = changes.filter((c) => c.fabric.img).length;

  return `Change the fabric of the garment in image 1${subject ? ' — ' + subject : ''}.

${lines.join('\n')}

Render each new fabric with its real texture, weight, sheen and drape, following the garment's seams, folds and silhouette. ${stays.length ? 'The ' + stays.join('; the ') + ' keep their current fabric. ' : ''}Keep the model, face, pose, cut, lighting and background exactly as they are.${refs ? ' The other images are fabric swatches only. Return image 1 edited.' : ''}`;
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
    if (typeof console !== 'undefined') console.warn('[gh] fabricswap status', r.status, detail);
    if (r.status === 402) return { status: 402, error: 'رصيد Replicate خلص' };
    if (r.status !== 400 && r.status !== 422) break;
  }
  if (!prediction) return { status: 502, error: 'تعذّر إنشاء النتيجة (' + (lastStatus || 502) + ')' };

  const done = await settle(token, prediction, signal, deadline);
  if (done.timeout) return { status: 504, error: 'انتهت مهلة الرسم' };
  if (done.failed) {
    if (typeof console !== 'undefined') console.warn('[gh] fabricswap poll', done.failed);
    return { status: 502, error: 'تعذّر إنشاء النتيجة' };
  }
  const p = done.prediction;
  if (!p || p.status !== 'succeeded') {
    if (typeof console !== 'undefined') console.warn('[gh] fabricswap end', p && p.status, p && p.error);
    return { status: 502, error: 'تعذّر إنشاء النتيجة' };
  }
  const out = Array.isArray(p.output) ? p.output[0] : p.output;
  if (!out || typeof out !== 'string') return { status: 502, error: 'النموذج ما رجّع صورة' };
  return { url: out };
}

// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return res.status(500).json({ error: 'مفتاح Replicate غير مضبوط على الخادم' });

  let files;
  let fields;
  try {
    const form = formidable({ maxFileSize: 12 * 1024 * 1024, maxTotalFileSize: 24 * 1024 * 1024 });
    [fields, files] = await form.parse(req);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] fabricswap form', e && e.message);
    return res.status(400).json({ error: 'تعذّر استلام الصور' });
  }

  const image = pickFile(files.image);
  if (!image) return res.status(400).json({ error: 'الصورة مطلوبة' });

  const parseList = (raw) => {
    try { const v = JSON.parse(raw || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  };

  // التحقق من كل تغيير قبل أي استدعاء مدفوع
  const changes = [];
  for (const c of parseList(getField(fields.changes)).slice(0, MAX_CHANGES)) {
    const f = (c && c.fabric) || {};
    const base = { parts: clean(c && c.parts, 200), name: clean(c && c.name, 50), current: clean(c && c.current, 160) };
    if (f.kind === 'lib') {
      const lib = fabricById(str(f.id));
      if (lib) changes.push({ ...base, fabric: { kind: 'lib', lib, name: lib.name, desc: lib.desc, pattern: Boolean(lib.pattern) } });
    } else if (f.kind === 'up') {
      const file = pickFile(files[str(f.file)]);
      if (file && /^up\d$/.test(str(f.file))) changes.push({ ...base, fabric: { kind: 'up', file, name: 'custom fabric' } });
    } else if (f.kind === 'text') {
      const name = clean(f.name, 40);
      if (name) changes.push({ ...base, fabric: { kind: 'text', name } });
    }
  }
  if (!changes.length) return res.status(400).json({ error: 'اختاري قماش لمنطقة وحدة عالأقل' });

  const keeps = parseList(getField(fields.keeps)).slice(0, 6)
    .map((k) => ({ parts: clean(k && k.parts, 200) })).filter((k) => k.parts);
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

    // العيّنات: مكتبة ← رابط Blob (أو رفع البايتات إذا ما في Blob)، مرفوعة ← رفع
    const images = [source];
    for (const c of changes) {
      const f = c.fabric;
      let url = null;
      if (f.kind === 'lib') {
        const sw = await ensureSwatch(f.lib, 'ref');
        if (sw && sw.url) url = sw.url;
        else if (sw && sw.bytes) url = await uploadToReplicate(sw.bytes, 'image/jpeg', token, ctrl.signal);
      } else if (f.kind === 'up') {
        const b = fs.readFileSync(f.file.filepath);
        url = await uploadToReplicate(b, detectImageType(b), token, ctrl.signal);
        if (!url) {
          clearTimeout(timer);
          return res.status(502).json({ error: 'تعذّر رفع صورة القماش لخدمة الرسم' });
        }
      }
      if (url) {
        images.push(url);
        f.img = images.length;       // رقم الصورة بالطلب: 2، 3…
      } else {
        f.img = 0;                   // مكتبة بلا صورة: بالاسم والوصف
      }
    }

    const prompt = buildPrompt(changes, keeps, subject);
    const one = await runOne(token, images, prompt, w, h, ctrl.signal, deadline);
    clearTimeout(timer);
    if (!one.url) return res.status(one.status || 502).json({ error: one.error });

    return res.status(200).json({ url: await persist(one.url) });
  } catch (e) {
    clearTimeout(timer);
    const aborted = e && e.name === 'AbortError';
    if (typeof console !== 'undefined') console.warn('[gh] fabricswap call', e && e.message);
    return res.status(504).json({ error: aborted ? 'انتهت مهلة الرسم' : 'تعذّر الاتصال بخدمة الرسم' });
  }
}
