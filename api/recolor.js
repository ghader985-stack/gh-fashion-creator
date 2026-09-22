// api/recolor.js
// إعادة رسم الصورة بالألوان الجديدة لقسم «تغيير الألوان».
//
// مُدخل واحد: الصورة الأصلية كما هي. ولا دليل ألوان ولا قناع ولا صورة
// ثانية — التجربة السابقة بيّنت أن الدليل المدهون هو نفسه سبب النتيجة
// المسطّحة، لأن النموذج يقلّد ما يراه.
//
// البديل: وصف دقيق بالنصّ. المناطق تُسمّى بأسماء أجزاء القطعة الحقيقية
// (جاية من /api/colorzones)، واللون الجديد يُعطى بالاسم والبانتون والهيكس،
// ويُكتب صراحة ما الذي يجب ألّا يتغيّر.
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
//   google/nano-banana-pro   ← الافتراضي، وهو المستعمل أصلاً في الفلات سكتش
// أي بديل أرخص يُبدَّل من هنا بعد التأكد من اسمه على Replicate.
const MODEL = 'google/nano-banana-pro';

const WAIT_SECONDS = 60;
const POLL_MS = 2000;
const TOTAL_TIMEOUT_MS = 270000;
const MAX_CHANGES = 8;

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
// البرومبت. ثلاث كتل: شو بيتغيّر، شو ممنوع يتغيّر، وكيف ينحطّ اللون.
function buildPrompt(changes, keeps, subject) {
  const change = changes.map((c, i) => {
    const where = c.parts ? ' — ' + c.parts + ' — ' : ' ';
    const what = [c.fromName ? 'The ' + c.fromName.toLowerCase() : 'The', c.material || 'fabric'].join(' ');
    const to = [
      c.toName || '',
      c.toCode ? '(PANTONE ' + c.toCode + ')' : '',
      c.toHex,
    ].filter(Boolean).join(' ');
    return (i + 1) + '. ' + what + where + 'becomes ' + to + '. Apply it to every part of that fabric wherever it appears in the photograph, including the parts deep in a fold and the parts in bright highlight.';
  }).join('\n');

  const keep = keeps.length
    ? keeps.map((k) => '- ' + (k.name ? k.name + ' ' : '') + (k.material || 'area') + (k.parts ? ' (' + k.parts + ')' : '') + ': keeps its original colour exactly.').join('\n') + '\n'
    : '';

  return `This is a real product photograph${subject ? ' — ' + subject : ''}. Recolour only the fabrics listed below and return the same photograph, unchanged in every other respect.

RECOLOUR:
${change}

DO NOT CHANGE:
${keep}- The model's face, skin, hair, hands, nails and jewellery.
- The background, the wall, the floor and the light falling on them.
- The pose, the framing, the crop, the camera angle, the focus, the depth of field and the grain of the photograph.
- The cut of the garment: no seam, ruffle, pleat, fold, dart, strap or edge moves, and nothing is added or removed.

HOW TO APPLY THE COLOUR:
Replace the hue only. Inside each recoloured fabric every light and dark passage stays exactly where it is: the highlights, the shading inside the folds, the sheen of the material, the weave, the seams and topstitching, and any beading, sequins, crystals, lace or embroidery. A fold that was dark stays dark, in the new colour. A beaded panel stays beaded, in the new colour. The result must read as the same cloth dyed differently and photographed under the same light, never as flat paint laid over the picture.

In the areas that are lit normally, the fabric must match the given hex value.

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

  const changes = parseList(getField(fields.changes)).slice(0, MAX_CHANGES).map((c) => ({
    parts: str(c && c.parts),
    material: str(c && c.material),
    fromName: str(c && c.fromName),
    toHex: str(c && c.toHex),
    toName: str(c && c.toName),
    toCode: str(c && c.toCode),
  })).filter((c) => /^#[0-9a-fA-F]{6}$/.test(c.toHex));

  if (!changes.length) return res.status(400).json({ error: 'ما في تغيير ألوان مطلوب' });

  const keeps = parseList(getField(fields.keeps)).slice(0, 8).map((k) => ({
    name: str(k && k.name),
    parts: str(k && k.parts),
    material: str(k && k.material),
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

    const prompt = buildPrompt(changes, keeps, subject);

    // الشكل الأول هو المطلوب، والثاني هو الشكل المُثبت بالإنتاج.
    // الطلب المرفوض قبل إنشاء الـprediction لا يُحاسَب عليه رصيد.
    // أول محاولة تطلب نفس نسبة الصورة، والثانية تستعمل أقرب نسبة قياسية
    // وهي الشكل المُستعمل أصلاً في «الفلات سكتش» على النشرة.
    const attempts = [
      { prompt, image_input: [source], aspect_ratio: 'match_input_image', output_format: 'jpg' },
      { prompt, image_input: [source], aspect_ratio: nearestRatio(w, h), output_format: 'jpg' },
    ];

    let prediction = null;
    let lastStatus = 0;
    let lastDetail = '';

    for (const input of attempts) {
      const r = await fetch('https://api.replicate.com/v1/models/' + MODEL + '/predictions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
          Prefer: 'wait=' + WAIT_SECONDS,
        },
        signal: ctrl.signal,
        body: JSON.stringify({ input }),
      });

      if (r.ok) { prediction = await r.json(); break; }

      lastStatus = r.status;
      try { lastDetail = (await r.text()).slice(0, 300); } catch (e) { lastDetail = ''; }
      if (typeof console !== 'undefined') console.warn('[gh] recolor status', r.status, lastDetail);
      if (r.status === 402) {
        clearTimeout(timer);
        return res.status(402).json({ error: 'رصيد Replicate خلص' });
      }
      if (r.status !== 400 && r.status !== 422) break;
    }

    if (!prediction) {
      clearTimeout(timer);
      return res.status(502).json({ error: 'تعذّر إنشاء النتيجة (' + (lastStatus || 502) + ')' });
    }

    const done = await settle(token, prediction, ctrl.signal, deadline);
    clearTimeout(timer);

    if (done.timeout) return res.status(504).json({ error: 'انتهت مهلة الرسم' });
    if (done.failed) {
      if (typeof console !== 'undefined') console.warn('[gh] recolor poll', done.failed);
      return res.status(502).json({ error: 'تعذّر إنشاء النتيجة' });
    }

    const p = done.prediction;
    if (!p || p.status !== 'succeeded') {
      if (typeof console !== 'undefined') console.warn('[gh] recolor end', p && p.status, p && p.error);
      return res.status(502).json({ error: 'تعذّر إنشاء النتيجة' });
    }

    const out = Array.isArray(p.output) ? p.output[0] : p.output;
    if (!out || typeof out !== 'string') {
      if (typeof console !== 'undefined') console.warn('[gh] recolor output', typeof out);
      return res.status(502).json({ error: 'النموذج ما رجّع صورة' });
    }

    return res.status(200).json({ url: await persist(out) });
  } catch (e) {
    clearTimeout(timer);
    const aborted = e && e.name === 'AbortError';
    if (typeof console !== 'undefined') console.warn('[gh] recolor call', e && e.message);
    return res.status(504).json({ error: aborted ? 'انتهت مهلة الرسم' : 'تعذّر الاتصال بخدمة الرسم' });
  }
}
