import {
  blockEntryOf,
  blockLengthSec,
  blockTimerState,
  shownTimerSec,
  timerBlockOf,
} from '@components/MobilityExerciseCardLogic';
import {
  intervalTimerAt,
  pauseIntervalTimer,
  startIntervalTimer,
} from '@domain/intervalTimerRules';

const T0 = 1_000_000;
const S = 1000;
const BLOCK = { roundNumber: 1, workSec: 600, isFirstUnlogged: true };

describe('blockLengthSec', () => {
  test('the logged length, else one picked now, else the plan; none with neither', () => {
    const logged = { ...BLOCK, log: { workSec: 540, restSkipped: false, completed: true } };
    expect(blockLengthSec(logged, 300)).toBe(540);
    expect(blockLengthSec(BLOCK, 300)).toBe(300);
    expect(blockLengthSec(BLOCK, undefined)).toBe(600);
    expect(blockLengthSec({ roundNumber: 1, isFirstUnlogged: true }, undefined)).toBeUndefined();
  });
});

describe('blockEntryOf and timerBlockOf', () => {
  test('a length: logged with no rest, timed as one round with a rest of 0', () => {
    expect(blockEntryOf(600)).toEqual({ workSec: 600 });
    expect(timerBlockOf(BLOCK, 600)).toEqual([{ roundNumber: 1, workSec: 600, restSec: 0 }]);
  });

  test('no length: nothing to log or time', () => {
    expect(blockEntryOf(undefined)).toBeUndefined();
    expect(timerBlockOf(BLOCK, undefined)).toBeUndefined();
  });
});

describe('blockTimerState and shownTimerSec', () => {
  const block = [{ roundNumber: 1, workSec: 600, restSec: 0 }];

  test('none, or over: idle', () => {
    expect(blockTimerState(undefined)).toBe('idle');
    const over = intervalTimerAt(startIntervalTimer(block, 5, T0), T0 + 605 * S);
    expect(blockTimerState(over)).toBe('idle');
  });

  test('the whole length in Get ready, the time left once it runs, held while paused', () => {
    const timer = startIntervalTimer(block, 5, T0);
    expect(blockTimerState(timer)).toBe('running');
    expect(shownTimerSec(timer, 600, T0 + 2 * S)).toBe(600);

    const working = intervalTimerAt(timer, T0 + 65 * S);
    expect(shownTimerSec(working, 600, T0 + 65 * S)).toBe(540);

    const paused = pauseIntervalTimer(working, T0 + 65 * S);
    expect(blockTimerState(paused)).toBe('paused');
    expect(shownTimerSec(paused, 600, T0 + 500 * S)).toBe(540);
  });
});
