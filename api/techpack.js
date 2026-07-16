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
  if (createRes.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 6000));
    return generateFlatKontext(imageUrl, prompt, token, attempt + 1);
  }
  if (!createRes.ok || prediction.error) {
    throw new Error('Kontext (' + createRes.status + '): ' + (prediction.detail || prediction.error || ''));
  }
  let result = prediction, tries = 0;
  while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled' && tries < 55) {
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

// يلفّ أي وعد بمهلة قصوى — لو تجاوزها يرجّع null بدل ما يعلّق للأبد
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
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
  if (createRes.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 6000));
    return generateImage(prompt, aspectRatio, token, attempt + 1);
  }
  if (!createRes.ok) throw new Error('Replicate (' + createRes.status + ')');
  if (prediction.error) throw new Error('Replicate: ' + prediction.error);
  let result = prediction, tries = 0;
  while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled' && tries < 45) {
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
  const start = s.indexOf('{');
  if (start === -1) throw new Error('no json object found');
  s = s.slice(start);
  const end = s.lastIndexOf('}');
  let candidate = end > 0 ? s.slice(0, end + 1) : s;
  // محاولة أولى: تحويل مباشر
  try { return JSON.parse(candidate); } catch (e) {}
  // محاولة ثانية: إصلاح JSON مقطوع بإغلاق الأقواس المفتوحة
  try { return JSON.parse(repairJson(s)); } catch (e) {}
  // محاولة ثالثة: من البداية حتى آخر '}' مع الإصلاح
  return JSON.parse(repairJson(candidate));
}

// يغلق الأقواس/الأقواس المربعة المفتوحة في JSON مقطوع، ويزيل قيمة معلّقة
function repairJson(text) {
  let s = text.trim();
  // إذا انتهى داخل سلسلة نصية غير مغلقة، نقصّها عند آخر '"'
  let inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
  }
  if (inStr) {
    const lastQuote = s.lastIndexOf('"');
    if (lastQuote > 0) s = s.slice(0, lastQuote + 1);
  }
  // إزالة نهايات معلّقة: فاصلة زائدة، أو مفتاح بلا قيمة، أو قيمة جزئية
  let prev;
  do {
    prev = s;
    s = s.replace(/,\s*$/, '');
    s = s.replace(/"[^"]*"\s*:\s*$/, '');          // "key":
    s = s.replace(/"[^"]*"\s*:\s*[-\d.]+$/, '');    // "key":123 (رقم قد يكون مقطوعاً)
    s = s.replace(/,\s*$/, '');
  } while (s !== prev);
  // إعادة حساب الأقواس المفتوحة بعد التنظيف، ثم إغلاقها
  const stack = [];
  inStr = false; esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{' || c === '[') stack.push(c);
    else if (c === '}' || c === ']') stack.pop();
  }
  for (let i = stack.length - 1; i >= 0; i--) {
    s += stack[i] === '{' ? '}' : ']';
  }
  return s;
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
  "flatSketchPromptFront": "برومبت إنجليزي دقيق للرسمة الأمامية عبر image-to-image. صِفي القطعة الفعلية بدقة. استخدمي: 'Convert this garment into a clean professional fashion technical flat sketch (CAD flat drawing), FRONT view. Remove the model and body completely, show only the [garment description] as a flat lay garment. Thin uniform black outlines on pure white background, no shading, no color, no fill, keep the exact same silhouette, neckline, seams and construction details. Technical apparel production drawing, minimal, precise, vector style. No text, no arrows, no measurements, no watermark.'",
  "flatSketchPromptBack": "نفس البرومبت لكن BACK view: 'Convert this garment into a clean professional fashion technical flat sketch (CAD flat drawing), BACK view of the same garment. Show the back closure (zipper), back neckline and back seams. Remove the model and body completely, flat lay, thin uniform black outlines on pure white background, no shading, no color. Keep the exact same silhouette. Technical apparel production drawing, minimal, precise. No text, no arrows, no measurements, no watermark.'",
  "measurements": [
    { "code": "A", "pom": "اسم نقطة القياس بالإنجليزية", "view": "front|back", "anchor": "bust|topFront|topBack|waist|highHip|lowHip|thigh|knee|flareBreak|hemFront|hemBack|train|frontNeck|backNeck|zipper|cupHeight|bpToBp|sideLength|cfLength|cbLength|shoulderBust|sleeve|inseam|outseam|rise|other", "orient": "h|v", "tolerance": "±X.X", "sizes": { "XS":0,"S":0,"M":0,"L":0,"XL":0 } }
  ],
  "materials": [ { "name": "اسم الخامة بالإنجليزية", "type": "النوع", "composition": "التركيب مثل 100% Silk", "gsm": "الوزن التقديري مثل 180-220 gsm", "pantone": "كود Pantone إن أمكن", "placement": "مكان الاستخدام بالتفصيل", "notes": "وصف احترافي كامل للملمس والاستخدام (جملتان)" } ],
  "bom": [ { "item": "المادة بالإنجليزية", "description": "وصف تقني كامل مع GSM/القياس", "placement": "مكان الاستخدام", "qty": "الكمية", "unit": "الوحدة" } ],
  "construction": [ { "section": "القسم", "detail": "التفصيل", "description": "الوصف" } ],
  "detailViews": [ { "area": "المنطقة بالإنجليزية مثل Neckline / Bust Embroidery / CB Zipper / Hem", "detail": "وصف التفصيل الإنشائي", "spec": "مواصفة/قياس", "zoomPrompt": "برومبت إنجليزي لصورة تكبير (close-up macro) لهذا الجزء من القطعة الفعلية، بنفس اللون والتصميم. extreme close-up detail, technical documentation photography" } ],
  "labelPlacement": [ { "label": "اسم الليبل بالإنجليزية", "location": "المكان الدقيق", "size": "القياس", "method": "الطريقة مثل Woven/Printed/Heat-seal" } ],
  "colorway": [ { "part": "الجزء", "pantone": "كود Pantone", "hex": "#XXXXXX" } ],
  "artwork": [ { "name": "العنصر", "placement": "المكان", "size": "القياس", "notes": "ملاحظات" } ],
  "sewingSteps": [ "خطوة 1", "... (10 خطوات على الأقل)" ],
  "fitLog": [ { "version": "v0", "date": "التاريخ", "change": "وصف التغيير أو ملاحظة الفِت بالإنجليزية", "by": "GH Couture AI" } ],
  "materialSwatches": [ { "name": "الخامة", "swatchPrompt": "برومبت إنجليزي لصورة ماكرو قريبة للخامة. اذكري اللون الدقيق صراحةً في البداية مثل 'emerald green silk chiffon'. fabric swatch macro photography, soft even studio lighting" } ]
}

