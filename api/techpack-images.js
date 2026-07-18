// api/techpack-images.js
// الطور 2: توليد كل صور التيك باك بهيكل Adstronaut الحرفي:
// 1) SAMPLE MEASUREMENTS: رسمة أمامي+خلفي، القطعة بالأسود وخطوط القياس وأسماؤها بالأحمر الداكن
// 2) MATERIALS CALLOUT: رسمة أمامي+خلفي بدوائر مرقّمة مطابقة لأرقام الـ BOM
// 3) SEWING DETAILS: رسمة أمامي+خلفي بتسميات إنشائية قصيرة
// 4) COLORWAYS: موك أب ملوّن أمامي+خلفي بدون جسم
// 5) DETAILED VIEWS: شبكة ست لقطات ماكرو من القطعة نفسها
// 6) صورة مستقلة لكل خامة (بطاقات صفحة MATERIALS) — بترتيب الـ BOM نفسه
//
// تستقبل: صورة التصميم (multipart) + حقل meta (JSON).
// تُرجِع: { specSheetImage, calloutImage, sewingDetailImage, coloredMockupImage,
//          detailsPageImage, materialPhotos: [...] }

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

async function generateFlatKontext(imageUrl, prompt, token, aspect, attempt = 0) {
  const createRes = await fetch(REPLICATE_KONTEXT_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Prefer: 'wait' },
    body: JSON.stringify({
      input: {
        prompt,
        input_image: imageUrl,
        output_format: 'jpg',
        aspect_ratio: aspect,
        safety_tolerance: 2,
      },
    }),
  });
  const bodyText = await createRes.text();
  let prediction;
  try { prediction = JSON.parse(bodyText); } catch (e) { throw new Error('Kontext رد غير متوقع'); }
  if (createRes.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 6000));
    return generateFlatKontext(imageUrl, prompt, token, aspect, attempt + 1);
  }
  if (!createRes.ok || prediction.error) {
    throw new Error('Kontext (' + createRes.status + ')');
  }
  return pollPrediction(prediction, token, 70);
}

async function generateImage(prompt, aspectRatio, token, attempt = 0) {
  const createRes = await fetch(REPLICATE_FLUX_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Prefer: 'wait' },
    body: JSON.stringify({
      input: { prompt, aspect_ratio: aspectRatio, output_format: 'jpg', output_quality: 95, safety_tolerance: 2 },
    }),
  });
  const bodyText = await createRes.text();
  let prediction;
  try { prediction = JSON.parse(bodyText); } catch (e) { throw new Error('رد غير متوقع من Replicate'); }
  if (createRes.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 6000));
    return generateImage(prompt, aspectRatio, token, attempt + 1);
  }
  if (!createRes.ok || prediction.error) throw new Error('Replicate (' + createRes.status + ')');
  return pollPrediction(prediction, token, 60);
}

// محاولة + إعادة محاولة واحدة عند الفشل
async function safeKontext(imageUrl, prompt, token, capMs, aspect) {
  let u = await withTimeout(generateFlatKontext(imageUrl, prompt, token, aspect).catch(() => null), capMs);
  if (!u) {
    await new Promise((r) => setTimeout(r, 2000));
    u = await withTimeout(generateFlatKontext(imageUrl, prompt, token, aspect).catch(() => null), capMs);
  }
  return u;
}

async function safeFlux(prompt, aspect, token, capMs) {
  let u = await withTimeout(generateImage(prompt, aspect, token).catch(() => null), capMs);
  if (!u) {
    await new Promise((r) => setTimeout(r, 2000));
    u = await withTimeout(generateImage(prompt, aspect, token).catch(() => null), capMs);
  }
  return u;
}

