import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteLayout, { Bi } from '../components/SiteLayout';
import { PLANS, PLAN_TOOLS, LAUNCH, planUses, orderHref, ltr } from '../lib/site';

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function launchDate() {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(LAUNCH.ends || '');
  if (!m) return null;
  const d = Number(m[3]);
  const i = Number(m[2]) - 1;
  return { ar: `${d} ${MONTHS_AR[i]} ${m[1]}`, en: `${d} ${MONTHS_EN[i]} ${m[1]}` };
}

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (LAUNCH.ends && Date.now() > Date.parse(LAUNCH.ends + 'T23:59:59+04:00')) setExpired(true);
  }, []);

  const launchOn = !expired;
  const until = launchDate();

  return (
    <SiteLayout
      title="Plans and pricing · الخطط والأسعار"
      description="Monthly and yearly subscription plans for the GH Couture AI tools. Prices in USD. / خطط اشتراك شهرية وسنوية لأدوات GH Couture AI. الأسعار بالدولار الأمريكي."
    >
      <section className="s-section">
        <div className="s-wrap">
          <div className="s-sec-head">
            <div className="s-eyebrow"><Bi ar="اشتراك شهري أو سنوي" en="Monthly or yearly subscription" /></div>
            <h1 className="s-h1" style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}>
              <Bi ar="الخطط والأسعار" en="Plans and pricing" />
            </h1>
            <p className="s-lead">
              <Bi
                ar="كل خطة تعطيك عدداً من مرات الاستخدام لكل أداة في كل شهر. الأسعار بالدولار الأمريكي (USD)."
                en="Each plan gives you a number of uses for each tool every month. Prices are in US dollars (USD)."
              />
            </p>
          </div>

          <div className="bill" role="group" aria-label="Billing period">
            <button type="button" className={'bill-btn' + (!yearly ? ' on' : '')} aria-pressed={!yearly} onClick={() => setYearly(false)} data-bill="monthly">
              <Bi ar="شهري" en="Monthly" />
            </button>
            <button type="button" className={'bill-btn' + (yearly ? ' on' : '')} aria-pressed={yearly} onClick={() => setYearly(true)} data-bill="yearly">
              <Bi ar="سنوي" en="Yearly" />
              <span className="bill-tag"><Bi ar="شهران مجاناً" en="2 months free" /></span>
            </button>
          </div>

          <div className="plans">
            {PLANS.map((p) => {
              const regular = yearly ? p.yearly : p.price;
              const launch = yearly ? p.yearlyLaunch : p.launch;
              const shown = launchOn ? launch : regular;
              const url = yearly ? p.checkout.yearly : p.checkout.monthly;
              const href = orderHref(`Subscribe: ${p.name.en} (${yearly ? 'yearly' : 'monthly'})`, url);
              return (
                <div className="plan" key={p.id} data-plan={p.id}>
                  <h2 className="plan-name"><Bi ar={p.name.ar} en={p.name.en} /></h2>
                  <div className="plan-price-row">
                    <div className="plan-price">
                      ${shown}
                      <span className="plan-per">
                        {yearly ? <Bi ar=" / سنة" en=" / year" /> : <Bi ar=" / شهر" en=" / month" />}
                      </span>
                    </div>
                    {launchOn && <div className="plan-was" aria-label="Regular price">${regular}</div>}
                  </div>
                  {launchOn && (
                    <div className="plan-launch">
                      {until ? (
                        <Bi ar={`سعر الإطلاق — ينتهي في ${until.ar}`} en={`Launch price — ends ${until.en}`} />
                      ) : (
                        <Bi ar={`سعر الإطلاق — أول ${LAUNCH.days} يوماً فقط`} en={`Launch price — first ${LAUNCH.days} days only`} />
                      )}
                    </div>
                  )}
                  <p className="plan-note">
                    {yearly ? (
                      <Bi ar="تُدفع مرة واحدة في السنة (12 شهراً بسعر 10). مرات الاستخدام تتجدد كل شهر." en="Billed once a year (12 months for the price of 10). Uses refresh every month." />
                    ) : launchOn ? (
                      <Bi ar={`سعر الإطلاق للدفعة الأولى، ثم ${ltr('$' + p.price)} شهرياً.`} en={`Launch price applies to your first payment, then $${p.price} per month.`} />
                    ) : (
                      <Bi ar="تُجدَّد تلقائياً كل شهر." en="Renews automatically every month." />
                    )}
                  </p>
                  <div className="plan-sub"><Bi ar="مرات الاستخدام كل شهر" en="Uses per month" /></div>
                  <ul className="plan-list">
                    {PLAN_TOOLS.map((t) => (
                      <li key={t.key} data-tool={t.key}>
                        <span className="plan-n">{planUses(p, t.key)}</span>
                        <span><Bi ar={t.name.ar} en={t.name.en} /></span>
                      </li>
                    ))}
                  </ul>
                  <a className="s-btn primary full" href={href} {...(url ? { rel: 'noopener noreferrer' } : {})}>
                    <Bi ar="اشترك" en="Subscribe" />
                  </a>
                </div>
              );
            })}
          </div>

          <div className="s-box" style={{ marginTop: 28 }}>
            <p><Bi ar="الاشتراك الشهري يتجدد تلقائياً كل شهر، والسنوي مرة كل سنة، إلى أن تلغيه." en="A monthly plan renews automatically every month and a yearly plan once a year, until you cancel." /></p>
            <p><Bi ar="يمكنك الإلغاء في أي وقت لإيقاف التجديد، ويبقى وصولك قائماً حتى نهاية المدة التي دفعتها." en="You can cancel at any time to stop renewal, and you keep access until the end of the period you have paid for." /></p>
            <p><Bi ar="تتجدد مرات الاستخدام كل شهر من تاريخ بداية اشتراكك، حتى في الاشتراك السنوي، ولا ينتقل ما لم يُستخدم إلى الشهر التالي." en="Uses reset every month from the date your subscription starts, including on a yearly plan. Unused uses do not carry over." /></p>
            <p><Bi ar="الطلبات التي تفشل بخطأ لا تُحسب عادةً من حدّك. تظهر الضرائب، إن وُجدت، عند الدفع." en="Requests that fail with an error are generally not counted against your limit. Taxes, if any, are shown at checkout." /></p>
            <p>
              <Bi ar="جميع المبيعات نهائية. " en="All sales are final. " />
              <Link href="/refund" style={{ color: 'var(--gold-deep)' }}><Bi ar="سياسة الاسترجاع" en="Refund Policy" /></Link>
              {' · '}
              <Link href="/terms" style={{ color: 'var(--gold-deep)' }}><Bi ar="شروط الاستخدام" en="Terms of Service" /></Link>
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .bill { display: inline-flex; gap: 4px; background: var(--cream); border: 1px solid var(--line); border-radius: 999px; padding: 4px; margin: 0 0 22px; }
        .bill-btn { font: inherit; font-weight: 700; color: var(--ink-soft); background: transparent; border: 0; border-radius: 999px; padding: 8px 20px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .bill-btn.on { background: var(--ink); color: var(--ivory); }
        .bill-tag { font-size: 0.75rem; font-weight: 700; color: var(--gold-deep); background: var(--white); border-radius: 999px; padding: 2px 8px; }
        .plans { display: grid; gap: 22px; grid-template-columns: repeat(3, 1fr); }
        .plan { background: var(--white); border: 1px solid var(--line); border-radius: 12px; padding: 26px 24px; display: flex; flex-direction: column; }
        .plan-name { font-size: 1.35rem; font-weight: 800; margin: 0 0 6px; }
        .plan-price-row { display: flex; align-items: baseline; gap: 12px; direction: ltr; flex-wrap: wrap; }
        .plan-price { font-family: var(--f-en); font-weight: 700; font-size: 2.6rem; color: var(--gold-deep); direction: ltr; text-align: start; line-height: 1.1; }
        .plan-per { font-family: var(--f-body); font-size: 1rem; font-weight: 500; color: var(--ink-soft); }
        .plan-was { font-family: var(--f-en); font-weight: 600; font-size: 1.5rem; color: var(--ink-soft); text-decoration: line-through; }
        .plan-launch { margin-top: 6px; color: var(--gold-deep); font-size: 0.88rem; font-weight: 700; }
        .plan-note { margin: 8px 0 0; color: var(--ink-soft); font-size: 0.9rem; min-height: 2.6em; }
        .plan-sub { margin: 14px 0 8px; color: var(--ink-soft); font-size: 0.92rem; font-weight: 700; }
        .plan-list { list-style: none; margin: 0 0 22px; padding: 0; flex: 1; }
        .plan-list li { display: flex; gap: 12px; padding: 7px 0; border-bottom: 1px solid var(--line); }
        .plan-list li:last-child { border-bottom: 0; }
        .plan-n { min-width: 34px; font-weight: 800; direction: ltr; text-align: start; }
        @media (max-width: 860px) { .plans { grid-template-columns: 1fr; } .plan-note { min-height: 0; } }
      `}</style>
    </SiteLayout>
  );
}
