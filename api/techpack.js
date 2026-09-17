// pages/api/techpack.js
// تحليل التيك باك — استدعاء واحد لـ Claude يُرجع كل بيانات ورقة RK.
//
// المدخلات (multipart):
//   design      صورة التصميم الملوّنة بمسطرة إحداثيات
//   colorFront  الرسمة الملوّنة الأمامية بمسطرة إحداثيات
//   lineFront   الرسمة التقنية الأمامية بمسطرة إحداثيات
//   lineBack   الرسمة التقنية الخلفية بمسطرة إحداثيات
//   garmentName · fabricInfo · season · notes
//
// لا توليد صور هنا ولا في أي مكان من الورقة: كل الصور تُقصّ في المتصفح من
// الصور المرفوعة، بالإحداثيات التي يحددها هذا التحليل.
//
// المخرجات مضبوطة بمخطط JSON (structured outputs): الناتج صالح دائماً،
// بلا إصلاح نصوص وبلا إعادة محاولة.

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 12000;
const CALL_TIMEOUT_MS = 240000;

const CARE_ENUM = ['dryclean', 'handwash', 'wash30', 'nowash', 'nobleach', 'steamlow', 'ironlow',
  'noiron', 'notumble', 'dryflat', 'hangbag', 'storefolded'];
const SOURCE_ENUM = ['design', 'colorFront'];
const TRIM_ENUM = ['zipper', 'button', 'hook', 'snap', 'thread', 'label', 'elastic', 'boning',
  'bead', 'crystal', 'sequin', 'pearl', 'piping', 'lace', 'ribbon', 'embroidery', 'other'];

// ---------------------------------------------------------------------------
function detectImageType(buffer) {
  if (!buffer || buffer.length < 4) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer.length > 12 && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return 'image/jpeg';
}

const getField = (f) => String((Array.isArray(f) ? f[0] : f) || '').trim();
const pickFile = (f) => (Array.isArray(f) ? f[0] : f) || null;

function imageBlock(file) {
  const buf = fs.readFileSync(file.filepath);
  return {
    type: 'image',
    source: { type: 'base64', media_type: detectImageType(buf), data: buf.toString('base64') },
  };
}

// ---------------------------------------------------------------------------
// مخطط الناتج. كل الحقول مطلوبة وبلا اتحادات أنواع — شرط المخطط المضبوط.
const NUM = { type: 'number' };
const STR = { type: 'string' };
const BOX = {
  type: 'object',
  properties: { x1: NUM, y1: NUM, x2: NUM, y2: NUM },
  required: ['x1', 'y1', 'x2', 'y2'],
  additionalProperties: false,
};
const obj = (props) => ({
  type: 'object',
  properties: props,
  required: Object.keys(props),
  additionalProperties: false,
});
const arr = (items) => ({ type: 'array', items });
const SRC = { type: 'string', enum: SOURCE_ENUM };

const SCHEMA = obj({
  styleName: STR,
  season: STR,
  category: STR,
  collectionLine: STR,
  garmentType: STR,
  designDetails: arr(STR),
  garmentColors: arr(obj({ name: STR, source: SRC, box: BOX })),
  fabrics: arr(obj({
    role: STR, name: STR, composition: STR, weight: STR, colorName: STR, hex: STR,
    visible: { type: 'boolean' }, source: SRC, box: BOX,
  })),
  trims: arr(obj({
    kind: { type: 'string', enum: TRIM_ENUM },
    name: STR, description: STR, colorName: STR, hex: STR,
    visible: { type: 'boolean' }, source: SRC, box: BOX,
  })),
  details: arr(obj({ caption: STR, source: SRC, box: BOX })),
  specs: arr(obj({ component: STR, specification: STR })),
  constructionFront: arr(obj({ label: STR, x: NUM, y: NUM })),
  constructionBack: arr(obj({ label: STR, x: NUM, y: NUM })),
  care: arr({ type: 'string', enum: CARE_ENUM }),
  sizeRows: arr(obj({ label: STR, values: arr(obj({ min: NUM, max: NUM })) })),
});

