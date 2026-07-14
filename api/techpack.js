// api/techpack.js
// يستقبل صورة تصميم + مواصفات من المصممة، يحلّلها عبر Claude Vision،
// ويرجّع تيك باك كامل منظّم (JSON).
//
// الرسمة التقنية: تُبنى عبر FLUX Kontext (image-to-image) — يحوّل صورة التصميم
// إلى رسمة فلات مسطّحة نظيفة (بدون موديل، خطوط سوداء رفيعة، خلفية بيضاء)،
// مع الحفاظ على شكل القطعة الفعلي. ثم تُركّب أسهم القياس فوقها كطبقة SVG
// متجهة في الواجهة (index.js) — بأحرف مرجعية مربوطة بجدول القياسات.
// هذه هي نفس طريقة المنصات الاحترافية (image-to-flat + arrow overlay).

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

const MODEL = 'claude-sonnet-5';

// FLUX 1.1 Pro لصور الخامات (كما هو)
const FLUX_MODEL = 'black-forest-labs/flux-1.1-pro';
const REPLICATE_FLUX_URL = 'https://api.replicate.com/v1/models/' + FLUX_MODEL + '/predictions';

// FLUX Kontext Pro لتحويل صورة التصميم إلى رسمة فلات نظيفة (image-to-image)
const KONTEXT_MODEL = 'black-forest-labs/flux-kontext-pro';
const REPLICATE_KONTEXT_URL = 'https://api.replicate.com/v1/models/' + KONTEXT_MODEL + '/predictions';

// ============================================================================
// ============ رفع صورة التصميم إلى Replicate للحصول على رابط عام ==========
// ============================================================================
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

// ============================================================================
// ============ توليد الرسمة الفلات عبر Kontext (image-to-image) ============
// ============================================================================
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
  if (createRes.status === 429 && attempt < 5) {
    await new Promise((r) => setTimeout(r, 12000));
    return generateFlatKontext(imageUrl, prompt, token, attempt + 1);
  }
  if (!createRes.ok || prediction.error) {
    throw new Error('Kontext (' + createRes.status + '): ' + (prediction.detail || prediction.error || ''));
  }
  let result = prediction, tries = 0;
  while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled' && tries < 90) {
    await new Promise((r) => setTimeout(r, 1500));
    const pollRes = await fetch('https://api.replicate.com/v1/predictions/' + result.id, {
      headers: { Authorization: 'Bearer ' + token },
    });
    result = await pollRes.json();
    tries++;
  }
  if (result.status !== 'succeeded') throw new Error('Kontext لم يكتمل');
  let output = result.output;
  output = Array.isArray(output) ? output[0] : output;
  if (typeof output === 'string' && output.startsWith('http')) return output;
  return null;
}

async function safeFlatKontext(imageUrl, prompt, token) {
  try { return await generateFlatKontext(imageUrl, prompt, token); } catch (e) { return null; }
}

// ============================================================================
// ============ توليد صور الخامات عبر FLUX 1.1 Pro (كما هو) =================
// ============================================================================
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
  if (createRes.status === 429 && attempt < 5) {
    await new Promise((r) => setTimeout(r, 12000));
    return generateImage(prompt, aspectRatio, token, attempt + 1);
  }
  if (!createRes.ok) throw new Error('Replicate (' + createRes.status + ')');
  if (prediction.error) throw new Error('Replicate: ' + prediction.error);
  let result = prediction, tries = 0;
  while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled' && tries < 60) {
    await new Promise((r) => setTimeout(r, 1500));
    const pollRes = await fetch('https://api.replicate.com/v1/predictions/' + result.id, {
      headers: { Authorization: 'Bearer ' + token },
    });
    result = await pollRes.json();
    tries++;
  }
  if (result.status !== 'succeeded') throw new Error('فشل توليد الصورة');
  let output = result.output;
  output = Array.isArray(output) ? output[0] : output;
  if (typeof output === 'string' && output.startsWith('http')) return output;
  return null;
}

async function safeGenerate(prompt, aspect, token) {
  try { return await generateImage(prompt, aspect, token); } catch (e) { return null; }
}

