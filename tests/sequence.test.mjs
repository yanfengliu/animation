// Gate: the sequence of the six messages and capture mode, through real input, and the picture at
// the sequence's holds.
// Bound: headless Chromium with SwiftShader WebGL2, the shipped page with the listed query strings,
// Playwright mouse, wheel and keyboard input and reduced-motion emulation. The camera's path is read
// on 390×300 CSS px pages and the pictures on 640×400 ones. The page is read only through
// window.__cloud, and frame by frame through an observer that wraps requestAnimationFrame, passes
// every frame through unchanged and records what the page reports after each one: mode(), target()
// and view(). The observer also records when the page can first hear a change of the
// reduced-motion preference: its list is created before the page's own, so it hears each change
// first, in the same task. Positions are compared with the eyes in tests/lib/messages.mjs, not the
// ones the page reports.
// Proves:
// - the tour at load (a visitor's URL, no query) holds at the start view, then glides to each
//   message's eye in sequence order and holds there exactly: every frame of a hold within 1e-6° of
//   the eye, for at least HOLD_MIN_MS of its 3 s, with target() naming that message (only its last
//   frames, within NEXT_MAX_MS, may already name the next one), and target() naming the next
//   message all the way through the glide to it. It then stops, idle exactly at "world", and the
//   page reports its six messages with these eyes in this order;
// - "Find the angle" names the next message in sequence order at each click and wraps from "world"
//   to hello world (seven clicks from the start view). Each click glides, every frame of the glide
//   names that message, and the camera comes to rest exactly at its eye (within 1e-6°) and stays
//   there for the frames drawn before the next click. From msg=a it goes to "beautiful" and lands there;
// - Play replays the sequence from where the camera is (from "world": a glide to hello world, a
//   hold there of at least HOLD_MIN_MS, then on toward the face), and a press stops it for good (once
//   the camera comes to rest, after a snap back to hello world's eye if the press was that close,
//   it stays put for 1.5 s);
// - with reduced motion the page does not play the sequence at load, and Play cuts: from the first
//   frame after the click every frame is exactly at an eye, hello world for at least 3.5 s of its
//   4 s and then the face;
// - reduced motion switched on SWITCH_MS into a glide toward hello world, of Play from "world" and
//   of capture mode from the start view: from the first frame after the page hears the change,
//   every frame is exactly at an eye, hello world for at least 3.5 s of its 4 s cut hold and then
//   the face. The frame before the change must be mid-glide, or the check fails;
// - none of these pages logs a console error or a page error;
// - #capture hides #readout, #hint, #find and #play (checkVisibility) and the cursor (cursor: none)
//   and plays the sequence at load; a click, a drag, a wheel step and the keys ArrowLeft, ArrowUp
//   and + do not stop or move it (the mode stays "tour" and the field of view stays put);
// - in capture mode a real Tab press changes no pixel of the screen: with msg=hello-world and t=0
//   the picture is still for 6.5 s, and the camera is checked at hello world's eye before the first
//   shot and after the second;
// - capture mode loops, from its hold at "world" back to a hold at hello world. The check reads the
//   frames from the start of the page up to that hold at hello world, and none after it, so a check
//   that starts late, when the loop has moved on, reads the same frames; and Escape ends it: the
//   chrome shows again, the cursor is "grab" and the camera stops where it was;
// - the pictures at the holds, with the particle clock frozen (t=0): capture mode at each of its six
//   holds in its first pass, Play (from "world") at the face's hold and the tour at load at the
//   face's hold each render as that eye set by URL (msg=<name>&t=0&tour=0), pixel for pixel. Over
//   the central region (CENTRE, clear of the bar and the hint), the absolute difference summed per
//   channel is at most MAX_RESIDUAL of the reference's light over the sky (exactly 0 measured).
//   Each frame is shot at least SHOT_LEAD_MS into its 3 s hold, by the page's own frames, with the
//   page reporting the camera exactly at the eye (within 1e-6°), in mode "tour" and naming that
//   message, before and after the shot, and reporting capture mode on for the capture shots only.
// The load tour and capture pages run in their own browsers from `before`, and so do the picture
// pages (capture mode in a fourth; the tour, then Play, then the references in a fifth), while the
// shorter tests run in a third. So the file takes about as long as the capture loop, about 55 s. It
// runs in a phase of its own, beside only the hygiene scan (tests/lib/phases.mjs).
// Does not prove: how the glides look or feel (easing, speed); the picture mid-glide, in a hold's
// first SHOT_LEAD_MS or after its shot, at Play's and the load tour's other holds (hello world's
// hold in the tour at load is tests/illusion.test.mjs's), in capture's later passes, at other
// viewports or zooms, or with the particle clock running; other input during the load tour or Play
// than the presses tested (tests/motion.test.mjs covers the load tour's press); reduced motion
// switched on during a hold, during "Find the angle" or during the load tour; capture's own timing
// (2 s at the start view; a looped pass about 44 s), the second and later passes of the capture
// loop, or behaviour under slow frame rates.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, newContext, waitFrames, state, until, drag, sleep, render, PAGE_URL } from './lib/harness.mjs';
import { decodePng, partsResidual } from './lib/image.mjs';
import { MESSAGES, NAMES, START, angleDeg, eyeAt } from './lib/messages.mjs';

