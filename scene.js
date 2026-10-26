// Scrollar main scene: one particle cloud that re-forms into each sector's object as you scroll.
// Logo mark > crown > shears > rings > perfume > booking phone > logo mark.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

const canvas = document.getElementById('stage');
const story = document.getElementById('story');
const isMobile = matchMedia('(max-width: 760px)').matches;
const N = isMobile ? 11000 : 22000;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

// ---------- tone palette (dark core > light highlight), drawn from the Stitch palette ----------
const TONE = {
  ink: ['#3a3d46', '#f5f5f7'], ceramic: ['#3f434d', '#e8eaef'], steel: ['#30343d', '#c9ced8'],
  gold: ['#4b5c0f', '#d4ff5c'], whiteGold: ['#3f434d', '#ffffff'], amber: ['#43520f', '#c6ff3d'],
  glass: ['#2c2f37', '#a9afba'], espresso: ['#2e3810', '#b8f02e'], accent: ['#4b5c0f', '#c6ff3d'],
};
const tag = (mesh, tone) => { mesh.userData.tone = tone; return mesh; };
const M = new THREE.MeshBasicMaterial();   // geometry only; color comes from tone tags

// ---------- shapes (built as meshes, then sampled into points) ----------
function mark() {
  const g = new THREE.Group();
  const path = new THREE.CurvePath();
  const r = 0.75, h = 1.5;
  path.add(new THREE.LineCurve3(new THREE.Vector3(-r, -h, 0), new THREE.Vector3(-r, h, 0)));
  path.add(arc3(0, h, r, Math.PI, 0));
  path.add(new THREE.LineCurve3(new THREE.Vector3(r, h, 0), new THREE.Vector3(r, -h, 0)));
  path.add(arc3(0, -h, r, 0, -Math.PI));
  g.add(tag(new THREE.Mesh(new THREE.TubeGeometry(path, 400, 0.09, 12, true), M), 'ink'));
  const thumb = tag(new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.75, 12, 24), M), 'espresso'); thumb.position.y = 0.9; g.add(thumb);
  const dot = tag(new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), M), 'accent'); dot.position.y = -1.25; g.add(dot);
  return g;
}
function arc3(cx, cy, r, a0, a1) {
  const c = new THREE.Curve();
  c.getPoint = (t, out = new THREE.Vector3()) => { const a = a0 + (a1 - a0) * t; return out.set(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0); };
  return c;
}

function crown() {
  const geo = new THREE.SphereGeometry(0.72, 140, 100);
  const p = geo.attributes.position, v = new THREE.Vector3();
  const cusps = [45, 135, 225, 315].map(d => [Math.cos(d * Math.PI / 180) * 0.34, Math.sin(d * Math.PI / 180) * 0.3, d === 45 || d === 315 ? 0.13 : 0.1]);
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const yn = v.y / 0.72; let x = v.x, z = v.z * 0.88, y = v.y;
    if (yn > 0) { const w = sm(0.15, 0.85, yn); let hh = 0; for (const [cx, cz, s] of cusps) hh += s * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / 0.045); hh -= 0.09 * Math.exp(-(x * x) / 0.006) * Math.exp(-(z * z) / 0.12); y = y * 0.62 + hh * w; }
    else { const k = 1 - 0.38 * Math.pow(-yn, 1.7); x *= k; z *= k; y *= 0.95; }
    p.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  const g = new THREE.Group(); const m = tag(new THREE.Mesh(geo, M), 'ceramic'); m.rotation.x = 0.35; g.add(m);
  // two roots so it reads as a tooth, not a pebble
  [[-0.24, 0.12], [0.24, -0.08]].forEach(([x, rz]) => {
    const pr = [[0, -1.25], [0.08, -1.18], [0.17, -0.8], [0.24, -0.35], [0.27, 0]].map(([r, y]) => new THREE.Vector2(r, y));
    const root = tag(new THREE.Mesh(new THREE.LatheGeometry(pr, 32), M), 'ceramic'); root.position.set(x, -0.2, 0); root.rotation.z = rz; g.add(root);
  });
  return g;
}

