import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [activeTab, setActiveTab] = useState('design');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [arabicContent, setArabicContent] = useState('');
  const [showArabic, setShowArabic] = useState(false);
  const [copied, setCopied] = useState(false);
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
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [marketingCTA, setMarketingCTA] = useState('shop-now');
  const [storyTone, setStoryTone] = useState('luxury');
  const [storyLength, setStoryLength] = useState('medium');
  const [storyDesc, setStoryDesc] = useState('');

  const gold = '#D4AF37';

  const styles = [{id:'elegant',en:'Elegant',ar:'أنيق'},{id:'casual',en:'Casual',ar:'كاجوال'},{id:'haute-couture',en:'Haute Couture',ar:'هوت كوتور'},{id:'minimalist',en:'Minimalist',ar:'مينيمالست'},{id:'bohemian',en:'Bohemian',ar:'بوهيمي'},{id:'vintage',en:'Vintage',ar:'فينتج'}];
  const categories = [{id:'dress',en:'Dress',ar:'فستان'},{id:'suit',en:'Suit',ar:'بدلة'},{id:'jacket',en:'Jacket',ar:'جاكيت'},{id:'abaya',en:'Abaya',ar:'عباية'},{id:'kaftan',en:'Kaftan',ar:'قفطان'},{id:'coat',en:'Coat',ar:'معطف'}];
  const colors = [{id:'black',en:'Black',ar:'أسود',hex:'#000'},{id:'white',en:'White',ar:'أبيض',hex:'#FFF'},{id:'red',en:'Red',ar:'أحمر',hex:'#DC2626'},{id:'navy',en:'Navy',ar:'كحلي',hex:'#1E3A5F'},{id:'gold',en:'Gold',ar:'ذهبي',hex:'#D4AF37'},{id:'burgundy',en:'Burgundy',ar:'خمري',hex:'#722F37'}];
  const fabrics = [{id:'silk',en:'Silk',ar:'حرير'},{id:'velvet',en:'Velvet',ar:'مخمل'},{id:'cotton',en:'Cotton',ar:'قطن'},{id:'satin',en:'Satin',ar:'ساتان'},{id:'chiffon',en:'Chiffon',ar:'شيفون'},{id:'lace',en:'Lace',ar:'دانتيل'}];
  const seasons = [{id:'spring-summer',en:'Spring/Summer',ar:'ربيع/صيف'},{id:'fall-winter',en:'Fall/Winter',ar:'خريف/شتاء'},{id:'resort',en:'Resort',ar:'ريزورت'}];
  const occasions = [{id:'evening',en:'Evening',ar:'سهرة'},{id:'casual',en:'Casual',ar:'يومي'},{id:'formal',en:'Formal',ar:'رسمي'},{id:'wedding',en:'Wedding',ar:'زفاف'}];
  const videoTypes = [{id:'runway',en:'Runway',ar:'عرض أزياء'},{id:'lookbook',en:'Lookbook',ar:'لوك بوك'},{id:'product',en:'Product',ar:'عرض منتج'},{id:'behind-scenes',en:'Behind Scenes',ar:'خلف الكواليس'}];
  const videoMoods = [{id:'dramatic',en:'Dramatic',ar:'درامي'},{id:'elegant',en:'Elegant',ar:'راقي'},{id:'energetic',en:'Energetic',ar:'حيوي'},{id:'romantic',en:'Romantic',ar:'رومانسي'}];
  const cameraMoves = [{id:'slow-pan',en:'Slow Pan',ar:'تحريك بطيء'},{id:'360-rotation',en:'360°',ar:'دوران 360°'},{id:'zoom-in',en:'Zoom In',ar:'تقريب'},{id:'tracking',en:'Tracking',ar:'تتبع'}];
  const lightingTypes = [{id:'studio',en:'Studio',ar:'استديو'},{id:'natural',en:'Natural',ar:'طبيعية'},{id:'dramatic',en:'Dramatic',ar:'درامية'},{id:'golden-hour',en:'Golden Hour',ar:'ساعة ذهبية'}];
  const platforms = [{id:'instagram-reel',en:'Instagram Reel',ar:'ريل انستغرام'},{id:'instagram-post',en:'Instagram Post',ar:'بوست انستغرام'},{id:'tiktok',en:'TikTok',ar:'تيك توك'},{id:'instagram-story',en:'Story',ar:'ستوري'}];
  const tones = [{id:'luxury',en:'Luxury',ar:'فاخر'},{id:'friendly',en:'Friendly',ar:'ودي'},{id:'professional',en:'Professional',ar:'احترافي'},{id:'inspiring',en:'Inspiring',ar:'ملهم'}];
  const ctas = [{id:'shop-now',en:'Shop Now',ar:'تسوقي الآن'},{id:'link-bio',en:'Link in Bio',ar:'الرابط بالبايو'},{id:'dm',en:'DM to Order',ar:'راسلينا للطلب'},{id:'limited',en:'Limited',ar:'كمية محدودة'}];
  const storyLengths = [{id:'short',en:'Short',ar:'قصيرة'},{id:'medium',en:'Medium',ar:'متوسطة'},{id:'long',en:'Long',ar:'طويلة'}];

  const generateDesign = () => {
    const style = styles.find(s => s.id === designStyle);
    const cat = categories.find(c => c.id === designCategory);
    const col = colors.find(c => c.id === designColor);
    const fab = fabrics.find(f => f.id === designFabric);
    const sea = seasons.find(s => s.id === designSeason);
    const occ = occasions.find(o => o.id === designOccasion);
    
    const en = `HIGH-END FASHION PHOTOGRAPHY PROMPT

DESIGN SPECIFICATIONS:
• Style: ${style.en}
• Category: ${cat.en}
• Color: ${col.en}
• Fabric: ${fab.en}
• Season: ${sea.en}
• Occasion: ${occ.en}
${designDetails ? `• Details: ${designDetails}` : ''}

PROMPT FOR AI IMAGE GENERATION:
Stunning high-fashion editorial photograph of a ${style.en.toLowerCase()} ${col.en.toLowerCase()} ${fab.en.toLowerCase()} ${cat.en.toLowerCase()}, ${sea.en} collection. Professional runway model wearing the design, Vogue magazine cover quality, dramatic studio lighting with soft shadows, ultra-detailed fabric texture, impeccable tailoring, 8K resolution, shot by Mario Testino style.${designDetails ? ` Features: ${designDetails}.` : ''} Perfect for ${occ.en.toLowerCase()} occasions.

TECHNICAL PARAMETERS:
--ar 3:4 --style raw --v 6.1 --q 2

NEGATIVE PROMPT:
low quality, amateur, wrinkled fabric, poor lighting, blurry, distorted, bad anatomy`;

    const ar = `برومبت تصوير أزياء احترافي

مواصفات التصميم:
• الستايل: ${style.ar}
• الفئة: ${cat.ar}
• اللون: ${col.ar}
• القماش: ${fab.ar}
• الموسم: ${sea.ar}
• المناسبة: ${occ.ar}
${designDetails ? `• تفاصيل: ${designDetails}` : ''}

البرومبت لتوليد الصورة:
تصوير أزياء راقي لـ${cat.ar} ${style.ar} بلون ${col.ar} من قماش ${fab.ar}، مجموعة ${sea.ar}. عارضة أزياء محترفة، جودة غلاف مجلة فوغ، إضاءة استديو درامية، تفاصيل قماش فائقة الدقة، خياطة متقنة، دقة 8K.${designDetails ? ` يتميز بـ: ${designDetails}.` : ''} مثالي لمناسبات ${occ.ar}.

المعايير التقنية:
--ar 3:4 --style raw --v 6.1 --q 2

البرومبت السلبي:
جودة منخفضة، هاوي، قماش مجعد، إضاءة سيئة، ضبابي، مشوه`;

    setGeneratedPrompt(en);
    setArabicContent(ar);
    setShowArabic(false);
  };

  const generateVideo = () => {
    const type = videoTypes.find(t => t.id === videoType);
    const mood = videoMoods.find(m => m.id === videoMood);
    const cam = cameraMoves.find(c => c.id === videoCamera);
    const light = lightingTypes.find(l => l.id === videoLighting);

    const en = `FASHION VIDEO PRODUCTION PROMPT

VIDEO SPECIFICATIONS:
• Type: ${type.en}
• Mood: ${mood.en}
• Camera: ${cam.en}
• Lighting: ${light.en}
• Duration: ${videoDuration} seconds
${videoDetails ? `• Notes: ${videoDetails}` : ''}

DETAILED SHOT BREAKDOWN:

SCENE 1 - HOOK (0-3s):
• Shot: Extreme close-up of fabric texture
• Movement: Slow zoom out
• Audio: Dramatic sound effect

SCENE 2 - REVEAL (3-8s):
• Shot: Full garment reveal, hero angle
• Movement: ${cam.en}
• Lighting: ${light.en}
• Model turns gracefully

SCENE 3 - DETAILS (8-15s):
• Multiple quick cuts showing:
  - Fabric texture close-up
  - Stitching details
  - Movement and flow
  - Different angles

SCENE 4 - LIFESTYLE (15-${videoDuration-5}s):
• Model in aspirational setting
• Confident walk
• Natural movement

SCENE 5 - CLOSING (Final 5s):
• Beauty shot with branding
• Logo reveal

TECHNICAL SPECS:
• Resolution: 4K
• Frame Rate: 24fps cinematic
• Aspect: 9:16 (vertical) or 16:9
• Color: Cinematic grade`;

    const ar = `برومبت إنتاج فيديو أزياء

مواصفات الفيديو:
• النوع: ${type.ar}
• المزاج: ${mood.ar}
• الكاميرا: ${cam.ar}
• الإضاءة: ${light.ar}
• المدة: ${videoDuration} ثانية
${videoDetails ? `• ملاحظات: ${videoDetails}` : ''}

تفصيل اللقطات:

المشهد 1 - الجذب (0-3 ثانية):
• اللقطة: كلوز أب شديد لملمس القماش
• الحركة: زووم آوت بطيء
• الصوت: مؤثر صوتي درامي

المشهد 2 - الكشف (3-8 ثانية):
• اللقطة: كشف كامل للقطعة
• الحركة: ${cam.ar}
• الإضاءة: ${light.ar}
• العارضة تدور برشاقة

المشهد 3 - التفاصيل (8-15 ثانية):
• لقطات سريعة متعددة:
  - ملمس القماش
  - تفاصيل الخياطة
  - الحركة والتدفق
  - زوايا مختلفة

المشهد 4 - أسلوب الحياة (15-${videoDuration-5} ثانية):
• العارضة في مكان ملهم
• مشية واثقة
• حركة طبيعية

المشهد 5 - الختام (آخر 5 ثانية):
• لقطة جمالية مع البراند
• ظهور اللوغو

المواصفات التقنية:
• الدقة: 4K
• الإطارات: 24 إطار/ثانية
• النسبة: 9:16 أو 16:9
• الألوان: تدريج سينمائي`;

    setGeneratedPrompt(en);
    setArabicContent(ar);
    setShowArabic(false);
  };

  const generateMarketing = () => {
    const plat = platforms.find(p => p.id === marketingPlatform);
    const tone = tones.find(t => t.id === marketingTone);
    const cta = ctas.find(c => c.id === marketingCTA);
    const name = productName || '[Product Name]';
    const desc = productDesc || 'Luxury fashion piece with exquisite details';

    let en = `PROFESSIONAL ${plat.en.toUpperCase()} CONTENT

CONTENT BRIEF:
• Platform: ${plat.en}
• Tone: ${tone.en}
• Product: ${name}
• CTA: ${cta.en}

`;

    let ar = `محتوى ${plat.ar} احترافي

ملخص المحتوى:
• المنصة: ${plat.ar}
• النبرة: ${tone.ar}
• المنتج: ${name}
• الدعوة للعمل: ${cta.ar}

`;

    if (marketingPlatform.includes('reel') || marketingPlatform === 'tiktok') {
      en += `FULL REEL SCRIPT:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCENE 1: THE HOOK (0:00-0:03)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Shot: Extreme close-up of the most striking detail
🎥 Movement: Slow zoom out
💡 Lighting: Dramatic, highlighting texture
📝 Text: "Wait for it..." or "POV: You found THE dress"
🎵 Audio: Suspenseful sound effect
💭 Goal: Stop the scroll, create curiosity

SCENE 2: THE REVEAL (0:03-0:07)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Shot: Full product reveal - hero angle
🎥 Movement: Cinematic slow motion
📝 Text: "${name}"
🎵 Audio: Beat drop
💭 Goal: "Wow" moment

SCENE 3: THE DETAILS (0:07-0:15)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Rapid sequence:
   • Fabric texture (2s)
   • Stitching detail (2s)
   • Movement shot (2s)
   • Different angle (2s)
📝 Text overlays:
   • "Handcrafted perfection"
   • "Premium quality"
🎵 Audio: Rhythmic beats

SCENE 4: LIFESTYLE (0:15-0:22)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Shot: Model in aspirational setting
🎥 Movement: Walking shot
📝 Text: "For your special moments"
💭 Goal: Help viewer visualize

SCENE 5: CTA (0:22-0:25)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Shot: Product with branding
📝 Text: "${cta.en}" + "Link in bio 👆"
🎵 Audio: Music resolve

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAPTION (Copy Ready):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${includeEmojis ? '✨' : ''} ${name}

${desc}

${includeEmojis ? '🔥' : ''} Why you need this:
${includeEmojis ? '→' : '-'} Premium quality
${includeEmojis ? '→' : '-'} Timeless elegance
${includeEmojis ? '→' : '-'} Limited pieces

${includeEmojis ? '🛍️' : ''} ${cta.en}
${includeEmojis ? '👆' : ''} Link in bio

${includeHashtags ? '#fashion #luxury #style #ootd #designer #trending #viral #fyp #reels #fashionreels' : ''}

MUSIC SUGGESTIONS:
• Trending audio of the week
• Luxury/fashion beats
• Dramatic reveal sounds`;

      ar += `سكريبت الريل الكامل:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

المشهد 1: الجذب (0:00-0:03)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 اللقطة: كلوز أب شديد على أبرز تفصيلة
🎥 الحركة: زووم آوت بطيء
💡 الإضاءة: درامية
📝 النص: "انتظري..." أو "لما تلاقين الفستان المثالي"
🎵 الصوت: مؤثر تشويقي
💭 الهدف: إيقاف السكرول

المشهد 2: الكشف (0:03-0:07)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 اللقطة: كشف كامل للمنتج
🎥 الحركة: سلو موشن سينمائي
📝 النص: "${name}"
🎵 الصوت: دروب البيت
💭 الهدف: لحظة "واو"

المشهد 3: التفاصيل (0:07-0:15)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 تسلسل سريع:
   • ملمس القماش (2 ثانية)
   • تفاصيل الخياطة (2 ثانية)
   • لقطة حركة (2 ثانية)
   • زاوية مختلفة (2 ثانية)
📝 نصوص:
   • "إتقان يدوي"
   • "جودة فاخرة"

المشهد 4: أسلوب الحياة (0:15-0:22)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 اللقطة: العارضة في مكان ملهم
📝 النص: "للحظاتك المميزة"

المشهد 5: الدعوة للعمل (0:22-0:25)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 اللقطة: المنتج مع البراند
📝 النص: "${cta.ar}" + "الرابط بالبايو 👆"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

الكابشن (جاهز للنسخ):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${includeEmojis ? '✨' : ''} ${name}

${desc}

${includeEmojis ? '🔥' : ''} ليش تحتاجينها:
${includeEmojis ? '←' : '-'} جودة فاخرة
${includeEmojis ? '←' : '-'} أناقة خالدة
${includeEmojis ? '←' : '-'} قطع محدودة

${includeEmojis ? '🛍️' : ''} ${cta.ar}
${includeEmojis ? '👆' : ''} الرابط بالبايو

${includeHashtags ? '#أزياء #فاشن #موضة #ستايل #ريلز #ترند #اكسبلور #فخامة #تسوق' : ''}`;
    } else {
      en += `POST CAPTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${includeEmojis ? '✨' : ''} ${name}

${desc}

${includeEmojis ? '💫' : ''} What makes it special:
• Premium materials
• Attention to detail
• Timeless design

${includeEmojis ? '🛍️' : ''} ${cta.en}

${includeHashtags ? '#fashion #style #luxury #designer #ootd' : ''}`;

      ar += `الكابشن:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${includeEmojis ? '✨' : ''} ${name}

${desc}

${includeEmojis ? '💫' : ''} ما يميزها:
• خامات فاخرة
• اهتمام بالتفاصيل
• تصميم خالد

${includeEmojis ? '🛍️' : ''} ${cta.ar}

${includeHashtags ? '#أزياء #ستايل #فخامة #موضة #تسوق' : ''}`;
    }

    setGeneratedPrompt(en);
    setArabicContent(ar);
    setShowArabic(false);
  };

  const generateStory = () => {
    const tone = tones.find(t => t.id === storyTone);
    const desc = storyDesc || 'A luxurious fashion piece';

    const stories = {
      luxury: {
        short: `In a world where ordinary is forgotten, we created the extraordinary.

This isn't just fashion—it's a statement. Every stitch whispers luxury. Every fold speaks elegance.

For those who refuse to blend in.`,
        medium: `There are moments that define us.

Moments when we walk into a room and time pauses. When all eyes turn—not because we demand attention, but because we command presence.

This piece was born from that vision. A vision of unapologetic elegance. Of craftsmanship that honors tradition while embracing modern femininity.

Every detail considered. Every stitch intentional. From the whisper of fabric against your skin to the way it moves with your every step.

Because you don't just wear luxury. You embody it.`,
        long: `THE ART OF PRESENCE

In the quiet hours before dawn, in an atelier where time moves differently, magic happens.

Hands that have mastered their craft over generations begin their delicate dance with fabric, thread, and vision. This is where your piece was born—not in a factory, but in a space where "good enough" doesn't exist.

THE FABRIC
We searched three continents for this material. Rejected hundreds of samples. Because we weren't looking for fabric—we were looking for poetry you could touch.

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

This is that piece. Made with love, designed for YOU.`,
        medium: `Can we be real for a sec? 💕

You know those mornings when your closet is FULL but you have "nothing to wear"? We've ALL been there.

That's exactly why we created this piece.

It's designed to be YOUR go-to. Comfortable enough for all day, stunning enough for any occasion.

We obsessed over every detail:
✓ The fit? Tested on real bodies
✓ The fabric? Feels like a dream
✓ The style? Current but timeless

This is fashion that gets you. Finally. 🙌`,
        long: `LET'S GET REAL 💕

We started this brand because we were frustrated.

Frustrated with fashion that promised comfort but delivered discomfort. With "luxury" that fell apart after three washes. With sizing that made no sense.

Sound familiar?

SO WE DID SOMETHING ABOUT IT

Every decision starts with: "Would WE want this?"

This piece took 8 months to perfect. EIGHT MONTHS. We kept sending it back:
"The sleeve isn't right."
"The hem needs adjusting."
"The color is 0.5% off."

Because you work hard for your money. When you spend it with us, that means something.

WHAT WE WANT FOR YOU

When this arrives, we want you to have that moment. Where you try it on, look in the mirror, and just... smile.

The fabric moves with you. The cut flatters. It's the piece your future self will thank you for.

Welcome to fashion that actually cares. 💕`
      },
      inspiring: {
        short: `She didn't dress for others.

She dressed for the woman she was becoming.

This is one of those pieces. For every woman writing her own story. ✨`,
        medium: `Before she satisfies the world, she was herself.

She learned that waiting for permission meant waiting forever. So she stopped asking. She started choosing—her path, her voice, her style.

This piece isn't about fitting in. It's about standing out—on your own terms.

When she puts this on, something shifts. Her shoulders go back. Her chin lifts.

Your moment isn't coming. It's here. Dress for it.`,
        long: `THE WOMAN WHO CHOSE HERSELF

She remembers the moment everything changed.

It wasn't dramatic. Just a quiet morning, standing in front of her closet, reaching for the same safe choices.

And then... she didn't.

THE SHIFT
That day, she chose differently. Not louder. Not more expensive. Just more HER.

It started with clothes but didn't end there. She spoke up in meetings. Asked for the promotion. Set boundaries. Started that project she'd been "thinking about" for years.

All because one morning, she decided to stop dressing for disappearance and start dressing for presence.

THIS PIECE
We designed it for women at crossroads. For the one deciding whether to play it safe or bet on herself.

Wear this on the day you ask for what you deserve. On the day you walk away from what no longer serves you.

THE TRUTH
Clothes don't change your life. YOU change your life. But the right piece can remind you of who you're becoming.

This is for you. Now go show them what you're made of. ✨`
      },
      professional: {
        short: `Crafted with precision. Designed for excellence.

This piece represents our commitment to quality that speaks for itself.

For the professional who values substance over flash.`,
        medium: `In a market saturated with trends, we chose timeless quality.

This piece represents months of development. Countless iterations. An unwavering commitment to excellence.

THE RESULT:
• Superior materials from certified suppliers
• Construction exceeding industry standards
• Design transcending seasonal trends
• Durability tested for years of wear

This isn't a purchase. It's an investment.

For the discerning individual who understands quality is never an expense—it's value that compounds.`,
        long: `A NOTE ON CRAFTSMANSHIP

In an era of disposable fashion, we chose to swim against the current.

MATERIAL SELECTION
Our sourcing begins 18 months before a piece reaches you. We work exclusively with mills meeting our criteria:
• Certified sustainable practices
• Fair labor conditions
• Quality exceeding ISO standards

We reject 73% of samples.

DESIGN PHILOSOPHY
One principle: Create pieces you'll want in 10 years.

This means avoiding trend-dependent elements. Refining silhouettes over seasons. Testing across body types.

CONSTRUCTION
Each piece passes 47 checkpoints:
• Seams reinforced at stress points
• Hems weighted for optimal drape
• Hardware tested for 10,000+ uses

Defect tolerance: Less than 0.3%—far below the 2-3% industry average.

THE RESULT
What you receive isn't merely a garment. It's the culmination of expertise and uncompromising commitment. A piece designed to become a cornerstone of your wardrobe.

We invite you to experience the difference.`
      }
    };

    const toneKey = storyTone === 'playful' ? 'friendly' : storyTone === 'urgent' ? 'professional' : storyTone;
    const storyContent = stories[toneKey]?.[storyLength] || stories.luxury.medium;

    const en = `MARKETING STORY

Tone: ${tone.en}
Length: ${storyLength}
Product: ${desc}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${storyContent}`;

    const arStories = {
      luxury: {
        short: `في عالم يُنسى فيه العادي، صنعنا الاستثنائي.

هذه ليست مجرد أزياء—إنها بيان. كل غرزة تهمس بالفخامة. كل طية تنطق بالأناقة.

لمن يرفضون الذوبان في الحشود.`,
        medium: `هناك لحظات تحددنا.

لحظات ندخل فيها غرفة ويتوقف الزمن. عندما تتجه الأنظار—ليس لأننا نطلب الاهتمام، بل لأننا نفرض الحضور.

وُلدت هذه القطعة من تلك الرؤية. رؤية الأناقة بلا اعتذار. الحرفية التي تكرم التقاليد وتحتضن الأنوثة العصرية.

كل تفصيلة مدروسة. كل غرزة بقصد. من همس القماش على بشرتك إلى طريقة حركته مع كل خطوة.

لأنك لا ترتدين الفخامة. أنتِ تجسدينها.`,
        long: `فن الحضور

في الساعات الهادئة قبل الفجر، في مشغل يتحرك فيه الزمن بشكل مختلف، يحدث السحر.

أيدٍ أتقنت حرفتها عبر أجيال تبدأ رقصتها مع القماش والخيط والرؤية.

القماش
بحثنا في ثلاث قارات. رفضنا مئات العينات. لأننا كنا نبحث عن شعر يمكنك لمسه.

التصميم
انبثق من رسومات لا تُحصى. عشرات النماذج. رفضنا ما يُرضي معظمهم—لأننا لسنا معظمهم.

الحرفية
اقلبيها—نتحداك. الداخل بلا عيوب كالخارج. كل درزة مُعززة يدوياً.

المرأة
صُممت لامرأة محددة. تدخل غرف الاجتماعات وقاعات الحفلات بثقة متساوية.

هل هذه أنتِ؟

مرحباً بكِ في معيار جديد للأناقة.`
      },
      friendly: {
        short: `هاي يا حلوة! 👋

تعرفين ذلك الشعور لما تلاقين القطعة المثالية؟

هذي هي. مصنوعة بحب، لكِ أنتِ.`,
        medium: `ممكن نكون صريحين؟ 💕

تعرفين تلك الصباحات لما الخزانة مليانة بس "ما في شي تلبسينه"؟ كلنا مرينا بهيك.

لهذا صنعنا هذه القطعة.

مصممة لتكون قطعتك المفضلة. مريحة لطوال اليوم، مذهلة لأي مناسبة.

اهتمينا بكل تفصيلة:
✓ القصة؟ جربناها على أجسام حقيقية
✓ القماش؟ إحساسه حلم
✓ الستايل؟ عصري وخالد

أزياء تفهمك. أخيراً. 🙌`,
        long: `خلينا نكون صريحين 💕

بدأنا هذا البراند لأننا كنا محبطين.

من أزياء وعدت بالراحة وقدمت الانزعاج. من "فخامة" تفككت بعد ثلاث غسلات.

مألوف؟

فسوينا شي

كل قرار يبدأ بـ: "هل نحن نبي هذا؟"

هذه القطعة أخذت 8 شهور. ثمانية شهور. ضلينا نرجعها:
"الكم مش مضبوط"
"الحاشية تحتاج تعديل"

لأنك تشتغلين بجد على فلوسك. لما تصرفينها معنا، هذا يعني شي.

اللي نتمناه لك

لما توصل، نبيك تعيشين تلك اللحظة. تجربينها، تطالعين بالمرآة، وتبتسمين.

القماش يتحرك معك. القصة تناسب.

مرحباً بك في أزياء تهتم فعلاً. 💕`
      },
      inspiring: {
        short: `لم تكن تلبس للآخرين.

كانت تلبس للمرأة التي تصبحها.

لكل امرأة تكتب قصتها. ✨`,
        medium: `قبل أن ترضي العالم، كانت نفسها.

تعلمت أن انتظار الإذن يعني الانتظار للأبد. فتوقفت عن السؤال. بدأت تختار—طريقها، صوتها، أسلوبها.

هذه القطعة ليست عن الاندماج. إنها عن التميز—بشروطك.

لما تلبسها، شيء يتغير. كتفاها ترجعان. ذقنها يرتفع.

لحظتك ليست قادمة. إنها هنا. البسي لها.`,
        long: `المرأة التي اختارت نفسها

تتذكر لحظة تغيّر كل شيء.

لم تكن درامية. صباح هادئ، واقفة أمام خزانتها، تمد يدها للخيارات الآمنة.

وبعدها... لم تفعل.

التحول
ذلك اليوم، اختارت بشكل مختلف. ليس أعلى. ليس أغلى. فقط أكثر هي.

بدأ بالملابس لكنه لم ينتهِ هناك. تكلمت بالاجتماعات. طلبت الترقية. وضعت حدوداً. بدأت ذلك المشروع.

هذه القطعة
صممناها للنساء عند مفترقات الطرق.

البسيها يوم تطلبين ما تستحقين. يوم تمشين بعيداً عما لم يعد يخدمك.

الحقيقة
الملابس لا تغير حياتك. أنتِ تغيرين حياتك. لكن القطعة المناسبة تذكرك بمن تصبحين.

هذه لكِ. اذهبي أريهم. ✨`
      },
      professional: {
        short: `مصنوعة بدقة. مصممة للتميز.

هذه القطعة تمثل التزامنا بالجودة.

للمحترفة التي تقدر الجوهر.`,
        medium: `في سوق مشبع بالصيحات، اخترنا الجودة الخالدة.

هذه القطعة تمثل شهوراً من التطوير. التزام لا يتزعزع بالتميز.

النتيجة:
• خامات متفوقة
• بناء يتجاوز المعايير
• تصميم يتخطى المواسم
• متانة مُختبرة

ليس شراء. إنه استثمار.

للذواقة التي تفهم أن الجودة ليست مصروفاً—إنها قيمة تتراكم.`,
        long: `ملاحظة عن الحرفية

في عصر الأزياء القابلة للتخلص، اخترنا السباحة عكس التيار.

اختيار المواد
يبدأ قبل 18 شهراً. نعمل حصرياً مع مصانع تلبي معاييرنا:
• استدامة معتمدة
• عمل عادل
• جودة تتجاوز المعايير

نرفض 73% من العينات.

فلسفة التصميم
مبدأ واحد: قطع ستريدينها بعد 10 سنوات.

تجنب العناصر الموسمية. صقل على مواسم. اختبار على أجسام متنوعة.

البناء
47 نقطة فحص:
• درزات مُعززة
• حواشي موزونة
• إكسسوارات مُختبرة

تحمل العيوب: أقل من 0.3%

النتيجة
ليس مجرد ثوب. تتويج للخبرة والالتزام.

ندعوك لتجربة الفرق.`
      }
    };

    const arContent = arStories[toneKey]?.[storyLength] || arStories.luxury.medium;
    
    const ar = `قصة تسويقية

النبرة: ${tone.ar}
الطول: ${storyLength === 'short' ? 'قصيرة' : storyLength === 'medium' ? 'متوسطة' : 'طويلة'}
المنتج: ${desc}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${arContent}`;

    setGeneratedPrompt(en);
    setArabicContent(ar);
    setShowArabic(false);
  };

  const handleGenerate = () => {
    if (activeTab === 'design') generateDesign();
    else if (activeTab === 'video') generateVideo();
    else if (activeTab === 'marketing') generateMarketing();
    else if (activeTab === 'story') generateStory();
  };

  const copyText = () => {
    navigator.clipboard.writeText(showArabic ? arabicContent : generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnStyle = (active) => ({
    padding: '10px 14px',
    background: active ? `linear-gradient(135deg, ${gold}, #F4E4BA)` : 'rgba(255,255,255,0.05)',
    border: active ? 'none' : `1px solid ${gold}40`,
    borderRadius: '8px',
    color: active ? '#0a0a0a' : '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600'
  });

  const inputStyle = {
    width: '100%',
    padding: '12px',
    background: 'rgba(0,0,0,0.3)',
    border: `1px solid ${gold}40`,
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px'
  };

  const sectionStyle = {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '25px',
    border: `1px solid ${gold}30`
  };

  return (
    <>
      <Head>
        <title>AI Fashion Creator - GH Fashion</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)', fontFamily: 'Montserrat, sans-serif', color: '#fff' }}>
        
        <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${gold}30` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '45px', height: '45px', background: `linear-gradient(135deg, ${gold}, #F4E4BA)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', color: '#0a0a0a' }}>GH</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontFamily: 'Playfair Display, serif' }}>AI Fashion Creator</h1>
              <p style={{ margin: 0, fontSize: '10px', color: gold, letterSpacing: '2px' }}>PROFESSIONAL PROMPT GENERATOR</p>
            </div>
          </div>
        </header>

        <nav style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '25px', flexWrap: 'wrap' }}>
          {[
            { id: 'design', icon: '🎨', label: 'Design' },
            { id: 'video', icon: '🎬', label: 'Video' },
            { id: 'marketing', icon: '📱', label: 'Marketing' },
            { id: 'story', icon: '📖', label: 'Story' },
            { id: 'pricing', icon: '💎', label: 'Pricing' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '12px 22px',
              background: activeTab === tab.id ? `linear-gradient(135deg, ${gold}, #F4E4BA)` : 'rgba(255,255,255,0.05)',
              border: activeTab === tab.id ? 'none' : `1px solid ${gold}50`,
              borderRadius: '25px',
              color: activeTab === tab.id ? '#0a0a0a' : '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <main style={{ padding: '20px 40px', maxWidth: '1300px', margin: '0 auto' }}>
          
          {activeTab === 'design' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div style={sectionStyle}>
                <h2 style={{ color: gold, marginBottom: '20px', fontFamily: 'Playfair Display, serif', fontSize: '18px' }}>🎨 Design Prompt</h2>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Style</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {styles.map(s => <button key={s.id} onClick={() => setDesignStyle(s.id)} style={btnStyle(designStyle === s.id)}>{s.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Category</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {categories.map(c => <button key={c.id} onClick={() => setDesignCategory(c.id)} style={btnStyle(designCategory === c.id)}>{c.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Color</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {colors.map(c => <button key={c.id} onClick={() => setDesignColor(c.id)} title={c.ar} style={{ width: '32px', height: '32px', background: c.hex, border: designColor === c.id ? `3px solid ${gold}` : '2px solid rgba(255,255,255,0.3)', borderRadius: '50%', cursor: 'pointer' }} />)}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Fabric</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {fabrics.map(f => <button key={f.id} onClick={() => setDesignFabric(f.id)} style={btnStyle(designFabric === f.id)}>{f.ar}</button>)}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Season</label>
                    <select value={designSeason} onChange={(e) => setDesignSeason(e.target.value)} style={inputStyle}>
                      {seasons.map(s => <option key={s.id} value={s.id} style={{background:'#1a1a2e'}}>{s.ar}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Occasion</label>
                    <select value={designOccasion} onChange={(e) => setDesignOccasion(e.target.value)} style={inputStyle}>
                      {occasions.map(o => <option key={o.id} value={o.id} style={{background:'#1a1a2e'}}>{o.ar}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Details (Optional)</label>
                  <textarea value={designDetails} onChange={(e) => setDesignDetails(e.target.value)} placeholder="تفاصيل إضافية..." style={{ ...inputStyle, height: '60px', resize: 'none' }} />
                </div>
                <button onClick={handleGenerate} style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${gold}, #F4E4BA)`, border: 'none', borderRadius: '10px', color: '#0a0a0a', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>✨ GENERATE</button>
              </div>
              <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ color: gold, fontFamily: 'Playfair Display, serif', margin: 0, fontSize: '18px' }}>📝 Result</h2>
                  <button onClick={() => setShowArabic(!showArabic)} style={{ padding: '6px 12px', background: showArabic ? gold : 'transparent', border: `1px solid ${gold}`, borderRadius: '15px', color: showArabic ? '#0a0a0a' : gold, cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>{showArabic ? 'EN' : 'عربي'}</button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '15px', minHeight: '400px', maxHeight: '500px', overflowY: 'auto', border: `1px solid ${gold}20`, marginBottom: '15px' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'rgba(255,255,255,0.9)', fontSize: '12px', lineHeight: '1.7', direction: showArabic ? 'rtl' : 'ltr', textAlign: showArabic ? 'right' : 'left', fontFamily: 'Montserrat, sans-serif' }}>{showArabic ? arabicContent : generatedPrompt || 'اختاري الخيارات واضغطي Generate'}</pre>
                </div>
                {generatedPrompt && <button onClick={copyText} style={{ width: '100%', padding: '12px', background: copied ? '#059669' : 'transparent', border: `2px solid ${gold}`, borderRadius: '8px', color: copied ? '#fff' : gold, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{copied ? '✓ تم النسخ!' : '📋 نسخ'}</button>}
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div style={sectionStyle}>
                <h2 style={{ color: gold, marginBottom: '20px', fontFamily: 'Playfair Display, serif', fontSize: '18px' }}>🎬 Video Prompt</h2>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {videoTypes.map(t => <button key={t.id} onClick={() => setVideoType(t.id)} style={btnStyle(videoType === t.id)}>{t.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Mood</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {videoMoods.map(m => <button key={m.id} onClick={() => setVideoMood(m.id)} style={btnStyle(videoMood === m.id)}>{m.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Camera</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {cameraMoves.map(c => <button key={c.id} onClick={() => setVideoCamera(c.id)} style={btnStyle(videoCamera === c.id)}>{c.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Lighting</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {lightingTypes.map(l => <button key={l.id} onClick={() => setVideoLighting(l.id)} style={btnStyle(videoLighting === l.id)}>{l.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Duration: {videoDuration}s</label>
                  <input type="range" min="10" max="60" value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)} style={{ width: '100%', accentColor: gold }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Notes</label>
                  <textarea value={videoDetails} onChange={(e) => setVideoDetails(e.target.value)} placeholder="ملاحظات..." style={{ ...inputStyle, height: '50px', resize: 'none' }} />
                </div>
                <button onClick={handleGenerate} style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${gold}, #F4E4BA)`, border: 'none', borderRadius: '10px', color: '#0a0a0a', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>🎬 GENERATE</button>
              </div>
              <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ color: gold, fontFamily: 'Playfair Display, serif', margin: 0, fontSize: '18px' }}>📝 Result</h2>
                  <button onClick={() => setShowArabic(!showArabic)} style={{ padding: '6px 12px', background: showArabic ? gold : 'transparent', border: `1px solid ${gold}`, borderRadius: '15px', color: showArabic ? '#0a0a0a' : gold, cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>{showArabic ? 'EN' : 'عربي'}</button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '15px', minHeight: '400px', maxHeight: '500px', overflowY: 'auto', border: `1px solid ${gold}20`, marginBottom: '15px' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'rgba(255,255,255,0.9)', fontSize: '12px', lineHeight: '1.7', direction: showArabic ? 'rtl' : 'ltr', textAlign: showArabic ? 'right' : 'left', fontFamily: 'Montserrat, sans-serif' }}>{showArabic ? arabicContent : generatedPrompt || 'اختاري الخيارات واضغطي Generate'}</pre>
                </div>
                {generatedPrompt && <button onClick={copyText} style={{ width: '100%', padding: '12px', background: copied ? '#059669' : 'transparent', border: `2px solid ${gold}`, borderRadius: '8px', color: copied ? '#fff' : gold, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{copied ? '✓ تم النسخ!' : '📋 نسخ'}</button>}
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div style={sectionStyle}>
                <h2 style={{ color: gold, marginBottom: '20px', fontFamily: 'Playfair Display, serif', fontSize: '18px' }}>📱 Marketing</h2>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Platform</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {platforms.map(p => <button key={p.id} onClick={() => setMarketingPlatform(p.id)} style={btnStyle(marketingPlatform === p.id)}>{p.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Tone</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {tones.map(t => <button key={t.id} onClick={() => setMarketingTone(t.id)} style={btnStyle(marketingTone === t.id)}>{t.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Product Name</label>
                  <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="اسم المنتج" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Description</label>
                  <textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="وصف المنتج..." style={{ ...inputStyle, height: '50px', resize: 'none' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>CTA</label>
                  <select value={marketingCTA} onChange={(e) => setMarketingCTA(e.target.value)} style={inputStyle}>
                    {ctas.map(c => <option key={c.id} value={c.id} style={{background:'#1a1a2e'}}>{c.ar}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>
                    <input type="checkbox" checked={includeHashtags} onChange={(e) => setIncludeHashtags(e.target.checked)} style={{ accentColor: gold }} /> Hashtags
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>
                    <input type="checkbox" checked={includeEmojis} onChange={(e) => setIncludeEmojis(e.target.checked)} style={{ accentColor: gold }} /> Emojis
                  </label>
                </div>
                <button onClick={handleGenerate} style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${gold}, #F4E4BA)`, border: 'none', borderRadius: '10px', color: '#0a0a0a', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>📱 GENERATE</button>
              </div>
              <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ color: gold, fontFamily: 'Playfair Display, serif', margin: 0, fontSize: '18px' }}>📝 Result</h2>
                  <button onClick={() => setShowArabic(!showArabic)} style={{ padding: '6px 12px', background: showArabic ? gold : 'transparent', border: `1px solid ${gold}`, borderRadius: '15px', color: showArabic ? '#0a0a0a' : gold, cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>{showArabic ? 'EN' : 'عربي'}</button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '15px', minHeight: '400px', maxHeight: '500px', overflowY: 'auto', border: `1px solid ${gold}20`, marginBottom: '15px' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'rgba(255,255,255,0.9)', fontSize: '12px', lineHeight: '1.7', direction: showArabic ? 'rtl' : 'ltr', textAlign: showArabic ? 'right' : 'left', fontFamily: 'Montserrat, sans-serif' }}>{showArabic ? arabicContent : generatedPrompt || 'اختاري الخيارات واضغطي Generate'}</pre>
                </div>
                {generatedPrompt && <button onClick={copyText} style={{ width: '100%', padding: '12px', background: copied ? '#059669' : 'transparent', border: `2px solid ${gold}`, borderRadius: '8px', color: copied ? '#fff' : gold, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{copied ? '✓ تم النسخ!' : '📋 نسخ'}</button>}
              </div>
            </div>
          )}

          {activeTab === 'story' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div style={sectionStyle}>
                <h2 style={{ color: gold, marginBottom: '20px', fontFamily: 'Playfair Display, serif', fontSize: '18px' }}>📖 Story Generator</h2>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Tone</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {tones.map(t => <button key={t.id} onClick={() => setStoryTone(t.id)} style={btnStyle(storyTone === t.id)}>{t.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Length</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {storyLengths.map(l => <button key={l.id} onClick={() => setStoryLength(l.id)} style={btnStyle(storyLength === l.id)}>{l.ar}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#F4E4BA', fontSize: '12px', fontWeight: '600' }}>Product Description</label>
                  <textarea value={storyDesc} onChange={(e) => setStoryDesc(e.target.value)} placeholder="صفي المنتج..." style={{ ...inputStyle, height: '100px', resize: 'none' }} />
                </div>
                <button onClick={handleGenerate} style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${gold}, #F4E4BA)`, border: 'none', borderRadius: '10px', color: '#0a0a0a', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>📖 GENERATE</button>
              </div>
              <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ color: gold, fontFamily: 'Playfair Display, serif', margin: 0, fontSize: '18px' }}>📝 Result</h2>
                  <button onClick={() => setShowArabic(!showArabic)} style={{ padding: '6px 12px', background: showArabic ? gold : 'transparent', border: `1px solid ${gold}`, borderRadius: '15px', color: showArabic ? '#0a0a0a' : gold, cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>{showArabic ? 'EN' : 'عربي'}</button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '15px', minHeight: '400px', maxHeight: '500px', overflowY: 'auto', border: `1px solid ${gold}20`, marginBottom: '15px' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'rgba(255,255,255,0.9)', fontSize: '12px', lineHeight: '1.7', direction: showArabic ? 'rtl' : 'ltr', textAlign: showArabic ? 'right' : 'left', fontFamily: 'Montserrat, sans-serif' }}>{showArabic ? arabicContent : generatedPrompt || 'اختاري الخيارات واضغطي Generate'}</pre>
                </div>
                {generatedPrompt && <button onClick={copyText} style={{ width: '100%', padding: '12px', background: copied ? '#059669' : 'transparent', border: `2px solid ${gold}`, borderRadius: '8px', color: copied ? '#fff' : gold, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{copied ? '✓ تم النسخ!' : '📋 نسخ'}</button>}
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
              {[
                { name: 'Basic', nameAr: 'أساسي', prompts: '100 prompts', price: 15 },
                { name: 'Pro', nameAr: 'احترافي', prompts: '500 prompts', price: 35, popular: true },
                { name: 'Unlimited', nameAr: 'لامحدود', prompts: 'Unlimited', price: 75 }
              ].map(plan => (
                <div key={plan.name} style={{
                  background: plan.popular ? `linear-gradient(135deg, ${gold}20, ${gold}10)` : 'rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  padding: '30px 20px',
                  border: plan.popular ? `2px solid ${gold}` : `1px solid ${gold}30`,
                  textAlign: 'center',
                  position: 'relative',
                  transform: plan.popular ? 'scale(1.05)' : 'none'
                }}>
                  {plan.popular && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: gold, padding: '4px 16px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', color: '#0a0a0a' }}>POPULAR</div>}
                  <h3 style={{ fontSize: '20px', color: gold, marginBottom: '5px', fontFamily: 'Playfair Display, serif' }}>{plan.name}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '15px', fontSize: '12px' }}>{plan.nameAr}</p>
                  <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '5px' }}>${plan.price}</div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px', fontSize: '12px' }}>{plan.prompts}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', textAlign: 'left' }}>
                    {['Design Prompts', 'Video Prompts', 'Marketing Content', 'Story Generator', 'Arabic + English'].map((f, i) => (
                      <li key={i} style={{ padding: '5px 0', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>✓ {f}</li>
                    ))}
                  </ul>
                  <button style={{
                    width: '100%',
                    padding: '12px',
                    background: plan.popular ? `linear-gradient(135deg, ${gold}, #F4E4BA)` : 'transparent',
                    border: plan.popular ? 'none' : `2px solid ${gold}`,
                    borderRadius: '8px',
                    color: plan.popular ? '#0a0a0a' : gold,
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}>GET STARTED</button>
                </div>
              ))}
            </div>
          )}

        </main>

        <footer style={{ textAlign: 'center', padding: '20px', borderTop: `1px solid ${gold}20`, color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
          <p>© 2026 GH Fashion Creator. All rights reserved.</p>
        </footer>

      </div>
    </>
  );
}
