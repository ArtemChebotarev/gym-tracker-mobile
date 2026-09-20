import { isConflictError, isNotFoundError } from '@domain/errors';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import type { MesocycleStartRepositories, MesocycleStartStore } from '@repositories/mesocycleStart';
import { createInMemoryMesocycleStartStore } from '@storage/mesocycleStartStore';
import { InMemoryStore } from '@storage/store';
import { startMesocycle } from '@usecases/mesocycleStart';
import { STAMPS } from '../fixtures/stamps';

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
  const store = createInMemoryMesocycleStartStore(new InMemoryStore());
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
