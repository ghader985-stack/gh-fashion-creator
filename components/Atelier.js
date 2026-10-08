// components/Atelier.js
// مكونات الصفحة الرئيسية. الواجهة (الإصدار السادس): نتائج حقيقية من الأداة بحجم كبير، كل قطعة بتتشكّل من تشويش لوضوح خطوة خطوة (متل انتشار التوليد)،
// والكلمات بتطير وبتنزل على مكانها من القطعة، وبرومبتات بتطير بالهوا. بدون رسم خطوط، وبدون نوافذ أو إطارات.
// الحركة كلها CSS (بدون مكتبات)، وJS بس للعمق مع المؤشر وإيقاف الحركة لما الهيرو برا الشاشة. بيحترم prefers-reduced-motion.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bi } from './SiteLayout';
import { PLANS, LAUNCH } from '../lib/site';

// ===== برومبتات بتطير بالهوا بخلفية صفحة الأداة (مواضع ثابتة كي ما يصير اختلاف بين الخادم والمتصفح) =====
// x,y بالنسبة المئوية، s حجم الخط، d مدة الطيران بالثواني، f بداية الدورة (0..1)، o الشفافية، b تغبيش للعمق،
// dx انجراف أفقي، r ميلان، k نوع، lg = بيختفي بالموبايل
const FLY = [
  { t: 'silk organza, hand-beaded neckline', x: 3, y: 62, s: 0.95, d: 34, f: 0.1, o: 0.5, b: 0, dx: 40, r: -3, k: 'chip' },
  { t: 'ghost mannequin, warm cream studio', x: 31, y: 82, s: 0.78, d: 40, f: 0.55, o: 0.34, b: 1, dx: -30, r: 2, k: 'mono', lg: 1 },
  { t: 'A-line, floor length, long sleeves', x: 66, y: 14, s: 0.8, d: 38, f: 0.3, o: 0.38, b: 1.5, dx: 36, r: 3, k: 'mono' },
  { t: 'flat sketch, front and back', x: 80, y: 70, s: 1.0, d: 30, f: 0.8, o: 0.5, b: 0, dx: -34, r: -2, k: 'chip' },
  { t: 'teal & rust wool panels', x: 14, y: 22, s: 0.72, d: 36, f: 0.65, o: 0.3, b: 2, dx: 24, r: 2, k: 'mono', lg: 1 },
  { t: 'pleated tulle, pearl details', x: 48, y: 90, s: 0.9, d: 42, f: 0.2, o: 0.42, b: 0.5, dx: 30, r: -3, k: 'chip', lg: 1 },
  { t: 'fabric swap: satin → velvet', x: 90, y: 34, s: 0.76, d: 33, f: 0.45, o: 0.34, b: 1.5, dx: -28, r: 3, k: 'mono', lg: 1 },
  { t: 'tech pack, measurements in cm', x: 40, y: 6, s: 0.82, d: 39, f: 0.9, o: 0.36, b: 1, dx: 26, r: -2, k: 'mono' },
  { t: 'colour change: dusty rose', x: 4, y: 88, s: 0.74, d: 37, f: 0.35, o: 0.3, b: 2, dx: 34, r: 2, k: 'mono', lg: 1 },
  { t: 'make a realistic product photo of the exact garment', x: 44, y: 94, s: 0.7, d: 46, f: 0.7, o: 0.2, b: 2.5, dx: -40, r: -1, k: 'mono', lg: 1 },
  { t: 'فستان سهرة بياقة عالية وأكمام من التول', x: 52, y: 6, s: 1.05, d: 36, f: 0.15, o: 0.42, b: 1, dx: -30, r: -2, k: 'ar', lg: 1 },
  { t: 'تطريز ذهبي على الأكمام', x: 8, y: 40, s: 1.1, d: 32, f: 0.6, o: 0.5, b: 0, dx: 30, r: 2, k: 'chip-ar' },
  { t: 'عباية بقصّة واسعة وقماش كريب', x: 70, y: 86, s: 0.95, d: 41, f: 0.05, o: 0.34, b: 1.5, dx: 24, r: -3, k: 'ar', lg: 1 },
  { t: 'لوحة إلهام بألوان الصحراء', x: 24, y: 70, s: 0.9, d: 35, f: 0.85, o: 0.3, b: 2, dx: -26, r: 2, k: 'ar' },
  { t: 'كاب من التول المزيّن بالورود', x: 86, y: 52, s: 1.0, d: 38, f: 0.4, o: 0.44, b: 0.5, dx: -24, r: -2, k: 'chip-ar', lg: 1 },
  { t: 'رسمة تقنية للأمام والخلف', x: 36, y: 38, s: 0.85, d: 44, f: 0.25, o: 0.26, b: 2, dx: 30, r: 3, k: 'ar', lg: 1 },
];

