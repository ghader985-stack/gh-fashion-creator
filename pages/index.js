import Link from 'next/link';
import SiteLayout, { Bi, ProductImage } from '../components/SiteLayout';
import { Hero, PlansBand } from '../components/Atelier';
import { PRODUCTS, TOOL_GROUPS, SITE, ltr, waLink } from '../lib/site';

const SHOTS = [
  { name: { ar: 'معلّقة (كاتالوج)', en: 'Hanging (catalogue)' }, desc: { ar: 'القطعة على حامل، بخلفية استوديو نظيفة.', en: 'The piece on a mannequin against a clean studio backdrop.' } },
  { name: { ar: 'مسطّحة', en: 'Flat lay' }, desc: { ar: 'القطعة مفرودة، من الأعلى.', en: 'The piece laid out flat, seen from above.' } },
  { name: { ar: 'على موديل', en: 'On a model' }, desc: { ar: 'كيف تبدو القطعة على الجسم.', en: 'How the piece looks when it is worn.' } },
  { name: { ar: 'تفاصيل', en: 'Details' }, desc: { ar: 'لقطات قريبة للياقة والأكمام والقماش.', en: 'Close-ups of the collar, cuffs and fabric.' } },
];

const IgIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const WaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.6-4.2A8.5 8.5 0 1 1 20.5 11.5z" />
    <path d="M9 8.5c.3 2.6 2.9 5.2 5.5 5.5l1.2-1.3-2-1-.9.7a4 4 0 0 1-1.8-1.8l.7-.9-1-2z" fill="currentColor" stroke="none" />
  </svg>
);

