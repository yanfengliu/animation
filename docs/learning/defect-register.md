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
  - anything calls `pause()` on a receiver that can be a page (its chain names "page", or the file binds it from `newPage`, `pages()` or `waitForEvent`);
  - a Playwright config picks a channel, or a shell command runs an opener where a command starts (a line start, a separator, or after `cmd /c`, `sh -c` or `-Command`, quoted or not);
  - a file without Playwright builds a `file:` URL, from `pathToFileURL`, a quoted `file:` string, or `import.meta.url` outside `fileURLToPath`;
  - a child process, in a file or in a command such as `node -e`, starts anything but Node, however `child_process` is imported (whole, by name, renamed or destructured), or the module is reached in a form the scan cannot read.
- Review round 1 (R1-6, F14) found that the first version missed openers named after `npx`, renamed imports, `new URL(…, import.meta.url)`, root configs and settings hooks, and flagged `process.stdin.pause()`, any `channel:` key and any `launch*` name. The scan now handles each of those.
- Review round 2 (R2-2 and R2-4, F20 and F22) found that it still missed `child_process` in commands, the script files that hooks run, and `npx playwright@<version> open`. It also flagged comments, quoted text in commands (`echo "open tasks: 3"`) and ordinary `socket.pause()` or `req.pause()` calls. The scan now handles each of those; the harmless forms it still flags are listed in its header.
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
- What the scan cannot see:
  - code assembled at run time (`eval`, strings or names built from pieces, computed keys such as `cp['exec']`, a launch method reached by destructuring);
  - a page under a name without "page" that the file does not bind itself, such as a parameter called `tab`;
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

**Fix (W8, committed together with the new gate):** both uniforms and the gold entry are gone, and every particle uses one colour, size and focus rule at every angle. β rose to 0.85 and the depth-of-field aperture fell to 0.14, so the words read at E by density alone (stroke/gap 1.58–1.68). The coordinator accepted the cost: from el±15–25° the text columns show as vertical streaks.

**How it is now checked:**

- `tests/illusion.test.mjs`, "every particle renders alike at every angle: no reveal near E", compares each text particle with itself drawn as an ambient particle. It uses the test-only `beta` parameter: `beta=0` makes every particle ambient without moving the base cloud.
  - At E, 3° from E, az+25, el−25 and the back, the text particles' light must be within 10% of the same particles drawn as ambient (0.99–1.01 measured), their warmth within 0.03 (0.007 at most), and their sprite size within 15% at `beta=0.02`, where the sprites are separate (0.96–1.02).
  - The whole scene's particle light at E and 3° must be within 15% of its mean at the far views (0.96 measured), so the cloud as a whole cannot glow up near E either.
- The legibility checks now also require relocation to lift the stroke/gap ratio at least 1.35× over the same view at `beta=0` (1.49–1.65 measured), so the words must come from positions.
- Mutants in `tests/mutate.mjs` put a reveal back, and each must be killed:
  - `reveal-brighter`: text 1.25× brighter at E, fading out by 12°.
  - `reveal-gold`: a 30% gold tint on text at E.
  - `reveal-bigger`: text sprites 1.25× wider at E.
  - `reveal-sharper`: text defocus blur cut by 75% at E.
  - `text-always-brighter`: text 1.4× brighter at every angle.
  - `scene-glows-at-angle`: every particle 1.4× brighter at E.
  - `weak-relocation`: β back at 0.2, now without the reveal, so the words must fail to read.
- The `text-always-lit` and `reveal-off` mutants tested the old design and are retired.
- What the checks cannot see: a reveal confined to angles between the measured views (for example only 8–20° from E), lighting outside the particles (the sky, the UI), and times other than t 0.
