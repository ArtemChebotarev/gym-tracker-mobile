import {
  hasNoWeightTarget,
  isBodyWeightExercise,
  isPureBodyWeight,
  isResistanceBand,
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

  test('a band is not a bodyweight exercise: no block weight applies, and no weight of its own', () => {
    expect(isResistanceBand('resistance-band')).toBe(true);
    expect(isResistanceBand('bodyweight')).toBe(false);
    expect(isBodyWeightExercise('resistance-band')).toBe(false);
    expect(usesAddedWeight('resistance-band')).toBe(false);
  });

  test('a pure bodyweight exercise and a band have no weight target; the rest do', () => {
    expect(hasNoWeightTarget('bodyweight')).toBe(true);
    expect(hasNoWeightTarget('resistance-band')).toBe(true);
    expect(hasNoWeightTarget('bodyweight-weighted')).toBe(false);
    expect(hasNoWeightTarget('cable')).toBe(false);
    expect(hasNoWeightTarget(undefined)).toBe(false);
  });
});
