// Gate: the camera's own motion (the tour, coasting after a fling, reduced motion), driven through
// real input.
// Bound: headless Chromium with SwiftShader WebGL2 at 640×400 CSS px; Playwright mouse input; the
// page is read only through window.__cloud, and frame by frame through an observer that wraps
// requestAnimationFrame, passes every frame through unchanged and records mode() and view() after
// each one. The observer also records when the page can first hear a change of the reduced-motion
// preference: its listener is created before the page's own, so it hears each change first, in the
// same task. Each frame is logged with its own stamp, the timestamp the page's frame callback gets
// and times its moves by. Proves: the tour moves the camera at load, stops on a press and stays
// stopped for the 9 s measured; a fling coasts; with reduced motion there is no tour, no coast in the
// same page once reduced motion is switched on, and "Find the angle" jumps; and reduced motion
// switched on during a "Find the angle" glide (from the start view to hello world's eye), a snap (an
// arrow key 1.9° from that eye) or a coast (a fling at az 0, el 0) stops it at once: every frame
// after the page hears the change and stamped within IDLE_WINDOW_MS of it is idle, at that eye for
// the glide and the snap, and where the frame before the change was for the coast, whose stop is far
// from any eye. The frame before the change must be in that move, and at least MIN_FRAMES frames
// must fall in the window; otherwise the test fails as an error, not a check, since it could not
// judge (review round 2, F90). A fling's release must land within the page's 60 ms window, so this file never runs
// beside the illusion file's renders or the sequence file's pages: npm test and tests/mutate.mjs
// run each of those first, in a phase of its own (tests/lib/phases.mjs).
// Does not prove how the motion feels (easing, inertia), other browsers or devices, behaviour
// under slow frame rates, reduced motion switched on during a drag, a pinch or a zoom, or a move
// that resumes later than IDLE_WINDOW_MS after the change.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, openPage, waitFrames, state, until, setup, sleep } from './lib/harness.mjs';
import { MESSAGES, angleDeg } from './lib/messages.mjs';

const SMALL = { width: 640, height: 400 };
const C = { x: 320, y: 200 };                        // canvas centre, clear of the UI
const IDLE_WINDOW_MS = 1000;                         // after reduced motion switches on mid-move, every frame stamped within this is read: a glide has about 2 s left, a snap about 0.8 s and a coast about 1 s
const MIN_FRAMES = 3;                                // frames that must fall in that window for the check to judge

// Records, after each animation frame, [time, mode, az, el, stamp] as the page reports them (stamp:
// the frame's own timestamp, which the page's frame callback gets), and, for each change of the
// reduced-motion preference, [time, matches] as the page can first hear it.
const OBSERVER = () => {
  const raf = window.requestAnimationFrame.bind(window);
  window.__log = [];
  window.__heard = [];
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => window.__heard.push([performance.now(), e.matches]));
  window.requestAnimationFrame = (cb) => raf((ts) => {
    cb(ts);
    const c = window.__cloud;
    if (c && c.ready) { const v = c.view(); window.__log.push([performance.now(), c.mode(), v.az, v.el, ts]); }
  });
};

let browser;
before(async () => { browser = await startBrowser(); });
after(async () => { await browser?.close(); });

function near(actual, expected, tol, what) {
  assert.ok(Math.abs(actual - expected) <= tol, `${what}: expected ${expected.toFixed(3)} ± ${tol}, the page reports ${actual.toFixed(3)}`);
}
async function open(t, query, opts = {}) {
  const o = await openPage(browser, { query, ...SMALL, ...opts });
  t.after(() => o.context.close());
  return o;
}

