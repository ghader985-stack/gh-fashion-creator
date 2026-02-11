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
const desc = input.trim() || ‘تصميم أزياء أنيق’;
let arabicPrompt = ‘’;
if (tab === ‘design’) {
arabicPrompt = `صورة أزياء هوت كوتور احترافية: ${desc}\n\nعارضة أزياء عربية فاخرة بشعر أسود طويل مموج لامع، بشرة زيتونية دافئة متوهجة، عيون لوزية معبرة، حواجب مرسومة بدقة، مكياج راقي ناعم، أقراط ماسية متدلية.\n\nالموقع: قاعة قصر فخمة بأسقف عالية، ثريات كريستالية ضخمة، أعمدة رخامية مذهبة، أرضية رخام لامعة.\n\nالإضاءة: إضاءة ذهبية ناعمة من الجانب، إضاءة خلفية دافئة تخلق هالة حول العارضة، عمق ميدان ضحل مع بوكيه حالم.\n\nالجودة: تصوير بكاميرا Hasselblad، عدسة 85mm f/1.4، دقة 8K، ألوان سينمائية ذهبية دافئة، ستايل مجلة فوغ العربية.\n\n--ar ${ratio} --v 6.1 --style raw --s 750 --q 2`;
} else if (tab === ‘video’) {
arabicPrompt = `فيلم أزياء سينمائي: ${desc}\n\nالمشهد الافتتاحي: لقطة ماكرو على تفاصيل القماش الفاخر والتطريز اليدوي الدقيق.\n\nالكشف: الكاميرا تتراجع ببطء كاشفة عارضة عربية أنيقة بشعر أسود منسدل يتمايل مع حركتها.\n\nالحركة: تمشي بثقة وأناقة عبر ممر قصر رخامي فاخر، ضوء الساعة الذهبية يتدفق عبر النوافذ المقوسة.\n\nالتصوير: لقطة تتبع سلسة، القماش الفاخر ينساب مع كل خطوة، بوكيه حالم من الثريات الكريستالية.\n\nالجودة: 4K، 24 إطار/ثانية، درجات لونية ذهبية دافئة، ستايل حملات Dior و Chanel.\n\n--ar ${ratio}`;
} else if (tab === ‘generate’) {
arabicPrompt = `صورة أزياء احترافية: ${desc}\n\nعارضة عربية أنيقة، شعر أسود طويل مموج، بشرة زيتونية دافئة، قاعة قصر فاخر، ثريات كريستالية، إضاءة ذهبية ناعمة، عمق ميدان ضحل، بوكيه حالم، ستايل مجلة فوغ، دقة 8K.\n\n--ar ${ratio} --v 6.1 --style raw --s 750`;
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
alert(‘الرجاء كتابة وصف أو رفع صورة’);
return;
}
setLoading(true);
setGeneratedImg(null);
const desc = input.trim() || ‘elegant fashion design’;
const prompt = `Professional haute couture fashion photography: ${desc}. Elegant Arabian model with long dark wavy hair, warm olive skin, standing in luxurious palace ballroom. Crystal chandeliers, soft golden lighting, shallow depth of field, dreamy bokeh. Vogue Arabia editorial, 8K, Hasselblad quality.`;

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
    alert('حدث خطأ في توليد الصورة');
  }
} catch (error) {
  alert('حدث خطأ في الاتصال');
}
setLoading(false);
```

};

const generate = () => {
if (!input.trim() && !img) {
setOutput(‘❌ الرجاء كتابة وصف أو رفع صورة’);
return;
}
setTranslated(false);
const desc = input.trim() || ‘elegant fashion design from uploaded image’;
let result = ‘’;
if (tab === ‘design’) {
if (promptLength === ‘short’) {
result = `${desc}, elegant Arabian model, dark wavy hair, olive skin, palace ballroom, crystal chandeliers, golden lighting, Vogue style, 8K --ar ${ratio} --v 6.1 --s 750`;
} else if (promptLength === ‘medium’) {
result = `Haute couture: ${desc}. Elegant Arabian model with long dark wavy hair, warm olive skin, standing in luxurious palace ballroom. Crystal chandeliers, soft golden lighting, shallow depth of field, dreamy bokeh. Vogue Arabia editorial, 8K, Hasselblad quality. --ar ${ratio} --v 6.1 --style raw --s 750`;
} else {
result = `Professional haute couture fashion photography: ${desc}\n\nSubject: Breathtakingly elegant Arabian woman with long, lustrous dark wavy hair cascading over shoulders, warm olive skin with natural glow, striking almond-shaped eyes, perfectly defined brows, subtle rose lip makeup, wearing exquisite diamond drop earrings.\n\nSetting: Opulent grand palace ballroom with soaring gilded ceilings, magnificent multi-tiered crystal chandeliers, ornate baroque architectural details, polished cream marble floors with subtle reflections, soft pink roses arrangements.\n\nLighting: Cinematic three-point setup - soft key light from 45°, gentle fill, warm rim light creating subtle halo. Golden hour warmth, diffused quality.\n\nTechnical: Hasselblad H6D-100c, 85mm f/1.4 lens, shallow DOF, creamy bokeh, 8K resolution, Kodak Portra color science.\n\nStyle: Vogue Arabia cover, Harper's Bazaar aesthetic, Dior campaign quality.\n\n--ar ${ratio} --v 6.1 --style raw --s 750 --q 2`;
}
} else if (tab === ‘video’) {
if (promptLength === ‘short’) {
result = `Fashion video: ${desc}, Arabian model walking in palace, golden lighting, flowing fabric, 4K cinematic --ar ${ratio}`;
} else if (promptLength === ‘medium’) {
result = `Cinematic fashion film: ${desc}. Elegant Arabian model with flowing dark hair walks through marble palace corridor. Golden hour lighting, tracking shot, fabric flowing with each step. 4K, 24fps, Dior campaign style. --ar ${ratio}`;
} else {
result = `Cinematic luxury fashion film: ${desc}\n\n[0-3s] OPENING: Extreme macro on intricate fabric texture, beading catches light, slow pan across hand-sewn embellishments.\n\n[3-7s] THE REVEAL: Camera pulls back smoothly revealing elegant Arabian model, long flowing dark hair, standing in dramatic backlit pose.\n\n[7-12s] THE WALK: Tracking shot follows model walking through ornate marble palace corridor, golden hour light streaming through arched windows, fabric flowing elegantly with each confident step.\n\n[12-15s] THE MOMENT: Model pauses, slight turn toward camera, subtle knowing smile, light catches jewelry.\n\nTechnical: 4K RED camera, 24fps cinematic, 85mm lens, shallow DOF, warm golden color grade, Dior/Chanel campaign aesthetic.\n\n--ar ${ratio}`;
}
} else if (tab === ‘marketing’) {
if (platform === ‘reel’) {
result = `🎬 INSTAGRAM REEL\n\n⚡ HOOK (0-3s):\n"الفستان اللي كل البنات سألوني عنه 👀✨"\n\n🎥 CONTENT (3-25s):\n• Close-up على تفاصيل القماش والتطريز\n• الكشف عن التصميم كامل مع دوران بطيء\n• لقطات حركة تُظهر انسيابية القماش\n\n🎯 CTA (25-30s):\n"احجزي قبل نفاذ الكمية! الرابط بالبايو 💫"\n\n📝 CAPTION:\n${desc} ✨\nتصميم حصري بلمسة راقية 💎\n📏 المقاسات: XS - XL\n🚚 توصيل لجميع الدول\n💌 للطلب: DM أو الرابط بالبايو\n\n#fashion #dress #elegant #فاشن #أزياء #فستان #GHFashion`;
} else if (platform === ‘tiktok’) {
result = `🎬 TIKTOK\n\n⚡ HOOK (0-2s):\n"POV: لقيتي فستان أحلامك 😍"\n\n🎥 FORMAT:\n• GRWM - تجهيز ولبس التصميم\n• أو Transformation قبل/بعد\n• Quick cuts مع beat drops\n\n🎯 CTA:\n"فولو لمزيد من التصاميم! 💕"\n\n📝 CAPTION:\n${desc} ✨\nالرابط بالبايو 🔗\n\n#fyp #viral #fashion #ootd #فاشن #تيكتوك #GHFashion`;
} else if (platform === ‘story’) {
result = `📱 INSTAGRAM STORIES\n\n1️⃣ صورة blurred + "شي جديد قادم 👀"\n2️⃣ الكشف: ${desc} ✨\n3️⃣ تفاصيل Close-up 😍\n4️⃣ Poll: "شو رأيكم؟" 🔥/😍\n5️⃣ المقاسات والألوان المتوفرة\n6️⃣ Question box للأسئلة\n7️⃣ CTA: "للطلب راسليني 💌"`;
} else if (platform === ‘post’) {
result = `📸 INSTAGRAM POST\n\n🖼️ CAROUSEL:\n1. Hero shot - التصميم كامل\n2. On model - من الأمام\n3. Details - تفاصيل قريبة\n4. Back view - من الخلف\n5. معلومات الطلب\n\n📝 CAPTION:\n${desc} ✨\n\nحين تلتقي الأناقة بالفخامة... 💫\n\n✨ المميزات:\n• قماش فاخر عالي الجودة\n• تطريز يدوي دقيق\n• قصة مصممة بعناية\n\n📏 المقاسات: XS - XL\n💌 للطلب: DM أو الرابط بالبايو\n\n#fashion #dress #elegant #فاشن #أزياء #GHFashion`;
} else if (platform === ‘story_marketing’) {
result = `📖 قصة تسويقية\n\nفي ليلة لا تُنسى...\nحين تدخلين القاعة، تتوقف الأنظار ✨\n\n${desc}\n\nليس مجرد قماش وخيوط...\nبل حكاية أناقة تُروى بكل تفصيلة 💫\n\nصُنع بحب، لتشعري بالتميز\nلأنكِ تستحقين الأفضل 👑\n\nGH Fashion\nحيث تبدأ قصتك ✨`;
}
} else if (tab === ‘generate’) {
if (promptLength === ‘short’) {
result = `${desc}, Arabian model, dark hair, olive skin, palace, chandeliers, golden light, 8K --ar ${ratio} --v 6.1`;
} else if (promptLength === ‘medium’) {
result = `${desc}, stunning Arabian model with long dark wavy hair, olive skin, grand palace ballroom, crystal chandeliers, soft golden lighting, shallow DOF, bokeh, Vogue editorial, 8K --ar ${ratio} --v 6.1 --style raw --s 750`;
} else {
result = `Ultimate fashion image prompt: ${desc}\n\nStunning Arabian model, long lustrous dark wavy hair, warm olive glowing skin, elegant pose in grand palace ballroom, magnificent crystal chandeliers, soft golden ambient lighting, shallow depth of field, dreamy creamy bokeh, Vogue Arabia editorial quality, Hasselblad medium format, 8K ultra resolution, luxury fashion campaign aesthetic.\n\nNegative prompt: ugly, deformed, blurry, bad anatomy, extra limbs, low quality, watermark, text, amateur lighting\n\n--ar ${ratio} --v 6.1 --style raw --s 750 --q 2`;
}
}
setOutput(result);
};

