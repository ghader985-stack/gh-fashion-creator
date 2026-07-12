// api/techpack.js
// يستقبل صورة تصميم (سكتش يدوي، صورة AI، أو صورة قطعة) + مواصفات القماش من المصممة
// يحلّلها عبر Claude Vision ويرجّع تيك باك كامل منظّم (JSON) جاهز للعرض

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

const MODEL = 'claude-sonnet-5';
const FLUX_MODEL = 'black-forest-labs/flux-1.1-pro';
const REPLICATE_URL =
  'https://api.replicate.com/v1/models/' + FLUX_MODEL + '/predictions';
// موديل Qwen Image Edit Plus — يحوّل صورة القطعة الفعلية إلى رسمة تقنية مطابقة
const QWEN_MODEL = 'qwen/qwen-image-edit-plus';
const QWEN_URL =
  'https://api.replicate.com/v1/models/' + QWEN_MODEL + '/predictions';

// يحوّل صورة القطعة المرفوعة (base64 data URI) إلى رسمة تقنية مسطّحة أمامي/خلفي
// عبر Qwen Image Edit — النتيجة مطابقة للتصميم لأنها مبنية على الصورة الفعلية
async function generateFlatSketch(imageDataUri, instruction, token, attempt = 0) {
  const createRes = await fetch(QWEN_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({
      input: {
        image: [imageDataUri],
        prompt: instruction,
        output_format: 'png',
      },
    }),
  });
  const bodyText = await createRes.text();
  let prediction;
  try { prediction = JSON.parse(bodyText); } catch (e) { throw new Error('Qwen رد غير متوقع: ' + bodyText.slice(0, 120)); }
  if (createRes.status === 429 && attempt < 5) {
    await new Promise((r) => setTimeout(r, 12000));
    return generateFlatSketch(imageDataUri, instruction, token, attempt + 1);
  }
  if (!createRes.ok || prediction.error) {
    throw new Error('Qwen فشل (' + createRes.status + '): ' + (prediction.detail || prediction.error || bodyText.slice(0, 120)));
  }
  let result = prediction;
  let tries = 0;
  while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled' && tries < 60) {
    await new Promise((r) => setTimeout(r, 1500));
    const pollRes = await fetch('https://api.replicate.com/v1/predictions/' + result.id, {
      headers: { Authorization: 'Bearer ' + token },
    });
    result = await pollRes.json();
    tries++;
  }
  if (result.status !== 'succeeded') throw new Error('Qwen لم يكتمل');
  const output = result.output;
  return Array.isArray(output) ? output[0] : output;
}

async function safeFlatSketch(imageDataUri, instruction, token) {
  try { return await generateFlatSketch(imageDataUri, instruction, token); } catch (e) { return null; }
}

// يرفع الصورة إلى Replicate ويرجّع رابط https عام (بدل base64 المحدود بـ1MB)
async function uploadToReplicate(buffer, mediaType, token) {
  const ext = mediaType.split('/')[1] || 'jpg';
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
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
    },
    body: body,
  });
  if (!res.ok) throw new Error('فشل رفع الصورة (' + res.status + ')');
  const data = await res.json();
  // الرابط العام للملف المرفوع
  return data.urls && data.urls.get ? data.urls.get : null;
}

// توليد صورة واحدة عبر Replicate FLUX (مع إعادة محاولة عند الازدحام 429)
async function generateImage(prompt, aspectRatio, token, attempt = 0) {
  const createRes = await fetch(REPLICATE_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({
      input: {
        prompt: prompt,
        aspect_ratio: aspectRatio,
        output_format: 'jpg',
        output_quality: 95,
        safety_tolerance: 2,
      },
    }),
  });

  const bodyText = await createRes.text();
  let prediction;
  try {
    prediction = JSON.parse(bodyText);
  } catch (e) {
    throw new Error('رد غير متوقع من Replicate');
  }

  if (createRes.status === 429 && attempt < 5) {
    await new Promise((r) => setTimeout(r, 12000));
    return generateImage(prompt, aspectRatio, token, attempt + 1);
  }
  if (!createRes.ok) {
    throw new Error('Replicate (' + createRes.status + ')');
  }
  if (prediction.error) {
    throw new Error('Replicate: ' + prediction.error);
  }

  let result = prediction;
  let tries = 0;
  while (
    result.status !== 'succeeded' &&
    result.status !== 'failed' &&
    result.status !== 'canceled' &&
    tries < 60
  ) {
    await new Promise((r) => setTimeout(r, 1500));
    const pollRes = await fetch(
      'https://api.replicate.com/v1/predictions/' + result.id,
      { headers: { Authorization: 'Bearer ' + token } }
    );
    result = await pollRes.json();
    tries++;
  }
  if (result.status !== 'succeeded') {
    throw new Error('فشل توليد الصورة');
  }
  const output = result.output;
  return Array.isArray(output) ? output[0] : output;
}

