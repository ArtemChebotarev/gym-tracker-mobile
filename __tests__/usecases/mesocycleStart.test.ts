import { eq } from 'drizzle-orm';

import { toExerciseId } from '@domain/catalog';
import { isConflictError, isNotFoundError } from '@domain/errors';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import type { MesocycleStartRepositories, MesocycleStartStore } from '@repositories/mesocycleStart';
import { SqliteExerciseRepository } from '@storage/sqlite/exerciseRepository';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { createSqliteMesocycleStartStore } from '@storage/sqlite/mesocycleStartStore';
import { exercises } from '@storage/sqlite/schema';
import { createSqliteWorkoutStore } from '@storage/sqlite/workoutStore';
import { startMesocycle } from '@usecases/mesocycleStart';
import { finishSession } from '@usecases/sessionFinish';
import { logSet } from '@usecases/setLogging';
import { COOLDOWN, HEAVY_BAG, HEAVY_BAG_CONFIG } from '../fixtures/hybridExercises';
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
// Start, from the history window — not from the week that was copied. Which performance each day
// builds on is the reference resolver's call, per target day (task 134.2, cases C1–C7).

/** The block being copied. */
const PAST_MESO = 'meso-past';
/** A block trained on another split, after or around the copied one. */
const OTHER_MESO = 'meso-other';

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
  /** `PAST_MESO` when omitted. */
  mesoId?: string;
  /** Week 1 when omitted. */
  weekNumber?: number;
  /** A day of its own per performance (its position, from 1) when omitted. */
  dayNumber?: number;
  /** The RIR the reference was performed at — what its reps get re-priced from. */
  targetRir: number;
  isDeload?: boolean;
  completedAt: string;
  /** `[weight, reps]` per set, in set order. */
  sets: [number, number][];
};

