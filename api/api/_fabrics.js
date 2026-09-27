// api/_fabrics.js
// مكتبة الأقمشة الجاهزة لقسم «تبديل القماش» — ملف مشترك، مو رابط API
// (Vercel ما بيعمل رابط لأي ملف اسمه بيبلش بـ _).
//
// المصدر: Poly Haven — كل الخامات CC0: مجانية للاستخدام التجاري وبلا نسب.
// الصورة بتنسحب من Poly Haven مرة وحدة بس، وبتنحفظ بـ Vercel Blob، وبعدها
// كل المشتركات بياخدوها من Blob. يعني ما في اعتماد دائم على موقعهم.
//
// لكل قماش صورتين:
//   ui  ← مصغّرة ‎320px لعرض المكتبة
//   ref ← ‎1024px تنبعت لنموذج الرسم كعيّنة للقماش
//
// أسماء الملفات مأخوذة حرفياً من ملفات Poly Haven (مو كلها _diff_).

import { put, head } from '@vercel/blob';
import jpeg from 'jpeg-js';

const PH = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/';

// cat: نفس تصنيفات Adstronaut
export const FABRIC_CATS = ['Cotton & Linen', 'Silk & Satin', 'Wool & Knits', 'Technical & Leather', 'Patterns & Prints'];

export const FABRICS = [
  // Cotton & Linen
  { id: 'stretch_poplin', cat: 'Cotton & Linen', name: 'Green Stretch Poplin', file: 'stretch_poplin_diff_1k.jpg',
    desc: 'fine, tightly woven stretch-cotton poplin with a smooth matte surface' },
  { id: 'rough_linen', cat: 'Cotton & Linen', name: 'Blue Linen', file: 'rough_linen_diff_1k.jpg',
    desc: 'woven linen with a slightly irregular slub weave and a dry matte hand' },
  { id: 'cotton_jersey', cat: 'Cotton & Linen', name: 'Beige Cotton Jersey', file: 'cotton_jersey_diff_1k.jpg',
    desc: 'soft cotton jersey knit with a fine ribbed matte surface' },
  { id: 'denim_fabric_03', cat: 'Cotton & Linen', name: 'Light Blue Denim', file: 'denim_fabric_03_diff_1k.jpg',
    desc: 'cotton denim twill with a visible diagonal weave, matte and sturdy' },
  { id: 'ribbed_corduroy', cat: 'Cotton & Linen', name: 'Green Corduroy', file: 'ribbed_corduroy_diff_1k.jpg',
    desc: 'cotton corduroy with raised, velvety vertical wales' },
  { id: 'waffle_pique_cotton', cat: 'Cotton & Linen', name: 'Yellow Waffle Piqué', file: 'waffle_pique_cotton_diff_1k.jpg',
    desc: 'cotton waffle piqué with a raised square grid texture' },

  // Silk & Satin
  { id: 'crepe_satin', cat: 'Silk & Satin', name: 'Gold Crepe Satin', file: 'crepe_satin_diff_1k.jpg',
    desc: 'fluid crepe-back satin with a glossy silky sheen and a soft liquid drape' },
  { id: 'crepe_georgette', cat: 'Silk & Satin', name: 'Teal Crepe Georgette', file: 'crepe_georgette_diff_1k.jpg',
    desc: 'sheer, airy crepe georgette with a fine grainy surface and a floaty drape' },
  { id: 'velour_velvet', cat: 'Silk & Satin', name: 'Red Velvet', file: 'velour_velvet_diff_1k.jpg',
    desc: 'plush velvet with a dense soft pile and a rich light-catching sheen' },
  { id: 'terlenka', cat: 'Silk & Satin', name: 'Cream Terlenka', file: 'terlenka_diff_1k.jpg',
    desc: 'fine woven polyester with a smooth, slightly crisp hand and a soft sheen' },

  // Wool & Knits
  { id: 'wool_boucle', cat: 'Wool & Knits', name: 'Wool Bouclé', file: 'wool_boucle_diff_1k.jpg',
    desc: 'wool bouclé with looped, nubby yarns and a textured surface' },
  { id: 'poly_wool_herringbone', cat: 'Wool & Knits', name: 'Grey Herringbone', file: 'poly_wool_herringbone_diff_1k.jpg',
    desc: 'wool-blend suiting woven in a herringbone twill' },
  { id: 'jersey_melange', cat: 'Wool & Knits', name: 'Blue Melange Jersey', file: 'jersey_melange_diff_1k.jpg',
    desc: 'soft heathered melange knit jersey' },
  { id: 'knitted_fleece', cat: 'Wool & Knits', name: 'Brown Knitted Fleece', file: 'knitted_fleece_diff_1k.jpg',
    desc: 'dense, warm knitted fleece with a soft brushed face' },
  { id: 'caban', cat: 'Wool & Knits', name: 'Orange Wool Coating', file: 'caban_diff_1k.jpg',
    desc: 'thick napped woollen coating with a soft fuzzy surface' },

  // Technical & Leather
  { id: 'leather_white', cat: 'Technical & Leather', name: 'White Leather', file: 'leather_white_diff_1k.jpg',
    desc: 'smooth, even leather with a soft semi-matte finish' },
  { id: 'leather_red_03', cat: 'Technical & Leather', name: 'Red Leather', file: 'leather_red_03_coll1_1k.jpg',
    desc: 'smooth, lustrous leather with a fine grain' },
  { id: 'brown_leather', cat: 'Technical & Leather', name: 'Brown Leather', file: 'brown_leather_albedo_1k.jpg',
    desc: 'matte vintage leather with natural creases' },
  { id: 'scuba_suede', cat: 'Technical & Leather', name: 'Turquoise Scuba Suede', file: 'scuba_suede_diff_1k.jpg',
    desc: 'thick scuba neoprene with a soft suede-like face that holds a structured shape' },
  { id: 'bi_stretch', cat: 'Technical & Leather', name: 'Yellow Bi-Stretch', file: 'bi_stretch_diff_1k.jpg',
    desc: 'fine technical bi-stretch polyester weave, smooth and flexible' },

  // Patterns & Prints
  { id: 'floral_jacquard', cat: 'Patterns & Prints', name: 'Black Floral Jacquard', file: 'floral_jacquard_diff_1k.jpg',
    desc: 'woven jacquard with a raised floral pattern', pattern: true },
  { id: 'quatrefoil_jacquard_fabric', cat: 'Patterns & Prints', name: 'Burgundy Quatrefoil Jacquard', file: 'quatrefoil_jacquard_fabric_diff_1k.jpg',
    desc: 'brocade-like jacquard with a woven quatrefoil pattern', pattern: true },
  { id: 'gingham_check', cat: 'Patterns & Prints', name: 'Green Gingham', file: 'gingham_check_diff_1k.jpg',
    desc: 'woven cotton gingham check', pattern: true },
  { id: 'fabric_pattern_05', cat: 'Patterns & Prints', name: 'Windowpane Plaid', file: 'fabric_pattern_05_col_01_1k.jpg',
    desc: 'woven plaid with a windowpane check', pattern: true },
];

