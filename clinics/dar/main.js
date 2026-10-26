/* Dar Dental: a day at the clinic. Vertical scroll drives a horizontal film strip of real footage
   while a clock runs from 09:00 to 20:00. No 3D: the people are the product. */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const WA = '';
if (window.__BACK) $('#back').href = window.__BACK;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const AR = {
  n1: 'يوم عندنا', n2: 'الأسعار', n3: 'أول زيارة', nb: 'احجز زيارة',
  h1: 'دكتور أسنان <em>هتستنى ميعاده.</em>', hp: 'دار عيادة أسنان عائلية في مصر الجديدة. مفيش انتظار بالساعات، مفيش فواتير مفاجئة، وفريق بيشرحلك كل حاجة على الشاشة قبل ما أي حاجة تحصل.',
  hc1: 'احجز أول زيارة', hc2: 'اقضي يوم معانا', hs: '4 دقايق', hsl: 'متوسط الانتظار الأسبوع ده',
  dk: 'يوم في دار', dh: 'انزل وعيش <em>يوم حقيقي.</em>', dcl: 'بتوقيت مصر الجديدة',
  c1h: 'كرسيك جاهز قبل ما توصل.', c1p: 'كل أوضة بتتجهز وتتعقم لميعادك انت، مش للي جاي من غير حجز. بتقعد في ميعادك بالظبط.',
  c2h: 'بنوريك الأشعة الأول.', c2p: 'قبل ما أي أداة تقرب منك، الدكتور بيشرحلك الصورة ومعناها. بكلام بسيط.',
  c3h: 'بتمشي ومعاك خطة وسعر.', c3p: 'خطة مكتوبة على واتساب: إيه اللي لازم يتعمل، وإيه اللي ممكن يستنى، وكل خطوة بكام بالظبط.',
  c4h: 'إيد خفيفة وإجابات صريحة.', c4p: 'قلقان؟ قولنا. بنهدّي، بنشرح كل خطوة، وبنقف أول ما ترفع إيدك.',
  c5h: 'بعد المدرسة، بييجي الأطفال.', c5p: 'زيارات قصيرة، كراسي صغيرة، وشرح كبير. أغلبهم بيسألوا هييجوا تاني امتى.',
  c6h: 'ست دكاترة. عيادة عائلية واحدة.', c6p: 'علاج عام، أطفال، تقويم وزراعة تحت سقف واحد، علشان عيلتك يبقى ليها دكتور واحد لكل حاجة.',
  ph: 'الأسعار متعلقة على الحيطة، <em>مش بعد الزيارة.</em>', pp: 'كل الأسعار شاملة الكشف ومكالمة متابعة. تقسيط على 6 شهور للعلاج اللي فوق 5,000 جنيه.',
  u1: 'دقايق', pr1: 'متوسط الانتظار. بنحجز عدد أقل، وده مقصود.', pr2: 'رسوم مفاجئة. السعر اللي توافق عليه هو اللي تدفعه.', u3: 'س', pr3: 'دكتور بيرد على واتساب خلال يوم بعد العلاج.', pr4: 'دكاترة، من الأطفال للزراعة، في عيادة واحدة.',
  bk: 'أول زيارة', bh: 'ابدأ <em>بكشف وفنجان قهوة.</em>', bp: 'أول زيارة 45 دقيقة: كشف كامل، أشعة ديجيتال، وخطتك بالأسعار. 600 جنيه، أو مجانًا لو بدأت العلاج خلال شهر.',
  f1: 'الزيارة لمين', f2: 'إيه المشكلة', f3: 'إمتى يناسبك', f4: 'اسمك', fgo: 'ابعت على واتساب', fn: 'هنرد عليك بأقرب مواعيد فاضية. مفيش حجز غير لما تأكد.',
  fa: '22 شارع المرغني، مصر الجديدة، القاهرة', fh: 'المواعيد', fh1: 'من السبت للخميس، 9 الصبح لـ 9 بالليل', fc: 'تواصل', fc1: 'الحجز على واتساب',
  fcr: 'موقع تجريبي لعيادة خيالية، من تنفيذ Scrollar. الفيديوهات: Mixkit.', fm: 'مفهوم من Scrollar'
};
const EN = {}; $$('[data-i18n]').forEach(e => EN[e.dataset.i18n] = e.textContent); $$('[data-i18n-html]').forEach(e => EN[e.dataset.i18nHtml] = e.innerHTML);
let lang = 'en'; const T = k => (lang === 'ar' ? AR[k] : EN[k]) ?? EN[k];

