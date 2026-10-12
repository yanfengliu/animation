// npm test: runs every tests/*.test.mjs with node:test in the phases of tests/lib/phases.mjs, the
// illusion file alone and then the other files two at a time, and prints node:test's spec report
// for each phase. PAGE (env) passes through to the gate files.
// Exit status: 1 when a test fails, a file fails to load, or no test passed (a run that did not
// happen must not read as green); 0 otherwise.
import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { phases } from './lib/phases.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = readdirSync(path.join(ROOT, 'tests')).filter((n) => n.endsWith('.test.mjs')).sort().map((n) => `tests/${n}`);
const t0 = Date.now();
let passed = 0, failed = 0;
for (const group of phases(files)) {
  console.log(`\n# ${group.join(', ')} (${group.length > 1 ? 'two at a time' : 'alone'})\n`);
  const stream = run({ files: group.map((f) => path.join(ROOT, f)), concurrency: 2, cwd: ROOT });
  stream.on('test:pass', (d) => { if (d.nesting === 0 && d.details?.type !== 'suite') passed++; });
  stream.on('test:fail', (d) => { if (d.nesting === 0) failed++; });
  const report = stream.compose(spec);
  report.pipe(process.stdout, { end: false });
  await new Promise((resolve, reject) => { report.on('end', resolve); report.on('error', reject); });
}
console.log(`\n# all phases: ${passed} passed, ${failed} failed, ${files.length} files, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (!passed) console.error('npm test: no test passed, so the gates did not run');
process.exitCode = failed || !passed ? 1 : 0;
