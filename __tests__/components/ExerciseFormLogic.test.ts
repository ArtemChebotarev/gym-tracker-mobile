import { toExerciseId, type Exercise } from '@domain/catalog';
import { EMPTY_EXERCISE_FORM_VALUES } from '@components/ExerciseFormValues';
import {
  equipmentDropdownOptions,
  sortedByLabel,
  describePowerLoad,
  POWER_LOAD_OPTIONS,
  powerLoadFromValue,
  canSubmitExerciseForm,
  isExerciseEditable,
  valuesForType,
} from '@components/ExerciseFormLogic';
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

describe('isExerciseEditable', () => {
  test('a custom exercise is editable', () => {
    expect(isExerciseEditable(makeExercise({ source: 'custom' }))).toBe(true);
  });

  test('a catalog exercise is not editable', () => {
    expect(isExerciseEditable(makeExercise({ source: 'catalog' }))).toBe(false);
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
    const values = valuesForType(
      { ...EMPTY_EXERCISE_FORM_VALUES, muscleGroup: 'chest' },
      'strength',
    );

    expect(values.type).toBe('strength');
    expect(values.config).toBeUndefined();
    expect(values.muscleGroup).toBe('chest');
  });

  test('a non-strength type takes its defaults and starts without a group', () => {
    const values = valuesForType(EMPTY_EXERCISE_FORM_VALUES, 'power');

    expect(values.config).toEqual({
      type: 'power',
      load: 'weight',
      restSec: 60,
      noHeavierAvailable: false,
    });
    expect(values.muscleGroup).toBe('fullBody');
  });

  test('going back to strength drops a fullBody group, which is not legal for it', () => {
    const power = valuesForType(EMPTY_EXERCISE_FORM_VALUES, 'power');

    expect(valuesForType(power, 'strength').muscleGroup).toBeUndefined();
  });
});

describe('power load', () => {
  it('offers the three loads of FR-2 in order', () => {
    expect(POWER_LOAD_OPTIONS.map((option) => option.value)).toEqual(['weight', 'level', 'none']);
  });

  it('reads a value back, weight for a stray one', () => {
    expect(powerLoadFromValue('level')).toBe('level');
    expect(powerLoadFromValue('none')).toBe('none');
    expect(powerLoadFromValue('bogus')).toBe('weight');
  });

  it('describes each load differently', () => {
    const lines = new Set((['weight', 'level', 'none'] as const).map(describePowerLoad));
    expect(lines.size).toBe(3);
  });
});

describe('sortedByLabel', () => {
  test('orders by label without touching the original', () => {
    const options = [
      { value: 'b', label: 'Beta' },
      { value: 'a', label: 'alpha' },
      { value: 'c', label: 'Charlie' },
    ];

    expect(sortedByLabel(options).map((option) => option.label)).toEqual([
      'alpha',
      'Beta',
      'Charlie',
    ]);
    expect(options.map((option) => option.label)).toEqual(['Beta', 'alpha', 'Charlie']);
  });
});

describe('equipmentDropdownOptions', () => {
  test("lists the type's equipment by name with Other last", () => {
    expect(equipmentDropdownOptions('power').map((option) => option.label)).toEqual([
      'Bodyweight',
      'Kettlebell',
      'Medicine ball',
      'Plyo box',
      'Resistance band',
      'Sandbag',
      'Slam ball',
      'Other',
    ]);
    expect(
      equipmentDropdownOptions('strength')
        .map((option) => option.label)
        .at(-1),
    ).toBe('Other');
  });
});
