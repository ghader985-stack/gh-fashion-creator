// pages/api/colorzones.js
// تسمية مناطق الألوان في قسم «تغيير الألوان».
//
// المتصفح هو الذي يكتشف المناطق ويغيّر الألوان — بلا أي توليد صور وبلا تكلفة.
// هذا المسار يفعل شيئاً واحداً: يقرأ الصورة المرقّمة ويعطي لكل رقم اسمه
// ومكانه ونوع خامته، ويحدّد ما إذا كان قماشاً أم بشرة أم شعراً أم خلفية،
// حتى لا تُلوَّن البشرة والخلفية بالخطأ.
//
// استدعاء واحد صغير بنموذج سريع. إذا فشل، القسم يكمل بأسماء البانتون.

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
  maxDuration: 60,
};

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 2000;
const CALL_TIMEOUT_MS = 45000;
const PART_ENUM = ['garment', 'trim', 'skin', 'hair', 'background', 'other'];

function detectImageType(buffer) {
  if (!buffer || buffer.length < 4) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer.length > 12 && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return 'image/jpeg';
}

const getField = (f) => String((Array.isArray(f) ? f[0] : f) || '').trim();
const pickFile = (f) => (Array.isArray(f) ? f[0] : f) || null;
const str = (v) => (typeof v === 'string' ? v.trim() : '');

const BOX = {
  type: 'object',
  properties: { x1: { type: 'number' }, y1: { type: 'number' }, x2: { type: 'number' }, y2: { type: 'number' } },
  required: ['x1', 'y1', 'x2', 'y2'],
  additionalProperties: false,
};

const SCHEMA = {
  type: 'object',
  properties: {
    product: BOX,
    zones: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          number: { type: 'number' },
          name: { type: 'string' },
          where: { type: 'string' },
          material: { type: 'string' },
          part: { type: 'string', enum: PART_ENUM },
        },
        required: ['number', 'name', 'where', 'material', 'part'],
        additionalProperties: false,
      },
    },
  },
  required: ['product', 'zones'],
  additionalProperties: false,
};

function buildPrompt(zones) {
  const list = zones.map((z) => '  ' + z.number + ' — ' + z.hex + ' (' + z.share + '% of the image)').join('\n');
  return `The image shows one product with numbered markers. Each number marks one detected colour area.

Numbers and their sampled colours:
${list}

For every number return:
- name: leave it an empty string. The colour name is computed from the pixels themselves.
- where: where that colour sits on the product, 2 to 6 words, listing the real parts ("outer wrap panel, waistband, belt loops", "inner skirt layer and ruffle", "floral embroidery on front panel"). If it is not part of the product, say what it is ("studio background", "model's skin", "model's hair").
- material: the material of that area in 1 to 4 words ("denim fabric", "beaded mesh", "silk tulle", "metal hardware", "embroidery thread"). Empty string if it is not a material.
- part: garment for fabric areas of the piece, trim for zippers, buttons, beads, piping, embroidery and hardware, skin for the model's skin, hair for hair or a headscarf worn only as styling, background for the backdrop or floor, other for anything else.

Also return product: the box around the product itself (the garment or item), in percent of the image:
x1 and x2 from the left edge, y1 and y2 from the top edge, 0 to 100. Include every part of the garment
including train, sleeves and any part that extends outward — but nothing of the background, furniture or
flowers. If the garment fills the frame, return 0, 0, 100, 100.

Return one entry per number, in the same order. Answer in English only.`;
}

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
    const form = formidable({ maxFileSize: 8 * 1024 * 1024, maxTotalFileSize: 10 * 1024 * 1024 });
    [fields, files] = await form.parse(req);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] colorzones form', e && e.message);
    return res.status(400).json({ error: 'تعذّر استلام الصورة' });
  }

  const image = pickFile(files.image);
  if (!image) return res.status(400).json({ error: 'الصورة مطلوبة' });

  let zones;
  try {
    zones = JSON.parse(getField(fields.zones) || '[]');
  } catch (e) {
    zones = [];
  }
  zones = (Array.isArray(zones) ? zones : []).slice(0, 12).map((z, i) => ({
    number: Number(z && z.number) || i + 1,
    hex: str(z && z.hex) || '#000000',
    share: Math.round(Number(z && z.share) || 0),
  }));
  if (!zones.length) return res.status(400).json({ error: 'لا توجد مناطق ألوان' });

  const buf = fs.readFileSync(image.filepath);
  const content = [
    { type: 'image', source: { type: 'base64', media_type: detectImageType(buf), data: buf.toString('base64') } },
    { type: 'text', text: buildPrompt(zones) },
  ];

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CALL_TIMEOUT_MS);
  let data = null;
  let useSchema = true;

  try {
    for (let attempt = 0; attempt < 2 && !data; attempt++) {
      const body = { model: MODEL, max_tokens: MAX_TOKENS, messages: [{ role: 'user', content }] };
      if (useSchema) body.output_config = { format: { type: 'json_schema', schema: SCHEMA } };
      else {
        body.messages = [{
          role: 'user',
          content: content.concat([{
            type: 'text',
            text: 'Return ONLY one JSON object, no markdown: {"product":{"x1":0,"y1":0,"x2":100,"y2":100},"zones":[{"number":1,"name":"","where":"","material":"","part":"garment"}]}',
          }]),
        }];
      }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: ctrl.signal,
        body: JSON.stringify(body),
      });
      if (response.status === 400 && useSchema) {
        if (typeof console !== 'undefined') console.warn('[gh] colorzones 400, retrying without schema');
        useSchema = false;
        continue;
      }
      if (!response.ok) {
        if (typeof console !== 'undefined') console.warn('[gh] colorzones status', response.status);
        return res.status(502).json({ error: 'تعذّرت تسمية المناطق' });
      }
      data = await response.json();
    }
  } catch (e) {
    clearTimeout(timer);
    if (typeof console !== 'undefined') console.warn('[gh] colorzones call', e && e.message);
    return res.status(504).json({ error: 'تعذّر الاتصال بخدمة التسمية' });
  }
  clearTimeout(timer);
  if (!data) return res.status(502).json({ error: 'تعذّرت تسمية المناطق' });

  const text = (data.content || []).filter((b) => b && b.type === 'text').map((b) => b.text).join('');
  let parsed;
  try {
    const t = text.replace(/```(?:json)?/gi, '').trim();
    parsed = JSON.parse(useSchema ? text : t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[gh] colorzones parse', e && e.message);
    return res.status(502).json({ error: 'تعذّرت قراءة أسماء المناطق' });
  }

  const num = (v, d) => (Number.isFinite(+v) ? Math.max(0, Math.min(100, +v)) : d);
  const pb = (parsed && parsed.product) || {};
  const product = {
    x1: Math.min(num(pb.x1, 0), num(pb.x2, 100)),
    y1: Math.min(num(pb.y1, 0), num(pb.y2, 100)),
    x2: Math.max(num(pb.x1, 0), num(pb.x2, 100)),
    y2: Math.max(num(pb.y1, 0), num(pb.y2, 100)),
  };

  const out = (Array.isArray(parsed && parsed.zones) ? parsed.zones : []).map((z, i) => ({
    number: Number(z && z.number) || i + 1,
    name: str(z && z.name),
    where: str(z && z.where),
    material: str(z && z.material),
    part: PART_ENUM.includes(str(z && z.part).toLowerCase()) ? str(z.part).toLowerCase() : 'other',
  }));

  return res.status(200).json({ product, zones: out });
}
