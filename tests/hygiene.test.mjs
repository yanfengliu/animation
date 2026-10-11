// Gate: tooling hygiene, the class of the owner-reported save-prompt defect
// (docs/learning/defect-register.md): repo tooling must never put the page in a visible browser
// or hand a local file to the desktop.
// Bound: a static text scan under SCAN_ROOT (default: the repo root; mutation runs point it at an
// edited copy) of every .js, .mjs, .cjs, .ts, .mts, .cts, .sh, .ps1, .cmd and .bat file under
// scripts/, under tests/ and at the root (configs such as a Playwright config), of the scripts in
// package.json, and of every "command" value (hooks, the status line) in the .claude/settings*.json
// files that .gitignore does not name, since a hook there runs by itself after each edit.
// Proves, for that text:
// - every call of a browser type's launch methods passes headless set literally to true, with no
//   spread, no call building the options and no channel, and nothing reaches those methods other
//   than by calling them directly;
// - nothing names a system browser binary, a desktop opener, an opener package or a live-reload
//   server, a process package the child-process check cannot follow, an attach to an already
//   running browser, Playwright's headed, debug, UI, inspector, code generator, open or report
//   modes, or a page pause (a pause on a Node stream such as stdin is allowed); no Playwright
//   config picks a browser channel; no shell command (npm script, shell file, settings command)
//   starts with an opener, also after a separator, a quote or a shell's command switch;
// - a file that builds a file: URL (a path-to-URL conversion, a quoted file: string, or
//   import.meta's url or resolve anywhere but inside fileURLToPath) imports Playwright, and no
//   command contains one;
// - the child-process module is reached only through import or require forms the scan reads
//   (default, namespace, named, renamed or destructured), each binding from it is used only by a
//   direct call, and those calls start only Node (exec never; execFile and spawn only with
//   process.execPath).
// Blind spots: code assembled at run time (eval, new Function, strings or names built from pieces,
// computed keys such as cp['exec'], a launch method reached by destructuring or a computed key);
// programs that open a browser by default but are not named here; files outside the scanned
// paths (docs/, tmp/, node_modules and its install scripts, git hooks, ~/.claude, settings files
// .gitignore names, agents' scratch scripts outside the repo); and the desktop app's own browser
// pane, which opened the file in the original incident and has no repo-side gate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(REPO, process.env.SCAN_ROOT || '.');
const CODE = /\.(m?js|cjs|m?ts|cts|sh|ps1|cmd|bat)$/i;
const SHELL = /\.(sh|ps1|cmd|bat)$/i;
const read = (p) => readFileSync(p, 'utf8');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name === 'node_modules' ? [] : walk(p);
    return CODE.test(d.name) ? [p] : [];
  });
}
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const rootFiles = readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isFile() && CODE.test(d.name)).map((d) => path.join(ROOT, d.name));
const sources = [...['scripts', 'tests'].flatMap((d) => (existsSync(path.join(ROOT, d)) ? walk(path.join(ROOT, d)) : [])), ...rootFiles]
  .map((p) => ({ file: rel(p), text: read(p), shell: SHELL.test(p) }));
const pkg = JSON.parse(read(path.join(ROOT, 'package.json')));
const npmScripts = Object.entries(pkg.scripts ?? {}).map(([k, v]) => ({ file: `package.json scripts.${k}`, text: String(v), shell: true }));

// Claude Code settings in the tree. Every "command" value is a shell command the app runs by
// itself (a hook after each edit, the status line). A settings file that .gitignore names by its
// exact path (settings.local.json) is the owner's own, not the repo's, and is skipped.
const gitignore = existsSync(path.join(ROOT, '.gitignore')) ? read(path.join(ROOT, '.gitignore')).split(/\r?\n/).map((l) => l.trim().replace(/^\//, '')) : [];
const settingsDir = path.join(ROOT, '.claude');
const settingsFiles = existsSync(settingsDir) ? readdirSync(settingsDir).filter((n) => /^settings.*\.json$/i.test(n) && !gitignore.includes(`.claude/${n}`)) : [];
const settingsCommands = [], settingsErrors = [];
for (const name of settingsFiles) {
  const collect = (v, at) => {
    if (Array.isArray(v)) v.forEach((x, i) => collect(x, `${at}[${i}]`));
    else if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) {
        const here = at ? `${at}.${k}` : k;
        if (k === 'command' && typeof x === 'string') settingsCommands.push({ file: `.claude/${name} ${here}`, text: x, shell: true });
        else collect(x, here);
      }
    }
  };
  try { collect(JSON.parse(read(path.join(settingsDir, name))), ''); } catch (err) { settingsErrors.push(`.claude/${name}: ${err.message}`); }
}
const commands = [...npmScripts, ...settingsCommands];
const lineOf = (text, i) => text.slice(0, i).split('\n').length;

