# AGENTS.md — animation

## What this is

An anamorphic particle animation. `index.html` is one self-contained WebGL2 page.

A cloud of glowing particles drifts in the air. From one secret viewpoint some of the particles line up to read "hello" above "world" in letters that lean right 14°; from everywhere else it looks like a plain cloud.

The viewer changes the angle by dragging, and an idle camera tour passes through the viewpoint.

Non-goals: build steps, frameworks, runtime dependencies, server code.

Stack: plain HTML, CSS and JavaScript on WebGL2. Node 24 (`.nvmrc`) is for dev tooling only. Playwright (a dev dependency) drives headless Chromium for screenshots and gates.

The design and acceptance record is `docs/work/0_hello-world-cloud/plan.md`.

This repo's own rules: [docs/policies/local-rules.md](docs/policies/local-rules.md).

<!-- FLEET-CANON:BEGIN sha=21892c165855 generated from ../fleet/FLEET.md by `npm run sync-canon` — do not edit inside this block; this repo's own rules go in docs/policies/local-rules.md -->
## Fleet constitution

Reasons and evidence per `[Rn]`: `../fleet/docs/canon-rationale.md`.

### Fleet Orchestration Policy

Deliver the requested outcome with verified correctness, coherent architecture and minimal necessary complexity; optimize for useful progress, not agent count, code volume or maximum reasoning. Adapt rigor to risk. This policy grants no new permissions or capabilities. [R1]

**Roles.** Only an explicitly designated agent is coordinator; each scope has one accountable integration owner. The coordinator owns planning, dependencies, shared interfaces, architectural consistency, integration and acceptance. It reads only what an assignment, an acceptance, or its own trivial change needs, inspects handoffs to accept or reject them, and delegates every change except a trivial one, which it may make itself when delegating would cost more than the change (owner directive, 2026-09-23, superseding that of 2026-09-05). Trivial means at most about 20 changed lines of docs, config or an integration fix, nothing R10 calls high-risk, and no product logic, migration, security or trust-boundary code; the same gates, review and worktree rules apply. [R2]

Workers own bounded outcomes and local implementation decisions. Each worker, a reviewer included, decides how many subagents its task needs and dispatches them, within its budget (owner directive, 2026-09-23). For a small task that is none. It remains accountable for what they return. Threads follow deliverables, not permanent departments; no recursive manager hierarchies. [R3]

**Plan and delegate.** First inspect instructions, code, docs, working-tree state and active tasks; establish the outcome, non-goals, acceptance criteria, dependencies and verification method; settle routine ambiguity with evidence and reversible defaults. Choose the simplest effective delegation: subagents for bounded investigation, independent judgment or a localized change, separate threads for substantial independent changes; agree shared contracts before parallel work; no duplicate or blocked work. An assignment names owner, outcome, context, dependencies and contracts, base revision, workspace, allowed and excluded changes, verification, resource limits, expected handoff, and read-only or implementation. Change configured model and reasoning defaults only through supported controls, on evidence. [R4]

Size the team to the work continuously (owner directive, 2026-09-15): widen when one worker holds the critical path and independent work waits, narrow when workers contend for a file, port or CPU. Account for shared services, databases, ports and compute: no worker runs while another edits the same file in the same tree, runs the same gate or holds an unshareable resource. An expensive gate is one: exactly one runs at a time, and other work is chosen around it. [R5]

**Session size** (owner directive, 2026-09-23). One task per session; a new request becomes its own assignment. A task expected to need more than about 200k tokens of context is split into milestones within that budget, each committed and merged to main once green; the next may start a fresh session from main. Milestones are the boundary: the harness compacts context mid-task, and a compaction is never a task boundary or a reason to wrap up or hand off. No unattended "don't stop until done" loop runs without milestone commits. Mechanical subagents (lookups, gate runs, mechanical edits) use lower effort or a smaller model; reviews and their subagents keep the review runbook's pins. Per-item model calls, such as per-image classification, are one-shot calls, never full agent sessions. [R6]

