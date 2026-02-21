import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [activeTab, setActiveTab] = useState('design');
  const [prompt, setPrompt] = useState('');
  const [promptAr, setPromptAr] = useState('');
  const [showAr, setShowAr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputMode, setInputMode] = useState('text');
  const [image, setImage] = useState(null);
  const [style, setStyle] = useState('elegant');
  const [category, setCategory] = useState('dress');
  const [color, setColor] = useState('black');
  const [fabric, setFabric] = useState('silk');
  const [season, setSeason] = useState('spring');
  const [occasion, setOccasion] = useState('evening');
  const [details, setDetails] = useState('');
  const [vType, setVType] = useState('runway');
  const [vMood, setVMood] = useState('dramatic');
  const [vCam, setVCam] = useState('slow-pan');
  const [vLight, setVLight] = useState('studio');
  const [vDur, setVDur] = useState('15');
  const [vNotes, setVNotes] = useState('');
  const [platform, setPlatform] = useState('reel');
  const [tone, setTone] = useState('luxury');
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [hashtags, setHashtags] = useState(true);
  const [emojis, setEmojis] = useState(true);
  const [cta, setCta] = useState('shop');
  const [storyTone, setStoryTone] = useState('luxury');
  const [storyLen, setStoryLen] = useState('medium');
  const [storyDesc, setStoryDesc] = useState('');

  const g = '#D4AF37';
  const handleImg = (e) => { const f = e.target.files[0]; if(f) { const r = new FileReader(); r.onload = (x) => setImage(x.target.result); r.readAsDataURL(f); }};
  const copy = () => { navigator.clipboard.writeText(showAr ? promptAr : prompt); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const genDesign = () => {
    const fromImg = inputMode === 'image' && image;
    const s = {elegant:'Elegant/أنيق',casual:'Casual/كاجوال',couture:'Haute Couture/هوت كوتور',minimalist:'Minimalist/مينيمالست'}[style] || 'Elegant/أنيق';
    const cat = {dress:'Dress/فستان',suit:'Suit/بدلة',abaya:'Abaya/عباية',jacket:'Jacket/جاكيت'}[category] || 'Dress/فستان';
    const col = {black:'Black/أسود',white:'White/أبيض',red:'Red/أحمر',navy:'Navy/كحلي',gold:'Gold/ذهبي'}[color] || 'Black/أسود';
    const fab = {silk:'Silk/حرير',velvet:'Velvet/مخمل',satin:'Satin/ساتان',chiffon:'Chiffon/شيفون',lace:'Lace/دانتيل'}[fabric] || 'Silk/حرير';
    
    const en = `${fromImg ? '📸 REFERENCE IMAGE ATTACHED\n\n' : ''}🎨 FASHION DESIGN PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Style: ${s.split('/')[0]} | Category: ${cat.split('/')[0]}
Color: ${col.split('/')[0]} | Fabric: ${fab.split('/')[0]}
${details ? `Details: ${details}` : ''}

📝 AI IMAGE PROMPT:
High-fashion editorial photo of ${s.split('/')[0].toLowerCase()} ${col.split('/')[0].toLowerCase()} ${fab.split('/')[0].toLowerCase()} ${cat.split('/')[0].toLowerCase()}, professional model, Vogue quality, studio lighting, 8K, masterful tailoring.${details ? ` Features: ${details}.` : ''}

⚙️ --ar 3:4 --style raw --v 6.1 --q 2

🚫 NEGATIVE: low quality, amateur, wrinkled, blurry, bad anatomy`;

    const ar = `${fromImg ? '📸 صورة مرجعية مرفقة\n\n' : ''}🎨 برومبت تصميم أزياء
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
الستايل: ${s.split('/')[1]} | الفئة: ${cat.split('/')[1]}
اللون: ${col.split('/')[1]} | القماش: ${fab.split('/')[1]}
${details ? `التفاصيل: ${details}` : ''}

📝 برومبت الصورة:
تصوير أزياء راقي لـ${cat.split('/')[1]} ${s.split('/')[1]} بلون ${col.split('/')[1]} من ${fab.split('/')[1]}، عارضة محترفة، جودة فوغ، إضاءة استديو، 8K.${details ? ` يتميز بـ: ${details}.` : ''}

⚙️ --ar 3:4 --style raw --v 6.1 --q 2

🚫 سلبي: جودة منخفضة، هاوي، مجعد، ضبابي`;

    setPrompt(en); setPromptAr(ar); setShowAr(false);
  };

  const genVideo = () => {
    const fromImg = inputMode === 'image' && image;
    const en = `${fromImg ? '📸 REFERENCE IMAGE\n\n' : ''}🎬 VIDEO PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: ${vType} | Mood: ${vMood} | Duration: ${vDur}s
Camera: ${vCam} | Lighting: ${vLight}
${vNotes ? `Notes: ${vNotes}` : ''}

🎥 SCENE BREAKDOWN:
0-3s: HOOK - Extreme close-up fabric detail
3-8s: REVEAL - Full garment, slow motion
8-15s: DETAILS - Quick cuts: texture, stitching, movement
15-${vDur-3}s: LIFESTYLE - Model in aspirational setting
Final 3s: CTA - Product shot with branding

⚙️ 4K, 24fps, 9:16 vertical`;

    const ar = `${fromImg ? '📸 صورة مرجعية\n\n' : ''}🎬 برومبت فيديو
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
النوع: ${vType} | المزاج: ${vMood} | المدة: ${vDur} ثانية
الكاميرا: ${vCam} | الإضاءة: ${vLight}
${vNotes ? `ملاحظات: ${vNotes}` : ''}

🎥 تقسيم المشاهد:
0-3ث: الجذب - كلوز أب على القماش
3-8ث: الكشف - القطعة كاملة، سلو موشن
8-15ث: التفاصيل - لقطات سريعة
15-${vDur-3}ث: لايف ستايل - العارضة في مكان ملهم
آخر 3ث: CTA - المنتج مع البراند

⚙️ 4K، 24 إطار، 9:16 عمودي`;

    setPrompt(en); setPromptAr(ar); setShowAr(false);
  };

  const genMarketing = () => {
    const fromImg = inputMode === 'image' && image;
    const name = prodName || '[Product Name]';
    const desc = prodDesc || 'Luxury fashion piece';
    const e = emojis;
    const h = hashtags;

    const en = `${fromImg ? '📸 PRODUCT IMAGE\n\n' : ''}📱 REEL SCRIPT - ${name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 SCENE 1 (0-3s) HOOK:
Shot: Extreme close-up detail
Text: "Wait for it..."
Audio: Suspense sound

🎬 SCENE 2 (3-7s) REVEAL:
Shot: Full product, slow-mo
Text: "${name}"
Audio: Beat drop

🎬 SCENE 3 (7-15s) DETAILS:
4 quick cuts - fabric, stitching, movement, unique element
Text: "Handcrafted" / "Premium"

🎬 SCENE 4 (15-22s) LIFESTYLE:
Model in luxury setting
Text: "For moments that matter"

🎬 SCENE 5 (22-25s) CTA:
Product beauty shot
Text: "Shop Now - Link in bio"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 CAPTION:
${e?'✨ ':''}${name}
${desc}
${e?'🛍️ ':''}Shop now - Link in bio
${h?'\n#fashion #luxury #style #ootd #trending #viral #fyp':''}`;

    const ar = `${fromImg ? '📸 صورة المنتج\n\n' : ''}📱 سكريبت ريل - ${name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 مشهد 1 (0-3ث) الجذب:
اللقطة: كلوز أب على التفاصيل
النص: "انتظري..."
الصوت: مؤثر تشويقي

🎬 مشهد 2 (3-7ث) الكشف:
اللقطة: المنتج كامل، سلو موشن
النص: "${name}"
الصوت: دروب البيت

🎬 مشهد 3 (7-15ث) التفاصيل:
4 لقطات سريعة - القماش، الخياطة، الحركة، التفصيلة الفريدة
النص: "صناعة يدوية" / "جودة فاخرة"

🎬 مشهد 4 (15-22ث) لايف ستايل:
العارضة في مكان فاخر
النص: "للحظاتك المميزة"

🎬 مشهد 5 (22-25ث) CTA:
لقطة جمالية للمنتج
النص: "تسوقي الآن - الرابط بالبايو"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 الكابشن:
${e?'✨ ':''}${name}
${desc}
${e?'🛍️ ':''}تسوقي الآن - الرابط بالبايو
${h?'\n#أزياء #فاشن #موضة #ستايل #ريلز #ترند #اكسبلور':''}`;

    setPrompt(en); setPromptAr(ar); setShowAr(false);
  };

  const genStory = () => {
    const fromImg = inputMode === 'image' && image;
    const d = storyDesc || 'A luxurious fashion piece';
    const stories = {
      luxury: { short: `In a world of ordinary, we chose extraordinary.\n\nThis isn't just fashion—it's a statement. Every stitch whispers luxury.\n\nFor those who refuse to blend in.`, medium: `There are moments that define us.\n\nMoments when we walk into a room and time pauses. This piece was born from that vision.\n\nWe spent months perfecting every element. The weight of fabric as it falls. How light catches the material. The invisible construction that makes the visible perfect.\n\nThis isn't mass production. This is art made wearable.\n\nYou are that woman. And this is worthy of you.`, long: `THE ART OF PRESENCE\n\nIn the quiet hours before dawn, in an atelier where time moves differently, magic happens.\n\nWe searched three continents for this fabric. Rejected hundreds of samples. Because we weren't looking for fabric—we were looking for poetry you can wear.\n\nTurn it inside out—we dare you. The interior is as flawless as the exterior.\n\nThis was designed for a specific woman. She walks into boardrooms and ballrooms with equal confidence.\n\nIs this you?\n\nWelcome to a new standard of elegance.` },
      friendly: { short: `Hey gorgeous! 👋\n\nYou know that feeling when you find THE piece? Yeah. This is it.\n\nMade with love, for YOU. 💕`, medium: `Can we be real? 💕\n\nYou know those mornings when your closet is FULL but you have "nothing to wear"?\n\nThat's why we created this piece. Comfortable enough for all day, stunning enough for any occasion.\n\nWe tested it on real women. Not models. Women with curves and lives.\n\nThis is fashion that gets you. Finally. 🙌`, long: `LET'S GET REAL 💕\n\nWe started this brand because we were frustrated.\n\nFrustrated with "luxury" that fell apart. With sizing that made no sense.\n\nThis piece took 8 months. We kept sending it back: "The sleeve isn't right." "The hem needs adjusting."\n\nBecause you work hard for your money. We refuse to let you down.\n\nWelcome to fashion that actually cares. 💕` },
      inspiring: { short: `She didn't dress for others.\n\nShe dressed for the woman she was becoming.\n\nFor every woman writing her own story. ✨`, medium: `Before she satisfies the world, she was herself.\n\nShe stopped asking permission. Started choosing—her path, her voice, her style.\n\nThis isn't about fitting in. It's about standing out.\n\nYour moment isn't coming. It's here. Dress for it.`, long: `THE WOMAN WHO CHOSE HERSELF\n\nShe remembers the moment everything changed. A quiet morning, reaching for safe choices.\n\nThen... she didn't.\n\nThat small act rippled outward. She spoke up. Asked for the promotion. Set boundaries.\n\nThis piece is for women at crossroads. For the one ready to stop waiting.\n\nNow go show them what you're made of. ✨` }
    };
    const s = stories[storyTone]?.[storyLen] || stories.luxury.medium;
    const en = `${fromImg ? '📸 PRODUCT IMAGE\n\n' : ''}📖 MARKETING STORY\nTone: ${storyTone} | Length: ${storyLen}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${s}`;
    const ar = `${fromImg ? '📸 صورة المنتج\n\n' : ''}📖 قصة تسويقية\nالنبرة: ${storyTone} | الطول: ${storyLen}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${s}`;
    setPrompt(en); setPromptAr(ar); setShowAr(false);
  };

  const generate = () => { if(activeTab==='design') genDesign(); else if(activeTab==='video') genVideo(); else if(activeTab==='marketing') genMarketing(); else if(activeTab==='story') genStory(); };

  const btn = (active) => ({ padding:'10px 12px', background: active ? `linear-gradient(135deg,${g},#F4E4BA)` : 'rgba(255,255,255,0.05)', border: active ? 'none' : `1px solid ${g}40`, borderRadius:'8px', color: active ? '#0a0a0a' : '#fff', cursor:'pointer', fontSize:'11px', fontWeight:'600' });
  const inp = { width:'100%', padding:'10px', background:'rgba(0,0,0,0.3)', border:`1px solid ${g}40`, borderRadius:'8px', color:'#fff', fontSize:'13px' };
  const sec = { background:'rgba(255,255,255,0.05)', borderRadius:'14px', padding:'20px', border:`1px solid ${g}30` };

  const InputMode = () => (
    <div style={{marginBottom:'15px'}}>
      <label style={{display:'block',marginBottom:'6px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>طريقة الإدخال / Input Mode</label>
      <div style={{display:'flex',gap:'8px'}}>
        <button onClick={()=>{setInputMode('text');setImage(null);}} style={{flex:1,...btn(inputMode==='text')}}>📝 من وصف</button>
        <button onClick={()=>setInputMode('image')} style={{flex:1,...btn(inputMode==='image')}}>🖼️ من صورة</button>
      </div>
      {inputMode==='image' && (
        <div style={{marginTop:'10px'}}>
          {!image ? (
            <label style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'20px',border:`2px dashed ${g}50`,borderRadius:'8px',cursor:'pointer',background:'rgba(0,0,0,0.2)'}}>
              <span style={{fontSize:'24px',marginBottom:'5px'}}>📁</span>
              <span style={{color:'#aaa',fontSize:'11px'}}>اضغط لرفع صورة</span>
              <input type="file" accept="image/*" onChange={handleImg} style={{display:'none'}} />
            </label>
          ) : (
            <div style={{position:'relative'}}>
              <img src={image} style={{width:'100%',height:'100px',objectFit:'cover',borderRadius:'8px'}} />
              <button onClick={()=>setImage(null)} style={{position:'absolute',top:'5px',right:'5px',background:'#DC2626',border:'none',borderRadius:'50%',width:'24px',height:'24px',color:'#fff',cursor:'pointer',fontSize:'12px'}}>✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <><Head><title>AI Fashion Creator - GH Fashion</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet" /></Head>
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0a0a0a,#1a1a2e,#16213e)',fontFamily:'Montserrat,sans-serif',color:'#fff'}}>
      <header style={{padding:'15px 30px',display:'flex',alignItems:'center',gap:'10px',borderBottom:`1px solid ${g}30`}}>
        <div style={{width:'40px',height:'40px',background:`linear-gradient(135deg,${g},#F4E4BA)`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:'bold',color:'#0a0a0a'}}>GH</div>
        <div><h1 style={{margin:0,fontSize:'18px',fontFamily:'Playfair Display,serif'}}>AI Fashion Creator</h1><p style={{margin:0,fontSize:'9px',color:g,letterSpacing:'1px'}}>PROFESSIONAL PROMPT GENERATOR</p></div>
      </header>

      <nav style={{display:'flex',justifyContent:'center',gap:'10px',padding:'20px',flexWrap:'wrap'}}>
        {[{id:'design',icon:'🎨',label:'Design'},{id:'video',icon:'🎬',label:'Video'},{id:'marketing',icon:'📱',label:'Marketing'},{id:'story',icon:'📖',label:'Story'},{id:'pricing',icon:'💎',label:'Pricing'}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:'10px 18px',background:activeTab===t.id?`linear-gradient(135deg,${g},#F4E4BA)`:'rgba(255,255,255,0.05)',border:activeTab===t.id?'none':`1px solid ${g}50`,borderRadius:'20px',color:activeTab===t.id?'#0a0a0a':'#fff',cursor:'pointer',fontSize:'12px',fontWeight:'600',display:'flex',alignItems:'center',gap:'6px'}}><span>{t.icon}</span><span>{t.label}</span></button>
        ))}
      </nav>

      <main style={{padding:'15px 30px',maxWidth:'1200px',margin:'0 auto'}}>
        {activeTab==='design' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
            <div style={sec}>
              <h2 style={{color:g,marginBottom:'15px',fontFamily:'Playfair Display,serif',fontSize:'16px'}}>🎨 Design Prompt</h2>
              <InputMode />
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Style</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>{['elegant','casual','couture','minimalist'].map(s=><button key={s} onClick={()=>setStyle(s)} style={btn(style===s)}>{s}</button>)}</div></div>
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Category</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>{['dress','suit','abaya','jacket'].map(c=><button key={c} onClick={()=>setCategory(c)} style={btn(category===c)}>{c}</button>)}</div></div>
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Color</label><div style={{display:'flex',gap:'6px'}}>{[{id:'black',hex:'#000'},{id:'white',hex:'#FFF'},{id:'red',hex:'#DC2626'},{id:'navy',hex:'#1E3A5F'},{id:'gold',hex:'#D4AF37'}].map(c=><button key={c.id} onClick={()=>setColor(c.id)} style={{width:'28px',height:'28px',background:c.hex,border:color===c.id?`3px solid ${g}`:'2px solid rgba(255,255,255,0.3)',borderRadius:'50%',cursor:'pointer'}} />)}</div></div>
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Fabric</label><div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'5px'}}>{['silk','velvet','satin','chiffon','lace'].map(f=><button key={f} onClick={()=>setFabric(f)} style={btn(fabric===f)}>{f}</button>)}</div></div>
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Details</label><input value={details} onChange={e=>setDetails(e.target.value)} placeholder="تفاصيل إضافية..." style={inp} /></div>
              <button onClick={generate} style={{width:'100%',padding:'12px',background:`linear-gradient(135deg,${g},#F4E4BA)`,border:'none',borderRadius:'8px',color:'#0a0a0a',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>✨ GENERATE</button>
            </div>
            <div style={sec}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}><h2 style={{color:g,fontFamily:'Playfair Display,serif',margin:0,fontSize:'16px'}}>📝 Result</h2><button onClick={()=>setShowAr(!showAr)} style={{padding:'5px 10px',background:showAr?g:'transparent',border:`1px solid ${g}`,borderRadius:'12px',color:showAr?'#0a0a0a':g,cursor:'pointer',fontSize:'10px',fontWeight:'600'}}>{showAr?'EN':'عربي'}</button></div>
              <div style={{background:'rgba(0,0,0,0.4)',borderRadius:'8px',padding:'12px',minHeight:'350px',maxHeight:'400px',overflowY:'auto',border:`1px solid ${g}20`,marginBottom:'12px'}}><pre style={{margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word',color:'rgba(255,255,255,0.9)',fontSize:'11px',lineHeight:'1.6',direction:showAr?'rtl':'ltr',textAlign:showAr?'right':'left',fontFamily:'Montserrat,sans-serif'}}>{showAr?promptAr:prompt||'اختاري الخيارات واضغطي Generate'}</pre></div>
              {prompt && <button onClick={copy} style={{width:'100%',padding:'10px',background:copied?'#059669':'transparent',border:`2px solid ${g}`,borderRadius:'8px',color:copied?'#fff':g,cursor:'pointer',fontSize:'12px',fontWeight:'600'}}>{copied?'✓ تم النسخ!':'📋 نسخ'}</button>}
            </div>
          </div>
        )}

        {activeTab==='video' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
            <div style={sec}>
              <h2 style={{color:g,marginBottom:'15px',fontFamily:'Playfair Display,serif',fontSize:'16px'}}>🎬 Video Prompt</h2>
              <InputMode />
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Type</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>{['runway','lookbook','product','bts'].map(t=><button key={t} onClick={()=>setVType(t)} style={btn(vType===t)}>{t}</button>)}</div></div>
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Mood</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>{['dramatic','elegant','energetic','romantic'].map(m=><button key={m} onClick={()=>setVMood(m)} style={btn(vMood===m)}>{m}</button>)}</div></div>
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Camera</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>{['slow-pan','360','zoom','tracking'].map(c=><button key={c} onClick={()=>setVCam(c)} style={btn(vCam===c)}>{c}</button>)}</div></div>
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Duration: {vDur}s</label><input type="range" min="10" max="60" value={vDur} onChange={e=>setVDur(e.target.value)} style={{width:'100%',accentColor:g}} /></div>
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Notes</label><input value={vNotes} onChange={e=>setVNotes(e.target.value)} placeholder="ملاحظات..." style={inp} /></div>
              <button onClick={generate} style={{width:'100%',padding:'12px',background:`linear-gradient(135deg,${g},#F4E4BA)`,border:'none',borderRadius:'8px',color:'#0a0a0a',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>🎬 GENERATE</button>
            </div>
            <div style={sec}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}><h2 style={{color:g,fontFamily:'Playfair Display,serif',margin:0,fontSize:'16px'}}>📝 Result</h2><button onClick={()=>setShowAr(!showAr)} style={{padding:'5px 10px',background:showAr?g:'transparent',border:`1px solid ${g}`,borderRadius:'12px',color:showAr?'#0a0a0a':g,cursor:'pointer',fontSize:'10px',fontWeight:'600'}}>{showAr?'EN':'عربي'}</button></div>
              <div style={{background:'rgba(0,0,0,0.4)',borderRadius:'8px',padding:'12px',minHeight:'350px',maxHeight:'400px',overflowY:'auto',border:`1px solid ${g}20`,marginBottom:'12px'}}><pre style={{margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word',color:'rgba(255,255,255,0.9)',fontSize:'11px',lineHeight:'1.6',direction:showAr?'rtl':'ltr',textAlign:showAr?'right':'left',fontFamily:'Montserrat,sans-serif'}}>{showAr?promptAr:prompt||'اختاري الخيارات واضغطي Generate'}</pre></div>
              {prompt && <button onClick={copy} style={{width:'100%',padding:'10px',background:copied?'#059669':'transparent',border:`2px solid ${g}`,borderRadius:'8px',color:copied?'#fff':g,cursor:'pointer',fontSize:'12px',fontWeight:'600'}}>{copied?'✓ تم النسخ!':'📋 نسخ'}</button>}
            </div>
          </div>
        )}

        {activeTab==='marketing' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
            <div style={sec}>
              <h2 style={{color:g,marginBottom:'15px',fontFamily:'Playfair Display,serif',fontSize:'16px'}}>📱 Marketing</h2>
              <InputMode />
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Platform</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>{['reel','post','tiktok','story'].map(p=><button key={p} onClick={()=>setPlatform(p)} style={btn(platform===p)}>{p}</button>)}</div></div>
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Tone</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>{['luxury','friendly','professional','inspiring'].map(t=><button key={t} onClick={()=>setTone(t)} style={btn(tone===t)}>{t}</button>)}</div></div>
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Product Name</label><input value={prodName} onChange={e=>setProdName(e.target.value)} placeholder="اسم المنتج" style={inp} /></div>
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Description</label><input value={prodDesc} onChange={e=>setProdDesc(e.target.value)} placeholder="وصف المنتج" style={inp} /></div>
              <div style={{display:'flex',gap:'15px',marginBottom:'12px'}}><label style={{display:'flex',alignItems:'center',gap:'5px',color:'#fff',cursor:'pointer',fontSize:'11px'}}><input type="checkbox" checked={hashtags} onChange={e=>setHashtags(e.target.checked)} style={{accentColor:g}} />Hashtags</label><label style={{display:'flex',alignItems:'center',gap:'5px',color:'#fff',cursor:'pointer',fontSize:'11px'}}><input type="checkbox" checked={emojis} onChange={e=>setEmojis(e.target.checked)} style={{accentColor:g}} />Emojis</label></div>
              <button onClick={generate} style={{width:'100%',padding:'12px',background:`linear-gradient(135deg,${g},#F4E4BA)`,border:'none',borderRadius:'8px',color:'#0a0a0a',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>📱 GENERATE</button>
            </div>
            <div style={sec}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}><h2 style={{color:g,fontFamily:'Playfair Display,serif',margin:0,fontSize:'16px'}}>📝 Result</h2><button onClick={()=>setShowAr(!showAr)} style={{padding:'5px 10px',background:showAr?g:'transparent',border:`1px solid ${g}`,borderRadius:'12px',color:showAr?'#0a0a0a':g,cursor:'pointer',fontSize:'10px',fontWeight:'600'}}>{showAr?'EN':'عربي'}</button></div>
              <div style={{background:'rgba(0,0,0,0.4)',borderRadius:'8px',padding:'12px',minHeight:'350px',maxHeight:'400px',overflowY:'auto',border:`1px solid ${g}20`,marginBottom:'12px'}}><pre style={{margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word',color:'rgba(255,255,255,0.9)',fontSize:'11px',lineHeight:'1.6',direction:showAr?'rtl':'ltr',textAlign:showAr?'right':'left',fontFamily:'Montserrat,sans-serif'}}>{showAr?promptAr:prompt||'اختاري الخيارات واضغطي Generate'}</pre></div>
              {prompt && <button onClick={copy} style={{width:'100%',padding:'10px',background:copied?'#059669':'transparent',border:`2px solid ${g}`,borderRadius:'8px',color:copied?'#fff':g,cursor:'pointer',fontSize:'12px',fontWeight:'600'}}>{copied?'✓ تم النسخ!':'📋 نسخ'}</button>}
            </div>
          </div>
        )}

        {activeTab==='story' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
            <div style={sec}>
              <h2 style={{color:g,marginBottom:'15px',fontFamily:'Playfair Display,serif',fontSize:'16px'}}>📖 Story</h2>
              <InputMode />
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Tone</label><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'5px'}}>{['luxury','friendly','inspiring'].map(t=><button key={t} onClick={()=>setStoryTone(t)} style={btn(storyTone===t)}>{t}</button>)}</div></div>
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Length</label><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'5px'}}>{['short','medium','long'].map(l=><button key={l} onClick={()=>setStoryLen(l)} style={btn(storyLen===l)}>{l}</button>)}</div></div>
              <div style={{marginBottom:'12px'}}><label style={{display:'block',marginBottom:'5px',color:'#F4E4BA',fontSize:'11px',fontWeight:'600'}}>Product Description</label><textarea value={storyDesc} onChange={e=>setStoryDesc(e.target.value)} placeholder="صفي المنتج..." style={{...inp,height:'80px',resize:'none'}} /></div>
              <button onClick={generate} style={{width:'100%',padding:'12px',background:`linear-gradient(135deg,${g},#F4E4BA)`,border:'none',borderRadius:'8px',color:'#0a0a0a',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>📖 GENERATE</button>
            </div>
            <div style={sec}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}><h2 style={{color:g,fontFamily:'Playfair Display,serif',margin:0,fontSize:'16px'}}>📝 Result</h2><button onClick={()=>setShowAr(!showAr)} style={{padding:'5px 10px',background:showAr?g:'transparent',border:`1px solid ${g}`,borderRadius:'12px',color:showAr?'#0a0a0a':g,cursor:'pointer',fontSize:'10px',fontWeight:'600'}}>{showAr?'EN':'عربي'}</button></div>
              <div style={{background:'rgba(0,0,0,0.4)',borderRadius:'8px',padding:'12px',minHeight:'350px',maxHeight:'400px',overflowY:'auto',border:`1px solid ${g}20`,marginBottom:'12px'}}><pre style={{margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word',color:'rgba(255,255,255,0.9)',fontSize:'11px',lineHeight:'1.6',direction:showAr?'rtl':'ltr',textAlign:showAr?'right':'left',fontFamily:'Montserrat,sans-serif'}}>{showAr?promptAr:prompt||'اختاري الخيارات واضغطي Generate'}</pre></div>
              {prompt && <button onClick={copy} style={{width:'100%',padding:'10px',background:copied?'#059669':'transparent',border:`2px solid ${g}`,borderRadius:'8px',color:copied?'#fff':g,cursor:'pointer',fontSize:'12px',fontWeight:'600'}}>{copied?'✓ تم النسخ!':'📋 نسخ'}</button>}
            </div>
          </div>
        )}

        {activeTab==='pricing' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'20px',maxWidth:'800px',margin:'0 auto'}}>
            {[{name:'Basic',prompts:'100',price:15},{name:'Pro',prompts:'500',price:35,pop:true},{name:'Unlimited',prompts:'∞',price:75}].map(p=>(
              <div key={p.name} style={{background:p.pop?`linear-gradient(135deg,${g}20,${g}10)`:'rgba(255,255,255,0.05)',borderRadius:'14px',padding:'25px 18px',border:p.pop?`2px solid ${g}`:`1px solid ${g}30`,textAlign:'center',transform:p.pop?'scale(1.05)':'none',position:'relative'}}>
                {p.pop && <div style={{position:'absolute',top:'-10px',left:'50%',transform:'translateX(-50%)',background:g,padding:'3px 12px',borderRadius:'10px',fontSize:'9px',fontWeight:'700',color:'#0a0a0a'}}>POPULAR</div>}
                <h3 style={{fontSize:'18px',color:g,marginBottom:'5px',fontFamily:'Playfair Display,serif'}}>{p.name}</h3>
                <div style={{fontSize:'32px',fontWeight:'700',marginBottom:'5px'}}>${p.price}</div>
                <p style={{color:'rgba(255,255,255,0.6)',marginBottom:'15px',fontSize:'11px'}}>{p.prompts} prompts</p>
                <ul style={{listStyle:'none',padding:0,margin:'0 0 15px 0',textAlign:'left'}}>{['Design Prompts','Video Prompts','Marketing','Story','AR + EN'].map((f,i)=><li key={i} style={{padding:'4px 0',color:'rgba(255,255,255,0.8)',fontSize:'11px'}}>✓ {f}</li>)}</ul>
                <button style={{width:'100%',padding:'10px',background:p.pop?`linear-gradient(135deg,${g},#F4E4BA)`:'transparent',border:p.pop?'none':`2px solid ${g}`,borderRadius:'8px',color:p.pop?'#0a0a0a':g,fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>GET STARTED</button>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={{textAlign:'center',padding:'15px',borderTop:`1px solid ${g}20`,color:'rgba(255,255,255,0.5)',fontSize:'10px'}}><p>© 2026 GH Fashion Creator</p></footer>
    </div></>
  );
}
