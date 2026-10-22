# Review 0: implementation

## Target

Repository `animation`, base `a7bdb72`. The target is the work-unit-1 code that was uncommitted when the review started: W16's page and W17's gates, nine files.

| File | sha256 prefix |
|---|---|
| `index.html` | `2b96e35b` |
| `scripts/shoot.mjs` | `812d58c4` |
| `tests/illusion.test.mjs` | `4871bfce` |
| `tests/lib/harness.mjs` | `bf4471a5` |
| `tests/lib/image.mjs` | `bc3854c2` |
| `tests/mutate.mjs` | `4d4bf750` |
| `tests/page.test.mjs` | `bba71584` |
| `tests/lib/messages.mjs` (new) | `354caec2` |
| `tests/sequence.test.mjs` (new) | `e106111f` |

- The reviewed diff is `tmp/review-runs/wu1-round0/target.diff` (ignored; 2,286 lines, sha256 `721e2bc2`). It holds `git diff a7bdb72` of the seven tracked files, plus the two new files as all-added diffs.
- W18 committed these nine files unchanged as `8dc6893` at 23:41 on 2026-10-21, while the Codex lane ran. Per file, `git diff a7bdb72 8dc6893` equals the reviewed diff, and the blobs equal the reviewed working files apart from line endings (`core.autocrlf=true`). So the target is recoverable as `a7bdb72..8dc6893`, limited to these nine paths. By the local tracking ref, `origin/main` was at `8dc6893`.
- No target file changed during the Codex lane. All nine hashed the same at 23:22, before launch, and at 23:43, after it ended. The Claude lane ran on 2026-10-22 on the same bytes, from a clone at `8dc6893`, because W19 was by then editing four of these files in the working tree.
- Out of scope: `AGENTS.md` and `README.md`, whose Gates sections W18 was rewriting; `8dc6893` commits them too. Both reviewers read the rules from `a7bdb72:AGENTS.md`, section "Invariants & boundaries". `8dc6893` rewords that section for six eyes, and the Claude prompt said so.

## Reviewers and coverage

Codex ran, and its report passed the runbook's checks.
- codex-cli 0.158.0 (the runbook requires 0.156.1 or later), in the runbook's diff form: `codex exec --model gpt-6-astra -c model_reasoning_effort=xhigh -c approval_policy=never --sandbox read-only --ephemeral -o …`, with the diff on stdin. It ran from the repo root with the user config loaded (no `--ignore-user-config`) and no other `codex exec` running.
- Model: the run header names `gpt-6-astra`, reasoning effort xhigh and sandbox read-only. The full stdout has no `STATUS_DLL_INIT_FAILED` or `-1073741502`.
- Citations: every finding cites a file and line. Four citations outside the diff's hunks were checked against the files and against the reads in the transcript, and all hold: `index.html:665–703` (the fragment and sky shaders), `tests/lib/harness.mjs:119–142` (`until` and `drag`), `tests/lib/image.mjs:124` (`strokeMask`) and `a7bdb72:AGENTS.md:182–191` (the invariants). X1's anchors, `tests/sequence.test.mjs:146` and `index.html:1034`, also hold.
- Run: 12 min 7 s (23:30 to 23:42), 261,161 tokens, 23 read-only shell commands (PowerShell `Get-Content`, `rg` and `git show`) and no MCP tool calls. Codex shows neither turns nor cost.
- All 23 commands were screened after the run. Each one only reads, or parses W17's saved data in PowerShell; none runs npm, Node, a test or a browser.
- One subagent spawn failed ("collab spawn failed … no rollout found for thread id", probably because `--ephemeral` keeps no rollout). So no subagent contributed, as the report says.
- In the sandbox, `git show` needed `-c safe.directory=…`, which Codex added itself.
- Before the review, a read smoke test (runbook item 2) on `tests/lib/messages.mjs` returned the right values with the right lines (`:15` and `:9`) in 20 s, with no DLL markers.

Claude ran on 2026-10-22, and its report passed the runbook's checks.
- A first attempt on 2026-10-21 abstained because the CLI's login had expired ("OAuth session expired and could not be refreshed": 0 turns, $0, no request sent). After the owner logged in again, the coordinator asked for one run, and the lane ran once.
- claude 2.1.308 (the runbook requires 2.1.280 or later; its `modelUsage` check was proven on 2.1.281). The runbook's diff form: `claude -p --model "claude-opus-5-5[1m]" --effort max`, the prompt by `--append-system-prompt` and the diff on stdin.
- Isolation. W19 was editing `index.html`, `scripts/shoot.mjs`, `tests/mutate.mjs` and `tests/sequence.test.mjs` in the primary checkout, and `1414745` had committed this record with its dispositions. So the reviewer worked in a clone at `tmp/review-runs/wu1-round0/tree-8dc6893/` (ignored), detached at `8dc6893` with only its 47 ancestor commits and no refs. Its nine target files equal the `8dc6893` blobs byte for byte, and they were unchanged after the run. The diff it got was `git diff a7bdb72 8dc6893` of the nine files, which equals the reviewed diff file by file. Copies of `tmp/w17/` and `tmp/w16/*.log` gave it the evidence Codex had.
- Tools. `--tools "Read,Glob,Grep,Task,Bash"` and the runbook's allow list (`Read,Glob,Grep,Task,Bash(git diff *),Bash(git log *),Bash(git show *)`), with `--permission-mode dontAsk` (nothing else runs) and `--strict-mcp-config` (no MCP servers). A deny list blocked edits and writes, web tools, the shell readers that user settings allow, `npm`, `npx` and `node`, and reads of the primary checkout, this review's captures, `~/.claude` and `~/.codex`. A permission smoke test confirmed the setup before the run.
- Model: the init event named `claude-opus-5-5[1m]`, and `modelUsage` held exactly one key, `claude-opus-5-5[1m]`.
- Run: 35 turns, $7.98 and 29 min 20 s (00:57 to 01:27), with no subagents.
- Transcript audit: 34 tool calls. 21 Reads, 4 Greps and 1 Glob were inside the clone, and 8 git commands (`git show`, `git grep` and `git diff`) read commits. None read the primary checkout, so the reviewer read no working-tree copy of a target file.
- One call was denied: a Grep of its own oversized `git show` output, which Claude Code had saved under `~/.claude/projects/`. The reviewer read that section with `git grep` instead. Oversized shell outputs were therefore unreadable, a constraint on method, but every file it needed stayed readable.
- Citations: every finding cites a file and line. Four citations outside the diff's hunks were checked against the clone, and all hold: `index.html:35` (the focus outline), `index.html:618–619` (the swell's `0.5 * t`), `tests/page.test.mjs:67–68` (the 390 px check loads `tour=0`) and `scripts/shoot.mjs:163` (the usage message).
- The login check before the run went wrong once. The runbook's one-word prompt, run from the repo root, started an unasked session: the repo's instructions led it to inspect the repo until my 300 s timeout stopped it. It made 12 reads and no writes, and its 13th call, to write a helper script outside the repo, never completed. Repeated from a neutral folder with no tools, the check answered in one turn ($0.38), with exactly one `modelUsage` key.

