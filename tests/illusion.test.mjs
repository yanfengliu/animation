// Gate: the illusion (what the viewer sees from E and from elsewhere).
// Bound: headless Chromium with SwiftShader WebGL2, deviceScaleFactor 1, frozen particle clock
// (t), default seed unless named, and only the viewports, times, zooms and views listed below.
// It measures luminance, not reading. Strokes come from the page's own text layer at the same
// view (blurred 3 px, thresholded 35% of the way from the median to the 99.5th percentile, kept
// to the central 84%×70% to skip the UI text); gaps are pixels of the text box ≥ 8 px from them.
// Because that mask comes from the render under test, legibility also requires the mask to be
// the same for another seed: relocated strokes follow the message, scattered particles follow
// the draw.
// Proves: at E the strokes are at least 2× brighter than the gaps (1.8× at fov 80) and match
// across seeds at t 0, 7.3 and 31 s, at 1280×800 and 390×844, at fov 32 and 80, and when 2D
// canvas readback (getImageData) returns zeros as anti-fingerprinting browsers do; the E text
// layer holds still over time and zoom only scales it; from 25° out (±25° az and el, +60° az, the
// back) the E strokes are no brighter than the back-view floor + 0.06, the az+25 text layer is a
// smear that changes with the seed, and a text particle carries the light and colour of an
// ambient one; the same seed builds the same cloud and another seed a different one.
// Does not prove that a person can read the text, or anything about views, times or seeds not
// listed here, real GPUs, or device pixel ratios above 1.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, newContext, magic, render } from './lib/harness.mjs';
import { luminance, channelSums, strokeMask, strokeGapRatio, iou, scaleMask } from './lib/image.mjs';

// Thresholds, each set from the real page and the mutants in tests/mutate.mjs (comments give the
// measured values, real page first, at 1280×800 unless named).
const MIN_RATIO_AT_E = 2.0;      // stroke/gap luminance at E: 2.35–2.50 real
const MIN_RATIO_FOV80 = 1.8;     // fov 80 strokes are ~7 px and sprites do not shrink: 1.97 real, 1.71 no relocation, 1.35 dolly
const MIN_SEED_IOU = 0.4;        // E strokes, default seed vs OTHER_SEED: ≥ 0.50 real, ≤ 0.29 no relocation (fov 80 cannot tell)
const MIN_TIME_IOU = 0.8;        // E strokes t=0 vs later: 0.89 real, 0.55 sideways drift, 0.76 no relocation
const MIN_SCALE_IOU = 0.5;       // zoomed strokes vs base strokes scaled: ≥ 0.67 real, ≤ 0.40 dolly
const FLOOR_MARGIN = 0.06;       // excess over the back-view floor from 25° out: ≤ 0.05 real, 0.10 flat text at el±25
const MAX_SMEAR_SEED_IOU = 0.14; // az+25 text layer, seed vs seed: 0.07 real, 0.21 flat text
const OTHER_SEED = 8;
const DIM = { blur: 5, bandpass: 15 }; // masks of unlit text layers: sky removed, dots merged
// Zoomed views scale the mask with the text: blur and gap distance follow the zoom factor s.
const scaled = (s) => ({ blur: Math.max(1, Math.round(3 * s)), gapDist: Math.max(3, Math.round(8 * s)) });

let browser, wide, phone, blind, E;
const cache = new Map(), label = new Map();

// Anti-fingerprinting browsers return blank canvas readback; the page must not depend on it.
const blankReadback = () => {
  CanvasRenderingContext2D.prototype.getImageData = function (x, y, w, h) { return new ImageData(Math.max(1, Math.abs(w)), Math.max(1, Math.abs(h))); };
};

before(async () => {
  browser = await startBrowser();
  wide = (await newContext(browser, { width: 1280, height: 800 })).context;
  phone = (await newContext(browser, { width: 390, height: 844 })).context;
  blind = (await newContext(browser, { width: 1280, height: 800, initScript: blankReadback })).context;
  for (const [c, name] of [[wide, 'wide'], [phone, 'phone'], [blind, 'blind']]) label.set(c, name);
  E = await magic(wide);
});
after(async () => { await browser?.close(); });

const at = (daz, del, extra = '') => `az=${E.az + daz}&el=${E.el + del}&tour=0${extra}`;
const back = (extra = '') => `az=${E.az + 180}&el=${-E.el}&tour=0${extra}`;

async function view(context, query) {
  const key = `${label.get(context)}?${query}`;
  if (!cache.has(key)) {
    const r = await render(context, query);
    cache.set(key, { ...r, lum: luminance(r.img) });
  }
  return cache.get(key);
}

async function strokesAt(context, query, opts) {
  const v = await view(context, query + '&layer=text');
  const m = strokeMask(v.lum, v.img.width, v.img.height, opts);
  assert.ok(m.strokes > 0, `no stroke pixels in the text layer for "${query}"`);
  return m;
}

