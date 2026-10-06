// api/_guard.js
// حارس مشترك لكل ملفات الـ API المدفوعة:
//   1) يتحقق على الخادم من حساب Clerk (توكن Authorization: Bearer ...)
//   2) المالكة (معرّف حسابها بمتغير OWNER_USER_IDS) بلا حدود
//   3) غيرها: لازم اشتراك فعّال، وكمية لكل أداة بالشهر، تُخصم من Upstash Redis
//   4) إذا فشلت الأداة (ردّ 400 أو أكتر) يرجع الخصم تلقائياً قبل إرسال الردّ
//
// ملف يبدأ بـ _ مو رابط API (نفس _fabrics.js).
//
// مفاتيح Redis:
//   gh:plan:<uid>                  الاشتراك (JSON): {id, start, end, status}
//   gh:use:<uid>:<tool>:<period>   عدّاد الاستعمال لفترة الاشتراك الحالية
//   gh:an:<uid>:<yyyy-mm-dd>       عدّاد طلبات التحليل اليومي
//   gh:cd:<uid>                    تفاصيل تغيير الألوان التابعة لرسمة مدفوعة

import { verifyToken } from '@clerk/backend';

// ===== الكميات (الخطة الأولى؛ الثانية ×2؛ الثالثة ×4) =====
const BASE = {
  moodboard: 6,
  techpack: 8,
  flat: 5,
  fabric: 10,
  variation: 10,
  color: 10,
  video: 50,
  marketing: 50,
  studio: 10,
};

export const TOOLS = Object.keys(BASE);

export const TOOL_LABELS = {
  moodboard: 'المود بورد',
  studio: 'استوديو AI',
  color: 'تغيير الألوان',
  fabric: 'تبديل القماش',
  variation: 'تنويعات التصميم',
  flat: 'فلات سكتش',
  techpack: 'التيك باك',
  marketing: 'المحتوى التسويقي',
  video: 'الفيديو',
};

export const PLANS = {
  p1: { name: 'الخطة 1', price: 35, mult: 1 },
  p2: { name: 'الخطة 2', price: 60, mult: 2 },
  p3: { name: 'الخطة 3', price: 110, mult: 4 },
};

// أدوات التحليل (تحديد المناطق): بلا كمية خاصة، لكن بسقف يومي لكل حساب لأن عليها كلفة
export const ANALYSIS_DAILY_CAP = 60;
// طلبات تفاصيل صغيرة مسموحة بعد كل رسمة ألوان مدفوعة (مطابق لـ CC_DETAIL_MAX بالواجهة)
export const COLOR_DETAIL_ALLOWANCE = 2;

const USE_TTL = 60 * 60 * 24 * 70; // المفتاح مرتبط برقم الفترة، فالتنظيف بس لتوفير المساحة
const DAY_TTL = 60 * 60 * 24 * 2;
const DETAIL_TTL = 60 * 15;

export function limitsFor(planId) {
  const p = PLANS[planId];
  if (!p) return null;
  const out = {};
  for (const t of TOOLS) out[t] = BASE[t] * p.mult;
  return out;
}

// ===== الفترة: شهر اشتراك يبدأ من تاريخ بداية الاشتراك (مو الشهر الميلادي) =====
function addMonths(ms, n) {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth() + n;
  const last = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
  return Date.UTC(
    y, mo, Math.min(d.getUTCDate(), last),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()
  );
}

export function periodOf(start, now) {
  const s = new Date(start);
  const n = new Date(now);
  let m = Math.max(0, (n.getUTCFullYear() - s.getUTCFullYear()) * 12 + (n.getUTCMonth() - s.getUTCMonth()));
  while (m > 0 && addMonths(start, m) > now) m -= 1;
  while (addMonths(start, m + 1) <= now) m += 1;
  return { index: m, from: addMonths(start, m), to: addMonths(start, m + 1) };
}

const warn = (...a) => { if (typeof console !== 'undefined') console.warn('[gh guard]', ...a); };

// ===== Upstash Redis عبر REST (بلا مكتبة) =====
function redisCfg() {
  const url = String(process.env.KV_REST_API_URL || '').replace(/\/+$/, '');
  const token = process.env.KV_REST_API_TOKEN || '';
  return url && token ? { url, token } : null;
}

