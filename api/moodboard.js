export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
  maxDuration: 60,
};

// ===== إعدادات =====
const REPLICATE_MODEL = "black-forest-labs/flux-1.1-pro";
const REPLICATE_URL =
  "https://api.replicate.com/v1/models/" + REPLICATE_MODEL + "/predictions";
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";

// توجيه فني موحّد يُضاف لكل صورة حتى تبدو الصور الست من نفس العالم البصري الفخم
const STYLE_DIRECTION =
  "refined luxury fashion editorial aesthetic, soft diffused natural lighting, " +
  "elegant muted tones, cream and warm neutral atmosphere with subtle golden accents, " +
  "high-end magazine quality, delicate composition, fine detail, tasteful and uncluttered, " +
  "photorealistic where appropriate, 8k, sharp focus";

// عبارة نفي قوية لمنع الحروف والكلمات المشوّهة (مشكلة شائعة في FLUX)
const NO_TEXT = "no text, no letters, no words, no watermark, no logo, no typography";

// نسب أبعاد متنوّعة عشان الترتيب يتغيّر كل مرة (مش قالب ثابت)
const LAYOUT_VARIANTS = [
  { id: "editorial-left", heroAspect: "2:3", tileAspect: "1:1", heroSide: "left" },
  { id: "editorial-right", heroAspect: "2:3", tileAspect: "1:1", heroSide: "right" },
  { id: "collage-center", heroAspect: "3:4", tileAspect: "4:3", heroSide: "center" },
  { id: "poster-tall", heroAspect: "9:16", tileAspect: "1:1", heroSide: "left" },
];

// دمج البرومبت الأساسي مع التوجيه الفني الموحّد وعبارة النفي
function composePrompt(corePrompt) {
  const clean = (corePrompt || "").replace(/no text[^.]*\.?/gi, "").trim();
  return `${clean}. ${STYLE_DIRECTION}. ${NO_TEXT}.`;
}

// نداء كلود مباشرة (بدون مكتبة): يرجّع بيانات المود بورد كـ JSON
async function getConceptData(userDescription, claudeKey) {
  const systemPrompt = `أنتِ مديرة فنية لعلامة أزياء راقية، ذائقتكِ رفيعة ومرجعكِ مجلات الموضة العالمية الفاخرة.
مهمتكِ تحويل وصف المستخدم إلى بيانات مود بورد احترافية فخمة ومتناسقة.

أرجعي JSON فقط بدون أي نص قبله أو بعده، وبدون علامات markdown. البنية بالضبط:

{
  "title": "اسم الكولكشن بالإنجليزي، كلمة أو كلمتين أنيقتين تعبّران عن روح التصميم",
  "subtitle": "سطر شعري قصير بالإنجليزي يصف الروح والإحساس",
  "inspiration": "فقرة Inspiration احترافية بالإنجليزي (3-4 أسطر) تحكي قصة التصميم وإلهامه وإحساسه بلغة راقية معبّرة وفريدة، بأسلوب المديرين الفنيين في دور الأزياء الكبرى. ليست قالباً جامداً.",
  "palette": [
    {"hex": "#xxxxxx", "name": "اسم اللون بالإنجليزي"},
    {"hex": "#xxxxxx", "name": "..."},
    {"hex": "#xxxxxx", "name": "..."},
    {"hex": "#xxxxxx", "name": "..."},
    {"hex": "#xxxxxx", "name": "..."}
  ],
  "fabrics": ["خامة 1 بالإنجليزي", "خامة 2", "خامة 3"],
  "silhouette": "وصف السيلويت بالإنجليزي بجملة واحدة",
  "heroPrompt": "برومبت إنجليزي مفصّل جداً لرسمة أزياء رئيسية أنيقة: an elegant fashion illustration of a model wearing [التصميم بتفاصيله]، مع وصف القماش وحركته والقصّة والإحساس العام. أسلوب editorial fashion sketch راقٍ.",
  "moodPrompts": [
    "برومبت إنجليزي لصورة أجواء/بيئة مرتبطة بجوهر الكونسبت (منظر أو مكان يعبّر عن الروح).",
    "برومبت إنجليزي لصورة قماش/خامة قريبة جداً (luxurious fabric texture close-up) بلون وملمس مرتبطين بالكونسبت.",
    "برومبت إنجليزي لصورة تفصيل أنيق (تطريز راقٍ أو إكسسوار أو مجوهرات فاخرة) مرتبط بالكونسبت.",
    "برومبت إنجليزي لصورة إلهام مختلفة (ضوء أو لون أو عنصر طبيعي) تعزّز الحالة اللونية للوحة.",
    "برومبت إنجليزي لصورة تفصيل تصميم أو خلفية فخمة تكمّل تناسق اللوحة."
  ]
}

مهم جداً:
- الألوان الخمسة يجب أن تكون منسجمة ومتناغمة فعلياً مع بعضها ومستوحاة من الوصف (باليت متكاملة، ليست ألواناً متضاربة).
- كل البرومبتات يجب أن تنتمي لنفس العالم البصري والحالة اللونية حتى تبدو اللوحة موحّدة وفخمة.`;

  const res = await fetch(CLAUDE_URL, {
    method: "POST",
    headers: {
      "x-api-key": claudeKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: "user", content: `وصف المستخدم للكونسبت: ${userDescription}` },
      ],
    }),
  });

  const data = await res.json();

  if (data.error) {
    throw new Error("Claude: " + (data.error.message || JSON.stringify(data.error)));
  }

  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error("Claude لم يرجّع نصاً");
  }
  let raw = textBlock.text.trim();
  raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(raw);
}

