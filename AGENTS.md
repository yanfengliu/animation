# AGENTS.md — animation

## What this is

An anamorphic particle animation. `index.html` is one self-contained WebGL2 page.

A cloud of glowing particles drifts in the air. From one secret viewpoint some of the particles line up to read "hello" above "world" in letters that lean right 14°; from everywhere else it looks like a plain cloud.

The viewer changes the angle by dragging, and an idle camera tour passes through the viewpoint.

Non-goals: build steps, frameworks, runtime dependencies, server code.

Stack: plain HTML, CSS and JavaScript on WebGL2. Node 24 (`.nvmrc`) is for dev tooling only. Playwright (a dev dependency) drives headless Chromium for screenshots and gates.

The design and acceptance record is `docs/work/0_hello-world-cloud/plan.md`.

This repo's own rules: [docs/policies/local-rules.md](docs/policies/local-rules.md).

<!-- FLEET-CANON:BEGIN sha=d6dedc493bdd generated from ../fleet/FLEET.md by `npm run sync-canon` — do not edit inside this block; this repo's own rules go in docs/policies/local-rules.md -->
## Fleet constitution

Reasons and evidence per `[Rn]`: `../fleet/docs/canon-rationale.md`.

### Fleet Orchestration Policy

Deliver the requested outcome with verified correctness, coherent architecture and minimal necessary complexity. Optimize useful progress, not agent count, code volume or maximum reasoning. Adapt rigor to risk. This policy grants no new permissions or capabilities. [R1]

**Roles.** Only an explicitly designated agent coordinates; each scope has one accountable integration owner. The coordinator owns planning, dependencies, shared interfaces, architectural consistency, integration and acceptance. It reads only what assignments, acceptance or its own trivial change need, accepts or rejects inspected handoffs, and delegates all but trivial changes that cost more to delegate (owner directive, 2026-09-23, superseding 2026-09-05). Trivial means at most about 20 changed lines of docs, config or an integration fix, no R10 high-risk change, product logic, migration, security or trust-boundary code; the same gates, review and worktree rules apply. [R2]

Workers own bounded outcomes and local implementation decisions. Each worker, reviewers included, chooses and dispatches its subagents within budget: none for a small task, while remaining accountable for their work (owner directive, 2026-09-23). Threads follow deliverables, not permanent departments; no recursive manager hierarchies. [R3]

**Plan and delegate.** Inspect instructions, code, docs, tree state and active tasks; set outcome, non-goals, acceptance criteria, dependencies and verification; settle ambiguity with evidence and reversible defaults. Use the simplest delegation: subagents for bounded investigation, independent judgment or localized changes, separate threads for substantial independent changes. Agree shared contracts before parallel work; no duplicate or blocked work. Assignments name owner, outcome, context, dependencies, contracts, base revision, workspace, scope and exclusions, verification, resource limits, handoff, and read-only or implementation. Change model and reasoning defaults only through supported controls, on evidence. [R4]

Size the team continuously (owner directive, 2026-09-15): widen when one worker holds the critical path and independent work waits; narrow when workers contend for files, ports or CPU. Account for shared services, databases, ports and compute: serialize same-file edits in one tree, duplicate gates and unshareable resources. Run one expensive gate at a time; choose other work around it. [R5]

**Session size** (owner directives, 2026-09-23 and 2026-10-18). One task per session; new requests get separate assignments. After ten human/agent turns on an orchestration thread, stop assigning new scope and let active subagents finish; never interrupt them for rollover. One turn is a human message and agent response, excluding tools, commentary and subagent messages. Integrate and verify completed increments and clean up under R7. If authorized work remains, start a successor with an R8 handoff note; confirm it received the note and reconciled goal state and todos before archiving the old session. Otherwise archive the completed session and stop under R11. If worker completion, handoff or cleanup is blocked, record ownership and state and keep the old session open until safe. Split tasks expected to exceed about 200k context tokens into milestones within that budget, each committed and merged to main once green; the next may start fresh from main. Milestones are task boundaries; harness compaction never justifies wrapping up or handing off. No unattended "don't stop until done" loop without milestone commits. Mechanical subagents use lower effort or a smaller model; reviews and their subagents keep the review runbook's pins. Per-item model calls are one-shot, never full agent sessions. [R6]

