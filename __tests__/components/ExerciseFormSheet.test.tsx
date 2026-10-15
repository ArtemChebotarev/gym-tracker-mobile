import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { toExerciseId, type Exercise } from '@domain/catalog';
import {
  EMPTY_EXERCISE_FORM_VALUES,
  ExerciseFormSheet,
  type ExerciseFormSheetProps,
  type ExerciseFormValues,
} from '@components/ExerciseFormSheet';
import { STAMPS } from '../fixtures/stamps';

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    ...STAMPS,
    id: toExerciseId('exercise-bench-press'),
    name: 'Bench Press',
    muscleGroup: 'chest',
    source: 'custom',
    isHidden: false,
    ...overrides,
  };
}

const BASE_PROPS: ExerciseFormSheetProps = {
  visible: true,
  values: EMPTY_EXERCISE_FORM_VALUES,
  onChangeValues: jest.fn(),
  onSubmit: jest.fn(),
  onClose: jest.fn(),
};

function renderSheet(overrides: Partial<ExerciseFormSheetProps> = {}) {
  const props: ExerciseFormSheetProps = { ...BASE_PROPS, ...overrides };
  render(<ExerciseFormSheet {...props} />);
  return props;
}

// Simulates the caller applying an onChangeValues update, the way library.tsx does — needed
// because this sheet is fully controlled and owns no state of its own.
function ControlledSheet({
  initialValues,
  onSubmit,
}: {
  initialValues: ExerciseFormValues;
  onSubmit: (input: unknown) => void;
}) {
  const [values, setValues] = useState(initialValues);
  return (
    <ExerciseFormSheet
      {...BASE_PROPS}
      values={values}
      onChangeValues={setValues}
      onSubmit={onSubmit}
    />
  );
}

function renderControlledSheet(initialValues: ExerciseFormValues) {
  const onSubmit = jest.fn();
  render(<ControlledSheet initialValues={initialValues} onSubmit={onSubmit} />);
  return { onSubmit };
}

// The sheet opens on its type step (10.1 FR-11); every test of the fields starts by choosing one.
function chooseType(label: string) {
  fireEvent.press(screen.getByText(label));
}

function chooseMuscleGroup(label: string) {
  fireEvent.press(screen.getByRole('button', { name: 'Muscle group' }));
  fireEvent.press(screen.getByRole('button', { name: label }));
}

function chooseEquipment(label: string) {
  fireEvent.press(screen.getByRole('button', { name: 'Equipment' }));
  fireEvent.press(screen.getByRole('button', { name: label }));
}

