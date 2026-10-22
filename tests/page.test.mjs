// Gate: the page as a page.
// Bound: headless Chromium with SwiftShader WebGL2 on Windows, whose local fonts the 390 px check
// reads (Courier New for the stand-ins below, and the browser's monospace fallback); the page opened
// from disk with the listed query strings and viewports; the Google Fonts stylesheet answered with
// empty CSS, or with the stand-in faces below. Proves: those
// loads (including the default tour, a "Find the angle" glide, both layers and one message's text
// layer at its eye) log no console errors and no page errors; the only request leaving the page is the Google Fonts stylesheet,
// and if that stylesheet never answers the page still draws, within 2 s of the time the same load
// takes with it answered (the two loads started together in one browser, each timed to its first
// frame); at 390 px nothing overflows horizontally, at the start view and with the widest readout
// the page shows ("AZ 180.1° · EL -70.0°", 21 characters): with the fallback font and with a 0.600 em
// stand-in for the web font, DM Mono, the readout shows whole beside the buttons, and with a 0.660 em
// font the buttons still stay inside the bar's 16 px gutters while the readout is cut short; Tab
// reaches the canvas and then "Find the
// angle", each with a focus style that changes pixels on screen, and keys work on the focused
// canvas; Chromium's accessibility tree exposes the canvas as a focusable application with a role
// description and a name that says what it shows and how to steer; the page draws at most PARTICLES
// particles, all that it reports, and at 1920×1080 and DPR 2 its sprites cover at most MAX_OVERDRAW×
// the screen's pixels at the start view and at each of the six eyes (default zoom, t 0), read from
// the point sizes the GPU itself computes (transform feedback) at each drawArrays point draw, with
// the state that draw has (F77); without WebGL2 a message shows
// and the page never reports ready. Each page's context is closed as soon as its check is done.
// The timing check never runs beside the illusion file's renders or the sequence file's pages:
// npm test and tests/mutate.mjs run each of those first, in a phase of its own (tests/lib/phases.mjs).
// Does not prove other browsers, real GPUs or the frame rate they reach (the particle and fill
// budget stands in for it: a real GPU may cap point sizes lower, and shading costs differ), the fill
// at other zooms (about 13.6× the screen at the closest zoom at E) or views, or of points drawn
// other than with drawArrays (drawElements or instanced draws are not measured), DM Mono's own widths
// (its file is not available offline; the stand-in assumes 0.600 em), fonts loading over a real
// network, or how a screen
// reader behaves with the canvas (none is available here; the role is what tells NVDA and JAWS
// to pass the arrow keys through).
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBrowser, openPage, waitFrames, sleep, PAGE_URL, FONT_CSS } from './lib/harness.mjs';
import { decodePng } from './lib/image.mjs';
import { NAMES } from './lib/messages.mjs';

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
  const loads = [['', {}], ['az=38&el=14&t=0&tour=0', {}], ['layer=text&tour=0', {}], ['layer=ambient&tour=0', {}], ['msg=face&layer=text&textof=face&tour=0', {}], ['', PHONE]];
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

