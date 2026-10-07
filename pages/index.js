import Link from 'next/link';
import SiteLayout, { Bi, ProductImage } from '../components/SiteLayout';
import { PRODUCTS, TOOL_GROUPS, SITE, ltr } from '../lib/site';

export default function Home() {
  return (
    <SiteLayout
      title=""
      description="AI tools for fashion designers, plus guides and Procreate brushes and stamps. / أدوات ذكاء اصطناعي لمصممي الأزياء، مع أدلة وفرش وستامبات Procreate."
    >
      {/* ===== الواجهة ===== */}
      <section className="s-hero">
        <div className="s-wrap">
          <div className="s-eyebrow"><Bi ar="استوديو الأزياء الرقمي" en="Digital Fashion Studio" /></div>
          <h1 className="s-h1">
            <Bi ar="أدوات ذكاء اصطناعي لمصممي الأزياء" en="AI tools for fashion designers" />
          </h1>
          <hr className="s-rule" />
          <p className="s-lead">
            <Bi
              ar="من لوحة الإلهام إلى الرسمة التقنية والتيك باك، مع ملفات رقمية لبرنامج Procreate."
              en="From the mood board to the technical drawing and tech pack, plus digital files for Procreate."
            />
          </p>
          <div className="s-actions">
            <a href="/app" className="s-btn primary"><Bi ar="الدخول إلى الأداة" en="Open the tool" /></a>
            <Link href="/shop" className="s-btn ghost"><Bi ar="تصفّح المتجر" en="Browse the shop" /></Link>
          </div>
        </div>
      </section>

      {/* ===== الأداة ===== */}
      <section className="s-section alt" id="tool">
        <div className="s-wrap">
          <div className="s-sec-head">
            <h2 className="s-h2"><Bi ar="الأداة" en="The tool" /></h2>
            <p className="s-sec-sub">
              <Bi
                ar="تسع أدوات في مكان واحد، من التصميم إلى الإنتاج والتسويق."
                en="Nine tools in one place, from design to production and marketing."
              />
            </p>
          </div>
          {TOOL_GROUPS.map((g) => (
            <div className="s-tool-group" key={g.label.en}>
              <div className="s-group-label"><Bi ar={g.label.ar} en={g.label.en} /></div>
              <div className="s-grid">
                {g.items.map((t) => (
                  <div className="s-tool" key={t.num}>
                    <div className="s-tool-num">{t.num}</div>
                    <div className="s-tool-name"><Bi ar={t.name.ar} en={t.name.en} /></div>
                    <div className="s-tool-desc"><Bi ar={t.desc.ar} en={t.desc.en} /></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="s-note">
            <Bi
              ar="يتطلب استخدام الأدوات تسجيل الدخول. خطط الاشتراك قريباً."
              en="Signing in is required to use the tools. Subscription plans are coming soon."
            />
          </p>
          <div className="s-actions" style={{ marginTop: 18 }}>
            <a href="/app" className="s-btn primary"><Bi ar="الدخول إلى الأداة" en="Open the tool" /></a>
          </div>
        </div>
      </section>

      {/* ===== المتجر ===== */}
      <section className="s-section" id="shop">
        <div className="s-wrap">
          <div className="s-sec-head">
            <h2 className="s-h2"><Bi ar="المتجر" en="The shop" /></h2>
            <p className="s-sec-sub">
              <Bi
                ar="أدلة وفرش وستامبات رقمية. يصلك رابط التحميل على بريدك بعد الدفع."
                en="Digital guides, brushes and stamps. The download link is sent to your email after payment."
              />
            </p>
          </div>
          <div className="s-pgrid">
            {PRODUCTS.map((p) => (
              <Link href={`/shop/${p.slug}`} className="s-card" key={p.slug}>
                <div className="s-card-img">
                  <ProductImage slug={p.slug} alt={p.name.en} label={<Bi ar={p.name.ar} en={p.name.en} />} />
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

      {/* ===== من نحن ===== */}
      <section className="s-section alt">
        <div className="s-wrap" style={{ maxWidth: 760 }}>
          <h2 className="s-h2"><Bi ar="عن الموقع" en="About" /></h2>
          <p className="s-sec-sub" style={{ fontSize: '1.05rem' }}>
            <Bi
              ar={`${ltr(SITE.name)} من تأسيس غدير بركات، مصممة أزياء رقمية. تشغّله ${ltr(SITE.operator)}، ${SITE.location.ar}.`}
              en={`${SITE.name} was founded by Ghadir Barakat, a digital fashion designer. It is operated by ${SITE.operator}, ${SITE.location.en}.`}
            />
          </p>
          <p className="s-sec-sub" style={{ marginTop: 10 }}>
            <Bi ar="للأسئلة والدعم: " en="Questions and support: " />
            <a href={`mailto:${SITE.email}`} style={{ color: 'var(--gold-deep)' }}>{SITE.email}</a>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
