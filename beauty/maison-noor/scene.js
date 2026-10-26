// Maison Noor: "Liquid colour".
// The page is a glossy pool of liquid colour, like nail polish or liquid blush, marbling slowly as you scroll.
// Each chapter pours in a new shade from one point (blush, pearl, caramel, cherry) and the last one swirls them all.
// Plain WebGL: one full-screen shader (domain-warped noise for the marbling, derivatives for the glossy surface).

const canvas = document.getElementById('stage');
const story = document.getElementById('story');
const isMobile = matchMedia('(max-width: 760px)').matches;
const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });

const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes; uniform float uT, uMix, uZoom, uFlip;
uniform vec3 uA0, uA1, uA2, uB0, uB1, uB2;
uniform vec2 uPour;
// precision-safe 2D simplex noise (Ashima / Stefan Gustavson), mod 289 keeps the numbers small on every GPU
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x){ return mod289(((x * 34.0) + 1.0) * x); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0); m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float noise(vec2 p){ return 0.5 + 0.5 * snoise(p); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 3; i++){ v += a * noise(p); p = m * p; a *= 0.5; } return v; }
// marbled field: returns height and two warp channels
vec3 marble(vec2 p, float t){
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.12)), fbm(p + vec2(5.2, 1.3) - t * 0.09));
  vec2 r = vec2(fbm(p + 2.2 * q + vec2(1.7, 9.2) + t * 0.16), fbm(p + 2.2 * q + vec2(8.3, 2.8) - t * 0.13));
  float f = fbm(p + 2.4 * r);
  return vec3(f, r);
}
vec3 palette(vec3 m, vec3 c0, vec3 c1, vec3 c2){
  float bands = 0.5 + 0.5 * sin(m.x * 9.0 + m.y * 4.0);              // fine marbling veins
  vec3 c = mix(c0, c1, smoothstep(0.35, 0.7, m.x));
  c = mix(c, c2, smoothstep(0.5, 0.85, length(m.yz)) * 0.8);
  c = mix(c, c * 1.12 + 0.03, smoothstep(0.82, 1.0, bands) * 0.5);        // light veins
  return c;
}
void main(){
  vec2 uv = vUv; vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  p.x *= uFlip;
  vec2 P = p * uZoom + vec2(0.0, uT * 0.05);
  vec3 m = marble(P, uT);
  vec2 W = P + 2.4 * m.yz; float e = 0.012;
  float hx = fbm(W + vec2(e, 0.0)), hy = fbm(W + vec2(0.0, e));
  // the new colour pours in from one point and spreads with a marbled edge
  float d = length(p - uPour) + (m.y - 0.5) * 0.55 + (m.x - 0.5) * 0.35;
  float front = mix(-0.4, 2.4, uMix);
  float k = 1.0 - smoothstep(front - 0.22, front + 0.02, d);
  vec3 base = mix(palette(m, uA0, uA1, uA2), palette(m, uB0, uB1, uB2), k);
  // glossy surface from the height field
  vec3 n = normalize(vec3(-(hx - m.x) / e, -(hy - m.x) / e, 0.0) * 0.1 + vec3(0.0, 0.0, 1.0));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(-0.45, 0.6, 0.65));
  float diff = 0.7 + 0.3 * max(dot(n, L), 0.0);
  float spec = pow(max(dot(n, normalize(L + V)), 0.0), 70.0) * 0.75;
  vec3 R = reflect(-V, n);
  float soft = smoothstep(0.2, 0.9, R.y) * 0.18 + smoothstep(0.55, 0.62, R.x) * smoothstep(0.75, 0.65, R.x) * 0.25;   // a softbox caught in the gloss
  float fres = pow(1.0 - max(n.z, 0.0), 3.0) * 0.4;
  vec3 col = base * diff + vec3(1.0, 0.97, 0.98) * (spec + soft + fres);
  // gentle vignette
  col *= 1.0 - 0.18 * pow(length(uv - 0.5) * 1.3, 2.0);
  gl_FragColor = vec4(pow(col, vec3(1.0 / 1.04)), 1.0);
}`;

function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; }
const program = gl.createProgram(); gl.attachShader(program, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(program, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(program); gl.useProgram(program);
const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(program, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
const U = {}; ['uRes', 'uT', 'uMix', 'uZoom', 'uFlip', 'uA0', 'uA1', 'uA2', 'uB0', 'uB1', 'uB2', 'uPour'].forEach(n => U[n] = gl.getUniformLocation(program, n));

// ---------- shades (one per chapter) ----------
const hex = h => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]
const SHADES = [
  [0xf3c6cf, 0xd9849a, 0xfbeae8],   // hero: Maison Noor blush
  [0xf4e3dc, 0xd8b7ad, 0xfff7f2],   // the mirror: pearl and nude
  [0xd49a5c, 0xf0c88f, 0x7a4220],   // the hair: caramel, honey, chestnut
  [0x9e1131, 0xd93a58, 0x4a0716],   // the finish: cherry polish
  [0xe7a2b1, 0xd49a5c, 0x9e1131],   // the end: all of them, swirled
].map(s => s.map(hex));
const WIN = [[0, 0.13], [0.2, 0.4], [0.43, 0.63], [0.66, 0.86], [0.9, 1.01]];
// where each pour starts (screen space, x flips in RTL)
const POUR = [[0.5, 0.3], [0.55, 0.45], [0.45, -0.35], [0.6, 0.1], [0.0, 0.0]];

const sm = t => t * t * (3 - 2 * t);
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
let target = 0, prog = 0;
const readScroll = () => { const r = story.getBoundingClientRect(); target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };
addEventListener('scroll', readScroll, { passive: true });

const SCALE = isMobile ? 0.6 : 0.75;   // the liquid is soft, so a lower internal resolution looks the same and runs smoothly
function resize() { canvas.width = Math.round(innerWidth * SCALE * Math.min(devicePixelRatio, 1.5)); canvas.height = Math.round(innerHeight * SCALE * Math.min(devicePixelRatio, 1.5)); gl.viewport(0, 0, canvas.width, canvas.height); }
addEventListener('resize', resize); resize(); readScroll();

function frame(p, t) {
  const rtl = document.documentElement.dir === 'rtl';
  // current chapter = the window we're in (or the last one we passed); the pour runs at the start of each window
  let wi = 0; WIN.forEach(([a], i) => { if (p >= a - 0.06) wi = i; });
  const from = SHADES[Math.max(0, wi - 1)], to = SHADES[wi];
  const mix = wi === 0 ? 1 : sm(seg(p, WIN[wi][0] - 0.06, WIN[wi][0] + 0.08));
  gl.uniform2f(U.uRes, canvas.width, canvas.height);
  gl.uniform1f(U.uT, (t * 0.35) % 200.0 + p * 9.0);                       // scroll stirs the liquid, time keeps it alive
  gl.uniform1f(U.uMix, mix);
  gl.uniform1f(U.uZoom, 0.6 + 0.15 * Math.sin(p * Math.PI) + (isMobile ? 0.12 : 0));
  gl.uniform1f(U.uFlip, rtl ? -1 : 1);
  ['uA0', 'uA1', 'uA2'].forEach((n, i) => gl.uniform3fv(U[n], from[i]));
  ['uB0', 'uB1', 'uB2'].forEach((n, i) => gl.uniform3fv(U[n], to[i]));
  gl.uniform2fv(U.uPour, POUR[wi]);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  document.querySelectorAll('[data-step]').forEach(el => {
    const [s0, s1] = el.dataset.step.split(',').map(Number);
    const fi = s0 === 0 ? 1 : seg(p, s0, s0 + 0.03), fo = s1 >= 1 ? 1 : 1 - seg(p, s1 - 0.03, s1), op = Math.min(fi, fo);
    el.style.opacity = op; el.style.transform = `translateY(${(1 - fi) * 20}px)`; el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
  });
  const bar = document.getElementById('progress'); if (bar) bar.style.transform = `scaleX(${p})`;
}
const still = matchMedia('(prefers-reduced-motion: reduce)').matches, t0 = performance.now();
(function loop() { prog += (target - prog) * 0.08; frame(prog, still ? 0 : (performance.now() - t0) / 1000); requestAnimationFrame(loop); })();
window.__setProgress = v => { target = prog = v; frame(v, 2); };