function getField(v) { return Array.isArray(v) ? v[0] : v; }
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

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

    // ------------------------------------------------------------------
    // بيانات الـ meta القادمة من طور التحليل
    // ------------------------------------------------------------------
    const labels = meta.specSheetLabels || {};
    const frontLabels = Array.isArray(labels.front) ? labels.front.filter(Boolean) : [];
    const backLabels = Array.isArray(labels.back) ? labels.back.filter(Boolean) : [];

    const calloutMap = Array.isArray(meta.calloutMap)
      ? meta.calloutMap.filter((c) => c && c.num && c.target)
      : [];
    const frontCallouts = calloutMap.filter((c) => (c.view || 'front') !== 'back');
    const backCallouts = calloutMap.filter((c) => c.view === 'back');

    const sewLabels = Array.isArray(meta.sewingDetailLabels)
      ? meta.sewingDetailLabels.filter((s) => s && s.label)
      : [];
    const frontSew = sewLabels.filter((s) => (s.view || 'front') !== 'back').map((s) => s.label);
    const backSew = sewLabels.filter((s) => s.view === 'back').map((s) => s.label);

    const materials = Array.isArray(meta.materials) ? meta.materials.slice(0, 16) : [];
    const areaList = Array.isArray(meta.detailAreas) ? meta.detailAreas.filter(Boolean).join(', ') : '';
    const paletteHint = Array.isArray(meta.colorway) && meta.colorway.length
      ? 'Garment color palette: ' + meta.colorway.map((c) => (c.part || '') + ' ' + (c.hex || '')).join(', ') + '. '
      : '';

    // ------------------------------------------------------------------
    // البرومبتات — مطابقة لهيكل صفحات النموذج
    // ------------------------------------------------------------------
    const NO_INVENT =
      'CRITICAL: reproduce the garment EXACTLY as in the reference image. ' +
      'Do NOT add, remove or alter any design element. ' +
      'Do NOT add sheer panels, mesh, chiffon yokes, illusion necklines, straps, sleeves, collars or any fabric that is not in the reference. ' +
      'Keep the exact neckline shape, the exact strap/strapless configuration, and reproduce all embroidery, beading and embellishment exactly where they appear. ';

    const FLAT_BASE =
      'Create a professional fashion technical flat drawing from this reference garment: the FRONT view on the left and the BACK view on the right, both complete and fully visible, side by side on one wide white sheet, same scale and height, both fully inside the frame with generous margins. ' +
      NO_INVENT +
      'Remove the person, model and body entirely — draw only the garment as a flat technical CAD drawing with thin uniform BLACK outlines on a pure white background, no color, no shading, no fill. ' +
      'Draw the embroidery and embellishment as fine outlined detail, and show the seams, darts, princess lines, the center-back zipper and the back neckline. ';

    // 1) صفحة SAMPLE MEASUREMENTS: خطوط القطعة سوداء + خطوط وأسماء القياس بالأحمر الداكن
    const specSheetPrompt =
      FLAT_BASE +
      'Then annotate it exactly like a factory garment spec sheet: draw thin DARK RED measurement lines with small arrowheads spanning each measured area of the garment, and label every measurement line with its name written in small DARK RED capital letters next to or above the line. ' +
      'The garment drawing stays BLACK; ALL measurement lines, arrows and label text are DARK RED so they are clearly separate from the garment. ' +
      (frontLabels.length ? 'On the FRONT view (left drawing) annotate these measurements: ' + frontLabels.join(', ') + '. ' : '') +
      (backLabels.length ? 'On the BACK view (right drawing) annotate these measurements: ' + backLabels.join(', ') + '. ' : '') +
      'Horizontal measurements get horizontal double-arrow lines across the garment at the correct height; vertical lengths get vertical double-arrow lines along the garment. ' +
      'Add a light gray dashed horizontal line labeled "Floor Plane" in small gray letters near the hem of the BACK view, with the train extending below it. ' +
      'Labels must be short, clean, evenly placed, never overlapping each other or the garment outline. ' +
      'No other text anywhere, no watermark. Precise vector-style technical apparel production drawing.';

    // 2) صفحة MATERIALS CALLOUT: دوائر مرقّمة بأرقام الـ BOM
    const calloutLines = (list) => list.map((c) => c.num + ' = ' + c.target).join('; ');
    const calloutPrompt =
      FLAT_BASE +
      'Then add numbered material callouts exactly like a factory tech pack: for each item below draw one thin straight BLACK leader line from the correct location on the garment outward to the clear margin, ending in a small circle containing its number. ' +
      (frontCallouts.length ? 'On the FRONT view (left drawing) mark: ' + calloutLines(frontCallouts) + '. ' : '') +
      (backCallouts.length ? 'On the BACK view (right drawing) mark: ' + calloutLines(backCallouts) + '. ' : '') +
      'Only plain numerals inside the circles — no letters, no words, no other text anywhere. ' +
      'Circles placed neatly in the margins, evenly spaced, never overlapping each other or the garment. No watermark.';

    // 3) صفحة SEWING DETAILS: تسميات إنشائية قصيرة
    const sewingPrompt =
      FLAT_BASE +
      'Then annotate the construction points like a factory sewing detail sheet: for each point below draw one thin BLACK leader line from the correct location on the garment outward to the margin, ending in a short printed text label in small dark capital letters naming that construction point. ' +
      (frontSew.length ? 'On the FRONT view (left drawing) label: ' + frontSew.join('; ') + '. ' : '') +
      (backSew.length ? 'On the BACK view (right drawing) label: ' + backSew.join('; ') + '. ' : '') +
      'Labels short and clean, placed in the margins, evenly spaced, never overlapping. No other text, no watermark.';

    // 4) صفحة COLORWAYS: موك أب ملوّن أمامي+خلفي بدون جسم
    const coloredMockupPrompt =
      'Create two colored flat product drawings of this garment: the FRONT view on the left and the BACK view on the right, both complete and fully visible, side by side on one wide white sheet, same scale and height, both fully inside the frame with margins. ' +
      NO_INVENT +
      'Remove the person, model, body, head, arms and legs — show only the garment laid flat, no mannequin. ' +
      'Keep the exact same colors, fabrics, embroidery and train as the reference. The back view must show the center-back zipper and back neckline. ' +
      paletteHint +
      'Even soft studio lighting, pure white background. Fashion lookbook flat product shot. No text, no labels, no arrows, no watermark.';

    // 5) صفحة DETAILED VIEWS: شبكة ست لقطات ماكرو من القطعة نفسها
    const detailsPrompt =
      'Create a page of close-up macro photographs of THIS EXACT garment, arranged as a neat aligned grid of six detail shots on a white background. ' +
      NO_INVENT +
      'The details to show are: ' + (areaList || 'neckline, bust embroidery, center-back zipper, waist seam, hem, embellishment detail') + '. ' +
      'Every close-up must use the exact same fabric colors, embroidery and materials as the reference garment. ' +
      paletteHint +
      'Studio macro photography, soft even lighting, high detail. No text, no labels, no watermark.';

    // صور الخامات — بطاقة لكل خامة بترتيب الـ BOM
    const materialPrompt = (m) => {
      const p = (m && m.photoPrompt) || '';
      if (p && p.length > 30) return p + ' No text, no watermark.';
      const name = (m && m.name) || 'fabric sample';
      const pantone = m && m.pantone ? ' color PANTONE ' + m.pantone + ',' : '';
      return 'Professional studio product photograph of a single ' + name + ' sample,' + pantone +
        ' shown alone with visible texture and material detail, soft natural folds if it is a textile, on a plain neutral background. ' +
        'Macro product photography, soft even studio lighting, photorealistic, high detail. No text, no letters, no watermark.';
    };

    // ------------------------------------------------------------------
    // رفع صورة التصميم (مطلوبة لاستدعاءات Kontext الخمسة)
    // ------------------------------------------------------------------
    let uploadedUrl = null;
    try { uploadedUrl = await withTimeout(uploadToReplicate(imgBuffer, mediaType, replicateToken), 30000); }
    catch (e) { uploadedUrl = null; }

    // ------------------------------------------------------------------
    // التنفيذ: 5 صفحات Kontext + صورة لكل خامة، بالتوازي مع تباعد لتفادي 429
    // ------------------------------------------------------------------
    const kontextJobs = uploadedUrl
      ? [
          safeKontext(uploadedUrl, specSheetPrompt, replicateToken, 115000, '3:2'),
          delay(1200).then(() => safeKontext(uploadedUrl, calloutPrompt, replicateToken, 115000, '3:2')),
          delay(2400).then(() => safeKontext(uploadedUrl, sewingPrompt, replicateToken, 115000, '3:2')),
          delay(3600).then(() => safeKontext(uploadedUrl, coloredMockupPrompt, replicateToken, 115000, '3:2')),
          delay(4800).then(() => safeKontext(uploadedUrl, detailsPrompt, replicateToken, 110000, '4:3')),
        ]
      : [Promise.resolve(null), Promise.resolve(null), Promise.resolve(null), Promise.resolve(null), Promise.resolve(null)];

    const materialJobs = materials.map((m, i) =>
      delay(6000 + i * 800).then(() => safeFlux(materialPrompt(m), '1:1', replicateToken, 90000))
    );

    const [pageResults, materialPhotos] = await Promise.all([
      Promise.all(kontextJobs),
      Promise.all(materialJobs),
    ]);

    const [specSheetImage, calloutImage, sewingDetailImage, coloredMockupImage, detailsPageImage] = pageResults;

    return res.status(200).json({
      specSheetImage: specSheetImage || null,
      calloutImage: calloutImage || null,
      sewingDetailImage: sewingDetailImage || null,
      coloredMockupImage: coloredMockupImage || null,
      detailsPageImage: detailsPageImage || null,
      materialPhotos: materialPhotos.map((u) => u || null),
    });
  } catch (error) {
    return res.status(500).json({ error: 'خطأ في توليد الصور: ' + (error.message || 'غير معروف') });
  }
}
