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
  "measurements": [
    { "code": "A", "pom": "اسم نقطة القياس بالإنجليزية", "view": "front|back", "tolerance": "±X.X", "sizes": { "XS":0,"S":0,"M":0,"L":0,"XL":0 } }
  ],
  "materials": [ { "name": "اسم الخامة بالإنجليزية", "type": "النوع", "composition": "التركيب مثل 100% Silk", "gsm": "الوزن التقديري مثل 180-220 gsm", "pantone": "كود Pantone إن أمكن", "placement": "موضع الاستخدام بالإنجليزية التقنية فقط، بصياغة مصانع الأزياء مثل: Bodice, waist panels and upper skirt / Center back seam / Flare skirt overlay and train. لا تترجمي المصطلحات حرفياً إلى العربية", "notes": "وصف احترافي كامل للملمس والاستخدام (جملتان)" } ],
  "bom": [ { "item": "المادة بالإنجليزية", "description": "وصف تقني كامل مع GSM/القياس", "placement": "موضع الاستخدام بالإنجليزية التقنية فقط", "qty": "الكمية", "unit": "الوحدة" } ],
  "construction": [ { "section": "القسم", "detail": "التفصيل", "description": "الوصف" } ],
  "detailViews": [ { "area": "المنطقة بالإنجليزية مثل Neckline / Bust Embroidery / CB Zipper / Hem", "detail": "وصف التفصيل الإنشائي", "spec": "مواصفة/قياس" } ],
  "labelPlacement": [ { "label": "اسم الليبل بالإنجليزية", "location": "المكان الدقيق", "size": "القياس", "method": "الطريقة مثل Woven/Printed/Heat-seal" } ],
  "colorway": [ { "part": "الجزء", "pantone": "كود Pantone", "hex": "#XXXXXX" } ],
  "artwork": [ { "name": "العنصر", "placement": "الموضع بالإنجليزية التقنية", "size": "القياس", "notes": "ملاحظات" } ],
  "sewingSteps": [ "خطوة 1", "... (10 خطوات على الأقل)" ],
  "fitLog": [ { "version": "v0", "date": "التاريخ", "change": "وصف التغيير أو ملاحظة الفِت بالإنجليزية", "by": "GH Couture AI" } ],
  "materialsPagePrompt": "برومبت إنجليزي واحد لصورة صفحة الخامات: صورة فوتوغرافية علوية (flat lay) لعيّنات قماش وتريمات حقيقية مرتّبة بصفوف على سطح أبيض — كل عيّنة قطعة نسيج فعلية لها ملمس ونسيج وثنيات وظلال ناعمة، مثل لوحة عيّنات المصمّم. اذكري كل خامة بلونها الدقيق، واذكري التريمات ككائنات حقيقية (شريط سحاب، شريحة boning، بكرة خيط، hook-and-eye، كريستالات، ليبل منسوج). أضيفي صراحةً: NOT a flat color chart, NOT wallpaper, NOT solid color squares, NOT a digital swatch grid. صياغة: 'Overhead flat lay photograph of real fabric and trim samples arranged in tidy rows on a white surface, each with visible weave, texture and soft folds... Professional macro product photography.'",
  "detailsPagePrompt": "برومبت إنجليزي واحد لصفحة التفاصيل: شبكة من ست لقطات ماكرو قريبة لنفس القطعة تماماً (bust embroidery, neckline, CB zipper, waist seam, hem, crystal scatter). يجب التشديد: reproduce the garment exactly as in the reference image; do NOT add sheer panels, mesh, chiffon yokes, straps or sleeves that are not in the reference; use the exact same fabric colors and embroidery. صياغة: 'Close-up macro photographs of this exact garment arranged as a neat grid on white... same fabric colors and embroidery as the reference.'"
}

