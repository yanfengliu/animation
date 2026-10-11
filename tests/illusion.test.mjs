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
// canvas readback (getImageData) returns zeros as anti-fingerprinting browsers do; at E at
// 1280×800 (t 0) the strokes form two lines, the top one narrower, with a full-height stem at the
// left end of the top line and the right end of the bottom line and short letters at the other
// ends, so the text is neither mirrored nor turned 180°; at 390×844 the whole stroke mask, measured
// across the full width, stays at least 8 px inside the frame; at E a text particle carries at
// least 3× the light of an ambient one and is warmer (the reveal engages); the E text layer holds
// still over time and zoom only scales it; from 25° out (±25° az and el, +60° az) the E strokes
// are no brighter than the back-view floor + 0.06 (the back view is the floor itself, not a case
// tested against it); the az+25 text layer, the only off-angle layer measured, is a smear that
// changes with the seed; at az+25, el−25 and the back a text particle carries the light and
// colour of an ambient one; the same seed builds the same cloud and another seed a different one.
// Does not prove that a person can read the text, or anything about views, times or seeds not
// listed here, real GPUs, or device pixel ratios above 1.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, newContext, magic, render } from './lib/harness.mjs';
import { luminance, channelSums, strokeMask, strokeGapRatio, iou, scaleMask, lineLayout } from './lib/image.mjs';

// Thresholds, each set from the real page and the mutants in tests/mutate.mjs (comments give the
// measured values, real page first, at 1280×800 unless named).
const MIN_RATIO_AT_E = 2.0;      // stroke/gap luminance at E: 2.35–2.50 real
const MIN_RATIO_FOV80 = 1.8;     // fov 80 strokes are ~7 px and sprites do not shrink: 1.97 real, 1.71 no relocation, 1.35 dolly
const MIN_SEED_IOU = 0.4;        // E strokes, default seed vs OTHER_SEED: ≥ 0.50 real, ≤ 0.29 no relocation (fov 80 cannot tell)
const MIN_TIME_IOU = 0.8;        // E strokes t=0 vs later: 0.89 real, 0.55 sideways drift, 0.76 no relocation
const MIN_SCALE_IOU = 0.5;       // zoomed strokes vs base strokes scaled: ≥ 0.67 real, ≤ 0.40 dolly
const FLOOR_MARGIN = 0.06;       // excess over the back-view floor from 25° out: ≤ 0.05 real, 0.10 flat text at el±25
const MAX_SMEAR_SEED_IOU = 0.14; // az+25 text layer, seed vs seed: 0.07 real, 0.21 flat text
const LINE_WIDTH_RATIO = [0.76, 0.92]; // top/bottom line width at E: 0.846 real, 1.176 turned 180°
const FULL_STEM = 0.8;           // end-strip height / line height at "h" and "d": 0.96 and 0.88 real, 0.53 and 0.59 mirrored
const SHORT_END = 0.7;           // the same at "o" and "w": 0.53 and 0.59 real, 0.96 and 0.88 mirrored
const MIN_FIT_MARGIN = 8;        // px between the strokes and the frame edges at 390×844: 30 real, 0 without the phone widening
const MIN_REVEAL_LIGHT = 3;      // text/ambient light per particle at E: 12.1 real, 0.87 reveal off
const MIN_REVEAL_WARMTH = 0.2;   // text minus ambient warmth at E: 0.48 real, 0.00 reveal off
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

// The layout comes from the page's glyph geometry in x-heights: "hello" is 4.55 wide and "world"
// 5.42, both lines 1.71 tall (ascender 1.55 plus the 0.16 stroke). "h" opens the top line and "d"
// closes the bottom line with full-height stems; "o" closes the top line and "w" opens the bottom
// line at x-height only (about 0.6 and 0.4 of the line height in a 0.15-line-height strip).
test('at E the message reads "hello" over "world", left to right', async (t) => {
  const m = await strokesAt(wide, at(0, 0, '&t=0'));
  const L = lineLayout(m);
  assert.ok(L, `the E strokes (box ${JSON.stringify(m.box)}) have no empty row between two lines`);
  const { top, bottom } = L;
  const widthRatio = top.width / bottom.width;
  const ends = { hLeft: top.left / top.height, oRight: top.right / top.height, wLeft: bottom.left / bottom.height, dRight: bottom.right / bottom.height };
  t.diagnostic(`gap ${L.gap} px; top ${JSON.stringify(top)}; bottom ${JSON.stringify(bottom)}; width ratio ${widthRatio.toFixed(3)}; end heights / line height ${Object.entries(ends).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(', ')}`);
  assert.ok(L.gap >= 3, `the two lines are only ${L.gap} px apart`);
  assert.ok(widthRatio >= LINE_WIDTH_RATIO[0] && widthRatio <= LINE_WIDTH_RATIO[1], `the top line is ${top.width} px wide and the bottom line ${bottom.width} px (ratio ${widthRatio.toFixed(3)}); "hello" over "world" gives about 0.84, so it must be within ${LINE_WIDTH_RATIO.join('–')} (a frame turned 180° gives about 1.19)`);
  assert.ok(ends.hLeft >= FULL_STEM, `the left end of the top line is only ${ends.hLeft.toFixed(2)} of the line height; the "h" stem there must reach at least ${FULL_STEM} (a mirrored frame puts "o" there)`);
  assert.ok(ends.dRight >= FULL_STEM, `the right end of the bottom line is only ${ends.dRight.toFixed(2)} of the line height; the "d" stem there must reach at least ${FULL_STEM} (a mirrored frame puts "w" there)`);
  assert.ok(ends.oRight <= SHORT_END, `the right end of the top line is ${ends.oRight.toFixed(2)} of the line height; the "o" there must stay at or below ${SHORT_END}`);
  assert.ok(ends.wLeft <= SHORT_END, `the left end of the bottom line is ${ends.wLeft.toFixed(2)} of the line height; the "w" there must stay at or below ${SHORT_END}`);
});

