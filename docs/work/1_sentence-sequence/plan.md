# Hidden sentence sequence for capture

Status: active
Owner: Claude coordinator session
Created: 2026-10-15
Updated: 2026-10-21

## Problem and outcome

The owner asked (2026-10-15): "From another angle, then make it say <smiling face>, then "What" -> "a" -> "beautiful" -> "world", in sequence, so that I can capture an animation later."

Outcome: the same cloud hides six messages, each readable from its own viewpoint, in this order:
- "hello world" (unchanged, at az 38°, el 14°)
- a smiling face
- "What"
- "a"
- "beautiful"
- "world"

A camera sequence glides through them in order and holds at each one while it forms. A capture mode shows the sequence on a clean, looping screen the owner can record.

## Scope

Included:
- a page engine that hides several messages, each with its own viewpoint, mask and scale;
- new glyphs `W`, `a`, `t`, `b`, `u`, `i` and `f`, and a monoline smiling face;
- the viewpoints placed in a ring around the cloud;
- the sequence tour, a Play button and a `#capture` mode;
- gates extended to every message;
- the mutation proof, review and republishing the artifact.

Excluded:
- moving the hello world viewpoint;
- any angle-dependent lighting (the owner's rule from work unit 0 still holds);
- rendering a video file;
- other browsers or real-GPU testing beyond what headless Chromium can show.

Dependencies: the gate worker builds on the page contract below. The repo rules hold: work on `main`, one implementation worker at a time, `.html` edited only through Node `fs` scripts, no visible browsers.

## Approach

**Several messages from one cloud.** Each message m has an eye E_m on the orbit sphere, a stroke mask S_m, a blurred mask B_m and its own scale. For each cloud particle, compute its relocation chance for every message, β·B_m(u_m)/max(B_m), where u_m is its projection on m's text plane. Assign each particle to at most one message by one draw over the cumulative chances, normalizing where they sum past 1. Land it on m's strokes as now, keeping its distance from E_m.

Relocation moves a particle sideways by about σ only, so from any other eye it still looks like ambient at scales above σ. The messages therefore compete mainly where their stroke regions overlap in the cloud. That competition, not interference, is what may cost legibility. The page worker measures it and chooses the particle count, β, σ, stroke width and per-message scale on evidence.

**Viewpoints.** A ring around the cloud, in sequence order, about 60° apart in azimuth at gentle elevations, so the tour is one continuous orbit. "hello world" stays at az 38°, el 14°.

**Sizes.** Each message fits a box inside the cloud's silhouette. Long words such as "beautiful" get smaller letters, capped so short ones such as "a" do not grow huge. The words keep the 14° slant; the face stays upright.

**Sequence and capture.**
- The tour at load becomes the full sequence: an eased glide to each viewpoint, then a hold exactly at it.
- Play replays it. Input stops it, as today. Reduced motion: no autoplay, and Play cuts between the holds instead of gliding.
- `#capture` (a bare anchor, which the artifact host passes through) hides every piece of UI chrome and the cursor, then loops the sequence. Only Escape interrupts it, and it restores the UI.

**Page contract changes** (the page and the gates change together):
- `window.__cloud.messages`: read-only, in sequence order, each `{ name, az, el }`. `magic` stays hello world's viewpoint.
- A read-only way to tell which message the camera is holding, or is heading to.
- A query parameter that puts the camera at a named message's viewpoint, and one that draws only one message's text particles (with `layer=text`).
- `beta` still scales relocation for all messages, and `beta=0` relocates nothing.
- `#find` stays and glides to the next message in sequence. A new `#play` button plays the sequence.

**Milestones.** Each one lands only when green:
- **M1 page (W16):** the page and its visual tuning. W16 leaves the work uncommitted.
- **M2 gates (W17):** gates for every message, the sequence and capture, re-derived thresholds and the mutation proof. W17 commits the page and gates together.
- **Then:** independent review, repairs (the fleet cap of five rounds applies), the coordinator's visual acceptance, and republishing.

## Acceptance criteria

- [ ] From each of the six viewpoints its message is clearly legible at 1280×800 and 390×844, from particle positions alone. Checked by the coordinator at native resolution, and by per-message contrast gates.
- [ ] Every particle renders alike at every angle, the six viewpoints included (owner directive, 2026-10-11). Checked by the existing alike gates extended to every viewpoint.
- [ ] Away from the viewpoints (midway between neighbours, and at far angles) no message is legible. Honest smears near each viewpoint are expected. Checked by screenshots and by gates.
- [ ] The tour at load visits hello world, the face, "What", "a", "beautiful" and "world" in that order, holding exactly at each viewpoint. Play replays it, input stops it, and reduced motion is respected. Checked through real input.
- [ ] `#capture` shows no UI chrome and loops the sequence seamlessly; only Escape interrupts it. Checked by gates and by looking.
- [ ] The page stays smooth on an ordinary laptop. The particle count and sprite fill are kept within a stated budget, because headless runs cannot measure real-GPU frame rate.
- [ ] `npm test` is green and the full mutation proof kills every mutant, including new ones for the per-message gates, the sequence and capture.
- [ ] An independent review ran and its material findings are resolved. The work is on `main` and pushed, and the artifact is republished.

## Implementation steps

- [x] Coordinator: allocate this folder and write the plan and contract.
- [x] M1 W16: the page, left uncommitted for W17 to commit with the gates. A session end interrupted it; it resumed by agent ID with no work lost.
  - **Cloud:** 48,000 particles; 30,256 of them are text. β stays 0.85, ink is 0.2 world units, σ is about 1.58.
  - **Each particle** gets at most one message, by one draw over its normalized chances. An ambient particle's swell uses a "home" eye drawn by share from its own stream, so `beta=0` twins differ only in relocated particles.
  - **Eyes and text particles:**

    | Message | Eye (az, el) | Text particles |
    |---|---|---|
    | hello world | 38, 14 | 9,115 |
    | face | 98, 18 (weight 0.6) | 4,657 |
    | What | 158, 16 | 4,659 |
    | a | 218, 20 | 2,843 |
    | beautiful | 278, 16 | 4,278 |
    | world | 338, 18 | 4,704 |

    The start view is (8, −16). Every eye sits at +14° or higher, because an eye within about 20° of another's antipode sees that message mirrored and radially smeared (the face's smile showed under "beautiful" when the face was at −30°).
  - **Legibility**, as the stroke/gap ratio from each message's own text layer minus the sky, at 1280 / 390:

    | Message | Ratio |
    |---|---|
    | hello world | 2.00 / 1.89 |
    | face | 1.76 / 1.72 |
    | What | 1.83 / 1.77 |
    | a | 1.71 / 1.73 |
    | beautiful | 1.84 / 1.82 |
    | world | 1.77 / 1.73 |

    Particle-only contrast is lower than the lone hello world's old 4.7 (2.4–3.1), because each message gets only 51–64% of what it would claim alone.
  - **Sequence:** glides of 1.5 s + 50 ms/° (smootherstep) and holds of 3 s. The load tour lasts about 45 s and ends idle at "world"; the capture loop is about 44.2 s.
  - **Budget:** fill rate about 2.6× the old page (24.4 M sprite fragments per frame at 1920×1080 and DPR 2, overdraw about 3×). It is not measured on a real GPU.
  - **`npm test`:** 28 of 36 pass. All 8 failures are in the illusion file and come from the single-message assumptions; W16 diagnosed each one for W17. The colour check's 0.926 blue is 8-bit clipping in dense strokes: over unclipped pixels the channels agree within 0.1%.
  - **Coordinator looked at native resolution:** the face (eyes too faint), "What" (clear) and "beautiful" at 390 (small but legible).
  - Follow-up done:
    - The face's eyes grew from 0.55 to 0.9 face units (`index.html:191`, sha256 `2b96e35b…`).
    - Small eye loops read better on their own but cost "beautiful" 0.085, because they survive the radial smear seen from near the face's antipode.
    - The other five ratios moved by at most about 0.03 (three-seed means).
    - Coordinator looked at native resolution: the face reads as a face, with clear eyes.
