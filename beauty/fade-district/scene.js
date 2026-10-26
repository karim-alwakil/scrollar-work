// Fade District: "Walk into the shop". The scroll is the visit: street at night, the neon flickers on,
// the door opens, the camera glides past three chairs, stops at a station where the tools lift with their prices,
// and the mirror confirms your chair.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const C = window.CONCEPT;
const canvas = document.getElementById('stage');
const story = document.getElementById('story');
const isMobile = matchMedia('(max-width: 760px)').matches;
const lang = () => document.documentElement.lang === 'ar' ? 'ar' : 'en';
const T = o => (o && typeof o === 'object') ? o[lang()] : o;
const DISPLAY = "'Big Shoulders Display',Impact,'Arial Narrow',sans-serif";
const BODY = "'Archivo',Arial,sans-serif";
const AR = "'Readex Pro','Lalezar',Tahoma,sans-serif";
const RED = 0xe23b2e;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x0b0c0e, 1);
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.6;
scene.fog = new THREE.Fog(0x0b0c0e, 9, 26);
const camera = new THREE.PerspectiveCamera(isMobile ? 52 : 40, 1, 0.05, 80);
scene.add(new THREE.AmbientLight(0xffe8d0, 0.35));
scene.add(new THREE.HemisphereLight(0x8090b0, 0x1a1210, 0.25));

// ---------- helpers ----------
const std = o => new THREE.MeshStandardMaterial(o), phys = o => new THREE.MeshPhysicalMaterial(o);
const MAT = {
  wall: std({ color: 0x1c1d21, roughness: 0.92 }),
  wallIn: std({ color: 0x24211f, roughness: 0.85 }),
  wood: phys({ color: 0x5a3824, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
  chrome: phys({ color: 0xf2f4f7, metalness: 1, roughness: 0.12, envMapIntensity: 2.2 }),
  steel: phys({ color: 0xcfd3d9, metalness: 1, roughness: 0.28, envMapIntensity: 2 }),
  leather: phys({ color: 0x1a1a1c, roughness: 0.45, clearcoat: 0.8, clearcoatRoughness: 0.25, sheen: 0.4, sheenColor: new THREE.Color(0x553333) }),
  leatherRed: phys({ color: 0x8e1d16, roughness: 0.42, clearcoat: 0.8, clearcoatRoughness: 0.25 }),
  black: phys({ color: 0x111214, roughness: 0.35, clearcoat: 1 }),
  towel: std({ color: 0xf1eee8, roughness: 0.95 }),
  glass: phys({ color: 0xffffff, roughness: 0.05, transmission: 0.9, thickness: 0.05, transparent: true, opacity: 0.35 }),
};
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, rep) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; }
function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
const font = (size, weight = 800, display = true) => lang() === 'ar' ? `${weight > 600 ? 700 : 400} ${size * 0.82}px ${AR}` : `${weight} ${size}px ${display ? DISPLAY : BODY}`;

// ================= the street =================
const W = 6.2, H = 3.4;        // shop interior width and height; facade is the plane z = 0
// sidewalk + road
{ const [c, x] = cv(512, 512); x.fillStyle = '#17181b'; x.fillRect(0, 0, 512, 512); x.strokeStyle = '#0f1012'; x.lineWidth = 6;
  for (let i = 0; i <= 512; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); }
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), std({ map: tex(c, [15, 7]), roughness: 0.7, metalness: 0.1 }));
  walk.rotation.x = -Math.PI / 2; walk.position.set(0, 0, 7); scene.add(walk); }