// The page's web font, DM Mono, comes from the Google Fonts stylesheet, which no gate fetches, and its
// own file is not available offline. So the stylesheet is answered with stand-ins: a face named
// "DM Mono" for weights 400 and 500 from the local Courier New, whose characters are 0.600 em wide,
// as most monospace fonts' are; and the same 10% wider (0.660 em), wider than the bar has room for.
const monoFace = (extra = '') => ['400', '500'].map((w) => `@font-face { font-family: "DM Mono"; font-weight: ${w}; src: local("Courier New"); ${extra} }`).join('\n');
const FONTS = [
  { font: 'the fallback font', fonts: 'empty', em: null, whole: true },
  { font: 'a 0.600 em stand-in for DM Mono', fonts: { css: monoFace() }, em: 0.6, whole: true },
  { font: 'a 0.660 em font', fonts: { css: monoFace('size-adjust: 110%;') }, em: 0.66, whole: false },
];
// The page's monospace font in em, from the width of ten zeros at 100 px.
const MONO_EM = () => {
  const probe = Object.assign(document.createElement('span'), { textContent: '0000000000' });
  probe.style.cssText = 'position: absolute; visibility: hidden; white-space: pre; letter-spacing: 0; font: 400 100px/1 var(--font-mono)';
  document.body.append(probe);
  const em = probe.getBoundingClientRect().width / 1000;
  probe.remove();
  return em;
};
// What a 390 px layout puts where: elements past the viewport edges, the readout's text, and the left
// and right edges of the bar, the readout's box and the two buttons. The readout's text may run past
// its box: `whole` is whether it ends inside it, and `ink` is where it shows to, which is the box's
// edge only when the box clips it.
const LAYOUT = () => {
  const vw = document.documentElement.clientWidth;
  const wide = [...document.querySelectorAll('body *')].filter((el) => {
    const b = el.getBoundingClientRect();
    return b.width > 0 && b.height > 0 && (b.right > vw + 0.5 || b.left < -0.5);
  }).map((el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} [${Math.round(el.getBoundingClientRect().left)}, ${Math.round(el.getBoundingClientRect().right)}]`);
  const edges = (el) => { const b = el.getBoundingClientRect(); return [+b.left.toFixed(2), +b.right.toFixed(2)]; };
  const ro = document.getElementById('readout'), box = edges(ro), range = document.createRange();
  range.selectNodeContents(ro);
  const textEnd = +range.getBoundingClientRect().right.toFixed(2), clips = ['hidden', 'clip'].includes(getComputedStyle(ro).overflowX);
  return {
    vw, scroll: document.documentElement.scrollWidth, body: document.body.scrollWidth, wide, text: ro.textContent, textEnd, whole: textEnd <= box[1] + 0.5, ink: clips ? Math.min(textEnd, box[1]) : textEnd,
    bar: edges(document.querySelector('.bar')), readout: box, find: edges(document.getElementById('find')), play: edges(document.getElementById('play')),
  };
};

test('nothing overflows horizontally at 390 px, and the widest readout fits beside the buttons', async (t) => {
  // The start view's readout, and the widest the page shows: 21 characters, as at az −179.9, el −70
  // (az reads 0 to 359.9, el −70 to 70), with the fallback font and the two stand-ins.
  const cases = [{ view: 'the start view', query: 'tour=0', text: 'AZ 8.0° · EL -16.0°', ...FONTS[0] }, ...FONTS.map((f) => ({ view: 'the widest readout', query: 'az=-179.9&el=-70&tour=0', text: 'AZ 180.1° · EL -70.0°', ...f }))];
  const broken = [];
  for (const c of cases) {
    const r = await withPage(c.query, { ...PHONE, fonts: c.fonts }, async ({ page }) => {
      // A stand-in loads from the stylesheet the page adds at load; wait until the font measures as it should.
      let em = await page.evaluate(MONO_EM);
      for (const end = Date.now() + 5000; c.em !== null && Math.abs(em - c.em) >= 0.002 && Date.now() < end;) {
        await sleep(50);
        em = await page.evaluate(MONO_EM);
      }
      if (c.em !== null && Math.abs(em - c.em) >= 0.002) throw new Error(`the font stand-in did not load: the page's monospace font measures ${em.toFixed(4)} em, not ${c.em}; it needs the local font Courier New`);
      return { ...(await page.evaluate(LAYOUT)), em: +em.toFixed(4) };
    });
    t.diagnostic(`${c.view} with ${c.font}: ${JSON.stringify(r)}`);
    const at = `${c.view} ("${r.text}") with ${c.font} (${r.em} em)`;
    if (r.vw !== 390) broken.push(`${at}: the layout viewport is ${r.vw} px wide, not 390`);
    if (!(r.scroll <= r.vw && r.body <= r.vw)) broken.push(`${at}: the document scrolls sideways: scrollWidth ${r.scroll} px (body ${r.body} px) in a ${r.vw} px viewport`);
    if (r.wide.length) broken.push(`${at}: elements reach past the viewport edges: ${r.wide.join(', ')}`);
    if (r.text !== c.text) broken.push(`${at}: the readout shows "${r.text}", not "${c.text}"`);
    if (!(r.readout[0] >= r.bar[0] - 0.5 && r.play[1] <= r.bar[1] + 0.5)) broken.push(`${at}: the bar runs from ${r.bar[0]} to ${r.bar[1]} px, inside the 16 px gutters, but the readout starts at ${r.readout[0]} and Play ends at ${r.play[1]}`);
    if (!(r.ink <= r.find[0] + 0.5)) broken.push(`${at}: the readout shows to ${r.ink} px, under "Find the angle", which starts at ${r.find[0]}`);
    if (c.whole && !r.whole) broken.push(`${at}: the readout's text runs to ${r.textEnd} px, past its box at ${r.readout[1]}, so it is cut short; it must show whole beside the buttons`);
  }
  assert.deepEqual(broken, [], 'at 390 px the page must stay inside the viewport, keep the buttons inside the bar and show the widest readout whole');
});

