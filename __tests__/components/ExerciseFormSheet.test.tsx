import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { toExerciseId, type Exercise } from '@domain/catalog';
import {
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

const STRENGTH_VALUES: ExerciseFormValues = {
  name: 'Garage Press',
  muscleGroup: 'chest',
  equipment: 'dumbbell',
  type: 'strength',
  config: undefined,
};

const BASE_PROPS: ExerciseFormSheetProps = {
  visible: true,
  exercise: makeExercise({ name: 'Garage Press', equipment: 'dumbbell' }),
  values: STRENGTH_VALUES,
  onChangeValues: jest.fn(),
  onSubmit: jest.fn(),
  onClose: jest.fn(),
};

function renderSheet(overrides: Partial<ExerciseFormSheetProps> = {}) {
  const props: ExerciseFormSheetProps = { ...BASE_PROPS, ...overrides };
  render(<ExerciseFormSheet {...props} />);
  return props;
}

// The sheet is fully controlled: this plays the caller applying onChangeValues.
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

describe('ExerciseFormSheet', () => {
  test('renders nothing when not visible', () => {
    renderSheet({ visible: false });

    expect(screen.queryByText('Edit exercise')).toBeNull();
  });

  test('shows the seeded values of the exercise being edited', () => {
    renderSheet();

    expect(screen.getByText('Edit exercise')).toBeTruthy();
    expect(screen.getByLabelText('Name').props.value).toBe('Garage Press');
    expect(screen.getByRole('button', { name: 'Muscle group' })).toHaveTextContent(/Chest/);
    expect(screen.getByRole('button', { name: 'Equipment' })).toHaveTextContent(/Dumbbell/);
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });

  test('a catalog exercise cannot be opened in this sheet', () => {
    renderSheet({ exercise: makeExercise({ source: 'catalog' }) });

    expect(screen.queryByText('Edit exercise')).toBeNull();
    expect(screen.queryByLabelText('Name')).toBeNull();
  });

  test('Save submits the trimmed name with type and config', () => {
    const onSubmit = jest.fn();
    render(
      <ControlledSheet
        initialValues={{ ...STRENGTH_VALUES, name: '  Garage Press  ' }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Garage Press',
      muscleGroup: 'chest',
      equipment: 'dumbbell',
      type: 'strength',
      config: undefined,
    });
  });

  test('Save is disabled while the name is blank', () => {
    renderSheet({ values: { ...STRENGTH_VALUES, name: '   ' } });

    expect(screen.getByRole('button', { name: 'Save' }).props.accessibilityState.disabled).toBe(true);
  });

  test('a non-strength exercise opens on its own config, without asking for the type again', () => {
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

    expect(screen.getByText('15:00')).toBeTruthy();
    expect(screen.queryByText('Timed work')).toBeNull();
  });

  test('Cancel closes without submitting', () => {
    const props = renderSheet();

    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  test('an interval exercise shows its levers in the sheet too', () => {
    renderSheet({
      exercise: makeExercise({ name: 'Heavy bag', muscleGroup: 'fullBody', type: 'interval' }),
      values: {
        name: 'Heavy bag',
        muscleGroup: 'fullBody',
        equipment: undefined,
        type: 'interval',
        config: {
          type: 'interval',
          rounds: 3,
          workSec: 120,
          restSec: 60,
          getReadySec: 5,
          lever: 'workTime',
          stepSec: 10,
        },
      },
    });

    expect(screen.getByRole('radio', { name: 'More work' }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('button', { name: '10 s' })).toBeTruthy();
  });
});
