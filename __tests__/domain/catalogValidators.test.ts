import type { Equipment, MuscleGroup } from '@domain/catalog';
import {
  normalizeExerciseName,
  validateEquipmentForType,
  validateExerciseEquipment,
  validateExerciseMuscleGroup,
} from '@domain/catalogValidators';

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
    expect(() => validateExerciseMuscleGroup('not-a-muscle-group' as MuscleGroup)).toThrow(
      /Unknown muscle group/,
    );
  });
});

describe('validateExerciseEquipment', () => {
  test('accepts every fixed catalog equipment value', () => {
    expect(() => validateExerciseEquipment('barbell')).not.toThrow();
    expect(() => validateExerciseEquipment('other')).not.toThrow();
    expect(() => validateExerciseEquipment('resistance-band')).not.toThrow();
  });

  test('accepts undefined — equipment is optional', () => {
    expect(() => validateExerciseEquipment(undefined)).not.toThrow();
  });

  test('rejects a value outside the fixed catalog', () => {
    expect(() => validateExerciseEquipment('not-equipment' as Equipment)).toThrow(
      /Unknown equipment/,
    );
  });
});

describe('validateEquipmentForType', () => {
  test('accepts equipment the type offers, and none at all', () => {
    expect(() => validateEquipmentForType('power', 'medicine-ball')).not.toThrow();
    expect(() => validateEquipmentForType('strength', 'barbell')).not.toThrow();
    expect(() => validateEquipmentForType('mobility', undefined)).not.toThrow();
  });

  test('rejects equipment another type owns', () => {
    expect(() => validateEquipmentForType('power', 'barbell')).toThrow(/cannot have/);
    expect(() => validateEquipmentForType('strength', 'heavy-bag')).toThrow(/cannot have/);
    expect(() => validateEquipmentForType('mobility', 'kettlebell')).toThrow(/cannot have/);
  });
});
