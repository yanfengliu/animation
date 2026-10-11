# Review 2: implementation

## Target

Repository `animation`, `main` at `37cce18`. The repair diff is `git diff 0ddaa11..37cce18`: W5's `22cdf3e` (page and shoot tool) and W6's `37cce18` (gates and docs). Before the review, the coordinator ran `npm test` (35 of 35 pass in 46.5 s) and read W6's mutation log: control green, 44 killed, 0 survived, 0 errored.

## Reviewers and coverage

The Claude CLI 2.1.281, `claude -p --model "claude-opus-5-5[1m]" --effort max`, with read-only tools. `modelUsage` held exactly one key, `claude-opus-5-5[1m]`. The run took 33 turns and cost $6.56. No Codex lane was run, by choice, as in rounds 0 and 1. The brief is in `tmp/review-runs/round2/prompt-claude.md` (ignored run output).

## Reports

### Claude (`claude-opus-5-5[1m]`, effort max)

# Review round 2: `0ddaa11..37cce18` (read-only)

I found one major defect and three minor ones.

- **Major:** in the mutation proof, a page that never becomes ready still kills a mutant, through the font-hang test. So R1-1's broken-mutant case is still open.
- **Repaired:** F10, F11, F12, F13, F16 and F17. F13's slop rule is correct for every sequence I traced.
- **Partly repaired:** F9, F14 and F15.
- **F18:** repaired except for the four doc lines named below.

I ran no tests and changed no files. I only used `git`, `grep`, and `node -e` to print node:test's built-in source.

## Findings

**R2-1 · major · `tests/page.test.mjs:151–160`, `tests/mutate.mjs:19–21` and `:247–260`, `AGENTS.md:88–90`: a page that never becomes ready still kills a mutant**
- **Defect:**
  - The font-hang test opens the page with `ready: false` and catches every `waitForFunction` error with a bare `catch {}` (`:156`).
  - It then asserts `ms !== null` (`:160`). So any page that never reports ready fails this test with an AssertionError.
  - `mutate.mjs:193` counts that as a CHECK. But `mutate.mjs:20` and `AGENTS.md:88` say such a page is an ERROR.
- **Failure (traced, not run):** take a new shader mutant with a GLSL typo, such as the `text-drifts-sideways` edit without its `;`.
  - `compile()` throws, and `initGL`'s catch shows the WebGL fallback (`index.html:560`, `:591`). `ready` stays false.
  - Every illusion test fails with failureType `hookFailed`. Every controls test and 5 page tests fail in `waitFrames` with a plain Error. All of these are ERRORs.
  - The no-WebGL test passes, because the fallback still works.
  - The font-hang test fails at `:160`, which is a CHECK.
  - Result: "KILLED by 1 check(s)" with 1 green test. The 0-green flag does not fire, and the exit status is 0. The gate the mutant targets never judged it.
- **JS syntax errors:** a typo in the page script fails `:159` (the stylesheet is added by script) and the no-WebGL check at `:179`, both as CHECKs. All tests are red, so the mutant is flagged. But `:260` ignores flags and exits 0.
- **Scope:** this is R1-1's second case, which F9 was meant to close. None of the 44 current mutants breaks the shader or the script, so today's proof is not affected.
- **Fix:**
  - In the font-hang test, first open a baseline load with `fonts: 'empty'` through `openPage`. A page that cannot become ready then fails with a plain Error, which counts as an ERROR.
  - Catch only `TimeoutError` at `:156`.
  - Make `mutate.mjs` exit 1 when any mutant is flagged.

**R2-2 · minor · `tests/hygiene.test.mjs:195`, `:109`, `:52–53`, `:29–30`; `AGENTS.md:106`, `:110`, `:117`; `docs/learning/defect-register.md:20`, `:36`: the scan still misses openers in settings hooks**
- **Commands skip the child-process check:**
  - Test 4 loops over `sources` only (`:195`).
  - The header says the scan proves this "for that text" (`:9`), and that text includes npm scripts and settings commands. `AGENTS.md:110` and register `:20` make the same claim.
  - Example: a `.claude/settings.json` PostToolUse hook with the command `node -e "require('child_process').spawn('cmd',['/c','start','index.html'])"` passes all four tests.
  - I traced each pattern against it. No BANNED rule matches. SHELL_OPENER needs whitespace after `start` but finds `'`. Test 3 sees no `file:`.
