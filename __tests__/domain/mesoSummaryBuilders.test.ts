import type { Exercise } from '@domain/catalog';
import { toExerciseId } from '@domain/catalog';
import type { Session, SetLog } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import type { MesoSessionLog } from '@domain/mesoSummary';
import { buildMesoSummary } from '@domain/mesoSummaryBuilders';
import { STAMPS } from '../fixtures/stamps';

const mesocycle: Mesocycle = {
  ...STAMPS,
  id: 'meso',
  name: 'Upper/lower',
  lengthWeeks: 4,
  daysPerWeek: 2,
  startDate: '2026-09-01T08:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
};

const exercises: Pick<Exercise, 'id' | 'muscleGroup'>[] = [
  { id: toExerciseId('bench'), muscleGroup: 'chest' },
  { id: toExerciseId('fly'), muscleGroup: 'chest' },
  { id: toExerciseId('squat'), muscleGroup: 'quads' },
  { id: toExerciseId('row'), muscleGroup: 'back' },
];

function session(week: number, day: number, overrides: Partial<Session> = {}): Session {
  return {
    ...STAMPS,
    id: `w${week}d${day}`,
    mesoId: 'meso',
    weekNumber: week,
    dayNumber: day,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'completed',
    ...overrides,
  };
}

/** `count` sets of `exerciseId`, logged in the session `sessionId`. */
function sets(sessionId: string, exerciseId: string, count: number): SetLog[] {
  return Array.from({ length: count }, (_, index) => ({
    ...STAMPS,
    id: `${sessionId}-${exerciseId}-${index + 1}`,
    sessionExerciseId: `${sessionId}-${exerciseId}`,
    exerciseId,
    setNumber: index + 1,
    weight: 60,
    reps: 10,
    completedAt: '2026-09-01T09:00:00.000Z',
  }));
}

function logged(target: Session, ...setLogs: SetLog[][]): MesoSessionLog {
  return { session: target, setLogs: setLogs.flat() };
}

describe('buildMesoSummary', () => {
  test('an active block under lazy generation: counts what exists, out of the whole plan', () => {
    // Week 1 done, week 2 half done, week 3 generated but untouched, week 4 doesn't exist yet.
    const summary = buildMesoSummary(
      mesocycle,
      [
        logged(session(1, 1), sets('w1d1', 'bench', 3), sets('w1d1', 'squat', 2)),
        logged(session(1, 2), sets('w1d2', 'row', 3)),
        logged(session(2, 1), sets('w2d1', 'bench', 4), sets('w2d1', 'fly', 2)),
        logged(session(2, 2, { status: 'in_progress' }), sets('w2d2', 'row', 1)),
        logged(session(3, 1, { status: 'planned' })),
        logged(session(3, 2, { status: 'planned', prescriptionStatus: 'awaiting_source' })),
      ],
      exercises,
    );

    expect(summary).toEqual({
      workouts: { value: 3, total: 8 },
      strengthSets: 15,
      weeks: { value: 3, total: 4 },
      weeklySets: [
        { muscleGroup: 'chest', sets: [3, 6, 0, 0] },
        { muscleGroup: 'back', sets: [3, 1, 0, 0] },
        { muscleGroup: 'quads', sets: [2, 0, 0, 0] },
      ],
    });
  });

  test('a skipped workout is not a completed one', () => {
    const summary = buildMesoSummary(
      mesocycle,
      [
        logged(session(1, 1), sets('w1d1', 'bench', 3)),
        logged(session(1, 2, { status: 'skipped' })),
      ],
      exercises,
    );

    expect(summary.workouts).toEqual({ value: 1, total: 8 });
    // It still took place in its week.
    expect(summary.weeks).toEqual({ value: 1, total: 4 });
  });

  test('a stopped block has no workouts denominator, but keeps the weeks one', () => {
    const summary = buildMesoSummary(
      { ...mesocycle, status: 'abandoned' },
      [
        logged(session(1, 1), sets('w1d1', 'bench', 3)),
        logged(session(1, 2), sets('w1d2', 'row', 3)),
        logged(session(2, 1, { status: 'skipped' })),
        logged(session(2, 2, { status: 'skipped' })),
      ],
      exercises,
    );

    expect(summary.workouts).toEqual({ value: 2 });
    expect(summary.weeks).toEqual({ value: 2, total: 4 });
  });

  test('a completed block keeps its weeks denominator: 4 / 4', () => {
    const all = [1, 2, 3, 4].flatMap((week) => [
      logged(session(week, 1), sets(`w${week}d1`, 'bench', 3)),
      logged(session(week, 2), sets(`w${week}d2`, 'squat', 3)),
    ]);

    const summary = buildMesoSummary({ ...mesocycle, status: 'completed' }, all, exercises);

    expect(summary.workouts).toEqual({ value: 8, total: 8 });
    expect(summary.weeks).toEqual({ value: 4, total: 4 });
    expect(summary.strengthSets).toBe(24);
  });

  test('a block without a single set: zero sets and no weekly rows', () => {
    // Stopped right away: week 1 was generated and closed by the Stop.
    const summary = buildMesoSummary(
      { ...mesocycle, status: 'abandoned' },
      [logged(session(1, 1, { status: 'skipped' })), logged(session(1, 2, { status: 'skipped' }))],
      exercises,
    );

    expect(summary).toEqual({
      workouts: { value: 0 },
      strengthSets: 0,
      weeks: { value: 1, total: 4 },
      weeklySets: [],
    });
  });

  test('a block without any session yet', () => {
    expect(buildMesoSummary(mesocycle, [], exercises)).toEqual({
      workouts: { value: 0, total: 8 },
      strengthSets: 0,
      weeks: { value: 0, total: 4 },
      weeklySets: [],
    });
  });

  test("a swapped exercise counts toward the group of the set's own exercise", () => {
    // The session exercise was planned as a bench press; the sets were logged as rows.
    const setLogs = sets('w1d1', 'row', 2).map((setLog) => ({
      ...setLog,
      sessionExerciseId: 'w1d1-bench',
    }));

    const summary = buildMesoSummary(mesocycle, [logged(session(1, 1), setLogs)], exercises);

    expect(summary.weeklySets).toEqual([{ muscleGroup: 'back', sets: [2, 0, 0, 0] }]);
  });

  test('ignores sessions of other mesocycles and outside the block', () => {
    const summary = buildMesoSummary(
      mesocycle,
      [
        logged(session(1, 1), sets('w1d1', 'bench', 1)),
        logged(session(1, 1, { id: 'other', mesoId: 'other' }), sets('other', 'bench', 5)),
        logged(session(9, 1), sets('w9d1', 'bench', 5)),
      ],
      exercises,
    );

    expect(summary).toEqual({
      workouts: { value: 1, total: 8 },
      strengthSets: 1,
      weeks: { value: 1, total: 4 },
      weeklySets: [{ muscleGroup: 'chest', sets: [1, 0, 0, 0] }],
    });
  });
});