export function PromptCloud({ tone = 'light' }) {
  const items = FLY.filter((p, i) => i % 2 === 0);
  return (
    <div className={'pc ' + tone} aria-hidden="true">
      {items.map((p, i) => (
        <span
          key={i}
          className={'pc-i pc-' + p.k + (p.lg ? ' lg' : '')}
          style={{ left: p.x + '%', top: p.y + '%', fontSize: p.s + 'rem', '--d': p.d + 's', '--dl': '-' + (p.d * p.f).toFixed(1) + 's', '--o': p.o * 0.75, '--dx': p.dx + 'px', '--r': p.r + 'deg', '--y0': '46px', '--y1': '-120px', filter: p.b ? 'blur(' + p.b + 'px)' : undefined }}
        >
          {p.t}
        </span>
      ))}
      <style jsx global>{`
        .pc { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
        .pc-i { position: absolute; white-space: nowrap; color: #4a3520; opacity: 0; will-change: transform, opacity; animation: pc-fly var(--d) linear infinite; animation-delay: var(--dl); }
        .pc-mono, .pc-chip { font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; direction: ltr; }
        .pc-ar, .pc-chip-ar { font-family: var(--f-body); direction: rtl; }
        .pc-chip, .pc-chip-ar { border: 1px solid rgba(185, 143, 78, 0.5); border-radius: 999px; padding: 6px 16px 6px 28px; background: rgba(255, 252, 246, 0.72); backdrop-filter: blur(6px); box-shadow: 0 14px 30px -14px rgba(110, 70, 30, 0.5); }
        .pc-chip-ar { padding: 6px 28px 6px 16px; }
        .pc-chip::before, .pc-chip-ar::before { content: ''; position: absolute; top: 50%; left: 12px; width: 8px; height: 8px; margin-top: -4px; border-radius: 50%; background: linear-gradient(135deg, #d6a03c, #de6a9e); box-shadow: 0 0 10px rgba(222, 106, 158, 0.6); }
        .pc-chip-ar::before { left: auto; right: 12px; }
        @keyframes pc-fly {
          0% { opacity: 0; transform: translate3d(0, var(--y0), 0) rotate(var(--r)); }
          12% { opacity: var(--o); }
          88% { opacity: var(--o); }
          100% { opacity: 0; transform: translate3d(var(--dx), var(--y1), 0) rotate(calc(var(--r) * -1)); }
        }
        .pc.light { position: fixed; z-index: -1; }
        .pc.light .pc-i { color: #6b5636; }
        .pc.light .pc-chip, .pc.light .pc-chip-ar { border-color: rgba(107, 86, 54, 0.45); background: rgba(107, 86, 54, 0.05); box-shadow: none; backdrop-filter: none; }
        .pc.light .pc-chip::before, .pc.light .pc-chip-ar::before { background: #b98f4e; box-shadow: 0 0 6px rgba(185, 143, 78, 0.8); }
        @media (max-width: 700px) { .pc-i.lg { display: none; } .pc-i { font-size: 0.78rem !important; } }
        @media (prefers-reduced-motion: reduce) { .pc-i { animation: none; opacity: calc(var(--o) * 0.8); } }
      `}</style>
    </div>
  );
}

// ===== الواجهة: ثلاث نتائج حقيقية بالتناوب. كل وحدة بتاخد S ثانية، والدورة كاملة T =====
// src: صورة القطعة مقصوصة الخلفية (public/showcase/cut-*.webp)، من نفس نتائج الأداة بدون أي تعديل على التصميم.
// r: نسبة العرض للارتفاع. glow: لون الهالة. fade: القطعة مقصوصة من الأسفل فبتتلاشى بدل ما تطلع بحافة.
// tk: الكلمات اللي بتنزل على مكانها من القطعة (x,y نسب من الصورة، ar = بالعربي)
const S = 7.5;
const T = S * 3;
const PIECES = [
  {
    key: 'lilac', src: '/showcase/cut-lilac.webp', r: 0.7718, glow: '167,139,224', gh: 0.26, fade: true,
    prompt: 'lilac satin gown, floral tulle cape, pearl details',
    tk: [
      { t: 'mandarin collar', x: 47, y: 14 },
      { t: 'تول مطرّز بالورود', x: 24, y: 52, ar: 1 },
      { t: 'pearl details', x: 80, y: 58 },
      { t: 'satin', x: 52, y: 40 },
    ],
  },
  {
    key: 'mauve', src: '/showcase/cut-mauve.webp', r: 0.4432, glow: '176,112,128', gh: 0.15,
    prompt: 'beaded mauve gown, pleated fan bodice, silk tulle',
    tk: [
      { t: 'high neck', x: 47, y: 6 },
      { t: 'أكمام شفافة', x: 25, y: 25, ar: 1 },
      { t: 'pleated fan bodice', x: 64, y: 16 },
      { t: 'silk tulle', x: 46, y: 82 },
    ],
  },
  {
    key: 'coat', src: '/showcase/cut-coat.webp', r: 0.4039, glow: '208,96,63', gh: 0.12,
    prompt: 'wool coat, mandarin collar, teal & rust panels',
    tk: [
      { t: 'ياقة ماندرين', x: 49, y: 11, ar: 1 },
      { t: 'puff sleeves', x: 84, y: 38 },
      { t: 'teal & rust panels', x: 48, y: 70 },
      { t: 'wool', x: 26, y: 62 },
    ],
  },
];