describe('ExerciseFormSheet — create mode', () => {
  test('renders nothing when not visible', () => {
    renderSheet({ visible: false });

    expect(screen.queryByText('New exercise')).toBeNull();
  });

  test('opens on the type step, offering the four types and no fields yet', () => {
    renderSheet();

    expect(screen.getByText('New exercise')).toBeTruthy();
    for (const label of ['Strength', 'Power', 'Timed work', 'Mobility']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByLabelText('Name')).toBeNull();
  });

  test('choosing Strength shows the fields, empty, with Create', () => {
    renderControlledSheet(EMPTY_EXERCISE_FORM_VALUES);
    chooseType('Strength');

    expect(screen.getByText('New exercise')).toBeTruthy();
    expect(screen.getByLabelText('Name').props.value).toBe('');
    expect(screen.getByRole('button', { name: 'Create exercise' })).toBeTruthy();
  });

  test('reflects a prefilled name — e.g. seeded from the search-empty-state "Create" action', () => {
    renderControlledSheet({ ...EMPTY_EXERCISE_FORM_VALUES, name: 'Zercher Squat' });
    chooseType('Strength');

    expect(screen.getByLabelText('Name').props.value).toBe('Zercher Squat');
  });

  test('Create is disabled until both Name and Muscle group are filled', () => {
    renderControlledSheet(EMPTY_EXERCISE_FORM_VALUES);
    chooseType('Strength');

    expect(screen.getByRole('button', { name: 'Create exercise' }).props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(screen.getByLabelText('Name'), 'Zercher Squat');
    expect(screen.getByRole('button', { name: 'Create exercise' }).props.accessibilityState.disabled).toBe(true);

    chooseMuscleGroup('Quads');
    expect(screen.getByRole('button', { name: 'Create exercise' }).props.accessibilityState.disabled).toBe(false);
  });

  test('a name of only whitespace does not enable Create', () => {
    renderControlledSheet(EMPTY_EXERCISE_FORM_VALUES);
    chooseType('Strength');

    fireEvent.changeText(screen.getByLabelText('Name'), '   ');
    chooseMuscleGroup('Chest');

    expect(screen.getByRole('button', { name: 'Create exercise' }).props.accessibilityState.disabled).toBe(true);
  });

  test('trims leading/trailing whitespace from the name on submit', () => {
    const { onSubmit } = renderControlledSheet({ ...EMPTY_EXERCISE_FORM_VALUES, name: '  Zercher Squat  ' });
    chooseType('Strength');

    chooseMuscleGroup('Quads');
    fireEvent.press(screen.getByRole('button', { name: 'Create exercise' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Zercher Squat', muscleGroup: 'quads', equipment: undefined, type: 'strength', config: undefined });
  });

  test('a name matching an existing catalog exercise is allowed — different entities, no dedup check', () => {
    const { onSubmit } = renderControlledSheet({ ...EMPTY_EXERCISE_FORM_VALUES, name: 'Bench Press' });
    chooseType('Strength');

    chooseMuscleGroup('Chest');
    fireEvent.press(screen.getByRole('button', { name: 'Create exercise' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Bench Press', muscleGroup: 'chest', equipment: undefined, type: 'strength', config: undefined });
  });

  test('equipment is optional and submits alongside name/muscle group when chosen', () => {
    const { onSubmit } = renderControlledSheet({ ...EMPTY_EXERCISE_FORM_VALUES, name: 'Zercher Squat' });
    chooseType('Strength');

    chooseMuscleGroup('Quads');
    chooseEquipment('Barbell');
    fireEvent.press(screen.getByRole('button', { name: 'Create exercise' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Zercher Squat', muscleGroup: 'quads', equipment: 'barbell', type: 'strength', config: undefined });
  });

  test('Cancel calls onClose without submitting', () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();
    renderSheet({ onClose, onSubmit });

    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('ExerciseFormSheet — hybrid types', () => {
  test('a power exercise needs only a name — no muscle group — and submits fullBody with its defaults', () => {
    const { onSubmit } = renderControlledSheet(EMPTY_EXERCISE_FORM_VALUES);
    chooseType('Power');

    fireEvent.changeText(screen.getByLabelText('Name'), 'Medball slam');
    fireEvent.press(screen.getByRole('button', { name: 'Create exercise' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Medball slam',
      muscleGroup: 'fullBody',
      equipment: undefined,
      type: 'power',
      config: { type: 'power', load: 'weight', restSec: 60, noHeavierAvailable: false },
    });
  });

  test('power shows its rest field at the 1:00 default and steps it', () => {
    renderControlledSheet(EMPTY_EXERCISE_FORM_VALUES);
    chooseType('Power');

    expect(screen.getByText('1:00')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Increase Rest between sets' }));
    expect(screen.getByText('1:15')).toBeTruthy();
  });

  test('a timed-work exercise shows rounds, work, rest, get ready and the lever, with FR-9 defaults', () => {
    const { onSubmit } = renderControlledSheet(EMPTY_EXERCISE_FORM_VALUES);
    chooseType('Timed work');

    expect(screen.getByText('2:00')).toBeTruthy();
    expect(screen.getByText('0:05')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Progress by' })).toHaveTextContent(/Less rest/);

    fireEvent.changeText(screen.getByLabelText('Name'), 'Heavy bag');
    fireEvent.press(screen.getByRole('button', { name: 'Create exercise' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'interval',
        muscleGroup: 'fullBody',
        config: {
          type: 'interval',
          rounds: 3,
          workSec: 120,
          restSec: 60,
          getReadySec: 5,
          lever: 'rest',
          stepSec: 15,
        },
      }),
    );
  });

  test('a mobility exercise shows only its duration, 10:00 by default', () => {
    const { onSubmit } = renderControlledSheet(EMPTY_EXERCISE_FORM_VALUES);
    chooseType('Mobility');

    expect(screen.getByText('10:00')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Progress by' })).toBeNull();

    fireEvent.changeText(screen.getByLabelText('Name'), 'Cooldown');
    fireEvent.press(screen.getByRole('button', { name: 'Create exercise' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'mobility',
        config: { type: 'mobility', durationSec: 600 },
      }),
    );
  });

  test('a strength exercise still needs a muscle group', () => {
    renderControlledSheet(EMPTY_EXERCISE_FORM_VALUES);
    chooseType('Strength');

    fireEvent.changeText(screen.getByLabelText('Name'), 'Zercher Squat');

    expect(screen.getByRole('button', { name: 'Create exercise' }).props.accessibilityState.disabled).toBe(true);
  });
});

describe('ExerciseFormSheet — edit mode', () => {
  test('titles itself "Edit exercise" and shows the seeded values for the given custom exercise', () => {
    renderSheet({
      exercise: makeExercise({ name: 'Garage Press', muscleGroup: 'chest', equipment: 'dumbbell' }),
      values: { name: 'Garage Press', muscleGroup: 'chest', equipment: 'dumbbell', type: 'strength', config: undefined },
    });

    expect(screen.getByText('Edit exercise')).toBeTruthy();
    expect(screen.getByLabelText('Name').props.value).toBe('Garage Press');
    expect(screen.getByRole('button', { name: 'Muscle group' })).toHaveTextContent(/Chest/);
    expect(screen.getByRole('button', { name: 'Equipment' })).toHaveTextContent(/Dumbbell/);
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });

  test('goes straight to the fields — the type is not picked again — with the exercise\'s own config', () => {
    renderSheet({
      exercise: makeExercise({ name: 'Cooldown', muscleGroup: 'fullBody', type: 'mobility' }),
      values: {
        name: 'Cooldown',
        muscleGroup: 'fullBody',
        equipment: undefined,
        type: 'mobility',
        config: { type: 'mobility', durationSec: 900 },
      },
    });

    expect(screen.getByText('Edit exercise')).toBeTruthy();
    expect(screen.getByText('15:00')).toBeTruthy();
    expect(screen.queryByText('Timed work')).toBeNull();
  });

  test('a catalog exercise cannot be opened in this sheet', () => {
    renderSheet({
      exercise: makeExercise({ source: 'catalog' }),
      values: { name: 'Bench Press', muscleGroup: 'chest', equipment: undefined, type: 'strength', config: undefined },
    });

    expect(screen.queryByText('Edit exercise')).toBeNull();
    expect(screen.queryByLabelText('Name')).toBeNull();
  });
});
