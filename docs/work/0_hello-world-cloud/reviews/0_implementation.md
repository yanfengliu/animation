# Review 0: implementation

## Target

Repository `animation`. Commit `891558f` on the integration branch `worktree-hello-cloud`. It merges W2's branch `worktree-agent-a79120c474259d678` at `76bc0d6` into `main` at `d9af175`.

Changed paths: `index.html`, `scripts/shoot.mjs`, `package.json`, `package-lock.json`, `.nvmrc`. Reviewed diff: `git diff d9af175...891558f`. The next commit, `16191bf`, changes only the plan, so the code is identical there.

## Reviewers and coverage

The Claude CLI 2.1.281, `claude -p --model "claude-opus-5-5[1m]" --effort max`, run as the fleet review runbook pins it.

- Tools were read-only: Read, Glob, Grep, Task, and `git diff`, `git log` and `git show`.
- The final `result` event's `modelUsage` held exactly one key, `claude-opus-5-5[1m]`. The run took 14 turns and cost $4.19.
- Lenses: illusion geometry, the controls state machine, robustness, contract compliance, performance, `scripts/shoot.mjs`, accessibility.
- No Codex lane was run. The change is not high-risk by the fleet's definition, so one pinned lane was proportionate. This was a choice, not a lane that was down.
- The brief is in `tmp/review-runs/round0/prompt-claude.md` (ignored run output).

## Reports

### Claude (`claude-opus-5-5[1m]`, effort max)

Review done; writing up the report.

## Review round 0: `891558f` (code identical at `16191bf`)

I found no critical or major defects. The illusion geometry, the page contract and the input state machine all hold up when I trace them through the code. I found seven minor issues, listed most severe first.

### Findings

**M1 · minor · `index.html:8`: the "optional" Google Fonts stylesheet blocks the whole page**
- **Defect:** the `<link rel="stylesheet">` is in `<head>`, so it blocks both rendering and the script. Nothing paints (the inline `<style>` at :9 comes after it), and the script at :74 does not run until the font CSS request finishes or fails.
- **Failure:** open `index.html` from disk on a network that silently drops traffic to Google (a firewall or captive portal). The page stays blank, with no cloud and no message, until the connection times out, typically tens of seconds. Fully offline fails fast, so only these networks show it. `shoot.mjs:120` aborts the font request instantly, so no shot or gate can catch the stall. This goes against "optional" in `AGENTS.md:81`.
- **Fix:** add the stylesheet from the script (a link added by script blocks neither rendering nor scripts), or move the `<link>` after the `<script>`.

**M2 · minor · `index.html:771`, `:784`, `:715`/`:729`/`:680`: zooming can leave the camera stuck just off E**
- **(a) Wheel or +/− during an animation:** the wheel and the +/− keys call `stopAuto()` while in `snap` or `glide`. That drops the animation part-way, and nothing restarts it.
  - Press "Find the angle" from the default view (61° away) and scroll once during the 2.2 s glide. The camera stops about 30° from E in mode `idle`, with no text.
  - Release a drag 4° from E and scroll during the 900 ms snap. The camera stays 1–4° off, with the text only partly locked in.
- **(b) Pinch at E:** when a pinch starts at E, the first finger's slip before the second lands counts as moving away. At E, `gestureFrom` is 0. Each pixel of slip is 0.229° (`DRAG_RATE` 0.004 rad/px). After the pinch, `settle()` sees `d > gestureFrom + 0.1` and does not snap. A 10 px slip leaves the camera 2.3° off and the letters stay blurred.
- **Fix:**
  - For wheel or zoom keys during `snap`/`glide`, change only the zoom and set `anim.z0 = cam.zoom; anim.dz = 0` instead of calling `stopAuto()`.
  - On the second `pointerdown`, set `gestureFrom = Math.max(gestureFrom, alignDeg())`.

**M3 · minor · `index.html:202–204`, `:327–330`: the stroke mask comes from canvas readback, so a seed is only repeatable per rasterizer**
- **Defect:** S is a 2D-canvas stroke, read back with `getImageData` and kept where alpha ≥ 128. How many random numbers the relocation loop uses depends on each B and S lookup:
  - `rand()` is drawn only when `b > 0`;
  - the 64-try loop stops at the first point inside a stroke.

  So one edge pixel that differs changes the random stream for every later particle.
