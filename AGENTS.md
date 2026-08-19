# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# GymTracker — project context

Documentation and comments are written in English.

Source of requirements — Notion, page/database **"GymTracker — Product Spec"**. The spec sections (Scope, Domain Model, Persistence Layer Contract, Screens & Navigation, etc.) live as subpages inside it.

Tasks are tracked in the Notion **Tasks** database (a child database of the same page), numbered 001, 002, ... Statuses: "Not started" → "In progress" → "Done".

If asked to "take a task" or "do the task":
1. Find the task in the Tasks database by number/name.
2. Move it to "In progress" before starting work.
3. Read the related Product Spec sections if the task references them.
4. Complete the Definition of Done from the task description.
5. After checking the DoD, describe what was done and wait for my approval.
6. After approval, move the status to Done.

Notion access requires a connected Notion MCP server (connected by default in Cowork; in Claude Code — add it via `claude mcp add`, see the Claude Code MCP docs).

Project folder on disk: `~/gym-tracker-mobile` (git repository).

# Running and debugging

Full list of npm scripts and when to use them — in [README.md](README.md). Don't duplicate that information here, just follow the README.

Briefly:
- `npm run start` / `npm run start:clean` — dev server (Metro), the second variant clears the cache.
- `npm run ios` — build and run in the iOS simulator.
- `npm run ios:device` — build and run on a physical iPhone. The first time on the phone you need to manually trust the developer profile (Settings → General → VPN & Device Management → Trust) — without this step the launch fails with a signing error, this is not a bug.
- `npm run android` — build and run on an Android emulator/device. Requires `ANDROID_HOME` and `JAVA_HOME` in the environment (already set up for Artem in `~/.zshrc`, `JAVA_HOME` points to the JDK bundled with Android Studio: `/Applications/Android Studio.app/Contents/jbr/Contents/Home`).

Open the JS debugger (React Native DevTools): after any dev server, press `j` in the terminal — there is no separate script for this, nor an Expo CLI flag.
