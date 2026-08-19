# GymTracker

## Running and debugging

| Command               | What it does                                                                    |
| --------------------- | ------------------------------------------------------------------------------- |
| `npm run start`       | Starts the Metro dev server (QR code, binds to simulator/device)                |
| `npm run start:clean` | Same, but clears the Metro cache (`-c`) — use if the bundle build behaves oddly |
| `npm run ios`         | Builds and runs the app in the iOS simulator                                    |
| `npm run ios:device`  | Builds and runs the app on a connected physical iPhone                          |
| `npm run android`     | Builds and runs the app on an Android emulator/device (requires JDK installed)  |
| `npm run web`         | Starts the dev server and opens the browser version                             |

Open the JS debugger (React Native DevTools): run `npm run start` (or any of the `ios`/`android`/`web` commands — they also start the dev server) and press `j` in the terminal running the Expo CLI.

### Linting, formatting, and type checking

| Command                | What it does                                                  |
| ---------------------- | ------------------------------------------------------------- |
| `npm run lint`         | Runs ESLint across the project; fails on any error or warning |
| `npm run typecheck`    | Runs `tsc --noEmit`                                           |
| `npm run verify`       | Runs lint + typecheck (this is what gates every run below)    |
| `npm run format`       | Formats the project with Prettier                             |
| `npm run format:check` | Checks formatting without writing changes                     |

`verify` runs automatically before every command in the table above (`start`, `start:clean`, `ios`, `ios:device`, `android`, `web`) via npm's `pre*` script hooks — a lint or type error stops the run before Metro/Xcode/Gradle even starts, the same way a failed `dotnet build` blocks `dotnet run`.

### Running on a physical iPhone

The first run on the phone requires manually trusting the developer profile once: **Settings → General → VPN & Device Management** → select the profile → **Trust**. After that, `npm run ios:device` installs and launches the app with no extra steps.
