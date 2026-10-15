# Hidden sentence sequence for capture

Status: active
Owner: Claude coordinator session
Created: 2026-10-15
Updated: 2026-10-15

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
  - Follow-up, in progress: W16 makes the face's eyes clearly visible.
- [ ] M2 W17: the gates and the commit.
- [ ] Review, repairs, visual acceptance, republish, devlog.

## Outcome

Pending.
