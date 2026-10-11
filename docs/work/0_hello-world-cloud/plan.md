# Anamorphic hello world particle cloud

Status: active
Owner: Claude coordinator session
Created: 2026-10-11
Updated: 2026-10-11

## Problem and outcome

The owner asked for an animated particle cloud floating in the air, where changing the viewing angle turns some of the particles into "hello world" (2026-10-10). They also made this repo part of the fleet and asked for AGENTS.md, CLAUDE.md and .gitignore.

Outcome: one self-contained WebGL page, `index.html`, showing a slowly drifting cloud of glowing particles. From one secret viewpoint a subset of the particles lines up to read "hello" above "world". From every other viewpoint it looks like an ordinary cloud. The viewer changes the angle by dragging, or watches an idle camera tour that passes through the viewpoint.

Goal, set 2026-10-11 when the owner asked the coordinator to work directly on `main` with subagents: the page is on `main` and pushed. It is gated by a green `npm test` that proves the illusion and the controls, with each gate shown red when its defect is reintroduced. It has passed a second independent review with its material findings fixed and been accepted by the coordinator looking at native resolution. It is published as a private artifact, and no worktrees or side branches are left.

## Scope

Included: the page; its Playwright gates; a screenshot tool for visual checks; repo scaffolding (AGENTS.md, CLAUDE.md, .gitignore, devlog); onboarding `animation` into the fleet census and canon; publishing the page as a private artifact.

Excluded: build steps, frameworks and runtime dependencies; other animations; classifying `met`, which the owner has not decided.

Dependencies: the gates build on the page contract below. The canon sync can fill the AGENTS.md block only once AGENTS.md is on animation `main`.

## Approach

**Hidden text by relocation.** Sample a soft, lumpy cloud. For each particle, find where its sight-line from the secret eye E crosses the text plane (through the cloud centre, facing E). Let S be the stroke mask of the two-line text and B the mask blurred by a Gaussian of width σ. With probability β·B(u)/max(B), move the particle sideways onto a stroke point drawn from that same Gaussian around u, keeping its distance from E. Text particles are relocated cloud particles, so the total density is unchanged at scales above σ, which hides the message from other angles. Seen from E, every relocated particle sits on a stroke, and stroke density comes out uniform because the conversion rate and the landing kernel share B.

**β settled at 0.2, not 0.85** (W2, measured). Turning the camera about the vertical axis smears the text sideways only, so the row profile of the text survives at every azimuth; tilting does the same to the column profile. At β 0.85 the rows showed as streaks at ±8° and ±25°: the high-pass row residual against a β 0 render was 1.7–2.5 times the cloud's own profile noise. At β 0.2 it is at most 0.67 everywhere, against a noise floor of about 0.55. With so few text particles (1,104 of 18,000 at the default seed), legibility at E comes mostly from the reveal effects: gain, size, halo and gold. Their positions still come from the relocation, so the letters are geometric. Superseded on 2026-10-11 by the owner's directive below: the reveal effects are gone, so β and the stroke geometry are retuned for legibility from positions alone.

**Floating without breaking it.** Text particles bob only along their own sight-line from E, so their projection from E never changes. Ambient particles drift in a smooth, small flow field whose amplitude stays well under σ, so the density compensation holds.

**Camera.** Orbit at a fixed radius around the cloud centre with world-up roll. Zoom changes the field of view only, because moving the eye off the orbit sphere would break the illusion. The field of view widens on narrow screens so the text block always fits. Releasing a drag within a few degrees of the secret angle snaps into it. "Find the angle" glides there. An idle tour passes through it, and is off under reduced motion.

**Look.** WebGL2 additive point sprites with perspective size, mild depth of field and twinkle, over a dark gradient sky. Every particle renders the same way at every camera angle. Text particles get no extra brightness, colour, size or focus near E, and ambient particles never dim. The words become obvious only because the particles line up.

