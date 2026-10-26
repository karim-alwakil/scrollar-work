// Layla & Omar: "Sparkler writing".
// A dark wedding night with soft string lights out of focus. As you scroll, a sparkler writes the names in light,
// then the date, the time and the place, each line glowing hot white at the tip and cooling to gold behind it.
// At the end the sparkler bursts into a shower of gold and the whole invitation glows together.
// Canvas 2D only: light, sparks and glow, no modelled objects.

const canvas = document.getElementById('stage');
const story = document.getElementById('story');
const ctx = canvas.getContext('2d');
const isMobile = matchMedia('(max-width: 760px)').matches;
const lang = () => document.documentElement.lang === 'ar' ? 'ar' : 'en';
const SCRIPT = "'Pinyon Script','Cormorant Garamond',cursive", SERIF = "'Cormorant Garamond',Georgia,serif", ARS = "'Aref Ruqaa','Amiri',serif", AR = "'Amiri','Times New Roman',serif";
let W = 0, H = 0, DPR = 1;

// ---------- the lines of light ----------
// [window start, window end, size (share of screen width), y (share of height), english, arabic, font kind]
const LINES = [
  [0.03, 0.22, 0.62, 0.52, 'Layla & Omar', 'ليلى و عمر', 'script'],
  [0.24, 0.42, 0.5, 0.52, '12 · 12 · 2026', '١٢ · ١٢ · ٢٠٢٦', 'serif'],
  [0.44, 0.62, 0.62, 0.52, 'Katb El Ketab · 7 PM', 'كتب الكتاب · ٧ مساءً', 'serif'],
  [0.64, 0.8, 0.62, 0.52, 'The Nile Ballroom', 'قاعة النيل · الزمالك', 'serif'],
];
// the finale shows the names and the date together
const FINAL = [[0.6, 0.46, 0], [0.38, 0.64, 1]];
const words = [];   // per line: { cv, path:[[x,y]...], x0, x1, rtl }
function buildWords() {
  words.length = 0;
  const ar = lang() === 'ar';
  LINES.forEach(([, , size, , en, arT, kind]) => {
    const txt = ar ? arT : en, w = Math.round(W * (isMobile ? Math.min(0.92, size * 1.45) : size)), h = Math.round(w * 0.42);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d');
    const fam = kind === 'script' ? (ar ? ARS : SCRIPT) : (ar ? AR : SERIF), weight = kind === 'script' ? (ar ? 700 : 400) : 500;
    let fs = kind === 'script' ? h * 0.62 : h * 0.34; x.font = `${weight} ${fs}px ${fam}`;
    const mw = x.measureText(txt).width; if (mw > w * 0.94) { fs *= (w * 0.94) / mw; x.font = `${weight} ${fs}px ${fam}`; }
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = ar ? 'rtl' : 'ltr';
    // light-painting look: wide soft glow, then the warm line, then a thin hot core
    x.shadowColor = 'rgba(255,170,60,.9)'; x.shadowBlur = fs * 0.25; x.fillStyle = 'rgba(255,190,90,.55)'; x.fillText(txt, w / 2, h / 2);
    x.shadowBlur = fs * 0.08; x.fillStyle = '#ffd88a'; x.fillText(txt, w / 2, h / 2);
    x.shadowBlur = 0; x.globalAlpha = 0.55; x.fillStyle = '#fff6e0'; x.fillText(txt, w / 2, h / 2); x.globalAlpha = 1;
    // a path for the sparkler tip: per column, follow the ink nearest to where the tip already is
    const ink = document.createElement('canvas'); ink.width = w; ink.height = h; const ix = ink.getContext('2d');
    ix.font = x.font; ix.textAlign = 'center'; ix.textBaseline = 'middle'; ix.direction = x.direction; ix.fillStyle = '#fff'; ix.fillText(txt, w / 2, h / 2);
    const d = ix.getImageData(0, 0, w, h).data, cols = [];
    for (let X = 0; X < w; X += 3) { const ys = []; for (let Y = 0; Y < h; Y += 2) if (d[(Y * w + X) * 4 + 3] > 120) ys.push(Y); cols.push([X, ys]); }
    const lit = cols.filter(c => c[1].length); const x0 = lit.length ? lit[0][0] : 0, x1 = lit.length ? lit.at(-1)[0] : w;
    const order = ar ? lit.slice().reverse() : lit; let py = h / 2; const path = [];
    order.forEach(([X, ys]) => { let best = ys[0]; ys.forEach(y => { if (Math.abs(y - py) < Math.abs(best - py)) best = y; }); py = py * 0.55 + best * 0.45; path.push([X, py]); });
    words.push({ cv, path, x0, x1, rtl: ar, w, h });
  });
}

