// Fade District C: "The pole". One glass barber pole, lit like a product shot.
// The scroll turns it; each chapter's words ride up the red stripe, wrapped around the glass.
// At the end the pole slows down and tonight's free times sit on the stripes.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const C = window.CONCEPT;
const canvas = document.getElementById('stage');
const story = document.getElementById('story');
const isMobile = matchMedia('(max-width: 760px)').matches;
const lang = () => document.documentElement.lang === 'ar' ? 'ar' : 'en';
const DISPLAY = "'Big Shoulders Display',Impact,'Arial Narrow',sans-serif";
const AR = "'Lalezar','Readex Pro',Tahoma,sans-serif";

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.8;
const camera = new THREE.PerspectiveCamera(isMobile ? 38 : 30, 1, 0.1, 60);
const key = new THREE.DirectionalLight(0xfff0e0, 1.6); key.position.set(-4, 5, 6); scene.add(key);
const rim = new THREE.DirectionalLight(0xff4a3a, 2.4); rim.position.set(5, 1, -3); scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, 0.2));

// ---------- the stripe pattern (one tile = full circumference x one turn) ----------
const TW = 1024, TH = 909, TURNS = 1.4;          // steep stripes: 1.4 turns along the pole, so words read on the front
const SLOPE = TW / TH;                            // horizontal shift per pixel of height: one full turn per tile
const BANDS = [['#d6312a', 300], ['#f3efe6', 212], ['#1d2f4a', 300], ['#f3efe6', 212]];   // red, cream, navy, cream
const ANG = Math.atan2(TH, TW);
function bandPath(x, ctx, x0, w, keep) {   // parallelogram for a band starting at x0 (at the bottom row), width w
  if (!keep) ctx.beginPath(); ctx.moveTo(x0, TH); ctx.lineTo(x0 + w, TH); ctx.lineTo(x0 + w + TW, 0); ctx.lineTo(x0 + TW, 0); ctx.closePath();
}
const stripeCv = document.createElement('canvas'); stripeCv.width = TW; stripeCv.height = TH;
{
  const x = stripeCv.getContext('2d'); let pos = 0;
  for (const [col, w] of BANDS) { x.fillStyle = col; for (const off of [-2 * TW, -TW, 0, TW]) { bandPath(0, x, pos + off, w); x.fill(); } pos += w; }
  // soft shading at the band edges so it reads as painted glass, not flat vector
  x.globalCompositeOperation = 'multiply'; const g = x.createLinearGradient(0, 0, TW, 0);
  for (let k = 0; k <= 8; k++) g.addColorStop(k / 8, k % 2 ? '#f2f2f2' : '#ffffff'); x.fillStyle = g; x.fillRect(0, 0, TW, TH);
}
const compCv = document.createElement('canvas'); compCv.width = TW; compCv.height = TH; const compX = compCv.getContext('2d');
const stripeTex = new THREE.CanvasTexture(compCv); stripeTex.colorSpace = THREE.SRGBColorSpace; stripeTex.wrapS = stripeTex.wrapT = THREE.RepeatWrapping; stripeTex.repeat.set(1, TURNS); stripeTex.anisotropy = 8;

let lastOp = '';
// words that ride the red band (one transparent layer per chapter, cross-faded)
const RED_X0 = 0, RED_W = BANDS[0][1];
function wordsFor(i) {
  const s = C.services, cur = ` ${lang() === 'ar' ? 'ج.م' : 'EGP'}`, ar = lang() === 'ar';
  const name = id => { const x = s.find(v => v.id === id); return ar ? x.name.ar : x.name.en.toUpperCase(); };
  return [
    [ar ? 'فيد ديستريكت' : 'FADE DISTRICT'],
    ar ? ['مواعيد فاضية', 'النهارده'] : ['FREE SLOTS', 'TONIGHT'],
    C.staff.map(p => ar ? p.name.ar : p.name.en.toUpperCase()),
    [name('shave'), `${s.find(v => v.id === 'shave').price}${cur}`],
    ['19:00', '19:30', '20:30'],
  ][i];
}
const layers = [0, 1, 2, 3, 4].map(i => {
  const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
  const t = { needsUpdate: false };
  const draw = () => {
    const x = cv.getContext('2d'); x.clearRect(0, 0, TW, TH);
    const items = wordsFor(i), ar = lang() === 'ar', n = items.length;
    const bandLen = Math.hypot(TW, TH), slot = bandLen / Math.max(2, n) - 70;
    const f = k => ar ? `400 ${k}px ${AR}` : `800 ${k}px ${DISPLAY}`;
    x.save(); x.beginPath(); for (const off of [-2 * TW, -TW, 0, TW]) bandPath(0, x, RED_X0 + off, RED_W, true); x.clip();
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = ar ? 'rtl' : 'ltr'; x.fillStyle = '#fff6ea';
    const reps = n === 1 ? 2 : 1;                       // a single phrase is written twice along the band
    for (let r = 0; r < reps; r++) items.forEach((txt, k) => {
      let fs = 132; x.font = f(fs); const w = x.measureText(txt).width; if (w > slot) { fs *= slot / w; x.font = f(fs); }
      const sPos = (r * n + k + 0.5) / (n * reps);
      const px = RED_X0 + RED_W / 2 + sPos * TW, py = TH - sPos * TH;
      for (const i2 of [-1, 0, 1]) for (const j2 of [-1, 0, 1]) { x.save(); x.translate(px + i2 * TW + j2 * TW, py - j2 * TH); x.rotate(-ANG); x.fillText(txt, 0, ar ? 8 : 5); x.restore(); }
    });
    x.restore(); lastOp = '';
  };
  draw(); return { cv, draw };
});

