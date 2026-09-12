import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { NotFoundError } from '@domain/errors';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { SET_LOG_COLLECTION } from '@storage/collectionNames';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { InMemorySessionRepository } from '@storage/session';
import { InMemorySessionExerciseRepository } from '@storage/sessionExercise';
import { InMemoryStore } from '@storage/store';

function makeMesocycle(overrides: Partial<Mesocycle> = {}): Mesocycle {
  return {
    id: 'meso-a',
    name: 'Push Pull Legs',
    lengthWeeks: 6,
    daysPerWeek: 3,
    startDate: '2026-01-05',
    status: 'active',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    createdAt: '2026-01-05T00:00:00.000Z',
    ...overrides,
  };
}

describe('InMemoryMesocycleRepository', () => {
  test('create, getById, and getAll round-trip a mesocycle', async () => {
    const repo = new InMemoryMesocycleRepository(new InMemoryStore());
    const meso = makeMesocycle();

    await repo.create(meso);

    await expect(repo.getById(meso.id)).resolves.toEqual(meso);
    await expect(repo.getAll()).resolves.toEqual([meso]);
    await expect(repo.getById('missing')).resolves.toBeNull();
  });

  test('getActive returns the single active mesocycle, or null if none is active', async () => {
    const repo = new InMemoryMesocycleRepository(new InMemoryStore());
    await repo.create(makeMesocycle({ id: 'meso-done', status: 'completed' }));

    await expect(repo.getActive()).resolves.toBeNull();

    const active = makeMesocycle({ id: 'meso-active', status: 'active' });
    await repo.create(active);

    await expect(repo.getActive()).resolves.toEqual(active);
  });

  test('update replaces the stored mesocycle', async () => {
    const repo = new InMemoryMesocycleRepository(new InMemoryStore());
    await repo.create(makeMesocycle());

    const updated = await repo.update(
      makeMesocycle({ status: 'completed', completedAt: '2026-02-16T00:00:00.000Z' }),
    );

    expect(updated.status).toBe('completed');
    await expect(repo.getById('meso-a')).resolves.toEqual(updated);
  });

  test('deleteWithChildren removes the mesocycle and every session, session exercise, and set log under it', async () => {
    const store = new InMemoryStore();
    const mesocycles = new InMemoryMesocycleRepository(store);
    const sessions = new InMemorySessionRepository(store);
    const sessionExercises = new InMemorySessionExerciseRepository(store);
    const setLogs = store.collection<SetLog>(SET_LOG_COLLECTION);

    await mesocycles.create(makeMesocycle());
    const session: Session = {
      id: 'session-1',
      mesoId: 'meso-a',
      weekNumber: 1,
      dayNumber: 1,
      isDeload: false,
      prescriptionStatus: 'ready',
      status: 'completed',
      completedAt: '2026-01-05T10:00:00.000Z',
    };
    await sessions.create(session);
    const sessionExercise: SessionExercise = {
      id: 'session-exercise-1',
      sessionId: 'session-1',
      exerciseId: 'exercise-bench-press',
      order: 1,
      setTargets: [{ setNumber: 1, targetReps: 8 }],
      targetRir: 2,
      status: 'completed',
    };
    await sessionExercises.create(sessionExercise);
    await setLogs.insert({
      id: 'set-log-1',
      sessionExerciseId: 'session-exercise-1',
      exerciseId: 'exercise-bench-press',
      setNumber: 1,
      weight: 60,
      reps: 8,
      completedAt: '2026-01-05T10:05:00.000Z',
    });

    // A sibling mesocycle's data must survive the cascade untouched.
    const otherMeso = makeMesocycle({ id: 'meso-b' });
    await mesocycles.create(otherMeso);
    const otherSession: Session = { ...session, id: 'session-2', mesoId: 'meso-b' };
    await sessions.create(otherSession);

    await mesocycles.deleteWithChildren('meso-a');

    await expect(mesocycles.getById('meso-a')).resolves.toBeNull();
    await expect(sessions.getById('session-1')).resolves.toBeNull();
    await expect(sessionExercises.listBySessionId('session-1')).resolves.toEqual([]);
    await expect(setLogs.findById('set-log-1')).resolves.toBeUndefined();

    await expect(mesocycles.getById('meso-b')).resolves.toEqual(otherMeso);
    await expect(sessions.getById('session-2')).resolves.toEqual(otherSession);
  });

  test('deleteWithChildren rejects for a missing mesocycle without deleting anything it partway touched', async () => {
    const store = new InMemoryStore();
    const mesocycles = new InMemoryMesocycleRepository(store);
    const sessions = new InMemorySessionRepository(store);
    const survivor: Session = {
      id: 'session-survivor',
      mesoId: 'missing',
      weekNumber: 1,
      dayNumber: 1,
      isDeload: false,
      prescriptionStatus: 'ready',
      status: 'planned',
    };
    await sessions.create(survivor);

    await expect(mesocycles.deleteWithChildren('missing')).rejects.toBeInstanceOf(NotFoundError);

    // The transaction rolled back: the orphan session it deleted along the way is restored.
    await expect(sessions.getById('session-survivor')).resolves.toEqual(survivor);
  });
});
