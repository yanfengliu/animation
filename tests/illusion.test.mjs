// Gate: the illusion (what the viewer sees from E and from elsewhere).
// Bound: headless Chromium with SwiftShader WebGL2, deviceScaleFactor 1, frozen particle clock
// (t), and only the viewports, times, zooms, views, seeds and β values listed below. The default
// seed is 1; "seeds 1–3" means the page rendered with each of seeds 1, 2 and 3 as the default seed,
// and the bounds marked so hold for the mean over those three. It measures light, colour and shape,
// not reading.
// Strokes come from the page's own text layer at the same view (blurred 3 px, thresholded 35% of
// the way from the median to the 99.5th percentile, kept to the central 84%×70% to skip the UI
// text); gaps are pixels of the text box ≥ 8 px from them. A zoomed view scales the blur and gap
// distance with the zoom and keeps exactly the stroke area the zoom predicts, so its mask cannot
// fatten where sprites merge. The test-only beta parameter (0..1) renders the same base cloud with
// another relocation rate; beta=0 relocates nothing and its text layer is the sky alone, so a
// render minus its beta-0 twin holds only what relocation changed. Because the mask comes from the
// render under test, legibility also requires it to match another seed's (relocated strokes follow
// the message, scattered particles the draw) and relocation to lift the stroke/gap ratio over the
// beta-0 render on the same mask (no relocation lifts it 1.01×).
// Proves:
// - at E the strokes are at least 1.48× brighter than the gaps, relocation lifts that ratio at
//   least 1.35×, and the strokes match across seeds, at t 0, 7.3 and 31 s, at 1280×800 and
//   390×844, at fov 32 and 80, and when 2D canvas readback (getImageData) returns zeros as
//   anti-fingerprinting browsers do;
// - at E at 1280×800 (t 0), with the letters' 14° lean undone, the strokes form two lines, the top
//   one narrower, with a full-height stem at the left end of the top line and the right end of the
//   bottom line and short letters at the other ends, so the text is neither mirrored nor turned
//   180°; and those two stems then stand within 4° of upright (seeds 1–3), so the letters lean
//   right by 14° ± 4°;
// - at 390×844 the whole stroke mask, measured across the full width, stays at least 8 px inside
//   the frame; the E text layer holds still over time and zoom only scales it;
// - from 25° out (±25° az and el, +60° az) the E strokes are no brighter than the back-view floor
//   + 0.09, and the floor stays below 1.19 (seeds 1–3; the back view is the floor itself, not a
//   case tested against it); the az+25 text layer, the only off-angle layer measured, is a smear
//   that changes with the seed;
// - every particle renders alike at every angle (owner directive, 2026-10-11): at E, 3° (el+3),
//   12° (az−12, 11.6° from E), az+25, el−25 and the back, at t 0 and 7.3, the text particles carry
//   the light (within 5%) and colour (warmth within 0.03) of the same particles drawn as ambient,
//   and at t 0 their sprite size (within 15%); the shipped render minus the sky equals the text
//   layer minus the sky plus the ambient layer minus the sky, pixel by pixel and channel by
//   channel, capped at 255 as the 8-bit target caps it (residual at most 0.1% of their light in
//   each channel; exactly 0 measured), so the shipped draw is the one those comparisons measured
//   and any effect it alone has (light, colour, size or focus) shows; and the scene's particle
//   light at E, 3° and 12° is within 15% of its mean over the three far views;
// - the camera's modes and time spent at E do not change the picture: E reached by "Find the
//   angle" (a real click and the glide), shot on arrival and again after 8 s idle there, and E held
//   by the tour, shot 6 s after its first frame late in its hold, render the central region as E
//   set by URL does, pixel by pixel and channel by channel (residual at most 0.1%; exactly 0
//   measured);
// - relocation leaves no streaks at az±25, az+60 and the back: the row and column residual of a
//   render minus its beta-0 twin stays within 2.1× each seed's floor, the mean residual at two
//   diagonal control views (seeds 1–3); and at el±25, where the text columns are the accepted cost,
//   the column residual stays below 1.95× the cloud's own noise (seeds 1–3), which is what the 14°
//   lean buys (upright letters give 2.1 and 2.3);
// - the same seed builds the same cloud and another seed a different one.
// Re-measure, do not retune: the seed-mean bounds sit between the real page and its mutants as
// measured for seeds 1–3 and checked for seeds 4–12 in threes (values beside each threshold). A
// change that redraws the cloud without changing the design (one more rand() call in buildCloud,
// another N_TOTAL, a glyph tweak that changes which particles relocate) moves every one of them. If
// a bound turns red after such a redraw, re-measure seeds 1–3 and the spread over further seeds
// (tmp-only scripts, as W11 did) and record what moved before touching the threshold.
// Does not prove: that a person can read the text; views, times or seeds not listed; real GPUs or
// device pixel ratios above 1 (the exact identities rest on SwiftShader's 8-bit additive blending);
// how the picture looks while the camera moves (mid-glide, mid-snap, mid-tour, a coast), since
// every view here is shot with the camera at rest or in the tour's hold; E reached any other way
// (a snap, the arrow keys); a reveal that waits longer than the dwells measured (8 s idle after the
// glide, 6 s at E in the tour's first hold); a reveal driven by the particle clock, since every
// shot freezes it with t, which the shipped page never sets; or a reveal confined to angles
// between the measured views (for example only 5–10° from E). Nor does it hold β at 0.85 (review
// round 3, F25; the lesson is in docs/learning/lessons.md). On the az+25 row residual over the
// cloud's own noise, as a mean over three seeds, β 0.85 measures 1.416, 1.693, 1.556 and 1.524 for
// seeds 1–3, 4–6, 7–9 and 10–12, and β 1.0 measures 1.637 (seeds 1–3) and 1.897 (seeds 4–6); per
// seed (1–6) β 1.0 changes it by −0.3% to +37%, +14% on average. So no bound on a three-seed mean
// tells them apart; a mean over about 12 seeds would, at about four times this file's cost.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, newContext, magic, render, waitFrames, state, until, sleep, PAGE_URL } from './lib/harness.mjs';
import { decodePng, luminance, strokeMask, strokeGapRatio, iou, scaleMask, lineLayout, unslant, edgeLean, lightOver, partsResidual, streakResidual } from './lib/image.mjs';