- **Failure:**
  - The default seed on Safari, Firefox or a later Chromium build with different anti-aliasing can produce a different text set and a different `counts.text` than the 1,104 the plan records. `plan.md:41` says "the same seed always builds the same cloud", which is then true only for one rasterizer build.
  - If a browser blanks canvas readback (anti-fingerprinting), `bmax` is 0 and every particle hits `b <= 0`. Then `counts.text` is 0, nothing ever appears at E, and no error shows.
- **Fix:** compute S directly from the glyph data: a point is inside when its distance to any glyph line or arc is ≤ `STROKE/2`. Build that grid in JavaScript.

**M4 · minor · `index.html:756–760`: reduced motion still allows inertia**
- **Defect:** reduced motion turns off the tour, snap and glide, but not the coast after a fling.
- **Failure:** with `prefers-reduced-motion: reduce`, a flick faster than 0.15 rad/s still enters `inertia`. The view keeps turning up to about 50° (the 3 rad/s cap × τ 0.3 s) after the finger lifts.
- **Fix:** when `reduced` is set, call `settle()` instead of entering inertia.

**M5 · minor · `scripts/shoot.mjs:139–141`: the "did not take" check misses some views**
- **Defect 1:** the check compares against `Number(v.az)` and similar. `Math.abs(NaN) > 0.01` is false, so a non-numeric value passes.
- **Defect 2:** `el` is clamped to ±70 before the comparison, so an out-of-range request also passes.
- **Failure:**
  - `az=3o,el=14` renders the default az −24, prints no PROBLEM and exits 0.
  - `el=85` renders el 70, passes, and the file is named `el85`.
- **Also:** the `off` preset shoots every off-angle view at t=0 only (`:25`, `:60–76`). Text particles skip the drift and wobble that ambient particles get (`index.html:444–451`), so the off-angle picture changes with t. The magic set covers 0, 7.3 and 31; the off set does not.
- **Fix:**
  - Reject non-finite numbers when parsing a view (exit 2, naming the key and value).
  - Report |el| > 70 as "did not take".
  - Add t 7.3 and 31 to at least the ±8° and ±25° off views.
- `t`, `layer`, `seed` and `reduced` can't be read back through `__cloud`, so they stay unchecked by design.

**M6 · minor · `index.html:697`, `:67`, `:72`: accessibility gaps**
- **Defect:**
  - The tour restarts 7 s after every input, and nothing on the page stops it; only the OS reduced-motion setting does. That is a WCAG 2.2.2 (pause, stop, hide) risk for motion that starts on its own.
  - The arrow and +/− keys are mentioned only in the canvas `aria-label`. The visible hint says only "Drag".
  - The canvas can't take focus, so screen-reader users in browse mode have the reader capture their arrow keys and can't use the controls the label promises.
- **Fix:**
  - Add a pause control, or stop resuming the tour after the first interaction.
  - Mention the keys in visible text.
  - Consider `tabindex="0"` on the canvas.

**M7 · minor · `index.html:406`: `powerPreference: 'high-performance'`**
- **Defect:** on dual-GPU laptops this can wake the discrete GPU for a page that never stops animating, which costs battery. The workload doesn't need it.
- **Rough load (my arithmetic, not measured):**
  - At zoom 1 and DPR 2, the point sprites cover about 4.5–5.5 Mpx per frame, roughly 1.1× the canvas.
  - At `ZOOM_MAX` 4, each sprite's area grows 16×, which comes to roughly 20 Mpx per frame. That is the case to profile on an integrated GPU.
  - Per-frame allocations are about 10 small arrays plus two 16-float arrays, which is not material.
- **Fix:** drop the option and use the default.