**Coordinate safely.** Use only capabilities actually available; assume no visibility into other chats, shared memory, automatic messaging, workspace isolation or persistent monitoring. Unable to spawn a worker, work directly or hand off explicitly. Isolate concurrent edits in a worktree: beyond a trivial read, a session or agent works in its own worktree by default, serializing overlapping writes only when none is available, and saying why. It finishes the worktree in the same session (merge to main, push, `git worktree remove`), and reports one left after its work landed, and where, as a defect. Never overwrite or discard another participant's work. Track delegated work to completion, cancellation or handoff; release only your own resources, losing no work. Resuming interrupted work, first inspect surviving worktrees, artifacts and task status; recover what exists and preserve unfinished work, assuming no worktree, transcript or shared memory survived until checked. [R7]

**Preserve state and decision boundaries.** Essential memory (owners, dependencies, revisions, status, blockers, consequential decisions) lives in the repo or tracker, not the conversation; reuse conventions; keep only useful docs. The coordinator continuously maintains canonical todos and progress from workers' scoped updates and revisits the overall goal, remaining work, dependencies, blockers and acceptance criteria. Propagate changed contracts; revalidate stale information. Keep apart intended requirements and actual behavior, prepared and dispatched work, observed status and assumptions, and implemented, verified, reviewed, integrated and blocked work. A handoff or interruption keeps outcomes, revisions, checks and results, evidence, risks, blockers, unresolved issues, next steps and integration requirements, never secrets or unnecessary private data. Workers act autonomously in scope, escalating cross-task interfaces, persistent formats, security boundaries, major dependencies and scope changes for the coordinator to resolve within the approved mandate; unapproved major architecture or product changes and consequential external actions need human authorization. [R8]

**Implement and verify.** Inspect, implement a coherent increment, check, diagnose, fix, recheck. Preserve established architecture: no unrelated rewrites, speculative abstractions or unnecessary dependencies. Go past planning when implementation is requested. Use task-appropriate evidence and baselines; inspect real user flows in interactive products; in games and simulations check invariants, save compatibility and realistic-scale performance; prototype uncertain ideas before generalizing; in research cite evidence and separate hypotheses, measurements and conclusions. Never weaken tests or conceal failures to claim success. Docs-only work uses content and version checks; skip runtime tests and CI waits. [R9]

During authorized work, agents proactively improve products and orchestration and learn from recorded outcomes; follow `../fleet/docs/skills/self-improvement/SKILL.md` within scope and budget. [R33]

Obtain independent, preferably read-only review for substantial or high-risk changes when available. Review the exact revision against acceptance criteria. If no review is available, say so rather than imply one ran; fix justified findings, rerun affected checks, and get a focused re-review where a fix invalidates earlier review. [R10]

**Integrate, report, and stop.** After two failures for one reason, reassess rather than repeat. Unless another budget is set or the user authorizes more, cap automatic repair at five substantive attempts, then report; an explicit user override holds for its stated scope, without asking again. Keep updates brief and decision-relevant. Stop once acceptance criteria and material findings are resolved; invent no follow-up work. [R11]

**Final acceptance gate.** The integration owner integrates in dependency order and, on the final integrated revision's actual changes and evidence, not worker summaries: checks every acceptance criterion, runs relevant automated checks, exercises affected end-to-end behavior and cross-task interactions, and for substantial or high-risk work gets an independent read-only review of the integrated changes, integration fixes included. It confirms the merge to main and reports that revision, review status and every failed, skipped or unavailable check and unmet criterion. Nothing is fully verified while a material finding or required check is open. [R12]

### Fleet conventions

