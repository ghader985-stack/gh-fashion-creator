// components/ToolBackdrop.js
// خلفية صفحة الأداة: برومبتات بتطير بالهوا، وفي قوسين على الجانبين: خط بيرسم التصميم، وبعدين الصورة بتتولّد من ضباب.
// الصور والخطوط حقيقية من مخرجات الأداة. طبقة ثابتة z-index:-1 بدون أحداث، ما بتغيّر تخطيط الأداة.

import { useEffect, useRef } from 'react';
import { PromptCloud } from './Atelier';
import { drawGen, drawLines, loadImage } from './Gen';
import { LINES } from '../lib/lines';

const POOL = [
  { img: '/showcase/coat.jpg', fy: 0.1, lines: 'coat', prompt: 'wool coat, swirl panels' },
  { img: '/showcase/mauve.jpg', fy: 0, lines: 'mauve', prompt: 'beaded mauve gown, tulle' },
  { img: '/showcase/lilac.jpg', fy: 0.1, lines: 'lilac', prompt: 'lilac gown, floral cape' },
];
// كل قوس بيمشي على ترتيب مختلف، وبيبدأ بعد التاني بنص دورة
const GROUPS = [
  { side: 'a', order: [0, 2, 1], shift: 0 },
  { side: 'b', order: [1, 0, 2], shift: 3000 },
];
const TYPE = 2000;
const GEN_AT = 2600;
const GEN = 2400;
const PER = 10400;

function Arch({ g, innerRef }) {
  return (
    <div className={'gh-tb-g ' + g.side} ref={innerRef}>
      <div className="gh-tb-arch"><canvas /></div>
      <div className="gh-tb-prompt">
        <span className="gh-tb-k">prompt</span>
        <span className="gh-tb-txt"><span className="gh-tb-typed" /></span>
      </div>
    </div>
  );
}

