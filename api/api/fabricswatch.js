// api/fabricswatch.js
// صورة عيّنة قماش من المكتبة: /api/fabricswatch?id=crepe_satin
//
// أول طلب لكل قماش بيسحبه من Poly Haven (CC0) ويحفظه بـ Blob، وبعدها
// تحويل مباشر لرابط Blob. الردّ نفسه بيتخزّن بكاش Vercel سنة كاملة، فالدالة
// ما بتشتغل إلا مرة وحدة تقريباً لكل قماش. بلا أي كلفة نموذج.

import { fabricById, ensureSwatch } from './_fabrics';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const raw = req.query && req.query.id;
  const id = String(Array.isArray(raw) ? raw[0] : raw || '');
  const f = fabricById(id);
  if (!f) return res.status(404).json({ error: 'قماش غير معروف' });

  const out = await ensureSwatch(f, 'ui');
  if (!out) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'تعذّر تحميل صورة القماش' });
  }

  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, immutable');
  if (out.url) {
    res.setHeader('Location', out.url);
    return res.status(302).end();
  }
  res.setHeader('Content-Type', 'image/jpeg');
  return res.status(200).send(out.bytes);
}
