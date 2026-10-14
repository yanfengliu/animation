# Review 5: implementation

## Target

Repository `animation`, `main` at `2056eac`. The diff is `git diff 8faad71..2056eac`: the round-4 repairs F30–F35, written by W12 and verified and landed by W13. W13's evidence: `npm test` 36 of 36 three times (91–101 s); full proof control green, 70 mutants killed, 0 survived, 0 errored, 0 flagged; the identity is exactly 0 on the real page for seeds 1–3.

## Reviewers and coverage

The Claude CLI 2.1.281, `claude -p --model "claude-opus-5-5[1m]" --effort max`, with read-only tools. `modelUsage` held exactly one key, `claude-opus-5-5[1m]`. The run took 34 turns and cost $6.43. No Codex lane was run, by choice. The brief is in `tmp/review-runs/round5/prompt-claude.md` (ignored).

## Reports

### Claude (`claude-opus-5-5[1m]`, effort max)

# Review round 5: `8faad71..2056eac` (read-only)

I found four material defects: one major and three minor. There are also five minor issues listed at the end. None is in `index.html`, which this diff does not touch.

- **The major one (R5-1) is older than this diff.** The alike check reads colour only as warmth, so a green tint near E, applied in every draw, gets past every image check. The register now says this round's exact ties "close the class". They close it only for the shipped draw and the camera modes.
- **Repairs:** F30, F31, F34 and F35 are repaired as dispositioned. F32 is done for the glide but only partly for the tour (R5-2), and the tour shot has little time to spare (R5-3). F33's anchoring lost some forms that `8faad71` flagged (R5-4).

How I checked: git, file reads, and Node one-liners run in memory. These ran on copies of the hygiene regexes from both revisions and on arithmetic with the page's palette. I ran no tests, wrote no files and used no subagents. The colour and timing figures come from the page's constants and from W12/W13's numbers in the code comments, not from renders.

## Findings

**R5-1 · major · `tests/illusion.test.mjs:398–403`, `:440`; `tests/lib/image.mjs:253`; claims at `AGENTS.md:111`, `:171`, `docs/learning/defect-register.md:85`: colour is checked on one axis, so a green reveal in every draw passes**
- **Defect:**
  - `drawnBothWays` compares text and as-ambient particles by three things only: luminance, warmth (r − b)/(r + b), and effective area.
  - Green enters only through luminance. `lightOver` returns the green sum, but nothing reads it.
  - Scaling red and blue by one factor leaves warmth unchanged. Raising green at the same time can keep luminance unchanged. So the green–magenta axis is never checked.
  - Applied in every draw, the tint also passes the new identity and the camera-mode test, because the layers and E set by URL carry it too. Every other image check reads luminance (`image.mjs:52–55`).
- **Failure scenario** (palette at `index.html:15–18`, class shares at `:365`):
  - A change tints text particles near E: `v_col = u_pal[code & 3] * mix(vec3(1.0), vec3(0.739, 1.10, 0.739), text * u_near) * (level * tw * fade * energy);`, with `u_near` as in the reveal mutants.
  - Text over as-ambient light works out to 1.000; each colour class moves between −1.5% and +1.7%. The warmth gap is 0, and scene light does not change.
  - The green share of the text light goes from 0.329 to 0.422, and green over red from 1.11 to 1.65. So "hello world" reads green at E.
  - Every check I traced passes it. `AGENTS.md:171` ("the same light, colour, size and focus") and the register's "closes the class" (`:85`) say otherwise.
- **Fix:**
  - Check both colour axes. One way is each channel's text over as-ambient ratio within a band set from measurement (the light ratio is 0.994–1.006 today). Another is both chromaticity coordinates.
  - Add a mutant with this tint in every draw.
  - Change the register to say the exact ties close the class for the shipped draw and camera modes, and that the text-versus-ambient comparison still checks one property at a time.

