// Layla & Omar invite: language, personal guest name (#to=Name), countdown, calendar and RSVP links.
(function () {
  const AR = {
    concept: 'تصميم تجريبي من سكرولار', youre: 'أنتم مدعوون لحفل زفاف', scroll: 'مرّر لإشعال النور',
    s1k: 'الموعد', s2k: 'تبدأ السهرة', s3k: 'المكان',
    join: 'هل ستشاركوننا؟', joinp: 'مرّر للأسفل للرد', cdh: 'العدّ التنازلي', cdp: 'السبت ١٢ ديسمبر ٢٠٢٦', d: 'يوم', h: 'ساعة', m: 'دقيقة',
    cal: 'أضف إلى التقويم', evh: 'برنامج السهرة', e1: 'كتب الكتاب', e2: 'الزفة', e3: 'العشاء', e4: 'الملابس', e4v: 'رسمي',
    venue: 'قاعة النيل، الزمالك، القاهرة', map: 'افتح في خرائط جوجل', rh: 'نتشرف بردكم', rp: 'برجاء الرد قبل ١ ديسمبر.',
    fn: 'الاسم', fa: 'هل ستحضرون؟', yes: 'بكل سرور', no: 'نعتذر عن الحضور', fg: 'عدد الضيوف', fm: 'رسالة للعروسين (اختياري)',
    send: 'أرسل الرد على واتساب', demo: 'نسخة تجريبية: الردود تصل إلى واتساب سكرولار وليس لعروسين حقيقيين.',
    foot: 'ليلى و عمر · تصميم دعوة فرح تجريبي من سكرولار', back: 'المزيد من أعمال سكرولار',
  };
  const EN = {};
  document.querySelectorAll('[data-i18n]').forEach(el => { EN[el.dataset.i18n] = el.innerHTML; });

  // hash: #to=Ahmed%20%26%20family&ar
  let guest = '', lang = 'en';
  try { lang = localStorage.getItem('scrollar-invite-lang') || 'en'; } catch (e) {}
  const raw = location.hash.slice(1).split('&');
  raw.forEach(p => { if (p === 'ar' || p === 'en') lang = p; else if (p.startsWith('to=')) guest = decodeURIComponent(p.slice(3)).replace(/\+/g, ' ').slice(0, 60); });
  window.INVITE = {
    guest: () => guest || (lang === 'ar' ? 'ضيفنا العزيز' : 'Dear guest'),
    hasGuest: () => !!guest,
  };

  const $ = s => document.querySelector(s);
  let attending = true;
  function apply() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.dataset.i18n; el.innerHTML = lang === 'ar' ? (AR[k] ?? EN[k]) : EN[k]; });
    $('#langBtn').textContent = lang === 'ar' ? 'English' : 'عربي';
    $('#toLine').textContent = guest ? (lang === 'ar' ? `إلى ${guest}` : `For ${guest}`) : (lang === 'ar' ? 'دعوة فرح' : 'A wedding invitation');
    if (guest && !$('#rName').value) $('#rName').value = guest;
    links(); tick();
    try { localStorage.setItem('scrollar-invite-lang', lang); } catch (e) {}
  }
  $('#langBtn').addEventListener('click', () => { lang = lang === 'ar' ? 'en' : 'ar'; apply(); });

  // countdown to 12 Dec 2026, 7:00 PM Cairo
  const T0 = new Date('2026-12-12T19:00:00+02:00').getTime();
  function tick() {
    const ms = Math.max(0, T0 - Date.now()), d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
    $('#cd-d').textContent = d; $('#cd-h').textContent = h; $('#cd-m').textContent = m;
  }
  setInterval(tick, 30000);

  function links() {
    const title = lang === 'ar' ? 'فرح ليلى و عمر' : 'Layla & Omar wedding';
    const where = lang === 'ar' ? 'قاعة النيل، الزمالك، القاهرة' : 'The Nile Ballroom, Zamalek, Cairo';
    $('#calBtn').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=20261212T170000Z/20261212T220000Z&location=' + encodeURIComponent(where) + '&details=' + encodeURIComponent('Scrollar concept invitation');
    const name = $('#rName').value.trim() || INVITE.guest(), n = $('#rCount').value, msg = $('#rMsg').value.trim();
    const text = lang === 'ar'
      ? `رد على دعوة ليلى و عمر\nالاسم: ${name}\n${attending ? `بكل سرور، عدد الضيوف: ${n}` : 'نعتذر عن الحضور'}${msg ? `\nرسالة: ${msg}` : ''}`
      : `RSVP for Layla & Omar\nName: ${name}\n${attending ? `Joyfully attending, guests: ${n}` : 'Regretfully declining'}${msg ? `\nMessage: ${msg}` : ''}`;
    $('#sendBtn').href = 'https://wa.me/?text=' + encodeURIComponent(text);
    $('#guestsF').style.display = attending ? '' : 'none';
  }
  ['#rName', '#rCount', '#rMsg'].forEach(s => $(s).addEventListener('input', links));
  $('#yes').addEventListener('click', () => { attending = true; $('#yes').setAttribute('aria-pressed', 'true'); $('#no').setAttribute('aria-pressed', 'false'); links(); });
  $('#no').addEventListener('click', () => { attending = false; $('#no').setAttribute('aria-pressed', 'true'); $('#yes').setAttribute('aria-pressed', 'false'); links(); });
  if (window.__BACK) $('#backLink').href = window.__BACK, $('#backLink').target = '_blank';
  apply();
})();
