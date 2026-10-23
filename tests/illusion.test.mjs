// Gate: the illusion (what the viewer sees from each message's eye and from elsewhere).
// Bound: headless Chromium with SwiftShader WebGL2, deviceScaleFactor 1, frozen particle clock
// (t), and only the viewports, times, zooms, views, seeds and β values listed below. The eyes are
// the ones in tests/lib/messages.mjs, not the ones the page reports, so a page that forms a message
// for another eye cannot carry the views with it. The default seed is 1; "seeds 1–3" means the page
// rendered with each of seeds 1, 2 and 3 as the default seed, and the bounds marked so hold for the
// mean over those three. It measures light, colour and shape, not reading.
// A message's strokes come from its own text layer (textof=<name>&layer=text) over the sky (the
// beta=0 text layer, which draws no particles) at the same view: blurred 3 px, thresholded 35% of
// the way from the median to the 99.5th percentile, kept to the central 84%×70% to skip the UI text;
// gaps are pixels of the text box ≥ 8 px from them. A zoomed view scales the blur and gap distance
// with the zoom and keeps exactly the stroke area the zoom predicts, so its mask cannot fatten where
// sprites merge. The test-only beta parameter (0..1) renders the same base cloud with another
// relocation rate; beta=0 relocates nothing, so a render minus its beta-0 twin holds only what
// relocation changed. Because the mask comes from the render under test, legibility also requires
// it to match another seed's (relocated strokes follow the message, scattered particles the draw)
// and relocation to lift the stroke/gap ratio over the beta-0 render on the same mask.
// Proves:
// - at each of the six eyes the message's strokes are at least MIN_RATIO× brighter than its gaps,
//   relocation lifts that ratio at least MIN_LIFT×, and the strokes match across seeds, at 1280×800
//   and 390×844 (t 0); for hello world also at t 7.3 and 31 s, at fov 32 and 80, and when 2D canvas
//   readback (getImageData) returns zeros as anti-fingerprinting browsers do;
// - at hello world's eye E at 1280×800 (t 0), with the letters' 14° lean undone, the strokes form two
//   lines, the top one narrower, with a full-height stem at the left end of the top line and the
//   right end of the bottom line and short letters at the other ends, so the text is neither
//   mirrored nor turned 180°; and those two stems then stand within 4° of upright (seeds 1–3), so the
//   letters lean right by 14° ± 4°;
// - at 390×844 every message's strokes, measured across the full width, stay at least 8 px inside
//   the frame; hello world's text layer at E holds still over time and zoom only scales it;
// - no message shows away from its eye: at each of the other five eyes and midway to each of its
//   two neighbours (seed 1), and at its antipode (az+180°, −el), at the three far views and for hello
//   world also 25° above and below E (means over seeds 1–3), relocation lifts the
//   stroke/gap ratio on the message's ghost mask at most MAX_GHOST_LIFT× over the same view at
//   beta=0. The ghost mask is laid at that view, from that message's own text layer there for
//   OTHER_SEED, so it follows wherever the message's particles gather there (a mirrored, radially
//   smeared copy near its antipode), and only shape that repeats across seeds, the message's, lifts
//   the ratio of seeds 1–3; hello world's own text layer at az+25 is a smear that changes with the seed;
// - every particle renders alike at every angle (owner directive, 2026-10-11): at E, 3° (el+3), 12°
//   (az−12, 11.6° from E) and three far views at least 40° from every eye, at t 0 and 7.3, and at the
//   other five eyes at t 0, the text particles carry the light (within LIGHT_BAND) and the colour
//   balance (red, green and blue each within 3%, over pixels no channel clips, which may be at most
//   MAX_CLIPPED of each image's lit pixels) of the same particles drawn as ambient, and at t 0 their
//   sprite size (within 15%); at each eye, at OWN_BETA, that message's own particles carry the light
//   of the same particles drawn as ambient (within OWN_LIGHT_BAND), so a reveal in one message's
//   particles is not diluted by the other five; the shipped render minus the sky
//   equals the text layer minus the sky plus the ambient layer minus the sky, pixel by pixel and
//   channel by channel, capped at 255 as the 8-bit target caps it (residual at most 0.1% of their
//   light in each channel; at most 0.0013% measured), so the shipped draw is the one those comparisons
//   measured and any effect it alone has (light, colour, size or focus) shows; and the scene's
//   particle light at E, 3°, 12° and every other eye is within 15% of its mean over the far views,
//   and at each eye (t 0) within SCENE_RING_BAND of its mean at the two midpoints beside it, which
//   follow the light's slow change from view to view, so a whole-scene glow near an eye shows;
// - the camera's modes and time spent at E do not change the picture: E reached by "Find the angle"
//   (a real click and the glide), shot on arrival and again after 8 s idle there, and E held by the
//   tour at load started from the shipped start view, shot at least 1.5 s into its 3 s hold at E
//   (about 1.5–1.6 s measured), 6.6 s or more after its first frame, render the central region as E set by URL does,
//   pixel by pixel and channel by channel (residual at most 0.1%; each shot's diagnostic counts the
//   channel values that differ);
// - relocation leaves no streaks midway from hello world to its neighbours or at its back view: the
//   row and column residual of a render minus its beta-0 twin stays within STREAK_K× each seed's
//   floor, the mean residual at two far control views (seeds 1–3), and the floor stays below
//   MAX_STREAK_FLOOR; at el±25, where the text columns are the accepted cost, the column residual
//   stays below MAX_EL_STREAK× the floor and below MAX_EL_STREAK_ABS× the cloud's own noise (seeds
//   1–3), which is what the 14° lean buys;
// - the same seed builds the same cloud and another seed a different one.
// Re-measure, do not retune: every bound sits between the real page and its mutants as measured for
// the seeds its check reads (seed 1, or the mean over seeds 1–3), and the page also passes it for
// seeds 4–12 (values beside each threshold; "in threes" means the mean over seeds 4–6, 7–9 and
// 10–12, as redraws would give), except these, which were measured for seed 1 only: MIN_TIME_IOU,
// MIN_SCALE_IOU and the two smear bounds; MIN_RATIO and MIN_LIFT at hello world's views at t 7.3 and
// 31 s and at fov 32 and 80; and MAX_RESIDUAL for the camera-mode shots. A change that redraws the cloud without
// changing the design (one more rand() call in buildCloud, another N_TOTAL, a glyph tweak, another
// eye) moves every one of them. If a bound turns red after such a redraw, re-measure seeds 1–3 and
// the spread over further seeds (tmp-only scripts, as W11 and W17 did) and record what moved before
// touching the threshold.
// MAX_CLIPPED and OWN_LIGHT_BAND partly measure the 8-bit cap, not a difference between text and
// ambient particles. So a change that keeps every particle alike but raises clipping (bigger
// sprites, more particles, a brighter palette; values beside them) can turn "renders alike" red:
// look at clipping before reading a red there as a reveal (review round 1, F82).
// Does not prove: that a person can read the text; views, times or seeds not listed (for the other
// five messages only t 0, seed 1 and the default zoom at each viewport; their layout, zoom and
// readback are not measured); real GPUs or device pixel ratios above 1 (the exact identities rest on SwiftShader's
// 8-bit additive blending without dithering: WebGL dithers by default and the page does not turn it
// off); how the picture looks while the camera moves (mid-glide, mid-snap, mid-tour, a coast), since
// every view here is shot with the camera at rest or in the tour's hold; E reached any other way (a
// snap, the arrow keys, Play, capture mode) or any other eye reached by the camera at all; a reveal
// that waits longer than the dwells measured (8 s idle after the glide; in the tour's first hold at E,
// the time up to the shot, at least 1.5 s as checked, so a reveal in the rest of its 3 s passes); a
// reveal driven by the particle clock, since every shot freezes it with t, which the shipped page
// never sets; a reveal shown only on a URL without t, as a visitor's is, since every view here sets t
// and every view but the tour's sets az and el too; a reveal confined to angles between the measured
// views (for example only 5–10° from an eye); a light reveal of up to 5% (8% at E, where the 8-bit
// cap holds the ratio at 0.97: text 1.08× brighter near E reads 1.038) or a fall of up to 7%, a
// colour shift of up to 3% in a channel or a size change of up to 15%, which the bands pass; a colour
// change in the pixels the colour check leaves out (at most MAX_CLIPPED of each image's lit pixels,
// but at E they hold 32% of the text layer's light), or one confined to one message's particles,
// whose share of the whole text layer dilutes it (only their light is compared on its own, and
// OWN_LIGHT_BAND passes them 6.1–10.1% brighter or 6.8–10.0% dimmer at their eye, seed 1); a
// whole-scene glow near an eye below 5.5% at E or 3.1–4.8% at the other eyes (for a glow that fades
// out by 12°), or a wider one as far as it lights the midpoints beside the eye too.
// Nor does it hold β at 0.85 (review round 3, F25; the lesson is in docs/learning/lessons.md).
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, newContext, render, waitFrames, state, until, sleep, PAGE_URL } from './lib/harness.mjs';
import { decodePng, crop, luminance, lumOver, strokeMask, strokeGapRatio, iou, scaleMask, lineLayout, unslant, edgeLean, lightOver, balanceOver, partsResidual, streakResidual } from './lib/image.mjs';
import { MESSAGES, midpoint } from './lib/messages.mjs';