**R5-2 · minor · `tests/illusion.test.mjs:96`, `:488`; `index.html:89`, `:711–722`; claims at `AGENTS.md:116`, `:148`, `defect-register.md:88`, `:110`: the tour shot covers only 2.8 s of the 5 s hold, and only because the test's tour starts at E**
- **Defect:**
  - The test starts the tour at E by URL. It holds 1 s and eases from E to E for 2.2 s before the TOUR 5 s 'hold' step starts, at about 3.2 s. So the 6 s shot is 2.8 s into the hold, not late in it.
  - The shipped tour starts at START, 61.4° from E. It moves for 8.34 s, then holds at E from about 9.3 s to 14.3 s. A visitor's time at E starts with the hold.
  - So "6 s at E" in the test covers only the first 2.8 s of a visitor's hold. "6 s in the tour's first hold" (`AGENTS.md:148`, register `:110`) reads as more than that.
  - `reveal-late-in-tour-hold` fires 5 s after the first frame, which is 1.8 s into the hold.
- **Failure scenario:**
  - A reveal keyed to the hold's own timer brightens text 1.25× once a tour hold has run 4 s (`mode === 'tour' && anim && !anim.target && now − anim.t0 > 4000`).
  - In the test it turns on at about 7.2 s. The screenshot finished by 7.36 s in the worst W12/W13 run and earlier in the others, so this row passes. It catches the reveal only now and then, under load.
  - Every visitor who watches the tour sees the words brighten for the last second of each hold at E.
- **Fix:**
  - Once R5-3's load is gone, shoot near the end of the hold (R4-3 suggested about 7.5 s).
  - Or start the tour from START, as the shipped page does, and shoot late in its first hold (about 13.5 s).
  - Until then, the bound should say the shot covers 2.8 s of the 5 s hold.

**R5-3 · minor (flakiness) · `tests/illusion.test.mjs:96`, `:145–155`, `:216`, `:491–494`, `:510`: the tour shot has 0.84 s to spare with four renders running beside it, and an overrun counts as a failed check**
- **Defect:**
  - The camera stays at E for at least 8.2 s after the first frame. `startTour` runs at the first tick, and each step starts at the frame where the previous one ended, so delays only make it longer.
  - The shot starts at 6 s. W12 and W13 saw the state reads and screenshot finish up to 1.36 s later, which leaves 0.84 s.
  - `pump()` never pauses, and the streak views are queued last. So up to four renders run in all four browsers during the camera-mode test, including browser 2, which also draws the tour page.
  - An overrun fails `held(h.s, 'tour')` with an AssertionError, which counts as a CHECK. The tour's next return to E is more than 20 s away, so an after-state at E is never a coincidence. The result is a false red, never a false pass.
- **Failure scenario:**
  - Say this phase runs about 1.6× slower: fewer cores for SwiftShader, or another process busy. The screenshot then ends after 8.2 s.
  - `npm test` goes red on the real page, and the mutation proof stops at its control with exit 2.
  - In a mutant run, the same overrun counts as a kill.
- **Fix:**
  - Run the camera-mode test after the queue drains: order it after the streak and seed tests, or pause `pump()` and wait for the renders in flight. Then re-measure the latency.
  - Retry once on a fresh page before failing.
  - This also makes room for R5-2's later shot.

**R5-4 · minor (regression) · `tests/hygiene.test.mjs:334–336`; claims at `:40–43`, `:60–61`, `AGENTS.md:139–141`, `:160`, `defect-register.md:22`, `:56`: anchoring `powershell` lost forms that `8faad71` flagged**
- **Defect:**
  - `WORD_START` treats only these as command starts: a line start; `;`, `&`, `|`, `(` or a backtick; and `cmd /c`, `sh -c` or `-Command`.
  - cmd.exe's echo-off `@` and the sh keywords `then`, `do` and `exec` also start commands, but the scan does not count them.
  - Before F33, `powershell` counted anywhere, so these were caught.
