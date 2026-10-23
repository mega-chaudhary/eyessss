/*
  Eye -> Space
  Draws your eye photo as coloured text characters.
  Faint rows of text flicker in, the closed eyelid forms, the eye opens,
  blinks, looks around, then the camera zooms through the pupil into space.

  All geometry below is measured in pixels of the original 966 x 700 photo.
*/
(() => {
"use strict";

// ---------- your eye: measured on the photo ----------
const SRC_W = 966, SRC_H = 700;
const PUPIL = { x: 492, y: 390 };        // centre of the iris / pupil
const IRIS_R = 64;                        // iris radius
const PUPIL_R = 22;                       // pupil radius
const CATCH = { x: 473, y: 382 };         // the light reflection
const EYE_C = { x: 462, y: 392 };         // centre of the whole eye opening
const EYE_SPAN = 345;                     // corner-to-corner width of the eye
const X0 = 288, X1 = 630;                 // inner and outer eye corners
const LID_H = 40;                         // height of the upper eyelid skin (lash line to crease)
const UPPER_PTS = [[288, 381], [330, 361], [420, 337], [500, 333], [590, 366], [612, 398], [630, 447]];
const LOWER_PTS = [[288, 381], [330, 404], [420, 429], [500, 444], [580, 443], [630, 447]];

// ---------- timeline (seconds) ----------
const LOOP = 20;
const T = {
  build:  [0.35, 1.8],   // faint rows flicker in, closed eyelid forms
  open:   [2.0, 2.65],   // eye opens
  zoom:   [5.3, 11.5],
  focus:  [5.3, 7.0],
  space:  [6.3, 8.3],    // stars fade in inside the pupil
  portal: [6.5, 10.9],   // pupil widens into a window on space
  planet: [8.0, 17.8],
  out:    [18.7, 20]
};
const BLINKS = [3.15, 4.6];                // blink start times
const GAZE = [                             // where the eye looks: [time, dx, dy]
  [2.7, 0, 0], [2.95, -5, 1], [3.9, -5, 1], [4.05, 4, -1], [4.45, 4, -1], [4.6, 0, 0]
];
const ZMAX = 11;
const FONT = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace';

// ---------- characters ----------
const RAMP = " .'`,:;-~^\"+=<>!i?|/\\()1{}[]lrcvunxzjtfJCLUYXZO0QmwqpdbkhaoMW8B&%$#@";
const NR = RAMP.length;
const DENSE = "QZ0O8B&%$#@MWmwqpdbkh";
const CHARS = (RAMP + DENSE + "+-|*.·").split("");
const C_DENSE0 = NR;
const C_PLUS = NR + DENSE.length, C_DASH = C_PLUS + 1, C_BAR = C_PLUS + 2,
      C_STAR = C_PLUS + 3, C_DOT = C_PLUS + 4, C_MID = C_PLUS + 5, C_COLON = RAMP.indexOf(":");

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
function hash(a, b, c) {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function buildCurve(pts) {
  const arr = new Float32Array(X1 - X0 + 1);
  for (let x = X0; x <= X1; x++) {
    let k = 1;
    while (k < pts.length - 1 && x > pts[k][0]) k++;
    const [a, ya] = pts[k - 1], [b, yb] = pts[k];
    const f = clamp((x - a) / (b - a));
    const s = f * f * (3 - 2 * f);
    arr[x - X0] = ya + (yb - ya) * (0.4 * f + 0.6 * s);
  }
  return arr;
}
const UP = buildCurve(UPPER_PTS), LO = buildCurve(LOWER_PTS);
function lidAt(arr, u) {
  const x = clamp(u, X0, X1) - X0, i = x | 0, f = x - i;
  return i >= arr.length - 1 ? arr[arr.length - 1] : arr[i] + (arr[i + 1] - arr[i]) * f;
}

// how open the eye is (0 closed, 1 open)
function openness(t) {
  let o = smooth(T.open[0], T.open[1], t);
  o = o + 0.06 * Math.sin(clamp((t - T.open[0]) / 0.9) * Math.PI) * (t > T.open[0] ? 1 : 0); // little overshoot
  for (const b of BLINKS) {
    const d = t - b;
    if (d < 0 || d > 0.36) continue;
    let c;
    if (d < 0.09) c = smooth(0, 0.09, d);
    else if (d < 0.15) c = 1;
    else c = 1 - smooth(0.15, 0.36, d);
    o *= 1 - c;
  }
  return clamp(o, 0, 1.04);
}
function isBlinking(t) { return BLINKS.some(b => t >= b && t <= b + 0.36); }
function gaze(t) {
  if (t <= GAZE[0][0]) return [0, 0];
  for (let k = 1; k < GAZE.length; k++) {
    if (t <= GAZE[k][0]) {
      const [t0, x0, y0] = GAZE[k - 1], [t1, x1, y1] = GAZE[k];
      const f = smooth(t0, t1, t);
      return [lerp(x0, x1, f), lerp(y0, y1, f)];
    }
  }
  return [0, 0];
}

// ---------- palettes ----------
function ramp(stops, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    let k = 0;
    while (k < stops.length - 2 && x > stops[k + 1][0]) k++;
    const [x0, c0] = stops[k], [x1, c1] = stops[k + 1];
    const f = clamp((x - x0) / (x1 - x0));
    out.push(`rgb(${Math.round(lerp(c0[0], c1[0], f))},${Math.round(lerp(c0[1], c1[1], f))},${Math.round(lerp(c0[2], c1[2], f))})`);
  }
  return out;
}
const PAL = [
  ...ramp([[0, [26, 10, 7]], [0.3, [100, 42, 22]], [0.6, [190, 94, 48]], [0.85, [236, 150, 92]], [1, [255, 214, 170]]], 32), // skin
  ...ramp([[0, [24, 22, 28]], [0.35, [110, 106, 118]], [0.7, [214, 210, 216]], [1, [255, 252, 248]]], 32),                   // eye white
  ...ramp([[0, [40, 12, 4]], [0.35, [156, 58, 14]], [0.7, [252, 130, 36]], [0.9, [255, 188, 80]], [1, [255, 238, 172]]], 32), // iris
  ...ramp([[0, [34, 6, 28]], [0.35, [140, 34, 96]], [0.7, [250, 100, 162]], [1, [255, 222, 238]]], 48),                      // planet
  ...ramp([[0, [70, 60, 110]], [0.6, [190, 182, 255]], [1, [255, 255, 255]]], 16)                                             // stars
];
const O_SKIN = 0, O_WHITE = 32, O_IRIS = 64, O_PLANET = 96, O_STAR = 144;
const NONE = 0xffff;

// ---------- stars ----------
const STARS = [];
for (let s = 0; s < 360; s++) {
  STARS.push({
    x: (hash(s, 1, 7) * 2 - 1) * 1.15,
    y: (hash(s, 2, 7) * 2 - 1) * 1.15,
    z0: hash(s, 3, 7),
    m: Math.pow(hash(s, 4, 7), 2.1),
    ph: hash(s, 5, 7) * 6.283,
    tw: 1.5 + hash(s, 6, 7) * 3
  });
}
const LIGHT = (() => { const v = [-0.55, -0.45, 0.7]; const l = Math.hypot(...v); return v.map(c => c / l); })();

// ---------- canvas + grid ----------
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { alpha: false });
const bloom = document.createElement("canvas");
const bctx = bloom.getContext("2d");
const canBloom = typeof ctx.filter === "string";
let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, cw = 8, chh = 12, fontPx = 12, K0 = 1;
let cellCh, cellPal, mask, counts, order;
let iw = 0, ih = 0, sc = 1, gray = null;

function layout() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  bloom.width = Math.max(1, Math.round(W / 3)); bloom.height = Math.max(1, Math.round(H / 3));
  const targetCols = W < 560 ? 76 : W < 1100 ? 116 : 150;
  fontPx = Math.max(6, W / targetCols / 0.6);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = `700 ${fontPx}px ${FONT}`;
  cw = ctx.measureText("M").width || fontPx * 0.6;
  chh = fontPx * 1.12;
  cols = Math.ceil(W / cw); rows = Math.ceil(H / chh);
  const n = cols * rows;
  cellCh = new Uint8Array(n); cellPal = new Uint16Array(n); mask = new Uint8Array(n);
  counts = new Uint32Array(PAL.length + 1); order = new Uint32Array(n);
  const fit = (W < H ? 0.98 : 0.86) * W / EYE_SPAN;
  K0 = Math.max(fit, W / SRC_W, H / SRC_H);
}