const SMALL = { width: 390, height: 300 };
const WIDE = { width: 640, height: 400 };           // the picture pages: CENTRE (51–589 × 60–340 px) clears the bar (its bottom at 54 px) and the hint (its top at 351 px)
const C = { x: 195, y: 140 };                       // canvas, clear of the bar and the hint
const HOLD_MIN_MS = 2500;                           // each hold is HOLD_MS = 3000 in index.html; a frame or two of slack
const START_HOLD_MIN_MS = 1200;                     // the load tour's first hold at the start view is 1500 ms
const CUT_HOLD_MIN_MS = 3500;                       // with reduced motion Play holds CUT_HOLD_MS = 4000 at each eye
const TOUR_MS = 70000;                              // the load tour takes about 45 s and the capture loop's first pass about 51 s; time out well past both
const NEXT_MAX_MS = 100;                            // a hold's last frames may already name the next message for this long (see checkPasses)
const SWITCH_MS = 1000;                             // reduced motion switches on this long into a glide of 3.6 s (capture) or 4.35 s (Play)
const HOLD_WAIT_MS = 25000;                         // a picture page reaches each next hold within one glide and one hold (about 7.5 s)
const SHOT_LEAD_MS = 1500;                          // each picture starts at least this far into its 3 s hold; the shot takes about 0.1 s at 640×400
const CENTRE = [0.08, 0.92, 0.15, 0.85];            // the central region of tests/illusion.test.mjs's mode shots
const MAX_RESIDUAL = 0.001;                         // per channel, Σ|shot − reference| over the reference's light, as in tests/illusion.test.mjs: exactly 0 measured at every hold; 0.116–0.153 with text 1.25× brighter there (the reveal-in-* mutants)

// Records, after each animation frame, [time, mode, target, az, el] as the page reports them, and,
// for each change of the reduced-motion preference, [time, matches] as the page can first hear it.
const OBSERVER = () => {
  const raf = window.requestAnimationFrame.bind(window);
  window.__log = [];
  window.__heard = [];
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => window.__heard.push([performance.now(), e.matches]));
  window.requestAnimationFrame = (cb) => raf((ts) => {
    cb(ts);
    const c = window.__cloud;
    if (c && c.ready) { const v = c.view(); window.__log.push([performance.now(), c.mode(), c.target(), v.az, v.el]); }
  });
};

