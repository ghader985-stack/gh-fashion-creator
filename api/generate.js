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
    // Create prediction
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
        input: {
          prompt: "fashion photography, " + prompt + ", professional model, studio lighting, high quality, 8k",
          width: 768,
          height: 1024,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 25
        }
      })
    });

    const prediction = await createResponse.json();

    if (prediction.error) {
      return res.status(500).json({ error: prediction.error });
    }

    // Poll for result
    let result = prediction;
    let attempts = 0;
    
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
      });
      result = await pollResponse.json();
      attempts++;
    }

    if (result.status === 'succeeded' && result.output) {
      const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      return res.status(200).json({ success: true, image: imageUrl });
    }
    
    return res.status(500).json({ error: 'Generation failed: ' + (result.error || result.status) });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
