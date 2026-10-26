// Qamar One: a premium launch. The dial sits dark, wakes up (glossy black AMOLED glows), the knurled ring turns,
// then it opens into an exploded view (glass, display, ring, screws, chassis, PCB with the Q1 chip, battery, body)
// with callouts, dives onto the chip, and screws itself back together.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvas = document.getElementById('stage');
const story = document.getElementById('story');
const isMobile = matchMedia('(max-width: 760px)').matches;
const lang = () => document.documentElement.lang === 'ar' ? 'ar' : 'en';
const DISPLAY = "'Sora',Inter,system-ui,sans-serif", MONO = "'IBM Plex Mono',ui-monospace,monospace", AR = "'Readex Pro',Tahoma,sans-serif";

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.85;
const camera = new THREE.PerspectiveCamera(isMobile ? 44 : 30, 1, 0.05, 80);
const key = new THREE.SpotLight(0xfff3e4, 90, 30, 0.5, 0.7, 1.4); key.position.set(-4, 7, 5); scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0x9fc6ff, 1.4); rim.position.set(5, 2, -5); scene.add(rim);
const warm = new THREE.DirectionalLight(0xffd7a0, 0.6); warm.position.set(3, -1, 4); scene.add(warm);
scene.add(new THREE.AmbientLight(0xffffff, 0.12));

// ---------- helpers ----------
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lathe = (pts, seg = 128) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const FIN = { sand: 0xd9cfbf, graphite: 0x55595f };
const alu = new THREE.MeshPhysicalMaterial({ color: FIN.sand, metalness: 1, roughness: 0.33, envMapIntensity: 1.6, clearcoat: 0.15 });
const aluDark = new THREE.MeshPhysicalMaterial({ color: 0x8c8f95, metalness: 1, roughness: 0.46, envMapIntensity: 1.3 });
const steel = new THREE.MeshPhysicalMaterial({ color: 0xa7adb5, metalness: 1, roughness: 0.22, envMapIntensity: 1.8 });
const blackPlastic = new THREE.MeshPhysicalMaterial({ color: 0x141518, roughness: 0.5, clearcoat: 0.3 });
const goldM = new THREE.MeshPhysicalMaterial({ color: 0xe0b45e, metalness: 1, roughness: 0.25, envMapIntensity: 1.7 });

const device = new THREE.Group(); scene.add(device);
const parts = {};   // name -> { obj, y0, dy, r, label }
function part(name, obj, y0, dy, r) { obj.position.y = y0; device.add(obj); parts[name] = { obj, y0, dy, r }; return obj; }

// ---------- body (aluminium cup) ----------
const body = new THREE.Group();
body.add(new THREE.Mesh(lathe([[0, -0.22], [0.84, -0.22], [0.94, -0.205], [0.985, -0.17], [1.0, -0.1], [1.0, 0.0], [0.985, 0.018], [0.955, 0.02], [0.94, 0.0], [0.94, -0.13], [0.9, -0.14], [0, -0.14]], 160), alu));
{ // USB-C port, a rubber foot ring and a laser mark on the bottom
  const port = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.06, 0.05, 4, 0.025), new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: 0.6 })); port.position.set(0, -0.11, 0.985); body.add(port);
  const foot = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.012, 8, 96), new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.9 })); foot.rotation.x = Math.PI / 2; foot.position.y = -0.222; body.add(foot);
}
part('body', body, 0, 0, 1.0);