- **Failure scenario** (copies of both revisions' regexes, run in Node):
  - These four were flagged at `8faad71` and pass at `2056eac`:
    - `@powershell -NoProfile -ExecutionPolicy Bypass "ii index.html"` in a `.cmd` file, a common idiom
    - `then powershell "ii index.html"`
    - `do powershell "ii $f"`
    - `exec powershell -NoProfile "ii index.html"`
  - None is "another program's argument", the only blind spot the docs name. With `-Command` they are still flagged.
  - `@start index.html` and `then start index.html` pass at both revisions, so for plain openers the gap is older.
- **Fix:**
  - Allow an optional `@`, and the keywords `then`, `do`, `else` and `exec`, after `WORD_START`'s separators. That also closes the older gap for plain openers.
  - Add a tree mutant: a `.cmd` file with `@powershell -NoProfile "ii index.html"`.
  - Or name these forms in the blind spots.

## Answers

1. **Is each of F30–F35 repaired as dispositioned?**
   - **F30: yes.**
     - `shipped()` ties the whole frame to text + ambient − sky, per channel, capped at 255.
     - The camera-mode test uses the same residual over the centre.
     - `reveal-gold-shipped` and `reveal-gold-after-glide` are there, and each of their edit anchors occurs exactly once in `index.html`.
     - But what it ties to still checks colour on one axis (R5-1).
   - **F31: yes.**
     - On a copy of the regex, the arrow helper (one line or several), the helper without semicolons and both popup forms all bind the page name.
     - The only new false positives are the documented kind, such as a `socket` declared before a later `newPage` with no semicolon between them.
   - **F32: partly.**
     - The glide part is done: shot on arrival and after `DWELL_MS`, idle at E both times, and compared both with E set by URL and with the arrival shot.
     - The tour part is partial (R5-2, R5-3).
     - The running-clock limit is named.
   - **F33: yes for the forms named, but it lost the forms in R5-4.** The quoted switch value is flagged, and the commit and echo text now pass.
   - **F34: yes.**
     - The queue sentence matches `pump()`.
     - The β values carry their seed triples and the per-seed range, and "no bound" is limited to three-seed means.
     - The register lists snap and arrow-key arrivals.
     - `docs/learning/lessons.md` has been tracked since `8faad71`.
     - The counts check out: 36 tests (13, 9, 3, 7, 4) and 70 mutants (50 page, 20 tree).
   - **F35: yes.**
     - It uses `allSettled`, closes the browsers that started, empties `browsers`, then rethrows.
     - A failed `before` hook is an ERROR in `mutate.mjs`, not a kill.
2. **Is the pixel identity sound?**
   - **Can it fail on the real page?** I found no way.
     - The canvas is opaque, with no depth buffer (`index.html:466`).
     - The sky is drawn with blending off (`:651`), and particles blend ONE/ONE (`:677`).
     - Every sprite adds a positive amount (`:533`, `:550–551`). With saturating adds, draw order does not matter, and the 255 cap in the prediction matches the target.
     - Every pixel input is fixed by the URL. The layers draw two ranges of one buffer with the same uniforms (`:679–681`), so each render is deterministic.
     - It does assume a renderer that rounds each fragment on its own and does not dither (minor 3).
   - **Can a shipped-only reveal pass?** At the measured views and times, only below 0.1% of the frame's light per channel, or in pixels already at 255; the gold tint gives 2.5–3.6%. Outside the measured views and times it can pass: between the measured angles, on a running clock, or keyed to a bare URL (minor 2). A reveal in every draw is not the identity's job, and R5-1 shows the colour check lets one through.
3. **Are the dwell and tour timings robust?**
   - **The dwell is robust.** The glide page has `tour=0`, and the click calls `noteInput`, so nothing restarts the tour (`index.html:749`, `:860`). Each frame is the same, and the 8 s wait is a Node sleep.
   - **The tour holds at E for at least 8.2 s.** `__firstFrame` is recorded before `startTour` takes its `t0`.
   - **Can the tour shot land after the camera leaves E?** Yes, if the reads and screenshot take more than 2.2 s. The after-state then fails the check, so the result is a false red, not a false pass. The margin is thin for the load beside it (R5-3).
4. **Is AGENTS.md accurate?** Mostly. The queue, counts, identity, the new invariant line and the PowerShell rule as coded all match. The exceptions:
   - `:171`: the colour claim (R5-1).
   - `:116` and `:148`: "late in the hold" and "6 s in the tour's first hold" (R5-2).
   - `:160`: the blind spots (R5-4).
   - Minor issues 3, 4 and 5 below.

## Minor issues

1. `tests/illusion.test.mjs:490–494`: nothing asserts `h.from >= TOUR_SHOT_MS`. If the page's frames stop going through `window.requestAnimationFrame`, `since()` returns NaN and `sleep(NaN)` returns at once. The tour is then shot at load, and the test still passes (R19).
2. Every image gate sets `az`, `el` and `t` in the URL (`tests/illusion.test.mjs:171–172`, `:468`, `:488`). A reveal that shows only on a bare URL, the page a visitor opens, passes every gate. The bound names only the frozen clock (`AGENTS.md:149`).
3. `AGENTS.md:113` gives ONE/ONE blending, no depth buffer and per-sprite focus as the reason the identity is exact. It also needs a renderer that rounds each fragment on its own and does not dither. `index.html` never calls `gl.disable(gl.DITHER)`, and WebGL turns dithering on by default.
4. `AGENTS.md:136` and `tests/hygiene.test.mjs:31–33` say a name declared from a statement that calls `pages()` can hold a page. But `for (const tab of context.pages()) await tab.pause()` is not caught, because `PAGE_BINDING` needs `=`. This is older than this diff; I checked it on a copy of the regex.
5. `AGENTS.md:83` says `npm test` takes 90–100 s; W13's three runs took 91–101 s.

These are all the material defects I found.

Read outside the diff: `index.html:15–18`, `:88–89`, `:365`, `:424–436`, `:466`, `:497–552`, `:643–683`, `:689–752`, `:859–866`, `:882–892`; `tests/lib/harness.mjs:25–27`, `:71–83`, `:98–125`; `tests/lib/image.mjs:8–56`, `:236–254`; `tests/illusion.test.mjs:130–164`, `:398–404`; `tests/hygiene.test.mjs:286–326`; `tests/mutate.mjs:40–54`, `:247–262`, `:282–305`; `tests/lib/phases.mjs`; `tests/run.mjs`.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F36 | R5-1 (major): the text-versus-ambient comparison reads colour only as warmth, so a green–magenta tint near E, applied in every draw, passes every image check. The register's "closes the class" overclaims. | Accepted. It guards the owner's central rule. | W14: compare each of red, green and blue separately (text over as-ambient, per channel, with a band from measurement), which closes colour for that comparison; add a mutant with the tint in every draw; correct the register's claim. |
| F37 | R5-2: the tour shot covers only 2.8 s of the 5 s hold, because the test's tour starts at E. | Accepted. | W14: shoot late in a real hold, starting the tour from START as the shipped page does, or say exactly what is covered. |
| F38 | R5-3: the tour shot has 0.84 s to spare while four renders run beside it, and an overrun is a false red. | Accepted. | W14: run the camera-mode test after the render queue drains, re-measure the latency, and allow a retry on a fresh page. |
| F39 | R5-4: anchoring `powershell` lost the `@powershell`, `then`, `do` and `exec` forms that `8faad71` flagged. | Accepted. | W14: accept those command-start prefixes, which also closes the older gap for plain openers, and add a tree mutant. |
| F40 | Minor 1: nothing asserts that the tour shot came after `TOUR_SHOT_MS`, so a NaN delay shoots at load and passes. | Accepted. | W14 asserts it. |
| F41 | Minor 2: every image gate sets `az`, `el` and `t`, so a reveal shown only on a bare URL passes. | Accepted as a documented bound. | W14 names it in the bound. |
| F42 | Minor 3: exactness also needs a renderer that does not dither; WebGL dithers by default. | Accepted as a documented assumption. Changing the page for a test-only reason is not warranted. | W14 names it in AGENTS.md. |
| F43 | Minor 4: `for (const tab of context.pages())` binds no page name. | Accepted. | W14 fixes it if cheap, otherwise names it as a blind spot. |
| F44 | Minor 5: the runtime figure in AGENTS.md. | Accepted. | W14 corrects it. |

## Verification

The coordinator checked provenance from `tmp/review-runs/round5/claude.jsonl`. W14's full proof verifies the repairs.

## Round outcome

There was one major and three minor material findings, plus five small ones, all in the gates. The reviewer confirmed F30, F31, F34 and F35 repaired, and found no way the pixel identity could fail on the real page. Gate repairs have now run in rounds 1–4 (W6, W7, W11, W12 with W13). W14 is the fifth and last automatic repair round under the fleet's repair cap. After it, the coordinator reports rather than starting another cycle.
