import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import {
  WorkoutExerciseMenuSheet,
  type WorkoutExerciseMenuSheetProps,
} from '@components/WorkoutExerciseMenuSheet';
import type { WorkoutExercise } from '@usecases/workoutSession';

// BottomSheet's SafeAreaView throws without a SafeAreaProvider ancestor.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

// The first of several exercises, with one of its two sets logged — as 088 builds it.
const FIRST_STARTED: WorkoutExercise = {
  sessionExerciseId: 'session-exercise-leg-extension',
  exerciseId: 'leg-extension',
  name: 'Leg extension',
  muscleGroup: 'quads',
  equipment: 'machine',
  targetRir: 2,
  status: 'planned',
  rows: [
    {
      setNumber: 1,
      targetReps: 11,
      suggestedWeight: 77,
      log: { weight: 77, reps: 12 },
      indicator: { kind: 'over', diff: 1 },
      isFirstUnlogged: false,
    },
    { setNumber: 2, targetReps: 11, suggestedWeight: 77, isFirstUnlogged: true },
  ],
  hasSkippedRows: false,
  plannedSetCount: 2,
  loggedSetCount: 1,
  hasLoggedSets: true,
  actions: {
    canReplace: true,
    canAddSet: true,
    canRemoveLastSet: true,
    canMoveUp: false,
    canMoveDown: true,
    canSkip: true,
    canUnskip: false,
    canDelete: true,
  },
};

// A skipped exercise in the middle, nothing logged.
const SKIPPED: WorkoutExercise = {
  ...FIRST_STARTED,
  sessionExerciseId: 'session-exercise-split-squat',
  exerciseId: 'split-squat',
  name: 'Bulgarian split squat',
  status: 'skipped',
  rows: [],
  hasSkippedRows: true,
  loggedSetCount: 0,
  hasLoggedSets: false,
  actions: { ...FIRST_STARTED.actions, canMoveUp: true, canSkip: false, canUnskip: true },
};

function makeProps(
  overrides: Partial<WorkoutExerciseMenuSheetProps> = {},
): WorkoutExerciseMenuSheetProps {
  return {
    visible: true,
    onClose: jest.fn(),
    exercise: FIRST_STARTED,
    onReplace: jest.fn(),
    onCommand: jest.fn(),
    ...overrides,
  };
}

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  alertSpy.mockRestore();
});

/** Presses the named button of the most recent Alert.alert call. */
function pressAlertButton(text: string) {
  const buttons = alertSpy.mock.calls.at(-1)?.[2] as AlertButton[] | undefined;
  const button = buttons?.find((candidate) => candidate.text === text);
  if (!button) {
    throw new Error(`No "${text}" button in the last alert`);
  }
  act(() => button.onPress?.());
}

describe('WorkoutExerciseMenuSheet — snapshots', () => {
  test('DoD: the first exercise with a set logged — Move up disabled, Skip and Delete available', () => {
    const tree = renderWithSafeArea(<WorkoutExerciseMenuSheet {...makeProps()} />);

    expect(screen.getByText('Leg extension')).toBeTruthy();
    expect(screen.getByText('2 sets planned · 1 logged')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Move up' })).toBeDisabled();
    expect(screen.getByText('Already first')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Skip exercise' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Delete exercise' })).toBeEnabled();
    expect(tree.toJSON()).toMatchSnapshot();
  });

  test('DoD: a skipped exercise — Unskip in place of Skip', () => {
    const tree = renderWithSafeArea(
      <WorkoutExerciseMenuSheet {...makeProps({ exercise: SKIPPED })} />,
    );

    expect(screen.getByRole('button', { name: 'Unskip exercise' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Skip exercise' })).toBeNull();
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

describe('WorkoutExerciseMenuSheet', () => {
  test('a disabled action does nothing', () => {
    const props = makeProps();
    renderWithSafeArea(<WorkoutExerciseMenuSheet {...props} />);

    fireEvent.press(screen.getByRole('button', { name: 'Move up' }));

    expect(props.onClose).not.toHaveBeenCalled();
    expect(props.onCommand).not.toHaveBeenCalled();
  });

  test.each([
    ['Add set', 'addSet'],
    ['Remove last set', 'removeLastSet'],
    ['Move down', 'moveDown'],
    ['Skip exercise', 'skip'],
  ] as const)('%s closes the sheet and runs %s', (label, command) => {
    const props = makeProps();
    renderWithSafeArea(<WorkoutExerciseMenuSheet {...props} />);

    fireEvent.press(screen.getByRole('button', { name: label }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onCommand).toHaveBeenCalledWith(command);
  });

  test('Unskip exercise runs unskip', () => {
    const props = makeProps({ exercise: SKIPPED });
    renderWithSafeArea(<WorkoutExerciseMenuSheet {...props} />);

    fireEvent.press(screen.getByRole('button', { name: 'Unskip exercise' }));

    expect(props.onCommand).toHaveBeenCalledWith('unskip');
  });

  test('Replace exercise closes the sheet and hands over to the picker', () => {
    const props = makeProps();
    renderWithSafeArea(<WorkoutExerciseMenuSheet {...props} />);

    fireEvent.press(screen.getByRole('button', { name: 'Replace exercise' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onReplace).toHaveBeenCalledTimes(1);
    expect(props.onCommand).not.toHaveBeenCalled();
  });

  test('Delete exercise deletes only once confirmed, warning about the logged set', () => {
    const props = makeProps();
    renderWithSafeArea(<WorkoutExerciseMenuSheet {...props} />);

    fireEvent.press(screen.getByRole('button', { name: 'Delete exercise' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      'Delete exercise?',
      "Its 1 set logged will be deleted too. It won't carry over to next week.",
      expect.any(Array),
    );
    expect(props.onCommand).not.toHaveBeenCalled();

    pressAlertButton('Delete');

    expect(props.onCommand).toHaveBeenCalledWith('delete');
  });

  test('Delete exercise with nothing logged still asks, without the logged-sets warning', () => {
    const props = makeProps({ exercise: SKIPPED });
    renderWithSafeArea(<WorkoutExerciseMenuSheet {...props} />);

    fireEvent.press(screen.getByRole('button', { name: 'Delete exercise' }));
    expect(alertSpy).toHaveBeenCalledWith(
      'Delete exercise?',
      "It won't carry over to next week.",
      expect.any(Array),
    );
    pressAlertButton('Cancel');

    expect(props.onCommand).not.toHaveBeenCalled();
  });
});
