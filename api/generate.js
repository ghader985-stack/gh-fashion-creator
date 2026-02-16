export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'API token not configured' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await fetch('https://api.replicate.com/v1/models/stability-ai/sdxl/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          width: 768,
          height: 1024,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 25,
          guidance_scale: 7.5,
          negative_prompt: "low quality, blurry, distorted, ugly, bad anatomy"
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    if (data.output && data.output[0]) {
      return res.status(200).json({ success: true, image: data.output[0] });
    }

    if (data.urls && data.urls.get) {
      let result = data;
      let attempts = 0;
      
      while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const pollResponse = await fetch(data.urls.get, {
          headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
        });
        result = await pollResponse.json();
        attempts++;
      }

      if (result.status === 'succeeded' && result.output && result.output[0]) {
        return res.status(200).json({ success: true, image: result.output[0] });
      }
      
      return res.status(500).json({ error: 'Generation timed out' });
    }

    return res.status(500).json({ error: 'No image generated' });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