Independent coverage this round is two lanes.

Prompts: `tmp/review-runs/wu1-round0/prompt-codex.md` and `prompt-claude-r0b.md` (ignored), built from one shared text. The Claude prompt differs only in logistics for its clone: the working directory, the diff's source, and reads limited to the clone. (`prompt-claude.md` was the first attempt's, which never reached the model.) They ask for an adversarial, report-only review against the plan's acceptance criteria and AGENTS.md's invariants, through eight questions:
- the alike rule and the draw identity;
- the alike gate;
- the legibility gates;
- hiding;
- the sequence;
- the mutation proof;
- older gates;
- the page contract and budget.

They forbid writes, tests and any browser workload. Raw captures are under `tmp/review-runs/wu1-round0/` (ignored).

## Reports

### Codex (`gpt-6-astra`, effort xhigh), 2026-10-21

Redacted: the 12 citation links pointed at absolute paths on the reviewing machine. Each now shows only the repo-relative `path:line` text it already displayed. Nothing else is changed. The report is Codex's `-o` output, which held no credentials, session details, echoed prompt or transport chatter.

**Summary**

12 findings: **2 critical, 8 major, 2 minor**. **Request changes.**

I found no angle-triggered lighting, colour, size or focus reveal in the current particle shader. However, the gates admit concrete broken implementations of Find and capture rendering. Hiding coverage, clipping exclusions and several sequence checks also need repair.

**How I checked**

I reviewed the supplied diff, surrounding code, the plan and handoff, lessons, defect register, and `a7bdb72:AGENTS.md:182–191`. I compared the old illusion gate and inspected the four requested logs, plus saved W17 measurement data and its probe source.

The recorded results are 42/42 passing twice and 81/81 mutants killed. Those are supplied evidence, not runs I reproduced. I ran no tests or browsers and changed no files. One subagent launch failed; no subagent contributed. Counterexamples below are code reasoning unless explicitly attributed to saved measurements.

**Findings**

**X1 — Critical: Find can name every destination while always going to hello world.**  
`tests/sequence.test.mjs:146`, `index.html:1034–1039`.

The test clicks seven times without waiting for intermediate landings. It checks the reported names, then verifies only the final hello-world landing. The `msg=a` case also checks only the next reported name.

Change only Find’s `target = msgTarget(k, …)` to `target = msgTarget(0, …)`, preserving `cursor = k` and `heading = k`. Find then goes to hello world on every click, yet satisfies these assertions. The older Find checks also target hello world.

**Suggested fix:** wait for and verify every landing against the independent eye coordinates. Add this wrong-destination mutant separately from `find-skips-a`.

**X2 — Critical: a capture-only reveal passes every rendering check.**  
`tests/illusion.test.mjs:134`, `tests/illusion.test.mjs:629–634`, `tests/sequence.test.mjs:49–56`.

Image queries never enable capture. Camera-mode image comparisons cover only hello world reached by Find or the load tour. Capture tests inspect coordinates, mode and chrome, not rendered particles.

For example, reuse the existing brightness mutant but enable it only when `capture && alignTo(3) < 12`. The recorded animation would brighten near “a”; every tested image remains unchanged, and capture’s state assertions remain satisfied. A reveal during the tour’s five later holds has the same gap.

**Suggested fix:** compare rendered holds at all six eyes through capture and Play against their URL-set references. Add capture-specific and later-message tour reveal mutants.

**X3 — Major: the alike comparison dilutes a single message’s rendering error across all six.**  
`tests/illusion.test.mjs:455`, `tests/mutate.mjs:179–180`.

`drawnBothWays()` measures the complete text layer. It never isolates the message whose eye is being tested. A brightness or colour error confined to one message contributes only that group’s share of the total measured light.

The recorded “a” group contains 2,843 of 30,256 text particles. Counts are not light measurements, but illustrate the dilution. The `reveal-near-a` mutant brightens **all text particles** near “a”, so its rejection does not establish sensitivity to brightening only “a”.

**Suggested fix:** compare each assigned group with the same group drawn as ambient, and prove sensitivity with message-specific brightness, colour, size and focus mutants.

**X4 — Major: clipping removes the affected pixels from the colour verdict without bounding the omission.**  
`tests/lib/image.mjs:371`, `tests/illusion.test.mjs:461–462`, `tests/illusion.test.mjs:493–500`.

If blue reaches 255, the helper discards red and green at that pixel too. The text and ambient comparisons independently select their surviving pixels. `clipped` is printed but never asserted.

Consequently, a tint concentrated in already-clipped stroke cores—or one that pushes its affected cores into clipping—can disappear from the colour calculation. A sufficiently local change can remain inside the whole-layer light band. The additive identity does not reject an effect applied consistently in the shared shader.

This is a plausible escape requiring a targeted mutant, not a demonstrated surviving run.

**Suggested fix:** measure dense strokes through an additional exposure that avoids clipping, with a verified relationship to the shipped draw. Bound excluded coverage and add a clipping-targeted tint mutant.

**X5 — Major: the hiding gate misses the known antipodal failure class, and its new general threshold is not mutation-proven.**  
`tests/illusion.test.mjs:142`, `tests/illusion.test.mjs:404–430`, `tests/illusion.test.mjs:92`.

Each message is checked only at its two immediate neighbours and two adjacent midpoints. There are no per-message hiding assertions at far views, antipodes, or the three other eyes. Thus face leakage under “beautiful”—the failure described in `docs/work/1_sentence-sequence/plan.md:95`—is outside this matrix. The masks also retain their upright eye-space shape; they do not explicitly detect mirrored, shifted or radially smeared copies.

Moreover, `HIDE_MARGIN = 0.3` cites flat-text measurements at hello world’s elevation offsets, where this threshold is never applied. The saved flat-text data’s largest neighbour/midpoint excess over seeds 1–3 is approximately **0.256**, below 0.3. Its hiding rejection comes solely from `HW_HIDE_MARGIN` at el±25 (`tmp/w17/mutate-full.log:194–195`).

**Suggested fix:** cover other eyes, far views and antipodal neighbourhoods with appropriate transformed masks or independent structure checks. Add separate hiding mutants for each message and establish thresholds against those failures.

**X6 — Major: the older absolute elevation-streak limit has been weakened into a movable ratio.**  
`tests/illusion.test.mjs:519`, `tests/illusion.test.mjs:108–110`; compare `a7bdb72:tests/illusion.test.mjs:480–486`.

Previously, el±25 column residual had to remain below **1.95 times the cloud’s own noise**. It now divides that residual by the far-view floor and permits 1.9, while allowing the floor itself up to 1.9.

For example, a floor of 1.7 and elevation residual of 3.0 pass the new checks: `3 / 1.7 = 1.765`. The old absolute check rejects 3.0. Increasing structure at the controls now increases the permitted elevation streaks.

