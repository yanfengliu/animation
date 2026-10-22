# Review 1: integration

## Target

Repository `animation`. The target is repair round 1 of review round 0's findings, as integrated on `main`: `git diff 8dc6893 6adc5b8`, limited to the code and the repo docs that describe it.
- In scope: `index.html`, `scripts/`, `tests/`, `AGENTS.md` outside the fleet canon block, `README.md` and `docs/learning/defect-register.md`.
- Out of scope: `docs/work/` (the plan and the review records) and the canon block (`AGENTS.md:28–84`). Only the owner's canon sync `850af3b` changed that block, which is byte-identical at `850af3b` and `6adc5b8` (sha256 `eba8c176`).
- The repairs landed in four milestones: R1a `2748bef` (W19), R1b `b089b37` (W20), R1c `0a1329b` (W21) and R1d `6adc5b8` (W22). `main` and `origin/main` are at `ac61145`, which adds only the plan's R1d notes on top of `6adc5b8`.
- The reviewed diff is `tmp/review-runs/wu1-round1/target.diff` (ignored; 15 files, 1,857 lines, sha256 `810878d0`). It holds `git diff 850af3b 6adc5b8 -- AGENTS.md`, then `git diff 8dc6893 6adc5b8` of the other paths. The `AGENTS.md` part is the `8dc6893` diff without the canon block's two changed lines. So the target is recoverable from those commits.
- Both reviewers read the exact bytes of `6adc5b8` in a clone at `tmp/review-runs/wu1-round1/tree-6adc5b8/` (ignored).
  - It is detached at `6adc5b8` with no refs, and it holds `ac61145` (fetched, for the plan's R1d notes).
  - All 40 tracked files equal the `6adc5b8` blobs byte for byte (LF), before and after both runs.
  - Its ignored `tmp/` held a copy of the diff, plus 214 copies of the workers' evidence: the status notes `tmp/w19-status.md` to `tmp/w22-status.md`, and the logs, probe scripts and measurement tables of `tmp/w19/` to `tmp/w22/`. Render caches, screenshots and page copies were left out.
- The full mutation proof was running in the primary checkout throughout both runs, so the reviewers had no full-proof log for this code. Neither reviewer ran a test, a browser or a probe.

## Reviewers and coverage

Codex ran, and its report passed the runbook's checks.
- codex-cli 0.163.0. The runbook requires 0.156.1 or later, and the newest build it records as tested is 0.158.0, so this build was smoke-tested first.
- The runbook's diff form: `codex exec --model gpt-6-astra -c model_reasoning_effort=xhigh -c approval_policy=never --sandbox read-only --ephemeral -o …`, with the prompt as the argument and the diff on stdin. It ran from the clone, with the user config loaded (no `--ignore-user-config`). No other `codex exec` was running; only the desktop app's own servers were.
- Model: the run header names `gpt-6-astra`, reasoning effort xhigh and sandbox read-only.
- DLL markers: the run produced neither `STATUS_DLL_INIT_FAILED` nor `-1073741502`. The stdout holds both strings twice, but only inside lines of round 0's record that Codex printed while reading it.
- Citations: every finding cites a file and line. Six citations outside the diff's hunks were checked against the clone, and all hold:
  - `index.html:1058` (the `hashchange` exit) and `index.html:798–815` (the draw ranges and ONE/ONE blending);
  - `tests/run.mjs:17–24` (the phases) and `tests/page.test.mjs:298–328` (the font-hang check);
  - `scripts/shoot.mjs:205–218` (readiness, then a separate view read; X3) and `tests/illusion.test.mjs:65–67` (the seeds 4–12 claim; X4).
  - X4's `AGENTS.md:193` ("left to R1d") and `docs/learning/defect-register.md:100` (1.45) hold too.
- Run: 22 min 35 s (08:23 to 08:46), 293,380 tokens and 25 read-only shell commands. Codex shows neither turns nor cost. Its context was compacted once, after 18 of the 25 commands.
- All 25 commands were screened after the run. They were PowerShell `Get-Content`, `Get-ChildItem` and `Select-String`, `rg`, and git (`status`, `rev-parse` and `show`). Git at first refused the clone as owned by another user, and Codex then added `-c safe.directory=<clone>` itself, as in round 0.
  - Each one ran in the clone with repo-relative paths, and none named a path outside it.
  - None ran npm, npx, Node, a test or a browser, and there were no MCP tool calls.
  - The sandbox denied git's own lookup of the user's global ignore file (`~/.config/git/ignore`; two warnings). That is git reading its configuration, not a review read.
- One subagent spawn failed ("collab spawn failed … no rollout", as in round 0, probably because `--ephemeral` keeps no rollout). So no subagent contributed, as the report says.
- The read smoke test (runbook item 2) ran from the clone before the review. It returned `START` and the third message with the right lines (`:15` and `:9`), with no DLL markers.
  - Its first try returned the same answer but could not write `-o`. The driver had passed an MSYS path (`/c/…`), which `codex.exe` cannot resolve with path conversion off. The review run used a Windows path.

Claude ran, and its report passed the runbook's checks.
- claude 2.1.308. The runbook requires 2.1.280 or later, and its `modelUsage` check was proven on 2.1.281.
- The runbook's diff form: `claude -p --model "claude-opus-5-5[1m]" --effort max`, with the prompt by `--append-system-prompt` and the diff on stdin.
- Login check, with round 0's correction: from a neutral empty folder, with every tool disabled (`--tools ""`, a flag the installed CLI documents) and no MCP servers. The one-word prompt answered in one turn ($0.03), and `modelUsage` held exactly `claude-opus-5-5[1m]`.
- Isolation. The reviewer worked in the clone, with `--tools "Read,Glob,Grep,Task,Bash"` and the runbook's allow list (`Read,Glob,Grep,Task,Bash(git diff *),Bash(git log *),Bash(git show *)`). `--permission-mode dontAsk` denies anything not pre-approved, and `--strict-mcp-config` loads no MCP servers. A deny list blocked:
  - edits, writes and web tools;
  - shell readers such as `cat`, `rg` and `sed`, plus `npm`, `npx` and `node`;
  - git forms that reach elsewhere (`git -C`, `git -c`, `--git-dir`, `--work-tree` and `--no-index`);
  - reads of the primary checkout outside the clone, this review's captures, `~/.claude`, `~/.codex`, the session temp folders and the fleet repo.
- A permission smoke test confirmed the setup before the run (low effort, 13 fixed steps, $0.82):
  - allowed: reads inside the clone, and git in it;
  - denied: reads of the primary checkout, by absolute path and by a `..\` path, reads of `~/.claude`, and `cat` and `git -C`;
  - a `general-purpose` subagent with no model ran on the pinned model, so `modelUsage` still held one key.
- The CLI also loads `CLAUDE.md` files from the clone's parent folders, as every session in this repo does. Those are the primary checkout's `CLAUDE.md` and `AGENTS.md`, and the github folder's `CLAUDE.md` and `AGENTS.md`. The primary's `AGENTS.md` was byte-identical to the clone's (sha256 `0320b904`), and its `CLAUDE.md` differed only in line endings. This is the harness's load, not a reviewer read.
- Model: the init event named `claude-opus-5-5[1m]`, and `modelUsage` held exactly one key, `claude-opus-5-5[1m]`.
- Run: 100 turns, $12.34 and 30 min 27 s (08:19 to 08:50), with no subagents. It ran beside the Codex lane.
- Transcript audit: 99 tool calls, all inside the clone, so none read the primary checkout.
  - The calls were 55 Reads, 29 Greps, 4 Globs and 11 git commands (`git show`, `git log` and `git diff`).
  - All 84 path arguments were inside the clone, and every git command read the clone's own repository.
- Two calls failed:
  - the first call, `git show … | wc -l; git log …`, was denied for `wc`;
  - a Read of `tmp/w20/mutate-r1b.log` exceeded the 25,000-token read limit, so the reviewer read that log in parts and with Grep instead.
- Citations: every finding cites a file and line. Six citations outside the diff's hunks were checked against the clone, and all hold:
  - `index.html:551` (`autoplayed`), `:923–927` (where it turns true) and `:858` (the tour ends idle);
  - `index.html:565` (the `textof` line that the `textof-ignored` mutant replaces);
  - `tests/illusion.test.mjs:639` (the "Find the angle" page loads with `tour=0`, through `Q`);
  - `2748bef:tests/sequence.test.mjs:477–488` (C3: before R1c, `s1` was read right after Escape).

Prompts: `tmp/review-runs/wu1-round1/prompt-codex.md` and `prompt-claude.md` (ignored), built from one shared text, `prompt-core.md`. They differ only in logistics: the tools each lane may use, its subagent rule, where the diff comes from and the finding-ID prefix. They ask for an adversarial, report-only review of the target against the plan's acceptance criteria, AGENTS.md's invariants and round 0's dispositions, through six questions:
- round 0's repairs, with F70's "does not hold" verdict and the F67 claim, and any older check weakened without a stated, measured reason;
- the owner's rule against each `index.html` change, and the `relocate` hook with its parameter absent;
- the new or moved bounds and their seeds;
- the mutants;
- flakiness under load;
- the docs: AGENTS.md outside the canon block, README.md and the defect register.

The prompts forbid writes, tests and any browser workload. They ask, for every finding, a file and line at `6adc5b8`, a severity, the round-0 F-ID it concerns or "new", a failure scenario and a fix. Neither lane saw the other's output: neither prompt mentions the other lane, and the clone held no review output. Raw captures are under `tmp/review-runs/wu1-round1/` (ignored).

Independent coverage this round is two lanes. Neither abstained, and neither needed a retry.

## Reports

### Codex (`gpt-6-astra`, effort xhigh), 2026-10-22

Redacted: nothing. The report is Codex's `-o` output, which held no credentials, session details, echoed prompt or transport chatter. Its `##` headings are shown as `####` and its `###` headings as `#####`, so that they nest under this section. Nothing else is changed.

#### Summary

**4 findings: 0 critical, 1 major, 3 minor.**

The page repairs appear correct, and I found no new violation of the owner’s rendering rule. Most round-0 repairs are complete within their stated bounds. The budget gate has a false-pass gap; two timing risks and several stale documentation claims remain.

#### How I checked

I read the supplied diff, surrounding implementation and test code, the round-0 reports and dispositions, the latest plan through `ac61145`, the required policy and learning files, all four worker status notes, and the saved test, mutation and measurement evidence.

I worked directly; an attempted subagent dispatch was unavailable. I changed no files and ran no tests, page code or browser workload. The scenarios below are code-based deductions unless identified as saved measurements. I could not inspect the omitted screenshots, reproduce measurements, or review the still-running full proof.

#### Findings

##### X1 — The budget replay does not preserve the state used by each draw

- **Location:** `tests/page.test.mjs:171`, `tests/page.test.mjs:185–189`
- **Severity:** major
- **Relation:** F76 repair

The probe records a program, VAO, offset and count, but no uniforms. It suppresses the original draw and later replays it using whatever uniform values remain then.

A concrete escape is a DPR-2 sizing correction implemented through a temporary point-size multiplier: set it to `1.25`, draw the particles, then restore it to `1`. The shipped frame uses the larger sprites; the probe replays with `1`. That can reproduce the budget-breaking size increase demonstrated by `bigger-sprites` while the budget gate measures baseline sizes. The DPR-1 image gates would not exercise a DPR-2-only change.

The present page leaves its relevant uniforms unchanged after drawing, so this does **not** establish that today’s recorded measurements are wrong. It establishes that the gate does not reliably measure each recorded draw.

**Suggested fix:** perform transform feedback at the intercepted draw, or preserve and restore all relevant per-draw state. Add a mutant that changes a sizing uniform for a draw and restores it afterward.

##### X2 — Sequence hold shots retain the expensive, fragile timing path removed by F65

- **Location:** `tests/sequence.test.mjs:195–208`, `tests/sequence.test.mjs:503`
- **Severity:** minor
- **Relation:** new robustness issue in F50’s repair; the same class as F65

`shootAt` waits at least 1.5 s into a 3 s hold, takes a full screenshot, decodes it synchronously, and only then reads the ending state. There is no retry for a missed hold.

A healthy page can fail if screenshot latency or host scheduling consumes the remaining hold. Decoding can also push the ending read beyond the hold even when the captured image was valid.

The saved R1c run demonstrates this failure path: an extra-text-pass mutant’s capture shot spans **1,783.5 ms**, ending after the camera starts toward the face (`tmp/w21/mutate-r1c.log:32–33`). Its other checks correctly kill the mutant; this additional “kill” is a timing miss.

**Suggested fix:** apply the F65 approach here: capture only the compared region, read ending state before decoding, and allow a bounded fresh-page retry for a missed window. Preserve the dwell and pixel thresholds.

##### X3 — The screenshot tool’s “first frame” is an unlatched later sample

- **Location:** `scripts/shoot.mjs:205–218`, `scripts/shoot.mjs:227–234`
- **Severity:** minor
- **Relation:** F59 repair

The tool waits for readiness and then separately evaluates the current view. Nothing preserves the first ready frame.

For `msg=world capture=1`, a delay exceeding the initial 2 s hold before that evaluation lets the camera move toward hello world. The tool then reports that `msg=world` did not take, despite correct initialization. The equivalent window for an ordinary tour is 1.5 s.

Moving this read before the requested screenshot wait fixes the original ordinary case, but does not justify the “first frame” claim or eliminate the race.

**Suggested fix:** latch the view in an init-script frame observer when readiness first becomes true, then validate that recorded view.

##### X4 — Documentation still mixes old values and overstates seed coverage

- **Locations:** `docs/learning/defect-register.md:100`, `AGENTS.md:193`, `tests/illusion.test.mjs:65–67`
- **Severity:** minor
- **Relation:** F75 repair, with stale F70 status

Three claims remain inconsistent:

- The defect register says `MIN_LIFT` is **1.45**; the gate uses **1.51** (`tests/illusion.test.mjs:102`).
- AGENTS says checking `textof` is “left to R1d,” although R1d’s result is already recorded at `AGENTS.md:114`.
- The illusion header says **every bound** was checked on seeds **4–12**. The new clipping and own-message light bounds document measurements only through seed **6** (`tests/illusion.test.mjs:112–114`).

These can mislead a maintainer about the operative threshold and the breadth of verification.

**Suggested fix:** reconcile the current values and F70 status, and state calibration and verification seeds per bound instead of making the blanket seed claim.

#### Answers

##### 1. Round-0 repairs

| Finding | Assessment |
|---|---|
| **F49** | Correct: every Find click now checks glide targets and the actual landing, including the wrap and `msg=a` case (`tests/sequence.test.mjs:344–380`). |
| **F50** | Required coverage is present: all six capture holds, plus the face hold in Play and the load tour. Pixel comparisons and state guards are appropriate; X2 remains (`tests/sequence.test.mjs:267–275`, `:492–509`). |
| **F51** | Correct within the documented **light-only, β 0.2** scope. Each message is isolated in both sides of the comparison (`tests/illusion.test.mjs:501–510`, `:551`). |
| **F52** | Correct: the omitted-pixel fraction is bounded and the blue-tint mutant exceeds it. This does not eliminate the explicitly documented blind spot within clipped pixels (`tests/illusion.test.mjs:112`, `:555`). |
| **F53, F63** | Correct: masks are built at the away view, with every other eye, both adjacent midpoints, antipodes and far views represented (`tests/illusion.test.mjs:175–185`, `:444–464`). |
| **F54, F64** | Correct: the reason for the relative bound is documented; an absolute bound is restored alongside it. The density mutant now keeps approximately the intended counts, and `hello-world-weight-2` reaches `STREAK_K` (`tests/illusion.test.mjs:131–139`, `:580–585`; `tests/mutate.mjs:97–101`). |
| **F55** | Correct: capture suppresses the canvas focus outline, and a real Tab press is compared visually (`index.html:66`; `tests/sequence.test.mjs:305–324`). |
| **F56** | Correct for the requested Play/capture mid-glide cases: the camera cuts to the pending target, then starts its cut hold (`index.html:1060–1072`; `tests/sequence.test.mjs:437–466`). |
| **F57, F66** | Correct: capture checks a prefix ending at its first return to hello world. The saved `tour-restarts` kills now concern load-tour termination and restart after input, not capture-log overrun (`tests/sequence.test.mjs:520–532`; `tmp/w21/mutate-r1c.log:37–41`). |
| **F58** | Correct: launches use `allSettled`, successful launches are closed before propagating a launch failure, and final cleanup closes the retained browsers (`tests/sequence.test.mjs:249–260`, `:280`). |
| **F59** | Ordinary delayed-shot case repaired; the initial-state sampling race remains as X3. |
| **F60** | No contradiction. Editing the address remains a deliberate exit through `hashchange`; the disposition explicitly permits that (`index.html:1058`). |
| **F61** | The four requested mutants exist and exercise Escape, continued playback, normal Play gliding and reduced-motion cutting (`tests/mutate.mjs:208–215`). |
| **F62** | Correct: five separate Find landing pages, real clicks, arrival and dwell shots, and URL references are present (`tests/sequence.test.mjs:223–245`, `:273–275`). |
| **F65** | Correct in the illusion test: clipping preserves the previously compared region; state reads surround the screenshot, decoding follows them, and the dwell is unchanged (`tests/illusion.test.mjs:630–635`, `:674–695`). |
| **F67** | Correct as a statement about logged frames: after the first non-current target, every remaining target must be exactly the next message, and their timestamp span must be at most 100 ms (`tests/sequence.test.mjs:151–152`). |
| **F68** | Correct: the eye-to-adjacent-midpoints comparison catches the smaller 15% glow independently of clipping (`tests/illusion.test.mjs:539–550`; `tmp/w22/mutate-r1d-2.log:5–7`). |
| **F69** | Requested capture and contract mutants are present; `textof` is covered by R1d (`tests/mutate.mjs:238–253`, `:272–276`). |
| **F70** | The revised “does not hold” verdict is supported. The saved mutant has **8 CHECK failures among 13 illusion tests**. Its additional timeout is an ERROR, not part of that proof (`tmp/w22/mutate-r1d.log:57–76`; `ac61145:docs/work/1_sentence-sequence/plan.md:167`). |
| **F71** | Correct: guarded same-document anchor removal, re-entry and blocked-history behavior are covered (`index.html:905–909`, `:1016`; `tests/sequence.test.mjs:327–342`, `:535–563`). |
| **F72, F73** | No new contradiction. Particle motion still does not become periodic with the camera loop; the existing sight-line stillness behavior remains. Both owner decisions remain open (`index.html:637–644`, `:775`, `:857–859`). |
| **F74** | Correct within the plan’s disclosed substitute-font scope. Actual DM Mono remains unverified offline (`tests/page.test.mjs:81–146`; `AGENTS.md:237`). |
| **F75** | Threshold and most comments repaired; X4 remains. |
| **F76** | The limits and current measurements are meaningful, but X1 prevents treating the replay as a reliable per-draw budget instrument. |

I found **no unexplained weakening** of an older check in these repairs. Notable changes have stated measurements: replacing the old hiding masks, using seed 1 at midpoints, retaining relative streak bounds beside the new absolute bound, and reducing the glow mutant from 20% to 15% to isolate the new check. Clipping the illusion screenshots preserves their old comparison region.

##### 2. Owner’s rendering rule

I found no repair that changes shipped particle light, colour, size or focus, or adds an angle-dependent reveal.

The focus and readout changes affect CSS; reduced motion changes the camera path; anchor removal changes navigation state.

With `relocate` absent, `findIndex` returns `-1`, so its new branch never runs. No random call is added. The pick and home streams, per-message landing streams, assignment probabilities and particle ordering remain unchanged (`index.html:451–453`, `:459–500`, `:515–531`).

With a valid `relocate` value, separate landing streams preserve the selected message’s particles and destinations while other selected owners remain ambient.

The shipped draw still covers exactly the two disjoint text and ambient ranges, with the same shader and ONE/ONE blending (`index.html:798–815`). Exact screenshot addition remains subject to the documented SwiftShader/dithering bound.

##### 3. New or moved bounds

The saved measurements separate the page from the named mutants:

| Bound | Page versus mutant; seed scope |
|---|---|
| **`MAX_GHOST_LIFT = 1.33`** | Page maximum **1.269** for the gated means; further groups reach **1.297**. Half-depth world reaches **1.376**. Gate uses seed 1 at eyes/midpoints, means 1–3 elsewhere, and mask seed 8. Further-group probes use independent masks 13–15 (`tests/illusion.test.mjs:107`, `:175–185`). |
| **`MAX_CLIPPED = 0.08`** | Page maxima **0.0692/0.0697** through seeds 1–6; blue mutant **0.109**. It bounds pixel count, not the omitted light—32% of text light at E remains outside the colour comparison (`:112`). |
| **`MAX_EL_STREAK = 1.9`, absolute `2.35`** | Relative page maxima in further groups **1.39/1.71**; absolute **1.90/2.24**. Upright-in-layers gives absolute **2.838/2.698**, while passing the relative bound. Means 1–3 gate; groups through 12 measure redraw variation (`:131–139`). |
| **`SCENE_RING_BAND = 0.95–1.03`** | Page **0.976–1.003** across seeds 1–12; 15% glow **1.114** at E. Gate itself uses seed 1, t 0 (`:122`, `:539–550`). |
| **`MIN_LIFT = 1.51`** | Page **1.532–2.046**; weak relocation **1.308–1.498** across the measured seeds 1–12. The separation is real but narrow (`:102`). |
| **Own light at β 0.2, `0.95–1.12`** | Page **1.009–1.057** through seeds 1–6; only-a reveal **1.253**. Lower β avoids the much larger saturation loss at default β (`:113–114`). |
| **48,000 particles; `MAX_OVERDRAW = 3`** | Page **2.72–2.95×**; bigger sprites **4.25–4.61×**; 60,000 particles **3.38–3.66×**. Only the stated default-zoom views are measured. Instrument caveat: X1 (`tests/page.test.mjs:151–152`, `:215–227`). |

Seed independence is sound within the ghost measurement: the tested cloud does not choose its own mask. However, seeds 4–12 should not universally be presented as untouched validation data. In particular, the selected `MIN_LIFT` uses the reported 1–12 separation, and clipping/own-light measurements stop at 6. X4 addresses the blanket header claim.

Plausible escapes remain within the declared limits: intermediate angles or times, sufficiently small or broad scene glows, per-message colour/size changes diluted by the whole layer, and reveals conditional on default β rather than β 0.2. Healthy redraws can also cross these tight empirical bounds; the remeasurement instructions are appropriate.

##### 4. Mutants

I found no new or changed mutant whose saved result relies **only** on wholesale breakage or an unrelated check.

Several legitimately fail multiple checks. That is not duplication:

- Half-depth world is a narrower geometry defect than squeezing all later messages.
- Upright-in-layers demonstrates why the absolute streak bound is needed despite the relative bound.
- The final 15% scene glow isolates the ring check; the earlier 20% version also exceeded clipping.
- `textof-ignored` has eight substantive assertion failures despite an additional timeout.

The extra-text-pass run has an **additional wrong-reason timing failure**, described in X2, alongside valid identity and budget failures.

The new checks are not all individually mutation-proven. In particular, no mutant isolates the **100 ms tail limit or exact-next-only condition** at `tests/sequence.test.mjs:151–152`. Nor does one isolate the new Find requirement that the target remain correct throughout every glide, independently of landing position. Browser-launch cleanup and the screenshot tool’s initial sampling are infrastructure changes without injected-failure proof. I found no completely new top-level test lacking an intended killing mutant.

##### 5. Flakiness and timing windows

- **Sequence hold shots:** X2 is the main remaining risk. Full-frame capture and decode still consume a finite hold window.
- **Find landings and dwell:** waiting until all hold shots finish avoids their previous contention. Idle landings have no closing deadline. The dwell is measured from the first logged resting frame, not from screenshot completion (`tests/sequence.test.mjs:184–231`, `:273`). Scheduling can delay the nominal arrival shot.
- **Illusion tour shot:** materially improved. It requires both 6,600 ms since the first frame and 1,500 ms since arrival, checks both endpoint states and retries once. Severe delays can still fail safely (`tests/illusion.test.mjs:674–710`).
- **Font hang:** separating phases removes the demonstrated sequence contention. Simultaneous loads still do not guarantee equal scheduling or GPU service, so the 2 s difference can fail a healthy page under unequal load. Conversely, baseline slowness can hide some font-specific delay. This is an inherited limitation of comparing total load times (`tests/page.test.mjs:298–328`).
- **Phases:** implemented as documented, and shared by normal and mutation runners (`tests/lib/phases.mjs:10–18`; `tests/run.mjs:17–24`).
- **100 ms tail:** correct for sampled timestamps. It does not bound an unsampled interval after the last frame. Very sparse frames can also shorten the observed hold below its minimum. The header explicitly excludes general slow-frame-rate behavior.

The image timing windows can miss transient reveals before or after the shots; AGENTS now states that limitation rather than claiming continuous coverage.

##### 6. Docs

Apart from X4 and the instrument/timing qualifications above, the updated documentation largely matches the code.

I counted **47 tests** and **116 mutants: 93 page, 23 tree**. The saved final logs support the reported approximately 200 s total. The phase grouping, six sequence browsers, picture scheduling, query parameters, frozen `window.__cloud` interface and DOM IDs agree with implementation (`AGENTS.md:92–107`, `:173–193`, `:263`; `index.html:558–600`).

README correctly describes capture focus suppression, guarded anchor removal and the Play/capture reduced-motion cut (`README.md:18–25`). Its recording wording does not resolve F72’s outstanding distinction between a continuously looping camera and an exported video with a seamless particle-motion seam.

The defect register’s updated views and bands generally agree with the tests, but its `MIN_LIFT` value remains stale.

#### Read outside the diff

These unchanged ranges informed the review:

- `index.html:633–667` — particle motion, size, focus and colour.
- `index.html:775–895` — draw state, additive ranges, animation and sequence progression.
- `tests/lib/image.mjs:90–252` — masks and light measurements.
- `tests/lib/harness.mjs:54–143` — readiness, rendering and waits.
- `tests/page.test.mjs:298–329` — paired font-hang check.
- `tests/sequence.test.mjs:384–434` — existing Play and reduced-motion pattern checks.

### Claude (`claude-opus-5-5[1m]`, effort max), 2026-10-22

Redacted: nothing. The report is the `result` field of the run's final event, which held no credentials, session details, echoed prompt or transport chatter. Its `##` headings are shown as `####` and its `###` headings as `#####`, so that they nest under this section. Nothing else is changed.

I found no critical problems, 1 major and 6 minor. The repairs are correct, but one gate gap is left, and some robustness and doc problems.

#### Summary

- **Repairs:** all 26 of round 0's accepted repairs (F49–F59, F61–F76) do what the record's "Repair or follow-up" column and the plan's R1a–R1d notes say. I agree with F70's "does not hold" and with F67's claim. The code contradicts none of F60, F72 or F73.
- **Owner's rule:** none of the `index.html` changes alters how particles render or depends on the camera angle. The `relocate` hook changes nothing when its parameter is absent. The shipped draw is still exactly the text draw plus the ambient draw.
- **Major gap:** the load tour's end state, where every untouched visit comes to rest (idle at "world"), is never imaged. Every rest picture loads with `tour=0`, so a reveal that needs the tour to have played passes every gate (C1).
- **Minor:** fragile hold shots in the sequence pictures (C2), one check weakened without a stated reason (C3), stale docs (C4), over-claims (C5), two alike bounds that trip on changes that render every particle alike (C6), and reduced motion not cutting a "Find the angle" glide (C7).

#### How I checked

- **Plan:** `git diff 6adc5b8 ac61145` for the R1d notes, plus the working copy (lines 1–175).
- **Review record:** read in full.
- **Docs:** AGENTS.md (lines 16–19 and 86–268), README.md, lessons, defect register, local rules.
- **Code:** `index.html` lines 1–180 and 356–1098, and every changed file at `6adc5b8` in the ranges listed at the end. I compared milestones with `git show`, `git diff` and `git diff -U0`.
- **Evidence (treated as claims):**
  - `tmp/w19-status.md` to `tmp/w22-status.md`;
  - the R1a–R1d mutation logs and W21's aborted and red-control runs;
  - W22's `npmtest-1..3.log` diagnostics;
  - `tmp/w22/lift.txt`, `ring-real-1-12.txt` and `glow.txt`;
  - the W20 and W21 digest comparisons.
- **Method limits:** I used no subagents and ran nothing. Grep skips the ignored `tmp/` folder when searching a directory, so I read those files by exact path.
- **What I could not check:** any pixel claim; DM Mono's real widths; real-GPU cost. No full-proof log exists for `6adc5b8`. The surviving mutant in C1 is reasoned from the code, not run.

#### Findings

##### C1 — major — new (left over from F50 and F62): the tour's end state is never imaged

- **Where:**
  - the tour picture page closes after the face's hold: `tests/sequence.test.mjs:269`;
  - every picture that rests at an eye loads with `tour=0`: `tests/sequence.test.mjs:226` (Find), Play's page, the references, and `tests/illusion.test.mjs:639` (its glide);
  - `autoplayed` turns true only when the tour or capture mode starts: `index.html:551` and `:923–927`;
  - the tour ends idle at "world": `index.html:858`;
  - not listed as a gap in AGENTS.md:220–222 or `docs/learning/defect-register.md:122`.
- **Problem:** once the load tour stops, the camera rests at "world", and every visitor who does not interact stays there. No gate shoots that state. The holds are shot only in mode `tour` (the face's in the sequence file, hello world's in the illusion file). Every idle-at-an-eye picture comes from a page where the tour never ran.
- **Failure scenario:** a "finale" mutant, `[TEXT_DECL, NEAR_UNIFORM, nearSet("autoplayed && mode === 'idle' && atMessage() === 5 ? 1 : 0"), TEXT_BRIGHTER]`, makes the text 1.25× brighter at "world" once the tour has finished. By my reading it passes every test.
  - The same holds for `... && atMessage() >= 0`, which reveals at any eye after the tour, including a "Find the angle" landing.
  - `reveal-after-dwell-later` also fires there, but it is only ever seen on `tour=0` pages.
- **Fix:**
  - Keep a 640×400 `?t=0` tour page running until the tour ends.
  - Shoot it idle at "world" on arrival and again `DWELL_MS` later, against `msg=world&t=0&tour=0`, and optionally after one "Find the angle" click.
  - Add a `reveal-after-tour-ends` mutant.
  - Alternatively, list this state in the Bound and in the defect register.

##### C2 — minor — F50 and F62 (robustness, fails safe): hold shots have no slack to spare and no retry

- **Where:** `tests/sequence.test.mjs:195–209` and `:496–507`.
- **Problem:** each hold shot must start at least 1.5 s into a 3 s hold and finish before the hold ends. The timed window holds two state reads, a full-frame screenshot, and the PNG decode between the reads (`:205–207`). There is no retry. Under load, both the start and the shot slip:
  - W21's red control: capture mode at the face read 15,988 → 16,522 ms with the camera already gliding to "What", and the tour read 14,798 → 15,988 ms (`tmp/w21/mutate-r1c-control-red.log:29`);
  - the R1c mutation run: `reveal-extra-text-pass`'s capture shot at hello world took 7,466 → 9,249 ms, 1.78 s (`mutate-r1c.log:33`);
  - the final runs on this 32-thread machine took 109–457 ms.
- **Failure scenario:** on a slower machine, or with a legitimately heavier draw, a healthy page fails this test. `npm test` goes red and `tests/mutate.mjs` stops at its control (exit 2). Because a miss is an assertion, a mutant that only slows rendering also counts as "killed" by it, as one of `reveal-extra-text-pass`'s three kills was.
- **Fix:**
  - do what R1d did for the tour shot (`tests/illusion.test.mjs:630–635` and `:680–683`): clip to `CENTRE` and decode after the second read;
  - retry a missed hold once on a fresh page, or at the next capture pass;
  - report a double miss as an Error, not a check;
  - log the slack.

##### C3 — minor — new (R1c's test change for F71): the "camera stops" check now starts 0.3 s late

- **Where:** `tests/sequence.test.mjs:535–548`. Before R1c: `2748bef:tests/sequence.test.mjs:477–488`.
- **Problem:** R1c added `await sleep(300)` between the Escape press and `s1`, to let a reload show. So "the camera stops" is now checked from 0.3 s to 1.3 s after Escape, not from the press. No reason is given for moving that window.
- **Failure scenario:** an Escape that lets the current glide run on, or ease out, for up to about 0.3 s now passes. At `2748bef` it failed.
- **Fix:** read `s1` right after the press, then sleep and check `__sameDocument`.

##### C4 — minor — F70 and F75: two lines went stale in R1d

- AGENTS.md:193 still ends "Whether `textof` takes effect is left to R1d (F70)". R1d settled it: AGENTS.md:114 and `tests/mutate.mjs:269–273`.
- `docs/learning/defect-register.md:100` still says the lift must be "at least 1.45×". `MIN_LIFT` has been 1.51 since R1d (`tests/illusion.test.mjs:102`).
- **Fix:** update both lines.

##### C5 — minor — docs and headers that claim more than the code or the measurements

- **README.md:19**, "so a screen recorder can capture a clean loop". F72 is still open: one recorded pass, looped as a video, jumps at its seam, because the particles' swell does not repeat and the first pass starts from the start view.
- **`tests/illusion.test.mjs:65–67`**, "every bound sits between the real page and its mutants … checked for seeds 4–12". `OWN_LIGHT_BAND` and `MAX_CLIPPED` were measured on seeds 1–6 only (`:112–114`), and the lower edges of `OWN_LIGHT_BAND` and `SCENE_RING_BAND` have no mutant.
- **`defect-register.md:91`**, "cannot glow up near an eye by 5.5% or more". That holds only for a glow that fades out by 12°; the register's own line 127 and AGENTS.md:218 say a wider glow passes.
- **AGENTS.md:190**, landing shots "may take 1 s". They took up to 1.69 s (`tmp/w22/npmtest-1.log:134`).
- **AGENTS.md:216** says nothing about how much light passes the per-message band. Its upper edge, 1.12, sits above the page's 1.020 (hello world) to 1.056 ("beautiful"), so a reveal of about 6–10% in one message's particles passes, and the whole text layer dilutes it further.
- **AGENTS.md:18**, "only Escape ends it", is unscoped, while `index.html:1058` also ends capture mode on any change of the hash. F60's rejection relied on the docs scoping "only Escape" to inputs; AGENTS.md:265 and README.md:21 do, this line does not.
- **Fix:** reword these lines to match the code and the measurements.

##### C6 — minor — new (fails safe): two alike bounds trip on changes that keep every particle alike

- **Where:** `tests/illusion.test.mjs:112–114`, `:551` and `:555`.
- **Problem:** `OWN_LIGHT_BAND` and `MAX_CLIPPED` partly measure the 8-bit cap, not a difference between text and ambient particles:
  - `bigger-sprites` (every sprite wider) reads own light 1.125–1.166 and clips 8.7–13.0% (`mutate-r1c.log:164`);
  - `more-particles` clips 8.1% at E and 9.3% of the as-ambient image at "What"'s eye (`:158`);
  - a uniform 1.2× glow clips 8.1% at E (`mutate-r1d.log:55`).

  The page sits at 6.97% against the 8% bound, and at 1.057 against 1.12.
- **Failure scenario:** a healthy change within budget, such as a 20% brighter palette, fails "every particle renders alike". The failure reads like a reveal, which invites a retune or a wrong diagnosis.
- **Fix:** say so beside the constants and in AGENTS.md. If the bias grows, draw the as-ambient particles on their own instead of as the difference of two dense renders.

##### C7 — minor — new (same class as F56): reduced motion does not cut a "Find the angle" glide

- **Where:** `index.html:1064`, `if (!reduced || !seq) return;`.
- **Problem:** reduced motion switched on during a "Find the angle" glide (2.2 s), a snap (0.9 s) or a coast lets that move run on. README.md:25 says the page "never glides" with reduced motion on. Only the sequence file's header (`:74–75`) mentions this case, as unproven.
- **Failure scenario:** a viewer clicks "Find the angle" and turns reduced motion on: the camera keeps gliding for up to 2.2 s.
- **Fix:** in the handler, also land a running glide or snap at its target and drop any coast, and test it the way F56 is tested.

#### Answers

##### 1. Round 0's repairs

**Correct and complete as described:** F49–F59, F61–F66, F68, F69, F71, F74 and F76. The kills match the mutants:

- `find-lands-on-hello-world`: `mutate-r1a.log:40–42`;
- the three `reveal-in-*` mutants: 0.116–0.153;
- `reveal-only-a`: 1.253;
- `reveal-blue-clipped`: 10.9%;
- flat text now fails the ghost check at every neighbour, eye and midpoint (`mutate-r1b.log:39`), and `world-depth-halved` reads 1.376;
- `hello-world-weight-2`: 1.863;
- `upright-in-layers` passes the relative streak bound and fails the absolute one.

**F75** was done as specified, except that R1d left the defect register at 1.45 (C4).

**F70, "does not hold":** I agree. The mutant replaces `index.html:565` with `const textOf = -1`, which is exactly a page that ignores `textof`. It fails 8 of the 13 tests by checks, plus one Error (`mutate-r1d.log:57–76`). The ghost check passes it, because a mask drawn from all six messages' smears dilutes even the eye's own strokes below 1.33. So the hiding gate relies on `textof` working, and the checks at the eyes prove that it does.

**F67:** I agree. At `tests/sequence.test.mjs:151–152`, only a tail of the hold may name another message, every frame of it must name exactly the next one, and it may span at most 100 ms from its first logged frame to the hold's last.

**F60, F72, F73:** the code agrees with all three. The docs do not quite (README.md:19 and AGENTS.md:18; see C5).

**Weakened checks:**

- **Without a stated reason:** only C3.
- **With a stated and measured reason:**
  - hello world's midpoints are now read at seed 1 only (`illusion.test.mjs:170–173`: at most 1.174, and at most 1.257 for any seed);
  - the 100 ms rule for a hold's last frames (W19's flake, two frames);
  - the capture-loop check reads only the first pass (F57);
  - the ghost check replaced the old hiding check (more views, stronger against flat text).

