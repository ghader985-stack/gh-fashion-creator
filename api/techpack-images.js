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

async function generateFlatKontext(imageUrl, prompt, token, attempt = 0) {
  const createRes = await fetch(REPLICATE_KONTEXT_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Prefer: 'wait' },
    body: JSON.stringify({
      input: {
        prompt,
        input_image: imageUrl,
        output_format: 'jpg',
        aspect_ratio: 'match_input_image',
        safety_tolerance: 2,
      },
    }),
  });
  const bodyText = await createRes.text();
  let prediction;
  try { prediction = JSON.parse(bodyText); } catch (e) { throw new Error('Kontext رد غير متوقع'); }
  if (createRes.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 6000));
    return generateFlatKontext(imageUrl, prompt, token, attempt + 1);
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
async function safeKontext(imageUrl, prompt, token, capMs) {
  let u = await withTimeout(generateFlatKontext(imageUrl, prompt, token).catch(() => null), capMs);
  if (!u) {
    await new Promise((r) => setTimeout(r, 2000));
    u = await withTimeout(generateFlatKontext(imageUrl, prompt, token).catch(() => null), capMs);
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

    const techFlatPrompt =
      'Convert this garment into a clean professional fashion technical flat sketch (CAD line drawing) showing the FRONT view on the left and the BACK view on the right, side by side on one white sheet. ' +
      'Completely remove the person, model and body — show only the dress as a flat technical drawing. ' +
      'Thin uniform black outlines on pure white background, no color, no shading, no fill. ' +
      'The back view must show the center-back zipper and back neckline. Keep the exact silhouette, neckline, seams, embroidery placement and train. ' +
      'Technical apparel production drawing, precise, vector style. No text, no arrows, no measurements, no watermark.';

    const colorFlatPrompt =
      'Turn this garment into two clean flat lay product drawings placed side by side on one white sheet: the FRONT view on the left and the BACK view on the right. ' +
      'Completely remove the person, model, body, head, arms and legs — show only the dress itself laid flat, no mannequin. ' +
      'Keep the exact same design, color, silhouette, neckline, embroidery, seams and train. The back view must clearly show the center-back zipper and back neckline. ' +
      'Even soft studio lighting, pure white background, both views same height and aligned. Fashion lookbook flat product shot. No text, no labels, no arrows, no watermark.';

    const matPrompt = (meta.materialsPagePrompt && meta.materialsPagePrompt.length > 40)
      ? meta.materialsPagePrompt
      : ('A clean professional fashion tech pack MATERIALS page: an organized neat grid of equal square fabric and trim swatches on a white background, each square showing a different real material of this garment (' + matList + '). Studio product photography, soft even lighting, perfectly aligned grid, magazine quality.');

    const detPrompt = (meta.detailsPagePrompt && meta.detailsPagePrompt.length > 40)
      ? meta.detailsPagePrompt
      : ('A clean professional fashion tech pack DETAILED VIEWS page: an organized grid of close-up macro photographs showing construction details of this exact garment (' + areaList + '), same color and design. Studio macro photography, soft lighting, aligned grid, high detail.');

    // رفع صورة التصميم (مطلوب لاستدعاءات Kontext)
    let uploadedUrl = null;
    try { uploadedUrl = await withTimeout(uploadToReplicate(imgBuffer, mediaType, replicateToken), 30000); }
    catch (e) { uploadedUrl = null; }

    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    // 4 استدعاءات فقط — واحد لكل صفحة — بالتوازي مع تباعد بسيط لتفادي 429.
    // لكل واحد إعادة محاولة تلقائية واحدة عند الفشل.
    const [flatSketchImage, flatColorImage, materialsPageImage, detailsPageImage] = await Promise.all([
      uploadedUrl ? safeKontext(uploadedUrl, techFlatPrompt, replicateToken, 115000) : Promise.resolve(null),
      uploadedUrl ? delay(1500).then(() => safeKontext(uploadedUrl, colorFlatPrompt, replicateToken, 115000)) : Promise.resolve(null),
      delay(3000).then(() => safeFlux(matPrompt + '. ' + paletteHint + 'Use exact colors. ' + STYLE + '. ' + NO_TEXT + '.', '4:3', replicateToken, 105000)),
      delay(4500).then(() => safeFlux(detPrompt + '. ' + paletteHint + 'Use exact garment color. ' + STYLE + '. ' + NO_TEXT + '.', '4:3', replicateToken, 105000)),
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
