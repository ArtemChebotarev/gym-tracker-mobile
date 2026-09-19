import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { WorkoutMenuSheet, type WorkoutMenuSheetProps } from '@components/WorkoutMenuSheet';
import type { WorkoutSessionModel } from '@usecases/workoutSession';

// BottomSheet's SafeAreaView throws without a SafeAreaProvider ancestor.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

const HEADER: WorkoutSessionModel['header'] = {
  weekNumber: 6,
  dayNumber: 2,
  mesocycleName: 'Upper/lower',
  isDeload: false,
  isCompleted: false,
};

// What 088 allows in each mode: everything live with nothing logged, nothing session-level in
// read-only or preview.
const LIVE = { header: HEADER, actions: { canAddExercise: true, canSkipWorkout: true } };
const READ_ONLY = {
  header: { ...HEADER, isCompleted: true },
  actions: { canAddExercise: false, canSkipWorkout: false },
};
const PREVIEW = {
  header: { ...HEADER, weekNumber: 7 },
  actions: { canAddExercise: false, canSkipWorkout: false },
};

function makeProps(overrides: Partial<WorkoutMenuSheetProps> = {}): WorkoutMenuSheetProps {
  return {
    visible: true,
    onClose: jest.fn(),
    model: LIVE,
    onAddExercise: jest.fn(),
    onSkipWorkout: jest.fn(),
    onRenameMesocycle: jest.fn(),
    onOpenMesocycleHistory: jest.fn(),
    onStopMesocycle: jest.fn(),
    ...overrides,
  };
}

/** The sheet's actions, in order — every button but the backdrop's `Close`. */
function actionLabels(): string[] {
  return screen
    .getAllByRole('button')
    .map((button) => button.props.accessibilityLabel as string | undefined)
    .filter((label): label is string => label !== undefined && label !== 'Close');
}

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  alertSpy.mockRestore();
});

describe('WorkoutMenuSheet — snapshots', () => {
  test('DoD: live', () => {
    const tree = renderWithSafeArea(<WorkoutMenuSheet {...makeProps()} />);
    expect(actionLabels()).toEqual([
      'Add exercise',
      'Skip workout',
      'Rename mesocycle',
      'Mesocycle history',
      'Stop mesocycle',
    ]);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  test('DoD: read-only', () => {
    const tree = renderWithSafeArea(<WorkoutMenuSheet {...makeProps({ model: READ_ONLY })} />);
    expect(actionLabels()).toEqual(['Rename mesocycle', 'Mesocycle history', 'Stop mesocycle']);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  test('DoD: preview', () => {
    const tree = renderWithSafeArea(<WorkoutMenuSheet {...makeProps({ model: PREVIEW })} />);
    expect(actionLabels()).toEqual(['Rename mesocycle', 'Mesocycle history', 'Stop mesocycle']);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

describe('WorkoutMenuSheet', () => {
  test('titles the sheet with the day and the mesocycle', () => {
    renderWithSafeArea(<WorkoutMenuSheet {...makeProps()} />);

    expect(screen.getByText('Week 6 Day 2')).toBeTruthy();
    expect(screen.getByText('Upper/lower')).toBeTruthy();
  });

  test('DoD: no Skip workout once a set is logged', () => {
    renderWithSafeArea(
      <WorkoutMenuSheet
        {...makeProps({
          model: { header: HEADER, actions: { canAddExercise: true, canSkipWorkout: false } },
        })}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Skip workout' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Add exercise' })).toBeTruthy();
  });

  test.each([
    ['Add exercise', 'onAddExercise'],
    ['Rename mesocycle', 'onRenameMesocycle'],
    ['Mesocycle history', 'onOpenMesocycleHistory'],
    ['Stop mesocycle', 'onStopMesocycle'],
  ] as const)('%s closes the sheet and calls %s', (label, handler) => {
    const props = makeProps();
    renderWithSafeArea(<WorkoutMenuSheet {...props} />);

    fireEvent.press(screen.getByRole('button', { name: label }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props[handler]).toHaveBeenCalledTimes(1);
  });

  test('Skip workout skips only once the confirmation is accepted', () => {
    const props = makeProps();
    renderWithSafeArea(<WorkoutMenuSheet {...props} />);

    fireEvent.press(screen.getByRole('button', { name: 'Skip workout' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith('Skip workout?', expect.any(String), expect.any(Array));
    expect(props.onSkipWorkout).not.toHaveBeenCalled();

    const buttons = alertSpy.mock.calls.at(-1)?.[2] as AlertButton[];
    const skip = buttons.find((button) => button.text === 'Skip');
    expect(skip?.style).toBe('destructive');
    act(() => skip?.onPress?.());

    expect(props.onSkipWorkout).toHaveBeenCalledTimes(1);
  });
});
