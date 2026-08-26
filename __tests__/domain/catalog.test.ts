import type { Exercise, MuscleGroup } from '@domain/catalog';

const catalogExerciseFixture: Exercise = {
  id: 'exercise-bench-press',
  name: 'Bench Press',
  muscleGroup: 'chest',
  source: 'catalog',
  equipment: 'barbell',
  isHidden: false,
};

const customExerciseFixture: Exercise = {
  id: 'exercise-custom-1',
  name: 'My Garage Press',
  muscleGroup: 'hamstrings',
  source: 'custom',
  isHidden: false,
};

describe('catalog domain types', () => {
  test('catalog exercise fixture carries its source and equipment', () => {
    expect(catalogExerciseFixture.source).toBe('catalog');
    expect(catalogExerciseFixture.equipment).toBe('barbell');
  });

  test('custom exercise fixture omits the optional equipment field', () => {
    expect(customExerciseFixture.source).toBe('custom');
    expect(customExerciseFixture.equipment).toBeUndefined();
  });

  test('muscle group is one of the fixed set of literals', () => {
    const group: MuscleGroup = 'quads';
    expect(catalogExerciseFixture.muscleGroup).not.toBe(group);
  });
});
