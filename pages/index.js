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

    const en = `${fromImg ? '📸 PRODUCT IMAGE ATTACHED - Use as visual reference\n\n' : ''}══════════════════════════════════════════
📱 PROFESSIONAL REEL SCRIPT
══════════════════════════════════════════

🎯 SCENE 1: THE HOOK (0:00-0:03)
┌────────────────────────────────────────
│ 📍 SHOT: Extreme macro close-up
│    Fill frame with most striking detail
│    (embroidery, fabric texture, button)
│
│ 🎥 CAMERA: Static or ultra-slow zoom out
│    Shallow depth of field f/1.8
│
│ 💡 LIGHTING: Single dramatic side light
│    Creates texture and mystery
│
│ 📝 TEXT OPTIONS:
│    • "Wait for it..."
│    • "POV: You found THE one"
│    • "This changes everything"
│
│ 🎵 AUDIO: Suspenseful bass hit
│
│ 💭 GOAL: Stop the scroll, create curiosity
└────────────────────────────────────────

✨ SCENE 2: THE REVEAL (0:03-0:08)
┌────────────────────────────────────────
│ 📍 SHOT: Full product hero reveal
│    Model turns gracefully showing piece
│    Medium-wide framing
│
│ 🎥 CAMERA: Slow motion 60fps→24fps
│    Smooth tracking or gentle push-in
│
│ 💡 LIGHTING: Full professional setup
│    Rim light separating from background
│
│ 📝 TEXT: "${name}"
│    Elegant serif font, appears on beat
│
│ 🎵 AUDIO: Beat drop synced with reveal
│
│ 💭 GOAL: "WOW" moment, emotional peak
└────────────────────────────────────────

🔍 SCENE 3: THE DETAILS (0:08-0:16)
┌────────────────────────────────────────
│ 📍 4 QUICK SHOTS (2 seconds each):
│
│ SHOT A - FABRIC TEXTURE:
│    • Extreme close-up of material
│    • Hand gently touching fabric
│    • Text: "Handcrafted Excellence"
│
│ SHOT B - CONSTRUCTION:
│    • Stitching, seams, buttons detail
│    • Shows quality craftsmanship
│    • Text: "Premium Quality"
│
│ SHOT C - MOVEMENT:
│    • Fabric flowing, catching light
│    • Model walking or spinning
│    • Text: "Designed to Move"
│
│ SHOT D - UNIQUE ELEMENT:
│    • The signature detail
│    • What makes it special
│    • Text: "One of a Kind"
│
│ 🎥 CAMERA: Quick cuts on beat
│ 🎵 AUDIO: Rhythmic beats matching cuts
└────────────────────────────────────────

🌟 SCENE 4: LIFESTYLE (0:16-0:22)
┌────────────────────────────────────────
│ 📍 SHOT: Model in aspirational setting
│    • Luxury hotel lobby
│    • Art gallery / Rooftop
│    • High-end restaurant entrance
│
│ 🎥 CAMERA: Tracking shot
│    Model walks confidently toward camera
│
│ 📝 TEXT OPTIONS:
│    • "For moments that matter"
│    • "Dress the life you deserve"
│    • "Main character energy"
│
│ 🎵 AUDIO: Music emotional crescendo
│
│ 💭 GOAL: Viewer visualizes themselves
└────────────────────────────────────────

🛒 SCENE 5: CALL TO ACTION (0:22-0:25)
┌────────────────────────────────────────
│ 📍 SHOT: Product beauty shot + branding
│    Clean background, logo visible
│
│ 📝 TEXT (LARGE & CLEAR):
│    • "Shop Now"
│    • "Link in Bio 👆"
│    • "Limited Pieces Available"
│
│ 🎵 AUDIO: Music resolve + subtle whoosh
│
│ 💭 GOAL: Clear instruction, urgency
└────────────────────────────────────────

══════════════════════════════════════════
📝 CAPTION (COPY & PASTE READY)
══════════════════════════════════════════

${tone === 'luxury' ? `${e?'✨':''} ${name}

${desc}

