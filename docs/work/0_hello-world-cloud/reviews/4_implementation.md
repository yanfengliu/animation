# Review 4: implementation

## Target

Repository `animation`, `main` at `cea1d4e`. The diff is `git diff 989ee0b..cea1d4e`: W11's repairs for F23–F29. The coordinator re-ran `npm test`: 36 of 36 in 71.1 s. W11's full proof: control green, 63 mutants killed, 0 survived, 0 errored, 0 flagged.

## Reviewers and coverage

The Claude CLI 2.1.281, `claude -p --model "claude-opus-5-5[1m]" --effort max`, with read-only tools. `modelUsage` held exactly one key, `claude-opus-5-5[1m]`. The run took 26 turns and cost $6.37. No Codex lane was run, by choice. The brief is in `tmp/review-runs/round4/prompt-claude.md` (ignored).

## Reports

### Claude (`claude-opus-5-5[1m]`, effort max)

# Review round 4: `989ee0b..cea1d4e` (read-only)

I found one major and five minor findings. None is critical. None is in the page, because this diff does not touch `index.html`.

F24, F26, F27 and F29 are repaired. F23 and F28 are repaired only for the cases their mutants test. Each leaves a hole of the same kind open, and F28's regex change brought back a case the round-2 scan caught.

How I checked: git, file reads, and Node one-liners run on copies of the hygiene regexes and on the palette arithmetic. I ran no tests, wrote no files and used no subagents. The luminance figures below are worked out from the page's constants and the mutant figures in the test comments. They are not from renders.

## Findings

**R4-1 · major · `tests/illusion.test.mjs:386–388`, `:452`; claims at `:35–40`, `AGENTS.md:113`, `:115`, `docs/learning/defect-register.md:76`: both new checks compare one luminance sum, so a colour reveal in the shipped draw or in a camera mode passes**
- **Defect:**
  - `shipped()` compares only `lightOver(...).light`, the frame's Rec. 709 luminance sum. The mode test compares the same sum over the centre.
  - The warmth and size checks still read only the test-only draws. The β=0 render does go through the shipped branch (`index.html:681`), but it has no text particles.
  - So nothing compares the shipped draw's colour with anything. The header's "so the shipped draw is the one those comparisons measured" holds for light only.
  - In this shader, size and focus changes also change light (1.58× and 1.17× per the `LIGHT_BAND` note, `:79`), so the tie catches those. Colour is the axis left open.
- **Failure scenario:**
  - A change gives the words a warm glint near E in the shipped draw only. It is the `reveal-gold` edit (`tests/mutate.mjs:61`: 30% toward (1.0, 0.78, 0.46) on text particles, gone by 12°), behind a uniform that `draw()` sets only when `layer` is null.
  - By the palette (`index.html:15–18`, class shares at `:365`), that tint lowers text luminance by 1.74% and text blue by 16%.
  - Text carries about 21.5% of the frame's particle light, from the extra-pass mutant's 1.053–1.056 at 25% (`:82`). So shipped ÷ (text + ambient) is about 0.996, inside 0.99–1.01.
  - Scene light moves about −0.4% and the legibility ratio drops only slightly. The views 25° out see no tint. All 36 tests pass.
  - Tied to "after the glide" instead (the `reveal-after-glide` flag), the mode test reads about 0.9955, inside ±1%. Text is about 26% of the central light, from `MODE_BAND`'s 1.065.
  - A warm colour with the palette's mean luminance (0.853) passes at any strength.
- **Fix:**
  - Tie colour as well as light. `lightOver` already returns per-channel sums (`tests/lib/image.mjs:253`). Require each channel's shipped ÷ (text + ambient) to stay within a band set from measurement; blue clips first.
  - A stronger check is a per-pixel, per-channel residual: Σ|full − text − ambient + sky| over Σ(full − sky). With ONE/ONE blending into an 8-bit target, each fragment adds about the same rounded amount whatever lies under it. So the residual should sit near zero except where a channel clips.
  - In the mode test, require near pixel identity with E set by URL in the centre. W11 measured the same pixels (`:84`).
  - Add two mutants: the gold tint in the shipped draw only, and the gold tint after the glide.