// The log as runs of frames with the same mode and the same place: "start" (the start view),
// a message's name (its eye), or "moving". Each run keeps its first and last time, and its frames'
// times and targets in order.
const where = (az, el) => { const k = eyeAt({ az, el }); return k >= 0 ? NAMES[k] : angleDeg({ az, el }, START) <= 1e-6 ? 'start' : 'moving'; };
function runs(log) {
  const out = [];
  for (const [t, mode, target, az, el] of log) {
    const at = where(az, el), last = out[out.length - 1];
    if (last && last.mode === mode && last.at === at) { last.t1 = t; last.times.push(t); last.targets.push(target); }
    else out.push({ mode, at, t0: t, t1: t, times: [t], targets: [target] });
  }
  return out;
}
// A run's targets with repeats counted, as in "hello-world×181,face×2".
const counted = (targets) => targets.reduce((a, x) => { const l = a[a.length - 1]; if (l && l[0] === x) l[1]++; else a.push([x, 1]); return a; }, []).map(([x, n]) => `${x ?? 'null'}${n > 1 ? '×' + n : ''}`).join(',');
const show = (rs) => rs.map((r) => `${r.mode} ${r.at} ${((r.t1 - r.t0) / 1000).toFixed(2)} s [${counted(r.targets)}]`).join(' → ');
const key = (r) => `${r.mode} ${r.at}`;

// The ways a run of the sequence, from run `i` of `rs` on, breaks the order: each message, from
// `first` (an index into NAMES) for `count` messages (wrapping), must be one or more frames moving
// toward it, all with target() naming it, then a hold exactly at its eye for at least `holdMin` ms,
// every frame naming it. Only the hold's last frames may already name the next message in the
// sequence, for at most NEXT_MAX_MS from the first of them to the last: on those frames the glide
// toward it has begun but has not yet moved the camera 1e-6°. Smootherstep takes about 5 ms of a
// 4.35 s glide, by the page's clock, to move it that far, but a frame's clock can lag the moment the
// glide began, so under load two frames or more can fall there. The last hold may be cut short by
// the end of the log when `openEnd` is set. Returns { broken, next } with next the index after the
// last run checked.
function checkPasses(rs, i, first, count, { holdMin = HOLD_MIN_MS, openEnd = false, mode = 'tour' } = {}) {
  const broken = [];
  for (let n = 0; n < count; n++) {
    const name = NAMES[(first + n) % NAMES.length];
    const glide = rs[i], hold = rs[i + 1];
    if (!glide || key(glide) !== `${mode} moving`) { broken.push(`before the hold at "${name}" the camera should move in mode ${mode}, but the log has ${glide ? key(glide) : 'nothing more'}`); break; }
    if (!glide.targets.every((x) => x === name)) broken.push(`while moving toward "${name}" target() named ${[...new Set(glide.targets)].join(', ')}`);
    if (!hold || key(hold) !== `${mode} ${name}`) { broken.push(`after moving toward "${name}" the camera should hold exactly at its eye in mode ${mode}, but the log has ${hold ? key(hold) : 'nothing more'}`); break; }
    const ahead = hold.targets.findIndex((x) => x !== name), next = NAMES[(first + n + 1) % NAMES.length];
    if (ahead >= 0 && !(hold.targets.slice(ahead).every((x) => x === next) && hold.t1 - hold.times[ahead] <= NEXT_MAX_MS)) broken.push(`during the hold at "${name}" target() named ${counted(hold.targets)}, where only frames in its last ${NEXT_MAX_MS} ms may name "${next}"`);
    const last = openEnd && n === count - 1;
    if (!last && !(hold.t1 - hold.t0 >= holdMin)) broken.push(`the hold at "${name}" lasted ${(hold.t1 - hold.t0).toFixed(0)} ms, less than ${holdMin} ms`);
    i += 2;
  }
  return { broken, next: i };
}
const assertNone = (broken, lead) => assert.ok(broken.length === 0, lead + broken.join('; '));
const ms = (x) => (typeof x === 'number' ? `${x.toFixed(0)} ms` : String(x));
const rgb = (a) => a.map((x) => x.toFixed(4)).join('/');

let browsers = [], tour, capture, pictures;
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
// What the page reports now, with the page's own clock.
const look = (page) => page.evaluate(() => {
  const c = window.__cloud, v = c.view();
  return { mode: c.mode(), target: c.target(), az: v.az, el: v.el, capture: c.capture, now: performance.now() };
});

