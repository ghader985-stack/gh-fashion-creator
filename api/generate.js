export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, ratio } = req.body;
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'API token not configured' });
  }

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'black-forest-labs/flux-schnell',
        input: {
          prompt: prompt,
          aspect_ratio: ratio || '9:16',
          num_outputs: 1,
          output_format: 'webp',
          output_quality: 90,
        },
      }),
    });

    const prediction = await response.json();
    if (prediction.error) {
      return res.status(500).json({ error: prediction.error });
    }

    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        { headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` } }
      );
      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      return res.status(500).json({ error: 'Image generation failed' });
    }

    return res.status(200).json({ imageUrl: result.output[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}