test('the tour moves the camera at load, stops on a press and stays stopped', async (t) => {
  const { page } = await open(t, 'az=20&el=14');
  await until(page, () => window.__cloud.mode() === 'tour', null, 1000, 'tour at load');
  await until(page, () => window.__cloud.alignment() < 0.8, null, 12000, 'tour reaching E');
  await page.mouse.move(C.x, C.y);
  await page.mouse.down();
  const p0 = await state(page);
  assert.equal(p0.mode, 'drag', `a press during the tour left the mode at "${p0.mode}"`);
  await sleep(800);
  const p1 = await state(page);
  near(p1.az, p0.az, 0.001, 'az while pressed during the tour'); near(p1.el, p0.el, 0.001, 'el while pressed during the tour');
  for (let i = 1; i <= 10; i++) { await page.mouse.move(C.x + i * 10, C.y); await sleep(16); }
  await sleep(250);
  await page.mouse.up();
  const r0 = await state(page);
  assert.equal(r0.mode, 'idle', `after a still release away from E the mode is "${r0.mode}"`);
  await sleep(9000);
  const r1 = await state(page);
  assert.equal(r1.mode, 'idle', `9 s after the last input the mode is "${r1.mode}"; the tour must stay stopped once the viewer has taken over`);
  near(r1.az, r0.az, 0.001, 'az 9 s after the last input'); near(r1.el, r0.el, 0.001, 'el 9 s after the last input');
});

test('a fling coasts, but not once reduced motion is switched on', async (t) => {
  // Both flings run back to back in one page, so the control and the reduced-motion fling share
  // the same load and release timing; only the media setting differs between them.
  const { page } = await open(t, 'az=0&el=0&tour=0');
  const fling = async () => {
    await page.mouse.move(C.x - 150, C.y);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) { await page.mouse.move(C.x - 150 + i * 40, C.y); await sleep(10); }
    await page.mouse.up();
    const r = await state(page);
    await sleep(500);
    return { r, later: await state(page) };
  };
  const normal = await fling();
  assert.equal(normal.r.mode, 'inertia', `control: a fling without reduced motion left the mode at "${normal.r.mode}", so this fling does not test coasting`);
  assert.ok(Math.abs(normal.later.az - normal.r.az) > 1, 'control: a fling without reduced motion did not coast');
  await until(page, () => window.__cloud.mode() === 'idle', null, 5000, 'the control coast coming to rest');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await until(page, () => matchMedia('(prefers-reduced-motion: reduce)').matches, null, 2000, 'reduced motion taking effect');
  await waitFrames(page, 2);                                   // the page's change listener has run
  const reduced = await fling();
  assert.notEqual(reduced.r.mode, 'inertia', 'with reduced motion a fling started to coast');
  near(reduced.later.az, reduced.r.az, 0.001, 'az 0.5 s after a fling with reduced motion');
});

test('reduced motion: no tour, and "Find the angle" jumps straight to E', async (t) => {
  const { page } = await open(t, '', { reducedMotion: 'reduce' });
  const s0 = await state(page);
  await sleep(1500);
  const s1 = await state(page);
  assert.equal(s1.mode, 'idle', `with reduced motion the mode is "${s1.mode}" 1.5 s after load`);
  near(s1.az, s0.az, 0.001, 'az 1.5 s after load with reduced motion'); near(s1.el, s0.el, 0.001, 'el 1.5 s after load with reduced motion');
  await page.click('#find');
  const s2 = await state(page);
  assert.ok(s2.align < 0.01, `right after clicking #find with reduced motion the camera is ${s2.align.toFixed(2)}° from E`);
  assert.equal(s2.mode, 'idle', `with reduced motion #find left the mode at "${s2.mode}"`);
});