The new comments describe the denominator but do not justify losing the absolute protection. `STREAK_K` additionally admits that no mutant reaches it.

**Suggested fix:** retain an independently justified absolute elevation bound alongside the relative comparison, and prove it with a mutant that increases both control-view and elevation structure.

**X7 — Major: keyboard focus can put visible chrome into capture.**  
`index.html:63`, `index.html:35`, `index.html:76`, `index.html:1004–1006`.

Open `#capture` and press Tab. The canvas remains focusable, the capture key handler permits Tab’s default action, and `#scene:focus-visible` still draws its two-pixel outline. Capture CSS hides the bar and hint but does not suppress this outline.

The capture gate checks only four element visibilities and the cursor, so it misses the border.

**Suggested fix:** suppress the canvas focus outline during capture while preserving normal-mode focus visibility. Verify capture after keyboard focus enters the canvas.

**X8 — Major: enabling reduced motion during Play or capture leaves the current glide running.**  
`index.html:1049`, `index.html:825–834`, `index.html:865–870`.

The preference-change handler sets `seq.cut = true` but leaves the active `anim` intact. Switching reduced motion on just after a neighbour glide starts therefore permits nearly another **4.4 seconds** of camera movement. Cuts take effect only at subsequent steps.

The reduced-motion sequence test starts with the preference already enabled, so it does not cover this transition.

**Suggested fix:** immediately resolve or stop the current glide when reduction is enabled, then use cut holds. Test preference changes during a leg and during a hold.

**X9 — Major: the capture-loop test rejects healthy loops when earlier tests finish late.**  
`tests/sequence.test.mjs:244`, `tests/sequence.test.mjs:250–257`.

Capture starts in `before()` and keeps running beside the other tests. Its completion predicate searches historical frames for the first return to hello world. But validation consumes the entire current log and rejects any runs after that return.

If earlier tests take long enough for capture to leave its returned hello-world hold, the predicate succeeds immediately and the extra healthy movement produces a failure.

**Suggested fix:** validate a recorded prefix ending at the first return, rather than requiring an indefinitely running loop’s current log to end there.

**X10 — Major: a partial browser-launch failure loses ownership of successful launches.**  
`tests/sequence.test.mjs:113`, `tests/sequence.test.mjs:117`.

`browsers = await Promise.all(...)` assigns nothing if one launch rejects. Successfully launched browsers then have no entries in `browsers`; the cleanup hook cannot close them. They can keep the test process alive and interfere with later timing-sensitive work.

**Suggested fix:** use the existing `Promise.allSettled` ownership-and-cleanup pattern in `tests/illusion.test.mjs:219–230`.

**X11 — Minor: the screenshot tool reports valid moving captures as ignored `msg` parameters.**  
`scripts/shoot.mjs:221`, `scripts/shoot.mjs:215`.

For a view such as `msg=world,capture=1,wait=10000,t=live`, the camera correctly starts at world and subsequently moves through capture. After waiting, the tool still requires the current camera to equal world and reports that `msg` “did not take”.

**Suggested fix:** distinguish initialization checks from post-animation state checks. Do not require the initial named eye after an authorized moving sequence.

**X12 — Minor: Escape is not the only same-document capture exit.**  
`index.html:1047`, `index.html:891–898`.

Changing the fragment from `#capture` to another fragment calls `setCapture(false)`, restores chrome and stops the sequence without Escape. This contradicts the stated “only Escape” contract.

**Suggested fix:** either retain capture until Escape or explicitly document and test fragment navigation as another exit.

**Answers**

1. **Owner’s rule:** The current particle shader has no eye-nearness or camera-mode reveal. Size, depth fade, focus and twinkle use common rules (`index.html:640–661`); geometric depth still changes with perspective. Text’s restricted motion and ambient drift remain deliberate (`index.html:634–638`). The draw uses one ONE/ONE particle pass without a depth buffer (`index.html:598`, `index.html:803–810`). Message ranges are disjoint (`index.html:510–524`). Structurally, the six `textof` layers plus ambient reconstruct the full draw, with sky subtraction and channel capping. One message’s layer plus ambient alone omits the other five. The gate does not verify the six-way identity.

2. **Alike gate:** It samples all six exact eyes at t=0, but only hello world’s vicinity and the three far views at t=7.3 (`tests/illusion.test.mjs:149`). The far views are honestly outside 40°: their nearest-eye distances are approximately **47.20°, 66.81°, 66.81°**. It does not provide equivalent approach coverage around the five new eyes. X2–X4 limit its reveal protection.

3. **Legibility:** The primary masks correctly use each message’s `textof` layer minus sky (`tests/illusion.test.mjs:257–270`). Saved seed-1–12 data supports ratio **1.551470–2.082198** and lift **1.531886–2.045756**, above 1.5 and 1.45. Weak relocation can reach lift 1.453, so `MIN_LIFT` alone does not reject every weak case; the ratio check supplies the rejection. Full-scene legibility normally uses seed 1; seed 8 supplies the comparison mask. Hello world’s seeds 1–3 apply to selected layout, hiding and streak checks—not all its legibility checks. These are bounded measurements, not proof of the words’ identity or human readability. The blanket “every bound sits between” claim at `tests/illusion.test.mjs:54` is false for X5 and X6.

4. **Hiding:** I cannot determine actual readability away from the eyes without visual inspection. The current opposite message pairs sit **34° from each other’s antipodes**, avoiding the plan’s earlier approximately 20° danger placement. That does not prove hiding. The gates cover immediate neighbours and adjacent midpoints, plus hello world’s el±25 views; they leave the other-eye, far-view and mirrored-leakage cases in X5 unchecked.

5. **Sequence:** The implementation builds the correct six-message order, holds for 3 seconds, ends the load tour at world and wraps capture continuously (`index.html:844–870`). Nominal timings calculated from its constants are approximately **44.90 seconds** for the load tour and **44.17 seconds** per steady capture cycle. First return to hello world in capture is approximately **49.77 seconds**, before frame and loading overhead. Find’s implementation is correct, despite X1’s gate gap. Play is tested only through its first hold and departure toward face. X7–X9 and X12 affect capture or reduced motion. The tour screenshot also remains load-sensitive: it starts at least 1.5 seconds into a 3-second hold and must finish before departure; two slow captures can fail a correct page (`tests/illusion.test.mjs:603–626`). Frame-log hold lengths can also shrink under stalls because they measure first-to-last observations.

6. **Mutation proof:** The log records **58 page mutants plus 23 tree mutants**, with relevant assertions killing the seven new mutants. I found no listed mutant killed *only* by wholesale page failure. There is an incidental timeout for `wide-element`, alongside its valid overflow assertion (`tmp/w17/mutate-full.log:377–382`); “0 errored” is the final mutant classification, not absence of execution errors. Missing targeted mutants include individual-message hiding/reveals, Find’s wrong landing, Play-only truncation, capture-only rendering, clipping-targeted colour changes, reduced-motion cuts, loop removal, Escape removal and frozen-contract removal. Killing global flat text does not prove every message’s hiding bound.

