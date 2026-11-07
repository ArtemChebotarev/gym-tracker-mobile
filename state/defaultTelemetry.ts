// Whether this build sends telemetry (GT-246). Only a build that carries the PostHog key does,
// and the key is set for the EAS `production` profile alone (eas.json) — so TestFlight and App
// Store builds send, while `npm run ios`, `ios:device` and `ios:device:release` do not: they have
// no key.
//
// A development build stays silent even with a key, so test workouts do not mix into real
// numbers — unless `EXPO_PUBLIC_TELEMETRY_IN_DEV=1` says otherwise. That switch is for checking
// events end to end while telemetry is being built (GT-246, GT-247): it goes into a local,
// git-ignored `.env.local` next to the key, and deleting that file turns it off again. Nothing
// committed sets it.
//
// The key is PostHog's public project key, the kind that ships inside every app that uses it —
// it can only send events to the project, not read them.

import { createPostHogTelemetryClient } from './posthogTelemetryClient';
import { setTelemetryClient } from './telemetry';

/** The key a build should send with, or none when this build must stay silent. */
export function telemetryApiKey(
  key: string | undefined,
  isDev: boolean,
  sendFromDev: boolean,
): string | undefined {
  if (isDev && !sendFromDev) return undefined;
  const trimmed = key?.trim();
  return trimmed ? trimmed : undefined;
}

export function installDefaultTelemetry(): void {
  // Read as literal `process.env.EXPO_PUBLIC_…` — that is the form Expo inlines at build time.
  const apiKey = telemetryApiKey(
    process.env.EXPO_PUBLIC_POSTHOG_KEY,
    __DEV__,
    process.env.EXPO_PUBLIC_TELEMETRY_IN_DEV === '1',
  );
  if (apiKey === undefined) return;
  setTelemetryClient(createPostHogTelemetryClient(apiKey));
}
