// Fade District B: "The scroll is the haircut".
// The back of a head, seen from the barber's side: thousands of instanced strands and a pair of clippers.
// Each chapter is a pass. Clippers cut the left side, the back, clean the neckline, then the right side,
// leaving a skin fade behind. At the end they click off and the head turns to show the finished cut.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvas = document.getElementById('stage');
const story = document.getElementById('story');
const isMobile = matchMedia('(max-width: 760px)').matches;
const N = Number(new URLSearchParams(location.search).get('n')) || (isMobile ? 14000 : 30000);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;
const camera = new THREE.PerspectiveCamera(isMobile ? 40 : 30, 1, 0.1, 60);
const key = new THREE.SpotLight(0xffe2c4, 70, 20, 0.45, 0.8, 1.2); key.position.set(-3, 5, 7); key.target.position.set(0, 0.2, 0); scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0xff4a3a, 1.4); rim.position.set(5, 1.5, -2); scene.add(rim);
const top = new THREE.DirectionalLight(0xbfd0ff, 0.9); top.position.set(0, 6, 1); scene.add(top);
scene.add(new THREE.AmbientLight(0xffffff, 0.2));

const head = new THREE.Group(); scene.add(head);
// head = ellipsoid; +z is the BACK of the head (facing the camera), ±x are the sides
const RX = 1.0, RY = 1.22, RZ = 1.12;
const onHead = (a, e, out) => out.set(RX * Math.cos(e) * Math.sin(a), RY * Math.sin(e), RZ * Math.cos(e) * Math.cos(a));
const normalAt = (a, e, out) => { onHead(a, e, out); return out.set(out.x / (RX * RX), out.y / (RY * RY), out.z / (RZ * RZ)).normalize(); };
const eastAt = (a, e, out) => out.set(RX * Math.cos(a), 0, -RZ * Math.sin(a)).normalize();
const northAt = (a, e, out) => out.set(-RX * Math.sin(e) * Math.sin(a), RY * Math.cos(e), -RZ * Math.sin(e) * Math.cos(a)).normalize();
const skin = new THREE.MeshStandardMaterial({ color: 0x9c6b4c, roughness: 0.58 });
{
  const s = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 72), skin); s.scale.set(RX * 0.995, RY * 0.995, RZ * 0.995); head.add(s);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 1.6, 64), skin); neck.position.set(0, -1.45, -0.12); head.add(neck);
  const sh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.9 }));   // dark cape on the shoulders
  sh.scale.set(2.3, 0.75, 1.2); sh.position.set(0, -2.35, -0.15); head.add(sh);
  [-1, 1].forEach(sd => { const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), skin); ear.scale.set(0.09, 0.3, 0.19);
    ear.position.set(sd * 0.99, -0.08, -0.05); ear.rotation.set(0, sd * 0.35, sd * -0.1); head.add(ear);
    const lobe = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 12, 32, Math.PI * 1.4), skin); lobe.rotation.set(0, sd * Math.PI / 2 + sd * 0.35, -0.6);
    lobe.position.set(sd * 1.04, -0.06, -0.06); head.add(lobe); });
}

// ---------- strands ----------
const strandGeo = new THREE.ConeGeometry(1, 1, 4, 1, true); strandGeo.translate(0, 0.5, 0);
const hair = new THREE.InstancedMesh(strandGeo, new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.05 }), N);
hair.instanceMatrix.setUsage(THREE.DynamicDrawUsage); head.add(hair);
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const E0 = -0.72, E1 = 1.5, AMAX = 2.05;       // hair region: from below the nape to the crown, wrapping past the ears
const NAPE = -0.52;                              // where the clean neckline ends up
const SA = new Float32Array(N), SE = new Float32Array(N), LONG = new Float32Array(N), JX = new Float32Array(N), JY = new Float32Array(N), BAND = new Uint8Array(N);
const P = new Float32Array(N * 3), NRM = new Float32Array(N * 3), EAST = new Float32Array(N * 3), NORTH = new Float32Array(N * 3);
const v = new THREE.Vector3(), c = new THREE.Color();
let n = 0;
while (n < N) {
  const a = (rnd() * 2 - 1) * AMAX, e = Math.asin(lerp(Math.sin(E0), Math.sin(E1), rnd()));
  // keep the face clear and the ears free
  if (Math.abs(a) > 1.75 && e < 0.45) continue;
  if (Math.abs(Math.abs(a) - Math.PI / 2) < 0.28 && e > -0.42 && e < 0.28) continue;
  if (e < NAPE && Math.abs(a) > 1.1) continue;
  SA[n] = a; SE[n] = e;
  onHead(a, e, v); v.toArray(P, n * 3); normalAt(a, e, v); v.toArray(NRM, n * 3);
  eastAt(a, e, v); v.toArray(EAST, n * 3); northAt(a, e, v); v.toArray(NORTH, n * 3);
  LONG[n] = (e < NAPE ? 0.18 : 0.36) + rnd() * 0.2; JX[n] = rnd() * 2 - 1; JY[n] = rnd() * 2 - 1;
  BAND[n] = a < -0.62 ? 0 : a > 0.62 ? 2 : 1;
  c.setHSL(0.07, 0.2 + rnd() * 0.15, 0.03 + rnd() * 0.05); hair.setColorAt(n, c);
  n++;
}
hair.instanceColor.needsUpdate = true;

