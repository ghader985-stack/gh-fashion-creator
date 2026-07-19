import { useState, useEffect, createContext, useContext } from 'react';
import Head from 'next/head';

export default function Home() {
  const [activeTab, setActiveTab] = useState('moodboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [tpStage, setTpStage] = useState('');
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

  // مجموعات السايدبار — مرتبة مثل المنصات الاحترافية
  const navGroups = [
    {
      label: 'التصميم',
      items: [
        { id: 'moodboard', name: 'المود بورد', num: '01', desc: 'لوحة الإلهام' },
        { id: 'studio', name: 'استوديو AI', num: '02', desc: 'توليد صورة القطعة' },
      ],
    },
    {
      label: 'الإنتاج',
      items: [
        { id: 'techpack', name: 'التيك باك', num: '03', desc: 'الحزمة التقنية' },
      ],
    },
    {
      label: 'التسويق',
      items: [
        { id: 'marketing', name: 'المحتوى التسويقي', num: '04', desc: 'كابشنات وأفكار' },
        { id: 'video', name: 'الفيديو', num: '05', desc: 'برومبتات سينمائية' },
      ],
    },
  ];
  const allTabs = navGroups.flatMap((g) => g.items);
  const currentTab = allTabs.find((t) => t.id === activeTab) || allTabs[0];

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
      // ===== الطور 1: التحليل (نص + جداول) =====
      setTpStage('جارٍ تحليل التصميم…');
      const fd = new FormData();
      fd.append('image', tpImage);
      fd.append('garmentName', tpName);
      fd.append('fabricInfo', tpFabric);
      fd.append('season', tpSeason);
      fd.append('notes', tpNotes);
      fd.append('brandName', 'GH Couture AI');
      const r = await fetch('/api/techpack', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.error) { setTpError(d.error); setTpLoading(false); setTpStage(''); return; }

      // ===== الطور 2: الصور (5 صفحات + صورة لكل خامة) =====
      // طلب مستقل بسقف زمني مستقل، فلا يزاحم التحليلَ على الوقت.
      setTpStage('جارٍ توليد صور التيك باك… (قد يستغرق حتى 4 دقائق)');
      let images = {};
      try {
        const fd2 = new FormData();
        fd2.append('image', tpImage);
        fd2.append('meta', JSON.stringify({
          garmentFacts: d.garmentFacts || '',
          specSheetLabels: d.specSheetLabels || {},
          calloutMap: d.calloutMap || [],
          sewingDetailLabels: d.sewingDetailLabels || [],
          colorway: d.colorway || [],
          detailAreas: (d.detailViews || []).map((x) => x.area),
          materials: (d.materials || []).map((m) => ({
            name: m.name, pantone: m.pantone, photoPrompt: m.photoPrompt,
          })),
        }));
        const r2 = await fetch('/api/techpack-images', { method: 'POST', body: fd2 });
        const d2 = await r2.json();
        if (!d2.error) images = d2;
      } catch { /* التحليل نجح — نعرضه حتى لو تعذّر توليد الصور */ }

      // عرض النتيجة مرة واحدة كاملة
      setTechpack({ ...d, ...images });
      incrementUsage();
    } catch { setTpError('خطأ في الاتصال، حاولي مرة ثانية'); }
    setTpLoading(false);
    setTpStage('');
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

      <div className="app">
        {/* ===== السايدبار ===== */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sb-brand">
            <div className="sb-logo">GH</div>
            <div>
              <div className="sb-title">GH Couture AI</div>
              <div className="sb-sub">مصنع الأزياء الرقمي</div>
            </div>
          </div>

          <nav className="sb-nav">
            {navGroups.map((group) => (
              <div className="sb-group" key={group.label}>
                <div className="sb-group-label">{group.label}</div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                    className={`sb-item ${activeTab === item.id ? 'active' : ''}`}
                  >
                    <span className="sb-item-num">{item.num}</span>
                    <span className="sb-item-body">
                      <span className="sb-item-name">{item.name}</span>
                      <span className="sb-item-desc">{item.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="sb-foot">
            {user ? (
              <div className="sb-user">
                {user.plan === 'admin' ? (
                  <div className="sb-plan admin">وضع المالكة — بلا حدود</div>
                ) : (
                  <>
                    <div className="sb-plan">
                      باقة {plans[user.plan]?.name} · {usageCount}/{plans[user.plan]?.limit}
                    </div>
                    <div className="sb-usage-bar">
                      <div className="sb-usage-fill" style={{ width: `${(usageCount / (plans[user.plan]?.limit || 1)) * 100}%` }}></div>
                    </div>
                  </>
                )}
                <div className="sb-user-actions">
                  {user.plan !== 'admin' && (
                    <button onClick={() => setShowPricing(true)} className="sb-btn primary">ترقية</button>
                  )}
                  <button onClick={handleLogout} className="sb-btn ghost">خروج</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowPricing(true)} className="sb-btn primary full">اشتركي الآن</button>
            )}
          </div>
        </aside>

        {sidebarOpen && <div className="sb-overlay" onClick={() => setSidebarOpen(false)}></div>}

        {/* ===== المنطقة الرئيسية ===== */}
        <div className="main-area">
          {/* شريط علوي */}
          <header className="topbar">
            <button className="menu-btn" onClick={() => setSidebarOpen(true)} aria-label="menu">☰</button>
            <div className="topbar-title">
              <span className="topbar-eyebrow">المرحلة {currentTab.num}</span>
              <h1 className="topbar-h1">{currentTab.name}</h1>
            </div>
            <div className="topbar-actions">
              {user && user.plan !== 'admin' && (
                <div className="topbar-usage">
                  <span>{usageCount}/{plans[user.plan]?.limit}</span>
                  <div className="topbar-usage-bar"><div style={{ width: `${(usageCount / (plans[user.plan]?.limit || 1)) * 100}%` }}></div></div>
                </div>
              )}
              {!user && <button onClick={() => setShowPricing(true)} className="topbar-cta">اشتركي</button>}
            </div>
          </header>

          <div className="content">

            {/* ===== المود بورد ===== */}
            {activeTab === 'moodboard' && (
              <div className="tool">
                <section className="card">
                  <p className="card-hint">اكتبي وصف الكونسبت، وتُبنى لكِ لوحة إلهام احترافية كاملة: رسمة، صور، باليت ألوان، وخامات.</p>
                  <div className="field">
                    <label>وصف الكونسبت</label>
                    <textarea value={moodDescription} onChange={(e) => setMoodDescription(e.target.value)}
                      placeholder="مثال: فستان سهرة مستوحى من أعماق البحر، ألوان زمردية وفيروزية، إحساس غامض وساحر..."></textarea>
                  </div>
                  <button onClick={handleMoodboard} disabled={moodLoading} className="cta">
                    {moodLoading ? <><span className="spinner"></span> جاري إنشاء اللوحة...</> : 'أنشئي المود بورد'}
                  </button>
                  {moodError && <div className="err">{moodError}</div>}
                </section>

                {moodLoading && <div className="loading-block"><span className="spinner-lg"></span><p>يتم توليد الرسمة والصور والألوان...</p></div>}
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
              </div>
            )}

            {/* ===== استوديو AI ===== */}
            {activeTab === 'studio' && (
              <div className="tool">
                <section className="card">
                  <p className="card-hint">حوّلي الكونسبت إلى صورة قطعة احترافية. صفي التصميم، وارفعي صورة مرجعية اختيارياً.</p>
                  <div className="field">
                    <label>وصف التصميم</label>
                    <textarea value={studioDesc} onChange={(e) => setStudioDesc(e.target.value)}
                      placeholder="مثال: فستان طويل بقصّة حورية، حرير زمردي بطبقات شيفون متدرجة، تطريز لؤلؤي عند الصدر..."></textarea>
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
                      {[{ id: 'catalog', n: 'معلّقة (كتالوج)' }, { id: 'onmodel', n: 'على موديل' }, { id: 'flatlay', n: 'مسطّحة' }, { id: 'detail', n: 'تفاصيل' }].map((s) => (
                        <button key={s.id} onClick={() => setStudioShot(s.id)} className={`chip ${studioShot === s.id ? 'active' : ''}`}>{s.n}</button>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <label>الخلفية</label>
                    <div className="chips">
                      {[{ id: 'cream', n: 'كريمي' }, { id: 'white', n: 'أبيض' }, { id: 'dark', n: 'داكن' }].map((b) => (
                        <button key={b.id} onClick={() => setStudioBg(b.id)} className={`chip ${studioBg === b.id ? 'active' : ''}`}>{b.n}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleStudio} disabled={studioLoading} className="cta">
                    {studioLoading ? <><span className="spinner"></span> جاري توليد الصورة...</> : 'ولّدي صورة القطعة'}
                  </button>
                  {studioError && <div className="err">{studioError}</div>}
                </section>

                {studioLoading && <div className="loading-block"><span className="spinner-lg"></span><p>يتم بناء البرومبت وتوليد الصورة...</p></div>}
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
              </div>
            )}

            {/* ===== التيك باك ===== */}
            {activeTab === 'techpack' && (
              <div className="tool">
                <section className="card">
                  <p className="card-hint">ارفعي صورة التصميم (سكتش، صورة AI، أو قطعة)، وأضيفي مواصفات القماش. تُبنى لكِ حزمة تقنية كاملة للمصنع.</p>
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
                    <textarea value={tpFabric} onChange={(e) => setTpFabric(e.target.value)}
                      placeholder="مثال: حرير شيفون 60 غرام، بطانة ساتان، تطريز يدوي بالخرز. إن تركتيها فارغة فسنقترح خامات منطقية."></textarea>
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
                    {tpLoading ? <><span className="spinner"></span> {tpStage || 'جارٍ بناء التيك باك…'}</> : 'أنشئي التيك باك'}
                  </button>
                  {tpError && <div className="err">{tpError}</div>}
                </section>

                {tpLoading && <div className="loading-block"><span className="spinner-lg"></span><p>{tpStage || 'يتم بناء التيك باك…'}</p><p className="loading-note">التيك باك سيظهر كاملاً عند الانتهاء</p></div>}
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
              </div>
            )}

            {/* ===== المحتوى التسويقي ===== */}
            {activeTab === 'marketing' && (
              <div className="tool split">
                <section className="card">
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
                      {tones.map((t) => (<button key={t} onClick={() => setMkTone(t)} className={`chip ${mkTone === t ? 'active' : ''}`}>{t}</button>))}
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
                <section className="card">
                  <div className="result-head">
                    <h2 className="card-title">النتيجة</h2>
                    {mkResult && <button onClick={() => copyText(mkResult)} className="mini-btn">نسخ</button>}
                  </div>
                  <div className="result-area">
                    {mkResult ? <div className="result-content">{mkResult}</div> : <p className="placeholder">المحتوى سيظهر هنا</p>}
                  </div>
                </section>
              </div>
            )}

            {/* ===== الفيديو ===== */}
            {activeTab === 'video' && (
              <div className="tool split">
                <section className="card">
                  <div className="field">
                    <label>نوع الفيديو</label>
                    <div className="chips">
                      {videoTypes.map((v) => (<button key={v} onClick={() => setVidType(v)} className={`chip ${vidType === v ? 'active' : ''}`}>{v}</button>))}
                    </div>
                  </div>
                  <div className="field">
                    <label>المود</label>
                    <div className="chips">
                      {videoMoods.map((m) => (<button key={m} onClick={() => setVidMood(m)} className={`chip ${vidMood === m ? 'active' : ''}`}>{m}</button>))}
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
                <section className="card">
                  <div className="result-head">
                    <h2 className="card-title">النتيجة</h2>
                    {vidResult && <button onClick={() => copyText(vidResult)} className="mini-btn">نسخ</button>}
                  </div>
                  <div className="result-area">
                    {vidResult ? <div className="result-content">{vidResult}</div> : <p className="placeholder">برومبت الفيديو سيظهر هنا</p>}
                  </div>
                </section>
              </div>
            )}

          </div>

          <footer className="footer">© 2026 GH Couture AI</footer>
        </div>
      </div>

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

      <StyleBlock />
    </>
  );
}
// ===== بناء برومبتات المحتوى والفيديو =====
const TpMetaContext = createContext({});

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

// ============================================================================
// ===== عرض التيك باك — هيكل Adstronaut الحرفي: 15 صفحة بهيدر موحّد =====
// ============================================================================
const GRADE_SIZES = ['2', '4', '6', '8', '10', '12'];
const GRADE_SPLIT = 15; // أول 15 نقطة في صفحة التدرّج الأولى والباقي في (CONTINUED)

function TechpackView({ tp, preview }) {
  const meta = {
    styleCode: tp.styleCode,
    garmentName: tp.garmentName,
    season: tp.season,
    sampleSize: tp.sampleSize || '6',
    sizeRange: tp.sizeRange || '2 - 12',
    category: tp.category,
    fabricSummary: tp.fabricSummary || '',
    brandName: tp.brandName,
    version: 'v0',
    date: (tp.generatedAt || '').slice(0, 10),
    preview,
  };

  const materials = tp.materials || [];
  const matPhotos = tp.materialPhotos || [];
  const measurements = tp.measurements || [];
  const grade1 = measurements.slice(0, GRADE_SPLIT);
  const grade2 = measurements.slice(GRADE_SPLIT);
  const mat1 = materials.slice(0, 8);
  const mat2 = materials.slice(8);
  const colorway = tp.colorway || [];
  const specLabels = tp.specSheetLabels || {};
  const calloutMap = tp.calloutMap || [];
  const sewLabels = tp.sewingDetailLabels || [];
  const detailViews = tp.detailViews || [];
  const artwork = tp.artwork || [];
  const construction = tp.construction || [];
  const sewingSteps = tp.sewingSteps || [];
  const fitLog = (tp.fitLog && tp.fitLog.length > 0) ? tp.fitLog : [
    { version: 'v0', date: (tp.generatedAt || '').slice(0, 10), change: 'Initial sample tech pack generated', by: tp.brandName },
  ];

  const gradeTable = (rows, cont) => (
    <>
      <table className="tp-table tp-grade">
        <thead>
          <tr>
            <th className="ltr left-h">POINT OF MEASURE</th>
            <th className="ltr">TOLERANCE</th>
            {GRADE_SIZES.map((s) => (
              <th key={s} className={s === meta.sampleSize ? 'hl' : ''}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((m, i) => (
            <tr key={i}>
              <td className="left ltr sm">{m.pom}</td>
              <td className="ltr">{m.tolerance}</td>
              {GRADE_SIZES.map((s) => (
                <td key={s} className={s === meta.sampleSize ? 'hl' : ''}>{m.sizes ? m.sizes[s] : ''}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="tp-grade-note">Sample Size: {meta.sampleSize} (highlighted) · cm{cont ? ' · Continued on next page' : ''}</div>
    </>
  );

  const matCards = (list, offset) => (
    <div className="tp-matcards">
      {list.map((m, i) => (
        <div className="tp-matcard" key={i}>
          {matPhotos[offset + i]
            ? <img src={matPhotos[offset + i]} alt={m.name} crossOrigin="anonymous" />
            : <div className="tp-matcard-ph"></div>}
          <div className="tp-matcard-body">
            <div className="tp-matcard-name">{m.name}</div>
            <div className="tp-matcard-place">{m.placement}</div>
            <div className="tp-matcard-desc">{m.description}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const pageImage = (src, alt, ratio) => (
    <div className="tp-img-frame">
      {src
        ? <img src={src} alt={alt} crossOrigin="anonymous" />
        : <div className="tp-img-ph" style={ratio ? { aspectRatio: ratio } : undefined}></div>}
    </div>
  );

  // بناء الصفحات بترتيب النموذج الحرفي
  const pages = [];

  pages.push(['REFERENCE IMAGES', (
    <div className="tp-ref-frame">
      {preview
        ? <img src={preview} alt="design reference" crossOrigin="anonymous" />
        : <div className="tp-img-ph" style={{ aspectRatio: '3/4' }}></div>}
    </div>
  )]);

  pages.push(['SAMPLE MEASUREMENTS', (
    <>
      <AnnotatedPair frontImage={tp.flatFrontImage} backImage={tp.flatBackImage} mode="measure"
        front={specLabels.front || []} back={specLabels.back || []} />
      <div className="tp-anno-caption">Garment Details: BLACK &nbsp;·&nbsp; Measurement Lines and Labels: DARK RED</div>
    </>
  )]);

  pages.push(['SIZE GRADING CHART', gradeTable(grade1, grade2.length > 0)]);
  if (grade2.length > 0) pages.push(['SIZE GRADING CHART (CONTINUED)', gradeTable(grade2, false)]);

  pages.push(['MATERIALS', matCards(mat1, 0)]);
  if (mat2.length > 0) pages.push(['MATERIALS (CONTINUED)', matCards(mat2, 8)]);

  pages.push(['MATERIALS CALLOUT', (
    <AnnotatedPair frontImage={tp.flatFrontImage} backImage={tp.flatBackImage} mode="callout"
      front={calloutMap.filter((c) => (c.view || 'front') !== 'back')}
      back={calloutMap.filter((c) => c.view === 'back')} />
  )]);

  pages.push(['BILL OF MATERIALS', (
    <table className="tp-table tp-bom">
      <thead>
        <tr>
          <th>#</th><th className="ltr left-h">ITEM NAME</th><th className="ltr left-h">DESCRIPTION</th>
          <th className="ltr left-h">PLACEMENT</th><th className="ltr">QTY</th><th className="ltr">UNIT</th>
        </tr>
      </thead>
      <tbody>
        {materials.map((m, i) => (
          <tr key={i}>
            <td className="ref-code">{i + 1}</td>
            <td className="left ltr"><b>{m.name}</b></td>
            <td className="left ltr sm">{m.description}</td>
            <td className="left ltr sm">{m.placement}</td>
            <td className="ltr">{m.qty}</td>
            <td className="ltr">{m.unit}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )]);

  pages.push(['SEWING DETAILS', (
    <AnnotatedPair frontImage={tp.flatFrontImage} backImage={tp.flatBackImage} mode="sewing"
      front={sewLabels.filter((s) => (s.view || 'front') !== 'back')}
      back={sewLabels.filter((s) => s.view === 'back')} />
  )]);

  pages.push(['COLORWAYS & PANTONE', (
    <div className="tp-colorways">
      <div className="tp-img-frame">
        <div className="tp-pair">
          <div className="tp-view">{tp.coloredFrontImage ? <img src={tp.coloredFrontImage} alt="front colorway" crossOrigin="anonymous" /> : <div className="tp-img-ph" style={{ aspectRatio: '2/3' }}></div>}<div className="tp-view-cap">FRONT</div></div>
          <div className="tp-view">{tp.coloredBackImage ? <img src={tp.coloredBackImage} alt="back colorway" crossOrigin="anonymous" /> : <div className="tp-img-ph" style={{ aspectRatio: '2/3' }}></div>}<div className="tp-view-cap">BACK</div></div>
        </div>
      </div>
      <div>
        <div className="tp-pantone-title">Pantone Color Palette</div>
        {colorway.map((c, i) => (
          <div className="tp-pantone-row" key={i}>
            <div className="tp-pantone-sw" style={{ background: c.hex }}></div>
            <div>
              <div className="tp-pantone-part">{c.part}</div>
              <div className="tp-pantone-code">{c.pantone} · {c.hex}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )]);

  pages.push(['DETAILED VIEWS', (
    <>
      <RefCrops image={preview} areas={detailViews.map((d) => d.area)} />
      {detailViews.length > 0 && (
        <table className="tp-table" style={{ marginTop: '1rem' }}>
          <thead><tr><th className="ltr left-h">AREA</th><th className="ltr left-h">DETAIL</th><th className="ltr left-h">SPEC</th></tr></thead>
          <tbody>
            {detailViews.map((d, i) => (
              <tr key={i}>
                <td className="left ltr"><b>{d.area}</b></td>
                <td className="left ltr sm">{d.detail}</td>
                <td className="left ltr sm">{d.spec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )]);

  if (artwork.length > 0) {
    pages.push(['ARTWORK DETAILS', (
      <table className="tp-table">
        <thead><tr><th className="ltr left-h">ELEMENT</th><th className="ltr left-h">PLACEMENT</th><th className="ltr left-h">SIZE</th><th className="ltr left-h">NOTES</th></tr></thead>
        <tbody>
          {artwork.map((a, i) => (
            <tr key={i}>
              <td className="left ltr"><b>{a.name}</b></td>
              <td className="left ltr sm">{a.placement}</td>
              <td className="left ltr sm">{a.size}</td>
              <td className="left ltr sm">{a.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )]);
  }

  pages.push(['CONSTRUCTION GUIDE', (
    <>
      <div className="tp-gi-head">Garment Information</div>
      <div className="tp-gi">
        <div><b>Type:</b> {tp.garmentInfo?.type}</div>
        <div><b>Silhouette:</b> {tp.garmentInfo?.silhouette}</div>
        <div><b>Construction:</b> {tp.garmentInfo?.construction}</div>
      </div>
      <div className="tp-gi-head">Construction &amp; Trim Details</div>
      <table className="tp-table">
        <thead><tr><th>#</th><th className="ltr left-h">SECTION</th><th className="ltr left-h">DETAIL TYPE</th><th className="ltr left-h">DESCRIPTION</th></tr></thead>
        <tbody>
          {construction.map((c, i) => (
            <tr key={i}>
              <td className="ref-code">{i + 1}</td>
              <td className="left ltr"><b>{c.section}</b></td>
              <td className="left ltr sm">{c.detailType || c.detail}</td>
              <td className="left ltr sm">{c.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )]);

  pages.push(['SEWING INSTRUCTIONS', (
    <>
      <div className="tp-gi-head">Sewing Instructions</div>
      <ol className="tp-steps">
        {sewingSteps.map((s, i) => (<li key={i} dir="ltr">{s}</li>))}
      </ol>
    </>
  )]);

  pages.push(['FIT LOG & REVISION HISTORY', (
    <table className="tp-table">
      <thead><tr><th>#</th><th className="ltr left-h">VERSION</th><th className="ltr left-h">DATE</th><th className="ltr left-h">CHANGE / FIT COMMENT</th><th className="ltr left-h">BY</th></tr></thead>
      <tbody>
        {fitLog.map((f, i) => (
          <tr key={i}>
            <td className="ref-code">{i + 1}</td>
            <td className="left ltr">{f.version}</td>
            <td className="left ltr sm">{f.date}</td>
            <td className="left ltr sm">{f.change}</td>
            <td className="left ltr sm">{f.by}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )]);

  const total = pages.length;

  return (
    <TpMetaContext.Provider value={meta}>
      <div id="techpack-canvas" className="tp">
        {pages.map(([title, body], i) => (
          <TpPage key={i} n={i + 1} total={total} title={title}>
            {body}
          </TpPage>
        ))}
        <div className="tp-foot">{tp.brandName} · Technical Package</div>
      </div>
    </TpMetaContext.Provider>
  );
}

// ============================================================================
// ===== طبقة الشرح المرسومة بالكود فوق الرسمات =====
// النص والأرقام تُرسم كـ HTML حاد (لا نطلب من نماذج الصور كتابة نصوص).
// كل منظر (أمامي/خلفي) صورة مستقلة، وخطوط القياس تمتد عبر جسم القطعة نفسه.
// ============================================================================
const ANCHOR_KEYWORDS = [
  ['SHOULDER', 1], ['TOP EDGE', 2], ['NECK', 3], ['STAY', 6], ['HOOK', 8],
  ['CUP', 12], ['BP', 16], ['BUST', 17], ['TULLE', 18], ['EMBROID', 20],
  ['BODICE', 22], ['BONING', 22], ['UNDERBUST', 24], ['LABEL', 26], ['SIDE', 28],
  ['ZIP', 30], ['CLOSURE', 30], ['WAIST', 32], ['SEAM', 33], ['SATIN', 38],
  ['HIGH HIP', 40], ['HIP', 45], ['LOW HIP', 48], ['OVERLAY', 52], ['THIGH', 55],
  ['CHIFFON', 58], ['LINING', 60], ['FLARE', 64], ['KNEE', 66],
  ['BEAD', 70], ['CRYSTAL', 72], ['STAR', 72],
  ['TRAIN', 88], ['HBS', 95], ['HEM', 96], ['SWEEP', 97], ['HFS', 97],
];

// النسب أعلاه نسبةً إلى جسم القطعة نفسها (0 = أعلى القطعة، 100 = أسفلها)
function anchorTop(text, i, n) {
  const t = (text || '').toUpperCase();
  for (let k = 0; k < ANCHOR_KEYWORDS.length; k++) {
    if (t.includes(ANCHOR_KEYWORDS[k][0])) return ANCHOR_KEYWORDS[k][1];
  }
  return 5 + (88 * (i + 1)) / (n + 1);
}

function layoutRows(rows, minTop, maxTop) {
  const lo = typeof minTop === 'number' ? minTop : 3;
  const hi = typeof maxTop === 'number' ? maxTop : 95;
  rows.sort((a, b) => a.top - b.top);
  for (const r of rows) { if (r.top < lo) r.top = lo; }
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].top - rows[i - 1].top < 7) rows[i].top = rows[i - 1].top + 7;
  }
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].top > hi) rows[i].top = hi - (rows.length - 1 - i) * 7;
  }
  return rows;
}

const isVerticalPom = (t) => /CFL|CBL|LENGTH|ZIPPER/i.test(t || '');

// كشف الصندوق المحيط للقطعة في صورة منظر واحد (خطوط داكنة على أبيض).
// يعمل محلياً على كانفاس — بلا أي استدعاء API وبلا أي كلفة.
function useImgBox(image) {
  const [box, setBox] = useState(null);
  useEffect(() => {
    if (!image) { setBox(null); return; }
    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const W = 140;
        const H = Math.max(60, Math.round((img.height / img.width) * W));
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, W, H);
        const data = ctx.getImageData(0, 0, W, H).data;
        let top = H, bot = -1, left = W, right = -1;
        for (let y = 1; y < H - 1; y++) {
          for (let x = 1; x < W - 1; x++) {
            const p = (y * W + x) * 4;
            if ((data[p] + data[p + 1] + data[p + 2]) / 3 < 150) {
              if (y < top) top = y;
              if (y > bot) bot = y;
              if (x < left) left = x;
              if (x > right) right = x;
            }
          }
        }
        const found = bot > 0 && bot - top > H * 0.2;
        if (!cancelled) setBox(found ? {
          top: (top / H) * 100, bottom: (bot / H) * 100,
          left: (left / W) * 100, right: (right / W) * 100,
        } : null);
      } catch (e) { if (!cancelled) setBox(null); }
    };
    img.onerror = () => { if (!cancelled) setBox(null); };
    img.src = image;
    return () => { cancelled = true; };
  }, [image]);
  return box;
}

const DEFAULT_VIEW_BOX = { top: 6, bottom: 95, left: 22, right: 78 };

// منظر واحد مشروح: خطوط القياس تعبر جسم القطعة، والدوائر/التسميات على جهة labelSide
function AnnotatedView({ image, mode, items, caption, labelSide }) {
  const detected = useImgBox(image);
  if (!image) {
    return <div className="tp-view"><div className="tp-img-ph" style={{ aspectRatio: '2/3' }}></div><div className="tp-view-cap">{caption}</div></div>;
  }
  const box = detected || DEFAULT_VIEW_BOX;

  const all = (items || []).map((x) => (typeof x === 'string' ? { text: x } : { text: x.label || x.target || '', num: x.num }));
  const vertical = mode === 'measure' ? all.filter((x) => isVerticalPom(x.text)) : [];
  const horizontal = mode === 'measure' ? all.filter((x) => !isVerticalPom(x.text)) : all;
  const rows = layoutRows(horizontal.map((it, i) => ({
    ...it,
    top: box.top + (anchorTop(it.text, i, horizontal.length) / 100) * (box.bottom - box.top),
  })), box.top + 1, box.bottom - 1);

  const bw = Math.max(box.right - box.left, 20);

  return (
    <div className="tp-view">
      <div className="tp-anno">
        <img src={image} alt={caption} crossOrigin="anonymous" />

        {mode === 'measure' && rows.map((r, i) => (
          <div className="tp-m-wrap" key={'m' + i} style={{ top: r.top + '%', left: box.left + '%', width: bw + '%' }}>
            <span className="tp-m-label">{r.text}</span>
            <i className="tp-m-line"></i>
          </div>
        ))}
        {mode === 'measure' && vertical.slice(0, 2).map((v, i) => (
          <div className="tp-anno-vert" key={'v' + i}
            style={{ left: Math.min(box.right + 3 + i * 4, 96) + '%', top: box.top + '%', bottom: (100 - box.bottom) + '%' }}>
            <span className="tp-m-label vert">{v.text}</span>
          </div>
        ))}

        {mode !== 'measure' && rows.map((r, i) => {
          // التسمية تلاصق حافة القطعة والخط يلمس القطعة نفسها — لا تسميات عائمة بالفراغ
          const style = labelSide === 'right'
            ? { top: r.top + '%', left: (box.right - 2) + '%', width: Math.min(24, 100 - box.right + 1.5) + '%' }
            : { top: r.top + '%', left: Math.max(box.left - 22, 0.5) + '%', width: (box.left + 2 - Math.max(box.left - 22, 0.5)) + '%' };
          return (
            <div className={'tp-anno-row ' + (labelSide === 'right' ? 'right' : 'left')} key={'c' + i} style={style}>
              {labelSide === 'right' ? <><i className="tp-anno-line"></i>{mode === 'callout' ? <span className="tp-anno-circle">{r.num}</span> : <span className="tp-anno-text">{r.text}</span>}</>
                : <>{mode === 'callout' ? <span className="tp-anno-circle">{r.num}</span> : <span className="tp-anno-text">{r.text}</span>}<i className="tp-anno-line"></i></>}
            </div>
          );
        })}
      </div>
      <div className="tp-view-cap">{caption}</div>
    </div>
  );
}

// زوج المنظرين الأمامي والخلفي جنباً إلى جنب
function AnnotatedPair({ frontImage, backImage, mode, front, back }) {
  return (
    <div className="tp-img-frame">
      <div className="tp-pair">
        <AnnotatedView image={frontImage} mode={mode} items={front} caption="FRONT" labelSide="left" />
        <AnnotatedView image={backImage} mode={mode} items={back} caption="BACK" labelSide="right" />
      </div>
    </div>
  );
}

// صفحة DETAILED VIEWS: لقطات مقرّبة مقصوصة من صورة التصميم المرجعية نفسها —
// حتمية 100% وبلا أي توليد أو كلفة، فلا يمكن أن تخالف التصميم.
const CROP_POSITIONS = [
  ['NECK', '50% 10%'], ['SHOULDER', '50% 8%'], ['BUST', '50% 20%'], ['TULLE', '50% 20%'],
  ['EMBROID', '50% 24%'], ['BEAD', '48% 26%'], ['CRYSTAL', '55% 55%'], ['STAR', '55% 60%'],
  ['BODICE', '50% 25%'], ['WAIST', '50% 36%'], ['ZIP', '50% 32%'], ['HIP', '50% 46%'],
  ['SKIRT', '50% 62%'], ['FLARE', '50% 68%'], ['KNEE', '50% 66%'], ['CHIFFON', '55% 80%'],
  ['TRAIN', '50% 88%'], ['HEM', '50% 84%'],
];
const DEFAULT_CROPS = ['50% 12%', '50% 26%', '50% 40%', '50% 58%', '50% 74%', '50% 90%'];

function RefCrops({ image, areas }) {
  if (!image) return <div className="tp-img-ph" style={{ aspectRatio: '4/3' }}></div>;
  const list = (areas && areas.length ? areas : []).slice(0, 6);
  while (list.length < 6) list.push('');
  const posFor = (name, i) => {
    const t = (name || '').toUpperCase();
    for (let k = 0; k < CROP_POSITIONS.length; k++) {
      if (t.includes(CROP_POSITIONS[k][0])) return CROP_POSITIONS[k][1];
    }
    return DEFAULT_CROPS[i % DEFAULT_CROPS.length];
  };
  return (
    <div className="tp-crops">
      {list.map((name, i) => (
        <div className="tp-crop" key={i}>
          <div className="tp-crop-img" style={{ backgroundImage: 'url(' + image + ')', backgroundPosition: posFor(name, i) }}></div>
          {name ? <div className="tp-crop-cap">{name}</div> : null}
        </div>
      ))}
    </div>
  );
}


// هيدر الصفحة — مطابق لهيدر النموذج:
// يسار: صورة مصغّرة + كود الستايل + الاسم + الموسم + المورّد
// وسط: عنوان الصفحة + (Size / Category / Fabric)
// يمين: الإصدار + Page X of N + التاريخ + العلامة
function TpPage({ n, total, title, children }) {
  const meta = useContext(TpMetaContext);
  return (
    <div className="tp-page">
      <div className="tp-hd">
        <div className="tp-hd-left">
          {meta.preview
            ? <img src={meta.preview} alt="" className="tp-hd-thumb" crossOrigin="anonymous" />
            : <div className="tp-hd-thumb ph"></div>}
          <div>
            <div className="tp-hd-code">{meta.styleCode}</div>
            <div className="tp-hd-name">{meta.garmentName}</div>
            <div className="tp-hd-sub">Season: {meta.season}</div>
            <div className="tp-hd-sub">Vendor: {meta.brandName}</div>
          </div>
        </div>
        <div className="tp-hd-mid">
          <div className="tp-hd-title">{title}</div>
          <div className="tp-hd-cols">
            <div className="tp-hd-col"><span>Size:</span> {meta.sampleSize} ({meta.sizeRange})</div>
            <div className="tp-hd-col"><span>Category:</span> {meta.category}</div>
            <div className="tp-hd-col"><span>Fabric:</span> {meta.fabricSummary}</div>
          </div>
        </div>
        <div className="tp-hd-right">
          <div className="tp-hd-ver">{meta.version}</div>
          <div className="tp-hd-page">Page {n} of {total}</div>
          <div className="tp-hd-sub">{meta.date}</div>
          <div className="tp-hd-sub">{meta.brandName}</div>
        </div>
      </div>
      <div className="tp-hd-rule"></div>
      <div className="tp-page-body">
        {children}
      </div>
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
        --white: #ffffff;
        --ink: #2c2620;
        --ink-soft: #6b5f4f;
        --gold: #b08d57;
        --gold-deep: #96723f;
        --line: #e6ddcc;
        --sidebar-w: 264px;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Tajawal', sans-serif;
        background: var(--cream);
        color: var(--ink);
        min-height: 100vh;
        direction: rtl;
      }

      /* ===== التخطيط العام: سايدبار + منطقة رئيسية ===== */
      .app { display: flex; min-height: 100vh; }

      .sidebar {
        width: var(--sidebar-w);
        background: var(--ivory);
        border-left: 1px solid var(--line);
        display: flex; flex-direction: column;
        position: fixed; top: 0; right: 0; bottom: 0;
        z-index: 200;
      }
      .sb-brand {
        display: flex; align-items: center; gap: 0.8rem;
        padding: 1.5rem 1.4rem; border-bottom: 1px solid var(--line);
      }
      .sb-logo {
        width: 46px; height: 46px; border: 1.5px solid var(--gold);
        border-radius: 6px; display: flex; align-items: center; justify-content: center;
        color: var(--gold-deep); font-weight: 800; font-size: 1.05rem;
        font-family: 'Cormorant Garamond', serif; letter-spacing: 1px; flex-shrink: 0;
      }
      .sb-title { font-family: 'Cormorant Garamond', serif; font-size: 1.35rem; font-weight: 700; color: var(--ink); letter-spacing: 0.5px; direction: ltr; text-align: right; line-height: 1.1; }
      .sb-sub { font-size: 0.72rem; color: var(--ink-soft); margin-top: 2px; }

      .sb-nav { flex: 1; overflow-y: auto; padding: 1rem 0.8rem; }
      .sb-group { margin-bottom: 1.4rem; }
      .sb-group-label {
        font-size: 0.68rem; letter-spacing: 2px; color: var(--gold-deep);
        font-weight: 700; padding: 0 0.7rem; margin-bottom: 0.6rem; opacity: 0.85;
      }
      .sb-item {
        width: 100%; display: flex; align-items: center; gap: 0.7rem;
        padding: 0.7rem 0.7rem; border: none; background: transparent;
        border-radius: 8px; cursor: pointer; text-align: right;
        transition: background .18s; margin-bottom: 2px; font-family: 'Tajawal';
      }
      .sb-item:hover { background: var(--cream); }
      .sb-item.active { background: var(--cream-2); }
      .sb-item-num {
        font-family: 'Cormorant Garamond', serif; font-size: 0.9rem; font-style: italic;
        color: var(--gold); width: 22px; flex-shrink: 0; text-align: center;
      }
      .sb-item.active .sb-item-num { color: var(--gold-deep); }
      .sb-item-body { display: flex; flex-direction: column; gap: 1px; }
      .sb-item-name { font-size: 0.95rem; font-weight: 700; color: var(--ink); }
      .sb-item-desc { font-size: 0.72rem; color: var(--ink-soft); }

      .sb-foot { padding: 1rem 1.1rem; border-top: 1px solid var(--line); }
      .sb-plan { font-size: 0.78rem; color: var(--ink-soft); margin-bottom: 0.4rem; }
      .sb-plan.admin { color: var(--gold-deep); font-weight: 700; }
      .sb-usage-bar { width: 100%; height: 4px; background: var(--cream-2); border-radius: 2px; margin-bottom: 0.7rem; }
      .sb-usage-fill { height: 100%; background: var(--gold); border-radius: 2px; }
      .sb-user-actions { display: flex; gap: 0.5rem; }
      .sb-btn { flex: 1; padding: 0.6rem; border-radius: 6px; cursor: pointer; font-family: 'Tajawal'; font-weight: 700; font-size: 0.85rem; border: none; }
      .sb-btn.primary { background: var(--ink); color: var(--ivory); }
      .sb-btn.primary:hover { background: var(--gold-deep); }
      .sb-btn.ghost { background: transparent; color: var(--ink-soft); border: 1px solid var(--line); }
      .sb-btn.full { width: 100%; }

      .sb-overlay { display: none; }

      /* ===== المنطقة الرئيسية ===== */
      .main-area {
        flex: 1; margin-right: var(--sidebar-w);
        display: flex; flex-direction: column; min-height: 100vh; min-width: 0;
      }
      .topbar {
        background: var(--white); border-bottom: 1px solid var(--line);
        padding: 1rem 2rem; display: flex; align-items: center; gap: 1rem;
        position: sticky; top: 0; z-index: 100;
      }
      .menu-btn {
        display: none; background: transparent; border: 1px solid var(--line);
        border-radius: 6px; width: 40px; height: 40px; font-size: 1.2rem; cursor: pointer; color: var(--ink);
      }
      .topbar-title { flex: 1; }
      .topbar-eyebrow { font-family: 'Cormorant Garamond', serif; font-style: italic; color: var(--gold-deep); font-size: 0.85rem; }
      .topbar-h1 { font-family: 'Cormorant Garamond', serif; font-size: 1.7rem; font-weight: 700; color: var(--ink); line-height: 1.1; }
      .topbar-actions { display: flex; align-items: center; gap: 1rem; }
      .topbar-usage { display: flex; flex-direction: column; align-items: flex-end; font-size: 0.78rem; color: var(--ink-soft); gap: 3px; }
      .topbar-usage-bar { width: 90px; height: 4px; background: var(--cream-2); border-radius: 2px; }
      .topbar-usage-bar div { height: 100%; background: var(--gold); border-radius: 2px; }
      .topbar-cta { background: var(--ink); color: var(--ivory); border: none; padding: 0.6rem 1.4rem; border-radius: 6px; font-weight: 700; cursor: pointer; font-family: 'Tajawal'; }
      .topbar-cta:hover { background: var(--gold-deep); }

      .content { flex: 1; padding: 2rem; max-width: 1200px; width: 100%; margin: 0 auto; }
      .tool { display: flex; flex-direction: column; gap: 1.4rem; }
      .tool.split { display: grid; grid-template-columns: 1fr 1fr; gap: 1.4rem; }
      @media (max-width: 950px) { .tool.split { grid-template-columns: 1fr; } }

      .card { background: var(--white); border: 1px solid var(--line); border-radius: 10px; padding: 1.8rem; }
      .card-hint { color: var(--ink-soft); margin-bottom: 1.5rem; font-size: 0.92rem; line-height: 1.7; }
      .card-title { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 700; color: var(--ink); }

      .field { margin-bottom: 1.3rem; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      @media (max-width: 600px) { .two-col { grid-template-columns: 1fr; } }
      .field label { display: block; margin-bottom: 0.5rem; color: var(--ink); font-weight: 500; font-size: 0.9rem; }
      .field textarea, .field input {
        width: 100%; padding: 0.9rem 1rem; border: 1px solid var(--line); border-radius: 8px;
        background: var(--cream); font-size: 1rem; font-family: 'Tajawal'; color: var(--ink);
      }
      .field textarea { min-height: 120px; resize: vertical; line-height: 1.7; }
      .field textarea:focus, .field input:focus { outline: none; border-color: var(--gold); }

      .upload-area { border: 1.5px dashed var(--line); border-radius: 10px; padding: 1.8rem; text-align: center; background: var(--cream); }
      .upload-label { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; color: var(--gold-deep); font-size: 0.92rem; }
      .img-preview { position: relative; display: inline-block; }
      .img-preview img { max-width: 100%; max-height: 240px; border-radius: 8px; }
      .remove-img { position: absolute; top: -10px; left: -10px; width: 30px; height: 30px; border-radius: 50%; background: var(--ink); color: #fff; border: none; cursor: pointer; }

      .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .chip { padding: 0.55rem 1.1rem; border: 1px solid var(--line); border-radius: 6px; background: var(--cream); color: var(--ink-soft); cursor: pointer; font-weight: 500; font-family: 'Tajawal'; font-size: 0.88rem; transition: all .2s; }
      .chip:hover { border-color: var(--gold); color: var(--ink); }
      .chip.active { background: var(--ink); color: var(--ivory); border-color: var(--ink); }

      .cta { width: 100%; padding: 1.05rem; background: var(--ink); color: var(--ivory); border: none; border-radius: 8px; font-size: 1.03rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem; font-family: 'Tajawal'; transition: background .2s; }
      .cta:hover:not(:disabled) { background: var(--gold-deep); }
      .cta:disabled { opacity: 0.65; cursor: default; }

      .mini-btn { padding: 0.5rem 1rem; background: var(--ink); color: var(--ivory); border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-family: 'Tajawal'; font-size: 0.85rem; }
      .mini-btn:hover { background: var(--gold-deep); }

      .spinner { width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
      .spinner-lg { width: 46px; height: 46px; border: 3px solid var(--line); border-top-color: var(--gold); border-radius: 50%; animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }

      .err { margin-top: 1rem; padding: 0.9rem 1rem; background: #fdf0ed; color: #b04a35; border-radius: 8px; border: 1px solid #f0d5cd; font-size: 0.9rem; }
      .loading-block { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3.5rem; color: var(--gold-deep); }
      .loading-note { font-size: 0.78rem; color: var(--ink-soft); margin: 0; }
      .placeholder { color: var(--ink-soft); text-align: center; padding: 3rem; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.2rem; opacity: 0.7; }

      .result-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
      .result-area { background: var(--cream); border: 1px solid var(--line); border-radius: 8px; padding: 1.5rem; min-height: 420px; max-height: 640px; overflow-y: auto; }
      .result-content { white-space: pre-wrap; line-height: 1.95; color: var(--ink); font-size: 0.95rem; }

      .board-actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; justify-content: center; }
      .download-btn { padding: 0.85rem 1.8rem; background: var(--ink); color: var(--ivory); border: none; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-family: 'Tajawal'; }
      .download-btn:hover:not(:disabled) { background: var(--gold-deep); }
      .download-btn:disabled { opacity: 0.65; }
      .hint-inline { color: var(--ink-soft); font-size: 0.85rem; }

      /* المود بورد */
      .board { background: #f6f1ea; background-image: radial-gradient(circle at 20% 10%, rgba(255,255,255,0.6), transparent 40%); border-radius: 8px; padding: 3.5rem 3rem; box-shadow: 0 20px 60px rgba(0,0,0,0.1); border: 1px solid var(--line); }
      .board-header { text-align: center; position: relative; margin-bottom: 2.5rem; padding: 0 1rem; }
      .board-corner { position: absolute; width: 26px; height: 26px; border: 1.5px solid var(--gold); }
      .board-corner.tl { top: -12px; right: -6px; border-left: none; border-bottom: none; }
      .board-corner.tr { top: -12px; left: -6px; border-right: none; border-bottom: none; }
      .board-title { font-family: 'Cormorant Garamond', serif; font-size: 3.4rem; font-weight: 600; color: var(--ink); letter-spacing: 3px; line-height: 1.1; direction: ltr; }
      .board-rule { width: 90px; height: 1px; background: var(--gold); margin: 0.9rem auto; }
      .board-subtitle { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.25rem; color: var(--ink-soft); direction: ltr; }
      .board-collage { display: grid; grid-template-columns: 1.15fr 1fr; gap: 14px; margin-bottom: 2.5rem; }
      .collage-hero { position: relative; border-radius: 4px; overflow: hidden; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.16); min-height: 460px; }
      .collage-hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .collage-tiles { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: 14px; }
      .collage-tile { position: relative; border-radius: 4px; overflow: hidden; cursor: pointer; box-shadow: 0 8px 22px rgba(0,0,0,0.1); min-height: 145px; }
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
      .swatch { width: 48px; height: 48px; border-radius: 4px; box-shadow: 0 3px 10px rgba(0,0,0,0.16); border: 1px solid rgba(0,0,0,0.05); }
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
      .studio-result { display: grid; grid-template-columns: 1fr 1fr; gap: 1.4rem; }
      @media (max-width: 800px) { .studio-result { grid-template-columns: 1fr; } }
      .studio-img { position: relative; border-radius: 10px; overflow: hidden; cursor: pointer; box-shadow: 0 14px 40px rgba(0,0,0,0.12); border: 1px solid var(--line); }
      .studio-img img { width: 100%; display: block; }
      .studio-prompt { background: var(--white); border: 1px solid var(--line); border-radius: 10px; padding: 1.5rem; }
      .studio-prompt p { direction: ltr; text-align: left; color: var(--ink); line-height: 1.7; font-size: 0.9rem; margin: 0.6rem 0 1rem; }

      /* منصات الفيديو */
      .platforms-box { margin-top: 1.5rem; padding: 1.4rem; background: var(--cream); border: 1px solid var(--line); border-radius: 8px; }
      .platform-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.7rem 0; border-bottom: 1px solid var(--line); }
      .platform-row:last-child { border-bottom: none; }
      .platform-name { font-weight: 700; color: var(--ink); direction: ltr; }
      .platform-note { color: var(--ink-soft); font-size: 0.85rem; text-align: left; }

      /* ===== التيك باك — هيكل Adstronaut ===== */
      .tp { background: #e8e8ea; border-radius: 8px; padding: 1.4rem; box-shadow: 0 20px 60px rgba(0,0,0,0.08); }

      /* صفحة مستقلة لكل قسم */
      .tp-page { background: #fff; border-radius: 6px; padding: 1.6rem 1.9rem; margin-bottom: 1.2rem; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
      .tp-page-body { min-height: 40px; }

      /* هيدر الصفحة — تخطيط النموذج الحرفي */
      .tp-hd { display: grid; grid-template-columns: 1.5fr 2fr 0.8fr; gap: 1rem; align-items: start; direction: ltr; }
      .tp-hd-left { display: flex; gap: 0.6rem; align-items: flex-start; text-align: left; }
      .tp-hd-thumb { width: 46px; height: 46px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e5e5; flex-shrink: 0; }
      .tp-hd-thumb.ph { background: #f0f0f0; }
      .tp-hd-code { font-weight: 800; font-size: 0.8rem; color: #111; letter-spacing: 0.3px; }
      .tp-hd-name { font-weight: 700; font-size: 0.7rem; color: #111; line-height: 1.3; margin-top: 1px; }
      .tp-hd-sub { font-size: 0.62rem; color: #777; line-height: 1.5; }
      .tp-hd-mid { text-align: center; }
      .tp-hd-title { font-weight: 800; font-size: 1.05rem; letter-spacing: 1.6px; color: #111; font-family: Arial, sans-serif; }
      .tp-hd-cols { display: flex; justify-content: center; align-items: flex-start; gap: 1.6rem; margin-top: 0.5rem; }
      .tp-hd-col { font-size: 0.62rem; color: #555; max-width: 240px; text-align: center; line-height: 1.4; }
      .tp-hd-col span { color: #999; }
      .tp-hd-right { text-align: right; }
      .tp-hd-ver { font-weight: 800; font-size: 0.74rem; color: #111; }
      .tp-hd-page { font-weight: 700; font-size: 0.68rem; color: #111; }
      .tp-hd-rule { height: 3px; background: #111; margin: 0.7rem 0 1.4rem; }
      @media (max-width: 700px) {
        .tp-hd { grid-template-columns: 1fr; gap: 0.5rem; }
        .tp-hd-mid, .tp-hd-right { text-align: left; }
        .tp-hd-cols { justify-content: flex-start; flex-wrap: wrap; gap: 0.8rem; }
        .tp-hd-col { text-align: left; }
      }

      /* إطارات الصور */
      .tp-ref-frame { border: 1px solid #e5e5e5; border-radius: 8px; background: #f6f2e9; padding: 1.2rem; display: flex; justify-content: center; }
      .tp-ref-frame img { max-width: 560px; width: 100%; display: block; border-radius: 4px; }
      .tp-img-frame { border: 1px solid #e5e5e5; border-radius: 8px; background: #fafafa; padding: 0.8rem; }
      .tp-img-frame img { width: 100%; display: block; border-radius: 4px; }
      .tp-img-ph { width: 100%; background: #f0f0f0; border-radius: 4px; }

      /* طبقة الشرح المرسومة بالكود فوق الرسمة النظيفة */
      .tp-anno { position: relative; direction: ltr; }
      .tp-anno img { width: 100%; display: block; border-radius: 4px; }
      .tp-anno-row { position: absolute; display: flex; align-items: center; gap: 4px; }
      .tp-anno-row.left { left: 0.5%; }
      .tp-anno-row.right { right: 0.5%; justify-content: flex-end; }
      .tp-anno-line { flex: 1; border-top: 1.5px dashed #444; position: relative; min-width: 18px; }
      .tp-anno-line.red { border-top-color: #a3271c; }
      .tp-anno-row.left .tp-anno-line:after,
      .tp-anno-row.right .tp-anno-line:before {
        content: ''; position: absolute; top: -3px; width: 5px; height: 5px; border-radius: 50%; background: #444;
      }
      .tp-anno-row.left .tp-anno-line:after { right: -2px; }
      .tp-anno-row.right .tp-anno-line:before { left: -2px; }
      .tp-anno-row .tp-anno-line.red:after, .tp-anno-row .tp-anno-line.red:before { background: #a3271c; }
      .tp-anno-text { font-size: 0.56rem; font-weight: 700; color: #222; letter-spacing: 0.3px; text-transform: uppercase; background: rgba(255,255,255,0.88); padding: 1px 3px; border-radius: 2px; line-height: 1.25; max-width: 130px; }
      .tp-anno-text.red { color: #a3271c; }
      .tp-anno-circle { width: 22px; height: 22px; border: 1.5px solid #111; border-radius: 50%; background: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 0.68rem; font-weight: 800; color: #111; flex-shrink: 0; }
      .tp-anno-vert { position: absolute; top: 12%; bottom: 10%; border-left: 1.5px dashed #a3271c; }
      .tp-anno-vert .tp-anno-text.vert { position: absolute; top: 40%; white-space: nowrap; transform: rotate(-90deg); transform-origin: left top; }
      .tp-anno-vert.left .tp-anno-text.vert { left: -4px; }
      .tp-anno-vert.right .tp-anno-text.vert { left: 10px; }
      .tp-anno-caption { text-align: center; font-size: 0.66rem; color: #999; margin-top: 0.55rem; direction: ltr; }

      /* زوج المنظرين + خطوط القياس العابرة لجسم القطعة */
      .tp-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; direction: ltr; }
      @media (max-width: 600px) { .tp-pair { grid-template-columns: 1fr; } }
      .tp-view { min-width: 0; }
      .tp-view > img { width: 100%; display: block; border-radius: 4px; }
      .tp-view-cap { text-align: center; font-size: 0.64rem; font-weight: 800; letter-spacing: 1.5px; color: #555; margin-top: 0.4rem; direction: ltr; }
      .tp-m-wrap { position: absolute; display: flex; flex-direction: column; align-items: center; }
      .tp-m-line { display: block; width: 100%; border-top: 1.5px solid #a3271c; position: relative; }
      .tp-m-line:before, .tp-m-line:after { content: ''; position: absolute; top: -4px; border-top: 3.5px solid transparent; border-bottom: 3.5px solid transparent; }
      .tp-m-line:before { left: 0; border-right: 6px solid #a3271c; }
      .tp-m-line:after { right: 0; border-left: 6px solid #a3271c; }
      .tp-m-label { font-size: 0.5rem; font-weight: 800; color: #a3271c; letter-spacing: 0.3px; text-transform: uppercase; background: rgba(255,255,255,0.85); padding: 0 3px; border-radius: 2px; line-height: 1.2; margin-bottom: 1px; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
      .tp-m-label.vert { position: absolute; top: 45%; left: 4px; transform: rotate(-90deg); transform-origin: left top; margin: 0; }

      /* لقطات التفاصيل المقصوصة من الصورة المرجعية */
      .tp-crops { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; direction: ltr; }
      @media (max-width: 600px) { .tp-crops { grid-template-columns: repeat(2, 1fr); } }
      .tp-crop { border: 1px solid #e5e5e5; border-radius: 6px; overflow: hidden; background: #fff; }
      .tp-crop-img { width: 100%; aspect-ratio: 1; background-size: 340%; background-repeat: no-repeat; }
      .tp-crop-cap { text-align: center; font-size: 0.62rem; font-weight: 700; color: #333; padding: 0.35rem 0.3rem; direction: ltr; border-top: 1px solid #eee; }

      /* الجداول */
      .tp-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; direction: ltr; }
      .tp-table th { background: #f4f4f4; color: #111; padding: 0.55rem 0.6rem; text-align: center; font-weight: 700; border: 1px solid #e2e2e2; font-size: 0.7rem; letter-spacing: 0.5px; }
      .tp-table th.left-h { text-align: left; }
      .tp-table th.ltr, .tp-table td.ltr { direction: ltr; }
      .tp-table td { padding: 0.5rem 0.6rem; text-align: center; border: 1px solid #e8e8e8; color: #222; }
      .tp-table td.left { text-align: left; }
      .tp-table td.sm { font-size: 0.74rem; color: #555; }
      .tp-table .hl { background: #eef2f0; font-weight: 700; }
      .ref-code { font-weight: 700; color: var(--gold-deep); background: #faf8f3; font-family: 'Cormorant Garamond', serif; }
      .tp-grade td.left { line-height: 1.45; }
      .tp-grade-note { text-align: center; font-size: 0.68rem; color: #999; margin-top: 0.6rem; direction: ltr; }
      .tp-bom td { vertical-align: top; }

      /* بطاقات الخامات — بطاقة لكل خامة كما في النموذج */
      .tp-matcards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.9rem; direction: ltr; }
      @media (max-width: 900px) { .tp-matcards { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 500px) { .tp-matcards { grid-template-columns: 1fr; } }
      .tp-matcard { border: 1px solid #e5e5e5; border-radius: 6px; overflow: hidden; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
      .tp-matcard img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
      .tp-matcard-ph { width: 100%; aspect-ratio: 1; background: #f0f0f0; }
      .tp-matcard-body { padding: 0.6rem; text-align: left; }
      .tp-matcard-name { font-weight: 700; font-size: 0.74rem; color: #111; }
      .tp-matcard-place { font-size: 0.63rem; color: #1a6fc4; margin: 2px 0 3px; line-height: 1.35; }
      .tp-matcard-desc { font-size: 0.62rem; color: #777; line-height: 1.45; }

      /* الألوان والبانتون */
      .tp-colorways { display: grid; grid-template-columns: 1.1fr 1fr; gap: 1.5rem; align-items: start; }
      @media (max-width: 700px) { .tp-colorways { grid-template-columns: 1fr; } }
      .tp-pantone-title { font-weight: 700; font-size: 0.82rem; direction: ltr; text-align: left; margin-bottom: 0.6rem; color: #111; }
      .tp-pantone-row { display: flex; gap: 0.7rem; align-items: center; padding: 0.55rem 0; border-bottom: 1px solid #eee; direction: ltr; }
      .tp-pantone-row:last-child { border-bottom: none; }
      .tp-pantone-sw { width: 36px; height: 36px; border-radius: 4px; border: 1px solid #e2e2e2; flex-shrink: 0; }
      .tp-pantone-part { font-size: 0.76rem; font-weight: 700; color: #111; text-align: left; }
      .tp-pantone-code { font-size: 0.66rem; color: #888; text-align: left; }

      /* دليل البناء */
      .tp-gi-head { font-weight: 700; font-size: 0.82rem; color: #111; direction: ltr; text-align: left; padding-bottom: 0.4rem; border-bottom: 1px solid #eee; margin-bottom: 0.8rem; }
      .tp-gi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; direction: ltr; text-align: left; margin-bottom: 1.6rem; }
      @media (max-width: 700px) { .tp-gi { grid-template-columns: 1fr; } }
      .tp-gi div { font-size: 0.74rem; color: #333; line-height: 1.55; }
      .tp-gi b { color: #999; font-weight: 700; }

      /* تعليمات الخياطة */
      .tp-steps { padding-left: 0; list-style: none; counter-reset: step; direction: ltr; }
      .tp-steps li { counter-increment: step; padding: 0.5rem 0; border-bottom: 1px solid #eee; color: #333; font-size: 0.8rem; text-align: left; position: relative; padding-left: 2rem; line-height: 1.55; }
      .tp-steps li:before { content: counter(step); position: absolute; left: 0; color: var(--gold-deep); font-family: 'Cormorant Garamond', serif; font-weight: 700; }
      .tp-foot { text-align: center; margin-top: 1rem; padding-top: 1.2rem; border-top: 1px solid #ddd; color: var(--gold); font-family: 'Cormorant Garamond', serif; letter-spacing: 2px; }

      /* النافذة */
      .modal-overlay { position: fixed; inset: 0; background: rgba(44,38,32,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
      .modal { background: var(--ivory); border-radius: 12px; padding: 2.5rem; max-width: 900px; width: 100%; max-height: 92vh; overflow-y: auto; position: relative; }
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
      .pricing-card { background: var(--ivory); border-radius: 10px; padding: 2rem; text-align: center; border: 1px solid var(--line); position: relative; }
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

      .footer { text-align: center; padding: 2rem; color: var(--ink-soft); font-family: 'Cormorant Garamond', serif; letter-spacing: 2px; border-top: 1px solid var(--line); }

      /* ===== موبايل: السايدبار ينزلق ===== */
      @media (max-width: 900px) {
        .sidebar { transform: translateX(100%); transition: transform .25s ease; box-shadow: -8px 0 40px rgba(0,0,0,0.15); }
        .sidebar.open { transform: translateX(0); }
        .main-area { margin-right: 0; }
        .menu-btn { display: block; }
        .sb-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 150; }
        .content { padding: 1.2rem; }
        .tp { padding: 1.4rem; }
      }
    `}</style>
  );
}
