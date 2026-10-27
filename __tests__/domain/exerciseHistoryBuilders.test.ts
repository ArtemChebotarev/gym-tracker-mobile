import type { Session, SetLog } from '@domain/execution';
import type { ExerciseHistoryPerformance } from '@domain/exerciseHistory';
import { buildExerciseHistory } from '@domain/exerciseHistoryBuilders';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { STAMPS } from '../fixtures/stamps';

const EXERCISE_ID = 'bench-press';

function mesocycle(id: string, name: string): Mesocycle {
  return {
    ...STAMPS,
    id,
    name,
    lengthWeeks: 4,
    daysPerWeek: 2,
    status: 'completed',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    createdAt: '2026-08-01T08:00:00.000Z',
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
    id: 'log-1',
    sessionExerciseId: 'se-1',
    exerciseId: EXERCISE_ID,
    setNumber: 1,
    weight: 80,
    reps: 8,
    completedAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

function performance(
  meso: Mesocycle,
  sessionOverrides: Partial<Session>,
  setLogs: readonly Partial<SetLog>[],
): ExerciseHistoryPerformance {
  return {
    mesocycle: meso,
    session: session({ mesoId: meso.id, ...sessionOverrides }),
    setLogs: setLogs.map((overrides) => setLog(overrides)),
  };
}

const UPPER = mesocycle('meso-1', 'Upper/Lower');
const FULL_BODY = mesocycle('meso-2', 'Full body');

describe('buildExerciseHistory', () => {
  test('is empty when the exercise was never performed', () => {
    expect(buildExerciseHistory([])).toEqual([]);
  });

  test('groups sessions by mesocycle and names each group', () => {
    const groups = buildExerciseHistory([
      performance(UPPER, { id: 's1' }, [{ id: 'a' }]),
      performance(FULL_BODY, { id: 's2', completedAt: '2026-09-17T12:00:00.000Z' }, [{ id: 'b' }]),
    ]);

    expect(groups.map((group) => [group.mesoId, group.name])).toEqual([
      ['meso-2', 'Full body'],
      ['meso-1', 'Upper/Lower'],
    ]);
  });

  test('reads newest first, across the mesocycle boundary and inside each group', () => {
    const groups = buildExerciseHistory([
      performance(UPPER, { id: 's1', weekNumber: 1, completedAt: '2026-08-01T12:00:00.000Z' }, [
        { id: 'a' },
      ]),
      performance(UPPER, { id: 's3', weekNumber: 3, completedAt: '2026-08-15T12:00:00.000Z' }, [
        { id: 'c' },
      ]),
      performance(UPPER, { id: 's2', weekNumber: 2, completedAt: '2026-08-08T12:00:00.000Z' }, [
        { id: 'b' },
      ]),
      performance(FULL_BODY, { id: 's4', weekNumber: 1, completedAt: '2026-09-17T12:00:00.000Z' }, [
        { id: 'd' },
      ]),
    ]);

    expect(groups[0]?.name).toBe('Full body');
    expect(groups[1]?.sessions.map((entry) => entry.weekNumber)).toEqual([3, 2, 1]);
  });

  test('carries each session as its week, day, date and sets in set order', () => {
    const groups = buildExerciseHistory([
      performance(UPPER, { weekNumber: 3, dayNumber: 2 }, [
        { id: 'b', setNumber: 2, weight: 80, reps: 7 },
        { id: 'a', setNumber: 1, weight: 80, reps: 9 },
      ]),
    ]);

    expect(groups[0]?.sessions[0]).toEqual({
      id: 'a',
      weekNumber: 3,
      dayNumber: 2,
      completedAt: '2026-09-10T12:00:00.000Z',
      setLogs: [
        expect.objectContaining({ setNumber: 1 }),
        expect.objectContaining({ setNumber: 2 }),
      ],
    });
  });

  test('leaves out a session still in progress and one with no sets', () => {
    const groups = buildExerciseHistory([
      performance(UPPER, { id: 'live', status: 'in_progress', completedAt: undefined }, [
        { id: 'a' },
      ]),
      performance(UPPER, { id: 'empty' }, []),
    ]);

    expect(groups).toEqual([]);
  });

  test('lists both performances when one session held the exercise twice', () => {
    const groups = buildExerciseHistory([
      performance(UPPER, { id: 's1' }, [{ id: 'a', sessionExerciseId: 'se-1' }]),
      performance(UPPER, { id: 's1' }, [{ id: 'b', sessionExerciseId: 'se-2' }]),
    ]);

    expect(groups[0]?.sessions.map((entry) => entry.id)).toEqual(['a', 'b']);
  });
});