function lerp(a, b, t) { return a + (b - a) * t; }
const sm = t => t * t * (3 - 2 * t);
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const TOPLINE = 0.42;                                              // above this the length is kept (the top)
{ const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2 - TOPLINE + 0.08), new THREE.MeshStandardMaterial({ color: 0x1a120d, roughness: 0.7 }));
  cap.scale.set(RX * 1.002, RY * 1.002, RZ * 1.002); head.add(cap); }
const fadeLen = e => e < -0.3 ? 0.012 : e < TOPLINE ? 0.012 + 0.15 * sm((e + 0.3) / (TOPLINE + 0.3)) : 0.16;

// ---------- clippers ----------
const clip = new THREE.Group(); head.add(clip);
const blackM = new THREE.MeshPhysicalMaterial({ color: 0x121315, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.15 });
const goldM = new THREE.MeshPhysicalMaterial({ color: 0xc9973b, metalness: 1, roughness: 0.25, envMapIntensity: 2 });
const chromeM = new THREE.MeshPhysicalMaterial({ color: 0xf0f2f5, metalness: 1, roughness: 0.12, envMapIntensity: 2.2 });
const redM = new THREE.MeshStandardMaterial({ color: 0xe23b2e, emissive: 0xe23b2e, emissiveIntensity: 0 });
{ // blade edge at the origin, cutting toward +Y, body trailing down along -Y, back facing +Z
  const inner = new THREE.Group(); clip.add(inner); inner.scale.setScalar(0.62);
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.46, 1.5, 0.3, 6, 0.13), blackM); body.position.set(0, -0.86, 0.2); inner.add(body);
  const band = new THREE.Mesh(new RoundedBoxGeometry(0.47, 0.16, 0.31, 4, 0.06), goldM); band.position.set(0, -0.4, 0.2); inner.add(band);
  const grip = new THREE.Mesh(new RoundedBoxGeometry(0.47, 0.5, 0.31, 4, 0.12), new THREE.MeshPhysicalMaterial({ color: 0x1c1d20, roughness: 0.7 })); grip.position.set(0, -1.25, 0.2); inner.add(grip);
  const sw = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.18, 0.06, 3, 0.03), redM); sw.position.set(0, -0.65, 0.36); inner.add(sw);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.035), chromeM); plate.position.set(0, -0.06, 0.06); inner.add(plate);
  const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.016, 0.07, 0.03), chromeM, 28); const tm = new THREE.Matrix4();
  for (let k = 0; k < 28; k++) { tm.makeTranslation(-0.29 + k * 0.0215, 0.06, 0.05); teeth.setMatrixAt(k, tm); } inner.add(teeth);
  const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, -1.5, 0.2), V(0.1, -1.9, 0.3), V(-0.2, -2.4, 0.5), V(0.3, -3.4, 1.0)]), 40, 0.03, 8), blackM); inner.add(cord);
  inner.rotation.x = -0.42;     // body lifted off the scalp
}
function V(x, y, z) { return new THREE.Vector3(x, y, z); }

// falling clippings
const BITS = 500;
const bits = new THREE.InstancedMesh(new THREE.BoxGeometry(0.006, 0.05, 0.006), new THREE.MeshStandardMaterial({ color: 0x1d1611, roughness: 0.5 }), BITS); head.add(bits);
const bp = new Float32Array(BITS * 3), bv = new Float32Array(BITS * 3), bl = new Float32Array(BITS), br = new Float32Array(BITS); let bn = 0;
const bm = new THREE.Matrix4(), bq = new THREE.Quaternion(), bs = new THREE.Vector3(1, 1, 1), be = new THREE.Euler(), bt = new THREE.Vector3();
for (let i = 0; i < BITS; i++) { bm.makeScale(0, 0, 0); bits.setMatrixAt(i, bm); }