// ---------- battery ----------
{
  const [c, x] = cv(512, 512); const g = x.createLinearGradient(0, 0, 512, 512); g.addColorStop(0, '#c7ccd3'); g.addColorStop(1, '#8f96a0'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  x.fillStyle = '#2a2f36'; x.textAlign = 'center'; x.font = `600 40px ${MONO}`; x.fillText('Li-ion  3.85V', 256, 220); x.font = `500 30px ${MONO}`; x.fillText('2000 mAh · 7.7 Wh', 256, 270); x.font = `400 22px ${MONO}`; x.fillText('QAMAR · QB-20 · Made for Qamar One', 256, 320);
  x.strokeStyle = '#2a2f36'; x.lineWidth = 3; x.strokeRect(150, 360, 212, 40); x.fillText('⚠ do not puncture', 256, 388);
  const m = new THREE.MeshPhysicalMaterial({ map: tex(c), metalness: 0.6, roughness: 0.35, clearcoat: 0.6 });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.05, 96), [new THREE.MeshPhysicalMaterial({ color: 0x9aa1ab, metalness: 0.7, roughness: 0.35 }), m, m]);
  const lead = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.3), new THREE.MeshStandardMaterial({ color: 0xc87a2a, roughness: 0.4 })); lead.position.set(0.55, 0.03, 0.2); lead.rotation.y = 0.6;
  const g2 = new THREE.Group(); g2.add(b, lead); part('battery', g2, -0.115, 0.45, 0.74);
}

// ---------- PCB with the Q1 chip ----------
const pcb = new THREE.Group();
{
  const S = 1024, [c, x] = cv(S, S), [mc, mx] = cv(S, S);
  x.fillStyle = '#101214'; x.fillRect(0, 0, S, S); mx.fillStyle = 'rgb(0,150,0)'; mx.fillRect(0, 0, S, S);     // matte black solder mask
  const gold = (fn) => { x.save(); x.fillStyle = x.strokeStyle = '#c9a052'; fn(x); x.restore(); mx.save(); mx.fillStyle = mx.strokeStyle = 'rgb(0,70,255)'; fn(mx); mx.restore(); };
  // traces under the mask (dim), then exposed gold pads and vias
  x.strokeStyle = 'rgba(160,140,90,.22)'; x.lineWidth = 3;
  for (let i = 0; i < 70; i++) { let px = 200 + Math.random() * 620, py = 200 + Math.random() * 620; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 4; k++) { if (k % 2) px += (Math.random() - 0.5) * 240; else py += (Math.random() - 0.5) * 240; x.lineTo(px, py); } x.stroke(); }
  gold(g => { for (let i = 0; i < 260; i++) { const a = Math.random() * 7, r = Math.sqrt(Math.random()) * 470; g.beginPath(); g.arc(512 + Math.cos(a) * r, 512 + Math.sin(a) * r, 4, 0, 7); g.fill(); }
    g.lineWidth = 6; g.beginPath(); g.arc(512, 512, 488, 0.2, 1.3); g.stroke(); g.beginPath(); g.arc(512, 512, 470, 0.2, 1.3); g.stroke();      // antenna
    for (const [cx, cy] of [[512 + 0.78 * 512 * Math.cos(Math.PI / 4), 512 + 0.78 * 512 * Math.sin(Math.PI / 4)], [512 - 0.78 * 362, 512 + 0.78 * 362], [512 + 0.78 * 362, 512 - 0.78 * 362], [512 - 0.78 * 362, 512 - 0.78 * 362]]) { g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, 30, 0, 7); g.stroke(); } });
  x.fillStyle = 'rgba(242,241,238,.55)'; x.font = `500 22px ${MONO}`; x.fillText('QAMAR ONE  MB-01  REV C', 300, 900); x.fillText('Designed in Cairo', 360, 932);
  const m = new THREE.MeshStandardMaterial({ map: tex(c), roughnessMap: tex(mc, false), metalnessMap: tex(mc, false), roughness: 1, metalness: 1 });
  const board = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.024, 128), [new THREE.MeshStandardMaterial({ color: 0x2a3a2a, roughness: 0.6 }), m, m]);
  pcb.add(board);
  const top = 0.012;
  // SoC with laser-etched marking
  const [sc, sx] = cv(256, 256); sx.fillStyle = '#16171a'; sx.fillRect(0, 0, 256, 256); sx.fillStyle = '#7d8088'; sx.textAlign = 'center';
  sx.font = `600 40px ${DISPLAY}`; sx.fillText('QAMAR', 128, 102); sx.font = `600 56px ${DISPLAY}`; sx.fillText('Q1', 128, 160); sx.font = `400 20px ${MONO}`; sx.fillText('2611 · EG · A0', 128, 200);
  sx.beginPath(); sx.arc(34, 34, 8, 0, 7); sx.fill();
  const socTop = new THREE.MeshPhysicalMaterial({ map: tex(sc), roughness: 0.42, clearcoat: 0.3 });
  const soc = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.035, 0.3, 2, 0.008), [blackPlastic, blackPlastic, socTop, blackPlastic, blackPlastic, blackPlastic]); soc.position.set(-0.12, top + 0.018, 0.08); pcb.add(soc);
  const ram = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.026, 0.13, 2, 0.006), blackPlastic); ram.position.set(0.22, top + 0.013, 0.22); pcb.add(ram);
  // RF shield can with perforations
  const [rc, rx] = cv(256, 192); rx.fillStyle = '#b9bec5'; rx.fillRect(0, 0, 256, 192); rx.fillStyle = '#4a4e55'; for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) { rx.beginPath(); rx.arc(22 + i * 27, 22 + j * 29, 4, 0, 7); rx.fill(); }
  const can = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.05, 0.25, 2, 0.006), [steel, steel, new THREE.MeshPhysicalMaterial({ map: tex(rc), metalness: 1, roughness: 0.3 }), steel, steel, steel]); can.position.set(0.2, top + 0.025, -0.25); pcb.add(can);
  // flex connector, crystal, haptic motor
  const conn = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.06), goldM); conn.position.set(-0.45, top + 0.01, -0.3); pcb.add(conn);
  const xtal = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.02, 0.05, 2, 0.008), steel); xtal.position.set(-0.4, top + 0.01, 0.22); pcb.add(xtal);
  const hap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 48), steel); hap.position.set(0.5, top + 0.02, 0.32); pcb.add(hap);
  // passives
  const N = 90, smd = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.016, 0.018), new THREE.MeshStandardMaterial({ roughness: 0.5 }), N);
  const mm = new THREE.Matrix4(), col = new THREE.Color(); let k = 0;
  while (k < N) { const a = Math.random() * 7, r = 0.15 + Math.sqrt(Math.random()) * 0.62, px = Math.cos(a) * r, pz = Math.sin(a) * r;
    if (Math.abs(px + 0.12) < 0.22 && Math.abs(pz - 0.08) < 0.22) continue; if (Math.abs(px - 0.2) < 0.22 && Math.abs(pz + 0.25) < 0.18) continue;
    mm.makeRotationY(Math.random() < 0.5 ? 0 : Math.PI / 2); mm.setPosition(px, top + 0.008, pz); smd.setMatrixAt(k, mm); smd.setColorAt(k, col.set(Math.random() < 0.55 ? 0xb8925a : 0x1b1c1f)); k++; }
  pcb.add(smd);
}
part('pcb', pcb, -0.07, 0.95, 0.86);

