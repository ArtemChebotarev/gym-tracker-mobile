// `app_opened` (GT-243) — what second-week return is counted from. Sent on a cold start and when
// the app comes back after a long enough time in the background: the app usually stays in memory
// between workouts, so counting cold starts alone would miss most of the openings.
//
// A short background trip is not an opening. iOS counts a locked screen as `background`, and the
// screen goes dark on every rest between sets — in one logged workout that was 30 events with
// gaps of 3 seconds to 8 minutes. 30 minutes matches PostHog's own session window, so one
// `app_opened` is about one session, and the longest pause inside a workout stays well under it.
//
// The clock starts when the app leaves the screen, not at the last event sent — otherwise a
// screen locked every 5 minutes would still send once per threshold.
//
// Pulling down Notification Center or Control Center moves the app to `inactive` and back without
// it ever leaving the screen — not an opening either.

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { track } from './telemetry';

export const APP_OPENED_BACKGROUND_THRESHOLD_MS = 30 * 60 * 1000;

export function useAppOpenedTelemetry(): void {
  useEffect(() => {
    // Held in memory only: a killed app starts cold, and a cold start always sends.
    let backgroundedAt: number | undefined;
    // Not yet counted when the app starts anywhere but on screen.
    let awaitingColdOpen = AppState.currentState !== 'active';
    if (!awaitingColdOpen) track('app_opened');

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        backgroundedAt ??= Date.now();
      } else if (next === 'active') {
        const away = backgroundedAt === undefined ? 0 : Date.now() - backgroundedAt;
        const longEnough = away >= APP_OPENED_BACKGROUND_THRESHOLD_MS;
        backgroundedAt = undefined;
        if (awaitingColdOpen || longEnough) {
          awaitingColdOpen = false;
          track('app_opened');
        }
      }
    });
    return () => subscription.remove();
  }, []);
}