function shears() {
  const g = new THREE.Group();
  const s = new THREE.Shape(); s.moveTo(-0.32, -0.07); s.lineTo(1.55, -0.015); s.quadraticCurveTo(1.72, 0.005, 1.55, 0.035); s.lineTo(0.05, 0.1); s.lineTo(-0.32, 0.08); s.closePath();
  const half = (flip, open) => {
    const h = new THREE.Group();
    h.add(tag(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.012, bevelSegments: 2 }), M), 'steel'));
    const sh = tag(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.05), M), 'steel'); sh.position.set(-0.5, -0.02, 0.02); sh.rotation.z = -0.25; h.add(sh);
    const ring = tag(new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.05, 20, 64), M), 'gold'); ring.position.set(-0.86, -0.16, 0.02); h.add(ring);
    if (flip) { h.scale.y = -1; h.position.z = 0.06; }
    h.rotation.z = flip ? -open : open; return h;
  };
  g.add(half(false, 0.28), half(true, 0.28));
  const pv = tag(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.18, 24), M), 'gold'); pv.rotation.x = Math.PI / 2; pv.position.z = 0.03; g.add(pv);
  g.rotation.z = 0.7; return g;
}

function rings() {
  const g = new THREE.Group();
  const r1 = tag(new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.09, 32, 160), M), 'gold'); r1.rotation.y = 0.5;
  const r2 = tag(new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.075, 32, 160), M), 'whiteGold'); r2.position.set(0.45, -0.12, 0); r2.rotation.set(0.5, -0.6, 0.3);
  const stone = tag(new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), M), 'glass'); stone.position.y = 0.8; stone.scale.y = 1.2; r1.add(stone);
  g.add(r1, r2); return g;
}

function bottle() {
  const g = new THREE.Group();
  const body = tag(new THREE.Mesh(new RoundedBoxGeometry(1.1, 1.25, 0.55, 5, 0.14), M), 'glass'); body.position.y = -0.2;
  const liq = tag(new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.85, 0.4, 4, 0.1), M), 'amber'); liq.position.y = -0.33;
  const neck = tag(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.2, 24), M), 'gold'); neck.position.y = 0.52;
  const cap = tag(new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.46, 0.46, 3, 0.06), M), 'ink'); cap.position.y = 0.84; cap.rotation.y = 0.785;
  g.add(body, liq, neck, cap); return g;
}

