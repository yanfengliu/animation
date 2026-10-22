// Gate: the sequence of the six messages and capture mode, through real input.
// Bound: headless Chromium with SwiftShader WebGL2 at 390×300 CSS px, the shipped page with the
// listed query strings, Playwright mouse, wheel and keyboard input. The page is read only through
// window.__cloud, and frame by frame through an observer that wraps requestAnimationFrame, passes
// every frame through unchanged and records what the page reports after each one: mode(),
// target() and view(). Positions are compared with the eyes in tests/lib/messages.mjs, not the
// ones the page reports. This file proves the camera's path and the chrome's visibility, not the
// picture: what each eye shows is tests/illusion.test.mjs's job.
// Proves:
// - the tour at load (a visitor's URL, no query) holds at the start view, then glides to each
//   message's eye in sequence order and holds there exactly: every frame of a hold within 1e-6° of
//   the eye, for at least HOLD_MIN_MS of its 3 s, with target() naming that message, and target()
//   naming the next message all the way through the glide to it. It then stops, idle exactly at
//   "world", and the page reports its six messages with these eyes in this order;
// - "Find the angle" names the next message in sequence order at each click and wraps from "world"
//   to hello world (seven clicks from the start view), landing exactly on hello world's eye; from
//   msg=a it goes to "beautiful";
// - Play replays the sequence from where the camera is (from "world": a glide to hello world, a
//   hold there of at least HOLD_MIN_MS, then on toward the face), and a press stops it for good (once
//   the camera comes to rest, after a snap back to hello world's eye if the press was that close,
//   it stays put for 1.5 s);
// - with reduced motion the page does not play the sequence at load, and Play cuts: from the first
//   frame after the click every frame is exactly at an eye, hello world for at least 3.5 s of its
//   4 s and then the face;
// - none of these pages logs a console error or a page error;
// - #capture hides #readout, #hint, #find and #play (checkVisibility) and the cursor (cursor: none)
//   and plays the sequence at load; a click, a drag, a wheel step and the keys ArrowLeft, ArrowUp
//   and + do not stop or move it (the mode stays "tour" and the field of view stays put); it
//   loops, from its hold at "world" back to a hold at hello world; and Escape ends it: the chrome
//   shows again, the cursor is "grab" and the camera stops where it was.
// The load tour and capture pages run in their own browsers from `before`, while the shorter tests
// run in a third, so the file takes about as long as the capture loop (about 51 s).
// Does not prove: how the glides look or feel (easing, speed), the picture at any eye, other input
// during the load tour or Play than the presses tested (tests/motion.test.mjs covers the load
// tour's press), capture's own timing (2 s at the start view; a looped pass about 44 s), the second
// and later passes of the capture loop, or behaviour under slow frame rates.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, newContext, waitFrames, state, until, drag, sleep, PAGE_URL } from './lib/harness.mjs';
import { MESSAGES, NAMES, START, angleDeg, eyeAt } from './lib/messages.mjs';

const SMALL = { width: 390, height: 300 };
const C = { x: 195, y: 140 };                       // canvas, clear of the bar and the hint
const HOLD_MIN_MS = 2500;                           // each hold is HOLD_MS = 3000 in index.html; a frame or two of slack
const START_HOLD_MIN_MS = 1200;                     // the load tour's first hold at the start view is 1500 ms
const CUT_HOLD_MIN_MS = 3500;                       // with reduced motion Play holds CUT_HOLD_MS = 4000 at each eye
const TOUR_MS = 70000;                              // the load tour takes about 45 s and the capture loop's first pass about 51 s; time out well past both

// Records, after each animation frame, [time, mode, target, az, el] as the page reports them.
const OBSERVER = () => {
  const raf = window.requestAnimationFrame.bind(window);
  window.__log = [];
  window.requestAnimationFrame = (cb) => raf((ts) => {
    cb(ts);
    const c = window.__cloud;
    if (c && c.ready) { const v = c.view(); window.__log.push([performance.now(), c.mode(), c.target(), v.az, v.el]); }
  });
};

