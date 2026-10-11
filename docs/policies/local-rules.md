# Local rules: animation

These rules hold only in this repo. They add to the fleet constitution in AGENTS.md.

- Work directly on `main`, with no worktrees or side branches (owner directive, 2026-10-11: "act as orchestrator and just work on main for everything. Set goal and use subagents"). The coordinator states the goal, delegates implementation to subagents working in this checkout, and runs implementation workers one at a time so two never edit at once. Read-only reviewers may run alongside them.
