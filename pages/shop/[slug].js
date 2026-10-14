import Link from 'next/link';
import SiteLayout, { Bi, ProductImage, GiftBox } from '../../components/SiteLayout';
import { PRODUCTS, LAUNCH_GIFT, getProduct, orderHref } from '../../lib/site';

export async function getStaticPaths() {
  return { paths: PRODUCTS.map((p) => ({ params: { slug: p.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  return { props: { slug: params.slug } };
}

export default function ProductPage({ slug }) {
  const p = getProduct(slug);
  if (!p) return null;
  const co = p.checkoutUrl || {};
  const buyAr = orderHref(`Order: ${p.name.en}`, co.ar);
  const buyEn = orderHref(`Order: ${p.name.en}`, co.en);
  const isGift = p.slug === LAUNCH_GIFT.slug;
  return (
    <SiteLayout
      title={`${p.name.en} · ${p.name.ar}`}
      description={`${p.tagline.en} / ${p.tagline.ar}`}
    >
      <div className="s-wrap">
        <div className="s-crumbs">
          <Link href="/shop"><Bi ar="المتجر" en="Shop" /></Link>
        </div>
        <div className="s-prod">
          <div className="s-prod-img">
            <ProductImage slug={p.slug} alt={p.name.en} label={<Bi ar={p.name.ar} en={p.name.en} />} />
          </div>
          <div className="s-prod-info">
            {isGift ? <GiftBox kind="pearl" /> : null}
            <h1><Bi ar={p.name.ar} en={p.name.en} /></h1>
            <p className="s-prod-tag"><Bi ar={p.tagline.ar} en={p.tagline.en} /></p>
            <div className="s-prod-price">${p.price} USD</div>
            <p style={{ margin: '-4px 0 14px', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
              <Bi ar="الضريبة، إن وُجدت، تُضاف عند الدفع حسب بلدك." en="Tax, where applicable, is added at checkout based on your country." />
            </p>

            {!isGift ? <GiftBox kind="product" /> : null}

            {/* منتجان منفصلان بمنصة الدفع: نسخة عربية بملفات عربية، ونسخة إنجليزية بملفات إنجليزية. اللغة الظاهرة بالموقع بتحدد الزر الظاهر. */}
            <a className="s-btn primary full ar" lang="ar" href={buyAr} {...(co.ar ? { rel: 'noopener noreferrer' } : {})}>
              اشترِ الآن
            </a>
            <a className="s-btn primary full en" lang="en" href={buyEn} {...(co.en ? { rel: 'noopener noreferrer' } : {})}>
              Buy now
            </a>

            <div className="ar" lang="ar">
              {p.about.ar.map((t, i) => <p key={i} style={{ marginTop: i === 0 ? 22 : 0 }}>{t}</p>)}
              <h3>ماذا ستحصل عليه</h3>
              <ul>{p.includes.ar.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
            <div className="en" lang="en">
              {p.about.en.map((t, i) => <p key={i} style={{ marginTop: i === 0 ? 22 : 0 }}>{t}</p>)}
              <h3>What you get</h3>
              <ul>{p.includes.en.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>

            <div className="s-box">
              <p><Bi ar="ملف رقمي: يصلك رابط التحميل على بريدك بعد إتمام الدفع." en="Digital file: the download link is sent to your email after payment." /></p>
              <p>
                <Bi ar="جميع المبيعات نهائية. " en="All sales are final. " />
                <Link href="/refund" style={{ color: 'var(--gold-deep)' }}><Bi ar="سياسة الاسترجاع" en="Refund Policy" /></Link>
                {' · '}
                <Link href="/terms" style={{ color: 'var(--gold-deep)' }}><Bi ar="رخصة الاستخدام" en="Licence terms" /></Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