مهم جداً:
- 27 نقطة قياس على الأقل، متدرّجة منطقياً. كل نقطة لها view (front أو back)، anchor صحيح من القائمة، و orient (h أفقي أو v عمودي) — هذه لوضع الأسهم على الرسمة.
- flatSketchPromptFront و flatSketchPromptBack ضروريان — صِفي القطعة الفعلية بدقة داخلهما.
- المواد (materials): وصف احترافي كامل لكل خامة مع composition و gsm و pantone و placement — لا اختصار. الهدف مستوى تيك باك مصنع حقيقي.
- BOM: قائمة كاملة تشمل كل الإكسسوارات (السحاب، الخيط بلونه، hook-and-eye، الحشوات/الدعامات، الكريستال، الليبلات، أشرطة التثبيت، التغليف) — 12 بند على الأقل.
- materialSwatches: عنصر واحد لكل خامة رئيسية (بحد أقصى 4).
- detailViews: 4-6 مناطق مع zoomPrompt لكل واحدة.
- لا تضيفي أي خامة لم تذكرها المصممة صراحةً إن حدّدت خامات.
- كل الأقسام ممتلئة بمحتوى حقيقي مبني على الصورة.`;

    const payload = {
      model: MODEL,
      max_tokens: 20000,
      stream: true,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: instruction },
        ],
      }],
    };

    // نستخدم streaming: يبقي الاتصال حيّاً أثناء التحليل الطويل (لا انقطاع socket)،
    // ونجمّع النص أثناء وصوله. مهلة أمان إجمالية 180 ثانية.
    let response;
    const claudeController = new AbortController();
    const claudeTimer = setTimeout(() => claudeController.abort(), 180000);
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(payload),
        signal: claudeController.signal,
      });
    } catch (e) {
      clearTimeout(claudeTimer);
      return res.status(500).json({ error: 'انتهت مهلة تحليل التصميم، حاولي مرة ثانية' });
    }

    if (!response.ok) {
      clearTimeout(claudeTimer);
      const errText = await response.text();
      return res.status(500).json({ error: 'فشل تحليل التصميم: ' + errText.slice(0, 200) });
    }

    // قراءة تدفّق الأحداث (SSE) وتجميع نص الرد
    let raw = '';
    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          const payloadStr = t.slice(5).trim();
          if (!payloadStr || payloadStr === '[DONE]') continue;
          try {
            const evt = JSON.parse(payloadStr);
            if (evt.type === 'content_block_delta' && evt.delta && typeof evt.delta.text === 'string') {
              raw += evt.delta.text;
            }
          } catch (e) { /* تجاهل أسطر غير مكتملة */ }
        }
      }
    } catch (e) {
      clearTimeout(claudeTimer);
      return res.status(500).json({ error: 'انقطع تحليل التصميم أثناء الاستلام، حاولي مرة ثانية' });
    }
    clearTimeout(claudeTimer);

    let techpack;
    try { techpack = safeJsonParse(raw); }
    catch (e) {
      return res.status(500).json({ error: 'تعذّر قراءة نتيجة التحليل، حاولي مرة ثانية' });
    }

    techpack.brandName = brandName;
    techpack.generatedAt = new Date().toISOString();

    // توليد الصور محاط بحماية كاملة: أي خطأ هنا لا يُسقط التيك باك (500)،
    // بل يرجّع التيك باك بالنصوص والجداول + ما اكتمل من صور. التحليل نجح =
    // النتيجة تصل دائماً، فلا يضيع رصيد Claude المدفوع.
    try {
    if (replicateToken) {

      const STYLE = 'professional fashion technical documentation, high quality, clean, 8k';
      const NO_TEXT = 'no text, no letters, no words, no watermark';
      const paletteHint = Array.isArray(techpack.colorway) && techpack.colorway.length
        ? 'garment color palette: ' + techpack.colorway.map((c) => (c.part||'')+' '+(c.hex||'')).join(', ') + '. '
        : '';
      const gap = () => new Promise((r) => setTimeout(r, 1200)); // فاصل بين الطلبات لتفادي 429

      // ===== 1) الرسمة الفلات (أمامي + خلفي) عبر Kontext =====
      const defaultFront =
        'Convert this garment into a clean professional fashion technical flat sketch (CAD flat drawing) showing BOTH the FRONT view and the BACK view side by side on the same sheet. ' +
        'Front view on the left, back view on the right (showing the back closure/zipper, back neckline and back seams). ' +
        'Remove the model and body completely, show only the garment as flat lay drawings. ' +
        'Thin uniform black outlines on pure white background, no shading, no color, no fill, ' +
        'keep the exact same silhouette, neckline, seams and construction details. ' +
        'Technical apparel production drawing, minimal, precise, vector style. No text, no arrows, no measurements, no watermark.';
      const frontPrompt = (techpack.flatSketchPromptFront && techpack.flatSketchPromptFront.length > 40)
        ? techpack.flatSketchPromptFront : defaultFront;

      let uploadedUrl = null;
      try { uploadedUrl = await withTimeout(uploadToReplicate(imgBuffer, mediaType, replicateToken), 20000); } catch (e) { uploadedUrl = null; }

      if (uploadedUrl) {
        const u = await withTimeout(safeFlatKontext(uploadedUrl, frontPrompt, replicateToken), 110000);
        if (u) { techpack.flatSketchFront = u; techpack.flatSketchImage = u; }
      }

      // ===== 2) صور الخامات — واحدة تلو الأخرى (تفادي 429) =====
      const swatches = Array.isArray(techpack.materialSwatches) ? techpack.materialSwatches.slice(0,4) : [];
      const swatchResults = [];
      for (const sw of swatches) {
        if (sw && sw.swatchPrompt) {
          await gap();
          const url = await withTimeout(
            safeGenerate(`${sw.swatchPrompt}. ${paletteHint}Use the exact fabric color described, do not change the color. ${STYLE}. ${NO_TEXT}.`, '1:1', replicateToken),
            70000
          );
          if (url) swatchResults.push({ name: sw.name || '', url });
        }
      }
      techpack.swatchImages = swatchResults;

      // ===== 3) صور تكبير الأجزاء — واحدة تلو الأخرى =====
      const details = Array.isArray(techpack.detailViews) ? techpack.detailViews.slice(0,2) : [];
      for (let i = 0; i < details.length; i++) {
        const dv = details[i];
        if (dv && dv.zoomPrompt) {
          await gap();
          const url = await withTimeout(
            safeGenerate(`${dv.zoomPrompt}. ${paletteHint}Use the exact garment color. ${STYLE}. ${NO_TEXT}.`, '1:1', replicateToken),
            70000
          );
          if (url) techpack.detailViews[i].image = url;
        }
      }
    }
    } catch (imgErr) {
      // خطأ في مرحلة الصور لا يُسقط التيك باك — نرجّعه بما توفّر.
      if (!Array.isArray(techpack.swatchImages)) techpack.swatchImages = [];
    }

    return res.status(200).json(techpack);
  } catch (error) {
    return res.status(500).json({ error: 'خطأ في الخادم: ' + (error.message || 'غير معروف') });
  }
}
