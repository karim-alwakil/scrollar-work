import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvas = document.getElementById('stage');
const story = document.getElementById('story');
const isMobile = matchMedia('(max-width: 760px)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

// Lights: soft key + cool rim for the editorial studio look
const key = new THREE.DirectionalLight(0xfff4e6, 2.2); key.position.set(4, 6, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0x9fb7ff, 1.6); rim.position.set(-5, 2, -4); scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, 0.15));

const rig = new THREE.Group(); scene.add(rig);

// ---------- Materials ----------
const titanium = new THREE.MeshPhysicalMaterial({ color: 0xb9bdc3, metalness: 1, roughness: 0.32, clearcoat: 0.3 });
const anodized = new THREE.MeshPhysicalMaterial({ color: 0xc9a063, metalness: 1, roughness: 0.22, clearcoat: 0.6 });
const ceramic = new THREE.MeshPhysicalMaterial({
  color: 0xf6f2ea, metalness: 0, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08,
  sheen: 0.4, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.5
});
const boneMat = new THREE.MeshPhysicalMaterial({
  color: 0x6b7280, roughness: 0.35, metalness: 0, transparent: true, opacity: 0.1,
  side: THREE.DoubleSide, depthWrite: false
});

// ---------- Implant fixture (body + helical thread) ----------
const fixture = new THREE.Group();
{
  const prof = [[0,0],[0.36,0],[0.385,-0.05],[0.36,-0.18],[0.335,-2.0],[0.25,-2.28],[0.12,-2.42],[0,-2.45]]
    .map(([r,y]) => new THREE.Vector2(r, y));
  fixture.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 96), titanium));

  class Helix extends THREE.Curve {
    getPoint(t, target = new THREE.Vector3()) {
      const turns = 17, y = THREE.MathUtils.lerp(-0.22, -2.3, t);
      const body = y > -2.0 ? THREE.MathUtils.lerp(0.36, 0.335, (-0.18 - y) / 1.82) : THREE.MathUtils.lerp(0.335, 0.2, (-2.0 - y) / 0.35);
      const r = body + 0.012;
      const a = t * turns * Math.PI * 2;
      return target.set(Math.cos(a) * r, y, Math.sin(a) * r);
    }
  }
  const thread = new THREE.TubeGeometry(new Helix(), 1600, 0.03, 8, false);
  { const tm = new THREE.Mesh(thread, titanium); fixture.add(tm); }
  // internal hex hint at the platform
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 6), new THREE.MeshStandardMaterial({ color: 0x222428, metalness: 1, roughness: 0.6 }));
  hex.position.y = 0.005; fixture.add(hex);
}
rig.add(fixture);

// ---------- Abutment ----------
const abutment = new THREE.Group();
{
  const prof = [[0,0],[0.17,0],[0.17,-0.12],[0.3,-0.12],[0.3,0.02],[0.33,0.06],[0.43,0.24],[0.43,0.31],[0.31,0.36],[0.26,0.74],[0.2,0.94],[0.06,0.98],[0,0.98]]
    .map(([r,y]) => new THREE.Vector2(r, y));
  abutment.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 96), anodized));
}
rig.add(abutment);

// ---------- Ceramic molar crown (deformed sphere with 4 cusps + fissure) ----------
const crown = new THREE.Group();
{
  const g = new THREE.SphereGeometry(0.72, 160, 120);
  const p = g.attributes.position, v = new THREE.Vector3();
  const cusps = [45, 135, 225, 315].map(d => [Math.cos(d * Math.PI / 180) * 0.34, Math.sin(d * Math.PI / 180) * 0.3, d === 45 || d === 315 ? 0.13 : 0.1]);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const yn = v.y / 0.72;
    let x = v.x * 1.0, z = v.z * 0.88, y = v.y;
    if (yn > 0) {
      const w = smooth(0.15, 0.85, yn);
      let h = 0;
      for (const [cx, cz, s] of cusps) h += s * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / 0.045);
      h -= 0.09 * Math.exp(-(x * x) / 0.006) * Math.exp(-(z * z) / 0.12); // central fissure
      y = y * 0.62 + h * w;
    } else {
      const k = 1 - 0.38 * Math.pow(-yn, 1.7);
      x *= k; z *= k; y *= 0.95;
    }
    // subtle organic asymmetry
    x += 0.02 * Math.sin(v.z * 7.0); z += 0.015 * Math.sin(v.x * 6.0);
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, ceramic);
  m.rotation.y = 0.35;
  crown.add(m);
}
rig.add(crown);

