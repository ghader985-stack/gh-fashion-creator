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
// المخرجات: { flatImage, coloredMockupImage, detailsPageImage, materialPhotos: [...] }

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
  return async function safeRun(fn, capMs) {
    if (Date.now() > deadline - 15000) return null;
    let u = await withTimeout(fn().catch(() => null), Math.min(capMs, deadline - Date.now()));
    if (!u && Date.now() < deadline - 20000) {
      await new Promise((r) => setTimeout(r, 2000));
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
    const NO_INVENT =
      'CRITICAL: reproduce the garment EXACTLY as in the reference image. ' +
      'Do NOT add, remove or alter any design element. ' +
      'Do NOT add sheer panels, mesh, chiffon yokes, illusion necklines, straps, sleeves, collars or any fabric that is not in the reference. ' +
      'Keep the exact neckline shape and the exact strap/strapless configuration. ' +
      'Preserve and reproduce ALL embroidery motifs, beading, crystals and embellishments in their exact locations, shapes and density. ';

    const NO_PERSON =
      'Do NOT include any person, model, mannequin, dress form, body, skin, face, head, hair, arms, hands or legs anywhere in the image — the garment only. ';

    // 1) رسمة تقنية نظيفة واحدة (أمامي + خلفي) — الواجهة ترسم فوقها القياسات والأرقام والتسميات
    const flatPrompt =
      'Create a professional fashion technical flat drawing from this reference garment: the FRONT view on the left and the BACK view on the right, both complete and fully visible, side by side on one wide white sheet, same scale and height, both fully inside the frame with generous empty margins on the left and right sides. ' +
      NO_INVENT + NO_PERSON +
      'Flat technical CAD drawing style with thin uniform BLACK outlines on a pure white background, no color, no shading, no fill. ' +
      'Draw the embroidery and embellishment as fine outlined detail. Show the seams, darts, princess lines, the center-back zipper and the back neckline on the back view. ' +
      'Absolutely NO text, NO letters, NO numbers, NO labels, NO arrows, NO measurement lines, NO watermark — a completely clean drawing. Precise vector-style apparel production drawing.';

    // 2) موك أب ملوّن أمامي + خلفي بدون جسم (صفحة الألوان)
    const coloredMockupPrompt =
      'Create two colored flat product drawings of this garment: the FRONT view on the left and the BACK view on the right, both complete and fully visible, side by side on one wide white sheet, same scale and height, both fully inside the frame with margins. ' +
      NO_INVENT + NO_PERSON +
      'Show only the garment laid flat as a ghost-mannequin style product illustration. ' +
      'Keep the exact same colors, fabrics, embroidery and train as the reference. The back view must show the center-back zipper and back neckline. ' +
      paletteHint +
      'Even soft studio lighting, pure white background. No text, no labels, no arrows, no watermark.';

    // 3) شبكة لقطات ماكرو للتفاصيل — قماش القطعة فقط، بدون أي جسم
    const detailsPrompt =
      'Create a page of extreme close-up macro photographs of THIS EXACT garment, arranged as a neat aligned grid of six detail shots on a white background. ' +
      NO_INVENT + NO_PERSON +
      'Each shot is a tight macro crop of the garment fabric surface only: ' + (areaList || 'neckline edge, bust embroidery, center-back zipper, waist seam, hem edge, embellishment detail') + '. ' +
      'Every close-up must use the exact same fabric colors, embroidery, beading and materials as the reference garment. ' +
      paletteHint +
      'Studio macro photography, soft even lighting, high detail. No text, no labels, no watermark.';

    // صور الخامات — بطاقة لكل خامة بترتيب الـ BOM
    const materialPrompt = (m) => {
      const p = (m && m.photoPrompt) || '';
      if (p && p.length > 30) return p + ' No text, no letters, no watermark.';
      const name = (m && m.name) || 'fabric sample';
      const pantone = m && m.pantone ? ' color PANTONE ' + m.pantone + ',' : '';
      return 'Professional studio product photograph of a single ' + name + ' sample,' + pantone +
        ' shown alone with visible texture and material detail, soft natural folds if it is a textile, on a plain neutral background. ' +
        'Macro product photography, soft even studio lighting, photorealistic, high detail. No text, no letters, no watermark.';
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

    const tasks = [];
    tasks.push(() => uploadedUrl ? safeRun(() => generateFlatKontext(uploadedUrl, flatPrompt, replicateToken, '3:2'), 110000) : Promise.resolve(null));
    tasks.push(() => uploadedUrl ? safeRun(() => generateFlatKontext(uploadedUrl, coloredMockupPrompt, replicateToken, '3:2'), 110000) : Promise.resolve(null));
    tasks.push(() => uploadedUrl ? safeRun(() => generateFlatKontext(uploadedUrl, detailsPrompt, replicateToken, '4:3'), 110000) : Promise.resolve(null));
    for (const m of materials) {
      tasks.push(() => safeRun(() => generateImage(materialPrompt(m), '1:1', replicateToken), 70000));
    }

    const results = await runPool(tasks, CONCURRENCY);

    return res.status(200).json({
      flatImage: results[0] || null,
      coloredMockupImage: results[1] || null,
      detailsPageImage: results[2] || null,
      materialPhotos: results.slice(3).map((u) => u || null),
    });
  } catch (error) {
    return res.status(500).json({ error: 'خطأ في توليد الصور: ' + (error.message || 'غير معروف') });
  }
}
