import { isConflictError, isNotFoundError } from '@domain/errors';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import type { MesocycleStartRepositories, MesocycleStartStore } from '@repositories/mesocycleStart';
import { createSqliteMesocycleStartStore } from '@storage/sqlite/mesocycleStartStore';
import { startMesocycle } from '@usecases/mesocycleStart';
import { STAMPS } from '../fixtures/stamps';
import { seedReferences } from '../fixtures/references';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const NOW = '2026-09-19T09:00:00.000Z';

const planned: Mesocycle = {
  ...STAMPS,
  id: 'meso',
  name: 'Upper/Lower',
  lengthWeeks: 3,
  daysPerWeek: 2,
  status: 'planned',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  weekPlan: {
    days: [
      {
        dayNumber: 1,
        name: '',
        exercises: [
          { exerciseId: 'bench', order: 0, sets: 3 },
          { exerciseId: 'row', order: 1, sets: 3 },
          { exerciseId: 'press', order: 2, sets: 2 },
        ],
      },
      { dayNumber: 2, name: '', exercises: [{ exerciseId: 'squat', order: 0, sets: 3 }] },
    ],
  },
  createdAt: '2026-09-17T09:00:00.000Z',
};

async function setUp(mesocycles: Mesocycle[] = [planned]): Promise<MesocycleStartStore> {
  const store = createSqliteMesocycleStartStore(db());
  await seedReferences(db(), {
    // Start writes week 1's session exercises from the plan, so the library has to carry them.
    exerciseIds: mesocycles.flatMap(
      (mesocycle) =>
        mesocycle.weekPlan?.days.flatMap((day) =>
          day.exercises.map((exercise) => exercise.exerciseId),
        ) ?? [],
    ),
  });
  for (const mesocycle of mesocycles) {
    await store.repos.mesocycleRepo.create(mesocycle);
  }
  return store;
}

/**
 * `store`, with the repository `failing` swapped inside every transaction for one whose `method`
 * rejects — an artificial storage failure partway through Start's writes.
 */