// ---------- chassis (mid frame) with 4 screw holes ----------
const SCREW_R = 0.78, SCREW_A = [1, 3, 5, 7].map(i => i * Math.PI / 4);
{
  const s = new THREE.Shape(); s.absarc(0, 0, 0.92, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, 0.42, 0, Math.PI * 2, true); s.holes.push(hole);
  SCREW_A.forEach(a => { const h = new THREE.Path(); h.absarc(Math.cos(a) * SCREW_R, Math.sin(a) * SCREW_R, 0.035, 0, Math.PI * 2, true); s.holes.push(h); });
  [0.9, 2.4, 4.0, 5.5].forEach(a => { const h = new THREE.Path(); h.absarc(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0.09, 0, Math.PI * 2, true); s.holes.push(h); });
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1, curveSegments: 64 });
  g.rotateX(-Math.PI / 2); g.translate(0, -0.011, 0);
  part('chassis', new THREE.Mesh(g, aluDark), -0.03, 1.45, 0.92);
}
// ---------- screws (Torx heads, threaded shafts) ----------
const screws = SCREW_A.map(a => {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(lathe([[0, 0.012], [0.03, 0.012], [0.042, 0.004], [0.042, 0], [0.016, 0], [0.016, -0.11], [0.006, -0.12], [0, -0.12]], 40), steel));
  class H extends THREE.Curve { getPoint(t, o = new THREE.Vector3()) { const y = -0.005 - t * 0.105, an = t * 14 * Math.PI * 2; return o.set(Math.cos(an) * 0.0175, y, Math.sin(an) * 0.0175); } }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new H(), 240, 0.004, 5, false), steel));
  const star = new THREE.Shape(); for (let i = 0; i < 12; i++) { const r = i % 2 ? 0.01 : 0.02, an = i * Math.PI / 6; i ? star.lineTo(Math.cos(an) * r, Math.sin(an) * r) : star.moveTo(r, 0); }
  const st = new THREE.Mesh(new THREE.ShapeGeometry(star), new THREE.MeshBasicMaterial({ color: 0x1a1b1d })); st.rotation.x = -Math.PI / 2; st.position.y = 0.0125; g.add(st);
  g.position.set(Math.cos(a) * SCREW_R, 0, -Math.sin(a) * SCREW_R); device.add(g); return g;
});

