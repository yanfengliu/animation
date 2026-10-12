// Gate: the illusion (what the viewer sees from E and from elsewhere).
// Bound: headless Chromium with SwiftShader WebGL2, deviceScaleFactor 1, frozen particle clock
// (t), default seed unless named, and only the viewports, times, zooms, views and β values listed
// below. It measures luminance, not reading. Strokes come from the page's own text layer at the
// same view (blurred 3 px, thresholded 35% of the way from the median to the 99.5th percentile,
// kept to the central 84%×70% to skip the UI text); gaps are pixels of the text box ≥ 8 px from
// them. A zoomed view scales the blur and gap distance with the zoom and keeps exactly the stroke
// area the zoom predicts, so its mask cannot fatten where sprites merge. The test-only beta
// parameter (0..1) renders the same base cloud with another relocation rate; beta=0 relocates
// nothing and its text layer is the sky alone, so a render minus its beta-0 twin holds only what
// relocation changed. Because the mask comes from the render under test, legibility also requires
// it to match another seed's (relocated strokes follow the message, scattered particles the draw)
// and relocation to lift the stroke/gap ratio over the beta-0 render on the same mask (no
// relocation lifts it 1.01×).
// Proves: at E the strokes are at least 1.48× brighter than the gaps, relocation lifts that ratio
// at least 1.35×, and the strokes match across seeds, at t 0, 7.3 and 31 s, at 1280×800 and
// 390×844, at fov 32 and 80, and when 2D canvas readback (getImageData) returns zeros as
// anti-fingerprinting browsers do; at E at 1280×800 (t 0), with the letters' 14° lean undone, the
// strokes form two lines, the top one narrower, with a full-height stem at the left end of the top
// line and the right end of the bottom line and short letters at the other ends, so the text is
// neither mirrored nor turned 180° and its letters lean right by about 14°; at 390×844 the whole stroke mask, measured across the full width, stays at least 8 px
// inside the frame; the E text layer holds still over time and zoom only scales it; from 25° out
// (±25° az and el, +60° az) the E strokes are no brighter than the back-view floor + 0.06 (the
// back view is the floor itself, not a case tested against it); the az+25 text layer, the only
// off-angle layer measured, is a smear that changes with the seed; every particle renders alike at
// every angle (owner directive, 2026-10-11): at E, 3° from E (el+3), az+25, el−25 and the back the
// text particles carry the light (within 10%), colour (warmth within 0.03) and sprite size (within
// 15%) of the same particles drawn as ambient, and the scene's particle light at E and 3° is
// within 15% of its mean over those three far views; relocation leaves no streaks above the floor
// at az±25, az+60 and the back (row and column residual of render − beta-0 render within 1.45×
// the mean residual at two diagonal control views); the same seed builds the same cloud and
// another seed a different one.
// Accepted limit, reported but not gated as hidden: from el±15–25° the text columns show as faint
// vertical streaks. The letters lean 14° to spread them: at el±25 the column residual is 1.26× and
// 1.72× the floor for the default seed (1.19 and 1.62 over 0.94; W8's upright letters gave 1.8×
// and 2.3×, accepted by the coordinator with β 0.85). The streak bound at az+25 holds for the
// default seed: seeds 2 and 3 of the same page measure 1.42 and 1.64 there (seed 1: 1.19), and
// seed 3 also exceeds the hidden-from-25° margin there (by 0.069).
// Does not prove that a person can read the text, or anything about views, times or seeds not
// listed here, real GPUs, or device pixel ratios above 1. Nor does it hold β below 1: the streak
// bound compares with a floor that rises with β as well, so β 1.0 passes it for the default seed.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, newContext, magic, render } from './lib/harness.mjs';
import { luminance, strokeMask, strokeGapRatio, iou, scaleMask, lineLayout, unslant, lightOver, streakResidual } from './lib/image.mjs';

