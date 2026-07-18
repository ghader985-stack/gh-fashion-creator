// api/techpack-images.js
// نقطة نهاية مستقلة لتوليد صور التيك باك (4 صور — صفحة لكل استدعاء).
// فصلها عن /api/techpack يمنح كل طور سقف 5 دقائق مستقلاً، فلا يزاحم
// التحليلُ الصورَ على وقت واحد، ولا ينقطع أحدهما بسبب الآخر.
//
// تستقبل: صورة التصميم (multipart) + حقل meta (JSON) فيه البرومبتات والبيانات.
// تُرجِع: { flatSketchImage, flatColorImage, materialsPageImage, detailsPageImage }

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

async function generateFlatKontext(imageUrl, prompt, token, aspect = 'match_input_image', attempt = 0) {
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

// محاولة واحدة + إعادة محاولة واحدة عند الفشل (لضمان اكتمال الصور)
async function safeKontext(imageUrl, prompt, token, capMs, aspect = 'match_input_image') {
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

    const STYLE = 'professional fashion technical documentation, high quality, clean, 8k';
    const NO_TEXT = 'no text, no letters, no words, no watermark';
    const paletteHint = Array.isArray(meta.colorway) && meta.colorway.length
      ? 'garment color palette: ' + meta.colorway.map((c) => (c.part||'')+' '+(c.hex||'')).join(', ') + '. '
      : '';
    const matList = Array.isArray(meta.materials)
      ? meta.materials.map((m) => (m.name||'') + (m.pantone ? ' ('+m.pantone+')' : '')).filter(Boolean).join(', ')
      : '';
    const areaList = Array.isArray(meta.detailAreas) ? meta.detailAreas.filter(Boolean).join(', ') : '';

    const NO_INVENT =
      'CRITICAL: reproduce the garment EXACTLY as in the reference image. ' +
      'Do NOT add, remove or alter any design element. ' +
      'Do NOT add sheer panels, mesh, chiffon yokes, illusion necklines, straps, sleeves, collars or any fabric that is not in the reference. ' +
      'Keep the exact neckline shape, the exact strap/strapless configuration, and reproduce all embroidery, beading and embellishment exactly where they appear. ';

    // نقاط القياس تُرسم كأسهم استدعاء بأحرف مرجعية على الرسمة التقنية —
    // يرسمها نفس النموذج الذي يرسم القطعة، فتقع في مواضعها الصحيحة.
    const pts = Array.isArray(meta.measurePoints) ? meta.measurePoints.filter((p) => p && p.code && p.pom) : [];
    const frontPts = pts.filter((p) => (p.view || 'front') !== 'back').map((p) => p.code + ' = ' + p.pom).join('; ');
    const backPts = pts.filter((p) => p.view === 'back').map((p) => p.code + ' = ' + p.pom).join('; ');
    const calloutInstruction = pts.length
      ? ('Add measurement callouts exactly like a factory tech pack: for each point below draw a thin straight leader line from the correct anatomical location on the garment outward to the margin, ending in a small circle containing its reference letter. ' +
         'Draw the leader lines and letter circles in a thin darker line so they are clearly separate from the garment outline. ' +
         'Place the letters neatly along the outside edges, evenly spaced, never overlapping each other or the garment. ' +
         (frontPts ? 'On the FRONT view (left drawing) mark: ' + frontPts + '. ' : '') +
         (backPts ? 'On the BACK view (right drawing) mark: ' + backPts + '. ' : '') +
         'Only single capital letters inside the circles — no other text, no numbers, no words. ')
      : '';

    const techFlatPrompt =
      'Create a professional fashion technical flat sketch (CAD line drawing) of this garment: the FRONT view on the left and the BACK view on the right, both complete and fully visible, side by side on one wide white sheet, same scale, both fully inside the frame with margins. ' +
      NO_INVENT +
      'Remove the person, model and body — draw only the garment as a flat technical drawing. ' +
      'Thin uniform black outlines on pure white background, no color, no shading, no fill. ' +
      'Draw the embroidery and embellishment as fine outlined detail, and show the seams, darts, princess lines, center-back zipper and back neckline. ' +
      calloutInstruction +
      'Technical apparel production drawing, precise, vector style. No watermark.';

    const colorFlatPrompt =
      'Create two colored flat lay product drawings of this garment: the FRONT view on the left and the BACK view on the right, both complete and fully visible, side by side on one wide white sheet, same scale and height, both fully inside the frame with margins. ' +
      NO_INVENT +
      'Remove the person, model, body, head, arms and legs — show only the dress laid flat, no mannequin. ' +
      'Keep the exact same colors, fabrics, embroidery and train as the reference. The back view must show the center-back zipper and back neckline. ' +
      'Even soft studio lighting, pure white background. Fashion lookbook flat product shot. No text, no labels, no arrows, no watermark.';

    const matPrompt = (meta.materialsPagePrompt && meta.materialsPagePrompt.length > 40)
      ? meta.materialsPagePrompt
      : ('Overhead flat lay photograph of real fabric and trim SAMPLES arranged in tidy rows on a plain white surface. ' +
         'Each sample is a separate physical piece of textile with visible weave, texture, sheen and soft natural folds at the edges, casting subtle shadows — like a designer fabric sample board. ' +
         'The samples are: ' + matList + '. Use these exact colors. ' +
         'Include the trims as real objects too (zipper tape, boning strip, thread spool, hook-and-eye, crystals, woven label) photographed next to the fabrics. ' +
         'Professional macro product photography, soft even studio lighting, shallow depth of field. ' +
         'NOT a flat color chart, NOT wallpaper, NOT solid color squares, NOT a digital swatch grid.');

    const detPrompt = (meta.detailsPagePrompt && meta.detailsPagePrompt.length > 40)
      ? meta.detailsPagePrompt
      : ('Create a page of close-up macro photographs of THIS EXACT garment, arranged as a neat grid of six detail shots on a white background. ' +
         NO_INVENT +
         'The details to show are: ' + (areaList || 'neckline, bust embroidery, center-back zipper, waist seam, hem, embellishment scatter') + '. ' +
         'Every close-up must use the exact same fabric colors, embroidery and materials as the reference garment. ' +
         'Studio macro photography, soft lighting, high detail, aligned grid. No text, no labels, no watermark.');

    // رفع صورة التصميم (مطلوب لاستدعاءات Kontext)
    let uploadedUrl = null;
    try { uploadedUrl = await withTimeout(uploadToReplicate(imgBuffer, mediaType, replicateToken), 30000); }
    catch (e) { uploadedUrl = null; }

    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    // 4 استدعاءات فقط — واحد لكل صفحة — بالتوازي مع تباعد بسيط لتفادي 429.
    // الرسمتان بنسبة عرضية (3:2) حتى يتّسع العرضان أمامي+خلفي دون قص.
    // صفحة التفاصيل تُولَّد من صورة التصميم نفسها (Kontext) لا من نص،
    // فتأتي بألوان القطعة وتطريزها الحقيقيين لا بألوان مخترَعة.
    const [flatSketchImage, flatColorImage, materialsPageImage, detailsPageImage] = await Promise.all([
      uploadedUrl ? safeKontext(uploadedUrl, techFlatPrompt, replicateToken, 115000, '3:2') : Promise.resolve(null),
      uploadedUrl ? delay(1500).then(() => safeKontext(uploadedUrl, colorFlatPrompt, replicateToken, 115000, '3:2')) : Promise.resolve(null),
      delay(3000).then(() => safeFlux(matPrompt + ' ' + paletteHint + STYLE + '. ' + NO_TEXT + '.', '4:3', replicateToken, 105000)),
      uploadedUrl
        ? delay(4500).then(() => safeKontext(uploadedUrl, detPrompt + ' ' + paletteHint, replicateToken, 105000, '4:3'))
        : delay(4500).then(() => safeFlux(detPrompt + ' ' + paletteHint + STYLE + '. ' + NO_TEXT + '.', '4:3', replicateToken, 105000)),
    ]);

    return res.status(200).json({
      flatSketchImage: flatSketchImage || null,
      flatColorImage: flatColorImage || null,
      materialsPageImage: materialsPageImage || null,
      detailsPageImage: detailsPageImage || null,
    });
  } catch (error) {
    return res.status(500).json({ error: 'خطأ في توليد الصور: ' + (error.message || 'غير معروف') });
  }
}
