# Local rules: animation

These rules hold only in this repo. They add to the fleet constitution in AGENTS.md.

- Work directly on `main`, with no worktrees or side branches (owner directive, 2026-10-11: "act as orchestrator and just work on main for everything. Set goal and use subagents"). The coordinator states the goal, delegates implementation to subagents working in this checkout, and runs implementation workers one at a time so two never edit at once. Read-only reviewers may run alongside them.
- Run the full mutation proof (`node tests/mutate.mjs`, 132 mutants, about 9 hours) with `bash docs/work/1_sentence-sequence/proof-batches.sh`, as a background job of the session, and run nothing else in the browser beside it. [How the runner works, and why](rules/full-mutation-proof.md).
