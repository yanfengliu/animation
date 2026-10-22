# Defect register

Defects the owner reported, each with the symptom as they saw it, what the investigation found, the cause as far as it is known, and the check that now covers the defect's class. An entry stays after its gate lands: this is the standing list of what the gates could not see.

## Save prompts for files the agents produced (2026-10-11)

**Reported symptom:** while agents worked on this repo, a UI kept popping up asking the owner to save files the agents had downloaded. The owner's directive: do not pop UI asking them to save files; handle it automatically.

**Investigation:** worker W2 (work unit 0, `docs/work/0_hello-world-cloud/`) found that the desktop app's in-app browser pane had opened `file:///…/index.html` after each editor-tool edit of `index.html`. W2 never navigated the pane. Nothing in the `~/.claude` settings or hooks does this, and the app exposes no setting for it. The repo's own tooling (`scripts/shoot.mjs`) already ran Playwright headless and wrote its screenshots with Node `fs`, so it was not the source.

**Cause, as far as known:** the desktop app's browser pane navigated to a local HTML file, and that `file://` navigation surfaced a save prompt. Why the pane follows editor-tool edits of `.html` files is not explained.

**How it is now checked:**

- `tests/hygiene.test.mjs` (part of `npm test`) covers the class in this repo's own tooling. It statically scans the npm scripts, every `command` in the `.claude/settings*.json` files that `.gitignore` does not name, and the `.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`, `.sh`, `.ps1`, `.cmd` and `.bat` files under `scripts/`, under `tests/` and at the root (such as a `playwright.config.*`). A hook there is the one repo-side way to act "after each editor-tool edit".
  - It also reads any repo file of those types, or an extensionless script, that a command or a scanned shell file names by path, such as a hook's `bash "$CLAUDE_PROJECT_DIR"/.claude/hooks/after-edit.sh`. Files of other types are never read.
  - It blanks comments in files before matching; commands keep theirs.