function phone() {
  const g = new THREE.Group(), W = 1.12, H = 2.3, R = 0.19;
  // iPhone outline: a dense rounded frame, not a filled box, so the silhouette reads instantly
  const path = new THREE.CurvePath(), x0 = W / 2, y0 = H / 2;
  path.add(new THREE.LineCurve3(new THREE.Vector3(-x0 + R, -y0, 0), new THREE.Vector3(x0 - R, -y0, 0))); path.add(arc3(x0 - R, -y0 + R, R, -Math.PI / 2, 0));
  path.add(new THREE.LineCurve3(new THREE.Vector3(x0, -y0 + R, 0), new THREE.Vector3(x0, y0 - R, 0))); path.add(arc3(x0 - R, y0 - R, R, 0, Math.PI / 2));
  path.add(new THREE.LineCurve3(new THREE.Vector3(x0 - R, y0, 0), new THREE.Vector3(-x0 + R, y0, 0))); path.add(arc3(-x0 + R, y0 - R, R, Math.PI / 2, Math.PI));
  path.add(new THREE.LineCurve3(new THREE.Vector3(-x0, y0 - R, 0), new THREE.Vector3(-x0, -y0 + R, 0))); path.add(arc3(-x0 + R, -y0 + R, R, Math.PI, Math.PI * 1.5));
  const frame = tag(new THREE.Mesh(new THREE.TubeGeometry(path, 600, 0.032, 10, true), M), 'ink'); frame.userData.weight = 3.2; g.add(frame);
  const island = tag(new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.22, 8, 16), M), 'ink'); island.rotation.z = Math.PI / 2; island.position.set(0, y0 - 0.12, 0.02); island.userData.weight = 3; g.add(island);
  [[-1, 0.6, 0.1], [-1, 0.38, 0.2], [-1, 0.12, 0.2], [1, 0.3, 0.32]].forEach(([sd, y, h]) => { const bt = tag(new THREE.Mesh(new THREE.CapsuleGeometry(0.025, h, 4, 8), M), 'ink'); bt.position.set(sd * (x0 + 0.045), y, 0); bt.userData.weight = 2; g.add(bt); });
  // the screen: the owner's schedule. Particles land densely on the UI and sparsely on the white background
  const c = document.createElement('canvas'); c.width = 256; c.height = 520; const x = c.getContext('2d');
  const box = (X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
  box(0, 0, 256, 520, '#050507');
  box(20, 52, 92, 20, '#f5f5f7');                                         // "Today"
  [[20, '#f5f5f7'], [134, '#c6ff3d']].forEach(([X, col]) => { box(X, 88, 102, 62, '#2a2b33'); box(X + 12, 100, 44, 18, col); box(X + 12, 126, 60, 8, '#8a8f98'); });
  ['#c6ff3d', '#ff6b6b', '#7cc6fe', '#c6ff3d', '#ff6b6b'].forEach((col, i) => { const Y = 170 + i * 46; box(20, Y, 216, 36, '#22232b'); box(20, Y, 6, 36, col); box(36, Y + 13, 34, 10, '#f5f5f7'); box(80, Y + 13, 90 - (i % 2) * 24, 10, '#8a8f98'); });
  box(20, 410, 216, 38, '#f5f5f7');                                       // Monthly report button
  box(20, 462, 216, 34, '#25d366');                                       // new booking toast
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, H - 0.1), M); screen.position.z = 0.0;
  screen.userData.weight = 2.4; screen.userData.canvas = x; screen.userData.cw = 256; screen.userData.ch = 520; screen.userData.inkDensity = true; g.add(screen);
  g.rotation.set(-0.06, -0.22, 0.03); return g;
}

