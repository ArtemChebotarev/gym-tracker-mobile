import { asksForBodyWeight, parseBodyWeight } from '@components/BodyWeightSheetLogic';
import type { WorkoutExercise, WorkoutSessionModel } from '@usecases/workoutSession';

function exercise(equipment: WorkoutExercise['equipment']): WorkoutExercise {
  const built: WorkoutExercise = {
    sessionExerciseId: 'se-1',
    exerciseId: 'pull-up-bodyweight',
    name: 'Pull Up',
    muscleGroup: 'back',
    status: 'planned',
    rows: [],
    plannedSetCount: 0,
    loggedSetCount: 0,
    hasLoggedSets: false,
    actions: {
      canReplace: false,
      canAddSet: false,
      canRemoveLastSet: false,
      canMoveUp: false,
      canMoveDown: false,
      canSkip: false,
      canUnskip: false,
      canDelete: false,
    },
  };
  if (equipment !== undefined) {
    built.equipment = equipment;
  }
  return built;
}

function model(overrides: Partial<WorkoutSessionModel> = {}): WorkoutSessionModel {
  return {
    sessionId: 'session-1',
    mesoId: 'meso-1',
    mode: 'live',
    header: {
      weekNumber: 1,
      dayNumber: 1,
      mesocycleName: 'Upper/Lower',
      isDeload: false,
      isCompleted: false,
    },
    progress: 0,
    exercises: [exercise('bodyweight')],
    actions: { canAddExercise: true, canSkipWorkout: true },
    showFinish: false,
    ...overrides,
  };
}

describe('parseBodyWeight', () => {
  test('a positive number, with a point or a comma', () => {
    expect(parseBodyWeight('80')).toBe(80);
    expect(parseBodyWeight('82.5')).toBe(82.5);
    expect(parseBodyWeight('82,5')).toBe(82.5);
    expect(parseBodyWeight(' 80 ')).toBe(80);
  });

  test('null for anything that is not one — 0 is not a body weight', () => {
    expect(parseBodyWeight('')).toBeNull();
    expect(parseBodyWeight('0')).toBeNull();
    expect(parseBodyWeight('-80')).toBeNull();
    expect(parseBodyWeight('eighty')).toBeNull();
  });
});

describe('asksForBodyWeight', () => {
  test('DoD: asks in a live session with a bodyweight exercise and no body weight yet', () => {
    expect(asksForBodyWeight(model())).toBe(true);
    expect(asksForBodyWeight(model({ exercises: [exercise('bodyweight-weighted')] }))).toBe(true);
  });

  test('DoD: asks once — never again after it has an answer', () => {
    expect(asksForBodyWeight(model({ bodyWeight: 80 }))).toBe(false);
  });

  test('DoD: no bodyweight exercise, nothing to ask about', () => {
    expect(asksForBodyWeight(model({ exercises: [exercise('barbell')] }))).toBe(false);
    expect(asksForBodyWeight(model({ exercises: [exercise(undefined)] }))).toBe(false);
    expect(asksForBodyWeight(model({ exercises: [] }))).toBe(false);
  });

  test('never outside live mode — there is nothing to log there', () => {
    expect(asksForBodyWeight(model({ mode: 'readonly' }))).toBe(false);
    expect(asksForBodyWeight(model({ mode: 'preview' }))).toBe(false);
  });

  test('nothing to ask while the session is still loading', () => {
    expect(asksForBodyWeight(undefined)).toBe(false);
  });
});
