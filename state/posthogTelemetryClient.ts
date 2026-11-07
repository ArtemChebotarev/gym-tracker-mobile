// PostHog behind the telemetry port (GT-246). Everything the SDK can collect by itself is turned
// off, so what reaches PostHog is our own events plus the device context the SDK attaches to each
// (app version and build, OS and its version, device model, locale, time zone) — the list in
// state/README.md, "Telemetry", which the privacy labels follow.
//
// - No lifecycle events, autocapture, session replay, surveys or error tracking.
// - No feature flags: nothing asks PostHog what to do.
// - No GeoIP: the city/country lookup from the request's IP is skipped.
// - A person profile for the anonymous id, so retention and cohorts work; the SDK's random id is
//   the only identity there is, and `identify()` is never called.

import PostHog from 'posthog-react-native';

import type { TelemetryClient } from '@domain/telemetry';

/** The project lives in PostHog's EU cloud. */
const POSTHOG_HOST = 'https://eu.i.posthog.com';

export function createPostHogTelemetryClient(apiKey: string): TelemetryClient {
  const posthog = new PostHog(apiKey, {
    host: POSTHOG_HOST,
    captureAppLifecycleEvents: false,
    enableSessionReplay: false,
    errorTracking: { autocapture: false },
    preloadFeatureFlags: false,
    disableRemoteFeatureFlags: true,
    sendFeatureFlagEvent: false,
    disableSurveys: true,
    disableGeoip: true,
    personProfiles: 'always',
  });

  return {
    capture(event, properties) {
      posthog.capture(event, properties);
    },
  };
}
