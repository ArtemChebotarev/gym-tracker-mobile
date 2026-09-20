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

  test('titles itself "New exercise" and reflects the given (empty) values', () => {
    renderSheet();

    expect(screen.getByText('New exercise')).toBeTruthy();
    expect(screen.getByLabelText('Name').props.value).toBe('');
    expect(screen.getByRole('button', { name: 'Create' })).toBeTruthy();
  });

  test('reflects a prefilled name — e.g. seeded from the search-empty-state "Create" action', () => {
    renderSheet({ values: { ...EMPTY_EXERCISE_FORM_VALUES, name: 'Zercher Squat' } });

    expect(screen.getByLabelText('Name').props.value).toBe('Zercher Squat');
  });

  test('Create is disabled until both Name and Muscle group are filled', () => {
    renderControlledSheet(EMPTY_EXERCISE_FORM_VALUES);

    expect(screen.getByRole('button', { name: 'Create' }).props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(screen.getByLabelText('Name'), 'Zercher Squat');
    expect(screen.getByRole('button', { name: 'Create' }).props.accessibilityState.disabled).toBe(true);

    chooseMuscleGroup('Quads');
    expect(screen.getByRole('button', { name: 'Create' }).props.accessibilityState.disabled).toBe(false);
  });

  test('a name of only whitespace does not enable Create', () => {
    renderControlledSheet(EMPTY_EXERCISE_FORM_VALUES);

    fireEvent.changeText(screen.getByLabelText('Name'), '   ');
    chooseMuscleGroup('Chest');

    expect(screen.getByRole('button', { name: 'Create' }).props.accessibilityState.disabled).toBe(true);
  });

  test('trims leading/trailing whitespace from the name on submit', () => {
    const { onSubmit } = renderControlledSheet({ ...EMPTY_EXERCISE_FORM_VALUES, name: '  Zercher Squat  ' });

    chooseMuscleGroup('Quads');
    fireEvent.press(screen.getByRole('button', { name: 'Create' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Zercher Squat', muscleGroup: 'quads', equipment: undefined });
  });

  test('a name matching an existing catalog exercise is allowed — different entities, no dedup check', () => {
    const { onSubmit } = renderControlledSheet({ ...EMPTY_EXERCISE_FORM_VALUES, name: 'Bench Press' });

    chooseMuscleGroup('Chest');
    fireEvent.press(screen.getByRole('button', { name: 'Create' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Bench Press', muscleGroup: 'chest', equipment: undefined });
  });

  test('equipment is optional and submits alongside name/muscle group when chosen', () => {
    const { onSubmit } = renderControlledSheet({ ...EMPTY_EXERCISE_FORM_VALUES, name: 'Zercher Squat' });

    chooseMuscleGroup('Quads');
    chooseEquipment('Barbell');
    fireEvent.press(screen.getByRole('button', { name: 'Create' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Zercher Squat', muscleGroup: 'quads', equipment: 'barbell' });
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

describe('ExerciseFormSheet — edit mode', () => {
  test('titles itself "Edit exercise" and shows the seeded values for the given custom exercise', () => {
    renderSheet({
      exercise: makeExercise({ name: 'Garage Press', muscleGroup: 'chest', equipment: 'dumbbell' }),
      values: { name: 'Garage Press', muscleGroup: 'chest', equipment: 'dumbbell' },
    });

    expect(screen.getByText('Edit exercise')).toBeTruthy();
    expect(screen.getByLabelText('Name').props.value).toBe('Garage Press');
    expect(screen.getByRole('button', { name: 'Muscle group' })).toHaveTextContent(/Chest/);
    expect(screen.getByRole('button', { name: 'Equipment' })).toHaveTextContent(/Dumbbell/);
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });

  test('a catalog exercise cannot be opened in this sheet', () => {
    renderSheet({
      exercise: makeExercise({ source: 'catalog' }),
      values: { name: 'Bench Press', muscleGroup: 'chest', equipment: undefined },
    });

    expect(screen.queryByText('Edit exercise')).toBeNull();
    expect(screen.queryByLabelText('Name')).toBeNull();
  });
});