7. **Older gates:** Readback-zero, hello world’s layout and lean, 8-pixel phone fit, t=0/7.3/31 stability, fov=32/80 scaling and 8-second idle comparison remain. Ratio, lift and seed-IoU thresholds tightened; minimum gap area fell from 3,000 to 1,500 to accommodate the added messages. Important changes are the removed back-floor hiding check, replaced az±25/+60 views, widened light lower bound **0.95→0.93**, raw-channel comparison replaced by unclipped colour balance, and X6’s changed streak denominator. Several changes have measurement-based reasons; those reasons do not establish equivalent protection. The earlier tour shot is necessary for the shorter hold, but covers less elapsed dwell.

8. **Contract and constraints:** `messages` and its entries are frozen, in order; `__cloud` is frozen and its property is non-writable (`index.html:581–595`). Query parsing, `msg` initialization, az/el overrides and `textof` range selection are coherent (`index.html:119–134`, `index.html:553–574`, `index.html:806–810`). Required DOM IDs remain present. The page adds no runtime dependency or external script. Phone fit and overflow have recorded passing evidence, within their tested states. The particle count is exactly **48,000** (`index.html:105`); DPR is capped at 2. The **24.4 million fragments/frame**, approximately **2.6×** estimate is stated in `docs/work/1_sentence-sequence/plan.md:109`, but ordinary-laptop smoothness remains unverified.

**Read outside the diff**

Among the unchanged surrounding code I read:

- `index.html:644–658` — particle size, focus, twinkle and fade.
- `index.html:665–703` — fragment and sky shaders.
- `index.html:719–767` — GL setup and matrices.
- `tests/lib/image.mjs:124–158` — mask construction.
- `tests/lib/image.mjs:243–305` — light, additive identity and streak measurements.
- `tests/lib/harness.mjs:119–142` — timeout classification and real mouse drag.
- `a7bdb72:AGENTS.md:182–191` — invariants and boundaries.

### Claude (`claude-opus-5-5[1m]`, effort max), 2026-10-22

Redacted: nothing. The report is the `result` field of the run's final event, which held no credentials, session details, echoed prompt or transport chatter. Its four `##` headings are shown as `####`, so that they nest under this section. Nothing else is changed.

I found 15 problems: none critical, 3 major and 12 minor. As far as I can tell from the code, the page follows the owner's rule. No particle's light, colour, size or focus depends on the camera angle. The shipped draw is still exactly the text draw plus the ambient draw. The sequence and capture logic is correct. The logs agree: 42 of 42 tests passed twice, and all 81 mutants were killed.

The gates prove less than their headers and acceptance criteria 2, 3 and 5 claim:
- The five newer messages have no working hiding check.
- Capture mode and the sequence's stops at the five other eyes are never imaged.
- The restructure lost the old proof that the gates catch a page without density compensation (the step that keeps each message hidden off-angle).

All three can be fixed in the gates without changing the page.

#### How I checked

- **Docs:** I read the plan, the lessons, the defect register and the base rules. The full `git show a7bdb72:AGENTS.md` output was too large and was saved to a file outside the allowed folder, so I read its "Invariants & boundaries" section with `git grep -A` (a7bdb72:AGENTS.md:182–196).
- **Code:** I read all nine target files at `8dc6893` in full, plus the unchanged gate files they depend on (`tests/controls.test.mjs`, `tests/motion.test.mjs`, `tests/run.mjs`, `tests/lib/phases.mjs`). I compared old thresholds, views and mutants with `git grep` at `a7bdb72`.
- **Logs:** I read `tmp/w17/npmtest-1.log`, `tmp/w17/npmtest-2.log`, `tmp/w17/mutate-full.log` and `tmp/w16/npm-test-2.log`. I treated them as claims and checked them against the code. For example, `index.html:116–117` gives the logged 3.02 s holds and 4.32–4.35 s glides, and the 42.18° first glide gives 3.61 s.
- **No subagents.**
- **What I could not check:** I ran nothing and opened no browser, so nothing about the picture is verified. That includes whether a mirrored copy of a message shows at the eye three steps away, the font metrics of DM Mono (the page's font), and fill rate on a real GPU.

#### Findings

**C1 — major. Capture mode and the sequence's stops at the five other eyes are never imaged.**
- **Where:** `tests/illusion.test.mjs:563–643` holds the only camera-mode shots: a "Find the angle" glide to hello world's eye E, and the tour at load holding at E. `tests/sequence.test.mjs:1–8` reads only the camera's path, never pixels. `tests/illusion.test.mjs:149` checks the other eyes only as URL views with `tour=0` at t 0.
- **Failure:** Add the mutate.mjs edits `[TEXT_DECL, NEAR_UNIFORM, nearSet('capture ? ' + NEAR + ' : 0'), TEXT_BRIGHTER]`, so text is 1.25× brighter at E in capture mode only. Every gate stays green, because no test renders a `#capture` page.
  - The same holds for `mode === 'tour' ? <near "a"> : 0`, and for a reveal after a Find glide lands on a non-E eye.
  - Capture is exactly what the owner will record (`plan.md:10`, `:73`).
  - Criterion 2 says "alike gates extended to every viewpoint". That is true only for URL views at t 0.
- **Fix:**
  - Shoot a `?t=0#capture` page during its hold at the face (about 13–16 s after load).
  - Shoot the tour at load, or Play, during a hold at a non-E eye.
  - Compare each with the URL view over the central region using `partsResidual`.
  - Add `reveal-in-capture` and `reveal-on-tour-near-face` mutants.

**C2 — major. The five newer messages have no working hiding gate, and the riskiest views are not measured.**
- **Where:** `tests/illusion.test.mjs:142–145` and `:402–415` (with `HIDE_MARGIN` at `:92`), and `mutate-full.log:194–195`.
- **Problem:** The check lays each message's stroke mask, taken from its own eye, over a view 30°–60° away. A message that is legible there sits at other pixels, so the check cannot see it.
  - Evidence: the `flat-text` mutant turns a message into a sign readable from the side. It failed the hiding test only for hello world at el±25. So it stayed under 0.3 at every neighbour and midpoint view, for all six messages.
  - No mutant turns `HIDE_MARGIN` red.
- **Unmeasured views:** Each eye sits 34° above the point opposite another message's eye (that message's antipode):
  - hello world's eye (38°, 14°) is 34° above "a"'s antipode (38°, −20°);
  - the face's eye (98°, 18°) is 34° above "beautiful"'s antipode (98°, −16°);
  - "What"'s eye (158°, 16°) is 34° above "world"'s antipode (158°, −18°).
  
  W16 saw the face's mirrored smile from 14° away (`plan.md:95`). These pairs are never neighbours, so no gate measures message k+3 at eye k, and the sequence holds there 3 s every pass.
