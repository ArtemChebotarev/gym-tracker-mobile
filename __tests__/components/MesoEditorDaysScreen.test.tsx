import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { toExerciseId } from '@domain/catalog';
import type { Exercise } from '@domain/catalog';
import {
  MesoEditorDaysScreen,
  type MesoEditorDaysScreenProps,
} from '@components/MesoEditorDaysScreen';

// Same fixture MesoEditorBasicsScreen.test.tsx uses — SafeAreaView throws without a
// SafeAreaProvider ancestor, and initialMetrics resolves it synchronously.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

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

const BASE_PROPS: MesoEditorDaysScreenProps = {
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
  onAddExercise: jest.fn(),
  onBack: jest.fn(),
  onContinue: jest.fn(),
};

describe('MesoEditorDaysScreen', () => {
  test('matches the step 2 snapshot', () => {
    const tree = renderWithSafeArea(<MesoEditorDaysScreen {...BASE_PROPS} />).toJSON();

    expect(tree).toMatchSnapshot();
  });

  test('renders the header, day tabs, day heading, and the active day exercises', () => {
    renderWithSafeArea(<MesoEditorDaysScreen {...BASE_PROPS} />);

    expect(screen.getByText('Step 2 of 3')).toBeTruthy();
    expect(screen.getByText('Days & exercises')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Day 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Day 2' })).toBeTruthy();
    // "Day 1" appears both as a day tab and as the content heading — getAllByText, not getByText.
    expect(screen.getAllByText('Day 1').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('1 exercise')).toBeTruthy();
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('Chest')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('sets')).toBeTruthy();
    expect(screen.getByText('Every day needs at least one exercise')).toBeTruthy();
    expect(screen.queryByText('Squat')).toBeNull();
  });

  test('pressing a day tab calls onChangeActiveDay', () => {
    const onChangeActiveDay = jest.fn();
    renderWithSafeArea(<MesoEditorDaysScreen {...BASE_PROPS} onChangeActiveDay={onChangeActiveDay} />);

    fireEvent.press(screen.getByRole('button', { name: 'Day 2' }));

    expect(onChangeActiveDay).toHaveBeenCalledWith(2);
  });

  test('pressing the sets stepper calls onChangeSets with the day and row index', () => {
    const onChangeSets = jest.fn();
    renderWithSafeArea(<MesoEditorDaysScreen {...BASE_PROPS} onChangeSets={onChangeSets} />);

    fireEvent.press(screen.getByRole('button', { name: 'Increase Bench Press sets' }));

    expect(onChangeSets).toHaveBeenCalledWith(1, 0, 4);
  });

  test('pressing the remove button calls onRemoveExercise with the day and row index', () => {
    const onRemoveExercise = jest.fn();
    renderWithSafeArea(<MesoEditorDaysScreen {...BASE_PROPS} onRemoveExercise={onRemoveExercise} />);

    fireEvent.press(screen.getByRole('button', { name: 'Remove Bench Press' }));

    expect(onRemoveExercise).toHaveBeenCalledWith(1, 0);
  });

  test('pressing Add exercise calls onAddExercise with the active day', () => {
    const onAddExercise = jest.fn();
    renderWithSafeArea(<MesoEditorDaysScreen {...BASE_PROPS} activeDay={2} onAddExercise={onAddExercise} />);

    fireEvent.press(screen.getByRole('button', { name: 'Add exercise' }));

    expect(onAddExercise).toHaveBeenCalledWith(2);
  });

  test('pressing Back calls onBack', () => {
    const onBack = jest.fn();
    renderWithSafeArea(<MesoEditorDaysScreen {...BASE_PROPS} onBack={onBack} />);

    fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalled();
  });

  describe('Continue gating', () => {
    test('is disabled when a day is empty', () => {
      renderWithSafeArea(
        <MesoEditorDaysScreen {...BASE_PROPS} exercisesByDay={{ 1: BASE_PROPS.exercisesByDay[1]! }} />,
      );

      expect(
        screen.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled,
      ).toBe(true);
    });

    test('is enabled when every day has at least one exercise', () => {
      renderWithSafeArea(<MesoEditorDaysScreen {...BASE_PROPS} />);

      expect(
        screen.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled,
      ).toBe(false);
    });

    test('pressing Continue calls onContinue when enabled', () => {
      const onContinue = jest.fn();
      renderWithSafeArea(<MesoEditorDaysScreen {...BASE_PROPS} onContinue={onContinue} />);

      fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

      expect(onContinue).toHaveBeenCalled();
    });
  });
});
