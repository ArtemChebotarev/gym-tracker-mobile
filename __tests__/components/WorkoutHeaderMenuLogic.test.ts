import {
  formatWorkoutMenuTitle,
  WORKOUT_MENU_ACTIONS,
  workoutMenuActions,
  workoutMenuItems,
} from '@components/WorkoutHeaderMenuLogic';

describe('workoutMenuItems', () => {
  test('a live session with nothing logged lists every action, in the 08.7 order', () => {
    expect(workoutMenuItems({ canAddExercise: true, canSkipWorkout: true, canStopMesocycle: true })).toEqual([
      'addExercise',
      'skipWorkout',
      'renameMesocycle',
      'mesocycleHistory',
      'stopMesocycle',
    ]);
  });

  test('no Skip workout once every exercise is done — Finish takes its place', () => {
    expect(workoutMenuItems({ canAddExercise: true, canSkipWorkout: false, canStopMesocycle: true })).toEqual([
      'addExercise',
      'renameMesocycle',
      'mesocycleHistory',
      'stopMesocycle',
    ]);
  });

  test('no Add exercise where nothing can be added (a deload session)', () => {
    expect(workoutMenuItems({ canAddExercise: false, canSkipWorkout: true, canStopMesocycle: true })).toEqual([
      'skipWorkout',
      'renameMesocycle',
      'mesocycleHistory',
      'stopMesocycle',
    ]);
  });

  test('read-only and preview keep only the mesocycle actions', () => {
    expect(
      workoutMenuItems({
        canAddExercise: false,
        canSkipWorkout: false,
        canStopMesocycle: true,
      }),
    ).toEqual(['renameMesocycle', 'mesocycleHistory', 'stopMesocycle']);
  });

  test('no Stop mesocycle once the block itself is closed (052)', () => {
    expect(
      workoutMenuItems({
        canAddExercise: false,
        canSkipWorkout: false,
        canStopMesocycle: false,
      }),
    ).toEqual(['renameMesocycle', 'mesocycleHistory']);
  });
});

describe('WORKOUT_MENU_ACTIONS', () => {
  test('only Stop mesocycle is destructive', () => {
    const destructive = Object.entries(WORKOUT_MENU_ACTIONS)
      .filter(([, action]) => action.destructive === true)
      .map(([item]) => item);
    expect(destructive).toEqual(['stopMesocycle']);
  });

  test('every action names both icons — the sheet draws one, the native menu the other', () => {
    for (const action of Object.values(WORKOUT_MENU_ACTIONS)) {
      expect(typeof action.icon).toBe('function');
      expect(action.systemImage).toMatch(/\S/);
    }
  });
});

describe('workoutMenuActions', () => {
  const handlers = {
    addExercise: jest.fn(),
    skipWorkout: jest.fn(),
    renameMesocycle: jest.fn(),
    mesocycleHistory: jest.fn(),
    stopMesocycle: jest.fn(),
  };

  test('carries each allowed action with its own handler, in order', () => {
    const items = workoutMenuActions(
      { canAddExercise: false, canSkipWorkout: false, canStopMesocycle: true },
      handlers,
    );

    expect(items.map((item) => item.key)).toEqual([
      'renameMesocycle',
      'mesocycleHistory',
      'stopMesocycle',
    ]);
    expect(items.map((item) => item.label)).toEqual([
      'Rename mesocycle',
      'Mesocycle history',
      'Stop mesocycle',
    ]);
    items.forEach((item) => item.onPress());
    expect(handlers.renameMesocycle).toHaveBeenCalledTimes(1);
    expect(handlers.mesocycleHistory).toHaveBeenCalledTimes(1);
    expect(handlers.stopMesocycle).toHaveBeenCalledTimes(1);
    expect(handlers.addExercise).not.toHaveBeenCalled();
  });
});

describe('formatWorkoutMenuTitle', () => {
  test('is the week and the day', () => {
    expect(formatWorkoutMenuTitle({ weekNumber: 6, dayNumber: 2 })).toBe('Week 6 Day 2');
  });
});
