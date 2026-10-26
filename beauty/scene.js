// Scrollar beauty scene: three sector objects (picked by window.CONCEPT.scene.objects) orbit, then take the stage per chapter.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const CFG = window.CONCEPT.scene;
const canvas = document.getElementById('stage');
const story = document.getElementById('story');
const isMobile = matchMedia('(max-width: 760px)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CFG.exposure || 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
const key = new THREE.DirectionalLight(CFG.keyColor || 0xfff4e6, 2.2); key.position.set(4, 6, 5); scene.add(key);
const rim = new THREE.DirectionalLight(CFG.rimColor || 0x9fb7ff, 1.6); rim.position.set(-5, 2, -4); scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, CFG.ambient ?? 0.25));

const phys = (o) => new THREE.MeshPhysicalMaterial(o);
const M = {
  metal: phys({ color: CFG.metal || 0xe0b468, metalness: 1, roughness: 0.26, clearcoat: 0.5, envMapIntensity: 1.8 }),
  steel: phys({ color: 0xd5d9df, metalness: 0.9, roughness: 0.3, clearcoat: 0.4, envMapIntensity: 1.9 }),
  chrome: phys({ color: 0xf2f4f7, metalness: 1, roughness: 0.08, envMapIntensity: 2 }),
  handle: phys({ color: CFG.handle || 0x1b1d21, metalness: 0.2, roughness: 0.35, clearcoat: 1 }),
  glass: phys({ color: 0xffffff, roughness: 0.04, transmission: 1, thickness: 0.5, ior: 1.5, transparent: true }),
  liquid: phys({ color: CFG.liquid || 0xa8436b, roughness: 0.15, clearcoat: 1, transmission: 0.25, thickness: 0.6 }),
  mirror: phys({ color: 0xe9ecf0, metalness: 1, roughness: 0.03, envMapIntensity: 2 }),
  wood: phys({ color: CFG.wood || 0x6b4226, roughness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
  hairA: phys({ color: CFG.hairA || 0x4a2c20, roughness: 0.35, sheen: 1, sheenColor: new THREE.Color(0xffd7c2), sheenRoughness: 0.3 }),
  hairB: phys({ color: CFG.hairB || 0x8a4f3a, roughness: 0.35, sheen: 1, sheenColor: new THREE.Color(0xffe2cf), sheenRoughness: 0.3 }),
  smoke: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false }),
};