async function legibility(context, query, opts) {
  const m = await strokesAt(context, query, opts);
  const other = await strokesAt(context, `${query}&seed=${OTHER_SEED}`, opts);
  const full = await view(context, query);
  return { ratio: strokeGapRatio(full.lum, m), seedIoU: iou(m.mask, other.mask), strokes: m.strokes, gaps: m.gaps, m };
}

function assertLegible(name, L, minRatio = MIN_RATIO_AT_E) {
  assert.ok(L.strokes >= 3000 && L.gaps >= 3000, `${name}: the mask is too small to measure (strokes ${L.strokes} px, gaps ${L.gaps} px; need at least 3000 each)`);
  assert.ok(L.ratio >= minRatio, `${name}: stroke/gap luminance ratio ${L.ratio.toFixed(3)} is below ${minRatio}`);
  assert.ok(L.seedIoU >= MIN_SEED_IOU, `${name}: strokes for seeds 1 and ${OTHER_SEED} overlap with IoU ${L.seedIoU.toFixed(3)}, below ${MIN_SEED_IOU}; the shapes follow the particle draw, not the message`);
}
const describe = (name, L) => `${name}: ratio ${L.ratio.toFixed(3)}, seed IoU ${L.seedIoU.toFixed(3)}, strokes ${L.strokes} px, gaps ${L.gaps} px`;

test('legible at E at 1280×800 for t = 0, 7.3 and 31 s', async (t) => {
  const rows = [];
  for (const time of ['0', '7.3', '31']) rows.push([`E t=${time}`, await legibility(wide, at(0, 0, `&t=${time}`))]);
  for (const [name, L] of rows) t.diagnostic(describe(name, L));
  for (const [name, L] of rows) assertLegible(name, L);
});

test('legible at E at 390×844', async (t) => {
  const L = await legibility(phone, at(0, 0, '&t=0'));
  t.diagnostic(describe('E 390×844 t=0', L));
  assertLegible('E 390×844 t=0', L);
});

test('legible at E when canvas readback returns zeros', async (t) => {
  const L = await legibility(blind, at(0, 0, '&t=0'));
  t.diagnostic(describe('E with blank getImageData', L));
  assertLegible('E with blank getImageData', L);
});

test('legible at E zoomed in and out, and zoom only scales the image', async (t) => {
  const base = await view(wide, at(0, 0, '&t=0'));
  const baseMask = await strokesAt(wide, at(0, 0, '&t=0'));
  const rows = [];
  for (const fov of [32, 80]) {
    const s = Math.tan((base.state.fov * Math.PI) / 360) / Math.tan((fov * Math.PI) / 360);
    const L = await legibility(wide, at(0, 0, `&t=0&fov=${fov}`), scaled(s));
    const overlap = iou(L.m.mask, scaleMask(baseMask.mask, L.m.W, L.m.H, s));
    t.diagnostic(`${describe(`E fov=${fov}`, L)}; IoU with the fov ${base.state.fov.toFixed(1)} strokes scaled by ${s.toFixed(3)}: ${overlap.toFixed(3)}`);
    rows.push([fov, L, s, overlap]);
  }
  for (const [fov, L, s, overlap] of rows) {
    assertLegible(`E fov=${fov}`, L, fov >= 80 ? MIN_RATIO_FOV80 : MIN_RATIO_AT_E);
    assert.ok(overlap >= MIN_SCALE_IOU, `fov ${fov}: the strokes overlap the base strokes scaled by ${s.toFixed(3)} with IoU ${overlap.toFixed(3)}, below ${MIN_SCALE_IOU}; zoom is not a pure scale about the centre`);
  }
});

test('the text layer at E holds still over time', async (t) => {
  const m0 = await strokesAt(wide, at(0, 0, '&t=0'));
  const rows = [];
  for (const time of ['7.3', '31']) rows.push([time, iou(m0.mask, (await strokesAt(wide, at(0, 0, `&t=${time}`))).mask)]);
  for (const [time, overlap] of rows) t.diagnostic(`IoU t=0 vs t=${time}: ${overlap.toFixed(3)}`);
  for (const [time, overlap] of rows) {
    assert.ok(overlap >= MIN_TIME_IOU, `text-layer strokes at t=0 and t=${time} overlap with IoU ${overlap.toFixed(3)}, below ${MIN_TIME_IOU}; text particles move across their sight lines`);
  }
});

test('hidden from 25° out: E strokes no brighter than the back-view floor', async (t) => {
  const m = await strokesAt(wide, at(0, 0, '&t=0'));
  const ratio = async (q) => strokeGapRatio((await view(wide, q)).lum, m);
  const floor = await ratio(back('&t=0'));
  const rows = [];
  for (const [name, q] of [['az+25', at(25, 0, '&t=0')], ['az-25', at(-25, 0, '&t=0')], ['el+25', at(0, 25, '&t=0')], ['el-25', at(0, -25, '&t=0')], ['az+60', at(60, 0, '&t=0')]]) rows.push([name, await ratio(q)]);
  t.diagnostic(`back-view floor ${floor.toFixed(3)}; ${rows.map(([n, r]) => `${n} ${r.toFixed(3)}`).join(', ')}`);
  assert.ok(floor < 1.25, `the back-view floor ${floor.toFixed(3)} is not below 1.25, so a comparison with it would mean nothing`);
  for (const [name, r] of rows) assert.ok(r <= floor + FLOOR_MARGIN, `${name}: stroke/gap ratio ${r.toFixed(3)} exceeds the back-view floor ${floor.toFixed(3)} + ${FLOOR_MARGIN}`);
});