- [x] M2 W17 and W18: gates for every message, the sequence and capture, committed as `8dc6893` on 2026-10-21 with the page and docs.
  - W17 wrote the gates; W18 checked them against the brief, completed AGENTS.md and README.md, and changed no code.
  - `npm test`: 42 of 42 in four runs on these bytes (210.4, 179.5, 165.8 and 162.0 s).
  - Full mutation proof (2026-10-15): control green, 81 mutants (58 page, 23 tree), all killed.
- [x] Review round 0 of the uncommitted page and gates, which `8dc6893` commits unchanged. Dispositions are in [reviews/0_implementation.md](reviews/0_implementation.md).
  - Codex, 2026-10-21: 2 critical, 8 major and 2 minor; dispositions F49–F61, with F60 rejected.
  - Claude, 2026-10-22, after the owner logged in again: 0 critical, 3 major and 12 minor; dispositions F62–F76. F67 was already resolved in R1a; F72 and F73 went to the owner.
- [x] Coordinator's visual acceptance of `8dc6893`'s page, 2026-10-21.
  - Method: each PNG was opened at native resolution. Shots came from `scripts/shoot.mjs` (t 0, seed 1) and, for capture mode, the headless probe `tmp/accept/capture.mjs` (live clock). Rendering is deterministic: W18's own shots of the same views have the same sha256.
  - Criterion 1, met by looking: every message is clearly legible at its eye at 1280×800 and 390×844, and fits the frame at 390. sha256 prefixes:
    - 1280×800: hello world `130b9096`, face `278a00ca`, "What" `8bc18bac`, "a" `6f6423db`, "beautiful" `cebfe767`, "world" `ce6bed66`;
    - 390×844: `c7f400ef`, `18327fcb`, `5ded6d64`, `c8a271f2`, `6678b877`, `48bee552`, in the same order.
  - Criterion 3, met by looking: no message is legible away from its eye.
    - Midpoints, from hello world–face on: `4491bc3c`, `41974605`, `6c4cda99`, `7b49ac68`, `4b23be82`, `c81f67e4`.
    - Back views (each eye's antipode), hello world first: `41c4ac24`, `35573cfa`, `898efc51`, `1ca572cc`, `9997b7be`, `06f61238`.
    - Above `fb5a19fe`, below `c6bab818`, start `4e2c92df`.
    - Seeded random views (`tmp/accept/random-views.txt`): `55e67112`, `afe479db`, `e67ef44c`, `ba41aa50`, `6b6950f0`, `c1610e24`. Top `edfbc922`, bottom `8fd07281`.
  - Ghosts, not legible: near its antipode, each message's own particles form a bright mirrored, radially smeared shape.
    - Strongest: "world", a bowtie at (158°, −18°), and hello world, a four-wing star at (218°, −14°).
    - Single-message text layers confirm the source: `141071c8` and `dc5c8369`; the neighbours' column streaks are `ccb9658d` and `9f47f19e`.
    - At their own eyes, "What" and "world" each show a faint smear of the other below the word.
    - None of these is on the capture path, which stays at +14° to +20° elevation. F53 gates them.
  - Criterion 5, by looking: in `#capture` the controls, readout, hint and cursor are hidden (computed styles).
    - Every hold reads under the live clock: hello world `10acbdb6`, face `9ea94ab7`, "What" `5b59fb74`, "a" `103f1451`, "beautiful" `a6bb55ea`, "world" `fb1746d7`.
    - The wrap glide shows a plain cloud (`7107e6a1`), and the loop is back at hello world after 44.2 s (`32857511`).
- [ ] Repair round 1, one worker at a time. Each milestone ends with three green runs, its new and touched mutants killed by name, and its own commit.
  - [x] R1a, W19: F49, F50, F55–F59 and F61 (sequence, capture mode, page), committed as `2748bef` on 2026-10-22, on top of the owner's canon sync `850af3b`.
    - `npm test`: 45 of 45 in three runs (153.6–158.9 s).
    - 14 named mutants, 10 of them new: all killed by checks after a green control (2,532 s).
    - Rendering unchanged: 27 of 27 acceptance digests are identical.
    - Beyond the brief: the sequence file runs in its own phase, after a font-hang flake beside it. A hold's last 100 ms may name the next message, and must name exactly that one.
  - [x] R1b, W20: F51–F54, with F63 and F64 folded in (illusion gates), committed as `b089b37` on 2026-10-22.
    - `npm test`: 45 of 45 in three runs (187.1–189.5 s). The illusion file grew by about 30 s.
    - 13 named mutants, 6 of them new: all killed by checks after a green control (2,662 s).
    - Rendering unchanged: 27 of 27 acceptance digests are identical. The page gained a test-only `relocate=<name>` hook.
    - The far-view hiding gate (`MAX_GHOST_LIFT` 1.33) holds the antipode ghosts near today's level: the page reaches 1.297 at most, and a mutant that halves "world"'s depth reaches 1.376.
  - [x] R1c, W21: F62, F66, F69, F71, F74 and F76, plus the `scripts/shoot.mjs` and defect-register parts of F75 (sequence, page, capture mode), committed as `0a1329b` on 2026-10-22.
    - `npm test`: 47 of 47 in three runs (201.2–202.9 s).
    - 25 named mutants, 17 of them new: all killed by checks after a green control (5,565 s).
    - Rendering unchanged: 27 of 27 acceptance digests are identical.
    - Page changes:
      - Escape removes the bare `#capture` anchor, guarded for hosts that block history changes;
      - the readout gives way to the buttons on narrow screens.
    - Budget gate: at most 48,000 particles a frame, and sprites covering at most 3× the screen at 1920×1080, DPR 2 (2.72–2.95× measured at the start view and the six eyes).
    - Open risk: fully zoomed in, sprites cover about 13.6× the screen, and no gate bounds that. Capture mode never zooms past the default.
  - [ ] R1d: F65, F68, F70 and the `tests/illusion.test.mjs` parts of F75 (illusion gates). F72 joins it, or a later milestone, if the owner wants a loopable clip.
- Owner questions, 2026-10-22:
  - F72: should one recorded pass loop as a video without a jump? That needs the particles' drift to repeat once per pass.
  - F73: is the stillness of each message, seen from its own eye, an acceptable cue?
- Leftover worktrees: `.claude/worktrees/nifty-bardeen-a20921` is the folder of a running fleet session ("Make fleet's drift gate work from linked worktrees"), and `.claude/worktrees/suspicious-wescoff-85e29d` is the folder of the archived fleet session that started it. Neither holds work-unit-1 work, so this unit leaves them to those sessions.
- [ ] Review round 1 of the repairs; Claude lane only if the owner logs in again.
- [ ] Full mutation proof on the final revision, the only browser workload while it runs.
- [ ] Republish the artifact, then the devlog, Outcome and cleanup.

## Outcome

Pending.

## Handoff, 2026-10-21: coordinator rollover

Why: the owner's directive of 2026-10-18 (fleet R6). An orchestration thread past ten turns stops assigning work and hands off to a successor session with an R8 note. The first coordinator session passed ten turns long ago. The successor confirms below that it received this note and reconciled the goal and todos; only then is the old session archived.

**Goal and acceptance:** unchanged. See "Problem and outcome" and "Acceptance criteria" above. None of the criteria is met yet, because nothing of work unit 1 is committed.

**Repository state:**
- `main` and `origin/main` are at `483ef1c`. This includes three fleet canon-sync commits (`2a233b5`, `25bdbc3`, `483ef1c`) that changed only the AGENTS.md canon block.
- Uncommitted in the primary checkout. Do not discard any of it.

  | File | sha256 prefix | Owner and status |
  |---|---|---|
  | `index.html` | `2b96e35b` | W16's page, accepted by the coordinator |
  | `scripts/shoot.mjs` | `812d58c4` | W16's page, accepted |
  | `tests/illusion.test.mjs` | `4871bfce` | W17, partial |
  | `tests/lib/harness.mjs` | `bf4471a5` | W17, partial |
  | `tests/lib/image.mjs` | `bc3854c2` | W17, partial |
  | `tests/mutate.mjs` | `4d4bf750` | W17, partial |
  | `tests/page.test.mjs` | `bba71584` | W17, partial |
  | `tests/lib/messages.mjs` (new) | `354caec2` | W17, partial |
  | `tests/sequence.test.mjs` (new, 272 lines) | `e106111f` | W17, partial |
  | `AGENTS.md` | `bdd844f4` | W17's edits outside the block; the block is byte-identical to `483ef1c` |
  | `README.md` | `42594498` | W17, partial |

- Every test file parses with `node --check`. W17 stopped on 2026-10-15 at a weekly API limit, in the middle of restructuring `tests/illusion.test.mjs`. Whether `npm test` passes on this tree is unknown. The last known run, before W17's edits, was 28 of 36 (`tmp/w16/npm-test-2.log`). No mutation-proof log exists.
- Ignored evidence:
  - `tmp/w16/final2/`: the accepted page's face shots.
  - `tmp/w16/final/`: shots of the previous revision.
  - `tmp/w17/`: W17's probes and timing scripts.

**Todos for the successor coordinator** (dependencies in order):
1. Assign a gate worker to finish milestone 2 from W17's partial work, under W17's brief. The brief is the M2 step above together with the milestone-1 notes.
   - It should first run `npm test` on this tree and compare W17's edits against the brief.
   - Then:
     - single-message masks (`textof=<name>&layer=text` minus the sky) with a clip-aware colour check;
     - per-message legibility, alike and hiding gates;
     - sequence and capture through real input;
     - the tour shot inside hello world's 5.11–8.11 s hold;
     - new mutants and moved anchors;
     - docs and the README.
   - Then three green `npm test` runs, a clean full mutation proof (a long run; the only browser workload), and one commit of page and gates together.
2. An independent review on the fleet runbook's pins, read-only. Repairs are capped at five rounds.
3. The coordinator's own visual acceptance at native resolution, with sha256 digests recorded: all six eyes at 1280×800 and 390×844, the midpoints, far and random views, and the `#capture` loop.
4. Republish the artifact https://claude.ai/artifact/DXryp6rehkTohF7Eumat5f (now version 3, the slanted hello world). Read it first, then publish the stripped page; AGENTS.md "Conventions" says how to strip it.
5. Write the devlog line, the plan's Outcome, push, and clean `tmp/w16` and `tmp/w17`. An earlier deletion of `tmp/` was denied by the permission system, so ask the owner before deleting.

**Decisions so far:** in "Implementation steps" above. They cover the eyes, the counts, the face's weight of 0.6, the face's eyes of 0.9 units, 48k particles, β 0.85, the timings and the capture behaviour.

**Risks:**
- `npm test` took 149 s before W17's new gates, and the full proof may take hours.
- Weekly API limits stopped workers four times; each wrote or should write `tmp/<worker>-status.md`.
- Fill rate is about 2.6× the old page, not measured on a real GPU.

**Rules that still hold:**
- work on `main`, one implementation worker at a time (`docs/policies/local-rules.md`);
- edit `.html` only through Node `fs`;
- no visible browsers and no save prompts;
- every particle renders alike at every angle.

**Successor receipt:** 2026-10-21. The successor coordinator received this note and reconciled it against the tree. It works on `main` in the primary checkout.

- Goal and acceptance criteria: unchanged.
- Verified: `main` and `origin/main` are at `e67597f`, this note's commit. All eleven uncommitted files match the sha256 prefixes in the table above.
- Correction: W17 got further than this note says. Its logs in `tmp/w17/` show the gates finished and green on this exact tree:
  - `npmtest-1.log` and `npmtest-2.log` (2026-10-15, 00:25 and 00:28): 42 of 42 passed, in 210 s and 180 s.
  - The second run started at 00:25:43, just after the last test-file write (`tests/lib/harness.mjs`, 00:25:43). Every other code and test file is older.
  - `mutate-full.log` (00:29 to 03:25): control green (42 tests), then 81 mutants: 81 killed, 0 survived, 0 errored, 0 flagged, in 10,572 s.
  - Only `AGENTS.md` changed after those runs (2026-10-21, docs only).
- Not done: W17 stopped before it filled in and ran `tmp/w17/agents-update.mjs`, its prepared rewrite of the AGENTS.md "Gates" and "What the suite proves" sections. Those sections still describe the 36-test, 74-mutant suite for hello world alone. No `tmp/w17-status.md` exists.
- Defect (R7): two merged worktrees from work unit 0 remain at `d9cfa44`, both clean. They are `.claude/worktrees/nifty-bardeen-a20921` (branch `claude/nifty-bardeen-a20921`) and `.claude/worktrees/suspicious-wescoff-85e29d` (detached; branch `claude/suspicious-wescoff-85e29d` also exists).

Reconciled todos, in dependency order:
1. M2 close-out by one gate worker, W18, in this checkout:
   - run `npm test` fresh to confirm W17's logs;
   - check W17's gates against the items in todo 1 above and fix any real gap;
   - fill in and apply the AGENTS.md Gates sections from measured values, and check the README;
   - three green runs on the final tree: W17's two count while code and tests stay byte-identical, so at least one fresh run, or three if any code or test file changes;
   - W17's full proof stands for unchanged code; a changed gate or page reruns the mutants it touches by name after a green control;
   - then one commit of page, gates and docs, pushed.
2. Independent read-only review of that commit on the fleet runbook's pins. Repairs are capped at five rounds, and each reruns the affected checks.
3. Coordinator's visual acceptance at native resolution, with sha256 digests: the six eyes at 1280×800 and 390×844, the midpoints, far and random views, and the `#capture` loop.
4. Republish the artifact (read it first, then publish the stripped page).
5. The devlog line, this plan's Outcome and checkboxes, and a push.
6. Clean up: remove the two merged worktrees and their branches once no session uses them. Ask the owner before deleting `tmp/w16`, `tmp/w17`, `tmp/w16-status.md` and `tmp/mutants`.
