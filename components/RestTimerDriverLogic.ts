// What the floating capsule shows for the rest between sets (10.1 FR-5, GT-86; canvas 3.x,
// RestTimer and TimerCapsule): the time left over `Rest · set 3 next`, Skip and Pause; paused, the
// same with Resume; run out, `Rest is over` over `Set 3 next` with a cross to put it away.

import type { TimerCapsuleProps } from '@design/components/TimerCapsule';
import { formatClock } from '@design/formatClock';
import { HourglassIcon } from '@design/icons/HourglassIcon';
import type { FinishedRest, RestTimer } from '@domain/restTimer';
import { isRunning, restProgress, restRemainingSec } from '@domain/restTimerRules';

export type RestCapsuleActions = {
  skip: () => void;
  pause: () => void;
  resume: () => void;
  dismiss: () => void;
};

/** The capsule for the rest in `timer` or `finished` at `now`; `null` when there is neither. */
export function restCapsule(
  rest: { timer: RestTimer | null; finished: FinishedRest | null },
  now: number,
  actions: RestCapsuleActions,
): TimerCapsuleProps | null {
  const { timer, finished } = rest;
  if (timer !== null) {
    const running = isRunning(timer);
    const next = `set ${timer.nextSetNumber} next`;
    return {
      state: running ? 'running' : 'paused',
      icon: HourglassIcon,
      title: formatClock(restRemainingSec(timer, now)),
      caption: running ? `Rest · ${next}` : `Paused · ${next}`,
      progress: restProgress(timer, now),
      onSkip: actions.skip,
      onPause: actions.pause,
      onResume: actions.resume,
    };
  }
  if (finished !== null) {
    return {
      state: 'finished',
      icon: HourglassIcon,
      title: 'Rest is over',
      caption: `Set ${finished.nextSetNumber} next`,
      progress: 0,
      onDismiss: actions.dismiss,
    };
  }
  return null;
}