/**
 * Writes a past performance the way the app would: a completed session, one session exercise on
 * it, and a set log per set. Real rows, so `listPerformances` walks the same join it walks on the
 * phone.
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
    mesoId: performance.mesoId ?? PAST_MESO,
    weekNumber: performance.weekNumber ?? 1,
    dayNumber: performance.dayNumber ?? dayNumber,
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

async function setUpCopied(
  performances: Performance[],
  weekPlan: Mesocycle['weekPlan'] = copied.weekPlan,
): Promise<MesocycleStartStore> {
  const store = await setUp([{ ...copied, weekPlan }]);
  for (const [id, name] of [
    [PAST_MESO, 'Upper/Lower'],
    [OTHER_MESO, 'Arms/Shoulders'],
  ] as const) {
    await store.repos.mesocycleRepo.create({
      ...STAMPS,
      id,
      name,
      lengthWeeks: 8,
      daysPerWeek: 1,
      startDate: '2026-07-01T00:00:00.000Z',
      status: 'completed',
      origin: { type: 'scratch' },
      progressionSettings: defaultProgressionSettings,
      completedAt: '2026-09-10T00:00:00.000Z',
    });
  }
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
              listPerformances: (
                query: Parameters<typeof repos.setLogRepo.listPerformances>[0],
              ) => {
                calls += 1;
                return repos.setLogRepo.listPerformances(query);
              },
            }),
          }),
        ),
    },
  };
}

async function startedTargetsOf(store: MesocycleStartStore, exerciseId: string, dayNumber = 1) {
  const sessions = await store.repos.sessionRepo.listByMesoId('meso-copy');
  const session = sessions.find((candidate) => candidate.dayNumber === dayNumber);
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

    // startRir 3, reference at RIR 0 → reps + 1 − 3; the reference weight carries over as is.
    await expect(startedTargetsOf(store, 'bench')).resolves.toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 7, suggestedWeight: 60 },
      { setNumber: 3, targetReps: 6, suggestedWeight: 55 },
    ]);
  });

  // GT-81, 10.2 P14: the power policy prices the start, with no clamp to a corridor.
  test('a power exercise is priced by the power policy: 10 kg × 1 rep gives no numbers', async () => {
    const store = await setUpCopied([
      {
        sessionExerciseId: 'sx-bench',
        exerciseId: 'bench',
        targetRir: 0,
        completedAt: '2026-09-10T08:00:00.000Z',
        sets: [
          [10, 1],
          [10, 6],
        ],
      },
    ]);
    await db()
      .update(exercises)
      .set({ type: 'power' })
      .where(eq(exercises.id, toExerciseId('bench')));

    await startMesocycle('meso-copy', { store }, NOW);

    // 1 + 1 − 3 = −1 is no recommendation (strength would lift it to its minReps of 5); 6 + 1 − 3 = 4.
    await expect(startedTargetsOf(store, 'bench')).resolves.toEqual([
      { setNumber: 1 },
      { setNumber: 2, targetReps: 4, suggestedWeight: 10 },
      { setNumber: 3 },
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

  // DoD: a reference from mid-block is re-priced by its own targetRir. Set on set since 134.2:
  // the reference had one set, so only row 1 has numbers to go by (was: all three took set 1).
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

    // 10 + 1 − (3 − 2) = 10, not 10 + 1 − 3 = 8.
    await expect(startedTargetsOf(store, 'bench')).resolves.toEqual([
      { setNumber: 1, targetReps: 10, suggestedWeight: 60 },
      { setNumber: 2 },
      { setNumber: 3 },
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
    expect(targets?.[0]).toEqual({ setNumber: 1, targetReps: 8, suggestedWeight: 60 });
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

// Task 134.2 — the resolver per target day. The copied block trained bench twice a week; the new
// one keeps both days and adds a third.
describe('startMesocycle — copyWeek rows that share an order (GT-148)', () => {
  const benchPerformance: Performance = {
    sessionExerciseId: 'sx-bench',
    exerciseId: 'bench',
    targetRir: 0,
    completedAt: '2026-09-10T08:00:00.000Z',
    sets: [
      [60, 10],
      [60, 9],
    ],
  };

  test('an exercise added without history takes nothing from the one that shares its order', async () => {
    // What the editor produced before the fix: the copied exercise and the added one both `1`.
    const store = await setUpCopied([benchPerformance], {
      days: [
        {
          dayNumber: 1,
          name: '',
          exercises: [
            { exerciseId: 'bench', order: 1, sets: 2 },
            { exerciseId: 'row', order: 1, sets: 2 },
          ],
        },
      ],
    });

    await startMesocycle('meso-copy', { store }, NOW);

    await expect(startedTargetsOf(store, 'bench')).resolves.toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 7, suggestedWeight: 60 },
    ]);
    await expect(startedTargetsOf(store, 'row')).resolves.toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
    ]);
  });

  test('one exercise twice in a day: both rows take the day’s reference, each by its own set count', async () => {
    const store = await setUpCopied([benchPerformance], {
      days: [
        {
          dayNumber: 1,
          name: '',
          exercises: [
            { exerciseId: 'bench', order: 0, sets: 2 },
            { exerciseId: 'bench', order: 1, sets: 3 },
          ],
        },
      ],
    });

    await startMesocycle('meso-copy', { store }, NOW);

    const sessions = await store.repos.sessionRepo.listByMesoId('meso-copy');
    const rows = await store.repos.sessionExerciseRepo.listBySessionId(sessions[0]!.id);
    const byOrder = [...rows].sort((a, b) => a.order - b.order).map((row) => row.setTargets);

    expect(byOrder[0]).toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 7, suggestedWeight: 60 },
    ]);
    // The reference has two sets; the third row has none to go by.
    expect(byOrder[1]).toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 7, suggestedWeight: 60 },
      { setNumber: 3 },
    ]);
  });
});

describe('startMesocycle — copyWeek targets per target day', () => {
  const threeDays: Mesocycle['weekPlan'] = {
    days: [1, 2, 3].map((dayNumber) => ({
      dayNumber,
      name: '',
      exercises: [{ exerciseId: 'bench', order: 0, sets: 2 }],
    })),
  };

  function bench(
    id: string,
    slot: Pick<Performance, 'mesoId' | 'weekNumber' | 'dayNumber'>,
    sets: [number, number][],
    completedAt = '2026-09-10T08:00:00.000Z',
  ): Performance {
    return { sessionExerciseId: id, exerciseId: 'bench', targetRir: 0, completedAt, sets, ...slot };
  }

  test('C2 / C5: each day takes its own numbers; a new day with two that differ gets none', async () => {
    const store = await setUpCopied(
      [
        bench('sx-day-1', { weekNumber: 3, dayNumber: 1 }, [
          [60, 10],
          [60, 9],
        ]),
        bench(
          'sx-day-2',
          { weekNumber: 3, dayNumber: 2 },
          [
            [55, 12],
            [55, 11],
          ],
          '2026-09-12T08:00:00.000Z',
        ),
      ],
      threeDays,
    );

    await startMesocycle('meso-copy', { store }, NOW);

    // startRir 3, reference at RIR 0 → reps + 1 − 3.
    await expect(startedTargetsOf(store, 'bench', 1)).resolves.toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 7, suggestedWeight: 60 },
    ]);
    await expect(startedTargetsOf(store, 'bench', 2)).resolves.toEqual([
      { setNumber: 1, targetReps: 10, suggestedWeight: 55 },
      { setNumber: 2, targetReps: 9, suggestedWeight: 55 },
    ]);
    await expect(startedTargetsOf(store, 'bench', 3)).resolves.toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
    ]);
  });

  test('C3: a new day where both old days said the same gets a target', async () => {
    const sets: [number, number][] = [
      [60, 10],
      [60, 9],
    ];
    const store = await setUpCopied(
      [
        bench('sx-day-1', { weekNumber: 3, dayNumber: 1 }, sets),
        bench('sx-day-2', { weekNumber: 3, dayNumber: 2 }, sets, '2026-09-12T08:00:00.000Z'),
      ],
      threeDays,
    );

    await startMesocycle('meso-copy', { store }, NOW);

    await expect(startedTargetsOf(store, 'bench', 3)).resolves.toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 7, suggestedWeight: 60 },
    ]);
  });

  test('C4: done on day 1 only — day 1 gets a target, the other days an estimate, with the RIR gap', async () => {
    const store = await setUpCopied(
      [
        bench('sx-day-1', { weekNumber: 3, dayNumber: 1 }, [
          [60, 10],
          [60, 9],
        ]),
      ],
      threeDays,
    );

    await startMesocycle('meso-copy', { store }, NOW);

    await expect(startedTargetsOf(store, 'bench', 1)).resolves.toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 7, suggestedWeight: 60 },
    ]);
    for (const dayNumber of [2, 3]) {
      await expect(startedTargetsOf(store, 'bench', dayNumber)).resolves.toEqual([
        { setNumber: 1, targetReps: 8, suggestedWeight: 60, estimate: 'other_slot' },
        { setNumber: 2, targetReps: 7, suggestedWeight: 60, estimate: 'other_slot' },
      ]);
    }
  });

  test('C6: the latest week is from another split — an estimate, re-priced for the RIR gap', async () => {
    const store = await setUpCopied([
      // The copied block's own day 1, older…
      bench('sx-copied', { weekNumber: 3, dayNumber: 1 }, [[60, 10]], '2026-09-01T08:00:00.000Z'),
      // …then a newer week on another split, performed at RIR 2.
      {
        ...bench('sx-other', { mesoId: OTHER_MESO, weekNumber: 1, dayNumber: 2 }, [[62.5, 9]]),
        targetRir: 2,
        completedAt: '2026-09-15T08:00:00.000Z',
      },
    ]);

    await startMesocycle('meso-copy', { store }, NOW);

    // 9 + 1 − (3 − 2) = 9, from the newer block; the copied block's day 1 doesn't win.
    await expect(startedTargetsOf(store, 'bench')).resolves.toEqual([
      { setNumber: 1, targetReps: 9, suggestedWeight: 62.5, estimate: 'other_slot' },
      { setNumber: 2 },
      { setNumber: 3 },
    ]);
  });

  test('C6: another split with two days that differ — no numbers', async () => {
    const store = await setUpCopied([
      bench('sx-other-1', { mesoId: OTHER_MESO, weekNumber: 1, dayNumber: 1 }, [[60, 10]]),
      bench(
        'sx-other-2',
        { mesoId: OTHER_MESO, weekNumber: 1, dayNumber: 2 },
        [[50, 12]],
        '2026-09-12T08:00:00.000Z',
      ),
    ]);

    await startMesocycle('meso-copy', { store }, NOW);

    await expect(startedTargetsOf(store, 'bench')).resolves.toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
      { setNumber: 3 },
    ]);
  });

  test('reads each exercise’s history once, however many days it is on', async () => {
    const store = await setUpCopied(
      [bench('sx-day-1', { weekNumber: 3, dayNumber: 1 }, [[60, 10]])],
      threeDays,
    );
    const counted = countingLookups(store);

    await startMesocycle('meso-copy', { store: counted.store }, NOW);

    expect(counted.lookups()).toBe(1);
  });
});

// GT-84, 10.2 P14 and P3: a block with a strength and a power exercise, copied from a past week,
// goes through Start, a logged week 1 and its Finish, the way the app drives it. Start prices
// each exercise by its own policy; week 2 is planned from week 1's fact, again per type.
// GT-185 (10.1 FR-9; 04, Flow C): a copied block's interval starts from history, as strength does —
// per day + exercise, round N from round N of the day's reference as it ended, and no lever step:
// the cycle's settings give the round count, never the times.
describe('startMesocycle — copyWeek interval rounds from history (GT-185)', () => {
  const bagOnThreeDays: Mesocycle['weekPlan'] = {
    days: [1, 2, 3].map((dayNumber) => ({
      dayNumber,
      name: '',
      // Three rounds on the day (GT-190): the count is the slot's, as sets are.
      exercises: [{ exerciseId: HEAVY_BAG.id, order: 0, sets: 3 }],
    })),
  };

  type RoundsPerformance = {
    id: string;
    dayNumber: number;
    /** Planned work / rest per round. */
    planned: [number, number][];
    /** Logged work / rest per round, with what the timer says about it. */
    logged: { workSec: number; restSec: number; restSkipped?: boolean; completed?: boolean }[];
  };

  async function seedRounds(store: MesocycleStartStore, performance: RoundsPerformance) {
    const sessionId = `session-${performance.id}`;
    const completedAt = `2026-09-1${performance.dayNumber}T08:00:00.000Z`;
    await store.repos.sessionRepo.create({
      ...STAMPS,
      id: sessionId,
      mesoId: PAST_MESO,
      weekNumber: 3,
      dayNumber: performance.dayNumber,
      isDeload: false,
      prescriptionStatus: 'ready',
      status: 'completed',
      completedAt,
    });
    await store.repos.sessionExerciseRepo.create({
      ...STAMPS,
      id: performance.id,
      sessionId,
      exerciseId: HEAVY_BAG.id,
      order: 1,
      setTargets: performance.planned.map(([targetWorkSec, targetRestSec], index) => ({
        setNumber: index + 1,
        targetWorkSec,
        targetRestSec,
      })),
      targetRir: 0,
      status: 'completed',
    });
    const { roundLogRepo } = createSqliteWorkoutStore(db()).repos;
    for (const [index, log] of performance.logged.entries()) {
      await roundLogRepo.create({
        ...STAMPS,
        id: `${performance.id}-round-${index + 1}`,
        sessionExerciseId: performance.id,
        exerciseId: HEAVY_BAG.id,
        roundNumber: index + 1,
        workSec: log.workSec,
        restSec: log.restSec,
        restSkipped: log.restSkipped ?? false,
        completed: log.completed ?? true,
        completedAt,
      });
    }
  }

  async function startWithBagHistory(performances: RoundsPerformance[]) {
    await new SqliteExerciseRepository(db()).createCustom(HEAVY_BAG);
    const store = await setUpCopied([], bagOnThreeDays);
    // The new block plans three rounds of it; its 2:00 / 0:45 must not reach week 1.
    await store.repos.mesocycleRepo.update({
      ...(await store.repos.mesocycleRepo.getById('meso-copy'))!,
      exerciseSettings: { [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG } },
    });
    for (const performance of performances) {
      await seedRounds(store, performance);
    }
    await startMesocycle('meso-copy', { store }, NOW);
    return store;
  }

  test('DoD: each day starts from its own last run — two days, two times — with no lever step', async () => {
    const store = await startWithBagHistory([
      // Day 1: two rounds, both done — a step would apply next week, not at a block's start.
      {
        id: 'sx-bag-day-1',
        dayNumber: 1,
        planned: [
          [90, 30],
          [90, 30],
        ],
        logged: [
          { workSec: 90, restSec: 30 },
          { workSec: 90, restSec: 30 },
        ],
      },
      // Day 2: a skipped rest and a round ended early — each keeps its plan.
      {
        id: 'sx-bag-day-2',
        dayNumber: 2,
        planned: [
          [60, 20],
          [60, 20],
          [60, 20],
        ],
        logged: [
          { workSec: 60, restSec: 3, restSkipped: true },
          { workSec: 60, restSec: 20 },
          { workSec: 25, restSec: 20, completed: false },
        ],
      },
    ]);

    // The reference had two rounds: round 3 takes the last one's.
    await expect(startedTargetsOf(store, HEAVY_BAG.id, 1)).resolves.toEqual([
      { setNumber: 1, targetWorkSec: 90, targetRestSec: 30 },
      { setNumber: 2, targetWorkSec: 90, targetRestSec: 30 },
      { setNumber: 3, targetWorkSec: 90, targetRestSec: 30 },
    ]);
    await expect(startedTargetsOf(store, HEAVY_BAG.id, 2)).resolves.toEqual([
      { setNumber: 1, targetWorkSec: 60, targetRestSec: 20 },
      { setNumber: 2, targetWorkSec: 60, targetRestSec: 20 },
      { setNumber: 3, targetWorkSec: 60, targetRestSec: 20 },
    ]);
    // Day 3 is new, and the two old days differ: nothing to go by — rounds with no times.
    await expect(startedTargetsOf(store, HEAVY_BAG.id, 3)).resolves.toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
      { setNumber: 3 },
    ]);
  });

  test('no history at all: the day’s rounds, with no times — not the cycle’s 2:00 / 0:45', async () => {
    const store = await startWithBagHistory([]);

    await expect(startedTargetsOf(store, HEAVY_BAG.id, 1)).resolves.toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
      { setNumber: 3 },
    ]);
  });
});

