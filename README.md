# GymTracker

## Running and debugging

| Command               | What it does                                                                    |
| --------------------- | ------------------------------------------------------------------------------- |
| `npm run start`       | Starts the Metro dev server (QR code, binds to simulator/device)                |
| `npm run start:clean` | Same, but clears the Metro cache (`-c`) — use if the bundle build behaves oddly |
| `npm run ios`         | Builds and runs the app in the iOS simulator                                    |
| `npm run ios:device`  | Builds and runs the app on a connected physical iPhone                          |
| `npm run ios:device:release` | Same, as a Release build — runs without the dev server           |
| `npm run android`     | Builds and runs the app on an Android emulator/device (requires JDK installed)  |
| `npm run web`         | Starts the dev server and opens the browser version                             |

Open the JS debugger (React Native DevTools): run `npm run start` (or any of the `ios`/`android`/`web` commands — they also start the dev server) and press `j` in the terminal running the Expo CLI.

### Linting, formatting, type checking, and tests

| Command                   | What it does                                                           |
| ------------------------- | ---------------------------------------------------------------------- |
| `npm run lint`            | Runs ESLint across the project; fails on any error or warning          |
| `npm run typecheck`       | Runs `tsc --noEmit`                                                    |
| `npm test`                | Runs the Jest test suite once                                          |
| `npm run test:watch`      | Runs Jest in watch mode                                                |
| `npm run verify`          | Runs lint + typecheck + tests (gates every run below)                  |
| `npm run format`          | Formats the project with Prettier                                      |
| `npm run format:check`    | Checks formatting without writing changes                              |

`verify` runs automatically before every command in the table above (`start`, `start:clean`, `ios`, `ios:device`, `ios:device:release`, `android`, `web`) via npm's `pre*` script hooks — a lint, type, or test error stops the run before Metro/Xcode/Gradle even starts, the same way a failed `dotnet build` blocks `dotnet run`.

### Running on a physical iPhone

The first run on the phone requires manually trusting the developer profile once: **Settings → General → VPN & Device Management** → select the profile → **Trust**. After that, `npm run ios:device` installs and launches the app with no extra steps.

`npm run ios:device` builds Debug: the JS comes from the Metro dev server, so the app only starts while that server is running and reachable. To use the app away from the Mac — at the gym — build Release instead:

```
LANG=en_US.UTF-8 npm run ios:device:release
```

`LANG` is there because CocoaPods needs a UTF-8 locale to install. A Release build embeds the JS bundle, so nothing has to be running for the app to open. It also has no dev menu, which means no shake menu and no expo-sqlite inspector (Shift+M) — to read the database from a Release build, use **Xcode → Window → Devices and Simulators → Devices → the app → Download Container**.

Signing is the same either way. With a free Apple ID the provisioning profile expires seven days after it is issued, and the app stops launching until it is rebuilt with the phone connected; a paid Apple Developer account makes that a year. Rebuild before it expires rather than after, and do not delete the app — the database lives in its container and an install over the top keeps it.
