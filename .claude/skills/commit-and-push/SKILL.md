---
name: commit-and-push
description: Verify the project (lint + typecheck + boundary check + tests) before committing and pushing changes. Trigger with "commit and push", "commit this", "ship this", or before any push to the gym-tracker-mobile repo.
---

# Commit and push

This project gates every run script on `npm run verify` (lint + typecheck + boundaries + tests) via npm `pre*` hooks — treat a commit/push the same way: never commit code that hasn't passed verify.

Invoking this skill IS the user's confirmation to commit and push — don't ask for approval again before either step.

## Steps

1. Run `npm run verify` (lint + typecheck + `test:boundaries` + `test`) from the project root. Fix any failures before continuing — do not commit code that fails verify.
2. Review the changes (`git status`, `git diff`) and stage only the files relevant to the task.
3. Commit with a message describing the *why*, not just the *what*.
4. Push straight away — no separate confirmation needed.
