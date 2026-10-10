# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# GymTracker — project context

Documentation and comments are written in English.

Source of requirements — Notion, page/database **"GymTracker — Product Spec"**. The spec sections (Scope, Domain Model, Persistence Layer Contract, Screens & Navigation, etc.) live as subpages inside it.

If asked to "take a task" or "do the task", use the `take-task` skill.

Project folder on disk: `~/gym-tracker-mobile` (git repository). To commit and push changes, use the `commit-and-push` skill.

# Code style

File organization and code-splitting conventions — domain modules, screens, styles/logic separation, `RootScreen` usage, reusing existing models — live in the `code-style` skill. Use it before writing any new source file, splitting an existing one, or reviewing a PR for file organization.

# Git workflow

`main` is protected on GitHub and moves between sessions (other PRs get merged independently of this one). Before starting *any* task that will touch files — and before branching off `main` for a commit — always run `git fetch origin` and sync local `main` with `origin/main` (fast-forward pull, or rebase/merge it into the working branch). Never assume the local `main` you last looked at is still current; a stale base is how avoidable merge conflicts and "fixed" bugs that are actually already-fixed-upstream get discovered late.

## Epic "Hybrid training" (GT-53) lives on the `hybrid` branch

Every task under the Backlog epic **Hybrid training** (GT-53), directly or through one of its stories, is developed on the long-lived branch `hybrid`, not on `main`. The epic changes the stored data model while `main` has to stay releasable and installable next to it on the phone without touching the real database. Everything outside the epic works as above, from `main`.

- **Is a task in the epic?** Walk its `Parent` up to the root. Root GT-53 → the rules below apply, to the story and to every task, spike and bug in it.
- **Base is `hybrid`.** `git fetch origin`, sync with `origin/hybrid` (not `main`), branch `task/<Key>-<short-name>` off it, open the PR with `gh pr create --base hybrid`, merge it into `hybrid`. This is the one exception to "always base PRs on `main`". Stacking on another task branch is still not allowed: wait for the dependency to merge into `hybrid`.
- **Two checkouts, two jobs.** The main checkout holds `main` and every task outside the epic; its `ios/` carries the real bundle ID and the signing setup, and nothing of the epic is ever built there. Epic tasks are done in a separate git worktree, `.claude/worktrees/hybrid`: `cd` into it and branch there (`git fetch origin && git checkout -b task/<Key>-<short-name> origin/hybrid`). Never `git checkout hybrid` in the main checkout — that puts hybrid code over the real app's `ios/`. The worktree is also the only place the hybrid app is built (`npm run ios:hybrid`, `ios:device:hybrid`): its `ios/` is generated for the hybrid bundle ID, and `native:check` refuses a build for the wrong one. Create it once with `git worktree add .claude/worktrees/hybrid hybrid`.
- **Do not `npm ci` in the worktree.** In a fresh checkout it takes 15+ minutes (about 2.3 GB). If `package-lock.json` is byte-identical to the main checkout's (`cmp package-lock.json <main checkout>/package-lock.json`), clone the modules instead — `cp -cR <main checkout>/node_modules node_modules`, an APFS clone, about ten seconds. If the lockfile differs (the epic changed dependencies), `npm ci` is the only correct answer.
- **`main` → `hybrid`.** `main` keeps moving (fixes, the release). When `origin/main` has commits `hybrid` lacks, bring them in with a merge commit (not a rebase), through a PR into `hybrid`, before starting the next task. Never merge `hybrid` into `main` outside the story "Merge hybrid into main": it carries its own checklist (migrations re-stamped, migration test run, backup, device QA).
- **Migrations stay one line — with one exception.** A migration generated on `hybrid` has only ever run on the hybrid test app's database (its own bundle ID, no real data), so — unlike one that reached `main` or the device — it may be regenerated, and **must** be when `main` has gained a migration since: its stamp has to be newer than every migration of `main`, or a database that already applied `main`'s will skip it silently. Do that in the merge story, never for a migration that has touched a real database. Hybrid migrations are generated like any other, with `npm run migration <name>`.
- **Never install a `hybrid` build over the real app.** The real data lives under `main`'s bundle ID; the hybrid test app has its own (GT-68). Putting `hybrid` onto the real bundle ID is the merge story's last step, after a backup.