// The log as runs of frames with the same mode and the same place: "start" (the start view),
// a message's name (its eye), or "moving". Each run keeps its first and last time, its frames'
// targets in order, and its frame count.
const where = (az, el) => { const k = eyeAt({ az, el }); return k >= 0 ? NAMES[k] : angleDeg({ az, el }, START) <= 1e-6 ? 'start' : 'moving'; };
function runs(log) {
  const out = [];
  for (const [t, mode, target, az, el] of log) {
    const at = where(az, el), last = out[out.length - 1];
    if (last && last.mode === mode && last.at === at) { last.t1 = t; last.targets.push(target); }
    else out.push({ mode, at, t0: t, t1: t, targets: [target] });
  }
  return out;
}
const show = (rs) => rs.map((r) => `${r.mode} ${r.at} ${((r.t1 - r.t0) / 1000).toFixed(2)} s [${[...new Set(r.targets)].join(',')}]`).join(' → ');
const key = (r) => `${r.mode} ${r.at}`;

// The ways a run of the sequence, from run `i` of `rs` on, breaks the order: each message, from
// `first` (an index into NAMES) for `count` messages (wrapping), must be one or more frames moving
// toward it, all with target() naming it, then a hold exactly at its eye for at least `holdMin` ms,
// every frame but the last naming it (the last may already name the next). The last hold may be cut
// short by the end of the log when `openEnd` is set. Returns { broken, next } with next the index
// after the last run checked.
function checkPasses(rs, i, first, count, { holdMin = HOLD_MIN_MS, openEnd = false, mode = 'tour' } = {}) {
  const broken = [];
  for (let n = 0; n < count; n++) {
    const name = NAMES[(first + n) % NAMES.length];
    const glide = rs[i], hold = rs[i + 1];
    if (!glide || key(glide) !== `${mode} moving`) { broken.push(`before the hold at "${name}" the camera should move in mode ${mode}, but the log has ${glide ? key(glide) : 'nothing more'}`); break; }
    if (!glide.targets.every((x) => x === name)) broken.push(`while moving toward "${name}" target() named ${[...new Set(glide.targets)].join(', ')}`);
    if (!hold || key(hold) !== `${mode} ${name}`) { broken.push(`after moving toward "${name}" the camera should hold exactly at its eye in mode ${mode}, but the log has ${hold ? key(hold) : 'nothing more'}`); break; }
    if (!hold.targets.slice(0, -1).every((x) => x === name)) broken.push(`during the hold at "${name}" target() named ${[...new Set(hold.targets)].join(', ')}`);
    const last = openEnd && n === count - 1;
    if (!last && !(hold.t1 - hold.t0 >= holdMin)) broken.push(`the hold at "${name}" lasted ${(hold.t1 - hold.t0).toFixed(0)} ms, less than ${holdMin} ms`);
    i += 2;
  }
  return { broken, next: i };
}
const assertNone = (broken, lead) => assert.ok(broken.length === 0, lead + broken.join('; '));

let browsers = [], tour, capture;
async function openIn(browser, url, opts = {}) {
  const { context, log } = await newContext(browser, { ...SMALL, initScript: OBSERVER, ...opts });
  const page = await context.newPage();
  await page.goto(url);
  await waitFrames(page, 2);
  return { context, page, errors: log.errors };
}
const log = (page, from = 0) => page.evaluate((n) => window.__log.slice(n), from);
const noErrors = (errors) => assert.deepEqual(errors, [], 'the page logged errors');
const visible = (page) => page.evaluate(() => Object.fromEntries(['readout', 'hint', 'find', 'play'].map((id) => [id, document.getElementById(id).checkVisibility()])));
const cursor = (page) => page.evaluate(() => getComputedStyle(document.getElementById('scene')).cursor);

before(async () => {
  browsers = await Promise.all([0, 1, 2].map(() => startBrowser()));
  // The two long runs start first, each in its own browser, so the shorter tests run beside them.
  [tour, capture] = await Promise.all([openIn(browsers[0], PAGE_URL), openIn(browsers[1], PAGE_URL + '#capture')]);
});
after(async () => { await Promise.all(browsers.map((b) => b.close())); });

