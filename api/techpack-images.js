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
// المخرجات: { coloredFrontImage, coloredBackImage, lineFrontImage, lineBackImage, materialPhotos: [...] }

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

const FLUX_MODEL = 'black-forest-labs/flux-1.1-pro';
const REPLICATE_FLUX_URL = 'https://api.replicate.com/v1/models/' + FLUX_MODEL + '/predictions';

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

// محرّر صور يتبع التعليمات النصية بدقة (Gemini 3 Pro Image).
// السبب: Kontext كان يتجاهل أمر "احذف الموديل" ويعيد الرسم بالموديل والحجاب،
// ومستخرِج الخطوط كان يفشل فيسقط العرض للصورة الملونة بالموديل.
// هذا المحرّر يلتزم بالتعليمات فيُنتج الرسمة المسطحة الأبيض/أسود مباشرة.
const EDIT_MODEL = 'google/nano-banana-pro';
const REPLICATE_EDIT_URL = 'https://api.replicate.com/v1/models/' + EDIT_MODEL + '/predictions';

const editImage = (imageUrls, prompt, token, aspect) =>
  createPrediction(REPLICATE_EDIT_URL, {
    prompt,
    image_input: Array.isArray(imageUrls) ? imageUrls : [imageUrls],
    aspect_ratio: aspect,
    output_format: 'jpg',
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

    // القطعة تُرسم مسطحة بلا أي جسم، والرسمة التقنية أبيض/أسود تُنتَج مباشرة.
    const NO_BODY =
      'Remove the person completely. There must be NO model, NO face, NO head, NO hijab, NO headscarf, NO hair, NO neck, NO skin, NO hands, NO arms, NO legs, NO feet, NO shoes, NO mannequin, NO dress form, NO hanger, and NO body volume inside the garment. ';
    const FIT_FRAME =
      'Show the complete garment from the top edge down to the very end of the hem, centred, with empty margins on all four sides. Never crop any part of the garment. ';
    const NO_ADD =
      'Do NOT add anything that is not in the reference: no belt, no waistband, no waist seam, no tie, no closure, no buttons, no embroidery, no beading. ';

    const flatFrontPrompt =
      'Redraw this garment as a professional BLACK AND WHITE fashion technical flat drawing (CAD flat sketch) of the FRONT view, exactly like the flats in a factory tech pack. ' +
      NO_BODY + NO_ADD + FIT_FRAME + facts +
      'Draw the garment laid completely flat and symmetrical, as if placed on a table. ' +
      'Use only thin, uniform, solid BLACK outlines on a pure WHITE background. Absolutely no colour, no grey fill, no shading, no gradients, no fabric texture, no photographic rendering. ' +
      'Draw all construction lines as thin black lines: panel seams, trim band edges, sleeve seams, cuff band lines, hem edge, collar edge. Show topstitching as fine dashed lines. ' +
      'No text, no letters, no numbers, no labels, no arrows, no measurement lines, no watermark.';

    const flatBackPrompt =
      'This image is a black and white technical flat drawing of the FRONT of a garment. Draw the SAME garment seen from the BACK, in the IDENTICAL black and white technical flat style. ' +
      'Same silhouette, same scale, same proportions, same panel seams, same trim band placement, same sleeve and cuff shapes, same hem length. ' +
      'The back view shows the centre-back seam and the back neckline edge. ' +
      NO_BODY + NO_ADD + FIT_FRAME + facts +
      'Only thin uniform BLACK outlines on a pure WHITE background — no colour, no shading, no photograph. No text, no labels, no arrows, no watermark.';

    const coloredFrontPrompt =
      'Redraw this garment as a colored flat product illustration of the FRONT view, laid completely flat and symmetrical as if placed on a table. ' +
      NO_BODY + NO_ADD + FIT_FRAME +
      'Keep the exact same colours, fabrics, trim bands and proportions as the reference. ' + paletteHint +
      'Pure white background, soft even lighting. No text, no labels, no arrows, no watermark.';

    const coloredBackPrompt =
      'This image is a colored flat product illustration of the FRONT of a garment. Draw the SAME garment seen from the BACK in the IDENTICAL flat illustration style: same silhouette, same scale, same colours, same fabrics, same trim placement, same hem length, showing the centre-back seam and back neckline. ' +
      NO_BODY + NO_ADD + FIT_FRAME + facts + paletteHint +
      'Pure white background. No text, no labels, no arrows, no watermark.';

    // صور الخامات — بطاقة لكل خامة بترتيب الـ BOM
    const materialFallbackPrompt = (m) => {
      const name = (m && m.name) || 'fabric sample';
      const pantone = m && m.pantone ? ' in the exact color PANTONE ' + m.pantone + ',' : '';
      const desc = m && m.description ? ' ' + String(m.description).slice(0, 180) : '';
      return 'Professional studio product photograph of a single ' + name + ',' + pantone +
        ' exactly one item only, centered, shown alone with visible texture and true material detail, soft natural folds if it is a textile, on a plain neutral background.' + desc + ' ' +
        'The item must match its real-world form and scale exactly: a packaging bag is a LARGE EMPTY transparent garment polybag sized for a floor-length abaya (about 60x150cm), lying flat and clearly empty (never filled, never a small pouch), a hanger is a full-size padded or wooden garment hanger shown alone with nothing on it, a label is a small woven fabric tag, a zipper is a coil zipper, interfacing and stay tape are plain rolls or strips. Show only the raw component itself — NOT a finished garment, NOT a jacket, NOT clothing. ' +
        'Macro product photography, soft even studio lighting, photorealistic, high detail. No garment worn, no person, no text, no letters, no watermark.';
    };
    const materialPrompt = (m) => {
      const p = (m && m.photoPrompt) || '';
      if (p && p.length > 30) {
        const pantone = m && m.pantone ? ' The exact color must be PANTONE ' + m.pantone + '.' : '';
        return p + pantone + ' Exactly one physical item only, centered on a plain neutral surface, at its true real-world form and scale. Show only that item itself — NOT a finished garment, NOT a jacket, NOT clothing worn or displayed. If it is a packaging bag it must be a LARGE EMPTY transparent garment polybag sized for a floor-length abaya (about 60x150cm), shown flat and clearly empty, never filled and never a small pouch. If it is a hanger it must be a full-size padded or wooden garment hanger shown alone with nothing on it. No person, no text, no letters, no watermark.';
      }
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

    // السلسلة: رسمة تقنية أمامية → (خلفية تقنية ∥ ملونة أمامية) → ملونة خلفية
    const chainPromise = (async () => {
      if (!uploadedUrl) return { lf: null, lb: null, cf: null, cb: null };
      const lf = await safeRun(() => editImage(uploadedUrl, flatFrontPrompt, replicateToken, '2:3'), 110000);
      const [lb, cf] = await Promise.all([
        lf ? safeRun(() => editImage(lf, flatBackPrompt, replicateToken, '2:3'), 110000) : Promise.resolve(null),
        safeRun(() => editImage(uploadedUrl, coloredFrontPrompt, replicateToken, '2:3'), 110000),
      ]);
      const cb = cf ? await safeRun(() => editImage(cf, coloredBackPrompt, replicateToken, '2:3'), 100000) : null;
      return { lf, lb, cf, cb };
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
      lineFrontImage: chain.lf || null,
      lineBackImage: chain.lb || null,
      materialPhotos: materialPhotos.map((u) => u || null),
    });
  } catch (error) {
    return res.status(500).json({ error: 'خطأ في توليد الصور: ' + (error.message || 'غير معروف') });
  }
}
