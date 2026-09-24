import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { WorkoutScreen, type WorkoutScreenProps } from '@components/WorkoutScreen';
import type { WorkoutExercise, WorkoutSessionModel } from '@usecases/workoutSession';

// SafeAreaView (used by RootScreen) throws without a SafeAreaProvider ancestor — same fixture
// RootScreen.test.tsx uses.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

// Local noon, so the snapshot's weekday doesn't depend on the test machine's time zone.
const STARTED_AT = new Date(2026, 8, 15, 12).toISOString();

const NO_ACTIONS: WorkoutExercise['actions'] = {
  canReplace: false,
  canAddSet: false,
  canRemoveLastSet: false,
  canMoveUp: false,
  canMoveDown: false,
  canSkip: false,
  canUnskip: false,
  canDelete: false,
};

function makeExercise(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
  return {
    sessionExerciseId: 'session-exercise-1',
    exerciseId: 'exercise-bench-press',
    name: 'Bench press',
    muscleGroup: 'chest',
    targetRir: 2,
    status: 'planned',
    rows: [],
    plannedSetCount: 0,
    loggedSetCount: 0,
    hasLoggedSets: false,
    actions: NO_ACTIONS,
    ...overrides,
  };
}

const LIVE: WorkoutSessionModel = {
  sessionId: 'session-1',
  mesoId: 'meso-1',
  mode: 'live',
  header: {
    weekNumber: 6,
    dayNumber: 2,
    date: STARTED_AT,
    mesocycleName: 'Upper/lower',
    isDeload: false,
    isCompleted: false,
  },
  progress: 0.4,
  exercises: [makeExercise()],
  actions: { canAddExercise: true, canSkipWorkout: false, canStopMesocycle: true },
  showFinish: false,
  showFinishMesocycle: false,
  showPlanNextMesocycle: false,
};

const COMPLETED: WorkoutSessionModel = {
  ...LIVE,
  mode: 'readonly',
  header: { ...LIVE.header, isCompleted: true },
  progress: 1,
  actions: { canAddExercise: false, canSkipWorkout: false, canStopMesocycle: true },
};

const PREVIEW: WorkoutSessionModel = {
  mesoId: 'meso-1',
  mode: 'preview',
  header: {
    weekNumber: 7,
    dayNumber: 3,
    mesocycleName: 'Upper/lower',
    isDeload: false,
    isCompleted: false,
  },
  progress: 0,
  exercises: [makeExercise({ targetRir: undefined })],
  actions: { canAddExercise: false, canSkipWorkout: false, canStopMesocycle: true },
  showFinish: false,
  showFinishMesocycle: false,
  showPlanNextMesocycle: false,
  unlocksAfter: { weekNumber: 6, dayNumber: 3 },
};

function makeProps(overrides: Partial<WorkoutScreenProps> = {}): WorkoutScreenProps {
  return {
    model: LIVE,
    isPending: false,
    onOpenGrid: jest.fn(),
    onPlanNextMesocycle: jest.fn(),
    menuActions: {
      addExercise: jest.fn(),
      skipWorkout: jest.fn(),
      renameMesocycle: jest.fn(),
      mesocycleHistory: jest.fn(),
      stopMesocycle: jest.fn(),
    },
    onOpenExerciseHistory: jest.fn(),
    onExerciseMenuAction: jest.fn(),
    onLogSet: jest.fn(),
    onUnlogSet: jest.fn(),
    isSaving: false,
    onFinish: jest.fn(),
    isFinishing: false,
    onOpenNext: jest.fn(),
    onFinishMesocycle: jest.fn(),
    isFinishingMesocycle: false,
    fallback: {
      title: 'Pick another workout',
      description: 'Choose another day to train.',
      actionLabel: 'Go back',
      onAction: jest.fn(),
    },
    ...overrides,
  };
}

function renderedProgress(): number | undefined {
  return screen.getByRole('progressbar', { name: 'Workout progress' }).props.accessibilityValue
    ?.now;
}

