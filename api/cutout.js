// pages/api/cutout.js
// عزل القطعة عن الخلفية لقسم «تغيير الألوان».
//
// استدعاء واحد لكل صورة: يرجع قناع القطعة (صورة بخلفية شفافة)، والمتصفح
// يقرأ منه حدود القطعة ويحصر التلوين داخلها. الخلفية والأثاث وكل ما حولها
// لا يُلمس إطلاقاً.
//
// النموذج يُبدّل من سطر واحد إن احتجنا أدق أو أرخص.

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 120,
};

// النموذج الأساسي وأدقّهم على الحواف، والاحتياطي أرخص ويشتغل إن تعذّر الأول
const MODELS = ['bria/remove-background', '851-labs/background-remover'];
const CALL_TIMEOUT_MS = 90000;

const pickFile = (f) => (Array.isArray(f) ? f[0] : f) || null;

function detectImageType(buffer) {
  if (!buffer || buffer.length < 4) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer.length > 12 && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return 'image/jpeg';
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
  try {
    const form = formidable({ maxFileSize: 8 * 1024 * 1024, maxTotalFileSize: 10 * 1024 * 1024 });
    [, files] = await form.parse(req);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] cutout form', e && e.message);
    return res.status(400).json({ error: 'تعذّر استلام الصورة' });
  }

  const image = pickFile(files.image);
  if (!image) return res.status(400).json({ error: 'الصورة مطلوبة' });

  const buf = fs.readFileSync(image.filepath);
  const dataUri = 'data:' + detectImageType(buf) + ';base64,' + buf.toString('base64');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CALL_TIMEOUT_MS);
  let lastStatus = 0;

  try {
    for (const model of MODELS) {
      const r = await fetch('https://api.replicate.com/v1/models/' + model + '/predictions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        signal: ctrl.signal,
        body: JSON.stringify({ input: { image: dataUri } }),
      });

      if (!r.ok) {
        lastStatus = r.status;
        let detail = '';
        try { detail = (await r.text()).slice(0, 300); } catch (e) { detail = ''; }
        if (typeof console !== 'undefined') console.warn('[gh] cutout status', model, r.status, detail);
        continue;
      }

      const data = await r.json();
      const out = Array.isArray(data.output) ? data.output[0] : data.output;
      if (!out || typeof out !== 'string') {
        lastStatus = 502;
        if (typeof console !== 'undefined') console.warn('[gh] cutout output', model, data && data.status, data && data.error);
        continue;
      }
      clearTimeout(timer);
      return res.status(200).json({ url: out, model });
    }
    clearTimeout(timer);
    return res.status(502).json({ error: 'تعذّر عزل القطعة (' + (lastStatus || 502) + ')' });
  } catch (e) {
    clearTimeout(timer);
    const aborted = e && e.name === 'AbortError';
    if (typeof console !== 'undefined') console.warn('[gh] cutout call', e && e.message);
    return res.status(504).json({ error: aborted ? 'انتهت مهلة العزل' : 'تعذّر الاتصال بخدمة العزل' });
  }
}
