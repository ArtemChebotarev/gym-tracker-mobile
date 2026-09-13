# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# GymTracker — project context

Documentation and comments are written in English.

Source of requirements — Notion, page/database **"GymTracker — Product Spec"**. The spec sections (Scope, Domain Model, Persistence Layer Contract, Screens & Navigation, etc.) live as subpages inside it.

If asked to "take a task" or "do the task", use the `take-task` skill.

Project folder on disk: `~/gym-tracker-mobile` (git repository). To commit and push changes, use the `commit-and-push` skill.

# Code organization

One file, one responsibility. Don't mix a domain module's type definitions with its business logic (validators, converters, etc.) in the same file — split them, e.g. `domain/mesocycle.ts` (types) + `domain/mesocycleValidators.ts` (validators for those types). Name the logic file after the model file it belongs to (`<model>Validators.ts`, `<model>Converters.ts`, ...). Mirror the split in `__tests__/` so each source file has its own matching test file.

**Screens keep the same split, one level up.** A screen file (`app/**`, or a screen-level component under `components/`) holds only JSX/rendering wiring. Pull its `StyleSheet.create()` block out into `<ScreenName>Styles.ts`, and any pure, non-JSX helper functions (formatters, derived values, predicates) into `<ScreenName>Logic.ts`. Mirror the split in `__tests__/` the same way the domain rule does. This does *not* apply to `design/components/*` — those are small, single-purpose primitives where component + styles together in one file is the established, tested pattern; it's screens (composite, often carrying real business logic) where the split earns its keep. Don't create an empty file just to have one — a screen with nothing to extract (no helpers beyond JSX) doesn't need a Logic file.

Every root tab screen (Today, Mesocycles, Library, ...) renders through `design/components/RootScreen` for its title and top frame — it owns the safe-area inset, screen padding, and title row so the title lands at the exact same position on every tab (08.0 · Design SDK documents `type/screen-title` as "Заголовок корневого экрана" — singular, one shared treatment). Never hand-roll a root screen's own `SafeAreaView` + title styling.

Reuse existing models, types, classes, and constants instead of recreating them. Before adding a new type or a runtime constant that represents a domain concept, check whether `domain/` (or the relevant sibling layer — `repositories/`, an existing `storage/` adapter, etc.) already defines it, and import that instead of writing a second copy — e.g. a repository that needs every value of a domain enum should reuse a constant exported from the domain module that owns that type, not hand-list the values again. A second hand-written copy of the same values silently drifts from the original the next time it changes. If you deliberately don't reuse an existing model (the shapes only look similar but represent different concepts, reusing it would violate a layer boundary, etc.), say why in the PR summary.

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