${e?'🔥':''} Why this piece is extraordinary:
${e?'→':'•'} ${desc.includes('silk') || desc.includes('حرير') ? 'Pure silk that flows like liquid gold' : desc.includes('velvet') || desc.includes('مخمل') ? 'Luxurious velvet with rich depth' : desc.includes('lace') || desc.includes('دانتيل') ? 'Delicate lace crafted with precision' : 'Premium fabric selected for excellence'}
${e?'→':'•'} ${desc.includes('embroid') || desc.includes('تطريز') ? 'Hand-embroidered details that tell a story' : desc.includes('gold') || desc.includes('ذهب') ? 'Golden accents that catch every light' : 'Every detail perfected by master artisans'}
${e?'→':'•'} Limited pieces available - true exclusivity

${e?'💫':''} ${name} - For moments that deserve perfection

${e?'🛍️':''} Secure yours now
${e?'👆':''} Link in bio` : tone === 'friendly' ? `${e?'💕':''} OMG you guys!! ${name} is HERE! ${e?'😍':''}

Okay but seriously... ${desc}

${e?'✨':''} Why I'm obsessed:
${e?'💫':''} ${desc.includes('comfort') || desc.includes('مريح') ? 'SO comfortable you won\'t want to take it off!' : 'The fit is *chef\'s kiss*'}
${e?'💫':''} ${desc.includes('color') || desc.includes('لون') ? 'This color is EVERYTHING this season!' : 'Goes with literally everything in your closet'}
${e?'💫':''} The quality?! You have to feel it to believe it

${e?'🙌':''} Made for real women living real lives!

Drop a ${e?'❤️':''} if you need this!
${e?'👆':''} Link in bio babe!` : tone === 'professional' ? `${name}

${desc}

Product Highlights:
• ${desc.includes('silk') || desc.includes('حرير') ? 'Premium silk composition' : desc.includes('cotton') || desc.includes('قطن') ? 'Fine cotton construction' : 'Superior material quality'}
• ${desc.includes('hand') || desc.includes('يدوي') ? 'Artisan handcrafted details' : 'Precision manufacturing standards'}
• Designed for versatility and longevity

Investment dressing at its finest.

Available now via link in bio.` : `${e?'✨':''} She didn't ask permission.

She saw ${name} and she KNEW.

${desc}

${e?'💫':''} This is for the woman who:
${e?'→':'•'} ${desc.includes('elegant') || desc.includes('أنيق') ? 'Commands elegance without trying' : 'Writes her own rules'}
${e?'→':'•'} ${desc.includes('bold') || desc.includes('جريء') ? 'Isn\'t afraid to stand out' : 'Knows her worth and dresses like it'}
${e?'→':'•'} Refuses to wait for "someday"

Your moment is NOW.
${e?'👆':''} Link in bio - if you're ready`}

${h?`
.
.
.
#fashion #luxury #${name.toLowerCase().replace(/\s+/g, '')} #style #ootd #fashionreels #newcollection #designer #outfitinspo #fashionista #luxuryfashion #instafashion #trending #viral #fyp`:''}

══════════════════════════════════════════
🎵 MUSIC RECOMMENDATIONS
══════════════════════════════════════════
• Check "Trending Audio" in Reels tab weekly
• ${tone === 'luxury' ? 'Orchestral, elegant instrumentals' : tone === 'friendly' ? 'Upbeat trending pop sounds' : tone === 'professional' ? 'Minimal, sophisticated beats' : 'Empowering, dramatic builds'}
• Songs with clear "drop" for reveal moment

══════════════════════════════════════════
📊 POSTING STRATEGY
══════════════════════════════════════════
• Best times: 7-9 AM, 12-1 PM, 7-9 PM
• Respond to ALL comments in first hour
• Share to Stories immediately
• Use 3-5 hashtags in comments`;

    const ar = `${fromImg ? '📸 صورة المنتج مرفقة - استخدميها كمرجع بصري\n\n' : ''}══════════════════════════════════════════
📱 سكريبت ريل احترافي
══════════════════════════════════════════

🎯 المشهد 1: الجذب (0:00-0:03)
┌────────────────────────────────────────
│ 📍 اللقطة: ماكرو كلوز أب شديد
│    املئي الإطار بأبرز تفصيلة
│    (تطريز، ملمس القماش، زر فريد)
│
│ 🎥 الكاميرا: ثابتة أو زووم آوت بطيء جداً
│    عمق ميدان ضحل f/1.8
│
│ 💡 الإضاءة: ضوء جانبي درامي واحد
│    يخلق ملمس وغموض
│
│ 📝 خيارات النص:
│    • "انتظري..."
│    • "لما تلاقين القطعة المثالية"
│    • "هذي تغير كل شي"
│
│ 🎵 الصوت: بيس تشويقي
│
│ 💭 الهدف: إيقاف السكرول، خلق فضول
└────────────────────────────────────────