export async function rcall(cmds) {
  const cfg = redisCfg();
  if (!cfg) throw new Error('redis-not-configured');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(cfg.url + '/pipeline', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + cfg.token, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmds),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error('redis-http-' + r.status);
    const arr = await r.json();
    if (!Array.isArray(arr) || arr.length !== cmds.length) throw new Error('redis-bad-response');
    const out = [];
    for (const x of arr) {
      if (x && x.error) throw new Error('redis-' + x.error);
      out.push(x ? x.result : null);
    }
    return out;
  } finally {
    clearTimeout(timer);
  }
}

// ===== التحقق من حساب Clerk =====
export async function authenticate(req) {
  const h = (req.headers && req.headers.authorization) || '';
  const m = /^Bearer\s+(\S+)$/i.exec(String(h));
  if (!m) return { error: 'no-token' };
  if (!process.env.CLERK_SECRET_KEY && !process.env.CLERK_JWT_KEY) {
    warn('CLERK_SECRET_KEY غير مضبوط');
    return { error: 'not-configured' };
  }
  try {
    const parties = String(process.env.CLERK_AUTHORIZED_PARTIES || '')
      .split(',').map((s) => s.trim()).filter(Boolean);
    const payload = await verifyToken(m[1], {
      secretKey: process.env.CLERK_SECRET_KEY || undefined,
      jwtKey: process.env.CLERK_JWT_KEY || undefined,
      ...(parties.length ? { authorizedParties: parties } : {}),
    });
    if (!payload || !payload.sub) return { error: 'bad-token' };
    return { uid: String(payload.sub) };
  } catch (e) {
    return { error: 'invalid-token', detail: e && e.message };
  }
}

