// api/studio.js
// استوديو AI: يحوّل التصميم/الكونسبت إلى صورة قطعة احترافية
// يستقبل: وصف التصميم + (اختياري) صورة مرجعية + إعدادات (نوع اللقطة، الخلفية)
//
// طريقتان:
//   1) مع صورة مرجعية: الصورة نفسها تدخل لنموذج الرسم (نانو بنانا) مع تعليمة قصيرة
//      «نفس القطعة بالضبط»، فتطلع النتيجة من تصميمها هي مو من وصف كلامي.
//      استدعاء واحد لـ Replicate، بدون كلود. نفس شكل الاستدعاء الشغّال بـ variation.js.
//   2) بدون صورة: متل ما كان: كلود يبني برومبت من الوصف ثم FLUX يرسم.

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

const CLAUDE_MODEL = 'claude-sonnet-5';
const FLUX_MODEL = 'black-forest-labs/flux-1.1-pro';
// سطر واحد لتغيير نموذج الرسم بوجود صورة مرجعية (نفس نموذج تنويعات التصميم وتبديل القماش)
const EDIT_MODEL = 'google/nano-banana-2-lite';
// لقطة «تفاصيل» بس: نموذج ودقة مستقلين عن باقي اللقطات.
// نتائج التجارب (6 أكتوبر، نفس الفستان):
//   lite + برومبت جديد (≈4¢): القماش ناعم لكن غيّر الألوان والإسوارة، ما بيحافظ على التصميم.
//   'google/nano-banana-2' + '2K' (≈10¢): ممتاز وأمين للتصميم، لكن غالي.
//   الحالي: 'google/nano-banana-2' + '1K' (لسا ما انقاست كلفته). لو ضعفت الدقة: '2K'.
export const DETAIL_MODEL = 'google/nano-banana-2';
export const DETAIL_RESOLUTION = '1K';

const WAIT_SECONDS = 60;
const POLL_MS = 2000;
const TOTAL_TIMEOUT_MS = 270000;

function extractText(content) {
  if (!Array.isArray(content)) return '';
  const textBlock = content.find((b) => b.type === 'text');
  return textBlock ? textBlock.text : '';
}

// يكتشف نوع الصورة الحقيقي من أول بايتات الملف (magic bytes)
function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return 'image/jpeg';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif';
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return 'image/webp';
  return 'image/jpeg';
}

// خرائط الإعدادات إلى وصف احترافي (المسار بدون صورة، كما كانت)
const SHOT_MAP = {
  catalog: 'ghost mannequin invisible-body catalog product shot, garment displayed on its own with natural three-dimensional shape as if worn but no visible body, full garment clearly visible, professional e-commerce studio lighting, realistic',
  onmodel: 'garment worn by a professional fashion model, full body, realistic studio fashion photography, elegant natural pose',
  flatlay: 'flat lay product photography, garment neatly laid flat from directly above, soft even studio lighting, minimal clean props, realistic',
  detail: 'realistic macro detail product shot highlighting real fabric texture, stitching and embellishments, professional studio lighting, soft focus background',
};

const BG_MAP = {
  cream: 'clean warm cream and ivory studio backdrop',
  white: 'clean pure white studio backdrop',
  dark: 'elegant dark charcoal studio backdrop with soft lighting',
};

// المسار مع صورة: سطر قصير بصيغة أمر لكل نوع لقطة
const EDIT_SHOT_MAP = {
  catalog: 'ghost mannequin catalog shot: the garment shown on its own with its natural three-dimensional shape, no body and no model, the full garment clearly visible, professional e-commerce studio lighting',
  onmodel: 'the garment worn by a professional fashion model, full body, elegant natural pose, realistic studio fashion photography',
  flatlay: 'flat lay shot: the garment neatly laid flat, seen from directly above, soft even studio lighting',
  detail: 'a detail sheet: ONE image laid out as a clean 2x2 collage of four close-up photographs of this same garment, separated by thin cream borders, all four with the same soft even studio lighting. Choose the four most distinctive areas that are actually visible in image 1 (for example the neckline or chest area, a sleeve and its cuff, the hem or edge trim, and a macro of the fabric and embellishment). Do not invent or redesign anything: every sleeve, cuff, band, trim, lining and embroidery must be exactly as in image 1, with the same shape, length, width, positions and colours. The fabric looks smooth, crisp and neatly pressed, with no random wrinkles or crumpling (keep only the pleats and gathers that are part of the design). No text and no labels',
};

