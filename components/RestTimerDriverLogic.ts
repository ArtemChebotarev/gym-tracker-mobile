// What the floating capsule shows for the rest between sets (10.1 FR-5, GT-86; canvas 3.x,
// RestTimer and TimerCapsule): the time left over `Rest · set 3 next`, Skip and Pause; paused, the
// same with Resume; run out, `Rest is over` over `Set 3 next` with a cross to put it away. After an
// exercise's last set the rest is before the next exercise, and the capsule names it instead:
// `Rest · Heavy bag next`.

import type { TimerCapsuleProps } from '@design/components/TimerCapsule';
import { formatClock } from '@design/formatClock';
import { HourglassIcon } from '@design/icons/HourglassIcon';
import type { FinishedRest, RestNext, RestTimer } from '@domain/restTimer';
import { isRunning, restProgress, restRemainingSec } from '@domain/restTimerRules';

export type RestCapsuleActions = {
  skip: () => void;
  pause: () => void;
  resume: () => void;
  dismiss: () => void;
};

/** What comes after the rest, as the capsule's caption words it: `set 3`, `round 2`, or a name. */
function nextLabel(next: RestNext): string {
  switch (next.kind) {
    case 'set':
      return `set ${next.setNumber}`;
    case 'round':
      return `round ${next.roundNumber}`;
    case 'exercise':
      return next.name;
  }
}

/** `set 3 next` → `Set 3 next`: the line under `Rest is over` starts with it. */
function capitalized(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The title the end of a rest goes by, in the capsule and on the lock screen. */
export const REST_OVER_TITLE = 'Rest is over';

/**
 * The line under `Rest is over`, in the capsule and on the lock screen (GT-203): the exercise, then
 * what comes next in it, or the next exercise on its own.
 */
export function restOverCaption(next: RestNext): string {
  return next.kind === 'exercise'
    ? `${next.name} next`
    : `${next.name} · ${capitalized(`${nextLabel(next)} next`)}`;
}

/** The capsule for the rest in `timer` or `finished` at `now`; `null` when there is neither. */
export function restCapsule(
  rest: { timer: RestTimer | null; finished: FinishedRest | null },
  now: number,
  actions: RestCapsuleActions,
): TimerCapsuleProps | null {
  const { timer, finished } = rest;
  if (timer !== null) {
    const running = isRunning(timer);
    const next = `${nextLabel(timer.next)} next`;
    return {
      state: running ? 'running' : 'paused',
      icon: HourglassIcon,
      title: formatClock(restRemainingSec(timer, now)),
      caption: running ? `Rest · ${next}` : `Paused · ${next}`,
      progress: restProgress(timer, now),
      // Running, the ring runs down by itself to the end of the rest — smoothly (ProgressRing).
      ...(timer.endsAt !== undefined ? { runsOutAt: timer.endsAt } : {}),
      onSkip: actions.skip,
      onPause: actions.pause,
      onResume: actions.resume,
    };
  }
  if (finished !== null) {
    return {
      state: 'finished',
      icon: HourglassIcon,
      title: REST_OVER_TITLE,
      caption: restOverCaption(finished.next),
      progress: 0,
      onDismiss: actions.dismiss,
    };
  }
  return null;
}
