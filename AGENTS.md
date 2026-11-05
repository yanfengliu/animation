# AGENTS.md — animation

## What this is

An anamorphic particle animation. `index.html` is one self-contained WebGL2 page.

A cloud of glowing particles drifts in the air. It hides six messages, each readable from its own secret viewpoint, its eye; from everywhere else it looks like a plain cloud. In sequence order, with each eye's azimuth and elevation:

- "hello" above "world", at (38°, 14°);
- a smiling face, at (98°, 18°);
- "What", at (158°, 16°);
- "a", at (218°, 20°);
- "beautiful", at (278°, 16°);
- "world", at (338°, 18°).

The words lean right 14°; the face stands upright.

The viewer changes the angle by dragging. At load a camera tour glides to each eye in sequence order, holds there 3 s and stops at "world". Play replays the sequence and "Find the angle" glides to the next message. `#capture` hides the controls, the cursor and the focus outline and loops the sequence for screen recording. Of the inputs, only Escape ends it; changing the anchor in the address ends it too. Escape takes the anchor out of the address, so adding it back starts capture mode again. README.md says how to open and record it.

Non-goals: build steps, frameworks, runtime dependencies, server code.

Stack: plain HTML, CSS and JavaScript on WebGL2. Node 24 (`.nvmrc`) is for dev tooling only. Playwright (a dev dependency) drives headless Chromium for screenshots and gates.

The design and acceptance records are `docs/work/0_hello-world-cloud/plan.md` (hello world) and `docs/work/1_sentence-sequence/plan.md` (the six messages, the sequence and capture mode).

This repo's own rules: [docs/policies/local-rules.md](docs/policies/local-rules.md).

<!-- FLEET-CANON:BEGIN sha=b0a069afa8a5 generated from ../fleet/FLEET.md by `npm run sync-canon` — do not edit inside this block; this repo's own rules go in docs/policies/local-rules.md -->
## Fleet constitution

Shared rules for every repo under `github/`, kept in `../fleet/FLEET.md`; `../fleet/` is fleet's checkout beside this repo's primary checkout. Where a rule gives its reason, use the reason to judge cases the rule does not name; each `[Rn]`'s history is in `../fleet/docs/canon-rationale.md`. This repo's `docs/policies/local-rules.md` may add rules but cannot change these permissions or limits. [R13]

The designated coordinator reads `../fleet/docs/skills/coordinator.md` before planning and after each compaction, and any agent reads that file's "Delegate" section before delegating. Before these kinds of work, read the matching section of `../fleet/docs/work-rules.md`: standing loops and unattended runs; editing skills, agent instructions or rules; handing off or stopping mid-task.

### Permissions

- Commit, merge to main and push without asking. Force-pushing and rewriting history (they destroy history), and deploying and publishing (they reach other people), need the owner's OK. [R14]
- Ask before a major architecture or product change, a new major dependency, a change to a persistent format or a security boundary, or any other consequential action outside this machine, such as posting or sending something. [R8]
- Change fleet rules (FLEET.md, fleet skills and runbooks, agent memory) or add a rule to a repo's `docs/policies/local-rules.md` only when the owner asks, because the owner sets policy. You may add a proposal with its evidence to `../fleet/canon-candidates.md`, but not edit its entries. [R8]

### Sharing the machine

- Other Claude and Codex sessions may be working in this checkout, and you cannot see them. Do anything beyond a quick read in your own worktree, because two sessions in one tree spoil each other's gates and commits. Never revert, overwrite or delete changes you did not make. When resuming, check which worktrees, branches and files already exist. [R7]
- Done means merged to main and pushed: the owner archives sessions, and work left on a branch is lost. Merge on your branch, get the gates passing there, then move main, because other worktrees build on local main. Judge the merged result itself, not a worker's summary. Then remove your worktree and branch, and report where any unmerged work is. [R14]

### Doing the work