export function buildEditPrompt(shot, background, description) {
  const shotLine = EDIT_SHOT_MAP[shot] || EDIT_SHOT_MAP.catalog;
  const bgLine = BG_MAP[background] || BG_MAP.cream;
  const notes = String(description || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 600);
  return `Make a realistic professional product photo of the exact garment in image 1.

Keep the design, silhouette, colours, fabric, embellishments and every detail identical to image 1. If image 1 is a drawing or sketch, render the same design as a real garment.

Shot: ${shotLine}.
Background: ${bgLine}.${notes ? `\nDesigner's notes: ${notes}` : ''}

Photorealistic, realistic fabric texture, sharp focus.`;
}

function aspectFor(shot) {
  return shot === 'flatlay' ? '1:1' : shot === 'onmodel' ? '2:3' : '3:4';
}

// مع صورة مرجعية: لقطة التفاصيل لوحة مربّعة (شبكة 2×2)
function editAspectFor(shot) {
  return shot === 'detail' ? '1:1' : aspectFor(shot);
}

async function pollReplicate(getUrl, apiToken, maxTries = 40) {
  for (let i = 0; i < maxTries; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    const data = await poll.json();
    if (data.status === 'succeeded') return data;
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error('فشل توليد الصورة');
    }
  }
  throw new Error('انتهى وقت الانتظار');
}

async function generateImage(prompt, apiToken, aspectRatio) {
  const create = await fetch(`https://api.replicate.com/v1/models/${FLUX_MODEL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: aspectRatio || '3:4',
        output_format: 'jpg',
        output_quality: 95,
        safety_tolerance: 2,
      },
    }),
  });

  const created = await create.json();
  if (created.error) throw new Error(created.error);

  if (created.status === 'succeeded' && created.output) {
    return Array.isArray(created.output) ? created.output[0] : created.output;
  }

  const getUrl = created.urls && created.urls.get;
  if (!getUrl) throw new Error('لم يبدأ التوليد');
  const done = await pollReplicate(getUrl, apiToken);
  return Array.isArray(done.output) ? done.output[0] : done.output;
}

// ---------------------------------------------------------------------------
// المسار مع صورة مرجعية (نفس دوال variation.js الشغّالة)
// ---------------------------------------------------------------------------
async function uploadToReplicate(buffer, mediaType, token, signal) {
  const ext = ({ 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg' })[mediaType] || 'jpg';
  const boundary = '----gh' + Math.random().toString(36).slice(2);
  const headPart = Buffer.from(
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="content"; filename="source.' + ext + '"\r\n' +
    'Content-Type: ' + mediaType + '\r\n\r\n', 'utf8');
  const tail = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf8');

  const r = await fetch('https://api.replicate.com/v1/files', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data; boundary=' + boundary },
    signal,
    body: Buffer.concat([headPart, buffer, tail]),
  });
  if (!r.ok) {
    let detail = '';
    try { detail = (await r.text()).slice(0, 200); } catch (e) { detail = ''; }
    if (typeof console !== 'undefined') console.warn('[gh] studio upload', r.status, detail);
    return null;
  }
  const data = await r.json();
  return (data.urls && (data.urls.download || data.urls.get)) || null;
}

async function settle(token, prediction, signal, deadline) {
  let p = prediction;
  while (p && (p.status === 'starting' || p.status === 'processing')) {
    if (Date.now() > deadline) return { timeout: true };
    const url = p.urls && p.urls.get;
    if (!url) return { failed: 'no poll url' };
    await new Promise((r) => setTimeout(r, POLL_MS));
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, signal });
    if (!r.ok) return { failed: 'poll ' + r.status };
    p = await r.json();
  }
  return { prediction: p };
}

