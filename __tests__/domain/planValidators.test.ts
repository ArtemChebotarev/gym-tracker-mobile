import {
  DEFAULT_EXERCISE_SETS,
  MAX_EXERCISE_SETS,
  MIN_EXERCISE_SETS,
  validateWeekPlanExerciseSets,
} from '@domain/planValidators';

describe('validateWeekPlanExerciseSets', () => {
  test.each([MIN_EXERCISE_SETS, MAX_EXERCISE_SETS])('accepts the boundary value %i', (sets) => {
    expect(() => validateWeekPlanExerciseSets(sets)).not.toThrow();
  });

  test.each([MIN_EXERCISE_SETS - 1, MAX_EXERCISE_SETS + 1])(
    'rejects the out-of-range value %i',
    (sets) => {
      expect(() => validateWeekPlanExerciseSets(sets)).toThrow(/sets must be between/);
    },
  );

  test('the default sits within the valid range', () => {
    expect(() => validateWeekPlanExerciseSets(DEFAULT_EXERCISE_SETS)).not.toThrow();
  });
});
