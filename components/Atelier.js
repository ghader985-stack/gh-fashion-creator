// components/Atelier.js
// مكونات الصفحة الرئيسية. الواجهة: الخلفية كلها هي العرض. أوامر برومبت (عربي وإنجليزي) بتطير بالهوا، وكلمات بتنسحب لرأس القلم،
// وتصاميم كبيرة بتنرسم بخطوط متدرّجة اللون (من مخرجات الأداة الحقيقية). كله بـ canvas وrequestAnimationFrame بدون مكتبات،
// وبيحترم prefers-reduced-motion.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bi } from './SiteLayout';
import { PLANS, LAUNCH } from '../lib/site';
import { LINES } from '../lib/lines';

// ===== برومبتات بتطير بالهوا (مواضع ثابتة كي ما يصير اختلاف بين الخادم والمتصفح) =====
// x,y بالنسبة المئوية، s حجم الخط، d مدة الطيران بالثواني، f بداية الدورة (0..1)، o الشفافية، b تغبيش للعمق،
// dx انجراف أفقي، r ميلان، k نوع، lg = بيختفي بالموبايل، y0/y1 = مسافة الصعود
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

// أوامر برومبت الواجهة (أوامر حقيقية للأداة): بتطير بكل الخلفية
const HERO_FLY = [
  { t: 'add hand-beaded pearls to the neckline', x: 3, y: 72, s: 1.0, d: 34, f: 0.1, o: 0.95, b: 0, dx: 60, r: -3, k: 'chip', mb: 1 },
  { t: 'غيّر اللون إلى وردي غباري', x: 34, y: 86, s: 1.05, d: 38, f: 0.35, o: 0.95, b: 0, dx: -50, r: 2, k: 'chip-ar', mb: 1 },
  { t: 'make the sleeves puffier', x: 46, y: 80, s: 0.95, d: 32, f: 0.6, o: 0.75, b: 0.5, dx: 40, r: -2, k: 'chip', mb: 1 },
  { t: 'generate flat sketch, front and back', x: 84, y: 60, s: 0.9, d: 36, f: 0.8, o: 0.6, b: 1, dx: -60, r: 3, k: 'chip' },
  { t: 'أضف تطريزاً ذهبياً على الأكمام', x: 8, y: 30, s: 1.0, d: 40, f: 0.5, o: 0.9, b: 0, dx: 50, r: 2, k: 'chip-ar' },
  { t: 'swap fabric: satin → velvet', x: 48, y: 24, s: 0.85, d: 42, f: 0.25, o: 0.75, b: 1, dx: -40, r: -2, k: 'mono' },
  { t: 'ولّد صورة منتج بخلفية استوديو', x: 56, y: 92, s: 1.0, d: 37, f: 0.7, o: 0.7, b: 1, dx: 30, r: -3, k: 'chip-ar', mb: 1 },
  { t: 'create tech pack with measurements', x: 20, y: 8, s: 0.85, d: 44, f: 0.15, o: 0.75, b: 1, dx: 40, r: 2, k: 'mono' },
  { t: 'A-line, floor length, long sleeves', x: 84, y: 14, s: 0.85, d: 39, f: 0.45, o: 0.75, b: 1, dx: -30, r: 3, k: 'mono' },
  { t: 'pleated tulle, pearl details', x: 40, y: 94, s: 0.8, d: 46, f: 0.05, o: 0.65, b: 1.5, dx: 30, r: -3, k: 'mono', mb: 1 },
];