// ---------- sample every shape into N points with baked shading ----------
const light = new THREE.Vector3(0.5, 0.8, 0.6).normalize();
function sampleShape(group, targetSize) {
  group.updateMatrixWorld(true);
  const meshes = []; group.traverse(o => { if (o.isMesh) meshes.push(o); });
  // area of each mesh in world space decides how many points it gets
  const tri = new THREE.Triangle(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const areas = meshes.map(m => { const wgt = m.userData.weight || 1; const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry; const p = geo.attributes.position; let s = 0;
    for (let i = 0; i < p.count; i += 3) { a.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); b.fromBufferAttribute(p, i + 1).applyMatrix4(m.matrixWorld); c.fromBufferAttribute(p, i + 2).applyMatrix4(m.matrixWorld); s += tri.set(a, b, c).getArea(); } return s * wgt; });
  const total = areas.reduce((x, y) => x + y, 0);
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const P = new THREE.Vector3(), Nn = new THREE.Vector3(), UV = new THREE.Vector2(), nm = new THREE.Matrix3(), dark = new THREE.Color(), lite = new THREE.Color(), out = new THREE.Color();
  let k = 0;
  meshes.forEach((m, mi) => {
    const count = mi === meshes.length - 1 ? N - k : Math.round(N * areas[mi] / total);
    const sampler = new MeshSurfaceSampler(m).build(); nm.getNormalMatrix(m.matrixWorld);
    const [d0, l0] = TONE[m.userData.tone || 'ink']; dark.set(d0); lite.set(l0);
    for (let i = 0; i < count && k < N; i++, k++) {
      sampler.sample(P, Nn, undefined, UV);
      if (m.userData.inkDensity) {   // rejection sampling: keep most points on dark/coloured pixels, few on the white background
        for (let tries = 0; tries < 12; tries++) { const ud = m.userData, img = ud.img || (ud.img = ud.canvas.getImageData(0, 0, ud.cw, ud.ch).data), o = ((Math.min(ud.ch - 1, (1 - UV.y) * ud.ch) | 0) * ud.cw + (Math.min(ud.cw - 1, UV.x * ud.cw) | 0)) * 4;
          const lum = (0.3 * img[o] + 0.59 * img[o + 1] + 0.11 * img[o + 2]) / 255; if (Math.random() < 0.06 + 0.94 * Math.pow(lum, 0.6) * 1.4) break; sampler.sample(P, Nn, undefined, UV); } }
      P.applyMatrix4(m.matrixWorld); Nn.applyMatrix3(nm).normalize();
      pos.set([P.x, P.y, P.z], k * 3);
      if (m.userData.canvas) {
        const d = m.userData.canvas.getImageData(Math.min(m.userData.cw - 1, UV.x * m.userData.cw) | 0, Math.min(m.userData.ch - 1, (1 - UV.y) * m.userData.ch) | 0, 1, 1).data;
        out.setRGB(d[0] / 255, d[1] / 255, d[2] / 255, THREE.SRGBColorSpace); out.multiplyScalar(0.92);
      } else {
        const shade = 0.15 + 0.85 * Math.max(0, Nn.dot(light)) ** 0.8;
        out.copy(dark).lerp(lite, shade);
      }
      col.set([out.r, out.g, out.b], k * 3);
    }
  });
  // centre and scale to a common size
  const box = new THREE.Box3(), v = new THREE.Vector3();
  for (let i = 0; i < N; i++) box.expandByPoint(v.fromArray(pos, i * 3));
  const ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const s = targetSize / Math.max(size.x, size.y, size.z);
  for (let i = 0; i < N; i++) { pos[i * 3] = (pos[i * 3] - ctr.x) * s; pos[i * 3 + 1] = (pos[i * 3 + 1] - ctr.y) * s; pos[i * 3 + 2] = (pos[i * 3 + 2] - ctr.z) * s; }
  // shuffle so particles travel to random places on the next shape, which reads as a swarm
  for (let i = N - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; for (let q = 0; q < 3; q++) { let t = pos[i * 3 + q]; pos[i * 3 + q] = pos[j * 3 + q]; pos[j * 3 + q] = t; t = col[i * 3 + q]; col[i * 3 + q] = col[j * 3 + q]; col[j * 3 + q] = t; } }
  return { pos, col };
}

const S = [sampleShape(mark(), 3.3), sampleShape(crown(), 3.2), sampleShape(shears(), 3.6), sampleShape(rings(), 3.0), sampleShape(bottle(), 3.0), sampleShape(phone(), 3.3)];

