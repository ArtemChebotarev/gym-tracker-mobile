import { MUSCLE_GROUPS } from '@domain/catalog';
import { EXERCISE_CATALOG } from '@domain/exerciseCatalog';
import { exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import {
  validateExerciseConfig,
  validateExerciseMuscleGroupFor,
} from '@domain/exerciseConfigValidators';
import { equipmentOptionsFor } from '@domain/exerciseEquipment';

describe('EXERCISE_CATALOG', () => {
  test('every exercise has a unique id', () => {
    const ids = EXERCISE_CATALOG.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every exercise has a muscle group its type allows', () => {
    for (const exercise of EXERCISE_CATALOG) {
      expect(() =>
        validateExerciseMuscleGroupFor(exerciseTypeOf(exercise), exercise.muscleGroup),
      ).not.toThrow();
    }
  });

  test('every exercise carries the config of its type', () => {
    for (const exercise of EXERCISE_CATALOG) {
      expect(() => validateExerciseConfig(exerciseTypeOf(exercise), exercise.config)).not.toThrow();
    }
  });

  test('every exercise has equipment its type offers', () => {
    for (const exercise of EXERCISE_CATALOG) {
      expect(equipmentOptionsFor(exerciseTypeOf(exercise))).toContain(exercise.equipment);
    }
  });

  test('no muscle group is empty', () => {
    for (const group of MUSCLE_GROUPS) {
      const exercisesInGroup = EXERCISE_CATALOG.filter((exercise) => exercise.muscleGroup === group);
      expect(exercisesInGroup.length).toBeGreaterThan(0);
    }
  });
});