✨ المشهد 2: الكشف (0:03-0:08)
┌────────────────────────────────────────
│ 📍 اللقطة: كشف بطولي كامل للقطعة
│    العارضة تدور برشاقة تعرض القطعة
│    إطار متوسط-واسع
│
│ 🎥 الكاميرا: سلو موشن 60fps→24fps
│    تراكينغ سلس أو push-in لطيف
│
│ 💡 الإضاءة: إعداد احترافي كامل
│    ريم لايت يفصل عن الخلفية
│
│ 📝 النص: "${name}"
│    خط أنيق، يظهر مع البيت
│
│ 🎵 الصوت: دروب البيت متزامن مع الكشف
│
│ 💭 الهدف: لحظة "واو"، الذروة العاطفية
└────────────────────────────────────────

🔍 المشهد 3: التفاصيل (0:08-0:16)
┌────────────────────────────────────────
│ 📍 4 لقطات سريعة (2 ثانية لكل):
│
│ لقطة أ - ملمس القماش:
│    • كلوز أب شديد على الخامة
│    • يد تلمس القماش برفق
│    • النص: "إتقان يدوي"
│
│ لقطة ب - البناء والخياطة:
│    • تفاصيل الدرزات والأزرار
│    • تُظهر جودة الحرفية
│    • النص: "جودة فاخرة"
│
│ لقطة ج - الحركة:
│    • القماش يتدفق، يلتقط الضوء
│    • العارضة تمشي أو تدور
│    • النص: "مصمم للحركة"
│
│ لقطة د - العنصر الفريد:
│    • التفصيلة المميزة
│    • اللي يخليها خاصة
│    • النص: "قطعة واحدة"
│
│ 🎥 الكاميرا: قطعات سريعة على البيت
│ 🎵 الصوت: بيتات إيقاعية مع كل قطعة
└────────────────────────────────────────

🌟 المشهد 4: أسلوب الحياة (0:16-0:22)
┌────────────────────────────────────────
│ 📍 اللقطة: العارضة في مكان ملهم
│    • لوبي فندق فاخر
│    • غاليري فني / روف توب
│    • مدخل مطعم راقي
│
│ 🎥 الكاميرا: تراكينغ شوت
│    العارضة تمشي بثقة نحو الكاميرا
│
│ 📝 خيارات النص:
│    • "للحظات المهمة"
│    • "البسي الحياة اللي تستاهلينها"
│    • "طاقة البطلة"
│
│ 🎵 الصوت: ذروة الموسيقى العاطفية
│
│ 💭 الهدف: المشاهدة تتخيل نفسها
└────────────────────────────────────────

🛒 المشهد 5: الدعوة للعمل (0:22-0:25)
┌────────────────────────────────────────
│ 📍 اللقطة: لقطة جمالية + البراند
│    خلفية نظيفة، اللوغو واضح
│
│ 📝 النص (كبير وواضح):
│    • "تسوقي الآن"
│    • "الرابط بالبايو 👆"
│    • "قطع محدودة"
│
│ 🎵 الصوت: الموسيقى تنتهي + ووش خفيف
│
│ 💭 الهدف: تعليمات واضحة، إلحاح
└────────────────────────────────────────

══════════════════════════════════════════
📝 الكابشن (جاهز للنسخ واللصق)
══════════════════════════════════════════