// The argument text of the call whose opening parenthesis is at `open`, skipping quoted strings.
function callArgs(text, open) {
  let depth = 0, quote = null;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return { args: text.slice(open + 1, i), end: i };
  }
  return { args: text.slice(open + 1), end: text.length };
}
// [open, close] of every call whose callee matches re (a global regex ending at the parenthesis).
const spans = (text, re) => [...text.matchAll(re)].map((m) => { const open = m.index + m[0].length - 1; return [open, callArgs(text, open).end]; });
const nextChar = (text, i) => { const k = text.slice(i).search(/\S/); return k < 0 ? text.length : i + k; };

// The patterns below are written so that this file's own text does not match them.
const LAUNCH = /\.\s*(launch(?:PersistentContext|Server)?)\b/g;
const PW_IMPORT = /\bfrom\s*['"](?:playwright(?:-core)?|@playwright\/test)['"]|\brequire\s*\(\s*['"](?:playwright(?:-core)?|@playwright\/test)['"]\s*\)/;
const isPlaywrightConfig = (file, text) => /(?:^|\/)playwright(?:-ct)?\.config\.[cm]?[jt]s$/.test(file) || /['"]@playwright\/test['"]/.test(text);
const BANNED = [
  [/\bheadless\s*:(?!\s*true\b)/, 'a headless option that is not literally true'],
  [/-{2}headed\b/, "Playwright's headed flag"],
  [/-{2}(?:debug|ui)\b/, "a debug or UI flag, which opens Playwright's inspector or UI window"],
  [/-{2}open\b/, 'an open flag, which opens a browser'],
  [/\bPW[D]EBUG\b/, "Playwright's debug mode, which opens the inspector"],
  [/\bdevtools\s*:\s*true/, 'devtools, which needs a visible browser'],
  [/\bshow-(?:report|trace)\b|\bcode[g]en\b|\bopen\s*:\s*['"](?:always|on-failure)['"]/, 'a Playwright command or reporter option that opens a window'],
  [/\bplaywright(?:\.cmd)?\s+(?:open|cr|ff|wk)\b/, 'a Playwright command that opens a page in a visible browser'],
  [/\bconnectOver[C]DP\b/, 'an attach to an already running browser, which may be visible'],
  [/\b(?:msedge|chrome|firefox|iexplore|explorer|opera|brave|safari)\.exe\b/i, 'a system browser or shell binary'],
  [/\bxdg[-]open\b|\bstart[-]process\b|\binvoke[-]item\b|\brun[d]ll32\b|\burl\.dll\b|\bopen[E]xternal\b/i, 'a desktop opener'],
  [/\b(?:open[-]cli|opn[-]cli|better[-]opn|live[-]server|lite[-]server|browser[-]sync)\b/, 'an opener package or a live-reload server that opens a browser'],
  [/\bnpx\s+(?:-\S+\s+)*(?:open|opn)\b/i, 'npx running an opener package'],
  [/\bhttp[-]server\b[^\n;&|]*\s-o\b/, "http-server's open switch, which opens a browser"],
  [/(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*)['"](?:open|opn)['"]/, 'an opener package'],
  [/(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*)['"](?:execa|cross-spawn|shelljs|zx|node-pty)(?:\/[\w./-]*)?['"]/, 'a process package, which the child-process check cannot follow'],
];
// A pause call opens Playwright's inspector. Node streams have a pause method too, so a receiver
// whose last name is stdin, stdout, stderr, a stream or a readline interface is allowed.
const PAUSE = /(\w*)\s*\.\s*pause\s*\(/g;
const STREAM = /^(?:stdin|stdout|stderr|\w*[Ss]tream|rl|readline)$/;
// In shell commands: an opener at the start of a command, after a separator, a quote or a shell's
// command switch (cmd /c, sh -c, PowerShell -Command).
const CMD_START = String.raw`(?:^|[;&|(\x60'"]|\s(?:\/[ck]|-c|-Command)\s)\s*`;
const SHELL_OPENER = new RegExp(CMD_START + String.raw`(?:start|open|xdg[-]open|explorer|invoke[-]item|ii|start[-]process|saps)(?:\.exe)?\s+\S`, 'im');

test('every browser launch in the scanned tooling passes a literal headless: true', () => {
  const launches = [], bad = [];
  for (const { file, text } of sources) {
    for (const m of text.matchAll(LAUNCH)) {
      const where = `${file}:${lineOf(text, m.index)}`;
      const open = nextChar(text, m.index + m[0].length);
      if (text[open] !== '(') { bad.push(`${where} ${m[1]} reached other than by a direct call, so its options cannot be checked`); continue; }
      launches.push(where);
      const { args } = callArgs(text, open);
      const values = [...args.matchAll(/\bheadless\s*:\s*([^,}\s]+)/g)].map((v) => v[1]);
      if (values.length !== 1 || values[0] !== 'true') bad.push(`${where} ${m[1]} with ${values.length ? `headless ${values.join(', ')}` : 'no literal headless option'}`);
      if (/\.{3}/.test(args)) bad.push(`${where} ${m[1]} spreads options into the call, which can override headless`);
      if (/[\w$\])]\s*\(/.test(args)) bad.push(`${where} ${m[1]} builds its options with a call, which can override headless`);
      if (/\bchannel\s*:/.test(args)) bad.push(`${where} ${m[1]} picks a browser channel, which runs the system-installed browser`);
    }
  }
  assert.ok(sources.some((s) => s.file === 'scripts/shoot.mjs'), `scripts/shoot.mjs is not among the ${sources.length} files scanned under ${ROOT}`);
  assert.ok(launches.length >= 2, `only ${launches.length} browser launch calls found under ${ROOT}; the screenshot tool and the test harness each have one, so the scan did not run`);
  assert.deepEqual(bad, [], 'browser launch calls that are not literally headless');
});

test('nothing opens a system browser, the desktop, or a visible Playwright mode', (t) => {
  const hits = settingsErrors.map((e) => `${e} (not valid JSON, so its commands could not be read)`);
  for (const { file, text, shell } of [...sources, ...commands]) {
    for (const [re, what] of BANNED) {
      const m = re.exec(text);
      if (m) hits.push(`${file}:${lineOf(text, m.index)} ${what}: ${JSON.stringify(m[0])}`);
    }
    for (const m of text.matchAll(PAUSE)) {
      if (!STREAM.test(m[1])) hits.push(`${file}:${lineOf(text, m.index)} a pause call, which opens Playwright's inspector: ${JSON.stringify(m[0])}`);
    }
    if (isPlaywrightConfig(file, text)) {
      const m = /\bchannel\s*:/.exec(text);
      if (m) hits.push(`${file}:${lineOf(text, m.index)} a browser channel in a Playwright config, which runs the system-installed browser`);
    }
    if (shell) {
      const m = SHELL_OPENER.exec(text);
      if (m) hits.push(`${file}:${lineOf(text, m.index)} a shell command that opens its argument: ${JSON.stringify(m[0].trim())}`);
    }
  }
  t.diagnostic(`scanned ${sources.length} files, ${npmScripts.length} npm scripts and ${settingsCommands.length} settings commands (${settingsFiles.length ? settingsFiles.map((n) => '.claude/' + n).join(', ') : 'no unignored .claude/settings*.json'})`);
  assert.ok(npmScripts.length > 0, 'package.json has no scripts, so the scan of npm scripts did not run');
  assert.deepEqual(hits, [], 'tooling that can open a visible window');
});

test('only files that use Playwright build file: URLs', () => {
  const bad = [];
  const META_URL = /\bimport\s*\.\s*meta\s*\.\s*(?:url|resolve)\b/g;
  for (const { file, text, shell } of [...sources, ...commands]) {
    if (PW_IMPORT.test(text)) continue;
    const m = (shell ? /pathTo[F]ileURL|\bfile:/ : /pathTo[F]ileURL|['"`]file:/).exec(text);
    if (m) bad.push(`${file}:${lineOf(text, m.index)} ${JSON.stringify(m[0])}`);
    const inside = spans(text, /\bfileURLToPath\s*\(/g);
    for (const u of text.matchAll(META_URL)) {
      if (!inside.some(([a, b]) => u.index > a && u.index < b)) bad.push(`${file}:${lineOf(text, u.index)} ${u[0]} outside fileURLToPath(), so it stays a file: URL`);
    }
  }
  assert.deepEqual(bad, [], 'files without Playwright that build file: URLs');
});

test('child processes, if any, start only Node', () => {
  const bad = [];
  const CP = String.raw`['"](?:node:)?child[_]process['"]`;
  const IMPORT_ES = new RegExp(String.raw`\bimport\s+(?:(\w+)\s*,?\s*)?(?:\*\s*as\s+(\w+)|\{([^}]*)\})?\s*from\s*` + CP, 'g');
  const IMPORT_CJS = new RegExp(String.raw`\b(?:const|let|var)\s+(?:(\w+)|\{([^}]*)\})\s*=\s*(?:await\s+import|require)\s*\(\s*` + CP + String.raw`\s*\)`, 'g');
  const IMPORT_BARE = new RegExp(String.raw`\bimport\s*` + CP, 'g');
  const SPAWNERS = new Set(['exec', 'execSync', 'execFile', 'execFileSync', 'spawn', 'spawnSync']);
  for (const { file, text } of sources) {
    const tokens = [...text.matchAll(/\bchild[_]process\b/g)].map((m) => m.index);
    if (!tokens.length) continue;
    const ns = new Set(), fns = new Map(), covered = [];
    const bind = (list, sep, at) => {
      for (const item of list.split(',').map((x) => x.trim()).filter(Boolean)) {
        const [orig, local = orig] = item.split(sep).map((x) => x.trim());
        if (!/^\w+$/.test(orig) || !/^\w+$/.test(local)) { bad.push(`${file}:${lineOf(text, at)} an import from the child-process module that the scan cannot read: ${JSON.stringify(item)}`); continue; }
        if (orig === 'default') ns.add(local); else fns.set(local, orig);
      }
    };
    for (const m of text.matchAll(IMPORT_ES)) {
      covered.push([m.index, m.index + m[0].length]);
      if (m[1]) ns.add(m[1]);
      if (m[2]) ns.add(m[2]);
      if (m[3] !== undefined) bind(m[3], /\s+as\s+/, m.index);
    }
    for (const m of text.matchAll(IMPORT_CJS)) {
      covered.push([m.index, m.index + m[0].length]);
      if (m[1]) ns.add(m[1]);
      if (m[2] !== undefined) bind(m[2], ':', m.index);
    }
    for (const m of text.matchAll(IMPORT_BARE)) covered.push([m.index, m.index + m[0].length]);
    const outside = (i) => !covered.some(([a, b]) => i >= a && i < b);
    for (const i of tokens) if (outside(i)) bad.push(`${file}:${lineOf(text, i)} reaches the child-process module in a way the scan does not read`);
    // A spawner must be called directly; exec runs a shell, the others must start process.execPath.
    const check = (pos, fn, where) => {
      const open = nextChar(text, pos);
      if (text[open] !== '(') { bad.push(`${where} ${fn} used other than by a direct call, so its command cannot be checked`); return; }
      const arg = (/^\(\s*([^,)]*)/.exec(text.slice(open))?.[1] ?? '').trim();
      if (fn === 'exec' || fn === 'execSync') bad.push(`${where} ${fn}(${arg}) runs a shell command`);
      else if (arg !== 'process.execPath') bad.push(`${where} ${fn}(${arg}) starts something other than Node`);
    };
    for (const name of ns) {
      for (const m of text.matchAll(new RegExp(String.raw`(?<![\w$.])${name}\b(\s*\.\s*(\w+))?`, 'g'))) {
        if (!outside(m.index)) continue;
        const where = `${file}:${lineOf(text, m.index)}`;
        if (!m[2]) bad.push(`${where} the child-process module used other than through one of its methods`);
        else if (SPAWNERS.has(m[2])) check(m.index + m[0].length, m[2], where);
      }
    }
    for (const [local, orig] of fns) {
      if (!SPAWNERS.has(orig)) continue;
      for (const m of text.matchAll(new RegExp(String.raw`(?<![\w$.])${local}\b`, 'g'))) {
        if (outside(m.index)) check(m.index + m[0].length, orig, `${file}:${lineOf(text, m.index)}`);
      }
    }
  }
  assert.deepEqual(bad, [], 'child processes that are not Node (shell commands can open anything)');
});
