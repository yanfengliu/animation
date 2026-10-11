// Gate: tooling hygiene, the class of the owner-reported save-prompt defect
// (docs/learning/defect-register.md): repo tooling must never put the page in a visible browser
// or hand a local file to the desktop.
// Bound: a static text scan of every .js, .mjs, .cjs, .ts, .mts, .cts, .sh, .ps1, .cmd and .bat
// file under scripts/ and tests/, and of the scripts in package.json, under SCAN_ROOT (default:
// the repo root; mutation runs point it at an edited copy). Proves: every Playwright launch call
// there passes headless set literally to true; nothing there names a desktop opener, a system
// browser binary or channel, an opener package, or Playwright's headed, debug, inspector or
// report modes; a file that builds a file: URL also imports Playwright; child processes, if any,
// start only Node. Does not prove the behaviour of code assembled at run time (eval, strings
// built from pieces), of tools outside these paths, or of the desktop app's own browser pane,
// which opened the file in the original incident and has no repo-side gate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(REPO, process.env.SCAN_ROOT || '.');
const CODE = /\.(m?js|cjs|m?ts|cts|sh|ps1|cmd|bat)$/i;
const SHELL = /\.(sh|ps1|cmd|bat)$/i;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name === 'node_modules' ? [] : walk(p);
    return CODE.test(d.name) ? [p] : [];
  });
}
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const sources = ['scripts', 'tests'].flatMap((d) => (existsSync(path.join(ROOT, d)) ? walk(path.join(ROOT, d)) : []))
  .map((p) => ({ file: rel(p), text: readFileSync(p, 'utf8'), shell: SHELL.test(p) }));
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const npmScripts = Object.entries(pkg.scripts ?? {}).map(([k, v]) => ({ file: `package.json scripts.${k}`, text: String(v), shell: true }));
const lineOf = (text, i) => text.slice(0, i).split('\n').length;

// The patterns below are written so that this file's own text does not match them.
const BANNED = [
  [/\bheadless\s*:(?!\s*true\b)/, 'a headless option that is not literally true'],
  [/-{2}headed\b/, "Playwright's headed flag"],
  [/\bPW[D]EBUG\b/, "Playwright's debug mode, which opens the inspector"],
  [/\bdevtools\s*:\s*true/, 'devtools, which needs a visible browser'],
  [/\.pause\s*\(\s*\)/, 'a page pause call, which opens the inspector'],
  [/\bshow-(?:report|trace)\b|\bcode[g]en\b|\bopen\s*:\s*['"](?:always|on-failure)['"]/, 'a Playwright command or reporter option that opens a window'],
  [/\bchannel\s*:/, 'a browser channel, which launches the system-installed browser'],
  [/\b(?:msedge|chrome|firefox|iexplore|explorer|opera|brave|safari)\.exe\b/i, 'a system browser or shell binary'],
  [/\bxdg[-]open\b|\bstart[-]process\b|\binvoke[-]item\b|\brun[d]ll32\b|\burl\.dll\b|\bopen[E]xternal\b/i, 'a desktop opener'],
  [/(?:from\s*|require\s*\(\s*|import\s*\(\s*)['"](?:open|opn|better-opn|open-cli)['"]/, 'an opener package'],
];
// In npm scripts and shell files: a command that hands its argument to the desktop.
const SHELL_OPENER = /(?:^|[;&|(]\s*|\bcmd(?:\.exe)?\s+\/c\s+)(?:start|open|xdg[-]open|explorer|invoke[-]item|ii|start[-]process)\s+\S/im;

test('every browser launch in scripts/ and tests/ passes headless: true', () => {
  const launches = [], bad = [];
  for (const { file, text } of sources) {
    for (const m of text.matchAll(/\b(launch[A-Za-z]*)\s*\(/g)) {
      const open = m.index + m[0].length - 1;
      let depth = 0, quote = null, end = text.length;
      for (let i = open; i < text.length; i++) {
        const c = text[i];
        if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue; }
        if (c === '"' || c === "'" || c === '`') quote = c;
        else if (c === '(') depth++;
        else if (c === ')' && --depth === 0) { end = i; break; }
      }
      const args = text.slice(open + 1, end);
      const values = [...args.matchAll(/\bheadless\s*:\s*([^,}\s]+)/g)].map((v) => v[1]);
      const where = `${file}:${lineOf(text, m.index)}`;
      launches.push(where);
      if (values.length !== 1 || values[0] !== 'true') bad.push(`${where} ${m[1]} with ${values.length ? `headless ${values.join(', ')}` : 'no literal headless option'}`);
    }
  }
  assert.ok(sources.some((s) => s.file === 'scripts/shoot.mjs'), `scripts/shoot.mjs is not among the ${sources.length} files scanned under ${ROOT}`);
  assert.ok(launches.length >= 2, `only ${launches.length} browser launch calls found under ${ROOT}; the screenshot tool and the test harness each have one, so the scan did not run`);
  assert.deepEqual(bad, [], 'browser launch calls that are not literally headless');
});

test('nothing opens a system browser, the desktop, or a visible Playwright mode', () => {
  const hits = [];
  for (const { file, text, shell } of [...sources, ...npmScripts]) {
    for (const [re, what] of BANNED) {
      const m = re.exec(text);
      if (m) hits.push(`${file}:${lineOf(text, m.index)} ${what}: ${JSON.stringify(m[0])}`);
    }
    if (shell) {
      const m = SHELL_OPENER.exec(text);
      if (m) hits.push(`${file}:${lineOf(text, m.index)} a shell command that opens its argument: ${JSON.stringify(m[0].trim())}`);
    }
  }
  assert.ok(npmScripts.length > 0, 'package.json has no scripts, so the scan of npm scripts did not run');
  assert.deepEqual(hits, [], 'tooling that can open a visible window');
});

test('only files that use Playwright build file: URLs', () => {
  const bad = sources.filter(({ text }) => /pathTo[F]ileURL|['"`]file:/.test(text) && !/from\s+['"]playwright['"]|require\(\s*['"]playwright['"]\s*\)/.test(text)).map((s) => s.file);
  assert.deepEqual(bad, [], 'files that build file: URLs without Playwright');
});

test('child processes, if any, start only Node', () => {
  const bad = [];
  for (const { file, text } of sources) {
    if (!/\bchild_process\b/.test(text)) continue;
    const spaces = new Set();
    for (const m of text.matchAll(/import\s+(?:\*\s+as\s+)?(\w+)\s+from\s+['"](?:node:)?child_process['"]/g)) spaces.add(m[1]);
    for (const m of text.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+import|require)\s*\(\s*['"](?:node:)?child_process['"]\s*\)/g)) spaces.add(m[1]);
    for (const m of text.matchAll(/(?:\b(\w+)\s*\.\s*)?\b(exec|execSync|execFile|execFileSync|spawn|spawnSync)\s*\(\s*([^,)]*)/g)) {
      const [, owner, fn, first] = m;
      if (owner && !spaces.has(owner)) continue;    // a method of something else, such as RegExp.exec
      if (fn === 'exec' || fn === 'execSync' || first.trim() !== 'process.execPath') bad.push(`${file}:${lineOf(text, m.index)} ${fn}(${first.trim()})`);
    }
  }
  assert.deepEqual(bad, [], 'child processes that are not Node (shell commands can open anything)');
});