// facade with a door and a shop window cut out
const facade = new THREE.Group(); scene.add(facade);
{
  const s = new THREE.Shape(); s.moveTo(-9, 0); s.lineTo(9, 0); s.lineTo(9, 6.5); s.lineTo(-9, 6.5); s.closePath();
  const hole = (x0, y0, x1, y1) => { const h = new THREE.Path(); h.moveTo(x0, y0); h.lineTo(x0, y1); h.lineTo(x1, y1); h.lineTo(x1, y0); h.closePath(); s.holes.push(h); };
  hole(-0.6, 0, 0.6, 2.35);       // door
  hole(0.95, 0.7, 2.95, 2.5);     // shop window
  hole(-2.95, 0.7, -0.95, 2.5);   // second window
  const [bc, bx] = cv(512, 512); bx.fillStyle = '#1b1c20'; bx.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 16; r++) for (let k = 0; k < 8; k++) { const off = r % 2 ? 32 : 0; const v = 22 + Math.random() * 10 | 0; bx.fillStyle = `rgb(${v + 4},${v + 2},${v})`; bx.fillRect(k * 64 + off + 2, r * 32 + 2, 60, 28); }
  const wallM = std({ map: tex(bc, [0.25, 0.25]), roughness: 0.9 });
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false });
  const m = new THREE.Mesh(g, wallM); m.position.z = -0.3; facade.add(m);
  // window frames and glass
  [[1.95, 1.6, 2, 1.8], [-1.95, 1.6, 2, 1.8]].forEach(([x, y, w, h]) => {
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), MAT.glass); gl.position.set(x, y, -0.05); facade.add(gl);
    [[0, h / 2, w + 0.1, 0.06], [0, -h / 2, w + 0.1, 0.06], [-w / 2, 0, 0.06, h], [w / 2, 0, 0.06, h]].forEach(([dx, dy, fw, fh]) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.08), MAT.black); f.position.set(x + dx, y + dy, -0.02); facade.add(f); });
  });
  // window lettering, like painted gold vinyl
  const [lc, lx] = cv(512, 256); lx.clearRect(0, 0, 512, 256); lx.fillStyle = '#e9cfa6'; lx.textAlign = 'center'; lx.font = `700 34px ${BODY}`; lx.fillText('CUTS  ·  FADES  ·  BEARDS', 256, 140);
  const lt = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), new THREE.MeshBasicMaterial({ map: tex(lc), transparent: true, depthWrite: false })); lt.position.set(1.95, 1.4, -0.04); facade.add(lt);
  // awning
  const aw = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.08, 1.1), std({ color: 0x0f0f11, roughness: 0.6 })); aw.position.set(0, 3.55, 0.45); aw.rotation.x = 0.18; facade.add(aw);
  const awEdge = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.22, 0.04), std({ color: RED, roughness: 0.5 })); awEdge.position.set(0, 3.45, 1.0); facade.add(awEdge);
}
// door: hinged on its left edge, opens inward
const doorPivot = new THREE.Group(); doorPivot.position.set(-0.6, 0, -0.15); scene.add(doorPivot);
{
  const d = new THREE.Group(); d.position.x = 0.6; doorPivot.add(d);
  [[0, 2.3, 1.2, 0.1], [0, 0.05, 1.2, 0.1], [-0.55, 1.17, 0.1, 2.3], [0.55, 1.17, 0.1, 2.3]].forEach(([x, y, w, h]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), MAT.black); b.position.set(x, y, 0); d.add(b); });
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.15), MAT.glass); gl.position.y = 1.17; d.add(gl);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 16), MAT.chrome); bar.position.set(0.4, 1.15, 0.08); d.add(bar);
  // "OPEN" sign hanging on the door
  const [oc, ox] = cv(256, 96); ox.fillStyle = '#f1eee8'; rr(ox, 4, 4, 248, 88, 10); ox.fill(); ox.fillStyle = '#e23b2e'; ox.font = `800 64px ${DISPLAY}`; ox.textAlign = 'center'; ox.fillText('OPEN', 128, 72);
  const os = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), new THREE.MeshBasicMaterial({ map: tex(oc) })); os.position.set(0, 1.55, 0.045); d.add(os);
}
// neon sign
const neon = (() => {
  const [c, x] = cv(1024, 220);
  const draw = () => { x.clearRect(0, 0, 1024, 220); x.textAlign = 'center'; x.textBaseline = 'middle';
    const txt = lang() === 'ar' ? 'فيد ديستريكت' : 'FADE DISTRICT';
    let fs = lang() === 'ar' ? 120 : 150; const f = n => lang() === 'ar' ? `700 ${n}px ${AR}` : `800 ${n}px ${DISPLAY}`; x.font = f(fs);
    const w = x.measureText(txt).width; if (w > 900) { fs = fs * 900 / w; x.font = f(fs); }
    x.shadowColor = '#ff3b2a'; x.shadowBlur = 30; x.strokeStyle = '#ff5a48'; x.lineWidth = 10; x.strokeText(txt, 512, 116);
    x.shadowBlur = 8; x.fillStyle = '#ffe3dc'; x.fillText(txt, 512, 116); t.needsUpdate = true; };
  const t = tex(c); draw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.9), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
  m.position.set(0, 4.3, 0.05); scene.add(m);
  const [hc, hx] = cv(256, 64); const gr = hx.createRadialGradient(128, 32, 0, 128, 32, 128); gr.addColorStop(0, 'rgba(255,60,40,.55)'); gr.addColorStop(1, 'rgba(255,60,40,0)'); hx.fillStyle = gr; hx.fillRect(0, 0, 256, 64);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.2), new THREE.MeshBasicMaterial({ map: tex(hc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  halo.position.set(0, 4.3, 0.02); scene.add(halo);
  const light = new THREE.PointLight(0xff3b2a, 0, 9, 1.6); light.position.set(0, 4, 1.2); scene.add(light);
  return { m, halo, light, draw };
})();
// barber pole on the wall next to the door
const pole = (() => {
  const g = new THREE.Group(); const [c, x] = cv(256, 256); x.fillStyle = '#f4f2ee'; x.fillRect(0, 0, 256, 256);
  const band = (col, off) => { x.fillStyle = col; x.beginPath(); x.moveTo(off, 0); x.lineTo(off + 48, 0); x.lineTo(off + 48 - 256, 256); x.lineTo(off - 256, 256); x.closePath(); x.fill(); };
  for (const o of [0, 256, 512]) { band('#d6312a', o); band('#2446b8', o - 128); }
  const t = tex(c, [1, 2]);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.0, 48, 1, true), new THREE.MeshBasicMaterial({ map: t }));
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.02, 48, 1, true), MAT.glass);
  const cap = new THREE.Mesh(new THREE.LatheGeometry([[0, 0.1], [0.1, 0.09], [0.18, 0.04], [0.18, 0], [0, 0]].map(([r, y]) => new THREE.Vector2(r, y)), 48), MAT.chrome);
  cap.position.y = 0.51; const cap2 = cap.clone(); cap2.scale.y = -1; cap2.position.y = -0.51;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.3), MAT.chrome); arm.position.set(0, 0, -0.18);
  g.add(inner, glass, cap, cap2, arm); g.position.set(-3.45, 2.3, 0.32); scene.add(g);
  const glow = new THREE.PointLight(0xffffff, 0.6, 3, 2); glow.position.set(-3.45, 2.3, 0.9); scene.add(glow);
  return { t };
})();

