import React, { useState } from 'react';

export default function Home() {
  const [tab, setTab] = useState('design');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [ratio, setRatio] = useState('9:16');
  const [platform, setPlatform] = useState('reel');
  const [copied, setCopied] = useState(false);
  const [started, setStarted] = useState(false);
  const [img, setImg] = useState(null);
  const [imgName, setImgName] = useState('');
  const [translated, setTranslated] = useState(false);
  const [promptLength, setPromptLength] = useState('pro');

  const gold = '#C9A078';

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { setImg(ev.target.result); setImgName(file.name); };
      reader.readAsDataURL(file);
    }
  };

  const translate = () => {
    if (!output || translated || tab === 'marketing') return;
    
    const desc = input.trim() || 'تصميم أزياء أنيق';
    let arabicPrompt = '';
    
    if (tab === 'design') {
      arabicPrompt = `صورة أزياء هوت كوتور احترافية: ${desc}

عارضة أزياء عربية فاخرة بشعر أسود طويل مموج لامع، بشرة زيتونية دافئة متوهجة، عيون لوزية معبرة، حواجب مرسومة بدقة، مكياج راقي ناعم، أقراط ماسية متدلية.

الموقع: قاعة قصر فخمة بأسقف عالية، ثريات كريستالية ضخمة، أعمدة رخامية مذهبة، أرضية رخام لامعة.

الإضاءة: إضاءة ذهبية ناعمة من الجانب، إضاءة خلفية دافئة تخلق هالة حول العارضة، عمق ميدان ضحل مع بوكيه حالم.

الجودة: تصوير بكاميرا Hasselblad، عدسة 85mm f/1.4، دقة 8K، ألوان سينمائية ذهبية دافئة، ستايل مجلة فوغ العربية.

--ar ${ratio} --v 6.1 --style raw --s 750 --q 2`;
    }
    else if (tab === 'video') {
      arabicPrompt = `فيلم أزياء سينمائي: ${desc}

المشهد الافتتاحي: لقطة ماكرو على تفاصيل القماش الفاخر والتطريز اليدوي الدقيق.

الكشف: الكاميرا تتراجع ببطء كاشفة عارضة عربية أنيقة بشعر أسود منسدل يتمايل مع حركتها.

الحركة: تمشي بثقة وأناقة عبر ممر قصر رخامي فاخر، ضوء الساعة الذهبية يتدفق عبر النوافذ المقوسة.

التصوير: لقطة تتبع سلسة، القماش الفاخر ينساب مع كل خطوة، بوكيه حالم من الثريات الكريستالية.

الجودة: 4K، 24 إطار/ثانية، درجات لونية ذهبية دافئة، ستايل حملات Dior و Chanel.

--ar ${ratio}`;
    }
    else if (tab === 'generate') {
      arabicPrompt = `صورة أزياء احترافية: ${desc}

عارضة عربية أنيقة، شعر أسود طويل مموج، بشرة زيتونية دافئة، قاعة قصر فاخر، ثريات كريستالية، إضاءة ذهبية ناعمة، عمق ميدان ضحل، بوكيه حالم، ستايل مجلة فوغ، دقة 8K.

--ar ${ratio} --v 6.1 --style raw --s 750`;
    }
    
    setOutput(arabicPrompt);
    setTranslated(true);
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generate = () => {
    if (!input.trim() && !img) {
      setOutput('❌ الرجاء كتابة وصف أو رفع صورة');
      return;
    }
    
    setTranslated(false);
    const desc = input.trim() || 'elegant fashion design from uploaded image';
    let result = '';
    
    if (tab === 'design') {
      if (promptLength === 'short') {
        result = `${desc}, elegant Arabian model, dark wavy hair, olive skin, palace ballroom, crystal chandeliers, golden lighting, Vogue style, 8K --ar ${ratio} --v 6.1 --s 750`;
      }
      else if (promptLength === 'medium') {
        result = `Haute couture: ${desc}. Elegant Arabian model with long dark wavy hair, warm olive skin, standing in luxurious palace ballroom. Crystal chandeliers, soft golden lighting, shallow depth of field, dreamy bokeh. Vogue Arabia editorial, 8K, Hasselblad quality. --ar ${ratio} --v 6.1 --style raw --s 750`;
      }
      else {
        result = `Professional haute couture fashion photography: ${desc}

Subject: Breathtakingly elegant Arabian woman with long, lustrous dark wavy hair cascading over shoulders, warm olive skin with natural glow, striking almond-shaped eyes, perfectly defined brows, subtle rose lip makeup, wearing exquisite diamond drop earrings.

Setting: Opulent grand palace ballroom with soaring gilded ceilings, magnificent multi-tiered crystal chandeliers, ornate baroque architectural details, polished cream marble floors with subtle reflections, soft pink roses arrangements.

Lighting: Cinematic three-point setup - soft key light from 45°, gentle fill, warm rim light creating subtle halo. Golden hour warmth, diffused quality.

Technical: Hasselblad H6D-100c, 85mm f/1.4 lens, shallow DOF, creamy bokeh, 8K resolution, Kodak Portra color science.

Style: Vogue Arabia cover, Harper's Bazaar aesthetic, Dior campaign quality.

--ar ${ratio} --v 6.1 --style raw --s 750 --q 2`;
      }
    }
    else if (tab === 'video') {
      if (promptLength === 'short') {
        result = `Fashion video: ${desc}, Arabian model walking in palace, golden lighting, flowing fabric, 4K cinematic --ar ${ratio}`;
      }
      else if (promptLength === 'medium') {
        result = `Cinematic fashion film: ${desc}. Elegant Arabian model with flowing dark hair walks through marble palace corridor. Golden hour lighting, tracking shot, fabric flowing with each step. 4K, 24fps, Dior campaign style. --ar ${ratio}`;
      }
      else {
        result = `Cinematic luxury fashion film: ${desc}

[0-3s] OPENING: Extreme macro on intricate fabric texture, beading catches light, slow pan across hand-sewn embellishments.

[3-7s] THE REVEAL: Camera pulls back smoothly revealing elegant Arabian model, long flowing dark hair, standing in dramatic backlit pose.

[7-12s] THE WALK: Tracking shot follows model walking through ornate marble palace corridor, golden hour light streaming through arched windows, fabric flowing elegantly with each confident step.

[12-15s] THE MOMENT: Model pauses, slight turn toward camera, subtle knowing smile, light catches jewelry.

Technical: 4K RED camera, 24fps cinematic, 85mm lens, shallow DOF, warm golden color grade, Dior/Chanel campaign aesthetic.

--ar ${ratio}`;
      }
    }
    else if (tab === 'marketing') {
      if (platform === 'reel') {
        result = `🎬 INSTAGRAM REEL

⚡ HOOK (0-3s):
"الفستان اللي كل البنات سألوني عنه 👀✨"

🎥 CONTENT (3-25s):
• Close-up على تفاصيل القماش والتطريز
• الكشف عن التصميم كامل مع دوران بطيء
• لقطات حركة تُظهر انسيابية القماش

🎯 CTA (25-30s):
"احجزي قبل نفاذ الكمية! الرابط بالبايو 💫"

📝 CAPTION:
${desc} ✨
تصميم حصري بلمسة راقية 💎
📏 المقاسات: XS - XL
🚚 توصيل لجميع الدول
💌 للطلب: DM أو الرابط بالبايو

#fashion #dress #elegant #فاشن #أزياء #فستان #GHFashion`;
      }
      else if (platform === 'tiktok') {
        result = `🎬 TIKTOK

⚡ HOOK (0-2s):
"POV: لقيتي فستان أحلامك 😍"

🎥 FORMAT:
• GRWM - تجهيز ولبس التصميم
• أو Transformation قبل/بعد
• Quick cuts مع beat drops

🎯 CTA:
"فولو لمزيد من التصاميم! 💕"

📝 CAPTION:
${desc} ✨
الرابط بالبايو 🔗

#fyp #viral #fashion #ootd #فاشن #تيكتوك #GHFashion`;
      }
      else if (platform === 'story') {
        result = `📱 INSTAGRAM STORIES

1️⃣ صورة blurred + "شي جديد قادم 👀"
2️⃣ الكشف: ${desc} ✨
3️⃣ تفاصيل Close-up 😍
4️⃣ Poll: "شو رأيكم؟" 🔥/😍
5️⃣ المقاسات والألوان المتوفرة
6️⃣ Question box للأسئلة
7️⃣ CTA: "للطلب راسليني 💌"`;
      }
      else if (platform === 'post') {
        result = `📸 INSTAGRAM POST

🖼️ CAROUSEL:
1. Hero shot - التصميم كامل
2. On model - من الأمام
3. Details - تفاصيل قريبة
4. Back view - من الخلف
5. معلومات الطلب

📝 CAPTION:
${desc} ✨

حين تلتقي الأناقة بالفخامة... 💫

✨ المميزات:
• قماش فاخر عالي الجودة
• تطريز يدوي دقيق
• قصة مصممة بعناية

📏 المقاسات: XS - XL
💌 للطلب: DM أو الرابط بالبايو

#fashion #dress #elegant #فاشن #أزياء #GHFashion`;
      }
      else if (platform === 'story_marketing') {
        result = `📖 قصة تسويقية

في ليلة لا تُنسى...
حين تدخلين القاعة، تتوقف الأنظار ✨

${desc}

ليس مجرد قماش وخيوط...
بل حكاية أناقة تُروى بكل تفصيلة 💫

صُنع بحب، لتشعري بالتميز
لأنكِ تستحقين الأفضل 👑

GH Fashion
حيث تبدأ قصتك ✨`;
      }
    }
    else if (tab === 'generate') {
      if (promptLength === 'short') {
        result = `${desc}, Arabian model, dark hair, olive skin, palace, chandeliers, golden light, 8K --ar ${ratio} --v 6.1`;
      }
      else if (promptLength === 'medium') {
        result = `${desc}, stunning Arabian model with long dark wavy hair, olive skin, grand palace ballroom, crystal chandeliers, soft golden lighting, shallow DOF, bokeh, Vogue editorial, 8K --ar ${ratio} --v 6.1 --style raw --s 750`;
      }
      else {
        result = `Ultimate fashion image prompt: ${desc}

Stunning Arabian model, long lustrous dark wavy hair, warm olive glowing skin, elegant pose in grand palace ballroom, magnificent crystal chandeliers, soft golden ambient lighting, shallow depth of field, dreamy creamy bokeh, Vogue Arabia editorial quality, Hasselblad medium format, 8K ultra resolution, luxury fashion campaign aesthetic.

Negative prompt: ugly, deformed, blurry, bad anatomy, extra limbs, low quality, watermark, text, amateur lighting

--ar ${ratio} --v 6.1 --style raw --s 750 --q 2`;
      }
    }
    
    setOutput(result);
  };

  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: '#FDF8F5', padding: '20px', fontFamily: 'system-ui', direction: 'rtl' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', background: `linear-gradient(135deg, #D4AF91, ${gold})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '28px', color: '#fff', fontWeight: '700' }}>GH</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', color: gold, marginBottom: '10px' }}>AI Fashion Creator</h1>
          <p style={{ color: '#9D8B7A', marginBottom: '30px' }}>أداة توليد برومبتات الأزياء الاحترافية</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {[
              { name: 'الأساسية', images: 100, prompts: 200, price: 15 },
              { name: 'الاحترافية', images: 250, prompts: 500, price: 35 },
              { name: 'اللامحدودة', images: 600, prompts: 1200, price: 75 },
            ].map((p, i) => (
              <div key={i} onClick={() => setStarted(true)} style={{ padding: '16px', background: 'white', borderRadius: '16px', cursor: 'pointer', border: '2px solid rgba(201,160,120,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ color: gold, marginBottom: '4px' }}>{p.name}</h3>
                    <p style={{ color: '#8D7D6D', fontSize: '0.8rem' }}>🎨 {p.images} صورة • ✨ {p.prompts} برومبت</p>
                  </div>
                  <span style={{ color: gold, fontWeight: '700', fontSize: '1.3rem' }}>${p.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDF8F5', padding: '16px', fontFamily: 'system-ui', direction: 'rtl' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ width: '50px', height: '50px', margin: '0 auto 8px', background: `linear-gradient(135deg, #D4AF91, ${gold})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '18px', color: '#fff', fontWeight: '700' }}>GH</span>
          </div>
          <h1 style={{ fontSize: '1.2rem', color: gold }}>AI Fashion Creator</h1>
        </header>

        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
          {[
            { id: 'design', label: '✨ تصميم' },
            { id: 'video', label: '🎬 فيديو' },
            { id: 'marketing', label: '📱 تسويقي' },
            { id: 'generate', label: '🎨 صورة' },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setOutput(''); }} style={{
              padding: '10px 14px', borderRadius: '20px', cursor: 'pointer',
              border: tab === t.id ? 'none' : '1px solid rgba(201,160,120,0.3)',
              background: tab === t.id ? `linear-gradient(135deg, #D4AF91, ${gold})` : 'white',
              color: tab === t.id ? '#fff' : '#9D8B7A', fontWeight: '600', fontSize: '0.85rem',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '18px', boxShadow: '0 4px 20px rgba(201,160,120,0.1)' }}>
          
          {(tab === 'design' || tab === 'video' || tab === 'generate') && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#8D7D6D', fontSize: '0.85rem' }}>📐 الأبعاد</label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {['1:1', '9:16', '16:9'].map(r => (
                  <button key={r} onClick={() => setRatio(r)} style={{
                    padding: '8px 18px', borderRadius: '12px', cursor: 'pointer',
                    border: ratio === r ? 'none' : '1px solid rgba(201,160,120,0.3)',
                    background: ratio === r ? gold : 'white',
                    color: ratio === r ? '#fff' : '#9D8B7A', fontWeight: '500',
                  }}>{r}</button>
                ))}
              </div>
            </div>
          )}

          {(tab === 'design' || tab === 'video' || tab === 'generate') && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#8D7D6D', fontSize: '0.85rem' }}>📝 طول البرومبت</label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {[
                  { id: 'short', label: 'قصير' },
                  { id: 'medium', label: 'متوسط' },
                  { id: 'pro', label: 'احترافي' },
                ].map(p => (
                  <button key={p.id} onClick={() => setPromptLength(p.id)} style={{
                    padding: '8px 16px', borderRadius: '12px', cursor: 'pointer',
                    border: promptLength === p.id ? 'none' : '1px solid rgba(201,160,120,0.3)',
                    background: promptLength === p.id ? gold : 'white',
                    color: promptLength === p.id ? '#fff' : '#9D8B7A', fontWeight: '500', fontSize: '0.85rem',
                  }}>{p.label}</button>
                ))}
              </div>
            </div>
          )}

          {tab === 'marketing' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#8D7D6D', fontSize: '0.85rem' }}>📱 المنصة</label>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { id: 'reel', l: 'Reel' },
                  { id: 'tiktok', l: 'TikTok' },
                  { id: 'story', l: 'Story' },
                  { id: 'post', l: 'Post' },
                  { id: 'story_marketing', l: 'قصة' },
                ].map(p => (
                  <button key={p.id} onClick={() => setPlatform(p.id)} style={{
                    padding: '7px 12px', borderRadius: '12px', cursor: 'pointer',
                    border: platform === p.id ? 'none' : '1px solid rgba(201,160,120,0.3)',
                    background: platform === p.id ? gold : 'white',
                    color: platform === p.id ? '#fff' : '#9D8B7A', fontSize: '0.8rem',
                  }}>{p.l}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#8D7D6D', fontSize: '0.85rem' }}>🖼️ رفع صورة (اختياري)</label>
            <input type="file" id="fileInput" onChange={handleUpload} accept="image/*" style={{ display: 'none' }} />
            {!img ? (
              <div onClick={() => document.getElementById('fileInput').click()} style={{ border: '2px dashed rgba(201,160,120,0.4)', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#FDFAF7' }}>
                <span style={{ fontSize: '2rem' }}>📷</span>
                <p style={{ color: '#B8A090', fontSize: '0.8rem', marginTop: '6px' }}>اضغطي لرفع صورة</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#FDFAF7', borderRadius: '12px' }}>
                <img src={img} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                <span style={{ flex: 1, color: '#6D5D4D', fontSize: '0.8rem' }}>✅ {imgName}</span>
                <button onClick={() => { setImg(null); setImgName(''); }} style={{ padding: '6px 12px', background: 'rgba(200,80,80,0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#c55', fontSize: '0.8rem' }}>✕</button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#8D7D6D', fontSize: '0.85rem' }}>✏️ وصف التصميم</label>
            <textarea 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="مثال: فستان سهرة ذهبي مع تطريز يدوي وأكمام طويلة..."
              style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '0.9rem', border: '1px solid rgba(201,160,120,0.3)', background: '#FDFAF7', outline: 'none', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <button onClick={generate} style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, #D4AF91, ${gold})`, color: '#fff', border: 'none', borderRadius: '14px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
            ✨ استخرجي البرومبت
          </button>

          {output && (
            <div style={{ marginTop: '16px', padding: '14px', background: '#FDFAF7', borderRadius: '14px', border: '1px solid rgba(201,160,120,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: gold, fontSize: '0.9rem', fontWeight: '600' }}>📋 النتيجة</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(tab === 'design' || tab === 'video' || tab === 'generate') && (
                    <button onClick={translate} disabled={translated} style={{ padding: '6px 12px', background: translated ? '#aaa' : '#5A9A9A', border: 'none', borderRadius: '8px', cursor: translated ? 'not-allowed' : 'pointer', fontSize: '0.8rem', color: '#fff' }}>
                      🌐 {translated ? 'تمت الترجمة' : 'ترجمة'}
                    </button>
                  )}
                  <button onClick={copy} style={{ padding: '6px 14px', background: copied ? '#7CB07C' : gold, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#fff' }}>
                    {copied ? '✅ تم النسخ' : '📋 نسخ'}
                  </button>
                </div>
              </div>
              <div style={{ background: 'white', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', lineHeight: '1.8', color: '#5D4D3D', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                {output}
              </div>
            </div>
          )}
        </div>

        <footer style={{ textAlign: 'center', marginTop: '16px', color: '#B8A090', fontSize: '0.75rem' }}>
          Made with 💕 by <span style={{ color: gold }}>GH Fashion</span>
        </footer>
      </div>
    </div>
  );
}
