// Al Majlis Grooming: "Oud smoke".
// A black page and one thread of oud smoke. Scrolling gathers the smoke into one Arabic word per chapter;
// It ends by writing tonight's free time, then حيّاك.
import * as THREE from 'three';

const canvas = document.getElementById('stage');
const story = document.getElementById('story');
const glowEl = document.querySelector('.glow');
const isMobile = matchMedia('(max-width: 760px)').matches;
const N = Number(new URLSearchParams(location.search).get('n')) || (isMobile ? 12000 : 24000);
const CALLI = "'Aref Ruqaa','Reem Kufi','Amiri',serif";

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x0b0907, 1);
if (glowEl) glowEl.style.display = 'none';   // the ember glow is drawn in the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(isMobile ? 50 : 38, 1, 0.1, 50);
camera.position.set(0, 0, 8);

// ---------- words (always Arabic: the calligraphy is the art) ----------
const WORDS = [
  { t: 'المجلس', y: 0.75, w: 3.6 },
  { t: 'أهلاً وسهلاً', y: 0.55, w: 4.2 },
  { t: 'الحرفة', y: 0.6, w: 3.4 },
  { t: 'اللحية', y: 0.6, w: 3.4 },
  { t: '٩:٣٠', y: 0.6, w: 2.6 },
  { t: 'حيّاك', y: 0.7, w: 3.0 },
];
if (isMobile) WORDS.forEach(w => { w.w *= 0.62; w.y += 0.6; });
// scroll windows: hero, three chapters, the free time, the goodbye
const WIN = [[0, 0.13], [0.18, 0.4], [0.43, 0.63], [0.66, 0.86], [0.88, 0.945], [0.945, 1.01]];
const EMIT = new THREE.Vector3(0, isMobile ? -3.2 : -2.75, 0);

// ---------- particles ----------
const geo = new THREE.BufferGeometry();
const seeds = new Float32Array(N * 4); for (let i = 0; i < N * 4; i++) seeds[i] = Math.random();
geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
geo.setAttribute('seed', new THREE.BufferAttribute(seeds, 4));
WORDS.forEach((_, i) => geo.setAttribute('t' + i, new THREE.BufferAttribute(new Float32Array(N * 3), 3)));
const mat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 }, uForm: { value: 0 }, uRelease: { value: 0 }, uW0: { value: new THREE.Vector3(1, 0, 0) }, uW1: { value: new THREE.Vector3(0, 0, 0) },
    uEmit: { value: EMIT }, uPix: { value: renderer.getPixelRatio() }, uScale: { value: 1 },
    uPtr: { value: new THREE.Vector3(99, 99, 0) }, uPush: { value: 0 }, uVel: { value: new THREE.Vector2() },
  },
  vertexShader: `
    attribute vec4 seed; attribute vec3 t0, t1, t2, t3, t4, t5;
    uniform float uTime, uForm, uRelease, uPix, uScale, uPush; uniform vec3 uW0, uW1, uEmit, uPtr; uniform vec2 uVel;
    varying float vA, vK, vH;
    void main() {
      // free smoke: a thread that rises, widens and curls
      float life = fract(uTime * 0.055 * (0.55 + seed.x) + seed.y);
      float h = life * 5.6;
      float wob = sin(h * 1.1 + uTime * 0.35 + seed.z * 2.0) * 0.18 * h;           // the whole thread sways
      float x = wob + sin(h * 2.3 + seed.z * 6.283 + uTime * 0.6) * (0.015 + h * 0.07) + sin(h * 5.1 + seed.w * 9.0 + uTime) * 0.025 * h;
      float z = cos(h * 1.7 + seed.w * 6.283 + uTime * 0.5) * (0.015 + h * 0.06);
      vec3 free = uEmit + vec3(x, h, z);
      // the word being written
      vec3 tgt = t0 * uW0.x + t1 * uW0.y + t2 * uW0.z + t3 * uW1.x + t4 * uW1.y + t5 * uW1.z;
      vec3 jit = vec3(sin(uTime * 1.2 + seed.x * 40.0), sin(uTime * 1.0 + seed.y * 40.0), sin(uTime * 0.8 + seed.z * 40.0)) * 0.012;
      vec3 rel = vec3(sin(seed.z * 30.0 + uTime * 0.7) * 0.7, 0.8 + seed.y * 1.2, cos(seed.x * 30.0) * 0.4) * uRelease * (0.3 + seed.w);
      float part = step(seed.w, 0.8);
      float k = smoothstep(seed.x * 0.55, seed.x * 0.55 + 0.45, uForm) * part;
      vec3 pos = mix(free, tgt + jit + rel, k);
      vK = k * (1.0 - uRelease);
      vH = life;
      float freeA = smoothstep(0.0, 0.06, life) * (1.0 - smoothstep(0.3, 1.0, life)) * 0.045;
      vA = mix(freeA, 0.9 * (1.0 - uRelease * 0.9), k);
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      float size = mix(0.06 + life * 1.1, 0.032, k);
      gl_PointSize = size * uPix * uScale * 330.0 / -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying float vA, vK, vH;
    void main() {
      vec2 c = gl_PointCoord - 0.5; float r = length(c); if (r > 0.5) discard;
      float a = smoothstep(0.5, 0.0, r); a *= a;
      vec3 smoke = mix(vec3(0.95, 0.78, 0.55), vec3(0.72, 0.7, 0.68), smoothstep(0.0, 0.5, vH));   // warm near the ember, grey higher up
      vec3 lit = vec3(1.0, 0.88, 0.66);
      gl_FragColor = vec4(mix(smoke, lit, vK) * a * vA, 1.0);
    }`,
});
const smoke = new THREE.Points(geo, mat); smoke.frustumCulled = false; scene.add(smoke);
// the ember: a tiny glowing point where the thread starts
const ember = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, blending: THREE.AdditiveBlending }));
ember.position.copy(EMIT); scene.add(ember);
const emberHalo = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  uniforms: { uI: { value: 1 } }, vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform float uI; varying vec2 vU; void main(){ float d = length(vU - 0.5) * 2.0; gl_FragColor = vec4(vec3(1.0, 0.55, 0.2) * pow(1.0 - clamp(d, 0.0, 1.0), 4.0) * 0.5 * uI, 1.0); }' }));
emberHalo.position.copy(EMIT); scene.add(emberHalo);

