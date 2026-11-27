import { isConflictError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { SqliteExerciseRepository } from '@storage/sqlite/exerciseRepository';
import { createSqliteMesocycleClosingStore } from '@storage/sqlite/mesocycleClosingStore';
import { createSqliteWorkoutStore } from '@storage/sqlite/workoutStore';
import { addExercises } from '@usecases/exerciseAddition';
import { changeMesocycleLength, type MesocycleLengthDeps } from '@usecases/mesocycleLength';
import { getMesoGrid } from '@usecases/mesoGrid';
import { targetRir } from '@domain/progressionRir';

import { seedReferences } from '../fixtures/references';
import { withTestDatabase } from '../fixtures/sqliteDatabase';
import { STAMPS } from '../fixtures/stamps';

const db = withTestDatabase();

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

function makeMesocycle(lengthWeeks: number): Mesocycle {
  return {
    ...STAMPS,
    id: 'meso',
    name: 'Upper/Lower',
    lengthWeeks,
    daysPerWeek: 1,
    startDate: '2026-09-01T08:00:00.000Z',
    status: 'active',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    weightUnit: 'kg',
  };
}

function session(weekNumber: number, overrides: Partial<Session> = {}): Session {
  return {
    ...STAMPS,
    id: `w${weekNumber}`,
    mesoId: 'meso',
    weekNumber,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'completed',
    ...(weekNumber > 1 ? { sourceSessionId: `w${weekNumber - 1}` } : {}),
    ...overrides,
  };
}

function bench(weekNumber: number, overrides: Partial<SessionExercise> = {}): SessionExercise {
  return {
    ...STAMPS,
    id: `se-w${weekNumber}`,
    sessionId: `w${weekNumber}`,
    exerciseId: 'bench',
    order: 1,
    setTargets: [
      { setNumber: 1, targetReps: 10, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 9, suggestedWeight: 60 },
    ],
    targetRir: 2,
    status: 'completed',
    ...overrides,
  };
}

function logs(weekNumber: number): SetLog[] {
  return [1, 2].map((setNumber) => ({
    ...STAMPS,
    id: `log-w${weekNumber}-${setNumber}`,
    sessionExerciseId: `se-w${weekNumber}`,
    exerciseId: 'bench',
    setNumber,
    weight: 60,
    reps: 11 - setNumber,
    completedAt: '2026-09-28T17:30:00.000Z',
  }));
}

/**
 * A block of `lengthWeeks` with weeks 1..`done` trained (one day a week) and week `done + 1`
 * generated and untouched — `planned`, a deload if it is the last week.
 */
async function setUp(lengthWeeks: number, done: number): Promise<MesocycleLengthDeps> {
  const store = createSqliteMesocycleClosingStore(db());
  await store.repos.mesocycleRepo.create(makeMesocycle(lengthWeeks));
  const next = done + 1;
  const sessions = [
    ...Array.from({ length: done }, (_, index) => session(index + 1)),
    session(next, { status: 'planned', isDeload: next === lengthWeeks }),
  ];
  const exercises = [
    // Trained at rule 4's row, as generation planned them.
    ...Array.from({ length: done }, (_, index) =>
      bench(index + 1, { targetRir: targetRir(lengthWeeks, index + 1) }),
    ),
    bench(next, { status: 'planned', targetRir: 1 }),
  ];
  const setLogs = Array.from({ length: done }, (_, index) => logs(index + 1)).flat();
  await seedReferences(db(), {
    sessions,
    sessionExercises: exercises,
    setLogs,
    exerciseIds: ['fly'],
  });
  await store.repos.sessionRepo.createMany(sessions);
  await store.repos.sessionExerciseRepo.createMany(exercises);
  for (const log of setLogs) {
    await store.repos.setLogRepo.create(log);
  }
  return { store, exerciseRepo: new SqliteExerciseRepository(db()) };
}

async function plannedWeek(deps: MesocycleLengthDeps, weekNumber: number) {
  const { sessionRepo, sessionExerciseRepo } = deps.store.repos;
  return {
    session: await sessionRepo.getById(`w${weekNumber}`),
    exercises: await sessionExerciseRepo.listBySessionId(`w${weekNumber}`),
  };
}

describe('changeMesocycleLength', () => {
  test('DoD: tired after 4 of 8 weeks, the cycle is cut to 5 — the generated week 5 becomes the deload', async () => {
    const deps = await setUp(8, 4);

    const changed = await changeMesocycleLength('meso', 5, deps);

    expect(changed).toMatchObject({ lengthWeeks: 5 });
    const week5 = await plannedWeek(deps, 5);
    expect(week5.session).toMatchObject({ isDeload: true, status: 'planned' });
    // Rule 5 from week 4's fact: half the first set's weight, and one exercise of its group gets 2.
    expect(week5.exercises).toHaveLength(1);
    expect(week5.exercises[0]).toMatchObject({
      targetRir: defaultProgressionSettings.deloadRir,
      setTargets: [
        { setNumber: 1, suggestedWeight: 30 },
        { setNumber: 2, suggestedWeight: 30 },
      ],
    });
    // The trained weeks are history.
    expect((await plannedWeek(deps, 4)).exercises[0]).toEqual(
      expect.objectContaining({ targetRir: 2, status: 'completed' }),
    );
  });

  test('DoD: strong after 4 of 6 weeks, two weeks are added — the RIR is re-spread down to 0', async () => {
    const deps = await setUp(6, 4);

    const changed = await changeMesocycleLength('meso', 8, deps);

    expect(changed).toMatchObject({ lengthWeeks: 8 });
    const week5 = await plannedWeek(deps, 5);
    expect(week5.session).toMatchObject({ isDeload: false });
    expect(week5.exercises[0]).toMatchObject({ targetRir: 1 });
  });

  test('a generated deload week stops being one when the cycle grows past it', async () => {
    const deps = await setUp(5, 4);

    await changeMesocycleLength('meso', 6, deps);

    const week5 = await plannedWeek(deps, 5);
    expect(week5.session).toMatchObject({ isDeload: false });
    // Rule 2 from week 4's fact (10 / 9 reps), at the last working week's RIR.
    expect(week5.exercises[0]).toMatchObject({
      targetRir: 0,
      setTargets: [
        { setNumber: 1, targetReps: 11, suggestedWeight: 60 },
        { setNumber: 2, targetReps: 10, suggestedWeight: 60 },
      ],
    });
  });

  test('a cut keeps the next week within one step of the last trained one', async () => {
    // 8 → 5 after weeks 1–2 at 3 RIR: the 5-week row says 1 for week 3, one step down is 2.
    const deps = await setUp(8, 2);

    await changeMesocycleLength('meso', 5, deps);

    expect((await plannedWeek(deps, 3)).exercises[0]).toMatchObject({ targetRir: 2 });
  });

  test('an exercise added after the change takes its day’s RIR, not the row’s', async () => {
    const deps = await setUp(8, 2);
    await changeMesocycleLength('meso', 5, deps);

    const [added] = await addExercises(
      { sessionId: 'w3', exerciseIds: ['fly'] },
      {
        workout: createSqliteWorkoutStore(db()),
        mesocycleRepo: deps.store.repos.mesocycleRepo,
        exerciseRepo: deps.exerciseRepo,
      },
    );

    expect(added).toMatchObject({ exerciseId: 'fly', targetRir: 2 });
  });

  test('the grid offers the bounds of an active block', async () => {
    const deps = await setUp(8, 4);
    const grid = await getMesoGrid('meso', {
      mesocycleRepo: deps.store.repos.mesocycleRepo,
      sessionRepo: deps.store.repos.sessionRepo,
    });
    expect(grid.lengthBounds).toEqual({ min: 5, max: 8 });
  });

  test('a length onto a started week is rejected and nothing is written', async () => {
    const deps = await setUp(8, 4);

    let error: unknown;
    try {
      await changeMesocycleLength('meso', 4, deps);
    } catch (caught) {
      error = caught;
    }

    expect(isConflictError(error)).toBe(true);
    expect(await deps.store.repos.mesocycleRepo.getById('meso')).toMatchObject({ lengthWeeks: 8 });
    expect((await plannedWeek(deps, 5)).exercises[0]).toMatchObject({ targetRir: 1 });
  });
});