مهم جداً:
- 27 نقطة قياس على الأقل، متدرّجة منطقياً. كل نقطة لها view (front أو back).
- المواد (materials): يجب أن تشمل نوعين — (أ) الأقمشة الرئيسية، و(ب) كل التريمات والإكسسوارات: السحاب، الخيط بلونه، hook-and-eye، الدعامات/العظام (boning)، شريط الدعم، الكريستال/الخرز، الليبلات (رئيسي + عناية)، الحشوات، التغليف. لكل عنصر composition/gsm/pantone/placement حين ينطبق ووصف احترافي. الحد الأدنى 10 عناصر. لا اختصار.
- BOM: قائمة كاملة تشمل كل الإكسسوارات — 12 بند على الأقل.
- detailViews: 4-6 مناطق (نصوص فقط، بدون برومبت لكل واحدة).
- materialsPagePrompt: يصف تصويراً فوتوغرافياً لعيّنات قماش وتريمات حقيقية بملمس وثنيات وظلال — لا مربّعات لون ولا شبكة رقمية ولا ورق جدران.
- detailsPagePrompt: يصف لقطات ماكرو لنفس القطعة تماماً بألوانها وتطريزها الحقيقيين، مع منع صريح لإضافة أي قماش شفاف أو ياقة أو حمّالات أو أكمام غير موجودة في الصورة.
- لا تضيفي أي خامة لم تذكرها المصممة صراحةً إن حدّدت خامات.
- كل الأقسام ممتلئة بمحتوى حقيقي مبني على الصورة.`;

    const payload = {
      model: MODEL,
      max_tokens: 14000,
      stream: true,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: instruction },
        ],
      }],
    };

    // مهلة "خمول" لا مهلة ثابتة: طالما النص يتدفّق، لا نقطع أبداً.
    // نقطع فقط إذا توقّف الوصول 30 ثانية، أو عند سقف مطلق 175 ثانية.
    const IDLE_MS = 30000;
    const HARD_MS = 185000;
    const claudeController = new AbortController();
    let idleTimer = null;
    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => claudeController.abort(), IDLE_MS);
    };
    const hardTimer = setTimeout(() => claudeController.abort(), HARD_MS);
    const clearClaudeTimers = () => { if (idleTimer) clearTimeout(idleTimer); clearTimeout(hardTimer); };
    resetIdle();

    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(payload),
        signal: claudeController.signal,
      });
    } catch (e) {
      clearClaudeTimers();
      return res.status(500).json({ error: 'انتهت مهلة تحليل التصميم، حاولي مرة ثانية' });
    }

    if (!response.ok) {
      clearClaudeTimers();
      const errText = await response.text();
      return res.status(500).json({ error: 'فشل تحليل التصميم: ' + errText.slice(0, 200) });
    }

    // قراءة تدفّق الأحداث (SSE) وتجميع نص الرد.
    // ندعم نوعَي التدفّق: Web ReadableStream (getReader) و Node Readable (async iterator)
    // حتى لا يفشل الاستلام حسب بيئة التشغيل.
    let raw = '';
    const decoder = new TextDecoder();
    let buffer = '';
    const consumeChunk = (chunk) => {
      resetIdle(); // وصلت بيانات ⇒ نُصفّر مؤقّت الخمول فلا يُقطع تحليل شغّال
      buffer += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
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
        } catch (e) { /* سطر غير مكتمل — يُكمَّل في الدفعة التالية */ }
      }
    };

    try {
      const body = response.body;
      if (body && typeof body.getReader === 'function') {
        const reader = body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          consumeChunk(value);
        }
      } else if (body && typeof body[Symbol.asyncIterator] === 'function') {
        for await (const chunk of body) consumeChunk(chunk);
      } else {
        // لا تدفّق متاح — نقرأ الرد كاملاً كنص
        const full = await response.text();
        full.split('\n').forEach((l) => consumeChunk(l + '\n'));
      }
    } catch (e) {
      // انقطاع أثناء الاستلام: لا نُهدر ما وصل — نكمل بما جُمِّع ونصلحه لاحقاً
    }
    clearClaudeTimers();

    if (!raw || raw.trim().length < 40) {
      return res.status(500).json({ error: 'انقطع تحليل التصميم أثناء الاستلام، حاولي مرة ثانية' });
    }

    let techpack;
    try { techpack = safeJsonParse(raw); }
    catch (e) {
      return res.status(500).json({ error: 'تعذّر قراءة نتيجة التحليل، حاولي مرة ثانية' });
    }
    if (!techpack || typeof techpack !== 'object' || Array.isArray(techpack)) {
      return res.status(500).json({ error: 'تعذّر قراءة نتيجة التحليل، حاولي مرة ثانية' });
    }

    techpack.brandName = brandName;
    techpack.generatedAt = new Date().toISOString();

    // الصور تُولَّد في نقطة نهاية منفصلة (/api/techpack-images) لكي يحصل كل
    // طور على سقف 5 دقائق مستقل — فلا يزاحم التحليلُ الصورَ على وقت واحد.
    return res.status(200).json(techpack);
  } catch (error) {
    return res.status(500).json({ error: 'خطأ في الخادم: ' + (error.message || 'غير معروف') });
  }
}