// Thresholds, each set from the real page and the mutants in tests/mutate.mjs (comments give the
// measured values, real page first, at 1280×800 and seed 1 unless named; "seeds 1–3" means the
// real page measured with each of seeds 1, 2 and 3 as the default seed, and "mean" the mean over
// those three; "in threes" means the same mean over seeds 4–6, 7–9 and 10–12, as redraws would give).
const MIN_RATIO_AT_E = 1.48;     // stroke/gap luminance at E: 1.58–1.68 real (seeds 1–3, both viewports), 1.55–1.59 fov 80; 1.25–1.37 β 0.2 (1.69 at fov 32, where its lift fails), 1.33 dolly and 1.34 no relocation at fov 80, 1.39 no relocation at 390
const MIN_LIFT = 1.35;           // that ratio over the beta-0 render's on the same mask: 1.48–1.61 real (seeds 1–3), 1.51–1.55 fov 80; 1.01–1.20 β 0.2, 1.01–1.03 no relocation
const MIN_SEED_IOU = 0.5;        // E strokes, default seed vs OTHER_SEED: ≥ 0.70 real (seeds 1–3); 0.37 β 0.2 and 0.42 no relocation, both at 390
const MIN_TIME_IOU = 0.8;        // E strokes t=0 vs later: 0.95 real; 0.66 when text particles drift across their sight lines
const MIN_SCALE_IOU = 0.7;       // zoomed strokes vs base strokes scaled: 0.84–0.89 (fov 32) and 0.95 (fov 80) real (seeds 1–3); 0.53 and 0.66 when zoom dollies the eye
const FLOOR_MARGIN = 0.09;       // mean excess over each seed's back-view floor from 25° out, per view: ≤ 0.036 real (az+25; ≤ 0.054 in threes; one seed alone reaches 0.075); 0.496 flat text (el+25). β 1.0 (0.046) and relocation without density compensation (0.062) stay inside it; other bounds catch the second
const MAX_BACK_FLOOR = 1.19;     // the back-view floor itself, mean: 1.126 real (1.106–1.144 in threes); 1.251 relocation without density compensation (1.241 for seeds 4–6), 1.209 flat text
const MAX_SMEAR_E_IOU = 0.25;    // az+25 text layer vs the E strokes: 0.12–0.15 real (seeds 1–3), 0.16 flat text (a coarse guard; the seed check tells them apart)
const MAX_SMEAR_SEED_IOU = 0.3;  // az+25 text layer, seed vs seed: 0.12 real (seeds 1–3), 0.57 flat text
const LIGHT_BAND = [0.95, 1.05]; // text / as-ambient light of the same particles: 0.994–1.006 real (seeds 1–3, every view, t 0 and 7.3); 1.24 at E with text 1.25× brighter near E, 1.58 with text sprites 1.25× wider, 1.17 with their blur cut 75%, and 1.38–1.41 at every view with text 1.4× brighter everywhere; 1.27–1.34 near E with flat text and 0.92 at az+25 and 1.06 at the back when relocation ignores density compensation, since both move text particles far from where they started
const MAX_WARMTH_GAP = 0.03;     // |text − as-ambient warmth|: ≤ 0.005 real (seeds 1–3, t 0 and 7.3); 0.126 at E and 0.096 at 3° with a 30% gold tint near E
const SIZE_BAND = [0.85, 1.15];  // text / as-ambient effective sprite area at SPARSE_BETA: 0.977–1.009 real (seeds 1–3); 1.49 at E and 1.34 at 3° with text sprites 1.25× wider near E
const MAX_RESIDUAL = 0.001;      // per channel, Σ|render − prediction| over the predicted light, for the shipped render against text layer + ambient layer − sky, and for each camera-mode shot against E set by URL: exactly 0 real (seeds 1–3, every alike view, t 0 and 7.3, not one channel value off; and every mode shot), where a prediction without the 255 cap would leave up to 0.0043 in blue from clipping alone; worst channel 0.025–0.036 at E and 3° with a 30% gold tint near E in the shipped draw only, 0.041–0.058 with a second text pass at 25% there (seeds 1–3); in the mode shots 0.039 with that tint after a glide, and 0.066 with text 1.25× brighter after a glide, during the tour, after 5 s idle at E or late in the tour's hold
const SCENE_BAND = [0.85, 1.15]; // scene particle light at E, 3° and 12° over its mean at the far views: 0.95–1.08 real (seeds 1–3, t 0 and 7.3); 1.35 with every particle 1.4× brighter near E
const DWELL_MS = 8000;           // idle at E after the glide before the second shot; the dwell mutant reveals after 5000
const TOUR_SHOT_MS = 6000;       // tour shot, from the page's first frame; the tour holds at E from that frame until 1000 + 2200 + 5000 ms later and a little more (index.html: startTour, then TOUR's 'E' and 'hold'). The shot never starts before TOUR_SHOT_MS, but under this file's own load its state reads and screenshot ended up to 1.36 s after it (W12 and W13 runs), so 6 s leaves them 2.2 s, where 6.5 s left 0.34 s at worst; the late-tour mutant reveals after 5000, a second before the shot
const STREAK_K = 2.1;            // mean streak residual over each seed's floor at az±25, az+60, back: ≤ 1.51 real (az+25 row; 1.77–1.91 in threes); 2.31 relocation without density compensation (az+25 row; 2.58 for seeds 4–6)
const MAX_STREAK_FLOOR = 1.3;    // the floor itself, mean: 0.94 real (0.87–0.91 in threes); 1.95 flat text
const MAX_EL_STREAK = 1.95;      // mean column residual over the cloud's own noise (not over the floor) at el+25 and at el−25: 1.37 and 1.49 real (≤ 1.65 in threes); 2.06 and 2.30 upright letters, 2.07 and 2.27 with a 5° lean. β 1.0 gives 1.67 and 1.70, inside it
const SLANT_DEG = 14;            // the letters' lean (SLANT in index.html), undone before the layout is measured
const LINE_WIDTH_RATIO = [0.76, 0.92]; // top/bottom line width at E, lean undone: 0.857 real, 1.155 turned 180°
const FULL_STEM = 0.8;           // end-strip height / line height at "h" and "d", lean undone: 0.94 and 0.96 real (0.94–0.99 seeds 1–3); 0.44 and 0.60 mirrored (its letters lean left, "o" and "w" are there), 0.63 and 0.58 with upright letters (0.68–0.75 at "h", seeds 2–3); a 5° lean keeps 0.85–0.93 (seeds 1–3), which MAX_LEAN catches
const SHORT_END = 0.7;           // the same at "o" and "w": 0.49 and 0.53 real; it catches no mutant alone, since a mirrored frame's stems lean the wrong way and fail FULL_STEM first
const MAX_LEAN = 4;              // degrees the "h" and "d" stems still lean once the 14° is undone, mean of the two, mean over seeds 1–3: 0.73 real (|≤ 0.89| in threes, |≤ 1.75| for any one seed); −8.1 with a 5° lean, −13.8 upright
const MIN_FIT_MARGIN = 8;        // px between the strokes and the frame edges at 390×844: 33–35 real (seeds 1–3), 0 without the phone widening
const SPARSE_BETA = 0.02;        // 121 text particles: separate sprites, so the effective area measures sprite size
const OTHER_SEED = 8;
const SEEDS = [1, 2, 3];
const DIM = { blur: 5, bandpass: 15 }; // masks of off-angle text layers: sky removed, dots merged
const CENTRE = [0.08, 0.92, 0.15, 0.85]; // the stroke-mask region: clear of the bar and the hint, whose hover and focus styles may differ
// Zoomed views scale the mask with the text: blur and gap distance follow the zoom factor s, and
// the mask keeps the base stroke area times s².
const scaled = (s, baseStrokes) => ({ blur: Math.max(1, Math.round(3 * s)), gapDist: Math.max(3, Math.round(8 * s)), area: Math.round(baseStrokes * s * s) });
const SLANT_LEAN = Math.tan((SLANT_DEG * Math.PI) / 180);