- **Failure:** A change that makes "What" a flat sign readable from its midpoints passes every gate. So does one that leaves a mirrored, smeared "a" visible at hello world's eye.
- **Fix:**
  - For each message, render its own `textof` layer at the away views: both neighbours' eyes and midpoints, the eye three steps away, its back view, and el±25.
  - Build a mask there as the smear test does (`:433–445`).
  - Require that shape to change with the seed, and to add little contrast over `beta=0`.
  - Prove the new check with a per-message flat-text mutant, and with an eye moved within 20° of another message's antipode (W16's face at el −30°).

**C3 — major. Density compensation lost its off-angle proof in the restructure.**
- **Where:** `tests/mutate.mjs:96–98` against a7bdb72:tests/mutate.mjs:91–92. Also MAX_BACK_FLOOR, removed (a7bdb72:tests/illusion.test.mjs:91, :388), and `STREAK_K` (`tests/illusion.test.mjs:109`: "no mutant reaches it"). Evidence in `mutate-full.log:151–163`.
- **What changed in the mutant:**
  - The old mutant gave hello world, then the only message, a 0.3 chance: about 5,130 text particles, close to the old page's roughly 5,100.
  - The port divides 0.3 by six: at most about 2,280 particles per message. That is a quarter of hello world's 9,115 on the page, and 49–80% of each other message's count.
  - So it now tests "far fewer particles" as much as "no compensation". Hello world dies on legibility (lift 1.283; the "h" stem fills 0.74 of the line height, against a minimum of 0.8), as any sparse page would.
- **What the old gates caught that is now gone:**
  - The back-view bound (1.251 against 1.19) was removed together with the back view.
  - The streak bound it proved (2.31 against 2.1) is no longer reached: ≤ 1.29 against 1.8. So `STREAK_K` has no proving mutant, yet the header lists it under "Proves" (`:50–54`).
  - Only the alike light band at the far view (68°, 60°) still catches it (1.096 against 1.05).
- **Failure:** Weaker compensation at the page's own particle counts, for example a landing kernel narrower than the rate kernel, may now pass. Nothing has shown that the remaining off-angle checks catch it.
- **Fix:**
  - Calibrate the mutant to each message's real share (about 0.2 for hello world).
  - Re-measure `STREAK_K` and the alike band against it.
  - Restore a back-view bound for hello world, or state in the header why it and the az±25/az+60 views were dropped.

**C4 — minor. The tour shot's timing slack shrank to 0.53–1.10 s.**
- **Where:** `tests/illusion.test.mjs:106–107`, `:603–627`.
- **Evidence:** In `npmtest-1.log:84` the reads and screenshot took 823 ms and ended 665 ms before the hold did; in `npmtest-2.log:84`, 400 ms and 1,095 ms. The old test had about 1.7 s to spare (a7bdb72:tests/illusion.test.mjs:104).
- **Failure:** On a machine where the 1280×800 screenshot takes about 1.5 s, both attempts miss. `npm test` then goes red, and the mutation proof stops at its control run (exit 2). This fails safe (red, not green), but it blocks commits.
- **Fix:** Clip the screenshot to the central region and do the before and after state reads in one evaluate. Log the margin.

**C5 — minor. The capture-loop test passes only if it starts in time.**
- **Where:** `tests/sequence.test.mjs:241–258`, especially `:257`, which demands that nothing follows the hold at hello world.
- **Problem:** That hold runs from about 49.7 s to about 52.7 s after load. The test runs after tests 1–5 in the same file. If they overrun past about 52.7 s, the log holds the next glide and the test fails.
- **Evidence:** In `mutate-full.log:288–289`, `tour-restarts`'s capture page behaves exactly like the real one (capture is never idle, so the mutated branch never runs). It still failed at `:258` because test 5 waited one extra pass. That kill is for the wrong reason.
- **Fix:** Cut the log at the end of that hold before checking.

**C6 — minor. The frame-log check can misread a glide's first frame as part of the hold.**
- **Where:** `tests/sequence.test.mjs:63`, `:88–90`; `index.html:819–826`, `:143`.
- **Problem:** When a hold ends, `target()` already names the next message on that frame. The glide's eased start moves very slowly at first (10k³). On the shortest leg (56.9° in 4.35 s), the camera is still within 1e-6° of the eye 5.2 ms into the glide.
  - The browser passes each frame's start time to its animation callback, and the page starts the glide timer during the callback. So if the hold's last callback runs more than about 11 ms late, the next frame still reads as "at the eye" with the next message's name.
  - `:90` then reports "during the hold at X target() named X, Y".
- **Fix:** Allow trailing hold frames that name the next message.

**C7 — minor. The scene-light band passes a whole-scene glow of about 20% at E.**
- **Where:** `tests/illusion.test.mjs:100`, `:499`; the header at `:44` says nothing glows brighter. Seed 1 measures E at 0.935 (`npmtest-2.log:59`).
- **Failure:** Make every particle 1.2× brighter at E, fading out by 12°. E's ratio becomes about 1.12, under the 1.15 limit. The text-vs-ambient, colour, size and shipped-draw checks are ratios, or sums over draws that all carry the glow, so they all pass.
- **Fix:** Also bound E's scene light against the view 3° away (0.994 for seed 1). Measure that ratio's spread over seeds first.

**C8 — minor. Several behaviours in the brief have no mutant.**
- **No mutant turns these red:**
  - capture's hidden cursor (`index.html:64`);
  - capture ignoring the wheel and keys (`:997`, `:1004–1007`);
  - the loop itself (`:847`, `:852–855`);
  - Escape restoring the controls and stopping the camera (`:891–899`);
  - Play (`:1041–1046`);
  - the reduced-motion cut (`:865–869`). `reduced-motion-ignored` fails earlier, at `sequence.test.mjs:201`;
  - the page contract: `messages` (`:587`), `msg` (`:554`), `textof` (`:560`) and `capture` (`:593`);
  - the hiding and streak bounds (C2, C3).
- **Killed for the wrong reason:** `no-density-compensation` (C3) and `tour-restarts` at `:258` (C5). No mutant breaks the page wholesale: each kept 30–37 of 38 tests green.

**C9 — minor. Nothing checks that `textof` took effect.**
- **Where:** `index.html:560`, where an unknown or ignored `textof` silently draws every text particle. `tests/lib/harness.mjs:97–107` verifies only `az`, `el` and `fov`.
- **Failure:** If `textof` stops narrowing the draw, every per-message mask silently includes all six messages' particles, with no test going red.
- **Fix:** In `textMask` (`tests/illusion.test.mjs:257`), require the `textof` layer's light to be well below the whole text layer's at that view.

**C10 — minor. Capture mode leaks a focus frame, and Escape leaves the hash.**
- **Focus frame:** In capture mode, non-Escape keys return without blocking the browser (`index.html:1004–1007`). So Tab focuses the canvas, the only focusable element left, and `#scene:focus-visible` (`:35`) draws a 2 px gold frame into the recording. `.capture` does not suppress it (`:63–64`).
- **Hash:** `setCapture(false)` (`:891–899`) leaves `#capture` in the URL. Opening the same anchor again fires no `hashchange`, so capture cannot restart without a reload.
- **Fix:** Add `.capture #scene:focus-visible { outline: none }`, and call `history.replaceState` on Escape to drop the hash.

