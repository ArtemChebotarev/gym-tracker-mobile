import type { Session, SessionExercise, SetLog, SetTarget } from '@domain/execution';
import {
  validateAwaitingSourceSession,
  validateSingleInProgressSession,
  validateUniqueSessionSlots,
} from '@domain/execution';

const benchPressTargetWithoutReps: SetTarget = { setNumber: 3, suggestedWeight: 60 };

const benchPressTargets: SetTarget[] = [
  { setNumber: 1, targetReps: 8, suggestedWeight: 60 },
  { setNumber: 2, targetReps: 8, suggestedWeight: 60 },
  benchPressTargetWithoutReps,
];

const rowTargetWithoutRepsOrWeight: SetTarget = { setNumber: 2 };

const rowTargets: SetTarget[] = [{ setNumber: 1, targetReps: 10 }, rowTargetWithoutRepsOrWeight];

const benchPressExercise: SessionExercise = {
  id: 'session-exercise-bench-press',
  sessionId: 'session-1',
  exerciseId: 'exercise-bench-press',
  order: 1,
  setTargets: benchPressTargets,
  targetRir: 2,
  weightHint: 'increase',
  status: 'completed',
};

const rowExercise: SessionExercise = {
  id: 'session-exercise-row',
  sessionId: 'session-1',
  exerciseId: 'exercise-row',
  order: 2,
  setTargets: rowTargets,
  targetRir: 2,
  status: 'planned',
};

const sessionFixture: Session = {
  id: 'session-1',
  mesoId: 'meso-1',
  weekNumber: 1,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'in_progress',
  startedAt: '2026-08-26T08:00:00.000Z',
};

const setLogWithRir: SetLog = {
  id: 'set-log-1',
  sessionExerciseId: benchPressExercise.id,
  exerciseId: benchPressExercise.exerciseId,
  setNumber: 1,
  weight: 60,
  reps: 8,
  rir: 2,
  completedAt: '2026-08-26T08:05:00.000Z',
};

const setLogWithoutRir: SetLog = {
  id: 'set-log-2',
  sessionExerciseId: benchPressExercise.id,
  exerciseId: benchPressExercise.exerciseId,
  setNumber: 2,
  weight: 60,
  reps: 7,
  completedAt: '2026-08-26T08:10:00.000Z',
};

const setLogFixtures: SetLog[] = [setLogWithRir, setLogWithoutRir];

describe('execution domain types', () => {
  test('a full session fixture with two exercises and their set targets typechecks', () => {
    const exercises = [benchPressExercise, rowExercise];

    expect(sessionFixture.status).toBe('in_progress');
    expect(exercises).toHaveLength(2);
    expect(exercises.map((exercise) => exercise.order)).toEqual([1, 2]);
  });

  test('setTargets allow omitting targetReps and suggestedWeight independently', () => {
    expect(benchPressTargetWithoutReps.targetReps).toBeUndefined();
    expect(rowTargetWithoutRepsOrWeight.targetReps).toBeUndefined();
    expect(rowTargetWithoutRepsOrWeight.suggestedWeight).toBeUndefined();
  });

  test('set logs carry the denormalized exerciseId and an optional rir', () => {
    expect(setLogFixtures).toHaveLength(2);
    expect(setLogWithRir.exerciseId).toBe(benchPressExercise.exerciseId);
    expect(setLogWithRir.rir).toBe(2);
    expect(setLogWithoutRir.rir).toBeUndefined();
  });
});

describe('validateUniqueSessionSlots', () => {
  const weekOneDayOne: Session = { ...sessionFixture, id: 'session-w1d1', status: 'completed' };
  const weekOneDayTwo: Session = {
    ...sessionFixture,
    id: 'session-w1d2',
    dayNumber: 2,
    status: 'completed',
  };
  const otherMesoWeekOneDayOne: Session = {
    ...sessionFixture,
    id: 'session-other-meso',
    mesoId: 'meso-2',
    status: 'completed',
  };

  test('accepts sessions that each have a distinct (mesoId, weekNumber, dayNumber)', () => {
    expect(() =>
      validateUniqueSessionSlots([weekOneDayOne, weekOneDayTwo, otherMesoWeekOneDayOne]),
    ).not.toThrow();
  });

  test('rejects two sessions sharing the same (mesoId, weekNumber, dayNumber)', () => {
    const duplicate: Session = { ...weekOneDayOne, id: 'session-w1d1-duplicate' };

    expect(() => validateUniqueSessionSlots([weekOneDayOne, duplicate])).toThrow(
      /Duplicate session/,
    );
  });
});

describe('validateSingleInProgressSession', () => {
  const completedSession: Session = { ...sessionFixture, id: 'session-2', status: 'completed' };
  const secondInProgressSession: Session = {
    ...sessionFixture,
    id: 'session-3',
    status: 'in_progress',
  };

  test('accepts a collection with zero or one in_progress session', () => {
    expect(() => validateSingleInProgressSession([])).not.toThrow();
    expect(() => validateSingleInProgressSession([completedSession])).not.toThrow();
    expect(() => validateSingleInProgressSession([sessionFixture, completedSession])).not.toThrow();
  });

  test('rejects a collection with more than one in_progress session', () => {
    expect(() =>
      validateSingleInProgressSession([sessionFixture, secondInProgressSession, completedSession]),
    ).toThrow(/Only one session may be in_progress/);
  });
});

describe('validateAwaitingSourceSession', () => {
  const awaitingSourceSession: Session = {
    ...sessionFixture,
    id: 'session-awaiting',
    prescriptionStatus: 'awaiting_source',
    status: 'planned',
  };

  test('accepts an awaiting_source session with no exercises that is not started', () => {
    expect(() => validateAwaitingSourceSession(awaitingSourceSession, [])).not.toThrow();
  });

  test('accepts a ready session that has exercises and is in_progress', () => {
    const readySession: Session = { ...sessionFixture, status: 'in_progress' };

    expect(() =>
      validateAwaitingSourceSession(readySession, [benchPressExercise, rowExercise]),
    ).not.toThrow();
  });

  test('rejects an awaiting_source session that has session exercises', () => {
    expect(() =>
      validateAwaitingSourceSession(awaitingSourceSession, [benchPressExercise]),
    ).toThrow(/must not have session exercises/);
  });

  test('rejects an awaiting_source session that is in_progress', () => {
    const startedAwaitingSourceSession: Session = {
      ...awaitingSourceSession,
      status: 'in_progress',
    };

    expect(() => validateAwaitingSourceSession(startedAwaitingSourceSession, [])).toThrow(
      /cannot be started/,
    );
  });
});
