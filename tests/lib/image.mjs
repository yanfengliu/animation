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
// The gap is every pixel of the mask's bounding box at least `gapDist` px (Chebyshev) from it.
export function strokeMask(lum, W, H, { blur = 3, frac = 0.35, region = [0.08, 0.92, 0.15, 0.85], gapDist = 8, bandpass = 0 } = {}) {
  const sig = boxBlur(lum, W, H, blur);
  if (bandpass) { const low = boxBlur(lum, W, H, bandpass); for (let i = 0; i < sig.length; i++) sig[i] -= low[i]; }
  const med = quantile(sig, 0.5), hi = quantile(sig, 0.995);
  const thr = med + frac * (hi - med);
  const mask = new Uint8Array(W * H);
  const [rx0, rx1, ry0, ry1] = [region[0] * W, region[1] * W, region[2] * H, region[3] * H];
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

// Mean luminance of `lum` on the strokes divided by the mean on the gap.
export function strokeGapRatio(lum, m) {
  if (!m.strokes || !m.gaps) return NaN;
  let s = 0, g = 0;
  for (let i = 0; i < lum.length; i++) { if (m.mask[i]) s += lum[i]; else if (m.gap[i]) g += lum[i]; }
  return (s / m.strokes) / (g / m.gaps);
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