// Renders. The views the tests read through view() and need() are queued in `before`, in the
// order the tests use them, and pump() renders up to WIDTH of them at a time while the tests
// compute; a test first asks for its own views (need), which moves any not yet started to the
// front. pump() hands each wide view to the next of the four wide contexts in turn, one in each
// browser, without checking which browser is free, so two can render in one browser at once.
// Every phone view renders in browser 0 and every blind view in browser 1. SwiftShader draws each
// browser's pages in one GPU process. The camera-mode test opens its two pages beside the queue,
// and the seed test renders outside it. Each view is its own page with a frozen clock and a fixed
// seed, so the images are the same as one at a time in one browser. A view keeps its decoded
// image; its luminance is computed when first asked for.
const BROWSERS = 4, WIDTH = 4;
let browsers = [], wides = [], wide, phone, blind, E, P, turn = 0, busy = 0;
const cache = new Map(), queue = [], label = new Map();

function slot(context, query, urgent) {
  const key = `${label.get(context)}?${query}`;
  let v = cache.get(key);
  if (!v) {
    v = { context, query, started: false };
    v.promise = new Promise((resolve, reject) => Object.assign(v, { resolve, reject }));
    v.promise.catch(() => {});   // a failed view that no test awaits must not end the run on its own
    cache.set(key, v);
    if (urgent) queue.unshift(v); else queue.push(v);
  } else if (urgent && !v.started) {
    queue.splice(queue.indexOf(v), 1);
    queue.unshift(v);
  }
  return v;
}
function pump() {
  while (busy < WIDTH && queue.length) {
    const v = queue.shift();
    v.started = true; busy++;
    const via = v.context === wide ? wides[turn++ % wides.length] : v.context;
    render(via, v.query).then((r) => {
      let lum = null;
      v.resolve({ ...r, get lum() { return (lum ??= luminance(r.img)); } });
    }, v.reject).finally(() => { busy--; pump(); });
  }
}
const view = (context, query) => { const v = slot(context, query, true); pump(); return v.promise; };
const warm = (context, queries) => { for (const q of queries) slot(context, q, false); pump(); };
async function need([context, queries]) {
  const vs = [...new Set(queries)].reverse().map((q) => slot(context, q, true)).reverse();
  pump();
  const settled = await Promise.allSettled(vs.map((v) => v.promise));
  const failed = settled.find((s) => s.status === 'rejected');
  if (failed) throw failed.reason;
}

