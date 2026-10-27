# Local rules: animation

These rules hold only in this repo. They add to the fleet constitution in AGENTS.md.

- Work directly on `main`, with no worktrees or side branches (owner directive, 2026-10-11: "act as orchestrator and just work on main for everything. Set goal and use subagents"). The coordinator states the goal, delegates implementation to subagents working in this checkout, and runs implementation workers one at a time so two never edit at once. Read-only reviewers may run alongside them.
- Run the full mutation proof (`node tests/mutate.mjs`, 132 mutants, about 9 hours) with `bash docs/work/1_sentence-sequence/proof-batches.sh`, as a background job of the session, and run nothing else in the browser beside it.
  - It runs batches of 11 mutants from its own copy in `tmp/proof-final/`, and the same command resumes it, so a session end loses only the batch that was running (about 55 minutes).
  - It rechecks every input but Markdown at start, after each batch and at the end, so change only Markdown files while it runs.
  - The proof is clean only when the runner exits 0 and `all.done` says CLEAN. An errored or flagged mutant usually means a broken environment: delete that batch's `.done` and run the command again.
  - Move an old `tmp/proof-final/` aside before a new proof; the runner refuses a folder it did not set up. Never move aside a folder whose runner may still be running, or whose proof should resume: an older runner resumes from its own copy there, as the plan of the proof says.
  - Why: session ends stopped full proofs on 2026-10-22 and on 2026-10-25, the second started as a separate hidden process, and on 2026-10-22 another lost its browsers after 26 mutants.
