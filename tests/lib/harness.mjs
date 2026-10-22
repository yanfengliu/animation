// Browser harness for the gates. Each test file starts one headless Chromium (WebGL2 through
// SwiftShader) and opens the page under test from disk in fresh contexts.
// PAGE (env) selects the page, relative to the repo root; the default is index.html. Mutation
// runs point it at a copy under tmp/mutants/.
// Network policy for every context: the Google Fonts stylesheet is answered with empty CSS, or with
// a test's own CSS (aborting it would log a console error); every other http(s) request is aborted
// and recorded.
// The harness never writes page state; tests read window.__cloud and drive real input.
import { chromium } from 'playwright';
import { AssertionError } from 'node:assert';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { decodePng } from './image.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PAGE_PATH = path.resolve(ROOT, process.env.PAGE || 'index.html');
if (!existsSync(PAGE_PATH)) {
  throw new Error(`PAGE=${process.env.PAGE ?? '(unset)'} resolves to ${PAGE_PATH}, which does not exist; set PAGE to an HTML file path relative to the repo root, or unset it to test index.html`);
}
export const PAGE_URL = pathToFileURL(PAGE_PATH).href;
export const FONT_CSS = /^https:\/\/fonts\.googleapis\.com\/css2\?/;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function startBrowser() {
  return chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
}

// A new browser context with the network policy, and a log (shared by its pages) of console
// errors and warnings, page errors, every request URL and every blocked request.
// fonts: 'empty' answers the Google Fonts stylesheet with empty CSS; 'hang' never answers it;
// { css } answers it with that CSS.
// initScript runs in every page of the context before the page's own scripts.
export async function newContext(browser, { width = 1280, height = 800, dpr = 1, reducedMotion = 'no-preference', hasTouch = false, isMobile = false, fonts = 'empty', initScript = null } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, reducedMotion, hasTouch, isMobile });
  if (initScript) await context.addInitScript(initScript);
  const log = { errors: [], warnings: [], requests: [], blocked: [] };
  context.on('page', (page) => {
    page.on('console', (m) => {
      if (m.type() === 'error') log.errors.push(`console error: ${m.text()}`);
      else if (m.type() === 'warning') log.warnings.push(m.text());
    });
    page.on('pageerror', (e) => log.errors.push(`page error: ${e.message}`));
    page.on('request', (r) => log.requests.push(r.url()));
  });
  await context.route(/^https?:\/\//, (route) => {
    const url = route.request().url();
    if (FONT_CSS.test(url)) return fonts === 'hang' ? undefined : route.fulfill({ status: 200, contentType: 'text/css', body: fonts?.css ?? '' });
    log.blocked.push(url);
    return route.abort();
  });
  return { context, log };
}

// Opens the page with `query` in a new context; waits for it to draw unless ready is false.
// waitUntil is passed to page.goto ('commit' when a subresource is meant to hang). The caller
// closes the context; if opening fails, the context is closed here before the error is thrown.
export async function openPage(browser, { query = '', ready = true, waitUntil = 'load', ...opts } = {}) {
  const { context, log } = await newContext(browser, opts);
  try {
    const page = await context.newPage();
    await page.goto(PAGE_URL + (query ? '?' + query : ''), { waitUntil });
    if (ready) await waitFrames(page);
    return { context, page, log };
  } catch (err) {
    await context.close().catch(() => {});
    throw err;
  }
}

// Waits until the page reports ready and has drawn `frames` more frames.
export async function waitFrames(page, frames = 3) {
  try {
    await page.waitForFunction(() => window.__cloud && window.__cloud.ready, null, { timeout: 15000 });
  } catch {
    const why = await page.evaluate(() => {
      const n = document.getElementById('nogl');
      return n && !n.hidden ? `fallback shown: ${n.textContent}` : `window.__cloud is ${window.__cloud ? 'present but not ready' : 'missing'}`;
    });
    throw new Error(`the page never became ready within 15 s (${why})`);
  }
  const f0 = await page.evaluate(() => window.__cloud.frame);
  await page.waitForFunction((n) => window.__cloud.frame >= n, f0 + frames, { timeout: 15000 });
}

// What the page reports: view (az, el, fov in degrees), alignment from E, mode, frame.
export function state(page) {
  return page.evaluate(() => {
    const c = window.__cloud, v = c.view();
    return { az: v.az, el: v.el, fov: v.fov, align: c.alignment(), mode: c.mode(), frame: c.frame };
  });
}

// Loads a view in `context` and returns its screenshot decoded to RGB, what the page reported
// and the particle counts (text, ambient, and text per message). Fails when a requested az, el or
// fov did not take, so a view that
// silently fell back to the default is never measured as if it were the one asked for.
export async function render(context, query) {
  const page = await context.newPage();
  try {
    await page.goto(PAGE_URL + '?' + query);
    await waitFrames(page);
    const s = await state(page);
    const want = Object.fromEntries(new URLSearchParams(query));
    const wrap = (d) => ((d % 360) + 540) % 360 - 180;
    if (want.az !== undefined && Math.abs(wrap(s.az - Number(want.az))) > 0.01) throw new Error(`az did not take for "${query}": the page reports ${s.az}`);
    if (want.el !== undefined && Math.abs(s.el - Number(want.el)) > 0.01) throw new Error(`el did not take for "${query}": the page reports ${s.el}`);
    if (want.fov !== undefined && Math.abs(s.fov - Number(want.fov)) > 0.05) throw new Error(`fov did not take for "${query}": the page reports ${s.fov}`);
    const png = await page.screenshot({ animations: 'disabled' });
    const counts = await page.evaluate(() => ({ text: window.__cloud.counts.text, ambient: window.__cloud.counts.ambient, byMessage: { ...window.__cloud.counts.byMessage } }));
    return { img: decodePng(png), state: s, counts };
  } finally {
    await page.close();
  }
}

// Polls fn in the page until it returns truthy; returns the elapsed milliseconds. A timeout is a
// failed check, so it throws an AssertionError (tests/mutate.mjs counts only those as kills); any
// other error (the page closed, fn threw) is passed on unchanged.
export async function until(page, fn, arg, timeout, what) {
  const t0 = Date.now();
  try {
    await page.waitForFunction(fn, arg, { timeout, polling: 25 });
  } catch (err) {
    if (err?.name !== 'TimeoutError') throw err;
    const s = await state(page);
    throw new AssertionError({ message: `${what}: not reached within ${timeout} ms; the page reports ${JSON.stringify(s)}` });
  }
  return Date.now() - t0;
}

// A real mouse drag on the canvas: press at `from`, move by `by` in `steps` steps, hold still
// for `holdMs` (so the release carries no velocity), release.
export async function drag(page, from, by, { steps = 10, stepMs = 16, holdMs = 250 } = {}) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + (by.x * i) / steps, from.y + (by.y * i) / steps);
    await sleep(stepMs);
  }
  if (holdMs) await sleep(holdMs);
  await page.mouse.up();
}