// The budget the plan states for the page's cost on a GPU (docs/work/1_sentence-sequence/plan.md,
// "Budget"): 48,000 particles, and sprites that cover about 3× the screen at 1920×1080 and DPR 2.
const PARTICLES = 48000;
const MAX_OVERDRAW = 3;          // sprite fragments per frame over the screen's pixels at 3840×2160 device px, default zoom: 2.72–2.95 measured at the start view and the six eyes; sprites on squares 1.25× wider cover about 1.56× that
// Reads the point sizes the GPU computes, through transform feedback. Before the page's scripts run
// it adds gl_Position and gl_PointSize as transform-feedback outputs of the programs that set
// gl_PointSize and skips every draw the page makes, so the page keeps setting its state each frame
// but costs nothing at 3840×2160. measure() marks the next frame (a frame starts with the sky's
// draw, the first that is not of points). Each drawArrays point draw of that frame made with such a
// program is measured where the page makes it, with the rasterizer off and the program, vertex array
// and uniforms the draw has then. So a draw that raises a sizing uniform and restores it after is
// measured at the size it draws; replaying the frame's draws later measured it with the restored
// value (review round 1, F77). Each sprite's square is summed, clipped to the screen.
const FILL_PROBE = () => {
  const G = WebGL2RenderingContext.prototype;
  const { shaderSource, attachShader, linkProgram, drawArrays, useProgram } = G;
  const sizedShaders = new WeakSet(), sized = new WeakSet();
  const s = window.__fill = { used: null, armed: false, frame: null, done: null };
  G.shaderSource = function (sh, src) { if (/gl_PointSize/.test(src)) sizedShaders.add(sh); return shaderSource.call(this, sh, src); };
  G.attachShader = function (p, sh) { if (sizedShaders.has(sh)) sized.add(p); return attachShader.call(this, p, sh); };
  G.linkProgram = function (p) { if (sized.has(p)) this.transformFeedbackVaryings(p, ['gl_Position', 'gl_PointSize'], this.INTERLEAVED_ATTRIBS); return linkProgram.call(this, p); };
  G.useProgram = function (p) { s.used = p; return useProgram.call(this, p); };
  // One point draw with the state the page has set for it: its program, vertex array and uniforms.
  const measureDraw = (gl, first, count) => {
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    const buf = gl.createBuffer(), tf = gl.createTransformFeedback();
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buf);
    gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, count * 20, gl.STREAM_READ);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buf);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    drawArrays.call(gl, gl.POINTS, first, count);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    const out = new Float32Array(count * 5);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buf);
    gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, out);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
    gl.deleteBuffer(buf);
    gl.deleteTransformFeedback(tf);
    let fill = 0, sum = 0, largest = 0;
    for (let i = 0; i < count; i++) {
      const [x, y, z, w, q] = out.subarray(i * 5, i * 5 + 5);
      sum += q * q;
      largest = Math.max(largest, q);
      if (!(w > 0) || z < -w || z > w) continue;   // outside the near or far plane
      const cx = (x / w + 1) / 2 * W, cy = (y / w + 1) / 2 * H;
      fill += Math.max(0, Math.min(W, cx + q / 2) - Math.max(0, cx - q / 2)) * Math.max(0, Math.min(H, cy + q / 2) - Math.max(0, cy - q / 2));
    }
    return { count, W, H, fill, sum, largest };
  };
  G.drawArrays = function (mode, first, count) {
    if (mode !== this.POINTS) {
      if (s.frame) { s.done = s.frame; s.frame = null; }
      if (s.armed) { s.armed = false; s.frame = []; }
      return;
    }
    if (s.frame && sized.has(s.used)) s.frame.push(measureDraw(this, first, count));
  };
  s.measure = async () => {
    s.done = null; s.frame = null; s.armed = true;
    for (const end = performance.now() + 10000; !s.done;) {
      if (performance.now() > end) throw new Error('no frame was measured within 10 s of asking: the probe needs the page to draw a frame that starts with a draw not of points (the sky) and to start the next one the same way');
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    const draws = s.done;
    if (!draws.length) throw new Error('the measured frame had no drawArrays point draw with a program that sets gl_PointSize, so there is no sprite fill to read');
    const { W, H } = draws[0];
    if (draws.some((d) => d.W !== W || d.H !== H)) throw new Error(`the measured frame's point draws went to drawing buffers of different sizes (${draws.map((d) => `${d.W}×${d.H}`).join(', ')}), so their fills cannot be added on one screen`);
    const largest = Math.max(...draws.map((d) => d.largest));
    if (!(largest > 0)) throw new Error(`transform feedback returned no point size above 0 px for the ${draws.length} measured draw(s), so the capture did not run`);
    const add = (k) => draws.reduce((a, d) => a + d[k], 0);
    return { n: add('count'), draws: draws.length, W, H, fill: add('fill'), sum: add('sum'), largest };
  };
};

