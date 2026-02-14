export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, ratio } = req.body;
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'API token not configured' });
  }

  let width = 768;
  let height = 1024;
  if (ratio === '1:1') {
    width = 1024;
    height = 1024;
  } else if (ratio === '16:9') {
    width = 1024;
    height = 576;
  } else if (ratio === '9:16') {
    width = 576;
    height = 1024;
  }

  try {
    const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + REPLICATE_API_TOKEN,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          width: width,
          height: height,
          num_outputs: 1,
          output_format: 'webp',
          output_quality: 90
        }
      })
    });

    const result = await response.json();
    
    if (result.output && result.output[0]) {
      return res.status(200).json({ imageUrl: result.output[0] });
    } else if (result.error) {
      return res.status(500).json({ error: result.error });
    } else {
      return res.status(500).json({ error: 'No image generated' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
