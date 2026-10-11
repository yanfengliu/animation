// Mutation proof for the gates: a gate counts only once it has gone red with its defect
// reintroduced (fleet R18). This writes each mutant under tmp/mutants/ and, unless --write-only
// is given, runs the gate files against it with node:test's run() and prints which tests failed
// and the assertion line that failed. Run it after changing a gate or the page.
//
// Usage: node tests/mutate.mjs [--write-only] [mutant-name ...]   (default: every mutant)
// Page mutants are edited copies of index.html, tested through PAGE=tmp/mutants/<name>.html.
// Tree mutants are edited copies of scripts/, tests/ and package.json, scanned by the hygiene
// gate through SCAN_ROOT=tmp/mutants/<name>. Tree mutants are only scanned, never run.
// Every edit must match exactly once, or the tool stops: a mutant that silently equals the
// original would report a false green.
import { run } from 'node:test';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  { name: 'pinch-keeps-first-finger-start', defect: 'a second finger does not raise gestureFrom, so a pinch at E ends off E (the round-0 behaviour)',
    edits: [["gestureFrom = mode === 'drag' ? Math.max(gestureFrom, alignDeg()) : alignDeg();", "if (mode !== 'drag') gestureFrom = alignDeg();"]] },
  { name: 'reduced-motion-coasts', defect: 'with reduced motion a fling still coasts (the round-0 behaviour)',
    edits: [["if (speed > 0.15 && !reduced) { mode = 'inertia'; return; }", "if (speed > 0.15) { mode = 'inertia'; return; }"]] },
  { name: 'mask-needs-readback', defect: 'the stroke mask depends on 2D canvas readback, which anti-fingerprinting blanks (the round-0 behaviour)',
    edits: [['  // B = S blurred by a Gaussian', "  const probe = document.createElement('canvas').getContext('2d'); probe.fillRect(0, 0, 1, 1);\n  if (probe.getImageData(0, 0, 1, 1).data[3] < 128) S.fill(0);\n  // B = S blurred by a Gaussian"]] },
  { name: 'fonts-block', defect: 'the Google Fonts stylesheet blocks the page script again (the round-0 behaviour)',
    edits: [['<style>', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Instrument+Serif:ital@1&amp;display=swap">\n<style>']] },
  { name: 'canvas-not-focusable', defect: 'the canvas cannot take keyboard focus',
    edits: [['<canvas id="scene" role="img" tabindex="0" ', '<canvas id="scene" role="img" ']] },
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

// The hygiene gate scans text, so the defects below are assembled from pieces here; written out
// whole, this file would itself be flagged.
const j = (...parts) => parts.join('');
const TREE_MUTANTS = [
  { name: 'headless-false', defect: 'a script launches a visible browser',
    apply: (dir) => editFile(path.join(dir, 'scripts', 'shoot.mjs'), [['headless: true', j('head', 'less: ', String(!true))]]) },
  { name: 'opener-npm-script', defect: 'an npm script opens the page in the system browser',
    apply: (dir) => {
      const file = path.join(dir, 'package.json');
      const pkg = JSON.parse(readFileSync(file, 'utf8'));
      pkg.scripts.view = j('st', 'art index.html');
      writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
    } },
  { name: 'script-opens-file', defect: 'a script hands a file URL of the page to the desktop',
    apply: (dir) => writeFileSync(path.join(dir, 'scripts', 'view.mjs'), [
      j("import { exec } from 'node:child", "_process';"),
      j("import { pathTo", "FileURL } from 'node:url';"),
      j('exec(`expl', 'orer "${pathTo', "FileURL('index.html')}\"`);"),
      '',
    ].join('\n')) },
];

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

function writeTreeMutant(m) {
  const dir = path.join(OUT, m.name);
  rmSync(dir, { recursive: true, force: true });
  for (const sub of ['scripts', 'tests']) cpSync(path.join(ROOT, sub), path.join(dir, sub), { recursive: true });
  cpSync(path.join(ROOT, 'package.json'), path.join(dir, 'package.json'));
  m.apply(dir);
  return path.relative(ROOT, dir);
}

// Runs the gate files with the given environment; resolves to the failed tests with the first
// line of each failure and the test-file line that raised it.
async function runGates(files, env) {
  Object.assign(process.env, env);
  const failed = [];
  let passed = 0;
  const stream = run({ files: files.map((f) => path.join(ROOT, f)), concurrency: 2, cwd: ROOT });
  for await (const ev of stream) {
    if (ev.type === 'test:pass' && ev.data.nesting === 0 && ev.data.details?.type !== 'suite') passed++;
    if (ev.type !== 'test:fail' || ev.data.nesting !== 0) continue;
    const err = ev.data.details?.error;
    const cause = err?.cause ?? err;
    const where = /tests[\\/][\w.-]+\.test\.mjs:\d+/.exec(String(cause?.stack ?? ''))?.[0]?.replace(/\\/g, '/') ?? `${path.basename(ev.data.file ?? '?')}`;
    failed.push({ test: ev.data.name, where, message: String(cause?.message ?? cause).split('\n')[0] });
  }
  for (const k of Object.keys(env)) delete process.env[k];
  return { failed, passed };
}

const args = process.argv.slice(2);
const writeOnly = args.includes('--write-only');
const names = args.filter((a) => !a.startsWith('--'));
const known = [...PAGE_MUTANTS, ...TREE_MUTANTS].map((m) => m.name);
for (const n of names) if (!known.includes(n)) throw new Error(`unknown mutant "${n}"; known: ${known.join(', ')}`);
const pick = (list) => list.filter((m) => !names.length || names.includes(m.name));

mkdirSync(OUT, { recursive: true });
const jobs = [
  ...pick(PAGE_MUTANTS).map((m) => ({ m, target: writePageMutant(m), files: PAGE_GATES, env: (t) => ({ PAGE: t }) })),
  ...pick(TREE_MUTANTS).map((m) => ({ m, target: writeTreeMutant(m), files: HYGIENE_GATE, env: (t) => ({ SCAN_ROOT: t }) })),
];
for (const job of jobs) console.log(`wrote ${job.target}  (${job.m.defect})`);
if (writeOnly) process.exit(0);

let survivors = 0;
for (const job of jobs) {
  const t0 = Date.now();
  const { failed, passed } = await runGates(job.files, job.env(job.target));
  console.log(`\n## ${job.m.name}: ${failed.length} red, ${passed} green (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  for (const f of failed) console.log(`  RED  ${f.test}\n       ${f.where}: ${f.message}`);
  if (!failed.length) { survivors++; console.log('  SURVIVED: no gate went red'); }
}
console.log(`\n${jobs.length} mutant(s), ${survivors} survived`);
process.exit(survivors ? 1 : 0);
