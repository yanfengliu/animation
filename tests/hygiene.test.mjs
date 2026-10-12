// Gate: tooling hygiene, the class of the owner-reported save-prompt defect
// (docs/learning/defect-register.md): repo tooling must never put the page in a visible browser
// or hand a local file to the desktop.
// Bound: a static text scan under SCAN_ROOT (default: the repo root; mutation runs point it at an
// edited copy). It reads only these texts:
// - .js, .mjs, .cjs, .ts, .mts, .cts, .sh, .ps1, .cmd and .bat files under scripts/, under tests/
//   and at the root (configs such as a Playwright config); files of any other type there (a .py
//   script, say) are never read;
// - the scripts in package.json, and every "command" value (hooks, the status line) in the
//   .claude/settings*.json files that .gitignore does not name, since a hook there runs by itself
//   after each edit;
// - every repo file that one of those commands, or a scanned shell file, names by its path
//   (bash .claude/hooks/after-edit.sh, node tools/x.mjs, also after $CLAUDE_PROJECT_DIR, ${VAR},
//   %VAR% or $env:VAR), at any depth, when it has one of the types above, or no extension and a
//   slash in the name (read as a shell script unless its #! line names node). Files under
//   node_modules or .git, and outside the scan root, are skipped.
// Comments are blanked before matching: // and /* */ (and a first #! line) in code files; # (and
// <# #> in PowerShell) where a word starts, outside quotes, in shell files; REM and :: lines in
// .cmd and .bat files. npm scripts and settings commands keep any #, since cmd.exe, which runs npm
// scripts on Windows, has no # comment.
// Proves, for that text:
// - every call of a browser type's launch methods passes headless set literally to true, with no
//   spread, no call building the options and no channel, and nothing reaches those methods other
//   than by calling them directly;
// - nothing names a system browser binary, a desktop opener, an opener package or a live-reload
//   server, a process package the child-process check cannot follow, an attach to an already
//   running browser, or Playwright's headed, debug, UI, inspector, code generator, open or report
//   modes (also through a version-pinned playwright@<version>); no Playwright config picks a
//   browser channel;
// - nothing pauses a receiver that can be a page: one whose chain names "page" (page.x,
//   this.page, newPage(), pages()[0]) or uses a name that can hold one. The same file declares
//   such a name from a statement that calls newPage, pages() or waitForEvent, alone or in a
//   destructuring pattern, or assigns it, awaited or not, from a bare name that can hold a page or
//   names "page". Pauses on sockets, requests, streams, media and animations pass;
// - no shell command (npm script, shell file, settings command) runs an opener where a command
//   starts: at a line start, after ; & | ( or a backtick, after a shell's command switch (cmd /c
//   or /k, sh -c or a combined switch such as -lc, PowerShell -Command), or after powershell or
//   powershell.exe and its switches, since Windows PowerShell runs its first other argument as a
//   command. The command word may be quoted there; a quote anywhere else is text (echo "open
//   tasks: 3");
// - a file or command that builds a file: URL (a path-to-URL conversion, a quoted file: string, or
//   import.meta's url or resolve anywhere but inside fileURLToPath) imports Playwright;
// - the child-process module, in files and in commands (node -e), is reached only through import
//   or require forms the scan reads (default, namespace, named, renamed or destructured), each
//   binding from it is used only by a direct call, and those calls start only Node (exec never;
//   execFile and spawn only with process.execPath).
// Known false positives: a pause on a receiver that is not a page but whose chain names "page"
// (pageStream, a call with a page argument), or on a name bound as above that holds no page (a
// name declared with no semicolon before a later newPage call, or assigned from pageStream); a
// program's own -c switch before a quoted opener word (git commit -c "start ..."); an opener word
// as an argument after powershell's -File script; a launch method's name or the child-process
// module's name inside a string.
// Blind spots: code assembled at run time (eval, new Function, strings or names built from pieces,
// computed keys such as cp['exec'], a launch method reached by destructuring or a computed key); a
// page under a name without "page" that the file does not bind itself (a parameter called tab) or
// reaches only through a member or a call (const p = pick(context); p.pause());
// programs that open a browser by default but are not named here; files of other types; repo files
// outside the scanned folders that only code names (a path passed to a Node child process); files
// outside the scanned paths that no command names (docs/, tmp/, node_modules and its install
// scripts, git hooks, ~/.claude, settings files .gitignore names, agents' scratch scripts outside
// the repo); and the desktop app's own browser pane, which opened the file in the original
// incident and has no repo-side gate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(REPO, process.env.SCAN_ROOT || '.');
const CODE = /\.(m?js|cjs|m?ts|cts|sh|ps1|cmd|bat)$/i;
const read = (p) => readFileSync(p, 'utf8');
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const lineOf = (text, i) => text.slice(0, i).split('\n').length;

