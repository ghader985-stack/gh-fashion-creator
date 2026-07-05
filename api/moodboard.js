export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

// ===== إعدادات =====
const REPLICATE_MODEL = "black-forest-labs/flux-1.1-pro";
const REPLICATE_URL =
  "https://api.replicate.com/v1/models/" + REPLICATE_MODEL + "/predictions";
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";

// نسب أبعاد متنوّعة عشان الترتيب يتغيّر كل مرة (مش قالب ثابت)
const LAYOUT_VARIANTS = [
  { id: "editorial-left", heroAspect: "2:3", tileAspect: "1:1", heroSide: "left" },
  { id: "editorial-right", heroAspect: "2:3", tileAspect: "1:1", heroSide: "right" },
  { id: "collage-center", heroAspect: "3:4", tileAspect: "4:3", heroSide: "center" },
  { id: "poster-tall", heroAspect: "9:16", tileAspect: "1:1", heroSide: "left" },
];

// نداء كلود مباشرة (بدون مكتبة): يرجّع بيانات المود بورد كـ JSON
async function getConceptData(userDescription, claudeKey) {
  const systemPrompt = `أنتِ مديرة فنية لعلامة أزياء راقية. مهمتك تحويل وصف المستخدم إلى بيانات مود بورد احترافية.

أرجعي JSON فقط بدون أي نص قبله أو بعده، وبدون علامات markdown. البنية بالضبط:

{
  "title": "اسم الكولكشن بالإنجليزي، كلمة أو كلمتين أنيقتين",
  "subtitle": "سطر شعري قصير بالإنجليزي يوصف الروح",
  "inspiration": "فقرة Inspiration احترافية بالإنجليزي (3-4 أسطر) تحكي قصة التصميم وإلهامه وإحساسه. يجب أن تكون فريدة ومعبّرة، ليست قالباً جامداً.",
  "palette": [
    {"hex": "#xxxxxx", "name": "اسم اللون بالإنجليزي"},
    {"hex": "#xxxxxx", "name": "..."},
    {"hex": "#xxxxxx", "name": "..."},
    {"hex": "#xxxxxx", "name": "..."},
    {"hex": "#xxxxxx", "name": "..."}
  ],
  "fabrics": ["خامة 1 بالإنجليزي", "خامة 2", "خامة 3"],
  "silhouette": "وصف السيلويت بالإنجليزي بجملة واحدة",
  "heroPrompt": "برومبت إنجليزي مفصّل جداً لتوليد رسمة أزياء رئيسية: fashion illustration of a model wearing [التصميم]، مع تفاصيل الإضاءة والخلفية والأسلوب. أسلوب editorial fashion sketch أنيق. no text, no letters, no words in the image.",
  "moodPrompts": [
    "برومبت إنجليزي لصورة إلهام أجواء مرتبطة بالكونسبت. no text, no letters, no words in the image.",
    "برومبت إنجليزي لصورة إلهام ثانية مختلفة. no text, no letters, no words in the image.",
    "برومبت إنجليزي لصورة إلهام ثالثة مختلفة. no text, no letters, no words in the image."
  ]
}

الألوان يجب أن تكون منسجمة ومستوحاة فعلياً من الوصف.`;

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

// نداء Replicate: يولّد صورة وحدة ويرجّع رابطها
async function generateImage(prompt, aspectRatio, token) {
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

    // 3) توليد الصور بالتوازي
    const heroPromise = generateImage(concept.heroPrompt, layout.heroAspect, replicateToken);
    const moodPromises = concept.moodPrompts
      .slice(0, 3)
      .map((p) => generateImage(p, layout.tileAspect, replicateToken));

    const [heroImage, ...moodImages] = await Promise.all([
      heroPromise,
      ...moodPromises,
    ]);

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