// Thresholds, each set from the real page and the mutants in tests/mutate.mjs (comments give the
// measured values, real page first, at 1280×800 and seed 1 unless named).
const MIN_RATIO = 1.5;           // stroke/gap luminance at each eye: 1.551–2.082 real (six messages, seeds 1–12, both viewports; ≥ 1.698 for seed 1); 1.406–1.528 β 0.2 for seed 1 with hello world's t, fov and readback views (1.309–1.601 over seeds 1–12, so MIN_LIFT is the bound that holds it), 1.304–1.472 "What" formed 6° off its eye
const MIN_LIFT = 1.51;           // that ratio over the beta-0 render's on the same mask: 1.532–2.046 real (six messages, seeds 1–12, both viewports; ≥ 1.656 for seed 1 with hello world's t, fov and readback views); 1.308–1.498 β 0.2 (≤ 1.453 for seed 1), 1.184–1.294 "What" 6° off, 1.029–1.133 no relocation, 1.222–1.424 for "What", "a", "beautiful" and "world" without density compensation (at about the page's particle counts)
const MIN_SEED_IOU = 0.65;       // strokes, default seed vs OTHER_SEED: 0.777–0.912 real (six messages, seeds 1–12 but 8, both viewports); 0.503–0.545 "What" 6° off, 0.238–0.413 no relocation
const MIN_MASK = { strokes: 3000, gaps: 1500 }; // pixels a mask needs to be measured: ≥ 3942 strokes ("a") and ≥ 2396 gaps ("beautiful") at 390×844 real (seeds 1–12)
const MIN_TIME_IOU = 0.8;        // hello world's strokes t=0 vs later: 0.943 and 0.941 real (t 7.3 and 31); 0.531 when text particles drift across their sight lines
const MIN_SCALE_IOU = 0.7;       // zoomed strokes vs base strokes scaled: 0.950 (fov 32) and 0.942 (fov 80) real; 0.373 and 0.460 when zoom dollies the eye
const MAX_GHOST_LIFT = 1.33;     // a message's stroke/gap ratio on its ghost mask away from its eye, over the same view's at beta=0 (mean over seeds 1–3; seed 1 alone at the other eyes and midway to the neighbours): ≤ 1.269 real ("beautiful" at its antipode; ≤ 1.297 in threes, mask seeds 13–15), and for seed 1 ≤ 1.175 at the other eyes and ≤ 1.174 midway (≤ 1.195 and ≤ 1.257 for any one of seeds 1–12); 1.376 with "world" at half its depth spread (at its antipode), up to 1.78 with the later five at a third of theirs and up to 1.78 without density compensation, up to 2.59 with flat text
const MAX_SMEAR_E_IOU = 0.25;    // hello world's text layer at az+25 vs its E strokes: 0.096 real, 0.107 flat text (a coarse guard; the seed check tells them apart)
const MAX_SMEAR_SEED_IOU = 0.3;  // that text layer, seed vs seed: 0.167 real; 0.839 flat text, 1.000 when the seed is ignored
const LIGHT_BAND = [0.93, 1.05]; // text / as-ambient light of the same particles: 0.951–1.017 real (seeds 1–12, every alike view, t 0; 0.951–1.020 with t 7.3; 0.955–1.015 for seeds 1–6 at t 0; 0.970–1.013 for seed 1 at t 0 and 7.3), lowest at the eyes, where the 8-bit target clips the densest strokes (5–7.5% of the text layer's lit pixels); 0.910 at E without density compensation. 1.174 at E with text 1.25× brighter near E, 1.209 at the eye of "a" with the same near "a", 1.456 with text sprites 1.25× wider, 1.123 with their blur cut 75%, 1.287 with text 1.4× brighter everywhere
const CHANNEL_BAND = [0.97, 1.03]; // text / as-ambient colour balance (each channel's share of the light over pixels where no channel clips) in each of red, green and blue: 0.998–1.002 real (seeds 1–12, every alike view and time), where the raw per-channel ratio falls to 0.909 in blue at E from clipping alone; 0.733/1.102/0.735 at E with a green tint near E (red and blue × 0.739, green × 1.10, R5-1) and 1.106/0.989/0.854 with a 30% gold tint near E
const MAX_CLIPPED = 0.08;        // share of an image's lit pixels that the colour balance leaves out because a channel is at 255 (blue saturates first), text layer and as-ambient alike: ≤ 0.0746 and ≤ 0.0697 real (seeds 1–12, every alike view and time, the most at E for seed 8; ≤ 0.0692 and ≤ 0.0697 for seeds 1–6; 0.0622 for the text layer at E for seed 1, whose left-out pixels hold 32% of its light); 0.109 at E with text particles tinted blue near E (blue × 1.5, red and green × 0.96), 0.116 without density compensation, 0.083 with upright letters in depth layers. Changes that keep every particle alike trip it too: 0.081 at E with 60,000 particles and with a palette 20% brighter at every angle, 0.093 and 0.095 at the eye of "What", and up to 0.130 with every sprite 1.25× wider
const OWN_BETA = 0.2;            // each message's own particles at its eye are compared at this beta: their strokes are sparse enough that few pixels clip (≤ 3.1% for hello world, ≤ 19% for "a", seeds 1–6), where at the default β ¼ to ⅓ of their lit pixels clip and the ratio falls to 0.85
const OWN_LIGHT_BAND = [0.95, 1.12]; // a message's own text particles at its eye over the same particles drawn as ambient, at OWN_BETA: 1.006–1.065 real (six messages, seeds 1–12; 1.009–1.057 for seeds 1–6), above 1 because the as-ambient image is the dense cloud's difference and loses more to the 8-bit cap; 1.253 at the eye of "a" when only its particles brighten 1.25× near it, whose whole text layer there reads 0.991, and 0.875 when they dim to 0.85× (0.981); for seed 1 it passes one message's particles 6.1% ("beautiful") to 10.1% ("a") brighter and 6.8% (hello world) to 10.0% ("beautiful") dimmer; 1.164 for "world" at half its depth spread, which brings its particles into focus, and 1.12–1.25 for the later five at a third of theirs. Changes that keep every particle alike move it too: 1.125–1.166 with every sprite 1.25× wider, 1.046–1.100 with a palette 20% brighter at every angle
const SIZE_BAND = [0.85, 1.15];  // text / as-ambient effective sprite area at SPARSE_BETA: 0.943–1.044 real (seeds 1–12, every alike view); 1.425 at E with text sprites 1.25× wider near E
const MAX_RESIDUAL = 0.001;      // per channel, Σ|render − prediction| over the predicted light, for the shipped render against text layer + ambient layer − sky, and for each camera-mode shot against E set by URL: at most 1.3e-5 real for the shipped render (seeds 1–12, every alike view and time: 7–623 of a frame's 3,072,000 channel values differ, 44,879 in all, each by 1 level, anywhere from row 35 to row 792, but for 31 values in rows 756–769, under the hint's text, which the browser lays over the canvas) and, in each mode shot, as many channel values as its diagnostic counts; worst channel 0.070 at E with a 30% gold tint near E in the shipped draw only and 0.124 with a second text pass there; in the mode shots 0.144 with text 1.25× brighter during the tour, late in its hold, after a glide or after 5 s idle at E, and 0.076 with a gold tint after a glide
const SCENE_BAND = [0.85, 1.15]; // scene particle light at E, 3°, 12° and each other eye over its mean at the far views: 0.926–1.104 real (seeds 1–12, t 0; 0.922–1.112 with t 7.3); 1.265 at E with every particle 1.4× brighter near E, but 1.104 with 1.2× and 1.063 with 1.15×, which pass
// The scene's particle light changes slowly from view to view, 0.92–1.11× the far views' mean at the
// alike views (seeds 1–12), which keeps SCENE_BAND wide. The two midpoints beside an eye, about 29°
// away on the sequence's path, sit on either side of it, so their mean follows that slow change, and
// a glow near the eye does not reach them.
const SCENE_RING_BAND = [0.95, 1.03]; // scene particle light at each eye over its mean at the two midpoints beside it (t 0, seed 1): 0.976–1.003 real (six eyes, seeds 1–12; 0.980–1.001 for seeds 1–3); with every particle brighter near E, fading out by 12°, 1.114 at E for 1.15×, which every other check passes, and 1.158 for 1.2×; with every particle brighter near every eye, 1.025–1.048 for 5% and 1.070–1.094 for 10%, so a glow shows from 5.5% at E and from 3.1–4.8% at the other eyes; 0.906 at the eye of "What" with every particle dimmed to 0.9× near it, where SCENE_BAND reads 0.924
const DWELL_MS = 8000;           // idle at E after the glide before the second shot; the dwell mutant reveals after 5000
// The tour at load starts at the shipped start view (no az or el). index.html: playSequence holds
// LOAD_HOLD_MS (1.5 s) there, glides to hello world's eye in legMs(42.2°) = 1.5 s + 50 ms per degree
// (3.61 s), and holds HOLD_MS (3 s). Each step starts at the frame where the previous one ended, so
// the camera is at E from about 5.11 s to about 8.11 s after the page's first frame.
const TOUR_SHOT_MS = 6600;       // the earliest tour shot, from the page's first frame, and it waits until HOLD_LEAD_MS after the camera reached E if that is later: about 1.5 s into the hold. Run last with the render queue drained, one state read, the screenshot clipped to the central region and a second state read take about 0.16–0.20 s at 1280×800, and the shot is decoded only after that, so the shot ends about 1.3 s before the hold does (0.33–0.40 s and about 1.1 s with the whole frame, four reads and the decode before the last two); the late-in-hold mutant reveals once the hold has run 1.2 s
const HOLD_LEAD_MS = 1500;       // the shot must start at least this long after the camera reached E, as the page's own frames report it
const MAX_STREAK_FLOOR = 1.9;    // the floor (mean row and column residual at the two far controls), mean over seeds 1–3: 1.286 real (1.308–1.383 in threes); 2.769 flat text
const STREAK_K = 1.8;            // row and column residual over each seed's floor midway to hello world's neighbours and at its back view, mean: ≤ 1.33 real (≤ 1.52 in threes); 1.863 in the rows midway to the face when hello world takes twice the relocation chance (13,920 text particles, not 9,083); 1.78 slant-5 and 1.67 upright letters in the back view's columns
// The six messages relocate 30,254 of the 48,000 particles, so relocation leaves texture everywhere:
// the floor is 1.29 (1.31–1.38 in threes), where the hello-world-only page measured 0.94 at its own
// controls. The el±25 columns rose with it, to 1.73 and 1.93 over the cloud's own noise (up to 2.24
// at el−25 in threes), past that page's absolute bound of 1.95, while over the floor they measure
// 1.35 and 1.50. So the lean is held over the floor and, so that a rising floor cannot carry the
// columns with it, over the cloud's own noise too.
const MAX_EL_STREAK = 1.9;       // column residual over the floor at el+25 and at el−25, mean: 1.348 and 1.495 real (≤ 1.39 and ≤ 1.71 in threes); 2.267 and 2.128 upright letters, 2.062 and 2.108 with a 5° lean
const MAX_EL_STREAK_ABS = 2.35;  // that column residual over the cloud's own noise, mean: 1.734 and 1.927 real (≤ 1.90 and ≤ 2.24 in threes); 2.719 and 2.552 upright letters, 2.468 and 2.521 with a 5° lean, and 2.838 and 2.698 with upright letters in depth layers, whose floor rises to 1.682 so that over it they read only 1.697 and 1.616
const SLANT_DEG = 14;            // the letters' lean (SLANT in index.html), undone before the layout is measured
const LINE_WIDTH_RATIO = [0.76, 0.92]; // top/bottom line width at E, lean undone: 0.851 real (0.846–0.853 for seeds 1–12; 0.849 and 0.856 with a 5° lean and upright letters); 1.175 turned 180°, 0.587 with no relocation
const FULL_STEM = 0.8;           // end-strip height / line height at "h" and "d", lean undone: 0.98 and 0.97 real (≥ 0.92 for seeds 1–12); 0.48 and 0.64 mirrored (its letters lean left, "o" and "w" are there), 0.69 and 0.64 with upright letters, 0.74 at "h" without density compensation; a 5° lean keeps 0.95 and 0.96, which MAX_LEAN catches
const SHORT_END = 0.7;           // the same at "o" and "w": 0.54 and 0.44 real (≤ 0.55 for seeds 1–12); it catches no mutant alone, since a mirrored frame's stems lean the wrong way and fail FULL_STEM first
const MAX_LEAN = 4;              // degrees the "h" and "d" stems still lean once the 14° is undone, mean of the two, mean over seeds 1–3: 0.14 real (0.00–0.48 in threes, |≤ 0.84| for any one of seeds 1–12); −9.03 with a 5° lean, −13.80 upright, −5.19 mirrored
const MIN_FIT_MARGIN = 8;        // px between a message's strokes and the frame edges at 390×844: ≥ 32 real (six messages, seeds 1–12); 0 without the phone widening
const SPARSE_BETA = 0.02;        // about 700 text particles: separate sprites, so the effective area measures sprite size
const OTHER_SEED = 8;
const SEEDS = [1, 2, 3];
const DIM = { blur: 5, bandpass: 15 }; // masks of off-angle text layers: sky removed, dots merged
const CENTRE = [0.08, 0.92, 0.15, 0.85]; // the stroke-mask region: clear of the bar and the hint, whose hover and focus styles may differ
// Zoomed views scale the mask with the text: blur and gap distance follow the zoom factor s, and
// the mask keeps the base stroke area times s².
const scaled = (s, baseStrokes) => ({ blur: Math.max(1, Math.round(3 * s)), gapDist: Math.max(3, Math.round(8 * s)), area: Math.round(baseStrokes * s * s) });
const SLANT_LEAN = Math.tan((SLANT_DEG * Math.PI) / 180);

