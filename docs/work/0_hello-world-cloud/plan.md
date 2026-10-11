# Anamorphic hello world particle cloud

Status: active
Owner: Claude coordinator session
Created: 2026-10-11
Updated: 2026-10-11

## Problem and outcome

The owner asked for an animated particle cloud floating in the air, where changing the viewing angle turns some of the particles into "hello world" (2026-10-10). They also made this repo part of the fleet and asked for AGENTS.md, CLAUDE.md and .gitignore.

Outcome: one self-contained WebGL page, `index.html`, showing a slowly drifting cloud of glowing particles. From one secret viewpoint a subset of the particles lines up to read "hello" above "world". From every other viewpoint it looks like an ordinary cloud. The viewer changes the angle by dragging, or watches an idle camera tour that passes through the viewpoint.

## Scope

Included: the page; its Playwright gates; a screenshot tool for visual checks; repo scaffolding (AGENTS.md, CLAUDE.md, .gitignore, devlog); onboarding `animation` into the fleet census and canon; publishing the page as a private artifact.

Excluded: build steps, frameworks and runtime dependencies; other animations; classifying `met`, which the owner has not decided.

Dependencies: the gates build on the page contract below. The canon sync can fill the AGENTS.md block only once AGENTS.md is on animation `main`.

## Approach

**Hidden text by relocation.** Sample a soft, lumpy cloud. For each particle, find where its sight-line from the secret eye E crosses the text plane (through the cloud centre, facing E). Let S be the stroke mask of the two-line text and B the mask blurred by a Gaussian of width σ. With probability β·B(u)/max(B), move the particle sideways onto a stroke point drawn from that same Gaussian around u, keeping its distance from E. Text particles are relocated cloud particles, so the total density is unchanged at scales above σ, which hides the message from other angles. Seen from E, every relocated particle sits on a stroke, and stroke density comes out uniform because the conversion rate and the landing kernel share B.

**Floating without breaking it.** Text particles bob only along their own sight-line from E, so their projection from E never changes. Ambient particles drift in a smooth, small flow field whose amplitude stays well under σ, so the density compensation holds.

**Camera.** Orbit at a fixed radius around the cloud centre with world-up roll. Zoom changes the field of view only, because moving the eye off the orbit sphere would break the illusion. The field of view widens on narrow screens so the text block always fits. Releasing a drag within a few degrees of the secret angle snaps into it. "Find the angle" glides there. An idle tour passes through it, and is off under reduced motion.

**Look.** WebGL2 additive point sprites with perspective size, mild depth of field and twinkle, over a dark gradient sky. Text particles look like every other particle until the camera nears the angle; then they warm in colour, and at the angle they sharpen and brighten while ambient particles dim slightly. One deliberate dark theme, which the artifact contract allows.

**Page contract shared by the page and the gates.** Query parameters are local test hooks; without them the page behaves normally, and the published artifact never receives them.

- `az`, `el`: initial camera azimuth and elevation in degrees.
- `fov`: initial vertical field of view in degrees.
- `t`: freeze the particle clock at `t` seconds; camera motion still runs.
- `tour=0`: disable the idle tour.
- `layer=text` or `layer=ambient`: draw only that class of particle.
- `seed`: cloud seed; the default is fixed, and the same seed always builds the same cloud.

`window.__cloud` is read-only: `ready` (true once a frame has drawn), `frame` (frames drawn), `magic` (`{az, el}` in degrees), `view()` (`{az, el, fov}` in degrees, `fov` being the effective vertical field of view), `alignment()` (degrees between the current and secret eye directions), `mode()` (one of `tour`, `drag`, `inertia`, `snap`, `glide`, `idle`) and `counts` (`{text, ambient}`). DOM ids: `#scene` (canvas), `#find` (the "Find the angle" button), `#readout` (angle readout), `#hint` (instruction text).

## Acceptance criteria

- [ ] Opening `index.html` straight from disk in Chromium shows the animated cloud with no console errors; the only network requests are optional Google Fonts. Checked by a gate and by the coordinator looking.
- [ ] At the secret viewpoint "hello" above "world" is clearly legible at 1280×800 and 390×844, at particle times 0, 7.3 and 31 s, zoomed in and out. Checked by the coordinator at native resolution, and by a gate measuring stroke contrast.
- [ ] From off-angles (±8°, ±25° and ±60° in azimuth and in elevation, the back side, top-down and five random angles) no text is legible, and from 25° or more nothing hints at text. Checked by inspecting screenshots, and by a gate showing stroke pixels are no brighter than their surroundings off-angle.
- [ ] Real input works: mouse drag, touch drag, wheel and pinch zoom (field of view only), arrow keys, "Find the angle", snap near the angle, the tour resuming after idle and stopping on input, and reduced motion. Checked by gates that drive real input events.
- [ ] `npm test` runs headless, and each gate has been shown to fail with its defect reintroduced.
- [ ] The page meets the artifact contract: self-contained, colour tokens with an explicit dark theme, works at phone width with no horizontal scroll, visible keyboard focus.
- [x] The repo is in the fleet: AGENTS.md with the canon block filled by the sync, CLAUDE.md is `@AGENTS.md`, .gitignore, census lists `animation`, and the fleet gate is green apart from items the owner has not decided.
- [ ] An independent review ran on the integrated revision and its material findings are resolved; work is merged to `main` and pushed, worktrees are removed, and the page is published as a private artifact.

## Implementation steps

- [x] Coordinator: allocate this folder, write the plan and contract, add .gitignore.
- [x] W1 scaffold (Sonnet, own worktrees): AGENTS.md and CLAUDE.md (animation `110ae97`), canon block rendered with fleet's `canon.mjs` (`f0d4cb5`), census entry (fleet `7e7f1e9`). Coordinator checked: fleet drift and census tests pass with animation current. `met` was onboarded by another session (met `58d7a81`, fleet `22bca33`), so W1 left it alone. No `docs/policies/local-rules.md` yet, because there is no local-only rule.
- [ ] W2 page (Opus, own worktree): `index.html`, `package.json` and `.nvmrc`, screenshot tool, visual iteration.
- [ ] W3 gates (after W2): Playwright suite through real input, each gate proved red.
- [ ] W4 review (read-only, after integration): independent review against these criteria.
- [ ] Coordinator: integrate, look at the result at native resolution, merge, push, publish, devlog.

## Outcome

Pending.
