import { STRENGTH_REST_SEC } from '@domain/restTimer';
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
  startRestTimer,
  strengthRestSecOf,
} from '@domain/restTimerRules';

const POWER_90 = { type: 'power', load: 'weight', restSec: 90, noHeavierAvailable: false } as const;
const POWER_45 = { ...POWER_90, restSec: 45 };

const T0 = 1_000_000;
const REST = {
  sessionExerciseId: 'se',
  next: { kind: 'set' as const, setNumber: 2 },
  durationSec: 60,
};

describe('restSecFor', () => {
  test('strength rests 2:00, whether its type is spelled out or not', () => {
    expect(restSecFor(undefined, undefined, undefined, 120)).toBe(STRENGTH_REST_SEC);
    expect(restSecFor('strength', undefined, undefined, 120)).toBe(120);
  });

  test("power takes the cycle's rest first, then the library's, then the default 1:00", () => {
    expect(restSecFor('power', POWER_90, POWER_45, 120)).toBe(90);
    expect(restSecFor('power', undefined, POWER_45, 120)).toBe(45);
    expect(restSecFor('power', undefined, undefined, 120)).toBe(60);
  });

  test('a rest of 0 is no rest', () => {
    expect(restSecFor('power', { ...POWER_90, restSec: 0 }, undefined, 120)).toBeUndefined();
  });

  test('strength takes its rest from Settings, and has none while the timer is off', () => {
    expect(restSecFor('strength', undefined, undefined, 90)).toBe(90);
    expect(restSecFor('strength', undefined, undefined, undefined)).toBeUndefined();
    expect(restSecFor('power', undefined, POWER_45, undefined)).toBe(45);
  });

  test('interval and mobility have no rest between sets', () => {
    expect(restSecFor('interval', undefined, undefined, 120)).toBeUndefined();
    expect(restSecFor('mobility', undefined, undefined, 120)).toBeUndefined();
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

describe('strengthRestSecOf', () => {
  test('the seconds while the timer is on, none while it is off', () => {
    expect(strengthRestSecOf({ enabled: true, restSec: 150 })).toBe(150);
    expect(strengthRestSecOf({ enabled: false, restSec: 150 })).toBeUndefined();
  });
});
