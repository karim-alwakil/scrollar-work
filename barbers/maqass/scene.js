import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* Maqass: real scanned objects break out of real footage.
   Hero: the video frame shrinks, the shears rise inside it, then cut out past its edge.
   Tools: the straight razor lifts out of the frame and swings open across the page.
   Chair: a restored barber chair turns over the shop's own footage. */

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = t => 1 - Math.pow(1 - t, 3);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WA = '';
const BACK = window.__BACK;
if (BACK) $('#back').href = BACK;

/* ------------------------------------------------------------------ i18n */
const AR = {
  'g.s': 'ادخل بالصوت', 'g.q': 'ادخل من غير صوت',
  'n.1': 'الأتيليه', 'n.2': 'الأسعار', 'n.3': 'الكراسي', 'n.b': 'احجز كرسيك',
  'h.a': 'الحلاقة', 'h.b': '<em>طقس.</em>',
  'h.k': 'أتيليه حلاقة / الزمالك، القاهرة', 'h.p': 'قص، فيد، وحلاقة بالفوطة السخنة. بالحجز بس، علشان محدش يستنى.', 'h.c': 'انزل',
  'c1.k': '01 / الاستشارة', 'c1.h': 'كل قصة<br><em>بتبدأ بكلام.</em>', 'c1.p': 'استشارة قبل أي مقص: شكل وشك، شعرك، وروتينك اليومي.',
  't.tag': '02 / العُدّة', 't.1': 'حديد. جلد.', 't.2': '<em>فوط سخنة.</em>', 't.3': 'ومفيش حاجة', 't.4': 'هنا <em>بتستعجل.</em>',
  'r.k': 'التوقيع بتاعنا', 'r.h': 'الحلاقة<br><em>بالموس.</em>', 'r.d': '45 دقيقة', 'r.p': '450 جنيه',
  'm.h': '<em>الأسعار.</em>', 'm.p': 'كل زيارة بتبدأ باستشارة وبتخلص بفوطة سخنة. الاتنين داخلين في السعر.',
  'm.c1': 'الفيد.', 'm.c1p': 'من 350 جنيه', 'm.c2': 'التحديد.', 'm.c2p': 'من 200 جنيه',
  'ch.1': 'كرسيك', 'ch.2': '<em>مستنيك.</em>', 'ch.p': 'أربع كراسي متجددة، أربع حلاقين، وزبون واحد لكل كرسي. احجز الساعة وتبقى بتاعتك.',
  's.1b': 'كراسي', 's.1': 'متجددة على طراز العشرينات', 's.2b': 'دقيقة', 's.2': 'انتظار، ده مقصود', 's.3b': 'أيام', 's.3': 'من 11 الصبح لـ 11 بالليل',
  'b.k': 'الحجز', 'b.h': 'احجز <em>كرسيك.</em>', 'b.p': 'اختار الخدمة والحلاق والميعاد. الحجز هيفتح على واتساب جاهز تبعته. الدفع في المحل.',
  'b.s1': '01 / الخدمة', 'b.s2': '02 / الحلاق', 'b.s3': '03 / اليوم', 'b.s4': '04 / الساعة',
  'b.sum': 'حجزك', 'b.tot': 'الإجمالي', 'b.go': 'أكّد على واتساب', 'b.n': 'من غير عربون. تقدر تلغي أو تغيّر الميعاد في نفس الشات.',
  'f.a': 'العنوان', 'f.a1': '14 شارع البرازيل، الزمالك، القاهرة', 'f.h': 'المواعيد', 'f.h1': 'كل يوم، من 11 الصبح لـ 11 بالليل', 'f.c': 'تواصل', 'f.c1': 'احجز على واتساب',
  'f.cr': 'موقع تجريبي لمحل حلاقة خيالي، من تنفيذ Scrollar. الفيديوهات: Mixkit.',
  'f.m': 'مفهوم من Scrollar', 'snd': 'الصوت'
};
const EN = {};
$$('[data-i18n]').forEach(e => EN[e.dataset.i18n] = e.textContent);
$$('[data-i18n-html]').forEach(e => EN[e.dataset.i18nHtml] = e.innerHTML);

