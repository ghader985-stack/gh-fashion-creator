import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [activeTab, setActiveTab] = useState('moodboard');
  const [showPricing, setShowPricing] = useState(false);
  const [user, setUser] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const [adminCode, setAdminCode] = useState('');
  const [showAdminInput, setShowAdminInput] = useState(false);

  // ===== المود بورد =====
  const [moodDescription, setMoodDescription] = useState('');
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodBoard, setMoodBoard] = useState(null);
  const [moodError, setMoodError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // ===== استوديو AI =====
  const [studioDesc, setStudioDesc] = useState('');
  const [studioImage, setStudioImage] = useState(null);
  const [studioPreview, setStudioPreview] = useState('');
  const [studioShot, setStudioShot] = useState('catalog');
  const [studioBg, setStudioBg] = useState('cream');
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioResult, setStudioResult] = useState(null);
  const [studioError, setStudioError] = useState('');

  // ===== التيك باك =====
  const [tpImage, setTpImage] = useState(null);
  const [tpPreview, setTpPreview] = useState('');
  const [tpName, setTpName] = useState('');
  const [tpFabric, setTpFabric] = useState('');
  const [tpSeason, setTpSeason] = useState('');
  const [tpNotes, setTpNotes] = useState('');
  const [tpLoading, setTpLoading] = useState(false);
  const [techpack, setTechpack] = useState(null);
  const [tpError, setTpError] = useState('');
  const [tpDownloading, setTpDownloading] = useState(false);

  // ===== المحتوى التسويقي والفيديو =====
  const [mkPlatform, setMkPlatform] = useState('instagram');
  const [mkTone, setMkTone] = useState('luxury');
  const [mkText, setMkText] = useState('');
  const [mkImage, setMkImage] = useState(null);
  const [mkPreview, setMkPreview] = useState('');
  const [mkLoading, setMkLoading] = useState(false);
  const [mkResult, setMkResult] = useState('');

  const [vidType, setVidType] = useState('reel');
  const [vidMood, setVidMood] = useState('cinematic');
  const [vidText, setVidText] = useState('');
  const [vidImage, setVidImage] = useState(null);
  const [vidPreview, setVidPreview] = useState('');
  const [vidLoading, setVidLoading] = useState(false);
  const [vidResult, setVidResult] = useState('');

  const plans = {
    admin: { name: 'Admin', limit: 999999, price: 0 },
    basic: { name: 'Basic', limit: 200, price: 15 },
    pro: { name: 'Pro', limit: 400, price: 35 },
    enterprise: { name: 'Enterprise', limit: 700, price: 70 },
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('gh_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedUsage = localStorage.getItem('gh_usage');
    if (savedUsage) setUsageCount(parseInt(savedUsage));
  }, []);

  const tabs = [
    { id: 'moodboard', name: 'المود بورد', num: '01' },
    { id: 'studio', name: 'استوديو AI', num: '02' },
    { id: 'techpack', name: 'التيك باك', num: '03' },
    { id: 'marketing', name: 'المحتوى التسويقي', num: '04' },
    { id: 'video', name: 'الفيديو', num: '05' },
  ];

  const platforms = ['instagram', 'tiktok', 'pinterest', 'story'];
  const tones = ['luxury', 'friendly', 'professional', 'inspiring'];
  const videoTypes = ['reel', 'story', 'tiktok', 'commercial'];
  const videoMoods = ['cinematic', 'dramatic', 'soft', 'energetic'];

  // ===== helpers =====
  const checkUsageLimit = () => {
    if (!user) return false;
    if (user.plan === 'admin') return true;
    return usageCount < plans[user.plan]?.limit;
  };
  const incrementUsage = () => {
    if (user?.plan === 'admin') return;
    const n = usageCount + 1;
    setUsageCount(n);
    localStorage.setItem('gh_usage', n.toString());
  };
  const gate = () => {
    if (!user) { setShowPricing(true); return false; }
    if (!checkUsageLimit()) { alert('انتهت توليداتك! جددي اشتراكك'); setShowPricing(true); return false; }
    return true;
  };

  const makeUploader = (setFile, setPreview) => (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAdminLogin = () => {
    // كلمة السر تُقارن على الخادم عبر متغير بيئة — الطلب يمر عبر api/admin
    fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: adminCode }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          const adminUser = { plan: 'admin', subscribedAt: new Date().toISOString() };
          setUser(adminUser);
          localStorage.setItem('gh_user', JSON.stringify(adminUser));
          setShowAdminInput(false);
          setAdminCode('');
          alert('مرحباً بكِ يا مالكة الأداة');
        } else {
          alert('كلمة السر غير صحيحة');
        }
      })
      .catch(() => alert('خطأ في الاتصال'));
  };

  const handleSubscribe = (plan) => {
    setUser({ plan, subscribedAt: new Date().toISOString() });
    localStorage.setItem('gh_user', JSON.stringify({ plan }));
    setUsageCount(0);
    localStorage.setItem('gh_usage', '0');
    setShowPricing(false);
    alert(`تم الاشتراك في ${plans[plan].name}`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gh_user');
    localStorage.removeItem('gh_usage');
    setUsageCount(0);
  };

  // ===== المود بورد =====
  const handleMoodboard = async () => {
    if (!gate()) return;
    if (!moodDescription.trim()) { alert('اكتبي وصف الكونسبت أولاً'); return; }
    setMoodLoading(true); setMoodBoard(null); setMoodError('');
    try {
      const r = await fetch('/api/moodboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: moodDescription }),
      });
      const d = await r.json();
      if (d.error) setMoodError(d.error);
      else { setMoodBoard(d); incrementUsage(); }
    } catch { setMoodError('خطأ في الاتصال، حاولي مرة ثانية'); }
    setMoodLoading(false);
  };

  const loadHtml2Canvas = () => new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.html2canvas) return resolve(window.html2canvas);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = () => resolve(window.html2canvas);
    s.onerror = () => reject(new Error('فشل تحميل أداة الحفظ'));
    document.body.appendChild(s);
  });

  const downloadNode = async (nodeId, filename, bg) => {
    const el = document.getElementById(nodeId);
    if (!el) return false;
    const html2canvas = await loadHtml2Canvas();
    const canvas = await html2canvas(el, { useCORS: true, backgroundColor: bg, scale: 2 });
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return true;
  };

  const downloadBoard = async () => {
    setDownloading(true);
    try {
      await downloadNode('moodboard-canvas', (moodBoard?.title || 'moodboard').replace(/\s+/g, '-') + '.png', '#f6f1ea');
    } catch { alert('تعذّر الحفظ، جرّبي مرة ثانية'); }
    setDownloading(false);
  };

  const downloadImage = async (url, idx) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.download = 'moodboard-image-' + (idx + 1) + '.png';
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch { window.open(url, '_blank'); }
  };

  // ===== استوديو AI =====
  const handleStudio = async () => {
    if (!gate()) return;
    if (!studioDesc.trim()) { alert('اكتبي وصف التصميم أولاً'); return; }
    setStudioLoading(true); setStudioResult(null); setStudioError('');
    try {
      const fd = new FormData();
      fd.append('description', studioDesc);
      fd.append('shot', studioShot);
      fd.append('background', studioBg);
      if (studioImage) fd.append('image', studioImage);
      const r = await fetch('/api/studio', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.error) setStudioError(d.error);
      else { setStudioResult(d); incrementUsage(); }
    } catch { setStudioError('خطأ في الاتصال، حاولي مرة ثانية'); }
    setStudioLoading(false);
  };

  // ===== التيك باك =====
  const handleTechpack = async () => {
    if (!gate()) return;
    if (!tpImage) { alert('ارفعي صورة التصميم أولاً'); return; }
    setTpLoading(true); setTechpack(null); setTpError('');
    try {
      const fd = new FormData();
      fd.append('image', tpImage);
      fd.append('garmentName', tpName);
      fd.append('fabricInfo', tpFabric);
      fd.append('season', tpSeason);
      fd.append('notes', tpNotes);
      fd.append('brandName', 'GH Couture AI');
      const r = await fetch('/api/techpack', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.error) setTpError(d.error);
      else { setTechpack(d); incrementUsage(); }
    } catch { setTpError('خطأ في الاتصال، حاولي مرة ثانية'); }
    setTpLoading(false);
  };

  const downloadTechpack = async () => {
    setTpDownloading(true);
    try {
      await downloadNode('techpack-canvas', (techpack?.garmentName || 'techpack').replace(/\s+/g, '-') + '.png', '#ffffff');
    } catch { alert('تعذّر الحفظ، جرّبي مرة ثانية'); }
    setTpDownloading(false);
  };

  // ===== المحتوى التسويقي =====
  const handleMarketing = async () => {
    if (!gate()) return;
    setMkLoading(true); setMkResult('');
    const prompt = buildMarketingPrompt(mkPlatform, mkTone, mkText, !!mkImage);
    try {
      const fd = new FormData();
      fd.append('prompt', prompt);
      fd.append('tab', 'marketing');
      if (mkImage) fd.append('image', mkImage);
      const r = await fetch('/api/generate', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.error) setMkResult('خطأ: ' + d.error);
      else { setMkResult(d.result); incrementUsage(); }
    } catch { setMkResult('خطأ في الاتصال'); }
    setMkLoading(false);
  };

  // ===== الفيديو =====
  const handleVideo = async () => {
    if (!gate()) return;
    setVidLoading(true); setVidResult('');
    const prompt = buildVideoPrompt(vidType, vidMood, vidText, !!vidImage);
    try {
      const fd = new FormData();
      fd.append('prompt', prompt);
      fd.append('tab', 'video');
      if (vidImage) fd.append('image', vidImage);
      const r = await fetch('/api/generate', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.error) setVidResult('خطأ: ' + d.error);
      else { setVidResult(d.result); incrementUsage(); }
    } catch { setVidResult('خطأ في الاتصال'); }
    setVidLoading(false);
  };

  const copyText = (t) => { navigator.clipboard.writeText(t); alert('تم النسخ'); };

  const moodImgs = moodBoard?.moodImages || [];

  const videoPlatforms = [
    { name: 'Kling AI', note: 'الأفضل للحركة الواقعية وسقوط القماش' },
    { name: 'Runway Gen-3', note: 'تحكّم سينمائي عالٍ وجودة إخراج' },
    { name: 'Google Veo', note: 'واقعية عالية ومشاهد متكاملة' },
    { name: 'Higgsfield', note: 'حركات كاميرا درامية جاهزة' },
  ];

  return (
    <>
      <Head>
        <title>GH Couture AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="container">
        {/* ===== الهيدر ===== */}
        <header className="header">
          <div className="logo-container">
            <div className="logo-icon">GH</div>
            <div>
              <h1 className="logo-text">GH Couture AI</h1>
              <p className="logo-sub">منصة تصميم الأزياء بالذكاء الاصطناعي</p>
            </div>
          </div>
          <div className="header-actions">
            {user && (
              <div className="usage-info">
                {user.plan === 'admin' ? (
                  <span>وضع المالكة — بلا حدود</span>
                ) : (
                  <>
                    <span>الاستخدام: {usageCount}/{plans[user.plan]?.limit || 0}</span>
                    <div className="usage-bar">
                      <div className="usage-fill" style={{ width: `${(usageCount / (plans[user.plan]?.limit || 1)) * 100}%` }}></div>
                    </div>
                  </>
                )}
              </div>
            )}
            {user ? (
              <div className="user-actions">
                {user.plan !== 'admin' && (
                  <button onClick={() => setShowPricing(true)} className="upgrade-btn">ترقية</button>
                )}
                <button onClick={handleLogout} className="logout-btn">خروج</button>
              </div>
            ) : (
              <button onClick={() => setShowPricing(true)} className="upgrade-btn">اشتركي</button>
            )}
          </div>
        </header>

        {/* ===== التبويبات ===== */}
        <nav className="tabs-container">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="tab-num">{tab.num}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </nav>

        {/* ===== المود بورد ===== */}
        {activeTab === 'moodboard' && (
          <main className="mood-main">
            <section className="panel">
              <div className="panel-eyebrow">المرحلة الأولى — الإلهام</div>
              <h2 className="panel-title">المود بورد</h2>
              <p className="panel-hint">اكتبي وصف الكونسبت، وتُبنى لكِ لوحة إلهام احترافية كاملة: رسمة، صور، باليت ألوان، وخامات.</p>
              <div className="field">
                <label>وصف الكونسبت</label>
                <textarea
                  value={moodDescription}
                  onChange={(e) => setMoodDescription(e.target.value)}
                  placeholder="مثال: فستان سهرة مستوحى من أعماق البحر، ألوان زمردية وفيروزية، إحساس غامض وساحر..."
                ></textarea>
              </div>
              <button onClick={handleMoodboard} disabled={moodLoading} className="cta">
                {moodLoading ? <><span className="spinner"></span> جاري إنشاء اللوحة...</> : 'أنشئي المود بورد'}
              </button>
              {moodError && <div className="err">{moodError}</div>}
            </section>

            {moodLoading && (
              <div className="loading-block">
                <span className="spinner-lg"></span>
                <p>يتم توليد الرسمة والصور والألوان...</p>
              </div>
            )}
            {!moodLoading && !moodBoard && <p className="placeholder">لوحة الإلهام ستظهر هنا</p>}

            {moodBoard && (
              <>
                <div className="board-actions">
                  <button onClick={downloadBoard} disabled={downloading} className="download-btn">
                    {downloading ? <><span className="spinner"></span> جاري الحفظ...</> : 'حفظ اللوحة كصورة'}
                  </button>
                  <span className="hint-inline">أو اضغطي على أي صورة لحفظها منفردة</span>
                </div>

                <div id="moodboard-canvas" className="board">
                  <div className="board-header">
                    <div className="board-corner tl"></div>
                    <div className="board-corner tr"></div>
                    <h1 className="board-title">{moodBoard.title}</h1>
                    <div className="board-rule"></div>
                    <p className="board-subtitle">{moodBoard.subtitle}</p>
                  </div>

                  <div className="board-collage">
                    <div className="collage-hero" onClick={() => downloadImage(moodBoard.heroImage, 0)} title="اضغطي لحفظ الصورة">
                      <img src={moodBoard.heroImage} alt="hero" crossOrigin="anonymous" />
                      <span className="save-badge">حفظ</span>
                    </div>
                    <div className="collage-tiles">
                      {moodImgs.map((img, i) => (
                        <div className="collage-tile" key={i} onClick={() => downloadImage(img, i + 1)} title="اضغطي لحفظ الصورة">
                          <img src={img} alt={`mood-${i}`} crossOrigin="anonymous" />
                          <span className="save-badge">حفظ</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="board-inspiration">
                    <div className="insp-divider">— Inspiration —</div>
                    <p className="insp-text">{moodBoard.inspiration}</p>
                  </div>

                  <div className="board-details">
                    <div className="detail-col">
                      <div className="detail-label">FABRICS</div>
                      <div className="detail-value">{(moodBoard.fabrics || []).join('  ·  ')}</div>
                    </div>
                    <div className="detail-col">
                      <div className="detail-label">SILHOUETTE</div>
                      <div className="detail-value">{moodBoard.silhouette}</div>
                    </div>
                    <div className="detail-col palette-col">
                      <div className="detail-label">COLOR PALETTE</div>
                      <div className="palette-row">
                        {(moodBoard.palette || []).map((c, i) => (
                          <div className="swatch-wrap" key={i}>
                            <div className="swatch" style={{ background: c.hex }}></div>
                            <span className="swatch-name">{c.name}</span>
                            <span className="swatch-hex">{c.hex}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="board-footer">GH Couture AI</div>
                </div>
              </>
            )}
          </main>
        )}

        {/* ===== استوديو AI ===== */}
        {activeTab === 'studio' && (
          <main className="mood-main">
            <section className="panel">
              <div className="panel-eyebrow">المرحلة الثانية — التصميم المرئي</div>
              <h2 className="panel-title">استوديو AI</h2>
              <p className="panel-hint">حوّلي الكونسبت إلى صورة قطعة احترافية. صفي التصميم، وارفعي صورة مرجعية اختيارياً.</p>

              <div className="field">
                <label>وصف التصميم</label>
                <textarea
                  value={studioDesc}
                  onChange={(e) => setStudioDesc(e.target.value)}
                  placeholder="مثال: فستان طويل بقصّة حورية، حرير زمردي بطبقات شيفون متدرجة، تطريز لؤلؤي عند الصدر..."
                ></textarea>
              </div>

              <div className="field">
                <label>صورة مرجعية (اختياري)</label>
                <div className="upload-area">
                  {studioPreview ? (
                    <div className="img-preview">
                      <img src={studioPreview} alt="preview" />
                      <button onClick={() => { setStudioImage(null); setStudioPreview(''); }} className="remove-img">✕</button>
                    </div>
                  ) : (
                    <label className="upload-label">
                      <input type="file" accept="image/*" onChange={makeUploader(setStudioImage, setStudioPreview)} style={{ display: 'none' }} />
                      <span>اضغطي لرفع صورة مرجعية</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="field">
                <label>نوع اللقطة</label>
                <div className="chips">
                  {[
                    { id: 'catalog', n: 'معلّقة (كتالوج)' },
                    { id: 'onmodel', n: 'على موديل' },
                    { id: 'flatlay', n: 'مسطّحة' },
                    { id: 'detail', n: 'تفاصيل' },
                  ].map((s) => (
                    <button key={s.id} onClick={() => setStudioShot(s.id)} className={`chip ${studioShot === s.id ? 'active' : ''}`}>{s.n}</button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>الخلفية</label>
                <div className="chips">
                  {[
                    { id: 'cream', n: 'كريمي' },
                    { id: 'white', n: 'أبيض' },
                    { id: 'dark', n: 'داكن' },
                  ].map((b) => (
                    <button key={b.id} onClick={() => setStudioBg(b.id)} className={`chip ${studioBg === b.id ? 'active' : ''}`}>{b.n}</button>
                  ))}
                </div>
              </div>

              <button onClick={handleStudio} disabled={studioLoading} className="cta">
                {studioLoading ? <><span className="spinner"></span> جاري توليد الصورة...</> : 'ولّدي صورة القطعة'}
              </button>
              {studioError && <div className="err">{studioError}</div>}
            </section>

            {studioLoading && (
              <div className="loading-block"><span className="spinner-lg"></span><p>يتم بناء البرومبت وتوليد الصورة...</p></div>
            )}
            {!studioLoading && !studioResult && <p className="placeholder">صورة القطعة ستظهر هنا</p>}

            {studioResult && (
              <div className="studio-result">
                <div className="studio-img" onClick={() => downloadImage(studioResult.imageUrl, 0)} title="اضغطي لحفظ الصورة">
                  <img src={studioResult.imageUrl} alt="design" crossOrigin="anonymous" />
                  <span className="save-badge">حفظ</span>
                </div>
                <div className="studio-prompt">
                  <div className="detail-label">PROMPT</div>
                  <p>{studioResult.prompt}</p>
                  <button onClick={() => copyText(studioResult.prompt)} className="mini-btn">نسخ البرومبت</button>
                </div>
              </div>
            )}
          </main>
        )}

        {/* ===== التيك باك ===== */}
        {activeTab === 'techpack' && (
          <main className="mood-main">
            <section className="panel">
              <div className="panel-eyebrow">المرحلة الثالثة — المواصفات التقنية</div>
              <h2 className="panel-title">التيك باك</h2>
              <p className="panel-hint">ارفعي صورة التصميم (سكتش، صورة AI، أو قطعة)، وأضيفي مواصفات القماش. تُبنى لكِ حزمة تقنية كاملة للمصنع.</p>

              <div className="field">
                <label>صورة التصميم</label>
                <div className="upload-area">
                  {tpPreview ? (
                    <div className="img-preview">
                      <img src={tpPreview} alt="preview" />
                      <button onClick={() => { setTpImage(null); setTpPreview(''); }} className="remove-img">✕</button>
                    </div>
                  ) : (
                    <label className="upload-label">
                      <input type="file" accept="image/*" onChange={makeUploader(setTpImage, setTpPreview)} style={{ display: 'none' }} />
                      <span>اضغطي لرفع صورة التصميم</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="field">
                <label>اسم التصميم (اختياري)</label>
                <input type="text" value={tpName} onChange={(e) => setTpName(e.target.value)} placeholder="مثال: فستان أوشن فايبز" />
              </div>

              <div className="field">
                <label>مواصفات القماش</label>
                <textarea
                  value={tpFabric}
                  onChange={(e) => setTpFabric(e.target.value)}
                  placeholder="مثال: حرير شيفون 60 غرام، بطانة ساتان، تطريز يدوي بالخرز. إن تركتيها فارغة سنقترح خامات منطقية."
                ></textarea>
              </div>

              <div className="two-col">
                <div className="field">
                  <label>الموسم (اختياري)</label>
                  <input type="text" value={tpSeason} onChange={(e) => setTpSeason(e.target.value)} placeholder="SS26" />
                </div>
                <div className="field">
                  <label>ملاحظات (اختياري)</label>
                  <input type="text" value={tpNotes} onChange={(e) => setTpNotes(e.target.value)} placeholder="أي تفاصيل خاصة" />
                </div>
              </div>

              <button onClick={handleTechpack} disabled={tpLoading} className="cta">
                {tpLoading ? <><span className="spinner"></span> جاري تحليل التصميم وبناء التيك باك...</> : 'أنشئي التيك باك'}
              </button>
              {tpError && <div className="err">{tpError}</div>}
            </section>

            {tpLoading && (
              <div className="loading-block"><span className="spinner-lg"></span><p>يتم تحليل التصميم واستخراج القياسات والمواد...</p></div>
            )}
            {!tpLoading && !techpack && <p className="placeholder">التيك باك سيظهر هنا</p>}

            {techpack && (
              <>
                <div className="board-actions">
                  <button onClick={downloadTechpack} disabled={tpDownloading} className="download-btn">
                    {tpDownloading ? <><span className="spinner"></span> جاري الحفظ...</> : 'حفظ التيك باك كصورة'}
                  </button>
                </div>
                <TechpackView tp={techpack} preview={tpPreview} />
              </>
            )}
          </main>
        )}

        {/* ===== المحتوى التسويقي ===== */}
        {activeTab === 'marketing' && (
          <main className="split-main">
            <section className="panel">
              <div className="panel-eyebrow">المرحلة الرابعة — التسويق</div>
              <h2 className="panel-title">المحتوى التسويقي</h2>

              <div className="field">
                <label>المنصة</label>
                <div className="chips">
                  {platforms.map((p) => (
                    <button key={p} onClick={() => setMkPlatform(p)} className={`chip ${mkPlatform === p ? 'active' : ''}`}>
                      {p === 'story' ? 'قصة تسويقية' : p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>النبرة</label>
                <div className="chips">
                  {tones.map((t) => (
                    <button key={t} onClick={() => setMkTone(t)} className={`chip ${mkTone === t ? 'active' : ''}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>وصف المنتج</label>
                <textarea value={mkText} onChange={(e) => setMkText(e.target.value)} placeholder="صفي المنتج أو الكولكشن..."></textarea>
              </div>
              <div className="field">
                <label>صورة (اختياري)</label>
                <div className="upload-area">
                  {mkPreview ? (
                    <div className="img-preview">
                      <img src={mkPreview} alt="preview" />
                      <button onClick={() => { setMkImage(null); setMkPreview(''); }} className="remove-img">✕</button>
                    </div>
                  ) : (
                    <label className="upload-label">
                      <input type="file" accept="image/*" onChange={makeUploader(setMkImage, setMkPreview)} style={{ display: 'none' }} />
                      <span>اضغطي لرفع صورة</span>
                    </label>
                  )}
                </div>
              </div>
              <button onClick={handleMarketing} disabled={mkLoading} className="cta">
                {mkLoading ? <><span className="spinner"></span> جاري التوليد...</> : 'أنشئي المحتوى'}
              </button>
            </section>
            <section className="panel">
              <div className="result-head">
                <h2 className="panel-title sm">النتيجة</h2>
                {mkResult && <button onClick={() => copyText(mkResult)} className="mini-btn">نسخ</button>}
              </div>
              <div className="result-area">
                {mkResult ? <div className="result-content">{mkResult}</div> : <p className="placeholder">المحتوى سيظهر هنا</p>}
              </div>
            </section>
          </main>
        )}

        {/* ===== الفيديو ===== */}
        {activeTab === 'video' && (
          <main className="split-main">
            <section className="panel">
              <div className="panel-eyebrow">المرحلة الخامسة — الفيديو</div>
              <h2 className="panel-title">الفيديو</h2>

              <div className="field">
                <label>نوع الفيديو</label>
                <div className="chips">
                  {videoTypes.map((v) => (
                    <button key={v} onClick={() => setVidType(v)} className={`chip ${vidType === v ? 'active' : ''}`}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>المود</label>
                <div className="chips">
                  {videoMoods.map((m) => (
                    <button key={m} onClick={() => setVidMood(m)} className={`chip ${vidMood === m ? 'active' : ''}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>وصف الفكرة</label>
                <textarea value={vidText} onChange={(e) => setVidText(e.target.value)} placeholder="صفي فكرة الفيديو أو القطعة..."></textarea>
              </div>
              <div className="field">
                <label>صورة (اختياري)</label>
                <div className="upload-area">
                  {vidPreview ? (
                    <div className="img-preview">
                      <img src={vidPreview} alt="preview" />
                      <button onClick={() => { setVidImage(null); setVidPreview(''); }} className="remove-img">✕</button>
                    </div>
                  ) : (
                    <label className="upload-label">
                      <input type="file" accept="image/*" onChange={makeUploader(setVidImage, setVidPreview)} style={{ display: 'none' }} />
                      <span>اضغطي لرفع صورة</span>
                    </label>
                  )}
                </div>
              </div>
              <button onClick={handleVideo} disabled={vidLoading} className="cta">
                {vidLoading ? <><span className="spinner"></span> جاري التوليد...</> : 'أنشئي برومبت الفيديو'}
              </button>

              <div className="platforms-box">
                <div className="detail-label">منصات توليد الفيديو المقترحة</div>
                {videoPlatforms.map((p, i) => (
                  <div className="platform-row" key={i}>
                    <span className="platform-name">{p.name}</span>
                    <span className="platform-note">{p.note}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel">
              <div className="result-head">
                <h2 className="panel-title sm">النتيجة</h2>
                {vidResult && <button onClick={() => copyText(vidResult)} className="mini-btn">نسخ</button>}
              </div>
              <div className="result-area">
                {vidResult ? <div className="result-content">{vidResult}</div> : <p className="placeholder">برومبت الفيديو سيظهر هنا</p>}
              </div>
            </section>
          </main>
        )}

        {/* ===== نافذة الأسعار ===== */}
        {showPricing && (
          <div className="modal-overlay">
            <div className="modal">
              <button onClick={() => setShowPricing(false)} className="close-modal">✕</button>
              <h2 className="modal-title">اختاري باقتك</h2>
              <p className="modal-sub">اشتركي الآن وابدئي رحلة تصميم متكاملة</p>

              <div className="admin-section">
                {!showAdminInput ? (
                  <button onClick={() => setShowAdminInput(true)} className="admin-link">دخول المالكة</button>
                ) : (
                  <div className="admin-input-group">
                    <input type="password" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="كلمة السر" className="admin-input" />
                    <button onClick={handleAdminLogin} className="admin-btn">دخول</button>
                    <button onClick={() => { setShowAdminInput(false); setAdminCode(''); }} className="admin-cancel">إلغاء</button>
                  </div>
                )}
              </div>

              <div className="pricing-grid">
                <div className="pricing-card">
                  <h3>Basic</h3>
                  <div className="plan-price">$15<span>/شهر</span></div>
                  <ul><li>200 عملية</li><li>كل الأدوات</li><li>دعم بالإيميل</li></ul>
                  <button onClick={() => handleSubscribe('basic')} className="subscribe-btn">اشتركي</button>
                </div>
                <div className="pricing-card featured">
                  <div className="popular-badge">الأكثر اختياراً</div>
                  <h3>Pro</h3>
                  <div className="plan-price">$35<span>/شهر</span></div>
                  <ul><li>400 عملية</li><li>أولوية الدعم</li><li>ميزات حصرية</li></ul>
                  <button onClick={() => handleSubscribe('pro')} className="subscribe-btn pro">اشتركي</button>
                </div>
                <div className="pricing-card">
                  <h3>Enterprise</h3>
                  <div className="plan-price">$70<span>/شهر</span></div>
                  <ul><li>700 عملية</li><li>مديرة حساب</li><li>دعم 24/7</li></ul>
                  <button onClick={() => handleSubscribe('enterprise')} className="subscribe-btn">اشتركي</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="footer">© 2026 GH Couture AI</footer>
      </div>

      <StyleBlock />
    </>
  );
}

// ===== بناء برومبتات المحتوى والفيديو =====
function buildMarketingPrompt(platform, tone, text, hasImage) {
  const imageContext = hasImage ? '\n\nصورة مرفقة — حللها بدقة واستخدميها كمرجع أساسي.' : '';
  const textContext = text ? `\n\nوصف المنتج: ${text}` : '';
  if (platform === 'story') {
    return `أنتِ خبيرة تسويق أزياء فاخرة. النبرة: ${tone}.${imageContext}${textContext}

قدمي قصة تسويقية كاملة ومؤثرة:

الفصل الأول: الإلهام والولادة
[من أين جاء إلهام هذا التصميم — فقرتان]

الفصل الثاني: الحرفية والتفاصيل
[جودة الصناعة والمواد والاهتمام بالتفاصيل — فقرتان]

الفصل الثالث: المرأة التي ترتديه
[شخصية المرأة المثالية وكيف ستشعر — فقرتان]

الفصل الرابع: اللحظة
[سيناريو تخيلي للحظة ارتدائه — فقرتان]

الرسالة التسويقية المختصرة
[جملة قوية واحدة]

الشعار الإعلاني
[ثلاثة خيارات]`;
  }
  return `أنتِ خبيرة تسويق أزياء فاخرة. المنصة: ${platform} | النبرة: ${tone}.${imageContext}${textContext}

قدمي:

الكابشنات
قصير: [سطر]
متوسط: [سطران]
طويل: [فقرة]

خمس أفكار ريلز
[لكل واحدة: العنوان والفكرة والترند]

خمس أفكار ستوري

الهاشتاقات
عربي: [15]
إنجليزي: [15]

دعوات لاتخاذ إجراء
[خمس صيغ متنوعة]

استراتيجية النشر المختصرة`;
}

function buildVideoPrompt(videoType, mood, text, hasImage) {
  const imageContext = hasImage ? '\n\nصورة مرفقة — حللها بدقة واستخدميها كمرجع أساسي.' : '';
  const textContext = text ? `\n\nوصف الفكرة: ${text}` : '';
  return `أنتِ مخرجة فيديوهات أزياء. النوع: ${videoType} | المود: ${mood}.${imageContext}${textContext}

قدمي:

برومبت الفيديو (إنجليزي — جاهز للصق في أدوات توليد الفيديو)
[برومبت كامل غني بالتفاصيل السينمائية]

السيناريو المفصل بالمشاهد
مشهد 1 | الافتتاحية (0:00–0:03): [اللقطة، حركة الكاميرا، الإضاءة]
مشهد 2 | الكشف (0:03–0:08): [بطيء، لحظة الإبهار]
مشهد 3 | التفاصيل (0:08–0:15): [لقطات قماش وتفاصيل]
مشهد 4 | أسلوب الحياة (0:15–0:22)
مشهد 5 | الختام والدعوة (0:22–0:30)

اقتراح الموسيقى والإيقاع

الترجمة العربية للبرومبت`;
}

// ===== عرض التيك باك =====
function TechpackView({ tp, preview }) {
  return (
    <div id="techpack-canvas" className="tp">
      {/* رأس */}
      <div className="tp-head">
        <div className="tp-head-left">
          {preview ? <img src={preview} alt="design" className="tp-thumb" crossOrigin="anonymous" /> : <div className="tp-thumb ph"></div>}
          <div>
            <div className="tp-code">{tp.styleCode}</div>
            <div className="tp-name">{tp.garmentName} <span className="tp-name-ar">/ {tp.garmentNameAr}</span></div>
            <div className="tp-meta">Season: {tp.season} · Category: {tp.category} · Sample: {tp.sampleSize}</div>
          </div>
        </div>
        <div className="tp-head-right">
          <div className="tp-brand">{tp.brandName}</div>
          <div className="tp-desc">{tp.description}</div>
        </div>
      </div>

      {/* الرسمة التقنية المسطّحة */}
      {tp.flatSketchImage && (
        <TpSection title="TECHNICAL FLAT SKETCH" subtitle="الرسمة التقنية (أمامي وخلفي)">
          <div className="tp-flat">
            <img src={tp.flatSketchImage} alt="technical flat" crossOrigin="anonymous" />
          </div>
        </TpSection>
      )}

      {/* القياسات */}
      <TpSection title="MEASUREMENT SPECIFICATION" subtitle="جدول القياسات المتدرّج (سم)">
        <table className="tp-table">
          <thead>
            <tr>
              <th className="ltr">Point of Measure</th>
              <th>Tol.</th>
              <th>XS</th><th>S</th><th className="hl">M</th><th>L</th><th>XL</th>
            </tr>
          </thead>
          <tbody>
            {(tp.measurements || []).map((m, i) => (
              <tr key={i}>
                <td className="ltr left">{m.pom}</td>
                <td>{m.tolerance}</td>
                <td>{m.sizes?.XS}</td>
                <td>{m.sizes?.S}</td>
                <td className="hl">{m.sizes?.M}</td>
                <td>{m.sizes?.L}</td>
                <td>{m.sizes?.XL}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TpSection>

      {/* الخامات */}
      <TpSection title="MATERIALS" subtitle="الخامات">
        {tp.swatchImages && tp.swatchImages.length > 0 && (
          <div className="tp-swatches">
            {tp.swatchImages.filter((s) => s.url).map((s, i) => (
              <div className="tp-swatch-card" key={i}>
                <img src={s.url} alt={s.name} crossOrigin="anonymous" />
                <div className="tp-swatch-name">{s.name}</div>
              </div>
            ))}
          </div>
        )}
        <div className="tp-materials">
          {(tp.materials || []).map((m, i) => (
            <div className="tp-mat" key={i}>
              <div className="tp-mat-name">{m.name}</div>
              <div className="tp-mat-type">{m.type}</div>
              <div className="tp-mat-notes">{m.notes}</div>
            </div>
          ))}
        </div>
      </TpSection>

      {/* BOM */}
      <TpSection title="BILL OF MATERIALS" subtitle="قائمة المواد">
        <table className="tp-table">
          <thead>
            <tr><th className="ltr">Item</th><th className="ltr">Description</th><th className="ltr">Placement</th><th>Qty</th><th>Unit</th></tr>
          </thead>
          <tbody>
            {(tp.bom || []).map((b, i) => (
              <tr key={i}>
                <td className="ltr left">{b.item}</td>
                <td className="ltr left sm">{b.description}</td>
                <td className="ltr left sm">{b.placement}</td>
                <td>{b.qty}</td>
                <td>{b.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TpSection>

      {/* البناء */}
      <TpSection title="CONSTRUCTION DETAILS" subtitle="تفاصيل البناء">
        <table className="tp-table">
          <thead><tr><th className="ltr">Section</th><th className="ltr">Detail</th><th className="ltr">Description</th></tr></thead>
          <tbody>
            {(tp.construction || []).map((c, i) => (
              <tr key={i}>
                <td className="ltr left">{c.section}</td>
                <td className="ltr left">{c.detail}</td>
                <td className="ltr left sm">{c.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TpSection>

      {/* الألوان */}
      <TpSection title="COLORWAY & PANTONE" subtitle="الألوان">
        <div className="tp-colors">
          {(tp.colorway || []).map((c, i) => (
            <div className="tp-color" key={i}>
              <div className="tp-color-sw" style={{ background: c.hex }}></div>
              <div>
                <div className="tp-color-part">{c.part}</div>
                <div className="tp-color-code">{c.pantone} · {c.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </TpSection>

      {/* الأرتورك */}
      {tp.artwork && tp.artwork.length > 0 && (
        <TpSection title="ARTWORK & PLACEMENT" subtitle="الليبلات والمواضع">
          <table className="tp-table">
            <thead><tr><th className="ltr">Element</th><th className="ltr">Placement</th><th className="ltr">Size</th><th className="ltr">Notes</th></tr></thead>
            <tbody>
              {tp.artwork.map((a, i) => (
                <tr key={i}>
                  <td className="ltr left">{a.name}</td>
                  <td className="ltr left sm">{a.placement}</td>
                  <td className="ltr left sm">{a.size}</td>
                  <td className="ltr left sm">{a.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TpSection>
      )}

      {/* الخياطة */}
      <TpSection title="SEWING INSTRUCTIONS" subtitle="تعليمات الخياطة">
        <ol className="tp-steps">
          {(tp.sewingSteps || []).map((s, i) => (<li key={i} className="ltr">{s}</li>))}
        </ol>
      </TpSection>

      <div className="tp-foot">{tp.brandName} · Technical Package</div>
    </div>
  );
}

function TpSection({ title, subtitle, children }) {
  return (
    <div className="tp-section">
      <div className="tp-section-head">
        <span className="tp-section-title ltr">{title}</span>
        <span className="tp-section-sub">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}

// ===== الأنماط =====
function StyleBlock() {
  return (
    <style jsx global>{`
      :root {
        --cream: #f7f2e9;
        --cream-2: #efe7d6;
        --ivory: #fdfaf3;
        --ink: #2c2620;
        --ink-soft: #6b5f4f;
        --gold: #b08d57;
        --gold-deep: #96723f;
        --line: #e3d8c4;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Tajawal', sans-serif;
        background: var(--cream);
        color: var(--ink);
        min-height: 100vh;
        direction: rtl;
      }
      .container { min-height: 100vh; }

      /* الهيدر */
      .header {
        background: var(--ivory);
        border-bottom: 1px solid var(--line);
        padding: 1.2rem 2.4rem;
        display: flex; justify-content: space-between; align-items: center;
        flex-wrap: wrap; gap: 1rem;
      }
      .logo-container { display: flex; align-items: center; gap: 1rem; }
      .logo-icon {
        width: 54px; height: 54px; border: 1.5px solid var(--gold);
        border-radius: 4px; display: flex; align-items: center; justify-content: center;
        color: var(--gold-deep); font-weight: 800; font-size: 1.2rem;
        font-family: 'Cormorant Garamond', serif; letter-spacing: 1px;
      }
      .logo-text {
        font-family: 'Cormorant Garamond', serif; font-size: 1.9rem; font-weight: 700;
        color: var(--ink); letter-spacing: 1px; direction: ltr; text-align: right;
      }
      .logo-sub { font-size: 0.82rem; color: var(--ink-soft); margin-top: 2px; }
      .header-actions { display: flex; align-items: center; gap: 1rem; }
      .user-actions { display: flex; gap: 0.5rem; }
      .usage-info {
        border: 1px solid var(--line); padding: 0.5rem 1rem; border-radius: 4px;
        color: var(--ink-soft); font-size: 0.82rem; background: var(--cream);
      }
      .usage-bar { width: 110px; height: 4px; background: var(--cream-2); border-radius: 2px; margin-top: 5px; }
      .usage-fill { height: 100%; background: var(--gold); border-radius: 2px; }
      .upgrade-btn {
        background: var(--ink); color: var(--ivory); border: none;
        padding: 0.6rem 1.4rem; border-radius: 4px; font-weight: 700; cursor: pointer;
        font-family: 'Tajawal'; font-size: 0.9rem; transition: background .2s;
      }
      .upgrade-btn:hover { background: var(--gold-deep); }
      .logout-btn {
        background: transparent; color: var(--ink-soft); border: 1px solid var(--line);
        padding: 0.6rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-family: 'Tajawal';
      }

      /* التبويبات */
      .tabs-container {
        display: flex; justify-content: center; gap: 0; padding: 0 1.5rem;
        flex-wrap: wrap; background: var(--ivory); border-bottom: 1px solid var(--line);
      }
      .tab {
        background: transparent; border: none; border-bottom: 2px solid transparent;
        padding: 1.1rem 1.5rem; color: var(--ink-soft); cursor: pointer;
        font-weight: 500; font-family: 'Tajawal'; font-size: 0.95rem;
        display: flex; align-items: center; gap: 8px; transition: color .2s;
      }
      .tab:hover { color: var(--ink); }
      .tab.active { color: var(--ink); border-bottom-color: var(--gold); }
      .tab-num { font-family: 'Cormorant Garamond', serif; font-size: 0.9rem; color: var(--gold); font-style: italic; }
      .tab.active .tab-num { color: var(--gold-deep); }

      /* التخطيطات */
      .mood-main { max-width: 1040px; margin: 0 auto; padding: 2.5rem 1.5rem; display: flex; flex-direction: column; gap: 1.6rem; }
      .split-main { display: grid; grid-template-columns: 1fr 1fr; gap: 1.6rem; padding: 2.5rem; max-width: 1400px; margin: 0 auto; }
      @media (max-width: 900px) { .split-main { grid-template-columns: 1fr; padding: 1.5rem; } }

      .panel { background: var(--ivory); border: 1px solid var(--line); border-radius: 8px; padding: 2.2rem; }
      .panel-eyebrow {
        font-family: 'Cormorant Garamond', serif; font-style: italic; color: var(--gold-deep);
        letter-spacing: 1px; font-size: 1rem; margin-bottom: 0.4rem;
      }
      .panel-title { font-family: 'Cormorant Garamond', serif; font-size: 2.1rem; font-weight: 700; color: var(--ink); margin-bottom: 0.6rem; }
      .panel-title.sm { font-size: 1.5rem; margin-bottom: 0; }
      .panel-hint { color: var(--ink-soft); margin-bottom: 1.8rem; font-size: 0.95rem; line-height: 1.7; }

      .field { margin-bottom: 1.4rem; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      @media (max-width: 600px) { .two-col { grid-template-columns: 1fr; } }
      .field label { display: block; margin-bottom: 0.5rem; color: var(--ink); font-weight: 500; font-size: 0.92rem; }
      .field textarea, .field input {
        width: 100%; padding: 0.9rem 1rem; border: 1px solid var(--line); border-radius: 6px;
        background: var(--cream); font-size: 1rem; font-family: 'Tajawal'; color: var(--ink);
      }
      .field textarea { min-height: 120px; resize: vertical; line-height: 1.7; }
      .field textarea:focus, .field input:focus { outline: none; border-color: var(--gold); }

      .upload-area { border: 1.5px dashed var(--line); border-radius: 8px; padding: 1.8rem; text-align: center; background: var(--cream); }
      .upload-label { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; color: var(--gold-deep); font-size: 0.92rem; }
      .img-preview { position: relative; display: inline-block; }
      .img-preview img { max-width: 100%; max-height: 240px; border-radius: 6px; }
      .remove-img { position: absolute; top: -10px; left: -10px; width: 30px; height: 30px; border-radius: 50%; background: var(--ink); color: #fff; border: none; cursor: pointer; }

      .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .chip {
        padding: 0.55rem 1.1rem; border: 1px solid var(--line); border-radius: 4px;
        background: var(--cream); color: var(--ink-soft); cursor: pointer; font-weight: 500;
        font-family: 'Tajawal'; font-size: 0.88rem; transition: all .2s;
      }
      .chip:hover { border-color: var(--gold); color: var(--ink); }
      .chip.active { background: var(--ink); color: var(--ivory); border-color: var(--ink); }

      .cta {
        width: 100%; padding: 1.1rem; background: var(--ink); color: var(--ivory);
        border: none; border-radius: 6px; font-size: 1.05rem; font-weight: 700; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 0.6rem;
        font-family: 'Tajawal'; transition: background .2s;
      }
      .cta:hover:not(:disabled) { background: var(--gold-deep); }
      .cta:disabled { opacity: 0.65; cursor: default; }

      .mini-btn {
        padding: 0.5rem 1rem; background: var(--ink); color: var(--ivory); border: none;
        border-radius: 4px; cursor: pointer; font-weight: 600; font-family: 'Tajawal'; font-size: 0.85rem;
      }
      .mini-btn:hover { background: var(--gold-deep); }

      .spinner { width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
      .spinner-lg { width: 46px; height: 46px; border: 3px solid var(--line); border-top-color: var(--gold); border-radius: 50%; animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }

      .err { margin-top: 1rem; padding: 0.9rem 1rem; background: #fdf0ed; color: #b04a35; border-radius: 6px; border: 1px solid #f0d5cd; font-size: 0.9rem; }
      .loading-block { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3.5rem; color: var(--gold-deep); }
      .placeholder { color: var(--ink-soft); text-align: center; padding: 3rem; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.2rem; opacity: 0.7; }

      .result-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
      .result-area { background: var(--cream); border: 1px solid var(--line); border-radius: 8px; padding: 1.5rem; min-height: 420px; max-height: 640px; overflow-y: auto; }
      .result-content { white-space: pre-wrap; line-height: 1.95; color: var(--ink); font-size: 0.95rem; }

      .board-actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; justify-content: center; }
      .download-btn {
        padding: 0.85rem 1.8rem; background: var(--ink); color: var(--ivory); border: none;
        border-radius: 6px; font-weight: 700; font-size: 0.95rem; cursor: pointer;
        display: flex; align-items: center; gap: 0.5rem; font-family: 'Tajawal';
      }
      .download-btn:hover:not(:disabled) { background: var(--gold-deep); }
      .download-btn:disabled { opacity: 0.65; }
      .hint-inline { color: var(--ink-soft); font-size: 0.85rem; }

      /* المود بورد — لوحة */
      .board {
        background: #f6f1ea;
        background-image: radial-gradient(circle at 20% 10%, rgba(255,255,255,0.6), transparent 40%);
        border-radius: 4px; padding: 3.5rem 3rem; box-shadow: 0 20px 60px rgba(0,0,0,0.12); border: 1px solid var(--line);
      }
      .board-header { text-align: center; position: relative; margin-bottom: 2.5rem; padding: 0 1rem; }
      .board-corner { position: absolute; width: 26px; height: 26px; border: 1.5px solid var(--gold); }
      .board-corner.tl { top: -12px; right: -6px; border-left: none; border-bottom: none; }
      .board-corner.tr { top: -12px; left: -6px; border-right: none; border-bottom: none; }
      .board-title { font-family: 'Cormorant Garamond', serif; font-size: 3.4rem; font-weight: 600; color: var(--ink); letter-spacing: 3px; line-height: 1.1; direction: ltr; }
      .board-rule { width: 90px; height: 1px; background: var(--gold); margin: 0.9rem auto; }
      .board-subtitle { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.25rem; color: var(--ink-soft); direction: ltr; }
      .board-collage { display: grid; grid-template-columns: 1.15fr 1fr; gap: 14px; margin-bottom: 2.5rem; }
      .collage-hero { position: relative; border-radius: 3px; overflow: hidden; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.16); min-height: 460px; }
      .collage-hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .collage-tiles { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: 14px; }
      .collage-tile { position: relative; border-radius: 3px; overflow: hidden; cursor: pointer; box-shadow: 0 8px 22px rgba(0,0,0,0.1); min-height: 145px; }
      .collage-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .save-badge { position: absolute; top: 8px; left: 8px; padding: 3px 8px; background: rgba(44,38,32,0.7); color: #fff; border-radius: 3px; font-size: 11px; opacity: 0; transition: opacity 0.2s; }
      .collage-hero:hover .save-badge, .collage-tile:hover .save-badge { opacity: 1; }
      .board-inspiration { text-align: center; margin: 0 auto 2.5rem; max-width: 720px; }
      .insp-divider { font-family: 'Cormorant Garamond', serif; letter-spacing: 5px; color: var(--gold); margin-bottom: 1rem; font-size: 1.05rem; }
      .insp-text { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; line-height: 1.75; color: var(--ink); direction: ltr; font-weight: 500; }
      .board-details { display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 2rem; padding-top: 2rem; border-top: 1px solid var(--line); }
      .detail-label { font-family: 'Cormorant Garamond', serif; letter-spacing: 3px; color: var(--gold-deep); font-size: 0.9rem; margin-bottom: 0.6rem; direction: ltr; }
      .detail-value { color: var(--ink); direction: ltr; font-size: 0.92rem; line-height: 1.6; font-family: 'Cormorant Garamond', serif; }
      .palette-row { display: flex; flex-wrap: wrap; gap: 0.7rem; }
      .swatch-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; width: 58px; }
      .swatch { width: 48px; height: 48px; border-radius: 3px; box-shadow: 0 3px 10px rgba(0,0,0,0.16); border: 1px solid rgba(0,0,0,0.05); }
      .swatch-name { font-size: 0.62rem; color: var(--ink); direction: ltr; text-align: center; font-family: 'Cormorant Garamond', serif; }
      .swatch-hex { font-size: 0.58rem; color: var(--ink-soft); direction: ltr; }
      .board-footer { text-align: center; margin-top: 2.5rem; color: var(--gold); font-family: 'Cormorant Garamond', serif; letter-spacing: 3px; font-size: 1rem; }
      @media (max-width: 760px) {
        .board { padding: 2rem 1.2rem; }
        .board-title { font-size: 2.3rem; }
        .board-collage { grid-template-columns: 1fr; }
        .collage-hero { min-height: 380px; }
        .board-details { grid-template-columns: 1fr; gap: 1.5rem; }
      }

      /* استوديو */
      .studio-result { display: grid; grid-template-columns: 1fr 1fr; gap: 1.6rem; }
      @media (max-width: 800px) { .studio-result { grid-template-columns: 1fr; } }
      .studio-img { position: relative; border-radius: 8px; overflow: hidden; cursor: pointer; box-shadow: 0 14px 40px rgba(0,0,0,0.14); border: 1px solid var(--line); }
      .studio-img img { width: 100%; display: block; }
      .studio-prompt { background: var(--ivory); border: 1px solid var(--line); border-radius: 8px; padding: 1.5rem; }
      .studio-prompt p { direction: ltr; text-align: left; color: var(--ink); line-height: 1.7; font-size: 0.9rem; margin: 0.6rem 0 1rem; }

      /* منصات الفيديو */
      .platforms-box { margin-top: 1.6rem; padding: 1.4rem; background: var(--cream); border: 1px solid var(--line); border-radius: 8px; }
      .platform-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.7rem 0; border-bottom: 1px solid var(--line); }
      .platform-row:last-child { border-bottom: none; }
      .platform-name { font-weight: 700; color: var(--ink); direction: ltr; }
      .platform-note { color: var(--ink-soft); font-size: 0.85rem; text-align: left; }

      /* التيك باك */
      .tp { background: #fff; border: 1px solid var(--line); border-radius: 4px; padding: 2.6rem; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
      .tp-head { display: flex; justify-content: space-between; gap: 2rem; border-bottom: 2px solid var(--ink); padding-bottom: 1.4rem; margin-bottom: 2rem; flex-wrap: wrap; }
      .tp-head-left { display: flex; gap: 1rem; align-items: flex-start; }
      .tp-thumb { width: 88px; height: 88px; object-fit: cover; border-radius: 4px; border: 1px solid var(--line); }
      .tp-thumb.ph { background: var(--cream-2); }
      .tp-code { font-family: 'Cormorant Garamond', serif; color: var(--gold-deep); font-weight: 700; letter-spacing: 1px; direction: ltr; }
      .tp-name { font-size: 1.15rem; font-weight: 700; color: var(--ink); direction: ltr; text-align: right; }
      .tp-name-ar { font-weight: 400; color: var(--ink-soft); font-size: 0.95rem; }
      .tp-meta { color: var(--ink-soft); font-size: 0.82rem; margin-top: 4px; direction: ltr; text-align: right; }
      .tp-head-right { text-align: left; max-width: 320px; }
      .tp-brand { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; color: var(--ink); letter-spacing: 1px; direction: ltr; }
      .tp-desc { color: var(--ink-soft); font-size: 0.85rem; margin-top: 4px; line-height: 1.6; }

      .tp-section { margin-bottom: 2rem; }
      .tp-section-head { display: flex; align-items: baseline; gap: 0.8rem; margin-bottom: 0.9rem; border-bottom: 1px solid var(--line); padding-bottom: 0.5rem; }
      .tp-section-title { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 700; letter-spacing: 2px; color: var(--ink); }
      .tp-section-sub { color: var(--gold-deep); font-size: 0.85rem; }

      .tp-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
      .tp-table th { background: var(--cream); color: var(--ink); padding: 0.55rem 0.6rem; text-align: center; font-weight: 700; border: 1px solid var(--line); }
      .tp-table th.ltr, .tp-table td.ltr { direction: ltr; }
      .tp-table td { padding: 0.5rem 0.6rem; text-align: center; border: 1px solid var(--line); color: var(--ink); }
      .tp-table td.left { text-align: left; }
      .tp-table td.sm { font-size: 0.76rem; color: var(--ink-soft); }
      .tp-table .hl { background: #f3ead6; font-weight: 700; }

      .tp-flat { border: 1px solid var(--line); border-radius: 4px; overflow: hidden; background: #fff; }
      .tp-flat img { width: 100%; display: block; }
      .tp-swatches { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; margin-bottom: 1.2rem; }
      @media (max-width: 700px) { .tp-swatches { grid-template-columns: repeat(2, 1fr); } }
      .tp-swatch-card { border: 1px solid var(--line); border-radius: 4px; overflow: hidden; background: var(--cream); }
      .tp-swatch-card img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
      .tp-swatch-name { padding: 0.5rem; font-size: 0.78rem; color: var(--ink); text-align: center; }
      .tp-materials { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; }
      @media (max-width: 700px) { .tp-materials { grid-template-columns: 1fr; } }
      .tp-mat { border: 1px solid var(--line); border-radius: 4px; padding: 0.9rem; background: var(--cream); }
      .tp-mat-name { font-weight: 700; color: var(--ink); }
      .tp-mat-type { color: var(--gold-deep); font-size: 0.82rem; margin: 2px 0; }
      .tp-mat-notes { color: var(--ink-soft); font-size: 0.8rem; line-height: 1.5; }

      .tp-colors { display: flex; flex-wrap: wrap; gap: 1.2rem; }
      .tp-color { display: flex; gap: 0.6rem; align-items: center; }
      .tp-color-sw { width: 42px; height: 42px; border-radius: 4px; border: 1px solid var(--line); }
      .tp-color-part { font-weight: 600; color: var(--ink); font-size: 0.85rem; }
      .tp-color-code { color: var(--ink-soft); font-size: 0.76rem; direction: ltr; text-align: right; }

      .tp-steps { padding-right: 0; list-style: none; counter-reset: step; }
      .tp-steps li { counter-increment: step; padding: 0.5rem 0 0.5rem 0; border-bottom: 1px solid var(--line); color: var(--ink); font-size: 0.85rem; direction: ltr; text-align: left; position: relative; padding-left: 2rem; }
      .tp-steps li:before { content: counter(step); position: absolute; left: 0; color: var(--gold-deep); font-family: 'Cormorant Garamond', serif; font-weight: 700; }
      .tp-foot { text-align: center; margin-top: 2rem; padding-top: 1.2rem; border-top: 1px solid var(--line); color: var(--gold); font-family: 'Cormorant Garamond', serif; letter-spacing: 2px; }

      /* النافذة */
      .modal-overlay { position: fixed; inset: 0; background: rgba(44,38,32,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
      .modal { background: var(--ivory); border-radius: 10px; padding: 2.5rem; max-width: 900px; width: 100%; max-height: 92vh; overflow-y: auto; position: relative; }
      .close-modal { position: absolute; top: 1rem; left: 1rem; background: var(--cream); border: 1px solid var(--line); width: 38px; height: 38px; border-radius: 50%; cursor: pointer; font-size: 1rem; color: var(--ink); }
      .modal-title { text-align: center; font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; color: var(--ink); margin-bottom: 0.4rem; }
      .modal-sub { text-align: center; color: var(--ink-soft); margin-bottom: 1.4rem; }
      .admin-section { text-align: center; margin-bottom: 1.8rem; padding: 1rem; background: var(--cream); border-radius: 8px; }
      .admin-link { background: none; border: none; color: var(--gold-deep); cursor: pointer; font-size: 0.9rem; text-decoration: underline; font-family: 'Tajawal'; }
      .admin-input-group { display: flex; gap: 0.5rem; justify-content: center; align-items: center; flex-wrap: wrap; }
      .admin-input { padding: 0.5rem 1rem; border: 1px solid var(--line); border-radius: 6px; width: 160px; font-family: 'Tajawal'; }
      .admin-btn { padding: 0.5rem 1.2rem; background: var(--ink); color: var(--ivory); border: none; border-radius: 6px; cursor: pointer; font-family: 'Tajawal'; }
      .admin-cancel { padding: 0.5rem 1.2rem; background: var(--cream-2); color: var(--ink-soft); border: none; border-radius: 6px; cursor: pointer; font-family: 'Tajawal'; }
      .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.3rem; }
      @media (max-width: 800px) { .pricing-grid { grid-template-columns: 1fr; } }
      .pricing-card { background: var(--ivory); border-radius: 8px; padding: 2rem; text-align: center; border: 1px solid var(--line); position: relative; }
      .pricing-card.featured { border-color: var(--gold); box-shadow: 0 12px 40px rgba(176,141,87,0.18); }
      .popular-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--gold-deep); color: var(--ivory); padding: 0.35rem 1.1rem; border-radius: 4px; font-size: 0.78rem; font-weight: 700; }
      .pricing-card h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--ink); }
      .plan-price { font-size: 2.4rem; font-weight: 800; color: var(--ink); margin-bottom: 1rem; font-family: 'Cormorant Garamond', serif; }
      .plan-price span { font-size: 1rem; font-weight: 400; color: var(--ink-soft); }
      .pricing-card ul { list-style: none; margin-bottom: 1.5rem; }
      .pricing-card li { padding: 0.5rem 0; color: var(--ink-soft); border-bottom: 1px solid var(--line); font-size: 0.9rem; }
      .subscribe-btn { width: 100%; padding: 0.9rem; background: var(--ink); color: var(--ivory); border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-family: 'Tajawal'; }
      .subscribe-btn:hover { background: var(--gold-deep); }
      .subscribe-btn.pro { background: var(--gold-deep); }

      .footer { text-align: center; padding: 2.5rem; color: var(--ink-soft); font-family: 'Cormorant Garamond', serif; letter-spacing: 2px; border-top: 1px solid var(--line); margin-top: 2rem; }
    `}</style>
  );
}
