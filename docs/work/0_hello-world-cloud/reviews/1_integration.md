# Review 1: integration

## Target

Repository `animation`, `main` at `d34555d`. The diff since round 0's target is `git diff 891558f..d34555d`. It holds:
- the round-0 repairs `71be0a2` (`index.html`, `scripts/shoot.mjs`)
- W3's gate suite `1d986c4` (`tests/**` and the `package.json` test script)
- the coordinator's docs (`AGENTS.md`, `docs/learning/defect-register.md`, `docs/policies/local-rules.md`, the plan and the round-0 record)

Before the review, the coordinator ran `npm ci`, `npm test` (30 of 30 pass in 42 s) and `npm audit --audit-level=high` (0 vulnerabilities) on `d34555d`.

## Reviewers and coverage

The Claude CLI 2.1.281, `claude -p --model "claude-opus-5-5[1m]" --effort max`, as the fleet review runbook pins it.

- Tools were read-only: Read, Glob, Grep, Task, and `git diff`, `git log` and `git show`. The brief said not to run tests.
- The final `result` event's `modelUsage` held exactly one key, `claude-opus-5-5[1m]`. The run took 25 turns and cost $5.01.
- Lenses: whether the round-0 repairs are complete, false passes in the gates, flakiness, portability, the hygiene scan, and docs accuracy.
- No Codex lane was run, by choice, for the same risk reason as round 0.
- The brief is in `tmp/review-runs/round1/prompt-claude.md` (ignored run output).

## Reports

### Claude (`claude-opus-5-5[1m]`, effort max)

# Review round 1: `891558f..d34555d` (read-only)

I found no critical defects. There is one major finding, in the mutation tool, and nine minor ones. The round-0 repairs F0–F8 are all in place, but F2 has a side effect, and F5 and F6 each leave part of their problem open. I ran no tests and changed no files; I only read files and ran read-only `git` commands. I did not see the output of the 30-mutant run.

## Findings

**R1-1 · major · `tests/mutate.mjs:139`, `:170`: any failure counts as a kill, and there is no control run**
- **Defect:** `runGates` collects every top-level `test:fail`, whatever caused it, and a mutant "survives" only when that list is empty.
  - A browser that fails to launch, a `before` hook that throws, or a page that never becomes ready all count as kills.
  - The gates are never run on the unmutated page first.
  - `passed` is counted (`:138`) but never used in the verdict.
- **Failure:** on a fresh clone with no Chromium in the cache (R1-2), `chromium.launch` throws in each page gate's `before` hook. All 27 page mutants then count as killed. The 3 tree mutants are killed for real. The tool prints "30 mutant(s), 0 survived" and exits 0.
- **Same failure with a typo:** a hand-written mutant whose replacement text has a syntax error "kills" through "the page never became ready", whether or not its target gate can see the defect.
- **Today's proof is not affected:** by my reading, every one of the 30 current mutants fails a real check. All of them fail an `assert` except `wheel-zooms-wrong-way`, which fails the `until` timeout at `controls.test.mjs:65`.
- **Fix:**
  - Run the three page gates on the unmutated page first, and stop unless they all pass.
  - Count a kill only when at least one failure is a check, and make `until` (`harness.mjs:121`) throw an `AssertionError` so its timeouts count as checks.
  - Report any other failure as "errored", and flag mutants with 0 green tests.

**R1-2 · minor · `AGENTS.md:81`: a fresh clone cannot run the gates as documented**
- **Defect:** neither `playwright` nor `playwright-core` 1.63.0 has an install script, and the lockfile has no `hasInstallScript`. So `npm ci` installs no browser.
- **Failure:** on a new machine or CI runner, `npm ci && npm test` fails in every browser file with Playwright's "Executable doesn't exist" error.
- **Fix:** add `npx playwright install chromium` after `npm ci` in Gates.

**R1-3 · minor · `tests/controls.test.mjs:182–204`: the zoom-during-animation gate never checks the zoom**
- **Defect:** after the wheel step during the glide, and after `+` during the snap, the test checks only the mode and that the camera ends within 0.05° of E. It never reads the field of view.
- **Failure:** two broken pages would pass:
  - a page that ignores zoom while an animation runs;
  - a page whose `zoomBy` (`index.html:788`) sets `anim.z0`/`anim.dz` but not `anim.target.zoom`. In that case `stepAnim` (`:669`) puts the zoom back as the glide lands. That breaks the "carries the new zoom to its end" comment at `:784`.
- **Fix:** assert that `fov` dropped right after the input, and that it is unchanged once the mode is back to `idle`.

