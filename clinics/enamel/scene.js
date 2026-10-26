import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* Enamel: a real scanned molar is "scanned" by a light plane that turns it from photo to X-ray,
   then each layer (enamel, dentin, pulp) lights up in turn, then the whole mouth maps itself tooth by tooth. */

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = t => 1 - Math.pow(1 - t, 3);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WA = '';
if (window.__BACK) $('#back').href = window.__BACK;
const MX = window.__MX || '.glb';

/* ---------------------------------------------------------------- i18n */
const AR = {
  n1: 'السكان', n2: 'العلاجات', n3: 'الحجز', nb: 'احجز سكان ثلاثي الأبعاد',
  hud1: 'إينامل لطب الأسنان', hud2: 'القاهرة الجديدة / التجمع الخامس', hudm: 'الوضع', huds: 'السكان', hudl: 'الطبقة', hudr: 'الدقة',
  l0k: 'عيادة أسنان / القاهرة الجديدة', l0h: 'بنشوف اللي غيرنا <span class="ice">بيخمّنه.</span>', l0p: 'كل زيارة في إينامل بتبدأ بسكان ثلاثي الأبعاد لسنانك من جوه وبره. بتشوف اللي احنا شايفينه، قبل أي قرار.', l0c: 'احجز سكان ثلاثي الأبعاد',
  l1k: 'خطوة 00 / السكان', l1h: 'اتناشر ثانية. <span class="ice">من غير طبعات.</span>', l1p: 'جهاز ضوئي بيعدّي على سنانك ويبني موديل ثلاثي الأبعاد بدقة عُشر مليمتر. من غير طبعات بتخنق، ومن غير تخمين.',
  l2k: 'طبقة 01 / المينا', l2h: 'أقوى حاجة <span class="ice">في جسمك.</span>', l2p: 'البقع والكسور والتآكل كلها هنا. التبييض والبوندنج والفينير بيشتغلوا على القشرة دي بس، مش أعمق.',
  l3k: 'طبقة 02 / العاج', l3h: 'هنا التسوس <span class="ice">بينتشر.</span>', l3p: 'أطرى من المينا، فالتسوس بيمشي بسرعة أول ما يدخل. لو اتمسك بدري على السكان، يبقى حشو واحد وعشرين دقيقة.',
  l4k: 'طبقة 03 / العصب', l4h: 'العصب. <span class="warm">الحتة اللي بتوجع.</span>', l4p: 'لو التسوس وصل هنا، علاج العصب بينقذ السنة. في إينامل غالبًا بيخلص في زيارة واحدة هادية ببنج موضعي.',
  l5k: 'الفم كله / 32 سنة', l5h: 'ابتسامتك كلها <span class="ice">متخططة الأول.</span>', l5p: 'بنخطط على الموديل قبل ما نلمس أي سنة. بتستلم الخريطة والخطة والسعر على واتساب في نفس اليوم.',
  cuk: 'ضوء أزرق / 20 ثانية', cuh: 'حشو بيشد <span class="ice">قبل ما ترمش مرتين.</span>',
  txh: 'العلاجات، <span class="ice">طبقة بطبقة.</span>', txp: 'الأسعار شاملة مراجعة السكان ومتابعة. تقسيط على 12 شهر لخطط العلاج اللي فوق 10,000 جنيه.',
  bkk: 'أول زيارة', bkh: 'ابدأ <span class="ice">بسكان ثلاثي الأبعاد.</span>', bkp: '45 دقيقة: سكان كامل، مراجعة أشعة، وخطة علاج بالأسعار. 900 جنيه، بتتخصم من أي علاج تبدأه خلال 30 يوم.',
  b1: 'جاي ليه', b2: 'اليوم المناسب', b3: 'الساعة', bgo: 'اطلب على واتساب',
  fa: 'شارع التسعين الشمالي، التجمع الخامس، القاهرة الجديدة', fh: 'المواعيد', fh1: 'من السبت للخميس، 10 الصبح لـ 10 بالليل', fc: 'تواصل', fc1: 'الحجز على واتساب',
  fcr: 'موقع تجريبي لعيادة خيالية، من تنفيذ Scrollar. مجسمات: "Maxillary First Molar" و"Permanent Dentition" من جامعة دندي، كلية طب الأسنان (CC BY 4.0) عبر Sketchfab. الفيديوهات: Mixkit.', fm: 'مفهوم من Scrollar'
};
const EN = {}; $$('[data-i18n]').forEach(e => EN[e.dataset.i18n] = e.textContent); $$('[data-i18n-html]').forEach(e => EN[e.dataset.i18nHtml] = e.innerHTML);
let lang = 'en'; const T = k => (lang === 'ar' ? AR[k] : EN[k]) ?? EN[k];
const N = n => n.toLocaleString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US');

