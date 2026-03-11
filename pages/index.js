import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [activeTab, setActiveTab] = useState('extract');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState('text');
  
  // Design states
  const [style, setStyle] = useState('elegant');
  const [category, setCategory] = useState('dress');
  const [gender, setGender] = useState('women');
  const [mood, setMood] = useState('dramatic');
  const [platform, setPlatform] = useState('instagram');
  const [tone, setTone] = useState('luxury');
  const [videoType, setVideoType] = useState('reel');
  const [shotStyle, setShotStyle] = useState('closeup');

  const tabs = [
    { id: 'extract', name: 'استخراج برومبت', icon: '🔍' },
    { id: 'fashion', name: 'تصوير الأزياء', icon: '👗' },
    { id: 'product', name: 'تصوير المنتجات', icon: '📦' },
    { id: 'video', name: 'برومبت فيديو', icon: '🎬' },
    { id: 'scene', name: 'إخراج المشهد', icon: '🎭' },
    { id: 'marketing', name: 'محتوى تسويقي', icon: '📱' },
  ];

  const styles = ['elegant', 'casual', 'couture', 'minimalist', 'dramatic', 'romantic', 'edgy', 'classic'];
  const categories = ['dress', 'abaya', 'suit', 'jacket', 'gown', 'casual', 'sportswear', 'accessories'];
  const moods = ['dramatic', 'soft', 'energetic', 'mysterious', 'romantic', 'bold', 'natural', 'cinematic'];
  const platforms = ['instagram', 'tiktok', 'pinterest', 'website', 'print'];
  const tones = ['luxury', 'friendly', 'professional', 'inspiring', 'playful', 'sophisticated'];
  const videoTypes = ['reel', 'story', 'tiktok', 'commercial', 'lookbook', 'bts'];
  const shotStyles = ['closeup', 'full-body', 'detail', 'lifestyle', 'editorial', 'product-focus'];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview('');
  };

  const getPromptByTab = () => {
    const imageContext = image ? `\n\nالمستخدم رفع صورة - حللها واستخدمها كمرجع أساسي للبرومبت.` : '';
    const textContext = textInput ? `\n\nوصف المستخدم: ${textInput}` : '';
    
    switch(activeTab) {
      case 'extract':
        return `أنت خبير في كتابة برومبتات توليد الصور الاحترافية للأزياء والموضة.

المطلوب: استخراج برومبت احترافي بالإنجليزية جاهز للاستخدام في Midjourney أو Stable Diffusion.
${imageContext}${textContext}

قدم:
1. **البرومبت الرئيسي (بالإنجليزية):**
   - برومبت مفصل يشمل: الموضوع، الإضاءة، زاوية الكاميرا، الألوان، الستايل، الجودة
   
2. **Negative Prompt:**
   - ما يجب تجنبه

3. **الإعدادات المقترحة:**
   - Aspect Ratio
   - Style parameters

4. **الترجمة العربية:**
   - ترجمة البرومبت للعربية للفهم`;

      case 'fashion':
        return `أنت مصور أزياء محترف ومتخصص في كتابة برومبتات تصوير الموديلز والأزياء.

المطلوب: برومبت تصوير أزياء احترافي
الستايل: ${style}
الفئة: ${category}
الجنس: ${gender === 'women' ? 'نساء' : 'رجال'}
${imageContext}${textContext}

قدم برومبت احترافي يشمل:

1. **برومبت التصوير (بالإنجليزية):**
   - وصف الموديل والوقفة
   - تفاصيل الملابس والأكسسوارات
   - الإضاءة (نوعها، اتجاهها، شدتها)
   - الخلفية والأجواء
   - زاوية الكاميرا والعدسة
   - المود والإحساس العام

2. **Negative Prompt**

3. **إعدادات الكاميرا المقترحة:**
   - نوع العدسة
   - الإعدادات التقنية

4. **نصائح للتصوير**

5. **الترجمة العربية للبرومبت**`;

      case 'product':
        return `أنت مصور منتجات محترف متخصص في تصوير الأزياء والإكسسوارات.

المطلوب: برومبت تصوير منتج أزياء احترافي
الفئة: ${category}
نوع اللقطة: ${shotStyle}
${imageContext}${textContext}

قدم:

1. **برومبت تصوير المنتج (بالإنجليزية):**
   - وصف دقيق للمنتج
   - نوع الخلفية والسطح
   - إعداد الإضاءة المثالي
   - زاوية التصوير
   - التفاصيل البارزة للإظهار

2. **Negative Prompt**

3. **إعدادات احترافية:**
   - نوع العدسة الماكرو/عادية
   - إعدادات الكاميرا

4. **أفكار للتنويع:**
   - 3 زوايا مختلفة مقترحة
   - أفكار للتصوير الإبداعي

5. **الترجمة العربية**`;

      case 'video':
        return `أنت مخرج فيديوهات أزياء ومحتوى محترف.

المطلوب: برومبت فيديو احترافي
نوع الفيديو: ${videoType}
المود: ${mood}
المنصة: ${platform}
${imageContext}${textContext}

قدم:

1. **برومبت الفيديو (بالإنجليزية):**
   - وصف المشهد العام
   - حركة الكاميرا
   - الإضاءة والألوان
   - المود والأجواء

2. **سيناريو مفصل:**
   - المشهد 1 (0-3 ثواني): الافتتاحية
   - المشهد 2 (3-8 ثواني): الكشف
   - المشهد 3 (8-15 ثواني): التفاصيل
   - المشهد 4 (15-25 ثواني): الأسلوب
   - المشهد 5 (25-30 ثواني): الختام والـ CTA

3. **حركات الكاميرا:**
   - لكل مشهد بالتفصيل

4. **الموسيقى والصوت:**
   - نوع الموسيقى المقترحة
   - المؤثرات الصوتية

5. **الترجمة العربية**`;

      case 'scene':
        return `أنت مخرج سينمائي ومصور مشاهد أزياء محترف.

المطلوب: إخراج مشهد سينمائي للأزياء
الستايل: ${style}
المود: ${mood}
${imageContext}${textContext}

قدم:

1. **وصف المشهد السينمائي (بالإنجليزية):**
   - الموقع والديكور
   - الإضاءة السينمائية
   - تكوين الكادر
   - حركة الممثل/الموديل
   - الملابس والستايلينغ

2. **التفاصيل التقنية:**
   - نوع العدسة
   - حركة الكاميرا
   - Color grading مقترح

3. **المرجعيات البصرية:**
   - أفلام أو مصورين للإلهام

4. **Mood Board وصفي:**
   - الألوان الرئيسية
   - الأجواء والمشاعر

5. **الترجمة العربية**`;

      case 'marketing':
        return `أنت خبير تسويق رقمي ومحتوى للأزياء والموضة.

المطلوب: محتوى تسويقي احترافي
المنصة: ${platform}
النبرة: ${tone}
${imageContext}${textContext}

قدم:

1. **الكابشن (3 نسخ):**
   - قصير (سطر واحد)
   - متوسط (2-3 أسطر)
   - طويل (فقرة كاملة)

2. **الهاشتاقات:**
   - 10 هاشتاقات عربية
   - 10 هاشتاقات إنجليزية

3. **Call to Action:**
   - 5 خيارات مختلفة

4. **أفكار للستوري:**
   - 5 أفكار للستوري مع وصف كل واحدة

5. **سكريبت ريل قصير:**
   - 15-30 ثانية مع التوقيت

6. **استراتيجية النشر:**
   - أفضل الأوقات
   - نصائح للتفاعل`;

      default:
        return '';
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult('');

    try {
      const formData = new FormData();
      formData.append('prompt', getPromptByTab());
      formData.append('tab', activeTab);
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.error) {
        setResult('❌ خطأ: ' + data.error);
      } else {
        setResult(data.result);
      }
    } catch (error) {
      setResult('❌ حدث خطأ في الاتصال. حاولي مرة أخرى.');
    }

    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    alert('تم النسخ! ✅');
  };

  return (
    <>
      <Head>
        <title>GH Fashion Creator - AI Fashion Prompt Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <div style={logoStyle}>
            <span style={logoIconStyle}>GH</span>
            <div>
              <h1 style={logoTextStyle}>GH Fashion Creator</h1>
              <p style={logoSubStyle}>مولد البرومبتات الاحترافي للأزياء</p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <nav style={tabsContainerStyle}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...tabStyle,
                ...(activeTab === tab.id ? activeTabStyle : {}),
              }}
            >
              <span style={{ marginLeft: '8px' }}>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <main style={mainStyle}>
          {/* Input Section */}
          <section style={inputSectionStyle}>
            <h2 style={sectionTitleStyle}>
              {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.name}
            </h2>

            {/* Input Mode Toggle */}
            <div style={inputModeStyle}>
              <button
                onClick={() => setInputMode('text')}
                style={{
                  ...modeButtonStyle,
                  ...(inputMode === 'text' ? activeModeStyle : {}),
                }}
              >
                ✏️ من وصف نصي
              </button>
              <button
                onClick={() => setInputMode('image')}
                style={{
                  ...modeButtonStyle,
                  ...(inputMode === 'image' ? activeModeStyle : {}),
                }}
              >
                🖼️ من صورة
              </button>
            </div>

            {/* Text Input */}
            {inputMode === 'text' && (
              <div style={inputGroupStyle}>
                <label style={labelStyle}>اشرحي فكرتك أو المشهد المطلوب:</label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="مثال: فستان سهرة أحمر فاخر مع تطريز ذهبي، تصوير في قصر كلاسيكي..."
                  style={textareaStyle}
                />
              </div>
            )}

            {/* Image Upload */}
            {inputMode === 'image' && (
              <div style={inputGroupStyle}>
                <label style={labelStyle}>ارفعي صورة للتحليل:</label>
                <div style={uploadAreaStyle}>
                  {imagePreview ? (
                    <div style={imagePreviewContainerStyle}>
                      <img src={imagePreview} alt="Preview" style={previewImageStyle} />
                      <button onClick={removeImage} style={removeImageStyle}>✕</button>
                    </div>
                  ) : (
                    <label style={uploadLabelStyle}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      <span style={uploadIconStyle}>📁</span>
                      <span>اضغطي لرفع صورة</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Options based on tab */}
            <div style={optionsGridStyle}>
              {(activeTab === 'fashion' || activeTab === 'scene') && (
                <>
                  <div style={optionGroupStyle}>
                    <label style={labelStyle}>الستايل:</label>
                    <div style={optionButtonsStyle}>
                      {styles.slice(0, 4).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStyle(s)}
                          style={{
                            ...optionBtnStyle,
                            ...(style === s ? activeOptionStyle : {}),
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeTab === 'fashion' && (
                    <div style={optionGroupStyle}>
                      <label style={labelStyle}>الجنس:</label>
                      <div style={optionButtonsStyle}>
                        <button
                          onClick={() => setGender('women')}
                          style={{
                            ...optionBtnStyle,
                            ...(gender === 'women' ? activeOptionStyle : {}),
                          }}
                        >
                          👩 نساء
                        </button>
                        <button
                          onClick={() => setGender('men')}
                          style={{
                            ...optionBtnStyle,
                            ...(gender === 'men' ? activeOptionStyle : {}),
                          }}
                        >
                          👨 رجال
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {(activeTab === 'fashion' || activeTab === 'product') && (
                <div style={optionGroupStyle}>
                  <label style={labelStyle}>الفئة:</label>
                  <div style={optionButtonsStyle}>
                    {categories.slice(0, 4).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        style={{
                          ...optionBtnStyle,
                          ...(category === c ? activeOptionStyle : {}),
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(activeTab === 'video' || activeTab === 'scene') && (
                <div style={optionGroupStyle}>
                  <label style={labelStyle}>المود:</label>
                  <div style={optionButtonsStyle}>
                    {moods.slice(0, 4).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMood(m)}
                        style={{
                          ...optionBtnStyle,
                          ...(mood === m ? activeOptionStyle : {}),
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'video' && (
                <div style={optionGroupStyle}>
                  <label style={labelStyle}>نوع الفيديو:</label>
                  <div style={optionButtonsStyle}>
                    {videoTypes.slice(0, 4).map((v) => (
                      <button
                        key={v}
                        onClick={() => setVideoType(v)}
                        style={{
                          ...optionBtnStyle,
                          ...(videoType === v ? activeOptionStyle : {}),
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'marketing' && (
                <>
                  <div style={optionGroupStyle}>
                    <label style={labelStyle}>المنصة:</label>
                    <div style={optionButtonsStyle}>
                      {platforms.slice(0, 4).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPlatform(p)}
                          style={{
                            ...optionBtnStyle,
                            ...(platform === p ? activeOptionStyle : {}),
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={optionGroupStyle}>
                    <label style={labelStyle}>النبرة:</label>
                    <div style={optionButtonsStyle}>
                      {tones.slice(0, 4).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          style={{
                            ...optionBtnStyle,
                            ...(tone === t ? activeOptionStyle : {}),
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'product' && (
                <div style={optionGroupStyle}>
                  <label style={labelStyle}>نوع اللقطة:</label>
                  <div style={optionButtonsStyle}>
                    {shotStyles.slice(0, 4).map((s) => (
                      <button
                        key={s}
                        onClick={() => setShotStyle(s)}
                        style={{
                          ...optionBtnStyle,
                          ...(shotStyle === s ? activeOptionStyle : {}),
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                ...generateButtonStyle,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <span style={spinnerStyle}></span>
                  جاري التوليد...
                </>
              ) : (
                <>✨ استخرج البرومبت</>
              )}
            </button>
          </section>

          {/* Result Section */}
          <section style={resultSectionStyle}>
            <div style={resultHeaderStyle}>
              <h2 style={sectionTitleStyle}>📋 النتيجة</h2>
              {result && (
                <button onClick={copyToClipboard} style={copyButtonStyle}>
                  📋 نسخ
                </button>
              )}
            </div>
            <div style={resultAreaStyle}>
              {result ? (
                <div style={resultContentStyle}>{result}</div>
              ) : (
                <p style={placeholderStyle}>
                  النتيجة ستظهر هنا بعد التوليد...
                </p>
              )}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer style={footerStyle}>
          <p>© 2026 GH Fashion Creator - Professional AI Fashion Prompt Generator</p>
        </footer>
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Tajawal', 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
          min-height: 100vh;
          direction: rtl;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// Styles
const containerStyle = {
  minHeight: '100vh',
  color: '#fff',
};

const headerStyle = {
  background: 'linear-gradient(135deg, #d4a574 0%, #c4956a 100%)',
  padding: '1rem 2rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const logoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const logoIconStyle = {
  width: '50px',
  height: '50px',
  background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: '800',
  fontSize: '1.2rem',
};

const logoTextStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: '#1a1a2e',
  margin: 0,
};

const logoSubStyle = {
  fontSize: '0.8rem',
  color: '#333',
  margin: 0,
};

const tabsContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '1.5rem',
  flexWrap: 'wrap',
  background: 'rgba(255,255,255,0.05)',
};

const tabStyle = {
  background: 'rgba(255,255,255,0.1)',
  border: '2px solid rgba(212, 165, 116, 0.3)',
  padding: '0.75rem 1.25rem',
  borderRadius: '25px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500',
  transition: 'all 0.3s',
  display: 'flex',
  alignItems: 'center',
};

const activeTabStyle = {
  background: 'linear-gradient(135deg, #d4a574 0%, #c4956a 100%)',
  color: '#1a1a2e',
  borderColor: '#d4a574',
};

const mainStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '2rem',
  padding: '2rem',
  maxWidth: '1400px',
  margin: '0 auto',
};

const inputSectionStyle = {
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '20px',
  padding: '2rem',
  border: '1px solid rgba(255,255,255,0.1)',
};

const sectionTitleStyle = {
  fontSize: '1.3rem',
  marginBottom: '1.5rem',
  color: '#d4a574',
};

const inputModeStyle = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '1.5rem',
};

const modeButtonStyle = {
  flex: 1,
  padding: '1rem',
  border: '2px solid rgba(212, 165, 116, 0.3)',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '1rem',
  transition: 'all 0.3s',
};

const activeModeStyle = {
  background: 'linear-gradient(135deg, #d4a574 0%, #c4956a 100%)',
  color: '#1a1a2e',
  borderColor: '#d4a574',
};

const inputGroupStyle = {
  marginBottom: '1.5rem',
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  color: '#d4a574',
  fontWeight: '500',
};

const textareaStyle = {
  width: '100%',
  padding: '1rem',
  border: '2px solid rgba(212, 165, 116, 0.3)',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  fontSize: '1rem',
  minHeight: '120px',
  resize: 'vertical',
  fontFamily: 'inherit',
};

const uploadAreaStyle = {
  border: '3px dashed rgba(212, 165, 116, 0.5)',
  borderRadius: '15px',
  padding: '2rem',
  textAlign: 'center',
  background: 'rgba(212, 165, 116, 0.05)',
  cursor: 'pointer',
};

const uploadLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
  color: '#d4a574',
};

const uploadIconStyle = {
  fontSize: '2rem',
};

const imagePreviewContainerStyle = {
  position: 'relative',
  display: 'inline-block',
};

const previewImageStyle = {
  maxWidth: '100%',
  maxHeight: '200px',
  borderRadius: '10px',
};

const removeImageStyle = {
  position: 'absolute',
  top: '-10px',
  right: '-10px',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  background: '#e74c3c',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
};

const optionsGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginBottom: '1.5rem',
};

const optionGroupStyle = {
  marginBottom: '0.5rem',
};

const optionButtonsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
};

const optionBtnStyle = {
  padding: '0.5rem 1rem',
  border: '2px solid rgba(212, 165, 116, 0.3)',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.85rem',
  transition: 'all 0.3s',
};

const activeOptionStyle = {
  background: '#d4a574',
  color: '#1a1a2e',
  borderColor: '#d4a574',
};

const generateButtonStyle = {
  width: '100%',
  padding: '1.2rem',
  background: 'linear-gradient(135deg, #d4a574 0%, #8B4513 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  fontSize: '1.1rem',
  fontWeight: '700',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
};

const spinnerStyle = {
  width: '20px',
  height: '20px',
  border: '3px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const resultSectionStyle = {
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '20px',
  padding: '2rem',
  border: '1px solid rgba(255,255,255,0.1)',
  display: 'flex',
  flexDirection: 'column',
};

const resultHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};

const copyButtonStyle = {
  padding: '0.5rem 1rem',
  background: '#d4a574',
  color: '#1a1a2e',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
};

const resultAreaStyle = {
  flex: 1,
  background: 'rgba(0,0,0,0.2)',
  borderRadius: '12px',
  padding: '1.5rem',
  minHeight: '400px',
  overflowY: 'auto',
};

const resultContentStyle = {
  whiteSpace: 'pre-wrap',
  lineHeight: '1.8',
  color: '#e0e0e0',
};

const placeholderStyle = {
  color: '#888',
  textAlign: 'center',
  padding: '2rem',
};

const footerStyle = {
  textAlign: 'center',
  padding: '2rem',
  color: '#888',
  fontSize: '0.9rem',
  borderTop: '1px solid rgba(255,255,255,0.1)',
};