export default function ToolBackdrop() {
  const refs = [useRef(null), useRef(null)];

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let alive = true;
    let raf = 0;
    const lc = document.createElement('canvas');
    const tmp = document.createElement('canvas');
    const states = GROUPS.map((g, gi) => {
      const root = refs[gi].current;
      const cv = root.querySelector('canvas');
      return { g, root, cv, ctx: cv.getContext('2d'), typed: root.querySelector('.gh-tb-typed'), W: 2, H: 2, key: '', chars: -1, dpr: 1 };
    });
    const fit = () => states.forEach((s) => {
      const r = s.cv.getBoundingClientRect();
      s.dpr = Math.min(2, window.devicePixelRatio || 1);
      s.W = Math.max(2, Math.round(r.width * s.dpr));
      s.H = Math.max(2, Math.round(r.height * s.dpr));
      s.cv.width = s.W; s.cv.height = s.H; s.key = '';
    });
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    if (ro) states.forEach((s) => ro.observe(s.cv));
    let imgs = [];

    const paint = (s, item, l, t) => {
      const { ctx, W, H } = s;
      const sl = POOL[item];
      const img = imgs[item];
      // أ) الصورة (أو لا شي)
      let photoP = 0;
      if (l >= GEN_AT) photoP = Math.min(1, (l - GEN_AT) / GEN);
      const prevItem = s.g.order[(Math.floor(t / PER) + s.g.order.length - 1) % s.g.order.length];
      let key;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fffdf8';
      ctx.fillRect(0, 0, W, H);
      if (l < 400 && t >= PER && imgs[prevItem]) {
        // القطعة السابقة بتختفي بسرعة قبل ما يبدأ الرسم الجديد
        drawGen(ctx, tmp, imgs[prevItem], W, H, 1, POOL[prevItem].fy);
        ctx.fillStyle = 'rgba(255, 253, 248,' + (l / 400).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
        key = 'out';
      } else if (photoP > 0 && img) {
        drawGen(ctx, tmp, img, W, H, photoP, sl.fy);
      }
      // ب) الخط فوقها
      const drawP = Math.min(1, Math.max(0, (l - 300) / (TYPE + 300)));
      const lineA = photoP <= 0 ? 1 : Math.max(0, 1 - photoP * 1.6);
      if (drawP > 0 && lineA > 0) {
        lc.width = W; lc.height = H;
        drawLines(lc.getContext('2d'), LINES[sl.lines], W, H, drawP, lineA, s.dpr, 'light');
        ctx.drawImage(lc, 0, 0);
      }
      return key;
    };

    Promise.all(POOL.map((p) => loadImage(p.img))).then((arr) => {
      if (!alive) return;
      imgs = arr;
      if (reduce) {
        states.forEach((s) => {
          const item = s.g.order[0];
          s.typed.textContent = POOL[item].prompt;
          drawGen(s.ctx, tmp, imgs[item], s.W, s.H, 1, POOL[item].fy);
        });
        return;
      }
      let t = 0;
      let last = performance.now();
      const tick = (now) => {
        if (!alive) return;
        t += Math.min(100, Math.max(0, now - last));
        last = now;
        states.forEach((s) => {
          const tt = t - s.g.shift;
          if (tt < 0) return;
          const cyc = Math.floor(tt / PER);
          const item = s.g.order[cyc % s.g.order.length];
          const l = tt % PER;
          const len = POOL[item].prompt.length;
          const chars = l < TYPE ? Math.floor((len * l) / TYPE) : len;
          if (chars !== s.chars || s.itemKey !== item) { s.typed.textContent = POOL[item].prompt.slice(0, chars); s.chars = chars; s.itemKey = item; }
          // نرسم كل فريم أثناء الرسم والتوليد، وبالراحة وقت العرض
          const animating = l < GEN_AT + GEN + 100 || (l < 400);
          const k = animating ? 'a' + Math.floor(l / 16) : 'h' + cyc;
          if (k !== s.key) { paint(s, item, l, tt + 0); s.key = k; }
        });
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    return () => { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); };
  }, []);

  return (
    <div className="gh-tb" aria-hidden="true">
      <PromptCloud tone="light" />
      {GROUPS.map((g, i) => <Arch g={g} innerRef={refs[i]} key={g.side} />)}

      <style jsx global>{`
        .gh-tb { position: fixed; top: 0; bottom: 0; left: 0; right: var(--sidebar-w, 264px); z-index: -1; pointer-events: none; overflow: hidden; }
        .gh-tb .pc.light { position: absolute; z-index: 0; }
        .gh-tb-g { position: absolute; bottom: calc(92px + 1vh); width: clamp(150px, 14vw, 210px); display: flex; flex-direction: column; gap: 10px; z-index: 1; }
        .gh-tb-g.a { left: 3vw; align-items: flex-start; }
        .gh-tb-g.b { right: 3vw; align-items: flex-end; }
        .gh-tb-arch { align-self: stretch; }
        .gh-tb-prompt { width: max-content; max-width: 90vw; direction: ltr; display: flex; align-items: center; gap: 8px; background: rgba(17, 14, 13, 0.9); color: #f5efe4; border-radius: 10px; padding: 8px 11px; }
        .gh-tb-k { font-family: 'Bodoni Moda', serif; font-style: italic; font-size: 0.8rem; color: #c9a463; flex-shrink: 0; }
        .gh-tb-txt { flex: 1; min-width: 0; overflow: hidden; min-height: 1.4em; }
        .gh-tb-typed { box-sizing: content-box; display: inline-block; white-space: pre; vertical-align: top; border-inline-end: 2px solid #c9a463; padding-inline-end: 2px; font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 0.66rem; line-height: 1.4; animation: gh-tb-caret 0.8s step-end infinite; }
        @keyframes gh-tb-caret { 50% { border-inline-end-color: transparent; } }
        .gh-tb-arch { position: relative; aspect-ratio: 4 / 5; border-radius: 999px 999px 14px 14px; overflow: hidden; background: #fffdf8; border: 1px solid rgba(143, 106, 46, 0.55); box-shadow: 0 18px 34px -20px rgba(23, 18, 15, 0.5); }
        .gh-tb-arch canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        @media (max-width: 900px) {
          .gh-tb { right: 0; }
          .gh-tb-g { width: clamp(130px, 30vw, 190px); bottom: calc(80px + 2vh); }
          .gh-tb-g.a { left: 3vw; }
          .gh-tb-g.b { right: 3vw; }
        }
        @media (max-width: 560px) { .gh-tb-g.b { display: none; } }
        @media (prefers-reduced-motion: reduce) { .gh-tb-typed { animation: none; border-inline-end-color: transparent; } }
      `}</style>
    </div>
  );
}