// ================= the shop interior (z from 0 to -11) =================
const D = 11;
{ // checkerboard floor
  const [c, x] = cv(256, 256); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#e8e4dc' : '#141416'; x.fillRect(i * 64, j * 64, 64, 64); }
  const f = new THREE.Mesh(new THREE.PlaneGeometry(W, D), phys({ map: tex(c, [W / 1.0, D / 1.0]), roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.2 }));
  f.rotation.x = -Math.PI / 2; f.position.set(0, 0.002, -D / 2); scene.add(f);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std({ color: 0x101012, roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, -D / 2); scene.add(ceil);
  // left wall: dark wood slats
  const [wc, wx] = cv(512, 256); wx.fillStyle = '#3a2618'; wx.fillRect(0, 0, 512, 256); for (let i = 0; i < 512; i += 32) { wx.fillStyle = 'rgba(0,0,0,.35)'; wx.fillRect(i, 0, 3, 256); wx.fillStyle = 'rgba(255,220,180,.05)'; wx.fillRect(i + 3, 0, 10, 256); }
  const lw = new THREE.Mesh(new THREE.PlaneGeometry(D, H), std({ map: tex(wc, [D / 2, 1]), roughness: 0.7 })); lw.rotation.y = Math.PI / 2; lw.position.set(-W / 2, H / 2, -D / 2); scene.add(lw);
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(D, H), MAT.wallIn); rw.rotation.y = -Math.PI / 2; rw.position.set(W / 2, H / 2, -D / 2); scene.add(rw);
  const bw = new THREE.Mesh(new THREE.PlaneGeometry(W, H), MAT.wallIn); bw.position.set(0, H / 2, -D); scene.add(bw);
  // back wall neon logo
  const [nc, nx] = cv(512, 256); nx.textAlign = 'center'; nx.shadowColor = '#ff3b2a'; nx.shadowBlur = 24; nx.strokeStyle = '#ff5a48'; nx.lineWidth = 8; nx.font = `800 150px ${DISPLAY}`; nx.strokeText('FD', 256, 170); nx.fillStyle = '#ffe3dc'; nx.fillText('FD', 256, 170);
  const bn = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ map: tex(nc), transparent: true, toneMapped: false, depthWrite: false })); bn.position.set(0, 2.2, -D + 0.02); scene.add(bn);
  const bl = new THREE.PointLight(0xff3b2a, 1.2, 5, 2); bl.position.set(0, 2.2, -D + 0.6); scene.add(bl);
  // ceiling light strips
  for (let z = -1.5; z > -D; z -= 2.5) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 1.6), new THREE.MeshBasicMaterial({ color: 0xfff1dc, toneMapped: false })); s.position.set(-0.9, H - 0.02, z); scene.add(s); }
  // waiting bench on the left wall
  const bench = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.12, 2.6, 4, 0.04), MAT.leather); bench.position.set(-W / 2 + 0.4, 0.48, -5.2); scene.add(bench);
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.5, 2.6, 4, 0.04), MAT.leather); back.position.set(-W / 2 + 0.12, 0.8, -5.2); scene.add(back);
  [-6.3, -4.1].forEach(z => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 12), MAT.chrome); l.position.set(-W / 2 + 0.4, 0.21, z); scene.add(l); });
  // plant
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.4, 24), MAT.black); pot.position.set(-W / 2 + 0.4, 0.2, -2.0); scene.add(pot);
  for (let i = 0; i < 9; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), std({ color: 0x24402c, roughness: 0.8 })); lf.scale.set(0.5, 1.6, 0.3); lf.position.set(-W / 2 + 0.4 + Math.cos(i) * 0.12, 0.65 + (i % 3) * 0.12, -2.0 + Math.sin(i * 2) * 0.12); lf.rotation.set(Math.sin(i) * 0.6, i, Math.cos(i) * 0.5); scene.add(lf); }
}