${tone === 'luxury' ? `${e?'✨':''} ${name}

${desc}

${e?'🔥':''} ليش هالقطعة استثنائية:
${e?'←':'•'} ${desc.includes('silk') || desc.includes('حرير') ? 'حرير نقي يتدفق كالذهب السائل' : desc.includes('velvet') || desc.includes('مخمل') ? 'مخمل فاخر بعمق غني' : desc.includes('lace') || desc.includes('دانتيل') ? 'دانتيل رقيق مصنوع بدقة' : 'قماش فاخر مختار بعناية'}
${e?'←':'•'} ${desc.includes('embroid') || desc.includes('تطريز') ? 'تطريز يدوي يحكي قصة' : desc.includes('gold') || desc.includes('ذهب') ? 'لمسات ذهبية تلتقط كل ضوء' : 'كل تفصيلة أتقنها حرفيون متمرسون'}
${e?'←':'•'} قطع محدودة - تميز حقيقي

${e?'💫':''} ${name} - للحظات التي تستحق الكمال

${e?'🛍️':''} احجزي قطعتك الآن
${e?'👆':''} الرابط بالبايو` : tone === 'friendly' ? `${e?'💕':''} يا بنات!! ${name} وصلت! ${e?'😍':''}

بصراحة... ${desc}

${e?'✨':''} ليش مجنونة فيها:
${e?'💫':''} ${desc.includes('comfort') || desc.includes('مريح') ? 'مريحة لدرجة ما بتبين تشلينها!' : 'القصة *تجنن*'}
${e?'💫':''} ${desc.includes('color') || desc.includes('لون') ? 'هاللون هو كل شي هالموسم!' : 'تمشي مع كل شي بخزانتك'}
${e?'💫':''} الجودة؟! لازم تحسين فيها لتصدقين

${e?'🙌':''} مصنوعة لنساء حقيقيات بحياة حقيقية!

حطي ${e?'❤️':''} إذا تحتاجينها!
${e?'👆':''} الرابط بالبايو يا حلوة!` : tone === 'professional' ? `${name}

${desc}

مميزات المنتج:
• ${desc.includes('silk') || desc.includes('حرير') ? 'تركيبة حرير فاخر' : desc.includes('cotton') || desc.includes('قطن') ? 'بناء قطن فاخر' : 'جودة خامات متفوقة'}
• ${desc.includes('hand') || desc.includes('يدوي') ? 'تفاصيل يدوية حرفية' : 'معايير تصنيع دقيقة'}
• مصمم للتنوع والاستدامة

استثمار في الأناقة بأفضل صورها.

متوفر الآن - الرابط بالبايو.` : `${e?'✨':''} ما استأذنت من أحد.

شافت ${name} وعرفت.

${desc}

${e?'💫':''} هذي للمرأة اللي:
${e?'←':'•'} ${desc.includes('elegant') || desc.includes('أنيق') ? 'تفرض الأناقة بدون ما تحاول' : 'تكتب قوانينها بنفسها'}
${e?'←':'•'} ${desc.includes('bold') || desc.includes('جريء') ? 'ما تخاف تتميز' : 'تعرف قيمتها وتلبس على هالأساس'}
${e?'←':'•'} ترفض تنتظر "يوم ثاني"

لحظتك هي الآن.
${e?'👆':''} الرابط بالبايو - إذا جاهزة`}

${h?`
.
.
.
#أزياء #فاشن #${name.replace(/\s+/g, '_')} #موضة #ستايل #ريلز #ترند #اكسبلور #فخامة #تسوق #مصممة #أناقة #السعودية #الامارات #الكويت`:''}

══════════════════════════════════════════
🎵 اقتراحات الموسيقى
══════════════════════════════════════════
• تصفحي "الصوت الترند" بتاب الريلز أسبوعياً
• ${tone === 'luxury' ? 'موسيقى أوركسترالية أنيقة' : tone === 'friendly' ? 'أصوات بوب ترند راقصة' : tone === 'professional' ? 'بيتات راقية بسيطة' : 'موسيقى تمكينية درامية'}
• أغاني فيها "دروب" واضح للكشف

══════════════════════════════════════════
📊 استراتيجية النشر
══════════════════════════════════════════
• أفضل الأوقات: 7-9 صباحاً، 12-1 ظهراً، 7-9 مساءً
• ردي على كل التعليقات بأول ساعة
• شاركي بالستوري فوراً
• حطي 3-5 هاشتاقات بالتعليقات`;

    setPrompt(en); setPromptAr(ar); setShowAr(false);
  };

  const genStory = () => {
    const fromImg = inputMode === 'image' && image;
    const d = storyDesc || 'A luxurious fashion piece';
    
    const storiesEn = {
      luxury: { 
        short: `In a world drowning in ordinary, we chose extraordinary.

This isn't just fashion—it's a declaration. Every stitch whispers centuries of craft. Every fold speaks the language of elegance.

For those who refuse to blend in. For those who lead, not follow.