// Views. E is hello world's eye; every view is { az, el } in degrees.
const HW = MESSAGES[0], E = { az: HW.az, el: HW.el };
const at = (daz, del) => ({ az: E.az + daz, el: E.el + del });
const BACK = { az: E.az + 180, el: -E.el };
const MIDS = MESSAGES.map((m, k) => midpoint(m, MESSAGES[(k + 1) % MESSAGES.length]));   // MIDS[k]: midway from message k to the next
const FAR = [['far (68°, 60°)', { az: 68, el: 60 }], ['far (188°, −45°)', { az: 188, el: -45 }], ['far (308°, −45°)', { az: 308, el: -45 }]];   // at least 40° from every eye
// The query for view w: tour off, the clock frozen at t, and the other parameters when given.
const Q = (w, { t = 0, fov, seed = 1, beta, layer, textof, relocate } = {}) => [`az=${w.az}`, `el=${w.el}`, 'tour=0', `t=${t}`, fov !== undefined && `fov=${fov}`, seed !== 1 && `seed=${seed}`, beta !== undefined && `beta=${beta}`, layer && `layer=${layer}`, textof && `textof=${textof}`, relocate && `relocate=${relocate}`].filter(Boolean).join('&');
// The sky alone at view w: beta=0 relocates nothing, so its text layer draws no particles. It does
// not depend on t or the seed, and keeps the view's readout text.
const SKY = (w, fov) => Q(w, { fov, beta: 0, layer: 'text' });
const named = (w) => `(${w.az}°, ${w.el}°)`;
// Each message's text layer and the sky, the same at another seed, the full render and its beta-0 twin.
const legibilityViews = (w, name, o = {}) => [Q(w, { ...o, layer: 'text', textof: name }), Q(w, { ...o, seed: OTHER_SEED, layer: 'text', textof: name }), SKY(w, o.fov), Q(w, o), Q(w, { ...o, beta: 0 })];
// Where no message may show, each as { m, where, w, seeds }: every message at the other five eyes
// and midway to each of its neighbours, where the sequence holds and glides (seed 1, since one seed
// there measures far inside the bound), and at its antipode and the far views as means over seeds
// 1–3; hello world also at el±25. Each eye sits about 34° above another message's antipode.
const antipode = (m) => ({ az: (m.az + 180) % 360, el: -m.el });
const GHOSTS = MESSAGES.flatMap((m, k) => {
  const n = MESSAGES.length, prev = (k + n - 1) % n, next = (k + 1) % n;
  return [
    ...MESSAGES.filter((o) => o !== m).map((o) => [`the eye of "${o.name}"`, o, [1]]),
    [`midway to "${MESSAGES[prev].name}"`, MIDS[prev], [1]], [`midway to "${MESSAGES[next].name}"`, MIDS[k], [1]],
    ['its antipode', antipode(m), SEEDS],
    ...FAR.map(([name, w]) => [name, w, SEEDS]),
    ...(k === 0 ? [['el+25', at(0, 25), SEEDS], ['el−25', at(0, -25), SEEDS]] : []),
  ].map(([where, w, seeds]) => ({ m, where, w: { az: w.az, el: w.el }, seeds }));
});
const ghostViews = (g) => [SKY(g.w), Q(g.w, { seed: OTHER_SEED, layer: 'text', textof: g.m.name }), ...g.seeds.flatMap((seed) => [Q(g.w, { seed }), Q(g.w, { seed, beta: 0 })])];
// Each message's own particles at its eye, drawn as text and as ambient at OWN_BETA.
const ownViews = (m) => [SKY(m), Q(m, { beta: 0 }), Q(m, { beta: OWN_BETA, layer: 'text', textof: m.name }), Q(m, { beta: OWN_BETA, layer: 'ambient', relocate: m.name })];
const ALIKE_TIMES = ['0', '7.3'];
// The alike views: near E and far, at both times; the other eyes at t 0. The first three are near E.
const ALIKE = (time) => [['E', E], ['3° (el+3)', at(0, 3)], ['12° (az−12)', at(-12, 0)], ...FAR, ...(time === '0' ? MESSAGES.slice(1).map((m) => [`the eye of "${m.name}"`, { az: m.az, el: m.el }]) : [])];
const alikeViews = (w, time, sparse) => [Q(w, { t: time }), Q(w, { t: time, beta: 0 }), SKY(w), Q(w, { t: time, layer: 'text' }), Q(w, { t: time, layer: 'ambient' }), ...(sparse ? [Q(w, { t: time, beta: SPARSE_BETA, layer: 'text' }), Q(w, { t: time, beta: SPARSE_BETA, layer: 'ambient' })] : [])];
const STREAK = {
  controls: FAR.slice(0, 2),
  gated: [['midway to the face', MIDS[0]], ['midway to "world"', MIDS[MESSAGES.length - 1]], ['the back', BACK]],
  cost: [['el+25', at(0, 25)], ['el−25', at(0, -25)]],
};