// Anti-fingerprinting browsers return blank canvas readback; the page must not depend on it.
const blankReadback = () => {
  CanvasRenderingContext2D.prototype.getImageData = function (x, y, w, h) { return new ImageData(Math.max(1, Math.abs(w)), Math.max(1, Math.abs(h))); };
};

const at = (daz, del, extra = '') => `az=${E.az + daz}&el=${E.el + del}&tour=0${extra}`;
const back = (extra = '') => `az=${E.az + 180}&el=${-E.el}&tour=0${extra}`;
const seeded = (q, s) => (s === 1 ? q : `${q}&seed=${s}`);
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const legibilityViews = (query) => [query + '&layer=text', `${query}&seed=${OTHER_SEED}&layer=text`, query, query + '&beta=0'];
const OFF = () => [['az+25', at(25, 0, '&t=0')], ['az-25', at(-25, 0, '&t=0')], ['el+25', at(0, 25, '&t=0')], ['el-25', at(0, -25, '&t=0')], ['az+60', at(60, 0, '&t=0')]];
// The alike views, each as a function of the time suffix; the first three are near E.
const ALIKE = () => [['E', (x) => at(0, 0, x)], ['3° (el+3)', (x) => at(0, 3, x)], ['12° (az−12)', (x) => at(-12, 0, x)], ['az+25', (x) => at(25, 0, x)], ['el−25', (x) => at(0, -25, x)], ['back', (x) => back(x)]];
const ALIKE_TIMES = ['0', '7.3'];
const alikeViews = (q, sparse) => [q, q + '&beta=0', q + '&beta=0&layer=text', q + '&layer=text', q + '&layer=ambient', ...(sparse ? [q + `&beta=${SPARSE_BETA}&layer=text`, q + `&beta=${SPARSE_BETA}&layer=ambient`] : [])];
const STREAK = () => ({
  controls: [['az+90 el+36', at(90, 36, '&t=0')], ['az-120 el+30', at(-120, 30, '&t=0')]],
  gated: [['az+25', at(25, 0, '&t=0')], ['az-25', at(-25, 0, '&t=0')], ['az+60', at(60, 0, '&t=0')], ['back', back('&t=0')]],
  cost: [['el+25', at(0, 25, '&t=0')], ['el-25', at(0, -25, '&t=0')]],
});

before(async () => {
  // If one launch fails, the browsers that did start are closed before the error is passed on,
  // since an open browser would keep this file's process, and a whole mutation run, waiting.
  const launched = await Promise.allSettled(Array.from({ length: BROWSERS }, () => startBrowser()));
  browsers = launched.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const failed = launched.find((r) => r.status === 'rejected');
  if (failed) {
    await Promise.allSettled(browsers.map((b) => b.close()));
    browsers = [];
    throw failed.reason;
  }
  wides = await Promise.all(browsers.map(async (b) => (await newContext(b, { width: 1280, height: 800 })).context));
  wide = wides[0];
  phone = (await newContext(browsers[0], { width: 390, height: 844 })).context;
  blind = (await newContext(browsers[1], { width: 1280, height: 800, initScript: blankReadback })).context;
  for (const [c, name] of [[wide, 'wide'], [phone, 'phone'], [blind, 'blind']]) label.set(c, name);
  E = await magic(wide);
  // Each test's views, in test order; `before` queues them all.
  P = {
    legible: [wide, ['0', '7.3', '31'].flatMap((time) => legibilityViews(at(0, 0, `&t=${time}`)))],
    phone: [phone, legibilityViews(at(0, 0, '&t=0'))],
    layout: [wide, SEEDS.map((s) => seeded(at(0, 0, '&t=0'), s) + '&layer=text')],
    blind: [blind, legibilityViews(at(0, 0, '&t=0'))],
    zoom: [wide, [at(0, 0, '&t=0&layer=text'), at(0, 0, '&t=0'), ...[32, 80].flatMap((fov) => legibilityViews(at(0, 0, `&t=0&fov=${fov}`)))]],
    still: [wide, ['0', '7.3', '31'].map((time) => at(0, 0, `&t=${time}&layer=text`))],
    hidden: [wide, SEEDS.flatMap((s) => [seeded(at(0, 0, '&t=0'), s) + '&layer=text', seeded(back('&t=0'), s), ...OFF().map(([, q]) => seeded(q, s))])],
    smear: [wide, [at(0, 0, '&t=0&layer=text'), at(25, 0, '&t=0&layer=text'), at(25, 0, `&t=0&seed=${OTHER_SEED}&layer=text`)]],
    alike: [wide, ALIKE_TIMES.flatMap((time) => ALIKE().flatMap(([, f]) => alikeViews(f(`&t=${time}`), time === '0')))],
    modes: [wide, [at(0, 0, '&t=0'), at(0, 0, '&t=0&beta=0&layer=text')]],
    streak: [wide, SEEDS.flatMap((s) => Object.values(STREAK()).flat().flatMap(([, q]) => [seeded(q, s), seeded(q, s) + '&beta=0']))],
  };
  for (const entry of Object.values(P)) warm(...entry);
});
after(async () => { await Promise.all(browsers.map((b) => b.close())); });

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
const assertNone = (broken, lead = '') => assert.ok(broken.length === 0, lead + broken.join('; '));
const describe = (name, L) => `${name}: ratio ${L.ratio.toFixed(3)}, lift over beta=0 ${L.lift.toFixed(3)}, seed IoU ${L.seedIoU.toFixed(3)}, strokes ${L.strokes} px, gaps ${L.gaps} px`;

