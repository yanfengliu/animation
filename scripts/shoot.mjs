// Screenshot instrument for index.html: loads the page from disk in headless Chromium
// (SwiftShader WebGL2) with view query parameters and saves PNGs under tmp/shots/.
//
// Usage: node scripts/shoot.mjs [options] [view ...]
//   A view is comma-separated key=value pairs:
//     az, el, fov, t                      page query parameters, numbers (t defaults to --t; t=live runs the clock)
//     seed, layer=text|ambient, tour=0|1  page query parameters (no layer: the full scene; tour defaults to 0)
//     msg=NAME                            page query parameter: the camera at that message's eye (az, el override it)
//     textof=NAME                         page query parameter, with layer=text only: that message's text particles
//     capture=0|1                         capture=1 opens the page with #capture (no chrome, the sequence loops)
//     beta                                page query parameter, a number from 0 to 1: the test-only peak
//                                         relocation chance (no beta: the page's default; beta=0: no text)
//     viewport=WxH, dpr=N, reduced=0|1    browser context
//     wait=MS                             extra wait after the frames (for live clocks)
//     clip=X:Y:W:H                        CSS-pixel crop of the screenshot
//     name=NAME                           file name (without .png)
//   Options: --viewport=1280x800 --dpr=1 --t=0 --frames=4 --out=tmp/shots --preset=magic|off|all|seq|between
//   NAME is one of the page's messages, in sequence order: hello-world, face, what, a, beautiful, world.
//   Presets magic and off are about hello world; seq shoots every message at its own eye; between
//   shoots the views away from the eyes (neighbour midpoints, each eye's back view, above, below, start).
// Prints one line per shot: path, sha256 of the PNG bytes, and what the page reports.
// Exits 2 before shooting on a malformed option or view: an unknown or repeated key, an empty value,
// or a value the page would not read as meant (it quietly renders its default for those).
// Exits 1 when WebGL2 is missing, the page logs an error, or a requested view did not take.

import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pageUrl = pathToFileURL(path.join(root, 'index.html')).href;
const MAGIC = { az: 38, el: 14 };
// The page's messages in sequence order with their eyes (window.__cloud.messages); every shot checks
// that the page still reports exactly these.
const EYES = { 'hello-world': [38, 14], face: [98, 18], what: [158, 16], a: [218, 20], beautiful: [278, 16], world: [338, 18] };
const MESSAGES = Object.keys(EYES);
// Every key a view may use. The page draws one layer for layer=text or layer=ambient and the full
// scene for any other value, and runs its tour unless tour=0; reduced=1 asks the browser for
// reduced motion. So those three keys take only the values below.
const VIEW_KEYS = ['az', 'el', 'fov', 't', 'seed', 'beta', 'layer', 'tour', 'msg', 'textof', 'capture', 'viewport', 'dpr', 'reduced', 'wait', 'clip', 'name'];
const CHOICES = {
  layer: { values: ['text', 'ambient'], help: 'layer=text or layer=ambient, or leave layer out for the full scene' },
  tour: { values: ['0', '1'], help: 'tour=0 (no tour, the default here) or tour=1' },
  reduced: { values: ['0', '1'], help: 'reduced=1 (reduced motion) or reduced=0' },
  msg: { values: MESSAGES, help: `msg=NAME with NAME one of ${MESSAGES.join(', ')}` },
  textof: { values: MESSAGES, help: `textof=NAME with NAME one of ${MESSAGES.join(', ')}` },
  capture: { values: ['0', '1'], help: 'capture=1 (open the page with #capture) or capture=0' },
};

const opts = { viewport: '1280x800', dpr: '1', t: '0', frames: '4', out: 'tmp/shots', preset: '' };
const views = [];
for (const arg of process.argv.slice(2)) {
  const m = /^--([a-z]+)=(.*)$/.exec(arg);
  if (m) {
    if (!(m[1] in opts)) fail(`unknown option --${m[1]}; known: ${Object.keys(opts).map((k) => '--' + k).join(' ')}`);
    opts[m[1]] = m[2];
  } else views.push(parseView(arg));
}

