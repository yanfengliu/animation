// Mutation proof for the gates: a gate counts only once it has gone red with its defect
// reintroduced (fleet R18). This writes each mutant under tmp/mutants/ and, unless --write-only
// is given, runs the gate files against it with node:test's run() and prints which tests failed,
// how, and the test-file line that failed. Run it after changing a gate or the page.
//
// Usage: node tests/mutate.mjs [--write-only] [mutant-name ...]   (default: every mutant)
// Page mutants are edited copies of index.html, tested through PAGE=tmp/mutants/<name>.html.
// Tree mutants are edited copies of the repo (everything but .git, node_modules, tmp, test output
// and .claude/worktrees, so any file a command names is there too), scanned through
// SCAN_ROOT=tmp/mutants/<name>. Tree mutants are only scanned, never run, and each one is deleted
// once scanned (some hold a settings hook that would open the page), unless --write-only is given.
// Every edit must match exactly once, or the tool stops: a mutant that silently equals the
// original would report a false green.
//
// Control: before any mutant, the same gate files run on the real page and tree. The tool stops
// with exit 2 unless every test there passes, because a red control means the instrument is
// broken and every "kill" after it would be noise.
// Verdicts: a mutant is KILLED only when at least one failure is a failed check, an AssertionError
// thrown in a test body (the harness's until() timeouts throw one too). Any other failure (a
// browser that does not launch, a hook that throws, a page that never becomes ready, a Playwright
// timeout, a file that does not load) is an ERROR: the gates did not judge the mutant. A mutant
// with only errors is ERRORED and one with no failure SURVIVED. A mutant with 0 green tests is
// flagged, since it may break the page wholesale rather than the one behaviour it names, and a
// flag fails the run like a survivor.
// Exit status: 0 when every mutant is killed with at least one green test, 1 on any survivor,
// errored or flagged mutant, 2 on a red control or bad arguments.
import { run } from 'node:test';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { phases } from './lib/phases.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tmp', 'mutants');
const PAGE_GATES = ['tests/illusion.test.mjs', 'tests/controls.test.mjs', 'tests/motion.test.mjs', 'tests/page.test.mjs', 'tests/sequence.test.mjs'];
const HYGIENE_GATE = ['tests/hygiene.test.mjs'];

// The reveal the owner rejected (2026-10-11: "Some of the dots are lighting up more as I approach
// the intended angle. This is cheating."), put back near E: u_near is 1 at E and falls to 0 at 12°.
const NEAR_UNIFORM = ['uniform float u_time, u_ppu, u_aperture, u_focus, u_minPx, u_maxPx, u_swell;', 'uniform float u_time, u_ppu, u_aperture, u_focus, u_minPx, u_maxPx, u_swell, u_near;'];
const nearSet = (expr) => ['gl.uniform1f(u.u_swell, SWELL);', `gl.uniform1f(u.u_swell, SWELL);\n  gl.uniform1f(u.u_near, ${expr});`];
const NEAR = 'Math.max(0, 1 - alignDeg() / 12)';
const NEAR_SET = nearSet(NEAR);
const PARTICLE_COLOUR = 'v_col = u_pal[code & 3] * (level * tw * fade * energy);';
// The shader tells text particles from ambient ones only by their code (+8 for text); the mutants
// that act on text particles name them with this declaration.
const TEXT_DECL = ['int code = int(a_seed.w + 0.5);', 'int code = int(a_seed.w + 0.5);\n  float text = code >= 8 ? 1.0 : 0.0;'];
const TEXT_BRIGHTER = [PARTICLE_COLOUR, 'v_col = u_pal[code & 3] * (level * tw * fade * energy * (1.0 + 0.25 * text * u_near));'];
// u_near for another message: 1 at the eye of message k (0-based, in sequence order), 0 from 12° out.
const nearMessage = (k) => `Math.max(0, 1 - alignTo(${k}) / 12)`;
const GOLD_TINT = [PARTICLE_COLOUR, 'v_col = mix(u_pal[code & 3], vec3(1.0, 0.78, 0.46), 0.3 * text * u_near) * (level * tw * fade * energy);'];
// Review round 5 (R5-1): red and blue down, green up, so luminance and warmth stay where they were.
const GREEN_TINT = [PARTICLE_COLOUR, 'v_col = u_pal[code & 3] * mix(vec3(1.0), vec3(0.739, 1.10, 0.739), text * u_near) * (level * tw * fade * energy);'];
const BETA_LINE = 'const BETA_DEFAULT = 0.85;';
const DEFAULT_DRAW = 'else gl.drawArrays(gl.POINTS, 0, N_TOTAL);';
// `found` turns true when a glide lands, so the reveal shows only after "Find the angle".
const FOUND = [['let ready = false, frames = 0;', 'let ready = false, frames = 0, found = false;'],
  ["if (stepAnim(now)) { if (mode === 'tour') nextStep(); else { mode = 'idle'; heading = -1; } }", "if (stepAnim(now)) { if (mode === 'tour') nextStep(); else { if (mode === 'glide') found = true; mode = 'idle'; heading = -1; } }"]];
// 1 once the camera has stayed within 1° of E in `mode` for 5 s; the timer restarts on leaving.
const DWELL_DECL = ['let ready = false, frames = 0;', 'let ready = false, frames = 0, dwellFrom = null;'];
const dwell = (m) => `(mode === '${m}' && alignDeg() < 1 ? (performance.now() - (dwellFrom ??= performance.now()) > 5000 ? 1 : 0) : (dwellFrom = null, 0))`;
// 1 once the tour's hold at E (a hold is an anim without a target) has run `ms`.
const tourHold = (ms) => `(mode === 'tour' && anim && !anim.target && alignDeg() < 1e-3 && performance.now() - anim.t0 > ${ms} ? 1 : 0)`;