test('reduced motion switched on during a "Find the angle" glide, a snap or a coast stops it at once', async (t) => {
  const lastIs = (m) => window.__log.length > 0 && window.__log[window.__log.length - 1][1] === m;   // the last frame drawn was in mode m
  // [what, query, the move's mode, how real input starts it, the eye it ends at (null: where it was)]
  const cases = [
    ['a "Find the angle" glide', 'tour=0', 'glide', async (page) => {
      await page.click('#find');
      await setup(page, () => window.__cloud.mode() === 'glide' && window.__cloud.alignment() < 41, null, 3000, 'the glide from the start view toward hello world under way');
    }, MESSAGES[0]],
    ['a snap', 'az=42&el=14&tour=0', 'snap', async (page) => {
      await page.keyboard.press('ArrowLeft');                  // az 40: 1.9° from hello world's eye, closer than before
      await setup(page, lastIs, 'snap', 2000, 'the snap to hello world under way');
    }, MESSAGES[0]],
    ['a coast', 'az=0&el=0&tour=0', 'inertia', async (page) => {
      await page.mouse.move(C.x - 150, C.y);
      await page.mouse.down();
      for (let i = 1; i <= 6; i++) { await page.mouse.move(C.x - 150 + i * 40, C.y); await sleep(10); }
      await page.mouse.up();
      await setup(page, lastIs, 'inertia', 2000, 'the fling coasting');
    }, null],
  ];
  const broken = [], unjudged = [];
  for (const [what, query, mode, start, eye] of cases) {
    // One page at a time, closed before the next, so the fling's release is timed as in the coast test.
    const { context, page } = await openPage(browser, { query, ...SMALL, initScript: OBSERVER });
    try {
      await start(page);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      // Every frame the page stamps within IDLE_WINDOW_MS of the change is read, so the log must
      // reach past the window first.
      await setup(page, (w) => { const on = window.__heard.find(([, m]) => m); return !!on && window.__log.some((e) => e[0] > on[0] && e[4] - on[0] >= w); }, IDLE_WINDOW_MS, IDLE_WINDOW_MS + 5000, `${what}: frames stamped ${IDLE_WINDOW_MS} ms after reduced motion switched on`);
      const { L, heard } = await page.evaluate(() => ({ L: window.__log, heard: window.__heard }));
      const on = heard.find(([, matches]) => matches);
      const last = L.filter((e) => e[0] < on[0]).at(-1), after = L.filter((e) => e[0] > on[0] && e[4] - on[0] < IDLE_WINDOW_MS);
      const to = eye ?? (last && { az: last[2], el: last[3] }), off = (e) => angleDeg({ az: e[2], el: e[3] }, to);
      const shown = after.slice(0, 3).map((e) => `${e[1]} ${off(e).toFixed(6)}°`).join(', ');
      t.diagnostic(`${what}: the frame before the switch ${last ? `${last[1]}, ${off(last).toFixed(4)}° from ${eye ? eye.name + "'s eye" : 'itself'}` : 'none'}; ${after.length} frames stamped in the ${IDLE_WINDOW_MS} ms after it: ${shown}${after.length > 3 ? ', …' : ''}`);
      // The setup conditions: the move under way when the page heard the change, and frames enough
      // to read. Missing either says the test could not judge, not that the page broke the rule.
      if (!last || last[1] !== mode || (eye && !(off(last) > 1e-6))) { unjudged.push(`${what}: the switch did not come during the move (the frame before it: ${JSON.stringify(last)})`); continue; }
      if (after.length < MIN_FRAMES) { unjudged.push(`${what}: only ${after.length} frames were stamped in the ${IDLE_WINDOW_MS} ms after the switch, fewer than ${MIN_FRAMES}`); continue; }
      const moving = after.filter((e) => e[1] !== 'idle' || !(off(e) <= 1e-6));
      if (moving.length) broken.push(`${what}: from the first frame after the switch every frame must be idle ${eye ? `exactly at ${eye.name}'s eye` : 'where the frame before the switch was'}, but ${moving.length} of ${after.length} were not: ${moving.slice(0, 3).map((e) => `${e[1]} ${off(e).toFixed(6)}°`).join(', ')}`);
    } finally { await context.close(); }
  }
  assert.ok(broken.length === 0, 'reduced motion switched on mid-move must stop the move at once: ' + broken.join('; '));
  // Not an assertion: a case that could not be set up says nothing of the page, so a mutation run
  // counts it as an error, never as a mutant's kill (review round 2, F90).
  if (unjudged.length) throw new Error(`the check could not judge ${unjudged.length} case(s): ${unjudged.join('; ')}`);
});