- Repository rules add local constraints consistent with this policy; they never override its permissions, adaptive workflow or stopping limits. [R13]
- Gates pass before any commit touching code; a dependency change re-runs the audit gate. The user's standing grant covers committing, merging to main and pushing in every repo they own, and is what the policy's merge and push permissions resolve to; force-pushing, rewriting history, deploying and publishing still need their authorization. Work is done only once merged to main; a branch, worktree or uncommitted tree does not count, whatever its gates say. Say where unmerged work is. [R14]
- After executable changes, follow remote gates to completion when available; inspect steps and runner before blaming code. Report unavailable verification and local bounds; fix blocking failures within the repair budget and report unrelated ones without expanding scope. [R15]
- For substantial or high-risk changes, use independent review when available. High-risk includes persistence and migrations, security and auth, concurrency, money, supply chain, and executable changes in sibling repos; `../fleet/docs/skills/multi-cli-review.md` provides the review mechanics. [R10]
- Verify visual work visually: look at the rendered result; work with no visual surface runs headlessly. Cover 3D with ample fixed angles and zooms for reliable comparison and randomized angles for exploration; leave room for surprises. Cover 2D and artwork at relevant viewport sizes, scales and states, interactive work through real controls and representative flows over time, static assets from their viewpoints; headless when adequate, visible only when needed. An aggregate view (contact sheet, grid, proof sheet) shows one of each exists, not that each is right: inspect each item at native resolution and bind the review to the digest of the bytes inspected. Check affected flows and surroundings for material regressions. A harness that sets state directly does not exercise the controls and is blind to defects in the input path it skips. [R16]
- A defect the user reports is recorded and gated, never only fixed: a `docs/learning/defect-register.md` entry (symptom as they saw it, investigation, root cause, how it is now checked) plus a check for its whole class. The entry stays after its gate lands. [R17]
- A lesson is prose only until it is a gate: it lands in `docs/learning/lessons.md` (read at session start) the session it is learned; each entry names its retiring gate and is deleted in the commit landing it, and a gate counts only once it has gone red with the defect reintroduced, run as `../fleet/docs/lessons-template.md` says. [R18]
- A green gate proves less than it looks like: it proves nothing past its bound. Name the bound in its header; pin every input that reproduces the defect. A gate that cannot tell passed from did-not-run reports the second as the first; a check built from the symbol it checks proves only that the code agrees with itself. [R19]
- A command's exit status is a claim about the command, not about the work, so read the artifact that should have changed. A red exit, an inherited blocker (retest it before repeating it) and a return value (a search that misses returns a sentinel) are the same kind of claim. [R20]
- Verify the instrument before trusting the measurement: the flag took effect, the denominator is the intended population, the control reproduces, the claim you rely on is still true, not remembered. An A/B comparison needs the tree still between arms. Ask a repo's own debugging instrument (a replayer, a profiler) first; a task's first probe names which one answers, or why none does. A rule needed at the moment of writing a probe is enforced then, not read at session start. [R21]
- Anything slow on the critical path is a defect to identify and fix, not a cost to schedule around (owner directive, 2026-09-15). Keep only the slowness a verdict depends on: the expensive gate the team is sized around. [R22]
- Task-run evidence lives only under ignored paths and is deleted once no active task, unresolved issue or handoff needs it; it enters Git only when review promotes it into a repository input (fixture, golden, snapshot, contract). Tracked docs keep plans, authored reviews, conclusions and provenance. Promoted blobs over 256 KiB need a stated reason; over 512 KiB binary or 1 MiB of anything never enter ordinary Git; an asset store or LFS needs the user's approval. [R23]
- Plans and every authored review round go in a permanent `docs/work/<id>_<theme>/` folder (`../fleet/docs/work-docs.md`). Keep a devlog, history not status: a dated line per behaviour-changing session in `docs/devlog/summary.md` (`../fleet/docs/devlog-template.md`). [R24]
- Use the common word where it says the same as the rare one, in chat, docs, commit subjects, PR titles, comments and error messages. One idea per sentence unless a rule needs one line to carry more. Cut length, not facts: keep exact terms, numbers and the evidence a claim rests on. Quotes and pastes are exempt; do not copy this canon's style. One line per paragraph, no hard wrapping. [R25]
- Error messages are a product surface; check the affected class and adjacent paths. Each names what happened, which input caused it and what would satisfy it, never a bare `Validation failed`. [R26]
- When blocked, hand over the artifact itself, redacted, as soon as the blocker is named, not after the analysis, and continue safe independent work. [R27]
- A repo chooses its language and toolchain (Node, Python and Rust run here), pins the version where its tooling reads it (`.nvmrc`, `requires-python`, `rust-toolchain.toml`) and names it in Gates. Node repos baseline at 24; an older major keeps a CI job proving it. [R28]
- Runtime model calls, vision included, are authorized and paid for. Reviewer model pins live only in `../fleet/docs/skills/multi-cli-review.md`, and a model a product calls is pinned in the repo that calls it; no model ID is hardcoded elsewhere. [R29]
- A standing loop sources its next task by running the artifact as its user does (default entry point, real configuration), never by reading code for something to improve; a repo with no runnable entry point has none. [R30]
- Steering compounds: a direction that outlives its task lands that session, in `../fleet/FLEET.md` if fleet-wide, else in the repo's `docs/policies/local-rules.md`, and you say where. [R31]
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
