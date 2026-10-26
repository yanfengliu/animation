# Review 3: integration

## Target

Repository `animation`. The target is repair round 3 of review round 2's findings, as integrated on `main`: `git diff 8560485 df0dac7`, limited to the code and the repo docs that describe it.
- In scope: `index.html`, `scripts/`, `tests/`, `AGENTS.md` outside the fleet canon block, `README.md` and `docs/learning/defect-register.md`. `scripts/` and `README.md` are unchanged in this range.
- Out of scope: `docs/work/` (the plan and the review records) and the canon block (`AGENTS.md:28–84`), which is byte-identical at `8560485`, `df0dac7` and `c4b27cb` (sha256 `d38205df`).
- The repairs landed in one milestone, R3, as `df0dac7` (W25). The range also holds `cd9ab87` and `1b37f18`, which change only `docs/work/`. `main` and `origin/main` are at `c4b27cb`, which adds only the plan's R3 notes on top of `df0dac7`.
- The reviewed diff is `tmp/review-runs/wu1-round3/target.diff` (ignored; 11 files, 1,200 lines, sha256 `5a43c55a`). It is `git diff 8560485 df0dac7` of the in-scope paths, the same change as `git show df0dac7`, which touches only those 11 files. So the target is recoverable from those commits.
- Both reviewers read the exact bytes of `df0dac7` in a clone at `tmp/review-runs/wu1-round3/tree-df0dac7/` (ignored).
  - It is detached at `df0dac7` with no refs, and it holds `c4b27cb` (fetched, for the plan's R3 notes).
  - All 42 tracked files equal the `df0dac7` blobs byte for byte (LF), before and after both runs.
  - Its ignored `tmp/` held a copy of the diff and 363 copies of the workers' evidence:
    - W25's status note and 47 of the 48 files in `tmp/w25/`: the `npm test` logs, the named mutation runs, the pre-checks, the probes and their logs, the measurement tables and the edit scripts. Left out: `tmp/w25/agents-head.md`, a copy of `AGENTS.md` at `8560485`, as round 2 left out copies of committed files. Screenshots, the mutant pages and render caches were not copied, among them W24's `tmp/w24/cache/`, which R3's identity counts read.
    - The 315 files of repair rounds 1 and 2's evidence that round 2's clone held (`tmp/w19/` to `tmp/w24/` and their status notes), byte-identical to round 2's copies.
- The full mutation proof of `df0dac7` was running in the primary checkout throughout both runs, so the reviewers had no full-proof log for this code. Neither reviewer ran a test, a browser or a probe.

## Reviewers and coverage

Codex ran, and its report passed the runbook's checks.
- codex-cli 0.163.0. The runbook requires 0.156.1 or later, and the newest build it records as tested is 0.158.0. Rounds 1 and 2 ran on 0.163.0 too, and this round smoke-tested it again first.
- The runbook's diff form: `codex exec --model gpt-6-astra -c model_reasoning_effort=xhigh -c approval_policy=never --sandbox read-only --ephemeral -o …`, with the prompt as the argument and the diff on stdin. It ran from the clone, with the user config loaded (no `--ignore-user-config`). No other `codex exec` was running; only the desktop app's own servers were (`app-server` and `exec-server`).
- Model: the run header names `gpt-6-astra`, reasoning effort xhigh, approval never and sandbox read-only.
- DLL markers: the run produced neither `STATUS_DLL_INIT_FAILED` nor `-1073741502`. The stdout holds each string once, but only inside a line of round 2's record that Codex printed while reading it (`2_integration.md:24`). A check of each marker against the text around it found no other.
- Citations: every finding cites a file and line. Eighteen citations outside the diff's hunks were checked against the clone, and all hold:
  - X1: `tests/mutate.mjs:58–60` (`FOUND`: `found` turns true when a glide lands) and `:200–201` (`reveal-in-play`), and `tests/sequence.test.mjs:523–551` (Play's path test, on its own `msg=world&tour=0` page, checks the path only);
  - X4: `tests/illusion.test.mjs:698–707` (`missed()` and the tour shot's one retry; the assertion at `:720` lies in a hunk);
  - X5: `tests/illusion.test.mjs:710–714` (four comparisons of three camera-mode images) and `AGENTS.md:211` ("past the 100 ms allowed");
  - answers 1–3: `index.html:824–841` (`beginAnim` stamps a move with `performance.now()`; `stepAnim` clamps k and lands on the target), `:999–1004` (a zoom mid-move updates the move's target), `:1087–1098` (`tick` passes the frame's own time on), `tests/mutate.mjs:470` (an assertion counts as a check), `:526–539` (the killed and errored verdicts and the exit code) and `tests/page.test.mjs:232–252` (the budget test);
  - the evidence: `tmp/w25/mutate-r3.log:81–83` (`reduced-switch-glides-on` killed at the wait for the face), `:164–166` (`reveal-after-tour` also differs at the six new landings, 0.1077–0.1597 per channel), `:219–228` (`reveal-after-tour-find` and `draws-twice-a-frame`), `tmp/w25/mutate-r3-window.log:5–7` (2,015 and 2,014 ms), `tmp/w25/identity-counts.txt:206–207` (31 values off by more than one level) and `tmp/w25/retry/retry-probe.test.mjs:309–315` (the shot at the face forced 3.1 s into its hold).
- Run: 20 min 10 s (18:35 to 18:55), 275,332 tokens and 24 read-only shell commands. Codex shows neither turns nor cost.
- Its context was compacted once, after its 22nd command. Its last two commands then re-read the ranges its findings cite: `tests/sequence.test.mjs:265–350` and `:575–620`, `tests/mutate.mjs:190–205`, `AGENTS.md:200–212`, round 2's dispositions (`2_integration.md:500–539`) and the camera-mode test (`tests/illusion.test.mjs:632–725`). Round 1's run was compacted once too; round 2's was not.
- All 24 commands were screened after the run. They were PowerShell cmdlets that only read or print (`Get-Content`, `Select-String`, `Select-Object`, `ForEach-Object`, `Get-Location` and `Get-Date`), `rg`, and git (`status`, `rev-parse`, `diff` and `show`).
  - Git at first refused the clone as owned by another user, and Codex then added `-c safe.directory=<clone>` itself, as in rounds 0–2. Two commands also set `GIT_CONFIG_NOSYSTEM` and `GIT_CONFIG_GLOBAL=NUL` in their own process, and one passed `-c core.excludesfile=NUL`, so git read no system or global config there.
  - The git diffs were `git diff --stat 8560485 df0dac7` and, in the 21st command, `git diff --quiet`, which checked that no tracked file had changed.
  - Each one ran in the clone with repo-relative paths. The only absolute path any of them named is the clone's own, in `safe.directory`.
  - None ran npm, npx, Node, a test or a browser, and there were no MCP tool calls. The scanner's one alert was a false match: the word `chromium` in a line filter over the shoot logs (command 20, 197 ms).
  - The sandbox denied git's own lookup of the user's global ignore file (`~/.config/git/ignore`; two warnings). That is git reading its configuration, not a review read.
- One subagent spawn failed ("collab spawn failed … no rollout found", as in rounds 0–2). So no subagent contributed, as the report says.
- The read smoke test (runbook item 2) ran from the clone before the review, with the pinned model and effort. In 16 s it returned `START` and the third message with the right lines (`:15` and `:9`), with no DLL markers.

Claude ran, and its report passed the runbook's checks.
- claude 2.1.308. The runbook requires 2.1.280 or later, and its `modelUsage` check was proven on 2.1.281.
- The runbook's diff form: `claude -p --model "claude-opus-5-5[1m]" --effort max`, with the prompt by `--append-system-prompt` and the diff on stdin.
- Login check, as the runbook gives it: from a new empty folder outside every repo, with every tool off (`--tools=""`) and no MCP servers (`--strict-mcp-config`). It ran twice.
  - The first failed the check. Its init event named the pin with empty `tools` and `mcp_servers`, and stderr was empty. But the API's safeguards stopped the pin's answer to the one-word prompt (refusal category "cyber"), and the CLI answered with `claude-opus-4-8` instead (a `model_refusal_fallback` event; 2 turns, $0.07). So `modelUsage` held both keys. Its first request had also been retried once after a 401 `authentication_failed`. This is the case the runbook names: `claude-opus-4-8` answered once in nine checks on 2026-10-22.
  - The second, from another new empty folder, passed: one turn, $0.03, `modelUsage` exactly `claude-opus-5-5[1m]`, with no retry and no refusal.
  - The driver's watcher for the review would have ended at once on a fallback event or on an answer from any model but the pin, so a refusal could be acted on early. Neither occurred.
- Isolation. The reviewer worked in the clone, with `--tools "Read,Glob,Grep,Task,Bash"` and the runbook's allow list (`Read,Glob,Grep,Task,Bash(git diff *),Bash(git log *),Bash(git show *)`). `--permission-mode dontAsk` denies anything not pre-approved, and `--strict-mcp-config` loads no MCP servers. A deny list blocked:
  - edits, writes and web tools;
  - shell readers such as `cat`, `rg` and `sed`, plus `npm`, `npx` and `node`;
  - git forms that reach elsewhere or write a file (`git -C`, `git -c`, `--git-dir`, `--work-tree`, `--no-index` and `--output`);
  - reads of the primary checkout outside the clone, the running proof's folders included, this review's captures, `~/.claude`, `~/.codex`, the session temp folders and the fleet repo.
- A permission smoke test confirmed the setup before the run (low effort, 14 fixed steps, $0.94):
  - allowed: reads inside the clone, its copied evidence included, and git in it;
  - denied: reads of the primary checkout by absolute path and by a `..\` path, reads of its W25 evidence (`tmp/w25-status.md` and `tmp/w25/npmtest-1.log`), a Glob of `tmp/w25`, a Grep of its `tests/lib`, a read of `~/.claude`, and `cat` and `git -C`;
  - a `general-purpose` subagent with no model ran on the pinned model, so `modelUsage` still held one key.
  - Round 2's Glob probe named the running proof's folder. This round's named W25's evidence folder instead, so that even the smoke test left `tmp/proof-wu1-r3/` alone; the same kind of rule denies both.
- The CLI also loads `CLAUDE.md` files from the clone's parent folders, as every session in this repo does. Those are the primary checkout's `CLAUDE.md` and `AGENTS.md`, and the github folder's `CLAUDE.md` and `AGENTS.md`. The primary's `AGENTS.md` was byte-identical to the clone's (sha256 `af44c319`), and its `CLAUDE.md` differed only in line endings. This is the harness's load, not a reviewer read.
- Model: the init event named `claude-opus-5-5[1m]`, and `modelUsage` held exactly one key, `claude-opus-5-5[1m]`. Stderr was empty.
- Run: 81 turns, $10.56 and 26 min 34 s (18:35 to 19:02), with no subagents. It ran beside the Codex lane.
- Transcript audit: 80 tool calls, all inside the clone, so none read the primary checkout.
  - The calls were 44 Reads, 28 Greps, 4 Globs and 4 shell commands.
  - All 72 path arguments were inside the clone; the 4 Globs had none and ran in it, with patterns under `tmp/`.
  - Three shell commands ran: `git show --stat c4b27cb`, `git diff df0dac7 c4b27cb` and `git show c4b27cb:docs/work/1_sentence-sequence/plan.md`. Every git command read the clone's own repository.
- One call was denied: `git show … | wc -l; git show c4b27cb --stat | head -20`, for `wc` and `head`.
- Citations: every finding cites a file and line. Twenty-six citations outside the diff's hunks were checked against the clone, and all hold:
  - C1: `tests/illusion.test.mjs:671` (`window.__atE` is set from `performance.now()` after the frame callback), `tests/sequence.test.mjs:636` (the start hold judged by `rs[0].t1 - rs[0].t0`), `tests/motion.test.mjs:98–99` (the fling control's assertions), `tests/sequence.test.mjs:461` (the Tab test's precondition as an assertion) and `tests/mutate.mjs:470` (an assertion counts as a check);
  - C4: `index.html:118` (`HOLD_MS` 3000, `LOAD_HOLD_MS` 1500, `CAPTURE_HOLD_MS` 2000, `CUT_HOLD_MS` 4000), `README.md:9` ("holds there for 3 s") and `AGENTS.md:211` (the F86 mutants turn "each sequence check that had none" red, and only the shot-lead rule has none);
  - C6: `docs/learning/defect-register.md:117` (its mutant list names no `reveal-after-tour-find`);
  - answers 2 and 3: `index.html:141` (`clamp`), `:831` and `:839` (`stepAnim`'s k and its landing), `:891` and `:1045` (the snap's and the glide's targets carry a zoom), `:780–817` (`draw()`) and `tests/mutate.mjs:539` (the exit code);
  - the evidence: `tmp/w25/mutate-r3.log:28` (the stale "100 ms that NEXT_MAX_MS allows"), `:182` and `:221` (the two window misses), `:197–199` (frames still at the eye 248–266 ms after the first that named the next message), `tmp/w25/npmtest-3.log:120` (12 frames in the window), `tmp/w25/npmtest-1.log:85–88` (three images, four comparisons), `tmp/w25/pre-f88-base-gates.log:134` (Play clicked where the tour ended), `tmp/w25/extract.log:5–6`, `tmp/w25/compare-digests.log:28` and `tmp/w25/retry-probe.log:7`.

Prompts: `tmp/review-runs/wu1-round3/prompt-codex.md` and `prompt-claude.md` (ignored), built from one shared text, `prompt-core.md`. They differ only in logistics: the tools each lane may use, its subagent rule, where the diff comes from and the finding-ID prefix. They ask for an adversarial, report-only review of the target against the plan's acceptance criteria, AGENTS.md's invariants and round 2's dispositions F88–F95 with F87, through five questions:
- round 2's repairs, and any older check weakened without a stated, measured reason, naming the new error path for timing misses (`setup()` and the unjudged results), the hold judgement by frame stamps, the 10 ms next-name rule, the 1 s cut window with the 2 s short-hold mutant, and the capture-hold retry;
- the owner's rule against R3's `index.html` change (`stepAnim(Infinity)`, F94), and whether the landing is exact in every camera mode;
- the mutants: kills for the wrong reason or by a timing miss alone, checks still unproven, and whether the new error path can hide a page that is both wrong and slow;
- flakiness on a slower or loaded machine, now that more timing failures are errors;
- whether every measurement claim in AGENTS.md, README.md, the defect register and the test headers is backed by saved output or by code that computes it, with R3's corrections for F87 and F95.

The prompts forbid writes, tests and any browser workload. They ask, for every finding, a file and line at `df0dac7`, a severity, the F-ID it concerns (F87–F95) or "new", a failure scenario and a fix. Neither lane saw the other's output: neither prompt mentions the other lane, and the clone held no review output. Raw captures are under `tmp/review-runs/wu1-round3/` (ignored).

Independent coverage this round is two lanes. Neither abstained, and neither review run needed a retry. Only the Claude login check ran a second time, after the first fell back to another model (above).

## Reports

### Codex (`gpt-6-astra`, effort xhigh), 2026-10-22

Redacted: nothing. The report is Codex's `-o` output, which held no credentials, session details, echoed prompt or transport chatter. It has no headings of its own, so it is shown unchanged.

**Summary**

Five findings: **0 critical, 2 major, 3 minor**.

The production `stepAnim(Infinity)` change is sound. The review is not clean: R3 removes an older Play-history image check, permits a short cut hold to pass under sparse frames, and leaves timing-only failures that can count as mutant kills. Several documentation claims also remain inaccurate.

**How I checked**

I read the target diff, surrounding camera and rendering code, affected gates and mutation runner, the requested policies and review records, and `c4b27cb`’s plan notes. I compared the saved R3 logs, probes and extraction scripts with their code, consulting earlier evidence where claims carried forward.

No files were changed and no tests or browser workloads were started. One subagent launch failed; no subagent contributed. The counterexamples below are deductions from code, not executed reproductions. I could not verify the omitted screenshots or render caches, or the unfinished full mutation proof.

**Findings**

**X1 — Major — F88 repair removes the previously checked Play history**

Location: `tests/sequence.test.mjs:337–347`; previously `8560485:tests/sequence.test.mjs:263–266`.

The sole pictured Play run now follows six “Find the angle” landings. Before R3, it followed the completed load tour directly.

A concrete escaping change is the existing `reveal-in-play` effect, additionally conditioned on no Find landing having occurred. The existing `FOUND` instrumentation supplies that distinction (`tests/mutate.mjs:58–60`, `:200–201`). A visitor who watches the tour and clicks Play would see brighter text. Every current Play picture would suppress the effect because Find has already landed six times. The separate Play path test checks movement, not pictures (`tests/sequence.test.mjs:523–551`).

The new F88 coverage works, but it replaces an older history without a measured reason for dropping it.

Suggested fix: retain two independent pictured journeys—load tour → Play, and load tour → six Find landings—and add a mutant whose Play reveal disappears after Find.

**X2 — Major — F90/F92 cut-window widening allows the former 3-second defect to pass**

Location: `tests/sequence.test.mjs:581–589`, especially `:584`; `tests/mutate.mjs:287–292`.

`judgeCut()` accepts any frame stamped 2.5–3.5 seconds after the event as sufficient observation. That frame can precede a wrongly shortened hold’s end.

Concrete example, with times relative to the switch:

- The defective cut hold lasts 3,000 ms.
- A frame at 2,800 ms still shows hello world.
- The next frame is at 3,600 ms and shows the face.

The required pattern matches, the first face stamp exceeds 3,500 ms, and the 2,800 ms frame satisfies `near`. The check returns a judged pass. With the earlier 500 ms observation window, this example would have been unjudged.

The two saved window misses explain widening the window, but shortening the mutant to 2 seconds proves only the larger defect reliably. Its successful rerun does not restore coverage of the former 3-second defect.

Suggested fix: require an observed hello-world frame at or beyond the minimum duration before accepting the duration, otherwise return unjudged. Retain both the 2-second margin mutant and a 3-second boundary mutant. A bounded retry can address inadequate observation without turning it into a pass.

**X3 — Minor — F90/F93 capture recovery can discard evidence of another missed hold**

Location: `tests/sequence.test.mjs:275–279`, `:307–315`.

After every attempted shot, `holdShots()` advances `since` to the current end of the log—even when the attempt consumed its full 25-second timeout.

Suppose polling misses hello world’s entire first hold, although the frame log records it. At timeout, `cameBy()` correctly returns a timing miss. By then, the face’s first hold has also passed. Line 309 discards that history for subsequent checks.

The next face attempt can time out before the face returns on the next loop. Its `cameBy()` search finds nothing after the new `since`, so line 279 throws an **AssertionError**. The retry queue is never reached. A timing miss on a healthy page can therefore become a mutant kill.

The saved retry probe exercises a screenshot deliberately taken too late at the face; it does not exercise this whole-hold polling miss (`tmp/w25/retry/retry-probe.test.mjs:309–315`).

Suggested fix: track observed hold occurrences individually. Do not advance past evidence for unprocessed messages, and detect a completed-but-unshot hold promptly rather than waiting out the entire timeout.

**X4 — Minor — F90’s timing-error rule still leaks through the illusion file**

Location: `tests/illusion.test.mjs:698–707`, `:720`.

This is an inherited gap within F90’s requested classification repair.

The illusion file retries a missed tour shot once, but a second miss still reaches `assertNone(missed(h))`. On a loaded machine, both screenshots can finish after otherwise healthy holds. The resulting AssertionError counts as a CHECK and can kill an unrelated mutant.

R3 correctly distinguishes this situation in the sequence picture test, but not here. A green mutation control does not prevent a later, slower mutant run from encountering it.

Suggested fix: distinguish a late shot from an actual camera-contract failure here too. After the retry, an otherwise valid hold that the screenshot outran should produce an unjudged Error; an early departure or wrong camera state should remain a CHECK.

**X5 — Minor — F87/F95 documentation still overstates or mislabels evidence**

Locations and concrete discrepancies:

| Location | Problem |
|---|---|
| `AGENTS.md:146` | “Four shots” are four comparisons of **three** camera-mode images. The dwell image is compared twice (`tests/illusion.test.mjs:710–715`). The zero counts are supported; the independent-shot count is not. |
| `AGENTS.md:205` | For `reveal-after-tour`, “every other shot stays at 0” is now false. The saved R3 run also reports differences at the six new Find-after-tour landings (`tmp/w25/mutate-r3.log:164–166`). |
| `AGENTS.md:211`; `tests/mutate.mjs:294` | They still describe the next-name allowance as 100 ms / `NEXT_MAX_MS`. The implemented rule is now 10 ms using a different timestamp relationship (`tests/sequence.test.mjs:205–206`). |
| `tests/illusion.test.mjs:522–523` | The replacement comment says the identity holds within one level, omitting the 31 larger differences documented at `:125` and recorded in `tmp/w25/identity-counts.txt:206–207`. |

Suggested fix: distinguish comparisons from screenshots, label historical mutant measurements explicitly, update the next-name description, and retain the larger-difference exception in the identity explanation.

**Answers**

**1. Are F87–F95 correct and complete?**

| Repair | Assessment |
|---|---|
| **F87** | Exact difference counting is correct: it counts every nonzero channel difference without changing the residual threshold (`tests/lib/image.mjs:274–293`). The “four shots” wording needs X5’s correction. |
| **F88** | The six new landings and their mutant address the reported gap, but sacrifice the previous Play history: X1. |
| **F89** | Correct within its stated bound. Sampling now continues across all callbacks sharing a frame stamp and ends before the next stamp; each point draw is measured where it occurs (`tests/page.test.mjs:174–181`, `:218–234`). |
| **F90** | The successful polling result now supplies the hold timing directly; the specified move/setup guards use Errors. Timing-only CHECK paths remain: X3 and X4. |
| **F91** | The final guard now rejects a hold’s first frame: it requires a moving position away from every eye, with movement since the previous frame (`tests/sequence.test.mjs:698–705`). |
| **F92** | The inferred historical cause is now labelled correctly, and the 2-second mutant has ample measured margin. The widened observation window introduces X2. |
| **F93** | A straightforward missed capture screenshot is retried successfully. Whole-hold polling misses are not handled reliably: X3. The tour/Play no-retry limit is stated. |
| **F94** | Correct; see answer 2. |
| **F95** | Most listed corrections are supported, including seed exceptions, time-specific ranges, page scheduling and saved identity counts. X5 remains. |

Using frame stamps removes post-draw logging delay from the duration calculation. The new next-name rule also matches the current glide implementation: subsequent frames still at the old eye must be stamped less than 10 ms after the first next-naming frame finished (`tests/sequence.test.mjs:201–210`). I found no healthy-page failure in that rule itself.

There is one wording caveat: a hold is actually created with `performance.now()` in `beginAnim()`, not literally with its first frame’s stamp (`index.html:824–828`). The two clocks should not be described as identical.

**2. Does `Infinity` affect rendering or leave inconsistent camera state?**

No new production defect found.

`Infinity` enters only the progress calculation. With the finite start time and positive duration created by `beginAnim()`, clamping produces exactly `k = 1`. Easing receives 1, the exact target is copied, and `anim` is cleared (`index.html:824–841`). There is no subsequent `Infinity - Infinity` or multiplication by Infinity. The normal frame clock never receives this sentinel (`index.html:1087–1098`).

The surrounding modes remain consistent:

- Find and snap land exactly and become idle.
- Zoom during either move updates its stored target, so completion preserves that zoom (`index.html:999–1004`).
- The load tour stops in place; it does not promise to land at an eye.
- Play and capture cut to the current target and start their cut hold through the separate sequence branch.
- A coast settles; near an eye, existing reduced-motion settling may snap directly there.
- An active drag or pinch continues as direct input; reduced motion suppresses subsequent inertia.
- Idle remains idle. Switching reduced motion off does not resurrect the cleared animation; existing sequence/startup rules still apply.

These paths are at `index.html:883–893`, `:938–1004`, `:1060–1077`. The changed line introduces no particle, shader or angle-dependent rendering branch.

**3. Do the mutants prove the intended checks?**

The two new mutants die for their intended defects in the saved output:

- `reveal-after-tour-find`: picture residuals at the six new landings and subsequent Play hold (`tmp/w25/mutate-r3.log:219–224`).
- `draws-twice-a-frame`: 96,000 particles in two draws, exceeding both count and fill bounds (`tmp/w25/mutate-r3.log:226–228`).

The final 2-second hold mutant dies on first-face stamps of 2,015 and 2,014 ms (`tmp/w25/mutate-r3-window.log:5–7`). None of these is a wholesale page failure.

One qualification: the saved `reduced-switch-glides-on` run dies through the wait for the face, rather than reaching the intended immediate-cut assertion (`tmp/w25/mutate-r3.log:81–83`). That is weaker evidence for that particular assertion.

The shot-lead assertion’s lack of a mutant is reasonable: the harness itself waits until the lead has elapsed. Exact difference counts are diagnostics, not new acceptance checks. X1 and X2 identify missing mutation coverage that matters.

An Error can conceal a real wrong-and-slow case diagnostically. For example, fewer than three post-switch frames are classified as unjudged before their movement is checked (`tests/motion.test.mjs:160–163`). This remains a red test; a mutant with only Errors is “errored,” not killed (`tests/mutate.mjs:470`, `:526–539`). “Unjudged” must not be interpreted as proof of harmless flakiness.

**4. What remains flaky or vulnerable under load?**

X2–X4 are the material problems.

The remaining declared limits are real:

- Tour/Play hold shots have no retry; a loaded machine can fail them as Errors.
- Rest shots have no hold deadline, but “on landing” means the first screenshot automation obtains after landing, not the exact arrival frame.
- Escape’s actual mid-glide guard fixes the reported false pass. The 5° polling margin is not a guarantee that input dispatch occurs before that margin is consumed.
- The motion test requires three frames within one second and fails as unjudged when it cannot obtain them (`tests/motion.test.mjs:151–169`).
- The budget probe needs a following animation-frame callback within ten seconds. It measures one frame per view, not sustained frame cost (`tests/page.test.mjs:222–252`).

The revised scheduling keeps landing/reference workloads away from timed hold screenshots (`tests/sequence.test.mjs:393–418`). That reduces contention but does not remove these limits.

**5. Are the measurement claims supported?**

The principal R3 totals are supported by saved output and corresponding computation:

- 48 tests; saved suite times 231.7, 229.8 and 231.4 seconds.
- 132 mutants: 109 page and 23 tree.
- 26 sequence picture comparisons per run, each comparing 451,920 channel values.
- Four illusion mode comparisons per run, each comparing 1,807,680 values.
- The saved 204-render identity count: 44,879 differing values, including 31 differing by more than one level.

The extraction and counting code supports how those numbers were obtained. The omitted render caches prevent independently recomputing the image counts. X5 lists remaining inaccurate claims. I found no additional issue in README’s unchanged instructions.

**Read outside the diff**

Among the unchanged code and reference ranges read:

- `index.html:611–817`, `:824–1058`, `:1087–1098`
- `tests/lib/harness.mjs:1–130`
- `tests/illusion.test.mjs:635–709`
- `tests/mutate.mjs:457–539`
- `scripts/shoot.mjs:55–64`, `:192–262`
- `README.md:1–25`
- `docs/work/1_sentence-sequence/reviews/2_integration.md:501–530`
- `c4b27cb:docs/work/1_sentence-sequence/plan.md:67–76`, `:196–203`

### Claude (`claude-opus-5-5[1m]`, effort max), 2026-10-22

Redacted: one line. The report is the `result` field of the run's final event, less its first line: a sentence before the report's title saying that no subagents were used, nothing was run and all evidence was read by path, and that it would now write the report. Its "How I checked" says the same. The rest held no credentials, session details or echoed prompt. It is shown with its `#` heading as `####`, its `##` headings as `#####` and its `###` headings as `######`, so that they nest under this section. Nothing else is changed.

#### Review round 3 of work unit 1, repair round 3 (`8560485..df0dac7`)

##### Summary

- **Findings:** 6, all minor (C1–C6). None critical, none major.
- **Page change:** the F94 edit to `index.html` is correct. It moves only the camera, so the owner's rule holds.
- **Repairs done:** F87, F89, F91 and F94 are complete. F88, F92 and F93 are complete as round 2 scoped them.
- **Repairs left open:**
  - F90's three named leaks are closed, but the class is not. Timing misses outside them still fail as checks (C1). A new path in capture's first pass turns a miss into a check (C2).
  - The cut-hold window proves less than the docs say. Its new error path can turn a sound page's `npm test` red (C3).
  - R3's hold checks, now timed by stamps, have no mutant (C4).
  - R3's reordering stopped picturing Play straight after the tour (C5).
  - F95's corrections hold, but R3 left or added a few stale claims (C6).
- **Verdict:** changes requested, minor only. Nothing here ships a broken or rule-breaking page.

##### How I checked

- **Plan and records:**
  - the plan at `c4b27cb` (acceptance, the R3 notes, F87);
  - round 2's record in full, and rounds 0–1 for context;
  - `AGENTS.md` outside the canon block, `README.md`, the defect register, `lessons.md` and `local-rules.md`.
- **Code at `df0dac7`:**
  - the full target diff;
  - `index.html`'s camera, input, handler and main loop;
  - all of `tests/sequence.test.mjs` and `tests/motion.test.mjs`;
  - the budget probe and test in `tests/page.test.mjs`;
  - the camera-mode test, the identity helper and the header in `tests/illusion.test.mjs`;
  - the mutant helpers, every R1a–R3 mutant and the verdict code in `tests/mutate.mjs`;
  - `harness.mjs`'s `until` and `setup`, and `messages.mjs`.
- **Evidence:**
  - `tmp/w25-status.md`;
  - the three `npm test` logs, `extract.mjs` and `extract.log`;
  - both R3 mutation logs;
  - the pre-checks: `pre-seq-1`, `pre-f88-base-gates` and `pre-f89-base-probe`;
  - the budget probe logs, the F94 float check, the identity script and its counts, `compare-digests.log`, the retry probe and its log, both hash lists, and the `shoot-seq` log;
  - W24's `alike-by-time.txt` and its `npmtest-4..6` totals.
- **Method:** no subagents. I ran no tests, `npm`, `node` or browser. I used Read, Grep and Glob, plus `git show` and `git diff`. Grep over a folder skips the ignored `tmp/` files, so I read each evidence file by its path.
- **Could not check:**
  - That the logged runs used `df0dac7`'s exact bytes. `hashes-before-mutate-2.txt` lists sha256 values, and I can't hash files with the tools allowed.
  - W24's render cache, which the identity counts read.
  - The full mutation proof, which is still running.

##### Findings

###### C1 — minor — F90 (incomplete): timing misses and setup guards outside the three named leaks still fail as checks

**Where:**
- **The illusion file's tour shot** (`tests/illusion.test.mjs:720`):
  - After two misses it fails through `assertNone(missed(h), …)`. That is an `AssertionError`, which `tests/mutate.mjs:470` counts as a check.
  - Its miss boundary is `window.__atE`. Line `:671` sets it from `performance.now()` after the frame callback, so after the draw.
  - Those are the two leaks F90 named for the sequence file.
- **The start hold** (`tests/sequence.test.mjs:636`):
  - It is still judged by logged times: `rs[0].t1 - rs[0].t0 >= START_HOLD_MIN_MS`.
  - The header (`:12–13`) says "durations that the page times are judged by the frames' stamps". `AGENTS.md:180` says holds were timed by logged times only before R3.
  - That span is 1,500 ms less the first frame's draw time. So a first draw over 300 ms fails a sound page as a check. The runs measured 1.49–1.50 s against the 1.2 s bound.
- **Two more timing-dependent preconditions written as assertions:**
  - `tests/motion.test.mjs:98–99`: the fling control, whose release must reach the page within its 60 ms window;
  - `tests/sequence.test.mjs:461`: the Tab test, which needs capture still at hello world for 6.5 s.

**Failure scenario:** a heavy mutant slows the illusion file's tour frames by more than 1.3 s on both attempts. The test fails at `:720`, and the mutant counts as killed by a timing miss, not by its residual. On `npm test` the same red reads as a page defect.

**Fix:**
- Throw a plain Error on the second tour-shot miss, and time it from the rAF stamp.
- Judge the start hold by stamps.
- Route the fling control and the Tab precondition through `setup()` or plain Errors.

###### C2 — minor — F90/F93: a hold that "came and went" in capture's first pass turns the next hold's wait into a check

**Where:** `tests/sequence.test.mjs:275–279`, `:307–311`, `:293–295`, `:744`/`:749`.

**Problem:**
- A first-pass hold the poll never sees is classed as missed only when its whole 25 s `HOLD_WAIT_MS` runs out (`:278`).
- By then the loop is about 19 s past that hold. The next eye's first-pass hold has gone too, and its next pass comes about 32 s later, past that eye's own 25 s wait.
- `cameBy` finds nothing logged since `since`, so `:279` throws an `AssertionError`: a check.
- Separately, a shot whose reads take longer than about 8.9 s finds `target()` two messages on. That counts as neither `held` nor `movedOn`, so it fails as a check at `:744`.
- The retry probe (`tmp/w25/retry-probe.log:7`) forced only the other kind of miss: a shot taken 3.1 s into its hold.

**Failure scenario:** a stall of 3 s or more starts as capture's hold k begins.
1. Hold k is "missed", an error.
2. Hold k+1 is "not reached within 25000 ms", a check.
3. The mutant counts as killed, or `npm test` shows a check with no page defect.

**Fix:**
- Let the poll also return once the hold has been logged since `since` and has ended, so this miss is found at once.
- After any miss, wait `LOOP_WAIT_MS` for the next eye.
- Class a read that names a later message, more than `HOLD_MS` after the stamp, as a miss.

###### C3 — minor — new in R3 (F90, F92): the cut-hold window proves less than the docs say, and its error path can fail a sound page

**Where:**
- `tests/sequence.test.mjs:584–588` (`judgeCut`), with its claims at `:40–42`, `:578–580` and `:128`;
- `AGENTS.md:187`;
- `tests/mutate.mjs:287–292`.

**What the window proves:**
- `judgeCut` proves only that the cut hold lasted until the last frame stamped before 3.5 s. That frame can be as early as 2.5 s.
- **Example:** a 2.8 s cut hold, with frames stamped at 2.7 s and then 3.6 s, passes: `near` = 1 and `face` = 3.6 s. Under the 0.5 s window that run would have been unjudged.
- With the 0.5 s window, no cut hold of 3.0 s or less could pass. With 1 s, the bound falls to 2.5 s, and the docs don't say so.
- The 2 s mutant was chosen to lie "wholly past" the window. So no mutant tries a hold between 2.5 and 3.5 s.
- `AGENTS.md:187` says a frame in the window stops "a hold that ended there" passing unseen. That is too strong.

**Flakiness (new in R3):**
- When no frame falls in the window, the test fails as an error. That turns a sound page's `npm test` red and stops a mutation run at its control (exit 2).
- With the 0.5 s window, 2 of R3's 34 mutant runs had no frame in the window, on pages that cut as the real one does (`tmp/w25/mutate-r3.log:182`, `:221`).
- The final runs had as few as 12 frames per 1 s window (`npmtest-3.log:120`), against 29–60 in the other cases.
- From the logged test times, the switch test runs about 42–52 s into the file. The five landing pages start about 45 s in, when capture's first pass is shot. So the window falls in the file's heaviest stretch.

**Fix:**
- Require a frame at hello world stamped at 3.5 s or later. That proves the bound.
- Retry an unjudged case once.
- Run the switch pages outside the landing pages' start.
- State in the docs what the window proves.

###### C4 — minor — new: no mutant shortens a sequence hold or Play's cut hold, so R3's hold checks timed by stamps are unproven

**Where:** `tests/sequence.test.mjs:209–210` (`HOLD_MIN_MS` 2,500), `:554–573` (Play's cut timed from the click), `tests/mutate.mjs:68–332`, `AGENTS.md:211`.

**Problem:**
- No mutant changes `HOLD_MS`, `LOAD_HOLD_MS`, `CAPTURE_HOLD_MS` or `CUT_HOLD_MS` (`index.html:118`).
- `reduced-switch-short-hold` shortens only the cut hold that the switch begins (`tests/mutate.mjs:291–292`).
- `AGENTS.md:211` says the F86 mutants cover each sequence check, and exempts only the shot-lead rule.
- Judged by stamps, a sound page's hold spans at least 3,005 ms, and its cut hold at least 4,000 ms, by construction. So the 500 ms slack now passes a 2.6 s hold, or a 3.6 s Play cut hold, on every run.

**Failure scenario:** `HOLD_MS = 2600`, against the 3 s that `README.md:9` promises, keeps every gate green.

**Fix:**
- Add mutants: a 2 s sequence hold, and a 3 s cut hold for Play.
- Consider tightening both bounds to the page's own values less a few ms, or state the slack as the design bound.

###### C5 — minor — F88: Play is no longer pictured straight after the tour, though `AGENTS.md:240` still says so

**Where:** `tests/sequence.test.mjs:337–347`, `AGENTS.md:240`.

**Problem:**
- Before R3, Play was "clicked where the tour ended" (`tmp/w25/pre-f88-base-gates.log:134`).
- Now it is clicked after the six landings.
- The commonest path, watching the tour and then pressing Play, is pictured nowhere. Play's own path test loads `msg=world&tour=0` and checks only the path.
- A reveal in Play's holds that needs "tour played, Find never used" was caught at Play's face shot before R3. It now passes, and no reason for that change is stated.

**Fix:** state the new history in `AGENTS.md:240` and the header (`:100–112`), or picture Play straight after the tour on a page of its own.

###### C6 — minor — F95: remaining or new over-claims

- **`hold-names-next-early` text** (`AGENTS.md:211`, `tests/mutate.mjs:294`): "past the 100 ms that `NEXT_MAX_MS` allows".
  - R3 replaced that rule with `NEXT_STAMP_MS`, 10 ms by stamps (`tests/sequence.test.mjs:127`), and `NEXT_MAX_MS` is gone.
  - The mutation log prints the stale text (`mutate-r3.log:28`).
- **`reveal-after-tour`** (`AGENTS.md:205`): "every other shot stays at 0". R3's own run shows it also fails at all six tour-page landings, at 0.1077–0.1597 per channel (`mutate-r3.log:166`).
- **`AGENTS.md:182`:** "249–266 ms". The log shows 248–266 (`mutate-r3.log:197`, `:199`).
- **`AGENTS.md:146`:** "each of the four shots". There are three shots and four comparisons (`npmtest-1.log:85–88`).
- **Defect register** (`docs/learning/defect-register.md:96`, `:117`): not updated for F88. It omits the tour page's six landings and `reveal-after-tour-find`.
- **`tests/illusion.test.mjs:522–523`:** "to within one level". 31 values differ by more (`identity-counts.txt:206–207`).
- **Misplaced comment** (`tests/sequence.test.mjs:231–233`): `sameDocument`'s comment now sits above `logLength`.

**Fix:** correct each one.

##### Answers

###### 1. Round 2's repairs

| Finding | State | Evidence |
|---|---|---|
| F87 | Complete. Exact counts replace "exactly 0". | `tests/lib/image.mjs:271–296`; 0 of 451,920 differing channel values in all 78 sequence shots, 0 of 1,807,680 in all 12 illusion comparisons (`extract.log:5–6`) |
| F88 | Complete as scoped (but see C5). The tour page lands at all six eyes; the new mutant passed the old gates 48/48 and now dies at all six landings and Play; the Bound names the unpictured histories. | `:337–343`; `pre-f88-base-gates.log:123`, `:205`; `mutate-r3.log:224`; `AGENTS.md:239` |
| F89 | Complete. The sample is bounded by rAF timestamps. The real page reads the same digits as the old probe; the double draw reads 96,000 particles at 5.446–5.899×. | `page.test.mjs:175–180`, `:218–220`; `probe-real.log`; `probe-draws-twice.log:2–8` |
| F90 | The three named leaks are closed: the poll's own result is used (`:275`, `:281`), the miss is timed from the stamp (`:295`), and the guards go through `setup()` or plain Errors. The class stays open (C1, C2). | `:275`, `:281`, `:295` |
| F91 | Complete. The guard now requires the frame before the press to be moving. In the final runs Escape came 0.002–4.4° past the eye just left. | `:702`, `:725`; `npmtest-1..3.log:125` |
| F92 | Done as asked: the mutant now holds 2 s, and the cause is stated as inferred. But see C3. | `mutate-r3-window.log:7`; `AGENTS.md:188` |
| F93 | Complete as scoped: capture retries a missed hold once, and the no-retry holds are stated. C2 is a remaining leak. | `retry-probe.log:7`; `AGENTS.md:241` |
| F94 | Complete; see Q2. | `index.html:1066` |
| F95 | The nine listed claims are corrected and match the logs. C6 lists what remains. | see C6 |

**Were older checks weakened?**
- **The next-name rule** is stronger and cannot fail a sound page. A frame still at the eye is stamped less than about 5.3 ms after the glide began. The glide begins at or before the first naming frame's logged time.
- **Hold spans** come to 3,005 ms or more by stamps on a sound page.
- **The motion window** widened from 0.3 s to 1 s.
- **Remaining weakenings** are the cut window (C3) and Play's history (C5).
- I found no seed, view, threshold or assertion loosened anywhere else.

###### 2. The owner's rule

`stepAnim(Infinity)` makes k exactly 1, by `Math.min(1, Math.max(0, Infinity))` (`index.html:141`, `:831`).
- **No NaN:** `ms` is 2,200 or 900, and no product of 0 and Infinity occurs.
- **Exact landing:** both eases give exactly 1 at k = 1, and `:839` sets the target. The target always carries a defined zoom (`:1045`, `:891`), and `zoomBy` (`:1003`) updates it when the viewer zooms mid-move.
- **Every mode lands or stops exactly:**
  - glide and snap: they land, with any mid-move zoom kept;
  - load tour: `stopAuto`;
  - Play and capture: they cut, unchanged by R3;
  - coast: `settle`;
  - drag or pinch: nothing changes until release;
  - idle: nothing happens;
  - switching reduced motion off: the handler returns at `:1062`.
- **State afterwards:** idle, `heading` −1, `anim` null, cursor set.
- **Rendering:** `draw()` (`:780–817`) is untouched and has no dependence on the angle. Digests: 27 of 27 and 45 of 45 are the same (`compare-digests.log:28`).

###### 3. Mutants

- **New and touched mutants:** each dies by its own check.
  - `reveal-after-tour-find` dies at the pictures check: `mutate-r3.log:219–224`.
  - `draws-twice-a-frame` dies at the budget check: `:226–228`.
  - `reduced-switch-short-hold` dies at `face < 3500`.
- **Extra errors:** the extra ERRORs in `reveal-extra-text-pass`, `play-cuts`, `reduced-switch-coasts-on` and `reveal-after-tour-find` are setup or window errors. None counts as a kill.
- **`hold-names-next-early`** dies in the cut tests only because their waits fire 250 ms early (`:193–195`). That is the right defect, but the message says the log is incomplete.
- **Checks without a mutant:**
  - the hold span and Play's cut (C4);
  - the motion window's widening to 1 s;
  - F94, which cannot be seen through `window.__cloud`, a sound reason;
  - the unjudged paths, which are errors by design.
- **The error path:** errored mutants still make the proof exit 1 (`mutate.mjs:539`), so nothing passes silently. But a page that stops drawing after the switch would read "could not be set up" (`motion.test.mjs:151`). C1 and C2 leak the other way: misses counted as kills.

###### 4. Flakiness

- **Hold shots:** they take 65–191 ms and end 1.30–1.42 s before the hold does. The tour's and Play's face holds have no retry. C2 covers the remaining leak.
- **Rest shots:** a rest has no end, so they can't fail a sound page; they took up to 3.7 s.
- **Cut window:** C3.
- **Escape:** robust. In practice the setup fires 4–5 frames into a glide, about 4 s before it lands.
- **Motion switch test:** 61 frames per window.
- **Budget probe:** robust, 3.18 s.
- **Tour page:** each landing waits 25 s for a 2.2 s glide, so it is robust.
- **Start hold:** C1.

###### 5. Measurement claims

These all match the logs:
- the test times, phases and budget test times;
- 132 mutants (109 page, 23 tree), and the R3 run's 8,149 s, 205–272 s per mutant and 461 s rerun;
- 44,879 differing channel values and the row ranges;
- 0 of 451,920 and 0 of 1,807,680;
- 96,000 particles at 5.45–5.90×;
- 0.108–0.160 for `reveal-after-tour-find`;
- 2,015 and 2,014 ms for the short-hold mutant;
- the cut holds' 4.002–4.015 s and 12–60 frames;
- holds 65–191 ms ending 1.30–1.42 s early, and landing shots 0.07–3.70 s;
- the register's 0.952–1.015, 0.951–1.020 and 7.2–12.4%;
- "about 16 s" more for the sequence phase (means 68.7 s before and 85.1 s after);
- "ten pages", which my reading of the schedule supports.

**Exceptions:** C6, and C3's wording. "Every other shot stays at 0.0000" for `reveal-after-tour-find` is in no log, but it follows from the mutant's condition (`autoplayed && found`).

##### Read outside the diff

- `index.html:116–145`, `:530–609`, `:780–1102`
- `tests/sequence.test.mjs:421–552`, `:625–669`
- `tests/motion.test.mjs:46–120`
- `tests/page.test.mjs:140–155`, `:186–217`, `:238–253`
- `tests/illusion.test.mjs:620–700`, `:512–527`
- `tests/mutate.mjs:36–67`, `:150–319`; grep hits at `:18–26`, `:459–539`
- `tests/lib/harness.mjs:95–131`
- `tests/lib/messages.mjs:1–31`
- `docs/learning/defect-register.md:84–131`
- `README.md`, `docs/learning/lessons.md`, `docs/policies/local-rules.md`

## Findings and disposition

Stable IDs continue from round 2 (F88–F95). The M-labels are the review driver's merge of the two lanes.
- Both lanes agree that R3's `stepAnim(Infinity)` is correct and leaves rendering and the angle alone, so the owner's rule holds.
- They agree that F87, F89 and F91 are repaired, and that an errored mutant still fails the proof.
- Codex rates M1 and M2 major; Claude rates every item minor ("changes requested, minor only").

The coordinator's reassessment (fleet R11, "reassess after two failures for one reason"):
- These findings fall in four classes that rounds 1–3 each found again after repairs:
  - timing misses that count as checks (F79, F90, now M3–M6);
  - pictures that need one more interaction history (F78, F88, now M2);
  - timing tolerances that no mutant probes (F86, F92, now M1 and M7);
  - doc claims drifting from the logs (F85, F95, now M8).
- Each repair added test code that the next round found new edge cases in, so patching instances is not converging.
- None of these findings touches the page's behaviour, legibility, hiding, or the owner's rule. Both lanes confirmed in every round that the render reads only the camera, the particle clock, the seed and the test parameters.
- So this round stops repairing gate behaviour. The coordinator states M1–M7 as bounds in AGENTS.md, corrects the doc claims (M8), and audits the final full proof for mutants that only a timing line kills. The owner can ask for a further repair round; two of the fleet's five are left unused (corrected in review round 4, which found "four" here).

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F96 | M1 (Codex major, Claude minor), F90 and F92's repair. A cut hold is judged from frames stamped 2.5–3.5 s after the switch, so one that ends about 2.8–3.0 s in, with no frame between its end and 3.5 s, passes. No mutant holds in that range (`tests/sequence.test.mjs:584`, `:128`; `tests/mutate.mjs:287–292`). | Accepted as a bound. Missing it needs a gap of about 0.5 s or more with no frame drawn, and it concerns only how long reduced motion's cut holds last. | State it in AGENTS.md "Bound". |
| F97 | M2 (Codex major, Claude minor), F88's repair. Play is pictured only after the six "Find the angle" landings, so Play straight after the tour, with "Find the angle" never used, is pictured nowhere, and no reason for the move is stated (`tests/sequence.test.mjs:337–347`). | Accepted as a bound of the history class. The pictures cover listed histories only, and the page's render reads no history (reviewed in every round). | State the history and the reason for the order (load during the hold shots, R3) in "Bound". |
| F98 | M3 (both lanes), F90 and F93: if polling never sees a capture hold, it is counted missed only after its 25 s wait. By then the next hold has passed too, so that wait fails as a check at `tests/sequence.test.mjs:279` before the retry runs. | Accepted as a bound: under heavy load a slow page can then count as a mutant's kill. | State it in "Bound", and audit the proof's kills at that line. |
| F99 | M4 (both lanes), F90, inherited from before R3: the illusion file's second missed tour shot fails as a check, timed from `window.__atE`, which is set after the draw (`tests/illusion.test.mjs:720`, `:671`). | Accepted as a bound, for the same reason. | As F98, at that line. |
| F100 | M5 (Claude): other timing preconditions still fail as checks: the start hold is timed by logged times, not stamps (`tests/sequence.test.mjs:636`, against the claim at `:12–13`); the fling control (`tests/motion.test.mjs:98–99`); the Tab test's precondition (`tests/sequence.test.mjs:461`); and a capture shot whose reads take over about 8.9 s (`:744`). Codex adds that `reduced-switch-glides-on` died only by the 8 s wait for the face. | Accepted as bounds; the stamp claim is corrected. | State them in "Bound", correct the claim, and audit the proof's kills at those lines. |
| F101 | M6 (Claude), new in R3: when no frame falls in the 1 s cut window, the test fails as an error, so a sound page can turn `npm test` red and stop a mutation run at its control. The final runs had as few as 12 frames there. | Accepted as a flake risk. | State it in "Bound". |
| F102 | M7 (Claude): no mutant shortens a sequence hold or Play's cut hold. The 2,500 ms bound passes a 2.6 s hold or a 3.6 s cut hold, though AGENTS.md implies every sequence check has a mutant (`tests/sequence.test.mjs:209–210`, `:554–573`; `index.html:118`). | Accepted as a bound: hold lengths are a design tolerance, not part of the owner's rule or the acceptance criteria. | State it in "Bound", and correct the claim that every sequence check has a mutant. |
| F103 | M8 (both lanes): doc claims that drift from the logs (list below). | Accepted. | Correct each claim. Test-file comments change only after the full proof, so the proof's bytes stay fixed. |

F103's claims:
- `AGENTS.md:211` and `tests/mutate.mjs:294` describe the old 100 ms next-name rule.
- `AGENTS.md:205` says `reveal-after-tour` leaves every other shot at 0; it also fails at the six new landings.
- `AGENTS.md:146` says "four shots"; there are four comparisons of three images.
- `tests/illusion.test.mjs:522–523` says "within one level" and leaves out the 31 values that differ by more.
- `AGENTS.md:182` says 249 ms; the log shows 248.
- `docs/learning/defect-register.md:96` and `:117` are not updated for F88.
- The comment at `tests/sequence.test.mjs:231–233` is misplaced.
- Codex's caveat: a hold begins at `performance.now()` in `beginAnim`, not at its first frame's stamp.

## Verification

- The review driver checked provenance and isolation:
  - Codex 0.163.0: `gpt-6-astra` at xhigh, read-only, 275,332 tokens, 18 citations outside the hunks that hold, and DLL markers only where Codex quoted round 2's record.
  - Claude 2.1.308: `modelUsage` exactly `claude-opus-5-5[1m]`, 81 turns, $10.56, 26 citations outside the hunks that hold.
  - Both read only a clone detached at `df0dac7`, unchanged after both runs.
- One Claude login check failed first: a classifier blocked the pinned model's reply to "ok", and the CLI answered with another model. This is the case the runbook names. A second check passed, and the review ran on the pin.
- The session restarted at about 18:14, which stopped the review before its lanes began and the full proof after its control and 1 mutant. The coordinator resumed both; no reviewer or proof process had survived.

## Round outcome

Changes requested, all as bounds or doc corrections (F96–F103), none against the owner's rule. No further repair round runs unless the owner asks for one. Repair rounds used: 3 of 5.
