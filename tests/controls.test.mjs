// Gate: the controls, driven through real input.
// Bound: headless Chromium with SwiftShader WebGL2 at 640×400 CSS px; Playwright mouse, wheel and
// keyboard input and CDP touch events; the page is read only through window.__cloud. Timing
// windows allow at least 1.5× the page's own durations. Proves the listed behaviours: drag
// direction, rate and elevation clamp, wheel and key zoom changing only the field of view,
// arrow keys, the "Find the angle" glide and its cancel, snap near E, zooming during a glide or
// snap (the zoom takes at once and holds when the move lands), and touch drag and pinch (a pinch
// at E ends at E; a pinch after a deliberate 17 px drag away from E stays where the drag left it).
// The tour, coasting and reduced motion are in tests/motion.test.mjs. This file never runs beside
// the illusion file's renders: npm test and tests/mutate.mjs run that file alone first
// (tests/lib/phases.mjs).
// Does not prove how the motion feels (easing, inertia), other browsers or devices, or
// behaviour under slow frame rates.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, openPage, waitFrames, state, until, drag, sleep, PAGE_URL } from './lib/harness.mjs';

const SMALL = { width: 640, height: 400 };
const C = { x: 320, y: 200 };                        // canvas centre, clear of the UI
const PER_PX = 0.004 * 180 / Math.PI;                // degrees of orbit per CSS pixel of drag
const BASE_FOV = 50;
const fovAt = (zoom) => (2 * Math.atan(Math.tan((BASE_FOV * Math.PI) / 360) / zoom) * 180) / Math.PI;

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
async function reopen(page, query) {
  await page.goto(PAGE_URL + '?' + query);
  await waitFrames(page);
}

test('mouse drag orbits with the right signs and rate, and elevation stops at ±70°', async (t) => {
  const { page } = await open(t, 'az=0&el=0&tour=0');
  await page.mouse.move(C.x, C.y);
  await page.mouse.down();
  assert.equal((await state(page)).mode, 'drag', 'pressing the canvas did not enter drag mode');
  for (let i = 1; i <= 10; i++) { await page.mouse.move(C.x + i * 10, C.y + i * 5); await sleep(16); }
  await sleep(250);
  await page.mouse.up();
  let s = await state(page);
  near(s.az, -100 * PER_PX, 0.05, 'az after dragging 100 px right');
  near(s.el, 50 * PER_PX, 0.05, 'el after dragging 50 px down');
  assert.equal(s.mode, 'idle', 'the camera did not come to rest after a still release');
  for (let i = 0; i < 2; i++) await drag(page, { x: C.x, y: 50 }, { x: 0, y: 300 });
  near((await state(page)).el, 70, 0.001, 'el after dragging 600 px down');
  for (let i = 0; i < 3; i++) await drag(page, { x: C.x, y: 350 }, { x: 0, y: -300 });
  s = await state(page);
  near(s.el, -70, 0.001, 'el after dragging 900 px up');
  near(s.az, -100 * PER_PX, 0.05, 'az after vertical drags');
});

test('wheel zooms the field of view only', async (t) => {
  const { page } = await open(t, 'az=0&el=0&tour=0');
  const s0 = await state(page);
  near(s0.fov, BASE_FOV, 0.01, 'fov at load');
  await page.mouse.move(C.x, C.y);
  await page.mouse.wheel(0, -300);
  await until(page, (f) => window.__cloud.view().fov < f - 1, s0.fov, 2000, 'wheel zoom in');
  const s1 = await state(page);
  near(s1.fov, fovAt(Math.exp(0.45)), 0.2, 'fov after wheel −300');
  near(s1.az, s0.az, 1e-6, 'az after wheel'); near(s1.el, s0.el, 1e-6, 'el after wheel'); near(s1.align, s0.align, 1e-6, 'alignment after wheel');
  await page.mouse.wheel(0, 600);
  await until(page, (f) => window.__cloud.view().fov > f + 1, s1.fov, 2000, 'wheel zoom out');
  const s2 = await state(page);
  near(s2.fov, fovAt(Math.exp(-0.45)), 0.2, 'fov after wheel +600');
  near(s2.align, s0.align, 1e-6, 'alignment after zooming out');
});

test('arrow keys orbit by 2° and +/- zoom', async (t) => {
  const { page } = await open(t, 'az=0&el=0&tour=0');
  const steps = [['ArrowRight', 2, 0], ['ArrowUp', 2, 2], ['ArrowLeft', 0, 2], ['ArrowDown', 0, 0]];
  for (const [key, az, el] of steps) {
    await page.keyboard.press(key);
    const s = await state(page);
    near(s.az, az, 0.001, `az after ${key}`); near(s.el, el, 0.001, `el after ${key}`);
  }
  await page.keyboard.press('+');
  near((await state(page)).fov, fovAt(1.12), 0.05, 'fov after +');
  await page.keyboard.press('-');
  near((await state(page)).fov, BASE_FOV, 0.05, 'fov after -');
});

