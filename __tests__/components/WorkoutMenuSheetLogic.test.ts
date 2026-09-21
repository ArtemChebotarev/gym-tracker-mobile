import {
  formatWorkoutMenuTitle,
  WORKOUT_MENU_ACTIONS,
  workoutMenuItems,
} from '@components/WorkoutMenuSheetLogic';

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
  test('only Stop mesocycle is a danger action', () => {
    const danger = Object.entries(WORKOUT_MENU_ACTIONS)
      .filter(([, action]) => action.variant === 'danger')
      .map(([item]) => item);
    expect(danger).toEqual(['stopMesocycle']);
  });
});

describe('formatWorkoutMenuTitle', () => {
  test('is the week and the day', () => {
    expect(formatWorkoutMenuTitle({ weekNumber: 6, dayNumber: 2 })).toBe('Week 6 Day 2');
  });
});
