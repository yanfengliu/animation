# Defect register

Defects the owner reported, each with the symptom as they saw it, what the investigation found, the cause as far as it is known, and the check that now covers the defect's class. An entry stays after its gate lands: this is the standing list of what the gates could not see.

## Save prompts for files the agents produced (2026-10-11)

**Reported symptom:** while agents worked on this repo, a UI kept popping up asking the owner to save files the agents had downloaded. The owner's directive: do not pop UI asking them to save files; handle it automatically.

**Investigation:** worker W2 (work unit 0, `docs/work/0_hello-world-cloud/`) found that the desktop app's in-app browser pane had opened `file:///…/index.html` after each editor-tool edit of `index.html`. W2 never navigated the pane. Nothing in the `~/.claude` settings or hooks does this, and the app exposes no setting for it. The repo's own tooling (`scripts/shoot.mjs`) already ran Playwright headless and wrote its screenshots with Node `fs`, so it was not the source.

**Cause, as far as known:** the desktop app's browser pane navigated to a local HTML file, and that `file://` navigation surfaced a save prompt. Why the pane follows editor-tool edits of `.html` files is not explained.

**How it is now checked:**

- `tests/hygiene.test.mjs` (part of `npm test`) covers the class in this repo's own tooling. It statically scans `scripts/`, `tests/`, root code files (such as a `playwright.config.*`), the npm scripts, and every `command` in the `.claude/settings*.json` files that `.gitignore` does not name. A hook there is the one repo-side way to act "after each editor-tool edit". It fails if:
  - a Playwright launch is not literally `headless: true`, or spreads, builds or picks a channel for its options;
  - anything names a system browser, a desktop opener, an opener package or live-reload server (`open-cli`, `live-server`, `lite-server`, `browser-sync`, `npx open`, `http-server -o`), `connectOverCDP`, or a headed, debug, UI, inspector, code-generator, open or report mode, including a page `pause()` and the `--debug`, `--ui` and `--open` flags anywhere in a command;
  - a Playwright config picks a channel, or a shell command starts with an opener (also after a separator, a quote or `cmd /c`, `sh -c` or `-Command`);
  - a file without Playwright builds a `file:` URL, from `pathToFileURL`, a quoted `file:` string, or `import.meta.url` outside `fileURLToPath`;
  - a child process starts anything but Node, however `child_process` is imported (whole, by name, renamed or destructured), or the module is reached in a form the scan cannot read.
- Review round 1 (R1-6, F14) found that the first version missed openers named after `npx`, renamed imports, `new URL(…, import.meta.url)`, root configs and settings hooks, and flagged `process.stdin.pause()`, any `channel:` key and any `launch*` name. The scan now handles each of those.
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
- What the scan cannot see:
  - code assembled at run time (`eval`, strings or names built from pieces, computed keys such as `cp['exec']`, a launch method reached by destructuring);
  - programs that open a browser by default but are not named in the scan;
  - files outside its paths: `docs/`, `tmp/`, `node_modules` and its install scripts, git hooks, `~/.claude`, settings files `.gitignore` names, and agents' scratch scripts outside the repo.
- The working rule is staged as a canon candidate in `fleet/canon-candidates.md` at fleet `f44e26e`: write captures and downloads to known paths from code, never open a local file in a visible browser or the app's pane, and change `.html` files with a Node `fs` script, not the editor tools.
- The app-side trigger itself has no repo gate. No test in this repo can see what the desktop app's pane does when a file is edited, so that part rests on the working rule until the app's behaviour is explained or configurable.