// ---------- passes ----------
// [p0, p1, type, band]: 'up' cuts a column from the nape to the top line; 'line' cleans the neckline from left to right
const BANDA = [-1.3, 0, 1.3];
const PASSES = [[0.16, 0.36, 'up', 0], [0.44, 0.56, 'up', 1], [0.57, 0.63, 'line'], [0.67, 0.83, 'up', 2]];
const UP0 = NAPE - 0.05, UP1 = TOPLINE + 0.06;
function cutState(p) {
  const ce = [-9, -9, -9]; let la = -9;
  for (const [a, b, type, band] of PASSES) { const k = seg(p, a, b);
    if (k <= 0) continue;
    if (type === 'up') ce[band] = lerp(UP0, UP1, k); else la = lerp(-1.4, 1.4, k); }
  return { ce, la };
}
function clipperAt(p) {
  const idle = [-1.15, -0.2];
  let prevEnd = idle, prevP = 0;
  for (let i = 0; i < PASSES.length; i++) {
    const [a, b, type, band] = PASSES[i];
    const start = type === 'up' ? [BANDA[band], UP0] : [-1.4, NAPE], end = type === 'up' ? [BANDA[band], UP1] : [1.4, NAPE];
    if (p < a) { const k = sm(seg(p, prevP, a));
      return { a: lerp(prevEnd[0], start[0], k), e: lerp(prevEnd[1], start[1], k), lift: Math.sin(Math.PI * k) * 0.35 + (i === 0 ? (1 - k) * 0.35 : 0), side: type === 'line' && k > 0.5, active: false }; }
    if (p <= b) { const k = seg(p, a, b); return { a: lerp(start[0], end[0], k), e: lerp(start[1], end[1], k), lift: 0, side: type === 'line', active: k > 0 && k < 1 }; }
    prevEnd = end; prevP = b;
  }
  const k = sm(seg(p, 0.85, 0.93));
  return { a: lerp(prevEnd[0], 1.9, k), e: lerp(prevEnd[1], -0.2, k), lift: k * 1.6, side: false, active: false, off: seg(p, 0.9, 0.93) };
}

// ---------- strands, rebuilt whenever progress changes ----------
const arr = hair.instanceMatrix.array;
let lastP = -1;
function updateHair(p) {
  const { ce, la } = cutState(p);
  const style = sm(seg(p, 0.86, 0.96));
  for (let i = 0; i < N; i++) {
    const o = i * 3, e = SE[i], a = SA[i];
    const isTop = e > TOPLINE;
    let L = LONG[i], up = isTop ? 0.12 : 0.25;
    if (!isTop) {
      const k = sm(Math.min(1, Math.max(0, (ce[BAND[i]] - e) / 0.08)));      // soft edge right behind the blade
      L = lerp(LONG[i], fadeLen(e), k); up = lerp(0.25, 0.85, k);
      if (e < NAPE && a < la) L = 0;                                           // the clean neckline
    } else if (style > 0) L = lerp(LONG[i], 0.22 + (LONG[i] - 0.36) * 0.3, style);
    const comb = isTop ? style : 0;
    const nx = NRM[o], ny = NRM[o + 1], nz = NRM[o + 2], sx = -NORTH[o], sy = -NORTH[o + 1], sz = -NORTH[o + 2];
    // long hair falls down the head; short hair stands off the skin; the styled top sweeps to one side
    const tx = lerp(sx, EAST[o] * 0.5 + sx * 0.5, comb), ty = lerp(sy, EAST[o + 1] * 0.5 + sy * 0.5, comb), tz = lerp(sz, EAST[o + 2] * 0.5 + sz * 0.5, comb);
    const j = 0.3 * (1 - up * 0.6) * (1 - comb * 0.7);
    let dx = nx * up + tx * (1 - up) + EAST[o] * JX[i] * j, dy = ny * up + ty * (1 - up) + JY[i] * j * 0.4, dz = nz * up + tz * (1 - up) + EAST[o + 2] * JX[i] * j;
    const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
    const w = L > 0.05 ? (isTop ? 0.012 : 0.0095) : 0.006;
    const ex = EAST[o], ey = EAST[o + 1], ez = EAST[o + 2];
    const cx = dy * ez - dz * ey, cy = dz * ex - dx * ez, cz = dx * ey - dy * ex, m = i * 16;
    arr[m] = ex * w; arr[m + 1] = ey * w; arr[m + 2] = ez * w; arr[m + 3] = 0;
    arr[m + 4] = dx * L; arr[m + 5] = dy * L; arr[m + 6] = dz * L; arr[m + 7] = 0;
    arr[m + 8] = cx * w; arr[m + 9] = cy * w; arr[m + 10] = cz * w; arr[m + 11] = 0;
    arr[m + 12] = P[o]; arr[m + 13] = P[o + 1]; arr[m + 14] = P[o + 2]; arr[m + 15] = 1;
  }
  hair.instanceMatrix.needsUpdate = true;
}

