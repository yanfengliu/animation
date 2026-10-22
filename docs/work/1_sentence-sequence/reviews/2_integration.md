# Review 2: integration

## Target

Repository `animation`. The target is repair round 2 of review round 1's findings, as integrated on `main`: `git diff 6adc5b8 8560485`, limited to the code and the repo docs that describe it.
- In scope: `index.html`, `scripts/`, `tests/`, `AGENTS.md` outside the fleet canon block, `README.md` and `docs/learning/defect-register.md`.
- Out of scope: `docs/work/` (the plan and the review records) and the canon block (`AGENTS.md:28–84`). Only the owner's canon sync `d14b771` changed that block, which is byte-identical at `d14b771`, `b3c5f9b`, `8560485` and `cd9ab87` (sha256 `d38205df`).
- The repairs landed in two milestones: R2a `b3c5f9b` (W23) and R2b `8560485` (W24). `main` and `origin/main` are at `cd9ab87`, which adds only the plan's R2b notes and F87 on top of `8560485`.
- The reviewed diff is `tmp/review-runs/wu1-round2/target.diff` (ignored; 11 files, 1,140 lines, sha256 `f7d7f1b8`). It holds `git diff d14b771 8560485 -- AGENTS.md`, then `git diff 6adc5b8 8560485` of the other paths. The `AGENTS.md` part is R2a's and R2b's change without the canon sync's four changed lines. So the target is recoverable from those commits.
- Both reviewers read the exact bytes of `8560485` in a clone at `tmp/review-runs/wu1-round2/tree-8560485/` (ignored).
  - It is detached at `8560485` with no refs, and it holds `cd9ab87` (fetched, for the plan's R2b notes and F87).
  - All 41 tracked files equal the `8560485` blobs byte for byte (LF), before and after both runs.
  - Its ignored `tmp/` held a copy of the diff and 315 copies of the workers' evidence:
    - W23's and W24's status notes, and 99 of the logs, probe scripts, probe pages and measurement tables in `tmp/w23/` and `tmp/w24/`. Screenshots, W24's render cache (`tmp/w24/cache/`) and its copies of committed test files (`tmp/w24/head/`) were left out.
    - The 214 files of repair round 1's evidence that round 1's clone held (`tmp/w19/` to `tmp/w22/` and their status notes), byte-identical to round 1's copies.
- The full mutation proof was running in the primary checkout throughout both runs, so the reviewers had no full-proof log for this code. Neither reviewer ran a test, a browser or a probe.

## Reviewers and coverage

Codex ran, and its report passed the runbook's checks.
- codex-cli 0.163.0. The runbook requires 0.156.1 or later, and the newest build it records as tested is 0.158.0. Round 1 ran on 0.163.0 too, and this round smoke-tested it again first.
- The runbook's diff form: `codex exec --model gpt-6-astra -c model_reasoning_effort=xhigh -c approval_policy=never --sandbox read-only --ephemeral -o …`, with the prompt as the argument and the diff on stdin. It ran from the clone, with the user config loaded (no `--ignore-user-config`). No other `codex exec` was running; only the desktop app's own servers were.
- Model: the run header names `gpt-6-astra`, reasoning effort xhigh, approval never and sandbox read-only.
- DLL markers: the run produced neither `STATUS_DLL_INIT_FAILED` nor `-1073741502`. The stdout holds each string once, but only inside a line of round 1's record that Codex printed while reading it (`1_integration.md:22`). A check of each marker against the text around it found no other.
- Citations: every finding cites a file and line. Eleven citations outside the diff's hunks were checked against the clone, and all hold:
  - `index.html:794–815`: `draw()` draws the sky (`TRIANGLES`, :794), then the particles (`POINTS`, :815); X1;
  - `tests/mutate.mjs:456` (an assertion counts as a check) and `:511–512` (one check kills the mutant); X3;
  - `docs/learning/defect-register.md:108` ("4.1–5.8%") and `tests/illusion.test.mjs:520` ("exactly, as measured"); X4;
  - X4's evidence: `tmp/w24/mutate-r2b-2.log:10` (0.1238/0.1136/0.0904 at E, t 0) and `tmp/w24/alike-by-time.txt:4–6` (0.955–1.015 at t 0, 0.952–1.015 at t 7.3 and at both times);
  - answer 2: `index.html:830–841` (`stepAnim` lands the target and clears `anim`), `:877–879` (`stopAuto`) and `:883–892` (`settle`);
  - answer 1: `tests/sequence.test.mjs:438–465` (Play's path test on its own `msg=world&tour=0` page).
- Run: 13 min 57 s (14:10 to 14:24), 249,502 tokens and 24 read-only shell commands. Codex shows neither turns nor cost. Its context was not compacted.
- All 24 commands were screened after the run. They were PowerShell `Get-Content`, `Select-String` and `Select-Object`, `rg`, and git (`status`, `rev-parse` and `show`). Git at first refused the clone as owned by another user, and Codex then added `-c safe.directory=<clone>` itself, as in rounds 0 and 1.
  - Each one ran in the clone with repo-relative paths. The only absolute path any of them named is the clone's own, in `safe.directory`.
  - None ran npm, npx, Node, a test or a browser, and there were no MCP tool calls. The user config starts the Codex app's MCP servers with each run, among them a Node REPL; the reviewer called none of them.
  - The sandbox denied git's own lookup of the user's global ignore file (`~/.config/git/ignore`; two warnings). That is git reading its configuration, not a review read.
- One subagent spawn failed ("collab spawn failed … no rollout found", as in rounds 0 and 1). So no subagent contributed, as the report says.
- The read smoke test (runbook item 2) ran from the clone before the review, with the pinned model and effort. In 16 s it returned `START` and the third message with the right lines (`:15` and `:9`), with no DLL markers.

Claude ran, and its report passed the runbook's checks.
- claude 2.1.308. The runbook requires 2.1.280 or later, and its `modelUsage` check was proven on 2.1.281.
- The runbook's diff form: `claude -p --model "claude-opus-5-5[1m]" --effort max`, with the prompt by `--append-system-prompt` and the diff on stdin.
- Login check, as the runbook gives it since fleet `027163f`: from a new empty folder outside every repo, with every tool off (`--tools=""`) and no MCP servers (`--strict-mcp-config`). The init event named the pin with empty `tools` and `mcp_servers`, and stderr was empty, so it held no `unrecognized_model`. The one-word prompt answered in one turn ($0.04), and `modelUsage` held exactly `claude-opus-5-5[1m]`.
- Isolation. The reviewer worked in the clone, with `--tools "Read,Glob,Grep,Task,Bash"` and the runbook's allow list (`Read,Glob,Grep,Task,Bash(git diff *),Bash(git log *),Bash(git show *)`). `--permission-mode dontAsk` denies anything not pre-approved, and `--strict-mcp-config` loads no MCP servers. A deny list blocked:
  - edits, writes and web tools;
  - shell readers such as `cat`, `rg` and `sed`, plus `npm`, `npx` and `node`;
  - git forms that reach elsewhere or write a file (`git -C`, `git -c`, `--git-dir`, `--work-tree`, `--no-index` and `--output`);
  - reads of the primary checkout outside the clone, the running proof's folders included, this review's captures, `~/.claude`, `~/.codex`, the session temp folders and the fleet repo.
- A permission smoke test confirmed the setup before the run (low effort, 14 fixed steps, $0.91):
  - allowed: reads inside the clone, its copied evidence included, and git in it;
  - denied: reads of the primary checkout by absolute path and by a `..\` path, a read of its `tmp/w24` evidence, a Glob of the running proof's folder, a Grep of its `tests/lib`, a read of `~/.claude`, and `cat` and `git -C`;
  - a `general-purpose` subagent with no model ran on the pinned model, so `modelUsage` still held one key.
- The CLI also loads `CLAUDE.md` files from the clone's parent folders, as every session in this repo does. Those are the primary checkout's `CLAUDE.md` and `AGENTS.md`, and the github folder's `CLAUDE.md` and `AGENTS.md`. The primary's `AGENTS.md` was byte-identical to the clone's (sha256 `f5cf8e58`), and its `CLAUDE.md` differed only in line endings. This is the harness's load, not a reviewer read.
- Model: the init event named `claude-opus-5-5[1m]`, and `modelUsage` held exactly one key, `claude-opus-5-5[1m]`. Stderr was empty.
- Run: 87 turns, $12.14 and 33 min 36 s (14:10 to 14:44), with no subagents. It ran beside the Codex lane.
- Transcript audit: 86 tool calls, all inside the clone, so none read the primary checkout.
  - The calls were 31 Reads, 42 Greps, 5 Globs and 8 shell commands.
  - All 73 path arguments were inside the clone; the 5 Globs had none and ran in it.
  - Six shell commands ran: `git log`, `git diff` twice, `git show` twice and `git cat-file -s`. The last is not on the allow list: `dontAsk` let it through as a read-only command. It printed the size of the plan at `cd9ab87`. Every git command read the clone's own repository.
- Two calls were denied: `git log … && git status --short | head -5` for `head`, and `git show … | grep …` for `grep`.
- Citations: every finding cites a file and line. Twenty-one citations outside the diff's hunks were checked against the clone, and all hold:
  - C1: `tests/sequence.test.mjs:277` (each landing page loads `?msg=<prev>&t=0&tour=0`), `tests/illusion.test.mjs:170` and `:646` (`Q` adds `tour=0`; the landing at E loads `Q(at(40, -10))`), `index.html:551` and `:923–926` (`autoplayed` turns true when the tour or capture mode starts) and `tests/page.test.mjs:56–59` (the one load that lets the tour run and then clicks "Find the angle");
  - C2 and C3: `tests/sequence.test.mjs:135` (a frame's time is `performance.now()` after its callback), `index.html:1087–1091` (`tick` passes the frame's own time on) and `:825` (`beginAnim` stamps a hold with `performance.now()`);
  - C5: `index.html:831` and `:838` (`stepAnim`'s `k`, and its early return while `k < 1`);
  - C6: `docs/learning/defect-register.md:108` ("4.1–5.8%");
  - answers 1 and 2: `tests/lib/image.mjs:275` (`partsResidual` rounds its region) and `index.html:1003` (a zoom during a glide or snap is carried into its target);
  - the evidence: `tmp/w23/mutate-r2a.log:116` (3,011 and 3,393 ms), `tmp/w23/mutate-r2a-stopped.log:45` (3,232 ms), `tmp/w24/mutate-r2b-2.log:21` (a shot 2,541 ms into its hold, ending 217 ms after it), `tmp/w24/npmtest-5.log:134` (417 ms, ending 1,074 ms before the hold's end), `tmp/w22/lift.txt:1` ("seed 1 incl. variants"), `tmp/w24/resid2.mjs:12` (pixel locations printed only for values off by more than one level) and `tmp/w24/pre-scene-dims-near-what.log:57` (the identity residual printed as 0.0000).

Prompts: `tmp/review-runs/wu1-round2/prompt-codex.md` and `prompt-claude.md` (ignored), built from one shared text, `prompt-core.md`. They differ only in logistics: the tools each lane may use, its subagent rule, where the diff comes from and the finding-ID prefix. They ask for an adversarial, report-only review of the target against the plan's acceptance criteria, AGENTS.md's invariants and round 1's dispositions F77–F86, through five questions:
- round 1's repairs, and any older check weakened without a stated, measured reason, naming R2a's choice that a hold shot which outran its hold fails as an error, the reordering of the sequence file, and the Escape check with its same-document read;
- the owner's rule against R2a's `index.html` change, and that change in every camera mode;
- the mutants: kills for the wrong reason or by a timing miss alone, duplicates, and checks still unproven;
- flakiness on a slower or loaded machine: the clipped hold shots, the rest shots, the switch test's cut hold, the new Escape and switch tests, and the budget probe;
- whether every measurement claim in AGENTS.md, README.md, the defect register and the test headers is backed by the code or the logs, with F87 named as one that is not.

The prompts forbid writes, tests and any browser workload. They ask, for every finding, a file and line at `8560485`, a severity, the F-ID it concerns (F77–F87) or "new", a failure scenario and a fix. Neither lane saw the other's output: neither prompt mentions the other lane, and the clone held no review output. Raw captures are under `tmp/review-runs/wu1-round2/` (ignored).

Independent coverage this round is two lanes. Neither abstained, and neither needed a retry.

## Reports

### Codex (`gpt-6-astra`, effort xhigh), 2026-10-22

Redacted: nothing. The report is Codex's `-o` output, which held no credentials, session details, echoed prompt or transport chatter. It has no headings of its own, so it is shown unchanged.

**Summary**

**4 findings: 0 critical, 1 major, 3 minor.**

The production reduced-motion repair appears correct and preserves the owner’s rendering rule. Most requested repairs are complete. A budget-gate false pass, two timing weaknesses, and stale measurement claims remain. Changes requested.

**How I checked**

I read the supplied diff, the acceptance criteria and R2 notes at `cd9ab87`, both round-1 reports and dispositions, round-0 dispositions, the required policy and learning files, surrounding implementation and test code, and relevant W19–W24 logs and measurement scripts.

I reviewed directly; an attempted subagent launch failed before it ran. I changed no files and ran no tests, page code, or browser workload. New failure scenarios below are deductions from code. I could not inspect the omitted screenshots and caches, reproduce measurements, or inspect the unfinished full proof.

All unqualified file references below are at `8560485`.

**Findings**

**X1 — The budget probe can count only part of an animation frame**

- **Location:** `tests/page.test.mjs:206–212`
- **Severity:** major
- **Relation:** new gap in the probe revised for F77; F77’s temporary-uniform defect itself is repaired.

Every non-point draw closes the sampled “frame.” Nothing ties that boundary to an animation callback.

A concrete escape is a DPR-2 resize/rendering path accidentally calling `draw()` twice in one `tick()`. Each call draws the sky and then 48,000 particles (`index.html:794–815`). The probe:

1. Arms on the first sky draw.
2. Measures the first particle draw.
3. Finalizes at the second sky draw.
4. Ignores the second particle draw because `s.frame` is now null.

It reports 48,000 particles and baseline fill, although that animation frame draws 96,000 particles with approximately twice the fill. The second sky replaces the first picture, so the final image can remain unchanged. A DPR-2-only duplication also avoids the DPR-1 image gates.

**Suggested fix:** delimit sampling using animation-frame callbacks and accumulate every point draw within the sampled callback. Alternatively, explicitly reject unexpected extra sky/non-point draws. Add a DPR-2 double-draw mutant.

**X2 — Escape’s movement guard accepts the first frame of a hold**

- **Location:** `tests/sequence.test.mjs:573–578`, `tests/sequence.test.mjs:595`
- **Severity:** minor
- **Relation:** F80 repair.

The final precondition requires `mode === 'tour'` and a positive movement from the preceding frame. Both are true on the **first frame of a hold**: the camera has just moved the final distance to the eye, and holds also use mode `tour`.

If command delivery crosses the glide’s end between the initial wait and Escape, the recorded last frame can therefore be at the eye, already holding, while the test accepts it as mid-glide.

The existing `escape-glides-on` mutant then passes this check: its changed handler stops normally when `anim.target` is null, which is precisely the hold case (`tests/mutate.mjs:277–280`). The saved run killed it correctly, but this timing window can avoid exercising its defect.

**Suggested fix:** require the frame immediately before the recorded Escape event to be classified as `moving`, as the reduced-motion sequence test already does at `tests/sequence.test.mjs:514`. Treat a missed setup window as an instrumentation miss and retry within a bound.

**X3 — Some timing-only failures still count as mutant kills**

- **Location:** `tests/sequence.test.mjs:229–231`; `tests/motion.test.mjs:140–156`
- **Severity:** minor
- **Relation:** remaining F79 weakness and a new robustness issue in F81’s test.

Two paths bypass the distinction between a page defect and insufficient observation:

- `shootAt()` successfully waits for a hold, then reads `restFrom()` again in another call. If the healthy hold ends between those calls, `assert.fail()` reports a CHECK. The later timing-miss classification at `tests/sequence.test.mjs:631` is never reached.
- The new motion test waits a fixed 300 ms and asserts that at least three post-change frames arrived. A healthy page producing only one or two frames during a scheduling stall fails by assertion, even if every observed frame stopped correctly.

`tests/mutate.mjs:456` and `:511–512` count either assertion as a kill. Thus a rendering slowdown or host delay can still supply a wrong-reason kill.

**Suggested fix:** retain the hold-start value from the successful poll rather than rereading it. Wait for sufficient post-change frames with a bounded timeout, preserving the first-frame checks. Report inadequate observation as an Error, and reserve assertions for observed behavior that violates the contract.

**X4 — Current measurement descriptions still contain old values and an exactness claim**

- **Location:** `docs/learning/defect-register.md:89`, `:108`; `tests/illusion.test.mjs:520`
- **Severity:** minor
- **Relation:** F85 documentation repair; additional to the already recorded F87.

Three descriptions remain inconsistent with the supplied evidence:

- The register gives **0.955–1.015** for seeds 1–6 while describing both times. W24’s table gives **0.952–1.015** across both times; **0.955–1.015** applies to t 0 only (`tmp/w24/alike-by-time.txt:4–6`).
- The register says the extra-text-pass residual is **4.1–5.8%**. The current saved run reports **0.1238/0.1136/0.0904** at E at t 0—**12.38%/11.36%/9.04%** (`tmp/w24/mutate-r2b-2.log:10`).
- The helper comment still describes the shipped-render identity as “exactly, as measured.” R2b’s measurement table reports a nonzero residual, up to **1.28e-5**, and the updated header correctly allows for it.

The last item concerns the shipped-render identity, whose measured nonzero residual is already established. It is distinct from F87’s unproven exact-zero claim for camera-mode pictures.

**Suggested fix:** update the current ranges and helper comment. Label retained historical measurements with their revision or work unit.

**Answers**

**1. Are F77–F86 repaired, and were older checks weakened?**

| Finding | Assessment |
|---|---|
| F77 | Temporary uniforms are now measured at the intercepted draw, with its current program and VAO (`tests/page.test.mjs:174–212`). The old/new probe logs support the claimed change from 2.72–2.95× to 4.25–4.61×. X1 remains a separate frame-boundary gap. |
| F78 | Repaired. The same visitor tour page reaches idle “world,” is pictured twice, and then receives Play (`tests/sequence.test.mjs:254–267`). |
| F79 | Clipping and decode placement are repaired (`tests/sequence.test.mjs:237–240`). Completed late shots become Errors and are not compared (`:631–642`). X3 identifies an earlier timing path still counted as a CHECK. |
| F80 | The old 300 ms observation gap is removed by the event-timed frame log (`tests/sequence.test.mjs:584–597`). X2 remains. |
| F81 | Production behavior is repaired (`index.html:1060–1075`). The three new cases and mutants exercise the intended branches; X3 concerns test robustness. |
| F82 | The clipping limitation is stated beside the bounds and in AGENTS (`tests/illusion.test.mjs:74–77`; `AGENTS.md:137`). |
| F83 | Repaired. The view is latched synchronously after the first ready frame (`scripts/shoot.mjs:57–63`, `:231`). |
| F84 | Both named stale lines are corrected (`AGENTS.md:204`; `docs/learning/defect-register.md:100`). |
| F85 | The named README, seed-coverage, glow-width, landing-duration and per-message-light disclosures are addressed. X4 identifies remaining measurement discrepancies. |
| F86 | The requested behavior checks have corresponding mutants. The shot-lead guard’s exemption is sound: the wait establishes it by construction (`tests/sequence.test.mjs:232–240`). |

I found no unexplained threshold or seed reduction. Timing the switched cut hold from the media event has a stated, measured reason (`tests/sequence.test.mjs:517–520`).

Play’s picture now exercises replay after the visitor tour rather than Play on a fresh URL-set page. That coverage tradeoff is explicitly disclosed at `AGENTS.md:234`; the fresh-page path check remains at `tests/sequence.test.mjs:438–465`.

**2. Does the page change preserve the owner’s rule and camera state?**

Yes, by inspection. It changes camera state only. Particle colour, size and focus remain governed by the unchanged shader and draw code (`index.html:633–667`, `:796–815`).

The affected modes behave consistently:

- **Load tour:** `seq.auto` stops through `stopAuto()`, clearing animation, sequence, heading and velocity (`:877–879`, `:1069`).
- **Play/capture:** a running glide lands at its target and begins a cut hold; subsequent steps cut (`:1070–1074`, `:865–872`).
- **Find/snap:** `stepAnim()` completes the target, including zoom, clears `anim`, and the handler clears mode and heading (`:830–841`, `:1065`). Their cursor was already selected.
- **Coast:** `settle()` clears velocity. Near an eligible eye it may jump into alignment, as reduced-motion settling already does (`:883–892`). This uses angle for camera positioning, not particle rendering.
- **Drag/pinch:** the handler leaves the gesture intact. Release cannot start inertia while reduced motion is on (`:938–997`).
- **Zoom:** a zoom applied during Find or snap is already carried into the animation target, so completing it preserves that zoom (`:1001–1004`).
- **Idle:** no new camera action occurs.

Switching reduced motion off does not revive a canceled move. An existing sequence retains its `cut` choice; a newly started sequence reads the current preference (`:852`, `:1062`). A page initially loaded with reduced motion can start its previously suppressed tour when that preference is removed and no input has occurred (`:923–926`). These are existing behaviors, not regressions introduced here.

**3. Do the mutants prove their intended checks?**

The supplied final targeted logs show intended kills, not wholesale breakage or timing-only kills:

- The three F81 mutants fail their respective motion cases.
- `reduced-switch-short-hold` reads **3,011 ms** and **3,393 ms**, failing the changed 3,500 ms lower bound.
- `hold-names-next-early` reaches the 100 ms tail assertion; its additional reduced-motion failures also arise from premature target naming.
- Find target loss, `msg=a` initialization, re-entry reload and second-Escape mutants reach their named checks.
- `dims-only-a` fails only its own-light lower edge at **0.875**; `scene-dims-near-what` fails only the scene-ring lower edge at **0.906**.
- The F77 mutant fails the budget check alone.

Evidence: `tmp/w23/mutate-r2a.log:94–144`, `tmp/w23/mutate-r2a-samedoc.log:6–15`, and `tmp/w24/mutate-r2b.log:36–46`.

`reveal-extra-text-pass` still has a sequence timing Error, but its identity and budget CHECKs kill it correctly. I found no duplicate among the new mutants. The shot-lead guard needs no page mutant; F83 instead has the saved delayed-read old/new probe. X1–X3 identify remaining gaps beyond those successful runs.

**4. How robust are the timing changes?**

The changes improve the normal path substantially:

- Hold captures use the same central pixels, with decode outside the timed interval.
- Rest captures have no departure deadline, so the reported **3.86 s** capture duration is not itself a failure.
- References run after the landings, reducing competing loads.
- Interrupted same-document reads correctly become failed reload assertions rather than unrelated execution-context Errors (`tests/sequence.test.mjs:201–205`).

They do not eliminate timing sensitivity. X2 permits an Escape false pass; X3 permits timing-only CHECKs. A late preference change can also miss the intended move and fail its setup guard. The cut-duration check remains an observation of rendered frames: sparse or delayed frames can change the measured duration of even a short programmed hold.

The budget probe’s 10 s wait fails safely when it cannot collect a sample (`tests/page.test.mjs:214–225`). Its main false-pass issue is X1, not that timeout.

**5. Are the measurement claims supported?**

Most revised claims match the supplied records:

- **48 tests:** 13 illusion, 10 sequence, 9 controls, 4 motion, 8 page and 4 hygiene.
- **130 mutants:** 107 page and 23 tree; R2a adds 11 and R2b adds 3.
- Final R2b totals: **212.8, 211.4 and 214.3 s**, with budget checks **3.17–3.22 s**.
- R2a hold captures: **64–378 ms**, ending **1.110–1.425 s** before the nominal end.
- Rest captures across the six stated final runs: **78–3,860 ms**.
- The updated alike and clipping ranges agree with W24’s tables.

The **204 renders** and **3,072,000 channel values per render** follow from 17 views/times × 12 seeds and 1280 × 800 × 3. I could inspect the counting method in `tmp/w24/resid2.mjs`, but could not independently confirm the **7–623** and **31** counts without the omitted renders.

X4 contains additional discrepancies. I have not counted the already known F87 again.

**Read outside the diff**

Among the unchanged ranges I read:

- `index.html:543–600`, `:611–817`, `:819–1058`, `:1078–1097`
- `tests/sequence.test.mjs:139–181`, `:381–489`
- `tests/illusion.test.mjs:488–567`
- `tests/lib/harness.mjs:1–144`
- `tests/lib/image.mjs:254–290`, `:368–387`
- `tests/lib/messages.mjs:1–31`
- `tests/mutate.mjs:443–525`
- `scripts/shoot.mjs:236–261`

### Claude (`claude-opus-5-5[1m]`, effort max), 2026-10-22

Redacted: nothing. The report is the `result` field of the run's final event, which held no credentials, session details, echoed prompt or transport chatter. Its `##` headings are shown as `####` and its `###` headings as `#####`, so that they nest under this section. Nothing else is changed.

**Review of repair round 2 (R2a `b3c5f9b`, R2b `8560485`): 1 major and 5 minor findings, none critical. Changes requested.**

#### Summary

- **Repairs:** R2a and R2b do what round 1's record and the plan's notes describe.
  - The page change touches only the camera, so the owner's rule holds.
  - The budget probe now measures each draw with the state it is drawn with.
  - Every new mutant dies by its own check in the saved logs.
- **Major (C1):** the gap behind F78 is still open on a visitor's most common path. Every "Find the angle" landing is pictured on a `tour=0` page, a state no visitor without reduced motion reaches. So a reveal that waits until the tour has played and shows at a landing passes every gate.
- **Minor (C2–C6):**
  - C2: the new cut-hold bound kills its mutant by only 107 ms.
  - C3: a timing miss can still count as a mutant's kill.
  - C4: hold shots still have no retry.
  - C5: the new reduced-motion handler relies on a floating-point identity.
  - C6: several docs claim more than the logs show.
- **F87:** it stands as logged. I found nothing beyond it.

#### How I checked

- **Plan and records:** the plan, from the working copy plus `git diff 8560485 cd9ab87`; round 1's record in full; AGENTS.md outside the canon block; README; the defect register; lessons; local rules; the full target diff, and both commits' messages and file lists.
- **Code at `8560485`:**
  - `index.html` constants and camera code (116–145, 530–609, 760–1101);
  - `tests/sequence.test.mjs` and `tests/motion.test.mjs` in full;
  - `tests/page.test.mjs` 1–61 and 150–246;
  - `tests/lib/harness.mjs` in full, and `tests/lib/image.mjs` 255–291;
  - `tests/mutate.mjs`: the helpers, the new mutants and the verdict code;
  - `scripts/shoot.mjs`;
  - `tests/illusion.test.mjs` 1–170 and 629–651.
- **Evidence, treated as claims:**
  - the W23 and W24 status notes;
  - every R2a and R2b mutation log;
  - `npm test` logs: W23 1–3 and W24 1–6;
  - the F77 probe logs and `budget-old.txt`/`budget-new.txt`;
  - the alike, own-reveal and palette tables, and the pre-check logs;
  - `resid2.mjs`, `tmp/w22/lift.txt` and `tmp/w21/npmtest-3.log`.
- **No subagents; nothing run, no browser.**
- **Not checkable here:** pixels, timing on other machines, and the full proof, which is still running. C1's surviving mutant and C5 are reasoned from the code, not run.

#### Findings

##### C1 — major — new; F78's repair closes only the rest at "world", not the rest of its class

**Where:**
- `tests/sequence.test.mjs:277`: every landing page is `?msg=<prev>&t=0&tour=0`.
- `tests/illusion.test.mjs:646`, with `Q` at `:170` adding `tour=0`: the illusion file's landing at E.
- The tour picture page clicks Play, not "Find the angle" (`tests/sequence.test.mjs:265`).
- `index.html:551` and `:923–926`: `autoplayed` turns true on the first frame of any load that has neither `tour=0` nor reduced motion.
- Docs: `AGENTS.md:200` does not mention `tour=0`. `AGENTS.md:233` says a reveal reached by "Find the angle" from elsewhere than the eye before passes, which implies landings from the eye before are covered.

**Problem:**
- A visitor's tour starts on the first frame, so `autoplayed` is true before they can click anything.
- Every landing the gates picture comes from a page where it stays false.
- The wrap landing, world → hello world, is the first click after the tour ends, and it is pictured nowhere. The illusion file's landing at E starts from `at(40, -10)`.

**Failure scenario:** the mutant `[TEXT_DECL, NEAR_UNIFORM, nearSet('autoplayed && found && atMessage() >= 0 ? 1 : 0'), TEXT_BRIGHTER, ...FOUND]` makes text 1.25× brighter at any landing once the tour has played.
- The tour page never clicks "Find the angle", so `found` stays false there.
- Every landing picture page has `autoplayed` false.
- The only load that plays the tour and then clicks "Find the angle" (`tests/page.test.mjs:56–59`) checks only for console errors.
- By my reading it passes every test, while a visitor who watches the tour and then clicks "Find the angle" sees the reveal.
- Round 1's C1 named this variant ("including a 'Find the angle' landing").

**Fix:** any one of these:
- On the tour page, after the 8 s shot at "world", click "Find the angle" (it wraps to hello world). Shoot on landing and 8 s later against `msg=hello-world&t=0&tour=0`, then click Play as now.
- Or drop `tour=0` from the five landing pages and click "Find the angle" during the tour's 1.5 s first hold.
- Or, if the owner accepts the gap, state in the Bound and at `AGENTS.md:200` that landings are pictured only on pages where the tour never ran.

Either fix should add a `reveal-after-tour-find` mutant.

##### C2 — minor — new (R2a's switch-test change and `reduced-switch-short-hold`, F86): the cut-hold bound kills its mutant by only 107 ms

**Where:** `tests/sequence.test.mjs:135` (each frame's time is `performance.now()` after the frame's callback) and `:520`; `tests/mutate.mjs:289–290`; `AGENTS.md:185`.

**Problem:**
- The page ends a hold by its own frame timestamp (`index.html:1087–1091` → `stepAnim(now)`). The test stamps a frame after its callback, draw included, so a stalled frame reads late.
- The 3 s mutant read 3,011 ms (Play) and 3,393 ms (capture) against the 3,500 ms bound (`tmp/w23/mutate-r2a.log:116`). The capture case came within 107 ms of surviving.
- The reverse also holds: a frame gap just before a healthy hold's end shortens its reading. R2a moved only the start of the measurement.
- The stated cause is inferred, not measured. "That frame came 0.77 s late" rests on a stopped run that printed only the run's span, 3,232 ms (`tmp/w23/mutate-r2a-stopped.log:45`). W21's 3.60 s is likewise a bare span (`tmp/w21/npmtest-3.log:119`). A gap at the hold's end reads the same and would still fail under the R2a fix.

**Failure scenario:** on a somewhat more loaded run, both pages' last frames at the eye stall 0.5 s or more, and a 3 s cut hold passes.

**Fix:** log the frame timestamp (`ts`) with each frame and judge by it.
- Every frame stamped before the switch + 3.5 s must be at hello world's eye.
- At least one frame must be stamped between the switch + 3.1 s and + 3.5 s.
- If no frame falls in that window, fail with an Error, not a check.

##### C3 — minor — F79, F80 and F81: a timing miss can still count as a mutant's kill

**(a) The miss boundary.**
- The test computes `late = s1.now − from` (`tests/sequence.test.mjs:627`). `from` is the stamp of the hold's first frame (`:222`), taken after that frame's draw.
- The page starts the hold earlier in the same callback (`index.html:922`, `:825`).
- So a stall of S ms in that frame makes a read taken up to S ms after the hold really ended count as a check (`:634`).
- In `tmp/w24/mutate-r2b-2.log:21`, `more-particles`' shot ended 217 ms after its hold. A stall of 217 ms or more in that first frame would have turned that error into a kill. C2 shows stalls of 0.39 s happen.
- The code also counts any failed read (mode, target or capture flag) as a miss. `AGENTS.md:197` and the test header (`:67–70`) say "the camera gone from its eye … more than 3 s after the hold began".

**(b) Guards fail as checks.** The new guards whose messages say "this check proves nothing" are assertions: `tests/motion.test.mjs:150` (through `:156`) and `tests/sequence.test.mjs:595`, as is the older `:514`.
- If a heavy mutant delays the switch past the 0.9 s snap, the guard counts as a kill.
- That can hide an "errored" verdict, which is exactly what R2a's rule meant to prevent.

**Fix:**
- Time the miss from the first frame's own timestamp, and match the docs' wording to the code.
- Raise guard failures as plain Errors.

##### C4 — minor — F79: hold shots still have no retry

**Problem:** a miss fails `npm test` as an Error, and it stops a mutation run at its control (exit 2).

**Evidence:** pages that only draw more, with an unchanged sequence, already miss.
- `more-particles`' capture shot at "a" started 2,541 ms into its hold (`tmp/w24/mutate-r2b-2.log:21`).
- `reveal-extra-text-pass`'s capture shot at hello world took 4,432, 2,826 and 2,006 ms in all three runs (`tmp/w23/mutate-r2a.log:32`, `tmp/w24/mutate-r2b.log:15`, `tmp/w24/mutate-r2b-2.log:12`).
- Healthy runs here took 64–417 ms, so the risk is a slower or loaded machine.

**Fix:** retry a missed hold once, at the next capture pass or on a fresh tour page, and report a second miss as the Error.

##### C5 — minor — new (F81's page change): the landing relies on a floating-point identity

**Where:** `index.html:1065` calls `stepAnim(anim.t0 + anim.ms)`; `:831` computes `k = clamp((now − t0)/ms, 0, 1)`.

**Problem:**
- `(t0 + ms) − t0` is not always `ms`. When the sum crosses a power of two and rounds down, k comes out at 1 − 4.4e−16.
- With `GLIDE_MS` 2200 that happens about 1 time in 4 for a start time t0 between 2.05 s and 4.1 s after load, and about 1 in 8 just below 2.05 s.
- Then `:838` returns false. The camera ends at ease(k), within about 1e−16 rad of the eye but not snapped to the target, and `anim` stays set while the handler sets the mode to idle.
- It is harmless today, because every reader of `anim` also checks the mode or clears it (`:921`, `:1003`, `:878`).

**Fix:** `stepAnim(Infinity)`, or set the target and clear `anim` directly.

##### C6 — minor — F85 and new: docs claim more than the logs show

- **a.** `AGENTS.md:196`'s 64–378 ms, ending 1.11–1.43 s before the hold, comes from R2a's runs only. The committed tree's runs include a 417 ms shot that ended 1,074 ms before (`tmp/w24/npmtest-5.log:134`).
- **b.** "That frame came 0.77 s late" (`AGENTS.md:185`, `tests/sequence.test.mjs:517–519`) is inferred, not measured; see C2.
- **c.** `docs/learning/defect-register.md:108` says `reveal-extra-text-pass` gives 4.1–5.8% at E and 3°. The logs read 0.0721–0.1238 per channel, that is 7.2–12.4% (`tmp/w24/mutate-r2b.log:13`), matching the 0.124 at `tests/illusion.test.mjs:123`.
- **d.** The seeds 4–12 claim at `tests/illusion.test.mjs:65–69` still covers too much.
  - `MIN_RATIO` and `MIN_LIFT` at hello world's views at t 7.3 and 31 s and at fov 32 and 80 were measured for seed 1 only (`tmp/w22/lift.txt:1`: "seed 1 incl. variants").
  - `MAX_RESIDUAL`'s use in the camera-mode shots was likewise measured for seed 1 only.
- **e.** "Up to nine pages" (`AGENTS.md:95`, `tests/lib/phases.mjs:6`) is likely ten now.
  - By the file's schedule (test durations at `tmp/w24/npmtest-4.log:105–118`), the switch test's two pages are open when the five landing pages start, about 45 s in.
  - The tour picture page and the two path pages are also drawing then.
- **f.** The account of the shipped render's not-quite-exact match has gaps (`AGENTS.md:141`, `tests/illusion.test.mjs:123`).
  - `resid2.mjs:12` prints locations only for values off by more than one level.
  - The one-level differences were counted, not located, yet `:123` places all of them under the hint.
  - The counts 7–623 and 31, and the rows 761–763, appear in no saved output; only in `tmp/w24-status.md:13` and the commit message.
- **g.** "Every frame is idle" (`AGENTS.md:164`, `tests/motion.test.mjs:12–15`) reads only about 0.3 s after the switch (`:142`). A move that resumes later passes. State the window, as the Escape check does with its 1.3 s.

**Fix:** correct each claim to what was measured, or measure what it states.

#### Answers

##### 1. Round 1's repairs

**Repair by repair:**
- **F77:** correct and complete. Each point draw is measured inside the page's own draw call (`tests/page.test.mjs:174–213`). On `cfe78a4`'s probe the new mutant read 2.723–2.950× and passed; on the new probe it reads 4.254–4.608× and fails, by the budget check alone. On the real page both probes read the same.
- **F78:** correct as its disposition describes, but the gap remains (C1).
- **F79:** the shot is clipped to the compared region, and its decode follows the second read. The clip (51,60 538×280) equals `partsResidual`'s rounding of the central region (`image.mjs:275`). Remaining issues are C3(a) and C4. `reveal-extra-text-pass` is now killed by the alike and budget checks only.
- **F80:** correct. The observer's keydown listener runs in the capture phase, before the page's own listener, in the same dispatch. Its guard is C3(b).
- **F81:** correct, apart from C5.
- **F82, F83, F84:** correct.
- **F85:** correct except C6(d).
- **F86:** each new mutant dies by its own check.

**Weakened checks:**
- The cut hold timed from the switch: the reason is stated, but its measurement is inferred (C2).
- A miss is now an Error: stated and measured.
- Play from a view set by URL is no longer pictured: stated at `AGENTS.md:234`.
- The old 0.3–1.3 s Escape window was replaced by a stronger check over every frame after the press.

**The reordering:**
- The tour and Play sharing one page is fine. Play's shot ends 1.37–1.43 s before its hold, and no hover or focus style falls inside the clip.
- Moving the references after the landings took 12 page loads out of the switch test's window, but the five landing pages still load beside it.

**The same-document read:** sound. On a healthy page nothing navigates, so only a reload can destroy the execution context.

##### 2. The owner's rule

- The handler changes only `mode`, `anim`, `heading` and the camera through `stepAnim` and `settle`. `draw()` is unchanged, and nothing in it depends on the camera's angle.
- **Per mode:**
  - A "Find the angle" glide or a snap lands on its eye (C5 is the only caveat).
  - A coast calls `settle()`: under reduced motion it jumps onto an eye within 6° that the gesture was approaching, and otherwise stops where it is.
  - A drag or pinch is left alone, and its release then never coasts.
  - A zoom during a glide or snap is carried to the landing through `anim.target.zoom`.
  - Idle: nothing happens.
  - The load tour stops, and Play and capture cut; both unchanged from before.
  - Reduced motion switched off: the handler returns at once.
- **Pre-existing, outside the diff:** a Play or capture run that was cut keeps cutting after reduced motion is switched off.
- **State afterwards:** idle, `heading` −1, velocity 0, `cursor` set. Any later input clears `anim`.

##### 3. Mutants

- All 14 new mutants die by checks, each with at least 40 tests green; none is flagged and none duplicates another.
- **Fragile or indirect kills:**
  - `reduced-switch-short-hold`: 107 ms margin (C2).
  - `hold-names-next-early` also kills "Play cuts", because that test's own wait for the face fires early (`tmp/w23/mutate-r2a.log:120`). That is the right defect, but the message misleads.
  - `find-ignores-msg` also dies at the landing pages' 25 s waits, which is the same defect.
- **New checks without a mutant:**
  - the guards (motion `:150`, sequence `:595`);
  - the frame-count check (motion `:151`);
  - "a frame came after Escape" (sequence `:597`);
  - the miss as Error, and the probe's errors, both by design (the no-sky error path was exercised in `probe-error-no-sky.log`).
- The stated reason that the "shot starts at least its lead into the hold" rule has no mutant is sound: the wait at `:232–236` runs on the page's own clock.

##### 4. Flakiness

- **Hold shots:** C4 and C3(a).
- **Rest shots:** they cannot fail a healthy page, since a rest has no end. The shot on landing can come up to about 1.9 s plus 1.7 s after the camera rests (`tmp/w24/npmtest-3.log:141`), which is still before the 5 s dwell mutant reveals.
- **Cut hold:** C2.
- **Escape:** robust. The wait fires early in a glide; only a test that starts late, near a glide's end, risks the guard.
- **Motion:** the margins are about 1.8 s for the glide, 0.7 s for the snap and 1 s for the coast, with 18–19 frames in the 0.3 s window (`tmp/w24/npmtest-4.log:173–175`).
- **Budget probe:** robust; 3.17–3.31 s for the test, one frame, a 10 s wait and a frozen particle clock.

##### 5. Measurement claims

- **Backed by the code or the logs:**
  - 48 tests (13 + 14 + 21) in 212.8, 211.4 and 214.3 s, and each phase's time;
  - the budget test's 3.17–3.22 s and 3.05–3.22 s;
  - 130 mutants (107 page, 23 tree; `write-only-all.log`);
  - the R2a mutation run: 5,631 s, 215–289 s per mutant, 225.5 s mean; the same-document rerun: 640 s;
  - the R2b runs: 1,787 s (217–240 s, 224.3 s mean) and 1,159 s;
  - 78,254 particles a frame in 2 draws;
  - `reveal-after-tour` at 0.1525/0.1433/0.1163; `reveal-after-dwell-later` at 0.1128–0.1597; the short hold at 3,011 and 3,393 ms;
  - the one-message limits of 6.1/10.1% brighter and 6.8/10.0% dimmer, with the whole text layer at 0.950–0.997;
  - the brighter palette: 8.12% and 9.52% clipped, own light 1.046–1.100;
  - the alike bounds for seeds 1–12;
  - the dimming mutants: 0.875 and 0.981, and 0.906 against 0.924;
  - rest shots of 0.08–3.86 s.
- **Not backed:** C6 (a)–(g).
- **F87:** R2b's own discovery is its clearest evidence: a check log prints the shipped render's match with the layers as 0.0000 (`pre-scene-dims-near-what.log:57`), where it measures up to 1.28e−5. Nothing beyond F87.

#### Read outside the diff

- `index.html:116–145`, `:530–609`, `:760–1058`, `:1077–1101`
- `tests/lib/harness.mjs:1–145`; `tests/lib/image.mjs:255–291`
- `tests/sequence.test.mjs:139–198`, `:336–490`, `:526–547`
- `tests/motion.test.mjs:42–113`
- `tests/page.test.mjs:39–61`
- `tests/illusion.test.mjs:100–113`, `:130–170`, `:629–651`
- `tests/mutate.mjs:40–74`, `:198–203`, `:230–233`, `:445–525`
- `scripts/shoot.mjs:185–259`
- `docs/learning/defect-register.md:84–131`, outside its hunks
- `docs/policies/local-rules.md`, `docs/learning/lessons.md`

## Findings and disposition

Stable IDs continue from round 1 (F77–F86) and the coordinator's F87. Neither lane found anything critical. Both agree that R2a's `index.html` change moves only the camera, so the owner's rule holds, and that every new mutant dies by its own check.

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F88 | Claude C1 (major), the class of F78: every "Find the angle" landing is pictured on a `tour=0` page. So a reveal that waits for the load tour to have played and then shows at a landing passes, for example after a visitor's click from "world" to hello world (`tests/sequence.test.mjs:277`; `index.html:551`, `:923–926`). | Accepted, and repaired as a class: what a visitor did before reaching a resting view must not change its picture. | R3: on the page whose load tour has played, click "Find the angle" through all six eyes and picture each landing against the eye set by URL. Add a `reveal-after-tour-find` mutant, and state in "Bound" which histories stay unpictured. |
| F89 | Codex X1 (major), F77's rewritten probe: the sampled frame ends at the next non-point draw. So a frame that draws the sky and the particles twice is measured for its first particle draw only (`tests/page.test.mjs:206–212`). | Accepted. | R3: bound the sample by the animation frame, measure every point draw in it, and add a double-draw mutant. |
| F90 | Codex X3 and Claude C3 (minor), F79–F81: R2a's rule that a timing miss is an error, never a check, still leaks in three ways (details below). | Accepted: a timing miss counted as a check makes a mutant look killed when it was only slow. | R3: route every timing-dependent precondition through the error path, and time the miss boundary from the page's own clock. |
| F91 | Codex X2 (minor), F80: the Escape "mid-glide" guard also accepts a hold's first frame, so `escape-glides-on` can pass when Escape lands there (`tests/sequence.test.mjs:573–578`, `:595`). | Accepted. | R3: require the camera to have moved between the frames around the press. |
| F92 | Claude C2 (minor), F86: the cut-hold bound kills `reduced-switch-short-hold` by only 107 ms (3,393 against 3,500 ms), and the stated cause, "0.77 s late", is inferred from one span (`tests/sequence.test.mjs:135`, `:520`; `tests/mutate.mjs:289–290`; `AGENTS.md:185`). | Accepted. | R3: widen the mutant's margin with a shorter hold, and state the cause as inferred or measure it. |
| F93 | Claude C4 (minor), F79: hold shots have no retry. One miss fails `npm test` and stops a mutation run at its control, and draw-heavy mutants already miss. | Accepted in part. | R3: in capture mode, retry a missed hold once on the loop's next pass. Elsewhere, state the no-retry bound. |
| F94 | Claude C5 (minor), F81's page change: `stepAnim(anim.t0 + anim.ms)` can give k = 1 − 4.4e−16, which leaves `anim` set and the camera about 1e−16 rad off its eye (`index.html:1065`). | Accepted. It is harmless today, but the landing should be exact by construction. | R3: land at k = 1 exactly, for example with `stepAnim(Infinity)`, and compare the digests. |
| F95 | Codex X4 and Claude C6 (minor), with F87: the docs claim more than the logs show (list below). | Accepted, with F87. | R3: correct each claim to what a saved log shows, and save the output for any count that stays. |

F90's three leaks:
- `shootAt`'s assertion fires when a hold ends between its reads (`tests/sequence.test.mjs:229–231`).
- The miss boundary is timed from a late frame stamp (`:222`, `:627–634`).
- Setup guards are written as assertions (`tests/motion.test.mjs:150–151`, `tests/sequence.test.mjs:514`, `:595`).

F95's over-claims:
- `docs/learning/defect-register.md:108` gives 4.1–5.8%; the logs show 7.2–12.4%.
- Register `:89` holds at t 0 only.
- `tests/illusion.test.mjs:520` still says "exactly, as measured".
- `AGENTS.md:196` gives R2a's timings only.
- `AGENTS.md:185` states an inferred cause as fact.
- `tests/illusion.test.mjs:65–69` claims more seed coverage than was measured.
- `AGENTS.md:95` and `tests/lib/phases.mjs:6` say "nine pages", which is likely ten.
- `AGENTS.md:141` and `tests/illusion.test.mjs:123` give counts that no saved output holds.
- `AGENTS.md:164` and `tests/motion.test.mjs:12–15` call the camera idle when that was observed for only about 0.3 s.

## Verification

- The review driver checked provenance and isolation:
  - Codex 0.163.0: `gpt-6-astra` at xhigh in the read-only sandbox, 249,502 tokens, 11 citations outside the hunks that hold, and DLL markers only where Codex quoted round 1's record.
  - Claude 2.1.308: the login checked as fleet `027163f`'s runbook says, `modelUsage` exactly `claude-opus-5-5[1m]`, 87 turns, $12.14, 21 citations outside the hunks that hold.
  - Both read only a clone detached at `8560485`, and its files were unchanged after both runs.
- The coordinator stopped the full proof of `8560485` after 17 of 130 mutants, all killed after a green control, so that repair round 3 could run first.

## Round outcome

Changes requested: 2 major and 6 minor findings (F88–F95), none against the owner's rule. They form repair round 3, the third of the fleet's five, as one milestone, R3, with F87. Then the full mutation proof runs on the final revision, beside review round 3.