// ---------- Bone / gum section (x-ray glass block) ----------
const bone = new THREE.Group();
{
  const geo = new RoundedBoxGeometry(2.5, 3.0, 1.7, 6, 0.22);
  const box = new THREE.Mesh(geo, boneMat);
  box.position.y = -1.5;
  bone.add(box);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.5, 3.0, 1.7)),
    new THREE.LineBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.16 }));
  edges.position.y = -1.5; bone.add(edges);
  const gumSlab = new THREE.Mesh(new RoundedBoxGeometry(2.5, 0.42, 1.7, 6, 0.2),
    new THREE.MeshPhysicalMaterial({ color: 0xe39a9a, roughness: 0.5, transparent: true, opacity: 0.16, depthWrite: false }));
  gumSlab.position.y = -0.2; bone.add(gumSlab);
  // gum line ring
  const gum = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.07, 24, 96),
    new THREE.MeshPhysicalMaterial({ color: 0xd98a8a, roughness: 0.45, transparent: true, opacity: 0.55 }));
  gum.rotation.x = Math.PI / 2; gum.position.y = 0.02; bone.add(gum);
}
rig.add(bone);

// soft contact shadow
const shadow = new THREE.Mesh(new THREE.CircleGeometry(2.2, 64), new THREE.MeshBasicMaterial({
  color: 0x111827, transparent: true, opacity: 0.22, depthWrite: false,
  alphaMap: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#000');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })()
}));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = -3.2; rig.add(shadow);

// ---------- Scroll timeline ----------
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = THREE.MathUtils.lerp;

let target = 0, prog = 0;
function readScroll() {
  const r = story.getBoundingClientRect();
  const total = r.height - innerHeight;
  target = Math.min(1, Math.max(0, -r.top / total));
}
addEventListener('scroll', readScroll, { passive: true });

const steps = [...document.querySelectorAll('[data-step]')];
const bar = document.getElementById('progress');

function layout(p, t) {
  const a = ease(seg(p, 0.12, 0.38));   // fixture screws in
  const b = ease(seg(p, 0.42, 0.62));   // abutment seats
  const c = ease(seg(p, 0.66, 0.86));   // crown seats

  // fixture: descends 2.9 units while rotating like a real screw (pitch ~0.15)
  const fy = lerp(2.6, 0, a);
  fixture.position.y = fy;
  fixture.rotation.y = -(2.6 - fy) / 0.15 * 0.5 * Math.PI * 0.25;

  abutment.position.y = lerp(3.7, 0, b) + (1 - b) * 0.08 * Math.sin(t * 1.3);
  abutment.rotation.y = (1 - b) * 1.2;

  crown.position.y = lerp(5.6, 1.12, c) + (1 - c) * 0.1 * Math.sin(t * 1.1 + 1);
  crown.rotation.y = (1 - c) * -0.9;
  crown.rotation.z = (1 - c) * 0.15;

  // whole rig slowly turns, settles at the end
  rig.rotation.y = lerp(-0.5, 0.35, p) + Math.sin(t * 0.4) * 0.04 * (1 - p);

  // camera: wide shot on exploded parts -> close hero shot of finished tooth
  const z = ease(seg(p, 0.55, 0.95));            // zoom in only once the crown is coming down
  const camY = lerp(1.6, 0.6, z);
  const dist = isMobile ? lerp(22, 15.5, z) : lerp(17.5, 8.6, z);
  const lookY = lerp(1.6, -0.35, z);
  camera.position.set(Math.sin(0.25) * dist, camY + 1.2, Math.cos(0.25) * dist);
  camera.lookAt(0, lookY, 0);
  if (!isMobile) camera.setViewOffset(innerWidth, innerHeight, -innerWidth * 0.14, 0, innerWidth, innerHeight);
  else camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.2, innerWidth, innerHeight); // push object up, copy sits below

  boneMat.opacity = lerp(0.06, 0.12, seg(p, 0.05, 0.3));

  // copy steps
  steps.forEach(el => {
    const [s, e] = el.dataset.step.split(',').map(Number);
    const fadeIn = seg(p, s, s + 0.05), fadeOut = 1 - seg(p, e - 0.05, e);
    const o = e >= 1 ? fadeIn : Math.min(fadeIn, fadeOut);
    el.style.opacity = s === 0 ? fadeOut : o;
    el.style.transform = `translateY(${(1 - (s === 0 ? 1 : fadeIn)) * 24}px)`;
  });
  if (bar) bar.style.transform = `scaleX(${p})`;
}

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize(); readScroll();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  prog += (target - prog) * 0.09;
  layout(prog, clock.getElapsedTime());
  renderer.render(scene, camera);
});

// expose for headless screenshots
window.__setProgress = v => { target = prog = v; layout(v, 0); renderer.render(scene, camera); };
