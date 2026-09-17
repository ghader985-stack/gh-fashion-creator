// api/img.js
// وسيط صور بنفس النطاق (same-origin).
//
// الغرض الوحيد: قراءة بكسلات الصورة على canvas تتطلّب رؤوس CORS، وبدونها
// تفشل القراءة (canvas tainted). العرض المباشر لا يمرّ من هنا إطلاقاً —
// تمريره كان يضيف نقطة فشل بلا مقابل.
//
// مقيّد بنطاقات معروفة حتى لا يكون وسيطاً مفتوحاً.

const ALLOWED_HOSTS = [
  'replicate.delivery',
  'pbxt.replicate.delivery',
  'api.replicate.com',
  'blob.vercel-storage.com',
  'public.blob.vercel-storage.com',
];

export const config = {
  api: { responseLimit: '25mb' },
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const raw = req.query.u;
  const target = Array.isArray(raw) ? raw[0] : raw;
  if (!target) return res.status(400).json({ error: 'رابط الصورة مفقود' });

  let parsed;
  try {
    parsed = new URL(target);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] img url', e && e.message);
    return res.status(400).json({ error: 'رابط غير صالح' });
  }

  if (parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'رابط غير مسموح' });
  }

  const host = parsed.hostname;
  const allowed = ALLOWED_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  if (!allowed) return res.status(403).json({ error: 'نطاق غير مسموح' });

  try {
    // روابط api.replicate.com محميّة بمفتاح: جلبها بلا ترويسة تفويض يُرجع 401.
    // المفتاح يبقى على الخادم ولا يصل المتصفح إطلاقاً.
    const headers = {};
    if (host === 'api.replicate.com' || host.endsWith('.api.replicate.com')) {
      const token = process.env.REPLICATE_API_TOKEN;
      if (token) headers.Authorization = 'Bearer ' + token;
    }

    const upstream = await fetch(parsed.toString(), { headers });
    if (!upstream.ok) {
      return res.status(502).json({ error: 'تعذّر جلب الصورة (' + upstream.status + ')' });
    }

    const type = upstream.headers.get('content-type') || 'image/jpeg';
    if (!type.startsWith('image/')) {
      return res.status(415).json({ error: 'المحتوى ليس صورة' });
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(buf);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] img fetch', e && e.message);
    return res.status(502).json({ error: 'تعذّر جلب الصورة' });
  }
}