**R1-4 · minor · `tests/illusion.test.mjs:75–86`, `tests/lib/image.mjs:122`: nothing checks which way the message reads or that it fits on screen**
- **Defect:** the stroke mask comes from the page's own text layer. It is checked for contrast, sameness across seeds, stillness over time and zoom scaling, but never compared with the expected layout. It is also clipped to x 8–92% of the width.
- **Failure:**
  - **Mirrored text passes:** `-f / aspect` in `projMatrix` (`index.html:601`) mirrors the frame. Every gate still passes, because the controls gates read only `__cloud`.
  - **Text turned 180° passes:** flipping the cross product in `viewMatrix` (`:595`) turns the frame upside down, and every gate still passes.
  - **A cropped phone view passes:** without the narrow-screen widening in `baseTan` (`:401`), the 390×844 view shows ±6.46 world units of the ±7.39-unit text block. About 0.9 units of "w" and "d" fall off each edge, and the phone test still passes.
  - **A broken reveal is untested:** no mutant holds `u_hint`/`u_lock` at 0. So it is unproven that the 2.0 ratio catches a reveal that never engages, although the plan says legibility at E "comes mostly from the reveal effects".
- **Context:** the coordinator's look at native resolution covers this today. But `AGENTS.md:89` says the gates prove '"hello world" strokes'.
- **Fix:**
  - **Layout at E:** check that the top line is narrower than the bottom line (4.55 vs 5.42 x-heights). Check that there is a full-height stroke at the left end of the top line ("h") and at the right end of the bottom line ("d").
  - **Fit at 390×844:** measure the full frame and check that the mask's bounding box stays inside the edges.
  - **Reveal:** add a `reveal-off` mutant.

**R1-5 · minor · `index.html:732`: a pinch now cancels the "moved away from E" rule**
- **Defect:** `max(gestureFrom, alignDeg())` on the second finger accepts a deliberate drag away from E, not just a few pixels of slip.
- **Failure:**
  1. Start a one-finger drag 1° from E.
  2. Drag about 17 px away, to 5°.
  3. Add a second finger to zoom, then lift both.
  4. `gestureFrom` is now 5, `settle()` sees 5 ≤ 5.1, and the view snaps to E.

  Before this change the view stayed at 5°.
- **Fix:** raise `gestureFrom` only when the first finger moved less than a touch slop (about 10 px) since its own `pointerdown`. The 4 px pinch-at-E gate still passes with that rule.

**R1-6 · minor · `tests/hygiene.test.mjs:39–52`, `:100–111`; `AGENTS.md:92`, `:94`: the scan misses common openers, and its stated blind spots are incomplete**
- **Misses:** I traced each of these against the patterns and none matches.
  - **Openers in npm scripts:** `npx open-cli index.html`, `npx live-server`, `npx http-server -o`, `npx playwright open index.html`, and `npx playwright test --ui` or `--debug`. `SHELL_OPENER` only matches an opener word at the start of a command. The opener-package rule only matches `import` or `require`.
  - **Renamed imports:** `import { exec as sh } from 'node:child_process'; sh('start index.html')`.
  - **File URLs:** `new URL('../index.html', import.meta.url)`.
  - **Files outside the scanned paths:** a root `playwright.config.*`, and any tracked `.claude/settings.json` hook. A hook is the one repo-side way to cause the reported "after each editor-tool edit" symptom.
- **False positives:** any `channel:` key, any `.pause()` (for example `process.stdin.pause()`), and any call whose name starts with `launch` (for example `launchBrowser()`).
- **Docs:** the header, AGENTS.md and the defect register all claim opener packages and debug or inspector modes are covered. The blind-spot sentence at `AGENTS.md:94` omits paths outside `scripts/`, `tests/` and the npm scripts.
- **Fix:**
  - Match opener names anywhere in npm and shell commands.
  - Track named and renamed `child_process` imports.
  - Scan root configs and `.claude/settings.json` hooks.
  - Check `channel` and `pause` only on Playwright calls.
  - List the remaining blind spots in AGENTS.md.

**R1-7 · minor · `tests/page.test.mjs:28–43`, `:130`; `tests/controls.test.mjs:224–240`: timing risks when two test files run at once**
- **Pages left open:** `open()` closes each context only when its whole test ends. The no-errors test keeps up to 5 animating pages rendering at once, one of them 780×1688 device pixels. That load competes with whichever file runs beside it, which may be the timing-sensitive controls file.
- **The fling test:**
  - It needs `pointerup` within 60 ms of the last pointer move (`index.html:773`).
  - Its reduced-motion half cannot tell "reduced motion stopped the coast" from "the release came late", because its control fling ran earlier in a different page.
  - So under load the `reduced-motion-coasts` mutant can survive, and the control half can fail on the real page.
