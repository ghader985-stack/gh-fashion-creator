import SiteLayout, { Bi } from '../components/SiteLayout';
import { SITE, waLink } from '../lib/site';

export default function Contact() {
  return (
    <SiteLayout
      title="Contact · تواصل"
      description="Contact GH Couture AI for purchase help, tool support and privacy requests. / تواصل مع GH Couture AI."
    >
      <div className="s-wrap s-doc">
        <div className="s-eyebrow"><Bi ar="نسعد بسماعك" en="Get in touch" /></div>
        <h1><Bi ar="تواصل معنا" en="Contact us" /></h1>

        <div className="ar" lang="ar">
          <p>للمساعدة في عملية شراء، أو دعم الأدوات، أو طلبات الخصوصية مثل حذف الصور والبيانات، راسلنا على البريد الإلكتروني:</p>
        </div>
        <div className="en" lang="en">
          <p>For help with a purchase, support with the tools, or privacy requests such as deleting your images and data, email us:</p>
        </div>

        <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </p>

        <div className="ar" lang="ar">
          <p>عند السؤال عن عملية شراء، اذكر البريد الإلكتروني الذي استخدمته عند الدفع والمنتج الذي اشتريته.</p>
          <h2>الجهة المشغّلة</h2>
          <p><bdi>{SITE.name}</bdi> تشغّلها <bdi>{SITE.operator}</bdi>، {SITE.location.ar}.</p>
          <h2>تابعنا</h2>
          <p><a href={SITE.instagram} rel="noopener noreferrer"><bdi>Instagram {SITE.instagramHandle}</bdi></a></p>
          {SITE.whatsapp ? <p><a href={waLink()} rel="noopener noreferrer">واتساب <bdi>{SITE.whatsappDisplay}</bdi></a></p> : null}
        </div>
        <div className="en" lang="en">
          <p>When asking about a purchase, mention the email address you used at checkout and the product you bought.</p>
          <h2>Operator</h2>
          <p>{SITE.name} is operated by {SITE.operator}, {SITE.location.en}.</p>
          <h2>Follow us</h2>
          <p><a href={SITE.instagram} rel="noopener noreferrer">Instagram {SITE.instagramHandle}</a></p>
          {SITE.whatsapp ? <p><a href={waLink()} rel="noopener noreferrer">WhatsApp <bdi>{SITE.whatsappDisplay}</bdi></a></p> : null}
        </div>
      </div>
    </SiteLayout>
  );
}
