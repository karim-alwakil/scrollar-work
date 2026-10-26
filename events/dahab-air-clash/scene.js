// Dahab Air Clash: "From the drone".
// A drone looks straight down on the Blue Lagoon. Scrolling moves a kitesurfer across the turquoise water;
// you see the rider, the foam of the wake and the kite's shadow on the white sand below. Every turn is a chapter,
// and at the end the drone climbs to show the whole line carved into the lagoon.
// Plain WebGL: one full-screen shader for the water, the seabed, the beach and the reef.
// The wake is drawn on a 2D canvas in world space and uploaded as a texture only when the rider moves.

const canvas = document.getElementById('stage');
const story = document.getElementById('story');
const isMobile = matchMedia('(max-width: 760px)').matches;
const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });

// ---------------------------------------------------------------- the line the rider carves (world units, 1 = 100 m)
const PTS = [], STEP = 0.008;
const push = (x, y) => PTS.push([x, y]);
function leg(xa, ya, xb, yb, wig = 0.028) {
  const n = Math.ceil(Math.hypot(xb - xa, yb - ya) / STEP);
  for (let i = 1; i <= n; i++) { const t = i / n; push(xa + (xb - xa) * t, ya + (yb - ya) * t + wig * Math.sin(t * Math.PI * 2) * Math.sin(t * Math.PI)); }
}
function turn(cx, cy, r, a0, a1) {
  const n = Math.ceil(Math.abs(a1 - a0) * r / STEP);
  for (let i = 1; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
}
const XE = 0.74, XW = -0.8, DR = 0.06, RT = 0.22, PI = Math.PI;
const apex = [];                                         // point index at the middle of each turn
push(-1.02, 1.05);
leg(-1.02, 1.05, XE, 1.05 - DR); turn(XE, 1.05 - DR - RT, RT, PI / 2, -PI / 2); apex.push(PTS.length - 1);
leg(XE, 0.55, XW, 0.55 - DR); { const k = PTS.length; turn(XW, 0.55 - DR - RT, RT, PI / 2, PI * 1.5); apex.push(PTS.length - 1); }
leg(XW, 0.05, XE, 0.05 - DR); turn(XE, 0.05 - DR - RT, RT, PI / 2, -PI / 2); apex.push(PTS.length - 1);
leg(XE, -0.45, XW, -0.45 - DR); turn(XW, -0.45 - DR - RT, RT, PI / 2, PI * 1.5); apex.push(PTS.length - 1);
leg(XW, -0.95, -0.12, -0.97, 0.015);
turn(-0.12, -0.97 - 0.27, 0.27, PI / 2, PI / 2 - PI * 2);   // one big carved circle to finish
leg(-0.12, -0.97, 0.5, -1.0, 0.012);
// the turn markers above were taken at the end of each turn: step them back to the middle
for (let i = 0; i < apex.length; i++) apex[i] -= Math.round(PI * RT / STEP / 2);
const S = [0]; for (let i = 1; i < PTS.length; i++) S.push(S[i - 1] + Math.hypot(PTS[i][0] - PTS[i - 1][0], PTS[i][1] - PTS[i - 1][1]));
const LEN = S[S.length - 1];

function at(s) {                                           // position and heading at distance s along the line
  s = Math.max(0, Math.min(LEN - 1e-6, s));
  let lo = 0, hi = S.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
  const t = (s - S[lo]) / (S[hi] - S[lo] || 1), a = PTS[lo], b = PTS[hi];
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  return { x: a[0] + dx * t, y: a[1] + dy * t, dx: dx / l, dy: dy / l, i: lo };
}
// scroll progress to distance: each chapter caption lines up with a turn
const PN = [0.07, 0.235, 0.395, 0.555, 0.715, 0.9], SN = [0, ...apex.map(i => S[i]), LEN];
function sOf(p) {
  if (p <= PN[0]) return 0; if (p >= PN[PN.length - 1]) return LEN;
  let k = 0; while (p > PN[k + 1]) k++;
  return SN[k] + (SN[k + 1] - SN[k]) * (p - PN[k]) / (PN[k + 1] - PN[k]);
}

// ---------------------------------------------------------------- wake texture (world space)
const BOX = { x0: -1.15, y1: 1.3, w: 2.3, h: 2.95 }, PXU = isMobile ? 300 : 400;
const wc = document.createElement('canvas'); wc.width = Math.round(BOX.w * PXU); wc.height = Math.round(BOX.h * PXU);
const fc = document.createElement('canvas'); fc.width = wc.width; fc.height = wc.height;
const wx = wc.getContext('2d'), fx = fc.getContext('2d');
const X = x => (x - BOX.x0) * PXU, Y = y => (BOX.y1 - y) * PXU;
function drawWake(sr, boost) {
  wx.globalCompositeOperation = 'source-over'; wx.fillStyle = '#000'; wx.fillRect(0, 0, wc.width, wc.height);
  fx.fillStyle = '#000'; fx.fillRect(0, 0, fc.width, fc.height);
  if (sr <= 0 || boost <= 0.002) return;
  const r = at(sr), pts = PTS.slice(0, r.i + 1).concat([[r.x, r.y]]), ss = S.slice(0, r.i + 1).concat([sr]);
  wx.lineCap = fx.lineCap = 'butt'; wx.lineJoin = fx.lineJoin = 'round';
  const CH = 3;
  for (let a = 0; a < pts.length - 1; a += CH) {
    const b = Math.min(pts.length - 1, a + CH), age = sr - (ss[a] + ss[b]) / 2;
    const path = () => { const c = new Path2D(); c.moveTo(X(pts[a][0]), Y(pts[a][1])); for (let j = a + 1; j <= b; j++) c.lineTo(X(pts[j][0]), Y(pts[j][1])); return c; };
    const pth = path();
    // trace: disturbed water that spreads and stays (G)
    wx.strokeStyle = `rgba(0,255,0,${Math.min(1, (0.3 + 0.7 * Math.exp(-age / 1.2)) * boost * 0.8)})`;
    wx.lineWidth = (0.01 + Math.min(age, 1.5) * 0.016) * PXU; wx.stroke(pth);
    // foam: bright, narrow at the board, breaking up and fading behind it (R)
    if (age < 2.5) {
      fx.strokeStyle = `rgba(255,0,0,${Math.exp(-age / 0.55) * boost})`;
      fx.lineWidth = (0.004 + Math.min(age, 1.0) * 0.03) * PXU; fx.stroke(pth);
    }
  }
  // spray kicked up at the board, bigger when carving
  const r2 = at(sr - 0.03), turnAmt = Math.min(1, Math.hypot(r.dx - r2.dx, r.dy - r2.dy) * 3);
  const g = fx.createRadialGradient(X(r.x - r.dx * 0.006), Y(r.y - r.dy * 0.006), 0, X(r.x - r.dx * 0.006), Y(r.y - r.dy * 0.006), (0.008 + turnAmt * 0.01) * PXU);
  g.addColorStop(0, `rgba(255,0,0,${boost})`); g.addColorStop(1, 'rgba(255,0,0,0)');
  fx.fillStyle = g; fx.fillRect(0, 0, fc.width, fc.height);
  wx.globalCompositeOperation = 'lighter'; wx.drawImage(fc, 0, 0); wx.globalCompositeOperation = 'source-over';
}

// ---------------------------------------------------------------- shader
const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes, uCam, uRider, uDir, uKite, uKdir, uTipA, uTipB, uRS;
uniform float uVH, uT, uPx, uTrace;
uniform vec4 uBox;
uniform sampler2D uWake;
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
float n01(vec2 p){ return 0.5 + 0.5 * snoise(p); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 3; i++){ v += a * n01(p); p = m * p; a *= 0.5; } return v; }
float shoreX(float y){ return -1.62 + 0.16 * sin(y * 1.1 + 0.4) + 0.3 * (n01(vec2(y * 0.6, 3.1)) - 0.5); }
float reefX(float y){ return 1.42 + 0.16 * sin(y * 0.8 + 1.3) + 0.3 * (n01(vec2(y * 0.5, 7.7)) - 0.5); }
float sdBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float segD(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
// wind ripples: crests run east to west, travelling south with the north wind
float rip(vec2 p, float hf){
  vec2 q = p * vec2(42.0, 88.0) + vec2(0.0, uT * 1.6);
  float h = (snoise(q) * 0.5 + snoise(q * 1.7 + vec2(uT * 0.5, 3.1)) * 0.15) * hf;
  return h + snoise(p * vec2(11.0, 19.0) + vec2(1.3, uT * 0.45)) * 0.9;
}
// the kite's shadow: a crescent, arc centre on the rider's side, tips curving back toward the rider
float kiteMask(vec2 p, float blur){
  vec2 f = uKdir, s = vec2(-f.y, f.x), d = p - uKite;
  vec2 l = vec2(dot(d, s), dot(d, f));
  const float R = 0.058, SPAN = 1.2;
  vec2 c = l - vec2(0.0, R);
  float rr = length(c), ang = atan(c.x, -c.y);
  float th = 0.0105 * max(0.0, 1.0 - pow(abs(ang) / SPAN, 2.2)) + 0.0012;
  float dd = max(abs(rr - (R - th * 0.5)) - th * 0.5, (abs(ang) - SPAN) * R);
  return 1.0 - smoothstep(-blur, blur, dd);
}
void main(){
  vec2 uv = vUv;
  vec2 p = uCam + (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * uVH;
  vec3 Ld = normalize(vec3(0.35, 0.25, 0.9));
  float hf = smoothstep(0.0065, 0.0026, uPx);          // fine detail only when the drone is low
  float u = p.x - shoreX(p.y) + 0.02 * snoise(p * vec2(5.0, 14.0)), r = p.x - reefX(p.y);
  float d = 0.2 + 1.6 * smoothstep(0.0, 0.8, u) + (fbm(p * 1.3 + 4.0) - 0.45) * 1.8;   // metres of water
  d -= 0.5 * exp(-pow((r + 0.2) / 0.14, 2.0));                                        // pale sand before the reef
  d = mix(d, 22.0, pow(smoothstep(-0.12, 0.7, r), 1.6));                              // a long soft fade into the deep Gulf
  d = min(d, u * 2.2);                                                                // a gentle beach slope
  vec2 wuv = vec2((p.x - uBox.x) / uBox.z, (uBox.y - p.y) / uBox.w);
  float inb = step(0.0, wuv.x) * step(wuv.x, 1.0) * step(0.0, wuv.y) * step(wuv.y, 1.0);
  vec3 wk = texture2D(uWake, clamp(wuv, 0.0, 1.0)).rgb * inb;
  // shadows: kite, its two lines, the rider
  float blur = 0.0018 + uPx * 0.8, lw = uPx * 1.1 + 0.0003;
  float ksh = kiteMask(p, blur);
  float lsh = (1.0 - smoothstep(0.0, lw, min(segD(p, uRS, uTipA), segD(p, uRS, uTipB)))) * 0.45;
  vec2 f = uDir, sd = vec2(-f.y, f.x), dr = p - uRS;
  float rsh = 1.0 - smoothstep(0.7, 1.2, length(vec2(dot(dr, f), dot(dr, sd)) / vec2(0.0085, 0.0042)));
  float shade = 1.0 - 0.5 * max(ksh, max(lsh, rsh * 0.8));
  vec3 col;
  float land = smoothstep(0.06, -0.1, d);
  vec3 lcol;
  {
    float g = fbm(p * 2.6 + 2.0), gr = n01(p * vec2(60.0, 140.0)) * hf;
    vec3 dry = mix(vec3(0.86, 0.76, 0.6), vec3(0.95, 0.89, 0.76), g) * (0.97 + 0.04 * gr);
    dry = mix(dry, vec3(0.7, 0.6, 0.48), smoothstep(-0.7, -1.5, u + (g - 0.5) * 0.6) * 0.8);
    dry = mix(dry, vec3(0.76, 0.68, 0.53), smoothstep(-0.3, -0.02, d));                 // wet sand at the water line
    lcol = dry * shade;
  }
  {
    float dl = d; d = max(d, 0.0);
    float A = 0.0017 * (0.35 + 0.65 * hf) * (1.0 + 1.8 * wk.g + 2.0 * smoothstep(0.0, 0.2, r));
    float e = 0.0016, h0 = rip(p, hf), hx = rip(p + vec2(e, 0.0), hf), hy = rip(p + vec2(0.0, e), hf);
    vec3 n = normalize(vec3(-(hx - h0) / e * A, -(hy - h0) / e * A, 1.0));
    // the seabed, seen through the moving surface
    vec2 pb = p + n.xy * min(d, 3.0) * 0.004;
    vec3 bot = vec3(0.94, 0.9, 0.8);
    bot *= 1.0 - 0.06 * hf * (0.5 + 0.5 * sin(pb.y * 140.0 + snoise(pb * 18.0) * 3.0)) * smoothstep(3.0, 0.5, d);
    float grass = smoothstep(0.66, 0.76, fbm(pb * 2.2 + 11.0)) * smoothstep(0.25, 0.7, u) * (1.0 - smoothstep(-0.25, -0.05, r));
    bot = mix(bot, vec3(0.5, 0.52, 0.38), grass * 0.6);
    float reef = smoothstep(-0.06, 0.0, r) * (1.0 - smoothstep(0.03, 0.12, r)) * smoothstep(0.45, 0.62, n01(pb * 18.0));
    bot = mix(bot, vec3(0.36, 0.3, 0.26), reef * 0.12);
    float caus = (pow(1.0 - abs(snoise(pb * 60.0 + vec2(uT * 0.5, uT * 0.3))), 7.0) + pow(1.0 - abs(snoise(pb * 78.0 - vec2(uT * 0.35, -uT * 0.45) + 5.0)), 7.0)) * 0.5;
    float light = shade * (0.9 + 0.95 * caus * hf * exp(-d * 0.25));
    vec3 tr = exp(-vec3(0.95, 0.13, 0.085) * d);
    col = bot * light * tr + vec3(0.0, 0.19, 0.35) * (1.0 - tr);
    // foam: the wake, breakers on the reef edge, whitecaps out at sea, the lap of the shore
    float fn = mix(0.5, n01(p * 170.0 + vec2(0.0, uT * 0.4)), hf) * 0.55 + n01(p * 60.0 - uT * 0.15) * 0.45;
    float foam = smoothstep(0.3, 0.75, wk.r * (0.45 + 1.0 * fn));
    float brk = exp(-pow((r - 0.02 - 0.01 * snoise(vec2(p.y * 6.0, uT * 0.2))) / 0.016, 2.0)) * (0.45 + 0.55 * n01(p * vec2(40.0, 22.0) + vec2(uT * 0.5, 0.0)));
    float wcap = smoothstep(0.18, 0.4, r) * smoothstep(0.86, 0.93, n01(p * vec2(20.0, 34.0) + vec2(0.0, uT * 0.35))) * smoothstep(0.4, 0.7, n01(p * 3.0));
    float swash = smoothstep(0.1, 0.0, d) * smoothstep(-0.08, 0.0, dl) * smoothstep(0.45, 0.7, n01(vec2(p.y * 40.0, uT * 0.6)));
    foam = max(foam, max(brk * 0.0, max(wcap * 0.7, swash * 0.55)));
    // the surface: sky in the ripples and sparkles of sun
    vec3 H = normalize(Ld + vec3(0.0, 0.0, 1.0));
    float nh = max(dot(n, H), 0.0);
    float spec = pow(nh, 1800.0) * 0.6 * hf + pow(nh, 40.0) * 0.03;
    col = mix(col, vec3(0.62, 0.8, 0.97), 0.025 + 0.4 * pow(1.0 - n.z, 3.0));
    col += vec3(0.07, 0.11, 0.1) * wk.g * uTrace * (1.0 - foam);
    col += vec3(1.0, 0.98, 0.92) * spec * (1.0 - foam);
    col = mix(col, vec3(0.97, 0.98, 0.98) * mix(1.0, shade, 0.6), foam * 0.95);
    col = mix(col, lcol, land);
  }
  // the rider, standing on the board and leaning away from the kite
  {
    vec2 l = vec2(dot(p - uRider, f), dot(p - uRider, sd));
    float aa = uPx * 0.9;
    vec2 kd = normalize(uKite - uRider); vec2 lean = -vec2(dot(kd, f), dot(kd, sd)) * 0.0022;
    float board = sdBox(l, vec2(0.0078, 0.0024), 0.002);
    float body = (length((l - lean) / vec2(0.0034, 0.0019)) - 1.0) * 0.0019;
    float head = length(l - lean * 1.7) - 0.0011;
    float ab = 1.0 - smoothstep(-aa, aa, board), ay = 1.0 - smoothstep(-aa, aa, body), ah = 1.0 - smoothstep(-aa, aa, head);
    col = mix(col, vec3(0.08, 0.09, 0.1), ab);
    col = mix(col, vec3(1.0, 0.36, 0.21), ab * step(abs(l.y), 0.0005) * 0.9);
    col = mix(col, vec3(0.04, 0.05, 0.07), ay);
    col = mix(col, vec3(1.0, 0.36, 0.21), ah);
  }
  col = mix(col, vec3(0.75, 0.85, 0.93), smoothstep(2.0, 8.0, uVH) * 0.1);   // a little air between the drone and the sea
  col *= 1.0 - 0.22 * pow(length(uv - 0.5) * 1.25, 2.4);
  gl_FragColor = vec4(col, 1.0);
}`;

function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; }
const program = gl.createProgram(); gl.attachShader(program, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(program, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(program); gl.useProgram(program);
const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(program, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
const U = {}; ['uRes', 'uCam', 'uRider', 'uDir', 'uKite', 'uKdir', 'uTipA', 'uTipB', 'uRS', 'uVH', 'uT', 'uPx', 'uTrace', 'uBox', 'uWake'].forEach(n => U[n] = gl.getUniformLocation(program, n));
const tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.uniform1i(U.uWake, 0); gl.uniform4f(U.uBox, BOX.x0, BOX.y1, BOX.w, BOX.h);

// ---------------------------------------------------------------- scroll, camera, HUD
const sm = t => t * t * (3 - 2 * t);
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t, lzoom = (a, b, t) => Math.exp(lerp(Math.log(a), Math.log(b), t));
let target = 0, prog = 0;
const readScroll = () => { const r = story.getBoundingClientRect(); target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };
addEventListener('scroll', readScroll, { passive: true });
const SCALE = isMobile ? 0.6 : 0.75;
let aspect = 1;
function resize() {
  const k = SCALE * Math.min(devicePixelRatio, 1.5);
  canvas.width = Math.round(innerWidth * k); canvas.height = Math.round(innerHeight * k); gl.viewport(0, 0, canvas.width, canvas.height);
  aspect = innerWidth / innerHeight;
}
addEventListener('resize', resize); resize(); readScroll();

const SUN = (() => { const v = [0.35, 0.25, 0.9], l = Math.hypot(...v); return v.map(c => c / l); })();
const KH = 0.14, SHX = -SUN[0] / SUN[2], SHY = -SUN[1] / SUN[2];       // shadow offset per unit of height
let lastS = -1, lastB = -1;
const hud = { rec: document.getElementById('hRec'), alt: document.getElementById('hAlt'), hdg: document.getElementById('hHdg'), spd: document.getElementById('hSpd'), wind: document.getElementById('hWind'), dep: document.getElementById('hDep') };
const setT = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
const pad = n => String(Math.floor(n)).padStart(2, '0');

function frame(p, t) {
  const s = sOf(p), r = at(s);
  // the kite flies downwind (south) and a little ahead; on a turn it swings across, so smooth its direction along the line
  const a0 = at(s - 0.12), a1 = at(s + 0.04);
  let ax = a1.x - a0.x, ay = a1.y - a0.y; const al = Math.hypot(ax, ay) || 1, w = Math.min(1, al / 0.14);
  let kx = ax / al * 0.55 * w, ky = -0.85 + ay / al * 0.55 * w; const kl = Math.hypot(kx, ky); kx = kx / kl * 0.17; ky = ky / kl * 0.17;
  const ksx = r.x + kx + SHX * KH, ksy = r.y + ky + SHY * KH;                         // kite shadow on the seabed
  const rsx = r.x + SHX * 0.012, rsy = r.y + SHY * 0.012;
  let fdx = rsx - ksx, fdy = rsy - ksy; const fl = Math.hypot(fdx, fdy); fdx /= fl; fdy /= fl;
  const R = 0.058, SP = 1.2, sx = -fdy, sy = fdx;
  const tip = sg => [ksx + sx * sg * R * Math.sin(SP) + fdx * (R - R * Math.cos(SP)), ksy + sy * sg * R * Math.sin(SP) + fdy * (R - R * Math.cos(SP))];
  // camera: high over the whole lagoon, dives onto the rider, follows, then climbs to show the full line
  const zin = sm(seg(p, 0.045, 0.14)), zout = sm(seg(p, 0.885, 0.975));
  const HERO = isMobile ? Math.max(4.6, 3.6 / aspect) : Math.max(4.4, 6.2 / aspect), RIDE = isMobile ? Math.max(1.1, 0.8 / aspect) : 1.05;
  const END = Math.max(3.2, 2.5 / aspect);
  let cx = lerp(-0.12, r.x + r.dx * 0.08, zin), cy = lerp(0.1, r.y + r.dy * 0.08, zin);
  cx = lerp(cx, -0.16, zout); cy = lerp(cy, -0.12, zout);
  const vh = lzoom(lzoom(HERO, RIDE, zin), END, zout);
  // wake texture, only when something changed
  const boost = 1 - zout;
  if (Math.abs(s - lastS) > 1e-5 || Math.abs(boost - lastB) > 1e-3) {
    drawWake(s, boost); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, wc); lastS = s; lastB = boost;
  }
  gl.uniform2f(U.uRes, canvas.width, canvas.height);
  gl.uniform2f(U.uCam, cx, cy); gl.uniform1f(U.uVH, vh); gl.uniform1f(U.uPx, vh / canvas.height);
  gl.uniform1f(U.uT, t % 300); gl.uniform1f(U.uTrace, boost);
  gl.uniform2f(U.uRider, r.x, r.y); gl.uniform2f(U.uDir, r.dx, r.dy);
  gl.uniform2f(U.uKite, ksx, ksy); gl.uniform2f(U.uKdir, fdx, fdy); gl.uniform2fv(U.uTipA, tip(1)); gl.uniform2fv(U.uTipB, tip(-1)); gl.uniform2f(U.uRS, rsx, rsy);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  // HUD
  const b2 = at(s - 0.04), curve = Math.min(1, Math.hypot(r.dx - b2.dx, r.dy - b2.dy) * 4);
  const moving = seg(p, 0.07, 0.1) * (1 - seg(p, 0.9, 0.93));
  const spd = moving * (37 - curve * 13 + 2 * Math.sin(s * 9));
  const secs = p * 260;
  setT(hud.rec, `REC 00:${pad(secs / 60)}:${pad(secs % 60)}`);
  setT(hud.alt, `ALT ${Math.round(vh * 34)} M`);
  setT(hud.hdg, `HDG ${String(Math.round(((90 - Math.atan2(r.dy, r.dx) * 180 / Math.PI) + 360) % 360)).padStart(3, '0')}`);
  setT(hud.spd, `${Math.round(spd)} KM/H`);
  setT(hud.wind, `${Math.round(22 + 3 * Math.sin(t * 0.3) + 2 * Math.sin(p * 20))} KN N`);
  setT(hud.dep, `${(1.3 + 0.35 * Math.sin(s * 2.3) + 0.2 * Math.sin(s * 5.1)).toFixed(1)} M`);
  // captions
  document.querySelectorAll('[data-step]').forEach(el => {
    const [s0, s1] = el.dataset.step.split(',').map(Number);
    const fi = s0 === 0 ? 1 : seg(p, s0, s0 + 0.025), fo = s1 >= 1 ? 1 : 1 - seg(p, s1 - 0.025, s1), op = Math.min(fi, fo);
    el.style.opacity = op; el.style.transform = `translateY(${(1 - fi) * 24}px)`; el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
  });
  const bar = document.getElementById('progress'); if (bar) bar.style.transform = `scaleX(${p})`;
}
const still = matchMedia('(prefers-reduced-motion: reduce)').matches, t0 = performance.now();
(function loop() { prog += (target - prog) * 0.08; frame(prog, still ? 0 : (performance.now() - t0) / 1000); requestAnimationFrame(loop); })();
window.__setProgress = v => { target = prog = v; frame(v, 2); };