// ---------- display (glossy black AMOLED that lights up) ----------
const [uiC, ui] = cv(768, 768);
const uiTex = tex(uiC);
const screenMat = new THREE.MeshPhysicalMaterial({ color: 0x040506, roughness: 0.06, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, emissive: 0xffffff, emissiveMap: uiTex, emissiveIntensity: 0, envMapIntensity: 1.5 });
{
  const g = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.016, 128), [new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.4 }), screenMat, blackPlastic]);
  g.add(panel);
  const flex = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.006, 0.34), new THREE.MeshPhysicalMaterial({ color: 0xc9802f, roughness: 0.35, clearcoat: 0.4, transmission: 0.2 })); flex.scale.z = 0.7; flex.position.set(-0.3, -0.012, -0.45); flex.rotation.set(0, 0.6, 0); g.add(flex);
  part('display', g, 0.075, 2.3, 0.86);
}
// ---------- knurled ring ----------
const ring = (() => {
  const g = lathe([[0.885, 0.045], [0.885, -0.045], [0.975, -0.045], [1.005, -0.03], [1.005, 0.03], [0.975, 0.045], [0.885, 0.045]], 540);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); if (r > 0.995) { const a = Math.atan2(z, x), k = 1 + 0.006 * Math.abs(Math.sin(a * 90)); p.setX(i, x * k); p.setZ(i, z * k); } }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, alu);
  const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 16), new THREE.MeshBasicMaterial({ color: 0xf0c987 })); dot.position.set(0, 0.046, 0.94); m.add(dot);
  return part('ring', m, 0.065, 2.65, 1.01);
})();
// ---------- sapphire cover glass ----------
const glass = new THREE.Mesh(lathe([[0, 0.013], [0.8, 0.013], [0.862, 0.008], [0.884, 0.0], [0.884, -0.011], [0, -0.011]], 128),
  new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.0, metalness: 0, transmission: 1, thickness: 0.05, ior: 1.77, transparent: true, envMapIntensity: 1.6, specularIntensity: 1 }));
part('glass', glass, 0.099, 3.0, 0.884);

// soft glow above the screen when it is on, and a contact shadow
const glowTex = (() => { const [c, x] = cv(256, 256); const g = x.createRadialGradient(128, 128, 40, 128, 128, 128); g.addColorStop(0, 'rgba(255,214,150,.0)'); g.addColorStop(0.55, 'rgba(255,214,150,.22)'); g.addColorStop(1, 'rgba(255,214,150,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); return tex(c); })();
const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false }));
glow.rotation.x = -Math.PI / 2; device.add(glow);
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.6,
  map: (() => { const [c, x] = cv(256, 256); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(0.55, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); return tex(c); })() }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.235; scene.add(shadow);

