# Defect register

Defects the owner reported, each with the symptom as they saw it, what the investigation found, the cause as far as it is known, and the check that now covers the defect's class. An entry stays after its gate lands: this is the standing list of what the gates could not see.

## Save prompts for files the agents produced (2026-10-11)

**Reported symptom:** while agents worked on this repo, a UI kept popping up asking the owner to save files the agents had downloaded. The owner's directive: do not pop UI asking them to save files; handle it automatically.

**Investigation:** worker W2 (work unit 0, `docs/work/0_hello-world-cloud/`) found that the desktop app's in-app browser pane had opened `file:///…/index.html` after each editor-tool edit of `index.html`. W2 never navigated the pane. Nothing in the `~/.claude` settings or hooks does this, and the app exposes no setting for it. The repo's own tooling (`scripts/shoot.mjs`) already ran Playwright headless and wrote its screenshots with Node `fs`, so it was not the source.

**Cause, as far as known:** the desktop app's browser pane navigated to a local HTML file, and that `file://` navigation surfaced a save prompt. Why the pane follows editor-tool edits of `.html` files is not explained.

**How it is now checked:**

- `tests/hygiene.test.mjs` (part of `npm test`) covers the class in this repo's own tooling. It statically scans `scripts/`, `tests/` and the npm scripts, and fails if any Playwright launch is not literally `headless: true`, if anything names a system browser, a desktop opener, an opener package or a headed, debug, inspector or report mode, if a non-Playwright file builds a `file:` URL, or if a child process starts anything but Node.
- Each of its four tests went red with the defect reintroduced by `tests/mutate.mjs`:
  - `headless-false`: the screenshot tool launching a visible browser.
  - `opener-npm-script`: an npm script that starts the page in the system browser.
  - `script-opens-file`: a script handing the page's `file:` URL to the desktop shell.
- The working rule is staged as a canon candidate in `fleet/canon-candidates.md` at fleet `f44e26e`: write captures and downloads to known paths from code, never open a local file in a visible browser or the app's pane, and change `.html` files with a Node `fs` script, not the editor tools.
- The app-side trigger itself has no repo gate. No test in this repo can see what the desktop app's pane does when a file is edited, so that part rests on the working rule until the app's behaviour is explained or configurable.