**Coordinate safely.** Use available capabilities; assume no visibility into other chats, shared memory, automatic messaging, workspace isolation or persistent monitoring. If spawning is unavailable, work directly or hand off explicitly. Beyond a trivial read, each session or agent defaults to its own worktree to isolate concurrent edits. Serialize overlapping writes only when no worktree is available, and say why. Finish each bounded increment in its session before R6 rollover: merge to main, push, then `git worktree remove`. Remove completed task-owned branches and unneeded temporary files; explicitly transfer ownership and locations of still-needed resources. Report any merged worktree left and its location as a defect. Never overwrite or discard another participant's work. Track delegation to completion, cancellation or handoff; release only owned resources without losing work. On resumption, first inspect surviving worktrees, artifacts and task status; recover what exists and preserve unfinished work, assuming no worktree, transcript or shared memory survived until checked. [R7]

**Preserve state and decision boundaries.** Store owners, dependencies, revisions, status, blockers and consequential decisions in the repo or tracker; reuse conventions and keep only useful docs. The coordinator updates canonical todos and progress from workers, revisiting goals, remaining work, dependencies, blockers and acceptance criteria. Periodically spawn a fresh subagent to review the whole effort for fundamental flaws, unnecessary detail, hard problems or loops; reassess from its findings. Propagate contract changes; revalidate stale information. Distinguish requirements from behavior, prepared from dispatched work, observations from assumptions, and implemented, verified, reviewed, integrated and blocked work. At handoff or interruption preserve goals, acceptance criteria, todos, owners, resource locations, outcomes, revisions, checks, results, evidence, risks, blockers, decisions, open issues, next steps and integration needs, excluding secrets and needless private data. The successor maintains canonical todos with status, owners and dependencies and any active goal's objective, status, progress and remaining limits through supported controls; never reset consumed allowances. Workers act autonomously in scope; escalate cross-task interfaces, persistent formats, security boundaries, major dependencies and scope changes to the coordinator for resolution within the approved mandate. Unapproved major architecture or product changes and consequential external actions need human authorization. [R8]

**Implement and verify.** Inspect, implement a coherent increment, check, diagnose, fix, recheck. Preserve architecture; no unrelated rewrites, speculative abstractions or unnecessary dependencies. Implement when requested. Use task-appropriate evidence and baselines; inspect real user flows in interactive products. Check games' and simulations' invariants, save compatibility and realistic-scale performance; prototype uncertain ideas before generalizing. Research cites evidence and separates hypotheses, measurements and conclusions. Never weaken tests or conceal failures to claim success. Docs-only work uses content and version checks; skip runtime tests and CI waits. [R9]

During authorized work, proactively improve products and orchestration and learn from recorded outcomes; follow `../fleet/docs/skills/self-improvement/SKILL.md` within scope and budget. [R33]

Obtain independent, preferably read-only review for substantial or high-risk changes when available. Review the exact revision against acceptance criteria. Report unavailable review; fix justified findings, rerun affected checks, and obtain focused re-review when fixes invalidate earlier review. [R10]

**Integrate, report, and stop.** Reassess after two failures for one reason. Unless another budget is set or the user authorizes more, cap automatic repair at five substantive attempts, then report; explicit overrides hold for their stated scope without asking again. Keep updates brief and decision-relevant. Stop when acceptance criteria and material findings are resolved; invent no follow-up work. [R11]

**Final acceptance gate.** The integration owner integrates in dependency order and on the final integrated revision's actual changes and evidence, not worker summaries, checks every acceptance criterion, runs relevant automated checks and exercises affected end-to-end behavior and cross-task interactions. Substantial or high-risk work gets independent read-only review of the integrated changes, integration fixes included. Confirm the merge to main; report that revision, review status and every failed, skipped or unavailable check and unmet criterion. Nothing is fully verified with an open material finding or required check. [R12]

### Fleet conventions