// Thresholds, each set from the real page and the mutants in tests/mutate.mjs (comments give the
// measured values, real page first, at 1280×800 and seed 1 unless named; "seeds 1–3" means the
// real page measured with each of seeds 1, 2 and 3 as the default seed).
const MIN_RATIO_AT_E = 1.48;     // stroke/gap luminance at E: 1.58–1.68 real (seeds 1–3, both viewports), 1.55–1.59 fov 80; 1.25–1.37 β 0.2 (1.69 at fov 32, where its lift fails), 1.33 dolly and 1.34 no relocation at fov 80, 1.39 no relocation at 390
const MIN_LIFT = 1.35;           // that ratio over the beta-0 render's on the same mask: 1.48–1.61 real (seeds 1–3), 1.51–1.55 fov 80; 1.01–1.20 β 0.2, 1.01–1.03 no relocation
const MIN_SEED_IOU = 0.5;        // E strokes, default seed vs OTHER_SEED: ≥ 0.70 real (seeds 1–3); 0.37 β 0.2 and 0.42 no relocation, both at 390
const MIN_TIME_IOU = 0.8;        // E strokes t=0 vs later: 0.95 real; 0.66 when text particles drift across their sight lines
const MIN_SCALE_IOU = 0.7;       // zoomed strokes vs base strokes scaled: 0.84–0.89 (fov 32) and 0.95 (fov 80) real (seeds 1–3); 0.53 and 0.66 when zoom dollies the eye
const FLOOR_MARGIN = 0.06;       // excess over the back-view floor from 25° out: 0.028 real (az−25; 0.037 seed 2, 0.069 seed 3 at az+25); 0.51 flat text at el+25 (0.11 for text squeezed halfway to its plane, on the upright page); 0.058 with β 1.0
const MAX_BACK_FLOOR = 1.25;     // the back-view floor itself: 1.12–1.14 real (seeds 1–3); 1.26 relocation without density compensation, 1.24 flat text (which fails FLOOR_MARGIN)
const MAX_SMEAR_E_IOU = 0.25;    // az+25 text layer vs the E strokes: 0.12–0.15 real (seeds 1–3), 0.16 flat text (a coarse guard; the seed check tells them apart)
const MAX_SMEAR_SEED_IOU = 0.3;  // az+25 text layer, seed vs seed: 0.12 real (seeds 1–3), 0.57 flat text
const LIGHT_BAND = [0.9, 1.1];   // text / as-ambient light of the same particles: 0.99–1.01 real (seeds 1–3, every view); at E 1.24 with text 1.25× brighter near E, 1.58 with text sprites 1.25× wider, 1.17 with their blur cut 75%, and 1.38–1.41 at every view with text 1.4× brighter everywhere
const MAX_WARMTH_GAP = 0.03;     // |text − as-ambient warmth|: ≤ 0.005 real (seeds 1–3); 0.126 at E and 0.096 at 3° with a 30% gold tint near E
const SIZE_BAND = [0.85, 1.15];  // text / as-ambient effective sprite area at SPARSE_BETA: 0.98–1.01 real (seeds 1–3); 1.49 at E and 1.34 at 3° with text sprites 1.25× wider near E
const SCENE_BAND = [0.85, 1.15]; // scene particle light at E and 3° over its mean at the far views: 0.95–1.06 real (seeds 1–3); 1.35 with every particle 1.4× brighter near E
const STREAK_K = 1.45;           // streak residual over the floor at az±25, az+60, back: ≤ 1.29 real (az+60 row); 1.74 at az+25 without density compensation. β 1.0 gives 1.28, since its floor rises too (1.07); upright letters gave 1.64 at seed 1, but 1.62 and 1.88 against 1.73 and 1.88 at β 0.85 for seeds 2–3, so this bound never held β below 1
const MAX_STREAK_FLOOR = 1.3;    // the floor itself: 0.94 real (0.93–0.95 seeds 2–3); 2.12 flat text
const SLANT_DEG = 14;            // the letters' lean (SLANT in index.html), undone before the layout is measured
const LINE_WIDTH_RATIO = [0.76, 0.92]; // top/bottom line width at E, lean undone: 0.857 real, 1.155 turned 180°
const FULL_STEM = 0.8;           // end-strip height / line height at "h" and "d", lean undone: 0.94 and 0.96 real (0.94–0.99 seeds 1–3); 0.44 and 0.60 mirrored (its letters lean left, "o" and "w" are there), 0.63 and 0.58 with upright letters (0.68–0.75 at "h", seeds 2–3)
const SHORT_END = 0.7;           // the same at "o" and "w": 0.49 and 0.53 real; it catches no mutant alone, since a mirrored frame's stems lean the wrong way and fail FULL_STEM first
const MIN_FIT_MARGIN = 8;        // px between the strokes and the frame edges at 390×844: 33–35 real (seeds 1–3), 0 without the phone widening
const SPARSE_BETA = 0.02;        // 121 text particles: separate sprites, so the effective area measures sprite size
const OTHER_SEED = 8;
const DIM = { blur: 5, bandpass: 15 }; // masks of off-angle text layers: sky removed, dots merged
// Zoomed views scale the mask with the text: blur and gap distance follow the zoom factor s, and
// the mask keeps the base stroke area times s².
const scaled = (s, baseStrokes) => ({ blur: Math.max(1, Math.round(3 * s)), gapDist: Math.max(3, Math.round(8 * s)), area: Math.round(baseStrokes * s * s) });