// ---------------------------------------------------------------------------
function buildPrompt(meta) {
  return `You are a senior technical designer preparing a ONE-PAGE factory tech pack sheet.

You receive four images. Each image has a blue coordinate ruler printed in its white margin:
0 is the top-left corner of the picture area, 100 is the right edge (x) and 100 is the bottom edge (y).
Faint blue grid lines inside the picture mark every 5 units (stronger every 10).
Every coordinate you return is in these units, measured on the picture area only — never on the margin.

IMAGE 1 — the finished colour design (the look). source = "design".
IMAGE 2 — the colour flat, FRONT view (the same garment drawn flat, in colour). source = "colorFront".
IMAGE 3 — the technical flat, FRONT view (line art).
IMAGE 4 — the technical flat, BACK view (line art).

SOURCE RULE — every item with a box (garmentColors, fabrics, trims, details) also has "source":
look at BOTH IMAGE 1 and IMAGE 2, choose the one where that element is clearest, largest and most
accurate, set source to "design" (IMAGE 1) or "colorFront" (IMAGE 2), and measure the box on THAT image.
Most front details are usually clearest on IMAGE 2 (no skin, no pose, no shadow); use IMAGE 1 when the
texture, embellishment or colour is clearly better there. A box is always measured on its own source image.

Designer input (may be written in Arabic — always answer in English):
- Style name: ${meta.garmentName || '(not given)'}
- Fabric specification: ${meta.fabricInfo || '(not given)'}
- Season: ${meta.season || '(not given)'}
- Notes: ${meta.notes || '(none)'}

The garment can be any type: gown, dress, abaya, kaftan, skirt, trousers, blouse, jacket, suit, jumpsuit.
Describe only what is really in the design. Never invent an element that is not there
(no belt, pockets, buttons, slit, pleats, straps or closures that are not visible or not required to make the garment).

HEADER
- styleName: max 4 words. If the designer gave a name, render it faithfully in English (translate or transliterate). Otherwise a concise descriptive name such as "Crystalline Ruffle Gown".
- season: the designer's season in English, formatted like "FALL / WINTER 2026" or "SPRING / SUMMER 2027". Empty string if the designer gave none. Never invent a season.
- category: like "EVENING / COUTURE", "BRIDAL / COUTURE", "MODEST WEAR / ABAYA", "READY-TO-WEAR / DAYWEAR".
- collectionLine: the collection or line name only if the notes state one; otherwise empty string.
- garmentType: one or two words.

DESIGN DETAILS (designDetails): 6 to 8 lines, each at most 8 words, covering silhouette, neckline, sleeves, closure, lining, length and the signature details. Factory wording, no marketing words.

GARMENT COLOURS (garmentColors): EVERY distinct colour of the GARMENT itself (1 to 8), largest area first — including every shade of tulle, overlay, embroidery and trim that reads as its own colour. Do not stop at three, and do not merge two shades that a factory would dye separately. Ignore skin, hair, shoes, jewellery, background and shadows. For each colour give a plain English name, a source, and a SMALL box (3 to 8 units each side) on that source image that lies completely inside a flat, evenly lit area of that colour — no seam, no embellishment, no shadow, no highlight.

FABRICS (fabrics): every textile of the garment, max 4, in this order: main fabric, contrast fabric, overlay / lace / tulle / illusion, lining.
- role: "MAIN FABRIC", "CONTRAST FABRIC", "OVERLAY", "ILLUSION", "LACE" or "LINING".
- name: the fabric the designer named, in English (تول = Tulle, كريب = Crepe, ساتان = Satin, شيفون = Chiffon, أورجانزا = Organza, دانتيل = Lace, مخمل = Velvet, تفتا = Taffeta, جورجيت = Georgette, كريب دي شين = Crepe de Chine), with a short qualifier only when the design shows one ("Beaded Crepe", "Pleated Satin"). Never rename her fabric into another textile.
- composition: fibre content with percentages.
  · If the designer gave the fibre content, copy it exactly.
  · If she named the fabric but not the fibre, use the fibre a real atelier would cut that fabric in for THIS garment class, and say so at that quality level: for evening, couture, bridal and occasion wear that means natural fibres — 100% Silk, 100% Silk (Silk Tulle / Silk Organza / Silk Georgette), 92% Silk 8% Elastane for stretch satin or crepe, 100% Viscose or a viscose blend for a heavier drape, cotton or silk-blend base for embroidered net.
  · Use polyester, nylon or any synthetic ONLY when the designer named it, or when the piece is clearly everyday ready-to-wear, sportswear or uniform, or for parts that are synthetic by nature (invisible zipper coil, elastic, boning, tulle netting the designer asked for in synthetic).
  Never default the whole garment to polyester.
- weight: typical weight, e.g. "220 GSM".
- colorName: plain colour name as seen, e.g. "Burgundy", "Nude".
- hex: #RRGGBB of that fabric as seen. For a hidden lining use the colour it should be (normally the main fabric colour unless the designer said otherwise).
- visible: true if this fabric can be seen on IMAGE 1 or IMAGE 2.
- source and box: if visible, a box on the chosen source image framing a clean representative area of ONLY this fabric (texture clearly readable, no skin, no background, no other fabric, no face), at least 8 units on each side. If not visible return source "design" and x1=y1=x2=y2=0.
If the designer specified the fabrics, use exactly those fabrics, with her names and her fibres, and do not add other textiles or swap one textile for another.

TRIMS (trims): the key trims and closures, max 4, the most characteristic first (embellishment before closures).
- kind: the closest value of the enum.
- name: e.g. "Crystals", "Piping", "Invisible Zipper".
- description: 2 to 4 words, e.g. "Hand Applied", "Crystal Piping Along Ruffle Edge", "Invisible Zipper".
- colorName, hex, visible, source, box: same rules as fabrics. A box for a trim frames that trim closely (at least 5 units each side). Concealed zippers, hooks, thread and labels are NOT visible.
Never list hangers, garment bags, tissue paper or hang tags.

DETAILS (details): exactly 4 close-up crops of the most distinctive VISIBLE front details, each taken from its clearest source image (embellishment, lace, neckline, ruffle or edge finish, slit finish, fabric surface, cuff, closure if visible).
- box: frames the detail tightly with a little context, roughly square, 10 to 30 units wide, lying on the garment, never including a face. The 4 boxes must show different areas and not overlap by more than a third.
- caption: 3 to 7 words in factory style, e.g. "HAND APPLIED CRYSTAL DETAIL ON ILLUSION TULLE", "HIGH SLIT WITH CLEAN FINISH".

MATERIAL SPECIFICATIONS (specs): one row per material component, 6 to 10 rows, in this order: shell, overlay / lace / illusion, lining, embellishments, piping and other trims, closures, thread, label.
- component: short name, e.g. "SHELL", "ILLUSION", "LINING", "CRYSTALS", "PIPING", "ZIPPER", "THREAD", "LABEL".
- specification: two short lines separated by a newline character: first the material name, then composition and weight or finish, e.g. "Premium Satin" + newline + "96% Polyester, 4% Spandex – 220 GSM".
Always include THREAD and LABEL. The thread fibre follows the shell: silk thread with silk shells and couture pieces, polyester thread with synthetic or everyday pieces; second line "Color Matched". LABEL: "Woven Label" and the brand name from the notes, or "Brand Name" if none.
Every specification line in this table must repeat exactly the fabric name and composition given in FABRICS above — no different fibre, no different fabric name.

CONSTRUCTION DETAILS
- constructionFront: 4 to 6 callouts for IMAGE 3. constructionBack: 3 to 5 callouts for IMAGE 4.
- label: a standard factory term, max 6 words, e.g. "CONCEALED ZIPPER AT CENTER BACK", "BUILT-IN BODICE SUPPORT", "SCULPTURAL RUFFLE WITH CRYSTAL PIPING", "FLOOR LENGTH WITH SWEEP TRAIN".
- x, y: the exact point ON the drawn line or inside the drawn area of that feature in that image — always on the garment, never on the white background. Spread the callouts over the garment from top to bottom. Internal features (bodice support, lining) point to the area where they sit.

CARE (care): exactly 5 values — 4 care symbols chosen for the real materials, then 1 storage symbol.
Embellished or delicate garments: dryclean, nowash, nobleach, and steamlow (or noiron when beading covers the garment).
Storage: hangbag for evening, structured or long garments; storefolded for knits and casual pieces.

SIZE CHART (sizeRows): exactly 5 rows of finished garment measurements in CENTIMETRES, for the sizes in this order: XS (US 0-2), S (4-6), M (8-10), L (12-14), XL (16-18), XXL (20-22). Sample size is S. Each row has exactly 6 values.
Choose the rows for the garment type:
- gowns, dresses, abayas, kaftans, jumpsuits: BUST, WAIST, HIP, FRONT LENGTH (SHOULDER TO HEM), BACK LENGTH (SHOULDER TO HEM)
- tops, blouses, jackets: BUST, WAIST, SHOULDER WIDTH, SLEEVE LENGTH, BODY LENGTH (HPS TO HEM)
- skirts: WAIST, HIP, HEM SWEEP, FRONT LENGTH (WAIST TO HEM), BACK LENGTH (WAIST TO HEM)
- trousers: WAIST, HIP, FRONT RISE, INSEAM, LEG OPENING
Circumference rows (bust, waist, hip, sweep, opening) are ranges: max is 2 to 3 cm above min.
Length and width rows are single values: min equals max.
Values increase from XS to XXL with realistic grading (circumferences about +5 cm per size, lengths about +1 cm per size) and match the real garment length seen in the design.`;
}

