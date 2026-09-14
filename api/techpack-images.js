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
import { put } from '@vercel/blob';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

// نموذج فحص المخرجات البصري — استدعاء قصير يُرجع JSON من ثلاثة حقول
const INSPECT_MODEL = 'claude-haiku-4-5-20251001';

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
  // تفضيل رابط التسليم المفتوح على رابط api المحميّ بمفتاح: الأخير يحتاج
  // ترويسة تفويض عند كل جلب، ولا يصلح للعرض المباشر في المتصفح.
  return (data.urls && (data.urls.download || data.urls.get)) || null;
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
  try { prediction = JSON.parse(bodyText); } catch (e) { if (typeof console !== "undefined") console.warn("[gh]", e && e.message); throw new Error('رد غير متوقع من Replicate'); }
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

// بوابة تحقّق على الناتج: نقرأ بكسلات الصورة ونحكم إن كانت رسمة خطية فعلاً
// (تشبّع لون منخفض ونسبة بيضاء عالية). إن فشلت، يُعاد التوليد ببرومبت أصرم.



// ---------------------------------------------------------------------------
// حفظ صورة في التخزين الدائم وإرجاع رابط عام.
// السبب: روابط Replicate مؤقتة وروابط المتصفح المحلية تموت بإغلاق التبويب،
// فلا تُعرض لأي مستخدمة أخرى ولا تُحفظ داخل الـ PDF. Blob يعطي رابطاً ثابتاً.
// عند غياب التوكن أو فشل الحفظ يعود الرابط الأصلي كما هو، فلا يتعطّل التوليد.
async function persist(input, name, mediaType) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return typeof input === 'string' ? input : null;
  }
  try {
    let body = input;
    let type = mediaType || 'image/jpeg';
    if (typeof input === 'string') {
      if (!/^https?:\/\//i.test(input)) return input;
      const r = await withTimeout(fetch(input), 25000);
      if (!r.ok) return input;
      const ct = r.headers.get('content-type') || '';
      if (!ct.startsWith('image/')) return input;
      type = ct.split(';')[0];
      body = Buffer.from(await r.arrayBuffer());
    }
    const ext = ({ 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg' })[type] || 'jpg';
    const key = 'techpack/' + Date.now() + '-' + Math.random().toString(36).slice(2, 9) + '-' + name + '.' + ext;
    const res = await withTimeout(
      put(key, body, { access: 'public', contentType: type, addRandomSuffix: false }),
      25000);
    return (res && res.url) || (typeof input === 'string' ? input : null);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] persist', e && e.message);
    return typeof input === 'string' ? input : null;
  }
}

// ---------------------------------------------------------------------------
// فحص المخرجات بصرياً.
//
// النسخة السابقة كانت تقرأ بايتات الملف المضغوط (buf[i] < 120) وتعاملها كأنها
// بكسلات. بايتات PNG/WebP المضغوطة لا علاقة لمواقعها بمواقع البكسلات، فكانت
// البوابتان تقيسان ضجيجاً ولا ترفضان شيئاً — ولهذا خرجت رسمتان في المنظر الواحد.
//
// البديل: فحص بصري فعلي بنفس المفتاح المستخدم في التحليل. استدعاء واحد
// يُرجع JSON قصيراً. عند أي فشل يُرجع null ويُقبل الناتج كما هو — فلا يعطّل
// الفحصُ التوليدَ أبداً.
async function inspectSketch(url, apiKey) {
  if (!url || !apiKey) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || 'image/png';
    if (!type.startsWith('image/')) return null;
    const base64 = Buffer.from(await res.arrayBuffer()).toString('base64');

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    let r;
    try {
      r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: INSPECT_MODEL,
          max_tokens: 200,
          thinking: { type: 'disabled' },
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: type.split(';')[0], data: base64 } },
              { type: 'text', text:
                'Inspect this garment technical flat sketch. Reply with ONLY a JSON object, no preamble, no markdown fences:\n' +
                '{"figures": <how many separate garment figures are drawn in the image, as an integer>, ' +
                '"colored": <true if the garment is filled with colour or shading, false if it is clean black line art on white>, ' +
                '"body": <true if a human body, face, mannequin or dress form is visible, false otherwise>}' },
            ],
          }],
        }),
      });
    } finally { clearTimeout(timer); }

    if (!r || !r.ok) return null;
    const data = await r.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
    const m = /\{[\s\S]*\}/.exec(text);
    if (!m) return null;
    const out = JSON.parse(m[0]);
    return {
      figures: Number.isFinite(+out.figures) ? +out.figures : null,
      colored: out.colored === true,
      body: out.body === true,
    };
  } catch (e) { if (typeof console !== "undefined") console.warn("[gh]", e && e.message); return null; }
}

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
      try { results[i] = await tasks[i](); } catch (e) { if (typeof console !== "undefined") console.warn("[gh]", e && e.message); results[i] = null; }
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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!replicateToken) return res.status(500).json({ error: 'مفتاح Replicate غير مضبوط على الخادم' });

  try {
    // يبدأ العدّ من لحظة دخول الطلب: كل ما يسبق التوليد (تحليل النموذج،
    // رفع الصور) يُحسب ضمن المهلة، وإلا تجاوزت الدالة حدّ المنصّة وقُطعت
    // قبل أن تُرجع أي صورة.
    const requestStart = Date.now();
    const form = formidable({ maxFileSize: 12 * 1024 * 1024 });
    const [fields, files] = await form.parse(req);

    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
    if (!imageFile) return res.status(400).json({ error: 'لم تُرفع صورة التصميم' });

    // flatOnly يفصل خطوة الرسمة التقنية عن توليد التيك باك الكامل
    const flatOnly = String(getField(fields.flatOnly) || '') === '1';

    // الرسمات التي رفعتها المصممة تصل كملفات لا كنصوص base64: النص يضخّم
    // الحجم ثلثاً ويتجاوز حدّ حجم الطلب فيُرفَض الطلب كاملاً قبل أن يصل.
    const pickFile = (f) => (Array.isArray(f) ? f[0] : f) || null;
    const flatFiles = {
      lf: pickFile(files.flatLineFront),
      lb: pickFile(files.flatLineBack),
      cf: pickFile(files.flatColorFront),
      cb: pickFile(files.flatColorBack),
    };
    let meta = {};
    try { meta = JSON.parse(getField(fields.meta) || '{}'); } catch (e) { if (typeof console !== "undefined") console.warn("[gh]", e && e.message); meta = {}; }

    const imgBuffer = fs.readFileSync(imageFile.filepath);
    const mediaType = detectImageType(imgBuffer);

    // لا سقف ثابت على عدد الخامات: القائمة تتبع التصميم، وقطعها عند رقم
    // يترك آخر البطاقات بلا صور. السقف الحقيقي هو مهلة الدالة، ويتكفّل به
    // مجمّع التنفيذ وفحص الموعد النهائي أدناه.
    const materials = Array.isArray(meta.materials) ? meta.materials : [];
    const areaList = Array.isArray(meta.detailAreas) ? meta.detailAreas.filter(Boolean).join(', ') : '';
    // تُمرَّر للرسمة التقنية لتضمن ظهور مناطق التجميع الحرجة واضحةً فيها،
    // لأن لقطات DETAILED VIEWS تُقتطع من الرسمة نفسها.
    const areaFocus = areaList
      ? ' Render these construction areas clearly and legibly, since they will be shown as close-up details: ' + areaList + '. '
      : '';
    const paletteHint = Array.isArray(meta.colorway) && meta.colorway.length
      ? 'Garment color palette: ' + meta.colorway.map((c) => (c.part || '') + ' ' + (c.hex || '')).join(', ') + '. '
      : '';

    // ------------------------------------------------------------------
    // البرومبتات — بدون أي طلب لرسم نصوص أو أرقام داخل الصورة
    // ------------------------------------------------------------------
    const facts = typeof meta.garmentFacts === 'string' && meta.garmentFacts.length > 10
      ? 'LOCKED DESIGN FACTS — every drawing must match ALL of these exactly: ' + meta.garmentFacts + ' '
      : '';

    // وصف بنيوي مكتوب للقطعة: يمنع النموذج من "تقريب" الشكل بدل نسخه
    const brief = typeof meta.flatSketchBrief === 'string' && meta.flatSketchBrief.length > 20
      ? 'EXACT STRUCTURE TO REPRODUCE (follow every clause literally): ' + meta.flatSketchBrief + ' '
      : '';
    const pieces = Number(meta.pieceCount) > 1
      ? 'This design is a SET of ' + Number(meta.pieceCount) + ' separate garments. Draw ALL ' + Number(meta.pieceCount) +
        ' pieces side by side in the same image, each one complete, separated, at the same scale, in the same order as the reference. Do not merge them into one garment and do not omit any piece. '
      : '';

    const NO_INVENT =
      'CRITICAL: reproduce the garment EXACTLY as in the reference image. ' +
      facts +
      'Do NOT add, remove or alter any design element. ' +
      'Do NOT add shoulder straps, sleeves, collars, sheer panels, mesh, chiffon yokes, illusion necklines or any element that is not in the reference; if the reference is strapless it stays strapless. ' +
      'Keep the exact neckline shape and the exact silhouette. ' +
      'Preserve and reproduce ALL embroidery motifs, beading, crystals and embellishments in their exact locations, shapes and density. ';

    // القطعة تُرسم مسطحة بلا أي جسم، والرسمة التقنية أبيض/أسود تُنتَج مباشرة.
    const NO_BODY =
      'Remove the person completely. There must be NO model, NO face, NO head, NO hijab, NO headscarf, NO hair, NO neck, NO skin, NO hands, NO arms, NO legs, NO feet, NO shoes, NO mannequin, NO dress form, NO hanger, and NO body volume inside the garment. ';
    const FIT_FRAME =
      'Show the complete garment from the top edge down to the very end of the hem, centred, with empty margins on all four sides. Never crop any part of the garment. ';
    // قفل المنظر الواحد: يمنع ظهور الأمامي والخلفي في صورة واحدة أو تكرار القطعة
    const ONE_VIEW = (which) =>
      'OUTPUT EXACTLY ONE GARMENT IN THE IMAGE, seen from the ' + which + ' ONLY. ' +
      'Do NOT draw two garments. Do NOT place a front view and a back view side by side. Do NOT add a second smaller figure, a duplicate, a mirrored copy or any additional view anywhere in the frame. One single ' + which.toLowerCase() + ' view, nothing else. ';
    const NO_ADD =
      'Do NOT add anything that is not in the reference: no belt, no waistband, no waist seam, no tie, no closure, no buttons, no embroidery, no beading. ';

    const STRICTER =
      ' CRITICAL OUTPUT REQUIREMENT: the result MUST be pure line art — every pixel is either white background or a thin black line. ' +
      'If you are about to output any colour, fill, grey tone or photographic shading, do not: output only black outlines on white. ';

    const flatFrontPrompt =
      'The FIRST image is a colored flat illustration of this garment; the SECOND image is the original design reference. ' +
      'Convert the FIRST image into a professional BLACK AND WHITE fashion technical flat drawing (CAD flat sketch), exactly like the flats in a factory tech pack. ' +
      'This is a LINE CONVERSION, not a redesign: trace every existing outline, panel seam, trim band edge, sleeve seam, cuff line, neckline curve and hem shape EXACTLY where they already are. ' +
      'Keep every proportion, every trim band path and angle, and every construction line identical to the first image. Add nothing, remove nothing, move nothing. ' +
      NO_INVENT + NO_BODY + NO_ADD + FIT_FRAME + ONE_VIEW('FRONT') + pieces + facts + brief + areaFocus +
      'Replace all colour with flat WHITE fill and clean BLACK vector outlines on a pure WHITE background. No colour, no grey fill, no shading, no gradients, no fabric texture, no photographic rendering. ' +
      'Use professional CAD line weights: a heavier outline for the garment silhouette, medium lines for panel and trim seams, and the finest lines for internal details and drape folds. ' +
      'Show topstitching as fine evenly spaced dashed black lines. No text, no letters, no numbers, no labels, no arrows, no measurement lines, no watermark.';

    const flatBackPrompt =
      'This image is a black and white technical flat drawing of the FRONT of a garment. Draw the SAME garment seen from the BACK, in the IDENTICAL black and white technical flat style. ' +
      'Same silhouette, same scale, same proportions, same panel seams, same trim band placement and angles, same sleeve and cuff shapes, same hem length. ' +
      'The back view shows the centre-back seam and the back neckline edge. ' +
      NO_INVENT + NO_BODY + NO_ADD + FIT_FRAME + ONE_VIEW('BACK') + pieces + facts + brief + areaFocus +
      'Only thin uniform BLACK outlines on a pure WHITE background — no colour, no shading, no photograph. No text, no labels, no arrows, no watermark.';

    const coloredFrontPrompt =
      'Redraw this garment as a colored flat product illustration of the FRONT view, laid completely flat and symmetrical as if placed on a table. ' +
      NO_INVENT + NO_BODY + NO_ADD + FIT_FRAME + ONE_VIEW('FRONT') + pieces + facts + brief +
      'Keep the exact same colours, fabrics, trim bands and proportions as the reference. ' + paletteHint +
      'Pure white background, soft even lighting. No text, no labels, no arrows, no watermark.';

    const coloredBackPrompt =
      'The FIRST image is the original design reference; the SECOND image is a colored flat illustration of its FRONT. Draw the SAME garment seen from the BACK in the IDENTICAL flat illustration style as the second image: same silhouette, same scale, same colours, same fabrics, same trim placement, same hem length, showing the centre-back seam and back neckline. ' +
      NO_INVENT + NO_BODY + NO_ADD + FIT_FRAME + ONE_VIEW('BACK') + pieces + facts + brief + paletteHint +
      'Pure white background. No text, no labels, no arrows, no watermark.';

    // صور الخامات — بطاقة لكل خامة بترتيب الـ BOM
    // أسلوب النموذج المرجعي: لقطة ماكرو قريبة جداً تملأ الكادر بالكامل،
    // إضاءة استوديو ناعمة موحّدة وخلفية بسيطة، بلا فراغ زائد حول العنصر.
    const MACRO_STYLE =
      ' Extreme close-up macro product photograph: the item FILLS THE ENTIRE FRAME edge to edge with no empty space around it, shot straight on. ' +
      'Soft even studio lighting, crisp material texture clearly visible, clean minimal background, square crop. ' +
      'Photorealistic catalogue quality, consistent with a professional fabric and trim library. No person, no garment worn, no text, no letters, no logos, no watermark.';

    const FORM_RULES =
      ' Correct real-world form for this component: a packaging bag is a LARGE EMPTY transparent garment bag for a floor-length gown (never filled, never a small pouch); a hanger is a BARE EMPTY padded or wooden garment hanger with absolutely no clothing on it; a label is a small woven fabric tag; a zipper is a closed coil zipper on matching fabric; boning is a fan of thin plastic strips; stay tape and interfacing are neat rolls or folded pieces; beads and crystals are scattered loose on matching fabric; thread is a group of spools. Show only the raw component — NOT a finished garment, NOT a jacket, NOT clothing.';

    // مبني على صفحتَي MATERIALS في النموذج المرجعي:
    // الأقمشة والبطانات والخيوط والسحاب والحواف تُصوَّر بلون القطعة الفعلي،
    // أما اللوازم البنيوية فبألوانها الصناعية الطبيعية (بونينغ أبيض، شريط شفاف،
    // حشوة بيضاء، خطاف فضي) — ولا تُصبغ بلون القطعة.
    // الـ hex قيمة صريحة يفهمها نموذج الصور؛ كود بانتون لا يعني له شيئاً
    // فيخترع لوناً مكانه. يُذكر الكود بعد الـ hex كمرجع فقط.
    const mainC = (Array.isArray(meta.colorway) && meta.colorway[0]) || null;
    const mainHex = (mainC && mainC.hex) || '';
    const mainPantone = (mainC && mainC.pantone) || '';
    const isColourMatched = (name) => /fabric|satin|crepe|chiffon|tulle|silk|wool|lining|shell|overlay|thread|zip|piping|trim|band|bias|hem/i.test(name || '');
    const isNaturalNotion = (name) => /boning|interfacing|stay tape|channel|fusible|hook|eye|hanger|polybag|garment bag|packaging|label/i.test(name || '');

    const designCtx = (m) => {
      const name = (m && m.name) || '';
      if (isNaturalNotion(name)) {
        return ' Photograph this component in its NATURAL industrial colour as supplied (boning and interfacing are white, stay and channel tape are white or clear, hook-and-eye is silver metal, labels are woven white or cream, hangers and garment bags are natural) — do NOT dye it the garment colour.';
      }
      if (isColourMatched(name) && mainHex) {
        return ' This component is colour-matched to the garment: render it in the EXACT colour ' + mainHex +
          (mainPantone ? ' (PANTONE ' + mainPantone + ')' : '') +
          '. Small colour-matched hardware such as the zipper may be shown lying on the garment\'s own main fabric in the same colour.';
      }
      return '';
    };

    const materialFallbackPrompt = (m) => {
      const name = (m && m.name) || 'fabric sample';
      const pantone = m && m.pantone ? ' in the exact color PANTONE ' + m.pantone + ',' : '';
      const desc = m && m.description ? ' ' + String(m.description).slice(0, 180) : '';
      return 'Professional studio product photograph of ' + name + ',' + pantone +
        ' shown alone with rich visible texture, soft natural folds and sheen if it is a textile.' + desc +
        FORM_RULES + designCtx(m) + MACRO_STYLE;
    };

    const materialPrompt = (m) => {
      const p = (m && m.photoPrompt) || '';
      if (p && p.length > 30) {
        // اللون الصريح أولاً: نموذج الصور لا يفكّ كود بانتون فيخترع لوناً مكانه
        const hx = (m && m.hex) || '';
        const pt = (m && m.pantone) || '';
        const colour = hx
          ? ' The exact colour must be ' + hx + (pt ? ' (PANTONE ' + pt + ')' : '') + '.'
          : (pt ? ' The exact colour must be PANTONE ' + pt + '.' : '');
        return p + colour + FORM_RULES + designCtx(m) + MACRO_STYLE;
      }
      return materialFallbackPrompt(m);
    };

    // ------------------------------------------------------------------
    // رفع صورة التصميم (مطلوبة لاستدعاءات Kontext)
    // ------------------------------------------------------------------
    let uploadedUrl = null;
    try { uploadedUrl = await withTimeout(uploadToReplicate(imgBuffer, mediaType, replicateToken), 30000); }
    catch (e) { if (typeof console !== "undefined") console.warn("[gh]", e && e.message); uploadedUrl = null; }

    // رفع الرسمات الأربع معاً للحصول على روابط تُعرَض في التيك باك
    // كل رسمة تُحفظ في التخزين الدائم للعرض، وتُرفع إلى Replicate لتكون
    // مدخلاً للنماذج. الأول للمتصفح والثاني للتوليد، ولا يغني أحدهما عن الآخر.
    const uploadFlat = async (f, name) => {
      if (!f) return { display: null, model: null };
      try {
        const buf = fs.readFileSync(f.filepath);
        const mt = detectImageType(buf);
        const [display, model] = await Promise.all([
          persist(buf, name, mt),
          withTimeout(uploadToReplicate(buf, mt, replicateToken), 20000).catch(() => null),
        ]);
        return { display: display || null, model: model || null };
      } catch (e) {
        if (typeof console !== "undefined") console.warn("[gh] flat upload", e && e.message);
        return { display: null, model: null };
      }
    };
    const [upLf, upLb, upCf, upCb] = await Promise.all([
      uploadFlat(flatFiles.lf, 'line-front'), uploadFlat(flatFiles.lb, 'line-back'),
      uploadFlat(flatFiles.cf, 'color-front'), uploadFlat(flatFiles.cb, 'color-back'),
    ]);
    // روابط العرض الدائمة تُرجَع للواجهة؛ روابط النماذج تدخل سلسلة التوليد
    const shownFlats = {
      lf: upLf.display, lb: upLb.display, cf: upCf.display, cb: upCb.display,
    };
    const approvedFront = upLf.model || upLf.display || '';
    const approvedBack = upLb.model || upLb.display || '';
    const approvedColorFront = upCf.model || upCf.display || '';
    const approvedColorBack = upCb.model || upCb.display || '';

    // ------------------------------------------------------------------
    // التنفيذ عبر المجمّع: 3 Kontext + صورة لكل خامة، بحد 4 متزامنة
    // ------------------------------------------------------------------
    const deadline = requestStart + DEADLINE_MS;
    const safeRun = makeSafe(deadline);

    // تولّد الرسمة التقنية ثم تتحقق أنها خطية فعلاً؛ إن طلعت ملونة تُعاد ببرومبت أصرم
    let gateRetryUsed = false;
    const makeLineArt = async (inputs, prompt, capMs) => {
      let out = await safeRun(() => editImage(inputs, prompt, replicateToken, '2:3'), capMs);
      if (!out) return null;
      const look = await inspectSketch(out, apiKey);
      // الفحص يُرجع null عند أي تعذّر — عندها يُقبل الناتج ولا يُعطَّل التوليد
      if (!look) return out;

      const badViews = look.figures !== null && look.figures > 1;
      const badColour = look.colored === true;
      const badBody = look.body === true;

      // إعادة التوليد فقط إن بقي وقت يكفيها كاملة
      if (!gateRetryUsed && (badColour || badViews || badBody) && Date.now() + capMs < deadline - 20000) {
        gateRetryUsed = true;
        let extra = STRICTER;
        if (badViews) extra += ' The previous attempt wrongly contained ' + look.figures +
          ' separate figures. Output ONE single garment only — no second view, no duplicate, no mirrored copy anywhere in the frame. ';
        if (badColour) extra += ' The previous attempt was coloured or shaded. Output clean BLACK LINE ART on a pure white background, no fill, no shading, no colour. ';
        if (badBody) extra += ' The previous attempt showed a human body, face or mannequin. Draw the garment alone, laid flat, with no body inside it. ';

        const retry = await safeRun(() => editImage(inputs, prompt + extra, replicateToken, '2:3'), capMs, 1);
        if (retry) {
          const check = await inspectSketch(retry, apiKey);
          // تُقبل الإعادة فقط إن كانت أفضل فعلاً، وإلا يبقى الناتج الأول
          if (!check) return retry;
          const stillBad = (check.figures !== null && check.figures > 1) || check.colored || check.body;
          if (!stillBad) return retry;
        }
      }
      return out;
    };

    // الملونة الأمامية أولاً، ثم التقنية تُشتق منها كتحويل خطوط (أوفى بكثير من إعادة الرسم)
    const chainPromise = (async () => {
      // الرسمة المعتمدة تُستخدم كما هي؛ يبقى الملوّن وحده للكولورويز
      if (approvedFront || approvedBack || approvedColorFront || approvedColorBack) {
        // ما رفعته المصممة أو ولّدته في قسم الفلات يُستخدم كما هو ولا يُعاد
        // توليده. الناقص وحده يُولَّد هنا، فلا تبقى صفحة بلا رسمة ولا تُصرف
        // كلفة على ما هو موجود أصلاً.
        let cf = approvedColorFront || null;
        if (!cf && uploadedUrl) {
          cf = await safeRun(() => editImage(uploadedUrl, coloredFrontPrompt, replicateToken, '2:3'), 60000);
        }

        // الواجهة تُلزم برفع الأربع، فالتوليد هنا شبكة أمان لمسار غير متوقّع فقط
        const base = cf ? [cf, uploadedUrl].filter(Boolean) : uploadedUrl;
        const needLf = !approvedFront && base;
        const needCb = !approvedColorBack && cf;
        const [genLf, genCb] = await Promise.all([
          needLf ? makeLineArt(base, flatFrontPrompt, 55000) : Promise.resolve(null),
          needCb ? safeRun(() => editImage([uploadedUrl, cf].filter(Boolean), coloredBackPrompt, replicateToken, '2:3'), 60000) : Promise.resolve(null),
        ]);

        const lf = approvedFront || genLf || null;
        const cb = approvedColorBack || genCb || null;

        let lb = approvedBack || null;
        if (!lb) {
          const backSrc = cb || lf;
          if (backSrc) lb = await makeLineArt(backSrc, flatBackPrompt, 55000);
        }

        return { lf, lb, cf: cf || null, cb };
      }
      if (!uploadedUrl) return { lf: null, lb: null, cf: null, cb: null };
      const cf = await safeRun(() => editImage(uploadedUrl, coloredFrontPrompt, replicateToken, '2:3'), 65000);
      if (!cf) {
        const lfOnly = await makeLineArt(uploadedUrl, flatFrontPrompt, 60000);
        return { lf: lfOnly, lb: null, cf: null, cb: null };
      }
      const [lf, cb] = await Promise.all([
        makeLineArt([cf, uploadedUrl], flatFrontPrompt, 55000),
        safeRun(() => editImage([uploadedUrl, cf], coloredBackPrompt, replicateToken, '2:3'), 70000),
      ]);
      const lb = lf ? await makeLineArt(lf, flatBackPrompt, 55000) : null;
      return { lf, lb, cf, cb };
    })();

    // قسم الفلات سكتش: الرسمتان وحدهما. لا صور خامات، فلا تُهدر كلفة على
    // ما لا تطلبه هذه الخطوة.
    if (flatOnly) {
      const chain = await chainPromise;
      // روابط دائمة: المصممة تنزّلها وترفعها في التيك باك لاحقاً
      const [fcf, fcb, flf, flb] = await Promise.all([
        chain.cf ? persist(chain.cf, 'flat-color-front') : Promise.resolve(null),
        chain.cb ? persist(chain.cb, 'flat-color-back') : Promise.resolve(null),
        chain.lf ? persist(chain.lf, 'flat-line-front') : Promise.resolve(null),
        chain.lb ? persist(chain.lb, 'flat-line-back') : Promise.resolve(null),
      ]);
      const got = [fcf, fcb, flf, flb].filter(Boolean).length;
      return res.status(200).json({
        coloredFrontImage: fcf,
        coloredBackImage: fcb,
        lineFrontImage: flf,
        lineBackImage: flb,
        produced: got,
        error: got === 0 ? 'تعذّر توليد أي رسمة — حاولي مرة ثانية' : null,
      });
    }

    const materialTasks = materials.map((m) => async () => {
      let u = await safeRun(() => generateImage(materialPrompt(m), '1:1', replicateToken), 70000, 2);
      if (!u) u = await safeRun(() => generateImage(materialFallbackPrompt(m), '1:1', replicateToken), 70000, 1);
      return u;
    });
    const materialsPromise = runPool(materialTasks, CONCURRENCY);

    const [chain, rawMaterialPhotos] = await Promise.all([chainPromise, materialsPromise]);
    // روابط نواتج Replicate مؤقتة وتنتهي: تُحفظ لتبقى في التيك باك والـ PDF
    const materialPhotos = await Promise.all(
      rawMaterialPhotos.map((u, i) => (u ? persist(u, 'material-' + (i + 1)) : Promise.resolve(null))));

    // ما رفعته المصممة يُعرَض من رابطه الدائم؛ وما وُلِّد هنا يُحفظ قبل إرجاعه
    const [outCf, outCb, outLf, outLb] = await Promise.all([
      shownFlats.cf ? Promise.resolve(shownFlats.cf) : (chain.cf ? persist(chain.cf, 'color-front') : Promise.resolve(null)),
      shownFlats.cb ? Promise.resolve(shownFlats.cb) : (chain.cb ? persist(chain.cb, 'color-back') : Promise.resolve(null)),
      shownFlats.lf ? Promise.resolve(shownFlats.lf) : (chain.lf ? persist(chain.lf, 'line-front') : Promise.resolve(null)),
      shownFlats.lb ? Promise.resolve(shownFlats.lb) : (chain.lb ? persist(chain.lb, 'line-back') : Promise.resolve(null)),
    ]);

    return res.status(200).json({
      coloredFrontImage: outCf || null,
      coloredBackImage: outCb || null,
      lineFrontImage: outLf || null,
      lineBackImage: outLb || null,
      materialPhotos: materialPhotos.map((u) => u || null),
    });
  } catch (error) {
    return res.status(500).json({ error: 'خطأ في توليد الصور: ' + (error.message || 'غير معروف') });
  }
}
