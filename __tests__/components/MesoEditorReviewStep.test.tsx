import { fireEvent, render, screen } from '@testing-library/react-native';

import { toExerciseId, type Exercise } from '@domain/catalog';
import {
  MesoEditorReviewStep,
  type MesoEditorReviewStepProps,
} from '@components/MesoEditorReviewStep';

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

const BASE_PROPS: MesoEditorReviewStepProps = {
  name: 'Push/Legs',
  lengthWeeks: 6,
  daysPerWeek: 2,
  exercisesByDay: {
    1: [{ exerciseId: BENCH_PRESS.id, order: 0, sets: 3 }],
    2: [{ exerciseId: SQUAT.id, order: 0, sets: 1 }],
  },
  exercisesById: { [BENCH_PRESS.id]: BENCH_PRESS, [SQUAT.id]: SQUAT },
  onEditDay: jest.fn(),
};

describe('MesoEditorReviewStep', () => {
  test('matches the step 3 content snapshot', () => {
    const tree = render(<MesoEditorReviewStep {...BASE_PROPS} />).toJSON();

    expect(tree).toMatchSnapshot();
  });

  test('renders the summary card and every day of the week 1 preview', () => {
    render(<MesoEditorReviewStep {...BASE_PROPS} />);

    expect(screen.getByText('Push/Legs')).toBeTruthy();
    expect(screen.getByText('6 weeks · 2 days per week')).toBeTruthy();
    expect(screen.getByText('Day 1')).toBeTruthy();
    expect(screen.getByText('Day 2')).toBeTruthy();
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('3 sets')).toBeTruthy();
    expect(screen.getByText('Squat')).toBeTruthy();
    expect(screen.getByText('1 set')).toBeTruthy();
  });

  test('pressing a day chevron hands that day number back', () => {
    const onEditDay = jest.fn();
    render(<MesoEditorReviewStep {...BASE_PROPS} onEditDay={onEditDay} />);

    fireEvent.press(screen.getByRole('button', { name: 'Edit Day 2' }));

    expect(onEditDay).toHaveBeenCalledWith(2);
  });
});