// ---------- the pole ----------
const pole = new THREE.Group(); scene.add(pole);
const R = 0.64, H = 4.3;
const inner = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 96, 1, true), new THREE.MeshStandardMaterial({ map: stripeTex, emissiveMap: stripeTex, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.4 }));
const spinner = new THREE.Group(); pole.add(spinner); spinner.add(inner);
// texture u of each word's centre on the red band (the one sitting nearest the middle of the pole)
function wordPos(i) { const n = wordsFor(i).length; const S = n === 1 ? [0.75] : Array.from({ length: n }, (_, k) => (k + 0.5) / n);
  return S.map(sp => ((RED_X0 + RED_W / 2 + sp * TW) / TW) % 1); }
function composite(ops) {   // stripes + the visible word layers, baked into one opaque texture (glass transmission only sees opaque objects)
  const key = ops.map(o => o.toFixed(2)).join(); if (key === lastOp) return; lastOp = key;
  compX.globalAlpha = 1; compX.drawImage(stripeCv, 0, 0);
  ops.forEach((o, i) => { if (o > 0.005) { compX.globalAlpha = o; compX.drawImage(layers[i].cv, 0, 0); } }); compX.globalAlpha = 1; stripeTex.needsUpdate = true;
}
const glass = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.12, R + 0.12, H + 0.06, 96, 1, true),
  new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, transmission: 1, thickness: 0.08, ior: 1.45, transparent: true, opacity: 1, envMapIntensity: 1.4, specularIntensity: 1 }));
pole.add(glass);
// a thin highlight streak down the glass
{ const s = new THREE.Mesh(new THREE.PlaneGeometry(0.06, H), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false })); s.position.set(-0.3, 0, R + 0.11); s.rotation.y = -0.5; pole.add(s);
  const s2 = s.clone(); s2.material = s.material.clone(); s2.material.opacity = 0.14; s2.scale.x = 2.4; s2.position.set(0.36, 0, R + 0.1); s2.rotation.y = 0.55; pole.add(s2); }
const chrome = new THREE.MeshPhysicalMaterial({ color: 0xf0f2f5, metalness: 1, roughness: 0.1, envMapIntensity: 2.2 });
{
  const prof = [[0, 0.38], [0.22, 0.36], [0.5, 0.28], [0.72, 0.16], [0.76, 0.08], [0.72, 0], [0, 0]].map(([r, y]) => new THREE.Vector2(r, y));
  const cap = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), chrome); cap.scale.set(1.13, 1, 1.13); cap.position.y = H / 2; pole.add(cap);
  const bot = cap.clone(); bot.scale.set(1.13, -1, 1.13); bot.position.y = -H / 2; pole.add(bot);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.81, 0.035, 16, 96), chrome); ring.rotation.x = Math.PI / 2; ring.position.y = H / 2 + 0.02; pole.add(ring);
  const ring2 = ring.clone(); ring2.position.y = -H / 2 - 0.02; pole.add(ring2);
  // glass globe on top, lit from inside
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.34, 64, 32), new THREE.MeshPhysicalMaterial({ color: 0xf6e7d2, roughness: 0.35, clearcoat: 1, emissive: 0xffb877, emissiveIntensity: 0.35 }));
  globe.position.y = H / 2 + 0.66; pole.add(globe);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), chrome); finial.position.y = H / 2 + 1.04; pole.add(finial);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 48), chrome); tip.rotation.x = Math.PI; tip.position.y = -H / 2 - 0.55; pole.add(tip);
}
const glowLight = new THREE.PointLight(0xffe0c0, 3, 4, 2); glowLight.position.y = H / 2 + 0.75; pole.add(glowLight);
// soft red halo behind and a contact shadow below
const halo = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(226,59,46,.38)'); g.addColorStop(1, 'rgba(226,59,46,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(5, 8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, toneMapped: false })); m.position.z = -2.2; scene.add(m); return m; })();

