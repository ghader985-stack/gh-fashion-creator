import { useState } from ‘react’;

export default function Home() {
const [tab, setTab] = useState(‘design’);
const [input, setInput] = useState(’’);
const [output, setOutput] = useState(’’);
const [ratio, setRatio] = useState(‘9:16’);
const [platform, setPlatform] = useState(‘reel’);
const [copied, setCopied] = useState(false);
const [started, setStarted] = useState(false);
const [img, setImg] = useState(null);
const [imgName, setImgName] = useState(’’);
const [translated, setTranslated] = useState(false);
const [promptLength, setPromptLength] = useState(‘pro’);
const [generatedImg, setGeneratedImg] = useState(null);
const [loading, setLoading] = useState(false);
const gold = ‘#C9A078’;

const handleUpload = (e) => {
const file = e.target.files[0];
if (file) {
const reader = new FileReader();
reader.onload = (ev) => { setImg(ev.target.result); setImgName(file.name); };
reader.readAsDataURL(file);
}
};

const translate = () => {
if (!output || translated || tab === ‘marketing’) return;
const desc = input.trim() || ‘fashion design’;
let arabicPrompt = ‘’;
if (tab === ‘design’) {
arabicPrompt = ’Haute couture photo: ’ + desc + ‘\n\nArabian model, long dark wavy hair, olive skin, palace ballroom, crystal chandeliers, golden lighting, Hasselblad, 8K, Vogue Arabia style.\n\n–ar ’ + ratio + ’ –v 6.1 –style raw –s 750 –q 2’;
} else if (tab === ‘video’) {
arabicPrompt = ’Cinematic fashion film: ’ + desc + ’\n\nArabian model walking through marble palace, golden hour lighting, flowing fabric, 4K, Dior campaign style.\n\n–ar ’ + ratio;
} else if (tab === ‘generate’) {
arabicPrompt = ’Fashion photo: ’ + desc + ‘\n\nArabian model, dark hair, olive skin, palace, chandeliers, golden light, Vogue, 8K.\n\n–ar ’ + ratio + ’ –v 6.1 –style raw –s 750’;
}
setOutput(arabicPrompt);
setTranslated(true);
};

const copy = () => {
navigator.clipboard.writeText(output);
setCopied(true);
setTimeout(() => setCopied(false), 2000);
};

const generateImage = async () => {
if (!input.trim() && !img) {
alert(‘Please enter a description or upload an image’);
return;
}
setLoading(true);
setGeneratedImg(null);
const desc = input.trim() || ‘elegant fashion design’;
const prompt = ’Professional haute couture fashion photography: ’ + desc + ‘. Elegant Arabian model with long dark wavy hair, warm olive skin, standing in luxurious palace ballroom. Crystal chandeliers, soft golden lighting, shallow depth of field, dreamy bokeh. Vogue Arabia editorial, 8K, Hasselblad quality.’;

```
try {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ratio })
  });
  const data = await response.json();
  if (data.imageUrl) {
    setGeneratedImg(data.imageUrl);
  } else {
    alert('Error generating image');
  }
} catch (error) {
  alert('Connection error');
}
setLoading(false);
```

};

const generate = () => {
if (!input.trim() && !img) {
setOutput(‘Please enter a description or upload an image’);
return;
}
setTranslated(false);
const desc = input.trim() || ‘elegant fashion design from uploaded image’;
let result = ‘’;
if (tab === ‘design’) {
if (promptLength === ‘short’) {
result = desc + ‘, elegant Arabian model, dark wavy hair, olive skin, palace ballroom, crystal chandeliers, golden lighting, Vogue style, 8K –ar ’ + ratio + ’ –v 6.1 –s 750’;
} else if (promptLength === ‘medium’) {
result = ’Haute couture: ’ + desc + ‘. Elegant Arabian model with long dark wavy hair, warm olive skin, standing in luxurious palace ballroom. Crystal chandeliers, soft golden lighting, shallow depth of field, dreamy bokeh. Vogue Arabia editorial, 8K, Hasselblad quality. –ar ’ + ratio + ’ –v 6.1 –style raw –s 750’;
} else {
result = ’Professional haute couture fashion photography: ’ + desc + ‘\n\nSubject: Breathtakingly elegant Arabian woman with long, lustrous dark wavy hair cascading over shoulders, warm olive skin with natural glow, striking almond-shaped eyes, perfectly defined brows, subtle rose lip makeup, wearing exquisite diamond drop earrings.\n\nSetting: Opulent grand palace ballroom with soaring gilded ceilings, magnificent multi-tiered crystal chandeliers, ornate baroque architectural details, polished cream marble floors with subtle reflections, soft pink roses arrangements.\n\nLighting: Cinematic three-point setup - soft key light from 45 degrees, gentle fill, warm rim light creating subtle halo. Golden hour warmth, diffused quality.\n\nTechnical: Hasselblad H6D-100c, 85mm f/1.4 lens, shallow DOF, creamy bokeh, 8K resolution, Kodak Portra color science.\n\nStyle: Vogue Arabia cover, Harpers Bazaar aesthetic, Dior campaign quality.\n\n–ar ’ + ratio + ’ –v 6.1 –style raw –s 750 –q 2’;
}
} else if (tab === ‘video’) {
if (promptLength === ‘short’) {
result = ’Fashion video: ’ + desc + ’, Arabian model walking in palace, golden lighting, flowing fabric, 4K cinematic –ar ’ + ratio;
} else if (promptLength === ‘medium’) {
result = ’Cinematic fashion film: ’ + desc + ’. Elegant Arabian model with flowing dark hair walks through marble palace corridor. Golden hour lighting, tracking shot, fabric flowing with each step. 4K, 24fps, Dior campaign style. –ar ’ + ratio;
} else {
result = ’Cinematic luxury fashion film: ’ + desc + ’\n\n[0-3s] OPENING: Extreme macro on intricate fabric texture, beading catches light, slow pan across hand-sewn embellishments.\n\n[3-7s] THE REVEAL: Camera pulls back smoothly revealing elegant Arabian model, long flowing dark hair, standing in dramatic backlit pose.\n\n[7-12s] THE WALK: Tracking shot follows model walking through ornate marble palace corridor, golden hour light streaming through arched windows, fabric flowing elegantly with each confident step.\n\n[12-15s] THE MOMENT: Model pauses, slight turn toward camera, subtle knowing smile, light catches jewelry.\n\nTechnical: 4K RED camera, 24fps cinematic, 85mm lens, shallow DOF, warm golden color grade, Dior/Chanel campaign aesthetic.\n\n–ar ’ + ratio;
}
} else if (tab === ‘marketing’) {
if (platform === ‘reel’) {
result = ‘INSTAGRAM REEL\n\nHOOK (0-3s):\nThe dress everyone is asking about\n\nCONTENT (3-25s):\n- Close-up on fabric details and embroidery\n- Full design reveal with slow spin\n- Movement shots showing fabric flow\n\nCTA (25-30s):\nOrder before sold out! Link in bio\n\nCAPTION:\n’ + desc + ‘\nExclusive design with elegant touch\nSizes: XS - XL\nWorldwide shipping\nDM or link in bio\n\n#fashion #dress #elegant #GHFashion’;
} else if (platform === ‘tiktok’) {
result = ‘TIKTOK\n\nHOOK (0-2s):\nPOV: You found your dream dress\n\nFORMAT:\n- GRWM - Getting ready and wearing the design\n- Or Before/After Transformation\n- Quick cuts with beat drops\n\nCTA:\nFollow for more designs!\n\nCAPTION:\n’ + desc + ‘\nLink in bio\n\n#fyp #viral #fashion #ootd #GHFashion’;
} else if (platform === ‘story’) {
result = ’INSTAGRAM STORIES\n\n1. Blurred image + Something new coming\n2. Reveal: ’ + desc + ‘\n3. Close-up details\n4. Poll: What do you think?\n5. Available sizes and colors\n6. Question box\n7. CTA: DM to order’;
} else if (platform === ‘post’) {
result = ‘INSTAGRAM POST\n\nCAROUSEL:\n1. Hero shot - Full design\n2. On model - Front view\n3. Details - Close-up\n4. Back view\n5. Order info\n\nCAPTION:\n’ + desc + ‘\n\nWhere elegance meets luxury…\n\nFeatures:\n- Premium quality fabric\n- Handmade embroidery\n- Carefully designed cut\n\nSizes: XS - XL\nDM or link in bio\n\n#fashion #dress #elegant #GHFashion’;
} else if (platform === ‘story_marketing’) {
result = ‘MARKETING STORY\n\nOn an unforgettable night…\nWhen you enter the room, all eyes stop\n\n’ + desc + ‘\n\nNot just fabric and thread…\nBut a story of elegance told in every detail\n\nMade with love, to make you feel special\nBecause you deserve the best\n\nGH Fashion\nWhere your story begins’;
}
} else if (tab === ‘generate’) {
if (promptLength === ‘short’) {
result = desc + ‘, Arabian model, dark hair, olive skin, palace, chandeliers, golden light, 8K –ar ’ + ratio + ’ –v 6.1’;
} else if (promptLength === ‘medium’) {
result = desc + ‘, stunning Arabian model with long dark wavy hair, olive skin, grand palace ballroom, crystal chandeliers, soft golden lighting, shallow DOF, bokeh, Vogue editorial, 8K –ar ’ + ratio + ’ –v 6.1 –style raw –s 750’;
} else {
result = ’Ultimate fashion image prompt: ’ + desc + ‘\n\nStunning Arabian model, long lustrous dark wavy hair, warm olive glowing skin, elegant pose in grand palace ballroom, magnificent crystal chandeliers, soft golden ambient lighting, shallow depth of field, dreamy creamy bokeh, Vogue Arabia editorial quality, Hasselblad medium format, 8K ultra resolution, luxury fashion campaign aesthetic.\n\nNegative prompt: ugly, deformed, blurry, bad anatomy, extra limbs, low quality, watermark, text, amateur lighting\n\n–ar ’ + ratio + ’ –v 6.1 –style raw –s 750 –q 2’;
}
}
setOutput(result);
};

if (!started) {
return (
<div style={{ minHeight: ‘100vh’, background: ‘#FDF8F5’, padding: ‘20px’, fontFamily: ‘system-ui’, direction: ‘rtl’ }}>
<div style={{ maxWidth: ‘400px’, margin: ‘0 auto’, textAlign: ‘center’, paddingTop: ‘40px’ }}>
<div style={{ width: ‘80px’, height: ‘80px’, margin: ‘0 auto 20px’, background: ‘linear-gradient(135deg, #D4AF91, #C9A078)’, borderRadius: ‘50%’, display: ‘flex’, alignItems: ‘center’, justifyContent: ‘center’ }}>
<span style={{ fontSize: ‘28px’, color: ‘#fff’, fontWeight: ‘700’ }}>GH</span>
</div>
<h1 style={{ fontSize: ‘1.8rem’, color: gold, marginBottom: ‘10px’ }}>AI Fashion Creator</h1>
<p style={{ color: ‘#9D8B7A’, marginBottom: ‘30px’ }}>Professional Fashion Prompt Generator</p>
<div style={{ display: ‘flex’, flexDirection: ‘column’, gap: ‘12px’, marginBottom: ‘20px’ }}>
<div onClick={() => setStarted(true)} style={{ padding: ‘16px’, background: ‘white’, borderRadius: ‘16px’, cursor: ‘pointer’, border: ‘2px solid rgba(201,160,120,0.2)’ }}>
<div style={{ display: ‘flex’, justifyContent: ‘space-between’, alignItems: ‘center’ }}>
<div style={{ textAlign: ‘right’ }}>
<h3 style={{ color: gold, marginBottom: ‘4px’ }}>Basic</h3>
<p style={{ color: ‘#8D7D6D’, fontSize: ‘0.8rem’ }}>100 images - 200 prompts</p>
</div>
<span style={{ color: gold, fontWeight: ‘700’, fontSize: ‘1.3rem’ }}>$15</span>
</div>
</div>
<div onClick={() => setStarted(true)} style={{ padding: ‘16px’, background: ‘white’, borderRadius: ‘16px’, cursor: ‘pointer’, border: ‘2px solid rgba(201,160,120,0.2)’ }}>
<div style={{ display: ‘flex’, justifyContent: ‘space-between’, alignItems: ‘center’ }}>
<div style={{ textAlign: ‘right’ }}>
<h3 style={{ color: gold, marginBottom: ‘4px’ }}>Pro</h3>
<p style={{ color: ‘#8D7D6D’, fontSize: ‘0.8rem’ }}>250 images - 500 prompts</p>
</div>
<span style={{ color: gold, fontWeight: ‘700’, fontSize: ‘1.3rem’ }}>$35</span>
</div>
</div>
<div onClick={() => setStarted(true)} style={{ padding: ‘16px’, background: ‘white’, borderRadius: ‘16px’, cursor: ‘pointer’, border: ‘2px solid rgba(201,160,120,0.2)’ }}>
<div style={{ display: ‘flex’, justifyContent: ‘space-between’, alignItems: ‘center’ }}>
<div style={{ textAlign: ‘right’ }}>
<h3 style={{ color: gold, marginBottom: ‘4px’ }}>Unlimited</h3>
<p style={{ color: ‘#8D7D6D’, fontSize: ‘0.8rem’ }}>600 images - 1200 prompts</p>
</div>
<span style={{ color: gold, fontWeight: ‘700’, fontSize: ‘1.3rem’ }}>$75</span>
</div>
</div>
</div>
</div>
</div>
);
}

return (
<div style={{ minHeight: ‘100vh’, background: ‘#FDF8F5’, padding: ‘16px’, fontFamily: ‘system-ui’, direction: ‘rtl’ }}>
<div style={{ maxWidth: ‘600px’, margin: ‘0 auto’ }}>
<header style={{ textAlign: ‘center’, marginBottom: ‘16px’ }}>
<div style={{ width: ‘50px’, height: ‘50px’, margin: ‘0 auto 8px’, background: ‘linear-gradient(135deg, #D4AF91, #C9A078)’, borderRadius: ‘50%’, display: ‘flex’, alignItems: ‘center’, justifyContent: ‘center’ }}>
<span style={{ fontSize: ‘18px’, color: ‘#fff’, fontWeight: ‘700’ }}>GH</span>
</div>
<h1 style={{ fontSize: ‘1.2rem’, color: gold }}>AI Fashion Creator</h1>
</header>
<div style={{ display: ‘flex’, gap: ‘6px’, justifyContent: ‘center’, flexWrap: ‘wrap’, marginBottom: ‘14px’ }}>
<button onClick={() => { setTab(‘design’); setOutput(’’); setGeneratedImg(null); }} style={{ padding: ‘10px 14px’, borderRadius: ‘20px’, cursor: ‘pointer’, border: tab === ‘design’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: tab === ‘design’ ? ‘linear-gradient(135deg, #D4AF91, #C9A078)’ : ‘white’, color: tab === ‘design’ ? ‘#fff’ : ‘#9D8B7A’, fontWeight: ‘600’, fontSize: ‘0.85rem’ }}>Design</button>
<button onClick={() => { setTab(‘video’); setOutput(’’); setGeneratedImg(null); }} style={{ padding: ‘10px 14px’, borderRadius: ‘20px’, cursor: ‘pointer’, border: tab === ‘video’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: tab === ‘video’ ? ‘linear-gradient(135deg, #D4AF91, #C9A078)’ : ‘white’, color: tab === ‘video’ ? ‘#fff’ : ‘#9D8B7A’, fontWeight: ‘600’, fontSize: ‘0.85rem’ }}>Video</button>
<button onClick={() => { setTab(‘marketing’); setOutput(’’); setGeneratedImg(null); }} style={{ padding: ‘10px 14px’, borderRadius: ‘20px’, cursor: ‘pointer’, border: tab === ‘marketing’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: tab === ‘marketing’ ? ‘linear-gradient(135deg, #D4AF91, #C9A078)’ : ‘white’, color: tab === ‘marketing’ ? ‘#fff’ : ‘#9D8B7A’, fontWeight: ‘600’, fontSize: ‘0.85rem’ }}>Marketing</button>
<button onClick={() => { setTab(‘generate’); setOutput(’’); setGeneratedImg(null); }} style={{ padding: ‘10px 14px’, borderRadius: ‘20px’, cursor: ‘pointer’, border: tab === ‘generate’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: tab === ‘generate’ ? ‘linear-gradient(135deg, #D4AF91, #C9A078)’ : ‘white’, color: tab === ‘generate’ ? ‘#fff’ : ‘#9D8B7A’, fontWeight: ‘600’, fontSize: ‘0.85rem’ }}>Generate</button>
</div>
<div style={{ background: ‘white’, borderRadius: ‘20px’, padding: ‘18px’, boxShadow: ‘0 4px 20px rgba(201,160,120,0.1)’ }}>
{(tab === ‘design’ || tab === ‘video’ || tab === ‘generate’) && (
<div style={{ marginBottom: ‘14px’ }}>
<label style={{ display: ‘block’, marginBottom: ‘6px’, color: ‘#8D7D6D’, fontSize: ‘0.85rem’ }}>Aspect Ratio</label>
<div style={{ display: ‘flex’, gap: ‘8px’, justifyContent: ‘center’ }}>
<button onClick={() => setRatio(‘1:1’)} style={{ padding: ‘8px 18px’, borderRadius: ‘12px’, cursor: ‘pointer’, border: ratio === ‘1:1’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: ratio === ‘1:1’ ? gold : ‘white’, color: ratio === ‘1:1’ ? ‘#fff’ : ‘#9D8B7A’, fontWeight: ‘500’ }}>1:1</button>
<button onClick={() => setRatio(‘9:16’)} style={{ padding: ‘8px 18px’, borderRadius: ‘12px’, cursor: ‘pointer’, border: ratio === ‘9:16’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: ratio === ‘9:16’ ? gold : ‘white’, color: ratio === ‘9:16’ ? ‘#fff’ : ‘#9D8B7A’, fontWeight: ‘500’ }}>9:16</button>
<button onClick={() => setRatio(‘16:9’)} style={{ padding: ‘8px 18px’, borderRadius: ‘12px’, cursor: ‘pointer’, border: ratio === ‘16:9’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: ratio === ‘16:9’ ? gold : ‘white’, color: ratio === ‘16:9’ ? ‘#fff’ : ‘#9D8B7A’, fontWeight: ‘500’ }}>16:9</button>
</div>
</div>
)}
{(tab === ‘design’ || tab === ‘video’ || tab === ‘generate’) && (
<div style={{ marginBottom: ‘14px’ }}>
<label style={{ display: ‘block’, marginBottom: ‘6px’, color: ‘#8D7D6D’, fontSize: ‘0.85rem’ }}>Prompt Length</label>
<div style={{ display: ‘flex’, gap: ‘8px’, justifyContent: ‘center’ }}>
<button onClick={() => setPromptLength(‘short’)} style={{ padding: ‘8px 16px’, borderRadius: ‘12px’, cursor: ‘pointer’, border: promptLength === ‘short’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: promptLength === ‘short’ ? gold : ‘white’, color: promptLength === ‘short’ ? ‘#fff’ : ‘#9D8B7A’, fontWeight: ‘500’, fontSize: ‘0.85rem’ }}>Short</button>
<button onClick={() => setPromptLength(‘medium’)} style={{ padding: ‘8px 16px’, borderRadius: ‘12px’, cursor: ‘pointer’, border: promptLength === ‘medium’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: promptLength === ‘medium’ ? gold : ‘white’, color: promptLength === ‘medium’ ? ‘#fff’ : ‘#9D8B7A’, fontWeight: ‘500’, fontSize: ‘0.85rem’ }}>Medium</button>
<button onClick={() => setPromptLength(‘pro’)} style={{ padding: ‘8px 16px’, borderRadius: ‘12px’, cursor: ‘pointer’, border: promptLength === ‘pro’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: promptLength === ‘pro’ ? gold : ‘white’, color: promptLength === ‘pro’ ? ‘#fff’ : ‘#9D8B7A’, fontWeight: ‘500’, fontSize: ‘0.85rem’ }}>Pro</button>
</div>
</div>
)}
{tab === ‘marketing’ && (
<div style={{ marginBottom: ‘14px’ }}>
<label style={{ display: ‘block’, marginBottom: ‘6px’, color: ‘#8D7D6D’, fontSize: ‘0.85rem’ }}>Platform</label>
<div style={{ display: ‘flex’, gap: ‘6px’, justifyContent: ‘center’, flexWrap: ‘wrap’ }}>
<button onClick={() => setPlatform(‘reel’)} style={{ padding: ‘7px 12px’, borderRadius: ‘12px’, cursor: ‘pointer’, border: platform === ‘reel’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: platform === ‘reel’ ? gold : ‘white’, color: platform === ‘reel’ ? ‘#fff’ : ‘#9D8B7A’, fontSize: ‘0.8rem’ }}>Reel</button>
<button onClick={() => setPlatform(‘tiktok’)} style={{ padding: ‘7px 12px’, borderRadius: ‘12px’, cursor: ‘pointer’, border: platform === ‘tiktok’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: platform === ‘tiktok’ ? gold : ‘white’, color: platform === ‘tiktok’ ? ‘#fff’ : ‘#9D8B7A’, fontSize: ‘0.8rem’ }}>TikTok</button>
<button onClick={() => setPlatform(‘story’)} style={{ padding: ‘7px 12px’, borderRadius: ‘12px’, cursor: ‘pointer’, border: platform === ‘story’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: platform === ‘story’ ? gold : ‘white’, color: platform === ‘story’ ? ‘#fff’ : ‘#9D8B7A’, fontSize: ‘0.8rem’ }}>Story</button>
<button onClick={() => setPlatform(‘post’)} style={{ padding: ‘7px 12px’, borderRadius: ‘12px’, cursor: ‘pointer’, border: platform === ‘post’ ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: platform === ‘post’ ? gold : ‘white’, color: platform === ‘post’ ? ‘#fff’ : ‘#9D8B7A’, fontSize: ‘0.8rem’ }}>Post</button>
</div>
</div>
)}
<div style={{ marginBottom: ‘14px’ }}>
<label style={{ display: ‘block’, marginBottom: ‘6px’, color: ‘#8D7D6D’, fontSize: ‘0.85rem’ }}>Upload Image (Optional)</label>
<input type=“file” id=“fileInput” onChange={handleUpload} accept=“image/*” style={{ display: ‘none’ }} />
{!img ? (
<div onClick={() => document.getElementById(‘fileInput’).click()} style={{ border: ‘2px dashed rgba(201,160,120,0.4)’, borderRadius: ‘12px’, padding: ‘20px’, textAlign: ‘center’, cursor: ‘pointer’, background: ‘#FDFAF7’ }}>
<span style={{ fontSize: ‘2rem’ }}>📷</span>
<p style={{ color: ‘#B8A090’, fontSize: ‘0.8rem’, marginTop: ‘6px’ }}>Click to upload</p>
</div>
) : (
<div style={{ display: ‘flex’, alignItems: ‘center’, gap: ‘10px’, padding: ‘10px’, background: ‘#FDFAF7’, borderRadius: ‘12px’ }}>
<img src={img} alt=”” style={{ width: ‘50px’, height: ‘50px’, objectFit: ‘cover’, borderRadius: ‘8px’ }} />
<span style={{ flex: 1, color: ‘#6D5D4D’, fontSize: ‘0.8rem’ }}>{imgName}</span>
<button onClick={() => { setImg(null); setImgName(’’); }} style={{ padding: ‘6px 12px’, background: ‘rgba(200,80,80,0.1)’, border: ‘none’, borderRadius: ‘8px’, cursor: ‘pointer’, color: ‘#c55’, fontSize: ‘0.8rem’ }}>X</button>
</div>
)}
</div>
<div style={{ marginBottom: ‘14px’ }}>
<label style={{ display: ‘block’, marginBottom: ‘6px’, color: ‘#8D7D6D’, fontSize: ‘0.85rem’ }}>Design Description</label>
<textarea value={input} onChange={e => setInput(e.target.value)} placeholder=“Example: Golden evening dress with handmade embroidery and long sleeves…” style={{ width: ‘100%’, padding: ‘12px’, borderRadius: ‘12px’, fontSize: ‘0.9rem’, border: ‘1px solid rgba(201,160,120,0.3)’, background: ‘#FDFAF7’, outline: ‘none’, minHeight: ‘80px’, resize: ‘vertical’, fontFamily: ‘inherit’, boxSizing: ‘border-box’ }} />
</div>
{tab === ‘generate’ ? (
<button onClick={generateImage} disabled={loading} style={{ width: ‘100%’, padding: ‘14px’, background: loading ? ‘#aaa’ : ‘linear-gradient(135deg, #D4AF91, #C9A078)’, color: ‘#fff’, border: ‘none’, borderRadius: ‘14px’, fontSize: ‘1rem’, fontWeight: ‘600’, cursor: loading ? ‘not-allowed’ : ‘pointer’ }}>
{loading ? ‘Generating…’ : ‘Generate Image’}
</button>
) : (
<button onClick={generate} style={{ width: ‘100%’, padding: ‘14px’, background: ‘linear-gradient(135deg, #D4AF91, #C9A078)’, color: ‘#fff’, border: ‘none’, borderRadius: ‘14px’, fontSize: ‘1rem’, fontWeight: ‘600’, cursor: ‘pointer’ }}>Generate Prompt</button>
)}
{generatedImg && (
<div style={{ marginTop: ‘16px’, textAlign: ‘center’ }}>
<img src={generatedImg} alt=“Generated” style={{ maxWidth: ‘100%’, borderRadius: ‘12px’, marginBottom: ‘10px’ }} />
<a href={generatedImg} download=“gh-fashion.png” style={{ display: ‘inline-block’, padding: ‘10px 20px’, background: gold, color: ‘#fff’, borderRadius: ‘10px’, textDecoration: ‘none’, fontSize: ‘0.9rem’ }}>Download Image</a>
</div>
)}
{output && (
<div style={{ marginTop: ‘16px’, padding: ‘14px’, background: ‘#FDFAF7’, borderRadius: ‘14px’, border: ‘1px solid rgba(201,160,120,0.15)’ }}>
<div style={{ display: ‘flex’, justifyContent: ‘space-between’, alignItems: ‘center’, marginBottom: ‘10px’ }}>
<span style={{ color: gold, fontSize: ‘0.9rem’, fontWeight: ‘600’ }}>Result</span>
<div style={{ display: ‘flex’, gap: ‘6px’ }}>
{(tab === ‘design’ || tab === ‘video’ || tab === ‘generate’) && (<button onClick={translate} disabled={translated} style={{ padding: ‘6px 12px’, background: translated ? ‘#aaa’ : ‘#5A9A9A’, border: ‘none’, borderRadius: ‘8px’, cursor: translated ? ‘not-allowed’ : ‘pointer’, fontSize: ‘0.8rem’, color: ‘#fff’ }}>{translated ? ‘Translated’ : ‘Translate’}</button>)}
<button onClick={copy} style={{ padding: ‘6px 14px’, background: copied ? ‘#7CB07C’ : gold, border: ‘none’, borderRadius: ‘8px’, cursor: ‘pointer’, fontSize: ‘0.8rem’, color: ‘#fff’ }}>{copied ? ‘Copied!’ : ‘Copy’}</button>
</div>
</div>
<div style={{ background: ‘white’, padding: ‘12px’, borderRadius: ‘10px’, fontSize: ‘0.85rem’, lineHeight: ‘1.8’, color: ‘#5D4D3D’, whiteSpace: ‘pre-wrap’, maxHeight: ‘300px’, overflowY: ‘auto’ }}>{output}</div>
</div>
)}
</div>
<footer style={{ textAlign: ‘center’, marginTop: ‘16px’, color: ‘#B8A090’, fontSize: ‘0.75rem’ }}>Made with love by <span style={{ color: gold }}>GH Fashion</span></footer>
</div>
</div>
);
}
