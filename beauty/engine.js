// Scrollar beauty engine: renders a concept page from window.CONCEPT, in English or Arabic.
(function () {
  const C = window.CONCEPT;
  const UI = {
    en: {
      book: 'Book now', lang: 'عربي', step1: 'Choose a service', step2: 'Choose your {staff}', step3: 'Pick a day', step4: 'Pick a time',
      any: 'Any available', min: 'min', closed: 'Closed', summary: 'Your booking', service: 'Service', with: 'With', when: 'When', total: 'Total',
      deposit: 'Deposit to hold the slot', name: 'Your name', confirm: 'Confirm on WhatsApp', pick: 'Choose a service, day and time',
      demo: 'Demo: this concept sends the booking to Scrollar on WhatsApp, not to a real business.',
      ready: 'WhatsApp opened with your booking. Send the message to confirm. It now shows in the owner view below.',
      bookH: 'Book in four taps', bookP: 'No calls, no back and forth. Pick what you want and confirm on WhatsApp.',
      ownerH: 'What the owner sees', ownerP: 'Every booking lands in one schedule per {staff}, with reminders sent automatically.',
      sample: 'Sample data', today: 'Today', bookings: 'Bookings', revenue: 'Revenue', busy: 'Chairs busy',
      foot: 'A Scrollar concept. {name} is a fictional business made to show what Scrollar builds.', back: 'Back to Scrollar', scroll: 'Scroll'
    },
    ar: {
      book: 'احجز دلوقتي', lang: 'English', step1: 'اختار الخدمة', step2: 'اختار {staff}', step3: 'اختار اليوم', step4: 'اختار الميعاد',
      any: 'أي حد متاح', min: 'دقيقة', closed: 'مقفول', summary: 'حجزك', service: 'الخدمة', with: 'مع', when: 'الميعاد', total: 'الإجمالي',
      deposit: 'عربون لتأكيد الميعاد', name: 'اسمك', confirm: 'أكّد على واتساب', pick: 'اختار الخدمة واليوم والميعاد',
      demo: 'نسخة تجريبية: الحجز هنا بيروح لسكرولار على واتساب، مش لبيزنس حقيقي.',
      ready: 'واتساب اتفتح بحجزك. ابعت الرسالة علشان تأكد. الحجز ظهر دلوقتي في لوحة المالك تحت.',
      bookH: 'احجز في أربع ضغطات', bookP: 'من غير مكالمات ولا رسايل كتير. اختار اللي عايزه وأكّد على واتساب.',
      ownerH: 'اللي بيشوفه صاحب المكان', ownerP: 'كل الحجوزات بتنزل في جدول واحد لكل {staff}، والتذكيرات بتتبعت لوحدها.',
      sample: 'بيانات تجريبية', today: 'النهارده', bookings: 'حجوزات', revenue: 'إيراد', busy: 'نسبة الإشغال',
      foot: 'تصميم مبدئي من سكرولار. {name} بيزنس متخيّل معمول علشان يوضّح سكرولار بتبني إيه.', back: 'ارجع لسكرولار', scroll: 'اسحب'
    }
  };
  if (C.ui) for (const l of ['en', 'ar']) Object.assign(UI[l], C.ui[l] || {});

  let lang = C.defaultLang || 'en';
  try { lang = localStorage.getItem('scrollar-lang-' + C.id) || lang; } catch (e) {}
  if (location.hash === '#ar') lang = 'ar'; if (location.hash === '#en') lang = 'en';
  const S = { svc: null, staff: 'any', day: null, time: null, name: '', mine: [] };
  const T = (o) => (o && typeof o === 'object') ? (o[lang] ?? o.en) : o;
  const U = (k) => UI[lang][k].replace('{staff}', T(C.staffWord)).replace('{name}', T(C.name));
  const money = (n) => n.toLocaleString('en-US') + ' ' + T(C.currency);
  const loc = lang === 'ar' ? (C.arLocale || 'ar-EG') + '-u-ca-gregory-nu-latn' : 'en-GB';
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // seeded random so "taken" slots and sample bookings stay stable
  const hash = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = (m) => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d; });
  const isClosed = (d) => (C.hours.closed || []).includes(d.getDay());

  function slotsFor(dayIdx) {
    const out = [], d = days[dayIdx], now = new Date();
    const open = toMin(C.hours.open), close = toMin(C.hours.close), dur = S.svc ? S.svc.min : 30;
    for (let m = open; m + dur <= close; m += C.hours.step) {
      const past = dayIdx === 0 && m <= now.getHours() * 60 + now.getMinutes() + 30;
      const taken = hash(C.id + dayIdx + ':' + m + S.staff) % 4 === 0;
      out.push({ t: fmt(m), off: past || taken });
    }
    return out;
  }

  function renderStatic() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = T(C.name);
    $('#brand').textContent = T(C.name);
    $('#langBtn').textContent = U('lang');
    $('#navBook').textContent = U('book');
    const st = C.story;
    $('#lHero').innerHTML = `<div class="hero"><div class="eyebrow">${esc(T(st.hero.eyebrow))}</div><h1>${T(st.hero.h1)}</h1><p>${esc(T(st.hero.p))}</p>
      <div class="row"><a class="cta" href="#book">${U('book')}</a></div>
      <div class="facts">${st.facts.map(f => `<div><b>${esc(T(f.v))}</b><span>${esc(T(f.k))}</span></div>`).join('')}</div></div>`;
    st.chapters.forEach((c, i) => {
      $('#lC' + i).innerHTML = `<div class="chapter"><div class="eyebrow">${esc(T(c.k))}</div><h2>${esc(T(c.h))}</h2><p>${esc(T(c.p))}</p></div>`;
    });
    $('#lEnd').innerHTML = `<div class="hero"><div class="eyebrow">${esc(T(C.city))}</div><h1>${T(st.end)}</h1><div class="row"><a class="cta" href="#book">${U('book')}</a></div></div>`;
    $('#bookH').textContent = U('bookH'); $('#bookP').textContent = U('bookP');
    $('#ownerH').textContent = U('ownerH'); $('#ownerP').textContent = U('ownerP');
    $('#foot').innerHTML = `<span>${esc(U('foot'))}</span><a href="${window.__BACK || '../../'}" ${window.__BACK ? 'target="_blank" rel="noopener"' : ''}>${esc(U('back'))}</a>`;
  }

  function renderBooking() {
    const svc = C.services.map(s => `<button type="button" class="opt" data-svc="${s.id}" aria-pressed="${S.svc && S.svc.id === s.id}"><b>${esc(T(s.name))}</b><small>${s.min} ${U('min')}${s.note ? ' · ' + esc(T(s.note)) : ''}</small><span class="pr">${money(s.price)}</span></button>`).join('');
    const staff = [{ id: 'any', name: { en: UI.en.any, ar: UI.ar.any }, ini: '★' }, ...C.staff].map(p => `<button type="button" class="pill" data-staff="${p.id}" aria-pressed="${S.staff === p.id}"><span class="av">${esc(p.ini || T(p.name).slice(0, 1))}</span>${esc(T(p.name))}${p.role ? ` <small class="muted">${esc(T(p.role))}</small>` : ''}</button>`).join('');
    const dayF = new Intl.DateTimeFormat(loc, { weekday: 'short' });
    const dayBtns = days.map((d, i) => `<button type="button" class="pill day" data-day="${i}" aria-pressed="${S.day === i}" ${isClosed(d) ? 'disabled' : ''}><small>${i === 0 ? esc(U('today')) : esc(dayF.format(d))}</small><b>${d.getDate()}</b>${isClosed(d) ? `<small>${U('closed')}</small>` : ''}</button>`).join('');
    const slots = S.day == null ? '' : slotsFor(S.day).map(s => `<button type="button" class="pill" data-time="${s.t}" aria-pressed="${S.time === s.t}" ${s.off ? 'disabled' : ''}>${s.t}</button>`).join('');
    $('#steps').innerHTML = `
      <div class="step"><h3><i>1</i>${U('step1')}</h3><div class="svc">${svc}</div></div>
      <div class="step"><h3><i>2</i>${U('step2')}</h3><div class="row-opts">${staff}</div></div>
      <div class="step"><h3><i>3</i>${U('step3')}</h3><div class="row-opts">${dayBtns}</div></div>
      <div class="step" ${S.day == null ? 'hidden' : ''}><h3><i>4</i>${U('step4')}</h3><div class="slots">${slots}</div></div>`;
    renderSummary();
  }

  function renderSummary() {
    const ready = S.svc && S.day != null && S.time;
    const staff = C.staff.find(p => p.id === S.staff);
    const when = S.day != null ? new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'short' }).format(days[S.day]) + (S.time ? ' · ' + S.time : '') : '-';
    $('#summary').innerHTML = `<h3>${U('summary')}</h3>
      <div class="sl"><span>${U('service')}</span><span>${S.svc ? esc(T(S.svc.name)) : '-'}</span></div>
      <div class="sl"><span>${U('with')}</span><span>${staff ? esc(T(staff.name)) : U('any')}</span></div>
      <div class="sl"><span>${U('when')}</span><span>${esc(when)}</span></div>
      ${C.deposit ? `<div class="sl"><span>${U('deposit')}</span><span>${money(C.deposit)}</span></div>` : ''}
      <div class="sl total"><span>${U('total')}</span><span>${S.svc ? money(S.svc.price) : '-'}</span></div>
      <label class="field" for="cname">${U('name')}<input id="cname" autocomplete="name" value="${esc(S.name)}"></label>
      ${ready ? `<a class="cta" id="confirm" href="${waLink()}" target="_blank" rel="noopener">${U('confirm')}</a>` : `<button type="button" class="cta" disabled>${U('pick')}</button>`}
      <div id="toastBox"></div>
      <p class="note">${U('demo')}</p>`;
    $('#cname').addEventListener('input', e => { S.name = e.target.value; const l = $('#confirm'); if (l) l.href = waLink(); });
    const l = $('#confirm'); if (l) l.addEventListener('click', confirm);
  }

  function waLink() {
    const staff = C.staff.find(p => p.id === S.staff) || pickFree();
    const d = days[S.day];
    const lines = lang === 'ar'
      ? [`طلب حجز (نسخة تجريبية من سكرولار)`, T(C.name), `الخدمة: ${T(S.svc.name)} (${S.svc.min} دقيقة)`, `مع: ${T(staff.name)}`, `اليوم: ${d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' })}`, `الساعة: ${S.time}`, `الاسم: ${S.name || '-'}`]
      : [`Booking request (Scrollar demo)`, T(C.name), `Service: ${T(S.svc.name)} (${S.svc.min} min)`, `With: ${T(staff.name)}`, `Day: ${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`, `Time: ${S.time}`, `Name: ${S.name || '-'}`];
    return 'https://wa.me/' + C.wa + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function confirm() {
    const staff = C.staff.find(p => p.id === S.staff) || pickFree();
    S.mine.push({ day: S.day, staff: staff.id, start: toMin(S.time), min: S.svc.min, who: S.name || (lang === 'ar' ? 'حجزك' : 'You'), svc: S.svc });
    $('#toastBox').innerHTML = `<div class="toast" role="status">${U('ready')}</div>`;
    renderOwner();
  }
  const pickFree = () => C.staff[hash(String(S.time)) % C.staff.length];

  function renderOwner() {
    const open = toMin(C.hours.open), close = toMin(C.hours.close), step = 60;
    const hours = []; for (let m = open; m < close; m += step) hours.push(m);
    const di = S.day ?? 0, dayLabel = di === 0 ? U('today') : new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'short' }).format(days[di]);
    const sample = [];
    if (!isClosed(days[di])) C.staff.forEach((p, si) => {
      let m = open + (si * 30) % 90;
      while (m < close - 30) {
        const s = C.services[hash(p.id + m) % C.services.length];
        if (hash(C.id + di + p.id + m) % 3 !== 0 && m + s.min <= close) sample.push({ staff: p.id, start: m, min: s.min, who: T(C.clients[hash(p.id + 'c' + m) % C.clients.length]), svc: s });
        m += s.min + 15 * (hash(p.id + 'g' + m) % 4);
      }
    });
    const all = sample.filter(b => !S.mine.some(x => x.day === di && x.staff === b.staff && x.start < b.start + b.min && b.start < x.start + x.min)).concat(S.mine.filter(b => b.day === di).map(b => ({ ...b, mine: true })));
    const rev = all.reduce((a, b) => a + b.svc.price, 0);
    const busy = Math.round(100 * all.reduce((a, b) => a + b.min, 0) / ((close - open) * C.staff.length));
    const cols = C.staff.length, rowH = 80, H = (close - open) / 60 * rowH;
    const y = m => (m - open) / 60 * rowH;
    const head = `<div class="ghead" style="grid-template-columns:64px repeat(${cols},1fr)"><div></div>` + C.staff.map(p => `<div class="gh"><span class="av">${esc(p.ini || T(p.name).slice(0, 1))}</span>${esc(T(p.name))}</div>`).join('') + `</div>`;
    const times = `<div class="gtimes">` + hours.map(m => `<span style="top:${y(m)}px">${fmt(m)}</span>`).join('') + `</div>`;
    const colsHtml = C.staff.map(p => `<div class="gcol">` + all.filter(b => b.staff === p.id).sort((a, b) => a.start - b.start).map(b => {
      const h = b.min / 60 * rowH - 3, short = h < 40;
      return `<div class="bk${b.mine ? ' new' : ''}${short ? ' s' : ''}" style="top:${y(b.start) + 1.5}px;height:${h}px"><b><bdi dir="ltr">${fmt(b.start)}</bdi> ${esc(b.who)}</b><span>${esc(T(b.svc.name))}</span></div>`;
    }).join('') + `</div>`).join('');
    $('#owner').innerHTML = `<div class="ohead"><div class="stats">
        <div><b>${all.length}</b><span>${U('bookings')} · ${esc(dayLabel)}</span></div>
        <div><b>${money(rev)}</b><span>${U('revenue')}</span></div>
        <div><b>${busy}%</b><span>${U('busy')}</span></div></div><span class="badge">${U('sample')}</span></div>
      <div class="sched"><div class="gwrap">${head}<div class="gbody" style="grid-template-columns:64px repeat(${cols},1fr);height:${H}px;--row:${rowH}px">${times}${colsHtml}</div></div></div>`;
  }

  function renderAll() { renderStatic(); renderBooking(); renderOwner(); }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.svc) { S.svc = C.services.find(s => s.id === b.dataset.svc); S.time = null; renderBooking(); }
    else if (b.dataset.staff) { S.staff = b.dataset.staff; S.time = null; renderBooking(); }
    else if (b.dataset.day) { S.day = +b.dataset.day; S.time = null; renderBooking(); }
    else if (b.dataset.time) { S.time = b.dataset.time; renderBooking(); }
    else if (b.id === 'langBtn') { lang = lang === 'ar' ? 'en' : 'ar'; try { localStorage.setItem('scrollar-lang-' + C.id, lang); } catch (e) {} renderAll(); }
  });
  renderAll();
})();