test('legible at E at 1280×800 for t = 0, 7.3 and 31 s', async (t) => {
  await need(P.legible);
  const rows = [];
  for (const time of ['0', '7.3', '31']) rows.push([`E t=${time}`, await legibility(wide, at(0, 0, `&t=${time}`))]);
  for (const [name, L] of rows) t.diagnostic(describe(name, L));
  assertNone(rows.flatMap(([name, L]) => illegible(name, L)));
});

test('legible at E at 390×844', async (t) => {
  await need(P.phone);
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
// frame) leave those strips short. The stems' own lean is then measured along the outer ink edge
// of each line (the left edge of "h", the right edge of "d"), so a lean a few degrees off 14°,
// which the strips still pass, fails too.
test('at E the message reads "hello" over "world", left to right, in letters leaning 14°', async (t) => {
  await need(P.layout);
  const m = await strokesAt(wide, at(0, 0, '&t=0'));
  const L = lineLayout(unslant(m, SLANT_LEAN));
  assert.ok(L, `the E strokes (box ${JSON.stringify(m.box)}) have no empty row between two lines`);
  const leans = [];
  for (const s of SEEDS) {
    const u = unslant(s === 1 ? m : await strokesAt(wide, seeded(at(0, 0, '&t=0'), s)), SLANT_LEAN);
    const Ls = lineLayout(u);
    assert.ok(Ls, `seed ${s}: the E strokes, lean undone, have no empty row between two lines`);
    const h = edgeLean(u, Ls.top, 'left').lean, d = edgeLean(u, Ls.bottom, 'right').lean;
    leans.push({ s, h, d, both: (h + d) / 2 });
  }
  const lean = mean(leans.map((l) => l.both));
  const { top, bottom } = L;
  const widthRatio = top.width / bottom.width;
  const ends = { hLeft: top.left / top.height, oRight: top.right / top.height, wLeft: bottom.left / bottom.height, dRight: bottom.right / bottom.height };
  t.diagnostic(`gap ${L.gap} px; top ${JSON.stringify(top)}; bottom ${JSON.stringify(bottom)}; width ratio ${widthRatio.toFixed(3)}; end heights / line height ${Object.entries(ends).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(', ')}`);
  t.diagnostic(`lean left in the stems once ${SLANT_DEG}° is undone (degrees, + leans right): ${leans.map((l) => `seed ${l.s} "h" ${l.h.toFixed(2)}, "d" ${l.d.toFixed(2)}`).join('; ')}; mean ${lean.toFixed(2)}`);
  assert.ok(L.gap >= 3, `the two lines are only ${L.gap} px apart`);
  assert.ok(widthRatio >= LINE_WIDTH_RATIO[0] && widthRatio <= LINE_WIDTH_RATIO[1], `the top line is ${top.width} px wide and the bottom line ${bottom.width} px (ratio ${widthRatio.toFixed(3)}); "hello" over "world" gives about 0.84, so it must be within ${LINE_WIDTH_RATIO.join('–')} (a frame turned 180° gives about 1.19)`);
  assert.ok(ends.hLeft >= FULL_STEM, `with the letters' ${SLANT_DEG}° lean undone, the left end of the top line is only ${ends.hLeft.toFixed(2)} of the line height; the "h" stem there must reach at least ${FULL_STEM} (a mirrored frame puts "o" there, and letters that do not lean about ${SLANT_DEG}° leave the stem slanted across the strip)`);
  assert.ok(ends.dRight >= FULL_STEM, `with the letters' ${SLANT_DEG}° lean undone, the right end of the bottom line is only ${ends.dRight.toFixed(2)} of the line height; the "d" stem there must reach at least ${FULL_STEM} (a mirrored frame puts "w" there, and letters that do not lean about ${SLANT_DEG}° leave the stem slanted across the strip)`);
  assert.ok(ends.oRight <= SHORT_END, `the right end of the top line is ${ends.oRight.toFixed(2)} of the line height; the "o" there must stay at or below ${SHORT_END}`);
  assert.ok(ends.wLeft <= SHORT_END, `the left end of the bottom line is ${ends.wLeft.toFixed(2)} of the line height; the "w" there must stay at or below ${SHORT_END}`);
  assert.ok(Math.abs(lean) <= MAX_LEAN, `with ${SLANT_DEG}° undone, the "h" and "d" stems still lean ${lean.toFixed(2)}° (mean over seeds ${SEEDS.join(', ')}; + is to the right), so the letters lean about ${(SLANT_DEG + lean).toFixed(1)}°, not ${SLANT_DEG}° ± ${MAX_LEAN}°; the lean spreads the stems over many screen columns, so from above and below E they do not show as vertical streaks`);
});

test('at 390×844 the whole message fits inside the frame', async (t) => {
  await need(P.phone);
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
  await need(P.blind);
  const L = await legibility(blind, at(0, 0, '&t=0'));
  t.diagnostic(describe('E with blank getImageData', L));
  assertNone(illegible('E with blank getImageData', L));
});

test('legible at E zoomed in and out, and zoom only scales the image', async (t) => {
  await need(P.zoom);
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
  await need(P.still);
  const m0 = await strokesAt(wide, at(0, 0, '&t=0'));
  const rows = [];
  for (const time of ['7.3', '31']) rows.push([time, iou(m0.mask, (await strokesAt(wide, at(0, 0, `&t=${time}`))).mask)]);
  for (const [time, overlap] of rows) t.diagnostic(`IoU t=0 vs t=${time}: ${overlap.toFixed(3)}`);
  for (const [time, overlap] of rows) {
    assert.ok(overlap >= MIN_TIME_IOU, `text-layer strokes at t=0 and t=${time} overlap with IoU ${overlap.toFixed(3)}, below ${MIN_TIME_IOU}; text particles move across their sight lines`);
  }
});

// el±25 is in this test: the stem streaks there (the accepted cost, see the residual test) fall
// mostly off the E strokes, so the E strokes themselves stay at the floor. Each seed's views are
// measured on that seed's own E strokes and back-view floor; the bounds hold for the seed mean.
test('hidden from 25° out: E strokes no brighter than the back-view floor (seeds 1–3)', async (t) => {
  await need(P.hidden);
  const per = [];
  for (const s of SEEDS) {
    const m = await strokesAt(wide, seeded(at(0, 0, '&t=0'), s));
    const ratio = async (q) => strokeGapRatio((await view(wide, seeded(q, s))).lum, m);
    const floor = await ratio(back('&t=0'));
    const excess = {};
    for (const [name, q] of OFF()) excess[name] = (await ratio(q)) - floor;
    per.push({ s, floor, excess });
  }
  const floor = mean(per.map((p) => p.floor));
  const excess = OFF().map(([name]) => [name, mean(per.map((p) => p.excess[name]))]);
  for (const p of per) t.diagnostic(`seed ${p.s}: back-view floor ${p.floor.toFixed(3)}; excess over it ${Object.entries(p.excess).map(([n, x]) => `${n} ${x.toFixed(3)}`).join(', ')}`);
  t.diagnostic(`mean over seeds ${SEEDS.join(', ')}: floor ${floor.toFixed(3)}; excess ${excess.map(([n, x]) => `${n} ${x.toFixed(3)}`).join(', ')}`);
  const broken = [];
  if (!(floor < MAX_BACK_FLOOR)) broken.push(`the back-view floor ${floor.toFixed(3)} is not below ${MAX_BACK_FLOOR}: the E strokes show from behind, so a comparison with it would mean nothing`);
  for (const [name, x] of excess) if (!(x <= FLOOR_MARGIN)) broken.push(`${name}: the E strokes' stroke/gap ratio exceeds the back-view floor by ${x.toFixed(3)}, more than ${FLOOR_MARGIN}`);
  assertNone(broken, `from 25° out the E strokes must not show (means over seeds ${SEEDS.join(', ')}), but `);
});

test('the text layer at +25° az is smeared', async (t) => {
  await need(P.smear);
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
// The comparisons above read only the test-only draws (layer=text, layer=ambient, beta=0). The
// shipped draw (no layer) adds both classes in one pass. The page blends ONE/ONE into an 8-bit
// target with no depth buffer and computes depth of field per sprite, so each fragment adds the
// same rounded amount whatever lies under it. So pixel by pixel and channel by channel the
// shipped render minus the sky is the text layer minus the sky plus the ambient layer minus the
// sky, capped at 255 as the target caps it (exactly, as measured). Any effect in the shipped draw
// that the test-only draws lack, in light, colour, size or focus, breaks that identity. Returns
// the shipped render's particle light over the sky and the identity's residual (partsResidual).
async function shipped(q) {
  const img = async (x) => (await view(wide, x)).img;
  const sky = await img(q + '&beta=0&layer=text'), full = await img(q);
  return { full: lightOver(full, sky).light, identity: partsResidual(full, sky, [await img(q + '&layer=text'), await img(q + '&layer=ambient')]) };
}
const rgb = (a, digits = 4) => a.map((x) => x.toFixed(digits)).join('/');

test('every particle renders alike at every angle: no reveal near E', async (t) => {
  await need(P.alike);
  const rows = [];
  for (const time of ALIKE_TIMES) {
    const views = ALIKE();
    const here = [];
    for (const [k, [name, f]] of views.entries()) {
      const q = f(`&t=${time}`);
      const d = await drawnBothWays(q), s = time === '0' ? await drawnBothWays(q, SPARSE_BETA) : null;
      const sh = await shipped(q);
      here.push({ name: `${name} t=${time}`, near: k < 3, light: d.light, warmth: d.warmth, size: s?.size, identity: sh.identity, scene: sh.full });
    }
    const far = mean(here.filter((r) => !r.near).map((r) => r.scene));
    for (const r of here) rows.push({ ...r, scene: r.scene / far });
  }
  for (const r of rows) t.diagnostic(`${r.name}: text/as-ambient light ${r.light.toFixed(3)}, warmth difference ${r.warmth.toFixed(3)}${r.size === undefined ? '' : `, sprite size ratio (beta ${SPARSE_BETA}) ${r.size.toFixed(3)}`}, shipped − (text + ambient − sky) residual r/g/b ${rgb(r.identity.abs)} (signed ${rgb(r.identity.signed)}, ${(100 * r.identity.off).toFixed(3)}% of pixels off by more than 2 levels), scene light / far mean ${r.scene.toFixed(3)}`);
  // Every broken bound is named in one message, so a failure shows each way the particles differ.
  const broken = [];
  for (const r of rows) {
    if (!(r.light >= LIGHT_BAND[0] && r.light <= LIGHT_BAND[1])) broken.push(`${r.name}: the text particles carry ${r.light.toFixed(3)}× the light of the same particles drawn as ambient (must be within ${LIGHT_BAND.join('–')})`);
    if (!(Math.abs(r.warmth) <= MAX_WARMTH_GAP)) broken.push(`${r.name}: their light is warmer than the same particles drawn as ambient by ${r.warmth.toFixed(3)} (red−blue over red+blue; must be within ±${MAX_WARMTH_GAP})`);
    if (r.size !== undefined && !(r.size >= SIZE_BAND[0] && r.size <= SIZE_BAND[1])) broken.push(`${r.name}: their sprites cover ${r.size.toFixed(3)}× the effective area of the same particles drawn as ambient at beta ${SPARSE_BETA} (must be within ${SIZE_BAND.join('–')})`);
    if (!r.identity.abs.every((x) => x <= MAX_RESIDUAL)) broken.push(`${r.name}: the shipped render differs from the text layer plus the ambient layer (over the sky, capped at 255) by ${rgb(r.identity.abs)} of their light in red/green/blue (signed ${rgb(r.identity.signed)}; ${(100 * r.identity.off).toFixed(3)}% of pixels off by more than 2 levels); each must be at most ${MAX_RESIDUAL}, so the shipped draw renders the particles differently from the draws compared here`);
    if (r.near && !(r.scene >= SCENE_BAND[0] && r.scene <= SCENE_BAND[1])) broken.push(`${r.name}: the scene's particle light is ${r.scene.toFixed(3)}× its mean at az+25, el−25 and the back (must be within ${SCENE_BAND.join('–')})`);
  }
  assertNone(broken, 'every particle must render alike at every angle, but ');
});

// Every other view is set by URL with the camera at rest and shot within about a second of the
// page's first frame. The camera's modes, and time spent at E, must not change the picture either.
// - The glide starts at az+40, el−10 from a real click on "Find the angle" and ends idle at E. It
//   is shot on arrival, and again after DWELL_MS more idle there.
// - The tour starts at E (no tour=0). It holds 1 s, eases from E to E for 2.2 s and holds 5 s
//   (index.html: startTour, then TOUR's 'E' and 'hold'), so it stays at E from its first frame
//   until 8.2 s later, plus up to a frame at each of those steps. An init script on that page
//   records when its first animation frame runs, passing every frame request through unchanged,
//   and the tour is shot TOUR_SHOT_MS after that frame, late in the hold.
// Each shot is compared with E set by URL (t 0, the clock frozen), and the dwell shot also with
// the arrival shot, pixel by pixel and channel by channel over the central region, clear of the
// bar and the hint.
test('E reached by "Find the angle", then idle there, or held by the tour renders as E set by URL, pixel for pixel', async (t) => {
  await need(P.modes);
  const sky = (await view(wide, at(0, 0, '&t=0&beta=0&layer=text'))).img;
  const byUrl = (await view(wide, at(0, 0, '&t=0'))).img;
  const shoot = async (page) => decodePng(await page.screenshot({ animations: 'disabled' }));
  const glide = async () => {
    const page = await wides[1].newPage();
    try {
      await page.goto(PAGE_URL + '?' + at(40, -10, '&t=0'));
      await waitFrames(page);
      await page.click('#find');
      await until(page, () => window.__cloud.mode() === 'idle' && window.__cloud.alignment() < 1e-6, null, 10000, 'the glide coming to rest at E');
      const landed = await page.evaluate(() => performance.now());
      await page.mouse.move(640, 400);                // off the button, so it shows no hover style
      const arrived = { img: await shoot(page), s: await state(page) };
      await sleep(DWELL_MS);
      const s0 = await state(page), idle = (await page.evaluate(() => performance.now())) - landed;
      const img = await shoot(page);
      return { arrived, dwell: { img, s0, s: await state(page), idle } };
    } finally { await page.close(); }
  };
  const tour = async () => {
    const page = await wides[2].newPage();
    try {
      await page.addInitScript(() => {
        const raf = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = (cb) => raf((ts) => { window.__firstFrame ??= performance.now(); cb(ts); });
      });
      await page.goto(`${PAGE_URL}?az=${E.az}&el=${E.el}&t=0`);
      await waitFrames(page, 1);
      const since = () => page.evaluate(() => performance.now() - window.__firstFrame);
      await sleep(Math.max(0, TOUR_SHOT_MS - (await since())));
      const s0 = await state(page), from = await since();
      const img = await shoot(page);
      return { img, s0, s: await state(page), from, to: await since() };
    } finally { await page.close(); }
  };
  const [g, h] = await Promise.all([glide(), tour()]);
  const idle = `${(g.dwell.idle / 1000).toFixed(1)} s idle`, span = `${(h.from / 1000).toFixed(2)}–${(h.to / 1000).toFixed(2)} s after its first frame`;
  const rows = [
    ['the glide on arrival', g.arrived.img, byUrl, 'E set by URL'],
    [`the glide after ${idle} at E`, g.dwell.img, byUrl, 'E set by URL'],
    [`the glide after ${idle} at E`, g.dwell.img, g.arrived.img, 'the same page on arrival'],
    [`the tour ${span}`, h.img, byUrl, 'E set by URL'],
  ].map(([name, img, ref, against]) => ({ name, against, d: partsResidual(img, sky, [ref], { region: CENTRE }) }));
  const show = (s) => `${s.mode}, ${s.align.toFixed(6)}° from E`;
  t.diagnostic(`glide: on arrival ${show(g.arrived.s)}; after ${idle} ${show(g.dwell.s0)} → ${show(g.dwell.s)}. Tour: shot ${span}, ${show(h.s0)} → ${show(h.s)}`);
  for (const r of rows) t.diagnostic(`${r.name} against ${r.against}: central residual r/g/b ${rgb(r.d.abs)} (signed ${rgb(r.d.signed)}; ${(100 * r.d.off).toFixed(3)}% of pixels off by more than 2 levels)`);
  const held = (s, mode) => s.mode === mode && s.align < 1e-6;
  assert.ok(held(g.dwell.s0, 'idle') && held(g.dwell.s, 'idle'), `the glide did not stay idle at E through the dwell shot: before ${JSON.stringify(g.dwell.s0)}, after ${JSON.stringify(g.dwell.s)}`);
  assert.ok(held(h.s0, 'tour') && held(h.s, 'tour'), `the tour was not in its hold at E when shot ${span} (it holds at E until about 8.2 s after its first frame): before ${JSON.stringify(h.s0)}, after ${JSON.stringify(h.s)}`);
  const broken = rows.filter((r) => !r.d.abs.every((x) => x <= MAX_RESIDUAL)).map((r) => `${r.name}: the central region differs from ${r.against} by ${rgb(r.d.abs)} of its light in red/green/blue (signed ${rgb(r.d.signed)}; ${(100 * r.d.off).toFixed(3)}% of pixels off by more than 2 levels); each must be at most ${MAX_RESIDUAL}`);
  assertNone(broken, 'the camera mode and the time spent at E must not change how E renders, but ');
});

// The residual compares each render with its beta-0 twin (the same cloud, nothing relocated); a
// seed's floor is the mean residual at its two diagonal control views. At el±25 the text columns
// survive the turn as faint streaks, the accepted cost, held to an absolute bound over the
// cloud's own noise; the az±25 rows are reported over that noise too, ungated (see the header on β).
test('relocation leaves no streaks at az±25, az+60 or the back, and el±25 stays below the bound (seeds 1–3)', async (t) => {
  await need(P.streak);
  const residual = async (q) => streakResidual((await view(wide, q)).lum, (await view(wide, q + '&beta=0')).lum, 1280, 800);
  const V = STREAK(), per = [];
  for (const s of SEEDS) {
    const r = {};
    for (const [name, q] of Object.values(V).flat()) r[name] = await residual(seeded(q, s));
    per.push({ s, r, floor: mean(V.controls.flatMap(([name]) => [r[name].row, r[name].col])) });
  }
  const show = (p, names) => names.map(([n]) => `${n} ${p.r[n].row.toFixed(3)}/${p.r[n].col.toFixed(3)}`).join(', ');
  for (const p of per) t.diagnostic(`seed ${p.s}: row/column residual over the cloud's own noise; floor ${p.floor.toFixed(3)} (controls ${show(p, V.controls)}); gated ${show(p, V.gated)}; el±25 ${show(p, V.cost)}`);
  const floor = mean(per.map((p) => p.floor));
  const gated = V.gated.flatMap(([n]) => ['row', 'col'].map((k) => [n, k, mean(per.map((p) => p.r[n][k] / p.floor))]));
  const cost = V.cost.map(([n]) => [n, mean(per.map((p) => p.r[n].col))]);
  const azRows = ['az+25', 'az-25'].map((n) => `${n} ${mean(per.map((p) => p.r[n].row)).toFixed(3)}`).join(', ');
  t.diagnostic(`mean over seeds ${SEEDS.join(', ')}: floor ${floor.toFixed(3)}; gated over the floor ${gated.map(([n, k, v]) => `${n} ${k} ${v.toFixed(3)}`).join(', ')}; el±25 column ${cost.map(([n, v]) => `${n} ${v.toFixed(3)}`).join(', ')}; az±25 row over the noise (not gated) ${azRows}`);
  const broken = [];
  if (!(floor <= MAX_STREAK_FLOOR)) broken.push(`the floor ${floor.toFixed(3)} at the diagonal control views is above ${MAX_STREAK_FLOOR}: relocation shows structure even there, so a comparison with it would mean nothing`);
  for (const [n, k, v] of gated) if (!(v <= STREAK_K)) broken.push(`${n}: the ${k} residual of the render minus its beta-0 twin is ${v.toFixed(3)}× the floor, above ${STREAK_K}×; relocation shows as ${k === 'row' ? 'horizontal' : 'vertical'} streaks there`);
  for (const [n, v] of cost) if (!(v <= MAX_EL_STREAK)) broken.push(`${n}: the column residual is ${v.toFixed(3)}× the cloud's own noise, above ${MAX_EL_STREAK}; the letter stems show as vertical streaks from ${n.startsWith('el+') ? 'above' : 'below'} E`);
  assertNone(broken, `relocation must not show as streaks (means over seeds ${SEEDS.join(', ')}), but `);
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