// نداء Replicate: يولّد صورة وحدة ويرجّع رابطها (مع إعادة محاولة عند الازدحام)
async function generateImage(prompt, aspectRatio, token, attempt = 0) {
  const createRes = await fetch(REPLICATE_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        prompt: prompt,
        aspect_ratio: aspectRatio,
        output_format: "jpg",
        output_quality: 95,
        safety_tolerance: 2,
      },
    }),
  });

  const bodyText = await createRes.text();
  let prediction;
  try {
    prediction = JSON.parse(bodyText);
  } catch (e) {
    throw new Error("رد غير متوقع من Replicate: " + bodyText.slice(0, 200));
  }

  // إذا وصلنا حد الطلبات (429): ننتظر ونعيد المحاولة تلقائياً حتى 5 مرات
  if (createRes.status === 429 && attempt < 5) {
    await new Promise((r) => setTimeout(r, 12000));
    return generateImage(prompt, aspectRatio, token, attempt + 1);
  }

  if (!createRes.ok) {
    const msg = prediction.detail || prediction.error || bodyText.slice(0, 200);
    throw new Error("Replicate (" + createRes.status + "): " + msg);
  }

  if (prediction.error) {
    throw new Error("Replicate: " + prediction.error);
  }

  let result = prediction;
  let tries = 0;
  while (
    result.status !== "succeeded" &&
    result.status !== "failed" &&
    result.status !== "canceled" &&
    tries < 60
  ) {
    await new Promise((r) => setTimeout(r, 1500));
    const pollRes = await fetch(
      "https://api.replicate.com/v1/predictions/" + result.id,
      { headers: { Authorization: "Bearer " + token } }
    );
    result = await pollRes.json();
    tries++;
  }

  if (result.status !== "succeeded") {
    throw new Error("فشل توليد الصورة: " + (result.error || result.status));
  }

  const output = result.output;
  return Array.isArray(output) ? output[0] : output;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const claudeKey = process.env.ANTHROPIC_API_KEY;

  if (!replicateToken) {
    return res.status(500).json({ error: "مفتاح Replicate غير موجود في الإعدادات" });
  }
  if (!claudeKey) {
    return res.status(500).json({ error: "مفتاح Claude غير موجود في الإعدادات" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const description = body?.description || "";

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: "الوصف فارغ" });
    }

    // 1) بيانات الكونسبت من كلود
    const concept = await getConceptData(description, claudeKey);

    // 2) ترتيب عشوائي للتنوّع
    const layout =
      LAYOUT_VARIANTS[Math.floor(Math.random() * LAYOUT_VARIANTS.length)];

    // 3) توليد الصور: نبعت كل طلب بفاصل بسيط (عشان حد Replicate)
    //    مع دمج التوجيه الفني الموحّد في كل برومبت
    const allPrompts = [
      { prompt: composePrompt(concept.heroPrompt), aspect: layout.heroAspect },
      ...concept.moodPrompts.slice(0, 5).map((p) => ({
        prompt: composePrompt(p),
        aspect: layout.tileAspect,
      })),
    ];

    const imagePromises = allPrompts.map((item, i) =>
      new Promise((resolve) => setTimeout(resolve, i * 1200)).then(() =>
        generateImage(item.prompt, item.aspect, replicateToken)
      )
    );

    const allImages = await Promise.all(imagePromises);
    const heroImage = allImages[0];
    const moodImages = allImages.slice(1);

    // 4) نرجّع كل شي للواجهة
    res.status(200).json({
      title: concept.title,
      subtitle: concept.subtitle,
      inspiration: concept.inspiration,
      palette: concept.palette,
      fabrics: concept.fabrics,
      silhouette: concept.silhouette,
      heroImage: heroImage,
      moodImages: moodImages,
      layout: layout,
    });
  } catch (error) {
    console.error("Moodboard Error:", error);
    res.status(500).json({
      error: error.message || "حدث خطأ في توليد المود بورد",
    });
  }
}