##### 2. The owner's rule

- **The changes:** they touch only CSS (`index.html:42–43` and `:63–66`) and camera and address logic (`:905–910`, `:1016`, `:1060–1072`). None alters how particles render or depends on the camera angle.
- **`relocate` when absent:** `only` is −1 (`:451`), so the new `break` (`:486`) never runs. The random streams are drawn exactly as before: `pick` at `:459`, `homes` at `:473`, `lands[k]` at `:489`. `relax` sees the same lists (`:497`), so every particle goes to the same message and the same landing point.
- **`relocate` when set:** the chosen message's particles land on the same points, and every other particle keeps its base position and home direction. So the beta=0 render minus that ambient layer holds exactly that message's particles drawn as ambient.
- **Shipped draw:** `:815` draws [0, N_TOTAL), the union of `:813` (the text range) and `:814` (the ambient range).
- **Digest evidence (claims):** 27 of 27 plan digests and 45 of 45 full shots are identical after R1b and R1c (`tmp/w20/compare-digests.log:28`, `tmp/w21/compare-digests.log:28`). R1d did not touch the page.

##### 3. New or moved bounds

| Bound | Page | Nearest mutant | Seeds | Notes |
|---|---|---|---|---|
| `MAX_GHOST_LIFT` 1.33 | ≤ 1.269 (1–3), ≤ 1.297 in threes; ≤ 1.175 and ≤ 1.174 at seed 1 (≤ 1.257 any seed) | `world-depth-halved` 1.376 | seeds 1–3 and the mutant set it; 4–12 check it | honest; views between the measured ones slip |
| `MIN_LIFT` 1.51 | 1.532 (12 seeds), 1.656 (seed 1) | β 0.2: 1.498, 1.453 at seed 1 | set from 1–12, gated at seed 1 | honest; register stale (C4) |
| `MAX_EL_STREAK_ABS` 2.35 (beside `MAX_EL_STREAK` 1.9) | ≤ 2.24 in threes | 2.396 and up | 1–3 mean | honest |
| `STREAK_K` 1.8 | ≤ 1.52 in threes | 1.863 | 1–3 mean | honest |
| `MAX_CLIPPED` 8% | 6.97% | 10.9% | 1–6 only | trips on changes that keep particles alike (C6) |
| `OWN_LIGHT_BAND` 0.95–1.12 at `OWN_BETA` 0.2 | 1.009–1.057 | `reveal-only-a` 1.253, `world-depth-halved` 1.164 | 1–6 | lower edge has no mutant; C5, C6 |
| `SCENE_RING_BAND` 0.95–1.03 | 0.976–1.003 (12 seeds) | `scene-glows-a-little` 1.114 | seed 1 gated | lower edge has no mutant; a glow that also lights the midpoints passes (disclosed) |
| Budget: 48,000 particles, `MAX_OVERDRAW` 3 | 48,000, 2.72–2.95× | 3.38–4.61×; 60,000; 78,254 a frame | seed 1, 7 views, default zoom | 1.7% headroom at "What"'s eye |

