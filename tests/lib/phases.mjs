// The order in which the gate files run, shared by tests/run.mjs (npm test) and tests/mutate.mjs.
// The illusion file runs alone, first: it renders four 1280×800 pages at a time in its own
// browsers, and the timing checks in the other files (the font-hang loads in page.test.mjs, the
// control fling in controls.test.mjs) must never run beside those bursts (review round 3, R3-5).
// The sequence file runs next, beside only the hygiene scan, which opens no browser: it keeps up to
// six pages drawing in five browsers for about 55 s, and when it ran beside page.test.mjs the
// font-hang check's load with the stylesheet answered took 2.7 s and the one with it hung 6.1 s,
// 1.4 s past the check's 2 s margin (W19, 2026-10-22). Its own timed shots stay clear of the other
// files' loads too. The other files then run two at a time.
export const GROUPS = [['tests/illusion.test.mjs'], ['tests/sequence.test.mjs', 'tests/hygiene.test.mjs']];

// The given files (repo-relative, forward slashes) as phases to run one after another, each with
// node:test's run() at concurrency 2: each group's files that are given, in GROUPS order, then the
// rest.
export function phases(files) {
  const grouped = GROUPS.map((g) => files.filter((f) => g.includes(f))).filter((g) => g.length);
  const rest = files.filter((f) => !GROUPS.flat().includes(f));
  return [...grouped, ...(rest.length ? [rest] : [])];
}
