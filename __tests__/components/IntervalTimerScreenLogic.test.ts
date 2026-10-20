import {
  endEarlyMessage,
  intervalSummaryView,
  intervalTimerView,
} from '@components/IntervalTimerScreenLogic';
import type { IntervalTimerRound } from '@domain/intervalTimer';
import {
  endIntervalTimerEarly,
  intervalTimerAt,
  pauseIntervalTimer,
  skipIntervalRest,
  startIntervalTimer,
} from '@domain/intervalTimerRules';
import type { ActiveIntervalTimer, IntervalTimerExercise } from '@state/intervalTimerStore';

const T0 = 1_000_000;
const S = 1000;

/** Heavy bag, 3 × 2:00, rest 0:45, Get ready 0:05 (canvas 2.1, 2.2). */
const ROUNDS: IntervalTimerRound[] = [1, 2, 3].map((roundNumber) => ({
  roundNumber,
  workSec: 120,
  restSec: 45,
}));
const EXERCISE: IntervalTimerExercise = {
  sessionId: 'session',
  sessionExerciseId: 'bag',
  name: 'Heavy bag',
  totalRounds: 3,
  loggedRoundNumbers: [],
};

function active(at: number, rounds = ROUNDS, exercise = EXERCISE): ActiveIntervalTimer {
  return { exercise, timer: intervalTimerAt(startIntervalTimer(rounds, 5, T0), at) };
}

describe('intervalTimerView', () => {
  test('Get ready before the first round: orange, the round it leads into next', () => {
    const view = intervalTimerView(active(T0 + 2 * S), T0 + 2 * S);
    expect(view).toMatchObject({
      title: 'Heavy bag',
      subtitle: 'Round 1 of 3',
      phase: 'Get ready',
      time: '0:03',
      of: 'of 0:05',
      tone: 'running',
      next: 'Next round 1 · 2:00',
      paused: false,
      canSkipRest: false,
    });
    expect(view?.pill).toBeUndefined();
  });

  test('work (canvas 2.1): the time left of the round, then its rest; its bar fills orange', () => {
    const at = T0 + (5 + 120 + 45 + 36) * S;
    const view = intervalTimerView(active(at), at);
    expect(view).toMatchObject({
      subtitle: 'Round 2 of 3',
      phase: 'Work',
      time: '1:24',
      of: 'of 2:00',
      tone: 'running',
      next: 'Then rest 0:45',
    });
    expect(view?.segments).toEqual([
      { fill: 1, tone: 'done' },
      { fill: expect.closeTo(0.3), tone: 'running' },
      { fill: 0, tone: 'empty' },
    ]);
  });

  test('the last round names the rest that follows it — the rest timer’s, after the summary', () => {
    const at = T0 + (5 + 120 + 45 + 120 + 45 + 10) * S;
    expect(intervalTimerView(active(at), at)?.next).toBe('Last round. Then rest 0:45');
    const noRest = ROUNDS.map((round) => ({ ...round, restSec: 0 }));
    const lastAt = T0 + (5 + 120 + 120 + 10) * S;
    expect(intervalTimerView(active(lastAt, noRest), lastAt)?.next).toBe('Last round.');
  });

  test('rest (canvas 2.2): the round done, grey, Skip rest offered, the next round named', () => {
    const at = T0 + (5 + 120 + 120 + 45 + 17) * S;
    const view = intervalTimerView(active(at), at);
    expect(view).toMatchObject({
      subtitle: 'Round 2 of 3 done',
      phase: 'Rest',
      time: '0:28',
      of: 'of 0:45',
      tone: 'rest',
      next: 'Next round 3 · 2:00',
      canSkipRest: true,
    });
    // Running: the dial runs down by itself to the end of the rest.
    expect(view?.runsOutAt).toBe(T0 + (5 + 120 + 45 + 120 + 45) * S);
    expect(view?.segments.map((s) => s.tone)).toEqual(['done', 'done', 'empty']);
  });

  test('after a skipped rest (canvas 2.3): Get ready with a Rest skipped pill', () => {
    const at = T0 + (5 + 120 + 10) * S;
    const skipped = skipIntervalRest(active(at).timer, at);
    const view = intervalTimerView({ exercise: EXERCISE, timer: skipped }, at + S);
    expect(view).toMatchObject({ phase: 'Get ready', pill: 'Rest skipped', time: '0:04' });
  });

  test('paused (canvas 2.4): faint, the phase named, the time held', () => {
    const at = T0 + (5 + 36) * S;
    const paused = pauseIntervalTimer(active(at).timer, at);
    const view = intervalTimerView({ exercise: EXERCISE, timer: paused }, at + 60 * S);
    expect(view).toMatchObject({
      phase: 'Paused · work',
      time: '1:24',
      tone: 'paused',
      paused: true,
      next: 'The round goes on from here when you resume.',
    });
    expect(view?.runsOutAt).toBeUndefined();
    expect(view?.segments[0]).toEqual({ fill: expect.closeTo(0.3), tone: 'paused' });
  });

  test('numbers rounds as the exercise does, with rounds logged by hand shown done', () => {
    const exercise = { ...EXERCISE, totalRounds: 4, loggedRoundNumbers: [1] };
    const rounds = [2, 3, 4].map((roundNumber) => ({ roundNumber, workSec: 60, restSec: 30 }));
    const view = intervalTimerView(active(T0 + 10 * S, rounds, exercise), T0 + 10 * S);
    expect(view?.subtitle).toBe('Round 2 of 4');
    expect(view?.segments.map((s) => s.tone)).toEqual(['done', 'running', 'empty', 'empty']);
  });

  test('nothing to show once the block is over', () => {
    expect(intervalTimerView(active(T0 + 10_000 * S), T0 + 10_000 * S)).toBeUndefined();
  });
});

