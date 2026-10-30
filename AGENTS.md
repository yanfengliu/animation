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

<!-- FLEET-CANON:BEGIN sha=e54f2a9ae007 generated from ../fleet/FLEET.md by `npm run sync-canon` — do not edit inside this block; this repo's own rules go in docs/policies/local-rules.md -->
## Fleet constitution

Reasons and evidence per `[Rn]`: `../fleet/docs/canon-rationale.md`. `../fleet/` is fleet's checkout beside the repo's primary checkout, also from a worktree. The designated coordinator reads `../fleet/docs/skills/coordinator.md` before planning and after each compaction, and any agent reads that file's "Delegate" section before delegating. Before these kinds of work, read the matching section of `../fleet/docs/work-rules.md`: visual and interactive work; games, simulations and research; measuring, debugging and slow steps; writing error messages; toolchains, dependencies and model calls; standing loops and unattended runs; pushing executable changes; a user-reported defect; editing skills, agent instructions or rules; run output and files over 256 KiB; handing off or stopping mid-task.

### Fleet Orchestration Policy

Deliver the requested outcome with verified correctness, coherent architecture and minimal necessary complexity. Optimize useful progress, not agent count, code volume or maximum reasoning. Adapt rigor to risk. This policy grants no new permissions or capabilities. [R1]

**Roles.** Only an explicitly designated agent coordinates; each scope has one accountable integration owner. [R2]

Workers own bounded outcomes and local implementation decisions. [R3]

Inspect instructions, code, docs, tree state and active tasks; set outcome, non-goals, acceptance criteria, dependencies and verification; settle ambiguity with evidence and reversible defaults. [R4]

**Session size** (owner directives, 2026-09-23 and 2026-10-22). Sessions run long: take new requests as separate assignments in the same session, and never hand off to a successor session to shed context; auto-compaction carries the session. Split tasks expected to exceed about 200k context tokens into milestones within that budget, each committed and merged to main once green. Milestones are task boundaries; a compaction never justifies wrapping up or handing off. [R6]

**Coordinate safely.** Beyond a trivial read, each session or agent defaults to its own worktree; serialize overlapping writes only when none is available, and say why. Finish each bounded increment in its session: merge to main, push, then `git worktree remove`, remove completed task-owned branches and unneeded temporary files, and explicitly transfer the ownership and location of still-needed resources. Report any merged worktree left and its location as a defect. Never overwrite or discard another participant's work. On resumption, first inspect surviving worktrees, artifacts and task status, assuming nothing survived until checked; recover what exists and preserve unfinished work. [R7]

Workers act autonomously in scope; escalate cross-task interfaces, persistent formats, security boundaries, major dependencies and scope changes to the coordinator for resolution within the approved mandate. Unapproved major architecture or product changes and consequential external actions need human authorization. Fleet rules (FLEET.md, the fleet's skills and runbooks, canon candidates, and agent memory) change only when the owner asks (owner directive, 2026-10-28). Agents propose changes instead of making them. The one exception: they may add a proposal to `../fleet/canon-candidates.md`, with the lesson, its evidence and the rule it would change (owner directive, 2026-10-29). They never change, promote or delete an entry: the owner decides each one, and the session the owner asks makes the change. Never reset consumed allowances. [R8]

**Implement and verify.** Inspect, implement a coherent increment, check, diagnose, fix, recheck. Preserve architecture; no unrelated rewrites, speculative abstractions or unnecessary dependencies. Implement when requested. Use task-appropriate evidence and baselines; prototype uncertain ideas before generalizing. Never weaken tests or conceal failures to claim success. Docs-only work uses content and version checks; skip runtime tests and CI waits. [R9]

During authorized work and within scope and budget, proactively improve products and the task's orchestration, learn from recorded outcomes and propose improvements to fleet rules. Read `../fleet/docs/skills/self-improvement/SKILL.md` when proposing a fleet-rule change or turning a mistake into a gate (owner directive, 2026-10-29). [R33]

Obtain independent, preferably read-only review for substantial or high-risk changes when available. Review the exact revision against acceptance criteria. Report unavailable review; fix justified findings, rerun affected checks, and obtain focused re-review when fixes invalidate earlier review. [R10]

**Integrate, report, and stop.** Reassess after two failures for one reason. Unless another budget is set or the user authorizes more, cap automatic repair at five substantive attempts, then report; explicit overrides hold for their stated scope without asking again. Keep updates brief and decision-relevant. Stop when acceptance criteria and material findings are resolved; invent no follow-up work. [R11]

**Final acceptance gate.** The integration owner integrates in dependency order and on the final integrated revision's actual changes and evidence, not worker summaries, checks every acceptance criterion, runs relevant automated checks and exercises affected end-to-end behavior and cross-task interactions. Substantial or high-risk work gets independent read-only review of the integrated changes, integration fixes included. Confirm the merge to main; report that revision, review status and every failed, skipped or unavailable check and unmet criterion. Nothing is fully verified with an open material finding or required check. [R12]

### Fleet conventions

- Repository rules add local constraints consistent with this policy; they cannot override its permissions, adaptive workflow or stopping limits. [R13]
- Gates pass before any commit touching code, a merge included: merge on a detached HEAD or its own branch and move main to it once its gate passes. The user's standing grant covers committing, merging to main and pushing in their repos; force-pushing, rewriting history, deploying and publishing still need authorization. Work is done only once merged to main, regardless of green branch or worktree gates; report unmerged work's location. [R14]
- For substantial or high-risk changes, use independent review when available. High-risk includes persistence and migrations, security and auth, concurrency, money, supply chain, and executable changes in sibling repos; `../fleet/docs/skills/multi-cli-review.md` provides the review mechanics. [R10]
- Reviewer model pins live only in `../fleet/docs/skills/multi-cli-review.md`; every model a product calls is pinned in its calling repo. No model IDs are hardcoded elsewhere. [R29]
- Read `docs/learning/lessons.md` at session start. Record the session's lessons there; each names its retiring gate and is deleted in the commit landing it. A gate counts only after going red with the defect reintroduced, following `../fleet/docs/lessons-template.md`. [R18]
- Gates prove nothing beyond their bounds: name the bound in the header and pin every reproducing input. Distinguish passed from did-not-run; a check built from its checked symbol proves only self-agreement. [R19]
- Verify outcomes beyond exit status, red or green, and return values: read the artifact that should have changed. Retest inherited blockers before repeating them. [R20]
- Keep plans and every authored review round in permanent `docs/work/<id>_<theme>/` folders (`../fleet/docs/work-docs.md`). Record history, not status: a dated devlog line per behaviour-changing session in `docs/devlog/summary.md` (`../fleet/docs/devlog-template.md`). [R24]
- Use common words with the same meaning in chat, docs, commits, PRs, comments and errors. One idea per sentence unless a rule needs more. Cut length, not facts: keep exact terms, numbers and evidence. Quotes and pastes are exempt; do not copy this canon's style. One line per paragraph, no hard wrapping. [R25]
- When blocked, immediately hand over the redacted artifact with the named blocker, before analysis; continue safe independent work. [R27]
- The owner's directions that outlive a task land that session in `../fleet/FLEET.md` if fleet-wide, otherwise the repo's `docs/policies/local-rules.md`; report where. [R31]
- When a hard problem blocks progress, run the search in `../fleet/docs/skills/hard-problem.md`. [R32]
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