- Repository rules add local constraints consistent with this policy; they cannot override its permissions, adaptive workflow or stopping limits. [R13]
- Gates pass before any commit touching code; dependency changes rerun the audit gate. The user's standing grant covers committing, merging to main and pushing in every repo they own; force-pushing, rewriting history, deploying and publishing still need authorization. Work is done only once merged to main, regardless of green branch or worktree gates; report unmerged work's location. [R14]
- After executable changes, follow available remote gates to completion; inspect steps and runner before blaming code. Report unavailable verification and local bounds; fix blocking failures within the repair budget and report unrelated ones without expanding scope. [R15]
- For substantial or high-risk changes, use independent review when available. High-risk includes persistence and migrations, security and auth, concurrency, money, supply chain, and executable changes in sibling repos; `../fleet/docs/skills/multi-cli-review.md` provides the review mechanics. [R10]
- Inspect rendered visual work; work without a visual surface runs headlessly. Cover 3D with ample fixed angles and zooms for comparison and randomized angles for exploration; leave room for surprises. Cover 2D and artwork at relevant viewport sizes, scales and states, interactive work through real controls and representative flows over time, static assets from their viewpoints. Use headless when adequate, visible only when needed. Aggregate views establish presence, not correctness: inspect each item at native resolution and bind review to the inspected bytes' digest. Check affected flows and surroundings for material regressions. Direct state-setting does not verify the controls or skipped input path. [R16]
- Record every user-reported defect in `docs/learning/defect-register.md`: the user's symptom, investigation, root cause and how it is checked. Add a check for the whole defect class; retain the entry after its gate lands. [R17]
- Read `docs/learning/lessons.md` at session start. Record lessons there the session learned; each names its retiring gate and is deleted in the commit landing it. A gate counts only after going red with the defect reintroduced, following `../fleet/docs/lessons-template.md`. [R18]
- Gates prove nothing beyond their bounds: name the bound in the header and pin every reproducing input. Distinguish passed from did-not-run; a check built from its checked symbol proves only self-agreement. [R19]
- Verify outcomes beyond exit status, red or green, and return values: read the artifact that should have changed. Retest inherited blockers before repeating them. [R20]
- Verify instruments before trusting measurements: flags took effect, the denominator is intended, the control reproduces and relied-on claims remain true. Hold the tree still between A/B arms. Ask the repo's debugging instrument first; the first probe names it or explains why none answers. Enforce applicable rules when writing a probe. [R21]
- Identify and fix slowness on the critical path (owner directive, 2026-09-15). Keep only slowness the verdict requires: the expensive gate the team is sized around. [R22]
- Keep task-run evidence only under ignored paths; delete it when no active task, unresolved issue or handoff needs it. It enters Git only after review promotes it to a repository input. Tracked docs retain plans, authored reviews, conclusions and provenance. Promoted blobs over 256 KiB need a stated reason; over 512 KiB binary or 1 MiB of anything never enter ordinary Git. Asset stores or LFS need user approval. [R23]
- Keep plans and every authored review round in permanent `docs/work/<id>_<theme>/` folders (`../fleet/docs/work-docs.md`). Record history, not status: a dated devlog line per behaviour-changing session in `docs/devlog/summary.md` (`../fleet/docs/devlog-template.md`). [R24]
- Use common words with the same meaning in chat, docs, commits, PRs, comments and errors. One idea per sentence unless a rule needs more. Cut length, not facts: keep exact terms, numbers and evidence. Quotes and pastes are exempt; do not copy this canon's style. One line per paragraph, no hard wrapping. When expanding skills, agent instructions or rules, merge overlaps, tighten wording, set a line budget and actively seek cuts; consider one-in, one-out. Justify necessary growth. [R25]
- Check error messages across the affected class and adjacent paths. Each names what happened, which input caused it and what would satisfy it, never bare `Validation failed`. [R26]
- When blocked, immediately hand over the redacted artifact with the named blocker, before analysis; continue safe independent work. [R27]
- Repos choose their language and toolchain (Node, Python and Rust run here), pin versions where tooling reads them and name them in Gates. Node baseline is 24; older majors need a CI job proving them. [R28]
- Runtime model calls, vision included, are authorized and paid for. Reviewer model pins live only in `../fleet/docs/skills/multi-cli-review.md`; every model a product calls is pinned in its calling repo. No model IDs are hardcoded elsewhere. [R29]
- Standing loops source tasks by running the artifact as its user does, with its default entry point and real configuration, never by reading code for improvements. No runnable entry point means no standing loop. [R30]
- Directions that outlive a task land that session in `../fleet/FLEET.md` if fleet-wide, otherwise the repo's `docs/policies/local-rules.md`; report where. [R31]
- When a hard problem blocks progress, run the search in `../fleet/docs/skills/hard-problem.md`. [R32]
<!-- FLEET-CANON:END -->

