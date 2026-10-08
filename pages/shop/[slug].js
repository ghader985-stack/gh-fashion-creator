import Link from 'next/link';
import SiteLayout, { Bi, ProductImage } from '../../components/SiteLayout';
import { PRODUCTS, getProduct, orderHref } from '../../lib/site';

export async function getStaticPaths() {
  return { paths: PRODUCTS.map((p) => ({ params: { slug: p.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  return { props: { slug: params.slug } };
}

export default function ProductPage({ slug }) {
  const p = getProduct(slug);
  if (!p) return null;
  const buy = orderHref(`Order: ${p.name.en}`, p.checkoutUrl);
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
            <h1><Bi ar={p.name.ar} en={p.name.en} /></h1>
            <p className="s-prod-tag"><Bi ar={p.tagline.ar} en={p.tagline.en} /></p>
            <div className="s-prod-price">${p.price} USD</div>

            <a className="s-btn primary full" href={buy} {...(p.checkoutUrl ? { rel: 'noopener noreferrer' } : {})}>
              <Bi ar="اشترِ الآن" en="Buy now" />
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