// برومبتات بتطير حوالين المشهد (أوامر حقيقية للأداة). x من بداية الاتجاه، y من الأعلى، mb = بتظهر بالموبايل
const AMB = [
  { t: 'add pearls to the neckline', x: 59, y: 80, s: 0.92, d: 38, f: 0.05, o: 0.9, b: 0, dx: 40, r: -3, mb: 1 },
  { t: 'غيّر اللون إلى وردي غباري', x: 72, y: 87, s: 1.0, d: 34, f: 0.4, o: 0.9, b: 0, dx: -34, r: 2, ar: 1, mb: 1 },
  { t: 'swap fabric: satin → velvet', x: 60, y: 20, s: 0.85, d: 40, f: 0.7, o: 0.7, b: 1.2, dx: 30, r: -2 },
  { t: 'flat sketch, front and back', x: 76, y: 50, s: 0.9, d: 36, f: 0.2, o: 0.8, b: 0.6, dx: -34, r: 3 },
  { t: 'أضف تطريزاً ذهبياً على الأكمام', x: 61, y: 46, s: 0.95, d: 42, f: 0.55, o: 0.75, b: 1, dx: 26, r: 2, ar: 1 },
  { t: 'tech pack with measurements', x: 74, y: 14, s: 0.8, d: 44, f: 0.85, o: 0.55, b: 1.6, dx: -26, r: -2 },
  { t: 'ولّد صورة منتج بخلفية استوديو', x: 62, y: 95, s: 0.9, d: 39, f: 0.3, o: 0.7, b: 1, dx: 22, r: -3, ar: 1, mb: 1 },
];

// شرارات ضوء صغيرة (مواضع ثابتة بمولّد بسيط كي ما يختلف الخادم عن المتصفح)
const SPECKS = (() => {
  let s = 7;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  return Array.from({ length: 16 }, () => ({ x: 50 + r() * 48, y: 12 + r() * 80, z: 2 + r() * 3.2, d: 9 + r() * 9, dl: -r() * 16, dx: (r() - 0.5) * 50 }));
})();

// تحبيب التشويش (بيظهر على القطعة وهي بتتشكّل): SVG صغير مكرّر
const GRAIN_SVG = "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.62  0 0 0 0 0.5  0 0 0 0 0.4  0 0 0 1.9 -0.7'/></filter><rect width='160' height='160' filter='url(#n)'/></svg>";
const GRAIN = 'url("data:image/svg+xml,' + encodeURIComponent(GRAIN_SVG) + '")';

// مفاتيح كتابة البرومبت (steps بعدد الحروف). بتتولّد من البيانات كي تضل مطابقة للنص.
const TYPE_CSS = PIECES.map((p) => {
  const n = p.prompt.length;
  return '@keyframes st-type-' + p.key + '{0%{width:0;animation-timing-function:steps(' + n + ',end)}9.5%{width:' + n + 'ch}100%{width:' + n + 'ch}}';
}).join('');

function Piece({ p, i }) {
  const delay = (0.3 + i * S).toFixed(1) + 's';
  return (
    <div className={'st-p' + (i === 0 ? ' first' : '')} style={{ '--delay': delay, '--r': p.r, '--cut': 'url(' + p.src + ')', '--glow': p.glow }}>
      <i className="st-aura" />
      <div className="st-box">
        <div className={'st-art' + (p.fade ? ' fade' : '')}>
          <img src={p.src} alt="" draggable="false" />
          <i className="st-shine" />
          <i className="st-grain" style={{ backgroundImage: GRAIN }} />
        </div>
        {!p.fade && <i className="st-floor" />}
        {p.tk.map((k, j) => {
          const fx = Math.round((k.x - 50) * 5.2 + (k.x < 50 ? -30 : 30));
          const fy = Math.round((k.y - 50) * 1.7 - 36);
          return (
            <span key={'t' + j}>
              <i className="st-rip" style={{ left: k.x + '%', top: k.y + '%', '--ts': (0.35 + j * 0.28).toFixed(2) + 's' }} />
              <span className={'st-tk' + (k.ar ? ' ar' : '')} style={{ left: k.x + '%', top: k.y + '%', '--fx': fx, '--fy': fy, '--ts': (0.35 + j * 0.28).toFixed(2) + 's' }}>
                {k.t}
              </span>
            </span>
          );
        })}
      </div>
      <div className="st-cap">
        <span className="st-cap-k">prompt</span>
        <span className="st-cap-w">
          <span className="st-cap-t" style={{ animationName: 'st-type-' + p.key }}>{p.prompt}</span>
        </span>
      </div>
    </div>
  );
}