// ============================================================================
const INDUSTRY_RULES = `
معايير صناعية مرجعية لبناء التيك باك (طبّقها بذكاء حسب القطعة الفعلية، لا تخترع أرقاماً عشوائية):

# نقاط القياس (POM) — الحد الأدنى 27 نقطة لقطعة كاملة، اختَر المناسب لنوع القطعة:
للفساتين الطويلة/السهرة: Center Front Length, Center Back Length, Side Seam Length, Bust Width, Top Edge Width Front, Top Edge Width Back, Waist Width, Waist Position, High Hip Width, Low Hip Width, Thigh Width, Knee Width, Flare Break Height, Hem Sweep Front, Hem Sweep Back, Train Length, Front Neckline Drop, Back Neckline Drop, Bodice Side Height, Cup Height, Bust Point to Bust Point, CB Zipper Length, Embellishment Depth, Overlay Start Height, Boning Length, Lining Length CF, Shoulder to Bust.
لأنواع أخرى (بنطال/جاكيت/توب): استبدل بالنقاط المناسبة (Inseam, Outseam, Rise, Sleeve Length, Across Shoulder, Armhole...).

# التدرّج (XS S M L XL): الأبعاد الأفقية ~1.2-1.5 سم بين المقاسات، الأطوال ~1 سم، التفاصيل الصغيرة ~0.3 سم.
# التفاوتات: أفقي كبير ±0.6, أطوال ±1.0 إلى ±1.5, تفاصيل ±0.3 إلى ±0.5.
# BOM: القماش الرئيسي، البطانة، الخيوط، السحابات/الأزرار، الحشوات، الليبلات، الإكسسوارات الخاصة.
# تعليمات الخياطة: تسلسل منطقي حسب بناء القطعة (8 خطوات على الأقل).
`;