[-2.2, -5.6, -9].forEach(z => { const f = new THREE.PointLight(0xffd2a0, 5, 7, 1.6); f.position.set(0, H - 0.3, z); scene.add(f); });

// barber chair, facing +x (toward the mirrors on the right wall)
function chair() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.05, 48), MAT.chrome); base.position.y = 0.025;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.42, 32), MAT.chrome); post.position.y = 0.26;
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.16, 0.58, 5, 0.06), MAT.leather); seat.position.y = 0.55;
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.72, 0.56, 5, 0.06), MAT.leather); back.position.set(-0.3, 0.98, 0); back.rotation.z = -0.12;
  const head = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.16, 0.32, 4, 0.05), MAT.leather); head.position.set(-0.4, 1.46, 0);
  const headPost = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 12), MAT.chrome); headPost.position.set(-0.38, 1.33, 0);
  const stripe = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.08, 0.57, 3, 0.03), MAT.leatherRed); stripe.position.set(-0.3, 1.25, 0); stripe.rotation.z = -0.12;
  g.add(base, post, seat, back, head, headPost, stripe);
  [-0.33, 0.33].forEach(z => {
    const arm = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.06, 0.09, 3, 0.03), MAT.leather); arm.position.set(0, 0.8, z); g.add(arm);
    const tube = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.015, 10, 32, Math.PI), MAT.chrome); tube.position.set(0.05, 0.67, z); g.add(tube);
  });
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.4), MAT.chrome); foot.position.set(0.48, 0.2, 0); g.add(foot);
  const footArm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 10), MAT.chrome); footArm.position.set(0.36, 0.36, 0); footArm.rotation.z = 0.9; g.add(footArm);
  return g;
}

