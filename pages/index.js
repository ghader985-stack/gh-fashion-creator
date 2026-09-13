import { useState, useEffect, createContext, useContext } from 'react';
import Head from 'next/head';


// استخراج اسم البراند من نص الملاحظات الحر.
// تُقبل الصيغ الشائعة بالعربية والإنجليزية؛ وإن لم تُذكر صيغة صريحة
// ولم يكن النص طويلاً، يُؤخذ السطر الأول كاسم. لا يُخترع اسم أبداً.
function extractBrandName(notes) {
  const t = String(notes || '').trim();
  if (!t) return '';
  const pats = [
    /(?:اسم\s*ال?(?:براند|ماركة|العلامة)|البراند|الماركة)\s*[:：\-–]?\s*([^\n،,.|]{2,60})/i,
    /(?:brand\s*name|brand|label|maison)\s*[:：\-–]\s*([^\n,.|]{2,60})/i,
  ];
  for (const re of pats) {
    const m = re.exec(t);
    if (m && m[1] && m[1].trim()) return m[1].trim();
  }
  const first = t.split(/\n/)[0].trim();
  if (first && first.length <= 40 && !/\s{2,}/.test(first) && first.split(/\s+/).length <= 5) return first;
  return '';
}

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

  // ===== فلات سكتش (الرسمة التقنية) =====
  // قسم مستقل: المصممة تولّد رسمتها هنا وتعتمدها، ثم تُستخدم في التيك باك.
  // الاعتماد شرط — التيك باك لا يبني صفحات القياسات والكول أوت على رسمة
  // لم تُعتمَد، فلا تذهب توليدة كاملة على رسمة غلط.
  const [flatImage, setFlatImage] = useState(null);
  const [flatPreview, setFlatPreview] = useState('');
  const [flatDesc, setFlatDesc] = useState('');
  const [flatLoading, setFlatLoading] = useState(false);
  const [flatError, setFlatError] = useState('');
  const [flatFront, setFlatFront] = useState('');      // خطي أمامي
  const [flatBack, setFlatBack] = useState('');        // خطي خلفي
  const [flatColorFront, setFlatColorFront] = useState('');  // ملوّن أمامي
  const [flatColorBack, setFlatColorBack] = useState('');    // ملوّن خلفي
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
        { id: 'flat', name: 'فلات سكتش (الرسمة التقنية)', num: '03', desc: 'رسمة تقنية بالأبيض والأسود' },
        { id: 'techpack', name: 'التيك باك', num: '04', desc: 'الحزمة التقنية' },
      ],
    },
    {
      label: 'التسويق',
      items: [
        { id: 'marketing', name: 'المحتوى التسويقي', num: '05', desc: 'كابشنات وأفكار' },
        { id: 'video', name: 'الفيديو', num: '06', desc: 'برومبتات سينمائية' },
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

  // ===== توليد الفلات سكتش =====
  const handleFlat = async () => {
    if (!gate()) return;
    if (!flatImage) { setFlatError('ارفعي صورة التصميم أولاً'); return; }
    setFlatLoading(true); setFlatError('');
    setFlatFront(''); setFlatBack(''); setFlatColorFront(''); setFlatColorBack('');
    try {
      const fd = new FormData();
      fd.append('image', flatImage);
      fd.append('flatOnly', '1');
      fd.append('meta', JSON.stringify({
        garmentFacts: flatDesc,
        flatSketchBrief: flatDesc,
        pieceCount: 1,
      }));
      const r = await fetch('/api/techpack-images', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.error) { setFlatError(d.error); setFlatLoading(false); return; }
      if (!d.lineFrontImage && !d.coloredFrontImage) {
        setFlatError('لم تُنتَج أي رسمة — حاولي مرة ثانية'); setFlatLoading(false); return;
      }
      setFlatFront(d.lineFrontImage || '');
      setFlatBack(d.lineBackImage || '');
      setFlatColorFront(d.coloredFrontImage || '');
      setFlatColorBack(d.coloredBackImage || '');
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[gh]', e && e.message);
      setFlatError('خطأ في الاتصال، حاولي مرة ثانية');
    }
    setFlatLoading(false);
  };

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
      // اسم البراند يُستخرج من ملاحظات العميلة. إن لم تذكره يبقى فارغاً
      // فيُكتب BRAND NAME كموضع تملؤه، ولا يُوضع اسم المنصّة مكانه.
      fd.append('brandName', extractBrandName(tpNotes));
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
        // الرسمات المولّدة في قسم الفلات سكتش تُستخدم كما هي ولا يُعاد توليدها
        if (flatFront) {
          fd2.append('approvedFront', flatFront);
          fd2.append('approvedBack', flatBack || '');
        }
        if (flatColorFront) {
          fd2.append('approvedColorFront', flatColorFront);
          fd2.append('approvedColorBack', flatColorBack || '');
        }
        fd2.append('meta', JSON.stringify({
          garmentFacts: d.garmentFacts || '',
          flatSketchBrief: d.flatSketchBrief || '',
          pieceCount: d.pieceCount || 1,
          specSheetLabels: d.specSheetLabels || {},
          calloutMap: d.calloutMap || [],
          sewingDetailLabels: d.sewingDetailLabels || [],
          colorway: d.colorway || [],
          detailAreas: (d.detailViews || []).map((x) => x.area),
          materials: (d.materials || []).map((m) => ({
            name: m.name, pantone: m.pantone, hex: m.hex, photoPrompt: m.photoPrompt,
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

  // التصدير كـ PDF نصّي لا كصورة.
  // html2canvas كان يحوّل التيك باك كلّه إلى PNG واحد: كل النصوص تصير بكسلات،
  // فلا بحث ولا نسخ ولا طباعة نظيفة، والمصنع لا يستطيع أخذ رقم من جدول القياسات.
  // طباعة المتصفح تُخرج PDF متجهاً: النص يبقى نصاً وكل صفحة على ورقة مستقلة.
  const downloadTechpack = async () => {
    setTpDownloading(true);
    try {
      const title = (techpack?.garmentName || 'techpack').replace(/\s+/g, '-');
      const prev = document.title;
      document.title = title;              // اسم الملف المقترح في حوار الطباعة
      document.body.classList.add('printing-techpack');
      // مهلة إطار واحد حتى تُطبَّق أنماط الطباعة قبل فتح الحوار
      await new Promise((r) => setTimeout(r, 120));
      window.print();
      document.body.classList.remove('printing-techpack');
      document.title = prev;
    } catch { alert('تعذّر فتح نافذة الحفظ، جرّبي مرة ثانية'); }
    setTpDownloading(false);
  };

  // حفظ نسخة صورة للمعاينة السريعة — يبقى متاحاً كخيار ثانوي
  const downloadTechpackImage = async () => {
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
            {activeTab === 'flat' && (
              <div className="panel">
                <div className="panel-head">
                  <h2>فلات سكتش (الرسمة التقنية)</h2>
                  <p>ارفعي تصميمك واحصلي على رسمة تقنية بالأبيض والأسود — أمامية وخلفية. اعتمديها ثم انتقلي للتيك باك.</p>
                </div>

                <div className="field">
                  <label>صورة التصميم</label>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) return;
                    setFlatImage(f);
                    setFlatPreview(URL.createObjectURL(f));
                    setFlatFront(''); setFlatBack(''); setFlatColorFront(''); setFlatColorBack('');
                  }} />
                  {flatPreview && <div className="img-preview"><img src={flatPreview} alt="preview" /></div>}
                </div>

                <div className="field">
                  <label>تفاصيل تُثبَّت في الرسمة (اختياري)</label>
                  <textarea value={flatDesc} onChange={(e) => setFlatDesc(e.target.value)}
                    placeholder="مثال: ياقة فانل عالية، أكمام بيشوب، بلا حزام، سحاب خلفي مخفي. اكتبي ما يجب ألّا يتغيّر."></textarea>
                </div>

                <button onClick={handleFlat} disabled={flatLoading} className="primary-btn">
                  {flatLoading ? <><span className="spinner"></span> جاري التوليد...</> : 'توليد الرسمة التقنية'}
                </button>
                {flatError && <div className="err">{flatError}</div>}

                {(flatFront || flatColorFront) && (
                  <div className="flat-result" id="flat-result-area">

                    <div className="flat-group-title">الرسمة الملوّنة</div>
                    <div className="flat-pair">
                      <div className="flat-view">
                        {flatColorFront
                          ? <img src={proxied(flatColorFront)} alt="colored front" crossOrigin="anonymous" />
                          : <div className="tp-img-ph tp-img-miss" style={{ aspectRatio: '2/3' }}><span>تعذّر التوليد</span></div>}
                        <div className="flat-cap">FRONT</div>
                      </div>
                      <div className="flat-view">
                        {flatColorBack
                          ? <img src={proxied(flatColorBack)} alt="colored back" crossOrigin="anonymous" />
                          : <div className="tp-img-ph tp-img-miss" style={{ aspectRatio: '2/3' }}><span>تعذّر التوليد</span></div>}
                        <div className="flat-cap">BACK</div>
                      </div>
                    </div>

                    <div className="flat-group-title">الرسمة التقنية — أبيض وأسود</div>
                    <div className="flat-pair">
                      <div className="flat-view">
                        {flatFront
                          ? <img src={proxied(flatFront)} alt="line front" crossOrigin="anonymous" />
                          : <div className="tp-img-ph tp-img-miss" style={{ aspectRatio: '2/3' }}><span>تعذّر التوليد</span></div>}
                        <div className="flat-cap">FRONT</div>
                      </div>
                      <div className="flat-view">
                        {flatBack
                          ? <img src={proxied(flatBack)} alt="line back" crossOrigin="anonymous" />
                          : <div className="tp-img-ph tp-img-miss" style={{ aspectRatio: '2/3' }}><span>تعذّر التوليد</span></div>}
                        <div className="flat-cap">BACK</div>
                      </div>
                    </div>

                    <div className="flat-actions">
                      <button onClick={handleFlat} disabled={flatLoading} className="download-btn secondary">
                        إعادة التوليد
                      </button>
                      <button onClick={() => downloadNode('flat-result-area', 'flat-sketch.png', '#ffffff')}
                        disabled={flatLoading} className="download-btn secondary">
                        حفظ الرسمات
                      </button>
                    </div>
                    <div className="tp-save-hint">
                      هذه الرسمات جاهزة للتيك باك: التقنية تُستخدم في صفحات القياسات والكول أوت والخياطة،
                      والملوّنة في الكولورويز. انتقلي لقسم التيك باك مباشرةً.
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'techpack' && !flatFront && (
              <div className="tp-audit">
                لم تولّدي رسمة تقنية بعد. يمكنك المتابعة وستُولَّد تلقائياً،
                أو الرجوع لقسم <strong>فلات سكتش (الرسمة التقنية)</strong> لتوليدها ومعاينتها أولاً —
                عندها تُبنى صفحات القياسات والكول أوت والخياطة على رسمة رأيتِها بعينك.
              </div>
            )}
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
                      <input type="text" value={tpNotes} onChange={(e) => setTpNotes(e.target.value)} placeholder="اسم البراند، وأي تفاصيل خاصة" />
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
                        {tpDownloading ? <><span className="spinner"></span> جاري التجهيز...</> : 'حفظ PDF'}
                      </button>
                      <button onClick={downloadTechpackImage} disabled={tpDownloading} className="download-btn secondary">
                        حفظ كصورة
                      </button>
                    </div>
                    <div className="tp-save-hint">
                      حفظ PDF: النص يبقى نصاً — قابل للبحث والنسخ والطباعة بأي مقاس.
                      في نافذة الطباعة اختاري «حفظ كـ PDF».
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
// كل صور Replicate تُعرض عبر وسيط بنفس النطاق: يضمن قراءة البكسلات على كانفاس
// (اشتقاق الرسمة الخطية وكشف حدود القطعة) ويضمن نجاح حفظ التيك باك كصورة.
function proxied(url) {
  if (!url || typeof url !== 'string') return url;
  if (!/^https:\/\/([a-z0-9-]+\.)*(replicate\.delivery|api\.replicate\.com)\//i.test(url)) return url;
  return '/api/img?u=' + encodeURIComponent(url);
}

const GRADE_SIZES = ['2', '4', '6', '8', '10', '12'];
// عدد صفوف القياس في الصفحة الواحدة. الجدول يُقسَّم على عدد الصفحات الذي
// يلزمه فعلاً، لا على صفحتين فقط: قطعة بأربعين قياساً كانت تحشر خمسة
// وعشرين صفاً في صفحة واحدة.
const GRADE_SPLIT = 15;


// ===========================================================================
// فحص سلامة البيانات قبل بناء الصفحات.
// الغرض: ألّا يُعرض تيك باك يبدو سليماً وهو ناقص. كل خلل يُذكر صراحةً
// بدل أن يُملأ مكانه بقيمة مخترعة.
// ===========================================================================
function auditTechpack(tp, materials, measurements) {
  const issues = [];
  const rows = Array.isArray(measurements) ? measurements : [];

  if (!rows.length) issues.push('جدول القياسات فارغ — مواقع الليبلات ستكون تقريبية');
  else {
    const noSizes = rows.filter((r) => !r || !r.sizes || !Object.keys(r.sizes).length).length;
    if (noSizes) issues.push(noSizes + ' من صفوف القياس بلا أرقام مقاسات');
    const sample = tp.sampleSize || '6';
    const noSample = rows.filter((r) => r && r.sizes && (r.sizes[String(sample)] === undefined)).length;
    if (noSample) issues.push(noSample + ' صف قياس بلا قيمة لمقاس العيّنة ' + sample);
    if (!buildAnchors(rows, sample, 'front')) {
      issues.push('تعذّر إيجاد طول مرجعي للقطعة — لا قياس طول كامل في الجدول');
    }
  }

  if (!materials.length) issues.push('قائمة الخامات فارغة');
  else {
    const noQty = materials.filter((m) => m.qty === '' || m.qty == null).length;
    if (noQty) issues.push(noQty + ' خامة بلا كمية');
    const noPlace = materials.filter((m) => !m.placement).length;
    if (noPlace) issues.push(noPlace + ' خامة بلا موضع');
  }

  if (!tp.lineFrontImage) issues.push('الرسمة التقنية الأمامية غير متوفّرة');
  if (!tp.lineBackImage) issues.push('الرسمة التقنية الخلفية غير متوفّرة');

  const photos = Array.isArray(tp.materialPhotos) ? tp.materialPhotos.filter(Boolean).length : 0;
  if (materials.length && photos < materials.length) {
    issues.push((materials.length - photos) + ' خامة بلا صورة');
  }

  const steps = Array.isArray(tp.sewingSteps) ? tp.sewingSteps.length : 0;
  if (steps && steps < 8) issues.push('تعليمات الخياطة ' + steps + ' خطوة فقط');

  return issues;
}

function TechpackView({ tp, preview }) {
  const meta = {
    styleCode: tp.styleCode,
    garmentName: tp.garmentName,
    season: tp.season,
    sampleSize: tp.sampleSize || '6',
    sizeRange: tp.sizeRange || '2 - 12',
    category: tp.category,
    fabricSummary: tp.fabricSummary || '',
    brandName: tp.brandName || 'BRAND NAME',   // موضع تملؤه العميلة
    version: 'v0',
    date: (tp.generatedAt || '').slice(0, 10),
    preview,
  };

  // القائمة تمرّ بالتصحيح الحتمي قبل العرض: دمج المكرّر، إضافة ما رآه التحليل
  // في التصميم (خرز/لؤلؤ/دانتيل)، إلزام التاغين، ترتيب وظيفي، ثم ترقيم.
  const designCues = [tp.description, tp.garmentFacts, tp.flatSketchBrief, tp.notes,
    (tp.artwork || []).map((a) => [a.name, a.technique, a.description].join(' ')).join(' ')];
  const materials = normalizeMaterials(tp.materials, designCues, (tp.colorway || [])[0]?.hex, (tp.colorway || [])[0]?.pantone);
  const matPhotos = tp.materialPhotos || [];
  const measurements = tp.measurements || [];
  const gradePages = [];
  for (let i = 0; i < measurements.length; i += GRADE_SPLIT) {
    gradePages.push(measurements.slice(i, i + GRADE_SPLIT));
  }
  if (gradePages.length === 0) gradePages.push([]);
  // الخامات تُقسَّم إلى صفحات من ثمانية حسب عددها الفعلي — لا صفحة فارغة
  // إن كانت ثمانية أو أقل، ولا تكدّس إن زادت عن ستّ عشرة.
  const MAT_PER_PAGE = 8;
  const matPages = [];
  for (let i = 0; i < materials.length; i += MAT_PER_PAGE) {
    matPages.push({ items: materials.slice(i, i + MAT_PER_PAGE), offset: i });
  }
  // أكواد الألوان تُسحب من بكسلات التصميم الملوّن؛ أسماء الأجزاء تبقى من التحليل
  const extractedColors = useExtractedColors(preview || proxied(tp.coloredFrontImage), 6);
  const colorway = mergeColorway(tp.colorway || [], extractedColors);
  const specLabels = tp.specSheetLabels || {};
  const calloutMap = pruneCallouts(tp.calloutMap, materials);
  const auditIssues = auditTechpack(tp, materials, measurements);
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
            ? <img src={proxied(matPhotos[offset + i])} alt={m.name} crossOrigin="anonymous" />
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
    <div className="tp-spec-frame">
      <div className="tp-spec-title">GARMENT SPEC SHEET — {(tp.garmentName || '').toUpperCase()}</div>
      <div className="tp-spec-key">Garment Details: <b>BLACK</b>; <span className="red">Measurement Lines and Labels: RED</span></div>
      <AnnotatedPair measurements={measurements} sampleSize={meta.sampleSize} frontImage={proxied(tp.lineFrontImage)} backImage={proxied(tp.lineBackImage)} mode="measure"
        front={specLabels.front || []} back={specLabels.back || []} />
    </div>
  )]);

  gradePages.forEach((rows, i) => {
    const more = i < gradePages.length - 1;
    pages.push([i === 0 ? 'SIZE GRADING CHART' : 'SIZE GRADING CHART (CONTINUED)', gradeTable(rows, more)]);
  });

  matPages.forEach((pg, i) => {
    pages.push([i === 0 ? 'MATERIALS' : 'MATERIALS (CONTINUED)', matCards(pg.items, pg.offset)]);
  });

  pages.push(['MATERIALS CALLOUT', (
    <AnnotatedPair measurements={measurements} sampleSize={meta.sampleSize} frontImage={proxied(tp.lineFrontImage)} backImage={proxied(tp.lineBackImage)} mode="callout"
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
    <AnnotatedPair measurements={measurements} sampleSize={meta.sampleSize} frontImage={proxied(tp.lineFrontImage)} backImage={proxied(tp.lineBackImage)} mode="sewing"
      front={sewLabels.filter((s) => (s.view || 'front') !== 'back')}
      back={sewLabels.filter((s) => s.view === 'back')} />
  )]);

  pages.push(['COLORWAYS & PANTONE', (
    <div className="tp-colorways">
      <div className="tp-img-frame">
        <div className="tp-pair">
          <div className="tp-view">{(tp.coloredFrontImage || tp.lineFrontImage) ? <img src={proxied(tp.coloredFrontImage || tp.lineFrontImage)} alt="front colorway" crossOrigin="anonymous" /> : <div className="tp-img-ph" style={{ aspectRatio: '2/3' }}></div>}<div className="tp-view-cap">FRONT</div></div>
          <div className="tp-view">{(tp.coloredBackImage || tp.lineBackImage) ? <img src={proxied(tp.coloredBackImage || tp.lineBackImage)} alt="back colorway" crossOrigin="anonymous" /> : <div className="tp-img-ph" style={{ aspectRatio: '2/3' }}></div>}<div className="tp-view-cap">BACK</div></div>
        </div>
      </div>
      <div>
        <div className="tp-pantone-title">Pantone Color Palette</div>
        {colorway.map((c, i) => (
          <div className="tp-pantone-row" key={i}>
            <div className="tp-pantone-sw" style={{ background: c.hex }}></div>
            <div>
              <div className="tp-pantone-part">{c.part}</div>
              <div className="tp-pantone-code">
                {c.pantone}{c.pantoneName ? ' ' + c.pantoneName : ''} · {c.hex}
                {c.deltaE > 5 ? <span className="tp-pantone-warn"> · approx. ΔE {c.deltaE}</span> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )]);

  pages.push(['DETAILED VIEWS', (
    <>
      <RefCrops image={preview} areas={detailViews.map((d) => d.area)} anchors={buildAnchors(measurements, meta.sampleSize, 'front')} />
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
        <thead><tr><th className="ltr left-h">ELEMENT</th><th className="ltr left-h">PLACEMENT</th><th className="ltr left-h">SIZE</th><th className="ltr left-h">TECHNIQUE</th><th className="ltr left-h">NOTES</th></tr></thead>
        <tbody>
          {artwork.map((a, i) => (
            <tr key={i}>
              <td className="left ltr"><b>{a.name}</b></td>
              <td className="left ltr sm">{a.placement}</td>
              <td className="left ltr sm">{a.size}</td>
              <td className="left ltr sm">{a.technique}</td>
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
      <div className="tp-gi-head">Construction &amp; Trim Details <span className="tp-count">{construction.length} items</span></div>
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
      <div className="tp-gi-head">Sewing Instructions <span className="tp-count">{sewingSteps.length} instructions</span></div>
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
      {auditIssues.length > 0 && (
        <div className="tp-audit">
          <strong>تنبيه — نواقص في هذا التيك باك:</strong>
          <ul>{auditIssues.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      )}
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
      } catch (e) { if (typeof console !== "undefined") console.warn("[gh]", e && e.message); if (!cancelled) setBox(null); }
    };
    img.onerror = () => { if (!cancelled) setBox(null); };
    img.src = image;
    return () => { cancelled = true; };
  }, [image]);
  return box;
}


// ===========================================================================
// ألوان الكولورويز تُسحب من بكسلات صورة التصميم، لا من وصف النموذج.
// تمرّ الصورة عبر /api/img لأن قراءة البكسلات من نطاق آخر تفشل بلا وسيط.
// ===========================================================================

// ===========================================================================
// جدول بانتون TCX/TPG — مجموعة الأزياء والمفروشات، 2310 لوناً.
// الأكواد والقيم من المصدر العام؛ الأسماء ملك Pantone.
// الغرض: تحويل كود hex المسحوب من البكسل إلى أقرب كود بانتون حقيقي،
// بدل ترك النموذج يخمّن كوداً قد يبعد ΔE 12 عن اللون الفعلي.
// الصيغة مضغوطة: code:HEX:name مفصولة بـ |
// ===========================================================================
const PANTONE_TCX_RAW = '11-0103:F3ECE0:egret|11-0602:F2F0EB:snow-white|11-0601:F4F5F0:bright-white|11-4201:F0EEE9:cloud-dancer|11-0604:F1E8DF:gardenia|11-4300:F0EEE4:marshmallow|11-4800:E7E9E7:blanc-de-blanc|11-0606:F2E8DA:pristine|11-0701:EDE6DB:whisper-white|12-0104:E1DBC8:white-asparagus|13-0905:DDD5C7:birch|12-5202:DED7C8:turtledove|12-0105:D7D0C0:bone-white|13-4403:D2CFC4:silver-birch|11-0104:F0EADA:vanilla-ice|11-0107:F5EDD6:papyrus|11-0105:EDE3D2:antique-white|11-0507:F5ECD2:winter-white|12-0804:E6DDC5:cloud-cream|12-0605:DFD1BB:angora|12-0703:E6DAC4:seedpearl|12-0815:F3E0BE:vanilla-custard|12-0713:F4EFC1:almond-oil|12-0812:F0DEBD:alabaster-gleam|12-0712:F4E1C1:vanilla|12-0806:ECDDBE:rutabaga|13-0815:E7D3AD:banana-crepe|13-0917:E7D1A1:italian-straw|12-0304:E0D5C6:whitecap-gray|13-0607:D0C5B1:fog|12-0000:E4D7C5:white-swan|13-0907:D8CCBB:sandshell|12-1403:DCCDBC:tapioca|13-1006:DBCCB5:creme-brulee|13-0908:DFD1BE:parchment|12-1106:F6E5DB:sheer-pink|12-1108:EEDED1:dew|11-1404:F3E0D6:powder-puff|11-0907:F0DFCC:pearled-ivory|12-0704:EDDCC9:white-smoke|11-0809:F3DFCA:ecru|12-0710:EFDCC3:navajo|12-2103:E7DCD9:almost-mauve|11-2409:F5E3E2:delicacy|11-2309:F2E2E0:petal-pink|11-1005:EEE2DD:bridal-blush|11-1306:F6E4D9:cream-pink|11-1305:F3DFD7:angel-wing|11-0603:E5D9D3:pastel-parchment|11-4202:EFEFE8:star-white|11-4301:E2E2DA:lily-white|12-4302:DFDDD7:vaporous-gray|11-4802:E5EBE3:summer-shower|11-4803:E0E4D9:ice|12-6207:DDE2D6:frost|12-5201:DADCD0:icicle|11-4601:E2EAEB:bit-of-blue|11-4303:E1E3DE:mystic-blue|12-4304:E2E6E0:bluewash|12-4305:D3DEDF:spa-blue|11-4804:E4EADF:lightest-sky|11-4805:D8E8E6:hint-of-mint|12-5203:D2D8D2:murmur|12-4306:DDE0DF:barely-blue|12-4705:D6DBD9:blue-blush|12-5603:D3D9D1:zephyr-blue|12-5403:D0D9D4:blue-flower|12-5303:CBD7D2:sprout-green|11-4604:D8E7E7:billowing-sail|12-5508:D8E9E5:hushed-green|12-0910:E5D0B1:lambs-wool|14-1119:DFC09F:winter-wheat|13-0814:EAD3AE:summer-melon|13-0916:E8D0A7:chamomile|12-0714:F2D6AE:cornhusk|12-0817:F5D7AF:apricot-gelato|13-1009:DAC7AB:biscotti|12-0311:D2CDB4:asparagus-green|13-1007:D2CAAF:oyster-white|13-0711:D4CAB0:putty|13-0611:D2CBAF:moth|14-1108:D7CAB0:wood-ash|14-1014:CBBFA2:gravel|15-1216:BFAF92:pale-khaki|12-0404:DAD8C9:light-gray|12-6204:D7D7C7:silver-green|14-6305:C1BCAC:pelican|14-0105:C3BDAB:overcast|14-0210:BFB9A3:tidal-foam|15-6307:B1B09F:agate-gray|14-6308:B7B59F:alfalfa|14-0108:C8C1AB:castle-wall|14-1107:CBC1AE:oyster-gray|14-0708:C4B6A6:cement|15-0309:AEA692:spray-green|15-0513:B1A992:eucalyptus|16-1108:A79B82:twill|16-1110:A6997A:olive-gray|17-1109:9C8E7B:chinchilla|17-1107:9A927F:seneca-rock|17-0610:918C7E:laurel-oak|17-1113:938772:coriander|17-1009:998978:dune|17-1118:8A7963:lead-gray|18-0617:80765F:covert-green|15-1306:B8A99A:oxford-tan|16-1105:AEA393:plaza-taupe|16-1106:A59788:tuffet|17-1312:9F8D7C:silver-mink|17-1310:8D8070:timber-wolf|17-0808:8E7C71:taupe-gray|17-1410:827064:pine-bark|14-0002:CAC2B9:pumice-stone|16-0906:AD9F93:simply-taupe|16-1107:9F9586:aluminum|16-1407:A89A8E:cobblestone|18-1110:82776B:brindle|18-1112:776A5F:walnut|18-0513:696156:bungee-cord|13-0401:CBC3B4:oatmeal|13-0000:CDC6BD:moonbeam|13-5304:CFC8BD:rainy-day|13-0403:CABEB5:gray-morn|14-1106:C5BBAE:peyote|15-1305:B8AD9E:feather-gray|16-0806:A89A91:goat|13-0002:DBD5D1:white-sand|14-0000:C1B7B0:silver-gray|15-4503:BBB1A8:chateau-gray|16-1305:AA9F96:string|16-1406:A89C94:atmosphere|17-1210:958B84:moon-rock|17-1212:8F8177:fungi|14-4501:BDB6AB:silver-lining|14-4500:C2BEB6:moonstruck|15-6304:AEACA1:pussywillow-gray|16-0207:A29E92:london-fog|17-0207:918C86:rock-ridge|18-4105:80817D:moon-mist|18-0510:646762:castor-gray|14-4102:C5C6C7:glacier-gray|14-4201:C5C5C5:lunar-rock|13-4303:CACCCB:dawn-blue|14-4103:BBBCBC:gray-violet|14-4203:BEBDBD:vapor-blue|15-4101:AEB2B5:high-rise|16-4702:989A98:limestone|15-4502:BEB7B0:silver-cloud|15-0000:B3ADA7:dove|16-5803:A09C98:flint-gray|16-4402:A09F9C:drizzle|17-0205:8F8982:elephant-skin|17-1506:8A7E78:cinder|17-1500:827E7C:steeple-gray|14-4503:BABFBC:metal|14-4804:B9BCB6:blue-fox|15-4003:B5BAB6:storm-gray|15-4704:A9AFAA:pigeon|15-4703:ABAFAE:mirage-gray|15-4702:A8B0AE:puritan-gray|16-5904:999E98:wrought-iron|16-3801:A49E9E:opal-gray|17-1501:8B8C89:wild-dove|17-4402:8E918F:neutral-gray|18-0503:686767:gargoyle|18-0000:656466:smoked-pearl|18-5105:686D6C:sedona-sage|18-0306:5C5D5B:gunmetal|14-4002:CAC5C2:wind-chime|16-0000:9F9C99:paloma|18-0601:6C6868:charcoal-gray|18-4005:726F70:steel-gray|18-5203:666564:pewter|18-0201:5F5E62:castlerock|19-3908:46434A:nine-iron|16-3802:A09998:ash|17-1502:837F7F:cloudburst|17-0000:848283:frost-gray|18-3905:676168:excalibur|18-0403:625D5D:dark-gull-gray|19-3905:5F575C:rabbit|19-3903:4A3F41:shale|17-0909:806F63:fossil|19-0810:5B5149:major-brown|19-0809:685A4E:chocolate-chip|19-0820:5E5347:canteen|18-0615:685E4F:stone-gray|18-0820:695E4B:capers|19-0618:5B4F3B:beech|19-0822:5A5348:tarmac|19-0614:4A4139:wren|19-0608:48413B:black-olive|19-0405:4A4843:beluga|19-0506:44413C:black-ink|19-0508:3B3A36:peat|19-5708:262C2A:jet-set|18-1306:736460:iron|19-3803:625B5C:plum-kitten|19-0812:483F39:turkish-coffee|19-1111:3B302F:black-coffee|19-1101:3C3535:after-dark|19-1102:3A3536:licorice|19-0000:413E3D:raven|19-0303:2D2C2F:jet-black|19-4205:39373B:phantom|19-4005:2B2C30:stretch-limo|19-4203:2F2D30:moonless-night|19-4006:292A2D:caviar|19-4305:363838:pirate-black|19-4007:28282D:anthracite|12-1009:F4D8C6:vanilla-cream|12-0811:EBD2B7:dawn|13-1010:E5CCAF:gray-sand|12-0813:EED0AE:autumn-blonde|14-1120:E2C4A6:apricot-illusion|13-1014:D8B998:mellow-buff|14-1122:DAB58F:sheepskin|14-1116:CCB390:almond-buff|14-1118:D5BA98:beige|15-1225:CCA67F:sand|15-1220:C5A582:latte|16-1334:B69574:tan|16-1333:B98E68:doe|17-1328:AD8567:indian-tan|15-1116:BAAA91:safari|15-1213:BFA387:candied-ginger|15-1214:C5AE91:warm-sand|15-1314:C1A68D:cuban-sand|16-1320:B69885:nougat|16-1310:AA907D:natural|16-1212:B49F89:nomad|13-0513:D8CFB2:frozen-dew|13-1008:DACCB4:bleached-sand|14-1112:CAB698:pebble|16-0924:C4AB86:croissant|16-1010:AF9A7E:incense|16-1315:A9947A:cornstalk|17-1320:A68A6D:tannin|14-0615:CAC4A4:green-haze|15-1217:C7B595:mojave-desert|15-1119:BFA77F:taos-taupe|16-1324:B89B72:lark|17-1022:988467:kelp|17-1028:907954:antique-bronze|17-0935:8A6F48:dull-gold|17-1134:A17249:brown-sugar|17-1044:976F4C:chipmunk|17-1327:9A7352:tobacco-brown|18-1027:6E4F3A:bison|18-1048:704822:monks-robe|18-1033:704F37:dachshund|18-1031:755139:toffee|18-1130:7A5747:aztec|18-1222:6C5043:cocoa-brown|18-1124:725440:partridge|19-1230:6E493A:friar-brown|19-1217:684B40:mustang|19-1121:61473B:pinecone|19-1218:54392D:potting-soil|18-1022:836B4F:ermine|18-1018:7F674F:otter|18-0920:725E43:kangaroo|18-0928:6B543E:sepia|18-0930:6A513B:coffee-liqueur|19-0815:5A4632:desert-palm|19-0617:655341:teak|18-1015:736253:shitake|18-1016:6E5C4B:cub|19-1116:5D473A:carafe|19-1020:5C4939:dark-earth|19-0814:4B3D33:slate-black|19-0912:4E403B:chocolate-brown|19-0712:40342B:demitasse|18-1312:7B6660:deep-taupe|19-1213:5A4743:shopping-bag|19-1118:584039:chestnut|19-1015:4F3F3B:bracken|19-1314:493B39:seal-brown|19-1016:433331:java|19-0915:40312F:coffee-bean|12-1006:E9D4C3:mother-of-pearl|12-1007:E9D1BF:pastel-rose-tan|12-1005:E7CFBD:novelle-peach|12-0807:EBD1BB:sun-kiss|13-1011:DAC0A7:ivory-cream|14-1210:D8C0AD:shifting-sand|13-1013:DDBCA0:appleblossom|12-0601:ECE1D3:eggnog|13-1108:E4C7B8:cream-tan|13-1106:DECDBE:sand-dollar|14-1209:CEBAA8:smoke-gray|15-1308:BDAB9B:doeskin|15-1215:BAA38B:sesame|16-1210:B19D8D:light-taupe|16-1318:AF9483:warm-taupe|16-1412:A58D7F:stucco|16-1415:A78C8B:almondine|16-1414:A28776:chanterelle|17-1418:977D70:ginger-snap|17-1321:947764:woodsmoke|17-1319:9F8672:amphora|15-1309:C5B1A0:moonlight|14-1212:D1B7A0:frappe|15-1315:C2A594:rugby-tan|16-1221:B09080:roebuck|17-1223:AD8B75:praline|17-1322:947764:burro|17-1417:997867:beaver-fur|14-1213:D2B49C:toasted-almond|17-1225:AE856C:tawny-birch|16-1323:B38B71:macaroon|17-1226:AB856F:tawny-brown|17-1224:B0846A:camel|16-1331:CA9978:toast|16-1327:C08768:toasted-nut|12-0911:F2D3BC:nude|12-0912:F8D5B8:tender-peach|12-0913:F1CEB3:alesan|12-0915:FED1BD:pale-peach|12-1011:EFCFBA:peach-puree|13-1114:F4C9B1:bellini|14-1217:E2BEA2:amberlight|12-1107:F0D8CC:peach-dust|12-1008:EDD2C0:linen|12-1010:FBD8C9:scallop-shell|12-1209:F2D8CD:soft-pink|13-1404:EDCDC2:pale-dogwood|12-1206:E7CFC7:silver-peony|14-1307:CDB2A5:rose-dust|13-1405:E1CFC6:shell|13-1107:DACBBE:whisper-pink|12-1404:DBCBBD:pink-tint|14-1311:DDB6AB:evening-sand|15-1317:C39D88:sirocco|16-1317:B99984:brush|17-1227:AE8774:cafe-au-lait|14-1310:D7B8AB:cameo-rose|14-1312:E4BFB3:pale-blush|14-1313:DBB0A2:rose-cloud|14-1314:DFBAA9:spanish-villa|15-1316:C9A38D:maple-sugar|16-1219:BE9785:tuscany|16-1422:BA8671:cork|13-1109:EDCAB5:bisque|15-1319:E5B39B:almost-apricot|15-1318:DFB19B:pink-sand|14-1220:E6AF91:peach-nougat|15-1327:D99B7C:peach-bloom|15-1322:D29B83:dusty-coral|16-1220:C79685:cafe-creme|16-1235:BD8B69:sandstorm|16-1341:C68F65:butterum|16-1336:B4835B:biscuit|17-1137:A47149:cashew|16-1432:A7754D:almond|17-1330:A0714F:lion|18-1030:936B4F:thrush|17-1230:A47864:mocha-mousse|17-1430:A36E51:pecan-brown|17-1143:AE7250:hazel|17-1336:A66E4A:bran|17-1340:A3623B:adobe|18-1142:97572B:leather-brown|18-1154:91552B:glazed-ginger|16-1328:C48A69:sandstone|16-1439:C37C54:caramel|17-1147:A66646:amber-brown|18-1239:985C41:sierra|18-1244:8C4A2F:ginger-bread|18-1140:8C543A:mocha-bisque|19-1241:754734:tortoise-shell|16-1332:C68463:pheasant|16-1429:B37256:sunburn|17-1436:B9714F:raw-sienna|17-1347:B56A4C:autumn-leaf|18-1450:BD5745:mecca-orange|18-1248:B55A30:rust|18-1250:9F5130:bombay-brown|13-1012:D2C2AC:frosted-almond|14-1012:B39F8D:gilded-beige|15-0927:BD9865:pale-gold|16-0836:C8B273:rich-gold|16-1325:C47E5A:copper|18-1537:BA6B57:copper-coin|14-5002:A2A2A1:silver|17-1422:92705F:raw-umber|18-1321:8F7265:brownie|18-1314:7E5E52:acorn|18-1320:876155:clove|18-1229:855C4C:carob-brown|18-1235:8F5F50:russet|18-1137:865E49:rawhide|18-1433:98594B:chutney|18-1441:9C5642:baked-clay|18-1336:9A6051:copper-brown|18-1242:834F3D:brown-patina|18-1238:855141:rustic-brown|18-1230:874E3C:coconut-shell|19-1333:804839:sequoia|19-1228:714A41:root-beer|19-1235:664238:brunette|19-1320:6E403C:sable|19-1436:6B4139:cinnamon|19-1431:63403A:fudgesickle|19-1430:734B42:mink|19-1220:633F33:cappuccino|18-1421:8B645A:cognac|18-1326:7E5C54:nutmeg|19-1012:58423F:french-roast|19-1420:553B39:deep-mahogany|19-1321:583432:rum-raisin|19-1322:593C39:brown-stone|19-1317:503130:bitter-chocolate|18-1425:824D46:mahogany|19-1334:7C423C:henna|19-1245:884332:arabian-spice|19-1325:683B39:hot-chocolate|19-1338:743332:russet-brown|19-1331:6A3331:madder-brown|19-1327:603535:andorra|11-0510:F3E6C9:afterglow|11-0617:F4ECC2:transparent-yellow|12-0715:F3E0AC:double-cream|13-0822:EDD59E:sunlight|13-0922:E0C992:straw|14-0935:DABE81:jojoba|14-1031:D1B272:rattan|14-1110:D1BE9B:boulder|13-0715:D8C9A3:sea-mist|13-0915:DCC99E:reed-yellow|13-0613:D9CAA5:chino-green|14-0925:D6C69A:parsnip|12-0619:D4CC9A:dusty-yellow|15-0719:BBAA7E:silver-fern|12-0626:DCD494:lemon-grass|13-0725:DAC483:raffia|13-0624:D5CD94:golden-mist|14-0826:CFBB7B:pampas|14-0740:D2B04C:bamboo|15-0643:BCA949:cress-green|16-0847:A98B2D:olive-oil|14-0626:CCB97E:dried-moss|14-0647:CEC153:celery|13-0640:DACD65:acacia|14-0755:DDB614:sulphur|15-0743:C4A647:oil-yellow|16-0742:AE8E2C:green-sulphur|17-0839:AA8805:golden-palm|14-1025:C9B27C:cocoon|14-0721:C0AD7C:hemp|15-0730:BCA66A:southern-moss|15-0732:C1A65C:olivenite|15-0636:BDB369:golden-green|16-0730:B59E5F:antique-gold|16-0737:AA9855:burnished-gold|12-0722:EFE1A7:french-vanilla|11-0616:F2E6B1:pastel-yellow|11-0710:EDEDB7:tender-yellow|11-0618:EDE9AD:wax-yellow|12-0721:F0E79D:lemonade|11-0620:EEEA97:elfin-yellow|12-0740:F0E87D:limelight|14-0827:E3CC81:dusky-citron|14-0636:D1C87C:muted-lime|13-0632:D2CC81:endive|13-0720:E5D68E:custard|12-0633:DFD87E:canary-yellow|12-0738:EFDC75:yellow-cream|13-0739:DEC05F:cream-gold|12-0642:EDDD59:aurora|13-0648:D9CE52:green-sheen|13-0746:EEC843:maize|12-0643:FEE715:blazing-yellow|12-0752:FAE03C:buttercup|14-0756:F7D000:empire-yellow|13-0752:F3BF08:lemon|14-0848:F0C05A:mimosa|13-0850:FFD662:aspen-gold|13-0758:FFD02E:dandelion|13-0858:FFDA29:vibrant-yellow|14-0760:FFD400:cyber-yellow|14-0852:F3C12C:freesia|13-0859:FFC300:lemon-chrome|12-0720:F0DD9D:mellow-yellow|12-0824:FAE199:pale-banana|12-0825:F8DE8D:popcorn|12-0727:FADE85:sunshine|12-0736:FDD878:lemon-drop|13-0755:F6D155:primrose-yellow|14-0754:E4BF45:super-lemon|14-0837:DAB965:misted-yellow|15-0942:C5A253:sauterne|16-0946:BA9238:honey|16-0954:BC8D1F:arrowwood|16-0953:C4962C:tawny-olive|15-0850:D4AE40:ceylon-yellow|15-0751:CDA323:lemon-curry|15-1132:C9A86A:fall-leaf|16-1126:B19664:antelope|16-1133:B08E51:mustard-gold|16-0948:B68A3A:harvest-gold|16-0952:C89720:nugget-gold|15-0948:C6973F:golden-spice|15-0953:CB8E16:golden-yellow|14-1036:D6AF66:ochre|16-0945:C3964D:tinsel|16-0947:CF9F52:bright-gold|15-1142:D1A054:honey-gold|16-1139:C19552:amber-gold|15-1046:D39C43:mineral-yellow|16-0950:C39449:narcissus|14-1113:D8C09D:marzipan|16-0928:BE9E6F:curry|16-1326:B59A6A:prairie-sand|17-1047:B68F52:honey-mustard|17-1129:A47D43:wood-thrush|18-0940:91672F:golden-brown|18-0937:825E2F:bronze-brown|17-1045:B0885A:apple-cinnamon|17-1128:9D7446:bone-brown|17-1125:97754C:dijon|17-1036:98754A:bistre|17-0942:977547:medal-bronze|18-0939:927240:cumin|19-1034:795D34:breen|13-0840:FED777:snapdragon|13-0941:FFCF73:banana-cream|14-0850:FDC04E:daffodil|14-0846:E2B051:yolk-yellow|14-0951:E2A829:golden-rod|15-0955:ECA825:old-gold|14-0957:F7B718:spectra-yellow|12-0826:FBD897:golden-haze|14-0936:DFC08A:sahara-sun|14-1038:D7B57F:new-wheat|13-0932:EDC373:cornsilk|14-0847:F1BF70:buff-yellow|13-0940:F7C46C:sunset-gold|13-0939:F7B768:golden-cream|13-1025:F8CE97:impala|13-0935:FFC87D:flax|13-0945:FFC66E:pale-marigold|13-0942:FAB75A:amber-yellow|14-1045:EFAD55:amber|14-1041:DDA758:golden-apricot|14-0941:EBA851:beeswax|13-0947:FCB953:banana|14-0955:F9AC2F:citrus|15-1050:D99938:golden-glow|15-1049:F2AB46:artisans-gold|16-1054:D39237:sunflower|18-0935:A76F1F:buckthorn-brown|18-0950:99642C:cathay-spice|16-0940:C39B6A:taffy|16-1144:CF9C63:oak-buff|16-1143:CA9456:honey-yellow|17-1040:BE8A4A:spruce-yellow|17-1048:BB7A2C:inca-gold|18-1160:AC6B29:sudan-brown|18-0933:815B37:rubber|13-1016:DEC5A5:wheat|13-1015:DCBD9E:honey-peach|13-1018:E3BC8E:desert-dust|12-0921:E6BD8F:golden-straw|13-1024:EBC396:buff|14-1127:E0B589:desert-mist|15-1231:D2A172:clay|12-0822:F2D1A0:golden-fleece|13-1031:FACD9E:apricot-sherbet|13-1030:F6C289:sunburst|13-1027:F1BD89:apricot-cream|14-1128:FFBB7C:buff-orange|15-1145:F7B26A:chamois|14-1051:FFB865:warm-apricot|14-1050:FADC53:marigold|16-1142:DB9B59:golden-nugget|15-1147:E19640:butterscotch|16-1148:CF8848:nugget|16-1342:D18E54:buckskin|16-1140:D0893F:yam|17-1046:BE752D:golden-oak|15-1062:FFB000:gold-fusion|14-1064:FFA500:saffron|15-1054:EE9626:cadmium-yellow|14-1159:FFA010:zinnia|15-1058:FC9E21:radiant-yellow|15-1153:F19035:apricot|15-1150:E08119:dark-cheddar|13-1020:FBBE99:apricot-ice|14-1133:ECAA79:apricot-nectar|15-1234:DD9C6B:gold-earth|15-1237:DD9760:apricot-tan|16-1150:D08344:topaz|16-1346:C77943:golden-ochre|16-1443:CD7E4D:apricot-buff|14-1231:FFB181:peach-cobbler|14-1135:FEAA7B:salmon-buff|14-1139:F5A26F:pumpkin|15-1245:FFA368:mock-orange|15-1242:EC935E:muskmelon|16-1338:DE8E65:copper-tan|16-1337:D27D56:coral-gold|16-1255:E47127:russet-orange|16-1253:DC793A:orange-ochre|16-1350:DC793E:amberglow|16-1454:D86D39:jaffa-orange|17-1353:C86B3C:apricot-orange|16-1448:C86733:burnt-orange|16-1260:D56231:harvest-pumpkin|15-1160:FFA64F:blazing-orange|15-1157:FB8B23:flame-orange|15-1164:FF8D00:bright-marigold|15-1263:FF8812:autumn-glory|16-1257:F48037:sun-orange|16-1356:F47327:persimmon-orange|17-1350:FF7913:orange-popsicle|16-1343:F38554:autumn-sunset|15-1247:F88F58:tangerine|16-1357:FF8C55:bird-of-paradise|16-1359:FA7A35:orange-peel|16-1459:EC6A37:mandarin-orange|16-1462:F56733:golden-poppy|16-1364:FF7420:vibrant-orange|16-1360:FF8656:nectarine|16-1349:F3774D:coral-rose|16-1361:FD6F3B:carrot|16-1452:F36944:firecracker|17-1464:F05627:red-orange|16-1362:F9633B:vermillion-orange|17-1462:F2552C:flame|13-1026:FFCDA8:creampuff|12-0917:FCCAAC:bleached-apricot|13-1017:F4C29F:almond-cream|14-1225:FBB995:beach-sand|13-1019:F8C19A:cream-blush|13-1022:F4BA94:caramel-cream|13-1023:FFBE98:peach-fuzz|13-1021:FFBB9E:prairie-sunset|14-1224:EDAA86:coral-sands|14-1230:FBAC82:apricot-wash|15-1333:E1927A:canyon-sunset|16-1340:CE7B5B:brandied-melon|16-1435:CE785D:carnelian|17-1446:B75E41:mango|14-1227:F2A987:peach|15-1239:FFA177:cantaloupe|15-1331:FAA181:coral-reef|15-1334:EA9575:shell-coral|15-1340:F99471:cadmium-orange|16-1442:FE8863:melon|16-1344:E27A53:dusty-orange|16-1441:D16F52:arabesque|16-1440:CA6C56:langoustino|17-1444:C96551:ginger|16-1450:DF7253:flamingo|18-1447:C25A3C:orange-rust|18-1354:BB4F35:burnt-ochre|18-1448:BE5141:chili|18-1535:B65D48:ginger-spice|18-1451:B3573F:autumn-glaze|18-1343:A15843:auburn|19-1250:8D3F2D:picante|18-1444:9F4440:tandori-spice|18-1540:9C453B:cinnabar|18-1547:973A36:bossa-nova|13-1318:FFC4B2:tropical-peach|14-1219:F8BFA8:peach-parfait|14-1318:E8A798:coral-pink|14-1316:DEAA9B:dusty-pink|16-1330:D29380:muted-clay|15-1523:E29A86:shrimp|17-1341:D37F6F:tawny-orange|16-1329:E38E84:coral-haze|16-1431:CE8477:canyon-clay|16-1526:D38377:terra-cotta|17-1524:BD7B74:desert-sand|18-1436:AD6D68:light-mahogany|17-1525:A1655B:cedar-wood|18-1435:A26666:withered-rose|16-1522:C2877B:rose-dawn|17-1514:B5817D:ash-rose|17-1518:B47B77:old-rose|17-1424:B07069:brick-dust|17-1520:AF6C67:canyon-rose|18-1630:AD5D5D:dusty-cedar|18-1438:964F4C:marsala|17-1540:C26A5A:apricot-brandy|17-1532:B06455:aragon|18-1536:AB4F41:hot-sauce|18-1346:A75949:bruschetta|18-1434:A2574B:etruscan-red|18-1443:A6594C:redwood|18-1350:A14D3A:burnt-brick|18-1629:BF6464:faded-rose|18-1648:B34646:baked-apple|18-1658:A4292E:pompeian-red|18-1449:9A382D:ketchup|18-1442:913832:red-ochre|18-1531:8F423B:barn-red|19-1540:7E392F:burnt-henna|14-1419:FFB2A5:peach-pearl|14-1418:FBBDAF:peach-melba|14-1420:FEAEA5:apricot-blush|14-1324:FDB2AB:peach-bud|16-1434:E29D94:coral-almond|16-1520:DD9289:lobster-bisque|16-1624:DA7E7A:lantana|14-1228:FFB59B:peach-nectar|14-1323:FAAA94:salmon|15-1423:FB9F93:peach-amber|15-1435:FF9687:desert-flower|15-1530:FA9A85:peach-pink|16-1529:E9897E:burnt-coral|16-1532:D77E70:crabapple|15-1433:FCA289:papaya-punch|16-1543:FF8576:fusion-coral|16-1542:FF7F6A:fresh-salmon|16-1544:F67866:persimmon|16-1539:ED7464:coral|16-1546:FF6F61:living-coral|17-1656:F35B53:hot-coral|16-1632:F88180:shell-pink|16-1641:F97272:georgia-peach|16-1640:F56C73:sugar-coral|17-1647:F25F66:dubarry|17-1643:EA6B6A:porcelain-rose|17-1644:D75C5D:spiced-coral|18-1649:D9615B:deep-sea-coral|17-1635:DC5B62:rose-of-sharon|18-1651:E04951:cayenne|18-1762:DD3848:hibiscus|17-1654:CB3441:poinsettia|17-1641:BE454F:chrysanthemum|17-1545:BB4A4D:cranberry|18-1643:AD3E48:cardinal|17-1456:E2583E:tigerlily|17-1558:DF3F32:grenadine|17-1562:E74A33:mandarin-red|17-1564:DD4132:fiesta|17-1563:EB3C27:cherry-tomato|18-1561:DA321C:orange-com|18-1445:D73C26:spicy-orange|16-1541:F6745F:camellia|16-1451:FE6347:nasturtium|17-1547:EA6759:emberglow|17-1544:C65D52:burnt-sienna|17-1553:CE4D42:paprika|18-1454:C2452D:red-clay|18-1555:B5332E:molten-lava|17-1663:D93744:bittersweet|17-1664:DC343B:poppy-red|18-1660:CE2939:tomato|18-1664:D01C1F:fiery-red|18-1662:CD212A:flame-scarlet|18-1763:C71F2D:high-risk-red|18-1550:B93A32:aurora-red|18-1652:BB363F:rococco-red|18-1661:C53346:tomato-puree|18-1764:CC1C3B:lollipop|18-1761:BB1237:ski-patrol|19-1760:BC2B3D:scarlet|19-1764:B31A38:lipstick-red|19-1762:AE0E36:crimson|19-1763:BD162C:racing-red|18-1655:BC2731:mars-red|19-1761:AC0E2E:tango-red|18-1663:BE132D:chinese-red|19-1663:B92636:ribbon-red|19-1664:BF1932:true-red|19-1557:9B1B30:chili-pepper|14-1714:EFA6AA:quartz-pink|15-1717:EEA0A6:pink-icing|14-1513:F2B2AE:blossom|14-1521:F4A6A3:peaches-n-cream|15-1621:F8A39D:candlelight-peach|16-1720:E78B90:strawberry-ice|16-1626:DE8286:peach-blossom|15-1821:F7969E:flamingo-pink|16-1723:E6798E:confetti|17-1928:EA738D:bubblegum|16-1735:EE6D8A:pink-lemonade|17-1930:EB6081:camellia-rose|17-1929:D16277:rapture-rose|17-1927:CF6977:desert-rose|15-1922:F6909D:geranium-pink|15-1624:FC8F9B:conch-shell|15-1626:FF8D94:salmon-rose|16-1731:F57F8E:strawberry-pink|17-1736:EA6676:sunkist-coral|17-1744:EE5C6C:calypso-coral|16-1620:DC7178:tea-rose|17-1753:DA3D58:geranium|17-1755:E4445E:paradise-pink|18-1756:DC3855:teaberry|18-1755:E24666:rouge-red|18-1754:D32E5E:raspberry|17-1842:D42E5B:azalea|18-1856:C6174E:virtual-pink|17-1740:C84C61:claret-red|18-1741:B63753:raspberry-wine|18-1852:C92351:rose-red|18-1760:BF1945:barberry|18-1945:C51959:bright-rose|19-1860:A21441:persian-red|19-1955:A41247:cerise|13-2806:EFC1D6:pink-lady|14-2710:E9ADCA:lilac-sachet|14-2311:F0A1BF:prism-pink|15-2215:EC9ABE:begonia-pink|15-2718:DF88B7:fuchsia-pink|15-2214:E290B2:rosebloom|17-2520:CA628F:ibis-rose|15-2216:F18AAD:sachet-pink|16-2120:D979A2:wild-orchid|15-2217:E881A6:aurora-pink|17-2120:D2738F:chateau-rose|15-1920:EE819F:morning-glory|16-2126:E96A97:azalea-pink|17-2127:DE5B8C:shocking-pink|17-1937:E55982:hot-pink|17-2033:E04F80:fandango-pink|18-2120:D94F70:honeysuckle|18-2043:D2386C:raspberry-sorbet|17-1831:BC4869:carmine|17-2031:C74375:fuchsia-rose|18-2143:CF2D71:beetroot-purple|16-2124:ED7A9E:pink-carnation|17-2230:E35B8F:carmine-rose|17-2036:D23C77:magenta|18-2133:D3507A:pink-flambe|18-2436:D33479:fuchsia-purple|17-2227:BD4275:lilac-rose|18-2336:B73275:very-berry|17-2625:CE6BA4:super-pink|17-2627:CE5E9A:phlox-pink|18-2333:CC4385:raspberry-rose|17-2624:C0428A:rose-violet|18-2328:AB3475:fuchsia-red|18-2326:A83E6C:cactus-flower|18-2525:9D446E:magenta-haze|11-2511:F4E1E6:shrinking-violet|12-2904:EED4D9:primrose-pink|14-1508:DCB1AF:silver-pink|14-1511:ECB2B3:powder-pink|16-1617:D18489:mauveglow|16-1610:CA848A:brandied-apricot|17-1718:BA797D:dusty-rose|12-2102:ECD6D6:mauve-morn|12-2902:E5D0CF:mauve-chalk|12-1304:F9DBD8:pearl|15-1611:D69FA2:bridal-rose|15-1614:D1969A:blush|18-1634:B35A66:baroque-rose|18-1635:B45865:slate-rose|17-1537:B35457:mineral-red|18-1633:AC4B55:garnet-rose|17-1633:B44E5D:holly-berry|19-1759:A73340:american-beauty|19-1862:9E1030:jester-red|19-1656:8A2232:rio-red|19-1940:7C2439:rumba-red|18-1631:95424E:earth-red|19-1840:973443:deep-claret|19-1655:953640:garnet|19-1543:8C373E:brick-red|19-1532:813639:rosewood|19-1934:782A39:tibetan-red|19-1650:77212E:biking-red|18-1426:844B4D:apple-butter|19-1524:70393F:oxblood-red|19-1533:884344:cowhide|19-1530:7E3940:burnt-russet|19-1629:77333B:ruby-wine|19-1726:702F3B:cordovan|19-1725:5C2C35:tawny-port|13-1407:F7D5CC:creole-pink|13-1504:E4CCC6:peach-blush|13-1406:F5D1C8:cloud-pink|12-1212:F8CDC9:veiled-rose|12-1207:F4CEC5:pearl-blush|13-1310:F4C6C3:english-rose|14-1905:E2C1C0:lotus|11-1408:F6DBD8:rosewater|14-1309:DBBEB7:peach-whip|14-1506:D3B4AD:rose-smoke|15-1415:E2A9A1:coral-cloud|15-1512:CAA39A:misty-rose|15-1516:D3A297:peach-beige|16-1516:C08A80:cameo-brown|13-1409:F7C8C2:seashell-pink|13-1408:EEC4BE:chintz-rose|13-1510:FFC4BC:impatiens-pink|14-1907:DFB8B6:peachskin|15-1515:D9A6A1:mellow-rose|16-1511:D19C97:rose-tan|16-1518:CE8E8B:rosette|17-1522:A75D67:mauvewood|17-1623:A4596D:rose-wine|17-1723:9F5069:malaga|18-1725:8C4759:dry-rose|18-1718:884C5E:hawthorn-rose|18-1619:834655:maroon|18-1420:7C4C53:wild-ginger|19-2047:982551:sangria|19-1850:962D49:red-bud|18-2027:80304C:beaujolais|19-2033:842C48:anemone|19-2030:7A1F3D:beet-red|19-2025:7C2946:red-plum|19-2024:722B3F:rhododendron|12-2906:F8D7DD:barely-pink|12-1310:FBD3D9:blushing-bride|12-2905:EDD0DD:cradle-pink|13-2803:E1C6CC:pale-lilac|13-1904:E6C5CA:chalk-pink|12-2903:DEC6D3:light-lilac|14-2305:D8AAB7:pink-nectar|12-1305:F4DEDE:heavenly-pink|13-2004:E7C9CA:potpourri|12-1605:EDD0CE:crystal-pink|12-1706:F7D1D1:pink-dogwood|12-1708:FDC3C6:crystal-rose|13-2005:F4C3C4:strawberry-cream|13-1513:FAC8C3:gossamer-pink|13-1906:F9C2CD:rose-shadow|13-2010:F3BBCA:orchid-pink|13-2006:F5BEC7:almond-blossom|14-1909:E6B2B8:coral-blush|14-1911:F5B0BD:candy-pink|15-1816:ED9CA8:peony|15-1912:DE98AB:sea-pink|16-2215:CE879F:cashmere-rose|16-1715:CE8498:wild-rose|15-2210:D294AA:orchid-smoke|16-1712:C28799:polignac|16-1708:B88995:lilas|16-2111:B58299:mauve-orchid|16-2107:B0879B:orchid-haze|13-2804:E9C3CF:parfait-pink|13-2805:E6BCCD:pink-mist|14-2307:DBA9B8:cameo-pink|14-2808:E8B5CE:sweet-lilac|14-3207:D9AFCA:pink-lavender|14-3209:D8A1C4:pastel-lavender|15-3214:D198C5:orchid|15-2913:DE9BC4:lilac-chiffon|16-2614:D28FB0:moonlite-mauve|16-3118:D687BA:cyclamen|16-3116:CA80B1:opera-mauve|16-3115:C67FAE:crocus|17-3014:A76C97:mulberry|18-3025:944E87:striking-purple|16-3320:C17FB5:violet|17-3323:A767A2:iris-orchid|18-3224:AD5E99:radiant-orchid|17-3020:BA69A1:spring-crocus|18-3230:A9568C:meadow-mauve|18-3015:864D75:amethyst|19-2428:6B264B:magenta-purple|17-3023:B65F9A:rosebud|18-3027:AD4D8C:purple-orchid|19-2434:9E2C6A:festival-fuchsia|18-2527:973C6C:baton-rouge|19-2431:85325C:boysenberry|19-2432:802A50:raspberry-radiance|19-2430:692746:purple-potion|17-2617:A64F82:dahlia-mauve|18-3339:993C7C:vivid-viola|19-2630:92316F:wild-aster|18-3022:903F75:deep-orchid|18-2320:8A3371:clover|18-2929:8C3573:purple-wine|19-2924:823270:hollyhock|18-3331:8D4687:hyacinth-violet|18-3324:843E83:dahlia|19-3336:773376:sparkling-grape|19-3138:853B7B:byzantium|19-2820:692D5D:phlox|19-3230:682961:grape-juice|19-3022:622E5A:gloxinia|13-3801:D7CBC4:crystal-gray|14-1305:BDACA3:mushroom|16-1509:BBA5A0:shadow-gray|16-1703:AB9895:sphinx|16-1506:A99592:bark|16-1510:AE9490:fawn|16-1508:BA9F99:adobe-rose|15-1607:C6A4A4:pale-mauve|16-1806:AE8C8E:woodrose|16-1707:AF9294:deauville-mauve|18-1807:8B6F70:twilight-mauve|18-1612:806062:rose-taupe|18-1512:80565B:rose-brown|18-1616:885157:roan-rouge|17-1510:957A76:antler|18-1409:6C5656:peppercorn|19-1606:524144:raisin|19-1620:5B4349:huckleberry|19-1621:5D3C43:catawba-grape|19-1518:503938:puce|19-1619:493338:fudge|15-1511:C5A193:mahogany-rose|17-1516:9B716B:burlwood|18-1415:6E4C4B:marron|19-1625:513235:decadent-chocolate|19-1521:60373D:red-mahogany|19-1623:58363D:vineyard-wine|19-2118:492A34:winetasting|19-1525:663336:port|19-1526:612E35:chocolate-truffle|19-1617:64313E:burgundy|19-1522:5C2935:zinfandel|19-1528:582B36:windsor-wine|19-1627:502B33:port-royale|19-1718:532D3B:fig|15-2706:C2ACB1:violet-ice|15-1905:C5AEB1:burnished-lilac|15-2705:C0A5AE:keepsake-lilac|16-3205:B598A3:mauve-shadows|15-2205:BFA3AF:dawn-pink|14-3204:CEADBE:fragrant-lilac|15-3207:C49BD4:mauve-mist|17-1608:AD6D7F:heather-rose|17-1818:A35776:red-violet|17-1612:996378:mellow-mauve|17-1710:96637B:bordeaux|18-1720:8B4963:violet-quartz|18-1716:854C65:damson|19-2410:6F3C56:amaranth|15-1906:C89FA5:zephyr|17-1610:9A7182:dusky-orchid|18-2109:886971:grape-shake|17-1511:946C74:wistful-mauve|18-1709:805466:tulipwood|18-1710:8D5C74:grape-nectar|18-3011:895C79:argyle-purple|17-1512:A4777E:nostalgia-rose|17-1614:985F68:deco-rose|18-1613:865560:renaissance-rose|18-1614:7A4B56:nocturne|18-1418:804F5A:crushed-berry|19-2312:643A4C:crushed-violets|19-1716:5B3644:mauve-wine|18-1411:674550:plum-wine|19-2311:613F4C:eggplant|19-2014:603749:prune|19-1608:5C3A4D:prune-purple|19-2315:5A2F43:grape-wine|19-2514:533146:italian-plum|19-2520:462639:potent-purple|16-3310:B18EAA:lavender-herb|16-3307:AE90A7:lavender-mist|17-3410:9F7A93:valerian|18-3220:927288:very-grape|18-3211:85677B:grapeade|18-3012:7A596F:purple-gumdrop|18-3013:765269:berry-conserve|18-3418:835E81:chinese-violet|18-3522:7A547F:crushed-grape|18-3218:7C5379:concord-grape|19-3424:6F456E:sunset-purple|19-3325:75406A:wood-violet|19-3223:683D62:purple-passion|19-2524:582147:dark-purple|18-3415:725671:grape-jam|19-3323:50314C:deep-purple|19-2814:5A395B:wineberry|19-3518:4F2D54:grape-royale|19-3218:51304E:plum-purple|19-2009:553B50:hortensia|19-2816:4D3246:blackberry-wine|19-3714:503B53:navy-cosmos|19-3215:4C3957:indigo|19-3519:432C47:purple-pennant|19-3316:473442:plum-perfect|19-3619:4B3B4F:sweet-grape|19-3217:4E334E:shadow-purple|19-3520:3F2A47:blackberry-cordial|19-3620:56456B:purple-reign|19-3722:493C62:mulberry-purple|19-3720:473951:gothic-grape|19-3728:433455:grape|19-3617:46394B:mysterioso|19-3725:41354D:purple-velvet|19-3712:433748:nightshade|13-3802:DBD2DB:orchid-tint|13-3803:D7CDCD:lilac-ash|13-3804:D4CACD:gray-lilac|14-3803:D1C0BF:hushed-violet|15-3802:B7A9AC:cloud-gray|17-1505:98868C:quail|17-3808:A2919B:nirvana|13-3805:CEC3D2:orchid-hush|14-3805:BAAFBC:iris|16-3304:A5929D:sea-fog|17-1605:9D848E:elderberry|18-1706:6C5765:black-plum|18-1405:705861:flint|19-1624:54353B:sassafras|14-3904:BDB8C7:evening-haze|14-3907:B9B3C5:thistle|17-3910:9890A2:lavender-gray|17-3906:948D99:minimal-gray|17-3810:8F8395:purple-ash|18-3710:847986:gray-ridge|18-3712:75697E:purple-sage|16-3812:9D96B2:heirloom-lilac|16-3810:A198AF:wisteria|17-3812:897F98:dusk|17-3817:8981A0:daybreak|18-3812:6A6378:cadet|18-3714:675A74:mulled-grape|19-3716:473854:purple-plumeria|14-3903:C3BABF:lilac-marble|15-0703:B5ACAB:ashes-of-roses|16-3803:A49CA0:gull-gray|17-2601:92898A:zinc|17-3802:918C8F:gull|18-1703:6D636B:shark|18-1404:69595C:sparrow|13-3406:E0D0DB:orchid-ice|13-3405:E0C7D7:lilac-snow|14-3206:D4B9CB:winsome-orchid|15-3508:C0AAC0:fair-orchid|15-3507:BDABBE:lavender-frost|14-3710:BFB4CB:orchid-petal|14-3812:BDB0D0:pastel-lilac|14-3612:C5AECF:orchid-bloom|15-3412:D1ACCE:orchid-bouquet|16-3521:BE9CC1:lupine|16-3416:C193C0:violet-tulle|16-3617:B793C0:sheer-lilac|16-3520:B085B7:african-violet|17-3313:A1759C:dusty-lavender|17-3730:8B79B1:paisley-purple|17-3619:936CA7:hyacinth|17-3628:926AA6:amethyst-orchid|18-3533:8B5987:dewberry|18-3520:745587:purple-heart|19-3526:764F82:meadow-violet|19-3642:603F83:royal-purple|18-3633:775496:deep-lavender|18-3531:774D8E:royal-lilac|19-3542:653D7C:pansy|19-3438:784384:bright-violet|19-3536:6A397B:amaranth-purple|19-3540:663271:purple-magic|19-3220:5A315D:plum|18-3615:604E7A:imperial-palace|18-3518:6C4E79:patrician-purple|19-3622:5A4769:loganberry|19-3514:593761:majesty|19-3528:542C5D:imperial-purple|19-3640:482D54:crown-jewel|19-3731:392852:parachute-purple|13-3820:D2C4D6:lavender-fog|15-3620:BCA4CB:lavendula|15-3817:AFA4CE:lavender|17-3725:9884B9:bougainvillea|16-3823:9E91C3:violet-tulip|17-3615:8F7DA5:chalk-violet|18-3718:807396:purple-haze|16-3110:B88AAC:smoky-grape|16-3525:A98BAF:regal-orchid|16-3815:A692BA:viola|17-3612:917798:orchid-mist|18-3513:6B5876:grape-compote|18-3715:6C5971:montana-grape|18-3410:634F62:vintage-violet|17-3826:7D74A8:aster-purple|17-3834:7E6EAC:dahlia-purple|18-3737:6D5698:passion-flower|18-3838:5F4B8B:ultra-violet|19-3748:53357D:prism-violet|19-3737:4F3872:heliotrope|19-3632:4F3466:petunia|18-3828:646093:corsican-blue|18-3834:6D6695:veronica|18-3943:5A5B9F:blue-iris|18-3840:60569A:purple-opulence|19-3730:544275:gentian-violet|19-3850:4D448A:liberty|19-3847:44377D:deep-blue|18-3930:646F9B:bleached-denim|18-3817:62617E:heron|19-3936:484A72:skipper-blue|19-3832:403F6F:navy-blue|19-3842:443F6F:deep-wisteria|19-3839:3A395F:blue-ribbon|19-3830:363151:astral-aura|13-4105:D0D0DA:lilac-hint|15-3807:BCB4C4:misty-lilac|14-3905:C5C0D0:lavender-blue|14-3911:BAB8D3:purple-heather|15-3909:AAAAC4:cosmic-sky|15-3910:A2A1BA:languid-lavender|16-3907:9C9BA7:dapple-gray|16-3931:9A9BC1:sweet-lavender|16-3925:919BC9:easter-egg|17-3930:848DC5:jacaranda|17-3932:7C83BC:deep-periwinkle|18-3833:696BA0:dusted-peri|18-3944:5C619D:violet-storm|18-3946:5F6DB0:baja-blue|16-3930:9499BB:thistle-down|17-3925:8C8EB2:persian-violet|18-3820:66648B:twilight-purple|19-3947:47457A:orient-blue|19-3951:363B7C:clematis-blue|19-3955:3D428B:royal-blue|18-3963:3D3C7C:spectrum-blue|17-3924:767BA5:lavender-violet|17-3922:70789B:blue-ice|18-3927:60688D:velvet-morning|18-3932:515B87:marlin|19-3939:2D3359:blueprint|19-3940:263056:blue-depths|19-3933:29304E:medieval-blue|16-3911:9F99AA:lavender-aura|17-3917:74809A:stonewash|19-3919:4E5368:nightshadow-blue|19-3928:49516D:blue-indigo|19-3915:4D495B:graystone|19-3926:464B65:crown-blue|19-3935:404466:deep-cobalt|13-4110:BFC7D6:arctic-ice|14-4106:BBC1CC:gray-dawn|14-4110:B7C0D6:heather|16-3919:959EB7:eventide|17-4030:618BB9:silver-lake-blue|17-3936:6384B8:blue-bonnet|18-3937:5A77A8:blue-yonder|16-3920:8C9CC1:lavender-lustre|17-3919:858FB1:purple-impression|16-3929:8398CA:grapemist|15-3930:81A0D4:vista-blue|16-4031:7391C8:cornflower-blue|17-3934:6E81BE:persian-jewel|18-3935:6479B3:wedgewood|14-4112:ADBED3:skyway|14-4115:A5B8D0:cashmere-blue|14-4121:93B4D7:blue-bell|15-3920:8CADD3:placid-blue|16-4020:7A9DCB:della-robbia-blue|16-4032:658DC6:provence|17-4037:5B7EBD:ultramarine|16-4021:7291B4:allure|17-3923:65769A:colony-blue|18-4027:506886:moonlight-blue|18-3928:4A638D:dutch-blue|19-4039:3D5E8C:delft|19-4044:243F6C:limoges|19-4027:233658:estate-blue|17-4015:6E7E99:infinity|18-3921:4E5E7F:bijou-blue|18-3920:505D7E:coastal-fjord|19-4030:3F5277:true-navy|19-4026:384C67:ensign-blue|19-4118:35465E:dark-denim|19-4028:2F3E55:insignia-blue|15-4319:77ACC7:air-blue|16-4127:5D96BC:heritage-blue|15-4323:5CA6CE:ethereal-blue|16-4134:539CCC:bonnie-blue|17-4131:3E7FA5:cendre-blue|18-4036:4F7CA4:parisian-blue|18-4232:2A6A8B:faience|15-4225:6DA9D2:alaskan-blue|16-4132:6EA2D5:little-boy-blue|17-4139:4D91C6:azure-blue|17-4027:5879A2:riviera|18-4029:43628B:federal-blue|18-4041:386192:star-sapphire|19-4037:385D8D:bright-cobalt|16-4120:7BA0C0:dusk-blue|18-4039:487AB7:regatta|18-4043:346CB0:palace-blue|18-4051:1F5DA0:strong-blue|19-4053:195190:turkish-sea|19-4056:1A4C8B:olympian-blue|19-4052:0F4C81:classic-blue|17-4041:4F84C4:marina|18-4141:3272AF:campanula|18-4045:0F5F9A:daphne|18-4148:08589D:victoria-blue|19-4049:034F84:snorkel-blue|19-4050:1A5091:nautical-blue|19-4150:00539C:princess-blue|18-3949:3850A0:dazzling-blue|18-3945:4960A8:amparo-blue|19-3950:384883:deep-ultramarine|19-3952:203C7F:surf-the-web|19-3864:273C76:mazarine-blue|19-4057:1E4477:true-blue|19-3938:313D64:twilight-blue|15-3915:A5B3CC:kentucky-blue|15-4020:9BB7D4:cerulean|14-4214:96B3D2:powder-blue|16-4019:899BB8:forever-blue|17-3915:79839B:tempest|17-3918:717F9B:country-blue|17-3920:7181A4:english-manor|13-4103:C9D3DC:illusion-blue|13-4304:C0CEDA:ballad-blue|13-4308:B5C7D3:baby-blue|14-4210:A3B4C4:celestial-blue|15-4008:9BABBB:blue-fog|18-3916:677283:flint-stone|18-3910:626879:folkstone-gray|14-4206:B0B7BE:pearl-blue|17-4405:84898C:monument|19-4220:46515A:dark-slate|19-4110:34414E:midnight-navy|19-4010:2C313D:total-eclipse|19-4015:323137:blue-graphite|19-4013:232F36:dark-navy|13-4404:C6D2D2:ice-flow|15-4305:98A0A5:quarry|17-5102:8D8F8F:griffin|19-3906:4A4B4D:dark-shadow|19-4014:434854:ombre-blue|19-4019:3C3F4A:india-ink|19-4104:41424A:ebony|19-3925:363756:patriot-blue|19-3810:343148:eclipse|19-4025:353A4C:mood-indigo|19-3920:2B2E43:peacoat|19-3921:2B3042:black-iris|19-4024:2A3244:dress-blues|19-4023:363B48:blue-nights|15-4105:A3BDD3:angel-falls|15-4005:A0BCD0:dream-blue|16-4013:8699AB:ashley-blue|16-4010:8C9DAD:dusty-blue|19-4227:3C586B:indian-teal|19-4316:39505C:stargazer|19-4229:3E4F5C:orion-blue|15-4312:8FADBD:forget-me-not|17-4021:798EA4:faded-denim|17-4020:66829A:blue-shadow|18-3922:59728E:coronet-blue|18-4020:557088:captains-blue|18-4025:516B84:copen-blue|18-3918:546477:china-blue|17-4320:5C899B:adriatic-blue|18-4220:5C798E:provincial-blue|17-4123:5487A4:niagara|17-4023:5B7E98:blue-heaven|18-4026:46647E:stellar|18-4018:405D73:real-teal|19-4125:274357:majolica-blue|12-4609:B5CED4:starlight-blue|14-4307:A9C0CB:winter-sky|14-4508:9EC1CC:stratosphere|15-4309:A2B9C2:sterling-blue|16-4109:879BA3:arona|17-4111:748995:citadel|18-4215:5C6D7C:blue-mirage|14-4306:A2B6B9:cloud-blue|14-4506:9EB6B8:ether|16-4414:769DA6:cameo-blue|16-4114:829CA5:stone-blue|16-4411:86A1A9:tourmaline|17-4412:6D8994:smoke-blue|18-4217:577284:bluestone|14-4313:9DC3D4:aquamarine|14-4318:8ABAD3:sky-blue|15-4415:72A8BA:milky-blue|15-4421:5CACCE:blue-grotto|15-4427:4CA5C7:norse-blue|16-4530:3CADD4:aquarius|16-4525:52A2B4:maui-blue|16-4421:5BACC3:blue-mist|15-4720:38AFCD:river-blue|16-4529:14A3C7:cyan-blue|16-4427:289DBE:horizon-blue|17-4328:3686A0:blue-moon|17-4427:157EA0:bluejay|18-4334:1478A7:mediterranean-blue|14-4522:4ABBD5:bachelor-button|16-4535:00B1D2:blue-atoll|17-4432:0088B0:vivid-blue|17-4540:008DB9:hawaiian-ocean|17-4440:0087B6:blue-danube|18-4535:007BAA:blue-jewel|18-4537:0074A8:methyl-blue|17-4435:008CC1:malibu-blue|17-4336:0084BD:blithe|18-4330:007EB1:swedish-blue|17-4433:0086BB:dresden-blue|17-4247:007BB2:diva-blue|18-4252:0077B3:blue-aster|18-4440:0075AF:cloisonne|18-4140:0072B5:french-blue|18-4247:0075B3:brilliant-blue|18-4244:0061A3:directoire-blue|19-4151:00589B:skydiver|19-4245:005A92:imperial-blue|18-4032:266691:deep-water|19-4035:305679:dark-blue|12-4607:BCD3D5:pastel-blue|12-4608:AAD5DB:clearwater|13-4409:B2D4DD:blue-glow|13-4809:A5CFD5:plume|14-4512:95C0CB:porcelain-blue|13-4411:A1C8DB:crystal-blue|14-4516:87C2D4:petit-four|12-4805:CBDCDF:wan-blue|12-4610:C9DCDC:whispering-blue|12-4604:C8E0E0:skylight|14-4510:99C1CC:aquatic|15-4712:76AFB6:marine-blue|16-4612:6F9FA9:reef-waters|17-4911:648589:arctic|12-4806:CCDAD7:chalk-blue|13-4804:C4D6D3:pale-blue|13-4405:BFCDCC:misty-blue|14-4504:BCC8C6:sky-gray|14-4807:B4C8C2:surf-spray|15-4706:99AEAE:gray-mist|15-5207:89ACAC:aquifer|12-5206:C6E3E1:blue-glass|13-5306:B0D3D1:icy-morn|14-4810:9CC2C5:canal-blue|13-5309:99C5C4:pastel-turquoise|15-5209:87B9BC:aqua-haze|15-4715:6BAAAE:aqua-sea|16-5121:60A0A3:meadowbrook|12-5505:C3DBD4:glacier|12-5409:B8E2DC:fair-aqua|12-5209:C3E9E4:soothing-sea|12-5410:BCE3DF:bleached-aqua|13-4909:ACDFDD:blue-light|13-4910:9FD9D7:blue-tint|14-4811:7BC4C4:aqua-sky|12-5204:CFDFDB:morning-mist|14-4908:A8C0BB:harbor-gray|14-4809:A3CCC9:eggshell-blue|16-5114:649B9E:dusty-turquoise|16-4719:5D9CA4:porcelain|18-5610:4C7E86:brittany-blue|18-4718:426972:hydro|15-4707:A5BCBB:blue-haze|15-5210:76A7AB:nile-blue|16-4712:6D9192:mineral-blue|17-4818:558F91:bristol-blue|17-4919:478589:teal|18-5308:486B67:blue-spruce|18-5612:567572:sagebrush-green|16-5806:8A9992:green-milieu|16-5304:95A69F:jadeite|16-5106:90A8A4:blue-surf|17-5111:658C88:oil-blue|17-5110:6A8988:trellis|18-4612:536D70:north-atlantic|18-5112:4C6969:sea-pine|16-4408:8C9FA1:slate|16-4706:8A9A9A:silver-blue|16-4404:8F9E9D:abyss|17-4408:7A898F:lead|18-4711:6E8082:stormy-sea|18-4510:697A7E:trooper|18-4011:5F7278:goblin-blue|16-5804:8A9691:slate-gray|17-5107:7C8C87:chinois-green|18-5611:556962:dark-forest|18-5606:576664:balsam-green|19-0312:55584C:beetle|19-5004:464E4D:urban-chic|19-5212:303D3C:darkest-spruce|19-4318:3A5C6E:mallard-blue|18-4530:006380:celestial|18-4225:1F6680:saxony-blue|19-4340:005871:lyons-blue|19-4234:0B5369:ink-blue|19-4329:18576C:corsair|19-4324:1F495B:legion-blue|18-4320:4E6E81:aegean-blue|18-4222:35637C:bluesteel|18-4023:3B5F78:blue-ashes|19-4127:325B74:midnight|18-4231:09577B:blue-sapphire|19-4342:005E7D:seaport|19-4241:0F4E67:moroccan-blue|19-4535:006175:ocean-depths|19-4526:1B5366:blue-coral|19-4826:2A5C6A:dragonfly|19-4916:1F595C:pacific|19-4820:33565E:balsam|19-4517:32575D:mediterranea|19-4726:274E55:atlantic-deep|15-4717:64A1AD:aqua|16-4610:70A4B0:stillwater|16-4519:6198AE:delphinium-blue|17-4421:3C7D90:larkspur|17-4716:47788A:storm-blue|18-4417:436573:tapestry|18-4522:2D6471:colonial-blue|16-4728:00A0B0:peacock-blue|17-4735:008799:capri-breeze|17-4728:00859C:algiers-blue|17-4730:00849F:caneel-bay|18-4525:00819D:caribbean-sea|18-4528:00758F:mosaic-blue|18-4432:00698B:turkish-tile|14-4814:83C5CD:angel-blue|14-4816:58C9D4:blue-radiance|15-4722:44BBCA:capri|15-4825:32BECC:blue-curacao|16-4725:00ABC0:scuba-blue|16-4834:009DAE:bluebird|18-4733:007A8E:enamel-blue|15-5218:67BCB3:pool-blue|15-5217:53B0AE:blue-turquoise|16-5123:279D9F:baltic|17-4928:008C96:lake-blue|18-4735:008491:tile-blue|17-4724:1A7F8E:pagoda-blue|18-4726:097988:biscay-bay|13-5313:81D7D3:aruba-blue|16-5127:00AAA9:ceramic|17-5126:009499:viridian-green|18-4930:008786:tropical-green|17-5025:008583:navigate|17-5029:008381:deep-peacock-blue|17-5034:008684:lapis|15-5519:45B5AA:turquoise|15-5516:3AB0A2:waterfall|16-5418:4D9E9A:lagoon|16-5422:30A299:bright-aqua|17-5421:108780:porcelain-green|18-5128:007C7A:blue-grass|18-4936:006D70:fanfare|15-5425:00AF9F:atlantis|16-5425:00AF9D:pool-green|17-5330:008E80:dynasty-green|17-5335:009B8C:spectra-green|17-5130:009288:columbia|17-5024:007F7C:teal-blue|18-5020:00736C:parasailing|16-5109:73A89E:wasabi|16-5515:619187:beryl-green|17-5513:4F7C74:deep-sea|17-5722:427D6D:bottle-green|18-5725:29685F:galapagos-green|18-5418:29675C:antique-green|19-5217:035453:storm|16-5721:40A48E:marine-green|16-5421:149C88:sea-green|17-5528:007D69:greenlake|18-5619:0A6F69:tidepool|18-5620:226C63:ivy|18-5424:00675B:cadmium-green|18-5322:005F56:alpine-green|16-5112:6DA29E:canton|16-5412:599F99:agate-green|16-5119:549F98:sea-blue|17-5122:379190:latigo-bay|17-5117:358082:green-blue-slate|18-5121:20706F:bayou|18-5115:316C6B:north-sea|18-5618:36716F:deep-jungle|19-5226:005B5D:everglade|19-4922:006361:teal-green|18-4728:00656E:harbor-blue|18-4834:00656B:deep-lake|19-4524:00585E:shaded-spruce|19-4914:18454B:deep-teal|18-5410:4E6866:silver-pine|19-4818:405E5C:mallard-green|19-5408:395551:bistro-green|19-5413:335959:jasper|18-5315:255958:bayberry|19-5414:264A48:june-bug|19-5320:203B3D:ponderosa-pine|12-5407:D2E8E0:aqua-glass|12-5406:C3DDD6:opal-blue|12-5506:C0DCCD:dusty-aqua|14-5711:8EC5B6:ocean-wave|14-5413:81C3B4:holiday|14-5713:76C1B2:cascade|15-5711:7BB5A3:dusty-jade-green|12-5808:BAE1D3:honeydew|13-6009:AFDDCC:brook-green|13-5714:87D7BE:cabbage|14-5714:7ACCB8:beveled-glass|14-5718:77CFB7:opal|15-5718:55C6A9:biscay-green|15-5819:64BFA4:spearmint|12-5408:C7E5DF:moonlight-jade|12-5507:BAE5D6:bay|13-5409:A1D7C9:yucca|13-5412:96DFCE:beach-glass|13-5414:87D8C3:ice-green|14-5420:58C8B6:cockatoo|15-5416:56BEAB:florida-keys|14-5416:60C9B3:bermuda|14-5721:4BC3A8:electric-green|15-5421:00B89F:aqua-green|16-5427:00AA92:billiard|16-5533:00A28A:arcadia|17-5430:008778:alhambra|17-5633:009276:deep-green|15-5728:00B694:mint-leaf|16-5431:00A78B:peacock-green|17-5638:009E82:vivid-green|17-5641:009473:emerald|17-5734:00846B:viridis|18-5624:006E5B:shady-glade|18-5338:006B54:ultramarine-green|14-5706:A9BDB1:silt-green|15-5706:A3B5A6:frosty-green|16-5808:8C9C92:iceberg-green|16-5907:86A293:granite-green|16-5810:7E9285:green-bay|16-5807:818F84:lily-pad|17-6009:616F65:laurel-wreath|16-5820:589F7E:green-spruce|18-6216:5B7961:comfrey|17-5912:5B7763:dark-ivy|18-6018:3E6F58:foliage-green|18-6114:4F6B58:myrtle|18-5616:325B51:posy-green|19-5920:334D41:pineneedle|17-6212:717E6F:sea-spray|18-6011:53665C:duck-green|18-5622:578270:frosty-spruce|18-5621:3A725F:fir|19-5420:11574A:evergreen|19-5511:335749:hunter-green|19-5513:314F40:dark-green|16-5815:729B8B:feldspar|18-5718:3E6257:smoke-pine|19-5411:355048:trekking-green|18-5913:3E524B:garden-topiary|19-5914:3C4E47:jungle-green|19-5917:35463D:sycamore|19-4906:324241:green-gables|17-0613:807D6F:vetiver|18-0312:6E6E5C:deep-lichen-green|19-0309:50574C:thyme|19-0417:3A4032:kombu-green|19-6110:37413A:deep-forest|19-0414:434237:forest-night|19-0509:36362D:rosin|13-6108:B8CCBA:celadon|13-5305:C1CCC2:pale-aqua|14-4505:BFC8C3:smoke|13-4305:D1D5D0:foggy-dew|14-4502:BAC2BA:mercury|15-5704:B2B6AC:mineral-gray|15-5205:A5B2AA:aqua-gray|12-6206:D8E3D7:fairest-jade|11-0304:DDE3D5:water-lily|12-0108:D6DEC9:canary-green|13-6006:CAD3C1:almost-aqua|13-6106:C5CCC0:green-tint|14-6007:B7C2B2:sea-foam|16-0110:A7AE9E:desert-sage|12-5404:E0E6D7:whisper-green|13-6105:CBCEBE:celadon-tint|13-0107:C4D1C2:dewkist|13-6107:C1CEC1:green-lily|14-6312:AAC0AD:cameo-green|16-6008:959889:seagrass|17-6206:888D82:shadow|12-5504:CEE1D4:clearly-aqua|13-6008:BCD9C8:misty-jade|14-6008:B5CBBB:subtle-green|14-5707:ADC3B4:aqua-foam|13-5907:B2CFBE:gossamer-green|15-5812:9BC2B1:lichen|14-6011:9BBEA9:grayed-jade|12-6205:CFDBD1:milky-green|12-6208:DCE4D7:phantom-green|13-6110:AACEBC:mist-green|13-5911:AACCB9:birds-egg-green|13-6208:BCCAB3:bok-choy|15-6315:A8BBA2:smoke-green|16-5917:709A89:malachite-green|16-0220:8AA282:mistletoe|16-6216:879F84:basil|16-6318:7A9B78:mineral-green|16-0224:7D956D:green-eyes|17-0119:6F8C69:turf-green|17-0220:748C69:watercress|18-0121:547053:elm-green|17-6323:768A75:hedge-green|17-0210:788F74:loden-frost|16-6116:739072:shale-green|17-6319:6F8D6A:kashmir|17-0123:658E67:stone-green|18-0110:61845B:english-ivy|17-6219:558367:deep-grass-green|17-0235:769358:piquant-green|17-0230:6B8D53:forest-green|17-0133:699158:fluorite-green|18-0130:53713D:cactus|19-0230:495E35:garden-green|18-0125:4B6D41:artichoke-green|18-0119:59754D:willow-bough|17-0215:7E9B76:aspen-green|17-6229:3C824E:medium-green|18-6330:3D7245:juniper|18-6320:477050:fairway|18-0117:5F7355:vineyard-green|18-0108:6F7755:dill|19-6311:37503D:greener-pastures|18-0420:616652:four-leaf-clover|18-0317:525F48:bronze-green|19-0323:4A5335:chive|18-0322:545A3E:cypress|19-0315:414F3C:black-forest|19-0419:414832:rifle-green|19-0415:394034:duffel-bag|12-0109:D2E7CA:ambrosia|13-6007:BED3BB:spray|13-0116:B4D3B2:pastel-green|15-6114:97C1A1:hemlock|14-6316:9FC09C:sprucestone|14-6319:8BBA94:meadow|16-6324:77A276:jadesheen|13-0117:A0DAA9:green-ash|14-0127:8BC28C:greengage|15-6120:7CB08A:ming|14-6327:7CB083:zephyr-green|14-6324:82B185:peapod|15-6322:7CB68E:light-grass-green|14-6329:76B583:absinthe-green|14-6017:7FBB9E:neptune-green|16-5919:70A38D:creme-de-menthe|16-5924:4F9E81:winter-green|16-5825:2EA785:gumdrop-green|16-5932:0F9D76:holly-green|17-5735:008C69:parakeet|18-5642:008763:golf-green|14-6330:6BCD9C:spring-bud|16-6030:66BC91:katydid|15-6123:60B892:jade-cream|16-5930:3AA278:ming-green|16-6127:4B9B69:greenbriar|18-6022:378661:leprechaun|17-5923:3A795E:pine-green|16-5942:00A776:blarney|16-5938:00A170:mint|17-5937:009E6D:deep-mint|17-5936:009B75:simply-green|18-5841:007D60:pepper-green|18-5633:007558:bosphorus|19-6026:12674A:verdant-green|13-0111:BFD1B3:seacrest|12-0317:BFD1AD:gleam|14-0121:A7C796:nile-green|15-6317:9EBC97:quiet-green|15-6316:92AF88:fair-green|15-6423:91AC80:forest-shade|16-0228:759465:jade-green|12-0225:B9EAB3:patina-green|13-0221:A9D39E:pistachio-green|14-0123:A3C893:arcadian-green|15-6437:7BB369:grass-green|15-6442:79B465:bud-green|15-6428:86A96F:green-tea|16-0123:89A06B:tendril|13-0220:B2E79F:paradise-green|14-0452:9FC131:lime-green|15-0545:7EC845:jasmine-green|15-0146:79C753:green-flash|16-6340:39A845:classic-green|17-0145:44883C:online-lime|18-0135:476A30:treetop|14-0156:7ED37F:summer-green|14-6340:6DCE87:spring-bouquet|16-6240:2BAE66:island-green|15-6340:45BE76:irish-green|15-6432:6FA26B:shamrock|16-6329:699E6D:peppermint|17-6333:487D49:mint-green|16-6444:4DB560:poison-green|16-6339:55A860:vibrant-green|16-6138:339C5E:kelly-green|15-5534:009B5C:bright-green|17-6153:008C45:fern-green|17-6030:008658:jelly-bean|18-6024:1F7349:amazon|13-0442:B0C965:green-glow|14-0244:97BC62:bright-lime-green|15-0343:88B04B:greenery|16-0237:75A14F:foliage|17-0336:819548:peridot|16-0233:739957:meadow-green|18-0538:7B7F32:woodbine|14-0232:A1CA7B:jade-lime|15-0336:9CAD60:herbal-garden|15-0332:9FAF6C:leaf-green|15-0341:8DB051:parrot-green|16-0435:A0AC4F:dark-citron|16-0230:9BB53E:macaw-green|16-0235:7AAB55:kiwi|13-0535:C6EC7A:sharp-green|12-0435:C9D77E:daiquiri-green|13-0540:C3D363:wild-lime|15-0533:C4BF71:linden-green|14-0445:B5BF50:bright-chartreuse|14-0446:B5CC39:tender-shoots|13-0550:C0D725:lime-punch|12-0741:DFEF87:sunny-lime|13-0645:D3D95F:limeade|13-0650:D5D717:sulphur-spring|15-0548:B8AF23:citronelle|15-0543:B5B644:apple-green|15-0646:C7B63C:warm-olive|16-0840:B9A023:antique-moss|12-0312:D7E8BC:lime-cream|13-0319:CFE09D:shadow-lime|13-0530:CDD78A:lime-sherbet|13-0324:BED38E:lettuce-green|13-0331:AFCB80:sap-green|14-0226:A3C57D:opaline-green|15-0523:B0B487:winter-pear|11-0410:E7EACB:sylvan-green|11-0205:ECEAD0:glass-green|12-0607:E9EAC8:green-essence|11-0609:F1ECCA:ethereal-green|13-0614:DCD8A8:garden-glade|12-0418:D3CCA3:hay|13-0522:CBCE91:pale-green|12-0521:E1E3A9:young-wheat|12-0524:DFDE9B:citron|12-0525:E3EAA5:luminary-green|12-0520:DFE69F:pale-lime-yellow|13-0633:E7DF99:chardonnay|13-0333:E1D590:lima-bean|12-0530:E5E790:charlock|12-0426:D5D593:mellow-green|14-0627:CFC486:shadow-green|13-0532:C5CC7B:celery-green|14-0434:BABC72:green-banana|15-0538:B0B454:green-oasis|15-0628:B7B17A:leek-green|15-0525:B3B17B:weeping-willow|15-0535:AFAF5E:palm|16-0639:AF9841:golden-olive|16-0540:A3A04E:oasis|16-0532:A09D59:moss|17-0840:9A803A:amber-green|17-0836:927B3C:ecru-olive|17-0636:857946:green-moss|16-0726:A39264:khaki|17-0929:998456:fennel-seed|16-0632:9A8B4F:willow|17-0843:9C7E41:bronze-mist|18-0835:997B38:dried-tobacco|18-0840:805D24:tapenade|18-0832:7A6332:plantation|13-0210:C2CBB4:fog-green|13-0212:C5CFB6:tender-greens|13-0608:D0D3B7:aloe-wash|14-0114:B5C1A5:celadon-green|15-6313:ADBBA1:laurel-green|15-6310:A8B197:swamp|15-6414:A1AD92:reseda|12-0106:D3DEC4:meadow-mist|12-0322:CADEA5:butterfly|12-0315:D4DBB2:white-jade|12-0313:CBD5B1:seafoam-green|13-0215:C3D3A8:reed|14-0217:C0CBA1:seedling|14-0115:B4C79C:foam-green|13-0317:C5CF98:lily-green|14-0425:C2C18D:beechnut|14-0223:B4BB85:nile|15-0531:A3A969:sweet-pea|16-0439:909B4C:spinach-green|16-0430:9AA067:fern|17-0535:8D8B55:green-olive|17-0324:849161:epsom|18-0332:77824A:grasshopper|17-0330:81894E:turtle-green|18-0324:757A4E:calliste-green|18-0435:6A6F34:calla-green|18-0328:5E6737:cedar-green|18-0228:595F34:pesto|15-0326:A4AE77:tarragon|16-0421:91946E:sage|18-0525:818455:iguana|17-0115:80856D:oil-green|18-0422:6E7153:loden-green|18-0426:656344:capulet-olive|18-0316:666B54:olivine|14-0216:B6BA99:lint|15-0522:B5AD88:pale-olive-green|15-0318:B2AC88:sage-green|16-0518:A49A79:gray-green|16-1118:A49775:sponge|17-0618:817A65:mermaid|17-0517:746C57:dusky-green|16-0213:999B85:tea|17-0510:938B78:silver-sage|16-0713:A0987C:slate-green|16-0613:A39F86:elm|17-0525:858961:mosstone|17-0620:817A60:aloe|18-0622:756D47:olive-drab|16-0526:928E64:cedar|17-0625:8E855F:boa|17-0627:847A59:dried-herb|18-0527:646A45:olive-branch|18-0629:71643E:lizard|18-0430:676232:avocado|18-0627:67592A:fir-green|14-0418:BAB696:bog|17-1019:8C7C61:elmwood|18-0724:7C6E4F:gothic-olive|18-0830:7A643F:butternut|18-0825:75663E:nutria|19-0622:63563B:military-olive|19-0516:574D35:dark-olive|15-6410:AFAB97:moss-gray|14-6408:ABA798:abbey-stone|18-0521:646049:burnt-olive|18-0515:646356:dusty-olive|19-0512:585442:ivy-green|19-0515:535040:olive-night|19-0511:545144:grape-leaf|15-3800:A7A19E:porpoise|16-3800:9F8D89:satellite|18-1210:847A75:driftwood|18-1304:6D625B:falcon|19-0808:685C53:morel|18-1108:807669:fallen-rock|16-0205:9A9186:vintage-khaki|16-1104:A49887:crockery|16-1109:928475:greige|17-1311:8D7E71:desert-taupe|15-1307:B6A893:white-pepper|15-1304:B7A793:humus|17-1316:937B6A:portabella|18-1017:816D5E:caribou|15-1114:AE997D:travertine|16-1120:B09A77:starfish|15-1218:CEB899:semolina|16-0920:BCA483:curds-and-whey|17-1038:977C61:tigers-eye|18-1029:8B6A4F:toasted-coconut|19-0916:5F4C40:rain-drum|11-0615:F3EAC3:pear-sorbet|12-0718:E7D391:pineapple-slice|12-0758:FACE6D:yarrow|12-0717:F4E3B5:anise-flower|11-0619:F6E3B4:flan|12-0729:EBCF89:sundress|12-0709:E4CFB6:macadamia|12-0711:F6E199:lemon-meringue|11-0622:EEE78E:yellow-iris|12-0737:F8DC6C:goldfinch|13-0756:F9D857:lemon-zest|13-0759:F4BF3A:solar-power|14-0851:FBC85F:samoan-sun|16-1149:C87629:desert-sun|18-1163:A05C17:pumpkin-spice|16-1164:DF7500:orange-pepper|17-1140:C16512:marmalade|18-1249:BB5C14:hawaiian-sunset|17-1342:A15325:autumnal|18-1246:944A1F:umber|17-1349:E86800:exuberance|16-1363:E95C20:puffins-bill|18-1148:864C24:caramel-cafe|16-1449:B45422:gold-flame|18-1345:9B4722:cinnamon-stick|18-1340:9E4624:potters-clay|18-1355:A23C26:rooibos-tea|17-1360:E8703A:celosia-orange|17-1461:E2552C:orangeade|17-1449:C34121:pureed-pumpkin|17-1463:DD4124:tangerine-tango|18-1564:CA3422:poinciana|17-1452:D15837:koi|19-1662:A2242F:samba|19-1757:AA0A27:barbados-cherry|19-1758:A11729:haute-red|18-1657:AA182B:salsa|19-1559:9D202F:scarlet-sage|19-1863:941E32:scooter|19-1555:7D2027:red-dahlia|19-1531:752329:sun-dried-tomato|19-1337:6A2E2A:fired-brick|19-1652:77202F:rhubarb|19-1535:6A282C:syrah|19-1930:6C2831:pomegranate|19-1724:64242E:cabernet|13-2807:F2CFDC:ballerina|13-2802:F2C1D1:fairy-tale|15-1506:A5958F:etherea|16-1710:B98391:foxglove|17-1609:A66E7A:mesa-rose|18-1950:B61C50:jazzy|19-2039:A52350:granita|19-2041:A22452:cherries-jubilee|18-2140:CB3373:cabaret|19-2045:A32857:vivacious|18-3628:9469A2:bellflower|17-3617:9D7BB0:english-lavendar|16-3817:9F86AA:rhapsody|19-3628:46295A:acai|19-3638:563474:tillandsia-purple|18-3635:634878:picasso-lily|18-3620:5F4E72:mystical|15-3908:A9ADC2:icelandic-blue|15-3912:9A9EB3:aleutian|17-3933:81839A:silver-bullet|18-3933:717388:blue-granite|19-3815:2A293E:evening-blue|19-3713:2C2A33:deep-well|19-3924:2A2A35:night-sky|16-3921:96A3C7:blue-heron|16-4030:849BCC:hydrangea|14-3949:B7C0D7:xenon-blue|16-3922:9BA9CA:brunnera-blue|19-3922:262934:sky-captain|19-3923:282D3C:navy-blazer|19-4020:262B37:dark-sapphire|13-4111:BFCAD6:plein-air|13-3920:BDC6DC:halogen-blue|15-4030:9EB4D3:chambray-blue|15-3932:819AC1:bel-air-blue|19-3929:4A556B:vintage-indigo|19-3953:253668:sodalite-blue|19-4022:323441:parisian-night|19-3964:274374:monaco-blue|18-4034:30658E:vallarta-blue|19-4011:282B34:salute|19-4009:2F3441:outer-space|19-4021:2C333E:blueberry|19-4012:272F38:carbon|19-4218:2D3036:vulcan|13-4200:B5CEDF:omphalodes|14-4317:A5C5D9:cool-blue|18-4028:4B5B6E:bering-sea|19-4121:2C4053:blue-wing-teal|19-4033:123955:poseidon|18-4434:005780:mykonos-blue|19-4326:203E4A:reflecting-pond|14-4311:A9CADA:corydalis-blue|14-4310:78BDD4:blue-topaz|14-4511:88C3D0:gulf-stream|15-4714:61AAB1:aquarelle|14-4812:85CED1:aqua-splash|19-5220:12403C:botanical-garden|19-5350:23312D:scarab|13-4108:D5D5D8:nimbus-cloud|14-4105:BABCC0:micro-chip|16-5101:929090:wet-weather|17-4014:807D7F:titanium|18-4016:767275:december-sky|19-3900:524D50:pavement|19-3901:4D4B4F:magnet|16-3850:A19FA5:silver-sconce|17-3911:7F7C81:silver-filigree|17-3907:7E7D88:quicksilver|17-1503:787376:storm-front|18-3907:5E5B60:tornado|18-5210:5C5658:eiffel-tower|19-3927:3B3B48:graphite|16-3915:98979A:alloy|16-3916:92949B:sleet|15-4307:7F8793:tradewinds|18-3912:585E6F:grisaille|19-3918:46444C:periscope|18-4006:66676D:quiet-shade|19-4215:4E545B:turbulence|18-4214:58646D:stormy-weather|19-3910:4E5055:iron-gate|19-3907:48464A:forged-iron|19-0201:434447:asphalt|16-4703:9C9B98:ghost-gray|18-5102:73706F:brushed-nickel|16-4400:94908B:mourning-dove|15-4306:A3A9A6:belgian-block|18-5806:6B7169:agave-green|19-5621:43544B:cilantro|19-5406:213631:pine-grove|19-6050:264E36:eden|18-6030:007844:jolly-green|19-5918:2E3D30:mountain-view|14-0116:B5C38E:margarita|18-0523:5B5A41:winter-moss|19-0307:444940:climbing-ivy|19-0840:3F352F:delicioso|19-0910:433937:mulch|19-1106:392D2B:mole|19-1109:382E2D:chocolate-torte|19-1018:34292A:ganache|19-3909:2E272A:black-bean|19-1103:363031:espresso|19-4008:2B2929:meteorite|19-4004:2A2B2D:tap-shoe|11-1001:EFEBE7:white-alyssum|11-0605:EDE6DE:jet-stream|11-0106:F0EAD6:sweet-cream|11-0110:EFE0CD:buttercream|11-0515:F6EBC8:lemon-icing|11-0607:F3EEE7:sugar-swizzle|11-0608:F0EDE5:coconut-milk|11-0623:ECE99B:yellow-pear|11-1302:F1E6DE:sea-salt|11-4001:EDF1FE:brilliant-white|11-4302:F0EFE2:cannoli-cream|11-4801:E8E3D9:tofu|12-0110:D7CFBB:pistachio-shell|12-0646:EBDF67:celandine|12-0742:F3E779:lemon-verbena|12-1110:F5D6C6:creme-de-peche|12-1813:F7D1D4:marys-rose|12-2901:DFCDC6:morganite|12-2907:F8E0E7:rose-water|12-4301:D6CEBE:almond-milk|13-0443:C0DB3A:lime-popsicle|13-0644:F3DD3E:golden-kiwi|13-0646:EAD94E:meadowlark|13-0651:CCDB1E:evening-primrose|13-0849:FED450:habanero-gold|13-0851:FED55D:minion-yellow|13-0919:D2C29D:soybean|13-0946:E7AA56:jurassic-gold|13-1105:C7BBA4:brown-rice|13-1125:F5B895:peach-quartz|13-1208:E2BDB3:peachy-keen|13-1308:DACAB7:brazilian-sand|13-1511:F7CDC7:pink-salt|13-1520:F7CAC9:rose-quartz|13-2808:EBCED5:ballet-slipper|13-3207:F7CEE0:cherry-blossom|13-4104:C6C5C6:antarctica|13-4201:C3C6C8:oyster-mushroom|13-4720:91DCE8:tanager-turquoise|13-4810:98DDDE:limpet-shell|13-5410:ABD3DB:iced-aqua|14-0340:BADF30:acid-lime|14-0952:D8AE47:spicy-mustard|14-1052:FBAA4C:kumquat|14-1208:C0AC92:irish-cream|14-1241:F9AA7D:orange-chiffon|14-1315:CFB095:hazelnut|14-1803:D4BAB6:sepia-rose|14-3906:B1AAB3:raindrops|14-3912:9FA9BE:zen-blue|14-4107:B9BABD:quiet-gray|14-4122:92B6D5:airy-blue|14-4202:AFB1B4:harbor-mist|14-4315:98BFCA:sea-angel|14-4320:79B5DB:baltic-sea|14-4615:83C2CD:antiqua-sand|14-4620:95DEE3:island-paradise|14-4710:82C2C7:tibetan-stone|15-0960:D69C2F:mango-mojito|15-1020:BFA58A:ginger-root|15-1040:B18F6A:iced-coffee|15-1045:D9922E:autumn-blaze|15-1051:D7942D:golden-orange|15-1125:CCA580:porcini|15-1151:F4963A:iceland-poppy|15-1243:FEA166:papaya|15-1262:FE8C18:carrot-curl|15-1264:FE840E:turmeric|15-1335:FE7E03:tangelo|15-1425:C0916C:fenugreek|15-1429:CC7357:dusted-clay|15-1430:BD8C66:pastry-shell|15-1520:EB9687:blooming-dahlia|15-3520:B99BC5:crocus-petal|15-3716:B09FCA:purple-rose|15-3720:B3A0C9:lilac-breeze|15-3919:91A8D0:serenity|15-4428:5DAFCE:crystal-seas|16-0543:9A9738:golden-lime|16-0545:9C9A40:split-pea|16-0550:ABA44D:lentil-sprout|16-1103:ADA396:pure-cashmere|16-1345:D27F63:sun-baked|16-1347:C5733D:peach-caramel|16-1348:C57644:tomato-cream|16-1358:F96714:orange-tiger|16-1438:A46F44:meerkat|16-1453:F96531:exotic-orange|16-1460:FC642D:dragon-fire|16-1545:F77464:coral-quartz|16-1548:F7786B:peach-echo|16-1606:98878C:purple-dove|16-3720:9F90C1:sand-verbena|16-3905:9896A4:lilac-gray|16-4033:5D81BB:granada-sky|17-0630:988C75:tree-house|17-0949:B1832F:chai-tea|17-1052:93592B:roasted-pecan|17-1105:918579:roasted-cashew|17-1108:948A7A:winter-twig|17-1115:8D7960:petrified-oak|17-1142:8B593E:argan-oil|17-1145:C46215:autumn-maple|17-1314:897560:sepia-tint|17-1345:B95B3F:spice-route|17-1361:F45520:scarlet-ibis|17-1450:BE4B3B:summer-fig|17-1708:725F69:moonscape|17-1926:CE5B78:fruit-dove|17-2034:CE3175:pink-yarrow|17-2411:988088:toadstool|17-3240:B76BA3:bodacious|17-3520:9879A2:diffused-orchid|17-3640:9479AF:fairy-wren|17-3735:9787BB:sunlit-allium|17-3914:838487:sharkskin|17-3929:8895C5:pale-iris|17-3940:707BB4:iolite|17-4016:848182:gray-flannel|17-4028:4C6A92:riverside|17-4029:5A789A:quiet-harbor|17-4032:5D89B3:lichen-blue|17-4033:5480AC:pacific-coast|17-4245:007CB7:ibiza-blue|17-4429:3183A0:navagio-bay|17-4530:0084A1:barrier-reef|17-0530:797B3A:guacamole|18-0107:5A7247:kale|18-0220:65663F:mayfly|18-0330:4E632C:twist-of-lime|18-0625:716A4D:martini-olive|18-1028:684832:emperador|18-1049:AB6819:thai-curry|18-1050:A86217:honey-ginger|18-1155:935529:sugar-almond|18-1325:783937:spiced-apple|18-1440:8E3C36:chili-oil|18-1506:675657:plum-truffle|18-1541:73362A:brandy-brown|18-1549:BC322C:valiant-poppy|18-1551:B4262A:aura-orange|18-1653:B61032:toreador|18-1654:BA0B32:lychee|18-1659:B91228:goji-berry|18-1705:735B6A:arctic-dusk|18-1708:6F5965:ephemera|18-1759:B2103C:jalapeno-red|18-1951:C01352:love-potion|18-2045:C62168:pink-peacock|18-3014:7B4368:grape-kiss|18-3120:8E4483:willowherb|18-3340:632A60:charisma|18-3521:624076:plum-jam|18-3530:936A98:lavender-crystal|18-3540:6F4685:purple-sapphire|18-3634:7D5D99:chive-blossom|18-3839:5A4E8F:purple-corallite|18-3908:615C60:volcanic-glass|18-3917:4D587A:gray-blue|18-3929:4E6482:blue-horizon|18-3950:5B609E:iris-bloom|18-4048:2D62A3:nebulas-blue|18-4250:006CA9:indigo-bunting|18-4430:007290:fjord-blue|18-4538:0078A7:hawaiian-surf|18-4630:006B7E:tahitian-tide|18-5025:006865:quetzal-green|18-5204:615E5F:granite-gray|18-5845:006E51:lush-meadow|19-0203:49494D:gray-pinstripe|19-0403:5E5749:sea-turtle|19-0413:46483C:deep-depths|19-0510:5F5B4C:kalamata|19-0823:5D5348:crocodile|19-1110:3C2D2E:chocolate-plum|19-1214:5C3E35:chocolate-lab|19-1215:543B35:shaved-chocolate|19-1224:5D4236:fondue-fudge|19-1233:634235:tiramisu|19-1234:5A3E36:rocky-road|19-1419:4A342E:chicory-coffee|19-1429:6E362C:smoked-paprika|19-1432:56352D:chocolate-fondant|19-1435:66352B:cherry-mahogany|19-1534:72262C:merlot|19-1536:7B3539:red-pear|19-2420:4D233D:pickled-beet|19-2429:61224A:plum-caspia|19-2620:47243B:winter-bloom|19-3425:6D4773:spiced-plum|19-3750:3E285C:violet-indigo|19-3831:27293D:maritime-blue|19-3902:3A363B:obsidian|19-3911:26262A:black-beauty|19-3917:4D4B50:blackened-pearl|19-3930:434452:odyssey-gray|19-4003:2B272B:black-onyx|19-4029:223A5E:navy-peony|19-4031:35435A:sargasso-sea|19-4034:0E3A53:sailor-blue|19-4038:123850:gibraltar-sea|19-4045:004B8D:lapis-blue|19-4048:155187:baleine-blue|19-4055:2A4B7C:galaxy-blue|19-4120:0F3B57:blue-opal|19-4122:293B4D:moonlit-ocean|19-4126:29495C:deep-dive|19-4536:00637C:crystal-teal|19-4540:005265:deep-lagoon|19-5030:254445:sea-moss|19-5230:184A45:forest-biome|19-5232:15463E:rain-forest';

let _pantoneTable = null;
function pantoneTable() {
  if (_pantoneTable) return _pantoneTable;
  _pantoneTable = PANTONE_TCX_RAW.split('|').map((row) => {
    const p = row.split(':');
    const n = parseInt(p[1], 16);
    return { code: p[0], hex: '#' + p[1], name: p[2],
      lab: rgbToLab([(n >> 16) & 255, (n >> 8) & 255, n & 255]) };
  });
  return _pantoneTable;
}

// التحويل إلى فضاء Lab: المسافة فيه تقارب ما تراه العين، بخلاف RGB
function rgbToLab(c) {
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const lin = (v) => { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; };
  const r = lin(c[0]), g = lin(c[1]), b = lin(c[2]);
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const Y = (r * 0.2126 + g * 0.7152 + b * 0.0722);
  const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const fx = f(X), fy = f(Y), fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

// أقرب بانتون للون معطى. deltaE يُرجَع ليمكن عرض جودة المطابقة.
function nearestPantone(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const lab = rgbToLab([(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  let best = null, bestD = Infinity;
  for (const p of pantoneTable()) {
    const d = Math.sqrt(
      Math.pow(lab[0] - p.lab[0], 2) +
      Math.pow(lab[1] - p.lab[1], 2) +
      Math.pow(lab[2] - p.lab[2], 2));
    if (d < bestD) { bestD = d; best = p; }
  }
  if (!best) return null;
  return { code: best.code + ' TCX', name: best.name, hex: best.hex, deltaE: Math.round(bestD * 10) / 10 };
}

const cDist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

// تجميع بلا اختراع: كل مركز هو متوسط بكسلات حقيقية من الصورة
function clusterColors(points, k) {
  if (!points.length) return [];
  const kk = Math.min(k, points.length);
  const cents = [points[Math.floor(points.length / 2)].slice()];
  const step = Math.max(1, Math.floor(points.length / 400));
  while (cents.length < kk) {
    let far = null, farD = -1;
    for (let i = 0; i < points.length; i += step) {
      let d = Infinity;
      for (const c of cents) { const dd = cDist(points[i], c); if (dd < d) d = dd; }
      if (d > farD) { farD = d; far = points[i]; }
    }
    cents.push((far || points[0]).slice());
  }
  const assign = new Array(points.length).fill(0);
  for (let it = 0; it < 12; it++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      let bi = 0, bd = Infinity;
      for (let c = 0; c < cents.length; c++) {
        const d = cDist(points[i], cents[c]);
        if (d < bd) { bd = d; bi = c; }
      }
      if (assign[i] !== bi) { assign[i] = bi; moved = true; }
    }
    const sums = cents.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < points.length; i++) {
      const s = sums[assign[i]];
      s[0] += points[i][0]; s[1] += points[i][1]; s[2] += points[i][2]; s[3]++;
    }
    sums.forEach((s, c) => { if (s[3] > 0) cents[c] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
    if (!moved) break;
  }
  const counts = cents.map(() => 0);
  assign.forEach((a) => { counts[a]++; });
  return cents.map((c, i) => ({ rgb: c, share: counts[i] / points.length }))
    .filter((x) => x.share > 0.02).sort((a, b) => b.share - a.share);
}

function useExtractedColors(image, maxColors) {
  const [cols, setCols] = useState(null);
  useEffect(() => {
    if (!image) { setCols(null); return; }
    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const W = 220;
        const H = Math.max(60, Math.round((img.height / img.width) * W));
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, W, H);
        const data = ctx.getImageData(0, 0, W, H).data;

        // لون الخلفية: أغلب لون على الإطار الخارجي
        const bag = new Map();
        const push = (x, y) => {
          const i = (y * W + x) * 4;
          const key = (data[i] >> 4) + ',' + (data[i + 1] >> 4) + ',' + (data[i + 2] >> 4);
          const e = bag.get(key) || { n: 0, s: [0, 0, 0] };
          e.n++; e.s[0] += data[i]; e.s[1] += data[i + 1]; e.s[2] += data[i + 2];
          bag.set(key, e);
        };
        for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
        for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
        let bg = [255, 255, 255], best = null;
        bag.forEach((e) => { if (!best || e.n > best.n) best = e; });
        if (best) bg = best.s.map((v) => v / best.n);

        const pts = [];
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 200) continue;
          const c3 = [data[i], data[i + 1], data[i + 2]];
          if (cDist(c3, bg) < 70) continue;              // خلفية
          if (Math.max(c3[0], c3[1], c3[2]) < 28) continue;  // ظل أسود
          if (Math.min(c3[0], c3[1], c3[2]) > 238) continue; // وهج أبيض
          pts.push(c3);
        }
        const out = clusterColors(pts, maxColors || 6)
          .map((x) => ({ hex: toHex(x.rgb), rgb: x.rgb.map((v) => Math.round(v)), share: Math.round(x.share * 1000) / 10 }));
        if (!cancelled) setCols(out.length ? out : null);
      } catch (e) { if (typeof console !== "undefined") console.warn("[gh]", e && e.message); if (!cancelled) setCols(null); }
    };
    img.onerror = () => { if (!cancelled) setCols(null); };
    img.src = image;
    return () => { cancelled = true; };
  }, [image, maxColors]);
  return cols;
}

// دمج: أسماء الأجزاء من التحليل، وأكواد الألوان من البكسل.
// كل جزء يأخذ أقرب لون مستخرج للون الذي خمّنه النموذج، فيبقى الوصف صحيحاً
// ويصبح الكود مضبوطاً. الألوان المستخرجة غير المستخدمة تُضاف كما هي.
function mergeColorway(declared, extracted) {
  if (!extracted || !extracted.length) return declared || [];
  const hexToRgb = (h) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(h || ''));
    if (!m) return null;
    const v = parseInt(m[1], 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  };
  const pool = extracted.slice();
  const out = (declared || []).map((d) => {
    const rgb = hexToRgb(d.hex);
    let bi = 0;
    if (rgb) {
      let bd = Infinity;
      pool.forEach((e, i) => { const dd = cDist(rgb, e.rgb); if (dd < bd) { bd = dd; bi = i; } });
    }
    const pick = pool.splice(bi, 1)[0] || extracted[0];
    // الكود يُشتقّ من اللون المسحوب فعلاً، لا من تخمين النموذج
    const pt = nearestPantone(pick.hex);
    return { ...d, hex: pick.hex, share: pick.share,
      pantone: pt ? pt.code : d.pantone, pantoneName: pt ? pt.name : '', deltaE: pt ? pt.deltaE : null };
  });
  pool.forEach((e) => {
    const pt = nearestPantone(e.hex);
    out.push({ part: '', hex: e.hex, share: e.share,
      pantone: pt ? pt.code : '', pantoneName: pt ? pt.name : '', deltaE: pt ? pt.deltaE : null });
  });
  return out.sort((a, b) => (b.share || 0) - (a.share || 0));
}

const DEFAULT_VIEW_BOX = { top: 6, bottom: 95, left: 22, right: 78 };

// منظر واحد مشروح: خطوط القياس تعبر جسم القطعة، والدوائر/التسميات على جهة labelSide

// ===========================================================================
// محرّك مواقع الليبلات — يُحسب من جدول القياسات، لا يُخمَّن.
// محايد تجاه نوع القطعة: لا فستان ولا بنطلون في هذا الكود.
// ===========================================================================
const LANDMARKS = [
  ['topedge',  /top\s*edge|upper\s*edge|waistband\s*top/i],
  ['neck',     /\bneck|collar/i],
  ['shoulder', /shoulder|\byoke\b/i],
  ['chest',    /\bchest\b|across\s*front|across\s*back|\bbp\s*-?\s*bp\b|bust\s*point|cup\s*height/i],
  ['bust',     /\bbust\b|\bcup\b/i],
  ['armhole',  /armhole|underarm|\bbicep\b|sleeve\s*cap|muscle/i],
  ['elbow',    /elbow/i],
  ['waist',    /\bwaist\b/i],
  ['highhip',  /high\s*hip/i],
  ['hip',      /\bhip\b|\bseat\b/i],
  ['crotch',   /\bcrotch\b|\brise\b/i],
  ['cuff',     /\bcuff\b|sleeve\s*opening|sleeve\s*hem/i],
  ['thigh',    /\bthigh\b/i],
  ['knee',     /\bknee\b|flare\s*break/i],
  ['calf',     /\bcalf\b/i],
  ['ankle',    /\bankle\b|leg\s*opening|hem\s*opening/i],
  ['hem',      /\bhem\b|sweep|\bhfs\b|\bhbs\b|bottom\s*edge|\btrain\b/i],
];
const LM_RANK = {};
LANDMARKS.forEach(([k], i) => { LM_RANK[k] = i; });

function landmarkOf(text, full) {
  // الاسم قبل القوس هو الهوية؛ الوصف داخل القوس يذكر نقاطاً مرجعية أخرى
  const t = full ? (text || '') : String(text || '').split('(')[0];
  for (const [key, re] of LANDMARKS) if (re.test(t)) return key;
  return null;
}
const VERTICAL_POM_RE = /position|height|drop|depth|\brise\b|from\s*top/i;
// الأطوال الممتدة: تُستبعد من كونها مراسي لأنها مسافات لا نقاط.
const SPAN_POM_RE = /\bcfl\b|\bcbl\b|center\s*(front|back)\s*length|side\s*seam\s*length|outseam|inseam|zipper\s*length|train\s*length|lining\s*length|sleeve\s*length|overall\s*length|\bback\s*length\b|\bfront\s*length\b/i;

// ما يُرسم سهماً رأسياً على الرسمة: الأطوال الممتدة، وكل قياس ارتفاع أو عمق
// أو دروب أو موضع — فهذه مسافات رأسية، ورسمها خطاً أفقياً عابراً للقطعة خطأ.
// منفصل عن السابق عمداً: "Waist Position" مرساةٌ تحدّد موضع الخصر، وفي الوقت
// نفسه يُرسم سهماً رأسياً إن ظهر كليبل. خلط النمطين يُفقد المرساة.
const VERTICAL_DRAW_RE = new RegExp(SPAN_POM_RE.source + '|\\bheight\\b|\\bdepth\\b|\\bdrop\\b|\\bposition\\b|\\brise\\b', 'i');

function pomVal(row, size) {
  if (!row || !row.sizes) return null;
  const v = row.sizes[String(size)] ?? row.sizes[size];
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}
function totalLen(rows, size, view) {
  const full = /center\s*(front|back)\s*length|side\s*seam\s*length|outseam|overall\s*length|garment\s*length|\bback\s*length\b|\bfront\s*length\b/i;
  let best = null;
  rows.forEach((r) => {
    if (!full.test(r.pom || '')) return;
    const v = pomVal(r, size); if (v == null || v <= 0) return;
    const same = (r.view || 'front') === view;
    if (best == null || (same && !best.same) || (same === best.same && v > best.v)) best = { v, same };
  });
  if (best) return best.v;
  // لا احتياط بأكبر رقم في الجدول: أكبر رقم قد يكون عرضاً لا طولاً،
  // فيصير الخصر بعرض 35 سم "طول القطعة" وتنهار كل النسب بصمت.
  // غياب قياس طول كامل خللٌ يُبلَّغ عنه، لا يُرقَّع.
  return null;
}
function relationOf(pom) {
  const m = /(\d+(?:\.\d+)?)\s*cm\s*(below|under|down\s*from|above)\s*(?:the\s+)?([a-z\s]+)/i.exec(pom || '');
  if (!m) return null;
  const lm = landmarkOf(m[3], true); if (!lm) return null;
  return { from: lm, delta: (/above/i.test(m[2]) ? -1 : 1) * parseFloat(m[1]) };
}
function buildAnchors(rows, size, view) {
  const total = totalLen(rows, size, view);
  if (!total || total <= 0) return null;
  const cm = { topedge: 0, hem: total };
  rows.forEach((r) => {
    const pom = r.pom || '';
    if (SPAN_POM_RE.test(pom) || !VERTICAL_POM_RE.test(pom) || relationOf(pom)) return;
    const lm = landmarkOf(pom); const v = pomVal(r, size);
    if (!lm || v == null || v < 0 || v > total) return;
    if (cm[lm] == null) cm[lm] = v;
  });
  // أعلى معلم مذكور في الجدول هو الحافة العليا للقطعة نفسها
  let minRank = null;
  rows.forEach((r) => {
    const lm = landmarkOf(r.pom);
    if (lm && LM_RANK[lm] != null && (minRank == null || LM_RANK[lm] < minRank)) minRank = LM_RANK[lm];
  });
  if (minRank != null) {
    const k = LANDMARKS[minRank][0];
    // لا تدهس مسافة مقيسة صريحة: إن كان للمعلم قياس رأسي في الجدول فهو
    // المرجع، والترسية عند الصفر تخصّ المعالم التي لا قياس لها فقط.
    if (cm[k] == null) cm[k] = 0;
  }
  for (let pass = 0; pass < 4; pass++) {
    rows.forEach((r) => {
      const pom = r.pom || ''; if (SPAN_POM_RE.test(pom)) return;
      const rel = relationOf(pom); if (!rel) return;
      const lm = landmarkOf(pom); if (!lm || cm[lm] != null) return;
      const base = cm[rel.from]; if (base == null) return;
      const v = base + rel.delta; if (v >= 0 && v <= total) cm[lm] = v;
    });
  }
  const known = Object.keys(cm).filter((k) => LM_RANK[k] != null && cm[k] != null)
    .map((k) => ({ rank: LM_RANK[k], v: cm[k] })).sort((a, b) => a.rank - b.rank);
  LANDMARKS.forEach(([k], rank) => {
    if (cm[k] != null) return;
    let lo = null, hi = null;
    for (const p of known) { if (p.rank < rank) lo = p; if (p.rank > rank && hi == null) hi = p; }
    if (lo && hi && hi.rank !== lo.rank) cm[k] = lo.v + ((rank - lo.rank) / (hi.rank - lo.rank)) * (hi.v - lo.v);
  });
  cm.__total = total;
  return cm;
}
const pClamp = (p) => Math.max(0.5, Math.min(99.5, Math.round(p * 10) / 10));
function computeY(text, cm) {
  const rel = relationOf(text);
  if (rel && cm[rel.from] != null) return pClamp(((cm[rel.from] + rel.delta) / cm.__total) * 100);
  const lm = landmarkOf(text);
  if (!lm || cm[lm] == null) return null;
  return pClamp((cm[lm] / cm.__total) * 100);
}
// فضّ التداخل بالاسترخاء المتوازن: المتصادمان يتقاسمان الإزاحة
function relaxRows(list, minGap) {
  if (list.length < 2) return list;
  for (let pass = 0; pass < 40; pass++) {
    let moved = false;
    for (let i = 1; i < list.length; i++) {
      const gap = list[i].y - list[i - 1].y;
      if (gap < minGap - 0.01) {
        const push = (minGap - gap) / 2;
        list[i - 1].y = pClamp(list[i - 1].y - push);
        list[i].y = pClamp(list[i].y + push);
        moved = true;
      }
    }
    if (!moved) break;
  }
  for (let i = 1; i < list.length; i++) if (list[i].y <= list[i - 1].y) list[i].y = pClamp(list[i - 1].y + minGap);
  for (let i = list.length - 2; i >= 0; i--) if (list[i].y >= list[i + 1].y) list[i].y = pClamp(list[i + 1].y - minGap);
  return list;
}
function labelPositions(items, measurements, size, view) {
  const rows = Array.isArray(measurements) ? measurements : [];
  const cm = buildAnchors(rows, size, view);
  const horiz = [], vert = [];
  (items || []).forEach((it, i) => {
    const text = typeof it === 'string' ? it : (it.label || it.target || it.text || '');
    if (!text) return;
    const base = typeof it === 'object' ? it : {};
    if (VERTICAL_DRAW_RE.test(text)) {
      let top = 1.5, bottom = 99;
      if (cm) {
        const hit = rows.find((r) => sameLabelName(r.pom, text));
        const len = hit ? pomVal(hit, size) : null;
        if (/\btrain\b/i.test(text) && len != null) top = pClamp(((cm.__total - len) / cm.__total) * 100);
        else if (len != null && len < cm.__total) bottom = pClamp((len / cm.__total) * 100);
      }
      vert.push({ ...base, text, top, bottom });
      return;
    }
    const y = cm ? computeY(text, cm) : null;
    // لا اختراع موقع: ما تعذّر حسابه يُعلَّم uncomputed ويظهر للمصممة.
    horiz.push({ ...base, text,
      y: y != null ? y : pClamp(8 + i * (84 / Math.max((items.length - 1), 1))),
      uncomputed: y == null });
  });
  horiz.sort((a, b) => a.y - b.y);
  return { horizontal: relaxRows(horiz, 3.5), vertical: vert };
}
function sameLabelName(pom, label) {
  const norm = (x) => String(x || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z]/g, '');
  const a = norm(pom), b = norm(label);
  return a && b && (a.includes(b) || b.includes(a));
}


// ===========================================================================
// تصحيح حتمي لقائمة الخامات. لا عدد ثابت ولا بنود مفروضة.
// القائمة تتبع التصميم؛ والبوم هو المصفوفة نفسها مرقّمة، فلا يختلف الرقمان.
// ===========================================================================
const MAT_GROUPS = [
  ['shell',      /shell|main\s*fabric|body\s*fabric|outer\s*fabric|face\s*fabric|satin|crepe|wool|denim|twill|gabardine|velvet|jacquard|brocade|silk(?!\s*thread)|cotton|linen|georgette|organza|taffeta|tweed/i],
  ['overlay',    /overlay|godet|panel\s*fabric|tulle(?!.*embroider)|chiffon|mesh|net\b/i],
  ['lace',       /\blace\b|guipure|chantilly|embroidered\s*(tulle|net|mesh|fabric)|eyelet|broderie/i],
  ['lining',     /lining|underlining|interlining(?!\s*fusible)/i],
  ['structure',  /boning|channel\s*tape|horsehair|crinoline|padding|shoulder\s*pad|wadding|batting|elastic|waistband\s*(tape|stiffener)|petersham|grosgrain/i],
  ['closure',    /zipper|\bzip\b|button|snap|hook|eye\b|velcro|buckle|clasp|drawstring|toggle/i],
  ['stabilizer', /interfacing|fusible|stay\s*tape|seam\s*tape|edge\s*tape|bias\s*binding|twill\s*tape/i],
  ['embellish',  /hand-?applied|bead|pearl|crystal|rhinestone|sequin|stone|applique|embroidery\s*thread|trim(?!\s*tape)|fringe|tassel|feather|stud/i],
  ['label',      /label|\btag\b|care\s*instruction|brand\s*mark|size\s*label|composition/i],
  ['thread',     /thread\s*set|sewing\s*thread|\bthread\b/i],
  ['hanger',     /hanger|\bhook\s*rail/i],
  ['packaging',  /garment\s*bag|poly\s*bag|packaging|\bbag\b|tissue\s*paper|box\b/i],
];
const MAT_ORDER = {};
MAT_GROUPS.forEach(([k], i) => { MAT_ORDER[k] = i; });

function matGroup(m) {
  // الاسم يحسم أولاً: وصف الخامة يذكر أقمشة أخرى بطبيعته
  for (const [key, re] of MAT_GROUPS) if (re.test(m.name || '')) return key;
  const hay = [m.placement, m.description].filter(Boolean).join(' ');
  for (const [key, re] of MAT_GROUPS) if (re.test(hay)) return key;
  return 'shell';
}
const matKey = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function matDedupe(list) {
  const out = [];
  list.forEach((m) => {
    const k = matKey(m.name); if (!k) return;
    const hit = out.find((o) => matKey(o.name) === k);
    if (!hit) { out.push({ ...m }); return; }
    if ((m.placement || '').length > (hit.placement || '').length) hit.placement = m.placement;
    const a = parseFloat(hit.qty), b = parseFloat(m.qty);
    if (Number.isFinite(b) && (!Number.isFinite(a) || b > a)) hit.qty = m.qty;
  });
  return out;
}

// البندان الإلزاميان الوحيدان: ليبل التركيب والمقاس، وليبل العناية
const MAT_REQUIRED = [
  { test: /composition|fabric\s*(content|label)|size\s*label|main\s*label|brand\s*label/i,
    item: { name: 'Fabric composition and size label',
      placement: 'Interior center-back neckline or inner side seam',
      description: 'Woven label stating fibre composition and size',
      qty: '1', unit: 'pc',
      photoPrompt: 'Professional studio product photograph of a single blank woven garment label with no text or logo, macro detail, soft even lighting, photorealistic. No watermark.' } },
  { test: /care\s*(instruction|label)|washing\s*label|care\s*tag/i,
    item: { name: 'Care instruction label',
      placement: 'Stitched behind the composition label at the inner side seam',
      description: 'Satin care label with wash, dry and press symbols matched to the fabrics used',
      qty: '1', unit: 'pc',
      photoPrompt: 'Professional studio product photograph of a single satin care instruction label with laundry symbols, macro detail, soft even lighting, photorealistic. No watermark.' } },
];

// الخرز واللؤلؤ والدانتيل: تُضاف فقط إن رآها التحليل في التصميم
const MAT_CUES = [
  [/\bpearl/i, { name: 'Pearl embellishments', placement: 'Hand-applied over the embellished areas of the design',
    description: 'Round glass or resin pearls in mixed sizes, hand-stitched with fine beading thread', qty: '', unit: 'pcs',
    photoPrompt: 'Professional studio product photograph of loose round pearls in mixed sizes scattered on fabric, macro detail, soft even lighting, photorealistic. No watermark.' }],
  [/\bbead|beading|beaded/i, { name: 'Bead embellishments', placement: 'Hand-applied over the embellished areas of the design',
    description: 'Glass seed and bugle beads in mixed sizes, hand-stitched with fine beading thread', qty: '', unit: 'pcs',
    photoPrompt: 'Professional studio product photograph of loose glass seed and bugle beads scattered on fabric, macro detail, soft even lighting, photorealistic. No watermark.' }],
  [/\blace\b|guipure|chantilly|broderie/i, { name: 'Lace fabric', placement: 'Panels and edges where lace appears on the design',
    description: 'Corded lace on fine net ground, colour matched to the design', qty: '', unit: 'm',
    photoPrompt: 'Professional studio product photograph of a piece of corded lace fabric on plain background, macro detail showing the net ground, soft even lighting, photorealistic. No watermark.' }],
];

function normalizeMaterials(raw, cues, hex, pantone) {
  let list = Array.isArray(raw) ? raw.filter((m) => m && m.name) : [];
  list = matDedupe(list);

  const hay = (cues || []).filter(Boolean).join(' ');
  MAT_CUES.forEach(([re, item]) => {
    if (!re.test(hay)) return;
    if (list.some((m) => re.test([m.name, m.description].join(' ')))) return;
    list.push({ ...item });
  });

  MAT_REQUIRED.forEach((req) => {
    if (list.some((m) => req.test.test([m.name, m.placement, m.description].join(' ')))) return;
    list.push({ ...req.item });
  });

  list = list.map((m, i) => ({ m, i, g: MAT_ORDER[matGroup(m)] }))
    .sort((a, b) => (a.g - b.g) || (a.i - b.i)).map((x) => x.m);

  // اللون الحقيقي يُحقن في برومبت الصورة بدل ترك النموذج يسمّي اللون
  if (hex) {
    const tint = pantone ? (hex + ' (PANTONE ' + pantone + ')') : hex;
    list = list.map((m) => {
      const g = matGroup(m);
      if (g === 'label' || g === 'packaging' || g === 'hanger') return m;
      if (!m.photoPrompt || m.photoPrompt.includes(hex)) return m;
      return { ...m, photoPrompt: m.photoPrompt.replace(/\.\s*No\s+watermark/i, ', exact colour ' + tint + '. No watermark') };
    });
  }
  return list.map((m, i) => ({ ...m, num: i + 1 }));
}

// كل رقم كول أوت يجب أن يشير إلى خامة موجودة فعلاً
function pruneCallouts(callouts, materials) {
  const max = materials.length;
  return (callouts || []).filter((c) => Number.isFinite(+c.num) && +c.num >= 1 && +c.num <= max);
}

function AnnotatedView({ image, mode, items, caption, labelSide, measurements, sampleSize, view }) {
  const detected = useImgBox(image);
  // لا بديل ملوّن في الصفحات التقنية: مربع فارغ يقول السبب أفضل من صفحة
  // تبدو سليمة وهي مخالفة للنموذج.
  if (!image) {
    return (
      <div className="tp-view">
        <div className="tp-img-ph tp-img-miss" style={{ aspectRatio: '2/3' }}>
          <span>تعذّر توليد الرسمة التقنية لهذا المنظر — أعيدي التوليد</span>
        </div>
        <div className="tp-view-cap">{caption}</div>
      </div>
    );
  }
  const box = detected || DEFAULT_VIEW_BOX;

  // المواقع تُحسب من جدول القياسات نفسه. لم يعد النموذج يُرجع أي رقم موقع.
  const pos = labelPositions(items, measurements, sampleSize, view || 'front');
  const vertical = mode === 'measure' ? pos.vertical : [];
  const horizontal = mode === 'measure'
    ? pos.horizontal
    : labelPositions(items, measurements, sampleSize, view || 'front').horizontal.concat(
        pos.vertical.map((v) => ({ ...v, y: v.top })));
  const rows = horizontal.map((it) => ({
    ...it,
    top: box.top + (it.y / 100) * (box.bottom - box.top),
  }));

  const bw = Math.max(box.right - box.left, 20);

  return (
    <div className="tp-view">
      <div className="tp-anno">
        <img src={image} alt={caption} crossOrigin="anonymous" />

        {mode === 'measure' && rows.map((r, i) => (
          <div className={'tp-m-wrap' + (r.uncomputed ? ' uncomputed' : '')} key={'m' + i} style={{ top: r.top + '%', left: box.left + '%', width: bw + '%' }}>
            <span className="tp-m-label">{r.text}{r.uncomputed ? ' ⚠' : ''}</span>
            <i className="tp-m-line"></i>
          </div>
        ))}
        {mode === 'measure' && vertical.map((v, i) => (
          <div className="tp-anno-vert" key={'v' + i}
            style={{ left: Math.min(box.right + 2.5 + i * 4.5, 96) + '%',
              top: (box.top + (v.top / 100) * (box.bottom - box.top)) + '%',
              bottom: (100 - (box.top + (v.bottom / 100) * (box.bottom - box.top))) + '%' }}>
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
function AnnotatedPair({ frontImage, backImage, mode, front, back, measurements, sampleSize }) {
  return (
    <div className="tp-img-frame">
      <div className="tp-pair">
        <AnnotatedView image={frontImage} mode={mode} items={front} caption="FRONT" labelSide="left"
          measurements={measurements} sampleSize={sampleSize} view="front" />
        <AnnotatedView image={backImage} mode={mode} items={back} caption="BACK" labelSide="right"
          measurements={measurements} sampleSize={sampleSize} view="back" />
      </div>
    </div>
  );
}

// صفحة DETAILED VIEWS: لقطات مقرّبة مقصوصة من صورة التصميم المرجعية نفسها —
// حتمية 100% وبلا أي توليد أو كلفة، فلا يمكن أن تخالف التصميم.
// موضع كل لقطة يُشتقّ من نفس محرّك المعالم المستخدم في الليبلات، فيصحّ على
// أي نوع قطعة. الجدول السابق كان كلمات فستان محفورة (TULLE، TRAIN، BODICE)،
// فكان كل ما لا يطابقها يسقط على قصّات ثابتة عشوائية.
const DEFAULT_CROPS = ['50% 12%', '50% 26%', '50% 40%', '50% 58%', '50% 74%', '50% 90%'];

function RefCrops({ image, areas, anchors }) {
  if (!image) return <div className="tp-img-ph" style={{ aspectRatio: '4/3' }}></div>;
  const list = (areas && areas.length ? areas : []).slice(0, 6);
  while (list.length < 6) list.push('');
  const posFor = (name, i) => {
    // المعلم التشريحي يُستخرج من اسم المنطقة، ثم يُحوَّل إلى نسبة من جدول القياسات
    const lm = landmarkOf(name, true);
    if (lm && anchors && anchors[lm] != null && anchors.__total) {
      const y = Math.max(4, Math.min(96, (anchors[lm] / anchors.__total) * 100));
      return '50% ' + Math.round(y) + '%';
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
      .detail-col { min-width: 0; }
      .palette-col { grid-column: auto; }
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

      /* ===== الطباعة / تصدير PDF =====
         عند الطباعة يُخفى كل ما عدا التيك باك، وتُفرَض ورقة A4 أفقية بحيث
         تقع كل صفحة تيك باك على ورقة واحدة كاملة كما في النموذج المرجعي.
         النص يبقى متجهاً: قابلاً للبحث والنسخ والطباعة بأي مقاس. */
      @media print {
        @page { size: A4 landscape; margin: 0; }
        html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
        /* يُخفى كل شيء، ثم يُستعاد #techpack-canvas وسلسلة آبائه فقط */
        body.printing-techpack * { visibility: hidden !important; }
        body.printing-techpack #techpack-canvas,
        body.printing-techpack #techpack-canvas * { visibility: visible !important; }
        body.printing-techpack #techpack-canvas {
          position: absolute !important; inset: 0 auto auto 0; width: 100% !important;
        }
        body.printing-techpack button,
        body.printing-techpack textarea,
        body.printing-techpack input,
        body.printing-techpack select { display: none !important; }
        #techpack-canvas, #techpack-canvas * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .tp { background: #fff !important; padding: 0 !important; margin: 0 !important; }
        /* ورقة لكل صفحة، بلا ظل ولا حواف شاشة */
        .tp-page {
          box-shadow: none !important;
          border-radius: 0 !important;
          margin: 0 !important;
          padding: 10mm 12mm !important;
          width: 297mm; height: 210mm;
          box-sizing: border-box;
          overflow: hidden;
          break-after: page;
          page-break-after: always;
        }
        .tp-page:last-child { break-after: auto; page-break-after: auto; }
        /* منع انقسام الجداول والبطاقات بين ورقتين */
        .tp-table, .tp-crops, .tp-pair, .tp-mat-grid, .tp-colorways,
        .tp-crop, .tp-view, .tp-pantone-row, tr { break-inside: avoid; page-break-inside: avoid; }
        thead { display: table-header-group; }
        img { max-width: 100% !important; }
      }
      .tp-img-miss { display: flex; align-items: center; justify-content: center; text-align: center;
        padding: 1rem; font-size: 0.72rem; color: #9a6b2f; background: #fdf8ef;
        border: 1px dashed #e0c9a0; line-height: 1.8; }
      /* ليبل تعذّر حساب موقعه من جدول القياسات — موضعه تقريبي ويُعلَّم */
      .tp-m-wrap.uncomputed .tp-m-label { color: #b8860b; }
      .tp-m-wrap.uncomputed .tp-m-line { border-top-style: dotted; opacity: 0.55; }
      .tp-audit { background: #fdf6e8; border: 1px solid #e6cfa3; border-radius: 6px;
        padding: 0.9rem 1.1rem; margin-bottom: 1rem; font-size: 0.78rem; color: #7a5a14; line-height: 1.9; }
      .tp-audit ul { margin: 0.4rem 0 0; padding-inline-start: 1.2rem; }
      .flat-result { margin-top: 1.2rem; }
      .flat-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      @media (max-width: 700px) { .flat-pair { grid-template-columns: 1fr; } }
      .flat-view { background: #fff; border: 1px solid #eceae4; border-radius: 6px; padding: 0.6rem; }
      .flat-view img { width: 100%; display: block; }
      .flat-cap { text-align: center; font-size: 0.68rem; letter-spacing: 0.14em; color: #999; margin-top: 0.4rem; }
      .flat-actions { display: flex; gap: 0.6rem; margin-top: 0.9rem; flex-wrap: wrap; }
      .flat-group-title { font-size: 0.78rem; font-weight: 700; color: #555; margin: 1.1rem 0 0.5rem; }
      .flat-group-title:first-child { margin-top: 0; }
      .tp-save-hint { font-size: 0.72rem; color: #888; margin: 0.4rem 0 0.9rem; line-height: 1.7; }
      .download-btn.secondary { background: transparent; border: 1px solid #d8d4cc; color: #555; }
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
      .tp-anno-line { flex: 1; border-top: 1px solid #222; position: relative; min-width: 18px; }
      .tp-anno-line.red { border-top-color: #a3271c; }
      .tp-anno-row.left .tp-anno-line:after,
      .tp-anno-row.right .tp-anno-line:before {
        content: ''; position: absolute; top: -2.5px; width: 5px; height: 5px; border-radius: 50%; background: #222;
      }
      .tp-anno-row.left .tp-anno-line:after { right: -2px; }
      .tp-anno-row.right .tp-anno-line:before { left: -2px; }
      .tp-anno-row .tp-anno-line.red:after, .tp-anno-row .tp-anno-line.red:before { background: #a3271c; }
      .tp-anno-text { font-size: 0.55rem; font-weight: 600; color: #333; letter-spacing: 0.4px; text-transform: uppercase; background: rgba(255,255,255,0.92); padding: 1px 3px; line-height: 1.3; max-width: 130px; font-family: Arial, sans-serif; }
      .tp-anno-text.red { color: #a3271c; }
      .tp-anno-circle { width: 26px; height: 26px; border: 1px solid #111; border-radius: 50%; background: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 600; color: #111; flex-shrink: 0; font-family: Arial, sans-serif; }
      .tp-anno-vert { position: absolute; top: 12%; bottom: 10%; border-left: 1.5px dashed #a3271c; }
      .tp-anno-vert .tp-anno-text.vert { position: absolute; top: 40%; white-space: nowrap; transform: rotate(-90deg); transform-origin: left top; }
      .tp-anno-vert.left .tp-anno-text.vert { left: -4px; }
      .tp-anno-vert.right .tp-anno-text.vert { left: 10px; }
      .tp-anno-caption { text-align: center; font-size: 0.66rem; color: #999; margin-top: 0.55rem; direction: ltr; }
      .tp-spec-frame { border: 1px solid #e5e5e5; border-radius: 8px; background: #fff; padding: 1rem 0.9rem 1.2rem; }
      .tp-spec-title { text-align: center; font-family: Arial, sans-serif; font-weight: 800; font-size: 1rem; letter-spacing: 0.6px; color: #111; direction: ltr; }
      .tp-spec-key { text-align: center; font-family: Arial, sans-serif; font-size: 0.72rem; color: #111; margin: 0.2rem 0 0.9rem; direction: ltr; }
      .tp-spec-key .red { color: #a3271c; font-weight: 700; }

      /* زوج المنظرين + خطوط القياس العابرة لجسم القطعة */
      .tp-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; direction: ltr; }
      @media (max-width: 600px) { .tp-pair { grid-template-columns: 1fr; } }
      .tp-view { min-width: 0; }
      .tp-view > img { width: 100%; display: block; border-radius: 4px; }
      .tp-view-cap { text-align: center; font-size: 0.64rem; font-weight: 800; letter-spacing: 1.5px; color: #555; margin-top: 0.4rem; direction: ltr; }
      .tp-m-wrap { position: absolute; display: flex; flex-direction: column; align-items: center; }
      .tp-m-line { display: block; width: 100%; border-top: 2px solid #a3271c; position: relative; }
      .tp-m-line:before, .tp-m-line:after { content: ''; position: absolute; top: -4px; border-top: 3.5px solid transparent; border-bottom: 3.5px solid transparent; }
      .tp-m-line:before { left: 0; border-right: 6px solid #a3271c; }
      .tp-m-line:after { right: 0; border-left: 6px solid #a3271c; }
      .tp-m-label { font-size: 0.68rem; font-weight: 800; color: #a3271c; letter-spacing: 0.4px; text-transform: uppercase; background: rgba(255,255,255,0.9); padding: 0 4px; line-height: 1.15; margin-bottom: 2px; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; font-family: Arial, sans-serif; }
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
      /* مطابقة بعيدة: اللون خارج مدى أصباغ الأقمشة، فتُعلَّم بدل إخفائها */
      .tp-pantone-warn { color: #b8860b; }

      /* دليل البناء */
      .tp-count { float: right; font-weight: 400; font-size: 0.68rem; color: #999; }
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