describe('intervalSummaryView', () => {
  test('every round done: how many, and the work and rest they took', () => {
    expect(intervalSummaryView(active(T0 + 10_000 * S))).toEqual({
      title: 'Heavy bag',
      rounds: '3 of 3 rounds',
      totals: '6:00 work · 1:30 rest',
    });
  });

  test('no summary while the block runs, nor after End early', () => {
    expect(intervalSummaryView(active(T0 + 10 * S))).toBeUndefined();
    const ended = endIntervalTimerEarly(active(T0 + 10 * S).timer, T0 + 10 * S);
    expect(intervalSummaryView({ exercise: EXERCISE, timer: ended })).toBeUndefined();
  });

  test('a single round, without rest', () => {
    const one = [{ roundNumber: 1, workSec: 300, restSec: 60 }];
    expect(intervalSummaryView(active(T0 + 10_000 * S, one))).toMatchObject({
      rounds: '1 of 1 round',
      totals: '5:00 work',
    });
  });
});

describe('endEarlyMessage (canvas 6.3, B)', () => {
  test('mid-round: the rounds done, and what the running one will be logged as', () => {
    const at = T0 + (5 + 120 + 45 + 100) * S;
    expect(endEarlyMessage(active(at), at)).toBe(
      'Round 1 is in the log. Round 2 will be logged as 1:40 of 2:00.',
    );
  });

  test('several rounds done, in a rest', () => {
    const at = T0 + (5 + 120 + 45 + 120 + 10) * S;
    expect(endEarlyMessage(active(at), at)).toBe('Rounds 1–2 are in the log.');
  });

  test('before anything was done', () => {
    expect(endEarlyMessage(active(T0 + S), T0 + S)).toBe('Nothing has been logged yet.');
  });

  test('a round not yet a second in', () => {
    const at = T0 + 5 * S + 300;
    expect(endEarlyMessage(active(at), at)).toBe('Round 1 has not started, so it won’t be logged.');
  });
});