- **The 3 s draw bound:** it includes context setup, shader compilation and the first frame. The `fonts-block` mutant never draws at all, so 10 s would catch it just as well.
- **Fix:**
  - Close each context as soon as its check is done.
  - Run both flings in one page, switching with `page.emulateMedia({ reducedMotion })`. The page listens for that change at `:829`.
  - Raise the draw bound.

**R1-8 · minor · `index.html:67`: screen-reader users still cannot steer**
- **Defect:** the canvas is now focusable but keeps `role="img"`.
- **Failure:** as I understand NVDA and JAWS, they stay in browse mode on a focused image and take the arrow keys themselves. The third point of M6 is therefore still open. No gate covers it (`page.test.mjs:10`), and I have not tested it with a screen reader.
- **Fix:** use `role="application"` with an `aria-roledescription` and the same label.

**R1-9 · minor · `scripts/shoot.mjs:35–54`: typos in non-numeric view keys still go unreported**
- **Failure:**
  - `az=40,eI=14` (capital I) silently renders the default el 6.
  - `layer=txt` silently renders the full scene.
  - `reduced=true` silently renders without reduced motion, because only `'1'` counts.

  This is the same problem as M5's `az=3o`.
- **Fix:** reject unknown keys, and check the values of `layer`, `reduced` and `tour`.

**R1-10 · minor · docs drift**
- **Plan:** `plan.md:52` still asks for "the tour resuming after idle". F6 removed that on purpose, and the gate now checks the opposite.
- **Contract:** `AGENTS.md:101` omits `#nogl`, which `harness.mjs:69` and `page.test.mjs:142` both read.
- **Suite summary:** `AGENTS.md:89–90` claims more than the tests check:
  - the smear is checked only at az+25;
  - "the back" is no brighter than the back-view floor by definition, since it is that floor;
  - "stays stopped" is checked for 9 s only.
- **Stale comment:** `shoot.mjs:79` still says "el+60", but the preset now shoots el+56.

## Round-0 repairs

- **F0, fixed:** the font stylesheet is now added by script (`index.html:79–82`). A script-added stylesheet blocks neither rendering nor scripts. The hang gate covers it.
- **F1, fixed:** `zoomBy` keeps a snap or glide running, and `stepAnim` still lands exactly on E (`:669`). Wheel and the +/− keys share that path. The gate is weak (R1-3).
- **F2:** slip is fixed, with the side effect in R1-5.
- **F3, fixed:** I compared the new mask with the old canvas path. They match on:
  - the same pixel grid and pixel centres;
  - half-width `STROKE/2`, with round caps and joins from per-segment capsules;
  - arc coverage of `[min(a0,a1), max(a0,a1)]`, which matches the canvas arcs for h (0–180°), e (0–318°) and r (55–180°);
  - full circles for o and d.

  No 2D canvas or readback is left.
- **F4, fixed:** `:777`.
- **F5:** fixed for numbers and the el clamp. The off preset now adds t 7.3 and 31 for ±8° and ±25°. The rest of the problem is R1-9.
- **F6:** the tour can start only while `lastInput === -Infinity` (`:714`). Every steering input calls `noteInput`, so the tour never resumes after input.
  - The visible hint now mentions the keys.
  - The canvas focus ring is inset, so it is visible on screen.
  - The key handler never handles Tab and ignores keys while a text field has focus. The page cannot scroll (`overflow: hidden`), so there is no scrolling to break.
  - The screen-reader point is still open (R1-8).
- **F7, fixed.**
- **F8, fixed:** I re-derived the numbers.
  - Drift is at most 0.421 and wobble at most 0.104, so their sum is 0.525.
  - σ = √56/16 = 0.468 x-height, which is 1.24 world units.
  - 0.52/1.24 = 0.42.
  - At distance 13.5 from E, the drift is about 0.93σ.

## Checked and sound

- **`PAGE` reaches every browser test** through the harness. `runGates` sets the environment before `run()` starts its child processes.
- **Views are checked:** `render()` rejects a view whose az, el or fov did not take.
- **Windows line endings are handled:** mutant edits match exactly once after converting CRLF to LF.
- **The test glob works on Windows:** Node expands `tests/*.test.mjs` itself under cmd.exe.
- **The defect register checks out:**
  - Its four tests each go red under at least one of the three tree mutants.
  - Fleet `f44e26e` holds the canon candidate.
- **Pinned versions:** Playwright 1.63.0 pins Chromium 153.0.8010.12.
- **Only `main` is left:** there are no other worktrees or branches.