function sample(u, v) {
  u *= sc; v *= sc;
  if (u < 0 || v < 0 || u >= iw - 1 || v >= ih - 1) return -1;
  const x0 = u | 0, y0 = v | 0, fx = u - x0, fy = v - y0, i = y0 * iw + x0;
  const a = gray[i], b = gray[i + 1], c = gray[i + iw], d = gray[i + iw + 1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function put(idx, ch, pal) { cellCh[idx] = ch; cellPal[idx] = pal; }

// ---------- space (behind the pupil) ----------
function spaceCell(idx, i, j, sx, sy, t, Rp, mix) {
  mask[idx] = 1;
  const r = Math.hypot(sx, sy);
  if (r < Rp) {
    mask[idx] = 2;
    const nx = sx / Rp, ny = sy / Rp, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const lon = Math.atan2(nx, nz) + t * 0.35, lat = Math.asin(clamp(ny, -1, 1));
    const bands = 0.5 + 0.5 * Math.sin(lat * 9 + 1.6 * Math.sin(lon * 2 + lat * 3) + 0.6 * Math.sin(lon * 5 - lat * 7));
    const diff = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
    const val = clamp(0.06 + 0.94 * diff * (0.62 + 0.38 * bands)) * mix;
    if (val < 0.03) return;
    let ri = 2 + ((val * (NR - 3)) | 0);
    if (hash(i, j, (t * 8) | 0) < 0.04) ri = Math.min(NR - 1, ri + 2);
    put(idx, ri, O_PLANET + ((0.1 + 0.9 * val) * 47 | 0));
    return;
  }
  if (r < Rp * 1.14) {
    const lit = (sx * LIGHT[0] + sy * LIGHT[1]) / r;
    const val = (1 - (r - Rp) / (Rp * 0.14)) * 0.5 * (lit + 0.5) * mix;
    if (val > 0.06) { put(idx, val > 0.25 ? C_COLON : C_DOT, O_PLANET + ((val * 30) | 0)); }
  }
}

// ---------- one frame ----------
function render(t) {
  cellPal.fill(NONE); mask.fill(0);
  const zs = smooth(T.zoom[0], T.zoom[1], t);
  const zoom = Math.exp(Math.log(ZMAX) * zs * zs);
  const K = K0 * zoom;
  const f = smooth(T.focus[0], T.focus[1], t);
  const cx = lerp(EYE_C.x, PUPIL.x, f), cy = lerp(EYE_C.y, PUPIL.y, f);
  const hw = W / 2, hh = H / 2;
  const tick = Math.floor(t * 10);
  const building = t < T.build[1] + 0.3;
  const buildSpan = T.build[1] - T.build[0];
  const open = openness(t);
  const [gx, gy] = gaze(t);
  const IX = PUPIL.x + gx, IY = PUPIL.y + gy;            // iris centre after gaze
  const CX = CATCH.x + gx * 0.8, CY = CATCH.y + gy * 0.8;
  const breathe = smooth(T.open[1], T.open[1] + 1, t);
  const pupilR = PUPIL_R * (1 + 0.08 * Math.sin((t - T.open[1]) * 1.8) * breathe);
  const mix = smooth(T.space[0], T.space[1], t);
  const portalR = lerp(pupilR, IRIS_R * 0.97, smooth(T.portal[0], T.portal[1], t));
  const minDim = Math.min(W, H);
  const Rp = minDim * (0.03 + 0.25 * easeOut(smooth(T.planet[0], T.planet[1], t)));
  const alpha = 1 - smooth(T.out[0], T.out[1], t);

  for (let j = 0; j < rows; j++) {
    const y = (j + 0.5) * chh;
    const v = cy + (y - hh) / K;
    const rowSeed = hash(j, 91, 5);
    for (let i = 0; i < cols; i++) {
      const idx = j * cols + i;
      const x = (i + 0.5) * cw;
      const u = cx + (x - hw) / K;
      const dx = u - IX, dy = v - IY;
      const d = Math.hypot(dx, dy);

      // the pupil becomes a window into space
      if (mix > 0) {
        const pd = Math.hypot(u - PUPIL.x, v - PUPIL.y);
        if (pd < portalR * 1.1) {
          const ang = Math.atan2(v - PUPIL.y, u - PUPIL.x);
          if (pd < portalR * (1 + 0.035 * Math.sin(ang * 9 + t * 2.1))) {
            spaceCell(idx, i, j, x - hw, y - hh, t, Rp, mix);
            continue;
          }
        }
      }

      // eyelid: the upper lid slides down from its open line to the lower lid
      const inCorners = u > X0 && u < X1;
      const up = lidAt(UP, u), lo = lidAt(LO, u);
      const closedLine = Math.max(up, lo - 1.2);
      const edge = inCorners ? lerp(closedLine, up, Math.min(open, 1)) - (open > 1 ? (open - 1) * 40 : 0) : up;
      const lidTop = up - LID_H;
      let vs = v;                     // where to read the photo from
      let onLid = false;
      if (inCorners && v >= lidTop && v < edge) {
        vs = lidTop + (v - lidTop) * (LID_H / (edge - lidTop));   // stretch the lid skin down
        onLid = true;
      }
      const inside = inCorners && v >= edge && v < lo;

      const b = sample(u, vs);
      if (b < 0) continue;
      let val, pal, white = false;

      if (!inside) {
        let liner = 1;
        if (u > X0 - 10 && u < X1 + 6) liner = smooth(0, 7, Math.min(Math.abs(vs - up), Math.abs(v - lo)));
        val = (0.07 + 0.72 * smooth(0.04, 0.95, b)) * (0.2 + 0.8 * liner);
        if (onLid) {
          // when the lid comes down it catches the light as a rounded band, with a dark lash line at the bottom
          const cl = clamp(1 - open);
          const fold = clamp((v - lidTop) / (edge - lidTop));
          const lit = 0.36 + 0.34 * Math.sin(Math.PI * Math.pow(fold, 0.8)) + 0.22 * smooth(0.04, 0.95, b);
          val = lerp(val, lit, cl * 0.9);
          const lashBand = Math.max(2.5, 0.9 * chh / K);
          if (edge - v < lashBand && cl > 0.02) val = lerp(val, 0.03, smooth(0.02, 0.3, cl));
        }
        pal = O_SKIN + ((val * 31) | 0);
      } else {
        const lash = smooth(0, 3.5, Math.min(v - edge, lo - v));
        const lidShade = 0.4 + 0.6 * smooth(0, 16, v - edge);
        if (d < pupilR) {
          continue; // black pupil
        } else if (d < IRIS_R) {
          const inner = mix > 0 ? portalR : pupilR;
          const dn = clamp((d - inner) / (IRIS_R - inner));
          const rot = Math.atan2(dy, dx) + t * 0.035;
          const fib = 0.5 + 0.5 * Math.sin(rot * 46 + 2.2 * Math.sin(rot * 7) + dn * 5);
          const fib2 = 0.5 + 0.5 * Math.sin(rot * 19 - dn * 9);
          const collar = Math.exp(-Math.pow((dn - 0.32) / 0.13, 2));
          val = 0.3 + 0.36 * fib + 0.14 * fib2 + 0.3 * collar - 0.6 * smooth(0.78, 1, dn) - 0.3 * (1 - smooth(0, 0.14, dn));
          val = clamp(val) * lash * lidShade;
          pal = O_IRIS + ((val * 31) | 0);
        } else {
          white = true;
          const side = 1 - 0.45 * smooth(100, 190, Math.abs(u - IX));
          val = clamp((0.6 + 0.32 * b) * side * lash * lidShade + 0.04);
          pal = O_WHITE + ((val * 31) | 0);
        }
        if (!white && Math.hypot(u - CX, v - CY) < 5.5) { val = 1; pal = O_STAR + 15; }
      }

      let ri = 3 + ((val * (NR - 4)) | 0);
      const hv = hash(i, j, tick);
      if (hv < 0.05) ri = clamp(ri + (((hv * 100) | 0) % 5) - 2, 2, NR - 1);

      if (building) {
        // rows of text flicker in, then settle into the picture
        const a = T.build[0] + buildSpan * (0.55 * rowSeed + 0.45 * hash(i, j, 11));
        if (t < a) {
          if (t > a - 0.7 && hash(i, j, 23) < 0.22 * smooth(a - 0.7, a, t) + 0.05)
            put(idx, 4 + ((hv * 10) | 0), O_SKIN + 4 + ((hv * 6) | 0));
          continue;
        }
        if (t < a + 0.25) {
          put(idx, C_DENSE0 + ((hv * DENSE.length) | 0), pal - (pal % 32) + Math.min(31, (pal % 32) + 8));
          continue;
        }
      }
      put(idx, ri, pal);
    }
  }

  // sparkle on the light reflection when the eye is open
  if (open > 0.6 && mix < 1) {
    const sx = hw + (CX - cx) * K, sy = hh + (CY - cy) * K;
    const ci = Math.floor(sx / cw), cj = Math.floor(sy / chh);
    const pop = Math.exp(-Math.max(0, t - T.open[1]) * 2.2);
    const arm = Math.round(1 + 2.5 * pop + 0.6 * (0.5 + 0.5 * Math.sin(t * 3)));
    const fade = (1 - mix) * smooth(0.6, 1, open);
    for (let k = 1; k <= arm; k++) {
      const p = O_STAR + Math.max(2, Math.round((15 - k * 3) * fade));
      for (const [a, b2, c] of [[ci - k, cj, C_DASH], [ci + k, cj, C_DASH], [ci, cj - k, C_BAR], [ci, cj + k, C_BAR]]) {
        if (a < 0 || b2 < 0 || a >= cols || b2 >= rows) continue;
        if (cellPal[b2 * cols + a] === NONE || cellPal[b2 * cols + a] >= O_IRIS) put(b2 * cols + a, c, p);
      }
    }
  }

  // stars (only where space shows, never over the planet)
  if (mix > 0) {
    const sxS = W * 0.2 * (W > H ? 1 : 1.6), syS = H * 0.2;
    for (let s = 0; s < STARS.length; s++) {
      const st = STARS[s];
      const z = 1 - ((st.z0 + t * 0.035) % 1) * 0.9;
      const px = hw + (st.x / z) * sxS, py = hh + (st.y / z) * syS;
      const ci = Math.floor(px / cw), cj = Math.floor(py / chh);
      if (ci < 0 || cj < 0 || ci >= cols || cj >= rows) continue;
      const idx = cj * cols + ci;
      if (mask[idx] !== 1) continue;
      const br = st.m * (0.3 + 0.7 * (1 - z)) * (0.7 + 0.3 * Math.sin(t * st.tw + st.ph)) * mix;
      if (br > 0.42) {
        put(idx, C_PLUS, O_STAR + 15);
        const arm = br > 0.7 ? 3 : br > 0.55 ? 2 : 1;
        for (let k = 1; k <= arm; k++) {
          const p = O_STAR + Math.max(2, 15 - k * 4);
          for (const [a, b2, c] of [[ci - k, cj, C_DASH], [ci + k, cj, C_DASH], [ci, cj - k, C_BAR], [ci, cj + k, C_BAR]]) {
            if (a < 0 || b2 < 0 || a >= cols || b2 >= rows) continue;
            const id2 = b2 * cols + a;
            if (mask[id2] === 1) put(id2, c, p);
          }
        }
      } else if (br > 0.2) put(idx, C_STAR, O_STAR + ((br * 22) | 0));
      else if (br > 0.06) put(idx, br > 0.12 ? C_MID : C_DOT, O_STAR + ((br * 30) | 0));
    }
  }

  // draw, batched by colour
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#050304";
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = alpha;
  counts.fill(0);
  const n = cols * rows;
  for (let k = 0; k < n; k++) { const p = cellPal[k]; if (p !== NONE) counts[p + 1]++; }
  for (let p = 1; p <= PAL.length; p++) counts[p] += counts[p - 1];
  const start = counts.slice();
  for (let k = 0; k < n; k++) { const p = cellPal[k]; if (p !== NONE) order[start[p]++] = k; }
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  for (let p = 0; p < PAL.length; p++) {
    const a = counts[p], b = counts[p + 1];
    if (a === b) continue;
    ctx.fillStyle = PAL[p];
    for (let m = a; m < b; m++) {
      const k = order[m];
      const i = k % cols, j = (k / cols) | 0;
      ctx.fillText(CHARS[cellCh[k]], (i + 0.5) * cw, (j + 0.5) * chh);
    }
  }

  // soft glow
  if (canBloom) {
    bctx.globalCompositeOperation = "copy";
    bctx.drawImage(canvas, 0, 0, bloom.width, bloom.height);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.55;
    ctx.filter = `blur(${Math.round(5 * dpr)}px)`;
    ctx.drawImage(bloom, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  return zoom;
}

// ---------- UI + loop ----------
const playBtn = document.getElementById("play");
const replayBtn = document.getElementById("replay");
const scrub = document.getElementById("scrub");
const readout = document.getElementById("readout");
const phaseEls = [...document.querySelectorAll(".phases span")];
const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function phaseOf(t) {
  if (t < T.build[1]) return [0, "build", "drawing"];
  if (t < T.open[0]) return [0, "build", "eye closed"];
  if (t < T.open[1]) return [1, "eye", "opening"];
  if (t < T.zoom[0]) return [1, "eye", isBlinking(t) ? "blink" : "looking"];
  if (t < T.space[0] + 1) return [2, "zoom", "into the iris"];
  if (t < T.zoom[1]) return [2, "zoom", "through the pupil"];
  return [3, "space", "planet"];
}

let t = reduce ? 2.9 : 0, playing = !reduce, last = 0, lastUi = 0, ready = false, needsDraw = true;

function setPlaying(p) { playing = p; playBtn.textContent = p ? "Pause" : "Play"; needsDraw = true; }
playBtn.addEventListener("click", () => setPlaying(!playing));
replayBtn.addEventListener("click", () => { t = 0; setPlaying(true); });
canvas.addEventListener("click", () => setPlaying(!playing));
scrub.addEventListener("input", () => { t = parseFloat(scrub.value) || 0; needsDraw = true; });
window.addEventListener("resize", () => { if (ready) { layout(); needsDraw = true; } });

function updateUi(zoom) {
  const [k, a, b] = phaseOf(t);
  readout.innerHTML = `<b>${a}</b> &middot; ${b}<span class="extra"> &middot; t ${t.toFixed(1).padStart(4, "0")}s &middot; &times;${zoom.toFixed(1)}</span>`;
  scrub.value = t.toFixed(2);
  phaseEls.forEach((el, n) => el.classList.toggle("on", n === k));
}

function frame(now) {
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
  last = now;
  if (ready && (playing || needsDraw)) {
    if (playing) { t += dt; if (t >= LOOP) t -= LOOP; }
    const zoom = render(t);
    needsDraw = false;
    if (now - lastUi > 90 || !playing) { updateUi(zoom); lastUi = now; }
  }
  requestAnimationFrame(frame);
}

window.__eye = { seek(x) { t = x; needsDraw = true; }, pause() { setPlaying(false); } };

const img = new Image();
img.onload = async () => {
  iw = img.naturalWidth; ih = img.naturalHeight; sc = iw / SRC_W;
  const off = document.createElement("canvas");
  off.width = iw; off.height = ih;
  const octx = off.getContext("2d");
  octx.drawImage(img, 0, 0);
  const data = octx.getImageData(0, 0, iw, ih).data;
  gray = new Float32Array(iw * ih);
  for (let k = 0; k < iw * ih; k++) gray[k] = (data[k * 4] * 0.299 + data[k * 4 + 1] * 0.587 + data[k * 4 + 2] * 0.114) / 255;
  try {
    await Promise.race([document.fonts.load('700 16px "JetBrains Mono"'), new Promise(r => setTimeout(r, 1500))]);
  } catch (e) { /* system monospace is fine */ }
  layout();
  if (reduce) setPlaying(false);
  ready = true; needsDraw = true;
};
img.src = window.EYE_PHOTO;
requestAnimationFrame(frame);
})();
