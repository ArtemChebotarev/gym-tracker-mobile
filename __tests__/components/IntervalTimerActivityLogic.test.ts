import {
  activityStateKey,
  intervalActivityLook,
  intervalActivityProps,
  intervalActivityPropsOf,
} from '@components/IntervalTimerActivityLogic';
import { COLORS } from '@design/tokens';
import {
  endIntervalTimerEarly,
  intervalTimerAt,
  pauseIntervalTimer,
  resumeIntervalTimer,
  startIntervalTimer,
} from '@domain/intervalTimerRules';
import type { ActiveIntervalTimer, IntervalTimerExercise } from '@state/intervalTimerStore';

const PHASE = {
  phase: 'Work',
  detail: 'Heavy bag · round 2 of 3',
  phaseStartedAt: 1_000,
  phaseEndsAt: 21_000,
  canSkipRest: false,
};

describe('intervalActivityProps', () => {
  test('running: a live timer between the phase start and end, nothing held', () => {
    const props = intervalActivityProps(PHASE);
    expect(props).toMatchObject(PHASE);
    expect(props.pausedLabel).toBeUndefined();
    expect(props.pausedProgress).toBeUndefined();
  });

  test('paused: what is left as plain text, rounded up as the live timer shows it, and the bar held', () => {
    const paused = (ms: number) =>
      intervalActivityProps({ ...PHASE, pausedRemainingMs: ms, pausedProgress: 0.6 });
    expect(paused(12_300).pausedLabel).toBe('0:13');
    expect(paused(13_000).pausedLabel).toBe('0:13');
    expect(paused(75_000).pausedLabel).toBe('1:15');
    expect(paused(0).pausedLabel).toBe('0:00');
    expect(paused(12_300).pausedProgress).toBe(0.6);
  });

  test('carries its look from the design tokens: the time white, the orange the bar’s (canvas 2.6)', () => {
    expect(intervalActivityProps(PHASE).look).toEqual(intervalActivityLook());
    expect(intervalActivityLook().clockColor).toBe(COLORS['text/primary']);
    expect(intervalActivityLook().barColor).toBe(COLORS['brand/orange']);
  });
});

describe('intervalActivityPropsOf (canvas 2.6)', () => {
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
  const start = startIntervalTimer(ROUNDS, 5, T0);
  const at = (sec: number): ActiveIntervalTimer => ({
    exercise: EXERCISE,
    timer: intervalTimerAt(start, T0 + sec * S),
  });

  test('work: the exercise and round under it, running to the end of the work', () => {
    const sec = 5 + 120 + 45 + 36;
    expect(intervalActivityPropsOf(at(sec), T0 + sec * S)).toMatchObject({
      phase: 'Work',
      detail: 'Heavy bag · round 2 of 3',
      phaseStartedAt: T0 + (5 + 120 + 45) * S,
      phaseEndsAt: T0 + (5 + 120 + 45 + 120) * S,
      canSkipRest: false,
    });
  });

  test('rest: the next round and its work, Skip rest offered', () => {
    const sec = 5 + 120 + 17;
    expect(intervalActivityPropsOf(at(sec), T0 + sec * S)).toMatchObject({
      phase: 'Rest',
      detail: 'Next: round 2 · 2:00',
      canSkipRest: true,
    });
  });

  test('Get ready: the round it leads into', () => {
    expect(intervalActivityPropsOf(at(2), T0 + 2 * S)).toMatchObject({
      phase: 'Get ready',
      detail: 'Heavy bag · round 1 of 3',
    });
  });

  test('paused: the same phase, only the time and the bar held — no jump (Artem, 20.10.2026)', () => {
    const sec = 5 + 36;
    const paused = pauseIntervalTimer(at(sec).timer, T0 + sec * S);
    expect(
      intervalActivityPropsOf({ exercise: EXERCISE, timer: paused }, T0 + 999 * S),
    ).toMatchObject({ phase: 'Work', pausedLabel: '1:24', pausedProgress: 0.7 });
  });

  test('none once the block is over — the activity ends', () => {
    expect(intervalActivityPropsOf(at(10_000), T0 + 10_000 * S)).toBeUndefined();
    const ended = endIntervalTimerEarly(start, T0 + S);
    expect(intervalActivityPropsOf({ exercise: EXERCISE, timer: ended }, T0 + S)).toBeUndefined();
  });
});

describe('activityStateKey', () => {
  const T0 = 1_000_000;
  const S = 1000;
  const ROUNDS = [1, 2].map((roundNumber) => ({ roundNumber, workSec: 60, restSec: 30 }));
  const start = startIntervalTimer(ROUNDS, 5, T0);

  test('changes as a phase starts, pauses and runs again — not as it merely runs on', () => {
    const running = intervalTimerAt(start, T0 + 10 * S);
    expect(activityStateKey(intervalTimerAt(start, T0 + 11 * S))).toBe(activityStateKey(running));

    const paused = pauseIntervalTimer(running, T0 + 12 * S);
    const resumed = resumeIntervalTimer(paused, T0 + 30 * S);
    const keys = [running, paused, resumed, intervalTimerAt(start, T0 + 70 * S)].map(
      activityStateKey,
    );
    expect(new Set(keys).size).toBe(4);
  });

  test('none once the block is over, or without a timer', () => {
    expect(activityStateKey(intervalTimerAt(start, T0 + 10_000 * S))).toBeUndefined();
    expect(activityStateKey(undefined)).toBeUndefined();
  });
});
