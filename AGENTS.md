# AGENTS.md — animation

## What this is

An anamorphic particle animation. `index.html` is one self-contained WebGL2 page.

A cloud of glowing particles drifts in the air. From one secret viewpoint some of the particles line up to read "hello" above "world"; from everywhere else it looks like a plain cloud.

The viewer changes the angle by dragging, and an idle camera tour passes through the viewpoint.

Non-goals: build steps, frameworks, runtime dependencies, server code.

Stack: plain HTML, CSS and JavaScript on WebGL2. Node 24 (`.nvmrc`, added with the tooling) is for dev tooling only. Playwright (a dev dependency) drives headless Chromium for screenshots and gates.

The page and its tooling are being built now under `docs/work/0_hello-world-cloud/`.

<!-- FLEET-CANON:BEGIN sha=01ba4719c80b generated from ../fleet/FLEET.md by `npm run sync-canon` — do not edit inside this block; this repo's own rules go in docs/policies/local-rules.md -->
<!-- FLEET-CANON:END -->

## Gates

None exist yet. The Playwright suite (`npm test`) lands with work unit 0, and this section names the real commands when it does.

## Invariants & boundaries

- The page stays one self-contained `index.html` that opens straight from disk: no build step, no external scripts, no runtime dependencies. The only external request is the optional Google Fonts stylesheet.
- Text particles move only along their own sight-line from the secret eye, so their projection from it never changes. Ambient drift stays small, well under the relocation width (σ in the plan), so the total density, and with it the disguise, holds.
- Zoom changes the field of view only. The eye stays on the orbit sphere with world-up roll, because moving it breaks the illusion.
- The test contract changes only together with the gates. Query parameters: `az`, `el`, `fov` (degrees), `t` (freezes the particle clock), `tour=0`, `layer=text|ambient`, `seed`. Read-only `window.__cloud`: `ready`, `frame`, `magic`, `view()`, `alignment()`, `mode()`, `counts`. DOM ids: `#scene`, `#find`, `#readout`, `#hint`.
- The page doubles as a claude.ai artifact: one deliberate dark theme with colour tokens on `:root`, no `#key=value` hash state, and it works at 390 px wide.

## Conventions

- Screenshots and other run output go under `tmp/` (ignored) and are deleted once no task needs them.
- To publish the page as an artifact, strip the document wrapper (the doctype, the `html`, `head` and `body` tags, and the charset and viewport metas), because the artifact host supplies them.