// ---------------------------------------------------------------------------
// تطبيع حتمي: حدود الإحداثيات، الأعداد، وتنسيق قيم المقاسات
const clamp = (v) => Math.max(0, Math.min(100, Number.isFinite(+v) ? +v : 0));
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const hex = (v) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(str(v));
  return m ? '#' + m[1].toUpperCase() : '';
};
const lower = (v) => str(v).toLowerCase();
const src = (v) => (lower(v) === 'colorfront' ? 'colorFront' : 'design');
const box = (b) => {
  const o = b || {};
  const x1 = clamp(o.x1), x2 = clamp(o.x2), y1 = clamp(o.y1), y2 = clamp(o.y2);
  return { x1: Math.min(x1, x2), y1: Math.min(y1, y2), x2: Math.max(x1, x2), y2: Math.max(y1, y2) };
};
const r5 = (n) => Math.round(n * 2) / 2;
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function sizeCell(v) {
  let a = Number(v && v.min);
  let b = Number(v && v.max);
  if (!Number.isFinite(a) && !Number.isFinite(b)) return '—';
  if (!Number.isFinite(a)) a = b;
  if (!Number.isFinite(b)) b = a;
  if (a > b) [a, b] = [b, a];
  a = r5(a); b = r5(b);
  return Math.abs(b - a) < 0.25 ? fmt(a) : fmt(a) + '-' + fmt(b);
}