const PRICES = [
  { en: 'First visit and X-ray', ar: 'أول زيارة وأشعة', den: 'Full check-up, digital X-ray, written plan', dar: 'كشف كامل، أشعة ديجيتال، وخطة مكتوبة', p: 600, hl: 1 },
  { en: 'Cleaning and polish', ar: 'تنظيف وتلميع', den: 'Scaling, polish and fluoride, 40 minutes', dar: 'إزالة الجير، تلميع وفلورايد، 40 دقيقة', p: 1200 },
  { en: 'White filling', ar: 'حشو تجميلي', den: 'Tooth-coloured composite, per tooth', dar: 'حشو بلون السنة، للسنة الواحدة', p: 1500 },
  { en: 'Root canal', ar: 'علاج عصب', den: 'Usually one visit, under local anaesthetic', dar: 'غالبًا زيارة واحدة، ببنج موضعي', p: 4500, from: 1 },
  { en: 'Kids visit', ar: 'زيارة أطفال', den: 'Check-up, cleaning and a sticker', dar: 'كشف، تنظيف، واستيكر', p: 500 },
  { en: 'Zirconia crown', ar: 'طربوش زيركون', den: 'Made in our partner lab in 5 days', dar: 'بيتعمل في المعمل الشريك خلال 5 أيام', p: 8500, from: 1 }
];
function renderPrices() {
  $('#plist').innerHTML = PRICES.map(x => `<div class="pc${x.hl ? ' hl' : ''}"><h4>${x[lang]}</h4><p>${lang === 'ar' ? x.dar : x.den}</p><div class="pr">${x.from ? (lang === 'ar' ? 'من ' : 'from ') : ''}${x.p.toLocaleString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US')}<small>${lang === 'ar' ? 'جنيه' : 'EGP'}</small></div></div>`).join('');
}

const OPT = {
  who: [{ en: 'Me', ar: 'أنا' }, { en: 'My child', ar: 'ابني أو بنتي' }, { en: 'The whole family', ar: 'العيلة كلها' }],
  why: [{ en: 'Just a check-up', ar: 'كشف عادي' }, { en: 'Pain', ar: 'وجع' }, { en: 'Cleaning', ar: 'تنظيف' }, { en: 'Smile makeover', ar: 'تجميل الابتسامة' }, { en: 'Braces', ar: 'تقويم' }],
  when: [{ en: 'Morning', ar: 'الصبح' }, { en: 'Afternoon', ar: 'بعد الضهر' }, { en: 'Evening', ar: 'بالليل' }, { en: 'Weekend', ar: 'آخر الأسبوع' }]
};
const sel = { who: null, why: null, when: null };
function renderBook() {
  [['who', '#oWho'], ['why', '#oWhy'], ['when', '#oWhen']].forEach(([k, id]) => {
    $(id).innerHTML = OPT[k].map((o, i) => `<button class="op${sel[k] === i ? ' on' : ''}" data-i="${i}">${o[lang]}</button>`).join('');
    $(id).querySelectorAll('.op').forEach(b => b.onclick = () => { sel[k] = +b.dataset.i; renderBook(); });
  });
  link();
}
function link() {
  const ok = sel.who !== null && sel.why !== null && sel.when !== null && $('#nm').value.trim(), a = $('#go');
  a.classList.toggle('off', !ok);
  if (!ok) { a.href = '#'; return; }
  const g = k => OPT[k][sel[k]][lang], n = $('#nm').value.trim();
  const msg = lang === 'ar' ? `أهلا دار، عايز أحجز أول زيارة.\nالاسم: ${n}\nالزيارة لـ: ${g('who')}\nالسبب: ${g('why')}\nالوقت المناسب: ${g('when')}`
    : `Hi Dar, I'd like to book a first visit.\nName: ${n}\nFor: ${g('who')}\nReason: ${g('why')}\nBest time: ${g('when')}`;
  a.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
}
$('#nm').addEventListener('input', link);

