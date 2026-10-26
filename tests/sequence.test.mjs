// Gate: the sequence of the six messages and capture mode, through real input, and the picture at
// the sequence's holds and at "Find the angle" landings.
// Bound: headless Chromium with SwiftShader WebGL2, the shipped page with the listed query strings,
// Playwright mouse, wheel and keyboard input and reduced-motion emulation. The camera's path is read
// on 390×300 CSS px pages and the pictures on 640×400 ones. The page is read only through
// window.__cloud, and frame by frame through an observer that wraps requestAnimationFrame, passes
// every frame through unchanged and records what the page reports after each one: mode(), target()
// and view(), with the time and the frame's own stamp, the timestamp the page's frame callback gets
// and steps its moves by. The observer also records when the page can first hear a change of the
// reduced-motion preference, each key press and each click: its listeners are created before the
// page's own, so it hears each first, in the same task. Positions are compared with the eyes in
// tests/lib/messages.mjs, not the ones the page reports. Durations that the page times are judged
// by the frames' stamps, which a frame drawn late does not move (review round 2, F90, F92), except
// the hold at the start view, judged by when its first and last frames were logged (F100).
// Proves:
// - the tour at load (a visitor's URL, no query) holds at the start view, then glides to each
//   message's eye in sequence order and holds there exactly: every frame of a hold within 1e-6° of
//   the eye, the hold lasting at least HOLD_MIN_MS of its 3 s by the frames' stamps, target() naming
//   that message, and target() naming the next message all the way through the glide to it. The
//   glide to the next message begins in the frame that ends the hold, which already names it, and
//   moves the camera 1e-6° only about 5 ms later by the page's clock; so only frames from the first
//   one that names it may name it, and each later one still at the eye must be stamped within
//   NEXT_STAMP_MS of the end of that first one. It then stops, idle exactly at "world", and the page
//   reports its six messages with these eyes in this order;
// - "Find the angle" names the next message in sequence order at each click and wraps from "world"
//   to hello world (seven clicks from the start view). Each click glides, every frame of the glide
//   names that message, and the camera comes to rest exactly at its eye (within 1e-6°) and stays
//   there for the frames drawn before the next click. From msg=a it goes to "beautiful" and lands there;
// - Play replays the sequence from where the camera is (from "world": a glide to hello world, a
//   hold there of at least HOLD_MIN_MS, then on toward the face), and a press stops it for good (once
//   the camera comes to rest, after a snap back to hello world's eye if the press was that close,
//   it stays put for 1.5 s);
// - with reduced motion the page does not play the sequence at load, and Play cuts: every frame
//   after the click is in mode tour exactly at hello world's eye and then at the face's, and no
//   frame stamped less than CUT_HOLD_MIN_MS after the click is at the face (the cut hold is 4 s);
// - reduced motion switched on SWITCH_MS into a glide toward hello world, of Play from "world" and
//   of capture mode from the start view, cuts at once: every frame after the page hears the change
//   is in mode tour exactly at hello world's eye and then at the face's, and no frame stamped less
//   than CUT_HOLD_MIN_MS after the change is at the face (the cut hold begins at the change). The
//   frame before the change must be mid-glide;
// - for both cut holds a frame must be stamped in the last CUT_WINDOW_MS before that bound, or a hold
//   that ended before the bound could pass unseen; that frame shows only that the hold lasted until
//   it, so a hold that ends inside the window can still pass (F96). A missed setup condition fails
//   the test as an error, not a check, since the check could not judge (F90);
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
//   chrome shows again, the cursor is "grab" and the camera stops at once. Escape is pressed while
//   the loop glides on, at least ESC_LEAD_DEG from the eye it glides to, and from the first frame
//   after the press every frame for 1.3 s is idle where the frame before the press was. That frame
//   must be mid-glide (in mode tour, at no eye, moved since the frame before it), or the test fails
//   as an error: a press in a hold's first frame could not show a glide that runs on (F91).
//   Escape also takes the bare #capture anchor out of the address, in the same document, so going
//   to the address with #capture again (as a viewer adding it in the address bar) starts capture
//   mode again, chrome and cursor hidden, and a second Escape ends it and takes the anchor out again;
// - on a host that blocks history changes (replaceState and pushState throw), Escape still ends
//   capture mode and shows the chrome, without a page error, and the anchor stays;
// - the pictures, with the particle clock frozen (t=0): capture mode at each of its six holds in its
//   first pass; the tour at load at the face's hold, then idle at "world" where it ends, shot as
//   soon as the camera rests there and again DWELL_MS later; then "Find the angle", clicked on that
//   page six times, landing at each eye from hello world round to "world", each landing shot as
//   soon as the camera rests there (F88); then Play, clicked there, at the face's hold; and "Find
//   the angle" landing at each of the five later eyes on pages of their own (a real click from the
//   eye before it, set by msg=<that message>&tour=0), shot as soon as the camera rests there and
//   again DWELL_MS later. Each must render as that eye set by URL (msg=<name>&t=0&tour=0), pixel for
//   pixel: each shot is clipped to the central region (CENTRE, clear of the bar and the hint), and
//   the absolute difference summed per channel is at most MAX_RESIDUAL of the reference's light
//   over the sky. Each shot's diagnostic also counts exactly the channel values that differ (F87).
//   Each hold is shot at least SHOT_LEAD_MS into its 3 s, by the page's own frames, with the page
//   reporting the camera exactly at the eye (within 1e-6°), in mode "tour" and naming that message,
//   before and after the shot, and reporting capture mode on for the capture shots only; each rest
//   likewise in mode "idle", the second shot at least DWELL_MS after the first frame there. The
//   page's state is read once just before the shot and once just after it, and the shot is decoded
//   after the second read.
//   A hold shot missed its hold when the hold came and went before the test could shoot it, or when
//   its reads find the sequence moved on (target() naming the next message) with the second read
//   more than HOLD_MS after the stamp of the hold's first frame (the page began it at or after that
//   stamp). That is a timing miss, not a page defect: its picture is not compared. In capture mode a
//   missed hold is shot once more on the loop's next pass (F93); a second miss, or a miss at the
//   tour's or Play's hold, fails the test as an error, never as a check. But a capture hold that no
//   poll sees ends in a check at the wait for the next hold (F98), as does a shot whose reads take
//   over about 8.9 s, which finds target() two messages on (F100).
//   Leaving the eye in any other way, or within HOLD_MS, is a check, as is any residual.
//   That each shot starts at least its lead into the hold or rest holds by construction: the test
//   waits until then by the page's own clock before its first read, so no page can turn it red;
//   it guards against that wait not happening.
// The load tour and capture pages run in their own browsers from `before`, and so do the picture
// pages: capture mode in a fourth, and the tour at load, its landings and Play on one page, in a
// fifth. Once capture's six holds and the tour's hold at the face are shot, the five other "Find the
// angle" pages start at once, two in the fourth, one in the fifth and two in a sixth, where the
// references render after them. The tour page's landings wait for capture's holds, and its Play for
// the five landing pages and the references, so no hold is shot while a landing page or a reference
// load runs. A landing and the tour's rest at "world" have no end, so their shots may be slow.
// The shorter tests run in a third. So the file takes about as long as the tour, its dwell at
// "world", six landings and Play's way to the face, about 85 s. It runs in a phase of its own,
// beside only the hygiene scan (tests/lib/phases.mjs).
// Does not prove: how the glides look or feel (easing, speed); the picture mid-glide, in a hold's
// first SHOT_LEAD_MS or after its shot, at Play's and the load tour's other holds (hello world's
// hold in the tour at load is tests/illusion.test.mjs's), in capture's later passes (but for a
// retried hold), at a rest between its two shots or after DWELL_MS (the tour page's landings are shot
// on arrival only), after histories other than those above (such as "Find the angle" clicked
// during the tour or after Play, or a landing after a drag, a key, a zoom or a snap), Play from
// elsewhere than "world", at other viewports or zooms, or with the particle clock running; other
// input during the load tour or Play than the presses tested (tests/motion.test.mjs covers the load
// tour's press); reduced motion switched on during a hold or during the load tour
// (tests/motion.test.mjs covers a "Find the angle" glide, a snap and a coast); Escape during a hold
// of capture mode; capture's own timing (2 s at the start view; a looped pass about 44 s), the
// second and later passes of the capture loop, a viewer's real address bar (the test navigates the
// page to the address with the anchor), or behaviour under slow frame rates.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, newContext, waitFrames, state, until, setup, drag, sleep, render, PAGE_URL } from './lib/harness.mjs';
import { decodePng, crop, partsResidual } from './lib/image.mjs';
import { MESSAGES, NAMES, START, angleDeg, eyeAt } from './lib/messages.mjs';