const SVC = [
  { id: 'fade', en: 'Skin fade', ar: 'سكين فيد', den: 'Clipper fade, scissor top, hot towel', dar: 'فيد بالماكينة، المقص فوق، وفوطة سخنة', min: 50, egp: 350 },
  { id: 'cut', en: 'Classic scissor cut', ar: 'قصة كلاسيك بالمقص', den: 'Wash, cut, style', dar: 'غسيل، قص، وتسريح', min: 45, egp: 300 },
  { id: 'beard', en: 'Beard sculpt and line up', ar: 'تشكيل وتحديد الدقن', den: 'Shape, razor line, beard oil', dar: 'تشكيل، تحديد بالموس، وزيت دقن', min: 30, egp: 200 },
  { id: 'shave', en: 'Hot towel razor shave', ar: 'حلاقة بالموس والفوطة السخنة', den: 'Two towels, straight razor, cold finish', dar: 'فوطتين، موس، ولمسة باردة في الآخر', min: 45, egp: 450 },
  { id: 'ritual', en: 'The full ritual', ar: 'الطقس الكامل', den: 'Cut, beard, shave and face mask', dar: 'قص، دقن، حلاقة وماسك', min: 100, egp: 850 },
  { id: 'kids', en: 'Father and son', ar: 'أب وابنه', den: 'Two cuts, side by side', dar: 'قصتين جنب بعض', min: 75, egp: 550 }
];
const BARBERS = [{ en: 'Any barber', ar: 'أي حلاق' }, { en: 'Hassan', ar: 'حسن' }, { en: 'Omar', ar: 'عمر' }, { en: 'Youssef', ar: 'يوسف' }, { en: 'Karim', ar: 'كريم' }];
let lang = 'en';
const T = k => (lang === 'ar' ? AR[k] : EN[k]) ?? EN[k];
const num = n => n.toLocaleString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US');

function applyLang(l) {
  lang = l; document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach(e => e.textContent = T(e.dataset.i18n));
  $$('[data-i18n-html]').forEach(e => e.innerHTML = T(e.dataset.i18nHtml));
  $('#lang').textContent = l === 'ar' ? 'EN' : 'عربي';
  try { localStorage.setItem('maqass-lang', l); } catch (e) {}
  renderList(); renderBooking();
}
$('#lang').onclick = () => applyLang(lang === 'ar' ? 'en' : 'ar');

/* ------------------------------------------------------------------ menu list */
function renderList() {
  $('#list').innerHTML = SVC.map((s, i) => `<div class="row"><span class="n">0${i + 1}</span><h4>${lang === 'ar' ? s.ar : s.en}<small>${lang === 'ar' ? s.dar : s.den}</small></h4><span class="d">${s.min} ${lang === 'ar' ? 'د' : 'min'}</span><span class="p">${num(s.egp)} ${lang === 'ar' ? 'ج' : 'EGP'}</span></div>`).join('');
}

