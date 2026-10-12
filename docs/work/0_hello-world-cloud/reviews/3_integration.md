# Review 3: integration

## Target

Repository `animation`, `main` at `9c0425f`. The diff since round 2 is `git diff c0aa84d..9c0425f`. It holds:
- W7's repairs F19–F22 (`e432c41`)
- the owner's no-reveal directive, carried out by W8 and W9 (`6642bc7`)
- the owner-requested 14° slanted letters, by W10 with the coordinator retiring the β 1.0 mutant (`9c0425f`)

The coordinator ran `npm test` at `9c0425f`: 35 of 35 pass in 46 s.

## Reviewers and coverage

The Claude CLI 2.1.281, `claude -p --model "claude-opus-5-5[1m]" --effort max`, with read-only tools. `modelUsage` held exactly one key, `claude-opus-5-5[1m]`. The run took 32 turns and cost $7.06. No Codex lane was run, by choice. The brief is in `tmp/review-runs/round3/prompt-claude.md` (ignored).

## Reports

### Claude (`claude-opus-5-5[1m]`, effort max)

# Review round 3: `c0aa84d..9c0425f` (read-only)

I found one major and six minor findings. None of them is in the shipped page. I traced every uniform, attribute and branch in `index.html`, and no reveal remains. The major finding is a hole in the gate that guards the owner's rule.

I ran no tests, changed no files and used no subagents. I used only `git`, `grep`, `ls`, `cat` and file reads.

## Findings