export const fabricById = (id) => FABRICS.find((f) => f.id === id) || null;
export const sourceUrl = (f) => PH + f.id + '/' + f.file;

const SIZES = { ui: 320, ref: 1024 };
const FETCH_MS = 20000;

// تصغير بـ box filter — بلا مكتبات صور ثقيلة. أي فشل = الصورة الأصلية.
function shrinkJpeg(buf, maxSide) {
  try {
    const src = jpeg.decode(buf, { useTArray: true, maxMemoryUsageInMB: 256 });
    const k = Math.min(1, maxSide / Math.max(src.width, src.height));
    if (k >= 1) return buf;
    const w = Math.max(1, Math.round(src.width * k));
    const h = Math.max(1, Math.round(src.height * k));
    const out = Buffer.alloc(w * h * 4);
    const sx = src.width / w;
    const sy = src.height / h;
    for (let y = 0; y < h; y++) {
      const y0 = Math.floor(y * sy);
      const y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
      for (let x = 0; x < w; x++) {
        const x0 = Math.floor(x * sx);
        const x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
        let r = 0; let g = 0; let b = 0; let n = 0;
        for (let yy = y0; yy < y1; yy++) {
          let i = (yy * src.width + x0) * 4;
          for (let xx = x0; xx < x1; xx++) {
            r += src.data[i]; g += src.data[i + 1]; b += src.data[i + 2]; n++;
            i += 4;
          }
        }
        const o = (y * w + x) * 4;
        out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = 255;
      }
    }
    return Buffer.from(jpeg.encode({ data: out, width: w, height: h }, 84).data);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] fabric shrink', e && e.message);
    return buf;
  }
}

async function fetchSource(f) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const r = await fetch(sourceUrl(f), { signal: ctrl.signal });
    if (!r.ok) {
      if (typeof console !== 'undefined') console.warn('[gh] fabric source', f.id, r.status);
      return null;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    return buf.length > 100 ? buf : null;
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] fabric source', f.id, e && e.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// يرجّع { url } لصورة محفوظة بـ Blob، أو { bytes } إذا Blob مو متاح.
// null = ما في صورة (المصدر ما رد) — والقسم بيكمّل بالاسم والوصف.
export async function ensureSwatch(f, kind) {
  const size = SIZES[kind] || SIZES.ui;
  const key = 'fabrics/' + f.id + '-' + kind + '.jpg';
  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  if (hasBlob) {
    try {
      const h = await head(key);
      if (h && h.url) return { url: h.url };
    } catch (e) {
      // مو موجودة لسا — منكمّل ومنحفظها
    }
  }

  const raw = await fetchSource(f);
  if (!raw) return null;
  const bytes = shrinkJpeg(raw, size);

  if (hasBlob) {
    try {
      const out = await put(key, bytes, {
        access: 'public', contentType: 'image/jpeg', addRandomSuffix: false, allowOverwrite: true,
      });
      if (out && out.url) return { url: out.url, bytes };
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[gh] fabric blob put', f.id, e && e.message);
    }
  }
  return { bytes };
}