// In the page: the time of the first frame of the hold that the last logged frame belongs to, when
// that frame is in mode tour, names the message and is exactly at its eye; otherwise null.
function holdFrom({ name, az, el }) {
  const L = window.__log, wrap = (d) => ((d % 360) + 540) % 360 - 180;
  const at = (e) => e[1] === 'tour' && e[2] === name && Math.abs(wrap(e[3] - az)) < 1e-6 && Math.abs(e[4] - el) < 1e-6;
  let i = L.length - 1;
  if (i < 0 || !at(L[i])) return null;
  while (i > 0 && at(L[i - 1])) i--;
  return L[i][0];
}
// Waits for the hold at message m's eye, then shoots it SHOT_LEAD_MS into the hold, with what the
// page reports just before and just after the shot.
async function shootHold(page, m) {
  await until(page, holdFrom, m, HOLD_WAIT_MS, `the camera holding at "${m.name}"`);
  const from = await page.evaluate(holdFrom, m);
  if (from === null) assert.fail(`the hold at "${m.name}" ended before it could be timed`);
  for (;;) {
    const left = from + SHOT_LEAD_MS - (await look(page)).now;
    if (left <= 0) break;
    await sleep(Math.min(left, 200));
  }
  const s0 = await look(page);
  const img = decodePng(await page.screenshot({ animations: 'disabled' }));
  const s1 = await look(page);
  return { name: m.name, img, s0, s1, into: s0.now - from };
}
// Opens `url` at 640×400, runs `start` (a real click) if given, and shoots the holds at `eyes` in order.
async function holdShots(browser, url, start, eyes) {
  const { context, page, errors } = await openIn(browser, url, WIDE);
  try {
    if (start) await start(page);
    const shots = [];
    for (const m of eyes) shots.push(await shootHold(page, m));
    return { shots, errors };
  } finally { await context.close(); }
}
// Each eye set by URL with the particle clock frozen, and the sky alone there (beta=0 leaves no text
// particles, and layer=text then draws none), at 640×400.
async function references(browser) {
  const { context, log: { errors } } = await newContext(browser, WIDE);
  try {
    const out = {};
    for (const m of MESSAGES) {
      const q = `msg=${m.name}&t=0&tour=0`;
      const ref = await render(context, q), sky = await render(context, q + '&beta=0&layer=text');
      out[m.name] = { ref: ref.img, sky: sky.img, at: [ref.state, sky.state] };
    }
    return { eyes: out, errors };
  } finally { await context.close(); }
}

before(async () => {
  // If one launch fails, the browsers that did start are closed before the error is passed on,
  // since an open browser would keep this file's process, and a whole mutation run, waiting.
  const launched = await Promise.allSettled(Array.from({ length: 5 }, () => startBrowser()));
  browsers = launched.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const failed = launched.find((r) => r.status === 'rejected');
  if (failed) {
    await Promise.allSettled(browsers.map((b) => b.close()));
    browsers = [];
    throw failed.reason;
  }
  // The pictures run in the background, one page per browser at a time, since two picture pages in
  // one browser slowed each shot to about 0.8 s: capture mode through its six holds in browser 3,
  // and in browser 4 the tour at load, then Play, then the references. The pictures test awaits them.
  const held = holdShots(browsers[3], PAGE_URL + '?t=0#capture', null, MESSAGES);
  const rest = (async () => {
    const tourAt = await holdShots(browsers[4], PAGE_URL + '?t=0', null, [MESSAGES[1]]);
    const play = await holdShots(browsers[4], PAGE_URL + '?msg=world&tour=0&t=0', (page) => page.click('#play'), [MESSAGES[1]]);
    return { tourAt, play, refs: await references(browsers[4]) };
  })();
  pictures = Promise.all([held, rest]);
  pictures.catch(() => {});                         // the pictures test reports a failure; nothing else should
  // The two long runs start first, each in its own browser, so the shorter tests run beside them.
  [tour, capture] = await Promise.all([openIn(browsers[0], PAGE_URL), openIn(browsers[1], PAGE_URL + '#capture')]);
});
after(async () => { await Promise.allSettled(browsers.map((b) => b.close())); });

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