- **Hook scripts are not read:**
  - A hook usually runs a script file, such as `"command": "bash .claude/hooks/after-edit.sh"`. The scan reads that command but not the file, because it reads only `scripts/`, `tests/` and the root (`:52–53`).
  - The blind-spot lists (`:29–30`, `AGENTS.md:117`, register `:36`) don't name this case.
  - `AGENTS.md:106` also doesn't say that only 10 file types are read, so a `scripts/view.py` is never scanned.
- **Version-pinned Playwright:** `npx playwright@1.63.0 open index.html` passes. `:109` needs whitespace right after `playwright`, and `:114` needs the opener right after `npx` and its flags.
- **Fix:**
  - Run the `child_process` token and spawner checks over `commands` too.
  - Scan code files under `.claude/`, or any repo file a command names.
  - Allow `@version` at `:109`.
  - Name what remains in the three blind-spot lists.

**R2-3 · minor · `tests/page.test.mjs:147–161`: the 10 s font bound passes a page that waits for the font host**
- **Defect:** F15 raised the bound from 3 s to 10 s. The comment at `:148–149` says "a loose bound loses nothing", but that is true only for a page that never draws.
- **Failure:** a change that holds the first `requestAnimationFrame(tick)` until `fontCss` fires `load` or `error`, or until 5 s pass.
  - Every other gate answers the stylesheet at once (`harness.mjs:47`), so they see no delay.
  - In this test the page draws about 5 s late. That is still within 10 s, so the test passes.
  - This breaks the comment at `index.html:78`: a slow font host should "never hold up the page". The old 3 s bound would have caught it.
- **Fix:** time the baseline load from R2-1. Require the hang load to draw within that time plus a fixed margin of about 2 s.

**R2-4 · minor · `tests/hygiene.test.mjs:121–122`, `:125–126`, `:131–134`, `:196–219`: false positives on ordinary code**
- **Pauses:**
  - `.pause(` is allowed only when the receiver is named stdin, stdout, stderr, `*stream`, `rl` or `readline` (`:122`).
  - So `socket.pause()`, `req.pause()` and `anim.pause()` inside `page.evaluate` all fail as "opens Playwright's inspector".
  - The header (`:16`) says pauses on Node streams are allowed, and the commit says pause is limited "to Playwright use". In fact it is limited by receiver name.
- **Quotes:** a quote counts as the start of a command (`:125`). So `echo "open tasks: 3"` or `git commit -m "start notes"` in an npm script or hook fails as "a shell command that opens its argument".
- **Comments:**
  - A comment that names `child_process` fails test 4 (`:196`, `:219`).
  - The comment `// chromium.launch picks the bundled build` fails test 1 as a launch "reached other than by a direct call" (`:131–134`).
  - `mutate.mjs:111–112` already has to build its text from pieces to avoid this.
- **Fix:**
  - Strip comments before matching.
  - Count a quote as a command start only after `-c`, `/c` or `-Command`.
  - Either match only pause receivers that name a page, or list these false positives in the header.

## F9–F18

- **F9, partly repaired:**
  - The control run does gate the run: it stops with exit 2 unless there are no red tests and at least one green one (`mutate.mjs:236`).
  - Hook failures are ERRORs. node:test's `runHook` rethrows them with failureType `hookFailed`, even when the hook threw an AssertionError. I checked this in Node 24.18.1's built-in source.
  - A file that fails to load reports `ERR_TEST_FAILURE` with no assertion behind it, so it is an ERROR.
  - Playwright timeouts are ERRORs, except in `until` (by design) and in the font-hang test.
  - No test uses skip or todo, so the green count includes only real passes.
  - R2-1 is still open.
- **F10, repaired:** `AGENTS.md:82`.
- **F11, repaired:**
  - The test checks that the field of view drops right after the input (`controls.test.mjs:194`, `:207`).
  - It also checks that the zoom holds when the move lands (`:198`, `:211`).
  - The `zoom-not-carried` mutant leaves the target zoom at 1, so `index.html:671` undoes the zoom when the move lands, and the test fails.
- **F12, repaired; the thresholds are sound:**
  - A mirror swaps "h" with "o" and "d" with "w" at the line ends, so the stem checks fail.
  - A vertical flip or a 180° turn puts the wider "world" on top. The glyph table gives a width ratio of 4.71/5.58 = 0.84, against 1.19 when turned.
  - The stem checks alone would miss a 180° turn: the turned "d" lands top-left and the turned "h" bottom-right. The width ratio catches it.
  - On the phone, the widening shows ±9.02 world units for a ±7.39-unit text block, about 35 px of margin a side (30 px measured). Without it the view shows ±6.46 units, so the margin is 0.
  - The 0.8 and 0.7 cut-offs sit near the midpoints between the real values (0.88 and 0.59) and the mirrored ones.