// ---------- screen UI ----------
let uiKey = '';
function drawUI(on, boot, value) {
  const k = `${on.toFixed(2)}|${boot.toFixed(2)}|${value.toFixed(1)}|${lang()}`; if (k === uiKey) return; uiKey = k;
  const S = 768, c = S / 2; ui.clearRect(0, 0, S, S); ui.fillStyle = '#000'; ui.fillRect(0, 0, S, S);
  if (on <= 0) { uiTex.needsUpdate = true; return; }
  ui.save(); ui.globalAlpha = on;
  if (boot > 0) { // crescent logo
    ui.save(); ui.globalAlpha = on * boot; ui.fillStyle = '#f0c987'; ui.shadowColor = '#f0c987'; ui.shadowBlur = 40;
    ui.beginPath(); ui.arc(c, c, 120, 0, 7); ui.fill(); ui.globalCompositeOperation = 'destination-out'; ui.beginPath(); ui.arc(c + 55, c - 40, 110, 0, 7); ui.fill(); ui.restore();
  }
  const u = on * (1 - boot);
  if (u > 0) {
    ui.globalAlpha = u;
    const g = ui.createRadialGradient(c, c, 0, c, c, c); g.addColorStop(0, '#1b1610'); g.addColorStop(1, '#000'); ui.fillStyle = g; ui.fillRect(0, 0, S, S);
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, f = (value - 16) / 14;
    ui.lineCap = 'round'; ui.lineWidth = 26; ui.strokeStyle = 'rgba(255,255,255,.1)'; ui.beginPath(); ui.arc(c, c, 300, a0, a1); ui.stroke();
    const ag = ui.createLinearGradient(0, S, S, 0); ag.addColorStop(0, '#8fd3ff'); ag.addColorStop(1, '#f0c987');
    ui.strokeStyle = ag; ui.shadowColor = '#f0c987'; ui.shadowBlur = 24; ui.beginPath(); ui.arc(c, c, 300, a0, a0 + (a1 - a0) * f); ui.stroke(); ui.shadowBlur = 0;
    for (let i = 0; i <= 28; i++) { const a = a0 + (a1 - a0) * i / 28; ui.strokeStyle = 'rgba(255,255,255,.25)'; ui.lineWidth = 3; ui.beginPath(); ui.moveTo(c + Math.cos(a) * 252, c + Math.sin(a) * 252); ui.lineTo(c + Math.cos(a) * 266, c + Math.sin(a) * 266); ui.stroke(); }
    ui.fillStyle = '#ffffff'; ui.textAlign = 'center'; ui.textBaseline = 'middle';
    ui.font = `300 190px ${DISPLAY}`; ui.fillText(`${Math.round(value)}°`, c + 14, c - 10);
    ui.fillStyle = '#9aa0a8'; ui.font = lang() === 'ar' ? `400 44px ${AR}` : `500 40px ${DISPLAY}`; ui.fillText(lang() === 'ar' ? 'الصالة · تبريد' : 'Living room · Cooling', c, c + 120);
    [['#f0c987', -90], ['#8fd3ff', 0], ['#9aa0a8', 90]].forEach(([cl, dx]) => { ui.fillStyle = cl; ui.beginPath(); ui.arc(c + dx, c + 200, 12, 0, 7); ui.fill(); });
  }
  ui.restore(); uiTex.needsUpdate = true;
}

// ---------- callouts (HTML labels + SVG leader lines) ----------
const callsEl = document.getElementById('calls'), svg = callsEl.querySelector('svg');
const LABELS = {
  glass: ['Sapphire cover', 'غطا سافاير', '9H, anti-reflective', 'مضاد للانعكاس'],
  ring: ['Knurled aluminium ring', 'حلقة ألومنيوم محززة', '120 clicks per turn', '120 تكّة في اللفّة'],
  display: ['1.4" AMOLED', 'شاشة AMOLED ‏1.4"', '466 × 466, 1,000 nits', '466 × 466، 1000 nit'],
  chassis: ['Mid-frame + 4 Torx screws', 'هيكل داخلي + 4 مسامير', 'no glue anywhere', 'من غير غرا'],
  pcb: ['Logic board · Q1 chip', 'اللوحة الأم · شريحة Q1', 'Wi-Fi 6 · Thread · BT 5.3', 'Wi-Fi 6 · Thread · BT 5.3'],
  battery: ['2,000 mAh battery', 'بطارية 2000 مللي أمبير', 'up to 30 days', 'لحد 30 يوم'],
  body: ['Aluminium body', 'جسم ألومنيوم', 'USB-C, magnetic mount', 'USB-C، تثبيت مغناطيسي'],
};
const labelEls = {}, lineEls = {};
Object.keys(LABELS).forEach(k => {
  const d = document.createElement('div'); d.className = 'call'; callsEl.appendChild(d); labelEls[k] = d;
  const l = document.createElementNS('http://www.w3.org/2000/svg', 'path'); l.setAttribute('fill', 'none'); l.setAttribute('stroke', 'rgba(242,241,238,.45)'); l.setAttribute('stroke-width', '1'); svg.appendChild(l); lineEls[k] = l;
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dot.setAttribute('r', '2.5'); dot.setAttribute('fill', '#f0c987'); svg.appendChild(dot); lineEls[k + 'Dot'] = dot;
});
function fillLabels() { Object.entries(LABELS).forEach(([k, [en, ar, sen, sar]]) => { labelEls[k].innerHTML = `${lang() === 'ar' ? ar : en}<small>${lang() === 'ar' ? sar : sen}</small>`; }); }
fillLabels();