test('the particle count and the sprite fill stay within the budget the plan states', async (t) => {
  const views = [['the start view', 't=0&tour=0'], ...NAMES.map((name) => [`the eye of "${name}"`, `msg=${name}&t=0&tour=0`])];
  const broken = [];
  for (const [what, query] of views) {
    // A probe that cannot measure throws a plain Error, never a failed check; it names the view here.
    const r = await withPage(query, { width: 1920, height: 1080, dpr: 2, initScript: FILL_PROBE }, ({ page }) => page.evaluate(async () => ({ ...(await window.__fill.measure()), reported: window.__cloud.counts.text + window.__cloud.counts.ambient })))
      .catch((err) => { throw new Error(`the budget probe could not measure ${what} (?${query}): ${err.message}`, { cause: err }); });
    const over = r.fill / (r.W * r.H);
    t.diagnostic(`${what}: ${r.n} particles drawn a frame in ${r.draws} draw(s), ${r.reported} reported; on ${r.W}×${r.H} px the sprites cover ${(r.fill / 1e6).toFixed(2)} M px, ${over.toFixed(3)}× the screen (${(r.sum / 1e6).toFixed(2)} M unclipped; largest sprite ${r.largest.toFixed(1)} px)`);
    if (r.W !== 3840 || r.H !== 2160) throw new Error(`at ${what} (?${query}) the page drew at ${r.W}×${r.H} device px, not the 3840×2160 that 1920×1080 at DPR 2 gives, so the fill is not measured where the budget is stated`);
    if (r.n !== r.reported) broken.push(`${what}: the page draws ${r.n} particles a frame (in ${r.draws} draw(s)) but reports ${r.reported} in window.__cloud.counts`);
    if (!(r.n <= PARTICLES)) broken.push(`${what}: the page draws ${r.n} particles a frame, more than the ${PARTICLES} of its budget`);
    if (!(over <= MAX_OVERDRAW)) broken.push(`${what}: the sprites cover ${over.toFixed(3)}× the screen's pixels at 1920×1080 and DPR 2 (${(r.fill / 1e6).toFixed(2)} M fragments a frame), more than the ${MAX_OVERDRAW}× of its budget`);
  }
  assert.deepEqual(broken, [], 'the page must stay within the particle and sprite-fill budget the plan states');
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
  // Two loads of the page start together in this browser, so both see the same CPU load: a
  // baseline with the stylesheet answered at once, and one with it never answered. Each is timed
  // from its own start (context, navigation, shader compile) to its first drawn frame. The
  // baseline waits through the harness, so a page that cannot become ready at all fails there with
  // a plain Error, which tests/mutate.mjs counts as an ERROR, not as a failed check of the font
  // path. A page that holds its first frame for the font host, even for a few seconds, fails.
  const MARGIN_MS = 2000, WAIT_MS = 15000;
  const timed = (fonts, untilDrawn) => {
    const t0 = Date.now();
    return withPage('tour=0', { fonts, ready: false, waitUntil: 'commit' }, async ({ page, log }) => ({ ms: await untilDrawn(page, t0), fontRequested: log.requests.some((u) => FONT_CSS.test(u)) }));
  };
  const [answered, hung] = await Promise.allSettled([
    timed('empty', async (page, t0) => { await waitFrames(page, 0); return Date.now() - t0; }),
    timed('hang', async (page, t0) => {
      try {
        await page.waitForFunction(() => window.__cloud && window.__cloud.ready, null, { timeout: WAIT_MS });
        return Date.now() - t0;
      } catch (err) {
        if (err?.name !== 'TimeoutError') throw err;   // only "never drew" is reported below as a check
        return null;
      }
    }),
  ]);
  if (answered.status === 'rejected') throw answered.reason;
  if (hung.status === 'rejected') throw hung.reason;
  const baseline = answered.value.ms, { ms, fontRequested } = hung.value, bound = baseline + MARGIN_MS;
  t.diagnostic(`drew in ${baseline} ms with the stylesheet answered and in ${ms ?? `more than ${WAIT_MS}`} ms with it hung, both loads started together (bound ${bound} ms)`);
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
