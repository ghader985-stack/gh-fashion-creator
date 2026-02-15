import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [activeTab, setActiveTab] = useState('design');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [arabicPrompt, setArabicPrompt] = useState('');
  const [showArabic, setShowArabic] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const [designStyle, setDesignStyle] = useState('elegant');
  const [designCategory, setDesignCategory] = useState('dress');
  const [designColor, setDesignColor] = useState('black');
  const [designFabric, setDesignFabric] = useState('silk');
  const [designSeason, setDesignSeason] = useState('spring-summer');
  const [designOccasion, setDesignOccasion] = useState('evening');
  const [designDetails, setDesignDetails] = useState('');

  const [videoType, setVideoType] = useState('runway');
  const [videoMood, setVideoMood] = useState('dramatic');
  const [videoCamera, setVideoCamera] = useState('slow-pan');
  const [videoLighting, setVideoLighting] = useState('studio');
  const [videoDuration, setVideoDuration] = useState('15');
  const [videoDetails, setVideoDetails] = useState('');

  const [marketingPlatform, setMarketingPlatform] = useState('instagram-reel');
  const [marketingTone, setMarketingTone] = useState('luxury');
  const [marketingGoal, setMarketingGoal] = useState('awareness');
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [marketingCTA, setMarketingCTA] = useState('shop-now');

  const [imagePrompt, setImagePrompt] = useState('');

  const styles = [
    { id: 'elegant', en: 'Elegant', ar: 'أنيق' },
    { id: 'casual', en: 'Casual', ar: 'كاجوال' },
    { id: 'streetwear', en: 'Streetwear', ar: 'ستريت وير' },
    { id: 'haute-couture', en: 'Haute Couture', ar: 'هوت كوتور' },
    { id: 'minimalist', en: 'Minimalist', ar: 'مينيمالست' },
    { id: 'bohemian', en: 'Bohemian', ar: 'بوهيمي' },
    { id: 'sporty', en: 'Sporty', ar: 'رياضي' },
    { id: 'vintage', en: 'Vintage', ar: 'فينتج' },
    { id: 'avant-garde', en: 'Avant-Garde', ar: 'أفانت غارد' },
    { id: 'romantic', en: 'Romantic', ar: 'رومانسي' },
  ];

  const categories = [
    { id: 'dress', en: 'Dress', ar: 'فستان' },
    { id: 'suit', en: 'Suit', ar: 'بدلة' },
    { id: 'jacket', en: 'Jacket', ar: 'جاكيت' },
    { id: 'pants', en: 'Pants', ar: 'بنطلون' },
    { id: 'skirt', en: 'Skirt', ar: 'تنورة' },
    { id: 'blouse', en: 'Blouse', ar: 'بلوزة' },
    { id: 'coat', en: 'Coat', ar: 'معطف' },
    { id: 'abaya', en: 'Abaya', ar: 'عباية' },
    { id: 'kaftan', en: 'Kaftan', ar: 'قفطان' },
    { id: 'jumpsuit', en: 'Jumpsuit', ar: 'جمبسوت' },
  ];

  const colors = [
    { id: 'black', en: 'Black', hex: '#000000' },
    { id: 'white', en: 'White', hex: '#FFFFFF' },
    { id: 'red', en: 'Red', hex: '#DC2626' },
    { id: 'navy', en: 'Navy Blue', hex: '#1E3A5F' },
    { id: 'emerald', en: 'Emerald', hex: '#059669' },
    { id: 'gold', en: 'Gold', hex: '#D4AF37' },
    { id: 'burgundy', en: 'Burgundy', hex: '#722F37' },
    { id: 'blush', en: 'Blush Pink', hex: '#FEC5BB' },
    { id: 'royal-blue', en: 'Royal Blue', hex: '#4169E1' },
    { id: 'champagne', en: 'Champagne', hex: '#F7E7CE' },
  ];

  const fabrics = [
    { id: 'silk', en: 'Silk', ar: 'حرير' },
    { id: 'velvet', en: 'Velvet', ar: 'مخمل' },
    { id: 'cotton', en: 'Cotton', ar: 'قطن' },
    { id: 'linen', en: 'Linen', ar: 'كتان' },
    { id: 'leather', en: 'Leather', ar: 'جلد' },
    { id: 'satin', en: 'Satin', ar: 'ساتان' },
    { id: 'chiffon', en: 'Chiffon', ar: 'شيفون' },
    { id: 'lace', en: 'Lace', ar: 'دانتيل' },
    { id: 'tweed', en: 'Tweed', ar: 'تويد' },
    { id: 'organza', en: 'Organza', ar: 'أورجانزا' },
  ];

  const seasons = [
    { id: 'spring-summer', en: 'Spring/Summer', ar: 'ربيع/صيف' },
    { id: 'fall-winter', en: 'Fall/Winter', ar: 'خريف/شتاء' },
    { id: 'resort', en: 'Resort', ar: 'ريزورت' },
    { id: 'pre-fall', en: 'Pre-Fall', ar: 'ما قبل الخريف' },
  ];

  const occasions = [
    { id: 'evening', en: 'Evening/Gala', ar: 'سهرة' },
    { id: 'casual', en: 'Casual', ar: 'يومي' },
    { id: 'formal', en: 'Formal/Business', ar: 'رسمي' },
    { id: 'wedding', en: 'Wedding', ar: 'زفاف' },
    { id: 'party', en: 'Party', ar: 'حفلة' },
    { id: 'cocktail', en: 'Cocktail', ar: 'كوكتيل' },
  ];

  const videoTypes = [
    { id: 'runway', en: 'Runway Show', ar: 'عرض أزياء' },
    { id: 'lookbook', en: 'Lookbook', ar: 'لوك بوك' },
    { id: 'product', en: 'Product Showcase', ar: 'عرض منتج' },
    { id: 'behind-scenes', en: 'Behind The Scenes', ar: 'خلف الكواليس' },
    { id: 'transformation', en: 'Transformation', ar: 'تحول' },
    { id: 'styling', en: 'Styling Tips', ar: 'نصائح تنسيق' },
  ];

  const videoMoods = [
    { id: 'dramatic', en: 'Dramatic', ar: 'درامي' },
    { id: 'elegant', en: 'Elegant', ar: 'راقي' },
    { id: 'energetic', en: 'Energetic', ar: 'حيوي' },
    { id: 'romantic', en: 'Romantic', ar: 'رومانسي' },
    { id: 'mysterious', en: 'Mysterious', ar: 'غامض' },
    { id: 'minimalist', en: 'Minimalist', ar: 'بسيط' },
  ];

  const cameraMoves = [
    { id: 'slow-pan', en: 'Slow Pan', ar: 'تحريك بطيء' },
    { id: '360-rotation', en: '360° Rotation', ar: 'دوران 360°' },
    { id: 'zoom-in', en: 'Zoom In', ar: 'تقريب' },
    { id: 'tracking', en: 'Tracking Shot', ar: 'تتبع' },
    { id: 'dolly', en: 'Dolly Movement', ar: 'دولي' },
    { id: 'crane', en: 'Crane Shot', ar: 'رافعة' },
  ];

  const lightingTypes = [
    { id: 'studio', en: 'Studio Lighting', ar: 'استديو' },
    { id: 'natural', en: 'Natural Light', ar: 'طبيعي' },
    { id: 'dramatic', en: 'Dramatic Shadows', ar: 'ظلال درامية' },
    { id: 'golden-hour', en: 'Golden Hour', ar: 'الساعة الذهبية' },
    { id: 'neon', en: 'Neon Lights', ar: 'نيون' },
    { id: 'soft', en: 'Soft Diffused', ar: 'ناعم' },
  ];

  const platforms = [
    { id: 'instagram-reel', en: 'Instagram Reel', ar: 'ريل انستغرام' },
    { id: 'instagram-post', en: 'Instagram Post', ar: 'بوست انستغرام' },
    { id: 'instagram-story', en: 'Instagram Story', ar: 'ستوري انستغرام' },
    { id: 'tiktok', en: 'TikTok', ar: 'تيك توك' },
    { id: 'facebook', en: 'Facebook', ar: 'فيسبوك' },
    { id: 'pinterest', en: 'Pinterest', ar: 'بنترست' },
  ];

  const tones = [
    { id: 'luxury', en: 'Luxury', ar: 'فاخر' },
    { id: 'friendly', en: 'Friendly', ar: 'ودي' },
    { id: 'professional', en: 'Professional', ar: 'احترافي' },
    { id: 'playful', en: 'Playful', ar: 'مرح' },
    { id: 'urgent', en: 'Urgent', ar: 'عاجل' },
    { id: 'inspiring', en: 'Inspiring', ar: 'ملهم' },
  ];

  const goals = [
    { id: 'awareness', en: 'Brand Awareness', ar: 'زيادة الوعي' },
    { id: 'sales', en: 'Drive Sales', ar: 'زيادة المبيعات' },
    { id: 'engagement', en: 'Engagement', ar: 'زيادة التفاعل' },
    { id: 'launch', en: 'Product Launch', ar: 'إطلاق منتج' },
    { id: 'promotion', en: 'Promotion/Sale', ar: 'عرض/خصم' },
  ];

  const ctas = [
    { id: 'shop-now', en: 'Shop Now', ar: 'تسوق الآن' },
    { id: 'learn-more', en: 'Learn More', ar: 'اعرف أكثر' },
    { id: 'link-bio', en: 'Link in Bio', ar: 'الرابط في البايو' },
    { id: 'dm', en: 'DM to Order', ar: 'راسلنا للطلب' },
    { id: 'limited', en: 'Limited Stock', ar: 'كمية محدودة' },
  ];

  const translateToArabic = (text) => {
    const t = { 'elegant': 'أنيق', 'casual': 'كاجوال', 'haute couture': 'هوت كوتور', 'dress': 'فستان', 'suit': 'بدلة', 'jacket': 'جاكيت', 'black': 'أسود', 'white': 'أبيض', 'red': 'أحمر', 'gold': 'ذهبي', 'silk': 'حرير', 'velvet': 'مخمل', 'satin': 'ساتان', 'evening': 'سهرة', 'wedding': 'زفاف', 'runway': 'عرض أزياء', 'dramatic': 'درامي', 'professional': 'احترافي', 'luxury': 'فاخر', 'fashion': 'أزياء', 'high-end': 'راقي', 'spring': 'ربيع', 'summer': 'صيف', 'fall': 'خريف', 'winter': 'شتاء' };
    let r = text.toLowerCase();
    Object.keys(t).forEach(k => { r = r.replace(new RegExp(k, 'gi'), t[k]); });
    return r;
  };

  const generateDesignPrompt = () => {
    const style = styles.find(s => s.id === designStyle)?.en;
    const category = categories.find(c => c.id === designCategory)?.en;
    const color = colors.find(c => c.id === designColor)?.en;
    const fabric = fabrics.find(f => f.id === designFabric)?.en;
    const season = seasons.find(s => s.id === designSeason)?.en;
    const occasion = occasions.find(o => o.id === designOccasion)?.en;
    const prompt = `High-end fashion photography, ${style} ${color} ${fabric} ${category}, ${season} collection, perfect for ${occasion}. Professional runway model, Vogue magazine quality, studio lighting, 8K resolution, masterful tailoring, luxury brand aesthetic${designDetails ? `. ${designDetails}` : ''}.

--ar 3:4 --style raw --v 6.1

Negative: low quality, amateur, wrinkled, blurry`;
    setGeneratedPrompt(prompt);
    setArabicPrompt(translateToArabic(prompt));
  };

  const generateVideoPrompt = () => {
    const type = videoTypes.find(t => t.id === videoType)?.en;
    const mood = videoMoods.find(m => m.id === videoMood)?.en;
    const camera = cameraMoves.find(c => c.id === videoCamera)?.en;
    const lighting = lightingTypes.find(l => l.id === videoLighting)?.en;
    const prompt = `Cinematic fashion film, ${type} style, ${mood} atmosphere.

DURATION: ${videoDuration} seconds
CAMERA: ${camera} movement
LIGHTING: ${lighting}

Professional model showcasing haute couture, 4K cinematic, elegant fabric movement, fashion editorial quality.${videoDetails ? ` ${videoDetails}` : ''}

TECHNICAL: 24fps, 9:16 or 16:9`;
    setGeneratedPrompt(prompt);
    setArabicPrompt(translateToArabic(prompt));
  };

  const generateMarketingPrompt = () => {
    const platform = platforms.find(p => p.id === marketingPlatform)?.en;
    const tone = tones.find(t => t.id === marketingTone)?.ar;
    const cta = ctas.find(c => c.id === marketingCTA)?.en;
    const name = productName || '[Product Name]';
    const desc = productDesc || 'Luxury fashion piece';
    let content = '';

    if (marketingPlatform.includes('reel') || marketingPlatform === 'tiktok') {
      content = `📱 ${platform} SCRIPT - ${name}

⏱️ DURATION: 15-30 seconds

🎬 HOOK (0-3s): "Discover ultimate elegance" ${includeEmojis ? '✨' : ''}
🎬 SHOWCASE (3-12s): ${desc} - Show fabric details, model movement
🎬 CTA (12-15s): "${cta}" ${includeEmojis ? '🛍️' : ''}

🎵 MUSIC: Trending audio

${includeHashtags ? '#fashion #luxury #style #ootd #designer #trending #viral #fyp' : ''}`;
    } else if (marketingPlatform === 'instagram-post') {
      content = `📸 INSTAGRAM POST - ${name}

${includeEmojis ? '✨' : ''} ${name}

${desc}

${includeEmojis ? '💫' : ''} FEATURES:
- Premium quality materials
- Elegant design
- Perfect for any occasion

${includeEmojis ? '🛍️' : ''} ${cta}

${includeHashtags ? '#fashion #style #luxury #designer #ootd #newcollection' : ''}`;
    } else if (marketingPlatform === 'instagram-story') {
      content = `📱 STORY SEQUENCE - ${name}

STORY 1: Teaser - blurred image + "Something special..." ${includeEmojis ? '👀' : ''}
STORY 2: Reveal - full product + "${name}" ${includeEmojis ? '✨' : ''}
STORY 3: Details - close-ups + Poll sticker
STORY 4: CTA - "${cta}" + link sticker ${includeEmojis ? '🛍️' : ''}`;
    } else {
      content = `📝 ${platform} - ${name}\n\n${includeEmojis ? '✨' : ''} ${name}\n${desc}\n\n${includeEmojis ? '🛍️' : ''} ${cta}\n\n${includeHashtags ? '#fashion #style #luxury' : ''}`;
    }
    setGeneratedPrompt(content);
    setArabicPrompt(content.replace('Discover ultimate elegance', 'اكتشفي الأناقة المطلقة').replace('Shop Now', 'تسوق الآن').replace('FEATURES:', 'المميزات:').replace('Premium quality materials', 'خامات فاخرة').replace('Elegant design', 'تصميم أنيق').replace('Perfect for any occasion', 'مناسب لجميع المناسبات'));
  };

  const handleGenerate = () => {
    if (activeTab === 'design') generateDesignPrompt();
    else if (activeTab === 'video') generateVideoPrompt();
    else if (activeTab === 'marketing') generateMarketingPrompt();
  };

  const generateImage = async () => {
    const promptToUse = activeTab === 'generate' ? imagePrompt : generatedPrompt;
    if (!promptToUse) { setError('Please enter or generate a prompt first'); return; }
    setIsGenerating(true); setError(null);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToUse }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setGeneratedImage(data.image);
    } catch (err) { setError(err.message || 'Failed to generate image'); }
    finally { setIsGenerating(false); }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(showArabic ? arabicPrompt : generatedPrompt);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const gold = '#D4AF37';
  const btnStyle = (active) => ({ padding: '12px 16px', background: active ? `linear-gradient(135deg, ${gold}, #F4E4BA)` : 'rgba(255,255,255,0.05)', border: active ? 'none' : `1px solid ${gold}40`, borderRadius: '8px', color: active ? '#0a0a0a' : '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' });
  const inputStyle = { width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${gold}40`, borderRadius: '8px', color: '#fff', fontSize: '14px' };
  const sectionStyle = { background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', border: `1px solid ${gold}30` };

  return (
    <>
      <Head>
        <title>AI Fashion Creator - GH Fashion</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)', fontFamily: 'Montserrat, sans-serif', color: '#fff' }}>
        <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${gold}30`, background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '45px', height: '45px', background: `linear-gradient(135deg, ${gold}, #F4E4BA)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', color: '#0a0a0a' }}>GH</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '600', fontFamily: 'Playfair Display, serif' }}>AI Fashion Creator</h1>
              <p style={{ margin: 0, fontSize: '10px', color: gold, letterSpacing: '2px', textTransform: 'uppercase' }}>Professional Prompt Generator</p>
            </div>
          </div>
        </header>

        <nav style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '25px', flexWrap: 'wrap' }}>
          {[{ id: 'design', icon: '🎨', label: 'Design' }, { id: 'video', icon: '🎬', label: 'Video' }, { id: 'marketing', icon: '📱', label: 'Marketing' }, { id: 'generate', icon: '✨', label: 'Generate' }, { id: 'pricing', icon: '💎', label: 'Pricing' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '12px 25px', background: activeTab === tab.id ? `linear-gradient(135deg, ${gold}, #F4E4BA)` : 'rgba(255,255,255,0.05)', border: activeTab === tab.id ? 'none' : `1px solid ${gold}50`, borderRadius: '25px', color: activeTab === tab.id ? '#0a0a0a' : '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <main style={{ padding: '30px 40px', maxWidth: '1300px', margin: '0 auto' }}>

          {activeTab === 'design' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div style={sectionStyle}>
                <h2 style={{ color: gold, marginBottom: '25px', fontFamily: 'Playfair Display, serif', fontSize: '20px' }}>🎨 Design Prompt Generator</h2>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Style</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {styles.map(s => <button key={s.id} onClick={() => setDesignStyle(s.id)} style={btnStyle(designStyle === s.id)}>{s.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Category</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {categories.map(c => <button key={c.id} onClick={() => setDesignCategory(c.id)} style={btnStyle(designCategory === c.id)}>{c.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Color</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {colors.map(c => <button key={c.id} onClick={() => setDesignColor(c.id)} title={c.en} style={{ width: '36px', height: '36px', background: c.hex, border: designColor === c.id ? `3px solid ${gold}` : '2px solid rgba(255,255,255,0.3)', borderRadius: '50%', cursor: 'pointer' }} />)}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Fabric</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {fabrics.map(f => <button key={f.id} onClick={() => setDesignFabric(f.id)} style={btnStyle(designFabric === f.id)}>{f.ar}</button>)}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Season</label>
                    <select value={designSeason} onChange={(e) => setDesignSeason(e.target.value)} style={inputStyle}>
                      {seasons.map(s => <option key={s.id} value={s.id} style={{background:'#1a1a2e'}}>{s.ar}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Occasion</label>
                    <select value={designOccasion} onChange={(e) => setDesignOccasion(e.target.value)} style={inputStyle}>
                      {occasions.map(o => <option key={o.id} value={o.id} style={{background:'#1a1a2e'}}>{o.ar}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Additional Details</label>
                  <textarea value={designDetails} onChange={(e) => setDesignDetails(e.target.value)} placeholder="e.g., gold embroidery, long sleeves..." style={{ ...inputStyle, height: '70px', resize: 'none' }} />
                </div>
                <button onClick={handleGenerate} style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg, ${gold}, #F4E4BA)`, border: 'none', borderRadius: '10px', color: '#0a0a0a', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>✨ GENERATE PROMPT</button>
              </div>
              <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ color: gold, fontFamily: 'Playfair Display, serif', margin: 0, fontSize: '20px' }}>📝 Generated Prompt</h2>
                  <button onClick={() => setShowArabic(!showArabic)} style={{ padding: '6px 15px', background: `${gold}30`, border: `1px solid ${gold}`, borderRadius: '15px', color: gold, cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>{showArabic ? '🇺🇸 EN' : '🇸🇦 AR'}</button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '20px', minHeight: '280px', border: `1px solid ${gold}20`, marginBottom: '15px' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'rgba(255,255,255,0.9)', fontSize: '12px', lineHeight: '1.7', direction: showArabic ? 'rtl' : 'ltr' }}>{showArabic ? arabicPrompt : generatedPrompt || 'Select options and click Generate...'}</pre>
                </div>
                {generatedPrompt && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={copyPrompt} style={{ flex: 1, padding: '14px', background: copied ? '#059669' : 'transparent', border: `2px solid ${gold}`, borderRadius: '8px', color: copied ? '#fff' : gold, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{copied ? '✓ Copied!' : '📋 Copy'}</button>
                    <button onClick={generateImage} disabled={isGenerating} style={{ flex: 1, padding: '14px', background: `linear-gradient(135deg, ${gold}, #F4E4BA)`, border: 'none', borderRadius: '8px', color: '#0a0a0a', cursor: 'pointer', fontSize: '13px', fontWeight: '600', opacity: isGenerating ? 0.7 : 1 }}>{isGenerating ? '⏳...' : '🖼️ Generate Image'}</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div style={sectionStyle}>
                <h2 style={{ color: gold, marginBottom: '25px', fontFamily: 'Playfair Display, serif', fontSize: '20px' }}>🎬 Video Prompt Generator</h2>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Video Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {videoTypes.map(t => <button key={t.id} onClick={() => setVideoType(t.id)} style={btnStyle(videoType === t.id)}>{t.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Mood</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {videoMoods.map(m => <button key={m.id} onClick={() => setVideoMood(m.id)} style={btnStyle(videoMood === m.id)}>{m.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Camera</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {cameraMoves.map(c => <button key={c.id} onClick={() => setVideoCamera(c.id)} style={btnStyle(videoCamera === c.id)}>{c.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Lighting</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {lightingTypes.map(l => <button key={l.id} onClick={() => setVideoLighting(l.id)} style={btnStyle(videoLighting === l.id)}>{l.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Duration: {videoDuration}s</label>
                  <input type="range" min="5" max="60" value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)} style={{ width: '100%', accentColor: gold }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Scene Details</label>
                  <textarea value={videoDetails} onChange={(e) => setVideoDetails(e.target.value)} placeholder="e.g., outdoor garden, wind effect..." style={{ ...inputStyle, height: '60px', resize: 'none' }} />
                </div>
                <button onClick={handleGenerate} style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg, ${gold}, #F4E4BA)`, border: 'none', borderRadius: '10px', color: '#0a0a0a', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>🎬 GENERATE PROMPT</button>
              </div>
              <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ color: gold, fontFamily: 'Playfair Display, serif', margin: 0, fontSize: '20px' }}>📝 Generated Prompt</h2>
                  <button onClick={() => setShowArabic(!showArabic)} style={{ padding: '6px 15px', background: `${gold}30`, border: `1px solid ${gold}`, borderRadius: '15px', color: gold, cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>{showArabic ? '🇺🇸 EN' : '🇸🇦 AR'}</button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '20px', minHeight: '350px', border: `1px solid ${gold}20`, marginBottom: '15px' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'rgba(255,255,255,0.9)', fontSize: '12px', lineHeight: '1.7', direction: showArabic ? 'rtl' : 'ltr' }}>{showArabic ? arabicPrompt : generatedPrompt || 'Select options and click Generate...'}</pre>
                </div>
                {generatedPrompt && <button onClick={copyPrompt} style={{ width: '100%', padding: '14px', background: copied ? '#059669' : 'transparent', border: `2px solid ${gold}`, borderRadius: '8px', color: copied ? '#fff' : gold, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{copied ? '✓ Copied!' : '📋 Copy Prompt'}</button>}
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div style={sectionStyle}>
                <h2 style={{ color: gold, marginBottom: '25px', fontFamily: 'Playfair Display, serif', fontSize: '20px' }}>📱 Marketing Content</h2>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Platform</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {platforms.map(p => <button key={p.id} onClick={() => setMarketingPlatform(p.id)} style={btnStyle(marketingPlatform === p.id)}>{p.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Tone</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {tones.map(t => <button key={t.id} onClick={() => setMarketingTone(t.id)} style={btnStyle(marketingTone === t.id)}>{t.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Goal</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {goals.map(g => <button key={g.id} onClick={() => setMarketingGoal(g.id)} style={btnStyle(marketingGoal === g.id)}>{g.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Product Name</label>
                  <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., Silk Evening Gown" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Description</label>
                  <textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="Product description..." style={{ ...inputStyle, height: '60px', resize: 'none' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>CTA</label>
                  <select value={marketingCTA} onChange={(e) => setMarketingCTA(e.target.value)} style={inputStyle}>
                    {ctas.map(c => <option key={c.id} value={c.id} style={{background:'#1a1a2e'}}>{c.ar}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={includeHashtags} onChange={(e) => setIncludeHashtags(e.target.checked)} style={{ accentColor: gold }} /> Hashtags
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={includeEmojis} onChange={(e) => setIncludeEmojis(e.target.checked)} style={{ accentColor: gold }} /> Emojis
                  </label>
                </div>
                <button onClick={handleGenerate} style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg, ${gold}, #F4E4BA)`, border: 'none', borderRadius: '10px', color: '#0a0a0a', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>📱 GENERATE CONTENT</button>
              </div>
              <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ color: gold, fontFamily: 'Playfair Display, serif', margin: 0, fontSize: '20px' }}>📝 Generated Content</h2>
                  <button onClick={() => setShowArabic(!showArabic)} style={{ padding: '6px 15px', background: `${gold}30`, border: `1px solid ${gold}`, borderRadius: '15px', color: gold, cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>{showArabic ? '🇺🇸 EN' : '🇸🇦 AR'}</button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '20px', minHeight: '380px', border: `1px solid ${gold}20`, marginBottom: '15px', overflowY: 'auto' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'rgba(255,255,255,0.9)', fontSize: '12px', lineHeight: '1.7', direction: showArabic ? 'rtl' : 'ltr' }}>{showArabic ? arabicPrompt : generatedPrompt || 'Select options and click Generate...'}</pre>
                </div>
                {generatedPrompt && <button onClick={copyPrompt} style={{ width: '100%', padding: '14px', background: copied ? '#059669' : 'transparent', border: `2px solid ${gold}`, borderRadius: '8px', color: copied ? '#fff' : gold, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{copied ? '✓ Copied!' : '📋 Copy Content'}</button>}
              </div>
            </div>
          )}

          {activeTab === 'generate' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div style={sectionStyle}>
                <h2 style={{ color: gold, marginBottom: '25px', fontFamily: 'Playfair Display, serif', fontSize: '20px' }}>✨ AI Image Generator</h2>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#F4E4BA', fontWeight: '600', fontSize: '13px' }}>Enter Prompt</label>
                  <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Describe the fashion image..." style={{ ...inputStyle, height: '150px', resize: 'none' }} />
                </div>
                {error && <div style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid #DC2626', borderRadius: '8px', padding: '12px', marginBottom: '15px', color: '#FCA5A5', fontSize: '13px' }}>⚠️ {error}</div>}
                <button onClick={generateImage} disabled={isGenerating || !imagePrompt} style={{ width: '100%', padding: '16px', background: isGenerating ? `${gold}80` : `linear-gradient(135deg, ${gold}, #F4E4BA)`, border: 'none', borderRadius: '10px', color: '#0a0a0a', fontSize: '15px', fontWeight: '700', cursor: isGenerating || !imagePrompt ? 'not-allowed' : 'pointer' }}>{isGenerating ? '⏳ Generating...' : '✨ GENERATE IMAGE'}</button>
              </div>
              <div style={sectionStyle}>
                <h2 style={{ color: gold, marginBottom: '20px', fontFamily: 'Playfair Display, serif', fontSize: '20px' }}>🖼️ Generated Image</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', minHeight: '350px', border: `2px dashed ${gold}40` }}>
                  {isGenerating ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: '50px', height: '50px', border: `3px solid ${gold}40`, borderTop: `3px solid ${gold}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }} />
                      <p style={{ color: gold, fontSize: '14px' }}>Generating...</p>
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                  ) : generatedImage ? (
                    <img src={generatedImage} alt="Generated" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                      <div style={{ fontSize: '40px', marginBottom: '10px' }}>👗</div>
                      <p style={{ fontSize: '13px' }}>Enter a prompt and click Generate</p>
                    </div>
                  )}
                </div>
                {generatedImage && <button onClick={() => window.open(generatedImage, '_blank')} style={{ marginTop: '15px', width: '100%', padding: '14px', background: 'transparent', border: `2px solid ${gold}`, borderRadius: '8px', color: gold, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>📥 Download Image</button>}
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', maxWidth: '900px', margin: '0 auto' }}>
              {[
                { name: 'Basic', nameAr: 'المبتدئ', images: 100, prompts: 200, price: 15 },
                { name: 'Pro', nameAr: 'المتوسط', images: 250, prompts: 500, price: 35, popular: true },
                { name: 'Unlimited', nameAr: 'الاحترافي', images: 600, prompts: 1200, price: 75 },
              ].map(plan => (
                <div key={plan.name} style={{ background: plan.popular ? `linear-gradient(135deg, ${gold}20, ${gold}10)` : 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '35px 25px', border: plan.popular ? `2px solid ${gold}` : `1px solid ${gold}30`, textAlign: 'center', position: 'relative', transform: plan.popular ? 'scale(1.05)' : 'none' }}>
                  {plan.popular && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${gold}, #F4E4BA)`, padding: '4px 16px', borderRadius: '15px', fontSize: '10px', fontWeight: '700', color: '#0a0a0a' }}>POPULAR</div>}
                  <h3 style={{ fontSize: '22px', color: gold, marginBottom: '5px', fontFamily: 'Playfair Display, serif' }}>{plan.name}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '15px', fontSize: '13px' }}>{plan.nameAr}</p>
                  <div style={{ fontSize: '42px', fontWeight: '700', marginBottom: '8px' }}>${plan.price}</div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '25px', fontSize: '13px' }}>{plan.images} images • {plan.prompts} prompts</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 25px 0', textAlign: 'left' }}>
                    {['Design Prompts', 'Video Prompts', 'Marketing Content', 'AI Image Generation'].map((f, i) => <li key={i} style={{ padding: '6px 0', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>✓ {f}</li>)}
                  </ul>
                  <button style={{ width: '100%', padding: '14px', background: plan.popular ? `linear-gradient(135deg, ${gold}, #F4E4BA)` : 'transparent', border: plan.popular ? 'none' : `2px solid ${gold}`, borderRadius: '8px', color: plan.popular ? '#0a0a0a' : gold, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>GET STARTED</button>
                </div>
              ))}
            </div>
          )}
        </main>

        <footer style={{ textAlign: 'center', padding: '25px', borderTop: `1px solid ${gold}20`, color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
          <p>© 2024 GH Fashion Creator. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