test('the text layer at +25° az is smeared', async (t) => {
  const mE = await strokesAt(wide, at(0, 0, '&t=0'));
  const a = await strokesAt(wide, at(25, 0, '&t=0'), DIM);
  const b = await strokesAt(wide, at(25, 0, `&t=0&seed=${OTHER_SEED}`), DIM);
  const withE = iou(a.mask, mE.mask), seeds = iou(a.mask, b.mask);
  t.diagnostic(`az+25 text layer (${a.strokes} px): IoU with the E strokes ${withE.toFixed(3)}, with seed ${OTHER_SEED} ${seeds.toFixed(3)}`);
  // The E overlap is the plain check (0.08 real); only the cross-seed check tells a smear from
  // an off-angle readable sign (flat text overlaps E by 0.11 but repeats across seeds).
  assert.ok(withE <= 0.15, `the text layer at az+25 overlaps the E strokes with IoU ${withE.toFixed(3)}, above 0.15`);
  assert.ok(seeds <= MAX_SMEAR_SEED_IOU, `the text layer at az+25 has the same shape for seeds 1 and ${OTHER_SEED} (IoU ${seeds.toFixed(3)}, above ${MAX_SMEAR_SEED_IOU}); it shows structure, not a smear`);
});

test('from 25° out a text particle carries the light and colour of an ambient one', async (t) => {
  const rows = [];
  for (const [name, q] of [['az+25', at(25, 0, '&t=0')], ['el-25', at(0, -25, '&t=0')], ['back', back('&t=0')]]) {
    const full = channelSums((await view(wide, q)).img);
    const textOnly = await view(wide, q + '&layer=text'), ambOnly = await view(wide, q + '&layer=ambient');
    const tx = channelSums(textOnly.img), am = channelSums(ambOnly.img);
    // Additive blending: the full render minus one layer leaves the other layer's light.
    const lt = { r: full.r - am.r, g: full.g - am.g, b: full.b - am.b };
    const la = { r: full.r - tx.r, g: full.g - tx.g, b: full.b - tx.b };
    const per = (l, n) => (0.2126 * l.r + 0.7152 * l.g + 0.0722 * l.b) / n;
    const warmth = (l) => (l.r - l.b) / (l.r + l.b);
    rows.push([name, per(lt, textOnly.counts.text) / per(la, textOnly.counts.ambient), warmth(lt), warmth(la)]);
  }
  for (const [name, light, wt, wa] of rows) t.diagnostic(`${name}: text/ambient light per particle ${light.toFixed(3)}, warmth text ${wt.toFixed(3)} ambient ${wa.toFixed(3)}`);
  for (const [name, light, wt, wa] of rows) {
    assert.ok(light >= 0.6 && light <= 1.6, `${name}: a text particle carries ${light.toFixed(3)}× the light of an ambient one; must be within 0.6–1.6`);
    assert.ok(Math.abs(wt - wa) <= 0.05, `${name}: text light is warmer than ambient light by ${(wt - wa).toFixed(3)} (red−blue over red+blue); must be within ±0.05`);
  }
});

test('the same seed builds the same cloud; another seed a different one', async (t) => {
  const a = await render(wide, at(0, 0, '&t=0&layer=text&seed=7'));
  const b = await render(wide, at(0, 0, '&t=0&layer=text&seed=7'));
  const c = await render(wide, at(0, 0, '&t=0&layer=text&seed=8'));
  let diff = 0;
  for (let i = 0; i < a.img.rgb.length; i++) diff += Math.abs(a.img.rgb[i] - c.img.rgb[i]);
  const mean = diff / a.img.rgb.length;
  t.diagnostic(`counts seed 7: ${JSON.stringify(a.counts)} and ${JSON.stringify(b.counts)}; seed 8: ${JSON.stringify(c.counts)}; mean absolute difference 7 vs 8: ${mean.toFixed(3)} per channel`);
  assert.ok(a.counts.text > 0, `seed 7 built no text particles (counts ${JSON.stringify(a.counts)})`);
  assert.deepEqual(b.counts, a.counts, 'seed 7 loaded twice gave different particle counts');
  assert.ok(Buffer.compare(Buffer.from(a.img.rgb), Buffer.from(b.img.rgb)) === 0, 'seed 7 loaded twice gave different text-layer images');
  assert.ok(mean > 0.5, `seeds 7 and 8 gave nearly the same text-layer image (mean absolute difference ${mean.toFixed(3)} per channel, need above 0.5)`);
});
