import type { MuscleGroup } from '@domain/catalog';
import { normalizeExerciseName, validateExerciseMuscleGroup } from '@domain/catalogValidators';

describe('normalizeExerciseName', () => {
  test('trims leading and trailing whitespace', () => {
    expect(normalizeExerciseName('  Bench Press  ')).toBe('Bench Press');
  });

  test.each(['', '   ', '\t\n'])('rejects a name that is empty after trimming ("%s")', (name) => {
    expect(() => normalizeExerciseName(name)).toThrow(/Exercise name is required/);
  });
});

describe('validateExerciseMuscleGroup', () => {
  test('accepts every fixed catalog muscle group', () => {
    expect(() => validateExerciseMuscleGroup('chest')).not.toThrow();
    expect(() => validateExerciseMuscleGroup('hamstrings')).not.toThrow();
  });

  test('rejects a value outside the fixed catalog', () => {
    expect(() =>
      validateExerciseMuscleGroup('not-a-muscle-group' as MuscleGroup),
    ).toThrow(/Unknown muscle group/);
  });
});
