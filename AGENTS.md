# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# GymTracker — project context

Documentation and comments are written in English.

Source of requirements — Notion, page/database **"GymTracker — Product Spec"**. The spec sections (Scope, Domain Model, Persistence Layer Contract, Screens & Navigation, etc.) live as subpages inside it.

If asked to "take a task" or "do the task", use the `take-task` skill.

Project folder on disk: `~/gym-tracker-mobile` (git repository). To commit and push changes, use the `commit-and-push` skill.

# Git workflow

`main` is protected on GitHub and moves between sessions (other PRs get merged independently of this one). Before starting *any* task that will touch files — and before branching off `main` for a commit — always run `git fetch origin` and sync local `main` with `origin/main` (fast-forward pull, or rebase/merge it into the working branch). Never assume the local `main` you last looked at is still current; a stale base is how avoidable merge conflicts and "fixed" bugs that are actually already-fixed-upstream get discovered late.

# Running and debugging

Always run these through `npm run <script>`, never call `expo`/`npx expo` directly — lint and typecheck run automatically as a `pre*` hook before `start`, `ios`, `ios:device`, `android`, and `web`, and calling the underlying Expo CLI command directly skips that check.

Full list of npm scripts and when to use them — in [README.md](README.md). Don't duplicate that information here, just follow the README.

Briefly:

- `npm run start` / `npm run start:clean` — dev server (Metro), the second variant clears the cache.
- `npm run ios` — build and run in the iOS simulator.
- `npm run ios:device` — build and run on a physical iPhone. The first time on the phone you need to manually trust the developer profile (Settings → General → VPN & Device Management → Trust) — without this step the launch fails with a signing error, this is not a bug.
- `npm run android` — build and run on an Android emulator/device. Requires `ANDROID_HOME` and `JAVA_HOME` in the environment (already set up for Artem in `~/.zshrc`, `JAVA_HOME` points to the JDK bundled with Android Studio: `/Applications/Android Studio.app/Contents/jbr/Contents/Home`).

Open the JS debugger (React Native DevTools): after any dev server, press `j` in the terminal — there is no separate script for this, nor an Expo CLI flag.
