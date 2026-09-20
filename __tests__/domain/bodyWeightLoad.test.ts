import {
  isBodyWeightExercise,
  isPureBodyWeight,
  usesAddedWeight,
} from '@domain/bodyWeightLoad';

describe('telling the bodyweight exercises apart', () => {
  test('both kinds are bodyweight exercises — the block weight applies to both', () => {
    expect(isBodyWeightExercise('bodyweight')).toBe(true);
    expect(isBodyWeightExercise('bodyweight-weighted')).toBe(true);
  });

  test('nothing else is', () => {
    expect(isBodyWeightExercise('barbell')).toBe(false);
    expect(isBodyWeightExercise(undefined)).toBe(false);
  });

  test('only the pure kind has no weight to progress', () => {
    expect(isPureBodyWeight('bodyweight')).toBe(true);
    expect(isPureBodyWeight('bodyweight-weighted')).toBe(false);
    expect(isPureBodyWeight('dumbbell')).toBe(false);
    expect(isPureBodyWeight(undefined)).toBe(false);
  });

  test('only the weighted kind reads `weight` as added weight', () => {
    expect(usesAddedWeight('bodyweight-weighted')).toBe(true);
    expect(usesAddedWeight('bodyweight')).toBe(false);
    expect(usesAddedWeight('machine')).toBe(false);
  });
});