- **F13, repaired and correct:**
  - `gestureDrag` resets only when a pointerdown starts a new gesture (`index.html:736`).
  - It grows only while one finger is down (`:751–755`), so pinch moves never count.
  - When re-pinching, a drag with the remaining finger between pinches counts against the slop.
  - Pointer cancel and lost capture go through `release` and `settle`, like a lift (`:787–788`).
  - No path leaves `mode === 'drag'` with no pointers.
  - The rule uses net drag, so a drag out and back within 10 px is forgiven, as the comment says.
  - Counting continues while the elevation is clamped at ±70°. That only makes the rule stricter, and it cannot matter within 6° of E.
- **F14, partly repaired:**
  - Every case R1-6 listed is now caught.
  - I traced all 10 tree mutants against the patterns. Each of the 4 tests goes red under at least one of them.
  - R2-2 and R2-4 are still open.
- **F15, repaired as specified; R2-3 is its side effect:**
  - Page contexts close after each check.
  - Both flings run in one page, and the test waits for reduced motion to take effect before the second.
  - The control fling still depends on the page's 60 ms release window (`index.html:779`). That is not new.
- **F16, repaired:** `index.html:67`; the check is at `page.test.mjs:126–145`; the `canvas-role-img` mutant is killed.
- **F17, repaired:**
  - Unknown, repeated and empty keys exit 2 before the browser starts.
  - So do bad values of `layer`, `tour` and `reduced`.
  - All three R1-9 typos fail.
- **F18, repaired except `AGENTS.md:88`, `:106`, `:110` and `:117`** (see R2-1 and R2-2):
  - The 35 tests (12, 12, 7 and 4) and the 44 mutants (34 page, 10 tree) match the code.
  - `#nogl` and the canvas role are in the contract.
  - The `shoot.mjs:100` comment is fixed.
  - The plan line was already fixed in `0ddaa11` (`plan.md:52`).

## Flakiness

I found no new flakiness risk under `--test-concurrency=2`:
- **Image checks:** the new ones use a frozen clock, a seeded cloud and fixed views.
- **Controls checks:** the new ones assert exact field-of-view or touch-drag results, or reuse the suite's existing timing windows.
- **Load:** closing page contexts early lowers the load on the test file running beside it.

Read outside the diff: `index.html:560`, `:591`, `:595–604`, `:671`, `:696–703`, `:762–788`; `tests/lib/harness.mjs:45–50`, `:71–83`; `docs/work/0_hello-world-cloud/plan.md:49–52`; `docs/work/0_hello-world-cloud/reviews/0_implementation.md:31–33`; Node 24.18.1's built-in `internal/test_runner/test` (`runHook`, failure-type constants) and `internal/test_runner/runner` (`#skipReporting`, child exit handling).

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F19 | R2-1 (major): the font-hang test turns a page that never becomes ready into a CHECK kill, and `mutate.mjs` exits 0 when a mutant is flagged. R1-1's broken-mutant case is still open. | Accepted. None of the 44 current mutants triggers it, so today's proof stands. | Open: the next session runs a baseline load through `openPage`, catches only `TimeoutError`, and exits 1 on flagged mutants. |
| F20 | R2-2: the hygiene scan misses `child_process` openers in npm and settings commands, hook script files, and `npx playwright@<version> open`. | Accepted. | Open: run the spawner checks over commands, read files that commands name, allow `@version`, and name what remains. |
| F21 | R2-3: the 10 s fonts bound passes a page that waits about 5 s for the font host. | Accepted. | Open: time a baseline load and allow it plus about 2 s. |
| F22 | R2-4: hygiene false positives on ordinary pauses, quoted text and comments. | Accepted. | Open: strip comments, count a quote as a command start only after `-c`, `/c` or `-Command`, and narrow `pause`. |

## Verification

Provenance was checked from `tmp/review-runs/round2/claude.jsonl`. The reviewer found F10–F13, F16 and F17 repaired and correct, and no new flakiness risk. No repair of F19–F22 has been made yet.

## Round outcome

There was one major and three minor findings, all in the gates and the mutation tool, not the page. The page as published is unaffected. The four findings stay open for the next session, followed by a focused re-review.