const SMALL = { width: 390, height: 300 };
const WIDE = { width: 640, height: 400 };           // the picture pages: CENTRE (51–589 × 60–340 px) clears the bar (its bottom at 54 px) and the hint (its top at 351 px)
const C = { x: 195, y: 140 };                       // canvas, clear of the bar and the hint
const HOLD_MS = 3000;                               // each hold of the sequence, as in index.html: a hold shot whose second read comes later than this after the stamp of the hold's first frame, with the sequence moved on, missed the hold
const HOLD_MIN_MS = 2500;                           // each hold is HOLD_MS; a frame or two of slack
const START_HOLD_MIN_MS = 1200;                     // the load tour's first hold at the start view is 1500 ms
const CUT_HOLD_MIN_MS = 3500;                       // with reduced motion Play holds CUT_HOLD_MS = 4000 at each eye
const TOUR_MS = 70000;                              // the load tour takes about 45 s and the capture loop's first pass about 51 s; time out well past both
const NEXT_STAMP_MS = 10;                           // a frame still at a hold's eye after the glide to the next message began must be stamped within this of the end of the frame that began it: smootherstep moves the camera 1e-6° in about 5.3 ms of a 4.4 s, 58° glide, by the page's clock (see checkPasses)
const CUT_WINDOW_MS = 1000;                         // a frame must be stamped in this last stretch before CUT_HOLD_MIN_MS for a cut-hold check to judge: 500 ms missed twice in 34 mutant runs whose pages cut as the real one does (2026-10-22)
const SWITCH_MS = 1000;                             // reduced motion switches on this long into a glide of 3.6 s (capture) or 4.35 s (Play)
const ESC_LEAD_DEG = 5;                             // Escape is pressed at least this far from the eye the capture loop glides to, about 0.8 s before it lands
const LOOP_WAIT_MS = 60000;                         // capture's next pass, about 44 s on, reaches a missed hold again within this
const HOLD_WAIT_MS = 25000;                         // a picture page reaches each next hold within one glide and one hold (about 7.5 s)
const SHOT_LEAD_MS = 1500;                          // each picture starts at least this far into its 3 s hold
const DWELL_MS = 8000;                              // after each "Find the angle" landing the camera rests this long before its second shot, as at E in tests/illusion.test.mjs; the dwell mutant reveals after 5000
const REST = { x: 320, y: 200 };                    // the mouse rests here on the 640×400 canvas after a click, so no button shows its hover style
const CENTRE = [0.08, 0.92, 0.15, 0.85];            // the central region of tests/illusion.test.mjs's mode shots
// CENTRE in the pixels of a 640×400 page, rounded as partsResidual rounds a region: every picture is
// clipped to it, which makes the screenshot cheaper (tests/illusion.test.mjs does the same).
const CLIP = { x: Math.round(CENTRE[0] * WIDE.width), y: Math.round(CENTRE[2] * WIDE.height), width: Math.round(CENTRE[1] * WIDE.width) - Math.round(CENTRE[0] * WIDE.width), height: Math.round(CENTRE[3] * WIDE.height) - Math.round(CENTRE[2] * WIDE.height) };
const MAX_RESIDUAL = 0.001;                         // per channel, Σ|shot − reference| over the reference's light, as in tests/illusion.test.mjs; each shot's diagnostic counts the channel values that differ; 0.116–0.153 with text 1.25× brighter there (the reveal-in-* mutants)