let browser, browser2, wide, wide2, phone, blind, E;
const cache = new Map(), label = new Map();

// Anti-fingerprinting browsers return blank canvas readback; the page must not depend on it.
const blankReadback = () => {
  CanvasRenderingContext2D.prototype.getImageData = function (x, y, w, h) { return new ImageData(Math.max(1, Math.abs(w)), Math.max(1, Math.abs(h))); };
};

before(async () => {
  [browser, browser2] = await Promise.all([startBrowser(), startBrowser()]);
  wide = (await newContext(browser, { width: 1280, height: 800 })).context;
  wide2 = (await newContext(browser2, { width: 1280, height: 800 })).context;   // a second GPU process for wide views
  phone = (await newContext(browser, { width: 390, height: 844 })).context;
  blind = (await newContext(browser, { width: 1280, height: 800, initScript: blankReadback })).context;
  for (const [c, name] of [[wide, 'wide'], [phone, 'phone'], [blind, 'blind']]) label.set(c, name);
  E = await magic(wide);
});
after(async () => { await Promise.all([browser?.close(), browser2?.close()]); });

const at = (daz, del, extra = '') => `az=${E.az + daz}&el=${E.el + del}&tour=0${extra}`;
const back = (extra = '') => `az=${E.az + 180}&el=${-E.el}&tour=0${extra}`;
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

// Each view renders once per context; the cache holds the pending render, so a view asked for
// twice at once still renders once. `via` renders it in another context with the same settings.
function view(context, query, via = context) {
  const key = `${label.get(context)}?${query}`;
  if (!cache.has(key)) cache.set(key, render(via, query).then((r) => ({ ...r, lum: luminance(r.img) })));
  return cache.get(key);
}

// Renders the views a test needs four at a time; wide views alternate between two browsers,
// since SwiftShader draws each browser's pages in one GPU process. Each view is its own page with
// a frozen clock and a fixed seed, so the images are the same as one at a time in one browser.
async function prefetch(context, queries, width = 4) {
  const todo = [...new Set(queries)], errors = [];
  await Promise.all(Array.from({ length: width }, async (_, k) => {
    const via = context === wide && k % 2 ? wide2 : context;
    while (todo.length) { try { await view(context, todo.shift(), via); } catch (err) { errors.push(err); } }
  }));
  if (errors.length) throw errors[0];
}
const legibilityViews = (query) => [query + '&layer=text', `${query}&seed=${OTHER_SEED}&layer=text`, query, query + '&beta=0'];

