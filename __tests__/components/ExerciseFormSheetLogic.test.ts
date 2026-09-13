import { toExerciseId, type Exercise } from '@domain/catalog';
import { canSubmitExerciseForm, isExerciseEditableInSheet } from '@components/ExerciseFormSheetLogic';

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: toExerciseId('exercise-bench-press'),
    name: 'Bench Press',
    muscleGroup: 'chest',
    source: 'catalog',
    isHidden: false,
    ...overrides,
  };
}

describe('isExerciseEditableInSheet', () => {
  test('a custom exercise is editable', () => {
    expect(isExerciseEditableInSheet(makeExercise({ source: 'custom' }))).toBe(true);
  });

  test('a catalog exercise is not editable', () => {
    expect(isExerciseEditableInSheet(makeExercise({ source: 'catalog' }))).toBe(false);
  });
});

describe('canSubmitExerciseForm', () => {
  test('requires both a non-blank name and a muscle group', () => {
    expect(canSubmitExerciseForm('Bench Press', 'chest')).toBe(true);
  });

  test('rejects a blank or whitespace-only name', () => {
    expect(canSubmitExerciseForm('', 'chest')).toBe(false);
    expect(canSubmitExerciseForm('   ', 'chest')).toBe(false);
  });

  test('rejects a missing muscle group', () => {
    expect(canSubmitExerciseForm('Bench Press', undefined)).toBe(false);
  });
});