**R4-2 · minor · `tests/hygiene.test.mjs:283`; claims at `:30–34`, `:47–49`, `AGENTS.md:135`: F28's binding regex loses the real page binding inside arrow-function helpers and in semicolon-free code, so a case round 2 caught now passes**
- **Defect:**
  - `PAGE_BINDING` now scans the right-hand side with `[^;]*?`; at `989ee0b` it was `[^;\n]*?`. A match therefore runs across lines to the first `newPage`, `pages(` or `waitForEvent` before a `;`.
  - `matchAll` matches never overlap. When a declaration opens a block and the page is opened in its first statement, the outer match binds the outer name and swallows the real binding.
  - In semicolon-free code, the first declaration swallows every later one.
  - The header and AGENTS.md name only the other side of this: the false positive on the outer name.
- **Failure scenario** (copies of the `cea1d4e` and `989ee0b` regexes, run in Node):
  - `const glide = async () => {⏎ const tab = await context.newPage();⏎ await tab.pause();⏎};` was flagged at `989ee0b` and passes now. Only `glide` is bound.
  - The `popup-pause` and `destructured-popup-pause` helpers pass when written as `export const holdPopup = async (page) => {…}`. Only `holdPopup` is bound. The mutants use `export async function`, so the mutation proof never saw this form.
  - Semicolon-free code (`const browser = …` ⏎ `const ctx = await browser.newContext()` ⏎ `const tab = await ctx.newPage()` ⏎ `await tab.pause()`) binds only `browser`. `989ee0b` bound `tab`.
  - This repo writes helpers in exactly that shape, with the page opened first (`tests/illusion.test.mjs:429–431`, `:440–442`).
- **Fix:**
  - Scan the right-hand side in a lookahead, so a match does not consume nested declarations: `\b(?:const|let|var)\s+` + PATTERN + `\s*=(?=[^;]*?\b(?:newPage|pages|waitForEvent)\s*\()`. Checked the same way, it binds `tab`, `popupPromise`, `[popup]` and `tab` in the four cases above.
  - Add tree mutants in the arrow-helper and semicolon-free forms.

**R4-3 · minor · `tests/illusion.test.mjs:434–447`, `tests/lib/harness.mjs:112–119`; bound at `AGENTS.md:144`, `illusion.test.mjs:53–57`, `defect-register.md:92–95`: every picture of E is taken within about a second of reaching it, so a reveal that waits at E passes, and the bound does not say so**
- **Defect:**
  - URL views are shot three frames after the first frame (`harness.mjs:112`, `:119`). The glide is shot as soon as it lands (`:435–437`). The tour is shot 4.5 s into a stay at E that began at load, in mode `tour`, not idle (`:443–447`).
  - Every shot also freezes the particle clock with `t`, which the shipped page never sets (`index.html:112`, `:885`).
  - The bound names a reveal while the camera moves, and E reached by a snap or the keys. It does not name a reveal that waits.
- **Failure scenario:**
  - A change rewards a viewer who holds the angle: after 5 s idle within 1° of E, text particles glow 1.25×.
  - URL views and the glide are shot well before 5 s of idle at E, and the tour is never idle. All 36 tests pass.
  - A ramp driven by the particle clock would never start under any `t`.
- **Fix:**
  - In the glide test, stay idle about 8 s after landing and shoot again. Require the same pixels as the first shot and as E set by URL.
  - Shoot the tour late in its hold, about 7.5 s after load. The hold ends at about 8.2 s.
  - Name the dwell and running-clock limits in the bound and the register.

**R4-4 · minor · `tests/hygiene.test.mjs:324`; lists at `:47–52`, `AGENTS.md:138`, `:157`: the new PowerShell branch misses a quoted switch value and flags the word "powershell" in plain text**
- **Defect:**
  - The branch accepts a switch value only when it is unquoted.
  - It matches `powershell` anywhere in a command, not only where a command starts.
- **Failure scenario** (copy of the regex, run in Node):
  - `powershell -WindowStyle "Hidden" "ii index.html"` passes, and that command opens the page.
  - `git commit -m "fix powershell start script" && npm test` and `echo "use powershell open dialogs"` are flagged.
  - Neither form is in the header's lists or in AGENTS.md. As intended, the two R3-6 forms and `powershell -ExecutionPolicy Bypass "ii index.html"` are flagged.
- **Fix:**
  - Anchor `powershell` itself at a command start, using the same separator and shell-switch prefix.
  - Allow a quoted switch value: `(?:\s+(?:"[^"]*"|'[^']*'|[^\s'"-]\S*))?`.
  - Or add both forms to the documented lists.