The budget probe overstates the fill (it counts partial squares of points that GL drops, and fragments the shader discards), so it errs on the safe side. Its bounds are stated in AGENTS.md:232–233.

##### 4. Mutants

- **Wholesale breakage:** none. Every mutant kept at least 34 tests green, and none was flagged.
- **Extra kills for another reason:**
  - `reveal-extra-text-pass`'s third kill was a timing miss in the sequence pictures (C2);
  - `play-cuts`'s second kill was the precondition of the reduced-motion switch test (`mutate-r1a.log:76`);
  - `more-particles` and `bigger-sprites` also died at `MAX_CLIPPED` and the own-light band.

  Each of these mutants also dies at the check it names.
- **Duplicates:** none.
- **R1 checks with no mutant that turns them red:**
  - the lower edges of `OWN_LIGHT_BAND` and `SCENE_RING_BAND`;
  - "Find the angle"'s "every glide frame names that message" (`:362`) and "did not glide" (`:361`), which only `find-jumps` would hit, and it has not run since R1a;
  - the 100 ms limit of `NEXT_MAX_MS` (only its "exactly the next message" half goes red, `mutate-r1a.log:20`);
  - the landing from `msg=a` (`:378–380`);
  - re-entry's same-document check and the second Escape (`:557`, `:563`);
  - the "shot started 1.5 s into the hold" guard (`:505`).

