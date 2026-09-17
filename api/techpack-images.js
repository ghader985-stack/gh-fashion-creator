// pages/api/techpack-images.js
// توليد رسمات قسم «فلات سكتش (الرسمة التقنية)» فقط:
// ملوّنة وخطّية، أماماً وخلفاً، من صورة التصميم.
//
// ورقة التيك باك لم تعد تستدعي هذا الملف إطلاقاً: كل صورها تُقصّ في المتصفح
// من الصور المرفوعة، بلا أي توليد. لذلك حُذف وضع صور الخامات من هنا، وأي
// طلب لا يحمل flatOnly=1 يُرفض قبل أي رفع أو توليد فلا يستهلك رصيداً.
//
// كل رسمة تُحفظ في التخزين الدائم قبل إرجاعها: روابط Replicate مؤقتة تنتهي.

import formidable from 'formidable';
import { put } from '@vercel/blob';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

const EDIT_MODEL = 'google/nano-banana-pro';
const INSPECT_MODEL = 'claude-haiku-4-5-20251001';
const DEADLINE_MS = 240000;     // يُحسب من لحظة دخول الطلب لا بعد الرفع

// ---------------------------------------------------------------------------
function detectImageType(buffer) {
  if (!buffer || buffer.length < 4) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer.length > 12 && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return 'image/jpeg';
}

const getField = (f) => (Array.isArray(f) ? f[0] : f) || '';
const pickFile = (f) => (Array.isArray(f) ? f[0] : f) || null;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('انتهت المهلة')), ms)),
  ]);
}

// تشغيل آمن: أي فشل يعود null ولا يُسقط بقية التوليد
async function safeRun(fn, capMs) {
  try { return await withTimeout(fn(), capMs); }
  catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] run', e && e.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// رفع صورة إلى Replicate لتكون مدخلاً للنماذج
async function uploadToReplicate(buffer, mediaType, token) {
  const ext = ({ 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg' })[mediaType] || 'jpg';
  const boundary = '----gh' + Math.random().toString(36).slice(2);
  const head = Buffer.from(
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="content"; filename="design.' + ext + '"\r\n' +
    'Content-Type: ' + mediaType + '\r\n\r\n', 'utf8');
  const tail = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf8');
  const body = Buffer.concat([head, buffer, tail]);

  const res = await fetch('https://api.replicate.com/v1/files', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
    },
    body,
  });
  if (!res.ok) throw new Error('فشل رفع الصورة (' + res.status + ')');
  const data = await res.json();
  // تفضيل رابط التسليم المفتوح على رابط api المحميّ بمفتاح
  return (data.urls && (data.urls.download || data.urls.get)) || null;
}

// ---------------------------------------------------------------------------
// حفظ دائم: يعطي رابطاً ثابتاً يراه الجميع ويبقى داخل الـ PDF.
// عند غياب التوكن أو فشل الحفظ يعود الأصل كما هو فلا يتعطّل التوليد.
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
      put(key, body, { access: 'public', contentType: type, addRandomSuffix: false }), 25000);
    return (res && res.url) || (typeof input === 'string' ? input : null);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] persist', e && e.message);
    return typeof input === 'string' ? input : null;
  }
}

// ---------------------------------------------------------------------------
// استدعاء نموذج تحرير الصور
async function editImage(inputs, prompt, token, ratio) {
  const list = (Array.isArray(inputs) ? inputs : [inputs]).filter(Boolean);
  const res = await fetch('https://api.replicate.com/v1/models/' + EDIT_MODEL + '/predictions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({
      input: {
        prompt,
        image_input: list,
        aspect_ratio: ratio || '1:1',
        output_format: 'jpg',
      },
    }),
  });
  if (!res.ok) throw new Error('فشل التوليد (' + res.status + ')');
  const data = await res.json();
  const out = data.output;
  if (typeof out === 'string') return out;
  if (Array.isArray(out) && out.length) return out[0];
  return null;
}

