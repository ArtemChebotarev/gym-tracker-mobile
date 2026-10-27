import { fireEvent, render, screen } from '@testing-library/react-native';

import { toExerciseId, type Exercise } from '@domain/catalog';
import {
  MesoEditorReviewStep,
  type MesoEditorReviewStepProps,
} from '@components/MesoEditorReviewStep';
import { COOLDOWN, HEAVY_BAG, MEDBALL_THROW } from '../fixtures/hybridExercises';
import { STAMPS } from '../fixtures/stamps';

const BENCH_PRESS: Exercise = {
  ...STAMPS,
  id: toExerciseId('bench-press'),
  name: 'Bench Press',
  muscleGroup: 'chest',
  source: 'catalog',
  isHidden: false,
};

const SQUAT: Exercise = {
  ...STAMPS,
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

  test('shows sets, an interval’s rounds, and nothing for mobility (GT-157, GT-190)', () => {
    render(
      <MesoEditorReviewStep
        {...BASE_PROPS}
        daysPerWeek={1}
        exercisesByDay={{
          1: [
            { exerciseId: BENCH_PRESS.id, order: 0, sets: 3 },
            { exerciseId: MEDBALL_THROW.id, order: 1, sets: 3 },
            { exerciseId: HEAVY_BAG.id, order: 2, sets: 2 },
            { exerciseId: COOLDOWN.id, order: 3, sets: 2 },
          ],
        }}
        exercisesById={{
          [BENCH_PRESS.id]: BENCH_PRESS,
          [MEDBALL_THROW.id]: MEDBALL_THROW,
          [HEAVY_BAG.id]: HEAVY_BAG,
          [COOLDOWN.id]: COOLDOWN,
        }}
      />,
    );

    // Bench press and the medball throw alike: a power exercise has only its sets (GT-188).
    expect(screen.getAllByText('3 sets')).toHaveLength(2);
    // The heavy bag's two rounds on the day (GT-190).
    expect(screen.getByText('2 rounds')).toBeTruthy();
    // Cooldown, a mobility exercise, shows nothing: no length is planned (GT-191).
    expect(screen.queryByText('10:00')).toBeNull();
  });
});