function applyLang(l) {
  lang = l; document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach(e => e.textContent = T(e.dataset.i18n)); $$('[data-i18n-html]').forEach(e => e.innerHTML = T(e.dataset.i18nHtml));
  $('#lang').textContent = l === 'ar' ? 'EN' : 'عربي';
  try { localStorage.setItem('dar-lang', l); } catch (e) {}
  renderPrices(); renderBook();
}
$('#lang').onclick = () => applyLang(lang === 'ar' ? 'en' : 'ar');

/* scroll */
const lenis = window.Lenis && !reduce ? new window.Lenis({ lerp: .09 }) : null;
if (lenis) $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const h = a.getAttribute('href'); if (h.length > 1) { e.preventDefault(); lenis.scrollTo(h, { duration: 1.5 }); } }));
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); } }), { threshold: .15 });
$$('.rv').forEach(e => io.observe(e));
const vio = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: .2 });
$$('video').forEach(v => vio.observe(v));

const toMin = t => +t.slice(0, 2) * 60 + +t.slice(3);
const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
const chs = $$('.ch');
function frame(now) {
  if (lenis) lenis.raf(now);
  const VH = innerHeight, VW = innerWidth;
  $('#nav').classList.toggle('solid', scrollY > 40);
  // hero video eases in from slightly smaller, rounded card to the full card
  const hv = $('#hv'), hr = hv.getBoundingClientRect(); const k = clamp(1 - hr.top / VH);
  hv.style.transform = `scale(${.92 + .08 * clamp(k * 1.4)})`;
  // the day
  const d = $('#day'), r = d.getBoundingClientRect(); const p = clamp(-r.top / (r.height - VH));
  const tr = $('#track'); const max = tr.scrollWidth - VW;
  const x = p * max; tr.style.transform = `translateX(${lang === 'ar' ? x : -x}px)`;
  $('#barI').style.width = (p * 100) + '%';
  let best = 0, bd = 1e9; const cx = VW / 2;
  const pos = chs.map((c, i) => { const b = c.getBoundingClientRect(); const m = b.left + b.width / 2; const dd = Math.abs(m - cx); if (dd < bd) { bd = dd; best = i; } c.querySelector('.v').style.transform = `scale(${1 - .08 * clamp(dd / VW)})`; return m; });
  // clock: interpolate between the chapter times by position
  let tmin = toMin(chs[0].dataset.t);
  for (let i = 0; i < chs.length - 1; i++) { const a = pos[i], b = pos[i + 1]; if (cx >= Math.min(a, b) && cx <= Math.max(a, b)) { const f = Math.abs(cx - a) / Math.abs(b - a); tmin = toMin(chs[i].dataset.t) + (toMin(chs[i + 1].dataset.t) - toMin(chs[i].dataset.t)) * f; } }
  if (p >= .999) tmin = toMin(chs[chs.length - 1].dataset.t);
  const cl = $('#clock'); cl.firstChild.nodeValue = fmt(Math.round(tmin / 5) * 5);
  requestAnimationFrame(frame);
}

let start = 'en'; try { start = localStorage.getItem('dar-lang') || 'en'; } catch (e) {}
if (location.hash === '#ar') start = 'ar'; if (location.hash === '#en') start = 'en';
applyLang(start);
requestAnimationFrame(frame);
window.__setProgress = v => { const y = v * (document.documentElement.scrollHeight - innerHeight); if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); };