async function strokesAt(context, query, opts) {
  const v = await view(context, query + '&layer=text');
  const m = strokeMask(v.lum, v.img.width, v.img.height, opts);
  assert.ok(m.strokes > 0, `no stroke pixels in the text layer for "${query}"`);
  return m;
}

async function legibility(context, query, opts) {
  const m = await strokesAt(context, query, opts);
  const other = await strokesAt(context, `${query}&seed=${OTHER_SEED}`, opts);
  const ratio = strokeGapRatio((await view(context, query)).lum, m);
  const lift = ratio / strokeGapRatio((await view(context, query + '&beta=0')).lum, m);
  return { ratio, lift, seedIoU: iou(m.mask, other.mask), strokes: m.strokes, gaps: m.gaps, m };
}

// The legibility bounds a measurement breaks, each named; a test asserts once with all of them,
// so a failure shows every way the text fails to read rather than only the first.
function illegible(name, L) {
  const broken = [];
  if (!(L.strokes >= 3000 && L.gaps >= 3000)) broken.push(`${name}: the mask is too small to measure (strokes ${L.strokes} px, gaps ${L.gaps} px; need at least 3000 each)`);
  if (!(L.ratio >= MIN_RATIO_AT_E)) broken.push(`${name}: stroke/gap luminance ratio ${L.ratio.toFixed(3)} is below ${MIN_RATIO_AT_E}`);
  if (!(L.lift >= MIN_LIFT)) broken.push(`${name}: relocation lifts the stroke/gap ratio only ${L.lift.toFixed(3)}× over the same view at beta=0 (need at least ${MIN_LIFT}×)`);
  if (!(L.seedIoU >= MIN_SEED_IOU)) broken.push(`${name}: strokes for seeds 1 and ${OTHER_SEED} overlap with IoU ${L.seedIoU.toFixed(3)}, below ${MIN_SEED_IOU}, so the shapes follow the particle draw, not the message`);
  return broken;
}
const assertNone = (broken) => assert.ok(broken.length === 0, broken.join('; '));
const describe = (name, L) => `${name}: ratio ${L.ratio.toFixed(3)}, lift over beta=0 ${L.lift.toFixed(3)}, seed IoU ${L.seedIoU.toFixed(3)}, strokes ${L.strokes} px, gaps ${L.gaps} px`;

test('legible at E at 1280×800 for t = 0, 7.3 and 31 s', async (t) => {
  await prefetch(wide, ['0', '7.3', '31'].flatMap((time) => legibilityViews(at(0, 0, `&t=${time}`))));
  const rows = [];
  for (const time of ['0', '7.3', '31']) rows.push([`E t=${time}`, await legibility(wide, at(0, 0, `&t=${time}`))]);
  for (const [name, L] of rows) t.diagnostic(describe(name, L));
  assertNone(rows.flatMap(([name, L]) => illegible(name, L)));
});

test('legible at E at 390×844', async (t) => {
  await prefetch(phone, legibilityViews(at(0, 0, '&t=0')));
  const L = await legibility(phone, at(0, 0, '&t=0'));
  t.diagnostic(describe('E 390×844 t=0', L));
  assertNone(illegible('E 390×844 t=0', L));
});