##### 5. Flakiness

- **Fragile:** the hold shots (C2).
- **Robust:**
  - the illusion file's tour shot: 1.29–1.31 s to spare, plus a retry;
  - the "Find the angle" landings: the camera has no deadline there, and shots took 0.34–1.69 s;
  - the font-hang check: 0.37–0.57 s against a 2 s margin in the third phase;
  - the phases, in both `npm test` and `tests/mutate.mjs`;
  - the capture Tab test: a 6.5 s still window, about 0.4 s used.
- **Low risk:** the 100 ms tail rule fails only if a frame whose clock still reads within about 5 ms of the glide's start runs 95 ms or more late.
- **One unexplained timeout:** in the `textof-ignored` run, the illusion file's 15 s wait for frames ran out once (`mutate-r1d.log:72–74`). It counted as an Error, there is no retry, and R1b's extra 31 s of renders adds exposure.
- **Broken page passing because of timing:** only the 0.3 s window in C3.

##### 6. Docs

These match the code:

- 47 tests in 13 + 14 + 20 per phase, 43 in the mutation control;
- 116 mutants, 93 page and 23 tree (81 + 10 + 6 + 17 + 2);
- six browsers and up to nine pages in the sequence file;
- the R1 run times and per-mutant times;
- the tour-shot figures (177–196 ms, ending 1.29–1.31 s before the hold);
- the query parameters including `relocate`, `window.__cloud` and the DOM ids.

