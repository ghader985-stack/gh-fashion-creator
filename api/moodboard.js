import Anthropic from "@anthropic-ai/sdk";

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

// نسب أبعاد متنوّعة عشان الترتيب يتغيّر كل مرة (مش قالب ثابت)
const LAYOUT_VARIANTS = [
  {
    id: "editorial-left",
    heroAspect: "2:3",
    tileAspect: "1:1",
    heroSide: "left",
  },
  {
    id: "editorial-right",
    heroAspect: "2:3",
    tileAspect: "1:1",
    heroSide: "right",
  },
  {
    id: "collage-center",
    heroAspect: "3:4",
    tileAspect: "4:3",
    heroSide: "center",
  },
  {
    id: "poster-tall",
    heroAspect: "9:16",
    tileAspect: "1:1",
    heroSide: "left",
  },
];

// نداء كلود: يرجّع بيانات المود بورد كـ JSON
async function getConceptData(client, userDescription) {
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
  "heroPrompt": "برومبت إنجليزي مفصّل جداً لتوليد رسمة أزياء رئيسية: fashion illustration of a model wearing [التصميم]، مع تفاصيل الإضاءة والخلفية والأسلوب. أسلوب editorial fashion sketch أنيق. بدون أي نص أو كتابة داخل الصورة.",
  "moodPrompts": [
    "برومبت إنجليزي لصورة إلهام أجواء (خامة/منظر/تفصيل) مرتبطة بالكونسبت. بدون نص داخل الصورة.",
    "برومبت إنجليزي لصورة إلهام ثانية مختلفة. بدون نص.",
    "برومبت إنجليزي لصورة إلهام ثالثة مختلفة. بدون نص."
  ]
}

مهم جداً: كل البرومبتات يجب أن تنتهي بـ "no text, no letters, no words in the image" عشان الصور تطلع بدون حروف. الألوان يجب أن تكون منسجمة ومستوحاة فعلياً من الوصف.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `وصف المستخدم للكونسبت: ${userDescription}`,
      },
    ],
  });

  let raw = response.content[0].text.trim();
  // تنظيف أي markdown محتمل
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
        output_format: "webp",
        output_quality: 90,
        safety_tolerance: 2,
      },
    }),
  });

  const prediction = await createRes.json();

  if (prediction.error) {
    throw new Error("Replicate: " + prediction.error);
  }

  // مع Prefer: wait غالباً بترجع مباشرة، بس نعمل polling احتياطاً
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
      {
        headers: { Authorization: "Bearer " + token },
      }
    );
    result = await pollRes.json();
    tries++;
  }

  if (result.status !== "succeeded") {
    throw new Error("فشل توليد الصورة: " + (result.error || result.status));
  }

  // الناتج ممكن يكون string أو array
  const output = result.output;
  return Array.isArray(output) ? output[0] : output;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) {
    return res
      .status(500)
      .json({ error: "مفتاح Replicate غير موجود في الإعدادات" });
  }

  try {
    const { description } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: "الوصف فارغ" });
    }

    // 1) نجيب بيانات الكونسبت من كلود
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    const concept = await getConceptData(client, description);

    // 2) نختار ترتيب عشوائي عشان التنوّع
    const layout =
      LAYOUT_VARIANTS[Math.floor(Math.random() * LAYOUT_VARIANTS.length)];

    // 3) نولّد الصور بالتوازي (رئيسية + 3 إلهام)
    const heroPromise = generateImage(
      concept.heroPrompt,
      layout.heroAspect,
      replicateToken
    );
    const moodPromises = concept.moodPrompts
      .slice(0, 3)
      .map((p) => generateImage(p, layout.tileAspect, replicateToken));

    const [heroImage, ...moodImages] = await Promise.all([
      heroPromise,
      ...moodPromises,
    ]);

    // 4) نرجّع كل شي للواجهة عشان تركّبه لوحة
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