test('"Find the angle" glides to E, and a press cancels the glide', async (t) => {
  const { page } = await open(t, 'az=0&el=0&tour=0');
  const a0 = (await state(page)).align;
  const t0 = Date.now();
  await page.click('#find');
  assert.equal((await state(page)).mode, 'glide', 'clicking #find did not start a glide');
  await sleep(700);
  const mid = await state(page);
  assert.ok(mid.align > 1 && mid.align < a0 - 1, `0.7 s into the glide the alignment is ${mid.align.toFixed(2)}°; a glide from ${a0.toFixed(2)}° should be on its way, not there yet`);
  await until(page, () => window.__cloud.alignment() < 0.01, null, 6000, 'glide reaching E');
  const ms = Date.now() - t0;
  assert.ok(ms >= 1500 && ms <= 4500, `the glide took ${ms} ms; expected 1500–4500 ms`);
  await until(page, () => window.__cloud.mode() === 'idle', null, 1000, 'idle after the glide');

  await reopen(page, 'az=0&el=0&tour=0');
  await page.click('#find');
  await sleep(600);
  await page.mouse.move(C.x, C.y);
  await page.mouse.down();
  const s1 = await state(page);
  assert.equal(s1.mode, 'drag', 'a press during the glide did not take over');
  await sleep(500);
  const s2 = await state(page);
  near(s2.align, s1.align, 0.01, 'alignment while pressed after cancelling the glide');
  assert.ok(s2.align > 5, `the cancelled glide still reached ${s2.align.toFixed(2)}° from E`);
  await page.mouse.up();
});

test('releasing near E snaps to it; moving away or releasing far does not', async (t) => {
  const { page } = await open(t, 'az=44&el=14&tour=0');
  await drag(page, C, { x: 20, y: 0 });                       // toward E, ends about 1.4° out
  const s = await state(page);
  assert.ok(s.align > 0.5 && s.align < 3, `the release point is ${s.align.toFixed(2)}° from E; the test needs 0.5–3°`);
  assert.equal(s.mode, 'snap', `releasing ${s.align.toFixed(2)}° from E did not start a snap`);
  await until(page, () => window.__cloud.alignment() < 0.01, null, 3000, 'snap reaching E');
  await until(page, () => window.__cloud.mode() === 'idle', null, 1000, 'idle after the snap');

  await drag(page, C, { x: -10, y: 0 });                      // away from E, about 2.2° out
  const away = (await state(page)).align;
  await sleep(1500);
  const s2 = await state(page);
  assert.ok(away > 1.5, `the drag away ended only ${away.toFixed(2)}° from E`);
  near(s2.align, away, 0.01, 'alignment 1.5 s after a release that moved away from E');

  await reopen(page, 'az=70&el=14&tour=0');
  await drag(page, C, { x: 40, y: 0 });                       // toward E, ends about 22° out
  const far = (await state(page)).align;
  await sleep(1500);
  near((await state(page)).align, far, 0.01, `alignment 1.5 s after a release ${far.toFixed(1)}° from E`);
});

test('touch drag orbits and a pinch zooms the field of view only', async (t) => {
  const { context, page } = await open(t, 'az=0&el=0&tour=0', { hasTouch: true });
  const cdp = await context.newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });
  await touch('touchStart', [[300, 200]]);
  for (let i = 1; i <= 8; i++) { await touch('touchMove', [[300 + i * 10, 200]]); await sleep(16); }
  await sleep(250);
  await touch('touchEnd', []);
  const s0 = await state(page);
  near(s0.az, -80 * PER_PX, 0.05, 'az after an 80 px touch drag');
  near(s0.el, 0, 0.001, 'el after a horizontal touch drag');
  await touch('touchStart', [[270, 200], [370, 200]]);
  for (let i = 1; i <= 8; i++) { await touch('touchMove', [[270 - i * 10, 200], [370 + i * 10, 200]]); await sleep(16); }
  await touch('touchEnd', []);
  const s1 = await state(page);
  near(s1.fov, fovAt(2.6), 0.3, 'fov after pinching 100 px apart to 260 px');
  near(s1.az, s0.az, 0.001, 'az after the pinch'); near(s1.el, s0.el, 0.001, 'el after the pinch'); near(s1.align, s0.align, 0.001, 'alignment after the pinch');
});

