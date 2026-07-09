// api/studio.js
// استوديو AI: يحوّل التصميم/الكونسبت إلى صورة قطعة احترافية
// يستقبل: وصف التصميم + (اختياري) صورة مرجعية + إعدادات (نوع اللقطة، الخلفية)
// يبني برومبت احترافي عبر Claude، ثم يولّد الصورة عبر Replicate FLUX

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

const CLAUDE_MODEL = 'claude-sonnet-5';
const FLUX_MODEL = 'black-forest-labs/flux-1.1-pro';

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

// خرائط الإعدادات إلى وصف احترافي
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!anthropicKey || !replicateToken) {
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

    // بناء برومبت احترافي عبر Claude (مع تحليل الصورة المرجعية إن وُجدت)
    const promptBuilderText = `أنتِ خبيرة في كتابة برومبتات توليد صور الأزياء الاحترافية بالإنجليزية.

المطلوب: صورة منتج واقعية احترافية لقطعة أزياء.
- وصف التصميم من المصممة: ${description}
- نوع اللقطة المطلوب: ${SHOT_MAP[shot] || SHOT_MAP.catalog}
- الخلفية: ${BG_MAP[background] || BG_MAP.cream}
${imageFile ? '- يوجد صورة مرجعية مرفقة (قد تكون سكتش أو تصميم): حللي القطعة فيها بدقة (القصّة، الألوان، الخامة، التفاصيل) وحوّليها إلى وصف قطعة حقيقية واقعية مطابقة لها تماماً.' : ''}

اكتبي برومبت إنجليزي واحد فقط (فقرة واحدة متصلة، بدون عناوين، بدون ترقيم، بدون شرح)، غني بالتفاصيل: نوع القطعة وقصّتها، القماش وملمسه الواقعي، الألوان، التفاصيل والزخارف، نوع اللقطة والإضاءة والخلفية. مهم جداً: يجب أن تكون النتيجة صورة فوتوغرافية واقعية 100% لقطعة حقيقية (photorealistic, realistic fabric, professional studio product photography, 8k, sharp focus) — وليست رسمة أو إليستريشن أو أسلوب خيالي. أرجعي البرومبت فقط.`;

    const claudeContent = [];
    if (imageFile) {
      const imgBuffer = fs.readFileSync(imageFile.filepath);
      const base64 = imgBuffer.toString('base64');
      const detectedType = detectImageType(imgBuffer);
      claudeContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: detectedType,
          data: base64,
        },
      });
    }
    claudeContent.push({ type: 'text', text: promptBuilderText });

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
        messages: [{ role: 'user', content: claudeContent }],
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

    const aspect = shot === 'flatlay' ? '1:1' : shot === 'onmodel' ? '2:3' : '3:4';

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