describe('WorkoutScreen header', () => {
  test.each([
    ['live', LIVE],
    ['completed', COMPLETED],
    ['preview', PREVIEW],
  ])('matches the %s snapshot', (_mode, model) => {
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model })} />);

    expect(screen.toJSON()).toMatchSnapshot();
  });

  test('shows Week N with a faint Day N, and the date · mesocycle subtitle', () => {
    renderWithSafeArea(<WorkoutScreen {...makeProps()} />);

    expect(screen.getByText('Week 6 Day 2')).toBeTruthy();
    expect(screen.getByText('Tue, 15 Sep · Upper/lower')).toBeTruthy();
  });

  test('shows only the mesocycle name under the title of a session that has not started', () => {
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model: PREVIEW })} />);

    expect(screen.getByText('Week 7 Day 3')).toBeTruthy();
    expect(screen.getByText('Upper/lower')).toBeTruthy();
  });

  test('shows the completed check on a completed session only', () => {
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model: COMPLETED })} />);
    expect(screen.getByTestId('workout-completed-check')).toBeTruthy();

    screen.rerender(
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
        <WorkoutScreen {...makeProps({ model: LIVE })} />
      </SafeAreaProvider>,
    );
    expect(screen.queryByTestId('workout-completed-check')).toBeNull();
  });

  test('shows the Deload badge on a deload session only, next to the completed check', () => {
    const deload: WorkoutSessionModel = {
      ...COMPLETED,
      header: { ...COMPLETED.header, isDeload: true },
    };
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model: deload })} />);
    expect(screen.getByText('Deload')).toBeTruthy();
    expect(screen.getByTestId('workout-completed-check')).toBeTruthy();

    screen.rerender(
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
        <WorkoutScreen {...makeProps({ model: LIVE })} />
      </SafeAreaProvider>,
    );
    expect(screen.queryByTestId('workout-deload-badge')).toBeNull();
  });

  test.each([
    ['live', LIVE, 40],
    ['completed', COMPLETED, 100],
    ['preview', PREVIEW, 0],
  ])("fills the %s progress bar with the model's progress", (_mode, model, percent) => {
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model })} />);

    expect(renderedProgress()).toBe(percent);
  });

  test.each([
    ['live', LIVE],
    ['completed', COMPLETED],
    ['preview', PREVIEW],
  ])('the grid and ⋯ buttons are there in %s mode', (_mode, model) => {
    const onOpenGrid = jest.fn();
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model, onOpenGrid })} />);

    fireEvent.press(screen.getByRole('button', { name: 'Mesocycle overview' }));

    expect(onOpenGrid).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('action-menu')).toBeTruthy();
  });

  test('the ⋯ menu lists what the session allows, and picking one runs it', () => {
    const menuActions = {
      addExercise: jest.fn(),
      skipWorkout: jest.fn(),
      renameMesocycle: jest.fn(),
      mesocycleHistory: jest.fn(),
      stopMesocycle: jest.fn(),
    };
    // A completed session can neither take an exercise nor be skipped (088) — those are left out.
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model: COMPLETED, menuActions })} />);

    expect(screen.queryByTestId('action-menu-addExercise')).toBeNull();
    expect(screen.queryByTestId('action-menu-skipWorkout')).toBeNull();
    fireEvent(screen.getByTestId('action-menu-stopMesocycle'), 'buttonPress');

    expect(menuActions.stopMesocycle).toHaveBeenCalledTimes(1);
  });
});