const PAGE_MUTANTS = [
  { name: 'reveal-brighter', defect: 'text particles brighten near E, up to 1.25× at E (a reveal)',
    edits: [TEXT_DECL, NEAR_UNIFORM, NEAR_SET, TEXT_BRIGHTER] },
  { name: 'reveal-extra-text-pass', defect: 'the shipped draw alone adds a second pass of the text particles near E, at 25% of their light at E (a reveal that the layer=text and layer=ambient draws do not show)',
    edits: [[DEFAULT_DRAW, `else {\n    gl.drawArrays(gl.POINTS, 0, N_TOTAL);\n    const k = 0.25 * ${NEAR};\n    if (k > 0) { gl.blendColor(k, k, k, 1); gl.blendFunc(gl.CONSTANT_COLOR, gl.ONE); gl.drawArrays(gl.POINTS, 0, cloud.nText); }\n  }`]] },
  { name: 'reveal-on-tour', defect: 'text particles brighten near E only while the tour runs, up to 1.25× during its hold at E (a reveal that views with tour=0 do not show)',
    edits: [TEXT_DECL, NEAR_UNIFORM, nearSet(`mode === 'tour' ? ${NEAR} : 0`), TEXT_BRIGHTER] },
  { name: 'reveal-after-glide', defect: 'once "Find the angle" has glided to E, text particles brighten near E, up to 1.25× at E (a reveal that views set by URL do not show)',
    edits: [TEXT_DECL, NEAR_UNIFORM, nearSet(`found ? ${NEAR} : 0`), TEXT_BRIGHTER, ...FOUND] },
  { name: 'reveal-after-dwell', defect: 'text particles brighten 1.25× once the camera has stayed idle within 1° of E for 5 s (a reveal for a viewer who holds the angle, which shots taken on arrival do not show)',
    edits: [TEXT_DECL, NEAR_UNIFORM, nearSet(dwell('idle')), TEXT_BRIGHTER, DWELL_DECL] },
  { name: 'reveal-late-in-tour-hold', defect: "text particles brighten 1.25× once the tour's hold at E has run 1.2 s of its 3 s (a reveal late in the hold, which a shot as the tour arrives at E does not show; R5-2)",
    edits: [TEXT_DECL, NEAR_UNIFORM, nearSet(tourHold(1200)), TEXT_BRIGHTER] },
  { name: 'reveal-gold', defect: 'text particles take a gold tint near E, 30% at E (a reveal)',
    edits: [TEXT_DECL, NEAR_UNIFORM, NEAR_SET, GOLD_TINT] },
  { name: 'reveal-green', defect: 'text particles take a green tint near E in every draw, red and blue × 0.739 and green × 1.10 at E, which leaves their luminance and warmth unchanged (a colour reveal off the warmth axis, R5-1)',
    edits: [TEXT_DECL, NEAR_UNIFORM, NEAR_SET, GREEN_TINT] },
  { name: 'reveal-gold-shipped', defect: 'text particles take a gold tint near E, 30% at E, in the shipped draw only (no layer set), so the layer=text and layer=ambient draws that the alike checks compare show none (a colour reveal that the light sums do not see)',
    edits: [TEXT_DECL, NEAR_UNIFORM, nearSet(`layer === null ? ${NEAR} : 0`), GOLD_TINT] },
  { name: 'reveal-gold-after-glide', defect: 'once "Find the angle" has glided to E, text particles take a gold tint near E, 30% at E (a colour reveal that views set by URL do not show)',
    edits: [TEXT_DECL, NEAR_UNIFORM, nearSet(`found ? ${NEAR} : 0`), GOLD_TINT, ...FOUND] },
  { name: 'reveal-bigger', defect: 'text particles grow near E, up to 1.25× wider at E (a reveal)',
    edits: [TEXT_DECL, NEAR_UNIFORM, NEAR_SET, ['float core = wsize * u_ppu / depth;', 'wsize *= 1.0 + 0.25 * text * u_near;\n  float core = wsize * u_ppu / depth;']] },
  { name: 'reveal-sharper', defect: 'text particles come into focus near E, their blur cut by 75% at E (a reveal)',
    edits: [TEXT_DECL, NEAR_UNIFORM, NEAR_SET, ['float coc = u_aperture * u_ppu * abs(depth - u_focus) / (depth * u_focus);', 'float coc = u_aperture * u_ppu * abs(depth - u_focus) / (depth * u_focus);\n  coc *= 1.0 - 0.75 * text * u_near;']] },
  { name: 'text-always-brighter', defect: 'text particles carry 1.4× the light of ambient ones at every angle, so the words read by brightness and the text particles stand out everywhere',
    edits: [TEXT_DECL, [PARTICLE_COLOUR, 'v_col = u_pal[code & 3] * (level * tw * fade * energy * (1.0 + 0.4 * text));']] },
  { name: 'scene-glows-at-angle', defect: 'every particle brightens near E, up to 1.4× at E, so the whole cloud glows brighter as the camera nears the angle',
    edits: [NEAR_UNIFORM, NEAR_SET, [PARTICLE_COLOUR, 'v_col = u_pal[code & 3] * (level * tw * fade * energy * (1.0 + 0.4 * u_near));']] },
  { name: 'weak-relocation', defect: 'β falls back to 0.2, the rate the reveal used to make up for, so the words barely show at E',
    edits: [[BETA_LINE, 'const BETA_DEFAULT = 0.2;']] },
  // The chances keep each message's text particles within 3% of the page's own count (30,582 in all
  // against 30,254 for seed 1), so the mutant takes away density compensation, not particles (F64).
  { name: 'no-density-compensation', defect: 'text particles come from anywhere in the cloud and land anywhere on the strokes, not from near their landing points, so nothing offsets the extra density along the stroke sight lines; each message keeps about its own number of particles',
    edits: [['acc += BETA * w[k] / scaleDown;', 'acc += [0.211, 0.115, 0.110, 0.127, 0.098, 0.114][k] * BETA / 0.85;'],
      ['const vx = ux[k] + sigma * lands[k](), vy = uy[k] + sigma * lands[k]();', 'const vx = 1.6 * lands[k](), vy = (k ? 0 : -0.7) + 1.3 * lands[k]();']] },
  { name: 'text-drifts-sideways', defect: 'text particles get the ambient drift across their sight lines',
    edits: [['vec3 p = a_pos + a_dir * (u_swell * sin(swell(a_pos, t)));', 'vec3 p = a_pos + a_dir * (u_swell * sin(swell(a_pos, t))) + (code >= 8 ? drift(a_pos, t) : vec3(0.0));']] },
  { name: 'zoom-dollies-eye', defect: 'zoom moves the eye toward the cloud instead of narrowing the field of view (view() still reports the zoomed fov)',
    edits: [['const th = tanHalf(), aspect = w / h;', 'const th = baseTan(viewAspect()), aspect = w / h;'],
      ['const eye = eyeDir(cam.az, cam.el).map((v) => v * R);', 'const eye = eyeDir(cam.az, cam.el).map((v) => v * R / cam.zoom);']] },
  { name: 'no-relocation', defect: 'text particles are chosen but never moved onto the strokes',
    edits: [['P[i * 3 + a] = pos[a] + dirs[i * 3 + a] * dist;', '/* mutant: no relocation */']] },
  { name: 'flat-text', defect: 'text particles are moved onto the text plane, a flat sign readable from the side',
    edits: [['P[i * 3 + a] = pos[a] + dirs[i * 3 + a] * dist;', 'P[i * 3 + a] = pos[a] + dirs[i * 3 + a] * tl;']] },
  { name: 'mirrored', defect: 'the projection mirrors the frame left to right (-f / aspect)',
    edits: [['new Float32Array([f / aspect,', 'new Float32Array([-f / aspect,']] },
  { name: 'turned-180', defect: 'the view matrix turns the frame 180° (its cross product is flipped)',
    edits: [['const r = norm(cross(f, [0, 1, 0]));', 'const r = norm(cross([0, 1, 0], f));']] },
  { name: 'upright-letters', defect: 'the letters stand upright again, so from above and below E their stems show as vertical streaks (the W8 page)',
    edits: [['const SLANT = 14;', 'const SLANT = 0;']] },
  { name: 'slant-5', defect: 'the letters lean only 5° (less italic), so from above and below E their stems spread over few columns and most of the vertical streaks come back',
    edits: [['const SLANT = 14;', 'const SLANT = 5;']] },
  { name: 'no-phone-widening', defect: 'narrow screens keep the plain 50° field of view, so the text block is cropped at 390×844',
    edits: [['const baseTan = (aspect) => Math.max(Math.tan(BASE_FOV * DEG / 2), FIT_HALF_WIDTH / R / aspect);', 'const baseTan = (aspect) => Math.tan(BASE_FOV * DEG / 2);']] },
  { name: 'seed-ignored', defect: 'the seed parameter is ignored, so every seed builds the default cloud',
    edits: [["const seed = params.get('seed') || '1';", "const seed = '1';"]] },
  { name: 'drag-sign-flipped', defect: 'horizontal drag turns the camera the wrong way',
    edits: [['cam.az = wrapPi(cam.az - dx * DRAG_RATE);', 'cam.az = wrapPi(cam.az + dx * DRAG_RATE);']] },
  { name: 'wheel-zooms-wrong-way', defect: 'scrolling the wheel up zooms out',
    edits: [['zoomBy(Math.exp(-e.deltaY * unit * 0.0015));', 'zoomBy(Math.exp(e.deltaY * unit * 0.0015));']] },
  { name: 'keys-reversed', defect: 'left and right arrow keys are swapped',
    edits: [['ArrowLeft: [-step, 0], ArrowRight: [step, 0]', 'ArrowLeft: [step, 0], ArrowRight: [-step, 0]']] },
  { name: 'find-jumps', defect: '"Find the angle" jumps to E instead of gliding',
    edits: [["mode = 'glide';\n  heading = k;\n  beginAnim(target, GLIDE_MS, easeCubic);", "Object.assign(cam, target); mode = 'idle';"]] },
  { name: 'snap-disabled', defect: 'releasing near E never snaps',
    edits: [['if (!(d < SNAP_DEG && d > 1e-4 && d <= gestureFrom[k] + 0.1)) continue;', 'if (true) continue;']] },
  { name: 'pinch-ignored', defect: 'two-finger pinch does not zoom',
    edits: [['cam.zoom = clampZoom(pinch.zoom * spread() / pinch.d);', '/* mutant: pinch ignored */']] },
  { name: 'tour-ignores-input', defect: 'a press during the tour does not stop it',
    edits: [["  stopAuto();\n  mode = 'drag';", "  if (mode !== 'tour') { stopAuto(); mode = 'drag'; }"]] },
  { name: 'tour-restarts', defect: 'the tour restarts after 7 s without input (the round-0 behaviour)',
    edits: [["} else if (mode === 'idle' && !autoplayed && lastInput === -Infinity && (capture || tourAllowed())) {", "} else if (mode === 'idle' && now - lastInput > 7000 && (capture || tourAllowed())) {"]] },
  { name: 'zoom-cancels-animation', defect: 'wheel or +/- during a glide or snap cancels it (the round-0 behaviour)',
    edits: [["if (anim && anim.target && (mode === 'snap' || mode === 'glide')) { anim.z0 = cam.zoom; anim.dz = 0; anim.target.zoom = cam.zoom; }\n  else if (mode !== 'drag') stopAuto();", "if (mode !== 'drag') stopAuto();"]] },
  { name: 'zoom-not-carried', defect: 'a zoom during a glide or snap is undone as it lands: zoomBy sets anim.z0 and anim.dz but not the target zoom',
    edits: [['anim.z0 = cam.zoom; anim.dz = 0; anim.target.zoom = cam.zoom; }', 'anim.z0 = cam.zoom; anim.dz = 0; }']] },
  { name: 'pinch-keeps-first-finger-start', defect: 'a second finger never raises gestureFrom, so a pinch at E with a little slip ends off E (the round-0 behaviour)',
    edits: [['  else if (Math.hypot(gestureDrag.x, gestureDrag.y) < TOUCH_SLOP) gestureFrom = gestureFrom.map((g, k) => Math.max(g, alignTo(k)));\n', '']] },
  { name: 'pinch-forgives-drag-away', defect: 'a second finger raises gestureFrom even after a deliberate drag away from E, so the pinch then snaps to E (the R1-5 behaviour)',
    edits: [['else if (Math.hypot(gestureDrag.x, gestureDrag.y) < TOUCH_SLOP) gestureFrom', 'else gestureFrom']] },
  { name: 'reduced-motion-coasts', defect: 'with reduced motion a fling still coasts (the round-0 behaviour)',
    edits: [["if (speed > 0.15 && !reduced) { mode = 'inertia'; return; }", "if (speed > 0.15) { mode = 'inertia'; return; }"]] },
  { name: 'mask-needs-readback', defect: 'the stroke mask depends on 2D canvas readback, which anti-fingerprinting blanks (the round-0 behaviour)',
    edits: [['  // B = S blurred by a Gaussian', "  const probe = document.createElement('canvas').getContext('2d'); probe.fillRect(0, 0, 1, 1);\n  if (probe.getImageData(0, 0, 1, 1).data[3] < 128) S.fill(0);\n  // B = S blurred by a Gaussian"]] },
  { name: 'fonts-block', defect: 'the Google Fonts stylesheet blocks the page script again (the round-0 behaviour)',
    edits: [['<style>', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Instrument+Serif:ital@1&amp;display=swap">\n<style>']] },
  { name: 'fonts-hold-first-frame', defect: 'the first frame waits until the Google Fonts stylesheet loads or fails, or 5 s pass, so a slow font host holds up the page (R2-3)',
    edits: [['requestAnimationFrame(tick);\n})();', "let started = false;\nconst start = () => { if (!started) { started = true; requestAnimationFrame(tick); } };\nfontCss.addEventListener('load', start);\nfontCss.addEventListener('error', start);\nsetTimeout(start, 5000);\n})();"]] },
  { name: 'canvas-not-focusable', defect: 'the canvas cannot take keyboard focus',
    edits: [['<canvas id="scene" role="application" tabindex="0" ', '<canvas id="scene" role="application" ']] },
  { name: 'canvas-role-img', defect: 'the canvas is exposed as an image again, so screen readers stay in browse mode and take the arrow keys',
    edits: [['<canvas id="scene" role="application" ', '<canvas id="scene" role="img" ']] },
  { name: 'canvas-focus-offscreen', defect: 'the canvas focus outline is drawn outside the viewport, so it is set but never seen',
    edits: [['#scene:focus-visible { outline: 2px solid var(--focus); outline-offset: -4px; }', '#scene:focus-visible { outline: 2px solid var(--focus); outline-offset: 0px; }']] },
  { name: 'reduced-motion-ignored', defect: 'reduced motion still tours and glides',
    edits: [['const tourAllowed = () => tourParam && !reduced;', 'const tourAllowed = () => tourParam;'],
      ["  if (reduced) { Object.assign(cam, { az: wrapPi(target.az), el: target.el, zoom: target.zoom }); mode = 'idle'; return; }\n", '']] },
  { name: 'console-error', defect: 'the script logs a console error',
    edits: [["'use strict';", "'use strict';\nconsole.error('mutant: injected console error');"]] },
  { name: 'external-script', defect: 'the page loads a script from another host',
    edits: [['</head>', '<script src="https://cdn.example.com/mutant.js"></script>\n</head>']] },
  { name: 'wide-element', defect: 'an element wider than a phone causes horizontal overflow',
    edits: [['<body>', '<body>\n<div style="width:600px;height:4px"></div>']] },
  { name: 'no-focus-outline', defect: 'keyboard focus on "Find the angle" has no visible outline',
    edits: [['.actions button:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px; }', '.actions button:focus-visible { outline: none; }']] },
  { name: 'no-fallback-message', defect: 'without WebGL2 the page shows nothing',
    edits: [["  document.getElementById('nogl').hidden = false;\n", '']] },
  // Work unit 1: six messages in one cloud, the sequence and capture mode.
  { name: 'sequence-order-swapped', defect: 'the sequence shows "a" before "What" (the tour, Play and capture all follow it)',
    edits: [['for (let k = 0; k < M.length; k++) seq.steps.push({ go: k }, { hold: HOLD_MS, at: k });', 'for (const k of [0, 1, 3, 2, 4, 5]) seq.steps.push({ go: k }, { hold: HOLD_MS, at: k });']] },
  { name: 'eye-moved', defect: '"What" is formed for an eye 6° east of the one the page reports and the sequence holds at (158°, 16°), so from there it is smeared',
    edits: [['const M = MESSAGES.map((msg) => ({ ...msg, frame: eyeFrame(msg.az, msg.el), layout: layout(msg) }));', "const M = MESSAGES.map((msg) => ({ ...msg, frame: eyeFrame(msg.az + (msg.name === 'what' ? 6 : 0), msg.el), layout: layout(msg) }));"]] },
  { name: 'message-without-particles', defect: '"beautiful" gets no particles (its relocation weight is 0), so its eye shows only the cloud',
    edits: [["{ name: 'beautiful', az: 278, el: 16, lines: ['beautiful'], slant: SLANT, cap: 3 }", "{ name: 'beautiful', az: 278, el: 16, lines: ['beautiful'], slant: SLANT, cap: 3, weight: 0 }"]] },
  { name: 'reveal-near-a', defect: 'text particles brighten near the eye of "a", up to 1.25× there (a reveal at an eye other than hello world\'s)',
    edits: [TEXT_DECL, NEAR_UNIFORM, nearSet(nearMessage(3)), TEXT_BRIGHTER] },
  { name: 'capture-shows-readout', defect: 'capture mode hides the buttons and the hint but leaves the AZ/EL readout on screen',
    edits: [['.capture .bar, .capture #hint { display: none; }', '.capture .actions, .capture #hint { display: none; }']] },
  { name: 'capture-click-interrupts', defect: 'in capture mode a click on the scene takes the camera, which stops the looping sequence',
    edits: [["if (capture || (e.pointerType === 'mouse' && e.button !== 0)) return;", "if (e.pointerType === 'mouse' && e.button !== 0) return;"]] },
  { name: 'find-skips-a', defect: '"Find the angle" skips "a": after "What" it goes straight to "beautiful"',
    edits: [['const k = (cursor + 1) % M.length, target = msgTarget(k, Math.min(cam.zoom, 1));', 'const k = (cursor + (cursor === 2 ? 2 : 1)) % M.length, target = msgTarget(k, Math.min(cam.zoom, 1));']] },
  // Repair round 1 (R1a): the sequence and capture mode.
  { name: 'find-lands-on-hello-world', defect: '"Find the angle" names the next message but always glides to hello world\'s eye (F49)',
    edits: [['const k = (cursor + 1) % M.length, target = msgTarget(k, Math.min(cam.zoom, 1));', 'const k = (cursor + 1) % M.length, target = msgTarget(0, Math.min(cam.zoom, 1));']] },
  { name: 'reveal-in-capture', defect: 'text particles brighten 1.25× in capture mode during its hold at "world", the last of a pass (a reveal in the recording that views set by URL do not show; F50)',
    edits: [TEXT_DECL, NEAR_UNIFORM, nearSet('capture && heading === 5 && anim && !anim.target ? 1 : 0'), TEXT_BRIGHTER] },
  { name: 'reveal-in-play', defect: 'text particles brighten 1.25× during the holds of Play from the face on (a reveal in a replay that views set by URL do not show; F50)',
    edits: [TEXT_DECL, NEAR_UNIFORM, nearSet('seq && !seq.auto && !seq.loop && heading >= 1 && anim && !anim.target ? 1 : 0'), TEXT_BRIGHTER] },
  { name: 'reveal-in-tour-later', defect: 'text particles brighten 1.25× during the holds of the tour at load from the face on, so not in the hold at hello world that tests/illusion.test.mjs shoots (F50)',
    edits: [TEXT_DECL, NEAR_UNIFORM, nearSet('seq && seq.auto && heading >= 1 && anim && !anim.target ? 1 : 0'), TEXT_BRIGHTER] },
  { name: 'capture-focus-outline', defect: 'in capture mode a Tab press focuses the canvas and draws its focus outline into the recording (F55)',
    edits: [['  .capture #scene:focus-visible { outline: none; }\n', '']] },
  { name: 'reduced-switch-glides-on', defect: 'reduced motion switched on mid-glide in Play or capture mode lets the glide run on to its eye; only later steps cut (F56)',
    edits: [['  if (anim && anim.target) {\n    cam.az = wrapPi(anim.target.az); cam.el = anim.target.el; cam.zoom = anim.target.zoom ?? cam.zoom;\n    anim = null;\n    nextStep();\n  }\n', '']] },
  { name: 'escape-ignored', defect: 'Escape does not end capture mode (F61)',
    edits: [["if (e.key === 'Escape') { e.preventDefault(); noteInput(); setCapture(false); }", "if (e.key === 'Escape') { e.preventDefault(); noteInput(); }"]] },
  { name: 'escape-keeps-playing', defect: 'Escape shows the controls again but the sequence plays on (F61)',
    edits: [["  document.documentElement.classList.toggle('capture', on);\n  stopAuto();\n", "  document.documentElement.classList.toggle('capture', on);\n"]] },
  { name: 'play-cuts', defect: 'Play cuts from eye to eye without reduced motion (F61)',
    edits: [['loop, auto, cut: reduced, zoom', 'loop, auto, cut: reduced || (!auto && !loop), zoom']] },
  { name: 'reduced-play-glides', defect: 'with reduced motion Play still glides (F61)',
    edits: [['loop, auto, cut: reduced, zoom', 'loop, auto, cut: false, zoom']] },
  // Repair round 1 (R1b): the illusion gates.
  { name: 'reveal-only-a', defect: 'only the particles of "a" brighten near its eye, up to 1.25× there, so the whole text layer, which holds all six messages\' particles, dilutes the reveal (F51)',
    edits: [['int code = int(a_seed.w + 0.5);', 'int code = int(a_seed.w + 0.5);\n  float mine = code >= 16 ? 1.0 : 0.0;'], NEAR_UNIFORM, nearSet(nearMessage(3)),
      ['if (k >= 0) data[o + 9] += 8;', 'if (k >= 0) data[o + 9] += k === 3 ? 24 : 8;'],
      [PARTICLE_COLOUR, 'v_col = u_pal[code & 3] * (level * tw * fade * energy * (1.0 + 0.25 * mine * u_near));']] },
  { name: 'reveal-blue-clipped', defect: 'text particles near E take a blue tint, blue × 1.5 with red and green × 0.96 at E, which saturates the blue of their densest strokes, so the colour check would leave out more of the text layer than its bound allows (F52)',
    edits: [TEXT_DECL, NEAR_UNIFORM, NEAR_SET, [PARTICLE_COLOUR, 'v_col = u_pal[code & 3] * mix(vec3(1.0), vec3(0.96, 0.96, 1.5), text * u_near) * (level * tw * fade * energy);']] },
  { name: 'depth-squeezed-messages', defect: 'the five messages after hello world keep only a third of their particles\' spread in depth about their text planes, so from far off they show as flatter, sharper copies, mirrored near their antipodes (F53)',
    edits: [['P[i * 3 + a] = pos[a] + dirs[i * 3 + a] * dist;', 'P[i * 3 + a] = pos[a] + dirs[i * 3 + a] * (k ? tl + (dist - tl) / 3 : dist);']] },
  { name: 'world-depth-halved', defect: '"world" keeps only half its particles\' spread in depth about its text plane, so from its antipode its mirrored copy is sharper than today\'s (F53)',
    edits: [['P[i * 3 + a] = pos[a] + dirs[i * 3 + a] * dist;', 'P[i * 3 + a] = pos[a] + dirs[i * 3 + a] * (k === 5 ? tl + (dist - tl) / 2 : dist);']] },
  { name: 'hello-world-weight-2', defect: 'hello world takes twice the relocation chance (about 13,900 text particles instead of 9,100), so midway to the face its letter rows show as horizontal streaks (F54)',
    edits: [["{ name: 'hello-world', az: 38, el: 14, lines: ['hello', 'world'], slant: SLANT, scale: 2.65, baseline: 0.36 }", "{ name: 'hello-world', az: 38, el: 14, lines: ['hello', 'world'], slant: SLANT, scale: 2.65, baseline: 0.36, weight: 2 }"]] },
  { name: 'upright-in-layers', defect: 'the letters stand upright and every message\'s particles sit in depth layers 2 units apart along their sight lines, so the streak floor rises with the columns above and below E and only the absolute bound holds them (F54)',
    edits: [['const SLANT = 14;', 'const SLANT = 0;'], ['P[i * 3 + a] = pos[a] + dirs[i * 3 + a] * dist;', 'P[i * 3 + a] = pos[a] + dirs[i * 3 + a] * (tl + Math.round((dist - tl) / 2) * 2);']] },
];

// The hygiene gate scans text, including this file, so the defects below are assembled from
// pieces here; written out whole, this file would itself be flagged.
const j = (...parts) => parts.join('');
const writeIn = (dir, rel, text) => { mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); writeFileSync(path.join(dir, rel), text); };
const addNpmScript = (dir, name, command) => {
  const file = path.join(dir, 'package.json');
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  pkg.scripts[name] = command;
  writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
};
const TREE_MUTANTS = [
  { name: 'headless-false', defect: 'a script launches a visible browser',
    apply: (dir) => editFile(path.join(dir, 'scripts', 'shoot.mjs'), [['headless: true', j('head', 'less: ', String(!true))]]) },
  { name: 'launch-spread', defect: 'a launch spreads options after headless: true, which can turn it off',
    apply: (dir) => editFile(path.join(dir, 'tests', 'lib', 'harness.mjs'), [['headless: true, args:', j('headless: true, .', '..extra, args:')]]) },
  { name: 'opener-npm-script', defect: 'an npm script opens the page in the system browser',
    apply: (dir) => addNpmScript(dir, 'view', j('st', 'art index.html')) },
  { name: 'npx-opener-script', defect: 'an npm script opens the page through an opener package that npx runs',
    apply: (dir) => addNpmScript(dir, 'view', j('np', 'x open', '-cli index.html')) },
  { name: 'script-opens-file', defect: 'a script hands a file URL of the page to the desktop',
    apply: (dir) => writeIn(dir, 'scripts/view.mjs', [
      j("import { exec } from 'node:child", "_process';"),
      j("import { pathTo", "FileURL } from 'node:url';"),
      j('exec(`expl', 'orer "${pathTo', "FileURL('index.html')}\"`);"),
      '',
    ].join('\n')) },
  { name: 'renamed-exec-import', defect: 'a script renames exec on import and runs a shell command through it',
    apply: (dir) => writeIn(dir, 'scripts/view.mjs', [j("import { ex", "ec as sh } from 'node:child", "_process';"), j("sh('st", "art index.html');"), ''].join('\n')) },
  { name: 'meta-url-handoff', defect: 'a script without Playwright builds the page file URL from its own module URL and hands it on',
    apply: (dir) => writeIn(dir, 'scripts/link.mjs', [j("const page = new URL('../index.html', import.meta", ".url);"), 'console.log(page.href);', ''].join('\n')) },
  { name: 'page-pause', defect: 'a test helper pauses a page, which opens the Playwright inspector',
    apply: (dir) => writeIn(dir, 'tests/lib/debug.mjs', [j('export const hold = (page) => page.pa', 'use();'), ''].join('\n')) },
  { name: 'config-system-browser', defect: 'a root Playwright config runs the browser from a system channel',
    apply: (dir) => writeIn(dir, 'playwright.config.mjs', [j("export default { use: { chan", "nel: 'chrome' } };"), ''].join('\n')) },
  { name: 'settings-hook-opener', defect: 'a Claude Code settings file in the repo runs a hook that opens the page after each edit',
    apply: (dir) => writeHook(dir, j('st', 'art index.html')) },
  { name: 'settings-hook-node-spawn', defect: 'a settings hook runs node -e, which spawns cmd /c start on the page after each edit (R2-2)',
    apply: (dir) => writeHook(dir, j("node -e \"require('child", "_process').spawn('cmd', ['/c', 'st", "art', 'index.html'])\"")) },
  { name: 'settings-hook-runs-script', defect: 'a settings hook runs a repo shell script, named through $CLAUDE_PROJECT_DIR, that opens the page after each edit (R2-2)',
    apply: (dir) => {
      writeHook(dir, 'bash "$CLAUDE_PROJECT_DIR"/.claude/hooks/after-edit.sh');
      writeIn(dir, '.claude/hooks/after-edit.sh', ['#!/bin/sh', j('st', 'art index.html'), ''].join('\n'));
    } },
  { name: 'npx-versioned-playwright-open', defect: 'an npm script opens the page in a visible browser through a version-pinned npx playwright@<version> (R2-2)',
    apply: (dir) => addNpmScript(dir, 'view', j('npx playwright@1.63.0 o', 'pen index.html')) },
  { name: 'powershell-quoted-opener', defect: 'an npm script hands Windows PowerShell a quoted command that opens the page, with no switch before the quote (R3-6)',
    apply: (dir) => addNpmScript(dir, 'view', j('powershell "st', 'art index.html"')) },
  { name: 'powershell-switch-opener', defect: 'an npm script hands Windows PowerShell a quoted command that opens the page, after a switch that is not -Command (R3-6)',
    apply: (dir) => addNpmScript(dir, 'view', j('powershell -NoProfile "i', 'i index.html"')) },
  { name: 'popup-pause', defect: "a test helper pauses a popup page that it awaited from a stored waitForEvent promise, Playwright's documented popup pattern (R3-6)",
    apply: (dir) => writeIn(dir, 'tests/lib/debug.mjs', [
      'export async function holdPopup(page) {',
      j("  const popupPromise = page.waitFor", "Event('popup');"),
      "  await page.click('a');",
      '  const popup = await popupPromise;',
      j('  await popup.pa', 'use();'),
      '}', '',
    ].join('\n')) },
  { name: 'destructured-popup-pause', defect: 'a test helper pauses a popup page that it destructured from a Promise.all over waitForEvent and a click (R3-6)',
    apply: (dir) => writeIn(dir, 'tests/lib/debug.mjs', [
      'export async function holdPopup(page) {',
      '  const [popup] = await Promise.all([',
      j("    page.waitFor", "Event('popup'),"),
      "    page.click('a'),",
      '  ]);',
      j('  await popup.pa', 'use();'),
      '}', '',
    ].join('\n')) },
  { name: 'arrow-helper-pause', defect: 'an arrow-function helper opens a page under a name without "page" in its first statement and pauses it, so a scan that reads the outer declaration to its first semicolon binds only the helper (R4-2)',
    apply: (dir) => writeIn(dir, 'tests/lib/debug.mjs', [j('export const glide = async (context) => { const tab = await context.newPage(); await tab.pa', 'use(); };'), ''].join('\n')) },
  { name: 'semicolon-free-pause', defect: 'a helper written without semicolons opens a page under a name without "page" and pauses it, so a scan that reads each declaration to its first semicolon binds only the first name (R4-2)',
    apply: (dir) => writeIn(dir, 'tests/lib/debug.mjs', [
      'export async function hold(browser) {',
      '  const ctx = await browser.newContext()',
      '  const tab = await ctx.newPage()',
      j('  await tab.pa', 'use()'),
      '}', '',
    ].join('\n')) },
  { name: 'cmd-echo-off-powershell-opener', defect: "a .cmd script hands Windows PowerShell a quoted command that opens the page, behind cmd's echo-off @ (R5-4)",
    apply: (dir) => writeIn(dir, 'scripts/view.cmd', ['@echo off', j('@powershell -NoProfile "i', 'i index.html"'), ''].join('\r\n')) },
  { name: 'sh-then-opener', defect: 'a shell script opens the page behind the keyword then, on one line with its if (R5-4)',
    apply: (dir) => writeIn(dir, 'scripts/view.sh', ['#!/bin/sh', j('if [ -f index.html ]; then st', 'art index.html; fi'), ''].join('\n')) },
  { name: 'for-of-pages-pause', defect: 'a test helper pauses every open page through a for…of loop over pages() under a name without "page" (review round 5, minor 4)',
    apply: (dir) => writeIn(dir, 'tests/lib/debug.mjs', ['export async function holdAll(context) {', j('  for (const tab of context.pages()) await tab.pa', 'use();'), '}', ''].join('\n')) },
  { name: 'powershell-quoted-switch-opener', defect: 'an npm script hands Windows PowerShell a quoted command that opens the page, after a switch whose value is quoted (R4-4)',
    apply: (dir) => addNpmScript(dir, 'view', j('powershell -WindowStyle "Hidden" "i', 'i index.html"')) },
];
function writeHook(dir, command) {
  writeIn(dir, '.claude/settings.json', JSON.stringify({ hooks: { PostToolUse: [{ matcher: 'Edit|Write', hooks: [{ type: 'command', command }] }] } }, null, 2) + '\n');
}

function editFile(file, edits) {
  let src = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');   // checkouts may be CRLF
  for (const [from, to] of edits) {
    const n = src.split(from).length - 1;
    if (n !== 1) throw new Error(`mutant edit for ${path.relative(ROOT, file)} matched ${n} times (needs exactly 1): ${JSON.stringify(from)}`);
    src = src.replace(from, () => to);
  }
  writeFileSync(file, src);
}

function writePageMutant(m) {
  const file = path.join(OUT, `${m.name}.html`);
  writeFileSync(file, readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  editFile(file, m.edits);
  return path.relative(ROOT, file);
}

// Copies the repo, since the hygiene gate reads any repo file a command names, then applies the
// mutant. Version control, dependencies, run output and agents' worktrees are left out.
const TREE_SKIP = new Set(['.git', 'node_modules', 'tmp', 'test-results', 'playwright-report', '.claude/worktrees']);
function writeTreeMutant(m) {
  const dir = path.join(OUT, m.name);
  rmSync(dir, { recursive: true, force: true });
  const keep = (src) => !TREE_SKIP.has(path.relative(ROOT, src).replace(/\\/g, '/'));
  for (const name of readdirSync(ROOT)) {
    const src = path.join(ROOT, name);
    if (keep(src)) cpSync(src, path.join(dir, name), { recursive: true, filter: keep });
  }
  m.apply(dir);
  return path.relative(ROOT, dir);
}

// Runs the gate files with the given environment, in the phases npm test uses (the illusion file
// alone, then the sequence file, then the rest two at a time; tests/lib/phases.mjs). Each failed top-level test comes back
// with its kind: 'check' for an AssertionError thrown in the test body, 'error' for anything else.
async function runGates(files, env) {
  Object.assign(process.env, env);
  const failed = [];
  let passed = 0;
  try {
    for (const group of phases(files)) for await (const ev of run({ files: group.map((f) => path.join(ROOT, f)), concurrency: 2, cwd: ROOT })) {
      if (ev.type === 'test:pass' && ev.data.nesting === 0 && ev.data.details?.type !== 'suite') passed++;
      if (ev.type !== 'test:fail' || ev.data.nesting !== 0) continue;
      const err = ev.data.details?.error;
      const cause = err?.cause ?? err;
      const check = err?.failureType === 'testCodeFailure' && (cause?.code === 'ERR_ASSERTION' || cause?.name === 'AssertionError');
      const kind = check ? 'check' : `error (${err?.failureType ?? 'unknown'}${cause?.name ? ', ' + cause.name : ''})`;
      // The line in the test body itself when the stack has it (a helper's assert sits above it).
      const stack = String(cause?.stack ?? ''), FRAME = String.raw`tests[\\/][\w.-]+\.test\.mjs:\d+`;
      const where = (new RegExp(String.raw`TestContext\.<anonymous> \(.*?(` + FRAME + ')').exec(stack)?.[1] ?? new RegExp(FRAME).exec(stack)?.[0])?.replace(/\\/g, '/') ?? `${path.basename(ev.data.file ?? '?')}`;
      // A list check (deepEqual against []) names its offenders in `actual`: show the first.
      const list = Array.isArray(cause?.actual) && cause.actual.length ? ` [${cause.actual[0]}${cause.actual.length > 1 ? ` and ${cause.actual.length - 1} more` : ''}]` : '';
      failed.push({ test: ev.data.name, kind, check, where, message: String(cause?.message ?? cause).split('\n')[0] + list });
    }
  } finally {
    for (const k of Object.keys(env)) delete process.env[k];
  }
  return { failed, passed };
}

function usage(msg) {
  console.error(`mutate.mjs: ${msg}\nUsage: node tests/mutate.mjs [--write-only] [mutant-name ...]`);
  process.exit(2);
}
const args = process.argv.slice(2);
const writeOnly = args.includes('--write-only');
for (const a of args) if (a.startsWith('--') && a !== '--write-only') usage(`unknown option "${a}"`);
const names = args.filter((a) => !a.startsWith('--'));
const known = [...PAGE_MUTANTS, ...TREE_MUTANTS].map((m) => m.name);
for (const n of names) if (!known.includes(n)) usage(`unknown mutant "${n}"; known: ${known.join(', ')}`);
const pick = (list) => list.filter((m) => !names.length || names.includes(m.name));
for (const k of ['PAGE', 'SCAN_ROOT']) delete process.env[k];   // the tool sets these per run

mkdirSync(OUT, { recursive: true });
const jobs = [
  ...pick(PAGE_MUTANTS).map((m) => ({ m, target: writePageMutant(m), files: PAGE_GATES, env: (t) => ({ PAGE: t }) })),
  ...pick(TREE_MUTANTS).map((m) => ({ m, target: writeTreeMutant(m), files: HYGIENE_GATE, env: (t) => ({ SCAN_ROOT: t }), tree: true })),
];
for (const job of jobs) console.log(`wrote ${job.target}  (${job.m.defect})`);
if (writeOnly) process.exit(0);

const secs = (t0) => `${((Date.now() - t0) / 1000).toFixed(0)} s`;
const show = (f) => console.log(`  ${f.check ? 'CHECK' : 'ERROR'}  ${f.test}\n         ${f.where}: ${f.message}${f.check ? '' : `\n         (${f.kind})`}`);

// Control: the gate files these mutants need, on the real page and tree.
const controlFiles = [...new Set(jobs.flatMap((job) => job.files))];
const t0 = Date.now();
const control = await runGates(controlFiles, { PAGE: 'index.html', SCAN_ROOT: '.' });
console.log(`\n## control (index.html and the real tree; ${controlFiles.join(', ')}): ${control.failed.length} red, ${control.passed} green (${secs(t0)})`);
for (const f of control.failed) show(f);
if (control.failed.length || !control.passed) {
  console.error(`\nSTOPPED: the control run is not green (${control.failed.length} red, ${control.passed} green), so the gates cannot judge mutants. Fix the gates or the environment (is Chromium installed? run npx playwright install chromium) and run again.`);
  process.exit(2);
}

const rows = [];
for (const job of jobs) {
  const t1 = Date.now();
  const { failed, passed } = await runGates(job.files, job.env(job.target));
  if (job.tree) rmSync(path.join(ROOT, job.target), { recursive: true, force: true });
  const checks = failed.filter((f) => f.check);
  const verdict = checks.length ? 'KILLED' : failed.length ? 'ERRORED' : 'SURVIVED';
  const flag = passed === 0 ? '  FLAG: 0 green tests, so the mutant may break the page wholesale; the run fails on it' : '';
  console.log(`\n## ${job.m.name}: ${verdict}${checks.length ? ` by ${checks.length} check(s)` : ''} (${failed.length} red, ${passed} green, ${secs(t1)})${flag}`);
  for (const f of failed) show(f);
  if (verdict === 'ERRORED') console.log('  ERRORED: tests failed, but none on a check, so no gate judged this mutant');
  if (verdict === 'SURVIVED') console.log('  SURVIVED: no gate went red');
  rows.push({ name: job.m.name, verdict, flag: !!flag, checks });
}

console.log('\n## summary\n');
for (const r of rows) console.log(`${r.verdict.padEnd(8)} ${r.name}${r.flag ? ' (FLAG: 0 green)' : ''}${r.checks.length ? ' <- ' + r.checks.map((c) => `${c.test} [${c.where}]`).join('; ') : ''}`);
const count = (v) => rows.filter((r) => r.verdict === v).length;
console.log(`\ncontrol green (${control.passed} tests); ${rows.length} mutant(s): ${count('KILLED')} killed, ${count('SURVIVED')} survived, ${count('ERRORED')} errored; ${rows.filter((r) => r.flag).length} flagged with 0 green tests (${secs(t0)} in all)`);
process.exit(count('SURVIVED') || count('ERRORED') || rows.some((r) => r.flag) ? 1 : 0);