// في وضع التعليمات بدون مخطط: يُستخرج كائن JSON من النص حتى لو أُحيط بأسوار markdown
function extractJson(text) {
  const t = String(text || '').replace(/```(?:json)?/gi, '').trim();
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('no json');
  return t.slice(a, b + 1);
}

function normalize(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const list = (v) => (Array.isArray(v) ? v : []);
  return {
    styleName: str(o.styleName),
    season: str(o.season),
    category: str(o.category),
    collectionLine: str(o.collectionLine),
    garmentType: str(o.garmentType),
    designDetails: list(o.designDetails).map(str).filter(Boolean).slice(0, 8),
    garmentColors: list(o.garmentColors).map((c) => ({ name: str(c && c.name), source: src(c && c.source), box: box(c && c.box) }))
      .filter((c) => c.box.x2 > c.box.x1 && c.box.y2 > c.box.y1).slice(0, 10),
    fabrics: list(o.fabrics).map((f) => ({
      role: str(f && f.role), name: str(f && f.name), composition: str(f && f.composition),
      weight: str(f && f.weight), colorName: str(f && f.colorName), hex: hex(f && f.hex),
      visible: Boolean(f && f.visible), source: src(f && f.source), box: box(f && f.box),
    })).filter((f) => f.name).slice(0, 4),
    trims: list(o.trims).map((t) => ({
      kind: TRIM_ENUM.includes(lower(t && t.kind)) ? lower(t.kind) : 'other',
      name: str(t && t.name), description: str(t && t.description),
      colorName: str(t && t.colorName), hex: hex(t && t.hex),
      visible: Boolean(t && t.visible), source: src(t && t.source), box: box(t && t.box),
    })).filter((t) => t.name).slice(0, 4),
    details: list(o.details).map((d) => ({ caption: str(d && d.caption), source: src(d && d.source), box: box(d && d.box) }))
      .filter((d) => d.box.x2 > d.box.x1 && d.box.y2 > d.box.y1).slice(0, 4),
    specs: list(o.specs).map((s) => ({ component: str(s && s.component), specification: str(s && s.specification) }))
      .filter((s) => s.component || s.specification).slice(0, 12),
    constructionFront: list(o.constructionFront).map((c) => ({ label: str(c && c.label), x: clamp(c && c.x), y: clamp(c && c.y) }))
      .filter((c) => c.label).slice(0, 7),
    constructionBack: list(o.constructionBack).map((c) => ({ label: str(c && c.label), x: clamp(c && c.x), y: clamp(c && c.y) }))
      .filter((c) => c.label).slice(0, 7),
    care: list(o.care).map(lower).filter((k) => CARE_ENUM.includes(k)),
    sizeRows: list(o.sizeRows).map((r) => {
      const vals = list(r && r.values).slice(0, 6).map(sizeCell);
      while (vals.length < 6) vals.push('—');
      return { label: str(r && r.label), values: vals };
    }).filter((r) => r.label).slice(0, 5),
  };
}

// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'مفتاح Claude غير مضبوط على الخادم' });
  }

  let files;
  let fields;
  try {
    const form = formidable({ maxFileSize: 8 * 1024 * 1024, maxTotalFileSize: 16 * 1024 * 1024 });
    [fields, files] = await form.parse(req);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] techpack form', e && e.message);
    return res.status(400).json({ error: 'تعذّر استلام الصور — حجمها كبير أو الاتصال انقطع' });
  }

  const design = pickFile(files.design);
  const colorFront = pickFile(files.colorFront);
  const lineFront = pickFile(files.lineFront);
  const lineBack = pickFile(files.lineBack);
  if (!design || !colorFront || !lineFront || !lineBack) {
    return res.status(400).json({ error: 'صورة التصميم والرسمات الأمامية والخلفية مطلوبة' });
  }

  const meta = {
    garmentName: getField(fields.garmentName),
    fabricInfo: getField(fields.fabricInfo),
    season: getField(fields.season),
    notes: getField(fields.notes),
  };

  const content = [
    { type: 'text', text: 'IMAGE 1 — colour design:' },
    imageBlock(design),
    { type: 'text', text: 'IMAGE 2 — colour flat, FRONT:' },
    imageBlock(colorFront),
    { type: 'text', text: 'IMAGE 3 — technical flat, FRONT:' },
    imageBlock(lineFront),
    { type: 'text', text: 'IMAGE 4 — technical flat, BACK:' },
    imageBlock(lineBack),
    { type: 'text', text: buildPrompt(meta) },
  ];

  // الطلب الأساسي: مخرجات مضبوطة بالمخطط + تفكير مطفأ.
  // أي رفض 400 يحدث عند فحص الطلب قبل تشغيل النموذج (لا يُحتسب من الرصيد)،
  // فيُعاد الطلب فوراً بصيغة مقبولة بدل أن يفشل التحليل:
  //   1) رفض بسبب thinking      → نفس الطلب بدون thinking
  //   2) رفض بسبب المخطط        → نفس المحتوى، والمخطط مكتوب داخل التعليمات
  let useThinking = true;
  let useSchema = true;
  const buildBody = (mode) => {
    const body = { model: MODEL, max_tokens: MAX_TOKENS };
    if (mode.thinking) body.thinking = { type: 'disabled' };
    if (mode.schema) {
      body.output_config = { format: { type: 'json_schema', schema: SCHEMA } };
      body.messages = [{ role: 'user', content }];
    } else {
      body.messages = [{
        role: 'user',
        content: content.concat([{
          type: 'text',
          text: 'Return ONLY one JSON object (no markdown, no code fences, no text before or after it) '
            + 'that matches this JSON Schema exactly, with every property present:\n' + JSON.stringify(SCHEMA),
        }]),
      }];
    }
    return body;
  };

  const deadline = Date.now() + CALL_TIMEOUT_MS;
  let data = null;
  let usedSchema = true;
  for (let attempt = 0; attempt < 3 && !data; attempt++) {
    const mode = { thinking: useThinking, schema: useSchema };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), Math.max(5000, deadline - Date.now()));
    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: ctrl.signal,
        body: JSON.stringify(buildBody(mode)),
      });
    } catch (e) {
      clearTimeout(timer);
      const aborted = e && e.name === 'AbortError';
      if (typeof console !== 'undefined') console.warn('[gh] techpack call', e && e.message);
      return res.status(504).json({ error: aborted ? 'انتهت مهلة التحليل — حاولي مرة ثانية' : 'تعذّر الاتصال بخدمة التحليل' });
    }
    clearTimeout(timer);

    if (response.status === 400) {
      let detail = '';
      try { detail = (await response.text()).slice(0, 500); } catch (e) { detail = ''; }
      if (typeof console !== 'undefined') console.warn('[gh] techpack 400', 'attempt', attempt, detail);
      if (useThinking && /thinking/i.test(detail)) { useThinking = false; continue; }
      if (useSchema) { useSchema = false; continue; }
      return res.status(502).json({ error: 'فشل التحليل (400)' });
    }

    if (!response.ok) {
      let detail = '';
      try { detail = (await response.text()).slice(0, 300); } catch (e) { detail = ''; }
      if (typeof console !== 'undefined') console.warn('[gh] techpack status', response.status, detail);
      const busy = response.status === 429 || response.status === 529 || response.status === 503;
      return res.status(502).json({
        error: busy ? 'خدمة التحليل مشغولة الآن — انتظري دقيقة وحاولي مرة ثانية' : 'فشل التحليل (' + response.status + ')',
      });
    }

    try {
      data = await response.json();
    } catch (e) {
      return res.status(502).json({ error: 'استجابة غير صالحة من خدمة التحليل' });
    }
    usedSchema = mode.schema;
  }
  if (!data) {
    return res.status(502).json({ error: 'فشل التحليل — حاولي مرة ثانية' });
  }

  if (data.stop_reason === 'refusal') {
    return res.status(422).json({ error: 'تعذّر تحليل هذه الصورة — جرّبي صورة أوضح للتصميم' });
  }
  if (data.stop_reason === 'max_tokens') {
    return res.status(502).json({ error: 'التحليل لم يكتمل — حاولي مرة ثانية' });
  }

  const text = (data.content || []).filter((b) => b && b.type === 'text').map((b) => b.text).join('');
  let parsed;
  try {
    parsed = JSON.parse(usedSchema ? text : extractJson(text));
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] techpack parse', e && e.message);
    return res.status(502).json({ error: 'تعذّر قراءة ناتج التحليل — حاولي مرة ثانية' });
  }

  const out = normalize(parsed);
  if (!out.sizeRows.length || !out.specs.length || !out.details.length) {
    return res.status(502).json({ error: 'التحليل ناقص — حاولي مرة ثانية' });
  }

  return res.status(200).json(out);
}