// ---------- builders (each returns a group roughly 2 units tall, centred) ----------
const B = {};
B.pole = () => {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#f4f2ee'; x.fillRect(0, 0, 256, 256);
  const band = (col, off) => { x.fillStyle = col; x.beginPath(); x.moveTo(off, 0); x.lineTo(off + 48, 0); x.lineTo(off + 48 - 256, 256); x.lineTo(off - 256, 256); x.closePath(); x.fill(); };
  for (const o of [0, 256, 512]) { band(CFG.poleA || '#d6312a', o); band(CFG.poleB || '#2446b8', o - 128); }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 2.2); tex.colorSpace = THREE.SRGBColorSpace;
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 64, 1, true), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.35, clearcoat: 1 }));
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 2.05, 64, 1, true), M.glass);
  const capP = [[0, 0.22], [0.2, 0.2], [0.33, 0.12], [0.42, 0.04], [0.42, 0], [0, 0]].map(([r, y]) => new THREE.Vector2(r, y));
  const top = new THREE.Mesh(new THREE.LatheGeometry(capP, 64), M.chrome); top.position.y = 1.02;
  const bot = top.clone(); bot.scale.y = -1; bot.position.y = -1.02;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 16), M.chrome); ball.position.y = 1.3;
  g.add(inner, glass, top, bot, ball);
  g.userData.tick = (t) => { tex.offset.y = -t * 0.35; };
  return g;
};
B.shears = () => {
  const grp = new THREE.Group();
  const shape = () => { const s = new THREE.Shape(); s.moveTo(-0.32, -0.07); s.lineTo(1.55, -0.015); s.quadraticCurveTo(1.72, 0.005, 1.55, 0.035); s.lineTo(0.05, 0.1); s.lineTo(-0.32, 0.08); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.012, bevelSegments: 2 }); };
  const half = (flip) => { const h = new THREE.Group(); h.add(new THREE.Mesh(shape(), M.steel));
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.045), M.steel); sh.position.set(-0.5, -0.02, 0.018); sh.rotation.z = -0.25; h.add(sh);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.045, 20, 64), M.metal); ring.position.set(-0.86, -0.16, 0.018); h.add(ring);
    if (flip) { h.scale.y = -1; h.position.z = 0.05; } return h; };
  const a = half(false), b = half(true); grp.add(a, b);
  const pv = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.16, 32), M.metal); pv.rotation.x = Math.PI / 2; pv.position.z = 0.03; grp.add(pv);
  grp.position.x = -0.3; grp.rotation.z = 0.55;
  const w = new THREE.Group(); w.add(grp); w.userData.flat = true;
  w.userData.tick = (t, act) => { const o = 0.08 + 0.32 * (0.5 + 0.5 * Math.sin(t * 2.4)) * (0.4 + act); a.rotation.z = o; b.rotation.z = -o; };
  return w;
};
B.razor = () => {
  const g = new THREE.Group();
  const s = new THREE.Shape(); s.moveTo(0, -0.12); s.lineTo(1.1, -0.12); s.quadraticCurveTo(1.25, -0.12, 1.25, 0.02); s.lineTo(1.2, 0.16); s.lineTo(0.05, 0.12); s.quadraticCurveTo(-0.08, 0.06, 0, -0.12);
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.01, bevelSegments: 2 }), M.steel);
  const tang = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.035), M.steel); tang.position.set(-0.12, -0.02, 0.015);
  const bladeG = new THREE.Group(); bladeG.add(blade, tang); bladeG.position.x = 0.0; bladeG.rotation.z = 0.5;
  const sc = new THREE.Mesh(new RoundedBoxGeometry(1.45, 0.2, 0.09, 4, 0.04), M.handle); sc.position.set(-0.8, -0.02, 0.015);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 24), M.metal); pin.rotation.x = Math.PI / 2; pin.position.set(-0.1, -0.02, 0.015);
  g.add(bladeG, sc, pin); g.position.x = 0.25; g.rotation.z = -0.3;
  const w = new THREE.Group(); w.add(g); w.userData.flat = true;
  w.userData.tick = (t, act) => { bladeG.rotation.z = 0.35 + 0.35 * act + 0.1 * Math.sin(t * 1.4); };
  return w;
};
B.mirror = () => {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.07, 32, 128), M.metal);
  // painted reflection reads better than a true mirror, which only reflects the dark environment
  const rc = document.createElement('canvas'); rc.width = rc.height = 256; const rx = rc.getContext('2d');
  const gr = rx.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, CFG.mirrorTint || '#f3dfe6'); gr.addColorStop(1, '#c9b3bd');
  rx.fillStyle = gr; rx.fillRect(0, 0, 256, 256); rx.fillStyle = 'rgba(255,255,255,.55)'; rx.beginPath(); rx.moveTo(40, 0); rx.lineTo(110, 0); rx.lineTo(0, 150); rx.lineTo(0, 70); rx.fill();
  const rtex = new THREE.CanvasTexture(rc); rtex.colorSpace = THREE.SRGBColorSpace;
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.6, 96), new THREE.MeshPhysicalMaterial({ map: rtex, roughness: 0.05, clearcoat: 1, metalness: 0.1 })); glass.position.z = 0.01;
  const back = new THREE.Mesh(new THREE.CircleGeometry(0.6, 96), M.handle); back.rotation.y = Math.PI; back.position.z = -0.01;
  const hp = [[0.07, 0], [0.09, -0.3], [0.08, -0.7], [0.11, -0.9], [0, -0.93]].map(([r, y]) => new THREE.Vector2(r, y));
  const handle = new THREE.Mesh(new THREE.LatheGeometry(hp, 48), M.metal); handle.position.y = -0.62;
  g.add(frame, glass, back, handle); g.position.y = 0.3;
  const w = new THREE.Group(); w.add(g); w.userData.flat = true; return w;
};
B.strands = () => {
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const pts = []; const ph = i * 0.7, off = (i - 4) * 0.09;
    for (let k = 0; k <= 12; k++) { const y = 1.1 - k * 0.19; pts.push(new THREE.Vector3(off + Math.sin(k * 0.6 + ph) * 0.22 * (k / 12 + 0.3), y, Math.cos(k * 0.5 + ph) * 0.15)); }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.045 - Math.abs(i - 4) * 0.003, 10), i % 3 ? M.hairA : M.hairB);
    g.add(tube);
  }
  const clip = new THREE.Mesh(new RoundedBoxGeometry(0.75, 0.12, 0.2, 4, 0.05), M.metal); clip.position.y = 1.08; g.add(clip);
  g.userData.tick = (t) => { g.children.forEach((c, i) => { if (i < 9) c.rotation.y = Math.sin(t * 0.9 + i) * 0.12; }); };
  return g;
};
B.polish = () => {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.75, 0.8, 0.75, 6, 0.16), M.glass); body.position.y = -0.35;
  const liq = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.62, 0.6, 5, 0.12), M.liquid); liq.position.y = -0.4;
  const capP = [[0.17, 0], [0.17, 0.85], [0.12, 0.95], [0, 0.97]].map(([r, y]) => new THREE.Vector2(r, y));
  const cap = new THREE.Mesh(new THREE.LatheGeometry(capP, 48), M.handle); cap.position.y = 0.05;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.08, 48), M.metal); ring.position.y = 0.07;
  g.add(liq, body, cap, ring); return g;
};
B.mabkhara = () => {
  const g = new THREE.Group();
  const P = (a) => a.map(([r, y]) => new THREE.Vector2(r, y));
  const base = new THREE.Mesh(new THREE.LatheGeometry(P([[0, -1], [0.62, -1], [0.62, -0.92], [0.5, -0.85], [0.28, -0.55], [0.2, -0.2], [0.22, -0.05], [0, -0.05]]), 4, Math.PI / 4), M.wood);
  const trimA = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.05, 4, 1, false, Math.PI / 4), M.metal); trimA.position.y = -0.94;
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(P([[0.22, -0.05], [0.48, 0.0], [0.6, 0.18], [0.62, 0.32], [0.55, 0.34], [0.5, 0.2], [0, 0.18]]), 4, Math.PI / 4), M.metal);
  const coal = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), new THREE.MeshStandardMaterial({ color: 0x2a1408, emissive: 0xff6a1a, emissiveIntensity: 0.6, roughness: 0.9 })); coal.position.y = 0.26; coal.scale.y = 0.6;
  g.add(base, trimA, bowl, coal);
  const puffs = [...Array(10)].map((_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.12 + i * 0.012, 16, 12), M.smoke.clone()); g.add(m); return m; });
  g.userData.tick = (t) => puffs.forEach((m, i) => { const k = ((t * 0.25 + i / puffs.length) % 1); m.position.set(Math.sin(k * 6 + i) * 0.15 * k, 0.35 + k * 1.4, Math.cos(k * 5 + i) * 0.1 * k); m.scale.setScalar(0.6 + k * 1.6); m.material.opacity = 0.16 * (1 - k) * Math.min(1, k * 6); });
  g.position.y = 0.15; return g;
};
B.comb = () => {
  const g = new THREE.Group();
  const spine = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.28, 0.08, 4, 0.06), M.wood); spine.position.y = 0.2;
  const teeth = new THREE.InstancedMesh(new RoundedBoxGeometry(0.055, 0.5, 0.06, 2, 0.02), M.wood, 18);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 18; i++) { m4.makeTranslation(-0.72 + i * 0.085, i < 6 ? -0.13 : -0.2, 0); teeth.setMatrixAt(i, m4); }
  const inlay = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.085), M.metal); inlay.position.y = 0.24;
  g.add(spine, teeth, inlay); g.rotation.z = 0.25;
  const w = new THREE.Group(); w.add(g); w.userData.flat = true; return w;
};

