// Screenshot instrument for index.html: loads the page from disk in headless Chromium
// (SwiftShader WebGL2) with view query parameters and saves PNGs under tmp/shots/.
//
// Usage: node scripts/shoot.mjs [options] [view ...]
//   A view is comma-separated key=value pairs:
//     az, el, fov, t, layer, seed, tour  page query parameters (tour defaults to 0, t to --t)
//     viewport=WxH, dpr=N, reduced=1      browser context
//     wait=MS                             extra wait after the frames (for live clocks)
//     clip=X:Y:W:H                        CSS-pixel crop of the screenshot
//     name=NAME                           file name (without .png)
//   Options: --viewport=1280x800 --dpr=1 --t=0 --frames=4 --out=tmp/shots --preset=magic|off|all
// Prints one line per shot: path, sha256 of the PNG bytes, and what the page reports.
// Exits non-zero when WebGL2 is missing, the page logs an error, or a requested view did not take.

import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pageUrl = pathToFileURL(path.join(root, 'index.html')).href;
const MAGIC = { az: 38, el: 14 };

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
  const v = {};
  for (const part of spec.split(',').filter(Boolean)) {
    const i = part.indexOf('=');
    if (i < 1) fail(`view part "${part}" in "${spec}" is not key=value`);
    v[part.slice(0, i)] = part.slice(i + 1);
  }
  return v;
}
function fail(msg) { console.error('shoot: ' + msg); process.exit(2); }

// Fixed view sets for the acceptance checks. Random angles come from a fixed seed and stay
// at least 25 degrees from E, so the set is the same on every run.
function preset(name) {
  const at = (daz, del, extra = {}) => ({ az: String(MAGIC.az + daz), el: String(MAGIC.el + del), ...extra });
  const magic = [];
  for (const vp of ['1280x800', '390x844']) {
    const tag = vp.split('x')[0];
    for (const t of ['0', '7.3', '31']) magic.push(at(0, 0, { viewport: vp, t, name: `magic_${tag}_t${t}` }));
    // Zoom in as far as the text block still fits (the phone's base FOV is about 66 degrees).
    magic.push(at(0, 0, { viewport: vp, fov: vp === '1280x800' ? '32' : '58', name: `magic_${tag}_zoomin` }));
    magic.push(at(0, 0, { viewport: vp, fov: vp === '1280x800' ? '80' : '95', name: `magic_${tag}_zoomout` }));
  }
  magic.push(at(0, 0, { layer: 'text', name: 'magic_1280_textlayer' }));
  const off = [];
  for (const d of [8, -8, 25, -25, 60, -60]) off.push(at(d, 0, { name: `off_az${d > 0 ? '+' : ''}${d}` }));
  for (const d of [8, -8, 25, -25, 60, -60]) off.push(at(0, d, { name: `off_el${d > 0 ? '+' : ''}${d}` }));
  off.push({ az: String(MAGIC.az + 180), el: String(-MAGIC.el), name: 'off_back' });
  off.push({ az: String(MAGIC.az + 90), el: '70', name: 'off_top' });   // el+60 already covers az of E at el 70
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
  if (name === 'magic') return magic;
  if (name === 'off') return off;
  if (name === 'all') return [...magic, ...off];
  fail(`unknown preset "${name}"; known: magic, off, all`);
}

if (opts.preset) views.push(...preset(opts.preset));
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
  for (const k of ['az', 'el', 'fov', 'layer', 'seed']) if (v[k] !== undefined) query.set(k, v[k]);
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
  await page.goto(pageUrl + '?' + query, { waitUntil: 'load' });
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
  const state = await page.evaluate(() => ({ view: window.__cloud.view(), align: window.__cloud.alignment(), mode: window.__cloud.mode(), counts: window.__cloud.counts }));
  const wrap = (d) => ((d % 360) + 540) % 360 - 180;
  if (v.az !== undefined && Math.abs(wrap(state.view.az - Number(v.az))) > 0.01) problems.push(`az did not take: asked ${v.az}, page reports ${state.view.az}`);
  if (v.el !== undefined && Math.abs(state.view.el - Math.max(-70, Math.min(70, Number(v.el)))) > 0.01) problems.push(`el did not take: asked ${v.el}, page reports ${state.view.el}`);
  if (v.fov !== undefined && Math.abs(state.view.fov - Number(v.fov)) > 0.05) problems.push(`fov did not take: asked ${v.fov}, page reports ${state.view.fov.toFixed(2)} (zoom limits?)`);
  const name = v.name || ['shot', `${vw}x${vh}@${dpr}`, `az${v.az ?? 'def'}`, `el${v.el ?? 'def'}`, v.fov && `fov${v.fov}`, `t${t}`, v.layer].filter(Boolean).join('_');
  const file = path.join(outDir, name + '.png');
  let clip;
  if (v.clip) { const [x, y, width, height] = v.clip.split(':').map(Number); clip = { x, y, width, height }; }
  const png = await page.screenshot({ clip, animations: 'disabled' });
  await writeFile(file, png);
  const sha = createHash('sha256').update(png).digest('hex');
  const s = state.view;
  console.log(`${path.relative(root, file).replace(/\\/g, '/')}  sha256:${sha}  az=${s.az.toFixed(2)} el=${s.el.toFixed(2)} fov=${s.fov.toFixed(2)} align=${state.align.toFixed(2)} mode=${state.mode} text=${state.counts.text} ambient=${state.counts.ambient}`);
  for (const p of problems) console.log('  PROBLEM ' + p);
  await context.close();
  return problems.length ? 1 : 0;
}
