import { fireEvent, render, screen } from '@testing-library/react-native';

import { toExerciseId } from '@domain/catalog';
import type { Exercise } from '@domain/catalog';
import { MesoEditorDaysStep, type MesoEditorDaysStepProps } from '@components/MesoEditorDaysStep';

const BENCH_PRESS: Exercise = {
  id: toExerciseId('bench-press'),
  name: 'Bench Press',
  muscleGroup: 'chest',
  source: 'catalog',
  isHidden: false,
};

const SQUAT: Exercise = {
  id: toExerciseId('squat'),
  name: 'Squat',
  muscleGroup: 'quads',
  source: 'catalog',
  isHidden: false,
};

const BASE_PROPS: MesoEditorDaysStepProps = {
  daysPerWeek: 2,
  activeDay: 1,
  onChangeActiveDay: jest.fn(),
  exercisesByDay: {
    1: [{ exerciseId: BENCH_PRESS.id, order: 0, sets: 3 }],
    2: [{ exerciseId: SQUAT.id, order: 0, sets: 2 }],
  },
  exercisesById: { [BENCH_PRESS.id]: BENCH_PRESS, [SQUAT.id]: SQUAT },
  onChangeSets: jest.fn(),
  onRemoveExercise: jest.fn(),
  onReorderExercises: jest.fn(),
  onAddExercise: jest.fn(),
};

describe('MesoEditorDaysStep', () => {
  test('matches the step 2 content snapshot', () => {
    const tree = render(<MesoEditorDaysStep {...BASE_PROPS} />).toJSON();

    expect(tree).toMatchSnapshot();
  });

  test('renders day tabs, the column header, and the active day exercises', () => {
    render(<MesoEditorDaysStep {...BASE_PROPS} />);

    expect(screen.getByRole('button', { name: 'Day 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Day 2' })).toBeTruthy();
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('Chest')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Exercise')).toBeTruthy();
    expect(screen.getByText('Sets')).toBeTruthy();
    expect(screen.queryByText('Squat')).toBeNull();
  });

  test('omits the column header when the active day has no exercises', () => {
    render(<MesoEditorDaysStep {...BASE_PROPS} exercisesByDay={{}} />);

    expect(screen.queryByText('Exercise')).toBeNull();
    expect(screen.queryByText('Sets')).toBeNull();
  });

  test('pressing a day tab calls onChangeActiveDay', () => {
    const onChangeActiveDay = jest.fn();
    render(<MesoEditorDaysStep {...BASE_PROPS} onChangeActiveDay={onChangeActiveDay} />);

    fireEvent.press(screen.getByRole('button', { name: 'Day 2' }));

    expect(onChangeActiveDay).toHaveBeenCalledWith(2);
  });

  test('pressing the sets stepper calls onChangeSets with the day and row index', () => {
    const onChangeSets = jest.fn();
    render(<MesoEditorDaysStep {...BASE_PROPS} onChangeSets={onChangeSets} />);

    fireEvent.press(screen.getByRole('button', { name: 'Increase Bench Press sets' }));

    expect(onChangeSets).toHaveBeenCalledWith(1, 0, 4);
  });

  test('pressing the remove button calls onRemoveExercise with the day and row index', () => {
    const onRemoveExercise = jest.fn();
    render(<MesoEditorDaysStep {...BASE_PROPS} onRemoveExercise={onRemoveExercise} />);

    fireEvent.press(screen.getByRole('button', { name: 'Remove Bench Press' }));

    expect(onRemoveExercise).toHaveBeenCalledWith(1, 0);
  });

  test('pressing Add exercise calls onAddExercise with the active day', () => {
    const onAddExercise = jest.fn();
    render(<MesoEditorDaysStep {...BASE_PROPS} activeDay={2} onAddExercise={onAddExercise} />);

    fireEvent.press(screen.getByRole('button', { name: 'Add exercise' }));

    expect(onAddExercise).toHaveBeenCalledWith(2);
  });

  test('renders a drag handle for each row (task 080: drag-to-reorder)', () => {
    render(<MesoEditorDaysStep {...BASE_PROPS} />);

    expect(screen.getByLabelText('Reorder Bench Press')).toBeTruthy();
  });
});
