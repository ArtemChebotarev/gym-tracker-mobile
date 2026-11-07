# state

State layer: TanStack Query for reading and writing data through `usecases` (queries for reads, mutations for writes), and a Zustand store for drafts that survive navigation between screens.

See 07 · Persistence Layer Contract, "Layers" section.

## Where the repositories come from

`bootstrap.ts` brings the one `RepositorySet` the app reads through up at startup: open the
SQLite database, apply the migrations this build carries (069, which is also what puts the
exercise catalog in it — 067(2)), then hand it over. `components/StorageGate.tsx` is what it is
handed to — the gate holds the splash and mounts no screen until the bootstrap has settled (task
111), and then renders the `RepositoriesProvider` of `repositories.tsx` around everything below
(task 115). Nothing reads storage any other way: `useRepositories()` throws when there is no
provider above it, so a screen that somehow rendered outside the gate fails loudly instead of
showing empty lists.

`exerciseLibraryStore.ts`, `mesocycleStore.ts`, `workoutStore.ts` and `backupStore.ts` are the
composition roots: which repositories of that set each use case reads through. They are hooks,
because that is how the set is reached — but what they hand to `usecases/` is still a plain narrow
`Deps` object, and nothing below `state/` knows React exists.

A test renders its own set instead — one per test, through `withRepositories()` in
`__tests__/fixtures/renderWithRepositories.tsx`.

Nothing here seeds anything any more (task 112). The catalog arrives as a migration, and
mesocycles arrive because the user made them — a clean install starts with an empty list, and
the stub mesocycles are a test fixture (`__tests__/fixtures/mesocycleMocks.ts`).

## Logging (task 141.1)

`logger.ts` is the app's one `Logger` (port and entries in `domain/logging.ts`). It starts with no sinks, so tests write nowhere; `app/_layout.tsx` installs the real ones at startup through `defaultLogSinks.ts` — the log file (`storage/fileLogSink.ts`) always, the console too in development. Failures reach it from three places and nowhere else: `queryClient.ts` (`QueryCache` / `MutationCache` `onError`, named by the `meta.operation` every `useMutation` here carries), `useStorageBootstrap.ts`, and — from task 141.2 — the error boundary. Two levels only, `error` and `warn`; entries hold ids and event names, never what the user typed. The debug screen's "Export logs" hands the files to the share sheet (`useExportLogs.ts`).

## Telemetry (GT-243, GT-246)

Anonymous product analytics, to see whether people train and come back in their second week.
`telemetry.ts` is the one way an event leaves the phone: `track(event, props)`, typed against the
catalog in `domain/telemetry.ts` — an event not named there cannot be sent. The SDK (PostHog,
EU cloud) sits behind `posthogTelemetryClient.ts`, so replacing it touches that file only.

Only a build that carries `EXPO_PUBLIC_POSTHOG_KEY` sends anything, and only the EAS `production`
profile sets it (`eas.json`) — TestFlight and App Store builds. Local builds (`npm run ios`,
`ios:device`, `ios:device:release`) have no key, and a development build does not send even with
one (`defaultTelemetry.ts`). Tests install no client and send nothing.

To check events end to end from a development build, put the key and
`EXPO_PUBLIC_TELEMETRY_IN_DEV=1` into a git-ignored `.env.local` and restart Metro; delete the file
to stop. Events sent this way land in the same PostHog project, so do it only before real users
are counted, or filter those events out.

### What is collected

This list is what the privacy policy and the App Store privacy labels describe. Adding an event
or a property means updating both.

- **Events:**
  - `app_opened` — a cold start or a return from the background (`useAppOpenedTelemetry.ts`).
  - `cycle_created` — a cycle was saved (`useConfirmMesocycleDraft.ts`,
    `useConfirmTemplateDraft.ts`, `useConfirmCopyWeekDraft.ts`).
  - `workout_completed` — a day was finished with work logged in it, by Finish workout or Skip
    workout (`workoutTelemetry.ts`). A day closed with nothing logged is not sent.
- **Event properties:**
  - `cycle_created.source` — `scratch`, `template` or `copyWeek`: which flow built the cycle.
  - `workout_completed.type` — `strength`, or `hybrid` when a power, interval or mobility
    exercise was done that day.
  - Nothing else: kinds, counts and flags only — never a database id, a template or exercise
    name, a weight or anything the user typed.
- **Identity:** a random id the SDK creates on first launch and keeps in the app's files. No
  account, no email, no IDFA/advertising id, `identify()` is never called. A reinstall makes a
  new id.
- **Device context the SDK attaches to every event:** app version and build, bundle id, OS name
  and version, device manufacturer and model, whether it is a simulator, screen width and height,
  locale, time zone, SDK name and version. PostHog also keeps the first and latest of these on
  the anonymous person profile (`Initial app version`, `Latest OS`, …).
- **Not collected:** screen views, taps (autocapture), app lifecycle events, session recordings,
  crashes and errors, feature-flag calls, surveys, location (GeoIP lookup is off).
- **Network:** the request's IP address reaches PostHog's servers as with any request; the
  project's "Discard client IP data" setting keeps it from being stored.

App Store privacy label, from the list above: _Usage Data → Product Interaction_ and
_Identifiers → Device ID_ (the SDK's random id), both used for _Analytics_, **not linked** to the
user, **not used for tracking**.