function parseView(spec) {
  const v = Object.create(null);
  for (const part of spec.split(',').filter(Boolean)) {
    const i = part.indexOf('=');
    if (i < 1) fail(`view part "${part}" in "${spec}" is not key=value`);
    const k = part.slice(0, i);
    if (k in v) fail(`view "${spec}" gives ${k} twice; give each key once`);
    v[k] = part.slice(i + 1);
  }
  return v;
}
function fail(msg) { console.error('shoot: ' + msg); process.exit(2); }
// Keys and values are checked because the page renders its default for anything it cannot read:
// a typo such as az=3o, eI=14 or layer=txt would otherwise shoot the default view and look fine.
function checkView(v) {
  for (const [k, val] of Object.entries(v)) {
    if (!VIEW_KEYS.includes(k)) fail(`view ${JSON.stringify(v)}: unknown key "${k}" (${k}=${val}); known keys: ${VIEW_KEYS.join(', ')}`);
    if (val === '') fail(`view ${JSON.stringify(v)}: ${k}= has no value; give one or leave ${k} out`);
    const c = CHOICES[k];
    if (c && !c.values.includes(val)) fail(`view ${JSON.stringify(v)}: ${k}=${val} is not allowed; use ${c.help}`);
  }
  for (const k of ['az', 'el', 'fov', 't', 'beta', 'dpr', 'wait']) {
    const val = v[k] ?? (k === 't' || k === 'dpr' ? opts[k] : undefined);
    if (val === undefined || (k === 't' && val === 'live')) continue;
    if (String(val).trim() === '' || !Number.isFinite(Number(val))) fail(`view ${JSON.stringify(v)}: ${k}=${val} is not a finite number`);
  }
  // The page reads beta only from 0 to 1 and keeps its default for anything else, as it does for a non-number.
  if (v.beta !== undefined && !(Number(v.beta) >= 0 && Number(v.beta) <= 1)) fail(`view ${JSON.stringify(v)}: beta=${v.beta} is outside 0 to 1; the page would ignore it and use its default`);
  // The page reads textof only with layer=text and draws every text particle otherwise.
  if (v.textof !== undefined && v.layer !== 'text') fail(`view ${JSON.stringify(v)}: textof=${v.textof} needs layer=text; the page ignores textof without it`);
  if (v.viewport !== undefined && !/^\d+x\d+$/.test(v.viewport)) fail(`view ${JSON.stringify(v)}: viewport=${v.viewport} is not WxH`);
  if (v.clip !== undefined && v.clip.split(':').map(Number).filter(Number.isFinite).length !== 4) fail(`view ${JSON.stringify(v)}: clip=${v.clip} is not X:Y:W:H`);
}

