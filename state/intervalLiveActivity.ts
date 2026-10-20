import { addUserInteractionListener, type LiveActivity } from 'expo-widgets';

import IntervalTimerActivity from '@components/IntervalTimerActivity';
import type {
  IntervalActivityAction,
  IntervalTimerActivityProps,
} from '@components/IntervalTimerActivityLogic';

// Starting, updating and ending the interval timer's Live Activity (10.1 FR-6), and hearing its
// buttons. Updates are local, from the app — no push: the activity is requested without a push
// token, so it needs no APNs entitlement (GT-94).

const ACTIONS: readonly IntervalActivityAction[] = ['pause', 'skipRest'];

/**
 * Starts the Live Activity of a timer. Ends every one still on the lock screen first: only one
 * timer runs at a time (FR-6), and a second start had left two of them there (GT-94, on the phone).
 * `url` opens the app at the timer when the activity is tapped.
 */
export async function startIntervalActivity(
  props: IntervalTimerActivityProps,
  url?: string,
): Promise<LiveActivity<IntervalTimerActivityProps>> {
  await endIntervalActivities();
  return IntervalTimerActivity.start(props, url);
}

/** How long a failed update waits before its one retry. */
const RETRY_MS = 1000;

/**
 * Updates `activity` with `props` — once more after a moment if iOS turned it down, which it does
 * now and then, more so from the background. Never rejects: one failed update must not stop the
 * ones after it (GT-99 — the lock screen froze on 0:00 of the phase before when it did).
 */
export async function updateIntervalActivity(
  activity: LiveActivity<IntervalTimerActivityProps> | null,
  props: IntervalTimerActivityProps,
): Promise<void> {
  if (activity === null) return;
  try {
    await activity.update(props);
  } catch {
    await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    await activity.update(props).catch(() => undefined);
  }
}

/** Ends every interval Live Activity there is — the timer is over, or one is about to start. */
export async function endIntervalActivities(): Promise<void> {
  await Promise.all(
    IntervalTimerActivity.getInstances().map((activity) => activity.end('immediate')),
  );
}

/**
 * Calls `onAction` with each tap on the Live Activity's buttons. The app is woken for it even with
 * the screen locked. Returns the unsubscribe.
 *
 * A tap's `source` is the ActivityKit id of the activity it was on, not the name it was created
 * with (expo-widgets' LiveActivityBanner) — so it is matched against the interval activities there
 * are now, which also drops a late tap on one already ended.
 */
export function onIntervalActivityAction(
  onAction: (action: IntervalActivityAction) => void,
): () => void {
  const subscription = addUserInteractionListener((event) => {
    const action = ACTIONS.find((known) => known === event.target);
    const ours = IntervalTimerActivity.getInstances().some(
      (activity) => activity.getId() === event.source,
    );
    if (ours && action !== undefined) {
      onAction(action);
    }
  });
  return () => subscription.remove();
}