// توليد صورة مع تجاهل الفشل (لا نُسقط التيك باك كله لو فشلت صورة توضيحية)
async function safeGenerate(prompt, aspect, token) {
  try {
    return await generateImage(prompt, aspect, token);
  } catch (e) {
    return null;
  }
}

// قواعد صناعية ثابتة يمشي عليها التحليل — مش قوالب جامدة، بل مرجع معايير
// النموذج يستخرج خصائص القطعة من الصورة ويطبّق عليها هذه القواعد بشكل تكيّفي
const INDUSTRY_RULES = `
معايير صناعية مرجعية لبناء التيك باك (طبّقها بذكاء حسب القطعة الفعلية في الصورة، لا تخترع أرقاماً عشوائية):

# نقاط القياس (POM) — تُختار حسب نوع القطعة وخصائصها:
- الفساتين: طول الكتف، عرض الصدر (Bust)، عرض الخصر (Waist)، عرض الورك (Hip)، طول التنورة (Skirt Length)، الطول الكلي (Total Length HPS to hem)، فتحة الرقبة، عرض الكتف، محيط الإبط (Armhole)، طول الكم إن وُجد، عرض فتحة الكم.
- الجاكيت/البليزر: عرض الصدر، عرض الخصر، عرض الذيل (Hem)، عرض الكتف (Across Shoulder)، طول الظهر (Center Back Length)، طول الكم، عرض الريفير (Lapel)، فتحة الرقبة.
- البناطيل: محيط الخصر، محيط الورك، عرض الفخذ (Thigh), طول الساق الداخلي (Inseam)، طول الساق الخارجي (Outseam)، عرض أسفل الساق (Leg Opening), عمق المقعدة (Rise).
- التنانير: محيط الخصر، محيط الورك، الطول الكلي، عرض الذيل.
- التوب/البلوزة: عرض الصدر، عرض الخصر، الطول، عرض الكتف، طول الكم، فتحة الرقبة.

# قواعد التدرّج (Grading) بين المقاسات (XS S M L XL) — قيم قياسية:
- الفروقات الأفقية (صدر/خصر/ورك): تقريباً 4 سم بين كل مقاس (قابلة للتعديل حسب القطعة).
- الأطوال: تقريباً 1-1.5 سم بين كل مقاس.
- عرض الكتف: تقريباً 1 سم بين كل مقاس.

# التفاوتات (Tolerance) القياسية:
- القياسات الأفقية الكبيرة (صدر/خصر/ورك): ±1.0 سم
- الأطوال: ±1.0 سم
- التفاصيل الصغيرة (فتحات، جيوب): ±0.3 إلى ±0.5 سم

# قائمة المواد (BOM) — العناصر الأساسية حسب القطعة:
القماش الرئيسي، البطانة، الخيوط، السحابات/الأزرار، الحشوات إن لزم، الليبل، ليبل العناية، أي إكسسوارات خاصة بالتصميم.

# تعليمات الخياطة: تسلسل منطقي حسب بناء القطعة الفعلي.
`;

function extractText(content) {
  if (!Array.isArray(content)) return '';
  const textBlock = content.find((b) => b.type === 'text');
  return textBlock ? textBlock.text : '';
}

// يكتشف نوع الصورة الحقيقي من أول بايتات الملف (magic bytes)
// بدل الاعتماد على الامتداد الذي يرسله المتصفح، لأنه قد يكون غير مطابق
function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return 'image/jpeg';
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif';
  // WEBP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return 'image/webp';
  // افتراضي آمن
  return 'image/jpeg';
}

