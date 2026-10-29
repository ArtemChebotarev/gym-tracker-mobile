import { assertRestBetweenSets } from '@domain/restTimerValidators';

describe('assertRestBetweenSets', () => {
  test('accepts a rest in 5 s steps from 1:00 to 5:00', () => {
    for (const restSec of [60, 65, 120, 300]) {
      expect(() => assertRestBetweenSets({ enabled: true, restSec })).not.toThrow();
    }
  });

  test('refuses a rest off the step, out of range or not a whole number', () => {
    for (const restSec of [0, 55, 122, 305, 600, 90.5]) {
      expect(() => assertRestBetweenSets({ enabled: true, restSec })).toThrow();
    }
  });
});