test('at 390×844 the whole message fits inside the frame', async (t) => {
  const v = await view(phone, at(0, 0, '&t=0&layer=text'));
  const { width: W, height: H } = v.img;
  const band = [0.15, 0.85];                         // full width; rows clear of the bar and the hint
  const m = strokeMask(v.lum, W, H, { region: [0, 1, ...band] });
  const { x0, x1, y0, y1 } = m.box;
  const margins = { left: x0, right: W - 1 - x1, top: y0 - Math.ceil(band[0] * H), bottom: Math.floor(band[1] * H) - y1 };
  t.diagnostic(`text-layer strokes over the full width: ${m.strokes} px, box ${JSON.stringify(m.box)} in ${W}×${H}, margins ${JSON.stringify(margins)}`);
  assert.ok(m.strokes >= 3000, `only ${m.strokes} stroke pixels at 390×844`);
  for (const [side, px] of Object.entries(margins)) {
    assert.ok(px >= MIN_FIT_MARGIN, `the text strokes come within ${px} px of the ${side} edge${side === 'left' || side === 'right' ? ' of the frame' : ' of the measured band'} at 390×844; the whole message must fit with at least ${MIN_FIT_MARGIN} px to spare`);
  }
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

// Light per particle of each layer at a view, from the full render and the two layer renders:
// with additive blending, the full render minus one layer leaves the other layer's light. Returns
// the text/ambient light per particle and each layer's warmth, (red − blue) / (red + blue).
async function particleLight(q) {
  const full = channelSums((await view(wide, q)).img);
  const textOnly = await view(wide, q + '&layer=text'), ambOnly = await view(wide, q + '&layer=ambient');
  const tx = channelSums(textOnly.img), am = channelSums(ambOnly.img);
  const lt = { r: full.r - am.r, g: full.g - am.g, b: full.b - am.b };
  const la = { r: full.r - tx.r, g: full.g - tx.g, b: full.b - tx.b };
  const per = (l, n) => (0.2126 * l.r + 0.7152 * l.g + 0.0722 * l.b) / n;
  const warmth = (l) => (l.r - l.b) / (l.r + l.b);
  return { light: per(lt, textOnly.counts.text) / per(la, textOnly.counts.ambient), wt: warmth(lt), wa: warmth(la) };
}

test('at E the reveal lights the text particles: brighter and warmer than ambient ones', async (t) => {
  const { light, wt, wa } = await particleLight(at(0, 0, '&t=0'));
  t.diagnostic(`E: text/ambient light per particle ${light.toFixed(3)}, warmth text ${wt.toFixed(3)} ambient ${wa.toFixed(3)}`);
  assert.ok(light >= MIN_REVEAL_LIGHT, `at E a text particle carries only ${light.toFixed(3)}× the light of an ambient one; the reveal must lift it to at least ${MIN_REVEAL_LIGHT}×`);
  assert.ok(wt - wa >= MIN_REVEAL_WARMTH, `at E text light is warmer than ambient light by only ${(wt - wa).toFixed(3)} (red−blue over red+blue); the reveal's gold must add at least ${MIN_REVEAL_WARMTH}`);
});

test('from 25° out a text particle carries the light and colour of an ambient one', async (t) => {
  const rows = [];
  for (const [name, q] of [['az+25', at(25, 0, '&t=0')], ['el-25', at(0, -25, '&t=0')], ['back', back('&t=0')]]) {
    const { light, wt, wa } = await particleLight(q);
    rows.push([name, light, wt, wa]);
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