// The layout comes from the page's glyph geometry in x-heights: "hello" is 4.55 wide and "world"
// 5.42, both lines 1.71 tall (ascender 1.55 plus the 0.16 stroke). "h" opens the top line and "d"
// closes the bottom line with full-height stems; "o" closes the top line and "w" opens the bottom
// line at x-height only (about 0.6 and 0.4 of the line height in a 0.15-line-height strip). The
// letters lean right by SLANT_DEG, so the strokes are measured with that lean undone: then the
// stems stand upright in their end strips, while letters that lean the other way (a mirrored
// frame) or not at all (upright letters) leave those strips short.
test('at E the message reads "hello" over "world", left to right', async (t) => {
  const m = await strokesAt(wide, at(0, 0, '&t=0'));
  const L = lineLayout(unslant(m, Math.tan((SLANT_DEG * Math.PI) / 180)));
  assert.ok(L, `the E strokes (box ${JSON.stringify(m.box)}) have no empty row between two lines`);
  const { top, bottom } = L;
  const widthRatio = top.width / bottom.width;
  const ends = { hLeft: top.left / top.height, oRight: top.right / top.height, wLeft: bottom.left / bottom.height, dRight: bottom.right / bottom.height };
  t.diagnostic(`gap ${L.gap} px; top ${JSON.stringify(top)}; bottom ${JSON.stringify(bottom)}; width ratio ${widthRatio.toFixed(3)}; end heights / line height ${Object.entries(ends).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(', ')}`);
  assert.ok(L.gap >= 3, `the two lines are only ${L.gap} px apart`);
  assert.ok(widthRatio >= LINE_WIDTH_RATIO[0] && widthRatio <= LINE_WIDTH_RATIO[1], `the top line is ${top.width} px wide and the bottom line ${bottom.width} px (ratio ${widthRatio.toFixed(3)}); "hello" over "world" gives about 0.84, so it must be within ${LINE_WIDTH_RATIO.join('–')} (a frame turned 180° gives about 1.19)`);
  assert.ok(ends.hLeft >= FULL_STEM, `with the letters' ${SLANT_DEG}° lean undone, the left end of the top line is only ${ends.hLeft.toFixed(2)} of the line height; the "h" stem there must reach at least ${FULL_STEM} (a mirrored frame puts "o" there, and letters that do not lean about ${SLANT_DEG}° leave the stem slanted across the strip)`);
  assert.ok(ends.dRight >= FULL_STEM, `with the letters' ${SLANT_DEG}° lean undone, the right end of the bottom line is only ${ends.dRight.toFixed(2)} of the line height; the "d" stem there must reach at least ${FULL_STEM} (a mirrored frame puts "w" there, and letters that do not lean about ${SLANT_DEG}° leave the stem slanted across the strip)`);
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
  await prefetch(blind, legibilityViews(at(0, 0, '&t=0')));
  const L = await legibility(blind, at(0, 0, '&t=0'));
  t.diagnostic(describe('E with blank getImageData', L));
  assertNone(illegible('E with blank getImageData', L));
});

test('legible at E zoomed in and out, and zoom only scales the image', async (t) => {
  await prefetch(wide, [at(0, 0, '&t=0&layer=text'), ...[32, 80].flatMap((fov) => legibilityViews(at(0, 0, `&t=0&fov=${fov}`)))]);
  const base = await view(wide, at(0, 0, '&t=0'));
  const baseMask = await strokesAt(wide, at(0, 0, '&t=0'));
  const rows = [];
  for (const fov of [32, 80]) {
    const s = Math.tan((base.state.fov * Math.PI) / 360) / Math.tan((fov * Math.PI) / 360);
    const L = await legibility(wide, at(0, 0, `&t=0&fov=${fov}`), scaled(s, baseMask.strokes));
    const overlap = iou(L.m.mask, scaleMask(baseMask.mask, L.m.W, L.m.H, s));
    t.diagnostic(`${describe(`E fov=${fov}`, L)}; IoU with the fov ${base.state.fov.toFixed(1)} strokes scaled by ${s.toFixed(3)}: ${overlap.toFixed(3)}`);
    rows.push([fov, L, s, overlap]);
  }
  const broken = [];
  for (const [fov, L, s, overlap] of rows) {
    if (!(overlap >= MIN_SCALE_IOU)) broken.push(`fov ${fov}: the strokes overlap the base strokes scaled by ${s.toFixed(3)} with IoU ${overlap.toFixed(3)}, below ${MIN_SCALE_IOU}, so zoom is not a pure scale about the centre`);
    broken.push(...illegible(`E fov=${fov}`, L));
  }
  assertNone(broken);
});

