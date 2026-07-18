// api/techpack.js
// الطور 1: يستقبل صورة تصميم + مواصفات، يحلّلها عبر Claude Vision،
// ويرجّع تيك باك كامل (JSON) بهيكل مطابق حرفياً لنموذج Adstronaut:
// مقاسات رقمية 2-12 مع عيّنة 6، أوصاف POM كاملة، 14 خامة مرتّبة = BOM،
// تسميات صفحة القياسات المشروحة، وخريطة الترقيم لصفحة الـ Callout.
// الصور تُولَّد في الطور 2 (/api/techpack-images).

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

const MODEL = 'claude-sonnet-5';

// ============================================================================
const INDUSTRY_RULES = `
معايير مرجعية (طبّقيها حسب القطعة الفعلية، لا أرقام عشوائية):
# نقاط القياس: 26 نقطة على الأقل. للفساتين الطويلة: CF Length, CB Length, Side Seam Length, Bust Width, Top Edge Width Front/Back, Waist Width, Waist Position, High Hip, Low Hip, Thigh, Knee Width at Flare Break, Flare Break Height, Hem Sweep Front, Hem Sweep Back incl. Train, Train Length, Front/Back Neckline Drop, Bodice Side Height, Cup Height, BP to BP, CB Zipper Length, Embellishment Depth, Overlay Start Height, Boning Length, Lining Length CF, Shoulder to Bust. لأنواع أخرى استبدلي بالمناسب (Inseam, Outseam, Rise, Sleeve Length, Across Shoulder, Armhole...).
# التدرّج بين المقاسات المتتالية: الأبعاد الأفقية ~1.2-1.5 سم، الأطوال ~0.5-1 سم، التفاصيل الصغيرة ~0.3 سم. قياسات ثابتة عبر المقاسات (مثل Train Length) تبقى ثابتة.
# التفاوتات بصيغة "+-X.X": أفقي كبير +-0.6، أطوال +-1.0 إلى +-2.5، تفاصيل +-0.3 إلى +-0.5.
# تعليمات الخياطة: تسلسل مصنع منطقي، 16 خطوة على الأقل.
`;

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
  try { return JSON.parse(candidate); } catch (e) {}
  try { return JSON.parse(repairJson(s)); } catch (e) {}
  return JSON.parse(repairJson(candidate));
}

