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

# Data model changes go through migrations

**From 2026-09-21 the app runs on a real device, with real training data in it.** The database on that phone is the only copy — there is no export yet (task 070) and no backend. Every change to the stored data model is therefore a migration, and nothing else.

- The schema is `storage/sqlite/schema.ts`. Change it there, then run `npx drizzle-kit generate`, which writes a new migration into `drizzle/`. Never hand-write DDL, and never edit `drizzle/meta/` — it is the generator's state, and a snapshot that disagrees with the schema makes every later `generate` wrong.
- **Generate a migration once.** Name it on the first try — `npx drizzle-kit generate --name <what_it_does>`. Deleting a migration and regenerating it gives the new file a new `when` stamp in `_journal.json`, and that stamp *is* the schema version a database records: any database that already ran the old one calls the new one unapplied and runs the same DDL a second time, which fails and leaves the app unable to open. Regenerating is never a rename. (25.09.2026, task «archive mesocycle» — the stamps are pinned by a test in `__tests__/storage/sqliteMigrations.test.ts` now.)
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
