// components/SiteLayout.js
// الغلاف المشترك لصفحات الموقع (الرئيسية، المتجر، السياسات، التواصل): شريط علوي، فوتر، ثنائية اللغة.
// اللغتان موجودتان بالـ HTML دايماً، والمتصفح بيخفي وحدة منهم حسب data-lang على <html>.
// هيك الزائر وروبوتات المراجعة بيشوفوا النصين، وما في وميض عند التحميل.

import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { SITE, ltr, waLink } from '../lib/site';

// يُنفَّذ بالـ <head> قبل رسم الصفحة: يحدد اللغة من اختيار الزائر المحفوظ، وإلا من لغة المتصفح.
const LANG_SCRIPT = `(function(){var l='en';try{var s=localStorage.getItem('gh_site_lang');if(s==='ar'||s==='en'){l=s;}else{throw 0;}}catch(e){try{var a=navigator.languages||[navigator.language||''];for(var i=0;i<a.length;i++){if(String(a[i]).toLowerCase().indexOf('ar')===0){l='ar';break;}}}catch(e2){}}var d=document.documentElement;d.setAttribute('data-lang',l);d.setAttribute('lang',l);d.setAttribute('dir',l==='ar'?'rtl':'ltr');})();`;

function switchLang() {
  try {
    const d = document.documentElement;
    const next = d.getAttribute('data-lang') === 'ar' ? 'en' : 'ar';
    d.setAttribute('data-lang', next);
    d.setAttribute('lang', next);
    d.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');
    try { localStorage.setItem('gh_site_lang', next); } catch (e) { /* التخزين غير متاح: التبديل يبقى للصفحة الحالية */ }
  } catch (e) { /* لا شيء */ }
}

// نص بلغتين داخل سطر أو عنصر.
export function Bi({ ar, en, as: Tag = 'span' }) {
  return (
    <>
      <Tag className="ar" lang="ar">{ar}</Tag>
      <Tag className="en" lang="en">{en}</Tag>
    </>
  );
}

// صورة المنتج: تجرّب png ثم jpg ثم webp من public/products/<slug>.<ext>، وإن ما لقيت بتعرض بطاقة بديلة.
const EXTS = ['png', 'jpg', 'webp'];
export function ProductImage({ slug, alt, label, dir = 'products' }) {
  const [i, setI] = useState(0);
  const ref = useRef(null);
  // لو فشل تحميل الصورة قبل ما React يركّب الصفحة (ما وصل حدث onError): نلتقطه عند التركيب مرة وحدة.
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setI((n) => (n === 0 ? 1 : n));
  }, []);
  if (i >= EXTS.length) {
    return (
      <div className="s-ph" role="img" aria-label={alt}>
        <span className="s-ph-mark">GH</span>
        <span className="s-ph-label">{label}</span>
      </div>
    );
  }
  return (
    <img
      ref={ref}
      src={`/${dir}/${slug}.${EXTS[i]}`}
      alt={alt}
      loading="lazy"
      onError={() => setI((n) => (n === i ? n + 1 : n))}
    />
  );
}

