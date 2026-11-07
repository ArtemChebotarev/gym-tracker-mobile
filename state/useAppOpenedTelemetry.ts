// `app_opened` (GT-243) — what second-week return is counted from. Sent on a cold start and on
// every return from the background: the app usually stays in memory between workouts, so counting
// cold starts alone would miss most of the openings.
//
// Only a return from `background` counts. On iOS, pulling down Notification Center or Control
// Center moves the app to `inactive` and back without it ever leaving the screen — not an opening.

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { track } from './telemetry';

export function useAppOpenedTelemetry(): void {
  useEffect(() => {
    // Not yet counted when the app starts anywhere but on screen.
    let awaitingOpen = AppState.currentState !== 'active';
    if (!awaitingOpen) track('app_opened');

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        awaitingOpen = true;
      } else if (next === 'active' && awaitingOpen) {
        awaitingOpen = false;
        track('app_opened');
      }
    });
    return () => subscription.remove();
  }, []);
}