// ---------- sample each word into target points ----------
function sampleWord(i) {
  const W = WORDS[i], CW = 1400, CH = 760, [c, x] = (() => { const cc = document.createElement('canvas'); cc.width = CW; cc.height = CH; return [cc, cc.getContext('2d')]; })();
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.direction = 'rtl';
  let fs = 320; x.font = `700 ${fs}px ${CALLI}`; const mw = x.measureText(W.t).width; if (mw > 1300) { fs *= 1300 / mw; x.font = `700 ${fs}px ${CALLI}`; }
  // centre on the real ink box so tall letters like ل and ا are never cut
  let m = x.measureText(W.t), asc = m.actualBoundingBoxAscent || fs * 0.8, desc = m.actualBoundingBoxDescent || fs * 0.3;
  if (asc + desc > CH - 60) { fs *= (CH - 60) / (asc + desc); x.font = `700 ${fs}px ${CALLI}`; m = x.measureText(W.t); asc = m.actualBoundingBoxAscent || fs * 0.8; desc = m.actualBoundingBoxDescent || fs * 0.3; }
  x.fillText(W.t, CW / 2, CH / 2 + (asc - desc) / 2);
  const data = x.getImageData(0, 0, CW, CH).data, pts = [];
  for (let y = 0; y < CH; y += 2) for (let X = 0; X < CW; X += 2) if (data[(y * CW + X) * 4 + 3] > 140) pts.push([X, y]);
  const arr = geo.attributes['t' + i].array, s = W.w / 1300;
  for (let k = 0; k < N; k++) { const [px, py] = pts.length ? pts[(Math.random() * pts.length) | 0] : [CW / 2, CH / 2];
    arr[k * 3] = (px - CW / 2 + Math.random() * 2 - 1) * s; arr[k * 3 + 1] = W.y - (py - CH / 2 + Math.random() * 2 - 1) * s; arr[k * 3 + 2] = (Math.random() - 0.5) * 0.08; }
  geo.attributes['t' + i].needsUpdate = true;
}
const buildWords = () => WORDS.forEach((_, i) => sampleWord(i));
buildWords();
(document.fonts ? document.fonts.load(`700 120px 'Aref Ruqaa'`).catch(() => {}) : Promise.resolve()).then(buildWords);

// ---------- timeline ----------
const sm = t => t * t * (3 - 2 * t);
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
let target = 0, prog = 0;
const readScroll = () => { const r = story.getBoundingClientRect(); target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };
addEventListener('scroll', readScroll, { passive: true });
const tmp = new THREE.Vector3();

function layout(p, t) {
  const rtl = document.documentElement.dir === 'rtl';
  let wi = 0; WIN.forEach(([a], i) => { if (p >= a - 0.015) wi = i; });
  const [a, b] = WIN[wi];
  const gather = wi === 0 ? 1 : sm(seg(p, a, a + (wi >= 4 ? 0.025 : 0.065)));
  const release = wi === 5 ? 0 : sm(seg(p, b - (wi === 4 ? 0.02 : 0.04), b));
  const u = mat.uniforms;
  u.uForm.value = gather; u.uRelease.value = release; u.uTime.value = t;
  u.uW0.value.set(wi === 0 ? 1 : 0, wi === 1 ? 1 : 0, wi === 2 ? 1 : 0); u.uW1.value.set(wi === 3 ? 1 : 0, wi === 4 ? 1 : 0, wi === 5 ? 1 : 0);
  const fl = 0.8 + 0.2 * Math.sin(t * 6.1) * Math.sin(t * 2.3 + 1); emberHalo.material.uniforms.uI.value = fl; ember.material.opacity = 0.7 + 0.3 * fl;
  // keep the smoke in the open half of the screen on desktop
  if (!isMobile) camera.setViewOffset(innerWidth, innerHeight, (rtl ? 1 : -1) * innerWidth * 0.17, 0, innerWidth, innerHeight);
  else camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.1, innerWidth, innerHeight);
  u.uScale.value = innerHeight / 860;
  camera.updateMatrixWorld();
    document.querySelectorAll('[data-step]').forEach(el => {
    const [s0, s1] = el.dataset.step.split(',').map(Number);
    const fi = s0 === 0 ? 1 : seg(p, s0, s0 + 0.03), fo = s1 >= 1 ? 1 : 1 - seg(p, s1 - 0.03, s1), op = Math.min(fi, fo);
    el.style.opacity = op; el.style.transform = `translateY(${(1 - fi) * 20}px)`; el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
  });
  const bar = document.getElementById('progress'); if (bar) bar.style.transform = `scaleX(${p})`;
}
function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize(); readScroll();
const clock = new THREE.Clock(), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
renderer.setAnimationLoop(() => { prog += (target - prog) * 0.08; layout(prog, (still ? 0 : clock.getElapsedTime()) + 6); renderer.render(scene, camera); });
window.__setProgress = v => { target = prog = v; layout(v, 8); renderer.render(scene, camera); };