- It fails if:
  - a Playwright launch is not literally `headless: true`, or spreads, builds or picks a channel for its options;
  - anything names a system browser, a desktop opener, an opener package or live-reload server (`open-cli`, `live-server`, `lite-server`, `browser-sync`, `npx open`, `http-server -o`), `connectOverCDP`, or a headed, debug, UI, inspector, code-generator, open or report mode, including `npx playwright@<version> open` and the `--debug`, `--ui` and `--open` flags anywhere in a command;
  - anything calls `pause()` on a receiver that can be a page (its chain names "page", or the file binds it, directly, by destructuring, as a `for…of` loop variable or through another such name, from `newPage`, `pages()` or `waitForEvent`);
  - a Playwright config picks a channel, or a shell command runs an opener where a command starts (a line start, a separator, cmd's `) else`, or after `cmd /c`, `sh -c`, `-Command`, or a `powershell` that itself starts a command and its switches, whose values may be quoted), also behind cmd's echo-off `@` or the keywords `then`, `do`, `else` and `exec`;
  - a file without Playwright builds a `file:` URL, from `pathToFileURL`, a quoted `file:` string, or `import.meta.url` outside `fileURLToPath`;
  - a child process, in a file or in a command such as `node -e`, starts anything but Node, however `child_process` is imported (whole, by name, renamed or destructured), or the module is reached in a form the scan cannot read.
- Review round 1 (R1-6, F14) found that the first version missed openers named after `npx`, renamed imports, `new URL(…, import.meta.url)`, root configs and settings hooks, and flagged `process.stdin.pause()`, any `channel:` key and any `launch*` name. The scan now handles each of those.
- Review round 2 (R2-2 and R2-4, F20 and F22) found that it still missed `child_process` in commands, the script files that hooks run, and `npx playwright@<version> open`. It also flagged comments, quoted text in commands (`echo "open tasks: 3"`) and ordinary `socket.pause()` or `req.pause()` calls. The scan now handles each of those; the harmless forms it still flags are listed in its header.
- Review round 3 (R3-6, F28) found that round 2's narrowing let two forms through: a quoted command handed to Windows PowerShell with no `-Command` before it (`powershell "start index.html"`, `powershell -NoProfile "ii index.html"`), and a pause on a popup page held under a name without "page" (`const popup = await popupPromise`, or `const [popup] = await Promise.all([page.waitForEvent('popup'), …])`). The scan now counts the word after `powershell` and its switches as a command start, and follows destructured names and names assigned from a name that can hold a page.
- Review round 4 (R4-2 and R4-4, F31 and F33) found that round 3's repair had three gaps.
  - Its page-binding pattern read each declaration to the next semicolon, so it swallowed a declaration nested after it. A page opened in an arrow helper's first statement (`const glide = async () => { const tab = await context.newPage(); await tab.pause(); };`), or in code without semicolons, passed. The helper written across lines and the code without semicolons had been flagged after round 2, so those were regressions; the helper written on one line never had been. The pattern now reads the right-hand side in a lookahead, so every declaration counts on its own.
  - `powershell -WindowStyle "Hidden" "ii index.html"` passed, because a switch's value could not be quoted. Now it can.
  - The word `powershell` anywhere in a command made the next word a command start, so `git commit -m "fix powershell start script"` and `echo "use powershell open dialogs"` were flagged. Now `powershell` counts only where a command starts.
- Review round 5 (R5-4 and minor 4, F39 and F43) found two more gaps.
  - Anchoring `powershell` lost forms that round 3's scan had flagged: `@powershell -NoProfile "ii index.html"` in a `.cmd` file, and `then`, `do` or `exec powershell …`. `@start index.html` and `then start index.html` had never been flagged. Now cmd's echo-off `@` and the keywords `then`, `do`, `else` and `exec` may come before the command word where a command starts, and cmd's `) else` starts a command too. A scratch tree of harmless forms (`@echo off`, `@node …`, `then echo "start"`, `do echo`, `exec node …`, `git commit -m "do start the server"`) passes; a separator inside quoted text before an opener word (`echo "a; open b"`, already flagged before this round, and `echo "(a) else open b"`) is flagged, a listed false positive.
  - `for (const tab of context.pages()) await tab.pause()` passed, because only a declaration with `=` bound a name. Now the variable of a `for…of` loop over `newPage`, `pages()` or `waitForEvent` is bound too, reading the iterable only up to its first `)`.
- Each of its four tests goes red with the defect reintroduced by `tests/mutate.mjs`, which counts a mutant only when an assertion fails and first checks that the real tree passes. The tree mutants:
  - `headless-false`: the screenshot tool launching a visible browser.
  - `launch-spread`: a launch that spreads options after `headless: true`.
  - `opener-npm-script`: an npm script that starts the page in the system browser.
  - `npx-opener-script`: an npm script that opens the page through `npx open-cli`.
  - `script-opens-file`: a script handing the page's `file:` URL to the desktop shell.
  - `renamed-exec-import`: `exec` imported under another name and run with a shell command.
  - `meta-url-handoff`: a script without Playwright building the page's URL from `import.meta.url`.
  - `page-pause`: a test helper that pauses a page.
  - `config-system-browser`: a root Playwright config that picks a system browser channel.
  - `settings-hook-opener`: a `.claude/settings.json` hook that opens the page after each edit.
  - `settings-hook-node-spawn`: a hook whose `node -e` spawns `cmd /c start` on the page.
  - `settings-hook-runs-script`: a hook that runs a repo shell script, named through `$CLAUDE_PROJECT_DIR`, which opens the page.
  - `npx-versioned-playwright-open`: an npm script that runs `npx playwright@1.63.0 open` on the page.
  - `powershell-quoted-opener`: an npm script that hands Windows PowerShell a quoted command opening the page, with no switch before it.
  - `powershell-switch-opener`: the same after `-NoProfile`.
  - `popup-pause`: a helper that pauses a popup it awaited from a stored `waitForEvent` promise.
  - `destructured-popup-pause`: a helper that pauses a popup it destructured from a `Promise.all` over `waitForEvent` and a click.
  - `arrow-helper-pause`: an arrow-function helper that opens a page under a name without "page" in its first statement and pauses it.
  - `semicolon-free-pause`: the same in a helper written without semicolons.
  - `powershell-quoted-switch-opener`: an npm script that hands Windows PowerShell a quoted command opening the page, after `-WindowStyle "Hidden"`.
  - `cmd-echo-off-powershell-opener`: a `.cmd` script with `@powershell -NoProfile "ii index.html"`.
  - `sh-then-opener`: a shell script with `if [ -f index.html ]; then start index.html; fi` on one line.
  - `for-of-pages-pause`: a helper that pauses every open page through `for (const tab of context.pages())`.
  - Each of these three passed the scan as it was before round 5.
- What the scan cannot see:
  - code assembled at run time (`eval`, strings or names built from pieces, computed keys such as `cp['exec']`, a launch method reached by destructuring);
  - a page under a name without "page" that the file does not bind itself, such as a parameter called `tab`, or reaches only through a member or a call;
  - Windows PowerShell started as another program's argument rather than where a command starts, such as `cross-env powershell "ii index.html"`, unless `-Command` comes before the command;
  - programs that open a browser by default but are not named in the scan;
  - files of other types, such as a `.py` script, and repo files outside the scanned folders that only code names, such as a path passed to a Node child process;
  - files outside its paths that no command names: `docs/`, `tmp/`, `node_modules` and its install scripts, git hooks, `~/.claude`, settings files `.gitignore` names, and agents' scratch scripts outside the repo.
- The working rule is staged as a canon candidate in `fleet/canon-candidates.md` at fleet `f44e26e`: write captures and downloads to known paths from code, never open a local file in a visible browser or the app's pane, and change `.html` files with a Node `fs` script, not the editor tools.
- The app-side trigger itself has no repo gate. No test in this repo can see what the desktop app's pane does when a file is edited, so that part rests on the working rule until the app's behaviour is explained or configurable.

## Text particles lit up near the secret angle (2026-10-11)

**Reported symptom:** in the owner's words: "Some of the dots are lighting up more as I approach the intended angle. This is cheating. They need to be glowing consistently no matter what angle. The words should be entirely depending on the right angle to be obvious."

**Investigation:** the particle shader took two uniforms set each frame from the camera's angle to E.

- `u_hint` rose from 0 at 22° to 1 at 12°. It tinted text particles toward a gold palette entry and doubled their light.
- `u_lock` rose from 0 at 6° to 1 at 0.8°. It made text particles 1.65× bigger, cut their defocus blur by 90%, strengthened their halo, and dimmed ambient particles by 35%.
- Both came with the page in `7d071e3`. `76bc0d6` widened them to make the approach findable by hand: the hint's ramp moved from 3–28° to 12–22°, and the gold tint and the doubled light moved from the lock to the hint, so they reached full strength 12° out.
- They made up for β 0.2. Without them that page measured a stroke/gap ratio of only 1.35–1.38 at E (W8).
- The gates then required the reveal: "at E a text particle carries at least 3× the light of an ambient one and is warmer". So the gate defended the defect.

**Root cause:** legibility was bought with angle-dependent rendering instead of geometry. The words read at E because the text particles lit up there, not only because they lined up.

**Fix (W8, committed together with the new gate):** both uniforms and the gold entry are gone, and every particle uses one colour, size and focus rule at every angle. β rose to 0.85 and the depth-of-field aperture fell to 0.14, so the words read at E by density alone (stroke/gap 1.58–1.68). The coordinator accepted the cost: from el±15–25° the text columns show as vertical streaks. W10 then slanted the letters 14°, which spreads those columns: at el±25 the column residual fell from 1.74 and 2.20 to 1.19 and 1.62 for the default seed, with the stroke/gap ratio at E unchanged (1.61 at 1280×800, 1.67 at 390×844).

**How it is now checked:**

- `tests/illusion.test.mjs`, "every particle renders alike at every angle", compares each text particle with itself drawn as an ambient particle. It uses the test-only `beta` parameter: `beta=0` makes every particle ambient without moving the base cloud. Work unit 1 (six messages) changed its views and bands; the numbers below are today's, for seeds 1–6.
  - At E, 3° (el+3), 12° (az−12) and three far views at least 40° from every eye, at t 0 and 7.3, and at the other five eyes at t 0, the text particles' light must be within 0.93–1.05 of the same particles drawn as ambient (0.955–1.015 measured; the lower edge allows for the 8-bit clipping of the densest strokes). Each of red, green and blue must keep its share of that light within 3% (0.998–1.001), over the pixels where no channel clips, and those may leave out at most 8% of the lit pixels (6.97% at most). Until review round 5 colour was read only as warmth, see below. At t 0 their sprite size must be within 15% at `beta=0.02`, where the sprites are separate (0.943–1.044).
  - At each eye, that message's own particles must carry the light of the same particles drawn as ambient within 0.95–1.12, at `beta=0.2` (1.009–1.057), so a reveal in one message's particles is not diluted by the other five (review round 0, F51).
  - The whole scene's particle light at E, 3°, 12° and every other eye must be within 15% of its mean at the far views (0.927–1.103 measured for seeds 1–3), so the cloud as a whole cannot glow up near an eye either.
- Review round 3 (R3-1, F23) found that those comparisons read only the test-only draws (`layer=text`, `layer=ambient`, `beta=0`), so a reveal in the shipped draw alone passed them. W11 tied the shipped render's particle light to the text layer's plus the ambient layer's within 1%, and E reached by the glide or held by the tour to E set by URL within 1%, each as one luminance sum.
- Review round 4 (R4-1, F30) found that a sum of light lets a colour reveal through. A 30% gold tint near E in the shipped draw only measured 0.9955–0.9968 against the 1% band. Rounds 1–4 had each found one more property (light, colour, camera mode, dwell) that a reveal could vary past checks that measure one property at a time. So the ties are now exact. They close the class for the shipped draw and the camera modes, at the measured views and times: an effect that only the shipped draw has, or that a camera mode or a dwell at E adds, breaks them. They do not close it for a reveal in every draw, since the layers then carry it too; that case rests on the text-versus-ambient comparison above, which still checks one property at a time (light, colour, size):
  - At each of those views and times, the shipped render minus the sky must equal the text layer minus the sky plus the ambient layer minus the sky, pixel by pixel and channel by channel, capped at 255 as the 8-bit target caps it. The residual may be at most 0.1% of their light per channel; it measures exactly 0 for seeds 1–6. Any effect the shipped draw alone has, in light, colour, size or focus, breaks it: the gold tint gave 2.5–3.6% at E and 3°.
  - "E reached by "Find the angle", then idle there, or held by the tour renders as E set by URL, pixel for pixel" requires each shot to match E set by URL in the central region, pixel by pixel and per channel, within the same 0.1% (exactly 0 measured).
  - `tests/sequence.test.mjs` ties the other camera modes the same way, to each eye set by URL (`msg=<name>`): capture mode at each of its six holds, Play and the tour at load at the face's hold, and "Find the angle" landing at each of the five later eyes, shot on landing and again 8 s later (review round 0, F50 and F62).
- Review round 4 (R4-3, F32) found that every picture of E was taken within about a second of arriving there, so a reveal that waits at E passed. The glide is now shot again after 8 s idle at E and must match both its arrival shot and E set by URL. The tour was shot 6 s after the page's first frame.
- Review round 5 (R5-1, F36) found that the comparison read colour only as warmth, (red − blue)/(red + blue). A green tint near E in every draw (red and blue × 0.739, green × 1.10) kept the light ratio at 0.996 and the warmth gap at −0.006, and the layers and E set by URL carried it too, so it passed every image check while "hello world" read green at E. The comparison now checks red, green and blue separately, each within 3%: 0.993–1.006, 0.993–1.006 and 0.988–1.010 measured over seeds 1–3 at every alike view and time (0.989–1.010 over seeds 4–9). The tint gives 0.731/1.096/0.740 at E and 0.797/1.069/0.803 at 3°. This closes colour in that comparison at the measured views and times; light, colour and size are still each checked on their own band, so a reveal in every draw that stays inside all three (for example a tint under 3% per channel) passes.
- Review round 5 (R5-2 and R5-3, F37, F38 and F40) found that the tour shot covered only the first 2.8 s of a visitor's hold, because the test's tour started at E, and that it had 0.84 s to spare while four queued renders ran beside it. Since then the tour starts from the shipped start view, and the test runs last, after the render queue has drained. With work unit 1's 3 s holds the tour holds at E from about 5.11 s to 8.11 s after its first frame. It is shot 6.6 s or more after it, at least 1.5 s after the camera reached E as the page's frames report it, and with the tour at E before and after; a miss is shot once more on a fresh page.
- The legibility checks also require relocation to lift the stroke/gap ratio at least 1.45× over the same view at `beta=0` (1.53–2.05 measured for the six messages), so the words must come from positions.
- Mutants in `tests/mutate.mjs` put a reveal back, and each must be killed:
  - `reveal-brighter`: text 1.25× brighter at E, fading out by 12°.
  - `reveal-gold`: a 30% gold tint on text at E.
  - `reveal-bigger`: text sprites 1.25× wider at E.
  - `reveal-sharper`: text defocus blur cut by 75% at E.
  - `text-always-brighter`: text 1.4× brighter at every angle.
  - `scene-glows-at-angle`: every particle 1.4× brighter at E.
  - `reveal-extra-text-pass`: the shipped draw alone adds a second pass of the text particles near E, at 25% of their light at E. It gives 4.1–5.8% at E and 3° against the 0.1% bound.
  - `reveal-gold-shipped`: the 30% gold tint near E in the shipped draw only.
  - `reveal-on-tour`: text 1.25× brighter near E only while the tour runs.
  - `reveal-after-glide`: text 1.25× brighter near E once "Find the angle" has glided there.
  - `reveal-gold-after-glide`: the 30% gold tint near E once "Find the angle" has glided there.
  - `reveal-after-dwell`: text 1.25× brighter once the camera has stayed idle within 1° of E for 5 s.
  - `reveal-late-in-tour-hold`: text 1.25× brighter once the tour's hold at E has run 1.2 s of its 3 s.
  - `reveal-green`: a green tint on text near E in every draw, red and blue × 0.739 and green × 1.10 at E, which keeps their light and warmth.
  - `weak-relocation`: β back at 0.2, now without the reveal, so the words must fail to read.
  - Work unit 1 and its repairs: `reveal-near-a` (text 1.25× brighter near the eye of "a"), `reveal-only-a` (only the particles of "a"), `reveal-blue-clipped` (a blue tint that saturates the densest strokes), `reveal-in-capture`, `reveal-in-play` and `reveal-in-tour-later` (text 1.25× brighter in one of the sequence's holds), `reveal-after-find-at-world` (once "Find the angle" has landed at the eye of "world") and `reveal-after-dwell-later` (after 5 s at rest at a later eye).
- The `text-always-lit` and `reveal-off` mutants tested the old design and are retired.
- What the checks cannot see:
  - a reveal confined to angles between the measured views, for example only 5–10° from an eye;
  - a reveal shown only while the camera moves (mid-glide, mid-snap, mid-tour or coasting), since every view is shot with the camera at rest or in a hold;
  - a reveal shown only once an eye is reached another way, by a snap or the arrow keys, or at the sequence's holds that no test shoots (Play's and the load tour's holds other than the face's, and capture mode's later passes);
  - a reveal that waits longer than the dwells measured: 8 s idle after a "Find the angle" landing at each eye, and about 1.5 s into each 3 s hold that is shot, so a reveal later in a hold passes;
  - a reveal driven by the particle clock: every shot freezes it with `t`, which the shipped page never sets, so a reveal that ramps up as the clock runs never shows;
  - a reveal shown only on a URL without `t`, as a visitor's is: every image gate sets `t`, and every one but the tour shots and capture mode's pictures sets the view too (`az` and `el`, or `msg`);
  - a reveal in every draw that stays inside each band on its own: light within 0.93–1.05, each colour channel's share within 3%, sprite size within 15%;
  - lighting outside the particles (the sky, the UI), and times other than t 0 and 7.3;
  - other renderers: the exact identities rest on SwiftShader's 8-bit additive blending without dithering, and WebGL dithers by default.
