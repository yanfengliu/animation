# Local rules: animation

These rules hold only in this repo. They add to the fleet constitution, whose core is in AGENTS.md and whose rest is in `../fleet/docs/skills/coordinator.md` and `../fleet/docs/work-rules.md`.

- Work directly on `main`, with no worktrees or side branches (owner directive, 2026-10-11; delegation follows the fleetwide update of 2026-11-07). The main agent states the goal and runs one implementation writer at a time in this checkout, whether working directly or using a subagent. Read-only reviewers may run alongside it.
- Run the full mutation proof (`node tests/mutate.mjs`, 132 mutants, about 9 hours) with `bash docs/work/1_sentence-sequence/proof-batches.sh`, as a background job of the session, and run nothing else in the browser beside it. [How the runner works, and why](rules/full-mutation-proof.md).