const TX = [
  { l: 'Surface', la: 'السطح', en: 'Scan, check-up and cleaning', ar: 'سكان، كشف وتنظيف', den: '3D scan, X-ray review, scaling and polish', dar: 'سكان ثلاثي الأبعاد، مراجعة أشعة، إزالة جير وتلميع', p: 1800 },
  { l: 'Enamel', la: 'المينا', en: 'Whitening', ar: 'تبييض', den: 'In-clinic, one session, up to 8 shades', dar: 'في العيادة، جلسة واحدة، لحد 8 درجات', p: 6000 },
  { l: 'Enamel', la: 'المينا', en: 'Porcelain veneer', ar: 'فينير بورسلين', den: 'Designed on your scan, per tooth', dar: 'متصمم على السكان بتاعك، للسنة', p: 11000 },
  { l: 'Dentin', la: 'العاج', en: 'White filling', ar: 'حشو تجميلي', den: 'Set under blue light, per tooth', dar: 'بيشد بالضوء الأزرق، للسنة', p: 1600 },
  { l: 'Pulp', la: 'العصب', en: 'Root canal', ar: 'علاج عصب', den: 'Usually one visit, molar from', dar: 'غالبًا زيارة واحدة، الضرس من', p: 5500, warm: 1 },
  { l: 'Full mouth', la: 'الفم كله', en: 'Smile plan', ar: 'خطة ابتسامة', den: 'Full 3D mapping and a staged plan', dar: 'خريطة كاملة ثلاثية الأبعاد وخطة على مراحل', p: 2500 }
];
function renderTx() {
  $('#txl').innerHTML = TX.map(x => `<div class="trow"><span class="ly ${x.warm ? 'warm' : 'ice'}">${lang === 'ar' ? x.la : x.l}</span><h4>${x[lang]}</h4><p>${lang === 'ar' ? x.dar : x.den}</p><span class="p">${N(x.p)} ${lang === 'ar' ? 'ج' : 'EGP'}</span></div>`).join('');
}
const WHY = [{ en: 'Check-up and scan', ar: 'كشف وسكان' }, { en: 'Pain', ar: 'وجع' }, { en: 'Whitening', ar: 'تبييض' }, { en: 'Veneers', ar: 'فينير' }, { en: 'Root canal', ar: 'علاج عصب' }];
const TIMES = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
const days = [...Array(6)].map((_, i) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i + 1); return d; });
const B = { why: null, day: null, time: null };
const dayL = d => d.toLocaleDateString((lang === 'ar' ? 'ar-EG' : 'en-GB') + '-u-ca-gregory-nu-latn', { weekday: 'short', day: 'numeric' });
const taken = (d, t) => ((d * 7 + t * 3) % 5) === 0;
function ops(el, items, k) {
  el.innerHTML = items.map((o, i) => `<button class="op${B[k] === i ? ' on' : ''}" ${o.dis ? 'disabled style="opacity:.25;text-decoration:line-through"' : ''} data-i="${i}">${o.t}</button>`).join('');
  el.querySelectorAll('.op').forEach(b => b.onclick = () => { B[k] = +b.dataset.i; if (k === 'day') B.time = null; renderBook(); });
}
function renderBook() {
  ops($('#oWhy'), WHY.map(w => ({ t: w[lang] })), 'why');
  ops($('#oDay'), days.map(d => ({ t: dayL(d) })), 'day');
  ops($('#oTime'), TIMES.map((t, i) => ({ t, dis: B.day === null || taken(B.day, i) })), 'time');
  const ok = B.why !== null && B.day !== null && B.time !== null, a = $('#go');
  a.classList.toggle('off', !ok);
  if (ok) {
    const d = days[B.day].toLocaleDateString((lang === 'ar' ? 'ar-EG' : 'en-GB') + '-u-ca-gregory-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });
    const msg = lang === 'ar' ? `أهلا إينامل، عايز أحجز أول زيارة وسكان.\nالسبب: ${WHY[B.why].ar}\nيوم ${d} الساعة ${TIMES[B.time]}`
      : `Hi Enamel, I'd like to book a first visit and 3D scan.\nReason: ${WHY[B.why].en}\n${d} at ${TIMES[B.time]}`;
    a.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  } else a.href = '#';
}
function applyLang(l) {
  lang = l; document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach(e => e.textContent = T(e.dataset.i18n)); $$('[data-i18n-html]').forEach(e => e.innerHTML = T(e.dataset.i18nHtml));
  $('#lang').textContent = l === 'ar' ? 'EN' : 'عربي';
  try { localStorage.setItem('enamel-lang', l); } catch (e) {}
  renderTx(); renderBook();
}
$('#lang').onclick = () => applyLang(lang === 'ar' ? 'en' : 'ar');

/* ---------------------------------------------------------------- three */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
const key = new THREE.DirectionalLight('#ffffff', 1.6); key.position.set(-3, 4, 5); scene.add(key);
const rimL = new THREE.DirectionalLight('#8fd3ff', 2.4); rimL.position.set(4, 1, -4); scene.add(rimL);
const camera = new THREE.PerspectiveCamera(28, 1, .1, 100); camera.position.set(0, 0, 4.2);

// the scan: real material keeps everything below the light, X-ray keeps everything above it
const pReal = new THREE.Plane(new THREE.Vector3(0, -1, 0), 10), pX = new THREE.Plane(new THREE.Vector3(0, 1, 0), -10);
function xray(color, opacity = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uI: { value: 1 }, uO: { value: opacity } },
    vertexShader: `#include <clipping_planes_pars_vertex>
      varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mvPosition = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader: `#include <clipping_planes_pars_fragment>
      uniform vec3 uColor; uniform float uI; uniform float uO; varying vec3 vN; varying vec3 vV;
      void main(){
        #include <clipping_planes_fragment>
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.4);
        vec3 c = uColor * (0.06 + 1.35 * f) * uI;
        gl_FragColor = vec4(c, (0.04 + f) * uO * uI); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, clipping: true
  });
}
const tooth = new THREE.Group(); tooth.visible = false; scene.add(tooth);
const layers = {};
let mouth = null, mouthTeeth = [];

