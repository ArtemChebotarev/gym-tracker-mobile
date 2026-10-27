import type { Session, SetLog } from '@domain/execution';
import type { ExerciseHistoryPerformance } from '@domain/exerciseHistory';
import {
  buildExerciseHistory,
  buildPowerWeeklyHistory,
  findBestSet,
} from '@domain/exerciseHistoryBuilders';
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

describe('findBestSet', () => {
  test('takes the heaviest set, ties broken by reps', () => {
    const best = findBestSet([
      setLog({ id: 'a', weight: 6, reps: 6 }),
      setLog({ id: 'b', weight: 8, reps: 3 }),
      setLog({ id: 'c', weight: 8, reps: 4 }),
    ]);

    expect(best?.id).toBe('c');
  });

  test('is null for no sets', () => {
    expect(findBestSet([])).toBeNull();
  });
});

describe('buildPowerWeeklyHistory', () => {
  function powerHistory(load: 'weight' | 'level' | 'none' = 'weight') {
    return buildPowerWeeklyHistory(
      buildExerciseHistory([
        performance(UPPER, { id: 'w1', weekNumber: 1, completedAt: '2026-08-03T12:00:00.000Z' }, [
          { id: 'w1-1', weight: 6, reps: 4 },
          { id: 'w1-2', setNumber: 2, weight: 6, reps: 3 },
        ]),
        // Two days of week 2: one row, the best across both.
        performance(
          UPPER,
          { id: 'w2a', weekNumber: 2, dayNumber: 1, completedAt: '2026-08-10T12:00:00.000Z' },
          [{ id: 'w2a-1', weight: 6, reps: 6 }],
        ),
        performance(
          UPPER,
          { id: 'w2b', weekNumber: 2, dayNumber: 2, completedAt: '2026-08-12T12:00:00.000Z' },
          [{ id: 'w2b-1', weight: 6, reps: 7 }],
        ),
        performance(
          FULL_BODY,
          { id: 'n1', weekNumber: 1, completedAt: '2026-09-07T12:00:00.000Z' },
          [{ id: 'n1-1', weight: 8, reps: 3 }],
        ),
        performance(
          FULL_BODY,
          { id: 'n2', weekNumber: 2, completedAt: '2026-09-14T12:00:00.000Z' },
          [{ id: 'n2-1', weight: 6, reps: 7 }],
        ),
      ]),
      load,
    );
  }

  test('keeps the mesocycle sections, each with its weeks newest first', () => {
    const history = powerHistory();

    expect(history.map((section) => section.name)).toEqual(['Full body', 'Upper/Lower']);
    expect(history[1]?.weeks.map((week) => week.weekNumber)).toEqual([2, 1]);
    expect(history[1]?.weeks.map((week) => week.id)).toEqual(['meso-1:2', 'meso-1:1']);
  });

  test('takes the best set of a week over every session of it', () => {
    const week2 = powerHistory()[1]?.weeks[0];

    expect(week2?.bestSet.id).toBe('w2b-1');
  });

  test('marks a week where every set reached the top of the corridor', () => {
    const upper = powerHistory()[1]?.weeks;

    expect(upper?.map((week) => week.isAtTopOfRange)).toEqual([true, false]);
  });

  test('marks the load going up or down against the week before, across a mesocycle', () => {
    const history = powerHistory();

    expect(history[1]?.weeks.map((week) => week.loadChange)).toEqual([undefined, undefined]);
    expect(history[0]?.weeks.map((week) => week.loadChange)).toEqual(['down', 'up']);
  });

  test('with no load of its own, goes by reps and never shows a load change', () => {
    const history = powerHistory('none');

    expect(history[0]?.weeks[1]?.bestSet.id).toBe('n1-1');
    expect(history.flatMap((section) => section.weeks.map((week) => week.loadChange))).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  test('is empty when there is no history', () => {
    expect(buildPowerWeeklyHistory([], 'weight')).toEqual([]);
  });
});