export function Hero({ children }) {
  const sec = useRef(null);
  const back = useRef(null);
  const chips = useRef(null);
  const front = useRef(null);
  const hot = useRef(null);

  useEffect(() => {
    const section = sec.current;
    if (!section) return undefined;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;
    const fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let alive = true;
    let raf = 0;
    let visible = true;
    const m = { x: 0, y: 0, t: -1e9, nx: 0, ny: 0 };
    let lx = -1;
    let ly = -1;

    const sync = () => section.classList.toggle('is-off', !visible || document.hidden);
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((es) => { visible = es[0].isIntersecting; sync(); }) : null;
    if (io) io.observe(section);
    document.addEventListener('visibilitychange', sync);
    const onMove = (e) => {
      const r = section.getBoundingClientRect();
      m.x = e.clientX - r.left;
      m.y = e.clientY - r.top;
      m.t = performance.now();
    };
    if (fine) section.addEventListener('pointermove', onMove);

    const tick = (now) => {
      if (!alive) return;
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      const W = section.clientWidth || 1;
      const H = section.clientHeight || 1;
      const active = now - m.t < 2600;
      // لما ما في مؤشر: ميلان بطيء تلقائي كي يضل المشهد حي (وعلى اللمس كمان)
      const tx = active ? (m.x / W - 0.5) * 2 : Math.sin(now / 5200) * 0.5;
      const ty = active ? (m.y / H - 0.5) * 2 : Math.cos(now / 6800) * 0.3;
      m.nx += (tx - m.nx) * 0.06;
      m.ny += (ty - m.ny) * 0.06;
      if (back.current) back.current.style.transform = 'translate3d(' + (m.nx * -26).toFixed(2) + 'px,' + (m.ny * -16).toFixed(2) + 'px,0)';
      if (chips.current) chips.current.style.transform = 'translate3d(' + (m.nx * -15).toFixed(2) + 'px,' + (m.ny * -9).toFixed(2) + 'px,0)';
      if (front.current) front.current.style.transform = 'translate3d(' + (m.nx * 9).toFixed(2) + 'px,' + (m.ny * 5).toFixed(2) + 'px,0)';
      if (hot.current) {
        const px = active ? m.x : W * 0.74;
        const py = active ? m.y : H * 0.5;
        if (lx < 0) { lx = px; ly = py; }
        lx += (px - lx) * 0.09;
        ly += (py - ly) * 0.09;
        hot.current.style.setProperty('--mx', lx.toFixed(1) + 'px');
        hot.current.style.setProperty('--my', ly.toFixed(1) + 'px');
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      if (io) io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      section.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <section className="hm-hero" ref={sec}>
      <div className="hh-bg" aria-hidden="true">
        <i className="hh-blob b1" />
        <i className="hh-blob b2" />
        <i className="hh-blob b3" />
        <i className="hh-blob b4" />
        <i className="hh-dots" />
        <i className="hh-dots hot" ref={hot} />
      </div>

      <div className="s-wrap st-wrap" aria-hidden="true">
        <div className="hs-air" ref={chips} aria-hidden="true">
          {SPECKS.map((k, i) => (
            <i key={'s' + i} className="hs-sp" style={{ insetInlineStart: k.x + '%', top: k.y + '%', width: k.z + 'px', height: k.z + 'px', '--d': k.d + 's', '--dl': k.dl.toFixed(1) + 's', '--ddx': k.dx.toFixed(0) + 'px' }} />
          ))}
          {AMB.map((c, i) => (
            <span
              key={'c' + i}
              className={'hc ' + (c.ar ? 'ar' : 'en') + (c.mb ? ' mb' : '')}
              style={{ insetInlineStart: c.x + '%', top: c.y + '%', fontSize: c.s + 'rem', '--d': c.d + 's', '--dl': '-' + (c.d * c.f).toFixed(1) + 's', '--o': c.o, '--cdx': c.dx, '--r': c.r + 'deg', filter: c.b ? 'blur(' + c.b + 'px)' : undefined }}
            >
              {c.t}
            </span>
          ))}
        </div>
        <div className="st">
          <div className="hs-back" ref={back}>
            <i className="st-glow" />
            {PIECES.map((p, i) => (
              <img key={'g' + p.key} className="st-ghost" src={p.src} alt="" draggable="false" style={{ '--delay': (0.3 + i * S).toFixed(1) + 's', '--gh': p.gh }} />
            ))}
          </div>
          <div className="hs-front" ref={front}>
            {PIECES.map((p, i) => <Piece key={p.key} p={p} i={i} />)}
          </div>
        </div>
      </div>

      <div className="s-wrap hm-hero-grid">
        <div className="hm-hero-left">{children}</div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: TYPE_CSS }} />
      <style jsx global>{`
        .hm-hero { --sx: 1; position: relative; overflow: hidden; isolation: isolate; padding-block: 44px 72px; background-color: #f5eee2; background-image: linear-gradient(180deg, #f7f1e6 0%, #f3e9db 60%, #f1e3d3 100%); color: var(--ink); min-height: min(calc(100svh - 64px), 800px); display: flex; align-items: center; }
        html[dir='rtl'] .hm-hero { --sx: -1; }
        .hh-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .hh-blob { position: absolute; border-radius: 50%; will-change: transform; }
        .hh-blob.b1 { width: 60vmax; height: 60vmax; right: -14vmax; top: -24vmax; background: radial-gradient(closest-side, rgba(255, 178, 110, 0.6), rgba(255, 178, 110, 0) 70%); animation: hh-d1 22s ease-in-out infinite alternate; }
        .hh-blob.b2 { width: 54vmax; height: 54vmax; right: -16vmax; bottom: -26vmax; background: radial-gradient(closest-side, rgba(238, 130, 160, 0.5), rgba(238, 130, 160, 0) 70%); animation: hh-d2 26s ease-in-out infinite alternate; }
        .hh-blob.b3 { width: 52vmax; height: 52vmax; left: 12vmax; bottom: -32vmax; background: radial-gradient(closest-side, rgba(226, 190, 120, 0.65), rgba(226, 190, 120, 0) 70%); animation: hh-d1 30s ease-in-out infinite alternate-reverse; }
        .hh-blob.b4 { width: 42vmax; height: 42vmax; left: 30vmax; top: -18vmax; background: radial-gradient(closest-side, rgba(170, 150, 235, 0.45), rgba(170, 150, 235, 0) 70%); animation: hh-d2 24s ease-in-out infinite alternate-reverse; }
        html[dir='rtl'] .hh-blob.b1, html[dir='rtl'] .hh-blob.b2 { right: auto; }
        html[dir='rtl'] .hh-blob.b1 { left: -14vmax; }
        html[dir='rtl'] .hh-blob.b2 { left: -16vmax; }
        html[dir='rtl'] .hh-blob.b3 { left: auto; right: 12vmax; }
        html[dir='rtl'] .hh-blob.b4 { left: auto; right: 30vmax; }
        @keyframes hh-d1 { from { transform: translate3d(-4%, -3%, 0) scale(1); } to { transform: translate3d(5%, 4%, 0) scale(1.1); } }
        @keyframes hh-d2 { from { transform: translate3d(4%, 3%, 0) scale(1.05); } to { transform: translate3d(-5%, -4%, 0) scale(0.95); } }
        .hh-dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(110, 80, 40, 0.3) 1px, transparent 1.5px); background-size: 28px 28px; opacity: 0.45; -webkit-mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent); mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent); }
        .hh-dots.hot { --mx: 74%; --my: 50%; opacity: 1; background-image: radial-gradient(rgba(170, 110, 40, 0.9) 1.3px, transparent 1.9px); -webkit-mask-image: radial-gradient(260px circle at var(--mx) var(--my), #000 0%, transparent 100%); mask-image: radial-gradient(260px circle at var(--mx) var(--my), #000 0%, transparent 100%); }

        /* ===== برومبتات وشرارات بالهوا ===== */
        .hs-air { position: absolute; inset: 0; z-index: 1; pointer-events: none; will-change: transform; }
        .hc { position: absolute; white-space: nowrap; color: #4a3520; opacity: 0; padding: 6px 16px 6px 28px; border-radius: 999px; border: 1px solid rgba(185, 143, 78, 0.4); background: rgba(255, 252, 246, 0.78); box-shadow: 0 16px 32px -18px rgba(110, 70, 30, 0.5); will-change: transform, opacity; animation: hc-fly var(--d) linear infinite; animation-delay: var(--dl); }
        .hc.en { font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; direction: ltr; }
        .hc.ar { font-family: var(--f-body); direction: rtl; padding: 6px 28px 6px 16px; }
        .hc::before { content: ''; position: absolute; top: 50%; width: 8px; height: 8px; margin-top: -4px; border-radius: 50%; background: linear-gradient(135deg, #d6a03c, #de6a9e); box-shadow: 0 0 10px rgba(222, 106, 158, 0.6); }
        .hc.en::before { left: 12px; }
        .hc.ar::before { right: 12px; }
        @keyframes hc-fly {
          0% { opacity: 0; transform: translate3d(0, 60px, 0) rotate(var(--r)); }
          12% { opacity: var(--o); }
          88% { opacity: var(--o); }
          100% { opacity: 0; transform: translate3d(calc(var(--cdx) * var(--sx) * 1px), -240px, 0) rotate(calc(var(--r) * -1)); }
        }
        .hs-sp { position: absolute; border-radius: 50%; background: radial-gradient(circle, #fffaf0 0%, #e2b055 55%, rgba(226, 176, 85, 0) 100%); opacity: 0; will-change: transform, opacity; animation: hs-sp var(--d) ease-in-out infinite; animation-delay: var(--dl); }
        @keyframes hs-sp {
          0% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.6); }
          20% { opacity: 0.95; }
          80% { opacity: 0.45; }
          100% { opacity: 0; transform: translate3d(var(--ddx), -150px, 0) scale(1.1); }
        }

        /* ===== المشهد: القطعة بتتشكّل من تشويش لوضوح ===== */
        .st-wrap { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
        .st { position: absolute; top: 0; bottom: 0; inset-inline-end: 0; width: 54%; container-type: size; }
        .hs-back, .hs-front { position: absolute; inset: 0; will-change: transform; }
        .st-glow { position: absolute; inset: 2% -22% 4% -22%; background: radial-gradient(closest-side, rgba(255, 244, 224, 0.95), rgba(255, 244, 224, 0.45) 55%, rgba(255, 244, 224, 0) 80%); }
        .st-ghost { position: absolute; bottom: -8%; inset-inline-end: -26%; height: 118%; width: auto; max-width: none; opacity: 0; filter: blur(30px) saturate(1.25); mix-blend-mode: multiply; will-change: opacity, transform; animation: st-ghost 22.5s linear infinite both; animation-delay: var(--delay); }
        .st-p { position: absolute; inset-block: 34px 16px; inset-inline: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; isolation: isolate; opacity: 0; visibility: hidden; transform-origin: 50% 100%; will-change: transform, opacity; animation: st-life 22.5s linear infinite both; animation-delay: var(--delay); }
        .st-aura { position: absolute; inset: 4% -18% 9% -18%; z-index: -1; background: radial-gradient(closest-side, rgba(var(--glow), 0.5), rgba(var(--glow), 0.17) 56%, rgba(var(--glow), 0) 80%); animation: st-breath 6.5s ease-in-out infinite alternate; }
        @keyframes st-breath { from { transform: scale(0.94); } to { transform: scale(1.06); } }
        .st-box { position: relative; flex: 0 1 auto; aspect-ratio: var(--r); height: min(calc(100% - 42px), calc(100cqw / var(--r))); }
        .st-art { position: absolute; inset: 0; will-change: filter; animation: st-dif 22.5s linear infinite both; animation-delay: var(--delay); }
        .st-art.fade { -webkit-mask-image: linear-gradient(#000 82%, transparent 100%); mask-image: linear-gradient(#000 82%, transparent 100%); }
        .st-art img { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; user-select: none; -webkit-user-drag: none; }
        .st-shine, .st-grain { position: absolute; inset: 0; -webkit-mask-image: var(--cut); mask-image: var(--cut); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; }
        .st-shine { background: linear-gradient(105deg, rgba(255, 255, 255, 0) 38%, rgba(255, 255, 255, 0.85) 50%, rgba(255, 255, 255, 0) 62%); background-size: 260% 100%; background-position: 160% 0; mix-blend-mode: overlay; animation: st-shine 22.5s linear infinite both; animation-delay: var(--delay); }
        .st-grain { background-size: 160px 160px; opacity: 0; animation: st-grain-o 22.5s linear infinite both, st-grain-j 0.45s step-end infinite; animation-delay: var(--delay), 0s; }
        .st-floor { position: absolute; left: 6%; right: 6%; bottom: -10px; height: 22px; border-radius: 50%; background: radial-gradient(closest-side, rgba(70, 46, 24, 0.34), rgba(70, 46, 24, 0)); z-index: -1; }

        .st-tk { position: absolute; z-index: 3; white-space: nowrap; padding: 4px 11px; border-radius: 999px; border: 1px solid rgba(185, 143, 78, 0.55); background: rgba(255, 252, 246, 0.92); color: #4a3520; font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 0.74rem; direction: ltr; opacity: 0; box-shadow: 0 10px 22px -10px rgba(110, 70, 30, 0.6); will-change: transform, opacity; animation: st-tk 22.5s linear infinite both; animation-delay: calc(var(--delay) + var(--ts)); }
        .st-tk.ar { font-family: var(--f-body); direction: rtl; font-size: 0.82rem; }
        .st-rip { position: absolute; z-index: 2; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; border: 1.5px solid rgba(214, 160, 60, 0.95); box-shadow: 0 0 14px rgba(255, 238, 200, 0.9); opacity: 0; will-change: transform, opacity; animation: st-rip 22.5s linear infinite both; animation-delay: calc(var(--delay) + var(--ts)); }
        .st-cap { margin-top: 14px; height: 26px; display: flex; align-items: center; justify-content: center; gap: 8px; direction: ltr; font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 0.8rem; color: var(--ink); white-space: nowrap; }
        .st-cap-k { font-weight: 700; color: #a07c3c; }
        .st-cap-w { display: inline-flex; align-items: center; }
        .st-cap-w::after { content: ''; width: 2px; height: 1.15em; margin-inline-start: 3px; background: #b98f4e; animation: st-caret 0.8s step-end infinite; }
        .st-cap-t { display: inline-block; overflow: hidden; white-space: nowrap; width: 0; animation-duration: 22.5s; animation-timing-function: linear; animation-iteration-count: infinite; animation-fill-mode: both; animation-delay: var(--delay); }
        @keyframes st-caret { 50% { opacity: 0; } }

        @keyframes st-life {
          0% { opacity: 0; visibility: hidden; transform: translate3d(0, 18px, 0) scale(1.05); animation-timing-function: cubic-bezier(0.2, 0.7, 0.2, 1); }
          0.2% { visibility: visible; }
          2.4% { opacity: 1; }
          11.1% { transform: translate3d(0, 0, 0) scale(1); animation-timing-function: ease-in-out; }
          27.5% { opacity: 1; transform: translate3d(0, -9px, 0) scale(1.012); animation-timing-function: ease-in; }
          33.3% { opacity: 0; visibility: visible; transform: translate3d(calc(var(--sx) * 28px), -26px, 0) scale(0.94); }
          33.4%, 100% { opacity: 0; visibility: hidden; transform: translate3d(0, 18px, 0) scale(1.05); }
        }
        @keyframes st-dif {
          0% { filter: blur(40px) saturate(0.05) contrast(0.5) brightness(1.25); }
          3% { filter: blur(30px) saturate(0.2) contrast(0.6) brightness(1.18); }
          5.5% { filter: blur(20px) saturate(0.45) contrast(0.75) brightness(1.1); }
          7.5% { filter: blur(11px) saturate(0.7) contrast(0.88) brightness(1.04); }
          9.3% { filter: blur(4px) saturate(0.92) contrast(0.97) brightness(1.01); }
          11.1%, 100% { filter: none; }
        }
        @keyframes st-grain-o { 0% { opacity: 0; } 2% { opacity: 0.95; } 8% { opacity: 0.5; } 11.1%, 100% { opacity: 0; } }
        @keyframes st-grain-j { 0% { background-position: 0 0; } 20% { background-position: 37px 91px; } 40% { background-position: -62px 24px; } 60% { background-position: 80px -45px; } 80% { background-position: -20px -77px; } }
        @keyframes st-shine { 0%, 13% { background-position: 160% 0; animation-timing-function: ease-in-out; } 22%, 100% { background-position: -60% 0; } }
        @keyframes st-ghost {
          0% { opacity: 0; transform: translate3d(0, 24px, 0) scale(1); }
          10% { opacity: 0; }
          15% { opacity: var(--gh); }
          27.5% { opacity: var(--gh); transform: translate3d(calc(var(--sx) * 18px), -14px, 0) scale(1.04); }
          33.3% { opacity: 0; transform: translate3d(calc(var(--sx) * 30px), -22px, 0) scale(1.07); }
          100% { opacity: 0; transform: translate3d(0, 24px, 0) scale(1); }
        }
        @keyframes st-tk {
          0% { opacity: 0; transform: translate(calc(-50% + var(--fx) * 1px), calc(-50% + var(--fy) * 1px)) scale(1.15); filter: blur(4px); }
          1.6% { opacity: 1; }
          7.4% { opacity: 1; transform: translate(-50%, -50%) scale(0.92); filter: blur(0); }
          9.6% { opacity: 0; transform: translate(-50%, -50%) scale(0.45); filter: blur(2px); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.45); }
        }
        @keyframes st-rip {
          0%, 7% { opacity: 0; transform: scale(0.2); }
          8.2% { opacity: 0.85; }
          12.4% { opacity: 0; transform: scale(2.7); }
          100% { opacity: 0; transform: scale(2.7); }
        }

        .hm-hero .hm-hero-grid { position: relative; z-index: 4; }
        .hm-hero-left { position: relative; min-width: 0; max-width: 620px; }
        .hm-hero-left > * { animation: hh-in 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        .hm-hero-left > .hm-hero-text > * { animation: hh-in 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        @keyframes hh-in { from { opacity: 0; translate: 0 22px; } to { opacity: 1; translate: 0 0; } }

        .hm-hero.is-off *, .hm-hero.is-off *::before, .hm-hero.is-off *::after { animation-play-state: paused !important; }

        @media (max-width: 1020px) {
          .hm-hero-left { max-width: min(620px, 56%); }
          .st { width: 48%; }
          .hc:not(.mb) { display: none; }
          .st-cap { font-size: 0.64rem; }
          .st-cap-k { display: none; }
        }
        @media (max-width: 700px) {
          .hm-hero { align-items: flex-start; padding-block: 28px 440px; min-height: 0; }
          .hm-hero-left { max-width: none; }
          .st { top: auto; bottom: 0; height: 430px; width: 100%; inset-inline-end: auto; inset-inline-start: 0; }
          .st-wrap { padding-inline: 0; }
          .hs-air { -webkit-mask-image: linear-gradient(to bottom, transparent 0, transparent 52%, #000 66%); mask-image: linear-gradient(to bottom, transparent 0, transparent 52%, #000 66%); }
          html[dir='rtl'] .hs-air { -webkit-mask-image: linear-gradient(to bottom, transparent 0, transparent 52%, #000 66%); mask-image: linear-gradient(to bottom, transparent 0, transparent 52%, #000 66%); }
          .hc { font-size: 0.74rem !important; }
          .hc.mb { inset-inline-start: 4% !important; }
          .st-ghost { inset-inline-end: -10%; height: 100%; }
          .st-cap { font-size: 0.66rem; }
          .st-tk { font-size: 0.68rem; padding: 3px 9px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hh-blob, .hm-hero-left > *, .hm-hero-left > .hm-hero-text > * { animation: none !important; }
          .st-p, .st-art, .st-shine, .st-grain, .st-ghost, .st-aura, .st-tk, .st-rip, .hs-sp, .st-cap-w::after { animation: none !important; }
          .st-p { display: none; }
          .st-p.first { display: flex; opacity: 1; visibility: visible; transform: none; }
          .st-art { filter: none; }
          .st-grain, .st-shine, .st-tk, .st-rip, .st-ghost, .hs-sp { display: none; }
          .st-cap-t { animation: none !important; width: auto; }
          .hc { animation: none; opacity: calc(var(--o) * 0.7); }
        }
      `}</style>
    </section>
  );
}

// شريط الخطط بالصفحة الرئيسية. سعر الإطلاق بيظهر لحد ما ينتهي (LAUNCH.ends)، وبعدها الأسعار العادية.
export function PlansBand() {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (LAUNCH.ends && Date.now() > Date.parse(LAUNCH.ends + 'T23:59:59+04:00')) setExpired(true);
  }, []);
  const on = !expired;
  return (
    <section className="pb" id="plans">
      <div className="s-wrap pb-in">
        <div className="pb-text">
          <h2 className="pb-h"><Bi ar="ثلاث خطط، شهرية أو سنوية" en="Three plans, monthly or yearly" /></h2>
          <p className="pb-sub">
            {on ? (
              <Bi ar="سعر الإطلاق متاح الآن لفترة محدودة." en="Launch pricing is available now for a limited time." />
            ) : (
              <Bi ar="اختر الخطة المناسبة لحجم عملك." en="Pick the plan that fits the size of your work." />
            )}
          </p>
          <Link href="/pricing" className="s-btn primary"><Bi ar="عرض الخطط" en="See the plans" /></Link>
        </div>
        <div className="pb-cells">
          {PLANS.map((p) => (
            <div className="pb-cell" key={p.id}>
              <div className="pb-name"><Bi ar={p.name.ar} en={p.name.en} /></div>
              <div className="pb-price">
                ${on ? p.launch : p.price}
                <span className="pb-per"><Bi ar=" / شهر" en=" / month" /></span>
              </div>
              {on && <div className="pb-was">${p.price}</div>}
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .pb { background: linear-gradient(115deg, #f4e8d2 0%, #f0dfd6 55%, #e8e0f1 100%); color: var(--ink); padding-block: 56px; border-block: 1px solid rgba(143, 106, 46, 0.22); }
        .pb-in { display: grid; gap: 40px; grid-template-columns: 1fr 1.3fr; align-items: center; }
        .pb-h { font-family: var(--f-en); font-size: clamp(1.7rem, 3.4vw, 2.3rem); font-weight: 700; margin: 0 0 8px; line-height: 1.25; }
        html[data-lang='ar'] .pb-h { font-family: var(--f-ar); }
        .pb-sub { color: #5b4d3f; margin: 0 0 22px; }
        .pb-cells { display: grid; gap: 14px; grid-template-columns: repeat(3, 1fr); }
        .pb-cell { background: rgba(255, 253, 248, 0.78); border: 1px solid rgba(143, 106, 46, 0.3); border-radius: 14px; padding: 18px 18px 16px; display: flex; flex-direction: column; gap: 2px; }
        .pb-name { color: #6f5a3c; font-weight: 600; font-size: 0.95rem; }
        .pb-price { font-family: var(--f-en); font-weight: 700; font-size: 2.1rem; line-height: 1.15; direction: ltr; text-align: start; }
        .pb-per { font-family: var(--f-body); font-weight: 400; font-size: 0.85rem; color: #6f5a3c; }
        .pb-was { font-family: var(--f-en); color: #9c8f7b; text-decoration: line-through; direction: ltr; text-align: start; min-height: 1.5em; }
        @media (max-width: 860px) { .pb-in { grid-template-columns: 1fr; gap: 26px; } }
        @media (max-width: 520px) { .pb-cells { grid-template-columns: 1fr; } .pb-cell { flex-direction: row; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 6px 12px; } }
      `}</style>
    </section>
  );
}
