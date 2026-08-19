# GymTracker

## Running and debugging

| Command | What it does |
| --- | --- |
| `npm run start` | Starts the Metro dev server (QR code, binds to simulator/device) |
| `npm run start:clean` | Same, but clears the Metro cache (`-c`) — use if the bundle build behaves oddly |
| `npm run ios` | Builds and runs the app in the iOS simulator |
| `npm run ios:device` | Builds and runs the app on a connected physical iPhone |
| `npm run android` | Builds and runs the app on an Android emulator/device (requires JDK installed) |
| `npm run web` | Starts the dev server and opens the browser version |

Open the JS debugger (React Native DevTools): run `npm run start` (or any of the `ios`/`android`/`web` commands — they also start the dev server) and press `j` in the terminal running the Expo CLI.

### Running on a physical iPhone

The first run on the phone requires manually trusting the developer profile once: **Settings → General → VPN & Device Management** → select the profile → **Trust**. After that, `npm run ios:device` installs and launches the app with no extra steps.