/* ------------------------------------------------------------------ booking */
const B = { svc: null, bar: 0, day: null, time: null };
const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i); return d; });
const TIMES = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
const taken = (d, b, t) => { let h = 7; for (const c of `${d}|${b}|${t}`) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 5 === 0; };
function dayLabel(d, i) {
  const loc = (lang === 'ar' ? 'ar-EG' : 'en-GB') + '-u-ca-gregory-nu-latn';
  if (i === 0) return lang === 'ar' ? 'النهارده' : 'Today';
  if (i === 1) return lang === 'ar' ? 'بكرة' : 'Tomorrow';
  return d.toLocaleDateString(loc, { weekday: 'short', day: 'numeric' });
}
function chips(el, items, sel, onPick) {
  el.innerHTML = items.map((it, i) => `<button class="chip${sel === i ? ' on' : ''}" ${it.dis ? 'disabled' : ''} data-i="${i}">${it.t}${it.s ? `<small>${it.s}</small>` : ''}</button>`).join('');
  el.querySelectorAll('.chip').forEach(b => b.onclick = () => { onPick(+b.dataset.i); renderBooking(); sfx('tick'); });
}
function renderBooking() {
  chips($('#cSvc'), SVC.map(s => ({ t: lang === 'ar' ? s.ar : s.en, s: `${num(s.egp)}` })), B.svc, i => B.svc = i);
  chips($('#cBar'), BARBERS.map(b => ({ t: b[lang] })), B.bar, i => { B.bar = i; B.time = null; });
  chips($('#cDay'), days.map((d, i) => ({ t: dayLabel(d, i) })), B.day, i => { B.day = i; B.time = null; });
  const now = new Date();
  chips($('#cTime'), TIMES.map(t => ({ t, dis: B.day === null || taken(B.day, B.bar, t) || (B.day === 0 && +t.slice(0, 2) <= now.getHours()) })), B.time, i => B.time = i);
  const s = B.svc !== null ? SVC[B.svc] : null;
  const rows = [
    [lang === 'ar' ? 'الخدمة' : 'Service', s ? (lang === 'ar' ? s.ar : s.en) : '...'],
    [lang === 'ar' ? 'الحلاق' : 'Barber', BARBERS[B.bar][lang]],
    [lang === 'ar' ? 'اليوم' : 'Day', B.day !== null ? dayLabel(days[B.day], B.day) : '...'],
    [lang === 'ar' ? 'الساعة' : 'Time', B.time !== null ? `<bdi dir="ltr">${TIMES[B.time]}</bdi>` : '...'],
    [lang === 'ar' ? 'المدة' : 'Duration', s ? `${s.min} ${lang === 'ar' ? 'دقيقة' : 'min'}` : '...']
  ];
  $('#sumdl').innerHTML = rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('');
  $('#tot').textContent = s ? `${num(s.egp)} ${lang === 'ar' ? 'ج' : 'EGP'}` : '0';
  const ok = s && B.day !== null && B.time !== null, a = $('#wa');
  a.classList.toggle('off', !ok);
  if (ok) {
    const d = days[B.day].toLocaleDateString((lang === 'ar' ? 'ar-EG' : 'en-GB') + '-u-ca-gregory-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });
    const msg = lang === 'ar'
      ? `أهلا مقص، عايز أحجز:\n${s.ar} (${s.egp} جنيه، ${s.min} دقيقة)\nالحلاق: ${BARBERS[B.bar].ar}\nيوم ${d} الساعة ${TIMES[B.time]}`
      : `Hi Maqass, I'd like to book:\n${s.en} (${s.egp} EGP, ${s.min} min)\nBarber: ${BARBERS[B.bar].en}\n${d} at ${TIMES[B.time]}`;
    a.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  } else a.href = '#';
}

/* ------------------------------------------------------------------ sound (synthesized, no licensing) */
let AC = null, master = null, soundOn = false;
function startAudio() {
  if (AC) return;
  AC = new (window.AudioContext || window.webkitAudioContext)();
  master = AC.createGain(); master.gain.value = 0; master.connect(AC.destination);
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = .6; lp.connect(master);
  const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = .07; lg.gain.value = 320; lfo.connect(lg).connect(lp.frequency); lfo.start();
  [[110, 'sine', .07], [164.81, 'triangle', .035], [220.5, 'sine', .03], [261.63, 'sine', .022], [329.2, 'sine', .014]].forEach(([f, t, g]) => {
    const o = AC.createOscillator(), gg = AC.createGain(); o.type = t; o.frequency.value = f; o.detune.value = (Math.random() - .5) * 8; gg.gain.value = g; o.connect(gg).connect(lp); o.start();
  });
  const len = AC.sampleRate * 4, nb = AC.createBuffer(1, len, AC.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() < .0009 ? (Math.random() * 2 - 1) * .9 : (Math.random() * 2 - 1) * .012;
  const ns = AC.createBufferSource(); ns.buffer = nb; ns.loop = true; const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
  const ng = AC.createGain(); ng.gain.value = .5; ns.connect(hp).connect(ng).connect(master); ns.start();
}
function setSound(on) {
  soundOn = on; $('#snd').classList.toggle('on', on);
  if (on) { startAudio(); AC.resume(); master.gain.setTargetAtTime(.55, AC.currentTime, .6); }
  else if (AC) master.gain.setTargetAtTime(0, AC.currentTime, .2);
}
$('#snd').onclick = () => setSound(!soundOn);
function sfx(kind) {
  if (!soundOn || !AC) return;
  const t0 = AC.currentTime;
  const burst = (at, f, q, dur, g) => {
    const n = AC.createBufferSource(), b = AC.createBuffer(1, AC.sampleRate * dur, AC.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (AC.sampleRate * dur * .18));
    n.buffer = b; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; const gg = AC.createGain(); gg.gain.value = g;
    n.connect(bp).connect(gg).connect(AC.destination); n.start(t0 + at);
  };
  const ring = (at, f, dur, g) => { const o = AC.createOscillator(), gg = AC.createGain(); o.frequency.value = f; gg.gain.setValueAtTime(g, t0 + at); gg.gain.exponentialRampToValueAtTime(.0001, t0 + at + dur); o.connect(gg).connect(AC.destination); o.start(t0 + at); o.stop(t0 + at + dur); };
  if (kind === 'snip') { burst(0, 4200, 3, .09, .5); burst(.11, 4800, 3, .08, .45); ring(0, 5200, .25, .03); }
  if (kind === 'shing') { burst(0, 6000, 1.5, .5, .35); ring(.02, 3170, 1.2, .05); ring(.02, 4730, .9, .03); }
  if (kind === 'tick') burst(0, 2500, 6, .03, .35);
}

/* ------------------------------------------------------------------ three */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.autoClear = false;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
const camera = new THREE.PerspectiveCamera(30, 1, .1, 100); camera.position.set(0, 0, 10);
const key = new THREE.DirectionalLight('#ffe2b8', 2.2); key.position.set(-4, 5, 6); scene.add(key);
const rim = new THREE.DirectionalLight('#c9a46a', 3.0); rim.position.set(5, 2, -4); scene.add(rim);
scene.add(new THREE.AmbientLight('#ffffff', .15));

let VW = innerWidth, VH = innerHeight, WW = 1, WH = 1;
function resize() {
  VW = innerWidth; VH = innerHeight; renderer.setSize(VW, VH, false); camera.aspect = VW / VH; camera.updateProjectionMatrix();
  WH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); WW = WH * camera.aspect;
}
addEventListener('resize', resize); resize();
const wx = px => (px / VW - .5) * WW, wy = py => -(py / VH - .5) * WH, wpx = px => px / VW * WW;
const mobile = () => VW <= 760;

function normalize(root, rotX = 0) {         // centre the model, scale its longest side to 1
  const inner = new THREE.Group(); inner.add(root); inner.rotation.x = rotX;
  const box = new THREE.Box3().setFromObject(inner), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const k = 1 / Math.max(size.x, size.y, size.z); const g = new THREE.Group(); inner.position.sub(c); const s = new THREE.Group(); s.add(inner); s.scale.setScalar(k); g.add(s); g.visible = false; scene.add(g);
  return g;
}
const metal = m => { if (m && m.metalness !== undefined) { m.envMapIntensity = 1.8; } };
const OBJ = {};
let loaded = 0; const NEED = 3;
function progress() { loaded++; $('#pct').textContent = String(Math.round(loaded / NEED * 100)).padStart(3, '0'); if (loaded >= NEED) ready(); }
// Published artifacts block data: URLs, so models ship as base64 text and are decoded here.
function loadModel(loader, url, onLoad, onProgress, onError) {
  const err = onError || (e => console.error(e));
  if (!url.endsWith('.b64.txt')) return loader.load(url, onLoad, onProgress, err);
  fetch(url).then(r => r.text()).then(t => { const s = atob(t.trim()), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); loader.parse(u.buffer, '', onLoad, err); }).catch(err);
}
const loader = new GLTFLoader();
const MX = window.__MX || '.glb';   // the published artifact serves models as embedded glTF JSON
['#f1 video', '#f2 video', '#bgv video'].forEach(s => { const v = $(s); if (v.readyState >= 2) progress(); else { let done = false; const f = () => { if (!done) { done = true; progress(); } }; v.addEventListener('loadeddata', f, { once: true }); setTimeout(f, 7000); v.load(); } });