export function PromptCloud({ tone = 'light' }) {
  const items = tone === 'bright' ? HERO_FLY : FLY.filter((p, i) => i % 2 === 0);
  return (
    <div className={'pc ' + tone} aria-hidden="true">
      {items.map((p, i) => (
        <span
          key={i}
          className={'pc-i pc-' + p.k + (p.lg ? ' lg' : '') + (p.mb ? ' mb' : '')}
          style={{ left: p.x + '%', top: p.y + '%', fontSize: p.s + 'rem', '--d': p.d + 's', '--dl': '-' + (p.d * p.f).toFixed(1) + 's', '--o': tone === 'light' ? p.o * 0.75 : p.o, '--dx': p.dx + 'px', '--r': p.r + 'deg', '--y0': (tone === 'bright' ? 70 : 46) + 'px', '--y1': (tone === 'bright' ? -260 : -120) + 'px', filter: p.b ? 'blur(' + p.b + 'px)' : undefined }}
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
        .pc.bright { transform: translate3d(calc(var(--px, 0) * -18px), calc(var(--py, 0) * -12px), 0); -webkit-mask-image: linear-gradient(to right, rgba(0, 0, 0, 0.3) 0, rgba(0, 0, 0, 0.3) 42%, #000 62%); mask-image: linear-gradient(to right, rgba(0, 0, 0, 0.3) 0, rgba(0, 0, 0, 0.3) 42%, #000 62%); }
        html[dir='rtl'] .pc.bright { -webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 0.3) 0, rgba(0, 0, 0, 0.3) 42%, #000 62%); mask-image: linear-gradient(to left, rgba(0, 0, 0, 0.3) 0, rgba(0, 0, 0, 0.3) 42%, #000 62%); }
        @media (max-width: 700px) { .pc-i.lg { display: none; } .pc.bright .pc-i:not(.mb) { display: none; } .pc-i { font-size: 0.78rem !important; } .pc.bright { -webkit-mask-image: none; mask-image: none; } }
        @media (prefers-reduced-motion: reduce) { .pc-i { animation: none; opacity: calc(var(--o) * 0.8); } }
      `}</style>
    </div>
  );
}

// ===== الرسم بالخلفية: ثلاث قطع بتنرسم بالتناوب، وكلمات بتنسحب لرأس القلم =====
const FIG = [
  { key: 'coat', off: 0, prompt: 'wool coat, mandarin collar, teal & rust panels', c: ['#1f9aa8', '#d0603f'], glow: '31,154,168' },
  { key: 'lilac', off: 4300, prompt: 'lilac satin gown with a floral tulle cape', c: ['#7d5fd0', '#de6a9e'], glow: '125,95,208' },
  { key: 'mauve', off: 8600, prompt: 'beaded mauve gown, pleated fan bodice, tulle', c: ['#cf5b86', '#d6a03c'], glow: '207,91,134' },
];
const DRAW = 5400;   // رسم القلم
const HOLD = 4600;   // بتبقى ظاهرة وبتبهت شوي
const CYC = 13000;   // الدورة كاملة لكل قطعة (والباقي اختفاء)
const WORDS = [
  ['silk organza', 0], ['A-line', 0], ['mandarin collar', 0], ['hand-beaded', 0], ['tulle', 0], ['pleated', 0], ['floor length', 0], ['puff sleeve', 0],
  ['satin', 0], ['lace appliqué', 0], ['dusty rose', 0], ['wool coat', 0], ['pearl trim', 0], ['velvet', 0],
  ['تطريز ذهبي', 1], ['ياقة عالية', 1], ['أكمام واسعة', 1], ['تول', 1], ['كريب', 1], ['عباية', 1], ['ساتان', 1], ['دانتيل', 1], ['لؤلؤ', 1],
];
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;

// أماكن القطع (نسب من الواجهة). cx منطقية: بتنعكس بالعربي كي تبقى بجهة المسرح.
function slotsFor(W, H, rtl) {
  const S = W < 700
    ? [{ cx: 0.7, top: 0.5, fh: 0.5 }, { cx: 0.28, top: 0.58, fh: 0.42 }, { cx: 1.0, top: 0.56, fh: 0.44 }]
    : [{ cx: 0.79, top: 0.07, fh: 0.84 }, { cx: 0.6, top: 0.34, fh: 0.58 }, { cx: 0.97, top: 0.3, fh: 0.62 }];
  return S.map((s) => ({ ...s, cx: rtl ? 1 - s.cx : s.cx }));
}

export function Hero({ children }) {
  const sec = useRef(null);
  const canvas = useRef(null);
  const tagRef = useRef(null);
  const typedRef = useRef(null);

  useEffect(() => {
    const section = sec.current;
    const cv = canvas.current;
    const tag = tagRef.current;
    const typed = typedRef.current;
    if (!section || !cv) return undefined;
    const ctx = cv.getContext('2d');
    const auras = [...section.querySelectorAll('.hb-aura')];
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let alive = true;
    let raf = 0;
    let W = 2;
    let H = 2;
    let dpr = 1;
    let layers = [];
    let sprites = [];
    let sparks = [];
    let visible = true;
    let still = false;
    const st = { tip: null, cx: 0, cy: 0, acc: 0, chars: -1, tagW: 160, tagOn: false, act: -1 };
    const mouse = { x: 0, y: 0, t: -1e9, nx: 0, ny: 0 };

    const buildLayer = (f, slot, idx) => {
      const data = LINES[f.key];
      const fhPx = slot.fh * H;
      const s = fhPx / data.h;
      const fw = data.w * s;
      const lc = document.createElement('canvas');
      lc.width = Math.max(2, Math.round(fw * dpr));
      lc.height = Math.max(2, Math.round(fhPx * dpr));
      const g = lc.getContext('2d');
      g.lineCap = 'round';
      g.lineJoin = 'round';
      const k = s * dpr;
      const c0 = hex(f.c[0]);
      const c1 = hex(f.c[1]);
      const pts = data.p.map((a) => { const o = new Float32Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] * k; return o; });
      const cum = pts.map((a) => { const n = a.length >> 1; const c = new Float32Array(n); for (let i = 1; i < n; i++) c[i] = c[i - 1] + Math.hypot(a[2 * i] - a[2 * i - 2], a[2 * i + 1] - a[2 * i - 1]); return c; });
      const start = [];
      let total = 0;
      cum.forEach((c, i) => { start[i] = total; total += c[c.length - 1]; });
      const cols = pts.map((_, i) => mix(c0, c1, pts.length > 1 ? i / (pts.length - 1) : 0));
      const aura = auras[idx];
      const cx = slot.cx * W;
      if (aura) {
        const aw = fw * 2.1;
        const ah = fhPx * 1.3;
        aura.style.width = aw + 'px';
        aura.style.height = ah + 'px';
        aura.style.left = cx - aw / 2 + 'px';
        aura.style.top = slot.top * H + fhPx / 2 - ah / 2 + 'px';
        aura.style.background = 'radial-gradient(closest-side, rgba(' + f.glow + ',0.42), rgba(' + f.glow + ',0.12) 55%, rgba(' + f.glow + ',0) 78%)';
      }
      return { g, lc, pts, cum, start, total, cols, k, s, fw, fh: fhPx, ox: cx - fw / 2, oy: slot.top * H, kk: 0, v: 0, cyc: -1, aura, f };
    };

    const reset = (L) => { L.g.clearRect(0, 0, L.lc.width, L.lc.height); L.kk = 0; L.v = 0; };

    const strokeBoth = (L, col, draw) => {
      const g = L.g;
      g.strokeStyle = col;
      g.beginPath();
      draw(g);
      g.globalAlpha = 0.16;
      g.lineWidth = 5.5 * dpr;
      g.stroke();
      g.globalAlpha = 1;
      g.lineWidth = 1.7 * dpr;
      g.stroke();
    };

    // بترسم المقاطع الجاهزة لحد طول معيّن (تدريجياً، بدون إعادة رسم كل شي)
    const advance = (L, target) => {
      while (L.kk < L.pts.length) {
        const a = L.pts[L.kk];
        const c = L.cum[L.kk];
        const np = a.length >> 1;
        if (np < 2) { L.kk++; L.v = 0; continue; }
        const v = L.v;
        const need = L.start[L.kk] + (v === 0 ? c[1] : v <= np - 2 ? c[v + 1] : c[np - 1]);
        if (need > target) break;
        const col = L.cols[L.kk];
        const mid = (i, j) => [(a[2 * i] + a[2 * j]) / 2, (a[2 * i + 1] + a[2 * j + 1]) / 2];
        if (v === 0) {
          const m = mid(0, 1);
          strokeBoth(L, col, (g) => { g.moveTo(a[0], a[1]); g.lineTo(m[0], m[1]); });
          L.v = 1;
        } else if (v <= np - 2) {
          const m0 = mid(v - 1, v);
          const m1 = mid(v, v + 1);
          strokeBoth(L, col, (g) => { g.moveTo(m0[0], m0[1]); g.quadraticCurveTo(a[2 * v], a[2 * v + 1], m1[0], m1[1]); });
          L.v = v + 1;
        } else {
          const m = mid(np - 2, np - 1);
          strokeBoth(L, col, (g) => { g.moveTo(m[0], m[1]); g.lineTo(a[2 * (np - 1)], a[2 * (np - 1) + 1]); });
          L.kk++; L.v = 0;
        }
      }
    };

    // مكان رأس القلم (بإحداثيات الواجهة) عند طول معيّن
    const tipAt = (L, target) => {
      for (let k = 0; k < L.pts.length; k++) {
        const c = L.cum[k];
        const len = c[c.length - 1];
        if (target <= L.start[k] + len || k === L.pts.length - 1) {
          const t = Math.min(len, Math.max(0, target - L.start[k]));
          const a = L.pts[k];
          let i = 1;
          while (i < c.length - 1 && c[i] < t) i++;
          const seg = c[i] - c[i - 1] || 1;
          const f = (t - c[i - 1]) / seg;
          const x = a[2 * i - 2] + (a[2 * i] - a[2 * i - 2]) * f;
          const y = a[2 * i - 1] + (a[2 * i + 1] - a[2 * i - 1]) * f;
          return [L.ox + x / dpr, L.oy + y / dpr];
        }
      }
      return null;
    };

    const fit = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      W = Math.max(2, cv.clientWidth);
      H = Math.max(2, cv.clientHeight);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      const rtl = document.documentElement.getAttribute('dir') === 'rtl';
      const slots = slotsFor(W, H, rtl);
      layers = FIG.map((f, i) => buildLayer(f, slots[i], i));
      sprites = []; sparks = [];
      st.cx = slots[0].cx * W;
      st.cy = H * 0.45;
    };

    const spawnWord = (tip, act) => {
      const [txt, ar] = WORDS[Math.floor(Math.random() * WORDS.length)];
      let x = 0;
      let y = 0;
      for (let n = 0; n < 8; n++) {
        x = Math.random() * W; y = Math.random() * H;
        if (Math.hypot(x - tip[0], y - tip[1]) > Math.min(260, W * 0.3)) break;
      }
      const mx = (x + tip[0]) / 2;
      const my = (y + tip[1]) / 2;
      const nx = -(tip[1] - y);
      const ny = tip[0] - x;
      const nl = Math.hypot(nx, ny) || 1;
      const bend = (Math.random() - 0.5) * 0.7;
      sprites.push({ txt, ar, x0: x, y0: y, cx: mx + (nx / nl) * 160 * bend, cy: my + (ny / nl) * 160 * bend, born: 0, dur: 1100 + Math.random() * 700, sz: 14 + Math.random() * 9, hot: Math.random() < 0.3 ? act : -1 });
    };

    const frame = (t, dt) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      let act = -1;
      let actPh = 1e9;
      let tip = null;
      layers.forEach((L, i) => {
        const f = FIG[i];
        const tt = t - f.off;
        if (tt < 0) { if (L.aura) L.aura.style.opacity = '0'; return; }
        const cyc = Math.floor(tt / CYC);
        const ph = tt - cyc * CYC;
        if (cyc !== L.cyc) { reset(L); L.cyc = cyc; }
        const p = clamp01(ph / DRAW);
        advance(L, p * L.total);
        let a;
        if (ph < DRAW) a = 0.98 * clamp01(ph / 500);
        else if (ph < DRAW + HOLD) a = lerp(0.9, 0.45, (ph - DRAW) / HOLD);
        else a = lerp(0.45, 0, (ph - DRAW - HOLD) / (CYC - DRAW - HOLD));
        if (a > 0.01) { ctx.globalAlpha = a; ctx.drawImage(L.lc, L.ox, L.oy, L.fw, L.fh); ctx.globalAlpha = 1; }
        if (L.aura) L.aura.style.opacity = (a * (0.3 + 0.7 * p)).toFixed(3);
        if (ph < DRAW && ph < actPh) { act = i; actPh = ph; tip = tipAt(L, p * L.total); }
      });
      st.tip = tip;
      // كلمات بتنسحب لرأس القلم
      if (tip) {
        st.acc += dt;
        while (st.acc > 140) { st.acc -= 140; if (sprites.length < 16) spawnWord(tip, act); }
        if (Math.random() < 0.7) sparks.push({ x: tip[0], y: tip[1], vx: (Math.random() - 0.5) * 40, vy: -10 + Math.random() * 40, life: 500 + Math.random() * 500, age: 0, r: 1 + Math.random() * 1.6 });
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = sprites.length - 1; i >= 0; i--) {
        const sp = sprites[i];
        sp.born += dt;
        const u = sp.born / sp.dur;
        const target = tip || st.tip;
        if (u >= 1 || !target) {
          if (target) for (let n = 0; n < 4; n++) sparks.push({ x: target[0], y: target[1], vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, life: 420, age: 0, r: 1.4 });
          sprites.splice(i, 1);
          continue;
        }
        const e = Math.pow(u, 1.7);
        const x = (1 - e) * (1 - e) * sp.x0 + 2 * (1 - e) * e * sp.cx + e * e * target[0];
        const y = (1 - e) * (1 - e) * sp.y0 + 2 * (1 - e) * e * sp.cy + e * e * target[1];
        const al = Math.min(1, u * 5) * (1 - clamp01((u - 0.78) / 0.22)) * 0.9;
        ctx.globalAlpha = al;
        ctx.fillStyle = sp.hot >= 0 ? 'rgb(' + FIG[sp.hot].glow + ')' : '#4a3520';
        ctx.font = (600) + ' ' + (sp.sz * (1 - 0.4 * e)).toFixed(1) + 'px ' + (sp.ar ? "'IBM Plex Sans Arabic','Tajawal',sans-serif" : "ui-monospace,Menlo,Consolas,monospace");
        ctx.direction = sp.ar ? 'rtl' : 'ltr';
        ctx.fillText(sp.txt, x, y);
      }
      ctx.globalAlpha = 1;
      ctx.direction = 'ltr';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sk = sparks[i];
        sk.age += dt;
        if (sk.age >= sk.life) { sparks.splice(i, 1); continue; }
        const q = sk.age / sk.life;
        sk.x += (sk.vx * dt) / 1000;
        sk.y += (sk.vy * dt) / 1000;
        ctx.globalAlpha = (1 - q) * 0.9;
        ctx.fillStyle = q < 0.4 ? '#fffaf0' : '#d6a03c';
        ctx.beginPath();
        ctx.arc(sk.x, sk.y, sk.r * (1 - 0.5 * q), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (tip) {
        const f = FIG[act];
        const g = ctx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 26);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.2, 'rgba(' + f.glow + ',0.75)');
        g.addColorStop(1, 'rgba(' + f.glow + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(tip[0], tip[1], 26, 0, Math.PI * 2);
        ctx.fill();
      }
      // الوسم: البرومبت بينكتب جنب القلم
      if (tag) {
        const on = act >= 0;
        if (on) {
          const f = FIG[act];
          const n = Math.floor(f.prompt.length * clamp01(actPh / (DRAW * 0.55)));
          if (n !== st.chars || st.act !== act) {
            typed.textContent = f.prompt.slice(0, n);
            st.chars = n;
            st.act = act;
            st.tagW = tag.offsetWidth || st.tagW;
          }
          const x = Math.min(Math.max(tip[0] + 20, 8), W - st.tagW - 8);
          const y = Math.min(Math.max(tip[1] - 58, 8), H - 56);
          tag.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
        }
        if (on !== st.tagOn) { tag.classList.toggle('on', on); st.tagOn = on; }
      }
    };

    // بقعة ضوء بتتبع المؤشر (أو رأس القلم) + إزاحة خفيفة للبرومبتات
    let lx = -1;
    let ly = -1;
    const follow = (now) => {
      const active = now - mouse.t < 2600;
      const tx = active ? mouse.x : st.tip ? st.tip[0] : st.cx;
      const ty = active ? mouse.y : st.tip ? st.tip[1] : st.cy;
      if (lx < 0) { lx = tx; ly = ty; }
      lx += (tx - lx) * 0.09;
      ly += (ty - ly) * 0.09;
      section.style.setProperty('--mx', lx.toFixed(1) + 'px');
      section.style.setProperty('--my', ly.toFixed(1) + 'px');
      mouse.nx += ((active ? (mouse.x / W - 0.5) * 2 : 0) - mouse.nx) * 0.07;
      mouse.ny += ((active ? (mouse.y / H - 0.5) * 2 : 0) - mouse.ny) * 0.07;
      section.style.setProperty('--px', mouse.nx.toFixed(3));
      section.style.setProperty('--py', mouse.ny.toFixed(3));
    };
    const onMove = (e) => {
      const r = section.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.t = performance.now();
    };

    // وضع تقليل الحركة: القطع الثلاث جاهزة وثابتة
    const paintStill = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      layers.forEach((L, i) => {
        advance(L, L.total + 1);
        ctx.globalAlpha = [0.85, 0.5, 0.4][i];
        ctx.drawImage(L.lc, L.ox, L.oy, L.fw, L.fh);
        ctx.globalAlpha = 1;
        if (L.aura) L.aura.style.opacity = [0.7, 0.4, 0.35][i];
      });
    };

    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { fit(); if (still) paintStill(); }) : null;
    if (ro) ro.observe(section);
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((es) => { visible = es[0].isIntersecting; }) : null;
    if (io) io.observe(section);
    if (fine && !reduce) section.addEventListener('pointermove', onMove);

    if (reduce) {
      still = true;
      paintStill();
    } else {
      let t = 0;
      let last = performance.now();
      const tick = (now) => {
        if (!alive) return;
        const dt = Math.min(100, Math.max(0, now - last));
        last = now;
        t += dt;
        if (visible) { frame(t, dt); follow(now); }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); section.removeEventListener('pointermove', onMove); };
  }, []);

  return (
    <section className="hm-hero" ref={sec}>
      <div className="hh-bg" aria-hidden="true">
        <i className="hh-blob b1" />
        <i className="hh-blob b2" />
        <i className="hh-blob b3" />
        <i className="hh-blob b4" />
        <i className="hh-dots" />
        <i className="hh-dots hot" />
        <i className="hb-aura" />
        <i className="hb-aura" />
        <i className="hb-aura" />
      </div>
      <PromptCloud tone="bright" />
      <canvas className="hb-canvas" ref={canvas} aria-hidden="true" />
      <div className="hb-tag" ref={tagRef} aria-hidden="true">
        <span className="hb-k">prompt</span>
        <span className="hb-typed" ref={typedRef} />
      </div>

      <div className="s-wrap hm-hero-grid">
        <div className="hm-hero-left">{children}</div>
      </div>

      <style jsx global>{`
        .hm-hero { position: relative; overflow: hidden; isolation: isolate; padding-block: 44px 72px; background-color: #f5eee2; background-image: linear-gradient(180deg, #f7f1e6 0%, #f3e9db 60%, #f1e3d3 100%); color: var(--ink); min-height: min(calc(100svh - 64px), 800px); display: flex; align-items: center; --mx: 72%; --my: 46%; }
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
        .hb-aura { position: absolute; opacity: 0; border-radius: 50%; will-change: opacity; }
        .hh-dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(110, 80, 40, 0.3) 1px, transparent 1.5px); background-size: 28px 28px; opacity: 0.45; -webkit-mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent); mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent); }
        .hh-dots.hot { opacity: 1; background-image: radial-gradient(rgba(170, 110, 40, 0.9) 1.3px, transparent 1.9px); -webkit-mask-image: radial-gradient(240px circle at var(--mx) var(--my), #000 0%, transparent 100%); mask-image: radial-gradient(240px circle at var(--mx) var(--my), #000 0%, transparent 100%); }
        .hm-hero .pc.bright { z-index: 1; }
        .hb-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 2; pointer-events: none; display: block; -webkit-mask-image: linear-gradient(to right, rgba(0, 0, 0, 0.2) 0, rgba(0, 0, 0, 0.2) 38%, #000 56%); mask-image: linear-gradient(to right, rgba(0, 0, 0, 0.2) 0, rgba(0, 0, 0, 0.2) 38%, #000 56%); }
        html[dir='rtl'] .hb-canvas { -webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 0.2) 0, rgba(0, 0, 0, 0.2) 38%, #000 56%); mask-image: linear-gradient(to left, rgba(0, 0, 0, 0.2) 0, rgba(0, 0, 0, 0.2) 38%, #000 56%); }
        .hm-hero .hm-hero-grid { position: relative; z-index: 3; }
        .hm-hero-left { position: relative; min-width: 0; max-width: 620px; }
        .hm-hero-left > * { animation: hh-in 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        .hm-hero-left > .hm-hero-text > * { animation: hh-in 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        @keyframes hh-in { from { opacity: 0; translate: 0 22px; } to { opacity: 1; translate: 0 0; } }

        .hb-tag { position: absolute; z-index: 4; left: 0; top: 0; direction: ltr; display: flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 12px; background: rgba(255, 252, 246, 0.88); backdrop-filter: blur(8px); border: 1px solid rgba(185, 143, 78, 0.5); box-shadow: 0 16px 34px -14px rgba(110, 70, 30, 0.55); white-space: pre; max-width: calc(100vw - 16px); opacity: 0; transition: opacity 0.35s; pointer-events: none; will-change: transform; }
        .hb-tag.on { opacity: 1; }
        .hb-k { font-weight: 700; font-size: 0.78rem; background: linear-gradient(120deg, #b98f4e, #d0603f); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .hb-typed { font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 0.8rem; color: var(--ink); min-height: 1.2em; padding-inline-end: 3px; border-inline-end: 2px solid #b98f4e; animation: hb-caret 0.8s step-end infinite; }
        @keyframes hb-caret { 50% { border-inline-end-color: transparent; } }

        @media (max-width: 700px) {
          .hb-canvas, html[dir='rtl'] .hb-canvas { -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.18) 0, rgba(0, 0, 0, 0.18) 48%, #000 58%); mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.18) 0, rgba(0, 0, 0, 0.18) 48%, #000 58%); }
          .hm-hero { align-items: flex-start; padding-block: 28px 400px; min-height: 0; }
          .hb-typed { font-size: 0.68rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hh-blob, .hb-typed, .hm-hero-left > *, .hm-hero-left > .hm-hero-text > * { animation: none !important; }
          .hb-tag { display: none; }
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