// ---------------------------------------------------------------------------
// فحص المخرجات بصرياً بالنموذج نفسه.
// قراءة بايتات ملف مضغوط لا تدلّ على البكسلات إطلاقاً، فالفحص البصري هو
// السبيل الوحيد لمعرفة أن الرسمة منظر واحد وخطّية وبلا جسم.
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
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: INSPECT_MODEL,
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: type.split(';')[0], data: base64 } },
              { type: 'text', text:
                'Inspect this garment technical flat sketch. Reply with ONLY a JSON object, no preamble, no markdown fences:\n' +
                '{"figures": <how many separate garment figures are drawn, integer>, ' +
                '"colored": <true if filled with colour or shading, false if clean black line art on white>, ' +
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
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] inspect', e && e.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// أقفال البرومبت
const NO_BODY =
  'Do NOT include any human body, face, head, hands, legs, mannequin or dress form anywhere in the image. ';
const NO_INVENT =
  'Do NOT invent any structural element that is not visible in the reference: no belt, no added seams, no pleats, ' +
  'no straps, no slits, no closures that are not there. Reproduce only what exists. ';
const NO_ADD =
  'No text, no labels, no numbers, no arrows, no watermark, no logo, no background scenery. ';
const FIT_FRAME =
  'The garment must fit entirely inside the frame with even margins, nothing cropped. ';
const ONE_VIEW = (side) =>
  'Render exactly ONE single garment figure showing the ' + side + ' view only. ' +
  'Never draw two figures, never a mirrored copy, never a second view in the same image. ';
const STRICTER =
  ' This is a corrective retry. Follow every constraint exactly. ';

// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!replicateToken) {
    return res.status(500).json({ error: 'مفتاح Replicate غير مضبوط على الخادم' });
  }

  // العدّ من لحظة دخول الطلب: كل ما يسبق التوليد يُحسب ضمن المهلة،
  // وإلا تجاوزت الدالة حدّ المنصّة وقُطعت قبل أن تُرجع أي صورة.
  const requestStart = Date.now();
  const deadline = requestStart + DEADLINE_MS;

  try {
    const form = formidable({ maxFileSize: 12 * 1024 * 1024 });
    const [fields, files] = await form.parse(req);

    // هذا المسار لقسم الفلات سكتش وحده
    const flatOnly = String(getField(fields.flatOnly) || '') === '1';
    if (!flatOnly) {
      return res.status(400).json({ error: 'هذا المسار مخصّص لقسم الفلات سكتش فقط' });
    }

    const imageFile = pickFile(files.image);
    if (!imageFile) return res.status(400).json({ error: 'لم تُرفع صورة التصميم' });

    let meta = {};
    try { meta = JSON.parse(getField(fields.meta) || '{}'); }
    catch (e) { if (typeof console !== 'undefined') console.warn('[gh] meta', e && e.message); meta = {}; }

    const imgBuffer = fs.readFileSync(imageFile.filepath);
    const mediaType = detectImageType(imgBuffer);

    let uploadedUrl = null;
    try { uploadedUrl = await withTimeout(uploadToReplicate(imgBuffer, mediaType, replicateToken), 30000); }
    catch (e) { if (typeof console !== 'undefined') console.warn('[gh] upload', e && e.message); }

    const facts = String(meta.garmentFacts || '') + ' ';
    const brief = String(meta.flatSketchBrief || '') + ' ';

    // -----------------------------------------------------------------------
    // الرسمات الأربع
    // -----------------------------------------------------------------------
    if (!uploadedUrl) {
      return res.status(502).json({ error: 'تعذّر رفع صورة التصميم — حاولي مرة ثانية' });
    }

    const colouredFront =
      NO_INVENT + NO_BODY + NO_ADD + FIT_FRAME + ONE_VIEW('FRONT') + facts + brief +
      'Redraw this garment as a clean COLOURED technical flat: laid flat, symmetric, straight-on, ' +
      'keeping the exact same colours, fabrics and proportions as the reference. ';

    const colouredBack =
      NO_INVENT + NO_BODY + NO_ADD + FIT_FRAME + ONE_VIEW('BACK') + facts + brief +
      'Render the BACK view of this same garment as a coloured technical flat, consistent with the front. ';

    const lineFront =
      NO_INVENT + NO_BODY + NO_ADD + FIT_FRAME + ONE_VIEW('FRONT') + facts + brief +
      'Convert into a technical line drawing: thin uniform BLACK outlines on pure WHITE background, ' +
      'no colour, no fill, no shading, no gradients. Include seams, darts, stitching and construction lines. ';

    const lineBack =
      NO_INVENT + NO_BODY + NO_ADD + FIT_FRAME + ONE_VIEW('BACK') + facts + brief +
      'Convert the BACK view into a technical line drawing: thin uniform BLACK outlines on pure WHITE, ' +
      'no colour, no fill, no shading. ';

    // توليد خطّي مع بوابة فحص وإعادة واحدة كحد أقصى
    let gateRetryUsed = false;
    const makeLineArt = async (inputs, prompt, capMs) => {
      const out = await safeRun(() => editImage(inputs, prompt, replicateToken, '2:3'), capMs);
      if (!out) return null;

      const look = await inspectSketch(out, apiKey);
      if (!look) return out;      // تعذّر الفحص: يُقبل الناتج ولا يُعطَّل التوليد

      const badViews = look.figures !== null && look.figures > 1;
      const badColour = look.colored === true;
      const badBody = look.body === true;

      if (!gateRetryUsed && (badViews || badColour || badBody)
          && Date.now() + capMs < deadline - 20000) {
        gateRetryUsed = true;
        let extra = STRICTER;
        if (badViews) extra += ' The previous attempt contained ' + look.figures +
          ' separate figures. Output ONE single garment only. ';
        if (badColour) extra += ' The previous attempt was coloured. Output clean BLACK LINE ART on pure white. ';
        if (badBody) extra += ' The previous attempt showed a body or mannequin. Draw the garment alone. ';

        const retry = await safeRun(() => editImage(inputs, prompt + extra, replicateToken, '2:3'), capMs);
        if (retry) {
          const check = await inspectSketch(retry, apiKey);
          if (!check) return retry;
          const stillBad = (check.figures !== null && check.figures > 1) || check.colored || check.body;
          if (!stillBad) return retry;
        }
      }
      return out;
    };

    const cf = await safeRun(() => editImage(uploadedUrl, colouredFront, replicateToken, '2:3'), 65000);

    // الملوّن الأمامي مدخلٌ للبقية: يضمن اتساق اللون والتفاصيل
    const base = cf ? [cf, uploadedUrl] : uploadedUrl;
    const [lf, cb] = await Promise.all([
      makeLineArt(base, lineFront, 55000),
      cf ? safeRun(() => editImage([uploadedUrl, cf], colouredBack, replicateToken, '2:3'), 70000)
         : Promise.resolve(null),
    ]);
    const lb = (cb || lf) ? await makeLineArt(cb || lf, lineBack, 55000) : null;

    const [pcf, pcb, plf, plb] = await Promise.all([
      cf ? persist(cf, 'flat-color-front') : Promise.resolve(null),
      cb ? persist(cb, 'flat-color-back') : Promise.resolve(null),
      lf ? persist(lf, 'flat-line-front') : Promise.resolve(null),
      lb ? persist(lb, 'flat-line-back') : Promise.resolve(null),
    ]);

    const produced = [pcf, pcb, plf, plb].filter(Boolean).length;
    return res.status(200).json({
      coloredFrontImage: pcf,
      coloredBackImage: pcb,
      lineFrontImage: plf,
      lineBackImage: plb,
      produced,
      error: produced === 0 ? 'تعذّر توليد أي رسمة — حاولي مرة ثانية' : null,
    });
  } catch (error) {
    if (typeof console !== 'undefined') console.warn('[gh] images', error && error.message);
    return res.status(500).json({ error: 'خطأ في توليد الصور: ' + (error.message || 'غير معروف') });
  }
}
