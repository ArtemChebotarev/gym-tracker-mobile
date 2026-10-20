import {
  activityStateKey,
  intervalActivityBlockOf,
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
  skipIntervalRest,
  startIntervalTimer,
} from '@domain/intervalTimerRules';
import type { ActiveIntervalTimer, IntervalTimerExercise } from '@state/intervalTimerStore';

const PHASE = {
  phase: 'Work',
  detail: 'Heavy bag · round 2 of 3',
  phaseStartedAt: 1_000,
  phaseEndsAt: 21_000,
  canSkipRest: false,
  block: {
    title: 'Heavy bag',
    detail: '3 rounds',
    startedAt: 1_000,
    endsAt: 61_000,
    segments: [],
  },
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

describe('intervalActivityBlockOf — the block, right with no update', () => {
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
  const blockAt = (timer: typeof start, sec: number) =>
    intervalActivityBlockOf({ exercise: EXERCISE, timer }, T0 + sec * S);

  test('from Get ready: a cell per work and rest, each scheduled; the time runs to the last work’s end', () => {
    const block = blockAt(start, 2);
    expect(block).toMatchObject({ title: 'Heavy bag', detail: '3 rounds' });
    expect(block.endsAt).toBe(T0 + (5 + 3 * 120 + 2 * 45) * S);
    expect(block.segments).toEqual([
      { work: true, startsAt: T0 + 5 * S, endsAt: T0 + 125 * S },
      { work: false, startsAt: T0 + 125 * S, endsAt: T0 + 170 * S },
      { work: true, startsAt: T0 + 170 * S, endsAt: T0 + 290 * S },
      { work: false, startsAt: T0 + 290 * S, endsAt: T0 + 335 * S },
      { work: true, startsAt: T0 + 335 * S, endsAt: T0 + 455 * S },
    ]);
    expect(block.pausedLabel).toBeUndefined();
  });

  test('the same block whichever phase it is drawn in — nothing in it waits for an update', () => {
    const later = 5 + 120 + 45 + 10;
    const drawnLater = blockAt(intervalTimerAt(start, T0 + later * S), later);
    expect(drawnLater.endsAt).toBe(blockAt(start, 2).endsAt);
    expect(drawnLater.segments.slice(2)).toEqual(blockAt(start, 2).segments.slice(2));
    expect(drawnLater.segments.slice(0, 2)).toEqual([
      { work: true, value: 1 },
      { work: false, value: 1 },
    ]);
  });

  test('after Skip rest: the rest done, the next work after Get ready', () => {
    const sec = 5 + 120 + 10;
    const skipped = skipIntervalRest(intervalTimerAt(start, T0 + sec * S), T0 + sec * S);
    const block = blockAt(skipped, sec);
    expect(block.segments[1]).toEqual({ work: false, value: 1 });
    expect(block.segments[2]).toEqual({
      work: true,
      startsAt: T0 + (sec + 5) * S,
      endsAt: T0 + (sec + 5 + 120) * S,
    });
  });

  test('paused: plain cells and the block’s time left as text', () => {
    const sec = 5 + 30;
    const paused = pauseIntervalTimer(intervalTimerAt(start, T0 + sec * S), T0 + sec * S);
    const block = blockAt(paused, 999);
    expect(block.segments.map((segment) => segment.value)).toEqual([0.25, 0, 0, 0, 0]);
    expect(block.pausedLabel).toBe('7:00');
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
