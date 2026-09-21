import { toExerciseId } from '@domain/catalog';
import { NotFoundError } from '@domain/errors';
import type { Session, SessionExercise } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { SqliteExerciseRepository } from '@storage/sqlite/exerciseRepository';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { SqliteSessionRepository } from '@storage/sqlite/session';
import { createSqliteWorkoutStore } from '@storage/sqlite/workoutStore';
import { getMesoGrid, type MesoGridDeps } from '@usecases/mesoGrid';
import { finishSession } from '@usecases/sessionFinish';
import { STAMPS } from '../fixtures/stamps';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const NOW = '2026-09-18T11:00:00.000Z';

const mesocycle: Mesocycle = {
  ...STAMPS,
  id: 'meso',
  name: 'Four days',
  lengthWeeks: 4,
  daysPerWeek: 4,
  startDate: '2026-09-01T08:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  createdAt: '2026-09-01T08:00:00.000Z',
};

function weekOneDay(day: number): Session {
  return {
    ...STAMPS,
    id: `w1d${day}`,
    mesoId: 'meso',
    weekNumber: 1,
    dayNumber: day,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'planned',
  };
}

function exerciseOf(day: number, status: SessionExercise['status']): SessionExercise {
  return {
    ...STAMPS,
    id: `w1d${day}-press`,
    sessionId: `w1d${day}`,
    exerciseId: 'press',
    order: 1,
    setTargets: [{ setNumber: 1, targetReps: 10, suggestedWeight: 40 }],
    targetRir: 3,
    status,
  };
}

// Week 1 materialized by Start: four ready days of one exercise each.
async function startedMesocycle() {
  const store = db();
  const mesocycleRepo = new SqliteMesocycleRepository(store);
  const exerciseRepo = new SqliteExerciseRepository(store);
  await mesocycleRepo.create(mesocycle);
  await exerciseRepo.createCustom({
    id: toExerciseId('press'),
    name: 'Press',
    muscleGroup: 'shoulders',
    source: 'custom',
    isHidden: false,
  });
  const workout = createSqliteWorkoutStore(store);
  await workout.repos.sessionRepo.createMany([1, 2, 3, 4].map(weekOneDay));
  await workout.repos.sessionExerciseRepo.createMany(
    [1, 2, 3, 4].map((day) => exerciseOf(day, 'planned')),
  );

  const deps: MesoGridDeps = { mesocycleRepo, sessionRepo: new SqliteSessionRepository(store) };
  return { workout, mesocycleRepo, exerciseRepo, deps };
}

describe('getMesoGrid', () => {
  test('DoD: days 1–2 of 4 finished on week N — week N + 1 days 1–2 ready, 3–4 awaiting', async () => {
    const { workout, mesocycleRepo, exerciseRepo, deps } = await startedMesocycle();
    for (const day of [1, 2]) {
      await workout.repos.sessionExerciseRepo.update(exerciseOf(day, 'completed'));
      await workout.repos.setLogRepo.create({
        id: `w1d${day}-log`,
        sessionExerciseId: `w1d${day}-press`,
        exerciseId: 'press',
        setNumber: 1,
        weight: 40,
        reps: 10,
        completedAt: NOW,
      });
      await finishSession(`w1d${day}`, { workout, mesocycleRepo, exerciseRepo }, NOW);
    }

    const grid = await getMesoGrid('meso', deps);
    const [weekN, weekNext] = grid.weeks;

    expect(weekN?.cells.map((cell) => cell.status)).toEqual([
      'completed',
      'completed',
      'ready',
      'ready',
    ]);
    expect(weekNext?.cells.map((cell) => cell.status)).toEqual([
      'ready',
      'ready',
      'awaiting',
      'awaiting',
    ]);
    expect(weekNext?.cells[0]?.sessionId).toEqual(expect.any(String));
    expect(weekNext?.cells[2]?.sessionId).toBeUndefined();
    expect(grid.currentWeekNumber).toBe(1);
  });

  test('covers lengthWeeks × daysPerWeek, flags the deload week, carries the header data', async () => {
    const { deps } = await startedMesocycle();

    const grid = await getMesoGrid('meso', deps);

    expect(grid).toMatchObject({ name: 'Four days', lengthWeeks: 4, daysPerWeek: 4 });
    expect(grid.weeks.map((week) => week.weekNumber)).toEqual([1, 2, 3, 4]);
    expect(grid.weeks.map((week) => week.isDeload)).toEqual([false, false, false, true]);
    expect(grid.weeks.every((week) => week.cells.length === 4)).toBe(true);
  });

  test('rejects with NotFoundError for a missing mesocycle', async () => {
    const { deps } = await startedMesocycle();

    await expect(getMesoGrid('missing', deps)).rejects.toBeInstanceOf(NotFoundError);
  });
});