test('capture mode hides the chrome and the cursor, and pointer, wheel and keys do not stop or move it', async (t) => {
  const { page } = capture;
  const s0 = await state(page);
  const shown = await visible(page), cur = await cursor(page), flag = await page.evaluate(() => window.__cloud.capture);
  t.diagnostic(`at load with #capture: ${JSON.stringify(s0)}; visible ${JSON.stringify(shown)}; cursor ${cur}; capture ${flag}`);
  assert.equal(flag, true, 'window.__cloud.capture is not true on a page opened with #capture');
  assert.deepEqual(Object.entries(shown).filter(([, v]) => v).map(([id]) => `#${id}`), [], 'capture mode must hide the readout, the hint and both buttons, but these still show');
  assert.equal(cur, 'none', `capture mode must hide the cursor over the scene, but its cursor is "${cur}"`);
  assert.equal(s0.mode, 'tour', `capture mode must play the sequence at load, but the mode is "${s0.mode}"`);
  // Real input: a click, a drag, a wheel step and keys, each of which steers the camera outside capture.
  await page.mouse.click(C.x, C.y);
  await drag(page, C, { x: 60, y: 20 });
  await page.mouse.wheel(0, -300);
  for (const k of ['ArrowLeft', 'ArrowUp', '+']) await page.keyboard.press(k);
  await sleep(300);
  const s1 = await state(page);
  t.diagnostic(`after a click, a drag, a wheel step and ArrowLeft, ArrowUp and +: ${JSON.stringify(s1)}`);
  assert.equal(s1.mode, 'tour', `in capture mode the input left the mode at "${s1.mode}"; only Escape may stop the sequence`);
  assert.ok(Math.abs(s1.fov - s0.fov) < 1e-6, `in capture mode the wheel or + changed the field of view from ${s0.fov.toFixed(3)} to ${s1.fov.toFixed(3)}`);
  const modes = new Set((await log(page)).map((e) => e[1]));
  assert.deepEqual([...modes], ['tour'], `in capture mode every frame must be in mode "tour", but the log has ${[...modes].join(', ')}`);
});

test('"Find the angle" goes to each message in sequence order and wraps to hello world', async (t) => {
  const { context, page, errors } = await openIn(browsers[2], PAGE_URL + '?tour=0');
  t.after(() => context.close());
  const named = [];
  for (let i = 0; i <= NAMES.length; i++) {
    await page.click('#find');
    named.push(await page.evaluate(() => window.__cloud.target()));
  }
  t.diagnostic(`targets after each click from the start view: ${named.join(', ')}`);
  assert.deepEqual(named, [...NAMES, NAMES[0]], 'clicking "Find the angle" seven times from the start view must name each message in sequence order and then hello world again');
  await until(page, () => window.__cloud.mode() === 'idle', null, 5000, 'the last glide landing');
  const s = await state(page);
  assert.ok(angleDeg(s, MESSAGES[0]) <= 1e-6, `the last glide ended ${angleDeg(s, MESSAGES[0]).toFixed(6)}° from hello world's eye`);
  await page.goto(PAGE_URL + '?msg=a&tour=0');
  await waitFrames(page, 2);
  const at = await state(page);
  assert.ok(angleDeg(at, MESSAGES[3]) <= 1e-6, `msg=a put the camera ${angleDeg(at, MESSAGES[3]).toFixed(4)}° from the eye of "a"`);
  await page.click('#find');
  const next = await page.evaluate(() => window.__cloud.target());
  assert.equal(next, 'beautiful', `from msg=a "Find the angle" headed for "${next}", not "beautiful"`);
  noErrors(errors);
});

