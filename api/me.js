// api/me.js
// حالة الحساب للواجهة: الاشتراك والكميات المتبقية لكل أداة + كتالوج الباقات.
// بلا توكن: بيرجع الكتالوج فقط (لنافذة الأسعار). ما بيخصم شي.

import {
  authenticate, isOwner, loadPlan, periodOf, limitsFor, useKey, rcall,
  PLANS, TOOLS, TOOL_LABELS,
} from './_guard';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');

  const catalog = Object.keys(PLANS).map((id) => ({
    id, name: PLANS[id].name, price: PLANS[id].price, tools: limitsFor(id),
  }));
  const base = { catalog, labels: TOOL_LABELS };

  const auth = await authenticate(req);
  if (!auth.uid) return res.status(200).json({ signedIn: false, ...base });

  if (isOwner(auth.uid)) {
    return res.status(200).json({ signedIn: true, owner: true, plan: null, tools: {}, ...base });
  }

  try {
    const now = Date.now();
    const info = await loadPlan(auth.uid, now);
    if (!info.plan) {
      return res.status(200).json({
        signedIn: true, owner: false, plan: null, reason: info.reason, tools: {}, ...base,
      });
    }
    const period = periodOf(info.plan.start, now);
    const limits = limitsFor(info.plan.id);
    const used = await rcall(TOOLS.map((t) => ['GET', useKey(auth.uid, t, period.index)]));
    const tools = {};
    TOOLS.forEach((t, i) => {
      tools[t] = { limit: limits[t], used: Math.min(Number(used[i]) || 0, limits[t]) };
    });
    return res.status(200).json({
      signedIn: true,
      owner: false,
      plan: { id: info.plan.id, name: PLANS[info.plan.id].name, end: info.plan.end },
      period: { from: period.from, to: period.to },
      tools,
      ...base,
    });
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh me]', e && e.message);
    return res.status(503).json({ error: 'تعذّر تحميل حسابك الآن، حاولي بعد لحظات' });
  }
}