**C11 — minor. "Seamless loop" is undefined, and consecutive passes differ.**
- **Where:** `index.html:619`, `:847`, `:1067`; criterion 5 in `plan.md:73`.
- **Problem:** One pass is about 44.2 s, and the particle clock keeps running. The swell (the slow bob every particle makes, 0.5 rad/s) advances about 22.1 rad per pass, nearly half a cycle. So at the same camera spot the bob is close to reversed, up to 1.6 world units (about 46 px at 1280×800).
- **Also:** The first pass differs from later ones (2 s start hold, a 3.6 s glide from the start view).
- **Effect:** One recorded pass, looped as a video, will jump at the seam. A continuous recording will not. The gate checks only the camera path.
- **Fix:** Define "seamless" with the owner. If a video loop is wanted, make the particle clock periodic with the pass in capture mode.

**C12 — minor. A motion cue at each eye (a design question).**
- **Where:** `index.html:443–446`, `:469–475`, `:505–509`, `:634–639`.
- **What it does:** Each ambient particle now bobs along the line from a "home" eye, drawn by how much each message's catchment wants it.
- **Effect:**
  - From eye m, particles homed to m bob along the line of sight, so their bob is invisible, and m's text particles do not move at all.
  - Everything else still bobs: about 0.67 units, or about 19 px at 1280×800.
  - In the hello-world-only page, the whole cloud calmed evenly at E. Now each message's surroundings calm while the rest of the cloud heaves.
- **Why it matters:** It is not a light, colour, size or focus difference, but it is an angle-dependent cue. Every image gate freezes the clock, so nothing measures motion.
- **Fix:** Get the owner's decision, plus a live-clock check that compares frame-to-frame motion near each eye with far views.

**C13 — minor. The 390 px check covers only the shortest readout and the fallback font.**
- **Where:** `tests/page.test.mjs:67–80` loads `tour=0` at the start view, where the readout is "AZ 8.0° · EL -16.0°" (19 characters). The Google Fonts stylesheet is answered empty, so the fallback font is used.
- **Risk:** The readout can reach 21 characters ("AZ 338.0° · EL -70.0°"). Assuming DM Mono's characters are 0.6 em wide (I could not check), the bar needs about 357 of the 358 px available.
- **Fix:** Also check the widest readout, or let the readout shrink instead of pushing the Play button off-screen.

**C14 — minor. Comments and docs that claim too much or are stale.**
- `tests/illusion.test.mjs:92`: the `HIDE_MARGIN` comment cites flat-text values at el±25, which that bound never measures.
- `:402`: the test name says "no message shows at its neighbours' eyes", which the measure cannot show (C2).
- `:50–54`: lists the streak bound under "Proves" without a proving mutant.
- `:303–304`: says strokes are 0.16 thick (in x-heights); the page now draws them 0.2 world units wide (`index.html:215`), 0.075 of hello world's x-height.
- `:106`: says the reads and screenshot take "0.8–1 s"; the logs show 0.40–0.82 s.
- `:87`: `MIN_LIFT` (1.45) sits inside the β 0.2 mutant's measured range (1.334–1.453), not between the page and that mutant.
- `:110`: the el±25 streak bound changed from absolute to relative to the floor (a7bdb72:tests/illusion.test.mjs:108) with no stated reason. In absolute terms el+25 rose from 1.37 to 1.73 and el−25 from 1.49 to 1.93 (`npmtest-2.log:77–79`).
- `scripts/shoot.mjs:163`: the usage message lists only `magic|off|all`.
- `docs/learning/defect-register.md:88–98`: still describes the old alike views and the 5% light band.

**C15 — minor. The performance criterion has no check.**
- **Where:** `plan.md:74`, `:109`; `index.html:105`, `:651`, `:800`.
- **Problem:** The "budget" is W16's estimate: 24.4 M fragments per frame at 1920×1080 and DPR 2, about 1.5 G blended fragments a second at 60 fps. It is not a limit anything holds, and nothing fails if `N_TOTAL` or sprite sizes grow.
- **Fix:** State a limit and check `N_TOTAL` and the fill estimate, or record that the owner accepts the risk.

#### Answers

1. **Owner's rule.**
   - **Light, colour, size, focus:** none depends on camera angle. The shader's inputs hold nothing angle-dependent (`index.html:612–613`, `:793–802`), and the colour formula is the same for every particle (`:661`).
   - **The only class difference:** text particles skip drift and wobble (`:635–639`), as before.
   - **Timing:** holds and snaps are camera behaviour, not rendering. Motion: see C12.
   - **Shipped draw:** still one ONE/ONE pass (`:803–804`), no depth buffer (`:598`), depth of field per sprite (`:648–650`). The text range plus the ambient range is exactly the full draw (`:806–810`).
   - **Per-message `textof` layer:** a sub-range drawn with the same program and settings (`:807`), so the identity holds by construction. No gate checks it.
2. **Alike gate.**
   - **Coverage:** at each of the six eyes' exact viewpoint at t 0 it catches brightness, tint, size, focus and shipped-draw-only reveals. `reveal-near-a` gives 1.209 at "a"'s eye (`mutate-full.log:414–416`).
   - **Not covered:** angles approaching the five other eyes (only E has 3° and 12° views), t 7.3 at those eyes, and camera modes (C1).
   - **Views:** the far views are at least 40° from every eye, as the header says.
   - **Clipping rule:** it drops pixels with any channel at 255 (`tests/lib/image.mjs:365–376`), 5–7% of lit pixels at the eyes. A tint still shows in the other 93–95%, and the light band counts clipped pixels at 255, so I see no way to hide a reveal through it.
   - **Over-claim:** "nothing glows brighter" is too strong (C7).
3. **Legibility.**
   - **Masks:** sound, each from its own `textof` layer minus the sky (`tests/illusion.test.mjs:257–262`), but unverified (C9).
   - **Thresholds:** `MIN_RATIO` 1.5 sits between the page (≥ 1.551) and its mutants (≤ 1.491). `MIN_LIFT` overlaps the β 0.2 range (C14). `HIDE_MARGIN` and `STREAK_K` have no mutant (C2, C3).
   - **Seeds:** seed 1 alone is acceptable for the five messages' legibility, since all 12 measured seeds pass. Seeds 1–3 means are kept where single-seed noise exceeds the margins.
   - **Headers:** see C14.
4. **Hiding.**
   - **Held, with proving mutants:** hello world at el±25 (flat text 0.694 and 0.382 against 0.15); hello world's az+25 text layer changing with the seed; the el±25 column streaks.
   - **Measured but unproven:** every message's neighbour eyes and midpoints, hello world's midpoints, and hello world's midpoint and back-view streaks.
   - **Unchecked:** the five messages at far, back and el±25 views; each eye k seeing message k+3, 34° from its antipode (C2); motion.