export default function Home() {
  return (
    <SiteLayout
      title=""
      description="AI tools for fashion designers, plus guides and Procreate brushes and stamps. / أدوات ذكاء اصطناعي لمصممي الأزياء، مع أدلة وفرش وستامبات Procreate."
    >
      {/* ===== الواجهة ===== */}
      <Hero>
        <div className="hm-hero-text">
          <h1 className="hm-h1">
            <Bi ar="اكتب وصف القطعة وشاهدها تتحوّل إلى تصميم" en="Describe the piece and watch it become a design" />
          </h1>
          <p className="hm-lead">
            <Bi
              ar={`أدوات ذكاء اصطناعي لمصممي الأزياء: لوحة إلهام، صور منتج، رسمة تقنية وتيك باك. ومعها فرش وستامبات لبرنامج ${ltr('Procreate')}.`}
              en="AI tools for fashion designers: mood boards, product photos, technical drawings and tech packs. Plus brushes and stamps for Procreate."
            />
          </p>
          <div className="s-actions hm-cta">
            <a href="/app" className="s-btn primary"><Bi ar="الدخول إلى الأداة" en="Open the tool" /></a>
            <Link href="/shop" className="s-btn ghost"><Bi ar="تصفّح المتجر" en="Browse the shop" /></Link>
          </div>
        </div>
      </Hero>

      {/* ===== ما تحصل عليه ===== */}
      <section className="s-section alt" id="shots">
        <div className="s-wrap hm-shots">
          <div className="hm-shots-img">
            <img src="/showcase/details.jpg" alt="Close-up details of a wool coat: collar piping, button cuff and fabric panels" width="684" height="662" loading="lazy" />
          </div>
          <div>
            <h2 className="s-h2"><Bi ar="من صورة تصميمك إلى صور المنتج" en="From your design image to product photos" /></h2>
            <p className="s-sec-sub hm-shots-sub">
              <Bi ar="اختر نوع اللقطة، وتصلك الصورة بجودة جاهزة للكاتالوج." en="Choose the type of shot and get an image ready for your catalogue." />
            </p>
            <ul className="hm-shot-list">
              {SHOTS.map((s) => (
                <li key={s.name.en}>
                  <b><Bi ar={s.name.ar} en={s.name.en} /></b>
                  <span><Bi ar={s.desc.ar} en={s.desc.en} /></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== الأدوات ===== */}
      <section className="s-section" id="tool">
        <div className="s-wrap">
          <div className="s-sec-head">
            <h2 className="s-h2"><Bi ar="تسع أدوات في مكان واحد" en="Nine tools in one place" /></h2>
            <p className="s-sec-sub"><Bi ar="من التصميم إلى الإنتاج والتسويق." en="From design to production and marketing." /></p>
          </div>
          <div className="hm-tools">
            {TOOL_GROUPS.map((g) => (
              <div className="hm-tg" key={g.label.en}>
                <h3 className="hm-tg-label"><Bi ar={g.label.ar} en={g.label.en} /></h3>
                <ul className="hm-tg-list">
                  {g.items.map((t) => (
                    <li key={t.num}>
                      <b><Bi ar={t.name.ar} en={t.name.en} /></b>
                      <span><Bi ar={t.desc.ar} en={t.desc.en} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="s-note"><Bi ar="يتطلب استخدام الأدوات تسجيل الدخول والاشتراك في إحدى الخطط." en="Using the tools requires signing in and a subscription plan." /></p>
        </div>
      </section>

      <PlansBand />

      {/* ===== المتجر ===== */}
      <section className="s-section" id="shop">
        <div className="s-wrap">
          <div className="s-sec-head">
            <h2 className="s-h2"><Bi ar="المتجر" en="The shop" /></h2>
            <p className="s-sec-sub">
              <Bi ar="أدلة وفرش وستامبات رقمية. يصلك رابط التحميل على بريدك بعد الدفع." en="Digital guides, brushes and stamps. The download link is sent to your email after payment." />
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

      {/* ===== عنّي ===== */}
      <section className="s-section alt" id="about">
        <div className="s-wrap hm-about">
          <div className="hm-about-photo">
            <div className="hm-arch">
              <ProductImage dir="about" slug="ghadir" alt="Ghadir Barakat" label={<Bi ar="غدير بركات" en="Ghadir Barakat" />} />
            </div>
          </div>
          <div className="hm-about-text">
            <h2 className="s-h2"><Bi ar="أنا غدير بركات" en="I'm Ghadir Barakat" /></h2>
            <p className="hm-about-lead">
              <Bi
                ar="بحب الأزياء والرسم، وبحب أشوف الفكرة اللي بخيالي تاخد شكل وتكبر، من أول سكتش لحد التفاصيل اللي بتعطيها شخصيتها."
                en="I love fashion and drawing, and I love watching the idea in my imagination take shape and grow, from the first sketch to the details that give it its personality."
              />
            </p>
            <p>
              <Bi
                ar="شغلي بيجمع بين الفن وتصميم الأزياء والأدوات الرقمية، ومع كل تجربة عم أكتشف طرق جديدة أعبّر فيها عن أفكاري وأحوّلها لشي ممكن أشاركه مع غيري."
                en="My work brings together art, fashion design and digital tools, and with every experiment I discover new ways to express my ideas and turn them into something I can share with others."
              />
            </p>
            <p>
              <Bi
                ar="حلمي أبني مشروع يحمل بصمتي، وأقدّم فيه شي يفيد المصممات ويساعدهن يطوّروا أفكارهن بثقة. بحب التكنولوجيا والفرص اللي بتفتحها إلنا، وبهمّني نستخدمها بوعي، وتكون وسيلة توسّع إبداعنا وتخلينا نعبّر عن رؤيتنا بطريقتنا."
                en="My dream is to build a project that carries my signature, and to offer something that helps designers grow their ideas with confidence. I love technology and the doors it opens for us, and I care about using it consciously, as a way to widen our creativity and express our vision in our own way."
              />
            </p>
            <p>
              <Bi
                ar="ومن هون اشتغلت على بناء أداتي الخاصة لتصميم الأزياء بمساعدة الذكاء الاصطناعي. قضيت حوالي ستة أشهر ببنائها وتطويرها، وأنا عم أتعلّم وأجرّب وأراجع التفاصيل خطوة بخطوة. ورا هالشغل كانت رغبة إني أجمع مراحل شغل المصممة بمكان واحد، وأعطيها مساحة تستكشف فيها فكرتها وتجرّب احتمالاتها."
                en="From there I started building my own AI-assisted fashion design tool. I spent about six months building and developing it, learning, experimenting and reviewing the details step by step. Behind it was a wish to bring the different stages of a designer's work into one place, and to give her room to explore her idea and try its possibilities."
              />
            </p>
            <p>
              <Bi
                ar="بنيت الأداة بتسعة أقسام: المودبورد، والفلات سكتش، وتجربة الألوان والأقمشة وتنويعات التصميم، وعرض القطعة بلقطات استوديو من زوايا مختلفة، وصفحة التيك باك بالمعلومات الأساسية اللي بتقدر المصممة تكملها، وأفكار وكابشنات للسوشيال ميديا، وبرومبتات للفيديو. وكل قسم مرتبط بمرحلة من رحلة التصميم، من الإلهام لحد عرض الفكرة."
                en="I built the tool in nine sections: the mood board, the flat sketch, trying colours, fabrics and design variations, showing the piece in studio shots from different angles, a tech pack page with the basics a designer can complete, ideas and captions for social media, and prompts for video. Each section is tied to a stage of the design journey, from inspiration to presenting the idea."
              />
            </p>
            <p>
              <Bi
                ar="وبالتوازي بنيت موقعي ليكون المكان اللي بيجمع هالمشروع: الأداة، والملفات، والفرش، والستامبات. حبيت يكون فيه موارد عملية ترجع إلها المصممة وتستخدمها بشغلها، وتلاقي فيها شي يساعدها تتقدّم بفكرتها."
                en="In parallel I built my website to be the place that holds this project: the tool, the files, the brushes and the stamps. I wanted it to have practical resources a designer can come back to, use in her work, and find something in that helps her move her idea forward."
              />
            </p>
            <p>
              <Bi
                ar="وبأعمالي الفنية بهتم بالهوية وبالأشياء اللي بتشكّل وعينا: العلاقات والخبرات والقيم وأثر التكنولوجيا بحياتنا. بحب يكون ورا العمل معنى، وتكون تفاصيله قادرة تحكي قصة وتفتح مجال للتأمل."
                en="In my art I care about identity and the things that shape our awareness: relationships, experiences, values and the impact of technology on our lives. I like a work to have meaning behind it, with details that can tell a story and leave room for reflection."
              />
            </p>
            <p className="hm-about-creed">
              <Bi
                ar="هالموقع جزء من حلم عم أبنيه بإيدي، ومعه عم أكبر وأتعلّم."
                en="This website is part of a dream I'm building with my own hands, and I'm growing and learning along with it."
              />
            </p>
            <p>
              <Bi
                ar="بتمنّى كل مصممة تزوره تلاقي فكرة تلهمها، أو أداة تختصر عليها وقت، أو خطوة تقرّبها من المشروع اللي بتحلم فيه. وبالنسبة إلي، أجمل نتيجة لهالتعب إن الشي اللي بنيته يصير إله دور برحلة إبداع شخص تاني."
                en="I hope every designer who visits finds an idea that inspires her, a tool that saves her time, or a step that brings her closer to the project she dreams of. And for me, the most beautiful result of all this effort is that what I built plays a part in someone else's creative journey."
              />
            </p>
            <div className="s-actions hm-about-actions">
              <a href={SITE.instagram} className="s-btn primary" rel="noopener noreferrer">
                <IgIcon />
                <Bi ar="تابعني على إنستغرام" en="Follow me on Instagram" />
              </a>
              {SITE.whatsapp ? (
                <a href={waLink()} className="s-btn ghost" rel="noopener noreferrer">
                  <WaIcon />
                  <Bi ar="راسلني على واتساب" en="Message me on WhatsApp" />
                </a>
              ) : null}
            </div>
            <p className="hm-about-links">
              <a href={SITE.instagram} rel="noopener noreferrer"><bdi>{SITE.instagramHandle}</bdi></a>
              {SITE.whatsapp ? <> · <a href={waLink()} rel="noopener noreferrer"><bdi>{SITE.whatsappDisplay || 'WhatsApp'}</bdi></a></> : null}
              {' · '}
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </p>
            <p className="hm-about-legal">
              <Bi
                ar={`${ltr(SITE.name)} تشغّلها ${ltr(SITE.operator)}، ${SITE.location.ar}.`}
                en={`${SITE.name} is operated by ${SITE.operator}, ${SITE.location.en}.`}
              />
            </p>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .hm-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr); }
        .hm-h1 { font-family: var(--f-en); font-weight: 700; font-size: clamp(2.3rem, 4.8vw, 3.8rem); line-height: 1.1; margin: 0 0 20px; letter-spacing: -0.5px; background: linear-gradient(100deg, #17120f 18%, #5b2f45 62%, #b24a3a 100%); -webkit-background-clip: text; background-clip: text; color: transparent; padding-bottom: 0.06em; }
        html[data-lang='ar'] .hm-h1 { font-family: var(--f-ar); font-weight: 600; font-size: clamp(2rem, 3.9vw, 3.2rem); line-height: 1.42; letter-spacing: 0; }
        .hm-lead { color: #5b4d3f; font-size: 1.14rem; max-width: 520px; margin: 0 0 30px; }
        .hm-cta { gap: 12px; }

        .hm-shots { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 56px; align-items: center; }
        .hm-shots-img { border-radius: 16px; overflow: hidden; border: 1px solid var(--line); background: var(--white); }
        .hm-shots-img img { width: 100%; height: auto; }
        .hm-shots-sub { margin-bottom: 18px; }
        .hm-shot-list { list-style: none; margin: 0; padding: 0; }
        .hm-shot-list li { display: grid; grid-template-columns: 11rem 1fr; gap: 16px; padding: 14px 0; border-top: 1px solid var(--line); }
        .hm-shot-list li:last-child { border-bottom: 1px solid var(--line); }
        .hm-shot-list b { font-weight: 700; }
        .hm-shot-list span { color: var(--ink-soft); }

        .hm-tools { border-top: 1px solid var(--ink); }
        .hm-tg { display: grid; grid-template-columns: 11rem 1fr; gap: 24px; padding: 22px 0; border-bottom: 1px solid var(--line); }
        .hm-tg-label { margin: 0; font-family: var(--f-en); font-style: italic; font-weight: 600; font-size: 1.4rem; color: var(--gold-deep); line-height: 1.3; }
        html[data-lang='ar'] .hm-tg-label { font-family: var(--f-ar); font-style: normal; font-size: 1.25rem; }
        .hm-tg-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px 32px; }
        .hm-tg-list li { display: flex; flex-direction: column; }
        .hm-tg-list b { font-weight: 700; font-size: 1.05rem; }
        .hm-tg-list span { color: var(--ink-soft); font-size: 0.95rem; }

        .hm-about { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 56px; align-items: stretch; }
        .hm-about-photo { display: flex; justify-content: center; align-items: stretch; }
        .hm-arch { width: min(100%, 480px); min-height: 620px; border-radius: 999px 999px 20px 20px; overflow: hidden; background: var(--white); border: 1px solid var(--line); position: relative; box-shadow: 14px 14px 0 -1px #e5d9c3; }
        html[dir='rtl'] .hm-arch { box-shadow: -14px 14px 0 -1px #e5d9c3; }
        .hm-arch img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 18% 0%; }
        .hm-about-lead { font-family: var(--f-en); font-style: italic; font-size: clamp(1.35rem, 2.6vw, 1.75rem); line-height: 1.4; margin: 6px 0 18px; color: var(--ink); max-width: 30em; }
        html[data-lang='ar'] .hm-about-lead { font-family: var(--f-body); font-weight: 500; font-style: normal; font-size: clamp(1.15rem, 2.2vw, 1.4rem); line-height: 1.7; }
        .hm-about-text p { max-width: 36em; margin: 0 0 12px; text-wrap: pretty; }
        .hm-about-text .hm-about-creed { font-weight: 600; padding-inline-start: 14px; border-inline-start: 3px solid var(--gold); margin-block: 18px; }
        .hm-about-text .hm-about-lead { margin: 6px 0 18px; }
        .hm-about-actions { margin: 20px 0 14px; }
        .hm-about-text .hm-about-links { margin: 0 0 12px; color: var(--ink-soft); font-size: 0.95rem; }
        .hm-about-links a { color: var(--ink); }
        .hm-about-text .hm-about-legal { color: var(--ink-soft); font-size: 0.85rem; margin: 0; }

                @media (max-width: 900px) {
          .hm-shots, .hm-about { grid-template-columns: 1fr; gap: 36px; }
          .hm-shots-img { order: 2; }
          .hm-tg { grid-template-columns: 1fr; gap: 10px; }
          .hm-about-photo { order: -1; }
          .hm-arch { width: min(100%, 420px); min-height: 0; aspect-ratio: 4 / 5; }
          .hm-arch img { object-position: 50% 0%; }
        }
        @media (max-width: 560px) {
          .hm-tg-list { grid-template-columns: 1fr; }
          .hm-shot-list li { grid-template-columns: 1fr; gap: 2px; }
        }
      `}</style>
    </SiteLayout>
  );
}
