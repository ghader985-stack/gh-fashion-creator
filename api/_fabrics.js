// api/_fabrics.js
// مكتبة الأقمشة الجاهزة لقسم «تبديل القماش» — ملف مشترك، مو رابط API
// (Vercel ما بيعمل رابط لأي ملف اسمه بيبلش بـ _).
//
// المصدر: Pexels — صور حقيقية لقماش حقيقي، مجانية للاستخدام التجاري وبلا نسب
// (رخصة Pexels). كل صورة انختارت بالعين: قماش واضح بطيّاته ولمعته.
// الصورة بتنسحب من Pexels مرة وحدة بس، وبتنحفظ بـ Vercel Blob، وبعدها كل
// المشتركات بياخدوها من Blob. بلا أي كلفة.
//
// لكل قماش صورتين:
//   ui  ← ‎400px لعرض المكتبة
//   ref ← ‎1024px تنبعت لنموذج الرسم كعيّنة للقماش

import { put, head } from '@vercel/blob';

export const FABRIC_CATS = ['Cotton & Linen', 'Silk & Satin', 'Wool & Knits', 'Technical & Leather', 'Patterns & Prints'];

// px = رقم الصورة على Pexels
export const FABRICS = [
  // Cotton & Linen
  { id: 'white-cotton', px: 7087670, cat: 'Cotton & Linen', name: 'White Cotton',
    desc: 'smooth white woven cotton with soft natural wrinkles' },
  { id: 'natural-linen', px: 7232409, cat: 'Cotton & Linen', name: 'Natural Linen',
    desc: 'natural beige linen with a dry, slightly slubby weave' },
  { id: 'olive-linen', px: 7794355, cat: 'Cotton & Linen', name: 'Olive Linen',
    desc: 'olive linen with a crinkled, textured surface' },
  { id: 'indigo-denim', px: 173207, cat: 'Cotton & Linen', name: 'Indigo Denim',
    desc: 'indigo cotton denim with a visible diagonal twill weave' },
  { id: 'navy-corduroy', px: 6276044, cat: 'Cotton & Linen', name: 'Navy Corduroy',
    desc: 'navy cotton corduroy with soft raised vertical wales' },

  // Silk & Satin
  { id: 'black-satin', px: 8007347, cat: 'Silk & Satin', name: 'Black Satin',
    desc: 'black satin with a glossy liquid sheen and soft fluid drape' },
  { id: 'teal-satin', px: 7676887, cat: 'Silk & Satin', name: 'Teal Satin',
    desc: 'teal satin with a bright glossy sheen and fluid drape' },
  { id: 'silver-satin', px: 6920410, cat: 'Silk & Satin', name: 'Silver Satin',
    desc: 'silver-grey satin with a smooth pearly sheen' },
  { id: 'red-velvet', px: 6843283, cat: 'Silk & Satin', name: 'Red Velvet',
    desc: 'red velvet with a dense soft pile and a rich light-catching sheen' },
  { id: 'lavender-chiffon', px: 15384171, cat: 'Silk & Satin', name: 'Lavender Chiffon',
    desc: 'sheer, airy lavender chiffon with a soft floaty drape' },
  { id: 'white-tulle', px: 8935893, cat: 'Silk & Satin', name: 'White Tulle',
    desc: 'sheer white tulle net, light and translucent with soft volume' },

  // Wool & Knits
  { id: 'beige-cable-knit', px: 6757412, cat: 'Wool & Knits', name: 'Beige Cable Knit',
    desc: 'beige wool cable knit with raised twisted cables' },
  { id: 'grey-rib-knit', px: 5807038, cat: 'Wool & Knits', name: 'Grey Rib Knit',
    desc: 'grey wool rib knit with fine vertical ribs' },
  { id: 'brown-cable-knit', px: 6275947, cat: 'Wool & Knits', name: 'Brown Cable Knit',
    desc: 'chunky brown wool knit with a cable pattern' },
  { id: 'multicolour-boucle', px: 6045258, cat: 'Wool & Knits', name: 'Multicolour Bouclé',
    desc: 'multicoloured bouclé with looped, nubby yarns' },
  { id: 'brown-tweed', px: 6045252, cat: 'Wool & Knits', name: 'Brown Tweed Bouclé',
    desc: 'brown woven tweed bouclé with uneven textured yarns' },

  // Technical & Leather
  { id: 'black-leather', px: 16527895, cat: 'Technical & Leather', name: 'Black Leather',
    desc: 'smooth black leather with a soft sheen' },
  { id: 'brown-suede', px: 3721330, cat: 'Technical & Leather', name: 'Brown Suede',
    desc: 'brown suede with a soft matte brushed nap' },
  { id: 'gold-lame', px: 7232843, cat: 'Technical & Leather', name: 'Gold Lamé',
    desc: 'shimmering gold metallic lamé' },
  { id: 'silver-lame', px: 4854365, cat: 'Technical & Leather', name: 'Silver Lamé',
    desc: 'reflective silver metallic fabric with a liquid sheen' },
  { id: 'grey-mesh', px: 24506111, cat: 'Technical & Leather', name: 'Grey Technical Mesh',
    desc: 'grey technical knit mesh with open oval holes' },

  // Patterns & Prints
  { id: 'beige-lace', px: 6276032, cat: 'Patterns & Prints', name: 'Beige Lace',
    desc: 'delicate beige lace with an intricate open floral pattern', pattern: true },
  { id: 'gold-sequin', px: 6276054, cat: 'Patterns & Prints', name: 'Gold Sequin',
    desc: 'shimmering gold sequin fabric covered in small sequins', pattern: true },
  { id: 'houndstooth', px: 35152300, cat: 'Patterns & Prints', name: 'Black & White Houndstooth',
    desc: 'black and white houndstooth woven wool', pattern: true },
  { id: 'red-tartan', px: 5908367, cat: 'Patterns & Prints', name: 'Red Tartan',
    desc: 'red and black tartan plaid flannel', pattern: true },
  { id: 'blue-floral', px: 3769398, cat: 'Patterns & Prints', name: 'Blue Floral Print',
    desc: 'blue fabric printed with white and pink florals', pattern: true },
];

export const fabricById = (id) => FABRICS.find((f) => f.id === id) || null;

const SIZES = { ui: 400, ref: 1024 };
const FETCH_MS = 20000;

export const sourceUrl = (f, kind) => {
  const s = SIZES[kind] || SIZES.ui;
  return 'https://images.pexels.com/photos/' + f.px + '/pexels-photo-' + f.px +
    '.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=' + s + '&h=' + s;
};

async function fetchSource(f, kind) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const r = await fetch(sourceUrl(f, kind), { signal: ctrl.signal });
    if (!r.ok) {
      if (typeof console !== 'undefined') console.warn('[gh] fabric source', f.id, r.status);
      return null;
    }
    const ct = (r.headers.get('content-type') || '').split(';')[0];
    if (ct && !ct.startsWith('image/')) return null;
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
// null = المصدر ما رد — والقسم بيكمّل بالاسم والوصف.
export async function ensureSwatch(f, kind) {
  const k = SIZES[kind] ? kind : 'ui';
  const key = 'fabrics/px-' + f.px + '-' + k + '.jpg';
  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  if (hasBlob) {
    try {
      const h = await head(key);
      if (h && h.url) return { url: h.url };
    } catch (e) {
      // مو موجودة لسا — منكمّل ومنحفظها
    }
  }

  const bytes = await fetchSource(f, k);
  if (!bytes) return null;

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
