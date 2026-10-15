import { toExerciseId, type Exercise } from '@domain/catalog';
import { EMPTY_EXERCISE_FORM_VALUES } from '@components/ExerciseFormSheet';
import {
  canSubmitExerciseForm,
  formatClock,
  isExerciseEditableInSheet,
  valuesForType,
} from '@components/ExerciseFormSheetLogic';
import { STAMPS } from '../fixtures/stamps';

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    ...STAMPS,
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
  test('a strength exercise requires both a non-blank name and a muscle group', () => {
    expect(canSubmitExerciseForm('Bench Press', 'chest', 'strength')).toBe(true);
  });

  test('rejects a blank or whitespace-only name', () => {
    expect(canSubmitExerciseForm('', 'chest', 'strength')).toBe(false);
    expect(canSubmitExerciseForm('   ', 'chest', 'power')).toBe(false);
  });

  test('rejects a strength exercise without a muscle group, or with fullBody', () => {
    expect(canSubmitExerciseForm('Bench Press', undefined, 'strength')).toBe(false);
    expect(canSubmitExerciseForm('Bench Press', 'fullBody', 'strength')).toBe(false);
  });

  test('a non-strength exercise needs only a name', () => {
    expect(canSubmitExerciseForm('Heavy bag', undefined, 'interval')).toBe(true);
    expect(canSubmitExerciseForm('Cooldown', 'fullBody', 'mobility')).toBe(true);
  });
});

describe('valuesForType', () => {
  test('strength carries no config and keeps a chosen group', () => {
    const values = valuesForType({ ...EMPTY_EXERCISE_FORM_VALUES, muscleGroup: 'chest' }, 'strength');

    expect(values.type).toBe('strength');
    expect(values.config).toBeUndefined();
    expect(values.muscleGroup).toBe('chest');
  });

  test('a non-strength type takes its defaults and starts without a group', () => {
    const values = valuesForType(EMPTY_EXERCISE_FORM_VALUES, 'power');

    expect(values.config).toEqual({ type: 'power', load: 'weight', restSec: 60, noHeavierAvailable: false });
    expect(values.muscleGroup).toBe('fullBody');
  });

  test('going back to strength drops a fullBody group, which is not legal for it', () => {
    const power = valuesForType(EMPTY_EXERCISE_FORM_VALUES, 'power');

    expect(valuesForType(power, 'strength').muscleGroup).toBeUndefined();
  });
});

describe('formatClock', () => {
  test('formats seconds as m:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(5)).toBe('0:05');
    expect(formatClock(600)).toBe('10:00');
    expect(formatClock(135)).toBe('2:15');
  });
});