// ---------- background: night with string lights out of focus ----------
let bokeh = null;
function buildBokeh() {
  bokeh = document.createElement('canvas'); bokeh.width = Math.round(W * 1.2); bokeh.height = Math.round(H * 0.42); const b = bokeh.getContext('2d');
  let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let strand = 0; strand < 3; strand++) {
    const y0 = bokeh.height * (0.15 + strand * 0.2), sag = bokeh.height * (0.08 + strand * 0.03);
    for (let i = 0; i < 26; i++) { const t = i / 25, X = t * bokeh.width, Y = y0 + Math.sin(t * Math.PI) * sag + (r() - 0.5) * 8, rad = (isMobile ? 10 : 16) * (0.7 + r() * 0.8) * (1 + strand * 0.25);
      const g = b.createRadialGradient(X, Y, 0, X, Y, rad); const warm = r() < 0.8;
      g.addColorStop(0, warm ? 'rgba(255,200,120,.38)' : 'rgba(255,240,220,.3)'); g.addColorStop(0.7, warm ? 'rgba(255,180,90,.16)' : 'rgba(255,230,200,.12)'); g.addColorStop(1, 'rgba(255,180,90,0)');
      b.fillStyle = g; b.beginPath(); b.arc(X, Y, rad, 0, 7); b.fill(); }
  }
}