This is your moment. Own it.`, 
        medium: `There are moments that define us.

Moments when we walk into a room and time seems to pause. When all eyes turn—not because we demand attention, but because we command presence.

This piece was born from that vision. A vision of unapologetic elegance.

We spent months sourcing the perfect fabric—one that catches light like liquid gold, that moves with you like a second skin.

Every seam placed with intention. Every detail considered until it reached perfection.

This isn't mass production. This is art, wearable and alive.

Because you don't just wear luxury.
You embody it.`, 
        long: `THE ART OF PRESENCE

In the quiet hours before dawn, in an atelier where time moves differently, magic happens.

Hands that have mastered their craft over generations begin their delicate dance with fabric, thread, and vision.

THE FABRIC
We searched three continents. Rejected hundreds of samples. Because we weren't looking for fabric—we were looking for poetry you could touch.

THE DESIGN
Our design emerged from countless sketches. Dozens of prototypes. We rejected versions that would satisfy most—because we aren't most.

THE CRAFT
Turn it inside out—we dare you. The interior is as flawless as the exterior. Every seam reinforced by hand. Every edge finished with precision.

THE WOMAN
This was designed for a specific woman. She walks into boardrooms and ballrooms with equal confidence. She doesn't follow trends. She sets them.

Is this you?

Welcome to a new standard of elegance.` 
      },
      friendly: { 
        short: `Hey gorgeous! 👋

You know that feeling when you find THE piece? The one that makes you spin in the mirror?

Yeah. This is that piece.