// three stations: chair, counter, mirror (mirror face is a canvas that changes with the story)
const STAFF = C.staff;
const STATION_Z = [-3.0, -5.6, -8.2];
const stations = STATION_Z.map((z, i) => {
  const g = new THREE.Group(); g.position.set(0, 0, z); scene.add(g);
  const ch = chair(); ch.position.set(1.65, 0, 0); g.add(ch);
  const counter = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.9, 1.7, 4, 0.03), MAT.wood); counter.position.set(W / 2 - 0.25, 0.45, 0); g.add(counter);
  const top = new THREE.Mesh(new RoundedBoxGeometry(0.56, 0.04, 1.76, 3, 0.015), phys({ color: 0xe9e5de, roughness: 0.2, clearcoat: 1 })); top.position.set(W / 2 - 0.26, 0.92, 0); g.add(top);
  // mirror: framed panel with a painted surface we draw into
  const [mc, mx] = cv(512, 640); const mt = tex(mc);
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.85), new THREE.MeshBasicMaterial({ map: mt, toneMapped: false }));
  mirror.rotation.y = -Math.PI / 2; mirror.position.set(W / 2 - 0.065, 1.95, 0); g.add(mirror);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.97, 1.62), MAT.black); frame.position.set(W / 2 - 0.035, 1.95, 0); g.add(frame);
  // bulbs around the mirror
  for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe2b0, toneMapped: false })); b.position.set(W / 2 - 0.08, 1.1 + k * 0.34, k % 2 ? 0.88 : -0.88); g.add(b); }
  // warm spot over the chair
  const spot = new THREE.SpotLight(0xffd9a8, 9, 6, 0.6, 0.6, 1.4); spot.position.set(1.4, H - 0.1, z); spot.target.position.set(1.7, 0.6, z); scene.add(spot, spot.target);
  return { g, mt, mx, spot, state: '' };
});