function safeJsonParse(raw) {
  let s = (raw || '').trim();
  // إزالة أسوار الماركداون إن وُجدت
  s = s.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // التقاط من أول قوس فتح لآخر قوس إغلاق
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  return JSON.parse(s);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'مفتاح Claude غير مضبوط على الخادم' });
  }
  const replicateToken = process.env.REPLICATE_API_TOKEN;

  try {
    const form = formidable({ maxFileSize: 12 * 1024 * 1024 });
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, flds, fls) => {
        if (err) reject(err);
        else resolve([flds, fls]);
      });
    });

    const getField = (f) => (Array.isArray(f) ? f[0] : f) || '';
    const garmentName = getField(fields.garmentName);
    const fabricInfo = getField(fields.fabricInfo);
    const brandName = getField(fields.brandName) || 'GH Couture AI';
    const season = getField(fields.season);
    const extraNotes = getField(fields.notes);

    const imageFile = files.image
      ? Array.isArray(files.image)
        ? files.image[0]
        : files.image
      : null;

    if (!imageFile) {
      return res.status(400).json({ error: 'لم تُرفع صورة التصميم' });
    }

    const imgBuffer = fs.readFileSync(imageFile.filepath);
    const base64 = imgBuffer.toString('base64');
    // نكتشف النوع الحقيقي من محتوى الملف بدل الامتداد الذي يرسله المتصفح
    const mediaType = detectImageType(imgBuffer);

    const instruction = `أنتِ مصمِّمة تقنية (Technical Designer) خبيرة في إعداد التيك باك الاحترافي للمصانع.

لديكِ صورة تصميم قطعة أزياء (قد تكون سكتش يدوي، أو صورة مولّدة بالذكاء الاصطناعي، أو صورة قطعة حقيقية). حلّلي الصورة بدقة عالية جداً، واستخرجي منها كل الخصائص الفعلية للقطعة (نوعها، القصّة، وجود الأكمام وطولها، الطول العام، فتحة الرقبة، الياقة، الجيوب، السحابات، التفاصيل الزخرفية).

ثم ابني تيك باك كامل احترافي مبني على القطعة الفعلية في الصورة، مطبّقةً المعايير الصناعية المرجعية التالية بشكل تكيّفي (لا تخترعي أرقاماً عشوائية — استخدمي المعايير القياسية واضبطيها حسب خصائص القطعة الظاهرة):

${INDUSTRY_RULES}

معلومات إضافية من المصممة:
- اسم القطعة/التصميم: ${garmentName || 'استنتجيه من الصورة'}
- مواصفات القماش التي حددتها المصممة: ${fabricInfo || 'اقترحي خامات منطقية حسب التصميم، ووضّحي أنها اقتراح'}
- الموسم: ${season || 'غير محدد'}
- ملاحظات: ${extraNotes || 'لا يوجد'}

أرجعي النتيجة بصيغة JSON فقط (بدون أي نص قبله أو بعده، بدون أسوار ماركداون)، بهذا الشكل تماماً:

{
  "styleCode": "كود ستايل احترافي مثل STY-XXXXX",
  "garmentName": "اسم القطعة بالإنجليزية",
  "garmentNameAr": "اسم القطعة بالعربية",
  "category": "الفئة بالإنجليزية",
  "season": "الموسم",
  "description": "وصف دقيق للقطعة كما ظهرت في الصورة (بالعربية، سطرين)",
  "silhouette": "وصف السيلويت والقصّة بالإنجليزية",
  "garmentInfo": { "type": "نوع القطعة بالإنجليزية", "silhouette": "وصف السيلويت", "construction": "وصف البناء العام" },
  "sampleSize": "المقاس الأساسي مثل M",
  "measurements": [
    { "code": "A", "pom": "اسم نقطة القياس بالإنجليزية", "tolerance": "±X.X", "sizes": { "XS": 0, "S": 0, "M": 0, "L": 0, "XL": 0 } }
  ],
  "bom": [
    { "item": "اسم المادة بالإنجليزية", "description": "وصف", "placement": "مكان الاستخدام", "qty": "الكمية", "unit": "الوحدة" }
  ],
  "materials": [
    { "name": "اسم الخامة", "type": "نوعها", "notes": "ملاحظات (وزن GSM تقديري إن أمكن، مع الإشارة أنه تقديري)" }
  ],
  "construction": [
    { "section": "القسم بالإنجليزية", "detail": "نوع التفصيل", "description": "الوصف بالإنجليزية" }
  ],
  "sewingSteps": [
    "خطوة الخياطة 1 بالإنجليزية",
    "خطوة الخياطة 2 بالإنجليزية"
  ],
  "colorway": [
    { "part": "الجزء", "pantone": "كود Pantone تقديري", "hex": "#XXXXXX" }
  ],
  "artwork": [
    { "name": "اسم العنصر مثل Main Label", "placement": "مكانه", "size": "قياسه التقديري", "notes": "ملاحظات" }
  ],
  "detailViews": [
    { "area": "المنطقة بالإنجليزية مثل Neckline / Cuff / Pocket", "detail": "وصف التفصيل الإنشائي بالإنجليزية", "spec": "مواصفة تقنية أو قياس تقديري" }
  ],
  "labelPlacement": [
    { "label": "اسم الليبل بالإنجليزية مثل Main Brand Label", "location": "المكان الدقيق على القطعة", "size": "القياس التقديري", "method": "طريقة التثبيت مثل Woven / Printed / Heat-seal" }
  ],
  "flatSketchPrompt": "برومبت إنجليزي مفصّل لتوليد رسمة تقنية عبر Recraft vector. صف القطعة الفعلية بدقة، واطلب أسهم قياس بأحرف مرجعية. استخدم هذه الصياغة مع تعديل وصف القطعة: 'Technical fashion flat sketch of a [garment description], FRONT view and BACK view side by side. Thin clean black vector outlines on plain white background, flat design, no color, no shading. Add measurement dimension lines with double-headed arrows at bust, waist, hip, length and hem, each arrow labeled with a small circled reference letter A B C D E F. Apparel production CAD technical drawing, precise minimal uniform stroke weight.'",
  "materialSwatches": [
    { "name": "اسم الخامة", "swatchPrompt": "برومبت إنجليزي لصورة قريبة جداً (close-up macro) لعينة القماش/الخامة. مهم جداً: اذكري اللون الدقيق للخامة كما هو في التصميم الفعلي صراحةً في بداية البرومبت (مثلاً 'emerald green silk chiffon fabric swatch'). لا تتركي اللون للصدفة. fabric swatch macro photography, soft even studio lighting" }
  ]
}

مهم جداً:
- القياسات لازم تكون منطقية ومتدرّجة بشكل صحيح بين المقاسات.
- كل الأقسام مطلوبة وممتلئة بمحتوى حقيقي مبني على الصورة.
- إن كانت خامة مقترحة منكِ (وليست من المصممة)، أشيري لذلك في notes.
- استخدمي أكواد Pantone و Hex منطقية للألوان الظاهرة في التصميم فعلاً.
- flatSketchPrompt و materialSwatches ضروريان لتوليد الرسومات التوضيحية — اكتبيهما بدقة تصف القطعة والخامات الفعلية.
- materialSwatches: عنصر واحد لكل خامة رئيسية (بحد أقصى 4 خامات).
- كل نقطة قياس لها رمز حرفي متسلسل (A, B, C, D...) في حقل code — هذه الرموز تُطابق الأسهم على الرسمة التقنية مع صفوف جدول القياسات (معيار صناعي).`;

    const payload = {
      model: MODEL,
      max_tokens: 128000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: instruction },
          ],
        },
      ],
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: 'فشل تحليل التصميم: ' + errText.slice(0, 200) });
    }

    const data = await response.json();
    const raw = extractText(data.content);

    let techpack;
    try {
      techpack = safeJsonParse(raw);
    } catch (e) {
      return res.status(500).json({ error: 'تعذّر قراءة نتيجة التحليل، حاولي مرة ثانية' });
    }

    techpack.brandName = brandName;
    techpack.generatedAt = new Date().toISOString();

    // توليد الرسومات التوضيحية عبر Replicate (رسمة تقنية + صور خامات)
    // نولّدها بالتوازي مع تجاهل الفشل حتى لا يسقط التيك باك كله
    if (replicateToken) {
      const STYLE = 'professional fashion technical documentation, high quality, clean, 8k';
      const NO_TEXT = 'no text, no letters, no words, no watermark';

      const jobs = [];

      // الرسمة التقنية المسطّحة عبر Qwen: تحويل صورة القطعة الفعلية إلى رسمة مطابقة
      const flatInstruction =
        'Convert this garment into a clean professional technical flat sketch (fashion CAD flat drawing). Show the garment FRONT view and BACK view side by side, on a plain white background. Use thin clean black outlines only, no model, no body, keep the exact same garment shape, silhouette, seams, neckline, and construction details as the original. Flat technical apparel drawing style, no shading, no arrows, no measurements, no text.';
      // نرفع الصورة لـ Replicate أولاً للحصول على رابط (base64 محدود بـ1MB وصورة التصميم أكبر)
      jobs.push(
        (async () => {
          try {
            const imgUrl = await uploadToReplicate(imgBuffer, mediaType, replicateToken);
            if (imgUrl) {
              techpack.flatSketchImage = await safeFlatSketch(imgUrl, flatInstruction, replicateToken);
            }
          } catch (e) {
            techpack.flatSketchImage = null;
          }
        })()
      );

      // صور الخامات (بحد أقصى 4)
      // نبني تلميح لون من ألوان التصميم لمنع انحراف اللون في الخامات
      const paletteHint = Array.isArray(techpack.colorway) && techpack.colorway.length
        ? 'garment color palette: ' + techpack.colorway.map((c) => (c.part || '') + ' ' + (c.hex || '')).join(', ') + '. '
        : '';
      const swatches = Array.isArray(techpack.materialSwatches)
        ? techpack.materialSwatches.slice(0, 4)
        : [];
      techpack.swatchImages = [];
      const swatchResults = new Array(swatches.length);
      swatches.forEach((sw, i) => {
        if (sw && sw.swatchPrompt) {
          jobs.push(
            new Promise((r) => setTimeout(r, i * 1000))
              .then(() =>
                safeGenerate(
                  `${sw.swatchPrompt}. ${paletteHint}Use the exact fabric color described, do not change the color. ${STYLE}. ${NO_TEXT}.`,
                  '1:1',
                  replicateToken
                )
              )
              .then((url) => {
                swatchResults[i] = { name: sw.name || '', url };
              })
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