function buildRazor(root) {
  const meshes = []; root.updateMatrixWorld(true);
  root.traverse(o => { if (o.isMesh) { metal(o.material); const b = new THREE.Box3().setFromObject(o); meshes.push({ o, b, s: b.getSize(new THREE.Vector3()), c: b.getCenter(new THREE.Vector3()) }); } });
  meshes.sort((a, b) => a.s.length() - b.s.length());
  const pin = meshes[0], [p, q] = [meshes[1], meshes[2]];
  const blade = p.s.y < q.s.y ? p : q, handle = blade === p ? q : p;   // the blade is the thinner part
  const pivot = new THREE.Group(); pivot.position.copy(pin.c); root.add(pivot);
  pivot.attach(blade.o);
  const ab = Math.atan2(blade.c.z - pin.c.z, blade.c.x - pin.c.x), ah = Math.atan2(handle.c.z - pin.c.z, handle.c.x - pin.c.x);
  let d = ab - ah; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  const g = normalize(root, Math.PI / 2); g.userData = { pivot, closed: d * .97 };
  return g;
}
function addShadow(g) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = -.5; g.add(m);
  const glow = new THREE.Mesh(new THREE.RingGeometry(.42, .44, 96), new THREE.MeshBasicMaterial({ color: '#c9a46a', transparent: true, opacity: .5, side: THREE.DoubleSide }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -.499; g.add(glow); g.userData.glow = glow;
}

/* ------------------------------------------------------------------ scroll */
const lenis = window.Lenis && !reduce ? new window.Lenis({ lerp: .085, wheelMultiplier: .9 }) : null;
if (lenis) { lenis.stop(); $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const h = a.getAttribute('href'); if (h.length > 1) { e.preventDefault(); lenis.scrollTo(h, { offset: 0, duration: 1.6 }); } })); }
document.documentElement.style.overflow = 'hidden';
const secP = el => { const r = el.getBoundingClientRect(); return { p: clamp(-r.top / (r.height - VH)), r }; };
const exitPx = r => Math.max(0, VH - r.bottom);   // how far the section has scrolled past its sticky end
const rectOf = el => el.getBoundingClientRect();

