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
- No target file changed during the review. All nine hashed the same at 23:22, before launch, and at 23:43, after the last lane ended.
- Out of scope: `AGENTS.md` and `README.md`, whose Gates sections W18 was rewriting; `8dc6893` commits them too. The reviewers read the rules from `a7bdb72:AGENTS.md`, section "Invariants & boundaries", which the working tree had not changed.

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

Claude abstained, because the CLI's login has expired.
- claude 2.1.281 (the runbook requires 2.1.280 or later): `claude -p --model "claude-opus-5-5[1m]" --effort max` with read-only tools (`Read`, `Glob`, `Grep`, `Task`, and `git diff`, `git log` and `git show`), and with edits, writes, `npm`, `npx` and `node tests/…` or `node scripts/…` denied.
- The init event named the pin. The result was then "Failed to authenticate: OAuth session expired and could not be refreshed": 0 turns, cost $0, no request sent and an empty `modelUsage`.
- A one-word login check with every inherited Claude session variable removed failed the same way.
- The runbook names expired OAuth as a reason a lane is down, and the coordinator confirmed no retry this round. The owner has to log in again (`claude`, then `/login`) before a later round can use this lane.
- This is an abstention, not approval. Independent coverage this round is one lane.

Prompts: `tmp/review-runs/wu1-round0/prompt-codex.md` and `prompt-claude.md` (ignored), built from one shared text. They ask for an adversarial, report-only review against the plan's acceptance criteria and AGENTS.md's invariants, through eight questions:
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

### Codex (`gpt-6-astra`, effort xhigh)

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

## Verification

- The review driver checked provenance: codex-cli 0.158.0, `gpt-6-astra` at xhigh in the read-only sandbox, no DLL markers, and four citations outside the diff's hunks that hold.
- The coordinator checked the target: the nine files committed in `8dc6893` equal the reviewed bytes once line endings are normalised.
- F53's visual observation comes from the coordinator's visual acceptance, recorded in the plan with sha256 digests.

## Round outcome

Changes requested. The Claude lane abstained (expired login), so this round had one lane.

The repairs form repair round 1, the first of the fleet's five, in two milestones that run one after the other:
- R1a (W19): F49, F50, F55–F59 and F61, covering the sequence, capture mode and the page.
- R1b (W20): F51–F54, covering the illusion gates.

Review round 1 covers their diff.
