# Local rules: animation

These rules hold only in this repo. They add to the fleet constitution in AGENTS.md.

- Work directly on `main`, with no worktrees or side branches (owner directive, 2026-10-11: "act as orchestrator and just work on main for everything. Set goal and use subagents"). The coordinator states the goal, delegates implementation to subagents working in this checkout, and runs implementation workers one at a time so two never edit at once. Read-only reviewers may run alongside them.
- Run the full mutation proof (`node tests/mutate.mjs`, 132 mutants, about 9 hours) with `bash docs/work/1_sentence-sequence/proof-batches.sh`, as a background job of the session, and run nothing else in the browser beside it.
  - It runs batches of 11 mutants from its own copy in `tmp/proof-final/`, and the same command resumes it with that copy and the Node it recorded, so a session end loses only the batch that was running (about 55 minutes).
  - It proves a frozen snapshot of the commit: it refuses to start while the checkout has changes other than Markdown, then extracts HEAD with a copy of `node_modules` into `tmp/proof-final/tree/` and runs every gate there, so the checkout may change while it runs. It rechecks the snapshot, its own copy and Node at start, after each batch and at the end.
  - It refuses to start, and to start a batch, while another proof runner or `tests/mutate.mjs` runs, and `tmp/mutation.lock` keeps a second proof from starting beside it. A lock whose runner has ended is moved aside by hand, as the runner's message says.
  - The proof is clean only when `all.done` says CLEAN, which only a finished run writes, since a runner killed here can still report exit 0, and once the kills printed at the timing lines in `docs/gates.md` are audited (F98–F100). An errored or flagged mutant usually means a broken environment: delete that batch's `.done` and run the command again.
  - Move an old `tmp/proof-final/` aside before a new proof; the runner refuses a folder it did not set up. Never move aside a folder whose runner may still be running, or whose proof should resume: an older runner resumes from its own copy there, as the plan of the proof says.
  - Why: session ends stopped full proofs on 2026-10-22 and on 2026-10-25, the second started as a separate hidden process, and on 2026-10-22 another lost its browsers after 26 mutants.
