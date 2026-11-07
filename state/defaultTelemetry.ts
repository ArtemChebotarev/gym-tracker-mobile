// Whether this build sends telemetry (GT-246). Only a build that carries the PostHog key does,
// and the key is set for the EAS `production` profile alone (eas.json) — so TestFlight and App
// Store builds send, while `npm run ios`, `ios:device` and `ios:device:release` do not: they have
// no key. A development build never sends even with one, so a key in a local `.env` cannot mix
// test workouts into real numbers.
//
// The key is PostHog's public project key, the kind that ships inside every app that uses it —
// it can only send events to the project, not read them.

import { createPostHogTelemetryClient } from './posthogTelemetryClient';
import { setTelemetryClient } from './telemetry';

/** The key a build should send with, or none when this build must stay silent. */
export function telemetryApiKey(key: string | undefined, isDev: boolean): string | undefined {
  if (isDev) return undefined;
  const trimmed = key?.trim();
  return trimmed ? trimmed : undefined;
}

export function installDefaultTelemetry(): void {
  // Read as a literal `process.env.EXPO_PUBLIC_…` — that is the form Expo inlines at build time.
  const apiKey = telemetryApiKey(process.env.EXPO_PUBLIC_POSTHOG_KEY, __DEV__);
  if (apiKey === undefined) return;
  setTelemetryClient(createPostHogTelemetryClient(apiKey));
}