test('the text layer at E holds still over time', async (t) => {
  await prefetch(wide, ['0', '7.3', '31'].map((time) => at(0, 0, `&t=${time}&layer=text`)));
  const m0 = await strokesAt(wide, at(0, 0, '&t=0'));
  const rows = [];
  for (const time of ['7.3', '31']) rows.push([time, iou(m0.mask, (await strokesAt(wide, at(0, 0, `&t=${time}`))).mask)]);
  for (const [time, overlap] of rows) t.diagnostic(`IoU t=0 vs t=${time}: ${overlap.toFixed(3)}`);
  for (const [time, overlap] of rows) {
    assert.ok(overlap >= MIN_TIME_IOU, `text-layer strokes at t=0 and t=${time} overlap with IoU ${overlap.toFixed(3)}, below ${MIN_TIME_IOU}; text particles move across their sight lines`);
  }
});

// el±25 is in this test: the stem streaks there (the accepted cost, see the residual test) fall
// mostly off the E strokes, so the E strokes themselves stay at the floor (excess 0.02 at el−25).
test('hidden from 25° out: E strokes no brighter than the back-view floor', async (t) => {
  const off = [['az+25', at(25, 0, '&t=0')], ['az-25', at(-25, 0, '&t=0')], ['el+25', at(0, 25, '&t=0')], ['el-25', at(0, -25, '&t=0')], ['az+60', at(60, 0, '&t=0')]];
  await prefetch(wide, [at(0, 0, '&t=0&layer=text'), back('&t=0'), ...off.map(([, q]) => q)]);
  const m = await strokesAt(wide, at(0, 0, '&t=0'));
  const ratio = async (q) => strokeGapRatio((await view(wide, q)).lum, m);
  const floor = await ratio(back('&t=0'));
  const rows = [];
  for (const [name, q] of off) rows.push([name, await ratio(q)]);
  t.diagnostic(`back-view floor ${floor.toFixed(3)}; ${rows.map(([n, r]) => `${n} ${r.toFixed(3)}`).join(', ')}`);
  assert.ok(floor < MAX_BACK_FLOOR, `the back-view floor ${floor.toFixed(3)} is not below ${MAX_BACK_FLOOR}: the E strokes show from behind, so a comparison with it would mean nothing`);
  for (const [name, r] of rows) assert.ok(r <= floor + FLOOR_MARGIN, `${name}: stroke/gap ratio ${r.toFixed(3)} exceeds the back-view floor ${floor.toFixed(3)} + ${FLOOR_MARGIN}`);
});

test('the text layer at +25° az is smeared', async (t) => {
  await prefetch(wide, [at(0, 0, '&t=0&layer=text'), at(25, 0, '&t=0&layer=text'), at(25, 0, `&t=0&seed=${OTHER_SEED}&layer=text`)]);
  const mE = await strokesAt(wide, at(0, 0, '&t=0'));
  const a = await strokesAt(wide, at(25, 0, '&t=0'), DIM);
  const b = await strokesAt(wide, at(25, 0, `&t=0&seed=${OTHER_SEED}`), DIM);
  const withE = iou(a.mask, mE.mask), seeds = iou(a.mask, b.mask);
  t.diagnostic(`az+25 text layer (${a.strokes} px): IoU with the E strokes ${withE.toFixed(3)}, with seed ${OTHER_SEED} ${seeds.toFixed(3)}`);
  // At β 0.85 the text rows survive an azimuth turn as streaks, which follow the message, so both
  // overlaps sit above their old β 0.2 values; a flat sign repeats across seeds far more (0.58).
  assert.ok(withE <= MAX_SMEAR_E_IOU, `the text layer at az+25 overlaps the E strokes with IoU ${withE.toFixed(3)}, above ${MAX_SMEAR_E_IOU}`);
  assert.ok(seeds <= MAX_SMEAR_SEED_IOU, `the text layer at az+25 has the same shape for seeds 1 and ${OTHER_SEED} (IoU ${seeds.toFixed(3)}, above ${MAX_SMEAR_SEED_IOU}); it shows structure, not a smear`);
});