Read outside the diff: `index.html:669`, `index.html:401`, `index.html:595–601`, `index.html:773`, `docs/work/0_hello-world-cloud/plan.md:52`, `AGENTS.md:101`, `node_modules/playwright/package.json:1–60`, `node_modules/playwright-core/browsers.json:11–17`, `../fleet/canon-candidates.md:73–75` at `f44e26e`

## Findings and disposition

Round-0 findings F0–F8: the reviewer confirmed F0, F1, F3, F4, F7 and F8 fixed. F2, F5 and F6 are fixed except for the side effect or remainder recorded as F13, F17 and F16 below.

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F9 | R1-1 (major): `tests/mutate.mjs` counts any test failure as a kill and never runs the gates on the unmutated page first. A missing browser or a broken mutant would read as "0 survived". | Accepted. The mutation proof is the evidence that every gate can fail, so it must not pass on a harness error. | W6 adds a control run on the real page (stop unless it is green), counts a kill only on a failed check, makes `until` time out with an `AssertionError`, reports errored mutants, and re-runs the full proof. |
| F10 | R1-2: `npm ci` installs no browser, so a fresh clone cannot run the gates as documented. | Accepted. | W6 adds `npx playwright install chromium` to AGENTS.md Gates. |
| F11 | R1-3: the zoom-during-animation gate never checks the zoom. | Accepted. | W6 asserts that fov changes on input and is kept at the end, with a mutant that drops the carried zoom. |
| F12 | R1-4: nothing checks which way the message reads, that it fits at 390×844, or that the reveal engages. Mirrored or upside-down text, a cropped phone view and a dead reveal all pass. | Accepted. These are exactly the failures a person would notice first. | W6 adds layout checks at E (top line narrower than bottom; a full-height stroke at the left of the top line and the right of the bottom line), a whole-frame fit check at 390×844, and mutants for mirror, 180° turn, no phone widening and reveal off. |
| F13 | R1-5: raising `gestureFrom` on the second finger also cancels a deliberate drag away from E, so a pinch after dragging away snaps to E. | Accepted. A side effect of the F2 repair. | W5 raises it only when the first finger moved less than a touch slop (about 10 px). W6 adds a gate and a mutant. |
| F14 | R1-6: the hygiene scan misses common openers (`open-cli`, `live-server`, `http-server -o`, `playwright open`, `--ui`/`--debug`, renamed `child_process` imports, `new URL(…, import.meta.url)`, root configs, `.claude/settings.json` hooks). It also has false positives on `channel:`, `.pause()` and any `launch*` name, and its docs overclaim. | Accepted. The scan is the defect class's only repo gate. | W6 widens the patterns, scans root configs and tracked `.claude/settings*.json`, limits `channel` and `pause` to Playwright calls, and lists the remaining blind spots honestly in the test header, AGENTS.md and the defect register. |
| F15 | R1-7: timing risks under two-file concurrency. Contexts stay open until a test ends, the fling test depends on a 60 ms release window across two pages, and the 3 s draw bound includes setup. | Accepted. A flaky gate erodes trust in every red. | W6 closes contexts once each check is done, runs both flings in one page with `emulateMedia`, and raises the draw bound to about 10 s. |
| F16 | R1-8: the focusable canvas keeps `role="img"`, so screen readers stay in browse mode and take the arrow keys. | Accepted. This finishes F6's third point. | W5 uses `role="application"` with an `aria-roledescription` and the same label. W6 checks the role through Playwright's accessibility tree. No screen reader is available to test with; recorded as a limit. |
| F17 | R1-9: `shoot.mjs` silently ignores unknown keys and bad values of `layer`, `reduced` and `tour`. | Accepted. The remainder of F5. | W5 rejects unknown keys and validates those values. |
| F18 | R1-10: docs drift. The plan still asks for the tour to resume after idle; AGENTS.md omits `#nogl` from the contract and overclaims in the suite summary; the `shoot.mjs` comment still says el+60. | Accepted. | The coordinator updates the plan. W6 updates AGENTS.md. W5 fixes the `shoot.mjs` comment. |

## Verification

The coordinator checked the review's provenance from `tmp/review-runs/round1/claude.jsonl`: `subtype` success and the single `modelUsage` key above. Repairs are verified in round 2.

## Round outcome

There were no critical findings and one major finding, in the mutation tool. All ten findings were accepted and routed to two sequential workers on `main`: W5 for the page and the shoot tool, then W6 for the gates and docs. The full mutation proof is re-run after F9. A focused re-review of the repair diff follows as round 2.
