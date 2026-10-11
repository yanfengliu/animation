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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tmp', 'mutants');
const PAGE_GATES = ['tests/illusion.test.mjs', 'tests/controls.test.mjs', 'tests/page.test.mjs'];
const HYGIENE_GATE = ['tests/hygiene.test.mjs'];

const PAGE_MUTANTS = [
  { name: 'text-drifts-sideways', defect: 'text particles get the ambient drift across their sight lines',
    edits: [['p += a_dir * s;', 'p += a_dir * s + drift(a_pos, t);']] },
  { name: 'zoom-dollies-eye', defect: 'zoom moves the eye toward the cloud instead of narrowing the field of view (view() still reports the zoomed fov)',
    edits: [['const th = tanHalf(), aspect = w / h;', 'const th = baseTan(viewAspect()), aspect = w / h;'],
      ['const eye = eyeDir(cam.az, cam.el).map((v) => v * R);', 'const eye = eyeDir(cam.az, cam.el).map((v) => v * R / cam.zoom);']] },
  { name: 'no-relocation', defect: 'text particles are chosen but never moved onto the strokes',
    edits: [['P[i * 3 + a] = E_POS[a] + dirs[i * 3 + a] * dist;', '/* mutant: no relocation */']] },
  { name: 'flat-text', defect: 'text particles are moved onto the text plane, a flat sign readable from the side',
    edits: [['P[i * 3 + a] = E_POS[a] + dirs[i * 3 + a] * dist;', 'P[i * 3 + a] = E_POS[a] + dirs[i * 3 + a] * tl;']] },
  { name: 'text-always-lit', defect: 'the approach cue and lock ignore the angle, so text particles always glow gold',
    edits: [['gl.uniform1f(u.u_hint, 1 - smoothstep(12, 22, delta));', 'gl.uniform1f(u.u_hint, 1);'],
      ['gl.uniform1f(u.u_lock, 1 - smoothstep(0.8, 6, delta));', 'gl.uniform1f(u.u_lock, 1);']] },
  { name: 'reveal-off', defect: 'the reveal never engages: u_hint and u_lock are held at 0, so text particles look ambient even at E',
    edits: [['gl.uniform1f(u.u_hint, 1 - smoothstep(12, 22, delta));', 'gl.uniform1f(u.u_hint, 0);'],
      ['gl.uniform1f(u.u_lock, 1 - smoothstep(0.8, 6, delta));', 'gl.uniform1f(u.u_lock, 0);']] },
  { name: 'mirrored', defect: 'the projection mirrors the frame left to right (-f / aspect)',
    edits: [['new Float32Array([f / aspect,', 'new Float32Array([-f / aspect,']] },
  { name: 'turned-180', defect: 'the view matrix turns the frame 180° (its cross product is flipped)',
    edits: [['const r = norm(cross(f, [0, 1, 0]));', 'const r = norm(cross([0, 1, 0], f));']] },
  { name: 'no-phone-widening', defect: 'narrow screens keep the plain 50° field of view, so the text block is cropped at 390×844',
    edits: [['const baseTan = (aspect) => Math.max(Math.tan(BASE_FOV * DEG / 2), FIT_HALF_WIDTH / R / aspect);', 'const baseTan = (aspect) => Math.tan(BASE_FOV * DEG / 2);']] },
  { name: 'seed-ignored', defect: 'the seed parameter does not reach the cloud generator',
    edits: [["const rand = makeRandom('cloud:' + seed);", "const rand = makeRandom('cloud:1');"]] },
  { name: 'drag-sign-flipped', defect: 'horizontal drag turns the camera the wrong way',
    edits: [['cam.az = wrapPi(cam.az - dx * DRAG_RATE);', 'cam.az = wrapPi(cam.az + dx * DRAG_RATE);']] },
  { name: 'wheel-zooms-wrong-way', defect: 'scrolling the wheel up zooms out',
    edits: [['zoomBy(Math.exp(-e.deltaY * unit * 0.0015));', 'zoomBy(Math.exp(e.deltaY * unit * 0.0015));']] },
  { name: 'keys-reversed', defect: 'left and right arrow keys are swapped',
    edits: [['ArrowLeft: [-step, 0], ArrowRight: [step, 0]', 'ArrowLeft: [step, 0], ArrowRight: [-step, 0]']] },
  { name: 'find-jumps', defect: '"Find the angle" jumps to E instead of gliding',
    edits: [["mode = 'glide';\n  beginAnim(target, GLIDE_MS, easeCubic);", "Object.assign(cam, target); mode = 'idle';"]] },
  { name: 'snap-disabled', defect: 'releasing near E never snaps',
    edits: [['if (d < SNAP_DEG && d > 1e-4 && d <= gestureFrom + 0.1) {', 'if (false) {']] },
  { name: 'pinch-ignored', defect: 'two-finger pinch does not zoom',
    edits: [['cam.zoom = clampZoom(pinch.zoom * spread() / pinch.d);', '/* mutant: pinch ignored */']] },
  { name: 'tour-ignores-input', defect: 'a press during the tour does not stop it',
    edits: [["  stopAuto();\n  mode = 'drag';", "  if (mode !== 'tour') { stopAuto(); mode = 'drag'; }"]] },
  { name: 'tour-restarts', defect: 'the tour restarts after 7 s without input (the round-0 behaviour)',
    edits: [["} else if (mode === 'idle' && tourAllowed() && lastInput === -Infinity) {", "} else if (mode === 'idle' && tourAllowed() && now - lastInput > 7000) {"]] },
  { name: 'zoom-cancels-animation', defect: 'wheel or +/- during a glide or snap cancels it (the round-0 behaviour)',
    edits: [["if (anim && anim.target && (mode === 'snap' || mode === 'glide')) { anim.z0 = cam.zoom; anim.dz = 0; anim.target.zoom = cam.zoom; }\n  else if (mode !== 'drag') stopAuto();", "if (mode !== 'drag') stopAuto();"]] },
  { name: 'zoom-not-carried', defect: 'a zoom during a glide or snap is undone as it lands: zoomBy sets anim.z0 and anim.dz but not the target zoom',
    edits: [['anim.z0 = cam.zoom; anim.dz = 0; anim.target.zoom = cam.zoom; }', 'anim.z0 = cam.zoom; anim.dz = 0; }']] },
  { name: 'pinch-keeps-first-finger-start', defect: 'a second finger never raises gestureFrom, so a pinch at E with a little slip ends off E (the round-0 behaviour)',
    edits: [['  else if (Math.hypot(gestureDrag.x, gestureDrag.y) < TOUCH_SLOP) gestureFrom = Math.max(gestureFrom, alignDeg());\n', '']] },
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
      ["  if (reduced) { Object.assign(cam, target); mode = 'idle'; return; }\n", '']] },
  { name: 'console-error', defect: 'the script logs a console error',
    edits: [["'use strict';", "'use strict';\nconsole.error('mutant: injected console error');"]] },
  { name: 'external-script', defect: 'the page loads a script from another host',
    edits: [['</head>', '<script src="https://cdn.example.com/mutant.js"></script>\n</head>']] },
  { name: 'wide-element', defect: 'an element wider than a phone causes horizontal overflow',
    edits: [['<body>', '<body>\n<div style="width:600px;height:4px"></div>']] },
  { name: 'no-focus-outline', defect: 'keyboard focus on "Find the angle" has no visible outline',
    edits: [['#find:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px; }', '#find:focus-visible { outline: none; }']] },
  { name: 'no-fallback-message', defect: 'without WebGL2 the page shows nothing',
    edits: [["  document.getElementById('nogl').hidden = false;\n", '']] },
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

// Runs the gate files with the given environment. Each failed top-level test comes back with its
// kind: 'check' for an AssertionError thrown in the test body, 'error' for anything else.
async function runGates(files, env) {
  Object.assign(process.env, env);
  const failed = [];
  let passed = 0;
  try {
    const stream = run({ files: files.map((f) => path.join(ROOT, f)), concurrency: 2, cwd: ROOT });
    for await (const ev of stream) {
      if (ev.type === 'test:pass' && ev.data.nesting === 0 && ev.data.details?.type !== 'suite') passed++;
      if (ev.type !== 'test:fail' || ev.data.nesting !== 0) continue;
      const err = ev.data.details?.error;
      const cause = err?.cause ?? err;
      const check = err?.failureType === 'testCodeFailure' && (cause?.code === 'ERR_ASSERTION' || cause?.name === 'AssertionError');
      const kind = check ? 'check' : `error (${err?.failureType ?? 'unknown'}${cause?.name ? ', ' + cause.name : ''})`;
      const where = /tests[\\/][\w.-]+\.test\.mjs:\d+/.exec(String(cause?.stack ?? ''))?.[0]?.replace(/\\/g, '/') ?? `${path.basename(ev.data.file ?? '?')}`;
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
