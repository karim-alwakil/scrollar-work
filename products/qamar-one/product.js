// Qamar One page: language, finish picker (tells the 3D scene), quantity, WhatsApp pre-order.
(function () {
  const AR = {
    brand: 'قمر', concept: 'تصميم تجريبي من سكرولار', pre: 'احجز الآن', egp: 'ج.م',
    'h.k': 'قمر ون · مفتاح البيت الذكي', 'h.h': 'بيتك كله، في لفّة واحدة.', 'h.p': 'النور والتكييف والستاير على قرص في حجم كف إيدك، من ألومنيوم وسافاير ونور.',
    'c1.k': '01 · الصحيان', 'c1.h': 'زجاج أسود، لحد ما توصله إيدك.', 'c1.p': 'شاشة AMOLED مقاس 1.4 بوصة بتصحى أول ما إيدك تقرّب. لفّ الحلقة والأوضة بتمشي معاك، تكّة بتكّة.',
    'c2.k': '02 · من جوه', 'c2.h': 'سبع طبقات. أربع مسامير. من غير غرا.', 'c2.p': 'كل قطعة بتتفك بمفك واحد، يعني كل قطعة تتصلّح هنا في القاهرة.',
    'c3.k': '03 · شريحة Q1', 'c3.h': 'سريع، حتى لو النت فاصل.', 'c3.p': 'شريحة Q1 بتشغّل بيتك محلياً. النور بيرد في أقل من 50 ملي ثانية، ومفيش حاجة بتطلع برا البيت إلا بإذنك.',
    'c4.k': '04 · متركّب', 'c4.h': 'بيتقفل بأربع لفّات.', 'c4.p': 'سافاير من فوق وألومنيوم من كل ناحية. معمول يفضل على حيطتك عشر سنين.',
    'e.k': 'قمر ون', 'e.h': 'شغّله.', 'sp.k': 'المواصفات', 'sp.h': 'قرص صغير. قطع جد.',
    's1.k': 'الشاشة', 's1.v': 'AMOLED ‏1.4"', 's1.p': '466 × 466، سطوع 1000 nit، غطا سافاير',
    's2.k': 'الشريحة', 's2.v': 'قمر Q1', 's2.p': 'تحكم محلي، استجابة أقل من 50 ملي ثانية',
    's3.k': 'الاتصال', 's3.v': 'Wi-Fi 6 · Thread', 's3.p': 'بلوتوث 5.3 ومرسل أشعة تحت الحمرا لأي تكييف',
    's4.k': 'البطارية', 's4.v': '2000 مللي أمبير', 's4.p': 'لحد 30 يوم بعيد عن الحيطة، شحن USB-C',
    's5.k': 'الجسم', 's5.v': 'ألومنيوم', 's5.p': 'حلقة محززة، قطر 62 مم، سُمك 18 مم',
    's6.k': 'الصيانة', 's6.v': '4 مسامير', 's6.p': 'من غير غرا، قطع غيار وصيانة في القاهرة',
    'b.k': 'احجز', 'b.h': 'اختار اللون.', 'b.p': 'أول دفعة بتتشحن في يناير. عربون 1000 ج.م بإنستاباي والباقي عند الاستلام.',
    f1: 'رملي', f2: 'جرافيت', order: 'احجز على واتساب', demo: 'نسخة تجريبية: منتج متخيَّل. الطلبات بتوصل لواتساب سكرولار.',
    foot: 'قمر ون · تصميم تجريبي لإطلاق منتج من سكرولار', back: 'المزيد من أعمال سكرولار',
  };
  const EN = {}; document.querySelectorAll('[data-i18n]').forEach(el => { EN[el.dataset.i18n] = el.innerHTML; });
  let lang = 'en', fin = 'sand', qty = 1;
  try { lang = localStorage.getItem('scrollar-qamar-lang') || 'en'; } catch (e) {}
  if (location.hash === '#ar' || location.hash === '#en') lang = location.hash.slice(1);
  const $ = s => document.querySelector(s), PRICE = 6499;
  const money = n => (lang === 'ar' ? n.toLocaleString('en-US') + ' ج.م' : n.toLocaleString('en-US') + ' EGP');
  function apply() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.dataset.i18n; el.innerHTML = lang === 'ar' ? (AR[k] ?? EN[k]) : EN[k]; });
    $('#langBtn').textContent = lang === 'ar' ? 'English' : 'عربي';
    try { localStorage.setItem('scrollar-qamar-lang', lang); } catch (e) {}
    order();
  }
  function order() {
    $('#qn').textContent = qty; $('#total').textContent = money(PRICE * qty);
    const finName = lang === 'ar' ? (fin === 'sand' ? 'رملي' : 'جرافيت') : (fin === 'sand' ? 'Sand' : 'Graphite');
    const text = lang === 'ar' ? `حجز قمر ون\nاللون: ${finName}\nالكمية: ${qty}\nالإجمالي: ${money(PRICE * qty)}` : `Qamar One pre-order\nFinish: ${finName}\nQuantity: ${qty}\nTotal: ${money(PRICE * qty)}`;
    $('#order').href = 'https://wa.me/?text=' + encodeURIComponent(text);
  }
  $('#langBtn').addEventListener('click', () => { lang = lang === 'ar' ? 'en' : 'ar'; apply(); });
  document.querySelectorAll('.sw').forEach(b => b.addEventListener('click', () => {
    fin = b.dataset.fin; document.querySelectorAll('.sw').forEach(x => x.setAttribute('aria-pressed', x === b));
    window.dispatchEvent(new CustomEvent('qamar-finish', { detail: fin })); order();
  }));
  $('#minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); order(); });
  $('#plus').addEventListener('click', () => { qty = Math.min(9, qty + 1); order(); });
  if (window.__BACK) { $('#backLink').href = window.__BACK; $('#backLink').target = '_blank'; }
  apply();
})();