const objs = CFG.objects.map(([name, s]) => { const o = B[name](); return { o, s, flat: !!o.userData.flat }; });
const rig = new THREE.Group(); scene.add(rig); objs.forEach(({ o }) => rig.add(o));
const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.7, 64), new THREE.MeshBasicMaterial({ color: CFG.shadow || 0x000000, transparent: true, opacity: 0, depthWrite: false,
  alphaMap: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#000'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })() }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.75; scene.add(shadow);

const centers = [0.3, 0.53, 0.76];
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const lerp = THREE.MathUtils.lerp;
const weight = (p, c) => sm(c - 0.1, c - 0.04, p) * (1 - sm(c + 0.04, c + 0.1, p));

let target = 0, prog = 0;
const readScroll = () => { const r = story.getBoundingClientRect(); target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };
addEventListener('scroll', readScroll, { passive: true });

function layout(p, t) {
  const ws = centers.map(c => weight(p, c)), k = Math.max(...ws);
  const rtl = document.documentElement.dir === 'rtl';
  const side = isMobile ? 0 : (rtl ? -0.9 : 0.9);
  const spin = t * 0.14 + p * 2.4;
  objs.forEach(({ o, s, flat }, i) => {
    const th = spin + i * (Math.PI * 2 / objs.length), w = ws[i] || 0;
    const R = isMobile ? 1.25 : 1.9;
    const ox = Math.cos(th) * R + side, oy = Math.sin(th) * 0.45, oz = Math.sin(th) * R * 0.6 - 0.8;
    o.position.set(lerp(ox, 0, w), lerp(oy, 0.05, w), lerp(oz, 0.5, w));
    o.scale.setScalar(s * lerp(0.62 * Math.pow(1 - k, 2), isMobile ? 1.15 : 1.5, w));
    o.rotation.y = flat ? Math.sin(t * 0.5 + i) * 0.45 : t * 0.35 + i;
    o.rotation.x = Math.sin(t * 0.5 + i) * 0.1;
    if (o.userData.tick) o.userData.tick(t, w);
  });
  shadow.material.opacity = (CFG.shadowOpacity ?? 0.2) * k;
  camera.position.set(0, 0.9, isMobile ? 12.5 : 10); camera.lookAt(0, 0, 0);
  if (!isMobile) camera.setViewOffset(innerWidth, innerHeight, (rtl ? 1 : -1) * innerWidth * 0.13, 0, innerWidth, innerHeight);
  else camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.2, innerWidth, innerHeight);
  document.querySelectorAll('[data-step]').forEach(el => {
    const [a, b] = el.dataset.step.split(',').map(Number);
    const fi = a === 0 ? 1 : seg(p, a, a + 0.03), fo = b >= 1 ? 1 : 1 - seg(p, b - 0.03, b), op = Math.min(fi, fo);
    el.style.opacity = op; el.style.transform = `translateY(${(1 - fi) * 20}px)`; el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
  });
  const bar = document.getElementById('progress'); if (bar) bar.style.transform = `scaleX(${p})`;
}
function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize(); readScroll();
const clock = new THREE.Clock(), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
renderer.setAnimationLoop(() => { prog += (target - prog) * 0.09; layout(prog, still ? 0 : clock.getElapsedTime()); renderer.render(scene, camera); });
window.__setProgress = v => { target = prog = v; layout(v, 1.2); renderer.render(scene, camera); };
window.__snap = (i, w = 720, h = 540) => {
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.clearViewOffset(); camera.updateProjectionMatrix();
  objs.forEach(({ o }, j) => { o.visible = j === i; }); const { o, s } = objs[i];
  o.position.set(0, 0, 0); o.scale.setScalar(s * 1.5); o.rotation.set(0.1, o.userData.flat ? 0.3 : 0.6, 0); if (o.userData.tick) o.userData.tick(1.2, 1);
  shadow.material.opacity = 0; camera.position.set(0, 0.6, 7.2); camera.lookAt(0, 0, 0);
  renderer.setClearColor(0x000000, 0); renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png'); objs.forEach(({ o }) => { o.visible = true; }); resize(); return url;
};
