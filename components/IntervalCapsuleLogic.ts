// What the floating capsule shows for a minimised interval timer (10.1 FR-6, GT-97; canvas 3.2,
// 2.5, 6.2): the phase's icon in the ring, the time left, and a caption — `Work · Heavy bag · 2 of
// 3`, `Rest · round 3 next`, `Get ready · round 3 next`, `Paused · Heavy bag · 2 of 3`. Work and
// Get ready have Pause, a rest Skip and Pause, paused Resume. Done, it reads `Heavy bag done` over
// how many rounds are logged, with a cross. A tap on its body opens the timer again.

import type { TimerCapsuleProps } from '@design/components/TimerCapsule';
import { formatClock } from '@design/formatClock';
import { ChevronsRightIcon } from '@design/icons/ChevronsRightIcon';
import { HourglassIcon } from '@design/icons/HourglassIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import { PulseIcon } from '@design/icons/PulseIcon';
import type { IntervalTimerPhase } from '@domain/intervalTimer';
import {
  intervalPhaseProgress,
  intervalPhaseRemainingSec,
  intervalPhaseShown,
  isIntervalTimerRunning,
} from '@domain/intervalTimerRules';
import type { ActiveIntervalTimer } from '@state/intervalTimerStore';

export type IntervalCapsuleActions = {
  pause: () => void;
  resume: () => void;
  skipRest: () => void;
  /** Puts away a timer that is done — what Back to workout does. */
  dismiss: () => void;
  /** Opens the timer's screen again. */
  open: () => void;
};

const PHASE_ICON: Record<IntervalTimerPhase['kind'], IconComponent> = {
  getReady: ChevronsRightIcon,
  work: PulseIcon,
  rest: HourglassIcon,
};

/** The capsule for the minimised timer `active` at `now`. */
export function intervalCapsule(
  active: ActiveIntervalTimer,
  now: number,
  actions: IntervalCapsuleActions,
): TimerCapsuleProps {
  const { exercise, timer } = active;
  const opens = { onPress: actions.open, accessibilityLabel: 'Open interval timer' };
  const phase = timer.phase;

  if (phase === undefined) {
    const logged = new Set([
      ...exercise.loggedRoundNumbers,
      ...timer.results.map((result) => result.roundNumber),
    ]).size;
    return {
      state: 'finished',
      icon: PulseIcon,
      title: `${exercise.name} done`,
      caption: `${logged} of ${exercise.totalRounds} rounds logged`,
      progress: 0,
      onDismiss: actions.dismiss,
      ...opens,
    };
  }

  const round = timer.rounds[phase.round];
  const after = timer.rounds[phase.round + 1];
  const where = `${exercise.name} · ${round?.roundNumber} of ${exercise.totalRounds}`;
  const running = isIntervalTimerRunning(timer);
  // A rest's last seconds are its Get ready (GT-176) — for the round after the rest.
  const shown = intervalPhaseShown(timer, now)?.kind ?? phase.kind;
  const leadsInto = phase.kind === 'rest' ? after : round;
  const caption = !running
    ? `Paused · ${where}`
    : shown === 'work'
      ? `Work · ${where}`
      : shown === 'rest'
        ? `Rest · round ${after?.roundNumber} next`
        : `Get ready · round ${leadsInto?.roundNumber} next`;

  const capsule: TimerCapsuleProps = {
    state: running ? 'running' : 'paused',
    icon: PHASE_ICON[shown],
    title: formatClock(intervalPhaseRemainingSec(timer, now)),
    caption,
    progress: intervalPhaseProgress(timer, now),
    onPause: actions.pause,
    onResume: actions.resume,
    ...opens,
  };
  if (running && timer.endsAt !== undefined) {
    capsule.runsOutAt = timer.endsAt;
  }
  if (phase.kind === 'rest') {
    capsule.onSkip = actions.skipRest;
  }
  return capsule;
}
