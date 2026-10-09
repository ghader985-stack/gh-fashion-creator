// lib/site.js
// بيانات الموقع العامة وقائمة المنتجات. إضافة منتج جديد = إضافة عنصر واحد بآخر قائمة PRODUCTS.
// ملاحظة: checkoutUrl يبقى فاضياً لحد ما ينعمل المنتج بمنصة الدفع؛ لحينها زر الشراء بيفتح رسالة بريد جاهزة لبريد الدعم.

export const SITE = {
  name: 'GH Couture AI',
  operator: 'Pretty Elegant Lady Marketing',
  location: { en: 'Dubai, United Arab Emirates', ar: 'دبي، الإمارات العربية المتحدة' },
  email: 'ghader985@gmail.com',
  domain: 'ghcouture.com',
  instagram: 'https://www.instagram.com/pretty_elegant_lady',
  instagramHandle: '@pretty_elegant_lady',
  // رقم الواتساب: أرقام فقط مع رمز الدولة وبدون + (مثال: 9715XXXXXXXX). لو تركتيه فاضي بيختفي زر الواتساب.
  whatsapp: '',
  whatsappDisplay: '', // الشكل الظاهر للزائر، مثال: +971 5X XXX XXXX
  updated: { en: '6 October 2026', ar: '6 أكتوبر 2026' },
};

// يعزل الأسماء اللاتينية داخل الجمل العربية كي ما ينقلب ترتيبها أو علامات الترقيم حولها.
export const waLink = (text) => (SITE.whatsapp ? 'https://wa.me/' + SITE.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '') : '');

export const ltr = (s) => '\u2066' + s + '\u2069';

export const TOOL_GROUPS = [
  {
    label: { ar: 'التصميم', en: 'Design' },
    items: [
      { num: '01', name: { ar: 'المود بورد', en: 'Mood Board' }, desc: { ar: 'لوحة الإلهام', en: 'An inspiration board' } },
      { num: '02', name: { ar: 'استوديو AI', en: 'AI Studio' }, desc: { ar: 'توليد صورة القطعة', en: 'Generate an image of the piece' } },
      { num: '03', name: { ar: 'تغيير الألوان', en: 'Colour Changer' }, desc: { ar: 'ألوان جديدة لأي منطقة', en: 'New colours for any area' } },
      { num: '08', name: { ar: 'تبديل القماش', en: 'Fabric Swap' }, desc: { ar: 'قماش جديد لأي منطقة', en: 'A new fabric for any area' } },
      { num: '09', name: { ar: 'تنويعات التصميم', en: 'Design Variations' }, desc: { ar: 'قصّات وأطوال جديدة لتصميمك', en: 'New cuts and lengths for your design' } },
    ],
  },
  {
    label: { ar: 'الإنتاج', en: 'Production' },
    items: [
      { num: '04', name: { ar: 'فلات سكتش', en: 'Flat Sketch' }, desc: { ar: 'رسمة تقنية بالأبيض والأسود', en: 'A black-and-white technical drawing' } },
      { num: '05', name: { ar: 'التيك باك', en: 'Tech Pack' }, desc: { ar: 'الحزمة التقنية', en: 'The technical specification package' } },
    ],
  },
  {
    label: { ar: 'التسويق', en: 'Marketing' },
    items: [
      { num: '06', name: { ar: 'المحتوى التسويقي', en: 'Marketing Content' }, desc: { ar: 'كابشنات وأفكار', en: 'Captions and ideas' } },
      { num: '07', name: { ar: 'الفيديو', en: 'Video' }, desc: { ar: 'برومبتات سينمائية', en: 'Cinematic prompts' } },
    ],
  },
];


// الخطط: لازم تطابق api/_guard.js (BASE و PLANS). الكميات = الكمية الأساسية × المضاعف. الفحص بالاختبارات بيقارنها.
export const PLAN_BASE = { moodboard: 6, studio: 10, color: 10, fabric: 10, variation: 10, flat: 5, techpack: 8, marketing: 50, video: 50 };

export const PLAN_TOOLS = [
  { key: 'moodboard', name: { ar: 'المود بورد', en: 'Mood Board' } },
  { key: 'studio', name: { ar: 'استوديو AI', en: 'AI Studio' } },
  { key: 'color', name: { ar: 'تغيير الألوان', en: 'Colour Changer' } },
  { key: 'fabric', name: { ar: 'تبديل القماش', en: 'Fabric Swap' } },
  { key: 'variation', name: { ar: 'تنويعات التصميم', en: 'Design Variations' } },
  { key: 'flat', name: { ar: 'فلات سكتش', en: 'Flat Sketch' } },
  { key: 'techpack', name: { ar: 'التيك باك', en: 'Tech Pack' } },
  { key: 'marketing', name: { ar: 'المحتوى التسويقي', en: 'Marketing Content' } },
  { key: 'video', name: { ar: 'الفيديو', en: 'Video' } },
];