5. **Sequence.**
   - **Correct by code and by the frame logs:** the tour at load, Play, Find (including the wrap from "world"), capture's hidden controls and cursor, input ignored except Escape (`index.html:928`, `:945`, `:997`, `:1004–1007`), and reduced motion.
   - **Leaks:** the capture focus frame and the hash after Escape (C10). A hash change also ends capture (`:1047`).
   - **Timing:** hold, cut and start-hold minimums have 290–500 ms of slack and look robust. The fragile spots are the tour shot (C4), the capture-loop test's ordering (C5) and glide start frames (C6). The "seamless" loop is undefined (C11).
6. **Mutation proof:** see C8, C3 and C5.
7. **Older gates — weakened without a stated reason:**
   - the back-view bound was removed;
   - the hiding views az±25 and az+60 became the ±30° midpoints, plus the face's eye at seed 1 with a 0.3 margin;
   - the alike views at 25° and the back became far views at least 40° away, so nothing is measured between 12° and 40° from E;
   - the streak gate lost its proving mutant;
   - the el±25 streak bound was rebased (C3, C14).

   **Changed with a stated reason:** the light band's lower edge, the minimum gap size, and the tour-shot time, which follows the page's shorter 3 s hold. The readback-zero, layout, lean, zoom and time checks are unchanged in substance.
8. **Contract and constraints.**
   - `messages` is frozen, in sequence order, each `{ name, az, el }` (`index.html:587`); `target()` works as specified (`:592`).
   - All the query parameters are read (`:119–137`, `:553–560`); `textof` silently falls back (C9).
   - All six DOM ids are present (`:76–85`).
   - The page is self-contained: the only request is the font stylesheet (`:91–94`). The only hash read is `#capture` (`:545`, `:1047`).
   - 390 px: see C13. 48,000 particles (`:105`); the fill estimate is unverified (C15).

#### Read outside the diff

- `index.html:119–137`, `:139–164`, `:356–433`, `:562–604`, `:665–757`, `:759–812`, `:819–837`, `:920–1001`, `:1055–1074`
- `tests/controls.test.mjs:1–228`, `tests/motion.test.mjs:1–91`, `tests/run.mjs`, `tests/lib/phases.mjs` (all unchanged)
- `tests/lib/image.mjs:1–349`, `tests/lib/harness.mjs:1–81` and `:116–143`, `tests/page.test.mjs:53–204`, `tests/mutate.mjs:1–31` and `:188–394`, `tests/illusion.test.mjs:157–216`
- a7bdb72:AGENTS.md:182–196; a7bdb72:tests/illusion.test.mjs:85–115, :190–197, :388, :480; a7bdb72:tests/mutate.mjs:91–92; a7bdb72:index.html:93, :386, :407–416, :679–680
- `docs/work/1_sentence-sequence/plan.md:1–208`, `docs/learning/lessons.md:1–11`, `docs/learning/defect-register.md:1–126`
- The four logs, as cited above.

## Findings and disposition

