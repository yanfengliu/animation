// Gate: the page as a page.
// Bound: headless Chromium with SwiftShader WebGL2; the page opened from disk with the listed
// query strings and viewports; the Google Fonts stylesheet answered with empty CSS. Proves: those
// loads (including the default tour, a "Find the angle" glide and both layers) log no console
// errors and no page errors; the only request leaving the page is the Google Fonts stylesheet,
// and if that stylesheet never answers the page still draws, within 2 s of the time the same load
// takes with it answered (timed in the same test, through the harness's ready wait); nothing
// overflows horizontally at 390 px; Tab reaches the canvas and then "Find the angle", each with a focus
// style that changes pixels on screen, and keys work on the focused canvas; Chromium's
// accessibility tree exposes the canvas as a focusable application with a role description and
// a name that says what it shows and how to steer; without WebGL2 a message shows and the page
// never reports ready. Each page's context is closed as soon as its check is done.
// Does not prove other browsers, real GPUs, fonts loading over a real network, or how a screen
// reader behaves with the canvas (none is available here; the role is what tells NVDA and JAWS
// to pass the arrow keys through).
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, openPage, sleep, PAGE_URL, FONT_CSS } from './lib/harness.mjs';
import { decodePng } from './lib/image.mjs';

const PHONE = { width: 390, height: 844, dpr: 2, isMobile: true, hasTouch: true };
let browser;
before(async () => { browser = await startBrowser(); });
after(async () => { await browser?.close(); });

// Opens the page in its own context, runs fn, and closes the context as soon as fn is done, so
// no page keeps rendering beside the next one or beside the other test file.
async function withPage(query, opts, fn) {
  const o = await openPage(browser, { query, ...opts });
  try { return await fn(o); } finally { await o.context.close(); }
}

test('loads log no console errors and no page errors', async (t) => {
  const loads = [['', {}], ['az=38&el=14&t=0&tour=0', {}], ['layer=text&tour=0', {}], ['layer=ambient&tour=0', {}], ['', PHONE]];
  const errors = [], warnings = [];
  for (const [query, opts] of loads) {
    await withPage(query, opts, async ({ page, log }) => {
      if (!query) {                                 // let the tour run, then glide to E
        await sleep(1500);
        await page.click('#find');
        await sleep(1500);
      }
      errors.push(...log.errors.map((e) => `?${query} ${opts.width ?? 1280}px: ${e}`));
      warnings.push(...log.warnings);
    });
  }
  if (warnings.length) t.diagnostic(`console warnings: ${warnings.join(' | ')}`);
  assert.deepEqual(errors, [], 'the page logged errors');
});

test('the only request leaving the page is the Google Fonts stylesheet', async (t) => {
  const seen = [];
  for (const opts of [{}, PHONE]) {
    await withPage('', opts, async ({ log }) => {
      await sleep(500);
      seen.push(...log.requests);
    });
  }
  const page = PAGE_URL.split('?')[0];
  assert.ok(seen.some((u) => u.split('?')[0] === page), `the request log never saw the page itself (${page}), so it recorded nothing`);
  const other = seen.filter((u) => u.split('?')[0] !== page && !FONT_CSS.test(u));
  assert.deepEqual(other, [], 'the page made requests other than itself and the Google Fonts stylesheet');
});

