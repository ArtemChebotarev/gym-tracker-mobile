import { MUSCLE_GROUPS } from '@domain/catalog';
import { EXERCISE_CATALOG } from '@domain/exerciseCatalog';

describe('EXERCISE_CATALOG', () => {
  test('every exercise has a unique id', () => {
    const ids = EXERCISE_CATALOG.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every exercise references an existing muscle group', () => {
    for (const exercise of EXERCISE_CATALOG) {
      expect(MUSCLE_GROUPS).toContain(exercise.muscleGroup);
    }
  });

  test('no muscle group is empty', () => {
    for (const group of MUSCLE_GROUPS) {
      const exercisesInGroup = EXERCISE_CATALOG.filter((exercise) => exercise.muscleGroup === group);
      expect(exercisesInGroup.length).toBeGreaterThan(0);
    }
  });
});
