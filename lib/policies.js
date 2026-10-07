// lib/policies.js
// نصوص السياسات (عربي + إنجليزي). كل قسم: h = العنوان، body = فقرات (نص) أو { ul: [...] } أو { html: '...' }.
// الاسم والإيميل والتاريخ بتجي من lib/site.js. أي تغيير بالخدمات المستخدمة بالكود لازم ينعكس هون.

import { SITE, ltr } from './site';

const mail = `<bdi><a href="mailto:${SITE.email}">${SITE.email}</a></bdi>`;
const OP = SITE.operator;
const NAME = SITE.name;
const AR_OP = ltr(OP);
const AR_NAME = ltr(NAME);
const AR_DOMAIN = ltr(SITE.domain);

// ======================= الخصوصية =======================
export const PRIVACY = {
  title: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
  sections: [
    {
      h: { en: 'Who we are', ar: 'من نحن' },
      body: {
        en: [
          `This policy explains what information ${NAME} (${SITE.domain}) collects, how we use it, and the choices you have. ${NAME} is operated by ${OP}, ${SITE.location.en} ("we", "us").`,
        ],
        ar: [
          `توضّح هذه السياسة ما المعلومات التي يجمعها ${AR_NAME} (${AR_DOMAIN}) وكيف نستخدمها وما الخيارات المتاحة لك. يتم تشغيل ${AR_NAME} بواسطة ${AR_OP}، ${SITE.location.ar} ("نحن").`,
        ],
      },
    },
    {
      h: { en: 'Information we collect', ar: 'المعلومات التي نجمعها' },
      body: {
        en: [
          {
            ul: [
              'Account information. When you sign in, our sign-in provider (Clerk) gives us your account ID, email address, name and profile picture. If you sign in with Google, we receive only your basic profile: name, email address and profile picture.',
              'Content you submit. Images (such as garment sketches or photos), text and settings you enter into the tools, and the results the tools generate for you.',
              'Plan and usage records. Your subscription plan and how many times you have used each tool in the current period, linked to your account ID.',
              'Purchase information. Payments are handled by our third-party payment provider. We receive your name, email address and the product or plan you bought, as needed to deliver it. We do not receive or store your card details.',
              'Technical information. Our hosting provider records standard server logs, such as IP address, browser type and the pages requested.',
              'Messages. Anything you send us by email.',
            ],
          },
        ],
        ar: [
          {
            ul: [
              'معلومات الحساب. عند تسجيل الدخول يزوّدنا مزوّد تسجيل الدخول (Clerk) بمعرّف حسابك وبريدك الإلكتروني واسمك وصورة ملفك. وإذا سجّلت عبر Google فنحصل على ملفك الأساسي فقط: الاسم والبريد الإلكتروني وصورة الملف.',
              'المحتوى الذي ترسله. الصور (مثل رسمات القطع أو صورها) والنصوص والإعدادات التي تدخلها في الأدوات، والنتائج التي تولّدها لك الأدوات.',
              'سجلات الخطة والاستخدام. خطة اشتراكك وعدد مرات استخدامك لكل أداة في الفترة الحالية، مرتبطة بمعرّف حسابك.',
              'معلومات الشراء. تتم المدفوعات عبر مزوّد دفع خارجي. نستلم اسمك وبريدك الإلكتروني والمنتج أو الخطة التي اشتريتها بالقدر اللازم للتسليم. ولا نستلم بيانات بطاقتك ولا نخزّنها.',
              'معلومات تقنية. يسجّل مزوّد الاستضافة سجلات الخادم المعتادة، مثل عنوان IP ونوع المتصفح والصفحات المطلوبة.',
              'الرسائل. أي شيء ترسله إلينا بالبريد الإلكتروني.',
            ],
          },
        ],
      },
    },
    {
      h: { en: 'How we use information', ar: 'كيف نستخدم المعلومات' },
      body: {
        en: [
          {
            ul: [
              'To run the tools and return your results.',
              'To apply plan limits, prevent abuse and keep the service secure.',
              'To deliver purchases and provide support.',
              'To meet legal obligations.',
            ],
          },
          'We do not sell your personal information and we do not use it for advertising.',
        ],
        ar: [
          {
            ul: [
              'لتشغيل الأدوات وإرجاع نتائجك.',
              'لتطبيق حدود الخطة ومنع إساءة الاستخدام والحفاظ على أمان الخدمة.',
              'لتسليم المشتريات وتقديم الدعم.',
              'للالتزام بالمتطلبات القانونية.',
            ],
          },
          'لا نبيع معلوماتك الشخصية ولا نستخدمها للإعلانات.',
        ],
      },
    },
    {
      h: { en: 'AI processing and stored results', ar: 'المعالجة بالذكاء الاصطناعي والنتائج المحفوظة' },
      body: {
        en: [
          'To generate results, the images and text you submit are sent to AI service providers (currently Replicate and Anthropic). These providers receive this content in order to generate the result. Their own terms and privacy policies apply to how they handle it.',
          'Images and results created by the tools may be saved in cloud storage so that you can view and download them. These files are stored under long, unlisted links. We do not publish or list them, but anyone who has a link can open it. We keep them until you ask us to delete them.',
          'Please do not upload images of people unless you have the right to do so (see our Terms of Service).',
        ],
        ar: [
          'لتوليد النتائج، تُرسل الصور والنصوص التي تدخلها إلى مزوّدي خدمات ذكاء اصطناعي (حالياً Replicate وAnthropic). يستلم هؤلاء المزوّدون هذا المحتوى من أجل توليد النتيجة، وتنطبق شروطهم وسياسات خصوصيتهم على طريقة تعاملهم معه.',
          'قد تُحفظ الصور والنتائج التي تنشئها الأدوات في تخزين سحابي لتتمكن من عرضها وتنزيلها. تُحفظ هذه الملفات تحت روابط طويلة وغير معلنة. لا ننشرها ولا نعرضها في قوائم، لكن أي شخص لديه الرابط يستطيع فتحه. نحتفظ بها إلى أن تطلب منا حذفها.',
          'يرجى عدم رفع صور أشخاص إلا إذا كان لديك الحق في ذلك (راجع شروط الاستخدام).',
        ],
      },
    },
    {
      h: { en: 'Service providers', ar: 'مزوّدو الخدمات' },
      body: {
        en: [
          'We use the following providers to run the service:',
          {
            ul: [
              'Clerk: sign-in and account management.',
              'Vercel: hosting and file storage.',
              'Upstash: plan and usage records.',
              'Replicate and Anthropic: AI processing.',
              'Our payment provider: payments for products and plans.',
              'Google: Google Fonts (the typefaces our pages load) and sign-in, if you choose to sign in with Google.',
            ],
          },
          'These providers may be located in, or process data in, countries other than the UAE. We may also disclose information when the law requires it.',
        ],
        ar: [
          'نستعين بالمزوّدين التاليين لتشغيل الخدمة:',
          {
            ul: [
              'Clerk: تسجيل الدخول وإدارة الحسابات.',
              'Vercel: الاستضافة وتخزين الملفات.',
              'Upstash: سجلات الخطة والاستخدام.',
              'Replicate وAnthropic: المعالجة بالذكاء الاصطناعي.',
              'مزوّد الدفع لدينا: مدفوعات المنتجات والخطط.',
              'Google: خطوط Google Fonts التي تحمّلها صفحاتنا، وتسجيل الدخول إذا اخترت التسجيل عبر Google.',
            ],
          },
          'قد يكون هؤلاء المزوّدون في دول غير الإمارات أو يعالجون البيانات فيها. وقد نكشف عن معلومات عندما يطلب القانون ذلك.',
        ],
      },
    },
    {
      h: { en: 'Google user data', ar: 'بيانات مستخدمي Google' },
      body: {
        en: [
          'If you sign in with Google, we use your name, email address and profile picture only to create and identify your account. We do not sell this data, use it for advertising, or share it with anyone except the provider that handles sign-in for us.',
          {
            html: 'Our use of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.',
          },
        ],
        ar: [
          'إذا سجّلت الدخول عبر Google فإننا نستخدم اسمك وبريدك الإلكتروني وصورة ملفك فقط لإنشاء حسابك وتمييزه. لا نبيع هذه البيانات ولا نستخدمها للإعلانات ولا نشاركها مع أحد سوى المزوّد الذي يتولى تسجيل الدخول نيابة عنا.',
          {
            html: 'يلتزم استخدامنا للمعلومات الواردة من واجهات Google البرمجية بـ <a href="https://developers.google.com/terms/api-services-user-data-policy" rel="noopener noreferrer">سياسة بيانات المستخدم لخدمات Google API</a>، بما في ذلك متطلبات الاستخدام المحدود.',
          },
        ],
      },
    },
    {
      h: { en: 'Cookies and local storage', ar: 'ملفات الارتباط والتخزين المحلي' },
      body: {
        en: [
          'We use cookies that are necessary for signing in and keeping your session; they are set by our sign-in provider. We also store your language choice in your browser. We do not use advertising or analytics cookies.',
        ],
        ar: [
          'نستخدم ملفات ارتباط ضرورية لتسجيل الدخول والحفاظ على جلستك، ويضعها مزوّد تسجيل الدخول لدينا. كما نحفظ اختيارك للغة في متصفحك. لا نستخدم ملفات ارتباط للإعلانات أو للتحليلات.',
        ],
      },
    },
    {
      h: { en: 'How long we keep information', ar: 'مدة الاحتفاظ بالمعلومات' },
      body: {
        en: [
          'We keep account, plan and usage records while your account is active. Stored images and results are kept until you ask us to delete them. Purchase records are kept for as long as needed for accounting and legal purposes.',
        ],
        ar: [
          'نحتفظ بسجلات الحساب والخطة والاستخدام ما دام حسابك نشطاً. وتبقى الصور والنتائج المحفوظة إلى أن تطلب حذفها. أما سجلات الشراء فنحتفظ بها للمدة اللازمة لأغراض المحاسبة والقانون.',
        ],
      },
    },
    {
      h: { en: 'Your choices', ar: 'خياراتك' },
      body: {
        en: [
          { html: `You can ask us to give you access to your information, correct it, or delete it, including stored images and results, by emailing ${mail}. We will respond within a reasonable time and in line with applicable law.` },
        ],
        ar: [
          { html: `يمكنك أن تطلب منا الاطلاع على معلوماتك أو تصحيحها أو حذفها، بما في ذلك الصور والنتائج المحفوظة، بمراسلتنا على ${mail}. سنرد خلال مدة معقولة ووفق القانون المعمول به.` },
        ],
      },
    },
    {
      h: { en: 'Security', ar: 'الأمان' },
      body: {
        en: ['We use reputable providers and encrypted (HTTPS) connections. No system is perfectly secure, so we cannot guarantee absolute security.'],
        ar: ['نعتمد على مزوّدين موثوقين واتصالات مشفّرة (HTTPS). لا يوجد نظام آمن تماماً، لذلك لا يمكننا ضمان أمان مطلق.'],
      },
    },
    {
      h: { en: 'Children', ar: 'الأطفال' },
      body: {
        en: ['The service is not directed to children under 18, and we do not knowingly collect their information.'],
        ar: ['الخدمة غير موجّهة للأطفال دون 18 سنة، ولا نجمع معلوماتهم عن علم.'],
      },
    },
    {
      h: { en: 'Changes to this policy', ar: 'تعديل هذه السياسة' },
      body: {
        en: ['We may update this policy from time to time. The date at the top shows when it was last changed.'],
        ar: ['قد نحدّث هذه السياسة من وقت لآخر. يبيّن التاريخ في أعلى الصفحة آخر تعديل.'],
      },
    },
    {
      h: { en: 'Contact', ar: 'التواصل' },
      body: {
        en: [{ html: `${OP}, ${SITE.location.en}. Email: ${mail}` }],
        ar: [{ html: `${AR_OP}، ${SITE.location.ar}. البريد الإلكتروني: ${mail}` }],
      },
    },
  ],
};