function centred(root, rotX = 0) {
  const inner = new THREE.Group(); inner.add(root); inner.rotation.x = rotX; inner.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inner), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  inner.position.sub(c); const s = new THREE.Group(); s.add(inner); s.scale.setScalar(1 / Math.max(size.x, size.y, size.z)); return s;
}
// Published artifacts block data: URLs, so models ship as base64 text and are decoded here.
function loadModel(loader, url, onLoad, onProgress, onError) {
  const err = onError || (e => console.error(e));
  if (!url.endsWith('.b64.txt')) return loader.load(url, onLoad, onProgress, err);
  fetch(url).then(r => r.text()).then(t => { const s = atob(t.trim()), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); loader.parse(u.buffer, '', onLoad, err); }).catch(err);
}
const loader = new GLTFLoader();
let ready = 0;
loadModel(loader, 'assets/molar' + MX, g => {
  const base = centred(g.scene, Math.PI);           // upper molar: flip so the crown is on top, roots below
  const real = base.clone(true);
  real.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.clippingPlanes = [pReal]; o.material.envMapIntensity = 1.2; o.material.roughness = .35; } });
  tooth.add(real); layers.real = real;
  [['shell', '#8fd3ff', 1], ['dentin', '#b9c8ff', .8], ['pulp', '#ff7a62', .42]].forEach(([n, col, sc]) => {
    const w = new THREE.Group(), c = base.clone(true), m = xray(col);
    m.clippingPlanes = [pX];
    c.traverse(o => { if (o.isMesh) o.material = m; });
    w.add(c); w.scale.set(sc, n === 'pulp' ? sc * 1.25 : sc, sc); if (n === 'pulp') w.position.y = .04;
    w.userData.m = m; tooth.add(w); layers[n] = w;
  });
  // the scanning light: a thin glowing disc
  const disc = new THREE.Mesh(new THREE.RingGeometry(0, .62, 96), new THREE.ShaderMaterial({
    uniforms: { uO: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vU; void main(){ vU = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float uO; varying vec2 vU; void main(){ float r = length(vU) / .62; float a = smoothstep(1.0, .55, r) * .35 + smoothstep(.08, 0.0, abs(r - .78)) * .9; gl_FragColor = vec4(vec3(.56,.83,1.0) * a * uO, a * uO); }'
  }));
  disc.rotation.x = -Math.PI / 2; scene.add(disc); layers.disc = disc;
  tooth.visible = true; ready++;
});
loadModel(loader, 'assets/dentition' + MX, g => {
  mouth = new THREE.Group(); mouth.add(centred(g.scene)); mouth.visible = false; scene.add(mouth);
  const meshes = []; mouth.updateMatrixWorld(true);
  g.scene.traverse(o => { if (o.isMesh && o.geometry.attributes.position.count > 50) meshes.push(o); });
  meshes.forEach(o => { const b = new THREE.Box3().setFromObject(o); o.userData.cx = b.getCenter(new THREE.Vector3()).x; o.material = xray('#8fd3ff', .9); });
  const xs = meshes.map(o => o.userData.cx), mn = Math.min(...xs), mx = Math.max(...xs);
  meshes.forEach(o => o.userData.k = (o.userData.cx - mn) / (mx - mn));
  const target = meshes.find(o => /LL6|ll6|blinn10/i.test(o.name)) || meshes[5];
  target.userData.target = true; target.material = xray('#ff7a62', 1);
  mouthTeeth = meshes; ready++;
});