// ---------- timeline ----------
const sm = t => t * t * (3 - 2 * t);
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const lerp = THREE.MathUtils.lerp;
// camera keys: [p, distance, elevation, azimuth, target y]
const CAM = [[0, 5.6, 0.45, 0.55, 0], [0.12, 5.0, 0.62, 0.3, 0.02], [0.3, 4.4, 0.95, 0.1, 0.05], [0.36, 5.4, 0.55, 0.45, 0.4],
  [0.5, 8.6, 0.26, 0.6, 1.45], [0.6, 8.6, 0.26, 0.75, 1.45], [0.67, 2.6, 0.62, 0.4, 0.92], [0.77, 2.7, 0.55, -0.2, 0.92],
  [0.82, 6.5, 0.4, 0.3, 0.6], [0.9, 5.2, 0.55, 0.25, 0.02], [1, 4.8, 0.7, 0.05, 0.02]];
const camT = V(0, 0, 0);
function camAt(p) {
  let a = CAM[CAM.length - 1], b = a, k = 0;
  for (let i = 0; i < CAM.length - 1; i++) if (p <= CAM[i + 1][0]) { a = CAM[i]; b = CAM[i + 1]; k = sm(seg(p, a[0], b[0])); break; }
  const d = lerp(a[1], b[1], k) * (isMobile ? 1.45 : 1), el = lerp(a[2], b[2], k), az = lerp(a[3], b[3], k); camT.set(0, lerp(a[4], b[4], k), 0);
  return [d, el, az];
}

let target = 0, prog = 0, mx = 0, my = 0, tmx = 0, tmy = 0;
const readScroll = () => { const r = story.getBoundingClientRect(); target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };
addEventListener('scroll', readScroll, { passive: true });
addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; }, { passive: true });
const right = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0);