// Renders. The views the tests read through view() and need() are queued in `before`, in the
// order the tests use them, and pump() renders up to WIDTH of them at a time while the tests
// compute; a test first asks for its own views (need), which moves any not yet started to the
// front. pump() hands each wide view to the next of the four wide contexts in turn, one in each
// browser, without checking which browser is free, so two can render in one browser at once.
// Every phone view renders in browser 0 and every blind view in browser 1. SwiftShader draws each
// browser's pages in one GPU process. The seed test renders outside the queue. The camera-mode
// test, which times its shots, runs last: it pauses pump() and waits for the renders in flight
// (quiet), so nothing renders beside its two pages. Each view is its own page with a frozen clock
// and a fixed seed, so the images are the same as one at a time in one browser. A view keeps its
// decoded image; its luminance is computed when first asked for.
const BROWSERS = 4, WIDTH = 4;
let browsers = [], wides = [], wide, phone, blind, P, turn = 0, busy = 0, paused = false;
const cache = new Map(), queue = [], label = new Map(), drained = [];

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
  while (!paused && busy < WIDTH && queue.length) {
    const v = queue.shift();
    v.started = true; busy++;
    const via = v.context === wide ? wides[turn++ % wides.length] : v.context;
    render(via, v.query).then((r) => {
      let lum = null;
      v.resolve({ ...r, get lum() { return (lum ??= luminance(r.img)); } });
    }, v.reject).finally(() => { busy--; pump(); });
  }
  if (!busy) for (const done of drained.splice(0)) done();
}
// quiet() stops pump() from starting views and resolves once none is rendering; resume() undoes it.
const quiet = () => { paused = true; return busy ? new Promise((resolve) => drained.push(resolve)) : Promise.resolve(); };
const resume = () => { paused = false; pump(); };
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

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

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
  // Each test's views, in test order; `before` queues them all.
  P = {
    legible: [wide, [...['7.3', '31'].flatMap((t) => legibilityViews(E, HW.name, { t })), ...MESSAGES.flatMap((m) => legibilityViews(m, m.name))]],
    phone: [phone, MESSAGES.flatMap((m) => legibilityViews(m, m.name))],
    layout: [wide, [SKY(E), ...SEEDS.map((seed) => Q(E, { seed, layer: 'text', textof: HW.name }))]],
    blind: [blind, legibilityViews(E, HW.name)],
    zoom: [wide, [Q(E, { layer: 'text', textof: HW.name }), SKY(E), Q(E), ...[32, 80].flatMap((fov) => legibilityViews(E, HW.name, { fov }))]],
    still: [wide, [SKY(E), ...['0', '7.3', '31'].map((t) => Q(E, { t, layer: 'text', textof: HW.name }))]],
    ghost: [wide, GHOSTS.flatMap(ghostViews)],
    smear: [wide, [Q(E, { layer: 'text', textof: HW.name }), SKY(E), Q(at(25, 0), { layer: 'text', textof: HW.name }), Q(at(25, 0), { seed: OTHER_SEED, layer: 'text', textof: HW.name })]],
    alike: [wide, [...ALIKE_TIMES.flatMap((time) => ALIKE(time).flatMap(([, w]) => alikeViews(w, time, time === '0'))), ...MESSAGES.flatMap(ownViews), ...MIDS.flatMap((w) => [Q(w), SKY(w)])]],
    streak: [wide, SEEDS.flatMap((seed) => Object.values(STREAK).flat().flatMap(([, w]) => [Q(w, { seed }), Q(w, { seed, beta: 0 })]))],
    modes: [wide, [Q(E), SKY(E)]],
  };
  for (const entry of Object.values(P)) warm(...entry);
});
after(async () => { await Promise.all(browsers.map((b) => b.close())); });

// A message's strokes at view w: its own text layer over the sky there.
async function textMask(context, w, name, opts, o = {}) {
  const tx = await view(context, Q(w, { ...o, layer: 'text', textof: name }));
  const sky = await view(context, SKY(w, o.fov));
  const m = strokeMask(lumOver(tx.img, sky.img), tx.img.width, tx.img.height, opts);
  assert.ok(m.strokes > 0, `no stroke pixels in the text layer of "${name}" at ${named(w)}${o.seed ? ` for seed ${o.seed}` : ''}${o.fov ? ` at fov ${o.fov}` : ''} (the page counts ${JSON.stringify(tx.counts.byMessage)} text particles per message)`);
  return m;
}

async function legibility(context, w, name, opts, o = {}) {
  const m = await textMask(context, w, name, opts, o);
  const other = await textMask(context, w, name, opts, { ...o, seed: OTHER_SEED });
  const ratio = strokeGapRatio((await view(context, Q(w, o))).lum, m);
  const lift = ratio / strokeGapRatio((await view(context, Q(w, { ...o, beta: 0 }))).lum, m);
  return { ratio, lift, seedIoU: iou(m.mask, other.mask), strokes: m.strokes, gaps: m.gaps, m };
}

// The legibility bounds a measurement breaks, each named; a test asserts once with all of them,
// so a failure shows every way the text fails to read rather than only the first.
function illegible(name, L) {
  const broken = [];
  if (!(L.strokes >= MIN_MASK.strokes && L.gaps >= MIN_MASK.gaps)) broken.push(`${name}: the mask is too small to measure (strokes ${L.strokes} px, gaps ${L.gaps} px; need at least ${MIN_MASK.strokes} and ${MIN_MASK.gaps})`);
  if (!(L.ratio >= MIN_RATIO)) broken.push(`${name}: stroke/gap luminance ratio ${L.ratio.toFixed(3)} is below ${MIN_RATIO}`);
  if (!(L.lift >= MIN_LIFT)) broken.push(`${name}: relocation lifts the stroke/gap ratio only ${L.lift.toFixed(3)}× over the same view at beta=0 (need at least ${MIN_LIFT}×)`);
  if (!(L.seedIoU >= MIN_SEED_IOU)) broken.push(`${name}: strokes for seeds 1 and ${OTHER_SEED} overlap with IoU ${L.seedIoU.toFixed(3)}, below ${MIN_SEED_IOU}, so the shapes follow the particle draw, not the message`);
  return broken;
}
const assertNone = (broken, lead = '') => assert.ok(broken.length === 0, lead + broken.join('; '));
const describe = (name, L) => `${name}: ratio ${L.ratio.toFixed(3)}, lift over beta=0 ${L.lift.toFixed(3)}, seed IoU ${L.seedIoU.toFixed(3)}, strokes ${L.strokes} px, gaps ${L.gaps} px`;

test('legible at each eye at 1280×800 (hello world also at t = 7.3 and 31 s)', async (t) => {
  await need(P.legible);
  const rows = [];
  for (const m of MESSAGES) rows.push([`"${m.name}" at ${named(m)}`, await legibility(wide, m, m.name)]);
  for (const time of ['7.3', '31']) rows.push([`"${HW.name}" at E, t=${time}`, await legibility(wide, E, HW.name, undefined, { t: time })]);
  for (const [name, L] of rows) t.diagnostic(describe(name, L));
  assertNone(rows.flatMap(([name, L]) => illegible(name, L)));
});