// ======================= الشروط =======================
export const TERMS = {
  title: { en: 'Terms of Service', ar: 'شروط الاستخدام' },
  sections: [
    {
      h: { en: 'About these terms', ar: 'عن هذه الشروط' },
      body: {
        en: [
          `These terms apply when you use ${SITE.domain}, the ${NAME} tools, or buy our products. ${NAME} is operated by ${OP}, ${SITE.location.en} ("we", "us"). By using the site or buying from us, you agree to these terms.`,
        ],
        ar: [
          `تنطبق هذه الشروط عند استخدامك ${AR_DOMAIN} أو أدوات ${AR_NAME} أو شرائك لمنتجاتنا. يتم تشغيل ${AR_NAME} بواسطة ${AR_OP}، ${SITE.location.ar} ("نحن"). باستخدامك الموقع أو الشراء منا فإنك توافق على هذه الشروط.`,
        ],
      },
    },
    {
      h: { en: 'What we offer', ar: 'ما نقدّمه' },
      body: {
        en: [
          'AI-assisted tools for fashion design (mood boards, studio images, colour and fabric changes, design variations, flat sketches, tech packs, marketing content and video prompts), and digital products such as guides and Procreate brushes and stamps.',
        ],
        ar: [
          'أدوات بمساعدة الذكاء الاصطناعي لتصميم الأزياء (المود بورد، صور الاستوديو، تغيير الألوان والأقمشة، تنويعات التصميم، الفلات سكتش، التيك باك، المحتوى التسويقي وبرومبتات الفيديو)، ومنتجات رقمية مثل الأدلة وفرش Procreate وستاماته.',
        ],
      },
    },
    {
      h: { en: 'Your account', ar: 'حسابك' },
      body: {
        en: [
          'You need an account to use the tools. Give accurate information, keep your sign-in secure, and do not share your account. You are responsible for activity under your account.',
        ],
        ar: [
          'تحتاج إلى حساب لاستخدام الأدوات. قدّم معلومات صحيحة، وحافظ على أمان تسجيل دخولك، ولا تشارك حسابك. أنت مسؤول عن النشاط الذي يتم عبر حسابك.',
        ],
      },
    },
    {
      h: { en: 'Plans and usage limits', ar: 'الخطط وحدود الاستخدام' },
      body: {
        en: [
          'The tools are available under subscription plans. Each plan sets a number of uses for each tool in every monthly period, counted from the start of your subscription. Unused uses do not carry over to the next period. For annual plans, the limits are applied month by month. Requests that fail with an error are generally not counted against your limit.',
          'We may change plans and prices for future purchases. Your current paid period is not affected.',
        ],
        ar: [
          'تتوفر الأدوات ضمن خطط اشتراك. تحدد كل خطة عدداً من مرات الاستخدام لكل أداة في كل فترة شهرية، تُحسب من بداية اشتراكك. لا ينتقل ما لم يُستخدم إلى الفترة التالية. وفي الخطط السنوية تُطبق الحدود شهراً بشهر. الطلبات التي تفشل بخطأ لا تُحسب عادةً من حدّك.',
          'قد نغيّر الخطط والأسعار للمشتريات المستقبلية، ولا يتأثر بذلك فترتك المدفوعة الحالية.',
        ],
      },
    },
    {
      h: { en: 'Payments and renewals', ar: 'الدفع والتجديد' },
      body: {
        en: [
          'Payments are processed by a third-party payment provider. Prices and any applicable taxes are shown at checkout. Subscriptions renew automatically each period until you cancel. You can cancel at any time to stop future renewals, and you keep access until the end of the period you have paid for.',
        ],
        ar: [
          'تتم معالجة المدفوعات عبر مزوّد دفع خارجي. تظهر الأسعار وأي ضرائب مطبّقة عند الدفع. تتجدد الاشتراكات تلقائياً كل فترة إلى أن تلغيها. يمكنك الإلغاء في أي وقت لإيقاف التجديدات القادمة، ويبقى وصولك قائماً حتى نهاية الفترة التي دفعتها.',
        ],
      },
    },
    {
      h: { en: 'Digital products and your licence', ar: 'المنتجات الرقمية ورخصة الاستخدام' },
      body: {
        en: [
          'When you buy a digital product, we grant you a personal, non-exclusive, non-transferable licence to use it. You may use brushes and stamps in your own designs and artwork, including work you sell.',
          'You may not resell, share, redistribute or repackage the files, the guides or the download links, in whole or in part, including as part of another product.',
          'Procreate is a trademark of Savage Interactive Pty Ltd. We are not affiliated with or endorsed by them.',
        ],
        ar: [
          'عند شرائك منتجاً رقمياً نمنحك رخصة شخصية غير حصرية وغير قابلة للتحويل لاستخدامه. يمكنك استخدام الفرش والستامبات في تصاميمك وأعمالك الفنية، بما فيها الأعمال التي تبيعها.',
          'لا يجوز لك إعادة بيع الملفات أو الأدلة أو روابط التحميل أو مشاركتها أو توزيعها أو إعادة تعبئتها، كلياً أو جزئياً، بما في ذلك ضمن منتج آخر.',
          'Procreate علامة تجارية لشركة Savage Interactive Pty Ltd. ولسنا تابعين لها ولا مدعومين منها.',
        ],
      },
    },
    {
      h: { en: 'Your content', ar: 'محتواك' },
      body: {
        en: [
          'You keep the rights in what you upload. You confirm that you have the right to upload it, and, if it shows an identifiable person, that you have that person\'s permission. You give us a limited licence to process, store and show your content to you, only as needed to run the service.',
        ],
        ar: [
          'تبقى حقوق ما ترفعه لك. وتؤكد أن لديك الحق في رفعه، وأنه إذا كان يُظهر شخصاً يمكن التعرف عليه فلديك إذنه. وتمنحنا رخصة محدودة لمعالجة محتواك وتخزينه وعرضه لك، بالقدر اللازم لتشغيل الخدمة فقط.',
        ],
      },
    },
    {
      h: { en: 'Acceptable use', ar: 'الاستخدام المقبول' },
      body: {
        en: [
          'You agree not to:',
          {
            ul: [
              'upload unlawful content or content that infringes someone else\'s rights;',
              'upload or create sexual content involving minors, or any content that exploits minors;',
              'create content that falsely portrays or impersonates a real person;',
              'harass or harm others;',
              'try to bypass usage limits or security, or access the service by automated means such as scraping;',
              'reverse engineer the service, or resell access to it.',
            ],
          },
          'We may suspend or end access if these terms are broken.',
        ],
        ar: [
          'توافق على ألّا:',
          {
            ul: [
              'ترفع محتوى غير قانوني أو ينتهك حقوق الآخرين؛',
              'ترفع أو تنشئ محتوى جنسياً يتعلق بقاصرين، أو أي محتوى يستغل القاصرين؛',
              'تنشئ محتوى يصوّر شخصاً حقيقياً بشكل مضلل أو ينتحل شخصيته؛',
              'تضايق الآخرين أو تؤذيهم؛',
              'تحاول تجاوز حدود الاستخدام أو الحماية، أو تصل إلى الخدمة بوسائل آلية مثل الكشط؛',
              'تفكك الخدمة هندسياً أو تعيد بيع الوصول إليها.',
            ],
          },
          'يحق لنا تعليق الوصول أو إنهاؤه عند مخالفة هذه الشروط.',
        ],
      },
    },
    {
      h: { en: 'AI-generated results', ar: 'النتائج المولّدة بالذكاء الاصطناعي' },
      body: {
        en: [
          'Results can contain mistakes and can differ each time you run a tool. We do not guarantee that results are unique or free from third-party rights. Tech packs, measurements, colours and fabric depictions are aids: check them before production or sale. You are responsible for how you use the results.',
          'As between you and us, you may use the results you generate for personal and commercial purposes, subject to these terms and applicable law.',
        ],
        ar: [
          'قد تحتوي النتائج على أخطاء وقد تختلف في كل مرة تشغّل فيها الأداة. لا نضمن أن النتائج فريدة أو خالية من حقوق الغير. التيك باك والقياسات والألوان وتمثيل الأقمشة وسائل مساعدة: راجعها قبل الإنتاج أو البيع. أنت مسؤول عن طريقة استخدامك للنتائج.',
          'فيما بينك وبيننا، يمكنك استخدام النتائج التي تولّدها لأغراض شخصية وتجارية، بما يتوافق مع هذه الشروط والقانون المعمول به.',
        ],
      },
    },
    {
      h: { en: 'Our intellectual property', ar: 'ملكيتنا الفكرية' },
      body: {
        en: [`The site, the tools, the ${NAME} name and branding, and our guides, brushes and stamps belong to us or our licensors, except for your own content.`],
        ar: [`الموقع والأدوات واسم ${AR_NAME} وهويته البصرية وأدلتنا وفرشنا وستاماتنا مملوكة لنا أو لمرخّصينا، باستثناء محتواك أنت.`],
      },
    },
    {
      h: { en: 'Availability and changes', ar: 'التوفر والتعديلات' },
      body: {
        en: ['We provide the service as available. We may change, pause or stop parts of it, and the providers we rely on may affect its availability.'],
        ar: ['نقدّم الخدمة حسب المتاح. قد نغيّر أجزاء منها أو نوقفها مؤقتاً أو نهائياً، وقد تؤثر الجهات التي نعتمد عليها في توفرها.'],
      },
    },
    {
      h: { en: 'Disclaimer and limit of liability', ar: 'إخلاء المسؤولية وحدّها' },
      body: {
        en: [
          'To the extent the law allows, the service is provided "as is", we are not liable for indirect or consequential losses, and our total liability for any claim is limited to the amount you paid us for the product or plan the claim relates to. Nothing in these terms limits liability that cannot be limited by law.',
        ],
        ar: [
          'بالقدر الذي يسمح به القانون، تُقدَّم الخدمة "كما هي"، ولا نتحمل مسؤولية الخسائر غير المباشرة أو التبعية، وتقتصر مسؤوليتنا الإجمالية عن أي مطالبة على المبلغ الذي دفعته لنا مقابل المنتج أو الخطة المتعلقة بالمطالبة. ولا يحدّ أي شيء في هذه الشروط من مسؤولية لا يجوز تحديدها قانوناً.',
        ],
      },
    },
    {
      h: { en: 'Ending use', ar: 'إنهاء الاستخدام' },
      body: {
        en: ['You can stop using the service at any time. We may suspend or end your access if you break these terms.'],
        ar: ['يمكنك التوقف عن استخدام الخدمة في أي وقت. ويحق لنا تعليق وصولك أو إنهاؤه إذا خالفت هذه الشروط.'],
      },
    },
    {
      h: { en: 'Governing law', ar: 'القانون الواجب التطبيق' },
      body: {
        en: ['These terms are governed by the laws of the United Arab Emirates as applied in the Emirate of Dubai, and the courts of Dubai have jurisdiction, without affecting any rights you have under mandatory law.'],
        ar: ['تخضع هذه الشروط لقوانين دولة الإمارات العربية المتحدة كما هي مطبقة في إمارة دبي، وتكون محاكم دبي هي المختصة، دون المساس بأي حقوق لك بموجب قانون إلزامي.'],
      },
    },
    {
      h: { en: 'Changes to these terms', ar: 'تعديل الشروط' },
      body: {
        en: ['We may update these terms. The date at the top shows when they were last changed. Using the service after a change means you accept the updated terms.'],
        ar: ['قد نحدّث هذه الشروط. يبيّن التاريخ في أعلى الصفحة آخر تعديل. واستمرارك في استخدام الخدمة بعد التعديل يعني قبولك للشروط المحدّثة.'],
      },
    },
    {
      h: { en: 'Contact', ar: 'التواصل' },
      body: {
        en: [{ html: `${OP}, ${SITE.location.en}. Email: ${mail}` }],
        ar: [{ html: `${AR_OP}، ${SITE.location.ar}. البريد الإلكتروني: ${mail}` }],
      },
    },
  ],
};