function repairJson(text) {
  let s = text.trim();
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
  let prev;
  do {
    prev = s;
    s = s.replace(/,\s*$/, '');
    s = s.replace(/"[^"]*"\s*:\s*$/, '');
    s = s.replace(/"[^"]*"\s*:\s*[-\d.]+$/, '');
    s = s.replace(/,\s*$/, '');
  } while (s !== prev);
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

    const today = new Date();
    const yymmdd = today.toISOString().slice(2, 10).replace(/-/g, '');

    const instruction = `أنتِ مصمِّمة تقنية (Technical Designer) خبيرة تبني تيك باك بمعيار منصات المصانع الاحترافية.

حلّلي صورة القطعة بدقة عالية جداً واستخرجي خصائصها الفعلية (النوع، القصّة، السيلويت، الرقبة، الطول، الإغلاق، التفاصيل الزخرفية) ثم ابني تيك باك كاملاً:

${INDUSTRY_RULES}

معلومات المصممة:
- اسم القطعة: ${garmentName || 'استنتجيه من الصورة'}
- مواصفات القماش: ${fabricInfo || 'اقترحي خامات منطقية حسب التصميم'}
- الموسم: ${season || 'استنتجيه'}
- ملاحظات: ${extraNotes || 'لا يوجد'}

أرجعي JSON فقط (بدون أي نص أو أسوار ماركداون) بهذا الشكل الحرفي:

{
  "styleCode": "STY_XXXXXX_${yymmdd}_XXXX",
  "garmentName": "الاسم الوصفي الكامل بالإنجليزية مثل: Emerald Strapless Sweetheart Mermaid Evening Gown with Embroidered Tulle Bust",
  "garmentNameAr": "الاسم بالعربية",
  "category": "الفئة بالإنجليزية مثل Dresses",
  "season": "الموسم مثل SS26",
  "sizeRange": "2 - 12",
  "sampleSize": "6",
  "fabricSummary": "سطر إنجليزي واحد يلخّص الأقمشة الرئيسية للهيدر مثل: Emerald duchess satin with lightweight silk chiffon train overlay",
  "description": "وصف دقيق للقطعة بالعربية، سطران",
  "garmentInfo": { "type": "بالإنجليزية مثل Strapless formal evening gown", "silhouette": "بالإنجليزية", "construction": "بالإنجليزية" },
  "measurements": [
    { "pom": "الاسم بالإنجليزية مع وصف كامل بين قوسين مثل: Center Front Length (top edge of bodice at CF V-point to front hem edge)", "view": "front|back", "tolerance": "+-1.0", "sizes": { "2": 130.0, "4": 131.0, "6": 132, "8": 133.0, "10": 134.0, "12": 135.0 } }
  ],
  "specSheetLabels": {
    "front": ["FRONT NECKLINE DROP", "BUST WIDTH", "BP-BP", "WAIST WIDTH", "LOW HIP WIDTH", "CFL", "HFS WIDTH"],
    "back": ["BACK NECKLINE DROP", "CB ZIPPER LENGTH", "CBL", "TRAIN LENGTH", "HBS WIDTH incl. TRAIN"]
  },
  "materials": [
    { "name": "اسم الخامة بالإنجليزية مثل Duchess satin shell", "placement": "الموضع بالإنجليزية التقنية فقط مثل: Main fitted bodice, torso, waist, hip and upper skirt shell", "description": "وصف تقني إنجليزي كامل مع gsm/القياس/Pantone مثل: Heavyweight silk-blend duchess satin, approx. 180-220 gsm, emerald PANTONE 17-5641 TCX, smooth lustrous face for fitted body", "pantone": "17-5641 TCX", "qty": "2.8", "unit": "m", "photoPrompt": "برومبت إنجليزي فوتوغرافي لصورة هذه الخامة وحدها: للقماش عيّنة قماش متموّجة بلونها الدقيق، وللتريم صورة المنتج نفسه (سحاب/بكرة خيط/hook-and-eye/كريستالات). صياغة: Professional studio product photograph of ... on plain white or fabric background, macro detail, soft even lighting, photorealistic. No text, no watermark." }
  ],
  "calloutMap": [ { "num": 1, "target": "وصف موقع قصير بالإنجليزية مثل main satin body at hip", "view": "front|back" } ],
  "sewingDetailLabels": [ { "label": "تسمية إنشائية قصيرة بالإنجليزية (4 كلمات كحد أقصى) مثل: CB invisible zipper", "view": "front|back" } ],
  "colorway": [ { "part": "الجزء بالإنجليزية", "pantone": "الكود", "hex": "#XXXXXX" } ],
  "detailViews": [ { "area": "المنطقة بالإنجليزية", "detail": "الوصف بالإنجليزية التقنية", "spec": "المواصفة/القياس بالإنجليزية" } ],
  "artwork": [ { "name": "العنصر بالإنجليزية", "placement": "الموضع بالإنجليزية التقنية", "size": "القياس", "notes": "ملاحظات بالإنجليزية" } ],
  "construction": [ { "section": "القسم بالإنجليزية مثل Bodice", "detailType": "نوع التفصيل بالإنجليزية مثل Seam / Closure / Support", "description": "جملة إنجليزية تقنية واحدة" } ],
  "sewingSteps": [ "خطوات إنجليزية تقنية بصيغة أوامر المصنع، 16 خطوة على الأقل" ],
  "fitLog": [ { "version": "v0", "date": "${today.toISOString().slice(0, 10)}", "change": "Initial sample tech pack generated", "by": "${brandName}" } ]
}

قواعد إلزامية — أي إخلال بها يُفشل التيك باك:
1. measurements: 26 نقطة على الأقل، كل pom معه وصف كامل بين قوسين، ولكل نقطة view. مفاتيح sizes هي "2","4","6","8","10","12" حصراً وقيمها أرقام (وليست نصوصاً). مقاس العيّنة 6 هو المرجع الأوسط.
2. materials: 14 عنصراً بالضبط وبهذا الترتيب الوظيفي: الأقمشة الرئيسية أولاً (قماش أساسي، طبقات، بطانة، أقمشة زخرفية)، ثم الدعم البنيوي (boning، شريط قنوات)، ثم الإغلاق (سحاب، hook-and-eye)، ثم التثبيت (حشوة لاصقة، stay tape)، ثم الزخارف، ثم الليبلات، ثم الخيوط، ثم التغليف. هذه القائمة نفسها هي الـ BOM — ترقيمها من 1 إلى 14 حسب ترتيبها، فلا تكرّري ولا تفصلي قائمتين. لكل عنصر photoPrompt خاص به.
3. إن حدّدت المصممة خامات، فلا تضيفي أي قماش لم تذكره — أكملي فقط التريمات المنطقية اللازمة للتصنيع.
4. calloutMap: 5 إلى 6 عناصر، num هو رقم العنصر في materials (ترتيبه من 1)، موزّعة بين front وback، تغطي القماش الرئيسي والطبقات والزخرفة والإغلاق.
5. specSheetLabels: أسماء كبيرة قصيرة (4 كلمات كحد أقصى)، 6-8 للأمامي و4-5 للخلفي، مطابقة لنقاط قياس فعلية من الجدول (استخدمي الاختصارات CFL, CBL, BP-BP, HFS, HBS حيث تنطبق).
6. sewingDetailLabels: 6-8 تسميات، كل واحدة 4 كلمات كحد أقصى.
7. colorway: 4-8 ألوان بأكواد hex دقيقة من الصورة الفعلية.
8. construction: 12 صفاً. detailViews: 4-6. artwork: 2-4. sewingSteps: 16 على الأقل.
9. كل النصوص التقنية بالإنجليزية حصراً (لغة المصانع). العربية فقط في garmentNameAr وdescription.`;

    const payload = {
      model: MODEL,
      max_tokens: 16000,
      stream: true,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: instruction },
        ],
      }],
    };

    // مهلة خمول لا مهلة ثابتة: طالما النص يتدفّق لا نقطع.
    const IDLE_MS = 30000;
    const HARD_MS = 240000;
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

    let raw = '';
    const decoder = new TextDecoder();
    let buffer = '';
    const consumeChunk = (chunk) => {
      resetIdle();
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
        const full = await response.text();
        full.split('\n').forEach((l) => consumeChunk(l + '\n'));
      }
    } catch (e) {
      // انقطاع أثناء الاستلام — نكمل بما جُمِّع ويُصلَح لاحقاً
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
    if (!techpack.sampleSize) techpack.sampleSize = '6';
    if (!techpack.sizeRange) techpack.sizeRange = '2 - 12';

    return res.status(200).json(techpack);
  } catch (error) {
    return res.status(500).json({ error: 'خطأ في الخادم: ' + (error.message || 'غير معروف') });
  }
}