// سعر الإطلاق: لأول 15 يوم. غيّري ends إلى آخر يوم للعرض بصيغة 'YYYY-MM-DD' عند الإطلاق (بيختفي العرض تلقائياً بعده).
// لو تركتيه فاضي بيظهر "لأول 15 يوماً من الإطلاق" بدون تاريخ.
export const LAUNCH = { days: 15, ends: '' };

// price = الشهري العادي (لازم يطابق api/_guard.js)، launch = شهري الإطلاق (للدفعة الأولى)،
// yearly = سنوي عادي (دفع 10 أشهر مقابل 12)، yearlyLaunch = سنوي الإطلاق (10 × سعر الإطلاق الشهري).
// checkout.monthly / checkout.yearly = رابط الدفع من المنصة؛ لو فاضي الزر بيفتح رسالة بريد جاهزة.
export const PLANS = [
  { id: 'p1', price: 35, launch: 30, yearly: 350, yearlyLaunch: 300, mult: 1, name: { ar: 'الخطة 1', en: 'Plan 1' }, checkout: { monthly: '', yearly: '' } },
  { id: 'p2', price: 60, launch: 55, yearly: 600, yearlyLaunch: 550, mult: 2, name: { ar: 'الخطة 2', en: 'Plan 2' }, checkout: { monthly: '', yearly: '' } },
  { id: 'p3', price: 110, launch: 100, yearly: 1100, yearlyLaunch: 1000, mult: 4, name: { ar: 'الخطة 3', en: 'Plan 3' }, checkout: { monthly: '', yearly: '' } },
];

// رابط زر الشراء: رابط المنصة لو موجود، وإلا رسالة بريد جاهزة لبريد الدعم.
export function orderHref(subject, url) {
  return url || 'mailto:' + SITE.email + '?subject=' + encodeURIComponent(subject);
}

export function planUses(plan, key) {
  return PLAN_BASE[key] * plan.mult;
}