**R4-5 · minor · `AGENTS.md:85`, `:145`; `tests/illusion.test.mjs:57–60`, `:104`; `docs/learning/defect-register.md:92–95`: docs the code or W11's own numbers do not support**
- **Render queue:**
  - `AGENTS.md:85` says the views render "one page in each of four browsers".
  - `pump()` (`:129–139`) hands wide views out in turn (`wides[turn++ % 4]`) without checking which browser is free.
  - Every phone view goes to browser 0 and every blind view to browser 1 (`:175–176`), so the four phone views can render together in one browser.
  - The mode test opens two pages beside the queue, and the seed test renders outside it (`:487–489`). So "queues all its views" (and `:104`) is loose too.
  - Images are unaffected. Failure scenario: someone tunes `BROWSERS` or `WIDTH` from this description and spreads the GPU work wrongly.
- **F25 sentence** (`AGENTS.md:145`, `:57–60`):
  - It gives "1.64 and 1.90 with β 1.0" without naming the seed triples. The conclusion holds only because 1.64 is seeds 1–3, and that fact is only in the untracked `docs/learning/lessons-evidence.md`. Had 1.90 been seeds 1–3, a bound between 1.69 and 1.90 would meet W11's own rule.
  - "Adds about 15% to a given seed's … residual" is an average. The same file gives 0% to 37% per seed.
  - "No bound tells them apart" holds only for three-seed means. The same file says about 12 seeds would separate them, and the el±25 column already separates them by about 0.05.
  - Failure scenario: a later session re-checks F25 from the committed text and cannot tell whether the conclusion holds.
- **Register:** its "cannot see" list (`:92–95`) leaves out E reached another way (a snap, the arrow keys), which `AGENTS.md:144` and the test header list. Failure scenario: a reader of the register assumes snap and arrow-key arrivals are covered.
- **β lesson:** the lesson F25 falls back on (`docs/learning/lessons.md`, `lessons-evidence.md`) exists only as untracked files at `cea1d4e`. So the reviewed revision does not record "keep β at 0.85 by decision" (R18), and R3-3's failure scenario stays open until it lands. This is the coordinator's part of F25.
- **Fix:**
  - Correct the queue sentence.
  - Give each β 1.0 value its seed triple and the per-seed range, and limit "no bound" to three-seed means.
  - Add the snap and arrow-key line to the register.
  - Commit the lesson.

**R4-6 · minor · `tests/illusion.test.mjs:172`, `:195`: if one browser launch fails, the others stay open and the run can hang**
- **Defect:**
  - The four browsers launch under one `Promise.all`. If one launch fails, `browsers` stays `[]` and the `after` hook closes nothing.
  - The browsers that did start keep the file's process alive. Neither `run.mjs` nor `mutate.mjs` passes `forceExit`.
- **Failure scenario:** one of the four launches fails, say a timeout under load, during a 61-minute mutation run. The run then waits on the illusion file instead of reporting an ERROR. The same pattern existed with two browsers; four widen it.
- **Fix:** launch with `Promise.allSettled`, close the browsers that started, then rethrow. Or push each browser into `browsers` as it starts.

## Answers

1. **Is each repair done?**
   - **F23: partly.** A light reveal above about 4.6% of the text light in the shipped draw, or tied to the tour hold or the glide, now fails. Colour (R4-1) and a reveal that waits at E (R4-3) still pass. `LIGHT_BAND` ±5%, the 12° view, t 7.3 and the camera-mode bound are all in.
   - **The shipped-render identity is sound for light:**
     - Blending is ONE/ONE (`index.html:677`).
     - There is no depth buffer (`:466`), and depth of field is per sprite in the vertex shader (`:520–523`). So draw order and focus cannot break the sum.
     - Only clipping lowers it, which fits the measured 0.9993–0.9999. It could fail on the real page only if about 1% of the light clipped.
     - It does pass any reveal under about 4.6% of the text light (1% of the frame), as documented.
   - **F24: done.**
     - `edgeLean`'s sign and trims are right.
     - Undoing the lean about the image centre differs from the page's per-line lean only by a fixed offset per line.
     - `MAX_LEAN` kills `slant-5` (−8.1°) and `upright-letters` (−13.8°) by wide margins. `MAX_EL_STREAK` is the thinner kill (2.06 against 1.95).
   - **F26 and F29: done.**
     - Each threshold sits on the right side of its comment's measured values, and the re-measure rule is in the header and AGENTS.md.
     - The register numbers match the code, and the plan fixes landed in `989ee0b`.
   - **F27: done.** The illusion file runs alone, the two font loads start together, and the motion tests moved over unchanged.
   - **F28: partly** (R4-2, R4-4). The two R3-6 command forms and both popup mutants are flagged.