if (!started) {
return (
<div style={{ minHeight: ‘100vh’, background: ‘#FDF8F5’, padding: ‘20px’, fontFamily: ‘system-ui’, direction: ‘rtl’ }}>
<div style={{ maxWidth: ‘400px’, margin: ‘0 auto’, textAlign: ‘center’, paddingTop: ‘40px’ }}>
<div style={{ width: ‘80px’, height: ‘80px’, margin: ‘0 auto 20px’, background: `linear-gradient(135deg, #D4AF91, ${gold})`, borderRadius: ‘50%’, display: ‘flex’, alignItems: ‘center’, justifyContent: ‘center’ }}>
<span style={{ fontSize: ‘28px’, color: ‘#fff’, fontWeight: ‘700’ }}>GH</span>
</div>
<h1 style={{ fontSize: ‘1.8rem’, color: gold, marginBottom: ‘10px’ }}>AI Fashion Creator</h1>
<p style={{ color: ‘#9D8B7A’, marginBottom: ‘30px’ }}>أداة توليد برومبتات الأزياء الاحترافية</p>
<div style={{ display: ‘flex’, flexDirection: ‘column’, gap: ‘12px’, marginBottom: ‘20px’ }}>
{[{ name: ‘الأساسية’, images: 100, prompts: 200, price: 15 }, { name: ‘الاحترافية’, images: 250, prompts: 500, price: 35 }, { name: ‘اللامحدودة’, images: 600, prompts: 1200, price: 75 }].map((p, i) => (
<div key={i} onClick={() => setStarted(true)} style={{ padding: ‘16px’, background: ‘white’, borderRadius: ‘16px’, cursor: ‘pointer’, border: ‘2px solid rgba(201,160,120,0.2)’ }}>
<div style={{ display: ‘flex’, justifyContent: ‘space-between’, alignItems: ‘center’ }}>
<div style={{ textAlign: ‘right’ }}>
<h3 style={{ color: gold, marginBottom: ‘4px’ }}>{p.name}</h3>
<p style={{ color: ‘#8D7D6D’, fontSize: ‘0.8rem’ }}>🎨 {p.images} صورة • ✨ {p.prompts} برومبت</p>
</div>
<span style={{ color: gold, fontWeight: ‘700’, fontSize: ‘1.3rem’ }}>${p.price}</span>
</div>
</div>
))}
</div>
</div>
</div>
);
}

return (
<div style={{ minHeight: ‘100vh’, background: ‘#FDF8F5’, padding: ‘16px’, fontFamily: ‘system-ui’, direction: ‘rtl’ }}>
<div style={{ maxWidth: ‘600px’, margin: ‘0 auto’ }}>
<header style={{ textAlign: ‘center’, marginBottom: ‘16px’ }}>
<div style={{ width: ‘50px’, height: ‘50px’, margin: ‘0 auto 8px’, background: `linear-gradient(135deg, #D4AF91, ${gold})`, borderRadius: ‘50%’, display: ‘flex’, alignItems: ‘center’, justifyContent: ‘center’ }}>
<span style={{ fontSize: ‘18px’, color: ‘#fff’, fontWeight: ‘700’ }}>GH</span>
</div>
<h1 style={{ fontSize: ‘1.2rem’, color: gold }}>AI Fashion Creator</h1>
</header>
<div style={{ display: ‘flex’, gap: ‘6px’, justifyContent: ‘center’, flexWrap: ‘wrap’, marginBottom: ‘14px’ }}>
{[{ id: ‘design’, label: ‘✨ تصميم’ }, { id: ‘video’, label: ‘🎬 فيديو’ }, { id: ‘marketing’, label: ‘📱 تسويقي’ }, { id: ‘generate’, label: ‘🎨 صورة’ }].map(t => (
<button key={t.id} onClick={() => { setTab(t.id); setOutput(’’); setGeneratedImg(null); }} style={{ padding: ‘10px 14px’, borderRadius: ‘20px’, cursor: ‘pointer’, border: tab === t.id ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: tab === t.id ? `linear-gradient(135deg, #D4AF91, ${gold})` : ‘white’, color: tab === t.id ? ‘#fff’ : ‘#9D8B7A’, fontWeight: ‘600’, fontSize: ‘0.85rem’ }}>{t.label}</button>
))}
</div>
<div style={{ background: ‘white’, borderRadius: ‘20px’, padding: ‘18px’, boxShadow: ‘0 4px 20px rgba(201,160,120,0.1)’ }}>
{(tab === ‘design’ || tab === ‘video’ || tab === ‘generate’) && (
<div style={{ marginBottom: ‘14px’ }}>
<label style={{ display: ‘block’, marginBottom: ‘6px’, color: ‘#8D7D6D’, fontSize: ‘0.85rem’ }}>📐 الأبعاد</label>
<div style={{ display: ‘flex’, gap: ‘8px’, justifyContent: ‘center’ }}>
{[‘1:1’, ‘9:16’, ‘16:9’].map(r => (<button key={r} onClick={() => setRatio(r)} style={{ padding: ‘8px 18px’, borderRadius: ‘12px’, cursor: ‘pointer’, border: ratio === r ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: ratio === r ? gold : ‘white’, color: ratio === r ? ‘#fff’ : ‘#9D8B7A’, fontWeight: ‘500’ }}>{r}</button>))}
</div>
</div>
)}
{(tab === ‘design’ || tab === ‘video’ || tab === ‘generate’) && (
<div style={{ marginBottom: ‘14px’ }}>
<label style={{ display: ‘block’, marginBottom: ‘6px’, color: ‘#8D7D6D’, fontSize: ‘0.85rem’ }}>📝 طول البرومبت</label>
<div style={{ display: ‘flex’, gap: ‘8px’, justifyContent: ‘center’ }}>
{[{ id: ‘short’, label: ‘قصير’ }, { id: ‘medium’, label: ‘متوسط’ }, { id: ‘pro’, label: ‘احترافي’ }].map(p => (<button key={p.id} onClick={() => setPromptLength(p.id)} style={{ padding: ‘8px 16px’, borderRadius: ‘12px’, cursor: ‘pointer’, border: promptLength === p.id ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: promptLength === p.id ? gold : ‘white’, color: promptLength === p.id ? ‘#fff’ : ‘#9D8B7A’, fontWeight: ‘500’, fontSize: ‘0.85rem’ }}>{p.label}</button>))}
</div>
</div>
)}
{tab === ‘marketing’ && (
<div style={{ marginBottom: ‘14px’ }}>
<label style={{ display: ‘block’, marginBottom: ‘6px’, color: ‘#8D7D6D’, fontSize: ‘0.85rem’ }}>📱 المنصة</label>
<div style={{ display: ‘flex’, gap: ‘6px’, justifyContent: ‘center’, flexWrap: ‘wrap’ }}>
{[{ id: ‘reel’, l: ‘Reel’ }, { id: ‘tiktok’, l: ‘TikTok’ }, { id: ‘story’, l: ‘Story’ }, { id: ‘post’, l: ‘Post’ }, { id: ‘story_marketing’, l: ‘قصة’ }].map(p => (<button key={p.id} onClick={() => setPlatform(p.id)} style={{ padding: ‘7px 12px’, borderRadius: ‘12px’, cursor: ‘pointer’, border: platform === p.id ? ‘none’ : ‘1px solid rgba(201,160,120,0.3)’, background: platform === p.id ? gold : ‘white’, color: platform === p.id ? ‘#fff’ : ‘#9D8B7A’, fontSize: ‘0.8rem’ }}>{p.l}</button>))}
</div>
</div>
)}
<div style={{ marginBottom: ‘14px’ }}>
<label style={{ display: ‘block’, marginBottom: ‘6px’, color: ‘#8D7D6D’, fontSize: ‘0.85rem’ }}>🖼️ رفع صورة (اختياري)</label>
<input type=“file” id=“fileInput” onChange={handleUpload} accept=“image/*” style={{ display: ‘none’ }} />
{!img ? (
<div onClick={() => document.getElementById(‘fileInput’).click()} style={{ border: ‘2px dashed rgba(201,160,120,0.4)’, borderRadius: ‘12px’, padding: ‘20px’, textAlign: ‘center’, cursor: ‘pointer’, background: ‘#FDFAF7’ }}>
<span style={{ fontSize: ‘2rem’ }}>📷</span>
<p style={{ color: ‘#B8A090’, fontSize: ‘0.8rem’, marginTop: ‘6px’ }}>اضغطي لرفع صورة</p>
</div>
) : (
<div style={{ display: ‘flex’, alignItems: ‘center’, gap: ‘10px’, padding: ‘10px’, background: ‘#FDFAF7’, borderRadius: ‘12px’ }}>
<img src={img} alt=”” style={{ width: ‘50px’, height: ‘50px’, objectFit: ‘cover’, borderRadius: ‘8px’ }} />
<span style={{ flex: 1, color: ‘#6D5D4D’, fontSize: ‘0.8rem’ }}>✅ {imgName}</span>
<button onClick={() => { setImg(null); setImgName(’’); }} style={{ padding: ‘6px 12px’, background: ‘rgba(200,80,80,0.1)’, border: ‘none’, borderRadius: ‘8px’, cursor: ‘pointer’, color: ‘#c55’, fontSize: ‘0.8rem’ }}>✕</button>
</div>
)}
</div>
<div style={{ marginBottom: ‘14px’ }}>
<label style={{ display: ‘block’, marginBottom: ‘6px’, color: ‘#8D7D6D’, fontSize: ‘0.85rem’ }}>✏️ وصف التصميم</label>
<textarea value={input} onChange={e => setInput(e.target.value)} placeholder=“مثال: فستان سهرة ذهبي مع تطريز يدوي وأكمام طويلة…” style={{ width: ‘100%’, padding: ‘12px’, borderRadius: ‘12px’, fontSize: ‘0.9rem’, border: ‘1px solid rgba(201,160,120,0.3)’, background: ‘#FDFAF7’, outline: ‘none’, minHeight: ‘80px’, resize: ‘vertical’, fontFamily: ‘inherit’, boxSizing: ‘border-box’ }} />
</div>
{tab === ‘generate’ ? (
<button onClick={generateImage} disabled={loading} style={{ width: ‘100%’, padding: ‘14px’, background: loading ? ‘#aaa’ : `linear-gradient(135deg, #D4AF91, ${gold})`, color: ‘#fff’, border: ‘none’, borderRadius: ‘14px’, fontSize: ‘1rem’, fontWeight: ‘600’, cursor: loading ? ‘not-allowed’ : ‘pointer’ }}>
{loading ? ‘⏳ جاري التوليد…’ : ‘🎨 ولّدي الصورة’}
</button>
) : (
<button onClick={generate} style={{ width: ‘100%’, padding: ‘14px’, background: `linear-gradient(135deg, #D4AF91, ${gold})`, color: ‘#fff’, border: ‘none’, borderRadius: ‘14px’, fontSize: ‘1rem’, fontWeight: ‘600’, cursor: ‘pointer’ }}>✨ استخرجي البرومبت</button>
)}
{generatedImg && (
<div style={{ marginTop: ‘16px’, textAlign: ‘center’ }}>
<img src={generatedImg} alt=“Generated” style={{ maxWidth: ‘100%’, borderRadius: ‘12px’, marginBottom: ‘10px’ }} />
<a href={generatedImg} download=“gh-fashion.png” style={{ display: ‘inline-block’, padding: ‘10px 20px’, background: gold, color: ‘#fff’, borderRadius: ‘10px’, textDecoration: ‘none’, fontSize: ‘0.9rem’ }}>📥 تحميل الصورة</a>
</div>
)}
{output && (
<div style={{ marginTop: ‘16px’, padding: ‘14px’, background: ‘#FDFAF7’, borderRadius: ‘14px’, border: ‘1px solid rgba(201,160,120,0.15)’ }}>
<div style={{ display: ‘flex’, justifyContent: ‘space-between’, alignItems: ‘center’, marginBottom: ‘10px’ }}>
<span style={{ color: gold, fontSize: ‘0.9rem’, fontWeight: ‘600’ }}>📋 النتيجة</span>
<div style={{ display: ‘flex’, gap: ‘6px’ }}>
{(tab === ‘design’ || tab === ‘video’ || tab === ‘generate’) && (<button onClick={translate} disabled={translated} style={{ padding: ‘6px 12px’, background: translated ? ‘#aaa’ : ‘#5A9A9A’, border: ‘none’, borderRadius: ‘8px’, cursor: translated ? ‘not-allowed’ : ‘pointer’, fontSize: ‘0.8rem’, color: ‘#fff’ }}>🌐 {translated ? ‘تمت الترجمة’ : ‘ترجمة’}</button>)}
<button onClick={copy} style={{ padding: ‘6px 14px’, background: copied ? ‘#7CB07C’ : gold, border: ‘none’, borderRadius: ‘8px’, cursor: ‘pointer’, fontSize: ‘0.8rem’, color: ‘#fff’ }}>{copied ? ‘✅ تم النسخ’ : ‘📋 نسخ’}</button>
</div>
</div>
<div style={{ background: ‘white’, padding: ‘12px’, borderRadius: ‘10px’, fontSize: ‘0.85rem’, lineHeight: ‘1.8’, color: ‘#5D4D3D’, whiteSpace: ‘pre-wrap’, maxHeight: ‘300px’, overflowY: ‘auto’ }}>{output}</div>
</div>
)}
</div>
<footer style={{ textAlign: ‘center’, marginTop: ‘16px’, color: ‘#B8A090’, fontSize: ‘0.75rem’ }}>Made with 💕 by <span style={{ color: gold }}>GH Fashion</span></footer>
</div>
</div>
);
}