test('legible at each eye at 390×844', async (t) => {
  await need(P.phone);
  const rows = [];
  for (const m of MESSAGES) rows.push([`"${m.name}" at ${named(m)}, 390×844`, await legibility(phone, m, m.name)]);
  for (const [name, L] of rows) t.diagnostic(describe(name, L));
  assertNone(rows.flatMap(([name, L]) => illegible(name, L)));
});

// The layout comes from the page's glyph geometry in x-heights: the centre lines of "hello" and
// "world" are 4.55 and 5.42 wide, and each line's ink is 1.63 tall (ascender 1.55 plus the stroke,
// INK = 0.2 world units, which is 0.075 x-heights at hello world's 2.65 units per x-height), so the
// top line's ink is 0.84 of the bottom's. "h" opens the top line and "d" closes the bottom line
// with full-height stems; "o" closes the top line and "w" opens the bottom line at x-height only
// (0.54 and 0.44 of the line height measured in a strip 0.15 line heights wide). The
// letters lean right by SLANT_DEG, so the strokes are measured with that lean undone: then the
// stems stand upright in their end strips, while letters that lean the other way (a mirrored
// frame) leave those strips short. The stems' own lean is then measured along the outer ink edge
// of each line (the left edge of "h", the right edge of "d"), so a lean a few degrees off 14°,
// which the strips still pass, fails too.
test('at E the message reads "hello" over "world", left to right, in letters leaning 14°', async (t) => {
  await need(P.layout);
  const m = await textMask(wide, E, HW.name);
  const L = lineLayout(unslant(m, SLANT_LEAN));
  assert.ok(L, `the E strokes (box ${JSON.stringify(m.box)}) have no empty row between two lines`);
  const leans = [];
  for (const seed of SEEDS) {
    const u = unslant(seed === 1 ? m : await textMask(wide, E, HW.name, undefined, { seed }), SLANT_LEAN);
    const Ls = lineLayout(u);
    assert.ok(Ls, `seed ${seed}: the E strokes, lean undone, have no empty row between two lines`);
    const h = edgeLean(u, Ls.top, 'left').lean, d = edgeLean(u, Ls.bottom, 'right').lean;
    leans.push({ seed, h, d, both: (h + d) / 2 });
  }
  const lean = mean(leans.map((l) => l.both));
  const { top, bottom } = L;
  const widthRatio = top.width / bottom.width;
  const ends = { hLeft: top.left / top.height, oRight: top.right / top.height, wLeft: bottom.left / bottom.height, dRight: bottom.right / bottom.height };
  t.diagnostic(`gap ${L.gap} px; top ${JSON.stringify(top)}; bottom ${JSON.stringify(bottom)}; width ratio ${widthRatio.toFixed(3)}; end heights / line height ${Object.entries(ends).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(', ')}`);
  t.diagnostic(`lean left in the stems once ${SLANT_DEG}° is undone (degrees, + leans right): ${leans.map((l) => `seed ${l.seed} "h" ${l.h.toFixed(2)}, "d" ${l.d.toFixed(2)}`).join('; ')}; mean ${lean.toFixed(2)}`);
  assert.ok(L.gap >= 3, `the two lines are only ${L.gap} px apart`);
  assert.ok(widthRatio >= LINE_WIDTH_RATIO[0] && widthRatio <= LINE_WIDTH_RATIO[1], `the top line is ${top.width} px wide and the bottom line ${bottom.width} px (ratio ${widthRatio.toFixed(3)}); "hello" over "world" gives about 0.84, so it must be within ${LINE_WIDTH_RATIO.join('–')} (a frame turned 180° gives about 1.18)`);
  assert.ok(ends.hLeft >= FULL_STEM, `with the letters' ${SLANT_DEG}° lean undone, the left end of the top line is only ${ends.hLeft.toFixed(2)} of the line height; the "h" stem there must reach at least ${FULL_STEM} (a mirrored frame puts "o" there, and letters that do not lean about ${SLANT_DEG}° leave the stem slanted across the strip)`);
  assert.ok(ends.dRight >= FULL_STEM, `with the letters' ${SLANT_DEG}° lean undone, the right end of the bottom line is only ${ends.dRight.toFixed(2)} of the line height; the "d" stem there must reach at least ${FULL_STEM} (a mirrored frame puts "w" there, and letters that do not lean about ${SLANT_DEG}° leave the stem slanted across the strip)`);
  assert.ok(ends.oRight <= SHORT_END, `the right end of the top line is ${ends.oRight.toFixed(2)} of the line height; the "o" there must stay at or below ${SHORT_END}`);
  assert.ok(ends.wLeft <= SHORT_END, `the left end of the bottom line is ${ends.wLeft.toFixed(2)} of the line height; the "w" there must stay at or below ${SHORT_END}`);
  assert.ok(Math.abs(lean) <= MAX_LEAN, `with ${SLANT_DEG}° undone, the "h" and "d" stems still lean ${lean.toFixed(2)}° (mean over seeds ${SEEDS.join(', ')}; + is to the right), so the letters lean about ${(SLANT_DEG + lean).toFixed(1)}°, not ${SLANT_DEG}° ± ${MAX_LEAN}°; the lean spreads the stems over many screen columns, so from above and below E they do not show as vertical streaks`);
});

test('at 390×844 every message fits inside the frame', async (t) => {
  await need(P.phone);
  const broken = [];
  for (const m of MESSAGES) {
    const tx = await view(phone, Q(m, { layer: 'text', textof: m.name })), sky = await view(phone, SKY(m));
    const { width: W, height: H } = tx.img;
    const band = [0.15, 0.85];                       // full width; rows clear of the bar and the hint
    const k = strokeMask(lumOver(tx.img, sky.img), W, H, { region: [0, 1, ...band] });
    const { x0, x1, y0, y1 } = k.box;
    const margins = { left: x0, right: W - 1 - x1, top: y0 - Math.ceil(band[0] * H), bottom: Math.floor(band[1] * H) - y1 };
    t.diagnostic(`"${m.name}": text-layer strokes over the full width: ${k.strokes} px, box ${JSON.stringify(k.box)} in ${W}×${H}, margins ${JSON.stringify(margins)}`);
    if (!(k.strokes >= MIN_MASK.strokes)) broken.push(`"${m.name}": only ${k.strokes} stroke pixels at 390×844`);
    for (const [side, px] of Object.entries(margins)) {
      if (!(px >= MIN_FIT_MARGIN)) broken.push(`"${m.name}": the strokes come within ${px} px of the ${side} edge${side === 'left' || side === 'right' ? ' of the frame' : ' of the measured band'}`);
    }
  }
  assertNone(broken, `at 390×844 every message must fit with at least ${MIN_FIT_MARGIN} px to spare, but `);
});

test('legible at E when canvas readback returns zeros', async (t) => {
  await need(P.blind);
  const L = await legibility(blind, E, HW.name);
  t.diagnostic(describe('E with blank getImageData', L));
  assertNone(illegible('E with blank getImageData', L));
});