// The same particles drawn two ways at one view, from four renders. beta=0 makes every particle
// ambient without moving the base cloud, and its text layer is the sky alone. So the text layer
// at `beta` minus the sky holds the particles that `beta` relocates, drawn as text; the full
// beta-0 render minus the ambient layer at `beta` holds the same particles drawn as ambient where
// they started. Returns text over as-ambient light, their warmth difference and the ratio of
// their effective areas (sprite size; meaningful at SPARSE_BETA, where the sprites are separate).
async function drawnBothWays(q, beta) {
  const b = beta === undefined ? '' : `&beta=${beta}`;
  const sky = (await view(wide, q + '&beta=0&layer=text')).img;
  const t = lightOver((await view(wide, q + b + '&layer=text')).img, sky);
  const a = lightOver((await view(wide, q + '&beta=0')).img, (await view(wide, q + b + '&layer=ambient')).img);
  return { light: t.light / a.light, warmth: t.warmth - a.warmth, size: t.area / a.area };
}

test('every particle renders alike at every angle: no reveal near E', async (t) => {
  const views = [['E', at(0, 0, '&t=0')], ['3° (el+3)', at(0, 3, '&t=0')], ['az+25', at(25, 0, '&t=0')], ['el-25', at(0, -25, '&t=0')], ['back', back('&t=0')]];
  await prefetch(wide, views.flatMap(([, q]) => [q, q + '&beta=0', q + '&beta=0&layer=text', q + '&layer=text', q + '&layer=ambient', q + `&beta=${SPARSE_BETA}&layer=text`, q + `&beta=${SPARSE_BETA}&layer=ambient`]));
  const rows = [];
  for (const [name, q] of views) {
    const d = await drawnBothWays(q), s = await drawnBothWays(q, SPARSE_BETA);
    const scene = lightOver((await view(wide, q)).img, (await view(wide, q + '&beta=0&layer=text')).img).light;
    rows.push({ name, light: d.light, warmth: d.warmth, size: s.size, scene });
  }
  const farScene = mean(rows.slice(2).map((r) => r.scene));
  for (const r of rows) t.diagnostic(`${r.name}: text/as-ambient light ${r.light.toFixed(3)}, warmth difference ${r.warmth.toFixed(3)}, sprite size ratio (beta ${SPARSE_BETA}) ${r.size.toFixed(3)}, scene light / far mean ${(r.scene / farScene).toFixed(3)}`);
  // Every broken bound is named in one message, so a failure shows each way the particles differ.
  const broken = [];
  for (const r of rows) {
    if (!(r.light >= LIGHT_BAND[0] && r.light <= LIGHT_BAND[1])) broken.push(`${r.name}: the text particles carry ${r.light.toFixed(3)}× the light of the same particles drawn as ambient (must be within ${LIGHT_BAND.join('–')})`);
    if (!(Math.abs(r.warmth) <= MAX_WARMTH_GAP)) broken.push(`${r.name}: their light is warmer than the same particles drawn as ambient by ${r.warmth.toFixed(3)} (red−blue over red+blue; must be within ±${MAX_WARMTH_GAP})`);
    if (!(r.size >= SIZE_BAND[0] && r.size <= SIZE_BAND[1])) broken.push(`${r.name}: their sprites cover ${r.size.toFixed(3)}× the effective area of the same particles drawn as ambient at beta ${SPARSE_BETA} (must be within ${SIZE_BAND.join('–')})`);
  }
  for (const r of rows.slice(0, 2)) {
    const k = r.scene / farScene;
    if (!(k >= SCENE_BAND[0] && k <= SCENE_BAND[1])) broken.push(`${r.name}: the scene's particle light is ${k.toFixed(3)}× its mean at az+25, el−25 and the back (must be within ${SCENE_BAND.join('–')})`);
  }
  assert.ok(broken.length === 0, `every particle must render alike at every angle, but ${broken.join('; ')}`);
});

