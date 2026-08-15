// api/techpack-images.js
// الطور 2: توليد صور التيك باك.
//
// درس التجربة السابقة (من لوغز Vercel): إطلاق 19 توليد بالتوازي اصطدم بسقف
// التزامن عند Replicate — أول ~10 نجحوا والباقي انرفضوا فوراً (استدعاءات 20ms).
// الحل: مجمّع تنفيذ (pool) بحد 4 مهام متزامنة، فلا يُرفض أي طلب.
//
// وقرار ثانٍ: لا نطلب من نماذج الصور رسم نصوص/أرقام (تطلع مشوّهة) —
// نولّد رسمة تقنية نظيفة واحدة، والواجهة ترسم فوقها خطوط القياس والأرقام
// والتسميات ككود (نص حاد 100%). هذا يقلّص Kontext من 5 إلى 3 استدعاءات.
//
// المخرجات: { coloredFrontImage, coloredBackImage, materialPhotos: [...] }

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

const FLUX_MODEL = 'black-forest-labs/flux-1.1-pro';
const REPLICATE_FLUX_URL = 'https://api.replicate.com/v1/models/' + FLUX_MODEL + '/predictions';

const KONTEXT_MODEL = 'black-forest-labs/flux-kontext-pro';
const REPLICATE_KONTEXT_URL = 'https://api.replicate.com/v1/models/' + KONTEXT_MODEL + '/predictions';

const CONCURRENCY = 4;      // تحت سقف التزامن عند Replicate
const DEADLINE_MS = 240000; // نتوقف عن بدء محاولات جديدة قبل انتهاء مهلة الدالة

// ============================================================================
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return 'image/jpeg';
  if (buffer[0]===0xff && buffer[1]===0xd8 && buffer[2]===0xff) return 'image/jpeg';
  if (buffer[0]===0x89 && buffer[1]===0x50 && buffer[2]===0x4e && buffer[3]===0x47) return 'image/png';
  if (buffer[0]===0x47 && buffer[1]===0x49 && buffer[2]===0x46) return 'image/gif';
  if (buffer[0]===0x52 && buffer[1]===0x49 && buffer[2]===0x46 && buffer[3]===0x46 &&
      buffer[8]===0x57 && buffer[9]===0x45 && buffer[10]===0x42 && buffer[11]===0x50) return 'image/webp';
  return 'image/jpeg';
}

async function uploadToReplicate(buffer, mediaType, token) {
  const ext = (mediaType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const boundary = '----ghBoundary' + Date.now();
  const pre = Buffer.from(
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="content"; filename="design.' + ext + '"\r\n' +
    'Content-Type: ' + mediaType + '\r\n\r\n'
  );
  const post = Buffer.from('\r\n--' + boundary + '--\r\n');
  const body = Buffer.concat([pre, buffer, post]);
  const res = await fetch('https://api.replicate.com/v1/files', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    body,
  });
  if (!res.ok) throw new Error('فشل رفع الصورة (' + res.status + ')');
  const data = await res.json();
  return (data.urls && data.urls.get) || null;
}

async function pollPrediction(prediction, token, maxTries) {
  let result = prediction, tries = 0;
  while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled' && tries < maxTries) {
    await new Promise((r) => setTimeout(r, 1500));
    const pollRes = await fetch('https://api.replicate.com/v1/predictions/' + result.id, {
      headers: { Authorization: 'Bearer ' + token },
    });
    result = await pollRes.json();
    tries++;
  }
  if (result.status !== 'succeeded') throw new Error('لم يكتمل التوليد');
  let output = result.output;
  output = Array.isArray(output) ? output[0] : output;
  if (typeof output === 'string' && output.startsWith('http')) return output;
  return null;
}

async function createPrediction(url, input, token, attempt = 0) {
  const createRes = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Prefer: 'wait' },
    body: JSON.stringify({ input }),
  });
  const bodyText = await createRes.text();
  let prediction;
  try { prediction = JSON.parse(bodyText); } catch (e) { throw new Error('رد غير متوقع من Replicate'); }
  if (createRes.status === 429 && attempt < 4) {
    await new Promise((r) => setTimeout(r, 5000));
    return createPrediction(url, input, token, attempt + 1);
  }
  if (!createRes.ok || prediction.error) throw new Error('Replicate (' + createRes.status + ')');
  return pollPrediction(prediction, token, 70);
}