// ---------- the cloud ----------
const geo = new THREE.BufferGeometry();
const cur = new Float32Array(N * 3), curC = new Float32Array(N * 3);
geo.setAttribute('position', new THREE.BufferAttribute(cur, 3).setUsage(THREE.DynamicDrawUsage));
geo.setAttribute('color', new THREE.BufferAttribute(curC, 3).setUsage(THREE.DynamicDrawUsage));
const seed = new Float32Array(N * 4);
for (let i = 0; i < N; i++) { const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); seed.set([r * Math.cos(th), u, r * Math.sin(th), 0.4 + Math.random()], i * 4); }
const mat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, vertexColors: true,
  uniforms: { uSize: { value: isMobile ? 22 : 26 }, uPR: { value: renderer.getPixelRatio() } },
  vertexShader: `uniform float uSize; uniform float uPR; varying vec3 vC; varying float vF;
    void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = uSize * uPR / -mv.z; vF = clamp((-mv.z - 7.0) / 6.0, 0.0, 1.0); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `varying vec3 vC; varying float vF;
    void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; float a = smoothstep(0.5, 0.15, d); gl_FragColor = vec4(vC, a * (0.95 - 0.35 * vF)); }`,
});
const cloud = new THREE.Points(geo, mat); scene.add(cloud);

// ---------- scroll timeline: hold each shape around its chapter, swarm between ----------
const KEYS = [[0.0, 0], [0.08, 0], [0.15, 1], [0.25, 1], [0.31, 2], [0.41, 2], [0.47, 3], [0.57, 3], [0.63, 4], [0.73, 4], [0.79, 5], [0.89, 5], [0.95, 0], [1.0, 0]];
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function stateAt(p) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [p0, a] = KEYS[i], [p1, b] = KEYS[i + 1];
    if (p <= p1) return { a, b, t: a === b ? 0 : ease((p - p0) / (p1 - p0)) };
  }
  return { a: 0, b: 0, t: 0 };
}
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));

let target = 0, prog = 0, mx = 0, my = 0, tmx = 0, tmy = 0;
const readScroll = () => { const r = story.getBoundingClientRect(); target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };
addEventListener('scroll', readScroll, { passive: true });
addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; }, { passive: true });

function layout(p, t) {
  const { a, b, t: k } = stateAt(p);
  const A = S[a], B = S[b], burst = Math.sin(Math.PI * k);      // particles fly out mid-transition
  for (let i = 0; i < N; i++) {
    const i3 = i * 3, i4 = i * 4, amp = burst * 0.8 * seed[i4 + 3];
    const wob = 0.02 * Math.sin(t * 1.3 + i * 0.37);
    cur[i3] = A.pos[i3] + (B.pos[i3] - A.pos[i3]) * k + seed[i4] * amp + wob;
    cur[i3 + 1] = A.pos[i3 + 1] + (B.pos[i3 + 1] - A.pos[i3 + 1]) * k + seed[i4 + 1] * amp;
    cur[i3 + 2] = A.pos[i3 + 2] + (B.pos[i3 + 2] - A.pos[i3 + 2]) * k + seed[i4 + 2] * amp;
    curC[i3] = A.col[i3] + (B.col[i3] - A.col[i3]) * k;
    curC[i3 + 1] = A.col[i3 + 1] + (B.col[i3 + 1] - A.col[i3 + 1]) * k;
    curC[i3 + 2] = A.col[i3 + 2] + (B.col[i3 + 2] - A.col[i3 + 2]) * k;
  }
  geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
  mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
  // face front while a shape holds; spin a full turn only while the swarm travels
  cloud.rotation.y = k * Math.PI * 2 + Math.sin(t * 0.4) * 0.35 + mx * 0.5;
  cloud.rotation.x = 0.08 + my * 0.3;

  const rtl = document.documentElement.dir === 'rtl';
  camera.position.set(0, 0.4, isMobile ? 13 : 10.5); camera.lookAt(0, 0, 0);
  if (!isMobile) camera.setViewOffset(innerWidth, innerHeight, (rtl ? 1 : -1) * innerWidth * 0.15, 0, innerWidth, innerHeight);
  else camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.2, innerWidth, innerHeight);

  document.querySelectorAll('[data-step]').forEach(el => {
    const [s, e] = el.dataset.step.split(',').map(Number);
    const fi = s === 0 ? 1 : seg(p, s, s + 0.03), fo = e >= 1 ? 1 : 1 - seg(p, e - 0.03, e), o = Math.min(fi, fo);
    el.style.opacity = o; el.style.transform = `translateY(${(1 - fi) * 20}px)`; el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
  });
  const bar = document.getElementById('progress'); if (bar) bar.style.transform = `scaleX(${p})`;
}

function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); mat.uniforms.uPR.value = renderer.getPixelRatio(); }
addEventListener('resize', resize); resize(); readScroll();
const clock = new THREE.Clock(), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
renderer.setAnimationLoop(() => { prog += (target - prog) * 0.08; layout(prog, still ? 0 : clock.getElapsedTime()); renderer.render(scene, camera); });
window.__setProgress = v => { target = prog = v; layout(v, 1.2); renderer.render(scene, camera); };