- The repo's gates must pass before any commit that touches code. Docs-only changes need content checks and any gate the repo names for docs, not runtime tests or CI waits. [R14]
- Check the thing that should have changed (the file, the page, the number), not just the exit code or a tool's report: both can pass over a defect. Retest a blocker you inherit before repeating it. Never weaken a test or hide a failure to get green. [R9]
- Look at visual and interactive work rendered at full resolution, through the real controls, from fixed and random views, because passing tests say nothing about pixels. Run it headless unless a visible window is needed. [R16]
- Slowness on the critical path, such as a gate rendering on the CPU of a machine with a GPU, is a defect to fix. [R22]
- After pushing code, follow CI to the end; read a failed job's steps before blaming the code, since a billing limit fails jobs before any step runs. [R15]
- If a fix fails twice for one reason, rethink it. After five real repair attempts at one problem, whatever the approach and counting earlier sessions, stop and report, unless the owner set another limit; for a problem that keeps winning, run the search in `../fleet/docs/skills/hard-problem.md`. Stop when the task's criteria are met; do not invent follow-up work. [R11]
- For substantial or high-risk changes, use independent review when available. High-risk includes persistence and migrations, security and auth, concurrency, money, supply chain, and code changes in another repo. Review the exact revision against the task's criteria, and say so when review was unavailable. Fix the findings that matter and have those fixes checked; note minor ones instead of starting another round. `../fleet/docs/skills/multi-cli-review.md` provides the review mechanics. [R10]
- A defect the owner reports gets a test for its whole class and an entry in `docs/learning/defect-register.md`, because a fix without a check tends to come back. [R17]
- Sessions run long: take new requests in the same session, and never hand off to a new session to shed context. Split work expected to need more than about 200k tokens of context into milestones, each merged to main. [R6]

### Records, sized to the work

- Read `docs/learning/lessons.md` at session start; it lists this repo's known traps, and its header says how to add one. [R18]
- Work that spans sessions, has several agents writing, or gets an independent review keeps its plan and review records in `docs/work/` (`../fleet/docs/work-docs.md`) and adds a dated line to `docs/devlog/summary.md` (`../fleet/docs/devlog-template.md`) when it lands. Other work needs neither. [R24]
- Raw output (logs, captures, screenshots) stays in ignored folders. Never commit a binary over 512 KiB or any file over 1 MiB; LFS needs the owner's OK. [R23]

### Style and environment

- Plain words; one line per paragraph, no hard wrapping. A report says what changed, how it was checked (including any check skipped or failed) and what is not done. [R25]
- Node 24 is the baseline. Products pin the model IDs they call in their own repo, and nowhere else. Reviewer model pins live only in `../fleet/docs/skills/multi-cli-review.md`. Runtime model calls are allowed and paid for; make per-item calls one-shot, not agent sessions. [R28, R29]
<!-- FLEET-CANON:END -->

## Gates

Node 24 (`.nvmrc`).

- `npm ci` installs the one dev dependency, Playwright 1.63.0 (pinned).
- `npx playwright install chromium` then puts that version's Chromium (153.0.8010.12) in the local Playwright cache.
- `npm test` runs the headless suite through `tests/run.mjs`: 48 tests in about 3.9 minutes (231.7, 229.8 and 231.4 s over three runs on 2026-10-22 after R3).
- `npm audit --audit-level=high` runs after any dependency change.
- `npm run shoot -- --preset=<name>` is the visual instrument; the header of `scripts/shoot.mjs` lists its options. A visual change still needs someone to look at the shots at native resolution; the gates do not replace that.
- `node tests/mutate.mjs [name ...]` re-proves the gates. Run it after changing a gate or the page. It holds 132 mutants: 109 page, 23 tree. So run only the mutants a change touches by name, and keep it the only browser workload while it runs.

