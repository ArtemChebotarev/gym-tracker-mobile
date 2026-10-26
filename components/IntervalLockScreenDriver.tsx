import * as Linking from 'expo-linking';
import type { LiveActivity } from 'expo-widgets';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { keepAwakeForTimer, releaseTimer } from '@state/intervalSignal';
import {
  endIntervalActivities,
  onIntervalActivityAction,
  startIntervalActivity,
  updateIntervalActivity,
} from '@state/intervalLiveActivity';
import { type ActiveIntervalTimer, useIntervalTimerStore } from '@state/intervalTimerStore';
import { liveActivityIconUri } from '@state/liveActivityIcon';

import {
  activityStateKey,
  intervalActivityPropsOf,
  type IntervalTimerActivityProps,
} from './IntervalTimerActivityLogic';

// The interval timer behind a locked screen (10.1 FR-6, GT-99), the way the GT-94 spike found and
// the phone confirmed:
//
// - From a block's start until it is put away, a silent loop keeps the app awake
//   (state/intervalSignal): iOS would otherwise suspend it soon after the screen locks, and a
//   suspended app neither moves the timer on, nor beeps, nor logs its rounds. It is kept while
//   paused too — a Resume tapped on the lock screen has to find the app awake to play again.
// - The Live Activity (components/IntervalTimerActivity) is started with the block, updated as it
//   pauses, runs again or skips a rest — its time and cells run by themselves in between — resent as
//   the app comes back to the front, and ended with the block. Its Pause (Resume while paused) acts
//   on the timer; a tap on the rest of it opens the timer.
//
// The activity's calls go one after another, each catching its own failure: iOS turns down an
// update now and then — more so from the background — and one rejection in an unguarded chain made
// every later update skip, the lock screen frozen on 0:00 of the phase before (Artem on the phone,
// 20.10.2026). A failed update is tried once more a moment later (updateIntervalActivity).
//
// Draws nothing. It sits next to IntervalTimerDriver in the tab bar's overlay.

export function IntervalLockScreenDriver() {
  useEffect(() => {
    let block: ActiveIntervalTimer['exercise'] | null = null;
    let lastKey: string | undefined;
    let activity: Promise<LiveActivity<IntervalTimerActivityProps> | null> = Promise.resolve(null);
    // The app's icon in the shared directory, found as the first block starts (liveActivityIcon).
    let iconUri: string | undefined;
    const withIcon = (props: IntervalTimerActivityProps): IntervalTimerActivityProps =>
      iconUri === undefined ? props : { ...props, iconUri };

    function update() {
      const active = useIntervalTimerStore.getState().active;
      const now = Date.now();
      // A block started — a new one, or this one once more after End early.
      if (active !== null && active.exercise !== block) {
        block = active.exercise;
        lastKey = undefined;
        void keepAwakeForTimer();
        const props = intervalActivityPropsOf(active, now);
        if (props !== undefined) {
          activity = liveActivityIconUri()
            .then((uri) => {
              iconUri = uri;
              return startIntervalActivity(withIcon(props), Linking.createURL('/interval-timer'));
            })
            .catch(() => null);
        }
      }
      const key = activityStateKey(active?.timer);
      if (key === lastKey) return;
      lastKey = key;

      const props = active === null ? undefined : intervalActivityPropsOf(active, now);
      if (props !== undefined) {
        activity = activity.then(async (current) => {
          await updateIntervalActivity(current, withIcon(props));
          return current;
        });
        return;
      }
      // Over: done, ended early, or put away.
      block = active === null ? null : block;
      releaseTimer();
      activity = activity.then(async () => {
        await endIntervalActivities().catch(() => undefined);
        return null;
      });
    }

    update();
    const unsubscribe = useIntervalTimerStore.subscribe(update);
    // Back in front, the activity is brought up to date at once: an update sent from the
    // background may have been turned down, and the next one might be a phase away.
    const appState = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      lastKey = undefined;
      update();
    });
    // Its one button: Pause, Resume while paused.
    const unlisten = onIntervalActivityAction((action) => {
      const store = useIntervalTimerStore.getState();
      // SPIKE: Skip rest, in a rest only — a tap on its spot outside a rest does nothing.
      if (action === 'skipRest') {
        if (store.active?.timer.phase?.kind === 'rest') store.skipRest();
        return;
      }
      if (store.active?.timer.endsAt !== undefined) store.pause();
      else store.resume();
    });
    return () => {
      appState.remove();
      unsubscribe();
      unlisten();
    };
  }, []);

  return null;
}