function paintMirror(st, mode) {
  if (st.state === mode + lang()) return; st.state = mode + lang();
  const x = st.mx, i = stations.indexOf(st), s = STAFF[i];
  const gr = x.createLinearGradient(0, 0, 512, 640); gr.addColorStop(0, '#2a2d33'); gr.addColorStop(0.5, '#15171a'); gr.addColorStop(1, '#22252a'); x.fillStyle = gr; x.fillRect(0, 0, 512, 640);
  x.fillStyle = 'rgba(255,255,255,.06)'; x.beginPath(); x.moveTo(0, 120); x.lineTo(512, 0); x.lineTo(512, 60); x.lineTo(0, 200); x.fill();
  x.textAlign = 'center'; x.direction = lang() === 'ar' ? 'rtl' : 'ltr';
  if (mode === 'slots') {
    x.fillStyle = '#8d9097'; x.font = font(34, 600, false); x.fillText(T(s.name).toUpperCase?.() ?? T(s.name), 256, 120);
    x.fillStyle = '#f1eee8'; x.font = font(64); x.fillText(lang() === 'ar' ? 'مواعيد فاضية' : 'FREE TODAY', 256, 200);
    const times = [['19:00', '19:30', '20:30'], ['18:30', '20:00', '21:30'], ['19:30', '21:00', '22:00']][i];
    times.forEach((tm, k) => { const y = 260 + k * 104; x.fillStyle = k === 0 ? '#e23b2e' : 'rgba(241,238,232,.1)'; rr(x, 96, y, 320, 80, 10); x.fill();
      x.fillStyle = '#ffffff'; x.font = `800 52px ${DISPLAY}`; x.direction = 'ltr'; x.fillText(tm, 256, y + 58); });
  } else if (mode === 'name') {
    x.fillStyle = '#e23b2e'; x.font = `800 40px ${DISPLAY}`; x.direction = 'ltr'; x.fillText(`0${i + 1}`, 256, 150); x.direction = lang() === 'ar' ? 'rtl' : 'ltr';
    x.fillStyle = '#f1eee8'; x.font = font(140); const nm = lang() === 'ar' ? T(s.name) : T(s.name).toUpperCase(); const nw = x.measureText(nm).width; if (nw > 440) x.font = font(140 * 440 / nw); x.fillText(nm, 256, 320);
    x.fillStyle = '#8d9097'; x.font = font(40, 600, false); x.fillText(T(s.role), 256, 400);
    x.fillStyle = '#e9cfa6'; x.font = font(34, 600, false); x.fillText('★ 4.9', 256, 480);
  } else if (mode === 'confirm') {
    x.fillStyle = '#25d366'; x.beginPath(); x.arc(256, 150, 48, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(232, 152); x.lineTo(250, 170); x.lineTo(282, 132); x.stroke();
    x.fillStyle = '#f1eee8'; x.font = font(76); x.fillText(lang() === 'ar' ? 'كرسيك جاهز' : 'YOUR CHAIR', 256, 290);
    x.fillStyle = '#e23b2e'; x.font = `800 110px ${DISPLAY}`; x.direction = 'ltr'; x.fillText('19:30', 256, 410); x.direction = lang() === 'ar' ? 'rtl' : 'ltr';
    x.fillStyle = '#8d9097'; x.font = font(36, 600, false); x.fillText(`${T(s.name)} · ${T(C.services[1].name)}`, 256, 480);
  } else { x.fillStyle = 'rgba(255,255,255,.04)'; x.fillRect(0, 0, 512, 640); }
  st.mt.needsUpdate = true;
}

// ---------- the tools on the middle counter: they lift one by one with their price ----------
const TOOLS = [];
const S2 = stations[1];
function priceTag(svc) {
  const [c, x] = cv(512, 150); const t = tex(c);
  const draw = () => { x.clearRect(0, 0, 512, 150); x.fillStyle = 'rgba(14,15,17,.92)'; rr(x, 4, 4, 504, 142, 14); x.fill(); x.strokeStyle = 'rgba(241,238,232,.18)'; x.lineWidth = 2; x.stroke();
    x.fillStyle = '#e23b2e'; x.fillRect(4, 30, 8, 90);
    x.direction = lang() === 'ar' ? 'rtl' : 'ltr'; x.textAlign = lang() === 'ar' ? 'right' : 'left'; const X = lang() === 'ar' ? 480 : 36;
    x.fillStyle = '#f1eee8'; x.font = lang() === 'ar' ? `700 44px ${AR}` : `700 46px ${BODY}`; x.fillText(T(svc.name), X, 68);
    x.fillStyle = '#e9cfa6'; x.font = lang() === 'ar' ? `400 34px ${AR}` : `500 34px ${BODY}`; x.fillText(`${svc.price} ${T(C.currency)}  ·  ${svc.min} ${lang() === 'ar' ? 'دقيقة' : 'min'}`, X, 118);
    t.needsUpdate = true; };
  draw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.135), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
  m.userData.draw = draw; return m;
}
function tool(build, svcId, z) {
  const g = new THREE.Group(); const o = build(); g.add(o);
  const svc = C.services.find(s => s.id === svcId) || C.services[0];
  const tag = priceTag(svc); tag.rotation.y = -Math.PI / 2; tag.userData.h = TOOLS.length % 2 ? 0.5 : 0.3; tag.position.set(-0.02, tag.userData.h, 0); g.add(tag);
  g.position.set(W / 2 - 0.3, 0.96, z); S2.g.add(g); TOOLS.push({ g, o, tag, rest: g.position.clone() });
}
const clipper = () => { const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.07, 0.36, 5, 0.03), MAT.black);
  const band = new THREE.Mesh(new RoundedBoxGeometry(0.112, 0.072, 0.05, 3, 0.02), phys({ color: 0xb8892f, metalness: 1, roughness: 0.3 })); band.position.z = 0.08;
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.04), MAT.chrome); blade.position.set(0, 0.0, 0.2);
  g.add(body, band, blade); g.rotation.x = -Math.PI / 2 * 0; return g; };
