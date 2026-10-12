// The order in which the gate files run, shared by tests/run.mjs (npm test) and tests/mutate.mjs.
// The illusion file runs alone, first: it renders four 1280×800 pages at a time in its own
// browsers, and the timing checks in the other files (the font-hang loads in page.test.mjs, the
// control fling in controls.test.mjs) must never run beside those bursts (review round 3, R3-5).
// The other files then run two at a time.
export const ALONE = ['tests/illusion.test.mjs'];

// The given files (repo-relative, forward slashes) as phases to run one after another, each with
// node:test's run() at concurrency 2.
export function phases(files) {
  const alone = files.filter((f) => ALONE.includes(f)), rest = files.filter((f) => !ALONE.includes(f));
  return [...alone.map((f) => [f]), ...(rest.length ? [rest] : [])];
}