**R3-1 · major · `tests/illusion.test.mjs:273–303`, `index.html:679–681`, `AGENTS.md:105–107`, `:128`: the "alike" gate compares text with ambient only through the test-only draws, so a reveal in the shipped draw passes**
- **Defect:**
  - Both sides of `drawnBothWays` come from test-only renders: `layer=text` (`index.html:679`), `layer=ambient` (`:680`) and `beta=0`, which has no text particles.
  - The shipped render takes the third branch (`:681`). No check ties it to those renders.
  - The only alike measure on the shipped render near E is scene light (`illusion.test.mjs:287`), held to ±15% (`SCENE_BAND`, `:62`).
  - Text is about 4,950 of 18,000 particles (W8's count, `plan.md:30`). If text carries its share of the light, a text-only gain g raises scene light by about 0.27(g − 1).
  - At 1.25×, the strength every reveal mutant uses, that is about 7%. The measured scene ratio is 0.95–1.06, so the result stays inside 0.85–1.15.
  - The legibility tests also read the shipped render, but a reveal only raises their ratio and lift. The hidden and streak tests look only at views 24° or more from E.
- **Failure scenario:**
  - A change adds a near-E text glow in the default branch only, such as a second additive draw of `[0, nText)` at 25% while `alignDeg() < 12`.
  - The test-only renders do not change, so light, warmth and size read 1.0, and scene light at E rises about 7%.
  - All 35 tests pass, and the owner again sees dots "lighting up more as I approach".
- **The same snapshot misses two other kinds of reveal:**
  - **Camera mode:** a reveal tied to the tour's 5 s hold at E, a snap or a glide. Every illusion view uses `tour=0` with the camera idle.
  - **Small reveals:** anything under 10%. `LIGHT_BAND` is ±10% (`:59`), while the measured spread is ±1%.
  - Neither gap is written down. AGENTS.md:128 names the angle gap. The register names that gap and the t 0 limit, at which a synchronised twinkle reads about the same as a random one.
- **Fix:**
  - At each alike view, assert that the shipped render's particle light equals the text layer's plus the ambient layer's, each measured over the sky.
    - With additive blending this holds exactly apart from saturation, so a 2% tolerance is ample.
    - Add a mutant that draws an extra text pass in the default branch only.
  - Tighten `LIGHT_BAND` to about ±5%.
  - Add a view about 12° from E, repeat the light check at t 7.3, and name the camera-mode gap in the bound.

**R3-2 · minor · `tests/illusion.test.mjs:67`, `:171–184`, `:21`; `tests/lib/image.mjs:184`; `tests/mutate.mjs:75–76`: the gate accepts any lean from about 4° to 24°, and the reduced streaks the slant was for are not gated**
- **Defect:**
  - After `unslant` by tan 14°, a stem with leftover lean Δ stays in its end strip for about 0.15/tan|Δ| of its height. The strip is 0.15 of the line height wide (`image.mjs:184`).
  - `FULL_STEM` 0.8 therefore holds for |Δ| up to about 10.6°. Any `SLANT` from about 4° to 24° passes.
  - The comment's upright figures fit this formula: 0.15/tan 14° = 0.60, against 0.63 and 0.58 measured (`:67`).
  - 18° and 22° already fail other bounds (commit `9c0425f`), so the unguarded side is the low one.
  - The el±25 column residual, the reason for the slant, is reported but never asserted (`:306–321`).
  - So `upright-letters` names "stems show as vertical streaks" as its defect, but is killed by a check on a copied constant (`SLANT_DEG`) within a wide band.
  - The header's "its letters lean right by about 14°" (`:21`) claims more than the check holds.
- **Failure scenario:**
  - Someone sets `SLANT = 5` to make the type look less italic.
  - The layout test passes, since Δ = 9° keeps about 0.95 of the stem in its strip.
  - Nothing measures the el±25 columns, so most of the streaks W10 removed come back with every test green.
- **Fix:**
  - Assert the el±25 column residual against a bound between the slanted and upright values (1.26×/1.72× against 1.79×/2.26× the floor at seed 1), if seeds 1–3 keep them apart.
  - Or measure the stem's leftover lean directly, as the slope of its left edge after unslanting, and bound it to a few degrees.

**R3-3 · minor · `docs/work/0_hello-world-cloud/plan.md:130`, `tests/illusion.test.mjs:63`, `AGENTS.md:128`: retiring `full-relocation` suits the streak gate, but it reopens the β lesson that W9 closed with it**
- **The retirement is justified as far as the gate goes:**
  - The residual is divided by a floor that rises with β (0.94 to 1.07 at β 1.0, `:63`). So the gate cannot see relocation rising evenly across all views.
  - The gate still catches streaks that some views show more than the diagonal views do (`no-density-compensation`, 1.74).
  - The old kill was seed luck. On the upright page, seeds 2–3 gave β 1.0 1.62 and 1.88, against 1.73 and 1.88 at β 0.85 (`:63`).
- **What the retirement hides:**
  - Off-angle structure does grow with β in absolute terms.
    - W8's table (`plan.md:39–40`, upright letters) goes from 1.25 to 1.69 in the az+25 rows, and from 1.74/2.20 to 2.10/2.57 at el±25.
    - With slanted letters, the comment's own numbers give a worst gated residual of about 1.37 of the cloud's noise at β 1.0 (1.28 × 1.07), against about 1.21 at 0.85 (1.29 × 0.94).
  - Nothing now holds β at 0.85:
    - `plan.md:130` still says `full-relocation` turns the residual gate red, which `9c0425f` made false.
    - `docs/learning/lessons.md` does not exist. R18 says an ungated lesson belongs there, naming the gate that will retire it.
- **Failure scenario:**
  - A later session raises β to 1.0 for crisper words (1.61 to 1.76 at E in W8's table).
  - Every gate passes and the off-angle cloud gets lumpier. Nothing records that β 1.0 was turned down before.
- **Fix:**
  - Restore the β/streak lesson in `docs/learning/lessons.md` and name its retiring gate. One candidate is an absolute residual bound at az±25, over the cloud's own noise, set across seeds 1–3.
  - Correct `plan.md:130`.

**R3-4 · minor · `tests/illusion.test.mjs:55`, `:56`, `:36–38`: two hiding bounds sit inside the shipped design's own seed spread**
- **Defect:**
  - `FLOOR_MARGIN` 0.06 compares with real values of 0.028, 0.037 and 0.069 for seeds 1–3 (`:55`).
  - `STREAK_K` 1.45 compares with 1.19, 1.42 and 1.64 at az+25 (`:36–38`).
  - Seed 3 fails both.
  - `MAX_BACK_FLOOR` kills `no-density-compensation` by only 0.01: 1.26 against 1.25 (`:56`). `STREAK_K` also kills that mutant.
  - AGENTS.md:113 records that the bounds hold for the default seed, but not the consequence below.
- **Failure scenario:**
  - Any change that redraws the random cloud without changing the design moves these numbers, as the slant did: seed 1 at az+25 went from 1.25 to 1.19.
    - That includes one more `rand()` call in `buildCloud`, a new `N_TOTAL`, or a glyph tweak that changes which particles relocate.
    - On this evidence such a change can turn two gates red with no defect. The easy repair is retuning the thresholds until they pass.
  - A lucky redraw can equally let a real regression through.
- **Fix:**
  - Evaluate both bounds over seeds 1–3, as a mean or a maximum, with thresholds set from that.
  - At minimum, say in the header that red after a redraw means "re-measure seeds 1–3", not "retune".

**R3-5 · minor · `tests/page.test.mjs:154–172`, `tests/illusion.test.mjs:111–118`, `tests/mutate.mjs:34`, `:223`: timing checks now run beside a much heavier illusion file**
- **Defect:**
  - The font test times two page loads one after the other, and allows only 2 s between them.
  - W9 made the illusion file render four 1280×800 pages at a time in two browsers.
  - `mutate.mjs` runs `[illusion, controls, page]` two at a time. So the controls file runs beside the illusion file, and the page file takes the next free slot. In `npm test` the illusion file also shares the two slots for most of its run.
  - R1-7 (F15) loosened this same bound for the same risk of two files running at once.
- **Failure scenario** (I traced the mechanism in the code but did not observe it):
  - The baseline load lands while the illusion file is computing masks in Node. The hung load lands during its four-page burst.
  - The hung load then takes more than the baseline plus 2 s on the real page, and fails as a CHECK.
  - The control fling (`controls.test.mjs:265`) has the same exposure through its 60 ms release window (`index.html:812`).
  - In a mutation run any CHECK counts as a kill (`mutate.mjs:229`, `:283`). So a flaky check can mark a surviving mutant KILLED.
- **Fix:**
  - Run the baseline and the hung load at the same time in one browser, so both see the same load.
  - Run the illusion file on its own, or limit its parallel renders while another file runs.

**R3-6 · minor · `tests/hygiene.test.mjs:298`, `:272`: F22's narrowing opened two holes that the round-2 scan covered**
- **Quotes:**
  - `CMD_START` now treats a quote as a command start only after a separator or a shell switch.
  - Windows PowerShell treats its first plain argument as a command. So `powershell "start index.html"` and `powershell -NoProfile "ii index.html"` run an opener with no switch before the quote.
  - Round 2's pattern, where any quote started a command, flagged both. Now nothing does, because no `BANNED` entry names `start` or `ii`.
- **Pause:**
  - Page names are bound only from `const x = …newPage(`, `…pages(` or `…waitForEvent(` in one statement.
  - Playwright's documented popup pattern therefore passes: `const popupPromise = page.waitForEvent('popup'); … const popup = await popupPromise; await popup.pause();`.
  - So does `const [popup] = await Promise.all([page.waitForEvent('popup'), …])`.
  - Round 2 flagged any receiver that was not a stream. The documented blind spot covers only names the file does not bind.
- **Failure scenario:**
  - An npm script or settings hook running `powershell "start index.html"` passes all four hygiene tests, in a repo that is developed on Windows.
  - So does a debug helper that pauses a popup.
- **Fix:**
  - Count a quote after `powershell` or `powershell.exe` and its switches as a command start.
  - Bind destructured names, and names assigned from an awaited bound name.
  - Add a tree mutant for each case.

**R3-7 · minor · `docs/work/0_hello-world-cloud/plan.md:48`, `:131–133`; `docs/learning/defect-register.md:69–71`; `tests/illusion.test.mjs:38`: docs out of step with the code**
- `plan.md:48` still calls slanted glyphs "untried" and "offered to the owner rather than done", but `9c0425f` did them.
- `plan.md:131–133` leaves W10 open with no outcome, although AGENTS.md names the plan as "the design and acceptance record". The outcome exists only in the commit message and AGENTS.md:
  - 14° was adopted, and 18° and 22° were turned down;
  - the full mutation proof ran 56 mutants with one survivor;
  - `full-relocation` was retired.
- `defect-register.md:69–71` still quotes W9's upright-letter values:

  | Measure | Register (upright letters) | Code comments (slanted letters) |
  |---|---|---|
  | Warmth gap | 0.007 at most | ≤ 0.005 |
  | Sprite size | 0.96–1.02 | 0.98–1.01 |
  | Scene light | 0.96 | 0.95–1.06 |
  | Lift | 1.49–1.65 | 1.48–1.61 |

  The slanted values are in `illusion.test.mjs:51` and `:60–62`.
- `illusion.test.mjs:38` says seed 3 "exceeds the hidden-from-25° margin there (by 0.069)". But 0.069 is its excess over the floor (`:55`), so it exceeds the 0.06 margin by 0.009.
- **Fix:** close W10 in the plan, fix line 48, refresh the register's numbers and correct `:38`.

## Checked and clean

- **The owner's rule, in the page:**
  - Text and ambient particles share every term for light, colour, size, focus, twinkle and fade (`index.html:516–533`). The fragment shader's halo is a fixed 0.08 (`:546`).
  - `draw()` (`:643–683`) sets no uniform from the camera's angle to E. It sets only:
    - view and projection;
    - the fixed E position and the clock;
    - pixels per unit, aperture 0.14 and focus at the orbit radius;
    - point-size limits, swell and palette.
  - `alignDeg` feeds only snapping, gestures and `__cloud.alignment()`.
  - Text particles draw first, but additive blending makes order irrelevant.
  - The one remaining difference is motion, by design: text particles bob only along their sight lines from E and get no drift or wobble (`:504–511`).
- **`beta`:**
  - Particle positions and seeds come from the `cloud:` random stream before relocation (`:334–366`). Relocation uses its own `relocate:` and `land:` streams (`:374`). So the base cloud is the same for every β.
  - `beta=0` skips every particle (`chance >= 0`, `:386`).
  - β changes only:
    - which particles relocate;
    - where they land, including the reach of `relax`;
    - the buffer order and the particle counts.
  - `shoot.mjs` accepts exactly the values the page reads, though it confirms only that `beta=0` took effect.
  - The comment that a larger β "only adds text particles" (`:373`) is nearly true, not strictly, because particles share the landing draws.
- **The slant:**
  - Each line is sheared about its own baseline (`:217–224`). The ink extent is exact apart from the 1° arc sampling, because a sheared round cap adds `half·hypot(1, lean)`.
  - The block is re-centred on its ink, and the phone widening follows: about 66.1° to 67.4° at 390×844. At fov 60 that leaves about 10 px a side, which matches `shoot.mjs`'s "about 11".
  - Text at E is exact for every field of view and aspect ratio. Text particles lie on rays from E, and the camera at E uses E's own frame.
  - The unslanted layout check catches:
    - a mirrored frame, because the lean doubles;
    - a vertical flip, through the line widths and the lean;
    - a 180° turn, through the line widths only;
    - upright letters, but only within R3-2's band.
  - Cropping is checked only at 390×844.
- **W7's repairs:**
  - F19 is complete. A page that never becomes ready is an ERROR in every test that needs a drawn page, including the font test's baseline. A flagged mutant now makes the run exit 1.
  - F21 is done as specified, with R3-5's caveat.
  - F20 now catches all three round-2 cases: the `node -e` spawn, the hook script named through `$CLAUDE_PROJECT_DIR`, and `playwright@1.63.0 open`.
  - F22 strips comments and narrows the quote and pause rules, with R3-6's two holes.

Read outside the diff: `index.html:497–511`, `:679–681`, `:812`; `tests/lib/harness.mjs:71–83`; `tests/lib/image.mjs:164–187`; `tests/controls.test.mjs:251–274`; `docs/work/0_hello-world-cloud/reviews/1_integration.md:96–106`.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F23 | R3-1 (major): the alike gate compares text with ambient only through test-only draws (`layer=` and `beta=0`). A reveal added to the shipped draw path, during camera modes, or under 10% would pass. | Accepted. This gate guards the owner's central rule, and the shipped page is the thing to guard. The reviewer confirmed the page has no reveal today. | W11: assert that the shipped render's particle light equals text layer plus ambient layer; add a mutant for an extra text pass in the default branch; tighten `LIGHT_BAND`; add a view about 12° from E and a t 7.3 repeat; check or name the camera-mode gap. |
| F24 | R3-2: the layout check accepts any slant from about 4° to 24°, and the el ±25 streak cut that the slant exists for is not gated. | Accepted. | W11: gate the el ±25 column residual, or the leftover stem lean, between the slanted and upright values across seeds 1–3. |
| F25 | R3-3: retiring `full-relocation` reopened the β lesson. Nothing holds β at 0.85, and `plan.md:130` claims a kill that no longer happens. | Accepted. | W11 tries an absolute az ±25 residual bound across seeds 1–3 that kills a β 1.0 mutant. Otherwise the coordinator adds a `docs/learning/lessons.md` entry. The coordinator corrects the plan. |
| F26 | R3-4: `FLOOR_MARGIN` and `STREAK_K` sit inside the shipped design's seed spread (seed 3 fails both), so any redraw can turn them red with no defect. | Accepted. | W11 evaluates both bounds over seeds 1–3 and states that red after a redraw means re-measure, not retune. |
| F27 | R3-5: the font-hang and fling timing checks now run beside the heavier illusion file. | Accepted. | W11 times both loads at once in one browser and keeps the illusion file from running beside the timing checks. |
| F28 | R3-6: F22's narrowing let `powershell "start index.html"` and the documented popup-pause pattern through. | Accepted. | W11 fixes both, with tree mutants. |
| F29 | R3-7: docs drift (plan W10 outcome and line 48; the register's numbers; `illusion.test.mjs:38` wording). | Accepted. | The coordinator fixes the plan; W11 fixes the register and the test comment. |

## Verification

The coordinator checked provenance from `tmp/review-runs/round3/claude.jsonl`. Repairs are verified in round 4.

## Round outcome

There was one major and six minor findings, all in the gates and docs. The reviewer traced every uniform, attribute and branch in `index.html` and found no reveal: the shipped page obeys the owner's rule. All seven findings were accepted and routed to W11, followed by a focused round 4.
