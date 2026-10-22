// Image maths for the gates: a minimal PNG decoder (8-bit RGB/RGBA, no interlace, which is what
// Chromium screenshots are), luminance, box blur, the stroke mask and the stroke/gap contrast.
// Pure functions over typed arrays; no dependencies beyond node:zlib.
import { inflateSync } from 'node:zlib';

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

export function decodePng(buf) {
  for (let i = 0; i < 8; i++) if (buf[i] !== SIGNATURE[i]) throw new Error('decodePng: the buffer is not a PNG (bad signature)');
  let pos = 8, width = 0, height = 0, depth = 0, colour = 0, interlace = 0;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; colour = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (depth !== 8 || (colour !== 2 && colour !== 6) || interlace !== 0) {
    throw new Error(`decodePng: only 8-bit RGB or RGBA without interlace is supported; got bit depth ${depth}, colour type ${colour}, interlace ${interlace}`);
  }
  const bpp = colour === 6 ? 4 : 3, stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  if (raw.length < height * (stride + 1)) throw new Error(`decodePng: image data is ${raw.length} bytes, expected ${height * (stride + 1)} for ${width}x${height}`);
  const rgb = new Uint8Array(width * height * 3);
  let prev = new Uint8Array(stride), cur = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1), filter = raw[row];
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = raw[row + 1 + x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) throw new Error(`decodePng: unknown filter type ${filter} on row ${y}`);
      cur[x] = v & 255;
    }
    for (let x = 0, o = y * width * 3; x < width; x++, o += 3) {
      rgb[o] = cur[x * bpp]; rgb[o + 1] = cur[x * bpp + 1]; rgb[o + 2] = cur[x * bpp + 2];
    }
    [prev, cur] = [cur, prev];
  }
  return { width, height, rgb };
}

// Rec. 709 luma of the 8-bit sRGB values, one float per pixel.
export function luminance(img) {
  const n = img.width * img.height, L = new Float32Array(n), d = img.rgb;
  for (let i = 0, o = 0; i < n; i++, o += 3) L[i] = 0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2];
  return L;
}

// Per-channel sums over the whole image: the total light in each channel.
export function channelSums(img) {
  let r = 0, g = 0, b = 0;
  const d = img.rgb;
  for (let o = 0; o < d.length; o += 3) { r += d[o]; g += d[o + 1]; b += d[o + 2]; }
  return { r, g, b };
}

// Separable box blur of radius r, averaging only the pixels inside the image at the edges.
export function boxBlur(src, W, H, r) {
  const tmp = new Float32Array(W * H), out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    let s = 0, n = 0;
    const base = y * W;
    for (let x = -r; x < W + r; x++) {
      if (x + r < W) { s += src[base + x + r]; n++; }
      if (x - r - 1 >= 0) { s -= src[base + x - r - 1]; n--; }
      if (x >= 0 && x < W) tmp[base + x] = s / n;
    }
  }
  for (let x = 0; x < W; x++) {
    let s = 0, n = 0;
    for (let y = -r; y < H + r; y++) {
      if (y + r < H) { s += tmp[(y + r) * W + x]; n++; }
      if (y - r - 1 >= 0) { s -= tmp[(y - r - 1) * W + x]; n--; }
      if (y >= 0 && y < H) out[y * W + x] = s / n;
    }
  }
  return out;
}

// Exact count of set pixels in the (2r+1)² square around each pixel (integer running sums).
function boxCount(mask, W, H, r) {
  const tmp = new Int32Array(W * H), out = new Int32Array(W * H);
  for (let y = 0; y < H; y++) {
    let s = 0;
    const base = y * W;
    for (let x = -r; x < W + r; x++) {
      if (x + r < W) s += mask[base + x + r];
      if (x - r - 1 >= 0) s -= mask[base + x - r - 1];
      if (x >= 0 && x < W) tmp[base + x] = s;
    }
  }
  for (let x = 0; x < W; x++) {
    let s = 0;
    for (let y = -r; y < H + r; y++) {
      if (y + r < H) s += tmp[(y + r) * W + x];
      if (y - r - 1 >= 0) s -= tmp[(y - r - 1) * W + x];
      if (y >= 0 && y < H) out[y * W + x] = s;
    }
  }
  return out;
}

