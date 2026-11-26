import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { MesoEditorReorderDaysSheet } from '@components/MesoEditorReorderDaysSheet';
import { toExerciseId, type Exercise } from '@domain/catalog';
import { STAMPS } from '../fixtures/stamps';

const exercise = (id: string, name: string): Exercise => ({
  ...STAMPS,
  id: toExerciseId(id),
  name,
  muscleGroup: 'chest',
  source: 'catalog',
  isHidden: false,
});

const PROPS = {
  visible: true,
  order: [1, 2, 3],
  activeDay: 1,
  onChangeOrder: jest.fn(),
  exercisesByDay: {
    1: [{ exerciseId: 'bench', order: 0, sets: 3 }],
    2: [{ exerciseId: 'squat', order: 0, sets: 3 }],
  },
  exercisesById: { bench: exercise('bench', 'Bench Press'), squat: exercise('squat', 'Squat') },
  onDone: jest.fn(),
  onClose: jest.fn(),
};

describe('MesoEditorReorderDaysSheet (GT-270)', () => {
  test('lists the days with their exercises, each with a handle', () => {
    render(<MesoEditorReorderDaysSheet {...PROPS} />);

    expect(screen.getByText('Reorder days')).toBeTruthy();
    expect(within(screen.getByTestId('reorder-day-1')).getByText('Bench Press')).toBeTruthy();
    expect(within(screen.getByTestId('reorder-day-2')).getByText('Squat')).toBeTruthy();
    expect(within(screen.getByTestId('reorder-day-3')).getByText('No exercises yet')).toBeTruthy();
    expect(screen.getByLabelText('Move Day 3')).toBeTruthy();
  });

  test('a dragged day keeps its own number until Done, so the move shows', () => {
    render(<MesoEditorReorderDaysSheet {...PROPS} order={[2, 1, 3]} />);

    const first = within(screen.getByTestId('reorder-day-1'));
    expect(first.getByText('Day 2')).toBeTruthy();
    expect(first.getByText('Squat')).toBeTruthy();
    expect(screen.getByLabelText('Move Day 2')).toBeTruthy();
  });

  test('lights the open day, and the light goes with it to where it was dragged', () => {
    // Day 2 is open; it has been dragged to the top.
    render(<MesoEditorReorderDaysSheet {...PROPS} order={[2, 1, 3]} activeDay={2} />);

    expect(screen.getByTestId('reorder-day-1').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId('reorder-day-2').props.accessibilityState).toEqual({ selected: false });
  });

  test('Done is the only way the order goes anywhere', () => {
    const onDone = jest.fn();
    render(<MesoEditorReorderDaysSheet {...PROPS} onDone={onDone} />);

    fireEvent.press(screen.getByRole('button', { name: 'Done' }));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