function extractText(content) {
  if (!Array.isArray(content)) return '';
  const t = content.find((b) => b.type === 'text');
  return t ? t.text : '';
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

function safeJsonParse(raw) {
  let s = (raw || '').trim();
  s = s.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = s.indexOf('{'), end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'مفتاح Claude غير مضبوط على الخادم' });
  const replicateToken = process.env.REPLICATE_API_TOKEN;

  try {
    const form = formidable({ maxFileSize: 12 * 1024 * 1024 });
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, flds, fls) => (err ? reject(err) : resolve([flds, fls])));
    });

    const getField = (f) => (Array.isArray(f) ? f[0] : f) || '';
    const garmentName = getField(fields.garmentName);
    const fabricInfo = getField(fields.fabricInfo);
    const brandName = getField(fields.brandName) || 'GH Couture AI';
    const season = getField(fields.season);
    const extraNotes = getField(fields.notes);

    const imageFile = files.image ? (Array.isArray(files.image) ? files.image[0] : files.image) : null;
    if (!imageFile) return res.status(400).json({ error: 'لم تُرفع صورة التصميم' });

    const imgBuffer = fs.readFileSync(imageFile.filepath);
    const base64 = imgBuffer.toString('base64');
    const mediaType = detectImageType(imgBuffer);

    const instruction = `أنتِ مصمِّمة تقنية (Technical Designer) خبيرة في إعداد التيك باك الاحترافي للمصانع.

لديكِ صورة تصميم قطعة أزياء. حلّليها بدقة عالية جداً واستخرجي كل خصائص القطعة الفعلية (نوعها، القصّة، السيلويت، الرقبة، الأكمام، الطول، التفاصيل الزخرفية، السحابات).

ثم ابني تيك باك كامل احترافي مبني على القطعة الفعلية، مطبّقةً المعايير التالية بشكل تكيّفي (لا أرقام عشوائية):

${INDUSTRY_RULES}

معلومات إضافية من المصممة:
- اسم القطعة: ${garmentName || 'استنتجيه من الصورة'}
- مواصفات القماش: ${fabricInfo || 'اقترحي خامات منطقية حسب التصميم، ووضّحي أنها اقتراح'}
- الموسم: ${season || 'غير محدد'}
- ملاحظات: ${extraNotes || 'لا يوجد'}

أرجعي النتيجة JSON فقط (بدون أي نص أو أسوار ماركداون)، بهذا الشكل:

{
  "styleCode": "STY-XXXXX",
  "garmentName": "الاسم بالإنجليزية",
  "garmentNameAr": "الاسم بالعربية",
  "category": "الفئة بالإنجليزية",
  "season": "الموسم",
  "sampleSize": "M",
  "description": "وصف دقيق للقطعة (بالعربية، سطرين)",
  "silhouette": "وصف السيلويت بالإنجليزية",
  "garmentInfo": { "type": "النوع", "silhouette": "السيلويت", "construction": "البناء", "neckline": "نوع الرقبة" },
  "flatSketchPrompt": "برومبت إنجليزي دقيق لتحويل الصورة إلى رسمة فلات تقنية عبر image-to-image. صِفي القطعة الفعلية بدقة داخله. استخدمي هذه الصياغة مع تعديل الوصف: 'Convert this garment into a clean professional fashion technical flat sketch (CAD flat drawing). Remove the model and body completely, show only the [garment description] as a flat lay garment. Thin uniform black outlines on pure white background, front view, no shading, no color, no fill, keep the exact same silhouette, neckline, seams and construction details as the original garment. Technical apparel production drawing, minimal, precise, vector style. No text, no arrows, no measurements, no watermark.'",
  "measurements": [
    { "code": "A", "pom": "اسم نقطة القياس بالإنجليزية", "tolerance": "±X.X", "sizes": { "XS":0,"S":0,"M":0,"L":0,"XL":0 } }
  ],
  "materials": [ { "name": "الخامة", "type": "النوع", "notes": "ملاحظات مع GSM تقديري" } ],
  "bom": [ { "item": "المادة", "description": "وصف", "placement": "المكان", "qty": "الكمية", "unit": "الوحدة" } ],
  "construction": [ { "section": "القسم", "detail": "التفصيل", "description": "الوصف" } ],
  "detailViews": [ { "area": "المنطقة", "detail": "التفصيل الإنشائي", "spec": "المواصفة/القياس" } ],
  "labelPlacement": [ { "label": "اسم الليبل", "location": "المكان", "size": "القياس", "method": "الطريقة" } ],
  "colorway": [ { "part": "الجزء", "pantone": "كود Pantone", "hex": "#XXXXXX" } ],
  "artwork": [ { "name": "العنصر", "placement": "المكان", "size": "القياس", "notes": "ملاحظات" } ],
  "sewingSteps": [ "خطوة 1", "... (8 خطوات على الأقل)" ],
  "materialSwatches": [ { "name": "الخامة", "swatchPrompt": "برومبت إنجليزي لصورة ماكرو قريبة للخامة. اذكري اللون الدقيق صراحةً في البداية مثل 'emerald green silk chiffon'. fabric swatch macro photography, soft even studio lighting" } ]
}

مهم جداً:
- 27 نقطة قياس على الأقل، متدرّجة منطقياً.
- flatSketchPrompt ضروري جداً — صِفي القطعة الفعلية بدقة داخله ليطلع الفلات مطابقاً.
- لا تضيفي أي خامة لم تذكرها المصممة صراحةً إن حدّدت خامات.
- materialSwatches: عنصر واحد لكل خامة رئيسية (بحد أقصى 4).
- كل الأقسام ممتلئة بمحتوى حقيقي مبني على الصورة.`;

    const payload = {
      model: MODEL,
      max_tokens: 128000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: instruction },
        ],
      }],
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: 'فشل تحليل التصميم: ' + errText.slice(0, 200) });
    }

    const data = await response.json();
    const raw = extractText(data.content);
    let techpack;
    try { techpack = safeJsonParse(raw); }
    catch (e) { return res.status(500).json({ error: 'تعذّر قراءة نتيجة التحليل، حاولي مرة ثانية' }); }

    techpack.brandName = brandName;
    techpack.generatedAt = new Date().toISOString();

    if (replicateToken) {
      const jobs = [];

      // ===== الرسمة الفلات عبر Kontext =====
      const defaultFlatPrompt =
        'Convert this garment into a clean professional fashion technical flat sketch (CAD flat drawing). ' +
        'Remove the model and body completely, show only the garment as a flat lay. ' +
        'Thin uniform black outlines on pure white background, front view, no shading, no color, no fill, ' +
        'keep the exact same silhouette, neckline, seams and construction details as the original garment. ' +
        'Technical apparel production drawing, minimal, precise, vector style. No text, no arrows, no measurements, no watermark.';
      const flatPrompt = (techpack.flatSketchPrompt && techpack.flatSketchPrompt.length > 40)
        ? techpack.flatSketchPrompt : defaultFlatPrompt;
      jobs.push(
        (async () => {
          try {
            const imgUrl = await uploadToReplicate(imgBuffer, mediaType, replicateToken);
            if (imgUrl) {
              techpack.flatSketchImage = await safeFlatKontext(imgUrl, flatPrompt, replicateToken);
            }
          } catch (e) {
            techpack.flatSketchImage = null;
          }
        })()
      );

      // ===== صور الخامات عبر FLUX =====
      const STYLE = 'professional fashion technical documentation, high quality, clean, 8k';
      const NO_TEXT = 'no text, no letters, no words, no watermark';
      const paletteHint = Array.isArray(techpack.colorway) && techpack.colorway.length
        ? 'garment color palette: ' + techpack.colorway.map((c) => (c.part||'')+' '+(c.hex||'')).join(', ') + '. '
        : '';
      const swatches = Array.isArray(techpack.materialSwatches) ? techpack.materialSwatches.slice(0,4) : [];
      const swatchResults = new Array(swatches.length);
      swatches.forEach((sw, i) => {
        if (sw && sw.swatchPrompt) {
          jobs.push(
            new Promise((r) => setTimeout(r, i * 1000))
              .then(() => safeGenerate(`${sw.swatchPrompt}. ${paletteHint}Use the exact fabric color described, do not change the color. ${STYLE}. ${NO_TEXT}.`, '1:1', replicateToken))
              .then((url) => { swatchResults[i] = { name: sw.name || '', url }; })
          );
        }
      });

      await Promise.all(jobs);
      techpack.swatchImages = swatchResults.filter((s) => s && s.url);
    }

    return res.status(200).json(techpack);
  } catch (error) {
    return res.status(500).json({ error: 'خطأ في الخادم: ' + (error.message || 'غير معروف') });
  }
}