### Checked and sound
- **Text at E:**
  - **Exact for every FOV, aspect, DPR and t:**
    - Relocation keeps the distance from E (`:341–345`).
    - Text particles move only along `a_dir` (`:444–445`).
    - The camera lands exactly on E after a snap, glide, the tour or the `az`/`el` parameters (`wrapPi(38°)` returns 38° unchanged; the animation's end state is set exactly at `:653`).
    - The view matrix's right and up vectors match `E_RIGHT`/`E_UP` (`:141–142`, `:577–586`), so the text is upright and not mirrored.
    - Zoom only scales tan(fov/2) (`:386`), and R is fixed.
  - **Cropping at high zoom:**
    - On narrow screens the text block is cropped above zoom 1.22, where width limits it.
    - On 16:10 screens it is cropped above zoom 2.65, where height limits it.
    - The snap keeps the current zoom; Find resets it to at most 1.
- **σ and drift:**
  - σ = 0.468 x-height (1.24 world units) matches three box passes (`:228`).
  - Beyond 22°, every shader term for text equals the ambient one, except that text skips drift and wobble.
  - Ambient drift plus wobble is at most 0.52 world units: 0.42σ at the text plane, but about 0.9σ for the nearest particles (13.5 units from E) as seen from E. So `AGENTS.md:82`'s "well under σ" is true only at and beyond the plane.
  - The drift waves are almost exactly transverse, so they keep the density even.
- **Input:**
  - I traced every pointer, key, wheel and button path, including switching between one and two touches (`:726–727`, `:744`), capture loss and cancel.
  - With real input I found no state the page gets stuck in.
- **Robustness:**
  - Frame time is clamped (`:817`) and animations run on absolute time.
  - Lost WebGL contexts are rebuilt on restore; missing WebGL2 shows `#nogl`.
  - Point size is clamped and `v_quad` matches it.
  - Bad or extreme query parameters are guarded (`:96–101`, `:388`).
- **Contract:**
  - Parameters, the `__cloud` fields (frozen and read-only), DOM ids and mode strings all match `AGENTS.md:84` and `plan.md:43`.
  - Colour tokens, `color-scheme: dark`, the body background, safe-area insets, no hash state and the focus ring are all in place.
  - At 390 px the top bar needs about 325 of the 358 px available.
  - The readout contrast is 5.3–6.0:1.
- **Lockfile:** it matches Playwright 1.63.0, which declares no optional dependencies.

Read outside the diff: `AGENTS.md:81–85`, `docs/work/0_hello-world-cloud/plan.md:41`, `docs/work/0_hello-world-cloud/plan.md:49`, `.claude/worktrees/agent-a79120c474259d678/node_modules/playwright/package.json:3`

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F0 | M1: the Google Fonts `<link>` blocks paint and script, so a network that silently drops Google leaves the page blank until timeout. | Accepted. The fonts are documented as optional, and a blank page breaks that. | W2 makes the stylesheet non-blocking. W3 adds a gate where the fonts request never answers. |
| F1 | M2a: wheel or +/− during `snap` or `glide` cancels the animation and strands the camera off E. | Accepted. A plausible gesture leaves the viewer just short of the message. | W2 keeps the animation going and carries the new zoom. W3 adds a gate that wheels during a Find glide. |
| F2 | M2b: a pinch that starts at E counts first-finger slip as moving away, so there is no snap. | Accepted. | W2 raises `gestureFrom` on the second pointer. W3 adds a pinch-at-E gate. |
| F3 | M3: the stroke mask comes from canvas readback, so a seed is repeatable only per rasterizer, and a blanked readback silently yields no text. | Accepted. Anti-fingerprinting browsers would lose the whole effect without an error. | W2 computes the mask from glyph geometry. W3 adds a blanked-readback gate. |
| F4 | M4: reduced motion still allows inertia after a fling. | Accepted. | W2 settles immediately under reduced motion. W3 adds a gate. |
| F5 | M5: `shoot.mjs` lets non-finite and out-of-range values through, and the off-angle preset covers only t=0. | Accepted. | W2 validates values and adds t 7.3 and 31 to the ±8° and ±25° views. |
| F6 | M6: the tour restarts after every pause with no way to stop it (WCAG 2.2.2); keys are mentioned only in the aria-label; the canvas cannot take focus. | Accepted, with a coordinator decision: the tour runs from load until the first input and never resumes on its own. This keeps the showcase and removes motion the viewer did not ask for. | W2 changes the tour, mentions the keys in visible text and makes the canvas focusable. W3 changes the tour gate to "stays stopped". |
| F7 | M7: `powerPreference: 'high-performance'` can wake a discrete GPU for no need. | Accepted. | W2 drops the option. |
| F8 | Noted under "Checked and sound": AGENTS.md says ambient drift stays "well under σ", but drift plus wobble (≤ 0.52 units) is 0.42σ at the text plane and about 0.9σ for the nearest particles as seen from E. | Accepted as a documentation accuracy fix. Density compensation is judged from all angles, and the measured residual at ±25° stays at the noise floor. | W3 rewords the invariant in AGENTS.md. |

## Verification

The coordinator checked the review's provenance from `tmp/review-runs/round0/claude.jsonl`: `subtype` success and the single `modelUsage` key above. No repair has been verified in this round. The repairs, and the gates that cover them, are checked in the next round.

## Round outcome

There were no critical or major findings, and the reviewer judged the illusion geometry exact at E for every field of view, aspect ratio, device pixel ratio and particle time. All nine findings were accepted and routed. A focused re-review of the repair diff happens with the next round on the integrated revision.