// GT-107 (10.1 FR-9, FR-10): a copied block's mobility exercise starts from history as an interval
// does — its block's length, as it ended. A block cut short keeps its plan; with no history the
// length is picked on the card.
describe('startMesocycle — copyWeek mobility length from history (GT-107)', () => {
  const cooldownOnDayOne: Mesocycle['weekPlan'] = {
    days: [{ dayNumber: 1, name: '', exercises: [{ exerciseId: COOLDOWN.id, order: 0, sets: 1 }] }],
  };

  async function startWithCooldown(block?: {
    plannedSec: number;
    workSec: number;
    completed: boolean;
  }) {
    await new SqliteExerciseRepository(db()).createCustom(COOLDOWN);
    const store = await setUpCopied([], cooldownOnDayOne);
    await store.repos.mesocycleRepo.update({
      ...(await store.repos.mesocycleRepo.getById('meso-copy'))!,
      exerciseSettings: { [COOLDOWN.id]: { type: 'mobility' } },
    });
    if (block !== undefined) {
      const completedAt = '2026-09-11T08:00:00.000Z';
      await store.repos.sessionRepo.create({
        ...STAMPS,
        id: 'session-cooldown',
        mesoId: PAST_MESO,
        weekNumber: 3,
        dayNumber: 1,
        isDeload: false,
        prescriptionStatus: 'ready',
        status: 'completed',
        completedAt,
      });
      await store.repos.sessionExerciseRepo.create({
        ...STAMPS,
        id: 'sx-cooldown',
        sessionId: 'session-cooldown',
        exerciseId: COOLDOWN.id,
        order: 1,
        setTargets: [{ setNumber: 1, targetWorkSec: block.plannedSec }],
        targetRir: 0,
        status: 'completed',
      });
      await createSqliteWorkoutStore(db()).repos.roundLogRepo.create({
        ...STAMPS,
        id: 'sx-cooldown-block',
        sessionExerciseId: 'sx-cooldown',
        exerciseId: COOLDOWN.id,
        roundNumber: 1,
        workSec: block.workSec,
        restSkipped: false,
        completed: block.completed,
        completedAt,
      });
    }
    await startMesocycle('meso-copy', { store }, NOW);
    return store;
  }

  test('the length it was done with', async () => {
    const store = await startWithCooldown({ plannedSec: 600, workSec: 480, completed: true });

    await expect(startedTargetsOf(store, COOLDOWN.id, 1)).resolves.toEqual([
      { setNumber: 1, targetWorkSec: 480 },
    ]);
  });

  test('a block ended early keeps its plan', async () => {
    const store = await startWithCooldown({ plannedSec: 600, workSec: 200, completed: false });

    await expect(startedTargetsOf(store, COOLDOWN.id, 1)).resolves.toEqual([
      { setNumber: 1, targetWorkSec: 600 },
    ]);
  });

  test('no history: one block with no length', async () => {
    const store = await startWithCooldown();

    await expect(startedTargetsOf(store, COOLDOWN.id, 1)).resolves.toEqual([{ setNumber: 1 }]);
  });
});