function failingOn<K extends keyof MesocycleStartRepositories>(
  store: MesocycleStartStore,
  failing: K,
  method: keyof MesocycleStartRepositories[K],
): MesocycleStartStore {
  return {
    repos: store.repos,
    transaction: (work) =>
      store.transaction((repos) =>
        work({
          ...repos,
          [failing]: Object.assign(Object.create(repos[failing]), {
            [method]: () => Promise.reject(new Error(`${String(method)} failed`)),
          }),
        }),
      ),
  };
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('startMesocycle', () => {
  test('saves the mesocycle as active from now, without its week plan', async () => {
    const store = await setUp();

    const started = await startMesocycle('meso', { store }, NOW);

    expect(started.status).toBe('active');
    expect(started.startDate).toBe(NOW);
    const stored = await store.repos.mesocycleRepo.getById('meso');
    expect(stored).toEqual(started);
    expect(stored).not.toHaveProperty('weekPlan');
    await expect(store.repos.mesocycleRepo.getActive()).resolves.toEqual(started);
  });

  test("creates week 1 only: a ready session per day, with the plan's exercises", async () => {
    const store = await setUp();

    await startMesocycle('meso', { store }, NOW);

    const sessions = await store.repos.sessionRepo.listByMesoId('meso');
    expect(sessions.map(({ weekNumber, dayNumber }) => [weekNumber, dayNumber]).sort()).toEqual([
      [1, 1],
      [1, 2],
    ]);
    expect(sessions.every((session) => session.status === 'planned')).toBe(true);
    expect(sessions.every((session) => session.prescriptionStatus === 'ready')).toBe(true);

    const day1 = sessions.find((session) => session.dayNumber === 1)!;
    const exercises = await store.repos.sessionExerciseRepo.listBySessionId(day1.id);
    expect(
      [...exercises]
        .sort((a, b) => a.order - b.order)
        .map(({ exerciseId, order, setTargets, targetRir }) => ({
          exerciseId,
          order,
          sets: setTargets.length,
          targetRir,
        })),
    ).toEqual([
      // 3 weeks: 2 working weeks, startRir = min(3, 2 − 1) = 1 on week 1.
      { exerciseId: 'bench', order: 1, sets: 3, targetRir: 1 },
      { exerciseId: 'row', order: 2, sets: 3, targetRir: 1 },
      { exerciseId: 'press', order: 3, sets: 2, targetRir: 1 },
    ]);
  });

  test('DoD: a failure writing the exercises leaves neither the active status nor any session', async () => {
    const store = await setUp();

    const error = await rejectionOf(
      startMesocycle('meso', { store: failingOn(store, 'sessionExerciseRepo', 'createMany') }, NOW),
    );

    expect(error).toEqual(new Error('createMany failed'));
    await expect(store.repos.mesocycleRepo.getById('meso')).resolves.toEqual(planned);
    await expect(store.repos.mesocycleRepo.getActive()).resolves.toBeNull();
    await expect(store.repos.sessionRepo.listByMesoId('meso')).resolves.toEqual([]);
  });

  test('a failure saving the mesocycle itself rolls back the sessions and exercises already written', async () => {
    const store = await setUp();

    const error = await rejectionOf(
      startMesocycle('meso', { store: failingOn(store, 'mesocycleRepo', 'update') }, NOW),
    );

    expect(error).toEqual(new Error('update failed'));
    await expect(store.repos.mesocycleRepo.getById('meso')).resolves.toEqual(planned);
    await expect(store.repos.sessionRepo.listByMesoId('meso')).resolves.toEqual([]);
  });

  test('rejects with NotFoundError for an unknown mesocycle', async () => {
    const store = await setUp();

    const error = await rejectionOf(startMesocycle('missing', { store }, NOW));

    expect(isNotFoundError(error)).toBe(true);
  });

  test('rejects with ConflictError while another mesocycle is active, and writes nothing', async () => {
    const active: Mesocycle = {
      ...planned,
      id: 'meso-active',
      status: 'active',
      startDate: '2026-09-01T09:00:00.000Z',
      weekPlan: undefined,
    };
    const store = await setUp([planned, active]);

    const error = await rejectionOf(startMesocycle('meso', { store }, NOW));

    expect(isConflictError(error)).toBe(true);
    await expect(store.repos.mesocycleRepo.getById('meso')).resolves.toEqual(planned);
    await expect(store.repos.sessionRepo.listByMesoId('meso')).resolves.toEqual([]);
  });

  test('rejects with ConflictError once started — Start runs only once', async () => {
    const store = await setUp();
    await startMesocycle('meso', { store }, NOW);

    const error = await rejectionOf(startMesocycle('meso', { store }, NOW));

    expect(isConflictError(error)).toBe(true);
    await expect(store.repos.sessionRepo.listByMesoId('meso')).resolves.toHaveLength(2);
  });
});

// --- Flow C week 1 targets (task 122) -----------------------------------------------------
//
// A `copyWeek` block copies structure only; its week 1 reps and weights are priced here, at
// Start, from each exercise's own reference performance — not from the week that was copied.

const PAST_MESO = 'meso-past';

const copied: Mesocycle = {
  ...planned,
  id: 'meso-copy',
  name: 'Upper/Lower 2',
  // 8 weeks: 7 working weeks, startRir = min(3, 7 − 1) = 3 on week 1.
  lengthWeeks: 8,
  daysPerWeek: 1,
  origin: { type: 'copyWeek', sourceMesoId: PAST_MESO, sourceWeekNumber: 3 },
  weekPlan: {
    days: [
      {
        dayNumber: 1,
        name: '',
        exercises: [
          { exerciseId: 'bench', order: 0, sets: 3 },
          { exerciseId: 'row', order: 1, sets: 2 },
        ],
      },
    ],
  },
};

type Performance = {
  sessionExerciseId: string;
  exerciseId: string;
  /** The RIR the reference was performed at — what its reps get re-priced from. */
  targetRir: number;
  isDeload?: boolean;
  completedAt: string;
  /** `[weight, reps]` per set, in set order. */
  sets: [number, number][];
};

/**
 * Writes a past performance the way the app would: a completed session in `PAST_MESO`, one
 * session exercise on it, and a set log per set. Real rows, so `findLastPerformance` walks the
 * same join it walks on the phone.
 */
async function seedPerformance(
  store: MesocycleStartStore,
  performance: Performance,
  dayNumber: number,
): Promise<void> {
  const sessionId = `session-${performance.sessionExerciseId}`;
  await store.repos.sessionRepo.create({
    ...STAMPS,
    id: sessionId,
    mesoId: PAST_MESO,
    weekNumber: 1,
    dayNumber,
    isDeload: performance.isDeload ?? false,
    prescriptionStatus: 'ready',
    status: 'completed',
    completedAt: performance.completedAt,
  });
  await store.repos.sessionExerciseRepo.create({
    ...STAMPS,
    id: performance.sessionExerciseId,
    sessionId,
    exerciseId: performance.exerciseId,
    order: 1,
    setTargets: performance.sets.map((_, index) => ({ setNumber: index + 1 })),
    targetRir: performance.targetRir,
    status: 'completed',
  });
  for (const [index, [weight, reps]] of performance.sets.entries()) {
    await store.repos.setLogRepo.create({
      ...STAMPS,
      id: `${performance.sessionExerciseId}-set-${index + 1}`,
      sessionExerciseId: performance.sessionExerciseId,
      exerciseId: performance.exerciseId,
      setNumber: index + 1,
      weight,
      reps,
      completedAt: performance.completedAt,
    });
  }
}

async function setUpCopied(performances: Performance[]): Promise<MesocycleStartStore> {
  const store = await setUp([copied]);
  await store.repos.mesocycleRepo.create({
    ...STAMPS,
    id: PAST_MESO,
    name: 'Upper/Lower',
    lengthWeeks: 8,
    daysPerWeek: 1,
    startDate: '2026-07-01T00:00:00.000Z',
    status: 'completed',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    completedAt: '2026-09-10T00:00:00.000Z',
  });
  for (const [index, performance] of performances.entries()) {
    await seedPerformance(store, performance, index + 1);
  }
  return store;
}

/** `store`, counting every reference lookup Start makes inside its transaction. */
function countingLookups(store: MesocycleStartStore): {
  store: MesocycleStartStore;
  lookups: () => number;
} {
  let calls = 0;
  return {
    lookups: () => calls,
    store: {
      repos: store.repos,
      transaction: (work) =>
        store.transaction((repos) =>
          work({
            ...repos,
            setLogRepo: Object.assign(Object.create(repos.setLogRepo), {
              findLastPerformance: (query: Parameters<
                typeof repos.setLogRepo.findLastPerformance
              >[0]) => {
                calls += 1;
                return repos.setLogRepo.findLastPerformance(query);
              },
            }),
          }),
        ),
    },
  };
}

async function startedTargetsOf(store: MesocycleStartStore, exerciseId: string) {
  const [session] = await store.repos.sessionRepo.listByMesoId('meso-copy');
  const exercises = await store.repos.sessionExerciseRepo.listBySessionId(session!.id);
  return exercises.find((exercise) => exercise.exerciseId === exerciseId)?.setTargets;
}

describe('startMesocycle — copyWeek week 1 targets', () => {
  // DoD: week 1 gets its weight and reps from a fresh reference.
  test('prices week 1 from the exercise’s latest performance, per set', async () => {
    const store = await setUpCopied([
      {
        sessionExerciseId: 'sx-bench',
        exerciseId: 'bench',
        targetRir: 0,
        completedAt: '2026-09-10T08:00:00.000Z',
        sets: [
          [60, 10],
          [60, 9],
          [55, 8],
        ],
      },
    ]);

    await startMesocycle('meso-copy', { store }, NOW);

    // startRir 3, reference at RIR 0 → reps − 3; the reference weight carries over as is.
    await expect(startedTargetsOf(store, 'bench')).resolves.toEqual([
      { setNumber: 1, targetReps: 7, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 6, suggestedWeight: 60 },
      { setNumber: 3, targetReps: 5, suggestedWeight: 55 },
    ]);
  });

  // DoD: an exercise with no reference comes with no targets at all.
  test('leaves an exercise with no history bare, so the screen shows N RIR', async () => {
    const store = await setUpCopied([
      {
        sessionExerciseId: 'sx-bench',
        exerciseId: 'bench',
        targetRir: 0,
        completedAt: '2026-09-10T08:00:00.000Z',
        sets: [[60, 10]],
      },
    ]);

    await startMesocycle('meso-copy', { store }, NOW);

    // `row` is in the copied week but was never performed.
    await expect(startedTargetsOf(store, 'row')).resolves.toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
    ]);
  });

  // DoD: a reference from mid-block is re-priced by its own targetRir.
  test('re-prices a mid-block reference by the RIR it was actually performed at', async () => {
    const store = await setUpCopied([
      {
        sessionExerciseId: 'sx-bench',
        exerciseId: 'bench',
        // Mid-block week: performed at RIR 2, not at the block's final RIR 0.
        targetRir: 2,
        completedAt: '2026-09-10T08:00:00.000Z',
        sets: [[60, 10]],
      },
    ]);

    await startMesocycle('meso-copy', { store }, NOW);

    // 10 − (3 − 2) = 9, not 10 − 3 = 7.
    await expect(startedTargetsOf(store, 'bench')).resolves.toEqual([
      { setNumber: 1, targetReps: 9, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 9, suggestedWeight: 60 },
      { setNumber: 3, targetReps: 9, suggestedWeight: 60 },
    ]);
  });

  test('skips a deload performance, falling back to the working one', async () => {
    const store = await setUpCopied([
      {
        sessionExerciseId: 'sx-bench-working',
        exerciseId: 'bench',
        targetRir: 0,
        completedAt: '2026-09-01T08:00:00.000Z',
        sets: [[60, 10]],
      },
      {
        sessionExerciseId: 'sx-bench-deload',
        exerciseId: 'bench',
        targetRir: 8,
        isDeload: true,
        completedAt: '2026-09-12T08:00:00.000Z',
        sets: [[30, 5]],
      },
    ]);

    await startMesocycle('meso-copy', { store }, NOW);

    const targets = await startedTargetsOf(store, 'bench');
    expect(targets?.[0]).toEqual({ setNumber: 1, targetReps: 7, suggestedWeight: 60 });
  });

  test('ignores a performance older than historyLookbackDays', async () => {
    const store = await setUpCopied([
      {
        sessionExerciseId: 'sx-bench-ancient',
        exerciseId: 'bench',
        targetRir: 0,
        // NOW is 2026-09-19 and historyLookbackDays is 30, so this falls outside the window.
        completedAt: '2026-06-01T08:00:00.000Z',
        sets: [[60, 10]],
      },
    ]);

    await startMesocycle('meso-copy', { store }, NOW);

    await expect(startedTargetsOf(store, 'bench')).resolves.toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
      { setNumber: 3 },
    ]);
  });

  // DoD: a scratch mesocycle still starts with no targets — Flow A and B don't read history.
  test('a scratch mesocycle still starts with bare set targets', async () => {
    const store = await setUp();

    await startMesocycle('meso', { store }, NOW);

    const sessions = await store.repos.sessionRepo.listByMesoId('meso');
    const day1 = sessions.find((session) => session.dayNumber === 1)!;
    const exercises = await store.repos.sessionExerciseRepo.listBySessionId(day1.id);
    for (const exercise of exercises) {
      expect(exercise.setTargets.every((target) => Object.keys(target).length === 1)).toBe(true);
    }
  });

  // DoD: the write stays atomic — the history lookup happens inside the same transaction.
  test('a failure writing the exercises rolls back a copyWeek Start too', async () => {
    const store = await setUpCopied([
      {
        sessionExerciseId: 'sx-bench',
        exerciseId: 'bench',
        targetRir: 0,
        completedAt: '2026-09-10T08:00:00.000Z',
        sets: [[60, 10]],
      },
    ]);

    const error = await rejectionOf(
      startMesocycle(
        'meso-copy',
        { store: failingOn(store, 'sessionExerciseRepo', 'createMany') },
        NOW,
      ),
    );

    expect(error).toEqual(new Error('createMany failed'));
    await expect(store.repos.mesocycleRepo.getActive()).resolves.toBeNull();
    await expect(store.repos.sessionRepo.listByMesoId('meso-copy')).resolves.toEqual([]);
  });

  // The history lookup is one query per exercise. A Start that was never going to happen
  // shouldn't run any of them, so `validateMesocycleCanStart` is asked first.
  test('reads no history at all when the Start is going to be refused', async () => {
    const store = await setUpCopied([
      {
        sessionExerciseId: 'sx-bench',
        exerciseId: 'bench',
        targetRir: 0,
        completedAt: '2026-09-10T08:00:00.000Z',
        sets: [[60, 10]],
      },
    ]);
    await store.repos.mesocycleRepo.create({
      ...STAMPS,
      id: 'meso-running',
      name: 'Running block',
      lengthWeeks: 4,
      daysPerWeek: 1,
      startDate: '2026-09-01T09:00:00.000Z',
      status: 'active',
      origin: { type: 'scratch' },
      progressionSettings: defaultProgressionSettings,
    });
    const counted = countingLookups(store);

    const error = await rejectionOf(startMesocycle('meso-copy', { store: counted.store }, NOW));

    expect(isConflictError(error)).toBe(true);
    expect(counted.lookups()).toBe(0);
  });

  test('reads history once per distinct exercise of the plan', async () => {
    const store = await setUpCopied([
      {
        sessionExerciseId: 'sx-bench',
        exerciseId: 'bench',
        targetRir: 0,
        completedAt: '2026-09-10T08:00:00.000Z',
        sets: [[60, 10]],
      },
    ]);
    const counted = countingLookups(store);

    await startMesocycle('meso-copy', { store: counted.store }, NOW);

    // The copied week has `bench` and `row`, one day.
    expect(counted.lookups()).toBe(2);
  });
});
