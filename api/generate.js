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
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input: {
          prompt: prompt,
          width: 768,
          height: 1024,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 30,
          guidance_scale: 7.5
        }
      })
    });

    const prediction = await response.json();

    if (prediction.error) {
      return res.status(500).json({ error: prediction.error });
    }

    if (prediction.output && prediction.output[0]) {
      return res.status(200).json({ success: true, image: prediction.output[0] });
    }

    if (prediction.urls && prediction.urls.get) {
      let result = prediction;
      let attempts = 0;
      while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const pollResponse = await fetch(prediction.urls.get, {
          headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
        });
        result = await pollResponse.json();
        attempts++;
      }

      if (result.status === 'succeeded' && result.output && result.output[0]) {
        return res.status(200).json({ success: true, image: result.output[0] });
      } else {
        return res.status(500).json({ error: 'Generation failed or timed out' });
      }
    }

    return res.status(500).json({ error: 'Unexpected response from API' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