This is an owner directive from 2026-10-11, quoted: "Some of the dots are lighting up more as I approach the intended angle. This is cheating. They need to be glowing consistently no matter what angle. The words should be entirely depending on the right angle to be obvious." It replaces the earlier design, in which text particles warmed from 22° in and brightened, grew and sharpened at E.

One deliberate dark theme, which the artifact contract allows.

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
- [ ] Legibility at E comes from particle positions alone: text and ambient particles have the same brightness, colour, size and focus at every angle, E included (owner directive, 2026-10-11). Checked by a gate that compares them at E and off-angle, and is killed by a mutant that restores the old reveal.
- [ ] From off-angles (±8°, ±25° and ±60° in azimuth and in elevation, the back side, top-down and five random angles) no text is legible, and from 25° or more nothing hints at text. Checked by inspecting screenshots, and by a gate showing stroke pixels are no brighter than their surroundings off-angle.
- [ ] Real input works: mouse drag, touch drag, wheel and pinch zoom (field of view only), arrow keys, "Find the angle", snap near the angle, the tour running from load and stopping for good on the first input, and reduced motion. Checked by gates that drive real input events. This criterion was changed by F6 in review round 0; it originally asked for the tour to resume after idle.
- [ ] `npm test` runs headless, and each gate has been shown to fail with its defect reintroduced.
- [ ] The page meets the artifact contract: self-contained, colour tokens with an explicit dark theme, works at phone width with no horizontal scroll, visible keyboard focus.
- [x] The repo is in the fleet: AGENTS.md with the canon block filled by the sync, CLAUDE.md is `@AGENTS.md`, .gitignore, census lists `animation`, and the fleet gate is green apart from items the owner has not decided.
- [ ] An independent review ran on the integrated revision and its material findings are resolved; work is merged to `main` and pushed, worktrees are removed, and the page is published as a private artifact.

## Implementation steps

- [x] Coordinator: allocate this folder, write the plan and contract, add .gitignore.
- [x] W1 scaffold (Sonnet, own worktrees): AGENTS.md and CLAUDE.md (animation `110ae97`), canon block rendered with fleet's `canon.mjs` (`f0d4cb5`), census entry (fleet `7e7f1e9`). Coordinator checked: fleet drift and census tests pass with animation current. `met` was onboarded by another session (met `58d7a81`, fleet `22bca33`), so W1 left it alone. No `docs/policies/local-rules.md` yet, because there is no local-only rule.
- [x] W2 page (Opus, own worktree): `index.html`, `package.json` (Playwright 1.63.0, cached Chromium build 1243), `.nvmrc`, `scripts/shoot.mjs`, visual iteration over 34 shots (branch `worktree-agent-a79120c474259d678`, `f91bd5a`).
  - Deviations, each with evidence in its handoff: β 0.2 (above); an anisotropic main cloud (σ 7.2, 5.6, 7.2) so the outer letters get enough column density; ambient particles share the swell along their own line from E; landing points evened out by six rounds of repulsion inside the mask; no snap when the gesture moved away from E; `el` clamped to ±70°.
  - Coordinator looked at native resolution:
    - At E: 1280×800 t7.3 and 390×844 t0, both legible.
    - Off-angle: az+8 and el+25, both a plain cloud.
    - Own shots: δ 2.9°, two rows of gold sparkles; δ 4.9°, nothing.
  - The cue therefore spans only about ±4°, so finding E by hand is luck.
  - Follow-up `76bc0d6`, accepted:
    - `hint` = 1 − smoothstep(12°, 22°, δ) drives warmth and gain, and is exactly 0 from 22° outward.
    - Lock (0.8°–6°) is unchanged, and the snap radius is 6°.
    - The E render is byte-identical to before, and the 25° shots are unchanged.
    - Stroke/gap ratio: about 1.2 at ±8° (the cue); 1.07–1.11 from 25° out.
    - Coordinator looked at δ 9.7°: faint gold sparks in two loose bands, not legible.
  - Merged into the integration branch as `891558f`. Review round 0 of the page started on that revision.