// Fixed view sets for the acceptance checks. Random angles come from a fixed seed and stay
// at least 25 degrees from E, so the set is the same on every run.
function preset(name) {
  const at = (daz, del, extra = {}) => ({ az: String(MAGIC.az + daz), el: String(MAGIC.el + del), ...extra });
  const magic = [];
  for (const vp of ['1280x800', '390x844']) {
    const tag = vp.split('x')[0];
    for (const t of ['0', '7.3', '31']) magic.push(at(0, 0, { viewport: vp, t, name: `magic_${tag}_t${t}` }));
    // Zoom in as far as the text block still fits (the phone's base FOV is about 67 degrees; at 60
    // the leaning block keeps about 11 px to each side).
    magic.push(at(0, 0, { viewport: vp, fov: vp === '1280x800' ? '32' : '60', name: `magic_${tag}_zoomin` }));
    magic.push(at(0, 0, { viewport: vp, fov: vp === '1280x800' ? '80' : '95', name: `magic_${tag}_zoomout` }));
  }
  magic.push(at(0, 0, { layer: 'text', name: 'magic_1280_textlayer' }));
  const off = [];
  // Elevation +56 is the top of the range (el 70); text particles drift differently from ambient
  // ones, so the near views also run at particle times 7.3 and 31.
  for (const d of [8, -8, 25, -25, 60, -60]) off.push(at(d, 0, { name: `off_az${d > 0 ? '+' : ''}${d}` }));
  for (const d of [8, -8, 25, -25, 56, -60]) off.push(at(0, d, { name: `off_el${d > 0 ? '+' : ''}${d}` }));
  for (const d of [8, -8, 25, -25]) for (const t of ['7.3', '31']) {
    off.push(at(d, 0, { t, name: `off_az${d > 0 ? '+' : ''}${d}_t${t}` }));
    off.push(at(0, d, { t, name: `off_el${d > 0 ? '+' : ''}${d}_t${t}` }));
  }
  off.push({ az: String(MAGIC.az + 180), el: String(-MAGIC.el), name: 'off_back' });
  off.push({ az: String(MAGIC.az + 90), el: '70', name: 'off_top' });   // off_el+56 already covers E's azimuth at el 70
  off.push(at(25, 0, { layer: 'text', name: 'off_az+25_textlayer' }));
  off.push(at(8, 0, { layer: 'text', name: 'off_az+8_textlayer' }));
  let s = 20261010;
  const rand = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const dir = (az, el) => [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)];
  const e = dir(MAGIC.az * Math.PI / 180, MAGIC.el * Math.PI / 180);
  for (let n = 0; n < 5;) {
    const az = rand() * 360 - 180, el = Math.asin(rand() * 2 - 1) * 180 / Math.PI;
    if (Math.abs(el) > 70) continue;
    const d = dir(az * Math.PI / 180, el * Math.PI / 180);
    if (Math.acos(Math.min(1, d[0] * e[0] + d[1] * e[1] + d[2] * e[2])) * 180 / Math.PI < 25) continue;
    off.push({ az: az.toFixed(1), el: el.toFixed(1), name: `off_random${++n}` });
  }
  // Every message at its own eye, at both viewports and three particle times, and its own text layer.
  const seq = [];
  for (const m of MESSAGES) {
    for (const vp of ['1280x800', '390x844']) seq.push({ msg: m, viewport: vp, name: `seq_${m}_${vp.split('x')[0]}` });
    for (const t of ['7.3', '31']) seq.push({ msg: m, t, name: `seq_${m}_1280_t${t}` });
    seq.push({ msg: m, layer: 'text', textof: m, name: `seq_${m}_textlayer` });
  }
  // Away from the eyes: the midpoint between each pair of neighbours in the sequence, each eye's back
  // view, above, below, and the start view.
  const between = [];
  MESSAGES.forEach((m, i) => {
    const n = MESSAGES[(i + 1) % MESSAGES.length], [a, b] = [EYES[m], EYES[n]];
    const az = (a[0] + ((((b[0] - a[0]) % 360) + 360) % 360) / 2) % 360;
    between.push({ az: String(az), el: String((a[1] + b[1]) / 2), name: `between_${m}_${n}` });
  });
  for (const m of MESSAGES) between.push({ az: String((EYES[m][0] + 180) % 360), el: String(-EYES[m][1]), name: `back_${m}` });
  between.push({ az: '68', el: '70', name: 'above' }, { az: '248', el: '-70', name: 'below' }, { name: 'start' });
  if (name === 'magic') return magic;
  if (name === 'off') return off;
  if (name === 'all') return [...magic, ...off];
  if (name === 'seq') return seq;
  if (name === 'between') return between;
  fail(`unknown preset "${name}"; known: magic, off, all, seq, between`);
}

if (!/^\d+x\d+$/.test(opts.viewport)) fail(`--viewport=${opts.viewport} is not WxH, such as --viewport=1280x800`);
if (!/^\d+$/.test(opts.frames)) fail(`--frames=${opts.frames} is not a whole number of frames`);
if (opts.preset) views.push(...preset(opts.preset));
for (const v of views) checkView(v);
if (!views.length) fail('no views; pass key=value views or --preset=magic|off|all (see the header of scripts/shoot.mjs)');

const outDir = path.resolve(root, opts.out);
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const version = browser.version();
let failures = 0;
try {
  for (const v of views) failures += await shoot(v);
} finally {
  await browser.close();
}
console.log(`chromium ${version}; ${views.length} view(s), ${failures} problem(s)`);
process.exit(failures ? 1 : 0);