test('legible at E zoomed in and out, and zoom only scales the image', async (t) => {
  await need(P.zoom);
  const base = await view(wide, Q(E));
  const baseMask = await textMask(wide, E, HW.name);
  const rows = [];
  for (const fov of [32, 80]) {
    const s = Math.tan((base.state.fov * Math.PI) / 360) / Math.tan((fov * Math.PI) / 360);
    const L = await legibility(wide, E, HW.name, scaled(s, baseMask.strokes), { fov });
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

test('hello world\'s text layer at E holds still over time', async (t) => {
  await need(P.still);
  const m0 = await textMask(wide, E, HW.name);
  const rows = [];
  for (const time of ['7.3', '31']) rows.push([time, iou(m0.mask, (await textMask(wide, E, HW.name, undefined, { t: time })).mask)]);
  for (const [time, overlap] of rows) t.diagnostic(`IoU t=0 vs t=${time}: ${overlap.toFixed(3)}`);
  for (const [time, overlap] of rows) {
    assert.ok(overlap >= MIN_TIME_IOU, `text-layer strokes at t=0 and t=${time} overlap with IoU ${overlap.toFixed(3)}, below ${MIN_TIME_IOU}; text particles move across their sight lines`);
  }
});

// A message's ghost at a view away from its eye: wherever its particles gather there, which near its
// antipode is a mirrored, radially smeared copy. The mask is laid at that view, from the message's
// own text layer over the sky for OTHER_SEED (an independent cloud), so seed 1–3's own particle
// clumps do not select it. The full render's stroke/gap ratio on it, over its beta-0 twin's (the
// same cloud, nothing relocated), is how much relocation lifts that shape there: only shape that
// follows the message repeats across seeds. Every other message's relocation shows in the full render
// too, so where two ghosts overlap the lift counts both.
test('no message shows away from its eye: at the other eyes and midway to its neighbours (seed 1), at its antipode and at the far views (seeds 1–3)', async (t) => {
  await need(P.ghost);
  const broken = [], rows = [];
  for (const g of GHOSTS) {
    const sky = await view(wide, SKY(g.w)), tx = await view(wide, Q(g.w, { seed: OTHER_SEED, layer: 'text', textof: g.m.name }));
    const mask = strokeMask(lumOver(tx.img, sky.img), tx.img.width, tx.img.height);
    const lifts = [];
    for (const seed of g.seeds) lifts.push(strokeGapRatio((await view(wide, Q(g.w, { seed }))).lum, mask) / strokeGapRatio((await view(wide, Q(g.w, { seed, beta: 0 }))).lum, mask));
    rows.push({ ...g, lifts, lift: mean(lifts), strokes: mask.strokes, gaps: mask.gaps });
  }
  for (const m of MESSAGES) t.diagnostic(`"${m.name}": lift over beta=0 on its ghost mask ${rows.filter((r) => r.m === m).map((r) => `${r.where} ${r.lift.toFixed(3)}${r.seeds.length > 1 ? ` (${r.lifts.map((x) => x.toFixed(3)).join('/')})` : ''}`).join(', ')}`);
  // The antipodes' streaks, for the record (the streak test gates hello world's).
  for (const m of MESSAGES.slice(1)) {
    const w = antipode(m), s = [];
    for (const seed of SEEDS) s.push(streakResidual((await view(wide, Q(w, { seed }))).lum, (await view(wide, Q(w, { seed, beta: 0 }))).lum, 1280, 800));
    t.diagnostic(`"${m.name}" at its antipode ${named(w)}: row/column residual over the cloud's own noise ${mean(s.map((x) => x.row)).toFixed(3)}/${mean(s.map((x) => x.col)).toFixed(3)} (mean over seeds ${SEEDS.join(', ')})`);
  }
  for (const r of rows) {
    if (!(r.lift <= MAX_GHOST_LIFT)) broken.push(`"${r.m.name}" at ${r.where} ${named(r.w)}: relocation lifts the stroke/gap ratio on its ghost mask ${r.lift.toFixed(3)}× over the same view at beta=0 (${r.seeds.length > 1 ? `mean over seeds ${r.seeds.join(', ')}` : `seed ${r.seeds[0]}`}; mask ${r.strokes} stroke and ${r.gaps} gap pixels), more than ${MAX_GHOST_LIFT}×, so its shape shows there`);
  }
  assertNone(broken, 'away from its eye no message may show, but ');
});

test('hello world\'s text layer at +25° az is smeared', async (t) => {
  await need(P.smear);
  const mE = await textMask(wide, E, HW.name);
  const dim = async (seed) => { const v = await view(wide, Q(at(25, 0), { seed, layer: 'text', textof: HW.name })); return strokeMask(v.lum, v.img.width, v.img.height, DIM); };
  const a = await dim(1), b = await dim(OTHER_SEED);
  assert.ok(a.strokes > 0 && b.strokes > 0, `hello world's text layer at az+25 has no mask (strokes ${a.strokes} and ${b.strokes} px)`);
  const withE = iou(a.mask, mE.mask), seeds = iou(a.mask, b.mask);
  t.diagnostic(`az+25 text layer (${a.strokes} px): IoU with the E strokes ${withE.toFixed(3)}, with seed ${OTHER_SEED} ${seeds.toFixed(3)}`);
  // At β 0.85 the text rows survive an azimuth turn as streaks, which follow the message, so both
  // overlaps sit above their old β 0.2 values; a flat sign repeats across seeds far more.
  assert.ok(withE <= MAX_SMEAR_E_IOU, `hello world's text layer at az+25 overlaps the E strokes with IoU ${withE.toFixed(3)}, above ${MAX_SMEAR_E_IOU}`);
  assert.ok(seeds <= MAX_SMEAR_SEED_IOU, `hello world's text layer at az+25 has the same shape for seeds 1 and ${OTHER_SEED} (IoU ${seeds.toFixed(3)}, above ${MAX_SMEAR_SEED_IOU}); it shows structure, not a smear`);
});

// The same particles drawn two ways at one view, from four renders. beta=0 makes every particle
// ambient without moving the base cloud, and its text layer is the sky alone. So the text layer
// at `beta` minus the sky holds the particles that `beta` relocates, drawn as text; the full
// beta-0 render minus the ambient layer at `beta` holds the same particles drawn as ambient where
// they started. Returns text over as-ambient light, the ratio of their colour balances in each of
// red, green and blue over the pixels where no channel clips (so a tint on any colour axis shows,
// not only warm against cool, while the clipping of dense strokes, which takes the most from blue,
// does not), and the ratio of their effective areas (sprite size; meaningful at SPARSE_BETA, where
// the sprites are separate).
async function drawnBothWays(w, time, beta) {
  const o = { t: time }, b = beta === undefined ? o : { ...o, beta };
  const sky = (await view(wide, SKY(w))).img, tx = (await view(wide, Q(w, { ...b, layer: 'text' }))).img;
  const full0 = (await view(wide, Q(w, { ...o, beta: 0 }))).img, amb = (await view(wide, Q(w, { ...b, layer: 'ambient' }))).img;
  const t = lightOver(tx, sky), a = lightOver(full0, amb), bt = balanceOver(tx, sky), ba = balanceOver(full0, amb);
  return { light: t.light / a.light, channels: [bt.r / ba.r, bt.g / ba.g, bt.b / ba.b], size: t.area / a.area, clipped: [bt.clipped, ba.clipped], clippedLight: [bt.clippedLight, ba.clippedLight] };
}
// One message's own particles at its eye m, drawn both ways at OWN_BETA: its text layer alone
// (textof) over the sky, and the beta-0 render minus the ambient layer of a cloud where relocation
// moves only that message's particles (relocate), which holds the same particles drawn as ambient
// where they started. The whole text layer at an eye holds all six messages' particles, so a reveal
// in one message's would be diluted there. Returns text over as-ambient light.
async function ownBothWays(m) {
  const img = async (q) => (await view(wide, q)).img;
  const sky = await img(SKY(m)), tx = await img(Q(m, { beta: OWN_BETA, layer: 'text', textof: m.name }));
  const full0 = await img(Q(m, { beta: 0 })), amb = await img(Q(m, { beta: OWN_BETA, layer: 'ambient', relocate: m.name }));
  return lightOver(tx, sky).light / lightOver(full0, amb).light;
}
// The comparisons above read only the test-only draws (layer=text, layer=ambient, beta=0). The
// shipped draw (no layer) adds both classes in one pass. The page blends ONE/ONE into an 8-bit
// target with no depth buffer and computes depth of field per sprite, so each fragment adds the
// same rounded amount whatever lies under it. So pixel by pixel and channel by channel the
// shipped render minus the sky is the text layer minus the sky plus the ambient layer minus the
// sky, capped at 255 as the target caps it (to within one level in at most a few hundred channel
// values a frame, as measured; see MAX_RESIDUAL). Any effect in the shipped draw
// that the test-only draws lack, in light, colour, size or focus, breaks that identity. Returns
// the shipped render's particle light over the sky and the identity's residual (partsResidual).
async function shipped(w, time) {
  const img = async (x) => (await view(wide, x)).img;
  const sky = await img(SKY(w)), full = await img(Q(w, { t: time }));
  return { full: lightOver(full, sky).light, identity: partsResidual(full, sky, [await img(Q(w, { t: time, layer: 'text' })), await img(Q(w, { t: time, layer: 'ambient' }))]) };
}
const rgb = (a, digits = 4) => a.map((x) => x.toFixed(digits)).join('/');

test('every particle renders alike at every angle: no reveal near any eye', async (t) => {
  await need(P.alike);
  const rows = [];
  for (const time of ALIKE_TIMES) {
    const here = [];
    for (const [k, [name, w]] of ALIKE(time).entries()) {
      const d = await drawnBothWays(w, time), s = time === '0' ? await drawnBothWays(w, time, SPARSE_BETA) : null;
      const sh = await shipped(w, time);
      here.push({ name: `${name} t=${time}`, near: k < 3 || k >= 3 + FAR.length, light: d.light, channels: d.channels, clipped: d.clipped, clippedLight: d.clippedLight, size: s?.size, identity: sh.identity, scene: sh.full });
    }
    const far = mean(here.filter((r) => !r.near).map((r) => r.scene));
    for (const r of here) rows.push({ ...r, scene: r.scene / far });
  }
  const own = [];
  for (const m of MESSAGES) own.push({ name: `"${m.name}" at its eye`, light: await ownBothWays(m) });
  // Each eye's scene light over its mean at the two midpoints beside it (t 0, seed 1).
  const sceneAt = async (w) => lightOver((await view(wide, Q(w))).img, (await view(wide, SKY(w))).img).light;
  const ring = [];
  for (const [k, m] of MESSAGES.entries()) {
    const beside = [MIDS[(k + MESSAGES.length - 1) % MESSAGES.length], MIDS[k]];
    ring.push({ name: `"${m.name}" at its eye`, scene: (await sceneAt(m)) / mean(await Promise.all(beside.map(sceneAt))) });
  }
  for (const r of rows) t.diagnostic(`${r.name}: text/as-ambient light ${r.light.toFixed(3)}, colour balance r/g/b ${rgb(r.channels)} (clipped pixels left out: ${(100 * r.clipped[0]).toFixed(1)}% of the text layer's, holding ${(100 * r.clippedLight[0]).toFixed(1)}% of its light, and ${(100 * r.clipped[1]).toFixed(1)}% of the as-ambient's, holding ${(100 * r.clippedLight[1]).toFixed(1)}%)${r.size === undefined ? '' : `, sprite size ratio (beta ${SPARSE_BETA}) ${r.size.toFixed(3)}`}, shipped − (text + ambient − sky) residual r/g/b ${rgb(r.identity.abs)} (signed ${rgb(r.identity.signed)}, ${r.identity.differ} of ${r.identity.values} channel values differ, ${(100 * r.identity.off).toFixed(3)}% of pixels off by more than 2 levels), scene light / far mean ${r.scene.toFixed(3)}`);
  t.diagnostic(`each message's own particles at its eye, text/as-ambient light at beta ${OWN_BETA}: ${own.map((r) => `${r.name} ${r.light.toFixed(3)}`).join(', ')}`);
  t.diagnostic(`scene light at each eye over its mean at the two midpoints beside it (t 0): ${ring.map((r) => `${r.name} ${r.scene.toFixed(4)}`).join(', ')}`);
  // Every broken bound is named in one message, so a failure shows each way the particles differ.
  const broken = [];
  for (const r of ring) if (!(r.scene >= SCENE_RING_BAND[0] && r.scene <= SCENE_RING_BAND[1])) broken.push(`${r.name}: the scene's particle light is ${r.scene.toFixed(3)}× its mean at the two midpoints beside that eye (must be within ${SCENE_RING_BAND.join('–')}), so the whole cloud glows ${r.scene > 1 ? 'brighter' : 'dimmer'} as the camera nears it`);
  for (const r of own) if (!(r.light >= OWN_LIGHT_BAND[0] && r.light <= OWN_LIGHT_BAND[1])) broken.push(`${r.name}: that message's own text particles carry ${r.light.toFixed(3)}× the light of the same particles drawn as ambient at beta ${OWN_BETA} (must be within ${OWN_LIGHT_BAND.join('–')})`);
  for (const r of rows) {
    if (!(r.light >= LIGHT_BAND[0] && r.light <= LIGHT_BAND[1])) broken.push(`${r.name}: the text particles carry ${r.light.toFixed(3)}× the light of the same particles drawn as ambient (must be within ${LIGHT_BAND.join('–')})`);
    if (!r.channels.every((x) => x >= CHANNEL_BAND[0] && x <= CHANNEL_BAND[1])) broken.push(`${r.name}: the text particles' colour balance is ${rgb(r.channels)}× that of the same particles drawn as ambient in red/green/blue, so their colour differs (each must be within ${CHANNEL_BAND.join('–')})`);
    if (!r.clipped.every((x) => x <= MAX_CLIPPED)) broken.push(`${r.name}: the colour balance leaves out ${(100 * r.clipped[0]).toFixed(1)}% of the text layer's lit pixels and ${(100 * r.clipped[1]).toFixed(1)}% of the as-ambient's, because a channel is at 255 there; each may be at most ${100 * MAX_CLIPPED}%, so the colour check would not see the light those pixels hold`);
    if (r.size !== undefined && !(r.size >= SIZE_BAND[0] && r.size <= SIZE_BAND[1])) broken.push(`${r.name}: their sprites cover ${r.size.toFixed(3)}× the effective area of the same particles drawn as ambient at beta ${SPARSE_BETA} (must be within ${SIZE_BAND.join('–')})`);
    if (!r.identity.abs.every((x) => x <= MAX_RESIDUAL)) broken.push(`${r.name}: the shipped render differs from the text layer plus the ambient layer (over the sky, capped at 255) by ${rgb(r.identity.abs)} of their light in red/green/blue (signed ${rgb(r.identity.signed)}; ${(100 * r.identity.off).toFixed(3)}% of pixels off by more than 2 levels); each must be at most ${MAX_RESIDUAL}, so the shipped draw renders the particles differently from the draws compared here`);
    if (r.near && !(r.scene >= SCENE_BAND[0] && r.scene <= SCENE_BAND[1])) broken.push(`${r.name}: the scene's particle light is ${r.scene.toFixed(3)}× its mean at the far views (must be within ${SCENE_BAND.join('–')})`);
  }
  assertNone(broken, 'every particle must render alike at every angle, but ');
});

// The residual compares each render with its beta-0 twin (the same cloud, nothing relocated); a
// seed's floor is the mean residual at its two far control views. At el±25 the text columns
// survive the turn as faint streaks, the accepted cost, held to their own bound over the floor.
test('relocation leaves no streaks midway from hello world to its neighbours or at its back, and el±25 stays below the bound (seeds 1–3)', async (t) => {
  await need(P.streak);
  const residual = async (w, seed) => streakResidual((await view(wide, Q(w, { seed }))).lum, (await view(wide, Q(w, { seed, beta: 0 }))).lum, 1280, 800);
  const V = STREAK, per = [];
  for (const seed of SEEDS) {
    const r = {};
    for (const [name, w] of Object.values(V).flat()) r[name] = await residual(w, seed);
    per.push({ seed, r, floor: mean(V.controls.flatMap(([name]) => [r[name].row, r[name].col])) });
  }
  const show = (p, names) => names.map(([n]) => `${n} ${p.r[n].row.toFixed(3)}/${p.r[n].col.toFixed(3)}`).join(', ');
  for (const p of per) t.diagnostic(`seed ${p.seed}: row/column residual over the cloud's own noise; floor ${p.floor.toFixed(3)} (controls ${show(p, V.controls)}); gated ${show(p, V.gated)}; el±25 ${show(p, V.cost)}`);
  const floor = mean(per.map((p) => p.floor));
  const gated = V.gated.flatMap(([n]) => ['row', 'col'].map((k) => [n, k, mean(per.map((p) => p.r[n][k] / p.floor))]));
  const cost = V.cost.map(([n]) => [n, mean(per.map((p) => p.r[n].col / p.floor)), mean(per.map((p) => p.r[n].col))]);
  t.diagnostic(`mean over seeds ${SEEDS.join(', ')}: floor ${floor.toFixed(3)}; gated over the floor ${gated.map(([n, k, v]) => `${n} ${k} ${v.toFixed(3)}`).join(', ')}; el±25 column over the floor ${cost.map(([n, v]) => `${n} ${v.toFixed(3)}`).join(', ')}, over the cloud's own noise ${cost.map(([n, , a]) => `${n} ${a.toFixed(3)}`).join(', ')}`);
  const broken = [];
  if (!(floor <= MAX_STREAK_FLOOR)) broken.push(`the floor ${floor.toFixed(3)} at the far control views is above ${MAX_STREAK_FLOOR}: relocation shows structure even there, so a comparison with it would mean nothing`);
  for (const [n, k, v] of gated) if (!(v <= STREAK_K)) broken.push(`${n}: the ${k} residual of the render minus its beta-0 twin is ${v.toFixed(3)}× the floor, above ${STREAK_K}×; relocation shows as ${k === 'row' ? 'horizontal' : 'vertical'} streaks there`);
  for (const [n, v] of cost) if (!(v <= MAX_EL_STREAK)) broken.push(`${n}: the column residual is ${v.toFixed(3)}× the floor, above ${MAX_EL_STREAK}×; the letter stems show as vertical streaks from ${n.startsWith('el+') ? 'above' : 'below'} E`);
  for (const [n, , a] of cost) if (!(a <= MAX_EL_STREAK_ABS)) broken.push(`${n}: the column residual is ${a.toFixed(3)}× the cloud's own noise, above ${MAX_EL_STREAK_ABS}×; the letter stems show as vertical streaks from ${n.startsWith('el+') ? 'above' : 'below'} E, however much the floor rose`);
  assertNone(broken, `relocation must not show as streaks (means over seeds ${SEEDS.join(', ')}), but `);
});

test('the same seed builds the same cloud; another seed a different one', async (t) => {
  const a = await render(wide, Q(E, { seed: 7, layer: 'text' }));
  const b = await render(wide, Q(E, { seed: 7, layer: 'text' }));
  const c = await render(wide, Q(E, { seed: 8, layer: 'text' }));
  let diff = 0;
  for (let i = 0; i < a.img.rgb.length; i++) diff += Math.abs(a.img.rgb[i] - c.img.rgb[i]);
  const meanDiff = diff / a.img.rgb.length;
  t.diagnostic(`counts seed 7: ${JSON.stringify(a.counts)} and ${JSON.stringify(b.counts)}; seed 8: ${JSON.stringify(c.counts)}; mean absolute difference 7 vs 8: ${meanDiff.toFixed(3)} per channel`);
  assert.ok(a.counts.text > 0, `seed 7 built no text particles (counts ${JSON.stringify(a.counts)})`);
  assert.deepEqual(b.counts, a.counts, 'seed 7 loaded twice gave different particle counts');
  assert.ok(Buffer.compare(Buffer.from(a.img.rgb), Buffer.from(b.img.rgb)) === 0, 'seed 7 loaded twice gave different text-layer images');
  assert.ok(meanDiff > 0.5, `seeds 7 and 8 gave nearly the same text-layer image (mean absolute difference ${meanDiff.toFixed(3)} per channel, need above 0.5)`);
});

// Every other view is set by URL with the camera at rest and shot within about a second of the
// page's first frame. The camera's modes, and time spent at E, must not change the picture either.
// This test times its shots, so it runs last and first lets the render queue drain (quiet): no
// queued view renders beside its two pages, the glide in browser 1 and the tour in browser 2.
// - The glide starts at az+40, el−10 from a real click on "Find the angle" (the first message in
//   the sequence from a fresh page) and ends idle at E. It is shot on arrival, and again after
//   DWELL_MS more idle there.
// - The tour at load starts at the shipped start view, as a visitor's does (no az, el or tour=0;
//   t=0 freezes the clock), and holds at E from about 5.11 s to 8.11 s after its first frame (see
//   TOUR_SHOT_MS). An init script on that page records when its first animation frame runs and
//   when a frame first ends with the page reporting the tour at E, passing every frame request
//   through unchanged. The tour is shot TOUR_SHOT_MS after the first frame, or HOLD_LEAD_MS after
//   the camera reached E if that is later. The shot counts only when it started at or after
//   TOUR_SHOT_MS (so a wait that did not happen fails), at least HOLD_LEAD_MS after the camera
//   reached E, and with the tour at E before and after it. If that
//   timing misses, as on a slow machine, the tour is shot once more on a fresh page, and a second
//   miss fails the test.
// Each shot is compared with E set by URL (t 0, the clock frozen), and the dwell shot also with
// the arrival shot, pixel by pixel and channel by channel over the central region, clear of the
// bar and the hint. Every shot is clipped to that region, which halves the screenshot's cost, and
// the tour's state is read once before its shot and once after it, with the decode after the
// second read, so the shot ends about 1.3 s before the hold does (see TOUR_SHOT_MS).
test('E reached by "Find the angle", then idle there, or held by the tour renders as E set by URL, pixel for pixel', async (t) => {
  await need(P.modes);
  await quiet();
  try {
    // CENTRE in the pixels of a 1280×800 view, rounded as partsResidual rounds a region.
    const [x0, x1, y0, y1] = [Math.round(CENTRE[0] * 1280), Math.round(CENTRE[1] * 1280), Math.round(CENTRE[2] * 800), Math.round(CENTRE[3] * 800)];
    const CLIP = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    const sky = crop((await view(wide, SKY(E))).img, CLIP);
    const byUrl = crop((await view(wide, Q(E))).img, CLIP);
    const shot = (page) => page.screenshot({ animations: 'disabled', clip: CLIP });
    const shoot = async (page) => decodePng(await shot(page));
    const glide = async () => {
      const page = await wides[1].newPage();
      try {
        await page.goto(PAGE_URL + '?' + Q(at(40, -10)));
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
          window.requestAnimationFrame = (cb) => raf((ts) => {
            window.__firstFrame ??= performance.now();
            cb(ts);
            const c = window.__cloud;
            if (window.__atE === undefined && c && c.mode() === 'tour' && c.alignment() < 1e-6) window.__atE = performance.now() - window.__firstFrame;
          });
        });
        await page.goto(`${PAGE_URL}?t=0`);
        await waitFrames(page, 1);
        // In one call: what state() reports, the time since the first frame and when the camera
        // reached E (null until it has).
        const read = () => page.evaluate(() => {
          const c = window.__cloud, v = c.view();
          return { s: { az: v.az, el: v.el, fov: v.fov, align: c.alignment(), mode: c.mode(), frame: c.frame }, at: performance.now() - window.__firstFrame, atE: window.__atE ?? null };
        });
        // Shoot at TOUR_SHOT_MS, or HOLD_LEAD_MS after the camera reached E if that is later; a page
        // that never reaches E is shot 5 s after TOUR_SHOT_MS and fails below.
        for (;;) {
          const { at: now, atE } = await read();
          const left = Math.max(TOUR_SHOT_MS - now, atE === null ? TOUR_SHOT_MS + 5000 - now : atE + HOLD_LEAD_MS - now);
          if (left <= 0) break;
          await sleep(Math.min(left, 200));
        }
        const before = await read();
        const png = await shot(page);
        const after = await read();
        return { img: decodePng(png), s0: before.s, s: after.s, from: before.at, to: after.at, atE: after.atE };
      } finally { await page.close(); }
    };
    const held = (s, mode) => s.mode === mode && s.align < 1e-6;
    const ms = (x) => (typeof x === 'number' ? `${x.toFixed(0)} ms` : String(x));
    const missed = (h) => [
      !(h.from >= TOUR_SHOT_MS) && `it started ${ms(h.from)} after the first frame, not at or after ${TOUR_SHOT_MS} ms`,
      h.atE === null ? 'no frame before it ended with the page reporting the tour at E' : !(h.from - h.atE >= HOLD_LEAD_MS) && `it started ${ms(h.from - h.atE)} after the camera reached E (at ${ms(h.atE)}), where at least ${HOLD_LEAD_MS} ms is needed`,
      !(held(h.s0, 'tour') && held(h.s, 'tour')) && `the tour was not in its hold at E before and after it: before ${JSON.stringify(h.s0)}, after ${JSON.stringify(h.s)}`,
    ].filter(Boolean);
    const [g, first] = await Promise.all([glide(), tour()]);
    let h = first;
    if (missed(first).length) {
      t.diagnostic(`the first tour shot missed (${missed(first).join('; ')}); shooting the tour once more on a fresh page`);
      h = await tour();
    }
    const idle = `${(g.dwell.idle / 1000).toFixed(1)} s idle`, span = `${(h.from / 1000).toFixed(2)}–${(h.to / 1000).toFixed(2)} s after its first frame`;
    const rows = [
      ['the glide on arrival', g.arrived.img, byUrl, 'E set by URL'],
      [`the glide after ${idle} at E`, g.dwell.img, byUrl, 'E set by URL'],
      [`the glide after ${idle} at E`, g.dwell.img, g.arrived.img, 'the same page on arrival'],
      [`the tour ${span}`, h.img, byUrl, 'E set by URL'],
    ].map(([name, img, ref, against]) => ({ name, against, d: partsResidual(img, sky, [ref]) }));
    const show = (s) => `${s.mode}, ${s.align.toFixed(6)}° from E`;
    t.diagnostic(`glide: on arrival ${show(g.arrived.s)}; after ${idle} ${show(g.dwell.s0)} → ${show(g.dwell.s)}. Tour (attempt ${h === first ? 1 : 2}): ${h.atE === null ? 'never reported at E' : `at E from ${ms(h.atE)}`}; shot ${span}${h.atE === null ? '' : `, ${ms(h.from - h.atE)} into the hold and ${ms(h.atE + 3000 - h.to)} before its 3 s end`}, reads and screenshot ${ms(h.to - h.from)}; ${show(h.s0)} → ${show(h.s)}`);
    for (const r of rows) t.diagnostic(`${r.name} against ${r.against}: central residual r/g/b ${rgb(r.d.abs)} (signed ${rgb(r.d.signed)}; ${r.d.differ} of ${r.d.values} channel values differ; ${(100 * r.d.off).toFixed(3)}% of pixels off by more than 2 levels)`);
    assert.ok(held(g.dwell.s0, 'idle') && held(g.dwell.s, 'idle'), `the glide did not stay idle at E through the dwell shot: before ${JSON.stringify(g.dwell.s0)}, after ${JSON.stringify(g.dwell.s)}`);
    assertNone(missed(h), `the tour was not shot in its hold at E on either attempt (the camera holds at E from about 5.1 s to 8.1 s after the first frame); on the last one `);
    const broken = rows.filter((r) => !r.d.abs.every((x) => x <= MAX_RESIDUAL)).map((r) => `${r.name}: the central region differs from ${r.against} by ${rgb(r.d.abs)} of its light in red/green/blue (signed ${rgb(r.d.signed)}; ${(100 * r.d.off).toFixed(3)}% of pixels off by more than 2 levels); each must be at most ${MAX_RESIDUAL}`);
    assertNone(broken, 'the camera mode and the time spent at E must not change how E renders, but ');
  } finally { resume(); }
});