test('Play replays the sequence from where the camera is, and a press stops it', async (t) => {
  const { context, page, errors } = await openIn(browsers[2], PAGE_URL + '?msg=world&tour=0');
  t.after(() => context.close());
  const from = (await log(page)).length;
  await page.click('#play');
  const s0 = await page.evaluate(() => ({ mode: window.__cloud.mode(), target: window.__cloud.target() }));
  assert.deepEqual(s0, { mode: 'tour', target: 'hello-world' }, 'clicking Play at "world" must start the sequence toward hello world');
  await until(page, () => window.__cloud.target() === 'face', null, 15000, 'Play reaching hello world and moving on toward the face');
  const rs = runs(await log(page, from));
  t.diagnostic(`after Play: ${show(rs)}`);
  let i = 0;
  while (rs[i] && rs[i].at === 'world') i++;   // idle there before the click, and the frame of the click if it had not moved yet
  const { broken, next } = checkPasses(rs, i, 0, 1);
  const tail = rs.slice(next);
  if (!tail.every((r) => r.mode === 'tour' && r.at === 'moving' && r.targets.every((x) => x === 'face'))) broken.push(`after the hold at hello world the camera should be moving toward the face, but the log has ${show(tail)}`);
  assertNone(broken, 'Play must replay the sequence from "world": ');
  await page.mouse.move(C.x, C.y);
  await page.mouse.down();
  assert.equal((await state(page)).mode, 'drag', 'a press during Play did not take the camera');
  await sleep(250);
  await page.mouse.up();
  // Released this close to hello world's eye, the camera may snap back to it; then it must stay put.
  await until(page, () => window.__cloud.mode() === 'idle', null, 3000, 'the camera coming to rest after the press');
  const r0 = await state(page);
  await sleep(1500);
  const r1 = await state(page);
  assert.equal(r1.mode, 'idle', `1.5 s after the camera came to rest from a press during Play the mode is "${r1.mode}"`);
  assert.ok(angleDeg(r0, r1) < 1e-6, `after the camera came to rest from the press it still moved ${angleDeg(r0, r1).toFixed(4)}°, so the sequence went on`);
  noErrors(errors);
});

test('reduced motion: no sequence at load, and Play cuts from eye to eye', async (t) => {
  const { context, page, errors } = await openIn(browsers[2], PAGE_URL, { reducedMotion: 'reduce' });
  t.after(() => context.close());
  await sleep(1500);
  const s0 = await state(page);
  assert.equal(s0.mode, 'idle', `with reduced motion the mode is "${s0.mode}" 1.5 s after load`);
  assert.ok(angleDeg(s0, START) <= 1e-6, `with reduced motion the camera left the start view at load (${angleDeg(s0, START).toFixed(3)}° away)`);
  const from = (await log(page)).length;
  await page.click('#play');
  await until(page, () => window.__cloud.target() === 'face', null, 8000, 'the cut to the face');
  await sleep(200);
  const rs = runs(await log(page, from));
  t.diagnostic(`after Play with reduced motion: ${show(rs)}`);
  const broken = [];
  while (rs[0] && key(rs[0]) === 'idle start') rs.shift();   // the frames before the click
  const pattern = rs.map(key).join(' → ');
  if (pattern !== 'tour hello-world → tour face') broken.push(`every frame after the click must be in mode tour exactly at hello world's eye and then at the face's, but the log has ${show(rs)}`);
  else if (!(rs[0].t1 - rs[0].t0 >= CUT_HOLD_MIN_MS)) broken.push(`the cut hold at hello world lasted ${(rs[0].t1 - rs[0].t0).toFixed(0)} ms, less than ${CUT_HOLD_MIN_MS} ms`);
  assertNone(broken, 'with reduced motion Play must cut from eye to eye: ');
  noErrors(errors);
});

