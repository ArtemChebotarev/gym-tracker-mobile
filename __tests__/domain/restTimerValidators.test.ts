import { assertStrengthRestTimer } from '@domain/restTimerValidators';

describe('assertStrengthRestTimer', () => {
  test('accepts a rest in 5 s steps from 0:05 to 10:00', () => {
    for (const restSec of [5, 120, 600]) {
      expect(() => assertStrengthRestTimer({ enabled: true, restSec })).not.toThrow();
    }
  });

  test('refuses a rest off the step, out of range or not a whole number', () => {
    for (const restSec of [0, 7, 605, 12.5]) {
      expect(() => assertStrengthRestTimer({ enabled: true, restSec })).toThrow();
    }
  });
});