test('nothing overflows horizontally at 390 px', async (t) => {
  const r = await withPage('tour=0', PHONE, ({ page }) => page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const wide = [...document.querySelectorAll('body *')].filter((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && b.height > 0 && (b.right > vw + 0.5 || b.left < -0.5);
    }).map((el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} [${Math.round(el.getBoundingClientRect().left)}, ${Math.round(el.getBoundingClientRect().right)}]`);
    return { vw, inner: innerWidth, scroll: document.documentElement.scrollWidth, body: document.body.scrollWidth, wide };
  }));
  t.diagnostic(JSON.stringify(r));
  assert.equal(r.vw, 390, `the layout viewport is ${r.vw} px wide, not 390`);
  assert.ok(r.scroll <= r.vw && r.body <= r.vw, `the document scrolls sideways: scrollWidth ${r.scroll} px (body ${r.body} px) in a ${r.vw} px viewport`);
  assert.deepEqual(r.wide, [], 'elements reach past the viewport edges');
});

test('Tab reaches the canvas, then "Find the angle", each with a visible focus style; keys work on the focused canvas', async (t) => {
  // The scene is frozen (t=0, no tour), so any pixel that changes when focus moves is the focus style.
  await withPage('az=0&el=0&t=0&tour=0', {}, async ({ page }) => {
    const W = 1280;
    const shot = async () => decodePng(await page.screenshot({ animations: 'disabled' })).rgb;
    // Pixels that changed by more than 60 (summed over RGB), optionally only inside rect r.
    const changed = (a, b, r = { x0: 0, y0: 0, x1: W - 1, y1: a.length / 3 / W - 1 }) => {
      let n = 0;
      for (let y = Math.max(0, r.y0); y <= r.y1; y++) for (let x = Math.max(0, r.x0); x <= Math.min(W - 1, r.x1); x++) {
        const i = (y * W + x) * 3;
        if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60) n++;
      }
      return n;
    };
    const focus = () => page.evaluate(() => {
      const el = document.activeElement, s = getComputedStyle(el), b = el.getBoundingClientRect();
      return { id: el.id, focusVisible: el.matches(':focus-visible'), outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} offset ${s.outlineOffset}`, rect: [b.left, b.top, b.right, b.bottom].map(Math.round) };
    });
    // The scene is frozen (t=0, no tour) and no key moves the camera until both shots are taken.
    const none = await shot();
    await page.keyboard.press('Tab');
    const c = await focus();
    const onCanvasShot = await shot();
    const onCanvas = changed(none, onCanvasShot);
    t.diagnostic(`canvas focus: ${JSON.stringify(c)}, ${onCanvas} px changed`);
    assert.equal(c.id, 'scene', `the first Tab focused "${c.id || 'an element with no id'}", not the canvas #scene`);
    assert.ok(c.focusVisible, '#scene is focused but does not match :focus-visible');
    assert.ok(onCanvas >= 500, `focusing the canvas changed only ${onCanvas} px on screen; a visible focus style needs at least 500`);
    await page.keyboard.press('Tab');
    const f = await focus();
    const [l, top, r, b] = f.rect;
    const onFind = changed(onCanvasShot, await shot(), { x0: l - 6, y0: top - 6, x1: r + 6, y1: b + 6 });   // the button and a 6 px ring
    t.diagnostic(`#find focus: ${JSON.stringify(f)}, ${onFind} px changed around it`);
    assert.equal(f.id, 'find', `the second Tab focused "${f.id || 'an element with no id'}", not #find`);
    assert.ok(f.focusVisible, '#find is focused but does not match :focus-visible');
    assert.ok(onFind >= 200, `focusing #find changed only ${onFind} px around it; a visible focus outline needs at least 200`);
    await page.keyboard.press('Shift+Tab');
    assert.equal((await focus()).id, 'scene', 'Shift+Tab from #find did not return focus to the canvas');
    const s0 = await page.evaluate(() => window.__cloud.view());
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('+');
    const s1 = await page.evaluate(() => window.__cloud.view());
    assert.ok(Math.abs(s1.az - s0.az - 2) < 0.001, `ArrowRight on the focused canvas moved az from ${s0.az.toFixed(3)} to ${s1.az.toFixed(3)}, not by 2°`);
    assert.ok(s1.fov < s0.fov - 1, `+ on the focused canvas left fov at ${s1.fov.toFixed(2)} (was ${s0.fov.toFixed(2)})`);
  });
});