// ---------- timeline ----------
const sm = t => t * t * (3 - 2 * t);
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const lerp = THREE.MathUtils.lerp;
// which chapter's words are on the stripe: hero, three chapters, end (matches the text layers)
const WIN = [[0, 0.16], [0.17, 0.41], [0.42, 0.64], [0.65, 0.87], [0.88, 1.01]];
// camera: wide product shot in the hero, then closer on the middle of the pole, then back out
const CAM = [[0, 15, 0.35], [0.15, 8.6, 0.2], [0.4, 8.0, 0], [0.64, 7.8, -0.2], [0.86, 9, 0.1], [1, 14.5, 0.35]];
function camAt(p) { for (let i = 0; i < CAM.length - 1; i++) { const [p0, z0, y0] = CAM[i], [p1, z1, y1] = CAM[i + 1]; if (p <= p1) { const k = sm(seg(p, p0, p1)); return [lerp(z0, z1, k), lerp(y0, y1, k)]; } } return [CAM.at(-1)[1], CAM.at(-1)[2]]; }

let target = 0, prog = 0, mx = 0, my = 0, tmx = 0, tmy = 0, spinT = 0;
const readScroll = () => { const r = story.getBoundingClientRect(); target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };
addEventListener('scroll', readScroll, { passive: true });
addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; }, { passive: true });

function layout(p, t, dt) {
  const rtl = document.documentElement.dir === 'rtl';
  mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
  const end = sm(seg(p, 0.86, 1));
  // scroll turns the pole; an idle spin keeps it alive and fades out at the end
  spinT += dt * 0.35 * (1 - end);
  // free spin, but each chapter holds its words facing you and sweeps slowly across them
  let ang = -(p * Math.PI * 7 + spinT);
  WIN.forEach(([a, b], i) => {
    const h = sm(seg(p, a + 0.035, a + 0.075)) * (1 - sm(seg(p, b - 0.075, b - 0.035)));
    if (h <= 0) return;
    const pos = wordPos(i), kr = pos.length === 1 ? 0 : seg(p, a + 0.06, b - 0.06) * (pos.length - 1), k = Math.floor(kr) + sm(sm(kr - Math.floor(kr)));   // rest on each word, then move to the next
    const k0 = Math.floor(k), k1 = Math.min(pos.length - 1, k0 + 1), u = lerp(pos[k0], pos[k1], k - k0);
    let al = -u * Math.PI * 2; al += Math.PI * 2 * Math.round((ang - al) / (Math.PI * 2));
    ang = lerp(ang, al, h);
  });
  spinner.rotation.y = ang;
  // the word layer for the current chapter fades in, the others out
  composite(WIN.map(([a, b], i) => Math.min(1, sm(seg(p, a, a + 0.03)) * (1 - sm(seg(p, b - 0.03, b))) + (i === 0 && p < 0.01 ? 1 : 0))));
  pole.rotation.z = (rtl ? 1 : -1) * 0.04 * (1 - end);
  pole.rotation.x = 0.05 + my * 0.05;
  pole.position.y = Math.sin(t * 0.7) * 0.04;
  const [cz, cy] = camAt(p);
  camera.position.set(Math.sin(mx * 0.6) * 1.2, cy + 0.4, cz); camera.lookAt(0, cy, 0);
  if (!isMobile) camera.setViewOffset(innerWidth, innerHeight, (rtl ? 1 : -1) * innerWidth * 0.2, 0, innerWidth, innerHeight);
  else camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.17, innerWidth, innerHeight);
  document.querySelectorAll('[data-step]').forEach(el => {
    const [s0, s1] = el.dataset.step.split(',').map(Number);
    const fi = s0 === 0 ? 1 : seg(p, s0, s0 + 0.03), fo = s1 >= 1 ? 1 : 1 - seg(p, s1 - 0.03, s1), op = Math.min(fi, fo);
    el.style.opacity = op; el.style.transform = `translateY(${(1 - fi) * 20}px)`; el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
  });
  const bar = document.getElementById('progress'); if (bar) bar.style.transform = `scaleX(${p})`;
}
const redraw = () => layers.forEach(l => l.draw());
document.fonts?.ready.then(redraw);
new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize(); readScroll();
const clock = new THREE.Clock(), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
renderer.setAnimationLoop(() => { const dt = still ? 0 : Math.min(0.05, clock.getDelta()); prog += (target - prog) * 0.08; layout(prog, clock.elapsedTime, dt); renderer.render(scene, camera); });
window.__setProgress = v => { target = prog = v; layout(v, 1.2, 0); renderer.render(scene, camera); };