Stable IDs continue the repo's series, which work unit 0 ended at F48. F61 comes from W18's gap check of the same target, not from Codex.

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F49 | X1 (critical): the Find test checks only the names the page reports and the final landing, so a Find that always glides to hello world while naming the right message passes. | Accepted. The gate must prove the camera reaches each eye it names. | R1a: check from the frame log that every Find glide ends exactly at the eye it names, and add a mutant that glides to hello world while naming the next message. |
| F50 | X2 (critical): no image check renders a frame in capture mode, in Play or at the tour's five later holds, so a reveal only there passes. | Accepted. Capture mode is what the owner records, so it needs the strongest tie. | R1a: at each hold in capture mode, and at least one later hold in Play and in the load tour, a frame with the particle clock frozen must equal the same eye set by URL (`msg=<name>`) in the central region, pixel for pixel. Add reveal mutants for capture and Play. |
| F51 | X3 (major): the alike check compares the whole text layer, so a reveal in one message is diluted, and `reveal-near-a` brightens all text. | Accepted. | R1b: compare each message's own particles (`textof`) drawn as text and as ambient at its eye, and add a mutant that brightens only "a"'s particles near "a"'s eye. |
| F52 | X4 (major): the clip-aware colour check drops clipped pixels with no limit on how many. | Accepted as a reasoned gap; Codex did not show an escape. | R1b: bound the dropped fraction (5–7% measured) and prove the bound with a mutant. |
| F53 | X5 (major): far views and antipodes are gated for hello world only, and no mutant proves `HIDE_MARGIN` (flat text peaks near 0.256). This is also W18's gap 1. | Accepted. The coordinator's screenshots show no message legible at far views. But near its antipode each message's own particles form a bright mirrored, radially smeared ghost, strongest for "world" at (158°, −18°) and hello world at (218°, −14°) (plan, visual acceptance). | R1b: a far-view hiding measure for every message, from its own text layer's mask at its antipode and at the far views, against the `beta=0` twin, as a mean over seeds 1–3. Place the thresholds between the page and mutants such as `depth-squeezed-messages`, and add a mutant that proves `HIDE_MARGIN`. |
| F54 | X6 (major): the el±25 streak bound moved from 1.95× the cloud's noise to 1.9× a floor that may itself reach 1.9, with no stated reason, and no mutant tests `STREAK_K`. | Accepted: a changed gate needs a stated reason. The two mutants it was built for still fail it (2.06–2.27 against 1.9). | R1b: state the reason with measurements or restore an absolute bound, and add a mutant that reaches `STREAK_K`. |
| F55 | X7 (major): in `#capture`, Tab still focuses the canvas and shows its focus outline. | Accepted: a stray Tab would show in a recording. | R1a: no focus outline in capture mode, checked through a real Tab key, with a mutant. |
| F56 | X8 (major): switching on reduced motion during Play or capture lets the current glide run on for up to about 4.4 s. | Accepted. | R1a: the sequence cuts as soon as reduced motion switches on, with a test that switches it mid-glide and a mutant. |
| F57 | X9 (major): the capture-loop test checks the whole running log, so a late start can make it flaky. | Accepted. | R1a: check only the frames from the loop's start on. |
| F58 | X10 (major): if one browser launch fails, `Promise.all` leaves the launched browsers open. | Accepted. | R1a: use the `allSettled` launch pattern of `tests/illusion.test.mjs:219–230`. |
| F59 | X11 (minor): `scripts/shoot.mjs` reports that `msg` "did not take" for capture views where the camera has moved on. | Accepted. | R1a: skip or adapt that check for capture views. |
| F60 | X12 (minor): changing the hash away from `#capture` also ends capture, so Escape is not the only exit. | Rejected as a defect. Leaving by editing the address is deliberate, and AGENTS.md and README.md scope "only Escape" to inputs. | None. |
| F61 | W18's gap check: no mutant turns red the Escape checks, Play's replay pattern or the reduced-motion cut pattern in `tests/sequence.test.mjs`. | Accepted. | R1a: W18's candidate mutants `escape-ignored`, `escape-keeps-playing`, `play-cuts` and `reduced-play-glides`. |
| F62 | Claude C1 (major), extends X2: a reveal after a Find glide lands on one of the five other eyes is never imaged. F50's repair covers capture's holds, and Play and the tour at the face's hold. | Accepted. | R1c: tie a Find landing at the other eyes, and a dwell there, to the same eye set by URL, pixel for pixel. |
| F63 | Claude C2 (major), extends X5: the neighbour and midpoint check lays the mask from the message's own eye over the away view, so a copy legible elsewhere sits at other pixels and goes unseen; `flat-text` never trips `HIDE_MARGIN`. Each eye sits about 34° above another message's antipode, where the tour and capture hold 3 s. | Accepted. It matches the coordinator's note of "world"'s smear under "What". | R1b, forwarded to W20: build the mask at each away view from the message's own text layer there, measure every message at the other five eyes too, and prove the bound with a mutant. |
| F64 | Claude C3 (major), extends X6: the ported `no-density-compensation` mutant divides 0.3 by six, so it tests "far fewer particles" and dies on legibility. With the back-view bound removed, `STREAK_K` lost the mutant that proved it. | Accepted. | R1b, forwarded to W20: rescale the mutant to test what it names, and either restore the back-view bound with its reason or prove `STREAK_K` with a new mutant. |
| F65 | Claude C4 (minor): the tour shot's slack shrank to 0.53–1.10 s, so a slow screenshot fails it, safely, but that blocks commits. | Accepted as a robustness risk. | R1c: make the shot cheaper, for example by clipping it to the compared region, without relaxing its 1.5 s dwell. |
| F66 | Claude C5 (minor), extends X9: `tour-restarts` dies at the loop check (`tests/sequence.test.mjs:258`) for the wrong reason. | Accepted. F57's repair in R1a changed that check. | R1c: confirm which check now kills `tour-restarts`, and make it the check the mutant names. |
| F67 | Claude C6 (minor): if a hold's last frame runs more than about 11 ms late, the glide's first frame reads as part of the hold while naming the next message. | Resolved in `2748bef`. W19 met the same flake, and `checkPasses` now allows at most 100 ms of such frames, naming exactly the next message. | Review round 1 checks it. |
| F68 | Claude C7 (minor): the scene-light band passes a 20% whole-scene glow at E (seed 1 goes from 0.935 to about 1.12, against 1.15). | Accepted. A whole-scene glow near an eye is the kind of cue the owner's rule forbids, and only this band can see it. | R1c: tighten the band, per seed or against each eye's own baseline, and prove it with a 20% glow mutant. |
| F69 | Claude C8 (minor): no mutant covers capture's hidden cursor, its ignored wheel and keys, the loop, or the page contract (`messages`, `msg`, `textof`, `capture`). F61 covers Escape, Play and the reduced-motion cut. | Accepted. | R1c: one mutant per uncovered check, or a stated reason where a check needs none. |
| F70 | Claude C9 (minor): nothing checks that `textof` took effect. If the page ignored it, it would draw all text into every per-message mask without a sign. | Accepted. | R1c: check each `textof` layer against `counts.byMessage` or its share of the light, with a `textof-ignored` mutant. |
| F71 | Claude C10 (minor): Escape leaves `#capture` in the address, so capture cannot start again without a reload. Its focus-outline half is F55. | Accepted. | R1c: Escape also clears the bare `#capture` anchor, guarded for hosts that block history changes, so adding it again restarts capture. |
| F72 | Claude C11 (minor): "seamless loop" is undefined. The camera repeats every 44.2 s, but the particles' slow bob does not (about 22.1 rad per pass). So one recorded pass jumps at its seam when looped as a video, and the first pass starts from the start view. | Accepted as a product question for the owner. The live page does loop the camera without a break. | Asked. If the owner wants a clip that loops, the drift can be made to repeat exactly once per pass. |
| F73 | Claude C12 (minor): text particles move only along their own eye's sight line, and ambient ones swell along a home eye's. So from an eye its message, and the particles homed to it, look still while the rest of the cloud drifts: a motion cue tied to the angle. | Kept unless the owner objects. Stillness from the eye follows from the same alignment that forms the words, and it shows only from that eye; light, colour, size and focus stay alike, as the owner's rule requires. | Raised with the owner. |
| F74 | Claude C13 (minor): the 390 px check covers only the shortest readout and the fallback font, and the widest readout may need about 357 of the 358 px available. | Accepted. | R1c: check the widest readout with the web font and with the fallback, and fix the layout if it does not fit. |
| F75 | Claude C14 (minor): stale or over-claiming comments, and `MIN_LIFT` (1.45) sits inside the β 0.2 mutant's range (1.33–1.45). The `:92`, `:50–54` and `:110` items are F53 and F54. | Accepted. | R1c: correct the comments (`tests/illusion.test.mjs:303–304` and `:106`, `scripts/shoot.mjs:163`, `docs/learning/defect-register.md:88–98`), and place `MIN_LIFT` between the page and the β 0.2 mutant. |
| F76 | Claude C15 (minor): nothing checks the performance criterion's stated budget. | Accepted. | R1c: gate the budget the plan states: the particle count, and the sprite-fill estimate if the page can compute it. |

The Claude lane's answers dispute X4's premise: the dropped 5–7% cannot hide a tint that shows in the rest. F52's bound stays as cheap insurance.

## Verification

- The review driver checked provenance: codex-cli 0.158.0, `gpt-6-astra` at xhigh in the read-only sandbox, no DLL markers, and four citations outside the diff's hunks that hold.
- The coordinator checked the target: the nine files committed in `8dc6893` equal the reviewed bytes once line endings are normalised.
- F53's visual observation comes from the coordinator's visual acceptance, recorded in the plan with sha256 digests.
- The review driver checked the Claude lane, run on 2026-10-22 after the owner logged in again:
  - claude 2.1.308, `modelUsage` exactly `claude-opus-5-5[1m]`, 35 turns, $7.98;
  - it ran in a clone detached at `8dc6893`, whose nine target files equal the committed blobs;
  - the transcript shows no read of the primary checkout, and the four citations outside the hunks that were checked hold.

## Round outcome

Changes requested by both lanes: Codex on 2026-10-21 and Claude on 2026-10-22, independently.

The repairs form repair round 1, the first of the fleet's five, in three milestones that run one after the other:
- R1a (W19): F49, F50, F55–F59 and F61, covering the sequence, capture mode and the page. Done in `2748bef`.
- R1b (W20): F51–F54, with F63 and F64 folded in, covering the illusion gates.
- R1c: F62, F65, F66, F68–F71 and F74–F76, and F72 if the owner wants it.

F67 was resolved in R1a, and F73 is kept unless the owner objects. Review round 1 covers the repairs' diff.
