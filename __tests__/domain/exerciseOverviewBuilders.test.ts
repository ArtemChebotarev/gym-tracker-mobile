import { toExerciseId, type Exercise } from '@domain/catalog';
import type { Session, SetLog } from '@domain/execution';
import type { ExercisePerformance } from '@domain/exerciseOverview';
import {
  buildExerciseOverview,
  EARLIER_SESSION_LIMIT,
  exerciseOverviewActions,
} from '@domain/exerciseOverviewBuilders';
import { STAMPS } from '../fixtures/stamps';

const EXERCISE_ID = 'bench-press';

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    ...STAMPS,
    id: toExerciseId(EXERCISE_ID),
    name: 'Bench Press',
    muscleGroup: 'chest',
    source: 'catalog',
    isHidden: false,
    ...overrides,
  };
}

function session(overrides: Partial<Session> = {}): Session {
  return {
    ...STAMPS,
    id: 'session-1',
    mesoId: 'meso-1',
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'completed',
    completedAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

function setLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
    ...STAMPS,
    id: 'set-1',
    sessionExerciseId: 'session-exercise-1',
    exerciseId: EXERCISE_ID,
    setNumber: 1,
    weight: 80,
    reps: 8,
    completedAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

function performance(
  sessionOverrides: Partial<Session>,
  setLogs: readonly Partial<SetLog>[],
): ExercisePerformance {
  return {
    session: session(sessionOverrides),
    setLogs: setLogs.map((overrides) => setLog(overrides)),
  };
}

describe('buildExerciseOverview', () => {
  test('has no stats and no last session when nothing was ever logged', () => {
    const overview = buildExerciseOverview(exercise(), []);

    expect(overview.stats).toBeNull();
    expect(overview.lastSession).toBeNull();
  });

  test('ignores a performance that carries no set logs', () => {
    const overview = buildExerciseOverview(exercise(), [performance({}, [])]);

    expect(overview.stats).toBeNull();
    expect(overview.lastSession).toBeNull();
  });

  test('best set is the heaviest, ties broken by reps', () => {
    const overview = buildExerciseOverview(exercise(), [
      performance({}, [
        { id: 'a', weight: 80, reps: 10 },
        { id: 'b', weight: 90, reps: 5 },
        { id: 'c', weight: 90, reps: 7 },
      ]),
    ]);

    expect(overview.stats?.bestSet).toEqual({ weight: 90, reps: 7 });
  });

  test('counts distinct sessions', () => {
    const overview = buildExerciseOverview(exercise(), [
      performance({ id: 'session-1', mesoId: 'meso-1' }, [
        { id: 'a', sessionExerciseId: 'se-1' },
        { id: 'b', sessionExerciseId: 'se-1', setNumber: 2 },
      ]),
      // Same session, second time the exercise was done in it — one session, two performances.
      performance({ id: 'session-1', mesoId: 'meso-1' }, [{ id: 'c', sessionExerciseId: 'se-2' }]),
      performance({ id: 'session-2', mesoId: 'meso-2' }, [{ id: 'd', sessionExerciseId: 'se-3' }]),
    ]);

    expect(overview.stats?.sessionCount).toBe(2);
  });

  test('last done is the most recent set, whatever order the performances come in', () => {
    const overview = buildExerciseOverview(exercise(), [
      performance({ id: 'session-2', completedAt: '2026-09-17T12:00:00.000Z' }, [
        { id: 'b', completedAt: '2026-09-17T11:30:00.000Z' },
      ]),
      performance({ id: 'session-1' }, [{ id: 'a', completedAt: '2026-09-10T11:30:00.000Z' }]),
    ]);

    expect(overview.stats?.lastDoneAt).toBe('2026-09-17T11:30:00.000Z');
  });

  test('last session is the most recently completed one, with its sets in set order', () => {
    const overview = buildExerciseOverview(exercise(), [
      performance({ id: 'session-1', weekNumber: 1, dayNumber: 2 }, [{ id: 'a' }]),
      performance(
        {
          id: 'session-2',
          weekNumber: 3,
          dayNumber: 1,
          completedAt: '2026-09-17T12:00:00.000Z',
        },
        [
          { id: 'c', setNumber: 2, weight: 85, reps: 7 },
          { id: 'b', setNumber: 1, weight: 85, reps: 8 },
        ],
      ),
    ]);

    expect(overview.lastSession?.weekNumber).toBe(3);
    expect(overview.lastSession?.dayNumber).toBe(1);
    expect(overview.lastSession?.completedAt).toBe('2026-09-17T12:00:00.000Z');
    expect(overview.lastSession?.setLogs.map((log) => log.setNumber)).toEqual([1, 2]);
  });

  test('a session still in progress is not the last session, but still counts in the tiles', () => {
    const overview = buildExerciseOverview(exercise(), [
      performance({ id: 'session-1', status: 'in_progress', completedAt: undefined }, [
        { id: 'a' },
      ]),
    ]);

    expect(overview.lastSession).toBeNull();
    expect(overview.earlierSessions).toEqual([]);
    expect(overview.stats?.sessionCount).toBe(1);
  });
});

describe('buildExerciseOverview — the Earlier block', () => {
  function weeks(count: number) {
    return Array.from({ length: count }, (_, index) =>
      performance(
        {
          id: `session-${index + 1}`,
          weekNumber: index + 1,
          completedAt: `2026-09-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
        },
        [{ id: `log-${index + 1}` }],
      ),
    );
  }

  test('lists the completed sessions under the last one, newest first', () => {
    const overview = buildExerciseOverview(exercise(), weeks(3));

    expect(overview.lastSession?.weekNumber).toBe(3);
    expect(overview.earlierSessions.map((session) => session.weekNumber)).toEqual([2, 1]);
  });

  test('summarises each one by its heaviest set and how many sets it held', () => {
    const overview = buildExerciseOverview(exercise(), [
      performance({ id: 'session-2', completedAt: '2026-09-17T12:00:00.000Z' }, [{ id: 'z' }]),
      performance({ id: 'session-1', weekNumber: 1, dayNumber: 2 }, [
        { id: 'a', setNumber: 1, weight: 80, reps: 8 },
        { id: 'b', setNumber: 2, weight: 80, reps: 9 },
        { id: 'c', setNumber: 3, weight: 75, reps: 10 },
      ]),
    ]);

    expect(overview.earlierSessions).toEqual([
      {
        weekNumber: 1,
        dayNumber: 2,
        completedAt: '2026-09-10T12:00:00.000Z',
        bestSet: { weight: 80, reps: 9 },
        setCount: 3,
      },
    ]);
  });

  test('stops at the limit — Overview is not the history screen', () => {
    const overview = buildExerciseOverview(exercise(), weeks(EARLIER_SESSION_LIMIT + 3));

    expect(overview.earlierSessions).toHaveLength(EARLIER_SESSION_LIMIT);
  });

  test('is empty when the exercise was only ever done once', () => {
    const overview = buildExerciseOverview(exercise(), weeks(1));

    expect(overview.lastSession).not.toBeNull();
    expect(overview.earlierSessions).toEqual([]);
  });
});

describe('exerciseOverviewActions', () => {
  test('a catalog exercise can only be hidden', () => {
    expect(exerciseOverviewActions(exercise({ source: 'catalog' }))).toEqual(['hide']);
  });

  test('a custom exercise can be edited as well', () => {
    expect(exerciseOverviewActions(exercise({ source: 'custom' }))).toEqual(['edit', 'hide']);
  });
});