2. **Did the repairs add a false pass, a flaky check or a portability problem?**
   - **False passes:** R4-2 (a regression) and the quoted switch value in R4-4.
   - **Phase runner:** it never reports a crash as a pass.
     - A file that fails to load, or a child that exits non-zero, shows up as a failed top-level test. `run.mjs:21` and `mutate.mjs:264` count those.
     - A stream error rejects the await, and zero passes exits 1.
     - No test uses `skip` or `todo`.
   - **Render queue:** it cannot change an image, because each view has a frozen clock, a fixed seed and its own page. A failed view fails only the tests that need it (`:120`, `:145–147`).
   - **Mode test timing:**
     - The tour shot is not fragile, because the camera stays at E from load to about 8.2 s (`index.html:711–722`).
     - The glide ends with exactly the camera of E set by URL (`:704` against `:435–436`).
   - **Portability:** I found no problem.
3. **Does W11's evidence support F25's conclusion?** For three-seed means of the az+25 row residual, yes. β 1.0 at seeds 1–3 (1.637) lies inside the page's own range over four seed triples (1.416–1.693), so no fixed threshold passes every redraw and fails β 1.0. But the committed text leaves out the fact this rests on, and "no bound" is a cost limit rather than an impossibility (R4-5).
4. **Are AGENTS.md and the test headers accurate to the code?** Mostly. The exceptions are the overclaims in R4-1, the binding description in R4-2, the missing bound in R4-3, the false-positive lists in R4-4, and the items in R4-5. The counts check out: 36 tests (13, 9, 3, 7 and 4) and 63 mutants (46 page, 17 tree).

Read outside the diff: `index.html:15–18`, `:365`, `:386`, `:466`, `:497–552`, `:643–683`, `:704`, `:709–752`, `:859–866`, `:885`; `tests/lib/harness.mjs:71–83`, `:105–125`; `tests/lib/image.mjs:164–206`, `:262–278`; `tests/page.test.mjs:30–33`; `tests/controls.test.mjs:1–60`; `docs/work/0_hello-world-cloud/plan.md:40–48`, `:130–144`; `docs/learning/lessons.md` and `lessons-evidence.md` (untracked).

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F30 | R4-1 (major): the shipped and camera-mode checks compare one luminance sum, so a colour-only reveal in the shipped draw or in a camera mode passes. | Accepted. Rounds 1–4 each found one more property a reveal could vary past the per-property checks. So the repair closes the whole class rather than adding colour as one more property. | W12: a per-pixel, per-channel identity, shipped = text layer + ambient layer − sky, which any shipped-only effect breaks; pixel identity across camera modes; mutants for a gold tint in the shipped draw and after the glide. |
| F31 | R4-2: F28's binding regex swallows nested declarations, so a page opened inside an arrow helper, or in semicolon-free code, passes again (a regression on round 2). | Accepted. | W12: match with a lookahead, plus tree mutants in both forms. |
| F32 | R4-3: every picture of E is taken within about a second of arriving, so a reveal that waits at E (or runs on the live particle clock) passes, and the bound does not say so. | Accepted. | W12: re-shoot after about 8 s idle at E, shoot the tour late in its hold, require pixel identity, and name the running-clock limit. |
| F33 | R4-4: the PowerShell branch misses a quoted switch value and flags the word "powershell" in plain text. | Accepted. | W12: anchor at a command start and allow quoted values. |
| F34 | R4-5: docs overclaim the render queue and the F25 numbers; the register omits snap and arrow-key arrivals; the β lesson was uncommitted. | Accepted. | The coordinator commits the lesson now. W12 fixes AGENTS.md, the test header and the register. |
| F35 | R4-6: if one of four browser launches fails, the others stay open and the run can hang. | Accepted. | W12: launch with `Promise.allSettled`, close what started, then rethrow. |

## Verification

The coordinator checked provenance from `tmp/review-runs/round4/claude.jsonl`. Repairs are verified by W12's full proof and the coordinator's re-run.

## Round outcome

There was one major and five minor findings, all in the gates; the page was not in this diff. Because each review round has found another way past a check that measures one property at a time, F30 is repaired by an exact per-pixel identity that closes the class. The coordinator will judge from W12's evidence whether a further review round is needed.