describe('startMesocycle — a mixed block through to week 2 (GT-84)', () => {
  const benchPerformance: Performance = {
    sessionExerciseId: 'sx-bench',
    exerciseId: 'bench',
    targetRir: 0,
    completedAt: '2026-09-10T08:00:00.000Z',
    sets: [
      [60, 10],
      [60, 9],
      [55, 8],
    ],
  };

  /** `row` as a power exercise loaded in kilograms, the way the library stores one. */
  async function makePower(exerciseId: string): Promise<void> {
    await db()
      .update(exercises)
      .set({
        type: 'power',
        config: { type: 'power', load: 'weight', noHeavierAvailable: false },
      })
      .where(eq(exercises.id, toExerciseId(exerciseId)));
  }

  async function weekSession(store: MesocycleStartStore, weekNumber: number) {
    const sessions = await store.repos.sessionRepo.listByMesoId('meso-copy');
    const session = sessions.find((candidate) => candidate.weekNumber === weekNumber);
    const rows = await store.repos.sessionExerciseRepo.listBySessionId(session!.id);
    return { session: session!, rows };
  }

  test('Start, week 1 logged and finished: week 2 is planned per type from its fact', async () => {
    const store = await setUpCopied([
      benchPerformance,
      {
        sessionExerciseId: 'sx-row',
        exerciseId: 'row',
        // Day 1 of the copied block, like bench, on its last working week (RIR 0).
        weekNumber: 7,
        dayNumber: 1,
        targetRir: 0,
        completedAt: '2026-09-11T08:00:00.000Z',
        sets: [
          [16, 1],
          [16, 6],
        ],
      },
    ]);
    await makePower('row');

    await startMesocycle('meso-copy', { store }, NOW);

    // Start: strength 10 / 9 / 8 at RIR 0 → reps + 1 − 3. Power the same sum with no clamp:
    // 1 + 1 − 3 = −1 is no recommendation, 6 + 1 − 3 = 4.
    const weekOne = await weekSession(store, 1);
    const weekOneRow = (exerciseId: string) =>
      weekOne.rows.find((row) => row.exerciseId === exerciseId)!;
    expect(weekOneRow('bench').setTargets).toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 7, suggestedWeight: 60 },
      { setNumber: 3, targetReps: 6, suggestedWeight: 55 },
    ]);
    expect(weekOneRow('row').setTargets).toEqual([
      { setNumber: 1 },
      { setNumber: 2, targetReps: 4, suggestedWeight: 16 },
    ]);
    // The power row keeps the week's RIR: the next block's Start reads it back (P5, P14).
    expect(weekOneRow('row').targetRir).toBe(3);

    const workout = createSqliteWorkoutStore(db());
    const week1Logs: [string, number, number, number][] = [
      ['bench', 1, 60, 8],
      ['bench', 2, 60, 7],
      ['bench', 3, 55, 6],
      // The bare row is logged like any other; the second set reaches the top of the corridor.
      ['row', 1, 16, 3],
      ['row', 2, 16, 6],
    ];
    for (const [index, [exerciseId, setNumber, weight, reps]] of week1Logs.entries()) {
      const result = await logSet(
        {
          sessionId: weekOne.session.id,
          sessionExerciseId: weekOneRow(exerciseId).id,
          setNumber,
        },
        { weight, reps },
        workout,
        `2026-09-20T08:0${index}:00.000Z`,
      );
      expect(result.kind).toBe('logged');
    }
    const { nextSession } = await finishSession(
      weekOne.session.id,
      {
        workout,
        mesocycleRepo: new SqliteMesocycleRepository(db()),
        exerciseRepo: new SqliteExerciseRepository(db()),
      },
      '2026-09-20T09:00:00.000Z',
    );
    expect(nextSession).toMatchObject({ weekNumber: 2, dayNumber: 1 });

    const weekTwo = await weekSession(store, 2);
    const weekTwoRow = (exerciseId: string) =>
      weekTwo.rows.find((row) => row.exerciseId === exerciseId)!;
    // Strength: rule 2, the fact + 1 on the logged weight.
    expect(weekTwoRow('bench').setTargets).toEqual([
      { setNumber: 1, targetReps: 9, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 8, suggestedWeight: 60 },
      { setNumber: 3, targetReps: 7, suggestedWeight: 55 },
    ]);
    // Power, P3: set by set, the fact + 1 on its own weight. The set Start left bare grows from
    // what was logged on it; the one at 6 goes past the corridor with the "heavier" hint.
    expect(weekTwoRow('row').setTargets).toEqual([
      { setNumber: 1, targetReps: 4, suggestedWeight: 16 },
      { setNumber: 2, targetReps: 7, suggestedWeight: 16, weightHint: 'increase' },
    ]);
    // 8 weeks, 7 working: week 2 of 7 is ceil(3 × 5 / 6) = 3, for both types.
    expect(weekTwoRow('bench').targetRir).toBe(3);
    expect(weekTwoRow('row').targetRir).toBe(3);
  });

  test('a 4-week block starts power at RIR 2: 6 / 6 / 6 at RIR 0 gives 5 / 5 / 5 (P14)', async () => {
    const store = await setUpCopied(
      [
        {
          sessionExerciseId: 'sx-row',
          exerciseId: 'row',
          targetRir: 0,
          completedAt: '2026-09-11T08:00:00.000Z',
          sets: [
            [16, 6],
            [16, 6],
            [16, 6],
          ],
        },
      ],
      { days: [{ dayNumber: 1, name: '', exercises: [{ exerciseId: 'row', order: 0, sets: 3 }] }] },
    );
    await db()
      .update(exercises)
      .set({ type: 'power' })
      .where(eq(exercises.id, toExerciseId('row')));
    await store.repos.mesocycleRepo.update({
      ...(await store.repos.mesocycleRepo.getById('meso-copy'))!,
      lengthWeeks: 4,
    });

    await startMesocycle('meso-copy', { store }, NOW);

    // startRir = min(3, 4 − 2) = 2 → 6 + 1 − 2 = 5.
    await expect(startedTargetsOf(store, 'row')).resolves.toEqual([
      { setNumber: 1, targetReps: 5, suggestedWeight: 16 },
      { setNumber: 2, targetReps: 5, suggestedWeight: 16 },
      { setNumber: 3, targetReps: 5, suggestedWeight: 16 },
    ]);
  });
});