// ---------- sparks ----------
const sparks = [];
function emit(x, y, n, power = 1) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = (60 + Math.random() * 260) * power * DPR;
    sparks.push({ x, y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40 * DPR, life: 0.25 + Math.random() * 0.45 * power, age: 0, split: Math.random() < 0.25, w: (0.7 + Math.random() * 0.9) * DPR });
  }
}
function stepSparks(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]; s.age += dt; if (s.age > s.life) { sparks.splice(i, 1); continue; }
    s.px = s.x; s.py = s.y; s.vy += 220 * DPR * dt; s.vx *= 0.985; s.vy *= 0.985; s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.split && s.age > s.life * 0.45) { s.split = false; for (let k = 0; k < 3; k++) { const a = Math.random() * Math.PI * 2, sp = 60 * DPR + Math.random() * 90 * DPR;
      sparks.push({ x: s.x, y: s.y, px: s.x, py: s.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.12 + Math.random() * 0.18, age: 0, split: false, w: s.w * 0.6 }); } }
  }
  if (sparks.length > 2200) sparks.splice(0, sparks.length - 2200);
}
function drawSparks() {
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const s of sparks) { const k = s.age / s.life, a = 1 - k;
    ctx.strokeStyle = k < 0.25 ? `rgba(255,252,235,${a})` : k < 0.6 ? `rgba(255,214,120,${a})` : `rgba(255,140,50,${a})`;
    ctx.lineWidth = s.w; ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(s.x + (s.x - s.px) * 0.6, s.y + (s.y - s.py) * 0.6); ctx.stroke(); }
  ctx.globalCompositeOperation = 'source-over';
}
// the burning tip (just the light, no stick)
function drawSparkler(x, y, lit) {
  if (!lit) return;
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, 70 * DPR); g.addColorStop(0, 'rgba(255,250,230,.95)'); g.addColorStop(0.12, 'rgba(255,220,140,.55)'); g.addColorStop(1, 'rgba(255,160,60,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 70 * DPR, 0, 7); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

// ---------- timeline ----------
const sm = t => t * t * (3 - 2 * t);
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
let target = 0, prog = 0, last = performance.now(), tip = [0, 0];
const readScroll = () => { const r = story.getBoundingClientRect(); target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };
addEventListener('scroll', readScroll, { passive: true });

function placeWord(i, size, yFrac) { const wd = words[i], s = size ? (W * (isMobile ? Math.min(0.92, size * 1.45) : size)) / wd.w : 1; return { x: W / 2 - wd.w * s / 2, y: H * yFrac - wd.h * s / 2, s }; }
function drawWord(i, write, alpha, place) {
  const wd = words[i]; if (!wd || alpha <= 0) return null;
  const { x, y, s } = place, n = wd.path.length, k = Math.min(n - 1, Math.floor(write * (n - 1)));
  const [hx, hy] = wd.path[k] || [wd.w / 2, wd.h / 2];
  const front = hx;   // revealed up to the tip, from the start side
  ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'lighter';
  ctx.beginPath(); if (wd.rtl) ctx.rect(x + front * s - 2, y, (wd.w - front) * s + 4, wd.h * s); else ctx.rect(x, y, front * s + 2, wd.h * s); ctx.clip();
  ctx.drawImage(wd.cv, x, y, wd.w * s, wd.h * s);
  // the freshest part of the line is still hot
  if (write < 1) { ctx.beginPath(); const band = 70 * s; if (wd.rtl) ctx.rect(x + front * s, y, band, wd.h * s); else ctx.rect(x + front * s - band, y, band, wd.h * s); ctx.clip(); ctx.globalAlpha = alpha * 0.9; ctx.drawImage(wd.cv, x, y, wd.w * s, wd.h * s); }
  ctx.restore();
  return write < 1 ? [x + hx * s, y + hy * s] : null;
}

function frame(p, dt) {
  ctx.fillStyle = '#05060b'; ctx.fillRect(0, 0, W, H);
  // drifting string lights, dimmer while a line is being written
  if (bokeh) { ctx.globalAlpha = 0.7; ctx.drawImage(bokeh, -W * 0.1 + Math.sin(p * 3) * W * 0.05, H * 0.02 - p * H * 0.08); ctx.globalAlpha = 1; }
  let head = null, writing = false;
  LINES.forEach((L, i) => {
    const [a, b, size, yf] = L;
    const write = sm(seg(p, a + 0.015, a + (b - a) * 0.72)), fade = 1 - sm(seg(p, b - 0.03, b + 0.01));
    if (p < a - 0.01 || p > b + 0.01) return;
    const h = drawWord(i, write, fade, placeWord(i, size, yf));
    if (h && write > 0) { head = h; writing = true; }
  });
  // finale: burst, then the names and the date glow together
  const fin = seg(p, 0.82, 0.9), glow = sm(seg(p, 0.86, 0.94));
  if (glow > 0) FINAL.forEach(([size, yf, i]) => drawWord(i, 1, glow, placeWord(i, size, yf)));
  // the tip: idle at the start of the first line, then wherever the writing is
  if (!head) {
    if (p < 0.05) { const pl = placeWord(0, LINES[0][2], LINES[0][3]), wd = words[0]; const st = wd ? wd.path[0] : [0, 0]; head = [pl.x + st[0] * pl.s, pl.y + st[1] * pl.s]; }
    else if (p > 0.8 && p < 0.88) { head = [W / 2, H * (0.5 - 0.15 * fin)]; }
  }
  const lit = !!head && p < 0.88;
  if (head) { tip[0] += (head[0] - tip[0]) * Math.min(1, dt * 18); tip[1] += (head[1] - tip[1]) * Math.min(1, dt * 18); }
  if (lit) emit(tip[0], tip[1], Math.round((writing ? 26 : 12) * (isMobile ? 0.6 : 1) * Math.min(2, dt * 60)), writing ? 1 : 0.7);
  // the burst
  if (p > 0.86 && p < 0.9 && !frame.burst) { frame.burst = true; emit(W / 2, H * 0.35, isMobile ? 500 : 900, 2.6); }
  if (p < 0.84) frame.burst = false;
  stepSparks(dt); drawSparks(); if (lit) drawSparkler(tip[0], tip[1], true);
  document.querySelectorAll('[data-step]').forEach(el => {
    const [s0, s1] = el.dataset.step.split(',').map(Number);
    const fi = s0 === 0 ? 1 : seg(p, s0, s0 + 0.02), fo = s1 >= 1 ? 1 : 1 - seg(p, s1 - 0.02, s1), op = Math.min(fi, fo);
    el.style.opacity = op; el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
  });
  const bar = document.getElementById('progress'); if (bar) bar.style.transform = `scaleX(${p})`;
}

function resize() { DPR = Math.min(devicePixelRatio, 2); W = Math.round(innerWidth * DPR); H = Math.round(innerHeight * DPR); canvas.width = W; canvas.height = H; buildWords(); buildBokeh(); }
addEventListener('resize', resize); resize(); readScroll();
const fontsReady = Promise.all(["400 40px 'Pinyon Script'", "500 40px 'Cormorant Garamond'", "700 40px 'Aref Ruqaa'", "400 40px 'Amiri'"].map(f => document.fonts?.load(f).catch(() => {})));
fontsReady.then(buildWords);
new MutationObserver(buildWords).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
(function loop(now) { const dt = Math.min(0.05, ((now || performance.now()) - last) / 1000); last = now || performance.now(); prog += (target - prog) * 0.08; frame(prog, dt); requestAnimationFrame(loop); })();
window.__setProgress = v => { target = prog = v; for (let i = 0; i < 40; i++) frame(v, 1 / 60); };
