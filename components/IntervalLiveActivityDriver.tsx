import * as Linking from 'expo-linking';
import type { LiveActivity } from 'expo-widgets';
import { useEffect } from 'react';

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

// The interval timer's Live Activity (10.1 FR-6, GT-99) — PARKED: not mounted anywhere (GT-180,
// Artem 26.10.2026). Behind a locked screen iOS turns down the app's updates to it (research 10.3),
// and none of the layouts tried kept it right and in step with the app; the timer runs in the app
// only until it is taken up again. To bring it back, mount `<IntervalLiveActivityDriver />` next to
// IntervalLockScreenDriver in AppTabBar — nothing else imports the activity, so while it is
// unmounted the activity is never registered, started or updated.
//
// When mounted: the activity (components/IntervalTimerActivity) is started with the block, updated
// as a phase starts, pauses or runs again — its time and bar run by themselves in between — and
// ended with the block. Its Pause (Resume while paused) and Skip rest act on the timer; a tap on
// the rest of it opens the timer.
//
// The activity's calls go one after another, each catching its own failure: iOS turns down an
// update now and then — more so from the background — and one rejection in an unguarded chain made
// every later update skip, the lock screen frozen on 0:00 of the phase before (Artem on the phone,
// 20.10.2026). A failed update is tried once more a moment later (updateIntervalActivity).
//
// Draws nothing.

export function IntervalLiveActivityDriver() {
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
      activity = activity.then(async () => {
        await endIntervalActivities().catch(() => undefined);
        return null;
      });
    }

    update();
    const unsubscribe = useIntervalTimerStore.subscribe(update);
    const unlisten = onIntervalActivityAction((action) => {
      const store = useIntervalTimerStore.getState();
      const running = store.active?.timer.endsAt !== undefined;
      if (action === 'pause') {
        if (running) store.pause();
        else store.resume();
      } else {
        store.skipRest();
      }
    });
    return () => {
      unsubscribe();
      unlisten();
    };
  }, []);

  return null;
}
