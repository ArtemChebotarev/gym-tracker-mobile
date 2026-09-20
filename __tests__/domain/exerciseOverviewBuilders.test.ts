import { toExerciseId, type Exercise } from '@domain/catalog';
import type { Session, SetLog } from '@domain/execution';
import type { ExercisePerformance } from '@domain/exerciseOverview';
import {
  buildExerciseOverview,
  exerciseOverviewActions,
} from '@domain/exerciseOverviewBuilders';

const EXERCISE_ID = 'bench-press';

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
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

  test('counts distinct sessions, mesocycles and every set', () => {
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
    expect(overview.stats?.mesocycleCount).toBe(2);
    expect(overview.stats?.setCount).toBe(4);
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
    expect(overview.stats?.sessionCount).toBe(1);
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