function layout(p, t) {
  const rtl = document.documentElement.dir === 'rtl';
  mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
  // power: boot logo, then the UI; the ring turns the temperature
  const on = sm(seg(p, 0.12, 0.16)), boot = 1 - sm(seg(p, 0.18, 0.21)), value = 21 + 3 * sm(seg(p, 0.21, 0.31));
  drawUI(on, boot, value);
  screenMat.emissiveIntensity = 1.35 * on;
  glow.material.opacity = 0.9 * on * (1 - seg(p, 0.36, 0.42) + seg(p, 0.86, 0.9));
  // explode (with screws backing out first) and reassemble
  const unscrew = sm(seg(p, 0.35, 0.4)) * (1 - sm(seg(p, 0.85, 0.89)));
  const ex = sm(seg(p, 0.39, 0.5)) * (1 - sm(seg(p, 0.79, 0.86)));
  const lift = sm(seg(p, 0.6, 0.66)) * (1 - sm(seg(p, 0.76, 0.8)));   // upper layers move away so the camera can reach the chip
  Object.entries(parts).forEach(([n, pt]) => { if (pt.obj && pt.dy !== undefined) pt.obj.position.y = pt.y0 + pt.dy * ex + (pt.dy > 1 ? lift * 1.6 : 0); });
  ring.rotation.y = -(value - 21) * 0.55 + ex * 0.6;
  glow.position.y = parts.glass.obj.position.y + 0.02;
  screws.forEach((s, i) => { s.position.y = parts.chassis.y0 + 0.012 + parts.chassis.dy * ex + unscrew * 0.32 + lift * 1.6; s.rotation.y = unscrew * Math.PI * 6 + i; });
  // the whole dial turns slowly like on a turntable
  const settle = sm(seg(p, 0.88, 0.97)); device.rotation.y = lerp(t * 0.08 + p * 1.4, Math.sin(t * 0.4) * 0.08 + 1.55, settle) + mx * 0.3;
  device.rotation.x = my * 0.06;
  shadow.material.opacity = 0.6 * (1 - ex * 0.5);
  // camera on a sphere around the dial
  const [d, el, az] = camAt(p);
  camera.position.set(Math.sin(az) * Math.cos(el) * d, camT.y + Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d);
  camera.lookAt(camT);
  const side = isMobile ? 0 : (rtl ? 1 : -1) * innerWidth * 0.2;
  if (!isMobile) camera.setViewOffset(innerWidth, innerHeight, side, 0, innerWidth, innerHeight);
  else camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.16, innerWidth, innerHeight);
  camera.updateMatrixWorld();
  // callouts while exploded
  const lv = sm(seg(p, 0.47, 0.51)) * (1 - sm(seg(p, 0.6, 0.63)));
  right.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(rtl ? -1 : 1);
  let colX = rtl ? 1e9 : -1e9; const pts = {};
  Object.keys(LABELS).forEach(k => { const pt = parts[k]; tmp.set(0, 0, 0); pt.obj.getWorldPosition(tmp); tmp2.copy(tmp).addScaledVector(right, pt.r * 1.02).project(camera);
    const sx = (tmp2.x + 1) / 2 * innerWidth, sy = (1 - tmp2.y) / 2 * innerHeight; pts[k] = [sx, sy]; colX = rtl ? Math.min(colX, sx) : Math.max(colX, sx); });
  const lx = rtl ? Math.max(isMobile ? 104 : 12, colX - (isMobile ? 16 : 70)) : Math.min(innerWidth - (isMobile ? 104 : 230), colX + (isMobile ? 16 : 70));
  Object.keys(LABELS).forEach(k => { const [sx, sy] = pts[k], el2 = labelEls[k];
    el2.style.opacity = lv; el2.style.top = sy + 'px';
    if (rtl) { el2.style.left = 'auto'; el2.style.right = (innerWidth - lx + 8) + 'px'; } else { el2.style.right = 'auto'; el2.style.left = (lx + 8) + 'px'; }
    lineEls[k].setAttribute('d', `M${sx},${sy} L${lx},${sy}`); lineEls[k].style.opacity = lv; lineEls[k + 'Dot'].setAttribute('cx', sx); lineEls[k + 'Dot'].setAttribute('cy', sy); lineEls[k + 'Dot'].style.opacity = lv; });
  document.querySelectorAll('[data-step]').forEach(el => {
    const [a, b] = el.dataset.step.split(',').map(Number);
    const fi = a === 0 ? 1 : seg(p, a, a + 0.025), fo = b >= 1 ? 1 : 1 - seg(p, b - 0.025, b), op = Math.min(fi, fo);
    el.style.opacity = op; el.style.transform = `translateY(${(1 - fi) * 18}px)`; el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
  });
  const bar = document.getElementById('progress'); if (bar) bar.style.transform = `scaleX(${p})`;
}

// finish picker from the page
addEventListener('qamar-finish', e => { alu.color.setHex(FIN[e.detail] || FIN.sand); });
const redraw = () => { uiKey = ''; fillLabels(); };
document.fonts?.ready.then(redraw);
new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize(); readScroll();
const clock = new THREE.Clock(), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
renderer.setAnimationLoop(() => { prog += (target - prog) * 0.08; layout(prog, still ? 0 : clock.getElapsedTime()); renderer.render(scene, camera); });
window.__setProgress = v => { target = prog = v; layout(v, 1.2); renderer.render(scene, camera); };