// Comment finders return [start, end) ranges; blank() turns them into spaces and keeps line
// breaks, so match positions and line numbers stay those of the file.
function blank(text, ranges) {
  if (!ranges.length) return text;
  const out = text.split('');
  for (const [a, b] of ranges) for (let k = a; k < b; k++) if (out[k] !== '\n' && out[k] !== '\r') out[k] = ' ';
  return out.join('');
}
// JavaScript and TypeScript: // and /* */ outside strings, templates and regular expressions. A
// slash starts a regular expression unless it follows a value (a name, a number, a string, ) or ]).
const REGEX_AFTER = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
function jsComments(text) {
  const n = text.length, ranges = [], depth = [];   // depth: braces open inside each template ${ }
  let i = 0, regexOk = true;
  if (text.startsWith('#!')) { i = text.indexOf('\n'); if (i < 0) i = n; ranges.push([0, i]); }
  // Reads template text from j to its closing backtick or its next ${, and says which it reached.
  const template = (j) => {
    for (; j < n; j++) {
      if (text[j] === '\\') j++;
      else if (text[j] === '`') return [j + 1, false];
      else if (text[j] === '$' && text[j + 1] === '{') { depth.push(0); return [j + 2, true]; }
    }
    return [n, false];
  };
  while (i < n) {
    const c = text[i];
    if (c === '/' && text[i + 1] === '/') { const e = text.indexOf('\n', i); ranges.push([i, e < 0 ? n : e]); i = e < 0 ? n : e; continue; }
    if (c === '/' && text[i + 1] === '*') { const e = text.indexOf('*/', i + 2); const end = e < 0 ? n : e + 2; ranges.push([i, end]); i = end; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < n && text[j] !== c && text[j] !== '\n') j += text[j] === '\\' ? 2 : 1;
      i = j + 1; regexOk = false; continue;
    }
    if (c === '`' || (c === '}' && depth.length && depth[depth.length - 1] === 0)) {
      if (c === '}') depth.pop();
      [i, regexOk] = template(i + 1);
      continue;
    }
    if (c === '{' || c === '}') { if (depth.length) depth[depth.length - 1] += c === '{' ? 1 : -1; i++; regexOk = true; continue; }
    if (c === '/' && regexOk) {
      let j = i + 1, cls = false;
      for (; j < n && text[j] !== '\n'; j++) {
        if (text[j] === '\\') j++;
        else if (cls) cls = text[j] !== ']';
        else if (text[j] === '[') cls = true;
        else if (text[j] === '/') break;
      }
      if (text[j] === '/') { i = j + 1; while (/[a-z]/i.test(text[i] ?? '')) i++; regexOk = false; continue; }
    }
    if (/[\w$]/.test(c)) {
      let j = i;
      while (j < n && /[\w$]/.test(text[j])) j++;
      regexOk = REGEX_AFTER.has(text.slice(i, j));
      i = j; continue;
    }
    regexOk = c !== ')' && c !== ']';
    i++;
  }
  return ranges;
}
// Shell and PowerShell: # where a word starts, outside quotes, and <# #> blocks in PowerShell.
function shellComments(text, ps) {
  const ranges = [], esc = ps ? '`' : '\\';
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === esc && quote !== "'") { i++; continue; }
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"') { quote = c; continue; }
    const block = ps && c === '<' && text[i + 1] === '#';
    if (block || (c === '#' && (i === 0 || /[\s;&|(]/.test(text[i - 1])))) {
      const e = block ? text.indexOf('#>', i + 2) : text.indexOf('\n', i);
      const end = e < 0 ? text.length : block ? e + 2 : e;
      ranges.push([i, end]);
      i = end - 1;
    }
  }
  return ranges;
}
// cmd.exe: REM and :: lines.
const cmdComments = (text) => [...text.matchAll(/^[ \t@]*(?:rem\b|::)[^\n]*/gim)].map((m) => [m.index, m.index + m[0].length]);