function quantile(arr, q) {
  const s = Float32Array.from(arr).sort();
  return s[Math.min(s.length - 1, Math.floor(s.length * q))];
}

// Stroke mask from a text-layer render: blur by `blur` px, threshold `frac` of the way from the
// median to the 99.5th percentile, and keep only the central region (clear of the UI text).
// With `bandpass` = R, a box blur of radius R is subtracted first, so the smooth sky (gradient
// and glow) cannot cross the threshold when the particles are dim.
// With `area` = N, the threshold is instead the one that leaves N pixels of the region above it,
// so a zoomed view's mask can be held to the stroke area the zoom predicts and cannot fatten.
// The gap is every pixel of the mask's bounding box at least `gapDist` px (Chebyshev) from it.
export function strokeMask(lum, W, H, { blur = 3, frac = 0.35, region = [0.08, 0.92, 0.15, 0.85], gapDist = 8, bandpass = 0, area = 0 } = {}) {
  const sig = boxBlur(lum, W, H, blur);
  if (bandpass) { const low = boxBlur(lum, W, H, bandpass); for (let i = 0; i < sig.length; i++) sig[i] -= low[i]; }
  const med = quantile(sig, 0.5), hi = quantile(sig, 0.995);
  const [rx0, rx1, ry0, ry1] = [region[0] * W, region[1] * W, region[2] * H, region[3] * H];
  let thr = med + frac * (hi - med);
  if (area) {
    const inside = [];
    for (let y = 0; y < H; y++) {
      if (y < ry0 || y > ry1) continue;
      for (let x = 0; x < W; x++) if (x >= rx0 && x <= rx1) inside.push(sig[y * W + x]);
    }
    const s = Float32Array.from(inside).sort();
    thr = s[Math.max(0, s.length - 1 - Math.min(area, s.length - 1))];
  }
  const mask = new Uint8Array(W * H);
  let x0 = W, x1 = -1, y0 = H, y1 = -1, strokes = 0;
  for (let y = 0; y < H; y++) {
    if (y < ry0 || y > ry1) continue;
    for (let x = 0; x < W; x++) {
      if (x < rx0 || x > rx1 || sig[y * W + x] <= thr) continue;
      mask[y * W + x] = 1; strokes++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  const gap = new Uint8Array(W * H);
  let gaps = 0;
  if (strokes) {
    const near = boxCount(mask, W, H, gapDist);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * W + x;
      if (!mask[i] && near[i] === 0) { gap[i] = 1; gaps++; }
    }
  }
  return { W, H, mask, gap, strokes, gaps, box: { x0, x1, y0, y1 }, threshold: thr, median: med, p995: hi };
}

// The two lines of text in a stroke mask, split at the longest run of empty rows inside its box
// (null if there is none). For each line: its x and y extent, and the height of the mask inside
// strips at its left and right ends, each `stripFrac` of the line's height wide.
export function lineLayout(m, stripFrac = 0.15) {
  const { W, mask, box } = m;
  let best = null, run = null;
  for (let y = box.y0; y <= box.y1; y++) {
    let n = 0;
    for (let x = box.x0; x <= box.x1; x++) n += mask[y * W + x];
    if (n === 0) run = run ? { a: run.a, b: y } : { a: y, b: y };
    else if (run) { if (!best || run.b - run.a > best.b - best.a) best = run; run = null; }
  }
  if (!best) return null;
  const extent = (ya, yb, xa, xb) => {
    let x0 = Infinity, x1 = -1, y0 = Infinity, y1 = -1;
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
      if (!mask[y * W + x]) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return { x0, x1, y0, y1, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  };
  const line = (ya, yb) => {
    const e = extent(ya, yb, box.x0, box.x1);
    const strip = Math.max(2, Math.round(stripFrac * e.height));
    const end = (xa, xb) => { const s = extent(e.y0, e.y1, xa, xb); return s.x1 < 0 ? 0 : s.height; };
    return { ...e, strip, left: end(e.x0, e.x0 + strip - 1), right: end(e.x1 - strip + 1, e.x1) };
  };
  return { gap: best.b - best.a + 1, top: line(box.y0, best.a - 1), bottom: line(best.b + 1, box.y1) };
}

// A stroke mask with a rightward lean undone, for lineLayout: each row moves left by its height
// above the image's centre row times `lean` (px across per px up, rounded to whole pixels), so
// stems that lean by atan(lean) stand upright again. A row's own pixels keep their order.
export function unslant(m, lean) {
  const { W, H, mask } = m, cy = (H - 1) / 2, out = new Uint8Array(W * H);
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) {
    const d = Math.round((cy - y) * lean);
    for (let x = Math.max(0, -d); x < Math.min(W, W - d); x++) {
      if (!mask[y * W + x + d]) continue;
      out[y * W + x] = 1;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return { W, H, mask: out, box: { x0, x1, y0, y1 } };
}

// The lean of one ink edge of a line from lineLayout, in degrees, positive when the edge leans
// right going up: the Theil–Sen slope (the median over row pairs, so a row where a stray dot or a
// gap in the stem moves the edge does not tilt it) of the line's leftmost ink per row with side
// 'left', or its rightmost with 'right', over the rows more than `trim` of the line's height
// from its top and bottom, so round caps do not count.
export function edgeLean(m, line, side, trim = 0.15) {
  const { W, mask } = m, pts = [];
  for (let y = Math.ceil(line.y0 + trim * line.height); y <= Math.floor(line.y1 - trim * line.height); y++) {
    let x = -1;
    if (side === 'left') { for (let k = line.x0; k <= line.x1; k++) if (mask[y * W + k]) { x = k; break; } }
    else for (let k = line.x1; k >= line.x0; k--) if (mask[y * W + k]) { x = k; break; }
    if (x >= 0) pts.push([-y, x]);
  }
  const slopes = [];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) slopes.push((pts[j][1] - pts[i][1]) / (pts[j][0] - pts[i][0]));
  slopes.sort((a, b) => a - b);
  const mid = slopes.length >> 1, slope = slopes.length % 2 ? slopes[mid] : (slopes[mid - 1] + slopes[mid]) / 2;
  return { lean: (Math.atan(slope) * 180) / Math.PI, rows: pts.length };
}

// Mean luminance of `lum` on the strokes divided by the mean on the gap.
export function strokeGapRatio(lum, m) {
  if (!m.strokes || !m.gaps) return NaN;
  let s = 0, g = 0;
  for (let i = 0; i < lum.length; i++) { if (m.mask[i]) s += lum[i]; else if (m.gap[i]) g += lum[i]; }
  return (s / m.strokes) / (g / m.gaps);
}

// The light that `img` holds over `base`, a render of the same view without some particles (or
// the sky alone): per-channel sums of img − base, its luminance sum, its warmth
// (red − blue) / (red + blue), and its effective area (Σl)² / Σl² over the per-pixel luminance l
// (clamped at 0). For separate sprites of one shape the effective area is one sprite's area times
// a factor that depends only on how their brightness is spread, so for the same particles drawn
// two ways the ratio of effective areas is the ratio of their sprite sizes. With `region`
// ([x0, x1, y0, y1] as fractions of the width and height) only the pixels inside it count.
export function lightOver(img, base, region = [0, 1, 0, 1]) {
  const a = img.rgb, b = base.rgb, W = img.width, H = img.height;
  const [x0, x1, y0, y1] = [Math.round(region[0] * W), Math.round(region[1] * W), Math.round(region[2] * H), Math.round(region[3] * H)];
  let r = 0, g = 0, bl = 0, L = 0, L2 = 0;
  for (let y = y0; y < y1; y++) for (let o = (y * W + x0) * 3, end = (y * W + x1) * 3; o < end; o += 3) {
    const dr = a[o] - b[o], dg = a[o + 1] - b[o + 1], db = a[o + 2] - b[o + 2];
    r += dr; g += dg; bl += db;
    const l = Math.max(0, 0.2126 * dr + 0.7152 * dg + 0.0722 * db);
    L += l; L2 += l * l;
  }
  return { r, g, b: bl, light: L, warmth: (r - bl) / (r + bl), area: L2 ? (L * L) / L2 : NaN };
}

// How far `img` is, pixel by pixel and channel by channel, from what its parts predict: renders
// of the same view over the same `base` (the sky alone), each holding part of img's light. The
// prediction is Σ parts − (n − 1)·base, capped at 255 as the 8-bit target caps it (unless `clip`
// is false); with one part it is that render itself. Per channel (r, g, b) it returns the absolute
// residual Σ|img − prediction| and the signed residual Σ(img − prediction), each over the
// predicted light Σ(prediction − base), and the share of pixels off by more than `tol` levels in
// some channel. With `region` ([x0, x1, y0, y1] as fractions) only the pixels inside it count.
export function partsResidual(img, base, parts, { region = [0, 1, 0, 1], tol = 2, clip = true } = {}) {
  const W = img.width, H = img.height, n = parts.length, a = img.rgb, b = base.rgb, ps = parts.map((p) => p.rgb);
  for (const p of [base, ...parts]) if (p.width !== W || p.height !== H) throw new Error(`partsResidual: images differ in size (${p.width}×${p.height} against ${W}×${H})`);
  const [x0, x1, y0, y1] = [Math.round(region[0] * W), Math.round(region[1] * W), Math.round(region[2] * H), Math.round(region[3] * H)];
  const abs = [0, 0, 0], signed = [0, 0, 0], light = [0, 0, 0];
  let off = 0, pixels = 0;
  for (let y = y0; y < y1; y++) for (let o = (y * W + x0) * 3, end = (y * W + x1) * 3; o < end; o += 3) {
    let bad = false;
    for (let c = 0; c < 3; c++) {
      let e = -(n - 1) * b[o + c];
      for (const p of ps) e += p[o + c];
      if (clip && e > 255) e = 255;
      const d = a[o + c] - e;
      abs[c] += Math.abs(d); signed[c] += d; light[c] += e - b[o + c];
      if (d > tol || d < -tol) bad = true;
    }
    off += bad; pixels++;
  }
  return { abs: abs.map((x, c) => x / light[c]), signed: signed.map((x, c) => x / light[c]), off: off / pixels, light };
}

// Streak residual of `lum` against `lum0`, a render of the same view without relocation: the rms
// of the high-passed row and column profiles of lum − lum0 in the central bw×bh box, each over
// the rms of lum0's own high-passed profile (the cloud's noise). High pass: a ±2 px mean minus the
// ±30 px moving average of that mean, so only structure finer than about 60 px counts. A row
// profile averages each row of the box, so it shows horizontal streaks; a column profile shows
// vertical ones.
export function streakResidual(lum, lum0, W, H, { bw = 460, bh = 320 } = {}) {
  const bx = Math.round(W / 2 - bw / 2), by = Math.round(H / 2 - bh / 2);
  const prof = (L) => {
    const rows = new Float64Array(bh), cols = new Float64Array(bw);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { const v = L((by + y) * W + bx + x); rows[y] += v / bw; cols[x] += v / bh; }
    return { rows, cols };
  };
  const hp = (p) => {
    const s = Array.from(p, (_, i) => { let a = 0, n = 0; for (let k = -2; k <= 2; k++) if (i + k >= 0 && i + k < p.length) { a += p[i + k]; n++; } return a / n; });
    const out = [];
    for (let i = 30; i < s.length - 30; i++) { let a = 0; for (let k = -30; k <= 30; k++) a += s[i + k]; out.push(s[i] - a / 61); }
    return out;
  };
  const rms = (a) => Math.sqrt(a.reduce((x, y) => x + y * y, 0) / a.length);
  const p = prof((i) => lum[i] - lum0[i]), p0 = prof((i) => lum0[i]);
  return { row: rms(hp(p.rows)) / rms(hp(p0.rows)), col: rms(hp(p.cols)) / rms(hp(p0.cols)) };
}

export function iou(a, b) {
  let both = 0, either = 0;
  for (let i = 0; i < a.length; i++) { both += a[i] & b[i]; either += a[i] | b[i]; }
  return either ? both / either : NaN;
}

// Resample a mask about the image centre by factor s (nearest neighbour): the mask a pure zoom
// by s would produce from it.
export function scaleMask(mask, W, H, s) {
  const out = new Uint8Array(W * H), cx = (W - 1) / 2, cy = (H - 1) / 2;
  for (let y = 0; y < H; y++) {
    const sy = Math.round(cy + (y - cy) / s);
    if (sy < 0 || sy >= H) continue;
    for (let x = 0; x < W; x++) {
      const sx = Math.round(cx + (x - cx) / s);
      if (sx >= 0 && sx < W) out[y * W + x] = mask[sy * W + sx];
    }
  }
  return out;
}

// Sizes of the 8-connected components of a mask, largest first.
export function componentSizes(mask, W, H) {
  const seen = new Uint8Array(W * H), sizes = [], stack = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || seen[i]) continue;
    let n = 0;
    seen[i] = 1; stack.push(i);
    while (stack.length) {
      const p = stack.pop(), x = p % W, y = (p - x) / W;
      n++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const q = yy * W + xx;
        if (mask[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
    }
    sizes.push(n);
  }
  return sizes.sort((a, b) => b - a);
}

// Luminance of `img` over `base`, pixel by pixel (Rec. 709 luma of img − base): the light a layer
// adds over the sky, so a mask drawn from it does not see the sky's gradient and glow.
export function lumOver(img, base) {
  const n = img.width * img.height, L = new Float32Array(n), a = img.rgb, b = base.rgb;
  for (let i = 0, o = 0; i < n; i++, o += 3) L[i] = 0.2126 * (a[o] - b[o]) + 0.7152 * (a[o + 1] - b[o + 1]) + 0.0722 * (a[o + 2] - b[o + 2]);
  return L;
}

// The colour balance of the light `img` holds over `base`: each channel's share, Σ(img − base) in
// that channel over the luminance sum, counting only the pixels where no channel of `img` is at 255.
// The 8-bit target clips a dense stroke's blue first, so a clipped pixel holds less of its light
// in some channels than in others; leaving those pixels out keeps the balance of the light that
// was drawn. Returns the three shares, the luminance sum they come from and the share of `img`'s
// lit pixels left out.
export function balanceOver(img, base) {
  const a = img.rgb, b = base.rgb;
  let r = 0, g = 0, bl = 0, lit = 0, clipped = 0;
  for (let o = 0; o < a.length; o += 3) {
    if (a[o] === b[o] && a[o + 1] === b[o + 1] && a[o + 2] === b[o + 2]) continue;
    lit++;
    if (a[o] === 255 || a[o + 1] === 255 || a[o + 2] === 255) { clipped++; continue; }
    r += a[o] - b[o]; g += a[o + 1] - b[o + 1]; bl += a[o + 2] - b[o + 2];
  }
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  return { r: r / L, g: g / L, b: bl / L, light: L, clipped: lit ? clipped / lit : 0 };
}
