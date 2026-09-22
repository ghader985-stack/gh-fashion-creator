// pages/api/recolor.js
// إعادة رسم القطعة بالألوان الجديدة لقسم «تغيير الألوان».
//
// المتصفح يرسل صورتين: الصورة الأصلية، ودليل ألوان (نفس الصورة والمناطق
// المطلوب تغييرها مدهونة بلون مسطّح). النموذج يعيد رسم الصورة كما هي
// ويصبغ المناطق المدهونة فقط، فيبقى الخرز والتطريز والظلّ والملمس مكانه.
//
// استدعاء واحد لكل نتيجة. المتصفح هو الذي يكرّر الاستدعاء بعدد النتائج.

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

// النموذج: سطر واحد. الأرخص هو الافتراضي، وفوقه درجتان إن احتجنا جودة أعلى.
//   google/nano-banana-2-lite   ~$0.034 للصورة   ← الافتراضي، الأرخص والأسرع
//   google/nano-banana-2        ~$0.101 بدقة 2K
//   google/nano-banana-pro      ~$0.134 بدقة 2K
const MODEL = 'google/nano-banana-2-lite';

// دقّة الخرج: تُترك فارغة مع lite لأنه لا يأخذ هذا الحقل.
// مع nano-banana-2 أو pro ضعي '1K' أو '2K'.
const RESOLUTION = '';
const WAIT_SECONDS = 60;
const POLL_MS = 2000;
const TOTAL_TIMEOUT_MS = 240000;

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

const toDataUri = (filepath) => {
  const buf = fs.readFileSync(filepath);
  return 'data:' + detectImageType(buf) + ';base64,' + buf.toString('base64');
};

// وصف كل تغيير بلونه القديم والجديد. الدليل هو الذي يحدّد المكان بدقّة،
// فالنصّ هنا للتأكيد على اللون المطلوب لا على الموقع.
function buildPrompt(changes) {
  const list = changes.map((c, i) => {
    const from = [c.fromName, c.fromHex].filter(Boolean).join(' ');
    const to = [c.toName, c.toCode ? 'PANTONE ' + c.toCode : '', c.toHex].filter(Boolean).join(' ');
    const what = c.where ? c.where + (c.material ? ' (' + c.material + ')' : '') : 'the area painted with this colour in image 2';
    return '  ' + (i + 1) + '. ' + what + ': ' + (from || 'its current colour') + ' becomes ' + to + '.';
  }).join('\n');

  return `Image 1 is the original photograph. Image 2 is a colour guide: the same photograph with some areas painted over in flat solid colour.

Reproduce image 1 exactly — the same garment, the same person and pose, the same camera angle and crop, the same lighting, the same background, the same fabric, weave, embroidery, beading, sequins, lace, stitching, seams, folds, drape and shadows.

Change one single thing: every area that image 2 paints in flat colour must come out in that colour.

Rules:
- Image 2 only tells you WHERE the change goes and WHICH colour to use. Never copy its flatness.
- The recoloured fabric keeps all of its own texture, weave, sheen, highlights, shadows, folds and every bead, sequin, crystal, embroidery stitch and thread, rendered in the new colour the way a real dye behaves on that material. Metallic and beaded areas stay metallic and beaded.
- Everything image 2 leaves untouched stays identical to image 1 — skin, face, hair, hands, background, and every part of the garment that is not painted over. Do not lighten, sharpen, restyle or retouch them.
- Do not move, resize, redesign, add or remove any detail. Do not change the pose, the crop or the background.
- Keep the edges between a recoloured area and its neighbours exactly where they are in image 1.

Target colours:
${list}

Return the finished photograph only.`;
}

async function callModel(token, body, signal) {
  return fetch('https://api.replicate.com/v1/models/' + MODEL + '/predictions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      Prefer: 'wait=' + WAIT_SECONDS,
    },
    signal,
    body: JSON.stringify(body),
  });
}

// Prefer: wait يرجّع بعد 60 ثانية حتى لو ما خلص، فنكمل بالاستعلام
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
    const form = formidable({ maxFileSize: 12 * 1024 * 1024, maxTotalFileSize: 26 * 1024 * 1024 });
    [fields, files] = await form.parse(req);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] recolor form', e && e.message);
    return res.status(400).json({ error: 'تعذّر استلام الصور' });
  }

  const image = pickFile(files.image);
  const guide = pickFile(files.guide);
  if (!image || !guide) return res.status(400).json({ error: 'الصورة ودليل الألوان مطلوبان' });

  let changes;
  try {
    changes = JSON.parse(getField(fields.changes) || '[]');
  } catch (e) {
    changes = [];
  }
  changes = (Array.isArray(changes) ? changes : []).slice(0, 8).map((c) => ({
    where: str(c && c.where),
    material: str(c && c.material),
    fromHex: str(c && c.fromHex),
    fromName: str(c && c.fromName),
    toHex: str(c && c.toHex),
    toName: str(c && c.toName),
    toCode: str(c && c.toCode),
  }));
  if (!changes.length) return res.status(400).json({ error: 'ما في تغيير ألوان مطلوب' });

  // الأساس: ما يقبله كل نموذج من العائلة. الزيادات اختيارية وتُسقَط عند الرفض.
  const base = {
    prompt: buildPrompt(changes),
    image_input: [toDataUri(image.filepath), toDataUri(guide.filepath)],
    output_format: 'png',
  };
  const extras = { aspect_ratio: 'match_input_image' };
  if (RESOLUTION) extras.resolution = RESOLUTION;

  const ctrl = new AbortController();
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;
  const timer = setTimeout(() => ctrl.abort(), TOTAL_TIMEOUT_MS + 5000);

  try {
    // الحقول الاختيارية تختلف بين نماذج العائلة، فإن رفضها النموذج نعيد بالأساس
    let withExtras = true;
    let prediction = null;

    for (let attempt = 0; attempt < 2 && !prediction; attempt++) {
      const body = { input: withExtras ? { ...base, ...extras } : base };
      const r = await callModel(token, body, ctrl.signal);

      if (!r.ok) {
        let detail = '';
        try { detail = (await r.text()).slice(0, 300); } catch (e) { detail = ''; }
        if (withExtras && (r.status === 400 || r.status === 422)) {
          if (typeof console !== 'undefined') console.warn('[gh] recolor extras rejected, retrying with base input');
          withExtras = false;
          continue;
        }
        if (typeof console !== 'undefined') console.warn('[gh] recolor status', r.status, detail);
        clearTimeout(timer);
        if (r.status === 402) return res.status(402).json({ error: 'رصيد Replicate خلص' });
        return res.status(502).json({ error: 'تعذّر إنشاء النتيجة (' + r.status + ')' });
      }
      prediction = await r.json();
    }

    if (!prediction) {
      clearTimeout(timer);
      return res.status(502).json({ error: 'تعذّر إنشاء النتيجة' });
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

    return res.status(200).json({ url: out });
  } catch (e) {
    clearTimeout(timer);
    const aborted = e && e.name === 'AbortError';
    if (typeof console !== 'undefined') console.warn('[gh] recolor call', e && e.message);
    return res.status(504).json({ error: aborted ? 'انتهت مهلة الرسم' : 'تعذّر الاتصال بخدمة الرسم' });
  }
}