const razor = () => { const g = new THREE.Group();
  const handle = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.05, 0.32, 3, 0.012), MAT.wood); handle.position.z = -0.12;
  const blade = new THREE.Mesh(new RoundedBoxGeometry(0.008, 0.06, 0.24, 2, 0.003), MAT.chrome); blade.position.set(0, 0.0, 0.14); blade.rotation.x = 0.08;
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 12), MAT.chrome); pin.rotation.z = Math.PI / 2; pin.position.z = 0.02;
  g.add(handle, blade, pin); return g; };
const shearsT = () => { const g = new THREE.Group();
  const s = new THREE.Shape(); s.moveTo(-0.32, -0.07); s.lineTo(1.55, -0.015); s.quadraticCurveTo(1.72, 0.005, 1.55, 0.035); s.lineTo(0.05, 0.1); s.lineTo(-0.32, 0.08); s.closePath();
  [false, true].forEach(f => { const h = new THREE.Group(); h.add(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.012, bevelSegments: 2 }), MAT.steel));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.045, 14, 40), MAT.black); ring.position.set(-0.55, -0.12, 0.018); h.add(ring);
    if (f) { h.scale.y = -1; h.position.z = 0.05; } h.rotation.z = f ? -0.18 : 0.18; g.add(h); });
  const w = new THREE.Group(); w.add(g); g.scale.setScalar(0.2); g.rotation.set(Math.PI / 2, 0, Math.PI / 2); return w; };
const towel = () => { const g = new THREE.Group();
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.34, 32), MAT.towel); roll.rotation.x = Math.PI / 2; g.add(roll);
  const [sc, sx] = cv(64, 64); const gr = sx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, 64, 64);
  const smat = new THREE.SpriteMaterial({ map: tex(sc), transparent: true, depthWrite: false, opacity: 0.5 });
  const puffs = []; for (let k = 0; k < 7; k++) { const sp = new THREE.Sprite(smat.clone()); sp.scale.setScalar(0.18); g.add(sp); puffs.push(sp); }
  g.userData.tick = t => puffs.forEach((sp, k) => { const ph = (t * 0.35 + k / puffs.length) % 1; sp.position.set(Math.sin(ph * 6 + k) * 0.05, 0.05 + ph * 0.5, (k - 3) * 0.04); sp.material.opacity = 0.3 * (g.userData.lift || 0) * Math.sin(Math.PI * ph); sp.scale.setScalar(0.12 + ph * 0.25); });
  return g; };
tool(clipper, 'fade', 0.62);
tool(razor, 'beard', 0.2);
tool(towel, 'shave', -0.22);
tool(shearsT, 'cut', -0.62);

// ================= camera path =================
// [p, camera position, look-at point]; eased between neighbours
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const PATH = [
  [0.00, V(-1.4, 1.9, 12.2), V(-0.9, 2.3, 0)],
  [0.09, V(-0.4, 1.75, 7.5), V(-0.2, 2.0, 0)],
  [0.17, V(0, 1.6, 1.6), V(0, 1.5, -3)],
  [0.21, V(-0.5, 1.6, -0.6), V(2.6, 1.45, -3.5)],
  [0.38, V(-1.0, 1.65, -2.2), V(2.6, 1.5, -6.6)],
  [0.47, V(-1.1, 1.9, -3.0), V(W / 2, 1.85, -3.0)],
  [0.53, V(-1.1, 1.9, -5.6), V(W / 2, 1.85, -5.6)],
  [0.61, V(-1.1, 1.9, -8.2), V(W / 2, 1.85, -8.2)],
  [0.69, V(0.9, 2.05, -4.5), V(W / 2 - 0.3, 1.15, -5.6)],
  [0.85, V(0.9, 2.05, -6.7), V(W / 2 - 0.3, 1.15, -5.6)],
  [0.92, V(-0.6, 1.95, -5.6), V(W / 2, 1.9, -5.6)],
  [1.00, V(-0.4, 1.95, -5.6), V(W / 2, 1.9, -5.6)],
];
const sm = t => t * t * (3 - 2 * t);
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const pos = V(0, 0, 0), look = V(0, 0, 0);
function camAt(p) {
  for (let i = 0; i < PATH.length - 1; i++) { const [p0, a, la] = PATH[i], [p1, b, lb] = PATH[i + 1];
    if (p <= p1) { const k = sm(seg(p, p0, p1)); pos.lerpVectors(a, b, k); look.lerpVectors(la, lb, k); return; } }
  pos.copy(PATH.at(-1)[1]); look.copy(PATH.at(-1)[2]);
}