Made with love, designed for YOU. Let's turn some heads! 💕`, 
        medium: `Can we be real for a sec? 💕

You know those mornings when your closet is FULL but you have "nothing to wear"? We've ALL been there.

That's exactly why we created this piece.

Comfortable enough for all day, stunning enough for any occasion. We tested it on real women—not models. Women with curves and lives.

We obsessed over every detail:
✓ The fit? Tested on real bodies
✓ The fabric? Feels like a dream
✓ The style? Current but timeless

This is fashion that gets you. Finally. 🙌`, 
        long: `LET'S GET REAL 💕

We started this brand because we were frustrated.

Frustrated with fashion that promised comfort but delivered discomfort. With "luxury" that fell apart after three washes. With sizing that made no sense.

SO WE DID SOMETHING ABOUT IT

Every decision starts with: "Would WE actually want this?"

This piece took 8 months. EIGHT MONTHS. We kept sending it back:
"The sleeve isn't right."
"The hem needs adjusting."
"The color is 0.5% off."

Because you work hard for your money. When you spend it with us, that means something. We REFUSE to let you down.

AND IF IT'S NOT PERFECT?
Send it back. No guilt trips. No hoops. Just a full refund.

Welcome to fashion that actually cares about you. 💕` 
      },
      inspiring: { 
        short: `She didn't dress for others.

She dressed for the woman she was becoming.

Every morning, she chose pieces that reminded her of her power. Her potential. Her promise to herself.

For every woman writing her own story. ✨`, 
        medium: `Before she satisfies the world, she was herself.

She learned that waiting for permission meant waiting forever. So she stopped asking. She started choosing—her path, her voice, her style.

This piece isn't about fitting in. It's about standing out—on your own terms.

When she puts this on, something shifts. Her shoulders go back. Her chin lifts.

The right piece doesn't change who you are.
It reveals who you've been all along.

Your moment isn't coming. It's here. Dress for it.`, 
        long: `THE WOMAN WHO CHOSE HERSELF

She remembers the moment everything changed.

It wasn't dramatic. Just a quiet morning, standing in front of her closet, reaching for the same safe choices.

And then... she didn't.

THE SHIFT
That day, she chose differently. Not louder. Not more expensive. Just more HER.

It started with clothes but didn't end there. She spoke up in meetings. Asked for the promotion. Set boundaries. Started that project she'd been "thinking about" for years.

THIS PIECE
We designed it for women at crossroads. For the one deciding whether to play it safe or bet on herself.

Wear this on the day you ask for what you deserve.
On the day you walk away from what no longer serves you.
On the day you finally stop apologizing for taking up space.

THE TRUTH
Clothes don't change your life. YOU change your life. But the right piece can remind you of who you're becoming.

Now go show them what you're made of. ✨` 
      }
    };

    const storiesAr = {
      luxury: { 
        short: `في عالم يغرق بالعادي، اخترنا الاستثنائي.

هذه ليست مجرد أزياء—إنها إعلان. كل غرزة تهمس بقرون من الحرفية. كل طية تتحدث لغة الأناقة.

لمن يرفضون الذوبان في الحشود. لمن يقودون، لا يتبعون.

هذه لحظتك. امتلكيها.`, 
        medium: `هناك لحظات تحددنا.

لحظات ندخل فيها غرفة ويبدو أن الزمن يتوقف. عندما تتجه كل الأنظار—ليس لأننا نطلب الاهتمام، بل لأننا نفرض الحضور.

وُلدت هذه القطعة من تلك الرؤية. رؤية الأناقة بلا اعتذار.

أمضينا شهوراً في البحث عن القماش المثالي—قماش يلتقط الضوء كالذهب السائل، يتحرك معك كجلد ثانٍ.

كل درزة وُضعت بقصد. كل تفصيلة رُوجعت حتى بلغت الكمال.

هذا ليس إنتاجاً ضخماً. هذا فن، قابل للارتداء وحي.

لأنك لا ترتدين الفخامة فحسب.
أنتِ تجسدينها.`, 
        long: `فن الحضور

في الساعات الهادئة قبل الفجر، في مشغل يتحرك فيه الزمن بشكل مختلف، يحدث السحر.

أيدٍ أتقنت حرفتها عبر أجيال تبدأ رقصتها الرقيقة مع القماش والخيط والرؤية.

القماش
بحثنا في ثلاث قارات. رفضنا مئات العينات. لأننا لم نكن نبحث عن قماش—كنا نبحث عن شعر يمكنك لمسه.

التصميم
انبثق تصميمنا من رسومات لا تُحصى. عشرات النماذج. رفضنا نسخاً كانت لترضي معظمهم—لأننا لسنا معظمهم.

الحرفية
اقلبيها من الداخل للخارج—نتحداك. الداخل بلا عيوب كالخارج. كل درزة مُعززة يدوياً. كل حافة مُنهاة بدقة.

المرأة
صُممت هذه لامرأة محددة. تدخل غرف الاجتماعات وقاعات الحفلات بثقة متساوية. لا تتبع الصيحات. هي تصنعها.

هل هذه أنتِ؟

مرحباً بكِ في معيار جديد للأناقة.` 
      },
      friendly: { 
        short: `هاي يا حلوة! 👋

تعرفين ذلك الشعور لما تلاقين القطعة المثالية؟ تلك التي تخليكِ تدورين قدام المرآة؟

أيوا. هذي هي تلك القطعة.

مصنوعة بحب، مصممة لكِ. خلينا نلفت الأنظار! 💕`, 
        medium: `ممكن نكون صريحين لحظة؟ 💕

تعرفين تلك الصباحات لما خزانتك مليانة بس "ما في شي تلبسينه"؟ كلنا مرينا بهيك.

لهذا بالضبط صنعنا هذه القطعة.

مريحة بما يكفي لطوال اليوم، مذهلة بما يكفي لأي مناسبة. جربناها على نساء حقيقيات—مش عارضات. نساء عندهم منحنيات وحياة.

اهتمينا بكل تفصيلة:
✓ القصة؟ جربناها على أجسام حقيقية
✓ القماش؟ إحساسه حلم
✓ الستايل؟ عصري وخالد

هذي أزياء تفهمك. أخيراً. 🙌`, 
        long: `خلينا نكون صريحين 💕

بدأنا هذا البراند لأننا كنا محبطين.

محبطين من أزياء وعدت بالراحة وقدمت الانزعاج. من "فخامة" تفككت بعد ثلاث غسلات. من مقاسات ما كان لها معنى.

فسوينا شي

كل قرار يبدأ بـ: "هل نحن فعلاً نبي هذا؟"

هذه القطعة أخذت 8 شهور. ثمانية شهور. ضلينا نرجعها:
"الكم مش مضبوط"
"الحاشية تحتاج تعديل"
"اللون بعيد 0.5%"

لأنك تشتغلين بجد على فلوسك. لما تصرفينها معنا، هذا يعني شي. نرفض نخذلك.

ولو مش مثالية؟
رجعيها. بدون تأنيب ضمير. استرجاع كامل.

مرحباً بك في أزياء تهتم فعلاً. 💕` 
      },
      inspiring: { 
        short: `لم تكن تلبس للآخرين.

كانت تلبس للمرأة التي تصبحها.

كل صباح، اختارت قطعاً تذكرها بقوتها. بإمكانياتها. بوعدها لنفسها.

لكل امرأة تكتب قصتها الخاصة. ✨`, 
        medium: `قبل أن ترضي العالم، كانت نفسها.

تعلمت أن انتظار الإذن يعني الانتظار للأبد. فتوقفت عن السؤال. بدأت تختار—طريقها، صوتها، أسلوبها.

هذه القطعة ليست عن الاندماج. إنها عن التميز—بشروطك الخاصة.

لما تلبسها، شيء يتغير. كتفاها ترجعان للخلف. ذقنها يرتفع.

القطعة المناسبة لا تغير من أنتِ.
تكشف من كنتِ دائماً.

لحظتك ليست قادمة. إنها هنا. البسي لها.`, 
        long: `المرأة التي اختارت نفسها

تتذكر اللحظة التي تغير فيها كل شيء.

لم تكن درامية. فقط صباح هادئ، واقفة أمام خزانتها، تمد يدها للخيارات الآمنة ذاتها.

وبعدها... لم تفعل.

التحول
ذلك اليوم، اختارت بشكل مختلف. ليس أعلى صوتاً. ليس أغلى ثمناً. فقط أكثر هي.

بدأ بالملابس لكنه لم ينتهِ هناك. تكلمت بالاجتماعات. طلبت الترقية. وضعت حدوداً. بدأت ذلك المشروع اللي كانت "تفكر فيه" لسنوات.

هذه القطعة
صممناها للنساء عند مفترقات الطرق. للتي تقرر إن كانت ستلعبها آمنة أم تراهن على نفسها.

البسيها يوم تطلبين ما تستحقين.
يوم تمشين بعيداً عما لم يعد يخدمك.
يوم تتوقفين أخيراً عن الاعتذار لأنك تأخذين مساحة.

الحقيقة
الملابس لا تغير حياتك. أنتِ تغيرين حياتك. لكن القطعة المناسبة تذكرك بمن تصبحين.

اذهبي أريهم مما أنتِ مصنوعة. ✨` 
      }
    };

    const storyEn = storiesEn[storyTone]?.[storyLen] || storiesEn.luxury.medium;
    const storyAr = storiesAr[storyTone]?.[storyLen] || storiesAr.luxury.medium;
    
    const en = `${fromImg ? '📸 PRODUCT IMAGE ATTACHED\n\n' : ''}══════════════════════════════════════════
📖 PROFESSIONAL MARKETING STORY
══════════════════════════════════════════

📋 Story Details:
• Tone: ${storyTone.charAt(0).toUpperCase() + storyTone.slice(1)}
• Length: ${storyLen.charAt(0).toUpperCase() + storyLen.slice(1)}
• Product: ${d}

══════════════════════════════════════════
📝 YOUR STORY (Copy & Use)
══════════════════════════════════════════

${storyEn}

══════════════════════════════════════════
💡 HOW TO USE THIS STORY
══════════════════════════════════════════
• Website "About" or "Our Story" page
• Product descriptions
• Email marketing campaigns
• Social media carousel posts
• Brand storytelling content`;

    const ar = `${fromImg ? '📸 صورة المنتج مرفقة\n\n' : ''}══════════════════════════════════════════
📖 قصة تسويقية احترافية
══════════════════════════════════════════

📋 تفاصيل القصة:
• النبرة: ${storyTone === 'luxury' ? 'فاخرة' : storyTone === 'friendly' ? 'ودية' : 'ملهمة'}
• الطول: ${storyLen === 'short' ? 'قصيرة' : storyLen === 'medium' ? 'متوسطة' : 'طويلة'}
• المنتج: ${d}

══════════════════════════════════════════
📝 قصتك (انسخيها واستخدميها)
══════════════════════════════════════════

${storyAr}

══════════════════════════════════════════
💡 كيف تستخدمين هذه القصة
══════════════════════════════════════════
• صفحة "عنا" أو "قصتنا" بالموقع
• وصف المنتجات
• حملات التسويق بالإيميل
• بوستات كاروسيل بالسوشال ميديا
• محتوى سرد قصة البراند`;

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
