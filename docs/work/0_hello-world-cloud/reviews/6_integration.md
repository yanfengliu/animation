# Review 6: integration

## Target

Repository `animation`, `main` at `b0a1c40`. The diff is `git diff d59162d..b0a1c40`: the round-5 repairs F36–F44, written by W14 and verified and landed by W15. It is also the final review of the whole work unit. The coordinator re-ran `npm test` at `b0a1c40`: 36 of 36 in 96 s. W15's full proof: control green, 74 mutants killed, 0 survived, 0 errored, 0 flagged.

This round is report-only. The fleet's repair cap (five automatic repair rounds) was reached in round 5, so its findings are dispositioned without another automatic repair cycle.

## Reviewers and coverage

The Claude CLI 2.1.281, `claude -p --model "claude-opus-5-5[1m]" --effort max`, with read-only tools. `modelUsage` held exactly one key, `claude-opus-5-5[1m]`. The run took 40 turns and cost $5.85. No Codex lane was run, by choice. The brief is in `tmp/review-runs/round6/prompt-claude.md` (ignored).

## Reports

### Claude (`claude-opus-5-5[1m]`, effort max)

# Review round 6 (final, report-only): `d59162d..b0a1c40`

The round-5 repairs hold up. F36–F44 are each repaired as dispositioned, and I found no critical or major defect in the diff. The one major item is in the acceptance record, not the code. There are three minor items. `index.html` still renders every particle alike at every angle.

How I checked:
- I read the diff, the page, the test harness, the image helpers, `mutate.mjs`, the plan and the round-5 record.
- I ran copies of the old and new scan regexes in Node, in memory only.
- I read W14's and W15's run logs under `tmp/`.
- I ran no tests, wrote no files and used no subagents.

## Findings

**R6-1 · major (acceptance) · `docs/work/0_hello-world-cloud/plan.md:73–81`, `:144–151`; also `:91`, `:107–111`, `:122`**
- **Defect:** the repo records no visual check of the page as it now ships.
  - `index.html` last changed at `9c0425f` (the 14° slant).
  - The last recorded looks at native resolution are on `d34555d` (the β 0.2 page with the reveal, `:107–111`) and W8's (before the slant, E at 1280 and el+25 only, `:122`).
  - Criteria 2 and 4 rely partly on that look. The gates check 390×844 only at t 0 and unzoomed (`tests/illusion.test.mjs:221`, `:272–277`). No gate checks legibility at ±8°, or anything at el +56/−60, az −60, top-down or random angles.
  - The plan is also stale:
    - every criterion except the fleet one is unchecked;
    - W11–W15 and rounds 4–6 are missing;
    - the Outcome still says "Pending.";
    - `docs/devlog/` is untracked.
- **Failure scenario:** the final report says criteria 2 and 4 are met.
  - ±8° was last looked at on the β 0.2 page (`:91`), which had 1,143 text particles; the page now has 4,951. If the words now read at az+8, nothing in the repo would show it.
  - `tmp/shots/fin_*.png` holds 11 views of the current page, dated 2026-10-13 22:02. That suggests a partial look, but no verdict or digest is recorded.
  - Those shots lack E at t 7.3 and 31, fov 80, 390×844 zoomed, ±8°, az−25, el±25, ±60° and three of the five random angles.
  - The only note on el±25 is the untracked devlog's unattributed "By eye, el ±25 now looks like a plain cloud".
- **Fix:**
  - Run `npm run shoot -- --preset=all`; it covers every view criteria 2 and 4 name. Open each PNG at native resolution, and record the views, sha256 digests and verdicts in the plan.
  - Amend criterion 4's "from 25° or more nothing hints at text" to state the accepted el ±15–25° streak cost (`:44`), or get the owner's word on it.
  - Tick the criteria with their evidence, fill in the Outcome, and commit the devlog.