## Gates

Node 24 (`.nvmrc`). Each command below was run on Windows 11 with Node 24.18.1 on 2026-10-11; `npm test` and the mutation proof again on 2026-10-14.

- `npm ci` installs the one dev dependency, Playwright 1.63.0 (pinned). It installs no browser, because neither `playwright` nor `playwright-core` has an install script.
- `npx playwright install chromium` then puts that version's Chromium (153.0.8010.12) in the local Playwright cache. When the build is already there it reuses it and downloads nothing (2 s here). The gates use only that cache; nothing downloads at test time.
- `npm test` runs the headless suite through `tests/run.mjs`: 36 tests in 85–91 s.
  - It runs `tests/illusion.test.mjs` alone first, then the other `tests/*.test.mjs` files two at a time, because SwiftShader WebGL2 is CPU-heavy (`tests/lib/phases.mjs`). So the timing checks, the font-hang loads and the control fling, never run beside the illusion file's renders.
  - The illusion file queues most of its views at start and renders up to four at a time in four browsers, because each browser draws all its pages in one GPU process. `pump()` hands each 1280×800 view to the next browser in turn without checking which one is free, so two can render in one browser at once; every 390×844 view renders in browser 0 and every blank-readback view in browser 1. The seed test renders outside the queue. The camera-mode test times its shots, so it runs last: it pauses `pump()` and waits for the renders in flight, so no queued view renders beside its two pages.
  - It exits 1 when a test fails, a file fails to load or no test passed. `PAGE=<path relative to the repo root>` runs it against another copy of the page.
- `npm audit --audit-level=high` runs after any dependency change.
- `npm run shoot -- --preset=all` (or `magic`, `off`, or single views; see the header of `scripts/shoot.mjs`) is the visual instrument. It saves PNGs under `tmp/shots/` and prints each one's sha256 and what the page reports. A visual change still needs someone to look at the shots at native resolution; the gates do not replace that.
- `node tests/mutate.mjs [name ...]` re-proves the gates.
  - It first runs the gate files on the real page and tree as a control, and stops with exit 2 unless every test passes.
  - It then writes each mutant under `tmp/mutants/` and runs the gates against it, in the phases `npm test` uses. Each red test prints as CHECK (an assertion failed, an `until` timeout included) or ERROR (anything else, such as a browser that does not launch), with its test-file line.
  - A page that never becomes ready is an ERROR in every test that needs a drawn page, because each one waits through the harness, which throws a plain Error. That includes the font-hang test, whose baseline load waits that way. The no-WebGL2 test is the exception: a page whose script never runs shows no message there, a CHECK, but then no test passes, so the mutant is flagged.
  - A mutant counts as killed only by a CHECK. One with only ERRORs is "errored". One with 0 green tests is flagged, since it may break the page wholesale rather than the one behaviour it names.
  - It exits 1 on any survivor, errored or flagged mutant.
  - Tree mutants are copies of the repo without `.git`, `node_modules`, `tmp`, test output and `.claude/worktrees`, so any file a command names is there too. Each is deleted once scanned.
  - Run it after changing a gate or the page. The full run (74 mutants: 51 page, 23 tree) took 80 minutes on 2026-10-14, about 92 s per page mutant, since each runs the illusion file alone and then the other files. So run only the mutants a change touches by name, and keep it the only browser workload while it runs.
  - A β 1.0 mutant (`full-relocation`) stays retired: review round 3 (F25) looked for a bound on a three-seed mean that holds β at 0.85 and found none (see Bound below). Until a gate holds it, β stays at 0.85 by decision ([docs/learning/lessons.md](docs/learning/lessons.md)).