test('the tour at load holds at each message in sequence order and ends idle at "world"', async (t) => {
  const { page } = tour;
  const reported = await page.evaluate(() => window.__cloud.messages.map((m) => ({ name: m.name, az: m.az, el: m.el })));
  assert.deepEqual(reported, MESSAGES.map((m) => ({ ...m })), 'window.__cloud.messages must list the six messages in sequence order with their eyes');
  await until(page, () => window.__cloud.mode() === 'idle', null, TOUR_MS, 'the tour at load ending');
  await sleep(300);
  const rs = runs(await log(page));
  t.diagnostic(`the tour at load: ${show(rs)}`);
  const broken = [];
  let i = 0;
  if (!rs[0] || key(rs[0]) !== 'tour start') broken.push(`the tour must start with a hold at the start view, but the log starts with ${rs[0] ? key(rs[0]) : 'nothing'}`);
  else if (!(rs[0].t1 - rs[0].t0 >= START_HOLD_MIN_MS)) broken.push(`the hold at the start view lasted ${(rs[0].t1 - rs[0].t0).toFixed(0)} ms, less than ${START_HOLD_MIN_MS} ms`);
  else i = 1;
  const pass = checkPasses(rs, i, 0, NAMES.length);
  broken.push(...pass.broken);
  const end = rs.slice(pass.next);
  if (!broken.length && !(end.length === 1 && key(end[0]) === 'idle world')) broken.push(`after the hold at "world" the camera must stop there, idle, but the log has ${show(end) || 'nothing more'}`);
  const s = await page.evaluate(() => window.__cloud.target());
  if (s !== 'world') broken.push(`at the end of the tour target() names ${JSON.stringify(s)}, not "world"`);
  assertNone(broken, 'the tour at load must hold at the six messages in order: ');
  noErrors(tour.errors);
});

test('capture mode loops the sequence from "world" back to hello world, and Escape ends it', async (t) => {
  const { page } = capture;
  // The first pass, then the glide back to hello world and the start of its hold there.
  await until(page, (hw) => {
    const L = window.__log, w = L.findIndex((e) => e[2] === 'world');
    return w >= 0 && L.slice(w).some((e) => e[1] === 'tour' && e[2] === 'hello-world' && Math.abs(e[3] - hw.az) < 1e-6 && Math.abs(e[4] - hw.el) < 1e-6);
  }, MESSAGES[0], TOUR_MS, 'capture mode heading for "world" and then holding at hello world again');
  const rs = runs(await log(page));
  t.diagnostic(`capture mode: ${show(rs)}`);
  const broken = [];
  if (!rs.every((r) => r.mode === 'tour')) broken.push(`every frame in capture mode must be in mode "tour", but the log has ${show(rs.filter((r) => r.mode !== 'tour'))}`);
  let i = 0;
  if (!rs[0] || key(rs[0]) !== 'tour start') broken.push(`capture must start with a hold at the start view, but the log starts with ${rs[0] ? key(rs[0]) : 'nothing'}`);
  else i = 1;
  const pass = checkPasses(rs, i, 0, NAMES.length + 1, { openEnd: true });
  broken.push(...pass.broken);
  if (!broken.length && pass.next !== rs.length) broken.push(`after the loop came back to hello world the log has more: ${show(rs.slice(pass.next))}`);
  assertNone(broken, 'capture mode must loop the sequence: ');
  const s0 = await state(page);
  await page.keyboard.press('Escape');
  const s1 = await state(page);
  const shown = await visible(page), cur = await cursor(page), flag = await page.evaluate(() => window.__cloud.capture);
  await sleep(1000);
  const s2 = await state(page);
  t.diagnostic(`Escape: ${JSON.stringify(s0)} → ${JSON.stringify(s1)} → 1 s later ${JSON.stringify(s2)}; visible ${JSON.stringify(shown)}; cursor ${cur}; capture ${flag}`);
  assert.equal(flag, false, 'after Escape window.__cloud.capture is still true');
  assert.deepEqual(Object.entries(shown).filter(([, v]) => !v).map(([id]) => `#${id}`), [], 'after Escape the readout, the hint and both buttons must show again, but these are hidden');
  assert.equal(cur, 'grab', `after Escape the scene's cursor is "${cur}", not "grab"`);
  assert.equal(s2.mode, 'idle', `1 s after Escape the mode is "${s2.mode}"`);
  assert.ok(angleDeg(s1, s2) < 1e-6, `after Escape the camera still moved ${angleDeg(s1, s2).toFixed(4)}°`);
  noErrors(capture.errors);
});
