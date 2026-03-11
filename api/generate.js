import Anthropic from "@anthropic-ai/sdk";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
    });

    const [fields, files] = await form.parse(req);

    const prompt = fields.prompt?.[0] || "";
    const imageFile = files.image?.[0];

    let messages = [];

    if (imageFile) {
      const imageData = fs.readFileSync(imageFile.filepath);
      const base64Image = imageData.toString("base64");
      const mimeType = imageFile.mimetype || "image/jpeg";

      messages = [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ];
    } else {
      messages = [
        {
          role: "user",
          content: prompt,
        },
      ];
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: messages,
    });

    const result = response.content[0].text;

    res.status(200).json({ result });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: error.message || "حدث خطأ في التوليد",
    });
  }
}