export const PRODUCTS = [
  {
    slug: 'ai-fashion-guide',
    price: 20,
    name: { ar: 'دليل أدوات الذكاء الاصطناعي لتصميم الأزياء', en: 'AI Tools Guide for Fashion Design' },
    tagline: { ar: 'من الفكرة إلى العرض، خطوة بخطوة', en: 'From idea to presentation, step by step' },
    about: {
      ar: [
        'دليل عملي لمصممي الأزياء يشرح كيف يتحوّل التصميم من فكرة إلى عرض جاهز باستخدام أدوات الذكاء الاصطناعي.',
        'لا يحتاج إلى خلفية تقنية. يكفي اتباع الخطوات كما هي.',
      ],
      en: [
        'A practical guide for fashion designers on taking a design from an idea to a finished presentation with AI tools.',
        'No technical background needed. Just follow the steps.',
      ],
    },
    includes: {
      ar: ['ملف PDF من 32 صفحة'],
      en: ['A 32-page PDF file'],
    },
    checkoutUrl: '',
  },
  {
    slug: 'reveal-video-guide',
    price: 5,
    name: { ar: 'دليل فيديو الريفيل', en: 'Reveal Video Guide' },
    tagline: { ar: 'الطريقة والبرومبتات لصنع فيديو الريفيل', en: 'The method and prompts for making reveal videos' },
    about: {
      ar: ['دليل يشرح طريقة صنع فيديو الريفيل لتصاميم الأزياء، مع البرومبتات المستخدمة في كل خطوة.'],
      en: ['A guide to making reveal videos of fashion designs, with the prompts used at every step.'],
    },
    includes: {
      ar: ['ملف PDF يحتوي الطريقة والبرومبتات'],
      en: ['A PDF with the method and the prompts'],
    },
    checkoutUrl: '',
  },
  {
    slug: 'lace-brushes',
    price: 10,
    name: { ar: 'فرش الدانتيل لبرنامج Procreate', en: 'Lace Brushes for Procreate' },
    tagline: { ar: '103 فرش من صور قماش حقيقي', en: '103 brushes made from real fabric photos' },
    about: {
      ar: [
        '103 فرشاة لبرنامج Procreate في مجموعتين: فرش دانتيل وفرش تول مطرّز.',
        'صُنعت من صور قماش حقيقي. جميعها بنفس الإعدادات وتعمل دون أي ضبط خاص.',
      ],
      en: [
        '103 brushes for Procreate in two groups: lace brushes and embroidered tulle brushes.',
        'Made from photos of real fabric. All share the same settings and work with no special setup.',
      ],
    },
    includes: {
      ar: ['ملف الفرش لبرنامج Procreate', 'ملف شرح طريقة التنزيل (PDF)'],
      en: ['The Procreate brush file', 'A PDF file explaining how to download'],
    },
    checkoutUrl: '',
  },
  {
    slug: 'school-stamps',
    price: 8,
    name: { ar: 'ستامبات المدارس GH school', en: 'GH School Stamps' },
    tagline: { ar: '41 ستامب بموضوع العودة إلى المدارس', en: '41 back-to-school stamp brushes' },
    about: {
      ar: [
        'مجموعة ستامبات لبرنامج Procreate بموضوع العودة إلى المدارس، فيها 41 ستامب.',
        'تأتي مع ملفين: ملف يشرح كيف تلوّن الستامبات بعدة ألوان، وملف يشرح طريقة التنزيل.',
      ],
      en: [
        'A set of stamp brushes for Procreate with a back-to-school theme, 41 stamps in total.',
        'Comes with two files: one showing how to colour the stamps in multiple colours, and one explaining how to download.',
      ],
    },
    includes: {
      ar: ['ملف الستامبات لبرنامج Procreate', 'ملف شرح التلوين بعدة ألوان', 'ملف شرح طريقة التنزيل'],
      en: ['The Procreate stamp file', 'A file on colouring the stamps in multiple colours', 'A file explaining how to download'],
    },
    checkoutUrl: '',
  },
  {
    slug: 'garment-stamps',
    price: 10,
    name: { ar: 'ستامبات GH للبلوزات والتنانير والجاكيتات', en: 'GH Stamps: Blouses, Skirts & Jackets' },
    tagline: { ar: '45 ستامب للأزياء', en: '45 fashion stamp brushes' },
    about: {
      ar: [
        'مجموعة من 45 ستامب لبرنامج Procreate تغطي البلوزات والتنانير والجاكيتات.',
        'تأتي مع ملف يشرح طريقة التنزيل.',
      ],
      en: [
        'A set of 45 stamp brushes for Procreate covering blouses, skirts and jackets.',
        'Comes with a file explaining how to download.',
      ],
    },
    includes: {
      ar: ['ملف الستامبات لبرنامج Procreate', 'ملف شرح طريقة التنزيل'],
      en: ['The Procreate stamp file', 'A file explaining how to download'],
    },
    checkoutUrl: '',
  },
  {
    slug: 'bow-stamps',
    price: 10,
    name: { ar: 'ستامبات الفيونكات GH bows', en: 'GH Bow Stamps' },
    tagline: { ar: '65 ستامب فيونكات', en: '65 bow stamp brushes' },
    about: {
      ar: [
        'مجموعة من 65 ستامب فيونكات لبرنامج Procreate، بأشكال وزخارف متنوعة، منها المنقّط ومنها المرسوم بخطوط خارجية.',
        'ضع الفيونكة بلمسة واحدة على الأكتاف أو الخصر أو أي مكان في تصميمك.',
        'تأتي مع ملف يشرح طريقة التنزيل.',
      ],
      en: [
        'A set of 65 bow stamp brushes for Procreate in a variety of shapes and patterns, from polka-dotted to simple outlines.',
        'Place a bow with a single tap on the shoulders, the waist or anywhere in your design.',
        'Comes with a file explaining how to download.',
      ],
    },
    includes: {
      ar: ['ملف الستامبات لبرنامج Procreate', 'ملف شرح طريقة التنزيل'],
      en: ['The Procreate stamp file', 'A file explaining how to download'],
    },
    checkoutUrl: '',
  },
  {
    slug: 'chest-embroidery-stamps',
    price: 12,
    name: { ar: 'ستامبات تطريز الصدر GH embroidery chest', en: 'GH Chest Embroidery Stamps' },
    tagline: { ar: '63 ستامب تطريز', en: '63 embroidery stamp brushes' },
    about: {
      ar: [
        'مجموعة من 63 ستامب تطريز لبرنامج Procreate، تناسب التطريز على الصدر، وبعضها للأكمام، وبعضها لأي مكان في التصميم.',
        'تأتي مع ملف يشرح طريقة التنزيل.',
      ],
      en: [
        'A set of 63 embroidery stamp brushes for Procreate, made for chest embroidery, with some for sleeves and some that work anywhere on a design.',
        'Comes with a file explaining how to download.',
      ],
    },
    includes: {
      ar: ['ملف الستامبات لبرنامج Procreate', 'ملف شرح طريقة التنزيل'],
      en: ['The Procreate stamp file', 'A file explaining how to download'],
    },
    checkoutUrl: '',
  },
];

export function getProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug) || null;
}
