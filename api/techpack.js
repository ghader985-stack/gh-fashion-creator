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

function safeJsonParse(raw) {
  let s = (raw || '').trim();
  // إزالة أسوار الماركداون إن وُجدت
  s = s.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // محاولة التقاط أول كائن JSON
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
    const mediaType = imageFile.mimetype || 'image/jpeg';

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
  "sampleSize": "المقاس الأساسي مثل M",
  "measurements": [
    { "pom": "اسم نقطة القياس بالإنجليزية", "tolerance": "±X.X", "sizes": { "XS": 0, "S": 0, "M": 0, "L": 0, "XL": 0 } }
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
  ]
}

مهم جداً:
- القياسات لازم تكون منطقية ومتدرّجة بشكل صحيح بين المقاسات.
- كل الأقسام مطلوبة وممتلئة بمحتوى حقيقي مبني على الصورة.
- إن كانت خامة مقترحة منكِ (وليست من المصممة)، أشيري لذلك في notes.
- استخدمي أكواد Pantone و Hex منطقية للألوان الظاهرة في التصميم فعلاً.`;

    const payload = {
      model: MODEL,
      max_tokens: 4000,
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

    return res.status(200).json(techpack);
  } catch (error) {
    return res.status(500).json({ error: 'خطأ في الخادم: ' + (error.message || 'غير معروف') });
  }
}