// Records, after each animation frame, [time, mode, target, az, el, stamp] as the page reports them
// (stamp: the frame's own timestamp, which the page's frame callback gets and steps its moves by);
// for each change of the reduced-motion preference, [time, matches]; for each key press, [time,
// key]; and for each click, [time, the id of what was clicked]; each as the page can first hear it
// (capture listeners on window).
const OBSERVER = () => {
  const raf = window.requestAnimationFrame.bind(window);
  window.__log = [];
  window.__heard = [];
  window.__keys = [];
  window.__clicks = [];
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => window.__heard.push([performance.now(), e.matches]));
  window.addEventListener('keydown', (e) => window.__keys.push([performance.now(), e.key]), true);
  window.addEventListener('click', (e) => window.__clicks.push([performance.now(), e.target && e.target.id]), true);
  window.requestAnimationFrame = (cb) => raf((ts) => {
    cb(ts);
    const c = window.__cloud;
    if (c && c.ready) { const v = c.view(); window.__log.push([performance.now(), c.mode(), c.target(), v.az, v.el, ts]); }
  });
};

// The log as runs of frames with the same mode and the same place: "start" (the start view),
// a message's name (its eye), or "moving". Each run keeps its first and last time, and its frames'
// times, stamps and targets in order.
const where = (az, el) => { const k = eyeAt({ az, el }); return k >= 0 ? NAMES[k] : angleDeg({ az, el }, START) <= 1e-6 ? 'start' : 'moving'; };
function runs(log) {
  const out = [];
  for (const [t, mode, target, az, el, stamp] of log) {
    const at = where(az, el), last = out[out.length - 1];
    if (last && last.mode === mode && last.at === at) { last.t1 = t; last.times.push(t); last.stamps.push(stamp); last.targets.push(target); }
    else out.push({ mode, at, t0: t, t1: t, times: [t], stamps: [stamp], targets: [target] });
  }
  return out;
}
// A run's targets with repeats counted, as in "hello-world×181,face×2".
const counted = (targets) => targets.reduce((a, x) => { const l = a[a.length - 1]; if (l && l[0] === x) l[1]++; else a.push([x, 1]); return a; }, []).map(([x, n]) => `${x ?? 'null'}${n > 1 ? '×' + n : ''}`).join(',');
const show = (rs) => rs.map((r) => `${r.mode} ${r.at} ${((r.t1 - r.t0) / 1000).toFixed(2)} s [${counted(r.targets)}]`).join(' → ');
const key = (r) => `${r.mode} ${r.at}`;