test('zooming during a glide or a snap takes at once, does not stop it, and holds when it lands', async (t) => {
  const { page } = await open(t, 'az=0&el=0&tour=0');
  await page.click('#find');
  await sleep(700);
  await page.mouse.move(C.x, C.y);
  const g0 = await state(page);
  await page.mouse.wheel(0, -200);
  await sleep(100);
  const g = await state(page);
  assert.equal(g.mode, 'glide', `a wheel step during the glide left the mode at "${g.mode}"`);
  assert.ok(g.fov < g0.fov - 5, `a wheel step during the glide moved fov only from ${g0.fov.toFixed(2)} to ${g.fov.toFixed(2)}; it must zoom in at once`);
  await until(page, () => window.__cloud.mode() === 'idle', null, 5000, 'the glide ending after a wheel step');
  const g1 = await state(page);
  assert.ok(g1.align < 0.05, `the glide ended ${g1.align.toFixed(3)}° from E after a wheel step; it must still reach E`);
  near(g1.fov, g.fov, 0.01, 'fov once the glide has landed, against fov right after the wheel step');

  await reopen(page, 'az=44&el=14&tour=0');
  await drag(page, C, { x: 20, y: 0 });                       // release about 1.4° out: snap
  const s0 = await state(page);
  assert.equal(s0.mode, 'snap', 'the release near E did not start a snap');
  await page.keyboard.press('+');
  const s = await state(page);
  assert.equal(s.mode, 'snap', `the + key during the snap left the mode at "${s.mode}"`);
  assert.ok(s.fov < s0.fov - 2, `the + key during the snap moved fov only from ${s0.fov.toFixed(2)} to ${s.fov.toFixed(2)}; it must zoom in at once`);
  await until(page, () => window.__cloud.mode() === 'idle', null, 3000, 'the snap ending after +');
  const s1 = await state(page);
  assert.ok(s1.align < 0.05, `the snap ended ${s1.align.toFixed(3)}° from E after the + key; it must still reach E`);
  near(s1.fov, s.fov, 0.01, 'fov once the snap has landed, against fov right after the + key');
});

test('a pinch that starts at E, with a little first-finger slip, ends at E', async (t) => {
  const { context, page } = await open(t, 'az=38&el=14&tour=0', { hasTouch: true });
  const E = await page.evaluate(() => ({ ...window.__cloud.magic }));
  const s0 = await state(page);
  near(s0.align, 0, 0.001, `alignment at load with az=${E.az}, el=${E.el}`);
  const cdp = await context.newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });
  await touch('touchStart', [[300, 200]]);
  for (let i = 1; i <= 4; i++) { await touch('touchMove', [[300 + i, 200]]); await sleep(16); }    // 4 px of slip
  await touch('touchStart', [[304, 200], [404, 200]]);
  for (let i = 1; i <= 6; i++) { await touch('touchMove', [[304 - i * 10, 200], [404 + i * 10, 200]]); await sleep(16); }
  await touch('touchEnd', []);
  await sleep(1500);
  const s1 = await state(page);
  assert.ok(s1.fov < s0.fov - 5, `the pinch did not zoom: fov ${s0.fov.toFixed(2)} → ${s1.fov.toFixed(2)}`);
  assert.ok(s1.align < 0.05, `1.5 s after a pinch that started at E the camera is ${s1.align.toFixed(3)}° from E`);
});

test('a pinch after a deliberate one-finger drag away from E does not snap to E', async (t) => {
  const { context, page } = await open(t, 'az=38&el=13&tour=0', { hasTouch: true });
  const s0 = await state(page);
  near(s0.align, 1, 0.01, 'alignment at load with el one degree below E');
  const cdp = await context.newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });
  await touch('touchStart', [[300, 200]]);
  for (let i = 1; i <= 17; i++) { await touch('touchMove', [[300, 200 - i]]); await sleep(16); }  // 17 px up, past the 10 px slop
  const s1 = await state(page);
  assert.ok(s1.align > 4 && s1.align < 5.5, `the drag ended ${s1.align.toFixed(2)}° from E; the test needs 4–5.5°, inside the 6° snap zone but well past where it started`);
  await touch('touchStart', [[300, 183], [400, 183]]);
  for (let i = 1; i <= 6; i++) { await touch('touchMove', [[300 - i * 10, 183], [400 + i * 10, 183]]); await sleep(16); }
  await touch('touchEnd', []);
  await sleep(1500);
  const s2 = await state(page);
  assert.ok(s2.fov < s1.fov - 5, `the pinch did not zoom: fov ${s1.fov.toFixed(2)} → ${s2.fov.toFixed(2)}`);
  near(s2.align, s1.align, 0.01, 'alignment 1.5 s after a pinch that followed a drag away from E (a snap would bring it to 0)');
});