const frame1 = $('#f1'), frame2 = $('#f2');
const vids = $$('video');
const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: .01 });
let entered = false;
function ready() { $('#gate').classList.add('ready'); }
setTimeout(ready, 9000);
function enter(sound) {
  if (entered) return; entered = true; $('#gate').classList.add('out'); document.documentElement.style.overflow = '';
  if (lenis) lenis.start(); vids.forEach(v => io.observe(v)); if (sound) setSound(true);
}
$('#enterS').onclick = () => enter(true); $('#enterQ').onclick = () => enter(false);

/* hover video cards + cursor */
$$('.card').forEach(c => { const v = c.querySelector('video'); c.onmouseenter = () => { v.play().catch(() => {}); cur.classList.add('big'); }; c.onmouseleave = () => cur.classList.remove('big'); });
const cur = $('#cur'); let mx = VW / 2, my = VH / 2, cx = mx, cy = my;
addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
$$('a,button').forEach(a => { a.addEventListener('mouseenter', () => cur.classList.add('big')); a.addEventListener('mouseleave', () => cur.classList.remove('big')); });

/* ------------------------------------------------------------------ choreography */
let fired = {};
function once(k, cond, f) { if (cond && !fired[k]) { fired[k] = 1; f(); } if (!cond) fired[k] = 0; }