let target = 0, prog = 0, mx = 0, my = 0, tmx = 0, tmy = 0;
const readScroll = () => { const r = story.getBoundingClientRect(); target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };
addEventListener('scroll', readScroll, { passive: true });
addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; }, { passive: true });

function layout(p, t) {
  const rtl = document.documentElement.dir === 'rtl';
  mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
  // neon flickers on in the hero
  const k = Math.max(Math.min(1, t / 1.8), seg(p, 0, 0.04));
  const n = k >= 1 ? 1 : (Math.sin(t * 37) + Math.sin(t * 23) > 1.2 - 1.8 * k ? 1 : 0.12);
  neon.m.material.opacity = n; neon.halo.material.opacity = n * 0.9; neon.light.intensity = 6 * n;
  pole.t.offset.y = -t * 0.35;
  // door swings open
  doorPivot.rotation.y = -1.75 * sm(seg(p, 0.1, 0.17));
  // mirrors: free slots, then names, then the confirmation on the middle chair
  stations.forEach((st, i) => {
    let mode = 'slots';
    if (p > 0.42) mode = 'name';
    if (p > 0.88 && i === 1) mode = 'confirm';
    if (p > 0.655 && p < 0.88 && i === 1) mode = 'blank';
    paintMirror(st, mode);
    const focus = p > 0.42 && p < 0.65 ? (Math.abs(camAtZ(p) - STATION_Z[i]) < 1.3 ? 1 : 0.35) : 1;
    st.spot.intensity = 9 * focus;
  });
  // tools lift one by one
  TOOLS.forEach((tl, k) => {
    const a = 0.69 + k * 0.035, l = sm(seg(p, a, a + 0.05)) * (1 - sm(seg(p, 0.87, 0.9)));
    tl.g.position.set(tl.rest.x - 0.05 * l, tl.rest.y + 0.16 * l, tl.rest.z);
    tl.o.rotation.y = l * (Math.sin(t * 0.8 + k) * 0.35);
    tl.o.rotation.x = l * 0.25;
    tl.tag.material.opacity = seg(l, 0.5, 1); tl.tag.position.y = tl.tag.userData.h - 0.06 + 0.06 * l;
    tl.o.userData.lift = l; if (tl.o.userData.tick) tl.o.userData.tick(t);
  });
  camAt(p);
  camera.position.copy(pos); camera.position.x += mx * 0.15; camera.position.y -= my * 0.08;
  camera.lookAt(look);
  if (!isMobile) camera.setViewOffset(innerWidth, innerHeight, (rtl ? 1 : -1) * innerWidth * 0.16, 0, innerWidth, innerHeight);
  else camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.16, innerWidth, innerHeight);
  document.querySelectorAll('[data-step]').forEach(el => {
    const [a, b] = el.dataset.step.split(',').map(Number);
    const fi = a === 0 ? 1 : seg(p, a, a + 0.03), fo = b >= 1 ? 1 : 1 - seg(p, b - 0.03, b), op = Math.min(fi, fo);
    el.style.opacity = op; el.style.transform = `translateY(${(1 - fi) * 20}px)`; el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
  });
  const bar = document.getElementById('progress'); if (bar) bar.style.transform = `scaleX(${p})`;
}
function camAtZ(p) { camAt(p); return pos.z; }

// redraw canvas text when fonts arrive or the language flips
const redraw = () => { neon.draw(); stations.forEach(s => s.state = ''); TOOLS.forEach(tl => tl.tag.userData.draw()); };
document.fonts?.ready.then(redraw);
new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize(); readScroll();
const clock = new THREE.Clock(), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
renderer.setAnimationLoop(() => { prog += (target - prog) * 0.08; layout(prog, still ? 2 : clock.getElapsedTime()); renderer.render(scene, camera); });
window.__setProgress = v => { target = prog = v; layout(v, 2.4); renderer.render(scene, camera); };