What the suite proves (each file's header states its exact bound):

- `tests/illusion.test.mjs`:
  - At E the "hello world" strokes are at least 1.48× brighter than the gaps between them, at t 0, 7.3 and 31 s, at 1280×800 and 390×844, at fov 32 and 80, and when canvas readback returns zeros.
    - Relocation must also lift that ratio at least 1.35× over the same view rendered with `beta=0`, because the ratio alone has a baseline: with no relocation it is still 1.53 at 1280×800.
    - The stroke shapes are the same for two seeds, so they come from the message, not the particle draw.
    - A zoomed view's mask keeps the stroke area the zoom predicts, so it cannot fatten where sprites merge at fov 80.
  - At E at 1280×800 the strokes form two lines, the top one narrower, with a full-height stem at the left end of the top line ("h") and at the right end of the bottom line ("d"). So the text is neither mirrored nor turned 180°.
    - The test undoes the letters' 14° lean before it measures the ends, so letters that lean the other way (a mirrored frame) leave those stems short.
    - It then measures how far the "h" and "d" stems still lean, along each line's outer ink edge. The mean over seeds 1–3 must be within 4° of upright, so the letters lean 14° ± 4° (0.7° measured; −8° with a 5° lean, −14° with upright letters).
  - At 390×844 the whole text block, measured across the full width, stays at least 8 px inside the frame.
  - Every particle renders alike at every angle (owner directive, 2026-10-11).
    - At E, 3° (el+3), 12° (az−12, 11.6° from E), az+25, el−25 and the back, at t 0 and 7.3, the text particles carry the light (within 5%) and colour of the same particles drawn as ambient, and at t 0 their sprite size (within 15%).
    - Colour is checked in red, green and blue separately: each channel's text over as-ambient ratio must be within 3%. It measures 0.993–1.006 in red, 0.993–1.006 in green and 0.988–1.010 in blue for seeds 1–3 at every one of those views and times (0.989–1.010 over seeds 4–9). A green tint near E that keeps light and warmth (red and blue × 0.739, green × 1.10) gives 0.731/1.096/0.740 at E; the old warmth check, (red − blue)/(red + blue), passed it.
    - The comparison uses `beta`. The text layer minus the sky holds the relocated particles drawn as text. The full `beta=0` render minus the ambient layer holds the same particles drawn as ambient where they started. Size is measured at `beta=0.02`, where the 121 text sprites are separate.
    - Those draws are test-only, so the shipped render is tied to them pixel by pixel. At each of those views and times, the shipped render minus the sky must equal the text layer minus the sky plus the ambient layer minus the sky, in each of red, green and blue, capped at 255 as the 8-bit target caps it. The residual may be at most 0.1% of their light per channel. It measures exactly 0 for seeds 1–3, not one channel value off, because the page blends ONE/ONE with no depth buffer and computes depth of field per sprite, and because SwiftShader rounds each fragment on its own without dithering. WebGL dithers by default and the page does not turn it off, so a renderer that dithers could break the identity.
    - So any effect the shipped draw alone has, in light, colour, size or focus, breaks it. A 30% gold tint near E in the shipped draw only gives 2.5–3.6% at E and 3°, and a second text pass at 25% gives 4.1–5.8%. The old light-sum check passed the tint (0.9955–0.9968 against a 1% band).
    - The whole scene's particle light at E, 3° and 12° stays within 15% of its mean at the three far views, so nothing glows brighter as the camera nears E.
  - The camera's modes and time spent at E do not change the picture. E reached by a real click on "Find the angle" is shot when the glide lands and again after 8 s idle there. Each shot must match E set by URL in the central region pixel by pixel, per channel (residual at most 0.1%; exactly 0 measured), and the idle shot must match the arrival shot too.
    - The tour starts from the shipped start view, as a visitor's does (no `az`, `el` or `tour=0`). In `index.html` it holds 1 s there, glides 8.34 s to E and holds 5 s, so it is at E from at least 9.34 s to at least 14.34 s after the page's first frame (from 9.35–9.37 s to 14.39–14.40 s measured).
    - It is shot 12.3 s after the first frame, about 2.9 s into the hold, and the reads and screenshot end about 1.7 s before the hold does (0.31–0.39 s for them).
    - The shot counts only if it started at or after 12.3 s, at least 1.5 s after the camera reached E as the page's frames report it, and with the tour at E before and after it. A miss is shot once more on a fresh page; a second miss fails the test.
    - The test runs last, after the render queue has drained, so nothing else renders beside it.
  - The text layer at E holds still over time, and zoom only scales the image.
  - From 25° out (±25° az and el, +60° az) the E strokes are no brighter than the back-view floor + 0.09, and that floor stays below 1.19, both as means over seeds 1–3. The back view is the floor, not a case tested against it.
  - The az+25 text layer is a smear that changes with the seed.
  - Relocation leaves no streaks at az±25, az+60 or the back. The row and column residual of a render minus its `beta=0` twin (high-passed profiles over the cloud's own profile noise) stays within 2.1× each seed's floor, the mean residual at two diagonal control views, as a mean over seeds 1–3.
  - From el±15–25° the text columns show as faint vertical streaks, an accepted cost. The 14° lean spreads them, and the gate holds that: at el+25 and at el−25 the column residual must stay below 1.95× the cloud's own noise, as a mean over seeds 1–3 (1.37 and 1.49 measured; 2.06 and 2.30 with upright letters, 2.07 and 2.27 with a 5° lean).
  - The same seed builds the same cloud.
  - The hiding, streak and lean bounds hold for the mean over seeds 1–3, because one seed's values move by more than the gap between the page and its mutants: seed 3 alone measures 1.76× its floor at az+25.
    - Each threshold sits between the page and its mutants as measured for seeds 1–3, and the page also passes it for seeds 4–6, 7–9 and 10–12, as a redraw would give.
    - A change that redraws the cloud without changing the design, such as one more `rand()` call in `buildCloud`, another `N_TOTAL` or a glyph tweak, moves them all. If it turns one red, re-measure seeds 1–3 and the spread over further seeds before touching the threshold. Never retune one just to pass.
- `tests/controls.test.mjs`: real mouse, wheel, keyboard and CDP touch input on a 640×400 page. Covers drag signs, rate and the ±70° clamp; zoom that changes only the field of view; arrow keys; the "Find the angle" glide and its cancel; snap near E; zooming during a glide or snap, which takes at once and holds when the move lands; and touch drag and pinch, including a pinch at E and a pinch after a deliberate 17 px drag away from E, which must not snap.
- `tests/motion.test.mjs`: the camera's own motion, through real mouse input on a 640×400 page. Covers the tour (moves at load, stops on a press, still stopped 9 s later), coasting after a fling, and reduced motion (no tour, no coast once switched on in the same page, "Find the angle" jumps).
- `tests/page.test.mjs`: no console or page errors; the only request is the Google Fonts stylesheet; if it never answers, the page still draws within 2 s of the time the same load takes with it answered (the two loads start together in one browser, so both see the same CPU load); no horizontal overflow at 390 px; Tab reaches the canvas and then "Find the angle" with focus styles that change pixels on screen; keys work on the focused canvas; Chromium's accessibility tree exposes the canvas as a focusable application with a role description and a name; the no-WebGL2 message. Each check closes its browser context as soon as it is done.
- `tests/hygiene.test.mjs`: a text scan. This is the gate for the defect in `docs/learning/defect-register.md`.
  - It reads only `.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`, `.sh`, `.ps1`, `.cmd` and `.bat` files under `scripts/`, under `tests/` and at the root (such as a Playwright config); the npm scripts; and the commands in the `.claude/settings*.json` files that `.gitignore` does not name. Other file types, such as a `.py` script, are never read.
  - It also reads any repo file of those types, or an extensionless script, that one of those commands or a scanned shell file names by path, at any depth: a hook's `bash .claude/hooks/after-edit.sh`, also behind `$CLAUDE_PROJECT_DIR`.
  - Comments in files are blanked before matching. Commands keep theirs, since `cmd.exe` has no `#` comment.
  - Every Playwright launch passes a literal `headless: true`, with no spread, no call building its options and no channel.
  - Nothing names a system browser, a desktop opener, an opener package or live-reload server (`open-cli`, `live-server`, `lite-server`, `browser-sync`, `npx open`, `http-server -o`), `connectOverCDP`, or a headed, debug, UI, inspector, code-generator, open or report mode (`--headed`, `--debug`, `--ui`, `--open`, `PWDEBUG`, `playwright open` and `playwright@<version> open`, `show-report`). A Playwright config picks no channel.
  - Nothing calls `pause()` on a receiver that can be a page: one whose chain names "page", or a name that can hold one.
    - A name can hold a page when the file declares it from a statement that calls `newPage`, `pages()` or `waitForEvent`, alone or in a destructuring pattern, as in `const [popup] = await Promise.all([page.waitForEvent('popup'), …])`. A declaration nested in another, such as an arrow helper's first statement, and each declaration in code without semicolons count on their own.
    - It can also when the file binds it as the variable of a `for…of` loop over such a call, as in `for (const tab of context.pages())`. Only the iterable counts, up to its first `)`, so a page opened in the loop body does not bind the loop variable.
    - It can also when the file assigns it, awaited or not, from a bare name that can hold a page or names "page", as in `const popup = await popupPromise`.
    - Pauses on sockets, requests, streams, media and animations pass.
  - No shell command runs an opener where a command starts: at a line start, after `;`, `&`, `|`, `(` or a backtick, or after `cmd /c`, `sh -c` (or `-lc`) or `-Command`. The command word may be quoted there; a quote anywhere else is text, as in `echo "open tasks: 3"`.
    - cmd's echo-off `@` and the keywords `then`, `do`, `else` and `exec` may come first there, as in `@powershell -NoProfile "ii index.html"` in a `.cmd` file or `if …; then start index.html; fi`. cmd's `) else` starts a command too.
    - Windows PowerShell started where a command starts runs its first argument that is not a switch or a switch's value as a command. So after `powershell` or `powershell.exe` there and its switches, whose values may be quoted (`powershell -WindowStyle "Hidden" "ii index.html"`), the next word counts as a command start too.
    - The word `powershell` anywhere else is text, as in `git commit -m "fix powershell start script"`.
  - Only Playwright code builds `file:` URLs, including from `import.meta.url` outside `fileURLToPath`.
  - Child processes start only Node, in files and in commands such as `node -e`, whether `child_process` is imported whole, by name, renamed or destructured.

Bound: one engine, headless Chromium 153 with SwiftShader WebGL2, device pixel ratio 1 for the image gates, and only the listed views, times, seeds, `beta` values and inputs. The exact pixel identities rest on SwiftShader's 8-bit additive blending without dithering. The image gates measure light, colour and shape, not whether a person can read the text.
- A reveal confined to angles between the measured views (for example only 5–10° from E) would pass them.
- So would one shown only while the camera moves (mid-glide, mid-snap, mid-tour or coasting), since every view is shot with the camera at rest or in the tour's hold, or only once E is reached another way (a snap, the arrow keys).
- So would one that waits at E longer than the dwells measured: 8 s idle after the glide, and about 2.9 s into the tour's first 5 s hold at E (at least 1.5 s, as checked), so a reveal in that hold's last 2.1 s passes.
- So would one driven by the particle clock: every shot freezes it with `t`, which the shipped page never sets.
- So would one shown only on a URL without `t`, as a visitor's is: every image gate sets `t`, and every one but the tour shot sets `az` and `el` too.
- So would one in every draw that stays inside each band on its own: light within 5%, each colour channel within 3%, sprite size within 15%. The exact ties catch only what the shipped draw, a camera mode or a dwell at E adds.
- Nor do they hold β at 0.85 (review round 3, F25; the lesson is in [docs/learning/lessons.md](docs/learning/lessons.md)). The measure is the az+25 row residual over the cloud's own noise, as a mean over three seeds.
  - β 0.85 measures 1.416, 1.693, 1.556 and 1.524 for seeds 1–3, 4–6, 7–9 and 10–12. β 1.0 measures 1.637 for seeds 1–3 and 1.897 for seeds 4–6.
  - Per seed (1–6), β 1.0 changes it by −0.3% to +37%, +14% on average.
  - So no bound on a three-seed mean tells them apart: β 1.0 at seeds 1–3 lies inside β 0.85's own range. A mean over about 12 seeds would, at about four times the illusion file's cost.

No screen reader was available, so the accessibility check reads Chromium's tree, not what NVDA or JAWS do with it.

The hygiene scan's blind spots:
- code assembled at run time: `eval`, strings or names built from pieces, computed keys such as `cp['exec']`, a launch method reached by destructuring;
- a page under a name without "page" that the file does not bind itself, such as a parameter called `tab`, or reaches only through a member or a call;
- Windows PowerShell started as another program's argument rather than where a command starts, such as `cross-env powershell "ii index.html"` or `call powershell …`, unless `-Command` comes before the command;
- programs that open a browser by default but are not named in the scan;
- files of other types, and repo files outside the scanned folders that only code names, such as a path passed to a Node child process;
- files outside the scanned paths that no command names: `docs/`, `tmp/`, `node_modules` and its install scripts, git hooks, `~/.claude`, settings files `.gitignore` names, and agents' scratch scripts outside the repo;
- command starts the scan does not know (review round 6, F47):
  - a one-line PowerShell script block such as `if (Test-Path index.html) { ii index.html }` or `| ForEach-Object { ii $_ }`;
  - cmd's `for %%f in (index.html) do start %%f` and `if exist index.html start index.html`;
  - wrapper commands such as `call start …`, `nohup open …` and `cross-env start …`;
  - a `for…of` loop over a variable that already holds the pages, such as `for (const tab of tabs)` after `tabs = context.pages()`;
- the desktop app's own browser pane, which opened the file in the original incident.

It still flags a few harmless forms, listed in its header: a `pause()` on a non-page receiver whose chain names "page" or on a bound name that holds no page, a program's own `-c` switch before a quoted opener word, a separator inside quoted text before an opener word (`echo "a; open b"`, `echo "(a) else open b"`), an opener word passed as an argument after `powershell -File` and its script, and a launch method's or `child_process`'s name inside a string.

## Invariants & boundaries

- The page stays one self-contained `index.html` that opens straight from disk: no build step, no external scripts, no runtime dependencies. The only external request is the optional Google Fonts stylesheet.
- Every particle renders the same way at every camera angle: text and ambient particles get the same light, colour, size and focus at E and everywhere else, and nothing in the scene brightens as the camera nears E. The words become obvious only because the particles line up there (owner directive, 2026-10-11: "They need to be glowing consistently no matter what angle. The words should be entirely depending on the right angle to be obvious.").
- The particles are drawn in one additive pass that the test-only layers split exactly: ONE/ONE blending into the 8-bit canvas, no depth buffer, depth of field computed per sprite, and `layer=text` and `layer=ambient` each drawing one of the two ranges the shipped draw covers. The alike gate's pixel identity rests on this, and on a renderer that does not dither (SwiftShader; the page leaves WebGL's default dithering on), so a change to the draw that turns it red needs the gate rethought, not its bound loosened.
- Text particles move only along their own sight-line from the secret eye, so their projection from it never changes. Ambient drift plus wobble is at most about 0.52 world units. Seen from E that is 0.42σ at the text plane and less beyond it (σ is the relocation width in the plan), but up to about 0.9σ for the nearest particles. So the density that hides the text holds closely at and beyond the plane and only roughly in front of it.
- Zoom changes the field of view only. The eye stays on the orbit sphere with world-up roll, because moving it breaks the illusion.
- The letters lean right by `SLANT` (14°), each line sheared about its own baseline. An elevation turn keeps every particle's screen column, so upright stems would show above and below E as vertical streaks; leaning ones spread over many columns. The layout gate undoes the lean before it measures and then holds the stems within 4° of upright, so `SLANT_DEG` in `tests/illusion.test.mjs` changes together with `SLANT`. The streak gate holds the el±25 column residual that the lean is for.
- The test contract changes only together with the gates. Query parameters: `az`, `el`, `fov` (degrees), `t` (freezes the particle clock), `tour=0`, `layer=text|ambient`, `seed`, and the test-only `beta`, a number from 0 to 1 that sets the peak relocation chance (other values keep the default 0.85). The base cloud is the same for every `beta`, and `beta=0` relocates nothing, so a render minus its `beta=0` twin holds only what relocation changed. Read-only `window.__cloud`: `ready`, `frame`, `magic`, `view()`, `alignment()`, `mode()`, `counts`. DOM ids: `#scene`, `#find`, `#readout`, `#hint`, `#nogl`. `#scene` is exposed as a focusable `application` with a role description and a name.
- The page doubles as a claude.ai artifact: one deliberate dark theme with colour tokens on `:root`, no `#key=value` hash state, and it works at 390 px wide.

## Conventions

- Screenshots and other run output go under `tmp/` (ignored) and are deleted once no task needs them.
- To publish the page as an artifact, strip the document wrapper (the doctype, the `html`, `head` and `body` tags, and the charset and viewport metas), because the artifact host supplies them.