The exceptions are C4, C5, and the Bound's missing tour-end state (C1).

#### Read outside the diff

- `index.html:1–180`, `:356–448`, `:452–530`, `:534–600`, `:603–817`, `:819–904`, `:912–1057`, `:1074–1098`
- `tests/lib/harness.mjs:1–145`; `tests/lib/image.mjs:124–160`, `:228–254`, `:265–327`; `tests/lib/messages.mjs:1–31`; `tests/run.mjs:1–29`
- `tests/illusion.test.mjs:140–160`, `:198–339`, `:467–496`, `:516–521`, `:589–601`
- `tests/sequence.test.mjs:100–131`, `:163–180`, `:282–303`, `:384–435`, `:469–490`
- `tests/page.test.mjs:36–80`, `:230–307`
- `tests/mutate.mjs:1–192`, `:390–482`
- `scripts/shoot.mjs:1–60`, `:170–249`
- `2748bef:tests/sequence.test.mjs:477–488` (through `git diff -U0`)

## Findings and disposition

Stable IDs continue from round 0 (F49–F76). Both lanes agree that no `index.html` change breaks the owner's rule, that the `relocate` hook does nothing without its parameter, that the shipped draw still equals the text draw plus the ambient draw, and that F67 and F70's verdicts stand.

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F77 | Codex X1 (major), F76's repair: the budget probe replays each recorded draw later, with whatever uniforms are set then, so a draw that raises a sizing uniform and restores it escapes the fill bound (`tests/page.test.mjs:171`, `:185–189`). | Accepted. | R2b: measure each draw with the state it was drawn with, and add a mutant that raises a sizing uniform 1.25× for one draw and restores it. |
| F78 | Claude C1 (major), a gap left by F50 and F62: nothing images the page after the load tour ends, idle at "world". Every rest picture loads with `tour=0`, so a reveal that needs the tour to have played passes. | Accepted. | R2a: shoot the idle state after the load tour ends, on arrival and after a dwell, against `msg=world&t=0&tour=0`, with a reveal-after-tour mutant. |
| F79 | Claude C2 and Codex X2 (minor), F50 and F62's repairs: hold shots still take and decode a full-frame screenshot inside the 3 s hold with no retry, so load can turn them red (W21's control did), and `reveal-extra-text-pass` got a kill that was only a timing miss. | Accepted. It is the problem F65 fixed for the tour shot. | R2a: clip the hold and landing shots to the compared region and decode after the closing read, as F65 did, and confirm which check kills `reveal-extra-text-pass`. |
| F80 | Claude C3 (minor), from R1c's F71 test: a `sleep(300)` before the first read means "the camera stops after Escape" is checked only from 0.3 s on, so an Escape that lets the glide run on 0.3 s passes, with no stated reason. | Accepted. | R2a: check from the first frame after the press, or measure and state a reason, and add a mutant whose glide runs on briefly after Escape. |
| F81 | Claude C7 (minor), the same kind of defect as F56: switching reduced motion on cuts only Play and capture, while a "Find the angle" glide, a snap or a coast runs on, though README.md says the page never glides with reduced motion on. | Accepted. | R2a: on the switch, land a running Find glide or snap at once and stop a coast, with a test and a mutant. |
| F82 | Claude C6 (minor): `OWN_LIGHT_BAND` and `MAX_CLIPPED` partly measure 8-bit clipping, so changes that keep every particle alike but raise clipping (bigger sprites, more particles, a brighter palette) can trip "renders alike". It fails safe. | Accepted as a limit to document. | R2b: AGENTS.md and the test header say a red there needs a look at clipping before it is read as a reveal. |
| F83 | Codex X3 (minor), F59's repair: `scripts/shoot.mjs` reads the "first frame" view later, unlatched, so a delay past capture's 2 s start hold reports that `msg` did not take. | Accepted. | R2a: latch the view of the page's first drawn frame and check that. |
| F84 | Claude C4 and Codex X4 (minor), F70 and F75: two lines went stale in R1d. `AGENTS.md:193` says checking `textof` "is left to R1d", and `docs/learning/defect-register.md:100` gives the lift bound as 1.45, not 1.51. | Accepted. | R2b: correct both. |
| F85 | Claude C5 and Codex X4 (minor), F75: docs claim more than the code or the measurements. `tests/illusion.test.mjs:65–67` says every bound was checked on seeds 4–12, but `MAX_CLIPPED` and `OWN_LIGHT_BAND` were measured on 1–6. `README.md:19` promises a "clean loop" while F72 is open. `defect-register.md:91`'s 5.5% glow holds only for a glow that fades out by 12°. `AGENTS.md:190` says landing shots take about 1 s, but they took up to 1.69 s. `AGENTS.md:216` omits that a 6–10% reveal in one message passes the light band. `AGENTS.md:18` says "only Escape" without limiting it to inputs. | Accepted. | R2b: correct each claim, or measure what it states. The README describes what capture mode does now, until the owner decides F72. |
| F86 | Both lanes' answers: no mutant isolates `NEXT_MAX_MS`'s 100 ms limit or Find's check that every glide frame names its message. Claude adds the lower edges of `OWN_LIGHT_BAND` and `SCENE_RING_BAND`, the landing from `msg=a`, re-entry's same-document check, the second Escape, and the rule that a hold shot starts at least 1.5 s into its hold. | Accepted. | R2a for the sequence checks and R2b for the two lower edges: one mutant per check that can have one, or a stated reason. |

## Verification

- The review driver checked provenance and isolation:
  - Claude 2.1.308: `modelUsage` exactly `claude-opus-5-5[1m]`, 100 turns, $12.34.
  - Codex 0.163.0: `gpt-6-astra` at xhigh in the read-only sandbox, 293,380 tokens.
  - Both read only a clone detached at `6adc5b8`, and six citations per lane outside the hunks hold.
- The coordinator stopped the full mutation proof of `6adc5b8` after 17 of 116 mutants, all killed after a green control (47 tests), so that repair round 2 could start; a single full proof follows on the final revision. The partial log is `tmp/proof-wu1/mutate-full.log` (ignored).

## Round outcome

Changes requested: 2 major and 8 minor findings, none of them against the owner's rule. They form repair round 2, the second of the fleet's five, in two milestones that run one after the other:
- R2a: F78–F81, F83, and F86's sequence checks.
- R2b: F77, F82, F84, F85, and F86's two lower edges.

Then the full mutation proof runs on the final revision, beside review round 2 of round 2's diff.
