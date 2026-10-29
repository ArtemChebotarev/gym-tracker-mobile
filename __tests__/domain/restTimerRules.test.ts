import { REST_BETWEEN_SETS_SEC } from '@domain/restTimer';
import {
  isRunning,
  nextSetAfter,
  pauseRestTimer,
  restIsOver,
  restProgress,
  restRemainingMs,
  restRemainingSec,
  restSecFor,
  resumeRestTimer,
  restBetweenSetsSecOf,
  startRestTimer,
} from '@domain/restTimerRules';

const T0 = 1_000_000;
const REST = {
  sessionExerciseId: 'se',
  next: { kind: 'set' as const, setNumber: 2 },
  durationSec: 60,
};

describe('restSecFor', () => {
  test('strength rests 2:00, whether its type is spelled out or not', () => {
    expect(restSecFor(undefined, 120)).toBe(REST_BETWEEN_SETS_SEC);
    expect(restSecFor('strength', 120)).toBe(120);
  });

  test('power takes the same rest from Settings as strength (GT-188)', () => {
    expect(restSecFor('power', 90)).toBe(90);
  });

  test('neither has a rest while the timer is off, nor one of 0', () => {
    expect(restSecFor('strength', undefined)).toBeUndefined();
    expect(restSecFor('power', undefined)).toBeUndefined();
    expect(restSecFor('power', 0)).toBeUndefined();
  });

  test('interval and mobility have no rest between sets', () => {
    expect(restSecFor('interval', 120)).toBeUndefined();
    expect(restSecFor('mobility', 120)).toBeUndefined();
  });
});

describe('nextSetAfter', () => {
  const rows = (open: boolean[]) => open.map((isOpen, i) => ({ setNumber: i + 1, open: isOpen }));

  test('n sets, n − 1 rests: none after the last one', () => {
    expect(nextSetAfter(rows([true, true, true]), 1)).toBe(2);
    expect(nextSetAfter(rows([false, true, true]), 2)).toBe(3);
    expect(nextSetAfter(rows([false, false, true]), 3)).toBeUndefined();
  });

  test('a set logged out of order rests before the one still left', () => {
    expect(nextSetAfter(rows([true, false, true]), 3)).toBe(1);
  });
});

describe('a rest on the clock', () => {
  test('counts down from its length and runs out', () => {
    const timer = startRestTimer(REST, T0);

    expect(isRunning(timer)).toBe(true);
    expect(restRemainingSec(timer, T0)).toBe(60);
    expect(restRemainingSec(timer, T0 + 30_000)).toBe(30);
    expect(restProgress(timer, T0 + 15_000)).toBeCloseTo(0.75);
    expect(restIsOver(timer, T0 + 59_999)).toBe(false);
    expect(restIsOver(timer, T0 + 60_000)).toBe(true);
    expect(restRemainingMs(timer, T0 + 90_000)).toBe(0);
  });

  test('a part second still reads as a whole one', () => {
    expect(restRemainingSec(startRestTimer(REST, T0), T0 + 59_800)).toBe(1);
  });

  test('paused, the time left holds however long the pause; resumed, it runs on from there', () => {
    const paused = pauseRestTimer(startRestTimer(REST, T0), T0 + 20_000);

    expect(isRunning(paused)).toBe(false);
    expect(restRemainingSec(paused, T0 + 500_000)).toBe(40);
    expect(restIsOver(paused, T0 + 500_000)).toBe(false);

    const resumed = resumeRestTimer(paused, T0 + 500_000);
    expect(restRemainingSec(resumed, T0 + 510_000)).toBe(30);
    expect(restIsOver(resumed, T0 + 540_000)).toBe(true);
  });

  test('pausing a paused rest and resuming a running one change nothing', () => {
    const running = startRestTimer(REST, T0);
    const paused = pauseRestTimer(running, T0 + 10_000);

    expect(resumeRestTimer(running, T0 + 5_000)).toBe(running);
    expect(pauseRestTimer(paused, T0 + 30_000)).toBe(paused);
  });
});

describe('restBetweenSetsSecOf', () => {
  test('the seconds while the timer is on, none while it is off', () => {
    expect(restBetweenSetsSecOf({ enabled: true, restSec: 150 })).toBe(150);
    expect(restBetweenSetsSecOf({ enabled: false, restSec: 150 })).toBeUndefined();
  });
});