export function isOwner(uid) {
  const ids = String(process.env.OWNER_USER_IDS || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  return ids.includes(uid);
}

// ===== الاشتراك =====
export async function loadPlan(uid, now = Date.now()) {
  const [raw] = await rcall([['GET', 'gh:plan:' + uid]]);
  if (!raw) return { plan: null, reason: 'none' };
  let p = null;
  try { p = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { p = null; }
  if (!p || !PLANS[p.id]) return { plan: null, reason: 'none' };
  if (p.status && p.status !== 'active') return { plan: null, reason: 'inactive' };
  const end = Number(p.end);
  if (Number.isFinite(end) && end > 0 && now > end) return { plan: null, reason: 'expired' };
  const start = Number(p.start) > 0 ? Number(p.start) : now;
  return { plan: { id: p.id, start, end: Number.isFinite(end) && end > 0 ? end : null }, reason: null };
}

export const useKey = (uid, tool, index) => 'gh:use:' + uid + ':' + tool + ':' + index;

function deny(res, status, code, error) {
  return res.status(status).json({ error, code });
}

// ينفّذ fn(statusCode) ويكمل قبل إرسال الردّ فعلياً — لأن فيرسال ممكن توقف الدالة
// بعد الردّ مباشرة، فأي عمل بعد الإرسال ممكن ما يكتمل.
function beforeEnd(res, fn) {
  const origEnd = res.end;
  let hooked = false;
  res.end = function patchedEnd(...args) {
    if (hooked) return origEnd.apply(this, args);
    hooked = true;
    const self = this;
    Promise.resolve()
      .then(() => fn(res.statusCode))
      .catch((e) => warn('after-response', e && e.message))
      .then(() => origEnd.apply(self, args));
    return this;
  };
}

// tool: واحدة من TOOLS، أو 'analysis' لأدوات التحليل.
// ترجع { uid, owner } إذا مسموح، أو null (والردّ انرسل خلص).
export async function guard(req, res, tool) {
  if (tool !== 'analysis' && !(tool in BASE)) {
    warn('أداة غير معروفة', tool);
    deny(res, 500, 'config', 'خطأ بإعداد الخادم');
    return null;
  }

  const auth = await authenticate(req);
  if (!auth.uid) {
    if (auth.error === 'not-configured') {
      deny(res, 500, 'config', 'إعداد الدخول غير مكتمل على الخادم');
    } else {
      deny(res, 401, 'auth', 'سجّلي الدخول أولاً ثم حاولي مرة ثانية');
    }
    return null;
  }
  const uid = auth.uid;

  if (isOwner(uid)) return { uid, owner: true };

  const now = Date.now();
  let info;
  try {
    info = await loadPlan(uid, now);
  } catch (e) {
    warn('plan', e && e.message);
    deny(res, 503, 'store', 'تعذّر التحقق من اشتراكك الآن، حاولي بعد لحظات');
    return null;
  }
  if (!info.plan) {
    const msg = info.reason === 'expired'
      ? 'انتهى اشتراكك — جدّدي اشتراكك لتكملي'
      : 'ما عندك اشتراك فعّال — اشتركي أولاً';
    deny(res, 402, info.reason === 'expired' ? 'expired' : 'no_plan', msg);
    return null;
  }

  const period = periodOf(info.plan.start, now);

  // ----- تفاصيل تغيير الألوان: بتتبع رسمة مدفوعة، سقف صغير لكل رسمة -----
  if (tool === 'color' && req.headers['x-gh-detail'] === '1') {
    const dkey = 'gh:cd:' + uid;
    try {
      const [left] = await rcall([['DECR', dkey], ['EXPIRE', dkey, String(DETAIL_TTL)]]);
      if (!(left >= 0)) {
        await rcall([['INCR', dkey], ['EXPIRE', dkey, String(DETAIL_TTL)]]).catch(() => {});
        deny(res, 429, 'detail', 'ما في تفاصيل إضافية متاحة لهالرسمة');
        return null;
      }
    } catch (e) {
      warn('detail', e && e.message);
      deny(res, 503, 'store', 'تعذّر التحقق من رصيدك الآن، حاولي بعد لحظات');
      return null;
    }
    beforeEnd(res, async (code) => {
      if (code >= 400) await rcall([['INCR', dkey], ['EXPIRE', dkey, String(DETAIL_TTL)]]);
    });
    return { uid, owner: false };
  }

  // ----- أدوات التحليل: سقف يومي -----
  if (tool === 'analysis') {
    const day = new Date(now).toISOString().slice(0, 10);
    const akey = 'gh:an:' + uid + ':' + day;
    try {
      const [n] = await rcall([['INCR', akey], ['EXPIRE', akey, String(DAY_TTL)]]);
      if (n > ANALYSIS_DAILY_CAP) {
        await rcall([['DECR', akey]]).catch(() => {});
        deny(res, 429, 'analysis_cap', 'وصلتِ للحد اليومي من التحليلات — جرّبي بكرا');
        return null;
      }
    } catch (e) {
      warn('analysis', e && e.message);
      deny(res, 503, 'store', 'تعذّر التحقق من رصيدك الآن، حاولي بعد لحظات');
      return null;
    }
    beforeEnd(res, async (code) => {
      if (code >= 400) await rcall([['DECR', akey]]);
    });
    return { uid, owner: false };
  }

  // ----- أداة عادية: خصم وحدة من كمية الأداة -----
  const limit = limitsFor(info.plan.id)[tool];
  const key = useKey(uid, tool, period.index);
  try {
    const [used] = await rcall([['INCRBY', key, '1'], ['EXPIRE', key, String(USE_TTL)]]);
    if (used > limit) {
      await rcall([['DECRBY', key, '1']]).catch(() => {});
      const when = new Date(period.to).toISOString().slice(0, 10);
      deny(res, 402, 'quota', 'خلصت حصتك من «' + TOOL_LABELS[tool] + '» لهالفترة — بتتجدد بتاريخ ' + when);
      return null;
    }
  } catch (e) {
    warn('charge', e && e.message);
    deny(res, 503, 'store', 'تعذّر التحقق من رصيدك الآن، حاولي بعد لحظات');
    return null;
  }

  beforeEnd(res, async (code) => {
    if (code >= 400) {
      await rcall([['DECRBY', key, '1']]);
    } else if (tool === 'color') {
      await rcall([['SET', 'gh:cd:' + uid, String(COLOR_DETAIL_ALLOWANCE), 'EX', String(DETAIL_TTL)]]);
    }
  });
  return { uid, owner: false };
}