**R6-2 · minor · `tests/illusion.test.mjs:104`; `tests/mutate.mjs:58`, `:71–72`** F37 took the "say exactly what is covered" branch, and the tour now covers less time at E than round 5 did. The shot lands 2.95 s into the hold. Round 5's own mutant (text 1.25× brighter once within 1° of E in tour mode for 5 s) would now turn on at about 13.7 s, because the camera is within 1° from about 0.68 s before it reaches E at about 9.36 s. That is after the 12.31–12.68 s shot, so it now passes; W14 redefined the mutant to a 2.5 s hold timer. A visitor would see such a reveal for about 1.4 s at the end of every E hold. **Fix:** add a second shot later in the same hold (about 13.6–13.8 s; with the queue drained, the reads take at most 0.36 s, and a miss retries). Keep both mutants, and fix the "late in its hold" wording at `:591`. Or say plainly in the final report that this kind of reveal now passes.

**R6-3 · minor · `tests/hygiene.test.mjs:342`, `:297`; `AGENTS.md:169–170`** Some shell forms that start a command still pass the scan, and the blind-spot list does not name them. I checked each on copies of the regexes; none was flagged at `d59162d` either, so none is a regression. They are:
- a one-line PowerShell script block, such as `if (Test-Path index.html) { ii index.html }` or `| ForEach-Object { ii $_ }`;
- cmd's `for %%f in (index.html) do start %%f` (only `) else` was added) and `if exist index.html start index.html`;
- wrapper commands: `call start …`, `nohup open …`, `cross-env start …`;
- `for (const tab of tabs) await tab.pause()` where `tabs = context.pages()`.

**Fix:** treat `{` and `) do` as command starts, and bind a `for…of` variable that loops over a name already bound. Otherwise, list these forms as blind spots.

**R6-4 · minor (latent) · `tests/illusion.test.mjs:156`, `:168–170`, `:524–527`** After `quiet()`, `view()` queues a view it has not rendered yet, but `pump()` never starts it and nothing times out. Today both views the test asks for are already rendered by `need(P.modes)`. A later edit that asks this test for any other view would hang `npm test` and the mutation proof instead of failing. **Fix:** let urgent views start while paused, or throw when the view is missing from the cache.

## Answers

**1. Are F36–F44 repaired as dispositioned?** Yes, each one.
- **F36: yes.**
  - The text/as-ambient ratio is now checked in red, green and blue separately against 0.97–1.03 (`:418`, `:455`).
  - W14's logs give 0.9929–1.0056, 0.9929–1.0057 and 0.9882–1.0100 for seeds 1–3, and 0.9887–1.0099 over seeds 4–9, which matches AGENTS.md.
  - `reveal-green` is killed at that line. Its light ratio (0.996) and warmth (−0.006) would pass, so only the new check catches it.
  - Dropping the warmth check loses nothing: with red and blue each within 3%, warmth can move by at most 0.031.
  - The register now limits "closes the class" to the shipped draw and the camera modes.
- **F37: yes, by documentation.**
  - The tour starts from the start view (`:557`) and reaches E at 9.35–9.37 s in W15's six runs.
  - The hold's last 2.1 s, which the shot does not cover, is named in `AGENTS.md:155`, the test header and the register. See R6-2 for what that gives up.
- **F38: yes.**
  - The test runs last: W15's log shows it finishing last, after the seed test.
  - `quiet()` stops `pump()` and waits for renders already running.
  - Across W15's six runs:
    - every shot counted on the first attempt;
    - the reads and screenshot took 307–364 ms;
    - the shot came 2.95 s after reaching E, where 1.5 s is required;
    - 1.67–1.74 s of the hold was left.
  - A timing miss retries, and two misses give a false red, never a false pass. I found no new flaky check.
- **F39: yes.**
  - Compared on copies of both revisions' regexes, these were flagged at `b0a1c40` and passed at `d59162d`: the four R5-4 forms, plus `then start`, `) else start` and `; do open`.
  - The register's harmless forms still pass.
  - Every addition is optional, so the new regex flags everything the old one did.
- **F40: yes.** `missed()` fails a shot that started early or reported no start time (`from` is NaN), and one with no recorded arrival at E (`:569–573`). The sleep loop re-reads the clock before shooting.
- **F43: yes** for a loop over a call, and the mutant is killed at the scan line. A loop over a variable holding the pages still passes (R6-3).
- **F41, F42 and F44: yes.** F44's "85–91 s" matches W15's runs (85.3–91.3 s).
- **Regressions, false passes and flaky checks:** apart from the coverage traded away in R6-2, I found none.

