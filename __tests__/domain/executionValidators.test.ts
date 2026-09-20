import type { Session, SessionExercise } from '@domain/execution';
import {
  validateAwaitingSourceSession,
  validateSetEntry,
  validateSingleInProgressSession,
  validateUniqueSessionSlots,
} from '@domain/executionValidators';
import { STAMPS } from '../fixtures/stamps';

const benchPressExercise: SessionExercise = {
  ...STAMPS,
  id: 'session-exercise-bench-press',
  sessionId: 'session-1',
  exerciseId: 'exercise-bench-press',
  order: 1,
  setTargets: [{ setNumber: 1, targetReps: 8, suggestedWeight: 60 }],
  targetRir: 2,
  status: 'planned',
};

const rowExercise: SessionExercise = {
  ...STAMPS,
  id: 'session-exercise-row',
  sessionId: 'session-1',
  exerciseId: 'exercise-row',
  order: 2,
  setTargets: [{ setNumber: 1, targetReps: 10 }],
  targetRir: 2,
  status: 'planned',
};

const sessionFixture: Session = {
  ...STAMPS,
  id: 'session-1',
  mesoId: 'meso-1',
  weekNumber: 1,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'in_progress',
  startedAt: '2026-08-26T08:00:00.000Z',
};

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

describe('validateSetEntry', () => {
  test('accepts entered weight and reps, including bodyweight at 0', () => {
    expect(() => validateSetEntry({ weight: 62.5, reps: 10 })).not.toThrow();
    expect(() => validateSetEntry({ weight: 0, reps: 12 })).not.toThrow();
  });

  test('rejects a missing weight or reps — a placeholder is not a value', () => {
    expect(() => validateSetEntry({ weight: 60, reps: null })).toThrow(/both weight and reps/);
    expect(() => validateSetEntry({ weight: null, reps: 10 })).toThrow(/both weight and reps/);
  });

  test.each([-2.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects weight %p', (weight) => {
    expect(() => validateSetEntry({ weight, reps: 10 })).toThrow(/Weight/);
  });

  test.each([0, -1, 8.5, Number.NaN])('rejects reps %p', (reps) => {
    expect(() => validateSetEntry({ weight: 60, reps })).toThrow(/Reps/);
  });
});