function hero(dt) {
  const { p, r } = secP($('#hero'));
  const m = mobile();
  const k = eio(seg(p, 0, .38));
  const fw = m ? VW - 32 : Math.min(VW * .36, 560), fh = m ? VH * .52 : VH * .7;
  const fx = (VW - fw) / 2 + (m ? 0 : (lang === 'ar' ? -1 : 1) * VW * .14 * seg(p, .4, .62)), fy = m ? VH * .12 : (VH - fh) / 2;
  const L = lerp(0, fx, k), Tp = lerp(0, fy, k), R = lerp(0, VW - fx - fw, k), Bt = lerp(0, VH - fy - fh, k);
  frame1.style.clipPath = `inset(${Tp}px ${R}px ${Bt}px ${L}px round ${k * 6}px)`;
  frame1.querySelector('video').style.transform = `scale(${1.15 - .15 * k})`;
  frame1.style.opacity = 1 - .45 * seg(p, .78, .98);
  const h = $('#hero h1'); const spread = k * (m ? 0 : VW * .3);
  h.querySelector('.a').style.transform = `translateX(${-spread}px)`; h.querySelector('.b').style.transform = `translateX(${spread}px)`;
  h.style.opacity = 1 - seg(p, .3, .44);
  $('#hero .kick').style.opacity = $('#hero .cue').style.opacity = 1 - seg(p, .02, .1);
  const cap = $('#cap1'); const kc = ease(seg(p, .64, .78)); cap.style.opacity = kc; cap.style.transform = (m ? '' : 'translateY(-50%) ') + `translateY(${(1 - kc) * 24}px)`;
  return null;   // the hero is footage and type only
  const on = p > .26 && r.bottom > 0; sc.visible = on; if (!on) return null;
  const a = ease(seg(p, .28, .56)), b = eio(seg(p, .56, .88));
  const cxp = fx + fw / 2, cyp = fy + fh / 2;
  const tx = m ? VW / 2 : VW * .5, ty = m ? VH * .36 : VH * .5;
  const size0 = wpx(fw) * lerp(.45, .92, a), size = lerp(size0, m ? WW * .8 : Math.min(WW * .56, WH * 1.05), b);
  sc.position.set(wx(lerp(cxp, tx, b)), wy(lerp(cyp + (1 - a) * fh * .25, ty, b)) + wpx(exitPx(r)), lerp(-2.5 + 2.5 * a, .6, b));
  sc.scale.setScalar(size);
  const t = performance.now() / 1000;
  sc.rotation.set(lerp(.9, .25, a) + Math.sin(t * .6) * .04, lerp(-.6, .35, a) + b * .5 + Math.sin(t * .5) * .06, lerp(-1.4, -.5, a) + b * .9);
  once('snip', p > .57, () => sfx('snip'));
  return { obj: sc, clip: p < .56 ? frame1 : null };
}

function tools() {
  const sec = $('#tools'); const { p: q, r } = secP(sec); const m = mobile();
  if (r.top > VH || r.bottom < 0) { if (OBJ.rz) OBJ.rz.visible = false; return null; }
  const fin = ease(seg(q, 0, .1));
  frame2.style.transform = `translateY(${(1 - fin) * 60}px)`; frame2.style.opacity = (.25 + .75 * fin) * (1 - .5 * seg(q, .7, .9));
  $$('#lines2 .l>span').forEach((s, i) => { const a = ease(seg(q, .04 + i * .05, .14 + i * .05)), o = 0; s.style.transform = `translateY(${(1 - a) * 120 - o * 120}%)`; s.style.opacity = a * (1 - o); });
  const rc = $('#razcap'), kc = ease(seg(q, .74, .86)); rc.style.opacity = kc; rc.style.transform = `translateY(${(1 - kc) * 24}px)`;
  const rz = OBJ.rz; if (!rz) return null;
  const on = q > .2; rz.visible = on; if (!on) return null;
  const fr = rectOf(frame2);
  const a = ease(seg(q, .22, .46)), b = eio(seg(q, .46, .74)), open = eio(seg(q, .5, .76));
  const tx = m ? VW / 2 : VW * (lang === 'ar' ? .44 : .56), ty = m ? VH * .42 : VH * .45;
  const size0 = wpx(fr.width) * lerp(.6, .95, a), size = lerp(size0, m ? WW * .72 : Math.min(WW * .5, WH * 1.1), b);
  rz.position.set(wx(lerp(fr.left + fr.width / 2, tx, b)), wy(lerp(fr.top + fr.height * lerp(.75, .5, a), ty, b)) + wpx(exitPx(r)), lerp(-2 + 2 * a, .4, b));
  rz.scale.setScalar(size);
  const t = performance.now() / 1000;
  rz.rotation.set(lerp(.5, .15, b) + Math.sin(t * .5) * .03, lerp(-.4, .2, a) + Math.sin(t * .4) * .05, lerp(-1.1, -.35, a) + b * 1.75);
  rz.userData.pivot.rotation.y = rz.userData.closed * (1 - open);
  once('shing', q > .55, () => sfx('shing'));
  return { obj: rz, clip: q < .46 ? frame2 : null };
}

