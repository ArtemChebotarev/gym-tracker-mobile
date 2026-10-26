import {
  activityStateKey,
  intervalActivityBlockOf,
  intervalActivityLook,
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
import type { IntervalTimerExercise } from '@state/intervalTimerStore';

describe('intervalActivityPropsOf (10.3)', () => {
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

  test('the block, in the look of the design tokens: the time white, the work cells orange', () => {
    const props = intervalActivityPropsOf({ exercise: EXERCISE, timer: start }, T0 + S);
    expect(props?.block).toEqual(
      intervalActivityBlockOf({ exercise: EXERCISE, timer: start }, T0 + S),
    );
    expect(props?.look).toEqual(intervalActivityLook());
    expect(intervalActivityLook().clockColor).toBe(COLORS['text/primary']);
    expect(intervalActivityLook().barColor).toBe(COLORS['brand/orange']);
  });

  test('none once the block is over — the activity ends', () => {
    const over = intervalTimerAt(start, T0 + 10_000 * S);
    expect(
      intervalActivityPropsOf({ exercise: EXERCISE, timer: over }, T0 + 10_000 * S),
    ).toBeUndefined();
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

  test('the same while the block runs on, from phase to phase — no update is needed for that', () => {
    const keys = [2, 10, 70, 100].map((sec) =>
      activityStateKey(intervalTimerAt(start, T0 + sec * S)),
    );
    expect(new Set(keys).size).toBe(1);
  });

  test('changes as the schedule does: a pause, a resume, a skipped rest', () => {
    const running = intervalTimerAt(start, T0 + 10 * S);
    const paused = pauseIntervalTimer(running, T0 + 12 * S);
    // Paused 20 s; the skip saves 15 s (20 s of rest left, less a 5 s Get ready) — a different end.
    const resumed = resumeIntervalTimer(paused, T0 + 32 * S);
    const resting = intervalTimerAt(resumed, T0 + 95 * S);
    const skipped = skipIntervalRest(resting, T0 + 95 * S);
    const keys = [running, paused, resumed, skipped].map(activityStateKey);
    expect(new Set(keys).size).toBe(4);
  });

  test('none once the block is over, or without a timer', () => {
    expect(activityStateKey(intervalTimerAt(start, T0 + 10_000 * S))).toBeUndefined();
    expect(activityStateKey(undefined)).toBeUndefined();
  });
});