describe('WorkoutScreen list', () => {
  test('lists the exercises in model order', () => {
    const model: WorkoutSessionModel = {
      ...LIVE,
      exercises: [
        makeExercise({ sessionExerciseId: 'a', name: 'Bench press' }),
        makeExercise({ sessionExerciseId: 'b', name: 'Barbell row' }),
      ],
    };
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model })} />);

    const names = screen.getAllByText(/Bench press|Barbell row/).map((node) => node.props.children);
    expect(names).toEqual(['Bench press', 'Barbell row']);
  });

  test('shows the group chip only where the muscle group changes', () => {
    const model: WorkoutSessionModel = {
      ...LIVE,
      exercises: [
        makeExercise({ sessionExerciseId: 'a', name: 'Bench press', muscleGroup: 'chest' }),
        makeExercise({ sessionExerciseId: 'b', name: 'Incline press', muscleGroup: 'chest' }),
        makeExercise({ sessionExerciseId: 'c', name: 'Barbell row', muscleGroup: 'back' }),
      ],
    };
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model })} />);

    expect(screen.getAllByTestId('exercise-group-chip')).toHaveLength(2);
    expect(screen.getByText('Chest')).toBeTruthy();
    expect(screen.getByText('Back')).toBeTruthy();
  });

  test("hands the pressed card's exercise to the history handler and to its menu", () => {
    const onOpenExerciseHistory = jest.fn();
    const onExerciseMenuAction = jest.fn();
    renderWithSafeArea(
      <WorkoutScreen {...makeProps({ onOpenExerciseHistory, onExerciseMenuAction })} />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Bench press history' }));
    fireEvent(screen.getByTestId('exercise-menu-session-exercise-1-delete'), 'buttonPress');

    expect(onOpenExerciseHistory).toHaveBeenCalledWith(LIVE.exercises[0]);
    expect(onExerciseMenuAction).toHaveBeenCalledWith(LIVE.exercises[0], 'delete');
  });

  test('a preview names the session that unlocks it', () => {
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model: PREVIEW })} />);

    expect(screen.getByText('Unlocks when you finish Week 6 Day 3')).toBeTruthy();
  });

  test('a live session has no unlock caption', () => {
    renderWithSafeArea(<WorkoutScreen {...makeProps()} />);

    expect(screen.queryByText(/Unlocks when you finish/)).toBeNull();
  });
});

describe('WorkoutScreen Finish workout', () => {
  const DONE: WorkoutSessionModel = {
    ...LIVE,
    exercises: [
      makeExercise({ sessionExerciseId: 'a', status: 'completed' }),
      makeExercise({ sessionExerciseId: 'b', name: 'Barbell row', status: 'skipped' }),
    ],
    showFinish: true,
  };

  test('DoD: there is no button, not even a disabled one, while an exercise is planned', () => {
    renderWithSafeArea(<WorkoutScreen {...makeProps()} />);

    expect(screen.queryByRole('button', { name: 'Finish workout' })).toBeNull();
  });

  test('shows the button once every exercise is completed or skipped, and finishes on press', () => {
    const onFinish = jest.fn();
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model: DONE, onFinish })} />);

    fireEvent.press(screen.getByRole('button', { name: 'Finish workout' }));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  test('disables the button while Finish is being saved', () => {
    const onFinish = jest.fn();
    renderWithSafeArea(
      <WorkoutScreen {...makeProps({ model: DONE, onFinish, isFinishing: true })} />,
    );

    const button = screen.getByRole('button', { name: 'Finish workout' });
    fireEvent.press(button);

    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    expect(onFinish).not.toHaveBeenCalled();
  });

  test('a read-only session has no Finish, no exercise ⋯, and nothing to edit', () => {
    const readonly: WorkoutSessionModel = {
      ...COMPLETED,
      exercises: [
        makeExercise({
          status: 'completed',
          rows: [
            {
              setNumber: 1,
              targetReps: 10,
              suggestedWeight: 60,
              log: { weight: 60, reps: 10 },
              indicator: { kind: 'hit' },
              isFirstUnlogged: false,
            },
          ],
          plannedSetCount: 1,
          loggedSetCount: 1,
          hasLoggedSets: true,
        }),
      ],
    };
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model: readonly })} />);

    expect(screen.queryByRole('button', { name: 'Finish workout' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Bench press menu' })).toBeNull();
    expect(screen.queryAllByRole('checkbox')).toEqual([]);
    expect(screen.queryByLabelText('Set 1 reps')).toBeNull();
  });
});

