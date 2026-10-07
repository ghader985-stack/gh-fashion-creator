import Link from 'next/link';
import SiteLayout, { Bi, ProductImage } from '../../components/SiteLayout';
import { PRODUCTS } from '../../lib/site';

export default function Shop() {
  return (
    <SiteLayout
      title="Shop · المتجر"
      description="Digital guides, Procreate brushes and stamps for fashion designers. / أدلة رقمية وفرش وستامبات Procreate لمصممي الأزياء."
    >
      <section className="s-section">
        <div className="s-wrap">
          <div className="s-sec-head">
            <div className="s-eyebrow"><Bi ar="ملفات رقمية" en="Digital files" /></div>
            <h1 className="s-h1" style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}><Bi ar="المتجر" en="Shop" /></h1>
            <p className="s-lead">
              <Bi
                ar="أدلة وفرش وستامبات لبرنامج Procreate لمصممي الأزياء. ملفات رقمية يصلك رابط تحميلها على بريدك بعد الدفع."
                en="Guides, and Procreate brushes and stamps for fashion designers. Digital files: the download link is sent to your email after payment."
              />
            </p>
          </div>
          <div className="s-pgrid">
            {PRODUCTS.map((p) => (
              <Link href={`/shop/${p.slug}`} className="s-card" key={p.slug}>
                <div className="s-card-img">
                  <ProductImage
                    slug={p.slug}
                    alt={p.name.en}
                    label={<Bi ar={p.name.ar} en={p.name.en} />}
                  />
                </div>
                <div className="s-card-body">
                  <div className="s-card-name"><Bi ar={p.name.ar} en={p.name.en} /></div>
                  <div className="s-card-tag"><Bi ar={p.tagline.ar} en={p.tagline.en} /></div>
                  <div className="s-price">${p.price}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