test('in capture mode a Tab press changes nothing on screen: no focus outline', async (t) => {
  // msg=hello-world: capture mode holds 2 s at hello world's eye, glides 0° for 1.5 s and holds 3 s
  // there, and t=0 freezes the particles, so the picture stays still for 6.5 s.
  const { context, page, errors } = await openIn(browsers[2], PAGE_URL + '?msg=hello-world&t=0#capture', WIDE);
  t.after(() => context.close());
  const shoot = async () => decodePng(await page.screenshot({ animations: 'disabled' })).rgb;
  const focus = () => page.evaluate(() => {
    const el = document.activeElement, s = getComputedStyle(el);
    return { on: el.id ? '#' + el.id : el.tagName.toLowerCase(), focusVisible: el.matches(':focus-visible'), outline: `${s.outlineStyle} ${s.outlineWidth}` };
  });
  const s0 = await look(page), a = await shoot();
  await page.keyboard.press('Tab');
  const f = await focus(), b = await shoot(), s1 = await look(page);
  let changed = 0;
  for (let i = 0; i < a.length; i += 3) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) changed++;
  t.diagnostic(`before Tab ${JSON.stringify(s0)}; after Tab focus on ${f.on} (focus-visible ${f.focusVisible}, outline ${f.outline}), ${changed} px changed; ${JSON.stringify(s1)}`);
  const held = (s) => s.capture === true && s.mode === 'tour' && angleDeg(s, MESSAGES[0]) <= 1e-6;
  assert.ok(held(s0) && held(s1), `capture mode was not holding at hello world's eye through the two shots (before ${JSON.stringify(s0)}, after ${JSON.stringify(s1)}), so they cannot be compared`);
  assert.equal(changed, 0, `in capture mode a Tab press changed ${changed} px on screen (focus on ${f.on}, outline ${f.outline}); a recording must show no focus style`);
  noErrors(errors);
});