async function shoot(v) {
  const [vw, vh] = (v.viewport || opts.viewport).split('x').map(Number);
  const dpr = Number(v.dpr || opts.dpr);
  if (!(vw > 0 && vh > 0 && dpr > 0)) fail(`bad viewport/dpr in view ${JSON.stringify(v)}`);
  const query = new URLSearchParams();
  for (const k of ['az', 'el', 'fov', 'layer', 'textof', 'msg', 'seed', 'beta']) if (v[k] !== undefined) query.set(k, v[k]);
  const t = v.t ?? opts.t;
  if (t !== 'live') query.set('t', t);
  query.set('tour', v.tour ?? '0');
  const context = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr, reducedMotion: v.reduced === '1' ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const problems = [];
  const fontUrl = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
  page.on('console', (msg) => {
    // The font requests are aborted on purpose below; Chromium logs each one as a console error.
    if (msg.type() === 'error' && !fontUrl.test(msg.location().url || '')) problems.push('console error: ' + msg.text());
  });
  page.on('pageerror', (err) => problems.push('page error: ' + err.message));
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('file:')) return route.continue();
    if (fontUrl.test(url)) return route.abort();
    problems.push('unexpected request: ' + url);
    return route.abort();
  });
  await page.goto(pageUrl + '?' + query + (v.capture === '1' ? '#capture' : ''), { waitUntil: 'load' });
  try {
    await page.waitForFunction(() => window.__cloud && window.__cloud.ready, null, { timeout: 20000 });
  } catch {
    const msg = await page.evaluate(() => { const n = document.getElementById('nogl'); return n && !n.hidden ? n.textContent : 'not ready'; });
    console.log(`FAIL ${JSON.stringify(v)}: page never became ready (${msg})`);
    await context.close();
    return 1;
  }
  const f0 = await page.evaluate(() => window.__cloud.frame);
  const frames = Number(opts.frames);
  await page.waitForFunction((n) => window.__cloud.frame >= n, f0 + frames, { timeout: 20000 });
  if (v.wait) await page.waitForTimeout(Number(v.wait));
  const state = await page.evaluate(() => ({ view: window.__cloud.view(), align: window.__cloud.alignment(), mode: window.__cloud.mode(), counts: window.__cloud.counts, target: window.__cloud.target(), capture: window.__cloud.capture, messages: window.__cloud.messages.map((m) => ({ ...m })) }));
  const wrap = (d) => ((d % 360) + 540) % 360 - 180;
  const reported = state.messages.map((m) => `${m.name}@${m.az},${m.el}`).join(' '), expected = MESSAGES.map((m) => `${m}@${EYES[m].join(',')}`).join(' ');
  if (reported !== expected) problems.push(`the page reports messages ${reported}, but this script knows ${expected}; update EYES`);
  // msg=NAME sets the eye; an az or el given with it overrides that part, and is checked below.
  if (v.msg !== undefined && v.az === undefined && Math.abs(wrap(state.view.az - EYES[v.msg][0])) > 0.01) problems.push(`msg=${v.msg} did not take: the page reports az ${state.view.az}, not ${EYES[v.msg][0]}`);
  if (v.msg !== undefined && v.el === undefined && Math.abs(state.view.el - EYES[v.msg][1]) > 0.01) problems.push(`msg=${v.msg} did not take: the page reports el ${state.view.el}, not ${EYES[v.msg][1]}`);
  if (v.capture === '1' && state.capture !== true) problems.push('capture=1 did not take: the page does not report capture mode');
  if (v.az !== undefined && Math.abs(wrap(state.view.az - Number(v.az))) > 0.01) problems.push(`az did not take: asked ${v.az}, page reports ${state.view.az}`);
  if (v.el !== undefined && Math.abs(state.view.el - Number(v.el)) > 0.01) problems.push(`el did not take: asked ${v.el}, page reports ${state.view.el}${Math.abs(Number(v.el)) > 70 ? ' (the page clamps elevation to ±70)' : ''}`);
  if (v.fov !== undefined && Math.abs(state.view.fov - Number(v.fov)) > 0.05) problems.push(`fov did not take: asked ${v.fov}, page reports ${state.view.fov.toFixed(2)} (zoom limits?)`);
  // The page does not report β; beta=0 must leave no text particles, so a page that ignores beta shows here.
  if (v.beta !== undefined && Number(v.beta) === 0 && state.counts.text !== 0) problems.push(`beta=0 did not take: the page reports ${state.counts.text} text particles`);
  const name = v.name || ['shot', `${vw}x${vh}@${dpr}`, v.msg && `msg-${v.msg}`, `az${v.az ?? 'def'}`, `el${v.el ?? 'def'}`, v.fov && `fov${v.fov}`, `t${t}`, v.beta !== undefined && `beta${v.beta}`, v.layer, v.textof && `of-${v.textof}`, v.capture === '1' && 'capture'].filter(Boolean).join('_');
  const file = path.join(outDir, name + '.png');
  let clip;
  if (v.clip) { const [x, y, width, height] = v.clip.split(':').map(Number); clip = { x, y, width, height }; }
  const png = await page.screenshot({ clip, animations: 'disabled' });
  await writeFile(file, png);
  const sha = createHash('sha256').update(png).digest('hex');
  const s = state.view;
  console.log(`${path.relative(root, file).replace(/\\/g, '/')}  sha256:${sha}  az=${s.az.toFixed(2)} el=${s.el.toFixed(2)} fov=${s.fov.toFixed(2)} align=${state.align.toFixed(2)} mode=${state.mode} target=${state.target} text=${state.counts.text} ambient=${state.counts.ambient}`);
  for (const p of problems) console.log('  PROBLEM ' + p);
  await context.close();
  return problems.length ? 1 : 0;
}