- [ ] W3 gates (started alongside the W2 follow-up, on top of W2's branch): Playwright suite through real input, each gate proved red, AGENTS.md Gates, defect-register entry for the owner-reported save prompt.
- [x] Review round 0 of the page (`891558f`; Claude CLI pinned to `claude-opus-5-5[1m]` at max effort, read-only): no critical or major findings. Nine minor findings were accepted and routed; W2 is repairing the page and W3 is gating the repairs. Record: [reviews/0_implementation.md](reviews/0_implementation.md).
- [x] W2 repairs `71be0a2`: all seven page findings were fixed and checked through real input. Default counts are now 1,143 text and 16,857 ambient, because the stroke mask comes from glyph geometry.
- [x] Owner directive, 2026-10-11: work directly on `main` with subagents (recorded in `docs/policies/local-rules.md`). The integration branch was fast-forwarded into `main` (`f0e380d`). The coordinator's, W1's and W2's worktrees and branches are removed. W3 finishes in its worktree, the last one, and is merged next.
- [x] W3 was cut off by an API session limit (reset 03:50 PDT) partway through its mutation proofs. It resumed at 08:26 with its files intact.
- [x] W3 gates `1d986c4`, merged as `0370e78`: 30 tests and 30 mutants, none survived. On `d34555d` the coordinator ran `npm test` (30 of 30 pass, 42 s) and `npm audit` (0 vulnerabilities), and the fleet drift test passes.
- [x] Coordinator visual acceptance on `d34555d`, 16 views shot with `scripts/shoot.mjs` and each opened at native resolution:
  - At E: t 0, 7.3 and 31; 390×844; fov 32 and 80. All read "hello" over "world".
  - Approach: az+3 shows scrambled gold rows; az+10 and el+10 show faint gold bands or streaks.
  - Off-angle: az+25, el−25, az−60, back, top and two random angles are plain clouds.
  - Hashes are in `tmp/shots` (ignored). E t7.3 is `8ec38e45…`, byte-identical to W2's shot.
- [x] Review round 1 on `d34555d`: no critical findings, one major (the mutation tool counts any failure as a kill and has no control run), nine minor, all accepted. Record: [reviews/1_integration.md](reviews/1_integration.md).
- [x] W5 `22cdf3e`: F13, F16, F17 and the shoot comment.
- [x] W6 `37cce18`: F9–F18 gates and docs. 35 tests pass in 46.5 s; mutation proof control green, 44 killed, 0 survived, 0 errored (28 min).
- [x] `main` pushed at `37cce18`; page published as a private artifact: https://claude.ai/artifact/DXryp6rehkTohF7Eumat5f
- [x] Review round 2 on `37cce18`: one major and three minor findings (F19–F22), all in gates and tooling, not the page. Record: [reviews/2_implementation.md](reviews/2_implementation.md).
- [x] The session paused at the owner's usage limit and resumed. W7 is repairing F19–F22 on `main`; its full mutation proof is deferred because the page is about to change.
- [ ] Owner directive 2026-10-11, no reveal effects:
  - W8 (page): remove every angle-dependent effect on text particles, then retune β, stroke width, particle count and sprite size until the words are obvious at E from positions alone. Measure the row residual and look at near and far angles. Republish the artifact.
  - W9 (gates): replace the reveal gate with "text and ambient particles render alike at every angle", re-derive the illusion thresholds, record the owner-reported defect in the register, and run the full mutation proof once.
- [ ] Then: a focused review round 3, `docs/devlog/summary.md`, the lessons entry (it now has to drop "let the reveal effects carry legibility"), and the Outcome section.
- [ ] Review round 1 (read-only, after integration): an independent review of the integrated revision, covering the gates and the round-0 repairs.
- [ ] Coordinator: integrate, look at the result at native resolution, merge, push, publish, devlog.

## Outcome

Pending.