test('the canvas is exposed as a focusable application with a label and a role description', async (t) => {
  // Read from Chromium's own accessibility tree (CDP), which is what platform screen-reader APIs
  // are built from; role "application" is what makes NVDA and JAWS pass the arrow keys through.
  const node = await withPage('tour=0', {}, async ({ context, page }) => {
    const cdp = await context.newCDPSession(page);
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#scene' });
    assert.ok(nodeId, 'there is no #scene element to look up in the accessibility tree');
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
    return nodes[0];
  });
  const prop = (k) => node?.properties?.find((p) => p.name === k)?.value?.value;
  const ax = { role: node?.role?.value, name: node?.name?.value, roledescription: prop('roledescription'), focusable: prop('focusable'), ignored: node?.ignored };
  t.diagnostic(JSON.stringify(ax));
  assert.equal(ax.ignored, false, 'the canvas is ignored by the accessibility tree');
  assert.equal(ax.role, 'application', `the canvas has the accessibility role "${ax.role}", not "application", so a screen reader in browse mode keeps the arrow keys`);
  assert.equal(ax.focusable, true, 'the canvas is not focusable in the accessibility tree');
  assert.ok(typeof ax.roledescription === 'string' && ax.roledescription.trim().length > 0, `the canvas has no role description (got ${JSON.stringify(ax.roledescription)})`);
  assert.ok(/hello world/i.test(ax.name ?? '') && /arrow keys/i.test(ax.name ?? ''), `the canvas name must say what it shows ("hello world") and how to steer ("arrow keys"); it is ${JSON.stringify(ax.name)}`);
});

test('the page draws even when the Google Fonts stylesheet never answers', async (t) => {
  // Baseline: the same load with the stylesheet answered at once, opened through openPage. A page
  // that cannot become ready at all fails there with a plain Error, which tests/mutate.mjs counts
  // as an ERROR, not as a failed check of the font path. Its time (context, navigation, shader
  // compile, first frames) on the same CPU load sets the bound for the hung load, so a page that
  // holds its first frame for the font host, even for a few seconds, fails.
  const MARGIN_MS = 2000, WAIT_MS = 15000;
  const b0 = Date.now();
  const baseline = await withPage('tour=0', { waitUntil: 'commit' }, async () => Date.now() - b0);
  const bound = baseline + MARGIN_MS;
  const t0 = Date.now();
  const { ms, fontRequested } = await withPage('tour=0', { fonts: 'hang', ready: false, waitUntil: 'commit' }, async ({ page, log }) => {
    let ms = null;
    try {
      await page.waitForFunction(() => window.__cloud && window.__cloud.ready, null, { timeout: WAIT_MS });
      ms = Date.now() - t0;
    } catch (err) {
      if (err?.name !== 'TimeoutError') throw err;   // only "never drew" is reported below as a check
    }
    return { ms, fontRequested: log.requests.some((u) => FONT_CSS.test(u)) };
  });
  t.diagnostic(`drew in ${baseline} ms with the stylesheet answered and in ${ms ?? `more than ${WAIT_MS}`} ms with it hung (bound ${bound} ms)`);
  assert.ok(fontRequested, 'the page never requested the Google Fonts stylesheet, so the hang was not exercised');
  assert.ok(ms !== null, `window.__cloud.ready was still false ${WAIT_MS} ms after navigation while the Google Fonts stylesheet hung; with it answered the page drew in ${baseline} ms`);
  assert.ok(ms <= bound, `the page took ${ms} ms to draw while the Google Fonts stylesheet hung but ${baseline} ms with it answered; it must draw within that plus ${MARGIN_MS} ms (${bound} ms), so a slow font host does not hold it up`);
});

test('without WebGL2 a message shows and the page never reports ready', async (t) => {
  const initScript = () => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return type === 'webgl2' ? null : get.call(this, type, ...rest); };
  };
  const { s, log } = await withPage('', { initScript, ready: false }, async ({ page, log }) => {
    await sleep(1000);
    const s = await page.evaluate(() => {
      const shown = (el) => !!el && !el.hidden && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
      const msg = document.getElementById('nogl');
      return { message: shown(msg) ? msg.textContent.trim() : null, canvas: shown(document.getElementById('scene')), ready: window.__cloud?.ready, frame: window.__cloud?.frame };
    });
    return { s, log };
  });
  t.diagnostic(JSON.stringify(s));
  assert.ok(s.message && /WebGL/.test(s.message), `no WebGL message is shown (got ${JSON.stringify(s.message)})`);
  assert.equal(s.canvas, false, 'the canvas is still shown without WebGL2');
  assert.equal(s.ready, false, `window.__cloud.ready is ${s.ready} without WebGL2`);
  assert.equal(s.frame, 0, `the page counted ${s.frame} frames without WebGL2`);
  assert.deepEqual(log.errors, [], 'the fallback path logged errors');
});
