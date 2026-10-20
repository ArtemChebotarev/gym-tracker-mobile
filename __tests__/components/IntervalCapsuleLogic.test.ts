import { intervalCapsule } from '@components/IntervalCapsuleLogic';
import { ChevronsRightIcon } from '@design/icons/ChevronsRightIcon';
import { HourglassIcon } from '@design/icons/HourglassIcon';
import { PulseIcon } from '@design/icons/PulseIcon';
import {
  intervalTimerAt,
  pauseIntervalTimer,
  startIntervalTimer,
} from '@domain/intervalTimerRules';
import type { ActiveIntervalTimer, IntervalTimerExercise } from '@state/intervalTimerStore';

const T0 = 1_000_000;
const S = 1000;
const ROUNDS = [1, 2, 3].map((roundNumber) => ({ roundNumber, workSec: 120, restSec: 45 }));
const EXERCISE: IntervalTimerExercise = {
  sessionId: 'session',
  sessionExerciseId: 'bag',
  name: 'Heavy bag',
  totalRounds: 3,
  loggedRoundNumbers: [],
};
const ACTIONS = {
  pause: jest.fn(),
  resume: jest.fn(),
  skipRest: jest.fn(),
  dismiss: jest.fn(),
  open: jest.fn(),
};

function at(sec: number): ActiveIntervalTimer {
  return {
    exercise: EXERCISE,
    timer: intervalTimerAt(startIntervalTimer(ROUNDS, 5, T0), T0 + sec * S),
  };
}

describe('intervalCapsule (canvas 3.2)', () => {
  test('work: the round and its time, Pause, no Skip; a tap opens the timer', () => {
    const sec = 5 + 120 + 45 + 36;
    const capsule = intervalCapsule(at(sec), T0 + sec * S, ACTIONS);
    expect(capsule).toMatchObject({
      state: 'running',
      icon: PulseIcon,
      title: '1:24',
      caption: 'Work · Heavy bag · 2 of 3',
      onPause: ACTIONS.pause,
      onPress: ACTIONS.open,
      accessibilityLabel: 'Open interval timer',
    });
    expect(capsule.onSkip).toBeUndefined();
    // The ring runs down by itself to the end of the work.
    expect(capsule.runsOutAt).toBe(T0 + (5 + 120 + 45 + 120) * S);
  });

  test('rest: the next round, Skip and Pause', () => {
    const sec = 5 + 120 + 3;
    expect(intervalCapsule(at(sec), T0 + sec * S, ACTIONS)).toMatchObject({
      icon: HourglassIcon,
      title: '0:42',
      caption: 'Rest · round 2 next',
      onSkip: ACTIONS.skipRest,
      onPause: ACTIONS.pause,
    });
  });

  test('Get ready: the round it leads into', () => {
    expect(intervalCapsule(at(1), T0 + S, ACTIONS)).toMatchObject({
      icon: ChevronsRightIcon,
      title: '0:04',
      caption: 'Get ready · round 1 next',
    });
  });

  test('paused: the phase kept, the time held, Resume', () => {
    const sec = 5 + 36;
    const paused = pauseIntervalTimer(at(sec).timer, T0 + sec * S);
    const capsule = intervalCapsule({ exercise: EXERCISE, timer: paused }, T0 + 999 * S, ACTIONS);
    expect(capsule).toMatchObject({
      state: 'paused',
      icon: PulseIcon,
      title: '1:24',
      caption: 'Paused · Heavy bag · 1 of 3',
      onResume: ACTIONS.resume,
    });
    expect(capsule.runsOutAt).toBeUndefined();
  });

  test('done while minimised: the exercise done, its rounds logged, a cross; a tap opens the summary', () => {
    expect(intervalCapsule(at(10_000), T0 + 10_000 * S, ACTIONS)).toMatchObject({
      state: 'finished',
      title: 'Heavy bag done',
      caption: '3 of 3 rounds logged',
      onDismiss: ACTIONS.dismiss,
      onPress: ACTIONS.open,
    });
  });
});
