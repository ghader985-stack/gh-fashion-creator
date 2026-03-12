import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [activeTab, setActiveTab] = useState('extract');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [showPricing, setShowPricing] = useState(false);
  const [user, setUser] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const [adminCode, setAdminCode] = useState('');
  const [showAdminInput, setShowAdminInput] = useState(false);
  
  const [style, setStyle] = useState('elegant');
  const [category, setCategory] = useState('dress');
  const [gender, setGender] = useState('women');
  const [mood, setMood] = useState('dramatic');
  const [platform, setPlatform] = useState('instagram');
  const [tone, setTone] = useState('luxury');
  const [videoType, setVideoType] = useState('reel');
  const [shotStyle, setShotStyle] = useState('closeup');
  const [sceneCount, setSceneCount] = useState(3);
  const [startFrame, setStartFrame] = useState('');
  const [endFrame, setEndFrame] = useState('');

  const ADMIN_PASSWORD = 'SalyGh85';

  const plans = {
    admin: { name: 'Admin', limit: 999999, price: 0 },
    basic: { name: 'Basic', limit: 200, price: 15 },
    pro: { name: 'Pro', limit: 400, price: 35 },
    enterprise: { name: 'Enterprise', limit: 700, price: 70 }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('gh_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedUsage = localStorage.getItem('gh_usage');
    if (savedUsage) setUsageCount(parseInt(savedUsage));
  }, []);

  const tabs = [
    { id: 'extract', name: 'استخراج برومبت', icon: '🔍' },
    { id: 'fashion', name: 'تصوير الأزياء', icon: '👗' },
    { id: 'product', name: 'تصوير المنتجات', icon: '📦' },
    { id: 'video', name: 'برومبت فيديو', icon: '🎬' },
    { id: 'scene', name: 'إخراج المشهد', icon: '🎭' },
    { id: 'marketing', name: 'محتوى تسويقي', icon: '📱' },
  ];

  const stylesArr = ['elegant', 'casual', 'couture', 'minimalist', 'dramatic', 'romantic', 'edgy', 'classic'];
  const categories = ['dress', 'abaya', 'suit', 'jacket', 'gown', 'casual', 'sportswear', 'accessories'];
  const moods = ['dramatic', 'soft', 'energetic', 'mysterious', 'romantic', 'bold', 'natural', 'cinematic'];
  const platforms = ['instagram', 'tiktok', 'pinterest', 'story'];
  const tones = ['luxury', 'friendly', 'professional', 'inspiring', 'playful', 'sophisticated'];
  const videoTypes = ['reel', 'story', 'tiktok', 'commercial', 'lookbook', 'bts'];
  const shotStyles = ['closeup', 'full-body', 'detail', 'lifestyle', 'editorial', 'product-focus'];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => { setImage(null); setImagePreview(''); };
  
  const checkUsageLimit = () => {
    if (!user) return false;
    if (user.plan === 'admin') return true;
    return usageCount < plans[user.plan]?.limit;
  };
  
  const incrementUsage = () => {
    if (user?.plan === 'admin') return;
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem('gh_usage', newCount.toString());
  };

  const handleAdminLogin = () => {
    if (adminCode === ADMIN_PASSWORD) {
      const adminUser = { plan: 'admin', subscribedAt: new Date().toISOString() };
      setUser(adminUser);
      localStorage.setItem('gh_user', JSON.stringify(adminUser));
      setShowAdminInput(false);
      setAdminCode('');
      alert('مرحباً بك يا مالكة الأداة! 👑');
    } else {
      alert('كلمة السر غير صحيحة');
    }
  };

  const getPromptByTab = () => {
    const imageContext = image ? `\n\n📸 صورة مرفقة - حللها بدقة واستخدمها كمرجع أساسي.` : '';
    const textContext = textInput ? `\n\nوصف المستخدم: ${textInput}` : '';
    
    switch(activeTab) {
      case 'extract':
        return `أنتِ خبيرة في برومبتات توليد صور الأزياء.
${imageContext}${textContext}

قدمي:
═══════════════════════════════════════
🎯 البرومبت الرئيسي (إنجليزي - جاهز للنسخ)
═══════════════════════════════════════
[برومبت كامل مع: الوصف، الإضاءة، العدسة، الزاوية، الجودة 8K]

═══════════════════════════════════════
🚫 Negative Prompt
═══════════════════════════════════════
[ما يجب تجنبه]

═══════════════════════════════════════
⚙️ الإعدادات الموصى بها
═══════════════════════════════════════
• الأداة: Midjourney v6 / Leonardo AI
• Aspect Ratio: [النسبة]
• الإعدادات: [--q 2, --stylize 100]

═══════════════════════════════════════
🌐 الترجمة العربية الكاملة
═══════════════════════════════════════
[ترجمة كاملة ومفصلة]`;

      case 'fashion':
        return `أنتِ مصورة أزياء محترفة.
الستايل: ${style} | الفئة: ${category} | الجنس: ${gender === 'women' ? 'نساء' : 'رجال'}
${imageContext}${textContext}

قدمي:
═══════════════════════════════════════
📸 برومبت التصوير (إنجليزي)
═══════════════════════════════════════
[وصف الموديل، الملابس، الإضاءة، العدسة 85mm f/1.4، الخلفية، المود]

═══════════════════════════════════════
🚫 Negative Prompt
═══════════════════════════════════════

═══════════════════════════════════════
📷 إعدادات الكاميرا
═══════════════════════════════════════
• العدسة: Canon 85mm f/1.2L
• الفتحة: f/2.8 | ISO: 100
• الإضاءة: [وصف تفصيلي]

═══════════════════════════════════════
💡 نصائح التصوير
═══════════════════════════════════════

═══════════════════════════════════════
🌐 الترجمة العربية
═══════════════════════════════════════`;

      case 'product':
        return `أنتِ مصورة منتجات أزياء.
الفئة: ${category} | اللقطة: ${shotStyle}
${imageContext}${textContext}

قدمي:
═══════════════════════════════════════
📦 برومبت تصوير المنتج (إنجليزي)
═══════════════════════════════════════

═══════════════════════════════════════
🚫 Negative Prompt
═══════════════════════════════════════

═══════════════════════════════════════
📷 الإعدادات التقنية
═══════════════════════════════════════

═══════════════════════════════════════
🎨 3 زوايا مختلفة مقترحة
═══════════════════════════════════════
1. [برومبت الزاوية الأولى]
2. [برومبت الزاوية الثانية]
3. [برومبت الزاوية الثالثة]

═══════════════════════════════════════
🌐 الترجمة العربية
═══════════════════════════════════════`;

      case 'video':
        return `أنتِ مخرجة فيديوهات أزياء.
النوع: ${videoType} | المود: ${mood} | المنصة: ${platform}
${imageContext}${textContext}

قدمي:
═══════════════════════════════════════
🎬 برومبت الفيديو (إنجليزي)
═══════════════════════════════════════

═══════════════════════════════════════
📝 السيناريو المفصل
═══════════════════════════════════════

🎬 المشهد 1 | الافتتاحية (0:00-0:03)
• اللقطة: [وصف]
• الكاميرا: [حركة]
• الإضاءة: [وصف]
• الهدف: إيقاف السكرول

🎬 المشهد 2 | الكشف (0:03-0:08)
• اللقطة: [وصف]
• الكاميرا: [slow motion]
• الهدف: لحظة WOW

🎬 المشهد 3 | التفاصيل (0:08-0:15)
• 4 لقطات سريعة للقماش والتفاصيل

🎬 المشهد 4 | أسلوب الحياة (0:15-0:22)

🎬 المشهد 5 | CTA (0:22-0:30)

═══════════════════════════════════════
🎵 الموسيقى
═══════════════════════════════════════

═══════════════════════════════════════
🌐 الترجمة العربية
═══════════════════════════════════════`;

      case 'scene':
        return `أنتِ مخرجة سينمائية للأزياء.
عدد اللقطات: ${sceneCount} | الستايل: ${style} | المود: ${mood}
${startFrame ? `لقطة البداية: ${startFrame}` : ''}
${endFrame ? `لقطة النهاية: ${endFrame}` : ''}
${imageContext}${textContext}

قدمي:
═══════════════════════════════════════
🎭 المشهد السينمائي
═══════════════════════════════════════
الفكرة: [وصف المشهد والقصة]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 اللقطة 1 | البداية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**البرومبت:** [إنجليزي كامل]
• نوع اللقطة: [Close-up/Wide/Medium]
• العدسة: [mm]
• حركة الكاميرا: [Static/Dolly/Crane]
• الإضاءة: [وصف]
• المدة: [ثواني]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 اللقطة 2 | التطور
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[نفس التنسيق]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 اللقطة 3 | النهاية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[نفس التنسيق]

═══════════════════════════════════════
🎨 Color Grading
═══════════════════════════════════════

═══════════════════════════════════════
🎬 مرجعيات بصرية
═══════════════════════════════════════

═══════════════════════════════════════
🌐 الترجمة العربية
═══════════════════════════════════════`;

      case 'marketing':
        if (platform === 'story') {
          return `أنتِ خبيرة تسويق أزياء فاخرة.
النبرة: ${tone}
${imageContext}${textContext}

قدمي قصة تسويقية كاملة ومؤثرة للمنتج:

═══════════════════════════════════════
📖 القصة التسويقية الكاملة
═══════════════════════════════════════

**الفصل 1: الإلهام والولادة**
[اكتبي قصة مؤثرة عن من أين جاء إلهام هذا التصميم، ما القصة وراءه، من أي ثقافة أو فن أو لحظة استوحي - فقرتين على الأقل]

**الفصل 2: الحرفية والتفاصيل**
[اكتبي عن جودة الصناعة، المواد المستخدمة، الاهتمام بالتفاصيل، ساعات العمل - فقرتين]

**الفصل 3: المرأة التي ترتديه**
[اكتبي عن شخصية المرأة المثالية لهذا التصميم، كيف ستشعر، أين سترتديه، ما الثقة التي سيمنحها - فقرتين]

**الفصل 4: اللحظة**
[اكتبي سيناريو تخيلي للحظة ارتداء هذا التصميم، المكان، الأجواء، ردود الفعل - فقرتين]

═══════════════════════════════════════
✨ الرسالة التسويقية المختصرة
═══════════════════════════════════════
[جملة واحدة قوية تلخص جوهر المنتج]

═══════════════════════════════════════
🎯 الشعار الإعلاني (Tagline)
═══════════════════════════════════════
[3 خيارات للشعار]`;
        }
        
        return `أنتِ خبيرة تسويق أزياء فاخرة.
المنصة: ${platform} | النبرة: ${tone}
${imageContext}${textContext}

قدمي:
═══════════════════════════════════════
✨ الكابشنات
═══════════════════════════════════════
📝 قصير: [سطر]
📝 متوسط: [2-3 أسطر]
📝 طويل: [فقرة]

═══════════════════════════════════════
📱 5 أفكار ريل
═══════════════════════════════════════
🎬 ريل 1: [العنوان والفكرة والترند]
🎬 ريل 2:
🎬 ريل 3:
🎬 ريل 4:
🎬 ريل 5:

═══════════════════════════════════════
📸 5 أفكار ستوري
═══════════════════════════════════════

═══════════════════════════════════════
#️⃣ الهاشتاقات
═══════════════════════════════════════
عربي: [15 هاشتاق]
إنجليزي: [15 هاشتاق]

═══════════════════════════════════════
🎯 Call to Action
═══════════════════════════════════════
1. [قوي] 2. [عاطفي] 3. [عاجل] 4. [فضولي] 5. [حصري]

═══════════════════════════════════════
📊 استراتيجية النشر
═══════════════════════════════════════`;

      default: return '';
    }
  };

  const handleGenerate = async () => {
    if (!user) { setShowPricing(true); return; }
    if (!checkUsageLimit()) { alert('انتهت توليداتك! جددي اشتراكك 💎'); setShowPricing(true); return; }
    setLoading(true); setResult('');
    try {
      const formData = new FormData();
      formData.append('prompt', getPromptByTab());
      formData.append('tab', activeTab);
      if (image) formData.append('image', image);
      const response = await fetch('/api/generate', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.error) setResult('❌ خطأ: ' + data.error);
      else { setResult(data.result); incrementUsage(); }
    } catch (error) { setResult('❌ خطأ في الاتصال'); }
    setLoading(false);
  };

  const copyToClipboard = () => { navigator.clipboard.writeText(result); alert('تم النسخ! ✅'); };
  
  const handleSubscribe = (plan) => {
    setUser({ plan, subscribedAt: new Date().toISOString() });
    localStorage.setItem('gh_user', JSON.stringify({ plan }));
    setUsageCount(0); localStorage.setItem('gh_usage', '0');
    setShowPricing(false);
    alert(`تم الاشتراك في ${plans[plan].name}! 🎉`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gh_user');
    localStorage.removeItem('gh_usage');
    setUsageCount(0);
  };

  return (
    <>
      <Head>
        <title>GH Fashion Creator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className="container">
        <header className="header">
          <div className="logo-container">
            <div className="logo-icon">GH</div>
            <div>
              <h1 className="logo-text">GH Fashion Creator</h1>
              <p className="logo-sub">مولد البرومبتات الاحترافي للأزياء ✨</p>
            </div>
          </div>
          <div className="header-actions">
            {user && (
              <div className="usage-info">
                {user.plan === 'admin' ? (
                  <span>👑 وضع المالك - بلا حدود</span>
                ) : (
                  <>
                    <span>الاستخدام: {usageCount}/{plans[user.plan]?.limit || 0}</span>
                    <div className="usage-bar">
                      <div className="usage-fill" style={{width: `${(usageCount/(plans[user.plan]?.limit || 1))*100}%`}}></div>
                    </div>
                  </>
                )}
              </div>
            )}
            {user ? (
              <div className="user-actions">
                {user.plan !== 'admin' && (
                  <button onClick={() => setShowPricing(true)} className="upgrade-btn">💎 ترقية</button>
                )}
                <button onClick={handleLogout} className="logout-btn">خروج</button>
              </div>
            ) : (
              <button onClick={() => setShowPricing(true)} className="upgrade-btn">🔐 اشتركي</button>
            )}
          </div>
        </header>

        <nav className="tabs-container">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}>
              <span>{tab.icon}</span> {tab.name}
            </button>
          ))}
        </nav>

        <main className="main">
          <section className="input-section">
            <h2 className="section-title">{tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.name}</h2>

            <div className="input-mode">
              <button onClick={() => setInputMode('text')} className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}>✏️ من وصف نصي</button>
              <button onClick={() => setInputMode('image')} className={`mode-btn ${inputMode === 'image' ? 'active' : ''}`}>🖼️ من صورة</button>
            </div>

            {inputMode === 'text' && (
              <div className="input-group">
                <label>اشرحي فكرتك:</label>
                <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)}
                  placeholder="مثال: فستان سهرة أحمر فاخر مع تطريز ذهبي..."></textarea>
              </div>
            )}

            {inputMode === 'image' && (
              <div className="input-group">
                <label>ارفعي صورة:</label>
                <div className="upload-area">
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button onClick={removeImage} className="remove-img">✕</button>
                    </div>
                  ) : (
                    <label className="upload-label">
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}} />
                      <span className="upload-icon">📁</span>
                      <span>اضغطي لرفع صورة</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'scene' && (
              <div className="scene-options">
                <div className="input-group">
                  <label>عدد اللقطات:</label>
                  <div className="option-buttons">
                    {[2,3,4,5].map(n => (
                      <button key={n} onClick={() => setSceneCount(n)} className={`option-btn ${sceneCount===n?'active':''}`}>{n} لقطات</button>
                    ))}
                  </div>
                </div>
                <div className="input-group">
                  <label>لقطة البداية (اختياري):</label>
                  <input type="text" value={startFrame} onChange={(e) => setStartFrame(e.target.value)} placeholder="كلوز أب على يد تلمس القماش..." />
                </div>
                <div className="input-group">
                  <label>لقطة النهاية (اختياري):</label>
                  <input type="text" value={endFrame} onChange={(e) => setEndFrame(e.target.value)} placeholder="لقطة واسعة..." />
                </div>
              </div>
            )}

            <div className="options-grid">
              {(activeTab === 'fashion' || activeTab === 'scene') && (
                <div className="option-group">
                  <label>الستايل:</label>
                  <div className="option-buttons">
                    {stylesArr.slice(0,4).map(s => (
                      <button key={s} onClick={() => setStyle(s)} className={`option-btn ${style===s?'active':''}`}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'fashion' && (
                <div className="option-group">
                  <label>الجنس:</label>
                  <div className="option-buttons">
                    <button onClick={() => setGender('women')} className={`option-btn ${gender==='women'?'active':''}`}>👩 نساء</button>
                    <button onClick={() => setGender('men')} className={`option-btn ${gender==='men'?'active':''}`}>👨 رجال</button>
                  </div>
                </div>
              )}
              {(activeTab === 'fashion' || activeTab === 'product') && (
                <div className="option-group">
                  <label>الفئة:</label>
                  <div className="option-buttons">
                    {categories.slice(0,4).map(c => (
                      <button key={c} onClick={() => setCategory(c)} className={`option-btn ${category===c?'active':''}`}>{c}</button>
                    ))}
                  </div>
                </div>
              )}
              {(activeTab === 'video' || activeTab === 'scene') && (
                <div className="option-group">
                  <label>المود:</label>
                  <div className="option-buttons">
                    {moods.slice(0,4).map(m => (
                      <button key={m} onClick={() => setMood(m)} className={`option-btn ${mood===m?'active':''}`}>{m}</button>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'video' && (
                <div className="option-group">
                  <label>نوع الفيديو:</label>
                  <div className="option-buttons">
                    {videoTypes.slice(0,4).map(v => (
                      <button key={v} onClick={() => setVideoType(v)} className={`option-btn ${videoType===v?'active':''}`}>{v}</button>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'marketing' && (
                <>
                  <div className="option-group">
                    <label>المنصة:</label>
                    <div className="option-buttons">
                      {platforms.map(p => (
                        <button key={p} onClick={() => setPlatform(p)} className={`option-btn ${platform===p?'active':''}`}>
                          {p === 'story' ? '📖 قصة تسويقية' : p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="option-group">
                    <label>النبرة:</label>
                    <div className="option-buttons">
                      {tones.slice(0,4).map(t => (
                        <button key={t} onClick={() => setTone(t)} className={`option-btn ${tone===t?'active':''}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {activeTab === 'product' && (
                <div className="option-group">
                  <label>نوع اللقطة:</label>
                  <div className="option-buttons">
                    {shotStyles.slice(0,4).map(s => (
                      <button key={s} onClick={() => setShotStyle(s)} className={`option-btn ${shotStyle===s?'active':''}`}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleGenerate} disabled={loading} className="generate-btn">
              {loading ? <><span className="spinner"></span> جاري التوليد...</> : <>✨ استخرج البرومبت</>}
            </button>
          </section>

          <section className="result-section">
            <div className="result-header">
              <h2 className="section-title">📋 النتيجة</h2>
              {result && <button onClick={copyToClipboard} className="copy-btn">📋 نسخ</button>}
            </div>
            <div className="result-area">
              {result ? <div className="result-content">{result}</div> : <p className="placeholder">✨ النتيجة ستظهر هنا...</p>}
            </div>
          </section>
        </main>

        {showPricing && (
          <div className="modal-overlay">
            <div className="modal">
              <button onClick={() => setShowPricing(false)} className="close-modal">✕</button>
              <h2 className="modal-title">💎 اختاري باقتك</h2>
              <p className="modal-sub">اشتركي الآن وابدئي بإنشاء برومبتات احترافية</p>
              
              {/* Admin Login */}
              <div className="admin-section">
                {!showAdminInput ? (
                  <button onClick={() => setShowAdminInput(true)} className="admin-link">🔑 دخول المالك</button>
                ) : (
                  <div className="admin-input-group">
                    <input 
                      type="password" 
                      value={adminCode} 
                      onChange={(e) => setAdminCode(e.target.value)}
                      placeholder="كلمة السر"
                      className="admin-input"
                    />
                    <button onClick={handleAdminLogin} className="admin-btn">دخول</button>
                    <button onClick={() => {setShowAdminInput(false); setAdminCode('');}} className="admin-cancel">إلغاء</button>
                  </div>
                )}
              </div>

              <div className="pricing-grid">
                <div className="pricing-card">
                  <div className="plan-icon">✨</div>
                  <h3>Basic</h3>
                  <div className="plan-price">$15<span>/شهر</span></div>
                  <ul><li>✓ 200 توليد</li><li>✓ جميع الأدوات</li><li>✓ دعم إيميل</li></ul>
                  <button onClick={() => handleSubscribe('basic')} className="subscribe-btn">اشتركي الآن</button>
                </div>
                <div className="pricing-card featured">
                  <div className="popular-badge">⭐ الأكثر شعبية</div>
                  <div className="plan-icon">💎</div>
                  <h3>Pro</h3>
                  <div className="plan-price">$35<span>/شهر</span></div>
                  <ul><li>✓ 400 توليد</li><li>✓ أولوية دعم</li><li>✓ ميزات حصرية</li></ul>
                  <button onClick={() => handleSubscribe('pro')} className="subscribe-btn pro">اشتركي الآن</button>
                </div>
                <div className="pricing-card">
                  <div className="plan-icon">👑</div>
                  <h3>Enterprise</h3>
                  <div className="plan-price">$70<span>/شهر</span></div>
                  <ul><li>✓ 700 توليد</li><li>✓ مدير حساب</li><li>✓ دعم أولوية 24/7</li></ul>
                  <button onClick={() => handleSubscribe('enterprise')} className="subscribe-btn">اشتركي الآن</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="footer">© 2026 GH Fashion Creator 🌸</footer>
      </div>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Tajawal', sans-serif; background: linear-gradient(135deg, #fdf2f8 0%, #faf5ff 50%, #f0f9ff 100%); min-height: 100vh; direction: rtl; }
        .container { min-height: 100vh; }
        .header { background: linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .logo-container { display: flex; align-items: center; gap: 1rem; }
        .logo-icon { width: 55px; height: 55px; background: rgba(255,255,255,0.2); border-radius: 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.3rem; }
        .logo-text { font-size: 1.6rem; font-weight: 800; color: white; }
        .logo-sub { font-size: 0.85rem; color: rgba(255,255,255,0.9); }
        .header-actions { display: flex; align-items: center; gap: 1rem; }
        .user-actions { display: flex; gap: 0.5rem; }
        .usage-info { background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 20px; color: white; font-size: 0.85rem; }
        .usage-bar { width: 100px; height: 6px; background: rgba(255,255,255,0.3); border-radius: 3px; margin-top: 4px; }
        .usage-fill { height: 100%; background: white; border-radius: 3px; }
        .upgrade-btn { background: white; color: #ec4899; border: none; padding: 0.6rem 1.2rem; border-radius: 25px; font-weight: 700; cursor: pointer; }
        .logout-btn { background: rgba(255,255,255,0.2); color: white; border: none; padding: 0.6rem 1rem; border-radius: 20px; cursor: pointer; font-size: 0.85rem; }
        .tabs-container { display: flex; justify-content: center; gap: 0.5rem; padding: 1.5rem; flex-wrap: wrap; background: white; }
        .tab { background: white; border: 2px solid #e9d5ff; padding: 0.75rem 1.25rem; border-radius: 30px; color: #7c3aed; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .tab.active { background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; border-color: transparent; }
        .main { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem; max-width: 1400px; margin: 0 auto; }
        @media (max-width: 900px) { .main { grid-template-columns: 1fr; } }
        .input-section, .result-section { background: white; border-radius: 25px; padding: 2rem; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
        .section-title { font-size: 1.4rem; margin-bottom: 1.5rem; color: #7c3aed; font-weight: 700; }
        .input-mode { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
        .mode-btn { flex: 1; padding: 1rem; border: 2px solid #e9d5ff; border-radius: 15px; background: white; color: #7c3aed; cursor: pointer; font-weight: 600; }
        .mode-btn.active { background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; border-color: transparent; }
        .input-group { margin-bottom: 1.5rem; }
        .input-group label { display: block; margin-bottom: 0.5rem; color: #7c3aed; font-weight: 600; }
        .input-group textarea, .input-group input { width: 100%; padding: 1rem; border: 2px solid #e9d5ff; border-radius: 15px; background: #fdf4ff; font-size: 1rem; font-family: 'Tajawal'; }
        .input-group textarea { min-height: 120px; resize: vertical; }
        .upload-area { border: 3px dashed #d8b4fe; border-radius: 20px; padding: 2rem; text-align: center; background: linear-gradient(135deg, #fdf4ff 0%, #faf5ff 100%); }
        .upload-label { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; color: #a855f7; }
        .upload-icon { font-size: 2.5rem; }
        .image-preview { position: relative; display: inline-block; }
        .image-preview img { max-width: 100%; max-height: 200px; border-radius: 15px; }
        .remove-img { position: absolute; top: -10px; right: -10px; width: 30px; height: 30px; border-radius: 50%; background: #ef4444; color: white; border: none; cursor: pointer; }
        .scene-options { background: #fdf4ff; padding: 1.5rem; border-radius: 15px; margin-bottom: 1.5rem; }
        .options-grid { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
        .option-group { margin-bottom: 0.5rem; }
        .option-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .option-btn { padding: 0.6rem 1.2rem; border: 2px solid #e9d5ff; border-radius: 25px; background: white; color: #7c3aed; cursor: pointer; font-weight: 500; }
        .option-btn.active { background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; border-color: transparent; }
        .generate-btn { width: 100%; padding: 1.2rem; background: linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%); color: white; border: none; border-radius: 15px; font-size: 1.2rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .generate-btn:disabled { opacity: 0.7; }
        .spinner { width: 22px; height: 22px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .copy-btn { padding: 0.6rem 1.2rem; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; }
        .result-area { background: linear-gradient(135deg, #fdf4ff 0%, #faf5ff 100%); border-radius: 15px; padding: 1.5rem; min-height: 400px; overflow-y: auto; border: 1px solid #e9d5ff; }
        .result-content { white-space: pre-wrap; line-height: 1.9; color: #374151; }
        .placeholder { color: #a78bfa; text-align: center; padding: 3rem; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: white; border-radius: 30px; padding: 2.5rem; max-width: 900px; width: 95%; max-height: 90vh; overflow-y: auto; position: relative; }
        .close-modal { position: absolute; top: 1rem; left: 1rem; background: #f3e8ff; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; color: #7c3aed; }
        .modal-title { text-align: center; font-size: 2rem; color: #7c3aed; margin-bottom: 0.5rem; }
        .modal-sub { text-align: center; color: #9ca3af; margin-bottom: 1rem; }
        .admin-section { text-align: center; margin-bottom: 2rem; padding: 1rem; background: #fdf4ff; border-radius: 15px; }
        .admin-link { background: none; border: none; color: #a855f7; cursor: pointer; font-size: 0.9rem; text-decoration: underline; }
        .admin-input-group { display: flex; gap: 0.5rem; justify-content: center; align-items: center; flex-wrap: wrap; }
        .admin-input { padding: 0.5rem 1rem; border: 2px solid #e9d5ff; border-radius: 10px; width: 150px; }
        .admin-btn { padding: 0.5rem 1rem; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; border: none; border-radius: 10px; cursor: pointer; }
        .admin-cancel { padding: 0.5rem 1rem; background: #e5e7eb; color: #6b7280; border: none; border-radius: 10px; cursor: pointer; }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        @media (max-width: 800px) { .pricing-grid { grid-template-columns: 1fr; } }
        .pricing-card { background: white; border-radius: 25px; padding: 2rem; text-align: center; border: 2px solid #e9d5ff; position: relative; }
        .pricing-card.featured { border-color: #a855f7; box-shadow: 0 10px 40px rgba(168,85,247,0.2); transform: scale(1.05); }
        .popular-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; padding: 0.4rem 1.2rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
        .plan-icon { font-size: 3rem; margin-bottom: 1rem; }
        .pricing-card h3 { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; }
        .plan-price { font-size: 2.5rem; font-weight: 800; color: #7c3aed; margin-bottom: 1rem; }
        .plan-price span { font-size: 1rem; font-weight: 400; color: #9ca3af; }
        .pricing-card ul { list-style: none; margin-bottom: 1.5rem; text-align: right; }
        .pricing-card li { padding: 0.5rem 0; }
        .subscribe-btn { width: 100%; padding: 1rem; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; border: none; border-radius: 15px; font-weight: 700; cursor: pointer; }
        .subscribe-btn.pro { box-shadow: 0 4px 15px rgba(168,85,247,0.4); }
        .footer { text-align: center; padding: 2rem; color: #9ca3af; }
      `}</style>
    </>
  );
}