test('"Find the angle" goes to each message in sequence order, wraps to hello world, and lands exactly on the eye it names', async (t) => {
  const { context, page, errors } = await openIn(browsers[2], PAGE_URL + '?tour=0');
  t.after(() => context.close());
  const broken = [];
  // One click: the message the page names, then the frames from the click until the camera has come
  // to rest and drawn two more frames. The glide's frames must all name that message, and every
  // frame after the glide must be at rest exactly at its eye.
  const find = async () => {
    const from = (await log(page)).length;
    await page.click('#find');
    const name = await page.evaluate(() => window.__cloud.target());
    await until(page, () => window.__cloud.mode() === 'idle', null, 5000, `the glide toward "${name}" coming to rest`);
    await waitFrames(page, 2);
    const L = await log(page, from), k = NAMES.indexOf(name);
    const glide = L.filter((e) => e[1] === 'glide'), rest = L.slice(L.findLastIndex((e) => e[1] === 'glide') + 1);
    const named = [...new Set(glide.map((e) => e[2]))];
    if (k < 0) broken.push(`a click named ${JSON.stringify(name)}, which is not a message`);
    else if (!glide.length) broken.push(`the click that named "${name}" did not glide`);
    else if (named.length !== 1 || named[0] !== name) broken.push(`the glide toward "${name}" named ${named.join(', ')} on its frames`);
    else if (!rest.length || !rest.every((e) => e[1] === 'idle' && angleDeg({ az: e[3], el: e[4] }, MESSAGES[k]) <= 1e-6)) {
      const off = rest.map((e) => `${e[1]} ${angleDeg({ az: e[3], el: e[4] }, MESSAGES[k]).toFixed(6)}°`);
      broken.push(`the glide toward "${name}" came to rest away from its eye: the frames after it were ${off.slice(0, 3).join(', ') || 'none'}${rest.length > 3 ? ', …' : ''} from that eye`);
    }
    return name;
  };
  const named = [];
  for (let i = 0; i <= NAMES.length; i++) named.push(await find());
  t.diagnostic(`targets after each click from the start view: ${named.join(', ')}`);
  assert.deepEqual(named, [...NAMES, NAMES[0]], 'clicking "Find the angle" seven times from the start view must name each message in sequence order and then hello world again');
  assertNone(broken, '"Find the angle" must glide to the eye of the message it names: ');
  await page.goto(PAGE_URL + '?msg=a&tour=0');
  await waitFrames(page, 2);
  const at = await state(page);
  assert.ok(angleDeg(at, MESSAGES[3]) <= 1e-6, `msg=a put the camera ${angleDeg(at, MESSAGES[3]).toFixed(4)}° from the eye of "a"`);
  const next = await find();
  assert.equal(next, 'beautiful', `from msg=a "Find the angle" headed for "${next}", not "beautiful"`);
  assertNone(broken, 'from msg=a "Find the angle" must glide to the eye of "beautiful": ');
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

test('reduced motion switched on during a glide of Play or of capture mode cuts to its eye at once', async (t) => {
  // Play from "world" glides 4.35 s to hello world at once; capture mode holds 2 s at the start
  // view, then glides 3.6 s to hello world. Each page switches reduced motion on SWITCH_MS into
  // that glide.
  const cases = [['Play', PAGE_URL + '?msg=world&tour=0', (page) => page.click('#play')], ['capture mode', PAGE_URL + '#capture', null]];
  const seen = await Promise.all(cases.map(async ([what, url, start]) => {
    const { context, page, errors } = await openIn(browsers[2], url);
    try {
      if (start) await start(page);
      await until(page, () => window.__cloud.target() === 'hello-world' && window.__cloud.alignment() > 1e-3, null, 10000, `${what} gliding toward hello world`);
      await sleep(SWITCH_MS);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await until(page, () => window.__cloud.target() === 'face', null, 8000, `${what} going on to the face after the switch`);
      await sleep(200);
      return { what, L: await log(page), heard: await page.evaluate(() => window.__heard), errors };
    } finally { await context.close(); }
  }));
  const broken = [];
  for (const { what, L, heard } of seen) {
    const on = heard.find(([, matches]) => matches);
    if (!on) { broken.push(`${what}: the page never heard reduced motion switch on`); continue; }
    const last = L.filter((e) => e[0] < on[0]).at(-1), rs = runs(L.filter((e) => e[0] > on[0]));
    t.diagnostic(`${what}: the frame before the switch ${last ? `${last[1]} ${where(last[3], last[4])} [${last[2]}]` : 'none'}; after it ${show(rs)}`);
    if (!last || last[1] !== 'tour' || last[2] !== 'hello-world' || where(last[3], last[4]) !== 'moving') { broken.push(`${what}: the switch did not come in the glide toward hello world (the frame before it: ${JSON.stringify(last)}), so this check proves nothing`); continue; }
    const pattern = rs.map(key).join(' → ');
    if (pattern !== 'tour hello-world → tour face') broken.push(`${what}: from the first frame after the switch every frame must be in mode tour exactly at hello world's eye and then at the face's, but the log has ${show(rs)}`);
    else if (!(rs[0].t1 - rs[0].t0 >= CUT_HOLD_MIN_MS)) broken.push(`${what}: the cut hold at hello world lasted ${(rs[0].t1 - rs[0].t0).toFixed(0)} ms, less than ${CUT_HOLD_MIN_MS} ms`);
  }
  assertNone(broken, 'reduced motion switched on mid-glide must cut to the eye at once: ');
  for (const { errors } of seen) noErrors(errors);
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

test('capture mode at each of its six holds, and Play and the tour at load at the face, render as that eye set by URL, pixel for pixel', async (t) => {
  const [held, { tourAt, play, refs }] = await pictures;
  const broken = [];
  for (const m of MESSAGES) for (const s of refs.eyes[m.name].at) if (!(angleDeg(s, m) <= 1e-6)) broken.push(`msg=${m.name} set the camera ${angleDeg(s, m).toFixed(4)}° from its eye, so it is no reference`);
  for (const [what, set, inCapture] of [['capture mode', held, true], ['the tour at load', tourAt, false], ['Play from "world"', play, false]]) {
    for (const h of set.shots) {
      const m = MESSAGES[NAMES.indexOf(h.name)], r = refs.eyes[h.name];
      const d = partsResidual(h.img, r.sky, [r.ref], { region: CENTRE });
      const at = (s) => s.mode === 'tour' && s.target === h.name && angleDeg(s, m) <= 1e-6 && s.capture === inCapture;
      t.diagnostic(`${what} at "${h.name}": shot ${ms(h.into)} into the hold, ${ms(h.s1.now - h.s0.now)} for the shot and its reads; central residual r/g/b ${rgb(d.abs)} (signed ${rgb(d.signed)}; ${(100 * d.off).toFixed(3)}% of pixels off by more than 2 levels)`);
      if (!(at(h.s0) && at(h.s1))) broken.push(`${what}: the page did not report the camera holding at "${h.name}" in mode tour${inCapture ? ' in capture mode' : ''} before and after the shot: before ${JSON.stringify(h.s0)}, after ${JSON.stringify(h.s1)}`);
      if (!(h.into >= SHOT_LEAD_MS)) broken.push(`${what}: the shot at "${h.name}" started ${ms(h.into)} into the hold, where at least ${SHOT_LEAD_MS} ms is needed`);
      if (!d.abs.every((x) => x <= MAX_RESIDUAL)) broken.push(`${what} at "${h.name}": the central region differs from msg=${h.name} set by URL by ${rgb(d.abs)} of its light in red/green/blue (signed ${rgb(d.signed)}; ${(100 * d.off).toFixed(3)}% of pixels off by more than 2 levels); each must be at most ${MAX_RESIDUAL}`);
    }
  }
  assertNone(broken, 'the sequence must not change how an eye renders while it holds there: ');
  noErrors([...held.errors, ...tourAt.errors, ...play.errors, ...refs.errors]);
});

test('capture mode loops the sequence from "world" back to hello world, and Escape ends it', async (t) => {
  const { page } = capture;
  // The first pass, then the glide back to hello world and the start of its hold there.
  await until(page, (hw) => {
    const L = window.__log, w = L.findIndex((e) => e[2] === 'world');
    return w >= 0 && L.slice(w).some((e) => e[1] === 'tour' && e[2] === 'hello-world' && Math.abs(e[3] - hw.az) < 1e-6 && Math.abs(e[4] - hw.el) < 1e-6);
  }, MESSAGES[0], TOUR_MS, 'capture mode heading for "world" and then holding at hello world again');
  // Only the frames up to the first hold at hello world after the hold at "world" are read: when this
  // test starts late, the loop has moved on, and the frames after that hold are not part of the pass.
  const all = runs(await log(page)), w = all.findIndex((r) => r.at === 'world');
  const back = w < 0 ? -1 : all.findIndex((r, j) => j > w && r.at === NAMES[0]);
  const rs = back < 0 ? all : all.slice(0, back + 1);
  t.diagnostic(`capture mode: ${show(rs)}${rs.length < all.length ? `; then ${all.length - rs.length} more runs, not read` : ''}`);
  const broken = [];
  if (!rs.every((r) => r.mode === 'tour')) broken.push(`every frame in capture mode must be in mode "tour", but the log has ${show(rs.filter((r) => r.mode !== 'tour'))}`);
  let i = 0;
  if (!rs[0] || key(rs[0]) !== 'tour start') broken.push(`capture must start with a hold at the start view, but the log starts with ${rs[0] ? key(rs[0]) : 'nothing'}`);
  else i = 1;
  const pass = checkPasses(rs, i, 0, NAMES.length + 1, { openEnd: true });
  broken.push(...pass.broken);
  if (!broken.length && pass.next !== rs.length) broken.push(`the log has more runs before the loop's return to hello world: ${show(rs.slice(pass.next))}`);
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