// One scanned file: its text with comments blanked, and whether it is a shell script.
function source(p) {
  const raw = read(p), ext = path.extname(p).toLowerCase();
  const kind = ext === '.ps1' ? 'ps1' : ext === '.cmd' || ext === '.bat' ? 'cmd' : ext === '.sh' || (!ext && !/^#!.*\bnode\b/.test(raw)) ? 'sh' : 'js';
  const ranges = kind === 'js' ? jsComments(raw) : kind === 'cmd' ? cmdComments(raw) : shellComments(raw, kind === 'ps1');
  return { file: rel(p), text: blank(raw, ranges), shell: kind !== 'js' };
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name === 'node_modules' ? [] : walk(p);
    return CODE.test(d.name) ? [p] : [];
  });
}
const rootFiles = readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isFile() && CODE.test(d.name)).map((d) => path.join(ROOT, d.name));
const sources = [...['scripts', 'tests'].flatMap((d) => (existsSync(path.join(ROOT, d)) ? walk(path.join(ROOT, d)) : [])), ...rootFiles].map(source);
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

// Repo files that a command or a shell file names by path: its words, once quotes and environment
// variables are dropped, resolved from the scan root and from the naming file's own folder. A word
// counts when it has a scanned type, or no extension and a slash (a hook script such as
// .claude/hooks/after-edit).
function namedFiles(text, dirs) {
  const found = [];
  for (const word of text.replace(/\$\{?\w+\}?|%\w+%|\$env:\w+/gi, '').split(/[\s'"\x60;&|()<>,=]+/)) {
    const w = word.replace(/\\/g, '/');
    if (!w || /^[a-z][\w+.-]+:/i.test(w) || (path.extname(w) ? !CODE.test(w) : !w.includes('/'))) continue;
    for (const dir of dirs) {
      const p = w.startsWith('/') ? path.join(dir, w) : path.resolve(dir, w);
      const r = path.relative(ROOT, p);
      if (r.startsWith('..') || path.isAbsolute(r) || r.split(path.sep).some((s) => s === 'node_modules' || s === '.git')) continue;
      if (existsSync(p) && statSync(p).isFile()) found.push(p);
    }
  }
  return found;
}
const named = [];
{
  const seen = new Set(sources.map((s) => path.resolve(ROOT, s.file)));
  const queue = [...commands.map((c) => [c.text, [ROOT]]), ...sources.filter((s) => s.shell).map((s) => [s.text, [ROOT, path.dirname(path.resolve(ROOT, s.file))]])];
  while (queue.length) {
    const [text, dirs] = queue.shift();
    for (const p of namedFiles(text, dirs)) {
      if (seen.has(p)) continue;
      seen.add(p);
      const s = source(p);
      sources.push(s);
      named.push(s.file);
      if (s.shell) queue.push([s.text, [ROOT, path.dirname(p)]]);
    }
  }
}

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

// The patterns below are written so that this file's own code does not match them.
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
  [/(?:\bplaywright(?:-core)?|@playwright\/test)(?:@[^\s'"]+)?(?:\.cmd)?\s+(?:open|cr|ff|wk)\b/, 'a Playwright command that opens a page in a visible browser'],
  [/\bconnectOver[C]DP\b/, 'an attach to an already running browser, which may be visible'],
  [/\b(?:msedge|chrome|firefox|iexplore|explorer|opera|brave|safari)\.exe\b/i, 'a system browser or shell binary'],
  [/\bxdg[-]open\b|\bstart[-]process\b|\binvoke[-]item\b|\brun[d]ll32\b|\burl\.dll\b|\bopen[E]xternal\b/i, 'a desktop opener'],
  [/\b(?:open[-]cli|opn[-]cli|better[-]opn|live[-]server|lite[-]server|browser[-]sync)\b/, 'an opener package or a live-reload server that opens a browser'],
  [/\bnpx\s+(?:-\S+\s+)*(?:open|opn)\b/i, 'npx running an opener package'],
  [/\bhttp[-]server\b[^\n;&|]*\s-o\b/, "http-server's open switch, which opens a browser"],
  [/(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*)['"](?:open|opn)['"]/, 'an opener package'],
  [/(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*)['"](?:execa|cross-spawn|shelljs|zx|node-pty)(?:\/[\w./-]*)?['"]/, 'a process package, which the child-process check cannot follow'],
];
// A pause call on a page opens Playwright's inspector. Sockets, requests, streams, media elements
// and animations have a pause method too, so a pause counts only when its receiver can be a page:
// its chain names "page", or it uses a name that can hold one. A name can hold a page when the
// same file declares it, alone or inside a destructuring pattern, from a statement that calls
// newPage, pages() or waitForEvent (const [popup] = await Promise.all([page.waitForEvent('popup'),
// ...])), or assigns it, awaited or not, from a bare name that can hold a page or names "page"
// (const popup = await popupPromise).
const PAUSE = /\??\.\s*pa[u]se\s*(?:\?\.\s*)?\(/g;
const PATTERN = String.raw`([\w$]+|\[[^\]=]*\]|\{[^}=]*\})`;
const PAGE_BINDING = new RegExp(String.raw`\b(?:const|let|var)\s+` + PATTERN + String.raw`\s*=[^;]*?\b(?:newPage|pages|waitForEvent)\s*\(`, 'g');
const ALIAS = new RegExp(String.raw`(?:\b(?:const|let|var)\s+)?` + PATTERN + String.raw`\s*(?<![=!<>])=(?![=>])\s*(?:await\s+)?([\w$]+)\s*(?=[;\n,)\]}]|$)`, 'g');
function pageNames(text) {
  const names = new Set(), words = (s) => [...s.matchAll(/[\w$]+/g)].map(([w]) => w);
  for (const m of text.matchAll(PAGE_BINDING)) for (const w of words(m[1])) names.add(w);
  for (let grew = true; grew;) {
    grew = false;
    for (const m of text.matchAll(ALIAS)) {
      if (!(names.has(m[2]) || /page/i.test(m[2]))) continue;
      for (const w of words(m[1])) if (!names.has(w)) { names.add(w); grew = true; }
    }
  }
  return names;
}
// The receiver chain that ends at `end`, read backwards through names, dots and the bracketed
// groups of calls and indexes: "this.page", "context.pages()[0]", "(await context.newPage())".
function receiver(text, end) {
  let i = end;
  const space = () => { while (i > 0 && /\s/.test(text[i - 1])) i--; };
  space();
  const stop = i;
  for (;;) {
    const c = text[i - 1] ?? '';
    if (c === ')' || c === ']') {
      const open = c === ')' ? '(' : '[';
      for (let d = 0; i > 0;) { const x = text[--i]; if (x === c) d++; else if (x === open && --d === 0) break; }
      space();
      if (/[\w$)\]]/.test(text[i - 1] ?? '')) continue;   // the group is a call or an index
    } else if (/[\w$]/.test(c)) {
      while (i > 0 && /[\w$]/.test(text[i - 1])) i--;
      space();
      if (text[i - 1] === '.') { i -= text[i - 2] === '?' ? 2 : 1; space(); continue; }
    }
    return text.slice(i, stop).trim();
  }
}
// In shell commands an opener counts where a command starts: at a line start, after ; & | ( or a
// backtick, after a shell's command switch (cmd /c or /k, sh -c or -lc, PowerShell -Command), or
// after powershell or powershell.exe and its switches, each with or without a value, since Windows
// PowerShell runs its first other argument as a command (powershell -NoProfile "ii index.html").
// The command word may be quoted there; anywhere else a quote is just text.
const CMD_START = String.raw`(?:^|[;&|(\x60]|\s(?:\/[ck]|-[a-z]*c|-command)\s|\bpowershell(?:\.exe)?['"]?(?:\s+-[\w:]+(?:\s+[^\s'"-]\S*)?)*\s)\s*['"]?\s*`;
const SHELL_OPENER = new RegExp(CMD_START + String.raw`(?:start|open|xdg[-]open|explorer|invoke[-]item|ii|start[-]process|saps)(?:\.exe)?['"]?\s+\S`, 'im');

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
    const pages = pageNames(text);
    for (const m of text.matchAll(PAUSE)) {
      const chain = receiver(text, m.index);
      if (/page/i.test(chain) || [...chain.matchAll(/[\w$]+/g)].some(([w]) => pages.has(w))) hits.push(`${file}:${lineOf(text, m.index)} a pause on ${JSON.stringify(chain)}, which can be a page, and a page pause opens Playwright's inspector`);
    }
    if (isPlaywrightConfig(file, text)) {
      const m = /\bchannel\s*:/.exec(text);
      if (m) hits.push(`${file}:${lineOf(text, m.index)} a browser channel in a Playwright config, which runs the system-installed browser`);
    }
    if (shell) {
      const m = SHELL_OPENER.exec(text);
      if (m) hits.push(`${file}:${lineOf(text, m.index + m[0].length - m[0].trimStart().length)} a shell command that opens its argument: ${JSON.stringify(m[0].trim())}`);
    }
  }
  t.diagnostic(`scanned ${sources.length} files (${named.length ? `named by commands: ${named.join(', ')}` : 'none named by commands outside those folders'}), ${npmScripts.length} npm scripts and ${settingsCommands.length} settings commands (${settingsFiles.length ? settingsFiles.map((n) => '.claude/' + n).join(', ') : 'no unignored .claude/settings*.json'})`);
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
  for (const { file, text } of [...sources, ...commands]) {
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