# Data model changes go through migrations

**From 2026-09-21 the app runs on a real device, with real training data in it.** The database on that phone is the only copy — there is no export yet (task 070) and no backend. Every change to the stored data model is therefore a migration, and nothing else.

- The schema is `storage/sqlite/schema.ts`. Change it there, then run **`npm run migration <name>`** (snake_case, e.g. `npm run migration mesocycle_archived_at`), which writes a new migration into `drizzle/`. Never call `drizzle-kit generate` directly — bare, it invents a name, and the obvious fix for a bad name is the one thing you must not do. Never hand-write DDL, and never edit `drizzle/meta/` — it is the generator's state, and a snapshot that disagrees with the schema makes every later `generate` wrong.
- **Generate a migration once, and name it on the first try.** Deleting a migration and regenerating it gives the new file a new `when` stamp in `_journal.json`, and that stamp *is* the schema version a database records: any database that already ran the old one calls the new one unapplied and runs the same DDL a second time, which fails and leaves the app unable to open. Regenerating is never a rename — unlike EF Core, where a migration is identified by its own id. (25.09.2026, task «archive mesocycle». Shipped stamps are pinned by a test in `__tests__/storage/sqliteMigrations.test.ts` — adding a migration means adding its line there; changing a line means the change is wrong.) The only exception is a migration on the `hybrid` branch that has never touched a real database — see "Epic Hybrid training" above.
- **Never edit a migration that has already run anywhere real** — merged to `main`, or applied on the device. A database that applied it will not apply it again, so the edit reaches new installs only, and the two diverge silently. `0000_initial_schema.sql` and `0001_seed_catalog.sql` are frozen. (`0000` was hand-edited once, in task 111, while no build had yet run on a device. That window is closed.)
- Removing or renaming a column is a new migration, not a rewrite of the old one.
- Reference data — the exercise catalog — is a migration too: edit `domain/exerciseCatalog.ts`, then `npm run catalog:migration`. A test fails if the catalog and the migrations disagree.
- `__drizzle_migrations` inside the user's database is Drizzle's own bookkeeping. Never write to it. Clearing it does not reset anything; it makes the next launch try to re-apply `0000` against tables that already exist.
- A migration that drops, truncates or rewrites data the user could have created needs Artem's explicit approval first, stated as such. Adding a column, a table or an index does not.

Why the schema is versioned this way, and what refuses to open a database from a newer build — `storage/README.md` and 07 · Persistence Layer Contract, rule 7.

# Running and debugging

Always run these through `npm run <script>`, never call `expo`/`npx expo` directly — lint and typecheck run automatically as a `pre*` hook before `start`, `ios`, `ios:device`, `android`, and `web`, and calling the underlying Expo CLI command directly skips that check.

Full list of npm scripts and when to use them — in [README.md](README.md). Don't duplicate that information here, just follow the README.

Briefly:

- `npm run start` / `npm run start:clean` — dev server (Metro), the second variant clears the cache.
- `npm run ios` — build and run in the iOS simulator.
- `npm run ios:device` — build and run on a physical iPhone. The first time on the phone you need to manually trust the developer profile (Settings → General → VPN & Device Management → Trust) — without this step the launch fails with a signing error, this is not a bug.
- `npm run android` — build and run on an Android emulator/device. Requires `ANDROID_HOME` and `JAVA_HOME` in the environment (already set up for Artem in `~/.zshrc`, `JAVA_HOME` points to the JDK bundled with Android Studio: `/Applications/Android Studio.app/Contents/jbr/Contents/Home`).

Open the JS debugger (React Native DevTools): after any dev server, press `j` in the terminal — there is no separate script for this, nor an Expo CLI flag.