describe('WorkoutScreen Next workout', () => {
  test('a read-only session with a next one offers it, and opens it on press', () => {
    const onOpenNext = jest.fn();
    renderWithSafeArea(
      <WorkoutScreen
        {...makeProps({ model: { ...COMPLETED, nextSessionId: 'session-2' }, onOpenNext })}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Next workout' }));

    expect(onOpenNext).toHaveBeenCalledWith('session-2');
  });

  test('no Next workout without a next session', () => {
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model: COMPLETED })} />);

    expect(screen.queryByRole('button', { name: 'Next workout' })).toBeNull();
  });
});

describe('WorkoutScreen Finish mesocycle', () => {
  test('DoD: the last workout of a block offers to finish it, and does so on press (052)', () => {
    const onFinishMesocycle = jest.fn();
    renderWithSafeArea(
      <WorkoutScreen
        {...makeProps({
          model: { ...COMPLETED, showFinishMesocycle: true },
          onFinishMesocycle,
        })}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Finish mesocycle' }));

    expect(onFinishMesocycle).toHaveBeenCalledTimes(1);
  });

  test('not there while the block still has workouts left', () => {
    renderWithSafeArea(
      <WorkoutScreen {...makeProps({ model: { ...COMPLETED, nextSessionId: 'session-2' } })} />,
    );

    expect(screen.getByRole('button', { name: 'Next workout' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Finish mesocycle' })).toBeNull();
  });

  test('waits while the block is being closed, so a double tap cannot repeat it', () => {
    const onFinishMesocycle = jest.fn();
    renderWithSafeArea(
      <WorkoutScreen
        {...makeProps({
          model: { ...COMPLETED, showFinishMesocycle: true },
          onFinishMesocycle,
          isFinishingMesocycle: true,
        })}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Finish mesocycle' }));

    expect(onFinishMesocycle).not.toHaveBeenCalled();
  });
});

describe('WorkoutScreen states', () => {
  test('shows a loading line while the session loads', () => {
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model: undefined, isPending: true })} />);

    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  test('shows the fallback EmptyState when there is no session to show', () => {
    const onAction = jest.fn();
    renderWithSafeArea(
      <WorkoutScreen
        {...makeProps({
          model: undefined,
          fallback: {
            title: 'Block complete',
            description: 'Every workout is done.',
            actionLabel: 'Open mesocycles',
            onAction,
          },
        })}
      />,
    );

    expect(screen.getByText('Block complete')).toBeTruthy();
    expect(screen.getByText('Every workout is done.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Open mesocycles' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

// Finishing the block doesn't take the screen anywhere: `Plan next mesocycle` appears where
// `Finish mesocycle` was, so what you just closed is still on screen when you decide what follows
// it (Artem, 24.09.2026). Block-level actions — its history — will land beside it.
describe('WorkoutScreen Plan next mesocycle', () => {
  test('a finished block offers to build the next one from it', () => {
    const onPlanNextMesocycle = jest.fn();
    renderWithSafeArea(
      <WorkoutScreen
        {...makeProps({
          model: { ...COMPLETED, showPlanNextMesocycle: true },
          onPlanNextMesocycle,
        })}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Plan next mesocycle' }));

    expect(onPlanNextMesocycle).toHaveBeenCalledTimes(1);
  });

  test('not there while the block is still running', () => {
    renderWithSafeArea(<WorkoutScreen {...makeProps({ model: COMPLETED })} />);

    expect(screen.queryByRole('button', { name: 'Plan next mesocycle' })).toBeNull();
  });

  test('takes the place of Finish mesocycle rather than sitting beside it', () => {
    renderWithSafeArea(
      <WorkoutScreen
        {...makeProps({ model: { ...COMPLETED, showPlanNextMesocycle: true } })}
      />,
    );

    expect(screen.getByRole('button', { name: 'Plan next mesocycle' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Finish mesocycle' })).toBeNull();
  });
});