async function runEdit(token, imageUrl, prompt, aspect, signal, deadline, opts = {}) {
  const model = opts.model || EDIT_MODEL;
  const attempts = [
    { prompt, image_input: [imageUrl], aspect_ratio: aspect, output_format: 'jpg', ...(opts.extra || {}) },
    { prompt, image_input: [imageUrl] },
  ];
  let prediction = null;
  let lastStatus = 0;
  for (const input of attempts) {
    const r = await fetch('https://api.replicate.com/v1/models/' + model + '/predictions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Prefer: 'wait=' + WAIT_SECONDS },
      signal,
      body: JSON.stringify({ input }),
    });
    if (r.ok) { prediction = await r.json(); break; }
    lastStatus = r.status;
    let detail = '';
    try { detail = (await r.text()).slice(0, 300); } catch (e) { detail = ''; }
    if (typeof console !== 'undefined') console.warn('[gh] studio status', r.status, detail);
    if (r.status === 402) return { status: 402, error: 'رصيد Replicate خلص' };
    if (r.status !== 400 && r.status !== 422) break;
  }
  if (!prediction) return { status: 502, error: 'تعذّر إنشاء النتيجة (' + (lastStatus || 502) + ')' };

  const done = await settle(token, prediction, signal, deadline);
  if (done.timeout) return { status: 504, error: 'انتهت مهلة الرسم' };
  if (done.failed) {
    if (typeof console !== 'undefined') console.warn('[gh] studio poll', done.failed);
    return { status: 502, error: 'تعذّر إنشاء النتيجة' };
  }
  const p = done.prediction;
  if (!p || p.status !== 'succeeded') {
    if (typeof console !== 'undefined') console.warn('[gh] studio end', p && p.status, p && p.error);
    return { status: 502, error: 'تعذّر إنشاء النتيجة' };
  }
  const out = Array.isArray(p.output) ? p.output[0] : p.output;
  if (!out || typeof out !== 'string') return { status: 502, error: 'النموذج ما رجّع صورة' };
  return { url: out };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) {
    return res.status(500).json({ error: 'المفاتيح غير مضبوطة على الخادم' });
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
    const description = getField(fields.description);
    const shot = getField(fields.shot) || 'catalog';
    const background = getField(fields.background) || 'cream';

    if (!description.trim()) {
      return res.status(400).json({ error: 'اكتبي وصف التصميم أولاً' });
    }

    const imageFile = files.image
      ? Array.isArray(files.image)
        ? files.image[0]
        : files.image
      : null;

    const aspect = aspectFor(shot);

    // ===== مع صورة مرجعية: الصورة تدخل لنموذج الرسم مباشرة =====
    if (imageFile) {
      const ctrl = new AbortController();
      const deadline = Date.now() + TOTAL_TIMEOUT_MS;
      const timer = setTimeout(() => ctrl.abort(), TOTAL_TIMEOUT_MS + 5000);
      try {
        const buf = fs.readFileSync(imageFile.filepath);
        const source = await uploadToReplicate(buf, detectImageType(buf), replicateToken, ctrl.signal);
        if (!source) {
          return res.status(502).json({ error: 'تعذّر رفع الصورة لخدمة الرسم' });
        }
        const prompt = buildEditPrompt(shot, background, description);
        const editOpts = shot === 'detail'
          ? { model: DETAIL_MODEL, extra: DETAIL_RESOLUTION ? { resolution: DETAIL_RESOLUTION } : {} }
          : {};
        const one = await runEdit(replicateToken, source, prompt, editAspectFor(shot), ctrl.signal, deadline, editOpts);
        if (!one.url) return res.status(one.status || 502).json({ error: one.error });
        return res.status(200).json({ imageUrl: one.url, prompt });
      } catch (e) {
        const aborted = e && e.name === 'AbortError';
        if (typeof console !== 'undefined') console.warn('[gh] studio call', e && e.message);
        return res.status(504).json({ error: aborted ? 'انتهت مهلة الرسم' : 'تعذّر الاتصال بخدمة الرسم' });
      } finally {
        clearTimeout(timer);
      }
    }

    // ===== بدون صورة: كلود يبني البرومبت من الوصف ثم FLUX يرسم (كما كان) =====
    if (!anthropicKey) {
      return res.status(500).json({ error: 'المفاتيح غير مضبوطة على الخادم' });
    }

    const promptBuilderText = `أنتِ خبيرة في كتابة برومبتات توليد صور الأزياء الاحترافية بالإنجليزية.

المطلوب: صورة منتج واقعية احترافية لقطعة أزياء.
- وصف التصميم من المصممة: ${description}
- نوع اللقطة المطلوب: ${SHOT_MAP[shot] || SHOT_MAP.catalog}
- الخلفية: ${BG_MAP[background] || BG_MAP.cream}

اكتبي برومبت إنجليزي واحد فقط (فقرة واحدة متصلة، بدون عناوين، بدون ترقيم، بدون شرح)، غني بالتفاصيل: نوع القطعة وقصّتها، القماش وملمسه الواقعي، الألوان، التفاصيل والزخارف، نوع اللقطة والإضاءة والخلفية. مهم جداً: يجب أن تكون النتيجة صورة فوتوغرافية واقعية 100% لقطعة حقيقية (photorealistic, realistic fabric, professional studio product photography, 8k, sharp focus) — وليست رسمة أو إليستريشن أو أسلوب خيالي. أرجعي البرومبت فقط.`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 600,
        messages: [{ role: 'user', content: [{ type: 'text', text: promptBuilderText }] }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      return res.status(500).json({ error: 'فشل بناء البرومبت: ' + errText.slice(0, 150) });
    }

    const claudeData = await claudeRes.json();
    const imagePrompt = extractText(claudeData.content).trim();

    if (!imagePrompt) {
      return res.status(500).json({ error: 'تعذّر بناء برومبت الصورة' });
    }

    const imageUrl = await generateImage(imagePrompt, replicateToken, aspect);

    return res.status(200).json({
      imageUrl,
      prompt: imagePrompt,
    });
  } catch (error) {
    const msg = error.message || 'غير معروف';
    if (msg.includes('429')) {
      return res.status(429).json({ error: 'الخدمة مشغولة الآن، حاولي بعد لحظات' });
    }
    return res.status(500).json({ error: 'خطأ: ' + msg });
  }
}
