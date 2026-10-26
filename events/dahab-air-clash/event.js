// Dahab Air Clash: language, countdown, pass booking and rider applications (WhatsApp links).
(function () {
  const AR = {
    concept: 'تصميم تجريبي من سكرولار', navpass: 'التذاكر', kick: 'بطولة كايت سيرف · البلو لاجون، دهب', date: '٦ إلى ٨ مارس ٢٠٢٧', scroll: 'مرّر وانطلق',
    c1h: 'المكان', c1p: 'البلو لاجون شمال دهب. مياه فيروزية على رمل أبيض، عمقها لحد الوسط، وهادية زي المراية.',
    c2h: 'الهوا', c2p: 'رياح شمالية بتنزل مع خليج العقبة كل عصر. <b>من ١٨ لـ ٢٨ عقدة</b>، جانبية على الشط، طول الأيام التلاتة.',
    c3h: 'تلات مسابقات', t1: 'فري ستايل', t2: 'بيج إير', t3: 'سباق المسار',
    c4h: '٣٢ متسابق', c4p: 'من ١٤ دولة. محترفين معزومين وأحسن ريدرز البحر الأحمر، على لقب واحد.',
    c5h: 'الصف الأول ليك', c5p: 'الشط مفتوح للكل. هات فوطتك، أو احجز الديك وتابع النهائيات من على حافة المية.',
    getpass: 'احجز تذكرتك',
    dEy: 'البرنامج', dH: 'تلات أيام على اللاجون', dP: 'التصفيات بتمشي مع هوا العصر. الصبح للبحر، وبالليل للمزيكا.',
    d1d: 'الجمعة ٦ مارس', d2d: 'السبت ٧ مارس', d3d: 'الأحد ٨ مارس', brief: 'اجتماع المتسابقين', heats: 'التصفيات', open: 'ليلة الافتتاح', fire: 'جلسة الغروب',
    race: 'بداية السباق', finals: 'النهائيات', close: 'التتويج وحفلة الختام', cdd: 'يوم', cdh: 'ساعة', cdm: 'دقيقة',
    pEy: 'تابعها لايف', pH: 'اختار تذكرتك', pP: 'دخول الشط مجاني. التذاكر بتضيف ضل وكرسي وأحسن منظر للنهائيات.',
    p1k: 'للجميع', p1h: 'الشط', free: 'مجاناً', p1a: 'شط مفتوح على طول المسار', p1b: 'تعليق مباشر وشاشة كبيرة', p1c: 'حفلات بالليل', reg: 'سجّل',
    p2k: 'الأكثر طلباً', p2h: 'لاجون كلوب', pday: 'في اليوم', p2a: 'ديك مضلل على الرمل', p2b: 'غدا ومشروبات ساقعة', p2c: 'مواصلات من دهب', book: 'احجز على واتساب',
    p3k: 'التلات أيام', p3h: 'ڤي آي بي ديك', p3a: 'الصف الأول عند خط النهاية', p3b: 'قابل المتسابقين', p3c: 'درس كايت مجاني في اليوم الرابع',
    demo: 'نسخة تجريبية: الحجوزات بتروح لواتساب سكرولار، مش لحدث حقيقي.',
    rEy: 'المتسابقين', rH: 'عايز تشارك؟', rP: 'تمن أماكن وايلد كارد لريدرز من مصر والمنطقة. ابعت بياناتك وفيديو، وهنرد عليك خلال أسبوع.',
    f1: 'فين', f1v: 'البلو لاجون، شمال دهب، جنوب سيناء', f2: 'إزاي توصل', f2v: 'عربيات ٤×٤ من دهب كل يوم الصبح', f3: 'آخر ميعاد للوايلد كارد', f3v: '١ فبراير ٢٠٢٧',
    map: 'افتح في خرائط جوجل', fn: 'الاسم بالكامل', fc: 'البلد', fd: 'المسابقة', fi: 'إنستجرام أو لينك فيديو', send: 'قدّم على واتساب',
    demo2: 'نسخة تجريبية: الطلبات بتروح لواتساب سكرولار.',
    foot: 'دهب إير كلاش · تصميم فعالية تجريبي من سكرولار', back: 'المزيد من أعمال سكرولار',
  };
  const EN = {};
  document.querySelectorAll('[data-i18n]').forEach(el => { EN[el.dataset.i18n] = el.innerHTML; });
  let lang = 'en'; try { lang = localStorage.getItem('scrollar-dac-lang') || 'en'; } catch (e) {}
  if (location.hash === '#ar' || location.hash === '#en') lang = location.hash.slice(1);
  const $ = s => document.querySelector(s);
  const WA = 'https://wa.me/?text=';

  function apply() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.dataset.i18n; el.innerHTML = lang === 'ar' ? (AR[k] ?? EN[k]) : EN[k]; });
    $('#langBtn').textContent = lang === 'ar' ? 'English' : 'عربي';
    document.querySelectorAll('[data-pass]').forEach(a => {
      const p = a.dataset.pass;
      a.href = WA + encodeURIComponent(lang === 'ar' ? `عايز أحجز تذكرة "${p}" لدهب إير كلاش، ٦ إلى ٨ مارس (تصميم تجريبي من سكرولار)` : `I'd like a ${p} pass for Dahab Air Clash, 6 to 8 March (Scrollar concept demo)`);
      a.target = '_blank'; a.rel = 'noopener';
    });
    links(); tick();
    try { localStorage.setItem('scrollar-dac-lang', lang); } catch (e) {}
  }
  function links() {
    const n = $('#rName').value.trim(), c = $('#rCountry').value.trim(), d = $('#rDisc').value, l = $('#rLink').value.trim();
    const text = lang === 'ar'
      ? `طلب مشاركة في دهب إير كلاش\nالاسم: ${n || '-'}\nالبلد: ${c || '-'}\nالمسابقة: ${d}${l ? `\nلينك: ${l}` : ''}`
      : `Rider application, Dahab Air Clash\nName: ${n || '-'}\nCountry: ${c || '-'}\nDiscipline: ${d}${l ? `\nLink: ${l}` : ''}`;
    $('#sendBtn').href = WA + encodeURIComponent(text);
  }
  ['#rName', '#rCountry', '#rDisc', '#rLink'].forEach(s => $(s).addEventListener('input', links));
  $('#langBtn').addEventListener('click', () => { lang = lang === 'ar' ? 'en' : 'ar'; apply(); });

  const T0 = new Date('2027-03-06T11:00:00+02:00').getTime();
  function tick() {
    const ms = Math.max(0, T0 - Date.now());
    $('#cd-d').textContent = Math.floor(ms / 864e5); $('#cd-h').textContent = Math.floor(ms / 36e5) % 24; $('#cd-m').textContent = Math.floor(ms / 6e4) % 60;
  }
  setInterval(tick, 30000);
  if (window.__BACK) { $('#backLink').href = window.__BACK; $('#backLink').target = '_blank'; }
  const nav = document.querySelector('nav'), st = document.getElementById('story');
  const navTone = () => nav.classList.toggle('solid', st.getBoundingClientRect().bottom < 60);
  addEventListener('scroll', navTone, { passive: true }); navTone();
  apply();
})();