When each command last ran, how `npm test` schedules its files and how long each takes, and how to read a mutation run are in [docs/gates.md](docs/gates.md#running-the-commands).

What the suite proves, with each gate's measured margins and every bound, is in [docs/gates.md](docs/gates.md). Read it before changing the page or a gate and before judging a mutation run, and update it in the same commit as the change. It opens with a section map: read the map, then only the sections the work touches. Each test file's header states its exact bound. In short:

- `tests/illusion.test.mjs`: each message forms with enough contrast at its own eye at 1280×800 and 390×844, and shows at none of the other views measured (the other eyes, the midpoints, the antipodes and far views); every particle renders alike at each view measured, and the shipped render matches its test-only layers within a 0.1% residual; the lean, streak and stillness bounds; camera modes and the dwells measured at E do not change the picture.
- `tests/controls.test.mjs`: mouse, wheel, keyboard and touch input.
- `tests/motion.test.mjs`: the tour, coasting and reduced motion, also when it is switched on mid-move.
- `tests/page.test.mjs`: no errors, the one font request, a load whose font never answers, the 390 px fit with the widest readout, focus and accessibility, the no-WebGL2 message, and the GPU budget.
- `tests/sequence.test.mjs`: the sequence, Play, "Find the angle" and capture mode through real input, with pictures at the holds and landings that `docs/gates.md` lists, which must match the same eye set by URL within a 0.1% residual.
- `tests/hygiene.test.mjs`: a text scan that keeps the repo's tooling headless (the defect in `docs/learning/defect-register.md`).

## Invariants & boundaries

The rest of each rule below, with its numbers and reasons, and the test contract's query parameters, `window.__cloud` and DOM ids, are in [docs/invariants.md](docs/invariants.md).

- The page stays one self-contained `index.html` that opens straight from disk: no build step, no external scripts, no runtime dependencies. The only external request is the optional Google Fonts stylesheet.
- Every particle renders the same way at every camera angle: text and ambient particles get the same light, colour, size and focus at every eye and everywhere else, and nothing in the scene brightens as the camera nears an eye. The words become obvious only because the particles line up there (owner directive, 2026-10-11: "They need to be glowing consistently no matter what angle. The words should be entirely depending on the right angle to be obvious.").
- The particles are drawn in one additive pass that the test-only layers split exactly: ONE/ONE blending into the 8-bit canvas, no depth buffer, depth of field computed per sprite, and `layer=text` and `layer=ambient` each drawing one of the two ranges the shipped draw covers. The alike gate's pixel identity rests on this, and on a renderer that does not dither (SwiftShader; the page leaves WebGL's default dithering on), so a change to the draw that turns it red needs the gate rethought, not its bound loosened.
- Each text particle belongs to one message and moves only along its own sight-line from that message's eye, so its projection from there never changes.
- Zoom changes the field of view only. The eye stays on the orbit sphere with world-up roll, because moving it breaks the illusion.
- The letters lean right by `SLANT` (14°), each line sheared about its own baseline. The face stands upright. The layout gate undoes the lean before it measures and then holds the stems within 4° of upright, so `SLANT_DEG` in `tests/illusion.test.mjs` changes together with `SLANT`.
- The six messages, their order, their eyes and the start view are part of the contract (`tests/lib/messages.mjs`; `scripts/shoot.mjs` keeps its own copy of the eyes, `EYES`). Hello world's eye stays at (38°, 14°), and the start view is (8°, −16°).
- The test contract changes only together with the gates.
- The sequence glides to each eye in order and holds exactly there. "Find the angle" goes to the next message.
- The page doubles as a claude.ai artifact: one deliberate dark theme with colour tokens on `:root`, no `#key=value` hash state, and it works at 390 px wide.
- The plan's budget for the page's cost on a GPU: at most 48,000 particles, and sprites that cover at most 3× the screen at 1920×1080 and DPR 2 at the default zoom (`tests/page.test.mjs`). Going past it is a design decision: record the new budget and its reason before changing `PARTICLES` or `MAX_OVERDRAW`, never just to pass.

## Conventions

- Screenshots and other run output go under `tmp/` (ignored) and are deleted once no task needs them.
- To publish the page as an artifact, strip the document wrapper (the doctype, the `html`, `head` and `body` tags, and the charset and viewport metas), because the artifact host supplies them.