// The ways a run of the sequence, from run `i` of `rs` on, breaks the order: each message, from
// `first` (an index into NAMES) for `count` messages (wrapping), must be one or more frames moving
// toward it, all with target() naming it, then a hold exactly at its eye lasting at least `holdMin`
// ms, every frame naming it. A hold lasts from the stamp of its first frame to the stamp of the
// first frame after it: the page begins a hold in the frame that lands the glide, and ends it in the
// first frame stamped HOLD_MS later, which is still at the eye, so a full hold spans HOLD_MS by the
// stamps however late its frames are drawn. That last frame begins the glide to the next message
// and already names it; the glide moves the camera 1e-6° only about 5 ms later by the page's clock
// (smootherstep, 4.4 s for 58°), but a frame's stamp can lag the moment the glide began, so more
// frames can fall there under load. So only the frames from the first that names the next message
// on may name it, and each later one must be stamped within NEXT_STAMP_MS of the end of that first
// one, its logged time, by which the glide had begun. The last hold may be cut short by the end of
// the log when `openEnd` is set. Returns { broken, next } with next the index after the last run
// checked.
function checkPasses(rs, i, first, count, { holdMin = HOLD_MIN_MS, openEnd = false, mode = 'tour' } = {}) {
  const broken = [];
  for (let n = 0; n < count; n++) {
    const name = NAMES[(first + n) % NAMES.length];
    const glide = rs[i], hold = rs[i + 1];
    if (!glide || key(glide) !== `${mode} moving`) { broken.push(`before the hold at "${name}" the camera should move in mode ${mode}, but the log has ${glide ? key(glide) : 'nothing more'}`); break; }
    if (!glide.targets.every((x) => x === name)) broken.push(`while moving toward "${name}" target() named ${[...new Set(glide.targets)].join(', ')}`);
    if (!hold || key(hold) !== `${mode} ${name}`) { broken.push(`after moving toward "${name}" the camera should hold exactly at its eye in mode ${mode}, but the log has ${hold ? key(hold) : 'nothing more'}`); break; }
    const ahead = hold.targets.findIndex((x) => x !== name), next = NAMES[(first + n + 1) % NAMES.length];
    if (ahead >= 0) {
      const late = hold.stamps.slice(ahead + 1).map((s) => s - hold.times[ahead]).filter((d) => !(d < NEXT_STAMP_MS));
      if (!hold.targets.slice(ahead).every((x) => x === next) || late.length) broken.push(`during the hold at "${name}" target() named ${counted(hold.targets)}: only the frames from the first that names "${next}" may name it, each later one stamped within ${NEXT_STAMP_MS} ms of that first one's end, but ${late.length ? `${late.length} came up to ${Math.max(...late).toFixed(0)} ms after it` : 'another message was named'}`);
    }
    const last = openEnd && n === count - 1;
    const span = (rs[i + 2] ? rs[i + 2].stamps[0] : hold.stamps[hold.stamps.length - 1]) - hold.stamps[0];
    if (!last && !(span >= holdMin)) broken.push(`the hold at "${name}" lasted ${span.toFixed(0)} ms by its frames' stamps, less than ${holdMin} ms`);
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
const logLength = (page) => page.evaluate(() => window.__log.length);
// Whether the page is still the document that set window.__sameDocument. A read that a navigation
// interrupts (Playwright: the execution context was destroyed) means the document was replaced.
const sameDocument = async (page) => {
  try { return await page.evaluate(() => window.__sameDocument === true); } catch (err) {
    if (/Execution context was destroyed/.test(String(err?.message))) return false;
    throw err;
  }
};
// What the page reports now, with the page's own clock.
const look = (page) => page.evaluate(() => {
  const c = window.__cloud, v = c.view();
  return { mode: c.mode(), target: c.target(), az: v.az, el: v.el, capture: c.capture, now: performance.now() };
});

// In the page: [the time, the stamp] of the first frame of the run that the last logged frame
// belongs to, when that frame is in `mode`, names the message and is exactly at its eye; otherwise
// null. A hold of the sequence is such a run in mode tour, and a "Find the angle" landing one in
// mode idle.
function restFrom({ name, az, el, mode }) {
  const L = window.__log, wrap = (d) => ((d % 360) + 540) % 360 - 180;
  const at = (e) => e[1] === mode && e[2] === name && Math.abs(wrap(e[3] - az)) < 1e-6 && Math.abs(e[4] - el) < 1e-6;
  let i = L.length - 1;
  if (i < 0 || !at(L[i])) return null;
  while (i > 0 && at(L[i - 1])) i--;
  return [L[i][0], L[i][5]];
}
// In the page: whether a frame logged from index `since` on was in that run's state.
function cameBy({ name, az, el, mode, since }) {
  const wrap = (d) => ((d % 360) + 540) % 360 - 180;
  return window.__log.slice(since).some((e) => e[1] === mode && e[2] === name && Math.abs(wrap(e[3] - az)) < 1e-6 && Math.abs(e[4] - el) < 1e-6);
}
// Waits until the camera rests at message m's eye in `mode`, then shoots the central region (CLIP)
// `lead` ms after the first frame there, by the page's clock, with what the page reports just
// before and just after the shot; the shot is decoded only after the second read. The first frame's
// time and stamp come from the poll that found the camera there, not from a second read (F90).
// For a hold (mode tour) a timing miss comes back as `missed`, never as a failed check: the hold
// came and went, from log index `since` on, before the test could shoot it, or the reads find the
// sequence moved on to the next message, the second more than HOLD_MS after the stamp of the
// hold's first frame. `capture` is whether the page should report capture mode.
async function shootAt(page, m, lead, { mode = 'tour', wait = HOLD_WAIT_MS, since = 0, capture = false } = {}) {
  const want = { ...m, mode }, place = `${mode === 'tour' ? 'holding' : 'at rest'} at "${m.name}"`;
  let first;
  try {
    first = await (await page.waitForFunction(restFrom, want, { timeout: wait, polling: 25 })).jsonValue();
  } catch (err) {
    if (err?.name !== 'TimeoutError') throw err;
    if (mode === 'tour' && await page.evaluate(cameBy, { ...want, since })) return { name: m.name, mode, lead, missed: `the camera was ${place} within the ${wait} ms the test waited, but it had gone before the test could shoot it` };
    throw new assert.AssertionError({ message: `the camera ${place}: not reached within ${wait} ms; the page reports ${JSON.stringify(await state(page))}` });
  }
  const [from, stamp] = first;
  for (;;) {
    const left = from + lead - (await look(page)).now;
    if (left <= 0) break;
    await sleep(Math.min(left, 200));
  }
  const s0 = await look(page);
  const png = await page.screenshot({ animations: 'disabled', clip: CLIP });
  const s1 = await look(page);
  const shot = { name: m.name, img: decodePng(png), s0, s1, from, stamp, into: s0.now - from, lead, mode };
  if (mode === 'tour') {
    const next = NAMES[(NAMES.indexOf(m.name) + 1) % NAMES.length];
    const held = (s) => s.mode === 'tour' && s.target === m.name && angleDeg(s, m) <= 1e-6 && s.capture === capture;
    const movedOn = (s) => s.mode === 'tour' && s.target === next && s.capture === capture;
    if (![s0, s1].every(held) && [s0, s1].every((s) => held(s) || movedOn(s)) && s1.now - stamp > HOLD_MS) shot.missed = `the reads found the sequence moved on to "${next}", the second ${ms(s1.now - stamp)} after the stamp of the hold's first frame`;
  }
  return shot;
}
// Opens `url` (capture mode) at 640×400 and shoots its holds at `eyes` in order in the loop's first
// pass. A hold whose shot missed is shot once more on the loop's next pass (F93); a second miss
// stays a miss.
async function holdShots(browser, url, eyes) {
  const { context, page, errors } = await openIn(browser, url, WIDE);
  try {
    const shots = [], again = [];
    let since = 0;
    for (const m of eyes) {
      const s = await shootAt(page, m, SHOT_LEAD_MS, { since, capture: true });
      since = await logLength(page);
      (s.missed ? again : shots).push(s);
    }
    for (const miss of again) {
      const s = await shootAt(page, MESSAGES[NAMES.indexOf(miss.name)], SHOT_LEAD_MS, { since, capture: true, wait: LOOP_WAIT_MS });
      since = await logLength(page);
      shots.push({ ...s, retried: miss.missed });
    }
    return { shots, errors };
  } finally { await context.close(); }
}
// The tour at load (t=0) at 640×400: shot at the face's hold, then idle at "world", where it ends,
// as soon as the camera rests there and again DWELL_MS later. Then, once `holdsDone` says capture's
// holds are shot, "Find the angle" clicked six times there lands at each eye from hello world round
// to "world", each landing shot as soon as the camera rests there (F88). Then, once `quiet` says the
// five other landing pages and the references are done, a real click on Play there, and Play shot
// at the face's hold. `faceShot` resolves once the tour's hold at the face is shot.
function tourShots(browser, holdsDone, quiet) {
  let shotFace;
  const faceShot = new Promise((resolve) => { shotFace = resolve; });
  const done = (async () => {
    const { context, page, errors } = await openIn(browser, PAGE_URL + '?t=0', WIDE);
    try {
      const face = await shootAt(page, MESSAGES[1], SHOT_LEAD_MS);
      shotFace();
      const world = MESSAGES[5];
      const end = [{ ...(await shootAt(page, world, 0, { mode: 'idle', wait: TOUR_MS })), when: 'on arrival' }];
      end.push({ ...(await shootAt(page, world, DWELL_MS, { mode: 'idle', wait: TOUR_MS })), when: `${DWELL_MS / 1000} s after it` });
      await holdsDone;
      const find = [];
      for (const m of MESSAGES) {                   // from "world" the first click goes to hello world
        await page.click('#find');
        await page.mouse.move(REST.x, REST.y);
        find.push({ ...(await shootAt(page, m, 0, { mode: 'idle' })), when: 'on landing' });
      }
      await quiet;
      const since = await logLength(page);
      await page.click('#play');
      const play = await shootAt(page, MESSAGES[1], SHOT_LEAD_MS, { since });
      return { face: { shots: [face], errors }, end: { shots: end, errors: [] }, find: { shots: find, errors: [] }, play: { shots: [play], errors: [] } };
    } finally { shotFace(); await context.close(); }
  })();
  return { faceShot, done };
}
// From the eye before message k (msg=<that message>, the clock frozen) at 640×400, a real click on
// "Find the angle" glides to message k's eye. The landing is shot as soon as the camera rests at the
// eye, and again DWELL_MS later.
async function findShots(browser, k) {
  const m = MESSAGES[k];
  const { context, page, errors } = await openIn(browser, PAGE_URL + `?msg=${MESSAGES[k - 1].name}&t=0&tour=0`, WIDE);
  try {
    await page.click('#find');
    await page.mouse.move(REST.x, REST.y);
    const shots = [{ ...(await shootAt(page, m, 0, { mode: 'idle' })), when: 'on landing' }];
    shots.push({ ...(await shootAt(page, m, DWELL_MS, { mode: 'idle' })), when: `${DWELL_MS / 1000} s after it` });
    return { shots, errors };
  } finally { await context.close(); }
}
// Each eye set by URL with the particle clock frozen, and the sky alone there (beta=0 leaves no text
// particles, and layer=text then draws none), at 640×400, each cropped to the shots' region (CLIP).
async function references(browser) {
  const { context, log: { errors } } = await newContext(browser, WIDE);
  try {
    const out = {};
    for (const m of MESSAGES) {
      const q = `msg=${m.name}&t=0&tour=0`;
      const ref = await render(context, q), sky = await render(context, q + '&beta=0&layer=text');
      out[m.name] = { ref: crop(ref.img, CLIP), sky: crop(sky.img, CLIP), at: [ref.state, sky.state] };
    }
    return { eyes: out, errors };
  } finally { await context.close(); }
}

before(async () => {
  // If one launch fails, the browsers that did start are closed before the error is passed on,
  // since an open browser would keep this file's process, and a whole mutation run, waiting.
  const launched = await Promise.allSettled(Array.from({ length: 6 }, () => startBrowser()));
  browsers = launched.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const failed = launched.find((r) => r.status === 'rejected');
  if (failed) {
    await Promise.allSettled(browsers.map((b) => b.close()));
    browsers = [];
    throw failed.reason;
  }
  // The pictures run in the background, one page per browser while holds are shot, since two
  // picture pages in one browser slowed each shot to about 0.8 s: capture mode through its six holds
  // in browser 3, and in browser 4 the tour at load, through its hold at the face and its end at
  // "world", then its six landings and Play there. A shot at a hold must end before the hold does,
  // so the five other "Find the angle" pages wait until capture's holds and the tour's are shot: a
  // page drawing beside them in a sixth browser slowed two shots to 0.5 s and 1.2 s, past their
  // holds (W21). Then those five run at once, two in browser 3, one in browser 4 and two in browser
  // 5; a landing and the tour's rest at "world" have no end, so their shots may be slow. The
  // references render in browser 5 after them, since 12 page loads beside them slowed frames on the
  // shorter tests' pages (2026-10-22). The tour page's own landings wait for capture's holds, a
  // retry included, and its Play for the five landing pages and the references, so no hold is shot
  // while a landing page or a reference load runs. The pictures test awaits them all.
  const held = holdShots(browsers[3], PAGE_URL + '?t=0#capture', MESSAGES);
  let settle;
  const quiet = new Promise((resolve) => { settle = resolve; });
  const tourPics = tourShots(browsers[4], held.then(() => {}, () => {}), quiet);
  const ahead = Promise.all([held, tourPics.faceShot]);
  const found = ahead.then(() => Promise.all([3, 3, 4, 5, 5].map((b, i) => findShots(browsers[b], i + 1))))
    .then((all) => ({ shots: all.flatMap((r) => r.shots), errors: all.flatMap((r) => r.errors) }));
  const refs = found.then(() => {}, () => {}).then(() => references(browsers[5]));
  refs.then(settle, settle);
  pictures = Promise.all([held, tourPics.done, refs, found]);
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

test('on a host that blocks history changes, Escape still ends capture mode, and the anchor stays', async (t) => {
  // Such a host makes history.replaceState and pushState throw, as a sandboxed frame may.
  const block = () => { for (const k of ['pushState', 'replaceState']) History.prototype[k] = function () { throw new DOMException('history changes are blocked here', 'SecurityError'); }; };
  const { context, page, errors } = await openIn(browsers[2], PAGE_URL + '#capture', { initScript: block });
  t.after(() => context.close());
  const s0 = await page.evaluate(() => ({ capture: window.__cloud.capture, mode: window.__cloud.mode() }));
  await page.keyboard.press('Escape');
  await sleep(200);
  const s1 = await page.evaluate(() => ({ capture: window.__cloud.capture, mode: window.__cloud.mode(), hash: location.hash }));
  const shown = await visible(page);
  t.diagnostic(`before Escape ${JSON.stringify(s0)}; after it ${JSON.stringify(s1)}; visible ${JSON.stringify(shown)}; errors ${JSON.stringify(errors)}`);
  assert.deepEqual(s0, { capture: true, mode: 'tour' }, 'the page did not start in capture mode, so this check proves nothing');
  assert.deepEqual(s1, { capture: false, mode: 'idle', hash: '#capture' }, 'with history changes blocked, Escape must still end capture mode, and the anchor stays in the address');
  assert.deepEqual(Object.entries(shown).filter(([, v]) => !v).map(([id]) => `#${id}`), [], 'after Escape the readout, the hint and both buttons must show again, but these are hidden');
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
  await page.click('#play');
  await until(page, () => window.__cloud.target() === 'face', null, 8000, 'the cut to the face');
  await sleep(200);
  const { L, clicks } = await page.evaluate(() => ({ L: window.__log, clicks: window.__clicks }));
  const click = clicks.find(([, id]) => id === 'play');
  if (!click) throw new Error('the observer never heard the click on Play, so the cut could not be timed');
  const v = judgeCut(L, click[0]);
  t.diagnostic(`after Play with reduced motion: ${v.note}`);
  assertNone(v.broken ? [v.broken] : [], 'with reduced motion Play must cut from eye to eye, from the click: ');
  noErrors(errors);
  // Not an assertion: without a frame near the bound the check could not judge (F90).
  if (v.unjudged) throw new Error(`with reduced motion Play's cut hold could not be judged: ${v.unjudged}`);
});

// The cut hold at hello world after `at`, the time of a click on Play or of the switch to reduced
// motion, where the page begins it: every frame logged after it must be in mode tour exactly at
// hello world's eye and then at the face's, and none stamped less than CUT_HOLD_MIN_MS after `at`
// may be at the face. The page ends the 4 s cut hold in the first frame stamped 4 s after it began,
// so a frame drawn late cannot shorten it here. A frame must be stamped in the last CUT_WINDOW_MS
// before the bound, or a hold that ended before it could pass unseen: then `unjudged` says so. That
// frame shows only that the hold lasted until it, so one that ends inside the window can pass (F96).
function judgeCut(L, at) {
  const after = L.filter((e) => e[0] > at), rs = runs(after);
  const face = rs[1] ? rs[1].stamps[0] - at : null;
  const near = after.filter((e) => e[5] - at >= CUT_HOLD_MIN_MS - CUT_WINDOW_MS && e[5] - at < CUT_HOLD_MIN_MS).length;
  const note = `${show(rs)}; the first frame at the face stamped ${face === null ? '?' : `${(face / 1000).toFixed(3)} s`} after it, and ${near} frame(s) stamped ${(CUT_HOLD_MIN_MS - CUT_WINDOW_MS) / 1000}–${CUT_HOLD_MIN_MS / 1000} s after it`;
  if (rs.map(key).join(' → ') !== 'tour hello-world → tour face') return { note, broken: `every frame after it must be in mode tour exactly at hello world's eye and then at the face's, but the log has ${show(rs)}` };
  if (!(face >= CUT_HOLD_MIN_MS)) return { note, broken: `the first frame at the face is stamped ${face.toFixed(0)} ms after it, so the cut hold at hello world lasted less than ${CUT_HOLD_MIN_MS} ms by the page's clock` };
  if (!near) return { note, unjudged: `no frame was stamped ${CUT_HOLD_MIN_MS - CUT_WINDOW_MS}–${CUT_HOLD_MIN_MS} ms after it, so a cut hold that ended there would pass unseen` };
  return { note };
}

test('reduced motion switched on during a glide of Play or of capture mode cuts to its eye at once', async (t) => {
  // Play from "world" glides 4.35 s to hello world at once; capture mode holds 2 s at the start
  // view, then glides 3.6 s to hello world. Each page switches reduced motion on SWITCH_MS into
  // that glide.
  const cases = [['Play', PAGE_URL + '?msg=world&tour=0', (page) => page.click('#play')], ['capture mode', PAGE_URL + '#capture', null]];
  const seen = await Promise.all(cases.map(async ([what, url, start]) => {
    const { context, page, errors } = await openIn(browsers[2], url);
    try {
      if (start) await start(page);
      await setup(page, () => window.__cloud.target() === 'hello-world' && window.__cloud.alignment() > 1e-3, null, 10000, `${what} gliding toward hello world`);
      await sleep(SWITCH_MS);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await until(page, () => window.__cloud.target() === 'face', null, 8000, `${what} going on to the face after the switch`);
      await sleep(200);
      return { what, L: await log(page), heard: await page.evaluate(() => window.__heard), errors };
    } finally { await context.close(); }
  }));
  const broken = [], unjudged = [];
  for (const { what, L, heard } of seen) {
    const on = heard.find(([, matches]) => matches);
    if (!on) { unjudged.push(`${what}: the page never heard reduced motion switch on`); continue; }
    const last = L.filter((e) => e[0] < on[0]).at(-1), v = judgeCut(L, on[0]);
    t.diagnostic(`${what}: the frame before the switch ${last ? `${last[1]} ${where(last[3], last[4])} [${last[2]}]` : 'none'}; after it ${v.note}`);
    if (!last || last[1] !== 'tour' || last[2] !== 'hello-world' || where(last[3], last[4]) !== 'moving') { unjudged.push(`${what}: the switch did not come in the glide toward hello world (the frame before it: ${JSON.stringify(last)})`); continue; }
    if (v.broken) broken.push(`${what}: ${v.broken}`);
    else if (v.unjudged) unjudged.push(`${what}: ${v.unjudged}`);
  }
  assertNone(broken, 'reduced motion switched on mid-glide must cut to the eye at once, from the switch: ');
  for (const { errors } of seen) noErrors(errors);
  // Not an assertion: a case whose setup failed says nothing of the page (F90).
  if (unjudged.length) throw new Error(`the check could not judge ${unjudged.length} case(s): ${unjudged.join('; ')}`);
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

test('capture mode loops the sequence from "world" back to hello world, and Escape ends it, the camera stopping at once', async (t) => {
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
  // Escape while the loop glides on to its next message (the last two frames drawn in mode tour,
  // more than 1e-3° apart, the last at least ESC_LEAD_DEG from the eye it heads for), so that a
  // camera that runs on after it shows.
  await setup(page, ({ eyes, lead }) => {
    const L = window.__log, e = L[L.length - 1], p = L[L.length - 2], R = Math.PI / 180;
    const dir = (az, el) => [Math.cos(el * R) * Math.sin(az * R), Math.sin(el * R), Math.cos(el * R) * Math.cos(az * R)];
    const deg = (a, b) => { const u = dir(a[0], a[1]), w = dir(b[0], b[1]); return 2 * Math.asin(Math.min(1, Math.hypot(u[0] - w[0], u[1] - w[1], u[2] - w[2]) / 2)) / R; };
    const m = e && eyes.find((x) => x.name === e[2]);
    return !!(m && p && e[1] === 'tour' && p[1] === 'tour' && deg([e[3], e[4]], [m.az, m.el]) > lead && deg([e[3], e[4]], [p[3], p[4]]) > 1e-3);
  }, { eyes: MESSAGES, lead: ESC_LEAD_DEG }, 10000, `capture mode gliding on to its next message, at least ${ESC_LEAD_DEG}° from its eye`);
  await page.evaluate(() => { window.__sameDocument = true; });   // gone if the page reloads
  await page.keyboard.press('Escape');
  await sleep(300);                                 // long enough for a reload, had Escape started one, to replace the document
  assert.ok(await sameDocument(page), 'Escape reloaded the page; it must end capture mode, and take the #capture anchor out of the address, in the same document');
  const shown = await visible(page), cur = await cursor(page), flag = await page.evaluate(() => window.__cloud.capture);
  await sleep(1000);
  const s2 = await state(page);
  // The frames from the observer's log, split at the moment the page heard Escape.
  const { L, keys } = await page.evaluate(() => ({ L: window.__log, keys: window.__keys }));
  const esc = keys.find(([, k]) => k === 'Escape');
  const before = esc ? L.filter((e) => e[0] < esc[0]) : [], after = esc ? L.filter((e) => e[0] > esc[0]) : [];
  const [p, last] = before.slice(-2), pos = (e) => ({ az: e[3], el: e[4] });
  const step = p && last ? angleDeg(pos(p), pos(last)) : null, off = (e) => angleDeg(pos(e), pos(last));
  const first = after.slice(0, 3).map((e) => `${e[1]} ${off(e).toFixed(6)}°`).join(', ');
  t.diagnostic(`Escape: the frame before it ${last ? `${last[1]} ${where(last[3], last[4])} [${last[2]}], ${step === null ? '?' : step.toFixed(6)}° from the frame before that` : 'none'}; ${after.length} frames in the 1.3 s after it (${first}${after.length > 3 ? ', …' : ''} from where that frame was); then ${JSON.stringify(s2)}; visible ${JSON.stringify(shown)}; cursor ${cur}; capture ${flag}`);
  assert.equal(flag, false, 'after Escape window.__cloud.capture is still true');
  assert.deepEqual(Object.entries(shown).filter(([, v]) => !v).map(([id]) => `#${id}`), [], 'after Escape the readout, the hint and both buttons must show again, but these are hidden');
  assert.equal(cur, 'grab', `after Escape the scene's cursor is "${cur}", not "grab"`);
  // The setup condition: the frame before Escape is mid-glide, in mode tour, at no eye and moved
  // since the frame before it. A hold's first frame has also just moved, onto the eye, and there a
  // glide that runs on would not show (F91). Without it, or with no frame after the press, the check
  // could not judge, and the test fails as an error at its end.
  const judged = !!(esc && last && last[1] === 'tour' && where(last[3], last[4]) === 'moving' && step > 0 && after.length > 0);
  if (judged) {
    const moved = after.filter((e) => e[1] !== 'idle' || !(off(e) <= 1e-6));
    assert.ok(moved.length === 0, `from the first frame after Escape every frame must be idle where the frame before it was, but ${moved.length} of ${after.length} were not: ${moved.slice(0, 3).map((e) => `${e[1]} ${off(e).toFixed(6)}°`).join(', ')}`);
  }
  assert.equal(s2.mode, 'idle', `1.3 s after Escape the mode is "${s2.mode}"`);
  // Escape also takes the bare #capture anchor out of the address, so adding it back, as a viewer
  // would in the address bar, starts capture mode again.
  const address = await page.evaluate(() => location.href);
  assert.equal(address, PAGE_URL, `after Escape the address is ${address}; Escape must take the #capture anchor out of it, so that adding the anchor back starts capture mode again`);
  await page.goto(PAGE_URL + '#capture');
  await until(page, () => window.__cloud.capture === true && window.__cloud.mode() === 'tour', null, 3000, 'capture mode starting again once #capture is back in the address');
  const again = { same: await sameDocument(page), shown: await visible(page), cursor: await cursor(page) };
  t.diagnostic(`#capture added back: ${JSON.stringify(again)}`);
  assert.ok(again.same, 'adding #capture back to the address reloaded the page; capture mode must start again in the same document');
  assert.deepEqual(Object.entries(again.shown).filter(([, v]) => v).map(([id]) => `#${id}`), [], 'capture mode started again, but these still show');
  assert.equal(again.cursor, 'none', `capture mode started again, but the scene's cursor is "${again.cursor}"`);
  await page.keyboard.press('Escape');
  const out = await page.evaluate(() => ({ capture: window.__cloud.capture, mode: window.__cloud.mode(), address: location.href }));
  t.diagnostic(`the second Escape: ${JSON.stringify(out)}`);
  assert.deepEqual(out, { capture: false, mode: 'idle', address: PAGE_URL }, 'a second Escape must end capture mode again and take the anchor out of the address again');
  noErrors(capture.errors);
  // Not an assertion (F90, F91).
  if (!judged) throw new Error(`Escape did not come while capture mode was gliding between eyes (the two frames before it: ${JSON.stringify([p, last])}; ${after.length} frames after it), so the check that the camera stops at once could not judge`);
});

test('capture mode at each of its six holds, the tour at load at the face, idle where it ends and at "Find the angle" landings after it, Play after them, and "Find the angle" at each later eye render as that eye set by URL, pixel for pixel', async (t) => {
  const [held, tour, refs, found] = await pictures;
  const broken = [], missed = [];
  for (const m of MESSAGES) for (const s of refs.eyes[m.name].at) if (!(angleDeg(s, m) <= 1e-6)) broken.push(`msg=${m.name} set the camera ${angleDeg(s, m).toFixed(4)}° from its eye, so it is no reference`);
  const sets = [['capture mode', held, true], ['the tour at load', tour.face, false], ['the tour at load, idle where it ends,', tour.end, false], ['"Find the angle" after the tour at load,', tour.find, false], ['Play, clicked where those landings ended,', tour.play, false], ['"Find the angle" from the eye before', found, false]];
  for (const [what, set, inCapture] of sets) {
    for (const h of set.shots) {
      const m = MESSAGES[NAMES.indexOf(h.name)], r = refs.eyes[h.name];
      const at = (s) => s.mode === h.mode && s.target === h.name && angleDeg(s, m) <= 1e-6 && s.capture === inCapture;
      const label = `${what} at "${h.name}"${h.when ? ` ${h.when}` : ''}`, rest = h.mode === 'tour' ? 'into the hold' : 'after the camera came to rest';
      // A missed hold says nothing of the page, so its picture is not compared (see shootAt).
      if (h.missed) { missed.push(`${label}: ${h.missed}${h.retried ? `; on the pass before: ${h.retried}` : ''}`); t.diagnostic(`${label}: MISSED: ${h.missed}`); continue; }
      const ok = at(h.s0) && at(h.s1), late = h.s1.now - h.stamp;
      const timing = `shot ${ms(h.into)} ${rest}, ${ms(h.s1.now - h.s0.now)} for the shot and its reads${h.mode === 'tour' ? `, ending ${ms(HOLD_MS - late)} before the hold's ${HOLD_MS / 1000} s end, by the stamp of its first frame` : ''}${h.retried ? `; shot on the loop's next pass, after a miss: ${h.retried}` : ''}`;
      const d = partsResidual(h.img, r.sky, [r.ref]);
      t.diagnostic(`${label}: ${timing}; central residual r/g/b ${rgb(d.abs)} (signed ${rgb(d.signed)}; ${d.differ} of ${d.values} channel values differ; ${(100 * d.off).toFixed(3)}% of pixels off by more than 2 levels)`);
      if (!ok) broken.push(`${label}: the page did not report the camera at rest at "${h.name}" in mode ${h.mode}${inCapture ? ' in capture mode' : ''} before and after the shot: before ${JSON.stringify(h.s0)}, after ${JSON.stringify(h.s1)}`);
      if (!(h.into >= h.lead)) broken.push(`${label}: the shot started ${ms(h.into)} ${rest}, where at least ${h.lead} ms is needed`);
      if (!d.abs.every((x) => x <= MAX_RESIDUAL)) broken.push(`${label}: the central region differs from msg=${h.name} set by URL by ${rgb(d.abs)} of its light in red/green/blue (signed ${rgb(d.signed)}; ${(100 * d.off).toFixed(3)}% of pixels off by more than 2 levels); each must be at most ${MAX_RESIDUAL}`);
    }
  }
  assertNone(broken, `the sequence, the tour's end and "Find the angle" must not change how an eye renders while the camera rests there${missed.length ? ` (besides, ${missed.length} hold shot(s) missed their holds)` : ''}: `);
  // Not an assertion: a shot that missed its hold is the test failing to judge, so a mutation run
  // counts it as an error, never as a mutant's kill.
  if (missed.length) throw new Error(`${missed.length} hold shot(s) missed their holds, a timing miss, not a page defect, so those pictures were not judged: ${missed.join('; ')}`);
  noErrors([...held.errors, ...tour.face.errors, ...refs.errors, ...found.errors]);
});
