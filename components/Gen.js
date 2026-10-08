// components/Gen.js
// محرك "التوليد": بيرسم الصورة على canvas من ضباب وحبيبات (دقة منخفضة) لحد ما توضح، متل ما بتظهر نتيجة نموذج توليد صور.
// بدون مكتبات. بيستعمله الاستوديو بالواجهة وخلفية صفحة الأداة.

export const COLS = [5, 8, 13, 21, 34, 56, 96, 160];

export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// يرسم الصورة بأسلوب object-fit: cover، و fy = أي جزء من الارتفاع الزايد بينقصّ من فوق (0 = ما بينقص من فوق).
export function drawCover(ctx, img, W, H, fy = 0.1) {
  const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const sw = W / s;
  const sh = H / s;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) * fy;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
}

let noise = null;
function getNoise() {
  if (noise) return noise;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const d = g.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() * 255;
    d.data[i] = v; d.data[i + 1] = v; d.data[i + 2] = v; d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  noise = c;
  return c;
}

// p بين 0 و1: 0 = ضباب خام، 1 = الصورة كاملة.
export function drawGen(ctx, tmp, img, W, H, p, fy) {
  ctx.clearRect(0, 0, W, H);
  if (!img) return;
  if (p >= 1) { drawCover(ctx, img, W, H, fy); return; }
  const step = Math.min(COLS.length - 1, Math.max(0, Math.floor(p * COLS.length)));
  const cols = COLS[step];
  const rows = Math.max(1, Math.round((cols * H) / W));
  tmp.width = cols;
  tmp.height = rows;
  const t = tmp.getContext('2d');
  t.imageSmoothingEnabled = true;
  drawCover(t, img, cols, rows, fy);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(tmp, 0, 0, cols, rows, 0, 0, W, H);
  // حبيبات: بتقلّ لحد ما تختفي مع اكتمال التوليد
  ctx.globalAlpha = Math.pow(1 - p, 1.3) * 0.38;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(getNoise(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

// ===== الرسم بالخطوط: قلم بيرسم المسارات واحد ورا التاني، مع توهّج عند رأس القلم =====
function prep(data) {
  if (data._len) return data;
  data._len = data.p.map((a) => {
    let L = 0;
    for (let i = 2; i < a.length; i += 2) L += Math.hypot(a[i] - a[i - 2], a[i + 1] - a[i - 1]);
    return L;
  });
  data._total = data._len.reduce((s, x) => s + x, 0);
  return data;
}

function strokeSmooth(ctx, pts) {
  // pts: [x0,y0,x1,y1,...] — بنعمل منحنى ناعم من منتصفات القطع بدل خطوط مكسّرة
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  if (pts.length <= 4) { ctx.lineTo(pts[2], pts[3]); ctx.stroke(); return; }
  for (let i = 2; i < pts.length - 2; i += 2) {
    const mx = (pts[i] + pts[i + 2]) / 2;
    const my = (pts[i + 1] + pts[i + 3]) / 2;
    ctx.quadraticCurveTo(pts[i], pts[i + 1], mx, my);
  }
  ctx.lineTo(pts[pts.length - 2], pts[pts.length - 1]);
  ctx.stroke();
}

// prog بين 0 و1. المخرج: إحداثيات رأس القلم (للتوهج) أو null.
export function drawLines(ctx, data, W, H, prog, alpha = 1, dpr = 1, theme = 'dark') {
  const C = theme === 'light'
    ? { stroke: '143, 106, 46', glow: '185, 143, 78', tip0: '120, 84, 28', tip1: '143, 106, 46', sb: 3, k: 0.85 }
    : { stroke: '242, 220, 166', glow: '201, 164, 99', tip0: '255, 244, 214', tip1: '242, 220, 166', sb: 7, k: 0.92 };
  ctx.clearRect(0, 0, W, H);
  if (!data || prog <= 0 || alpha <= 0) return null;
  prep(data);
  // نحافظ على نسبة الرسمة: بتنرسم مركزية وملاصقة للأسفل ضمن الصندوق
  const s = Math.min(W / data.w, H / data.h);
  const ox = (W - data.w * s) / 2;
  const oy = H - data.h * s;
  const sx = s;
  const sy = s;
  let budget = Math.min(1, prog) * data._total;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.3 * dpr;
  ctx.strokeStyle = 'rgba(' + C.stroke + ',' + (C.k * alpha).toFixed(3) + ')';
  ctx.shadowColor = 'rgba(' + C.glow + ',' + (0.9 * alpha).toFixed(3) + ')';
  ctx.shadowBlur = C.sb * dpr;
  let tip = null;
  for (let k = 0; k < data.p.length && budget > 0; k++) {
    const a = data.p[k];
    const L = data._len[k];
    let pts;
    if (budget >= L) {
      pts = new Array(a.length);
      for (let i = 0; i < a.length; i += 2) { pts[i] = ox + a[i] * sx; pts[i + 1] = oy + a[i + 1] * sy; }
      budget -= L;
      if (budget <= 0) tip = [pts[pts.length - 2], pts[pts.length - 1]];
    } else {
      pts = [ox + a[0] * sx, oy + a[1] * sy];
      let rem = budget;
      for (let i = 2; i < a.length; i += 2) {
        const seg = Math.hypot(a[i] - a[i - 2], a[i + 1] - a[i - 1]);
        if (rem >= seg) { pts.push(ox + a[i] * sx, oy + a[i + 1] * sy); rem -= seg; }
        else { const f = seg ? rem / seg : 0; pts.push(ox + (a[i - 2] + (a[i] - a[i - 2]) * f) * sx, oy + (a[i - 1] + (a[i + 1] - a[i - 1]) * f) * sy); break; }
      }
      budget = 0;
      if (pts.length >= 4) tip = [pts[pts.length - 2], pts[pts.length - 1]];
    }
    if (pts.length >= 4) strokeSmooth(ctx, pts);
  }
  ctx.restore();
  if (tip && prog < 1) {
    const g = ctx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 16 * dpr);
    g.addColorStop(0, 'rgba(' + C.tip0 + ',' + alpha.toFixed(3) + ')');
    g.addColorStop(0.25, 'rgba(' + C.tip1 + ',' + (0.7 * alpha).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + C.glow + ', 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(tip[0], tip[1], 16 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }
  return tip;
}