**2. Does the work unit meet the plan's acceptance criteria?**
- **Met by gates, within their stated bounds:** criteria 1, 3, 5, 6, 7 and 8. For criterion 6: 36 tests pass, and the control run was green with all 74 mutants killed. No gate holds β at 0.85; that is a documented open lesson.
- **Not met as recorded: criteria 2 and 4 (R6-1).**
  - Criterion 4's wording was never updated for the accepted streak cost. The gate itself measures the el±25 columns at 1.37 and 1.49 times the cloud's noise, against 0.94 at the diagonal control views.
- **Criterion 9: not met.**
  - Already in place:
    - `main` matches `origin/main` at `b0a1c40`, by the local tracking ref (I did not fetch);
    - there are no extra worktrees or branches;
    - the page has not changed since the artifact was republished (I did not read the artifact).
  - Still open:
    - this round's findings stay open by design;
    - `docs/devlog/` is untracked.

**3. Does `index.html` still render every particle alike at every angle?** Yes, and `index.html` is unchanged since `9c0425f`.
- The text flag (`:500`) changes only how a particle moves. Text particles move along their own sight-line from E; ambient ones move along theirs plus drift and wobble (`:504–511`).
- Size, energy, blur, fade, twinkle and brightness level (`:516–530`) depend only on per-particle seeds and depth. `v_col` (`:533`) has no text or angle term, and the fragment shader (`:542–551`) reads only those values.
- No uniform depends on the camera's angle to E (`:665–675`). One ONE/ONE draw covers all 18,000 particles (`:676–681`). The sky is drawn first with blending off and varies only with elevation (`:651–661`).
- Relocation keeps each particle's distance from E (`:400–404`), so text particles get no focus advantage there.

Read outside the diff: `index.html:400–404`, `:497–552`, `:643–683`, `:709–752`; `tests/lib/image.mjs:243–254`, `:263–282`; `tests/lib/harness.mjs:71–83`, `:98–125`; `tests/mutate.mjs:294–317`; `tests/hygiene.test.mjs:146–173`, `:333–344`; `scripts/shoot.mjs:83–122`; `docs/work/0_hello-world-cloud/plan.md:44`, `:71–81`, `:143–151`.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F45 | R6-1 (major, acceptance): no visual check of the shipped page was recorded, the plan's criteria and outcome were stale, and the devlog was untracked. | Accepted; resolved by the coordinator, since acceptance is the coordinator's job. | 31 views of the shipped page (`index.html` unchanged since `9c0425f`) were shot and each opened at native resolution; views, digests and verdicts are in the plan's Outcome. Criterion 4 is amended to state the accepted el ±15–25° streak cost. The criteria are ticked with their evidence, and the devlog is committed. |
| F46 | R6-2: the tour shot lands 2.95 s into the 5 s hold, so a reveal in the hold's last 1.4–2.1 s passes. | Accepted as a known limit; not repaired, because the repair cap was reached. It is already named in AGENTS.md's bound. | Reported to the owner as open. A second, later shot in the same hold would close it. |
| F47 | R6-3: some command-start forms still pass the hygiene scan: PowerShell script blocks, cmd `for … do start` and `if exist … start`, wrapper commands (`call`, `nohup`, `cross-env`), and a `for…of` over a variable already holding pages. None is a regression. | Accepted as known blind spots. | The coordinator adds them to AGENTS.md's blind-spot list. |
| F48 | R6-4: the camera-mode test's `view()` would hang, rather than fail, if a later edit asked it for a view not yet rendered. | Accepted as a latent risk, with no failure today. | Recorded in the plan's Outcome for whoever next edits that test. |

## Verification

Provenance was checked from `tmp/review-runs/round6/claude.jsonl`. F45 is verified by the coordinator's visual pass, recorded in the plan.

## Round outcome

The reviewer found no critical or major defect in the code. F36–F44 are repaired, and the shipped page renders every particle alike at every angle. The one major item was the acceptance record, now resolved. The three minor items remain as documented limits and are reported to the owner.