const generateFlatKontext = (imageUrl, prompt, token, aspect) =>
  createPrediction(REPLICATE_KONTEXT_URL, {
    prompt, input_image: imageUrl, output_format: 'jpg', aspect_ratio: aspect, safety_tolerance: 2,
  }, token);

const generateImage = (prompt, aspectRatio, token) =>
  createPrediction(REPLICATE_FLUX_URL, {
    prompt, aspect_ratio: aspectRatio, output_format: 'jpg', output_quality: 95, safety_tolerance: 2,
  }, token);

// محاولة + إعادة محاولة واحدة، مع احترام الموعد النهائي للدالة
function makeSafe(deadline) {
  return async function safeRun(fn, capMs, attempts) {
    const maxAttempts = attempts || 3;
    let u = null;
    for (let attempt = 0; attempt < maxAttempts && !u; attempt++) {
      if (Date.now() > deadline - 15000) break;
      if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
      u = await withTimeout(fn().catch(() => null), Math.min(capMs, deadline - Date.now()));
    }
    return u;
  };
}

// مجمّع تنفيذ بحد أقصى للتزامن — يمنع رفض Replicate الفوري للطلبات الزائدة
async function runPool(tasks, limit) {
  const results = new Array(tasks.length).fill(null);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      try { results[i] = await tasks[i](); } catch (e) { results[i] = null; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

function getField(v) { return Array.isArray(v) ? v[0] : v; }

// ============================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) return res.status(500).json({ error: 'مفتاح Replicate غير مضبوط على الخادم' });

  try {
    const form = formidable({ maxFileSize: 12 * 1024 * 1024 });
    const [fields, files] = await form.parse(req);

    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
    if (!imageFile) return res.status(400).json({ error: 'لم تُرفع صورة التصميم' });

    let meta = {};
    try { meta = JSON.parse(getField(fields.meta) || '{}'); } catch (e) { meta = {}; }

    const imgBuffer = fs.readFileSync(imageFile.filepath);
    const mediaType = detectImageType(imgBuffer);

    const materials = Array.isArray(meta.materials) ? meta.materials.slice(0, 16) : [];
    const areaList = Array.isArray(meta.detailAreas) ? meta.detailAreas.filter(Boolean).join(', ') : '';
    const paletteHint = Array.isArray(meta.colorway) && meta.colorway.length
      ? 'Garment color palette: ' + meta.colorway.map((c) => (c.part || '') + ' ' + (c.hex || '')).join(', ') + '. '
      : '';

    // ------------------------------------------------------------------
    // البرومبتات — بدون أي طلب لرسم نصوص أو أرقام داخل الصورة
    // ------------------------------------------------------------------
    const facts = typeof meta.garmentFacts === 'string' && meta.garmentFacts.length > 10
      ? 'LOCKED DESIGN FACTS — every drawing must match ALL of these exactly: ' + meta.garmentFacts + ' '
      : '';

    const NO_INVENT =
      'CRITICAL: reproduce the garment EXACTLY as in the reference image. ' +
      facts +
      'Do NOT add, remove or alter any design element. ' +
      'Do NOT add shoulder straps, sleeves, collars, sheer panels, mesh, chiffon yokes, illusion necklines or any element that is not in the reference; if the reference is strapless it stays strapless. ' +
      'Keep the exact neckline shape and the exact silhouette. ' +
      'Preserve and reproduce ALL embroidery motifs, beading, crystals and embellishments in their exact locations, shapes and density. ';

    const NO_PERSON =
      'Do NOT include any person, model, mannequin, dress form, body, skin, face, head, hair, arms, hands or legs anywhere in the image — the garment only. ';

    // الرسم الخطي عبر النموذج التوليدي غير حتمي (مرة يطلع أبيض/أسود ومرة ملون).
    // القرار البنيوي: النموذج يولد فقط المنظرين الملونين المسطحين — العملية
    // المثبت نجاحها — والرسمة الخطية الأبيض/أسود تشتقها الواجهة بالكود
    // (كشف حواف حتمي على كانفاس)، فتطلع خطية 100% بكل توليدة بلا استثناء.
    const FLAT_LOCK =
      'Style: a colored TECHNICAL FASHION FLAT SKETCH, 2D vector illustration exactly like factory tech pack flats — the garment drawn flat as if laid on a table, symmetrical, NOT worn. ' +
      'NO person, NO model, NO mannequin, NO invisible/ghost-mannequin volume, NO dress form, NO 3D worn shape, NO body volume inside the garment, NO skin, NO head, NO neck, NO arms, NO hanger. ' +
      'Zoom out so the ENTIRE garment fits inside the frame — from the top edge to the very end of the hem and the full train — with clear empty margins on all four sides; NEVER crop any part of the garment. ' +
      'Pure white background, no scene, no props, no body shadows. Absolutely NO text, NO letters, NO numbers, NO labels, NO arrows, NO watermark.';

    const coloredFrontPrompt =
      'Convert this reference photo into a colored flat product illustration of the FRONT view of the garment. ' +
      NO_INVENT + NO_PERSON + FLAT_LOCK +
      ' Keep the exact same colors, fabrics, embroidery, beading and train as the reference. ' +
      paletteHint;

    const coloredBackPrompt =
      'This image is a colored flat product illustration of the FRONT of a garment. ' +
      'Draw the SAME garment seen from the BACK in the IDENTICAL flat illustration style: same silhouette, same scale, same colors, same fabrics, same hem and train length. ' +
      'The back view shows the center-back closure seam and the back neckline edge. ' +
      facts + NO_PERSON + FLAT_LOCK;

    // صور الخامات — بطاقة لكل خامة بترتيب الـ BOM
    const materialFallbackPrompt = (m) => {
      const name = (m && m.name) || 'fabric sample';
      const pantone = m && m.pantone ? ' color PANTONE ' + m.pantone + ',' : '';
      return 'Professional studio product photograph of a single ' + name + ' sample,' + pantone +
        ' exactly one item only, centered, shown alone with visible texture and material detail, soft natural folds if it is a textile, on a plain neutral background. ' +
        'Macro product photography, soft even studio lighting, photorealistic, high detail. No text, no letters, no watermark.';
    };
    const materialPrompt = (m) => {
      const p = (m && m.photoPrompt) || '';
      if (p && p.length > 30) return p + ' Exactly one item only, centered. No text, no letters, no watermark.';
      return materialFallbackPrompt(m);
    };

    // ------------------------------------------------------------------
    // رفع صورة التصميم (مطلوبة لاستدعاءات Kontext)
    // ------------------------------------------------------------------
    let uploadedUrl = null;
    try { uploadedUrl = await withTimeout(uploadToReplicate(imgBuffer, mediaType, replicateToken), 30000); }
    catch (e) { uploadedUrl = null; }

    // ------------------------------------------------------------------
    // التنفيذ عبر المجمّع: 3 Kontext + صورة لكل خامة، بحد 4 متزامنة
    // ------------------------------------------------------------------
    const deadline = Date.now() + DEADLINE_MS;
    const safeRun = makeSafe(deadline);

    // سلسلة من خطوتين: الأمامي الملون من الصورة، والخلفي الملون من الأمامي
    const chainPromise = (async () => {
      if (!uploadedUrl) return { cf: null, cb: null };
      const cf = await safeRun(() => generateFlatKontext(uploadedUrl, coloredFrontPrompt, replicateToken, '9:16'), 110000);
      if (!cf) return { cf: null, cb: null };
      const cb = await safeRun(() => generateFlatKontext(cf, coloredBackPrompt, replicateToken, '9:16'), 110000);
      return { cf, cb };
    })();

    const materialTasks = materials.map((m) => async () => {
      let u = await safeRun(() => generateImage(materialPrompt(m), '1:1', replicateToken), 70000, 2);
      if (!u) u = await safeRun(() => generateImage(materialFallbackPrompt(m), '1:1', replicateToken), 70000, 1);
      return u;
    });
    const materialsPromise = runPool(materialTasks, 3);

    const [chain, materialPhotos] = await Promise.all([chainPromise, materialsPromise]);

    return res.status(200).json({
      coloredFrontImage: chain.cf || null,
      coloredBackImage: chain.cb || null,
      materialPhotos: materialPhotos.map((u) => u || null),
    });
  } catch (error) {
    return res.status(500).json({ error: 'خطأ في توليد الصور: ' + (error.message || 'غير معروف') });
  }
}