// ---------- scroll + render ----------
let target = 0, prog = 0, mx = 0, my = 0, tmx = 0, tmy = 0, lastT = 0, prevProg = 0;
const readScroll = () => { const r = story.getBoundingClientRect(); target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };
addEventListener('scroll', readScroll, { passive: true });
addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; }, { passive: true });
const basis = new THREE.Matrix4(), tmp = new THREE.Vector3(), nrm = new THREE.Vector3(), ea = new THREE.Vector3(), no = new THREE.Vector3(), neg = new THREE.Vector3();

function layout(p, t, dt) {
  const rtl = document.documentElement.dir === 'rtl';
  mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
  if (Math.abs(p - lastP) > 1e-5) { updateHair(p); lastP = p; }
  // the head turns toward the side being cut, then shows its profile at the end
  const st = clipperAt(p), end = sm(seg(p, 0.86, 1));
  const look = p < 0.86 ? -st.a * 0.32 : lerp(-1.9 * 0.32, -0.95, end);
  head.rotation.y += ((look + mx * 0.2) - head.rotation.y) * (dt ? Math.min(1, dt * 3) : 1);
  head.rotation.x = 0.12 + my * 0.06;

  // clippers ride on the scalp
  onHead(st.a, st.e, tmp); normalAt(st.a, st.e, nrm); eastAt(st.a, st.e, ea); northAt(st.a, st.e, no);
  const on = p > 0.1 && !(st.off >= 1), buzz = on ? 0.003 : 0;
  tmp.addScaledVector(nrm, 0.05 + st.lift + Math.sin(t * 95) * buzz);
  clip.position.copy(tmp);
  if (st.side) basis.makeBasis(neg.copy(no).negate(), ea, nrm); else basis.makeBasis(ea, no, nrm);
  clip.quaternion.setFromRotationMatrix(basis);
  clip.rotateZ(Math.sin(t * 90) * buzz * 2);
  redM.emissiveIntensity = on ? 1.5 : 0;
  clip.visible = !(st.off >= 1);

  // clippings fall while a pass is moving
  const moving = st.active && Math.abs(p - prevProg) > 1e-4; prevProg = p;
  if (moving) for (let k = 0; k < 6; k++) { const i = bn++ % BITS; bp[i * 3] = tmp.x + (Math.random() - 0.5) * 0.35; bp[i * 3 + 1] = tmp.y; bp[i * 3 + 2] = tmp.z + 0.04;
    bv[i * 3] = (Math.random() - 0.5) * 0.5 + nrm.x * 0.4; bv[i * 3 + 1] = Math.random() * 0.4; bv[i * 3 + 2] = nrm.z * 0.5 + Math.random() * 0.3; bl[i] = 1.4; br[i] = Math.random() * 6; }
  for (let i = 0; i < BITS; i++) {
    if (bl[i] <= 0) continue; bl[i] -= dt; bv[i * 3 + 1] -= 3.2 * dt;
    bp[i * 3] += bv[i * 3] * dt; bp[i * 3 + 1] += bv[i * 3 + 1] * dt; bp[i * 3 + 2] += bv[i * 3 + 2] * dt;
    bs.setScalar(bl[i] > 0 ? Math.min(1, bl[i] * 2) : 0); be.set(br[i] + t * 3, br[i], br[i] * 0.5); bq.setFromEuler(be);
    bm.compose(bt.set(bp[i * 3], bp[i * 3 + 1], bp[i * 3 + 2]), bq, bs); bits.setMatrixAt(i, bm);
  }
  bits.instanceMatrix.needsUpdate = true;

  camera.position.set(0, 0.9, isMobile ? 10.2 : 9.8); camera.lookAt(0, 0.0, 0);
  if (!isMobile) camera.setViewOffset(innerWidth, innerHeight, (rtl ? 1 : -1) * innerWidth * 0.28, 0, innerWidth, innerHeight);
  else camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.17, innerWidth, innerHeight);

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
renderer.setAnimationLoop(() => { const dt = Math.min(0.05, clock.getDelta()); lastT += dt; prog += (target - prog) * 0.08; layout(prog, still ? 0 : lastT, dt); renderer.render(scene, camera); });
window.__setProgress = v => { target = prog = v; layout(v, 1.2, 0); renderer.render(scene, camera); };