// The accepted cost is reported, not asserted: elevation turns keep the text columns as streaks.
test('relocation leaves no streaks at az±25, az+60 or the back', async (t) => {
  const residual = async (q) => streakResidual((await view(wide, q)).lum, (await view(wide, q + '&beta=0')).lum, 1280, 800);
  const views = {
    controls: [['az+90 el+36', at(90, 36, '&t=0')], ['az-120 el+30', at(-120, 30, '&t=0')]],
    gated: [['az+25', at(25, 0, '&t=0')], ['az-25', at(-25, 0, '&t=0')], ['az+60', at(60, 0, '&t=0')], ['back', back('&t=0')]],
    cost: [['el+25', at(0, 25, '&t=0')], ['el-25', at(0, -25, '&t=0')]],
  };
  await prefetch(wide, Object.values(views).flat().flatMap(([, q]) => [q, q + '&beta=0']));
  const [controls, gated, cost] = [[], [], []];
  for (const [name, q] of views.controls) controls.push([name, await residual(q)]);
  for (const [name, q] of views.gated) gated.push([name, await residual(q)]);
  for (const [name, q] of views.cost) cost.push([name, await residual(q)]);
  const floor = mean(controls.flatMap(([, r]) => [r.row, r.col]));
  const show = (rows) => rows.map(([n, r]) => `${n} ${r.row.toFixed(3)}/${r.col.toFixed(3)}`).join(', ');
  t.diagnostic(`row/column residual over the cloud's own noise; floor ${floor.toFixed(3)} (controls ${show(controls)}); gated ${show(gated)}; accepted cost, not gated: ${show(cost)}`);
  assert.ok(floor <= MAX_STREAK_FLOOR, `the floor ${floor.toFixed(3)} at the diagonal control views is above ${MAX_STREAK_FLOOR}: relocation shows structure even there, so a comparison with it would mean nothing`);
  for (const [name, r] of gated) {
    for (const k of ['row', 'col']) {
      assert.ok(r[k] <= STREAK_K * floor, `${name}: the ${k === 'row' ? 'row' : 'column'} residual of the render minus its beta-0 twin is ${r[k].toFixed(3)}, above ${STREAK_K} × the floor ${floor.toFixed(3)} = ${(STREAK_K * floor).toFixed(3)}; relocation shows as ${k === 'row' ? 'horizontal' : 'vertical'} streaks there`);
    }
  }
});

test('the same seed builds the same cloud; another seed a different one', async (t) => {
  const a = await render(wide, at(0, 0, '&t=0&layer=text&seed=7'));
  const b = await render(wide, at(0, 0, '&t=0&layer=text&seed=7'));
  const c = await render(wide, at(0, 0, '&t=0&layer=text&seed=8'));
  let diff = 0;
  for (let i = 0; i < a.img.rgb.length; i++) diff += Math.abs(a.img.rgb[i] - c.img.rgb[i]);
  const meanDiff = diff / a.img.rgb.length;
  t.diagnostic(`counts seed 7: ${JSON.stringify(a.counts)} and ${JSON.stringify(b.counts)}; seed 8: ${JSON.stringify(c.counts)}; mean absolute difference 7 vs 8: ${meanDiff.toFixed(3)} per channel`);
  assert.ok(a.counts.text > 0, `seed 7 built no text particles (counts ${JSON.stringify(a.counts)})`);
  assert.deepEqual(b.counts, a.counts, 'seed 7 loaded twice gave different particle counts');
  assert.ok(Buffer.compare(Buffer.from(a.img.rgb), Buffer.from(b.img.rgb)) === 0, 'seed 7 loaded twice gave different text-layer images');
  assert.ok(meanDiff > 0.5, `seeds 7 and 8 gave nearly the same text-layer image (mean absolute difference ${meanDiff.toFixed(3)} per channel, need above 0.5)`);
});
