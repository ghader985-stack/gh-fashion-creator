// lib/site.js
// بيانات الموقع العامة وقائمة المنتجات. إضافة منتج جديد = إضافة عنصر واحد بآخر قائمة PRODUCTS.
// ملاحظة: checkoutUrl يبقى فاضياً لحد ما ينعمل المنتج بمنصة الدفع، وقتها يظهر زر الشراء تلقائياً.

export const SITE = {
  name: 'GH Couture AI',
  operator: 'Pretty Elegant Lady Marketing',
  location: { en: 'Dubai, United Arab Emirates', ar: 'دبي، الإمارات العربية المتحدة' },
  email: 'ghader985@gmail.com',
  domain: 'ghcouture.com',
  instagram: 'https://www.instagram.com/pretty_elegant_lady',
  instagramHandle: '@pretty_elegant_lady',
  updated: { en: '6 October 2026', ar: '6 أكتوبر 2026' },
};

// يعزل الأسماء اللاتينية داخل الجمل العربية كي ما ينقلب ترتيبها أو علامات الترقيم حولها.
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
      ar: ['ملف الفرش لبرنامج Procreate', 'دليل PDF'],
      en: ['The Procreate brush file', 'A PDF guide'],
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
        'تأتي مع ملف يشرح كيف تلوّن الستامبات بعدة ألوان.',
      ],
      en: [
        'A set of stamp brushes for Procreate with a back-to-school theme, 41 stamps in total.',
        'Includes a file that shows how to colour the stamps in multiple colours.',
      ],
    },
    includes: {
      ar: ['ملف الستامبات لبرنامج Procreate', 'ملف شرح التلوين بعدة ألوان'],
      en: ['The Procreate stamp file', 'A file on colouring the stamps in multiple colours'],
    },
    checkoutUrl: '',
  },
  {
    slug: 'garment-stamps',
    price: 10,
    name: { ar: 'ستامبات GH للبلوزات والتنانير والجاكيتات', en: 'GH Stamps: Blouses, Skirts & Jackets' },
    tagline: { ar: '45 ستامب للأزياء', en: '45 fashion stamp brushes' },
    about: {
      ar: ['مجموعة من 45 ستامب لبرنامج Procreate تغطي البلوزات والتنانير والجاكيتات.'],
      en: ['A set of 45 stamp brushes for Procreate covering blouses, skirts and jackets.'],
    },
    includes: {
      ar: ['ملف الستامبات لبرنامج Procreate'],
      en: ['The Procreate stamp file'],
    },
    checkoutUrl: '',
  },
];

export function getProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug) || null;
}
