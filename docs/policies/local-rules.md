# Local rules: animation

These rules hold only in this repo. They add to the fleet constitution in AGENTS.md.

- Work directly on `main`, with no worktrees or side branches (owner directive, 2026-10-11: "act as orchestrator and just work on main for everything. Set goal and use subagents"). The coordinator states the goal, delegates implementation to subagents working in this checkout, and runs implementation workers one at a time so two never edit at once. Read-only reviewers may run alongside them.
- Run the full mutation proof (`node tests/mutate.mjs`, about 9 hours for 132 mutants) in resumable batches of about 11 named mutants. Each batch first checks that the code and tests still hash as when the proof began, then writes a done marker, so a rerun skips finished batches. Run it as a background job of the session, and run nothing else in the browser beside it. Session ends killed three full proofs on 2026-10-22 and 2026-10-25, one of them started as a separate hidden process; a batch loses at most about 50 minutes (the runner is `docs/work/1_sentence-sequence/proof-batches.sh`).
