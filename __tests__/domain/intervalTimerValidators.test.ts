import { assertIntervalTimerStart } from '@domain/intervalTimerValidators';

const ROUND = { roundNumber: 1, workSec: 30, restSec: 60 };

describe('assertIntervalTimerStart', () => {
  test('accepts rounds of whole seconds, rest and Get ready of 0 included', () => {
    expect(() => assertIntervalTimerStart([ROUND, { ...ROUND, restSec: 0 }], 0)).not.toThrow();
  });

  test('needs a round to run', () => {
    expect(() => assertIntervalTimerStart([], 5)).toThrow(
      'An interval timer needs at least one round.',
    );
  });

  test('needs work of at least 1 s, in whole seconds', () => {
    expect(() => assertIntervalTimerStart([{ ...ROUND, workSec: 0 }], 5)).toThrow(/Work .* got 0/);
    expect(() => assertIntervalTimerStart([{ ...ROUND, workSec: 1.5 }], 5)).toThrow(/Work/);
  });

  test('needs rest and Get ready of at least 0, in whole seconds', () => {
    expect(() => assertIntervalTimerStart([{ ...ROUND, restSec: -5 }], 5)).toThrow(/Rest/);
    expect(() => assertIntervalTimerStart([ROUND], -1)).toThrow(/Get ready/);
    expect(() => assertIntervalTimerStart([ROUND], 0.5)).toThrow(/Get ready/);
  });
});
