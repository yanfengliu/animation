// Gate: the camera's own motion (the tour, coasting after a fling, reduced motion), driven through
// real input.
// Bound: headless Chromium with SwiftShader WebGL2 at 640×400 CSS px; Playwright mouse input; the
// page is read only through window.__cloud. Proves: the tour moves the camera at load, stops on a
// press and stays stopped for the 9 s measured; a fling coasts; and with reduced motion there is
// no tour, no coast in the same page once reduced motion is switched on, and "Find the angle"
// jumps. A fling's release must land within the page's 60 ms window, so this file never runs
// beside the illusion file's renders or the sequence file's pages: npm test and tests/mutate.mjs
// run each of those first, in a phase of its own (tests/lib/phases.mjs).
// Does not prove how the motion feels (easing, inertia), other browsers or devices, or behaviour
// under slow frame rates.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, openPage, waitFrames, state, until, sleep } from './lib/harness.mjs';

const SMALL = { width: 640, height: 400 };
const C = { x: 320, y: 200 };                        // canvas centre, clear of the UI

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
