// api/admin.js
// يتحقق من كلمة سر المالكة على الخادم، بدل ما تكون مكشوفة في كود الواجهة
// كلمة السر تُحفظ في متغير بيئة: ADMIN_PASSWORD

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return res.status(500).json({ error: 'كلمة سر المالكة غير مضبوطة على الخادم' });
  }

  const { code } = req.body || {};
  if (code && code === expected) {
    return res.status(200).json({ ok: true });
  }
  return res.status(200).json({ ok: false });
}