export default function SiteLayout({ title, description, children, dark = false }) {
  const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} | AI tools for fashion designers`;
  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {description ? <meta name="description" content={description} /> : null}
        <meta property="og:title" content={fullTitle} />
        {description ? <meta property="og:description" content={description} /> : null}
        <meta property="og:site_name" content={SITE.name} />
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..800;1,6..96,400..800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Reem+Kufi:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />
      </Head>

      <header className={'s-head' + (dark ? ' dark' : '')}>
        <div className="s-wrap s-head-in">
          <Link href="/" className="s-brand" aria-label={SITE.name}>
            <span className="s-logo">GH</span>
            <span className="s-brand-name">{SITE.name}</span>
          </Link>
          <nav className="s-nav" aria-label="Main">
            <a href="/app"><Bi ar="الأداة" en="Tool" /></a>
            <Link href="/shop"><Bi ar="المتجر" en="Shop" /></Link>
            <Link href="/pricing"><Bi ar="الأسعار" en="Pricing" /></Link>
            <Link href="/#about"><Bi ar="عنّي" en="About" /></Link>
            <Link href="/contact"><Bi ar="تواصل" en="Contact" /></Link>
            <button type="button" className="s-lang" onClick={switchLang}>
              <span className="ar" lang="en">English</span>
              <span className="en" lang="ar">عربي</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="s-main">{children}</main>

      <footer className="s-foot">
        <div className="s-wrap s-foot-grid">
          <div>
            <div className="s-brand s-brand-foot">
              <span className="s-logo">GH</span>
              <span className="s-brand-name">{SITE.name}</span>
            </div>
            <p className="s-foot-note">
              <Bi
                ar={`${ltr(SITE.name)} تشغّلها ${ltr(SITE.operator)}، ${SITE.location.ar}.`}
                en={`${SITE.name} is operated by ${SITE.operator}, ${SITE.location.en}.`}
              />
            </p>
            <p className="s-foot-note">
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </p>
            <p className="s-foot-note">
              <a href={SITE.instagram} rel="noopener noreferrer"><bdi>{SITE.instagramHandle}</bdi></a>
              {SITE.whatsapp ? <> · <a href={waLink()} rel="noopener noreferrer"><bdi>{SITE.whatsappDisplay || 'WhatsApp'}</bdi></a></> : null}
            </p>
          </div>
          <div>
            <div className="s-foot-h"><Bi ar="الموقع" en="Explore" /></div>
            <ul>
              <li><a href="/app"><Bi ar="الأداة" en="The tool" /></a></li>
              <li><Link href="/shop"><Bi ar="المتجر" en="Shop" /></Link></li>
              <li><Link href="/pricing"><Bi ar="الخطط والأسعار" en="Plans and pricing" /></Link></li>
              <li><Link href="/#about"><Bi ar="عنّي" en="About" /></Link></li>
              <li><Link href="/contact"><Bi ar="تواصل" en="Contact" /></Link></li>
            </ul>
          </div>
          <div>
            <div className="s-foot-h"><Bi ar="السياسات" en="Legal" /></div>
            <ul>
              <li><Link href="/privacy"><Bi ar="سياسة الخصوصية" en="Privacy Policy" /></Link></li>
              <li><Link href="/terms"><Bi ar="شروط الاستخدام" en="Terms of Service" /></Link></li>
              <li><Link href="/refund"><Bi ar="سياسة الاسترجاع" en="Refund Policy" /></Link></li>
            </ul>
          </div>
        </div>
        <div className="s-wrap s-foot-legal">
          <Bi
            ar="Procreate علامة تجارية لشركة Savage Interactive Pty Ltd. هذا الموقع غير تابع لها ولا مدعوم منها."
            en="Procreate is a trademark of Savage Interactive Pty Ltd. This site is not affiliated with or endorsed by them."
          />
          <span className="s-copy">© 2026 <bdi>{SITE.operator}</bdi></span>
        </div>
      </footer>

      <style jsx global>{`
        :root {
          --cream: #ece4d6;
          --ivory: #f5efe4;
          --white: #fffdf8;
          --ink: #17120f;
          --ink-soft: #66594d;
          --gold: #b98f4e;
          --gold-deep: #8f6a2e;
          --line: #ddd2bf;
          --night: #110e0d;
          --bone: #ece4d6;
          --thread: #c9a463;
          --plum: #6d4f5e;
          --teal: #4d8189;
          --brick: #b9553f;
          --f-ar: 'Reem Kufi', 'IBM Plex Sans Arabic', sans-serif;
          --f-en: 'Bodoni Moda', 'Didot', 'Times New Roman', serif;
          --f-body: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif;
        }
        html:not([data-lang='ar']) .ar { display: none !important; }
        html[data-lang='ar'] .en { display: none !important; }
        *, *::before, *::after { box-sizing: border-box; }
        html { -webkit-text-size-adjust: 100%; }
        body {
          margin: 0; background: var(--ivory); color: var(--ink);
          font-family: var(--f-body); line-height: 1.7; font-size: 16px;
        }
        a { color: inherit; }
        img { max-width: 100%; display: block; }
        :focus-visible { outline: 2px solid var(--gold-deep); outline-offset: 3px; border-radius: 4px; }

        .s-wrap { width: 100%; max-width: 1120px; margin: 0 auto; padding-inline: 20px; }

        /* ===== الشريط العلوي ===== */
        .s-head { position: sticky; top: 0; z-index: 20; background: rgba(253, 250, 243, 0.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
        .s-head-in { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 64px; flex-wrap: wrap; padding-block: 8px; }
        .s-brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
        .s-logo {
          width: 38px; height: 38px; border-radius: 8px; background: var(--ink); color: var(--ivory);
          display: inline-flex; align-items: center; justify-content: center;
          font-family: var(--f-en); font-weight: 700; font-size: 1.15rem; letter-spacing: 1px; flex-shrink: 0;
        }
        .s-brand-name { font-family: var(--f-en); font-size: 1.4rem; font-weight: 700; letter-spacing: 0.5px; direction: ltr; }
        .s-nav { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }
        .s-nav a { text-decoration: none; font-weight: 500; color: var(--ink-soft); }
        .s-nav a:hover { color: var(--ink); }
        .s-lang {
          font-family: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer;
          border: 1px solid var(--line); background: var(--cream); color: var(--ink);
          padding: 4px 14px; border-radius: 999px;
        }
        .s-lang:hover { border-color: var(--gold); }

        .s-head.dark { background: #110e0d; border-bottom-color: rgba(236, 228, 214, 0.14); }
        .s-head.dark .s-logo { background: var(--ivory); color: var(--ink); }
        .s-head.dark .s-brand-name { color: var(--ivory); }
        .s-head.dark .s-nav a { color: #cdbfa8; }
        .s-head.dark .s-nav a:hover { color: var(--ivory); }
        .s-head.dark .s-lang { background: transparent; color: var(--ivory); border-color: rgba(236, 228, 214, 0.4); }
        .s-head.dark .s-lang:hover { border-color: var(--thread); }

        /* ===== عام ===== */
        .s-main { min-height: 60vh; }
        .s-eyebrow { font-family: var(--f-en); font-style: italic; color: var(--gold-deep); font-size: 1.05rem; letter-spacing: 1px; }
        .s-h1 { font-family: var(--f-en); font-size: clamp(2.2rem, 5.2vw, 3.8rem); line-height: 1.12; font-weight: 700; margin: 8px 0 18px; }
        html[data-lang='ar'] .s-h1 { font-family: var(--f-ar); font-weight: 700; line-height: 1.3; }
        .s-h2 { font-family: var(--f-en); font-size: clamp(1.7rem, 3.4vw, 2.3rem); font-weight: 700; margin: 0 0 6px; line-height: 1.2; }
        html[data-lang='ar'] .s-h2 { font-family: var(--f-ar); font-weight: 700; }
        .s-lead { color: var(--ink-soft); font-size: 1.12rem; max-width: 640px; margin: 0 0 26px; }
        .s-section { padding-block: 56px; }
        .s-section.alt { background: var(--cream); border-block: 1px solid var(--line); }
        .s-sec-head { margin-bottom: 28px; }
        .s-sec-sub { color: var(--ink-soft); margin: 0; }

        .s-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 1rem; font-family: inherit;
          text-decoration: none; cursor: pointer; border: 1px solid var(--ink); transition: background .18s, color .18s;
        }
        .s-btn.primary { background: var(--ink); color: var(--ivory); }
        .s-btn.primary:hover { background: #000; }
        .s-btn.ghost { background: transparent; color: var(--ink); }
        .s-btn.ghost:hover { background: var(--cream); }
        .s-btn[disabled], .s-btn.disabled { opacity: 0.55; cursor: not-allowed; pointer-events: none; }
        .s-btn.full { width: 100%; }
        .s-actions { display: flex; gap: 12px; flex-wrap: wrap; }

        /* ===== الرئيسية ===== */
        .s-rule { width: 64px; height: 2px; background: var(--gold); margin: 0 auto 22px; border: 0; }

        .s-tool-group { margin-bottom: 30px; }
        .s-tool-group:last-child { margin-bottom: 0; }
        .s-group-label { font-weight: 800; color: var(--gold-deep); margin-bottom: 12px; letter-spacing: 0.5px; }
        .s-grid { display: grid; gap: 16px; grid-template-columns: repeat(3, 1fr); }
        .s-tool { background: var(--white); border: 1px solid var(--line); border-radius: 10px; padding: 18px 20px; }
        .s-tool-num { font-family: var(--f-en); font-style: italic; color: var(--gold); font-size: 1.05rem; }
        .s-tool-name { font-weight: 800; font-size: 1.1rem; }
        .s-tool-desc { color: var(--ink-soft); font-size: 0.95rem; }
        .s-note { margin-top: 24px; color: var(--ink-soft); font-size: 0.95rem; }

        /* ===== المنتجات ===== */
        .s-pgrid { display: grid; gap: 22px; grid-template-columns: repeat(3, 1fr); }
        .s-card { background: var(--white); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; text-decoration: none; transition: border-color .18s, transform .18s; }
        .s-card:hover { border-color: var(--gold); transform: translateY(-2px); }
        .s-card-img { aspect-ratio: 4 / 5; background: var(--cream); display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .s-card-img img { width: 100%; height: 100%; object-fit: contain; }
        .s-card-body { padding: 16px 18px 20px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .s-card-name { font-weight: 800; font-size: 1.08rem; line-height: 1.4; }
        .s-card-tag { color: var(--ink-soft); font-size: 0.93rem; flex: 1; }
        .s-price { font-family: var(--f-en); font-weight: 700; font-size: 1.5rem; color: var(--gold-deep); margin-top: 8px; direction: ltr; text-align: start; }
        .s-ph { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 24px; text-align: center; background: linear-gradient(160deg, #f3e9d6, #ebdfc7); }
        .s-ph-mark { width: 64px; height: 64px; border-radius: 12px; background: var(--ink); color: var(--ivory); display: inline-flex; align-items: center; justify-content: center; font-family: var(--f-en); font-weight: 700; font-size: 1.6rem; letter-spacing: 1px; }
        .s-ph-label { color: var(--ink-soft); font-weight: 700; font-size: 0.95rem; line-height: 1.5; }

        .s-crumbs { padding-block: 20px 0; font-size: 0.92rem; color: var(--ink-soft); }
        .s-crumbs a { text-decoration: none; }
        .s-crumbs a:hover { color: var(--ink); text-decoration: underline; }
        .s-prod { display: grid; gap: 40px; grid-template-columns: 1fr 1fr; align-items: start; padding-block: 28px 64px; }
        .s-prod-img { background: var(--cream); border: 1px solid var(--line); border-radius: 12px; aspect-ratio: 4 / 5; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .s-prod-img img { width: 100%; height: 100%; object-fit: contain; }
        .s-prod-info h1 { font-size: clamp(1.7rem, 3.4vw, 2.4rem); margin: 0 0 6px; line-height: 1.25; font-weight: 800; }
        .s-prod-tag { color: var(--ink-soft); font-size: 1.1rem; margin: 0 0 14px; }
        .s-prod-price { font-family: var(--f-en); font-weight: 700; font-size: 2.2rem; color: var(--gold-deep); direction: ltr; text-align: start; margin-bottom: 14px; }
        .s-prod-info p { margin: 0 0 12px; }
        .s-prod-info h3 { margin: 22px 0 8px; font-size: 1.02rem; font-weight: 800; }
        .s-prod-info ul { margin: 0 0 10px; padding-inline-start: 20px; }
        .s-prod-info li { margin-bottom: 4px; }
        .s-fine { font-size: 0.9rem; color: var(--ink-soft); margin-top: 14px; }
        .s-fine a { color: var(--gold-deep); }
        .s-box { border: 1px solid var(--line); background: var(--cream); border-radius: 10px; padding: 14px 16px; margin-top: 18px; font-size: 0.95rem; color: var(--ink-soft); }
        .s-box p { margin: 0 0 6px; }
        .s-box p:last-child { margin: 0; }

        /* ===== صفحات النصوص ===== */
        .s-doc { max-width: 780px; padding-block: 48px 72px; }
        .s-doc h1 { font-size: clamp(1.9rem, 4vw, 2.6rem); margin: 0 0 6px; line-height: 1.2; font-weight: 800; }
        .s-doc-date { color: var(--ink-soft); margin: 0 0 30px; font-size: 0.95rem; }
        .s-doc h2 { font-size: 1.3rem; margin: 34px 0 10px; font-weight: 800; }
        .s-doc p { margin: 0 0 12px; }
        .s-doc ul { margin: 0 0 14px; padding-inline-start: 22px; }
        .s-doc li { margin-bottom: 6px; }
        .s-doc a { color: var(--gold-deep); }

        /* ===== الفوتر ===== */
        .s-foot { background: var(--cream); border-top: 1px solid var(--line); padding-top: 44px; }
        .s-foot-grid { display: grid; gap: 32px; grid-template-columns: 1.6fr 1fr 1fr; }
        .s-brand-foot { margin-bottom: 10px; }
        .s-foot-note { color: var(--ink-soft); font-size: 0.93rem; margin: 0 0 6px; max-width: 360px; }
        .s-foot-note a { color: var(--ink); }
        .s-foot-h { font-weight: 800; margin-bottom: 10px; }
        .s-foot ul { list-style: none; margin: 0; padding: 0; }
        .s-foot li { margin-bottom: 6px; }
        .s-foot li a { text-decoration: none; color: var(--ink-soft); }
        .s-foot li a:hover { color: var(--ink); text-decoration: underline; }
        .s-foot-legal { display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--line); margin-top: 32px; padding-block: 18px 26px; color: var(--ink-soft); font-size: 0.85rem; }

        @media (max-width: 860px) {
          .s-grid, .s-pgrid { grid-template-columns: repeat(2, 1fr); }
          .s-prod { grid-template-columns: 1fr; gap: 24px; }
          .s-foot-grid { grid-template-columns: 1fr 1fr; }
          .s-foot-grid > div:first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 560px) {
          .s-grid, .s-pgrid { grid-template-columns: 1fr; }
          .s-section { padding-block: 40px; }
          .s-head-in { justify-content: center; }
          .s-nav { gap: 16px; justify-content: center; }
          .s-btn { width: 100%; }
        }
      `}</style>
    </>
  );
}

// ===== صفحة سياسة: عنوان + تاريخ + أقسام (كل قسم: h + body، والـ body مصفوفة فقرات أو {ul:[...]}) =====
function renderBlocks(blocks) {
  return blocks.map((b, i) => {
    if (typeof b === 'string') return <p key={i}>{b}</p>;
    if (b && b.ul) return <ul key={i}>{b.ul.map((x, j) => <li key={j}>{x}</li>)}</ul>;
    if (b && b.html) return <p key={i} dangerouslySetInnerHTML={{ __html: b.html }} />;
    return null;
  });
}

export function PolicyPage({ doc, description }) {
  return (
    <SiteLayout title={`${doc.title.en} · ${doc.title.ar}`} description={description}>
      <div className="s-wrap s-doc">
        {['ar', 'en'].map((lang) => (
          <div className={lang} lang={lang} key={lang}>
            <h1>{doc.title[lang]}</h1>
            <p className="s-doc-date">
              {lang === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}{SITE.updated[lang]}
            </p>
            {doc.sections.map((s, i) => (
              <section key={i}>
                <h2>{s.h[lang]}</h2>
                {renderBlocks(s.body[lang])}
              </section>
            ))}
          </div>
        ))}
      </div>
    </SiteLayout>
  );
}