// ======================= الاسترجاع =======================
export const REFUND = {
  title: { en: 'Refund Policy', ar: 'سياسة الاسترجاع' },
  sections: [
    {
      h: { en: 'All sales are final', ar: 'جميع المبيعات نهائية' },
      body: {
        en: [
          'Digital products (guides, brushes, stamps and other files) are delivered electronically and cannot be returned, so we do not offer refunds once a purchase is complete.',
          'Subscription plans are not refundable for the current paid period or for unused tool uses. You can cancel at any time to stop future renewals, and you keep access until the end of the period you have paid for.',
        ],
        ar: [
          'المنتجات الرقمية (الأدلة والفرش والستامبات وغيرها من الملفات) تُسلَّم إلكترونياً ولا يمكن إرجاعها، لذلك لا نقدّم استرجاعاً بعد اكتمال الشراء.',
          'لا تُسترد قيمة اشتراكات الخطط عن الفترة المدفوعة الحالية ولا عن مرات الاستخدام التي لم تُستخدم. يمكنك الإلغاء في أي وقت لإيقاف التجديدات القادمة، ويبقى وصولك قائماً حتى نهاية الفترة التي دفعتها.',
        ],
      },
    },
    {
      h: { en: 'When we will help', ar: 'متى نساعدك' },
      body: {
        en: [
          'Contact us if:',
          {
            ul: [
              'you were charged more than once for the same order;',
              'you did not receive your download link, or you cannot download the file;',
              'the file is damaged or will not open;',
              'you paid but your plan was not activated, or the tools do not work because of a fault on our side.',
            ],
          },
          'We will fix the problem, send the file again, or correct the charge. If we cannot fix it, we will refund the amount affected.',
        ],
        ar: [
          'تواصل معنا إذا:',
          {
            ul: [
              'تم خصم المبلغ أكثر من مرة للطلب نفسه؛',
              'لم يصلك رابط التحميل أو لا تستطيع تنزيل الملف؛',
              'كان الملف تالفاً أو لا يفتح؛',
              'دفعت ولم تُفعَّل خطتك، أو لا تعمل الأدوات بسبب عطل من جانبنا.',
            ],
          },
          'سنعالج المشكلة أو نعيد إرسال الملف أو نصحّح الخصم. وإذا تعذّر الحل فسنعيد المبلغ المتأثر.',
        ],
      },
    },
    {
      h: { en: 'How to ask', ar: 'كيف تطلب' },
      body: {
        en: [{ html: `Email ${mail} from, or mentioning, the email address you used at checkout, and tell us what happened.` }],
        ar: [{ html: `راسلنا على ${mail} من البريد الإلكتروني الذي استخدمته عند الدفع (أو اذكره في الرسالة)، وأخبرنا بما حدث.` }],
      },
    },
    {
      h: { en: 'Your legal rights', ar: 'حقوقك القانونية' },
      body: {
        en: ['This policy does not affect any rights you have under applicable law.'],
        ar: ['لا تؤثر هذه السياسة في أي حقوق لك بموجب القانون المعمول به.'],
      },
    },
    {
      h: { en: 'Payment disputes', ar: 'نزاعات الدفع' },
      body: {
        en: ['Please contact us before opening a dispute with your bank or card issuer. Disputes on valid orders may lead to access being suspended.'],
        ar: ['يرجى التواصل معنا قبل فتح نزاع لدى بنكك أو مصدر بطاقتك. قد يؤدي النزاع على طلب صحيح إلى تعليق الوصول.'],
      },
    },
  ],
};