function chair() {
  const sec = $('#chair'); const { p: c, r } = secP(sec); const m = mobile();
  const ch = OBJ.ch;
  if (r.top > VH || r.bottom < 0) { if (ch) ch.visible = false; return null; }
  $('#bgv').style.opacity = ease(seg(c, 0, .14)) * (1 - .6 * seg(c, .9, 1));
  $$('#hl3 .l>span').forEach((s, i) => { const a = ease(seg(c, .12 + i * .06, .26 + i * .06)); s.style.transform = `translateY(${(1 - a) * 105}%)`; });
  $('#hl3 p').style.opacity = ease(seg(c, .3, .4));
  $$('#chair .st').forEach((s, i) => { const a = ease(seg(c, .46 + i * .08, .58 + i * .08)); s.style.opacity = a; s.style.transform = `translateY(${(1 - a) * 20}px)`; });
  if (!ch) return null;
  ch.visible = true;
  const a = ease(seg(c, 0, .2)), t = performance.now() / 1000;
  const tx = m ? VW / 2 : VW * (lang === 'ar' ? .45 : .55);
  ch.position.set(wx(tx), wy(m ? VH * .5 : VH * .53) - (1 - a) * WH * .7 + wpx(exitPx(r)), 0);
  ch.scale.setScalar(WH * (m ? .5 : .64));
  ch.rotation.set(.12, -.9 + c * Math.PI * 1.7 + Math.sin(t * .3) * .02, 0);
  ch.userData.glow.material.opacity = .5 * a;
  return { obj: ch, clip: null };
}

/* ------------------------------------------------------------------ loop */
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (lenis) lenis.raf(now);
  cx += (mx - cx) * .2; cy += (my - cy) * .2; cur.style.transform = `translate(${cx}px,${cy}px)`;
  const jobs = [hero(dt), tools(), chair()].filter(Boolean);
  renderer.setScissorTest(false); renderer.clear();
  const all = [OBJ.sc, OBJ.rz, OBJ.ch].filter(Boolean);
  for (const j of jobs) {
    all.forEach(o => o.userData._v = o.visible); all.forEach(o => o.visible = o === j.obj);
    if (j.clip) { const f = j.clip.getBoundingClientRect(); const ins = clipInset(j.clip); renderer.setScissorTest(true); renderer.setScissor(f.left + ins.l, VH - (f.bottom - ins.b), Math.max(0, f.width - ins.l - ins.r), Math.max(0, f.height - ins.t - ins.b)); }
    renderer.render(scene, camera); renderer.setScissorTest(false);
    all.forEach(o => o.visible = o.userData._v);
  }
  requestAnimationFrame(frame);
}
function clipInset(el) {                            // the hero frame is clipped with inset(); read it back
  const m = /inset\(([\d.]+)px ([\d.]+)px ([\d.]+)px ([\d.]+)px/.exec(el.style.clipPath || '');
  return m ? { t: +m[1], r: +m[2], b: +m[3], l: +m[4] } : { t: 0, r: 0, b: 0, l: 0 };
}

/* ------------------------------------------------------------------ boot */
let start = 'en';
try { start = localStorage.getItem('maqass-lang') || 'en'; } catch (e) {}
if (location.hash === '#ar') start = 'ar'; if (location.hash === '#en') start = 'en';
applyLang(start);
requestAnimationFrame(frame);
if (new URLSearchParams(location.search).has('skip')) enter(false);
window.__setProgress = v => { const y = v * (document.documentElement.scrollHeight - VH); if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); };
window.__enter = enter;
