---
name: commit-and-push
description: Verify the project (lint + typecheck + tests) before committing and pushing changes. Trigger with "commit and push", "commit this", "ship this", or before any push to the gym-tracker-mobile repo.
---

# Commit and push

This project gates every run script on `npm run verify` (lint + typecheck + tests) via npm `pre*` hooks — treat a commit/push the same way: never commit code that hasn't passed verify.

Invoking this skill IS the user's confirmation to commit and push — don't ask for approval again before either step.

`main` is protected on GitHub (PR required, status checks required) — never commit or push directly to `main`. All work happens on a task/feature branch merged via PR.

## Steps

1. Check the current branch (`git branch --show-current`). If it's `main`, create and switch to a new branch first (e.g. `task/<NNN>-<short-name>` or `chore/<short-name>`) — do not commit on `main`.
2. Run `npm run verify` (lint + typecheck + `test`) from the project root. Fix any failures before continuing — do not commit code that fails verify.
3. Review the changes (`git status`, `git diff`) and stage only the files relevant to the task.
4. Commit with a message describing the *why*, not just the *what*.
5. Push the branch straight away — no separate confirmation needed. If no PR exists yet for this branch, open one against `main` (`gh pr create`).