let VW = innerWidth, VH = innerHeight;
function resize() { VW = innerWidth; VH = innerHeight; renderer.setSize(VW, VH, false); camera.aspect = VW / VH; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* ---------------------------------------------------------------- scroll */
const lenis = window.Lenis && !reduce ? new window.Lenis({ lerp: .085 }) : null;
if (lenis) $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const h = a.getAttribute('href'); if (h.length > 1) { e.preventDefault(); lenis.scrollTo(h, { duration: 1.6 }); } }));
const vio = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: .05 });
$$('video').forEach(v => vio.observe(v));

let prog = 0;
function frame(now) {
  if (lenis) lenis.raf(now);
  const st = $('#story'), r = st.getBoundingClientRect(); const target = clamp(-r.top / (r.height - VH));
  prog += (target - prog) * (reduce ? 1 : .12); const p = prog, t = now / 1000, m = VW <= 820;
  // copy layers
  $$('.layer').forEach(l => { const [a, b] = l.dataset.step.split(',').map(Number); const k = a === 0 ? 1 - seg(p, b - .02, b) : seg(p, a, a + .025) * (b >= 1 ? 1 : 1 - seg(p, b - .02, b)); l.style.opacity = k; l.classList.toggle('on', k > .5); l.style.transform = (m ? '' : 'translateY(-50%) ') + `translateY(${(1 - k) * 16}px)`; });
  const stepIdx = [[0, .11], [.13, .27], [.31, .45], [.48, .61], [.64, .77], [.81, 1]].findIndex(([a, b]) => p >= a - .01 && p <= b + .02);
  $$('#prog i').forEach((i, k) => i.classList.toggle('on', k <= stepIdx));
  // camera framing: object to the side opposite the copy on desktop, above it on mobile
  if (m) camera.setViewOffset(VW, VH, 0, VH * .2, VW, VH); else camera.setViewOffset(VW, VH, (lang === 'ar' ? 1 : -1) * VW * .17, 0, VW, VH);

  // scan sweep
  const sweep = eio(seg(p, .12, .29)); const sy = lerp(.62, -.62, sweep);
  pReal.constant = sy; pX.constant = -sy;
  const scanning = p > .12 && p < .29;
  $('#hMode').textContent = p < .12 ? 'VISUAL' : scanning ? 'SCANNING' : 'X-RAY';
  $('#hScan').textContent = String(Math.round(sweep * 100)).padStart(3, '0') + '%';
  const lay = p < .3 ? 'SURFACE' : p < .47 ? 'ENAMEL' : p < .63 ? 'DENTIN' : p < .79 ? 'PULP' : 'FULL MOUTH';
  $('#hLayer').textContent = lay; $('#hLayer').style.color = lay === 'PULP' ? '#ff7a62' : '';

  if (layers.real) {
    const out = ease(seg(p, .78, .86));
    tooth.visible = out < 1;
    const sc = lerp(1.2, 1.32, ease(seg(p, .28, .4))) * (1 - .6 * out);
    tooth.scale.setScalar(sc * (m ? .62 : 1)); tooth.position.y = lerp(0, -.08, ease(seg(p, .28, .4))) + out * .3;
    tooth.rotation.set(.12 + Math.sin(t * .4) * .03, -0.5 + p * Math.PI * 2.2 + t * .05, .05);
    layers.disc.position.y = sy * sc * (m ? .62 : 1) + tooth.position.y; layers.disc.scale.setScalar(sc * 1.05 * (m ? .62 : 1)); layers.disc.material.uniforms.uO.value = scanning ? Math.sin(Math.PI * sweep) * 1.2 + .3 : 0;
    // layer emphasis
    const e = seg(p, .3, .34) * (1 - seg(p, .45, .48)), d = seg(p, .47, .51) * (1 - seg(p, .61, .64)), q = seg(p, .63, .67) * (1 - seg(p, .78, .8));
    const base = p > .29 ? 1 : 0;
    layers.shell.userData.m.uniforms.uI.value = (lerp(.7, 1.6, e) * (1 - .45 * Math.max(d, q))) * (1 - out);
    layers.dentin.userData.m.uniforms.uI.value = (lerp(.25, 1.5, d) * (1 - .4 * q) + .15 * e) * (1 - out) * (base ? 1 : .6);
    layers.pulp.userData.m.uniforms.uI.value = (lerp(.3, 2.2, q) + .1 * d) * (1 - out) * (base ? 1 : .6);
    layers.pulp.scale.x = layers.pulp.scale.z = .42 * (1 + .04 * Math.sin(t * 3) * q);
    layers.real.visible = p < .3;
  }
  if (mouth) {
    const inn = ease(seg(p, .8, .9)); mouth.visible = inn > 0;
    mouth.scale.setScalar(lerp(1.05, (VW <= 820 ? 1.2 : 1.32), inn)); mouth.position.y = lerp(-.4, 0, inn);
    mouth.rotation.set(.25, -.6 + p * 1.2 + Math.sin(t * .3) * .05, 0);
    const wave = seg(p, .84, .97);
    mouthTeeth.forEach(o => { const k = clamp((wave * 1.3 - o.userData.k * .9) * 3); o.material.uniforms.uI.value = inn * (o.userData.target ? (.5 + 1.6 * k * (.85 + .15 * Math.sin(t * 4))) : (.35 + .9 * k)); });
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

let start = 'en'; try { start = localStorage.getItem('enamel-lang') || 'en'; } catch (e) {}
if (location.hash === '#ar') start = 'ar'; if (location.hash === '#en') start = 'en';
applyLang(start);
requestAnimationFrame(frame);
window.__setProgress = v => { const y = v * (document.documentElement.scrollHeight - innerHeight); if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); prog = clamp(-$('#story').getBoundingClientRect().top / ($('#story').offsetHeight - innerHeight)); };
