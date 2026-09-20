import {
  isBodyWeightExercise,
  isPureBodyWeight,
  totalLoad,
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

describe('totalLoad', () => {
  test('DoD: a weighted set loads the body plus what was hung on it', () => {
    expect(totalLoad({ weight: 10, bodyWeight: 80 }, 'bodyweight-weighted')).toBe(90);
  });

  test("a pure bodyweight set's weight is already the whole load", () => {
    expect(totalLoad({ weight: 80 }, 'bodyweight')).toBe(80);
  });

  test('an ordinary exercise never picks up the body weight', () => {
    expect(totalLoad({ weight: 60, bodyWeight: 80 }, 'barbell')).toBe(60);
    expect(totalLoad({ weight: 60 }, undefined)).toBe(60);
  });

  test('a weighted set with no body weight recorded reports the added weight alone', () => {
    expect(totalLoad({ weight: 10 }, 'bodyweight-weighted')).toBe(10);
  });
});
