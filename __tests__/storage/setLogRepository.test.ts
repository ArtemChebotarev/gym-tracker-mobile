import type { SessionExercise, SetLog } from '@domain/execution';
import { SESSION_EXERCISE_COLLECTION } from '@storage/collectionNames';
import { InMemorySetLogRepository } from '@storage/setLogRepository';
import { InMemoryStore } from '@storage/store';

function makeSetLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
    id: 'set-log-1',
    sessionExerciseId: 'session-exercise-1',
    exerciseId: 'exercise-bench-press',
    setNumber: 1,
    weight: 60,
    reps: 8,
    completedAt: '2026-08-26T08:00:00.000Z',
    ...overrides,
  };
}

function makeSessionExercise(overrides: Partial<SessionExercise> = {}): SessionExercise {
  return {
    id: 'session-exercise-1',
    sessionId: 'session-1',
    exerciseId: 'exercise-bench-press',
    order: 1,
    setTargets: [{ setNumber: 1, targetReps: 8 }],
    targetRir: 2,
    status: 'completed',
    ...overrides,
  };
}

describe('InMemorySetLogRepository', () => {
  test('listBySessionExerciseId returns only sets for that session exercise', async () => {
    const repo = new InMemorySetLogRepository(new InMemoryStore());
    await repo.create(makeSetLog({ id: 'log-1', sessionExerciseId: 'se-bench' }));
    await repo.create(makeSetLog({ id: 'log-2', sessionExerciseId: 'se-row' }));

    await expect(repo.listBySessionExerciseId('se-row')).resolves.toEqual([
      makeSetLog({ id: 'log-2', sessionExerciseId: 'se-row' }),
    ]);
  });

  test('listBySessionId joins through SessionExercise to assemble every set logged in a session', async () => {
    const store = new InMemoryStore();
    const repo = new InMemorySetLogRepository(store);
    const sessionExercises = store.collection<SessionExercise>(SESSION_EXERCISE_COLLECTION);
    await sessionExercises.insert(makeSessionExercise({ id: 'se-bench', sessionId: 'session-1' }));
    await sessionExercises.insert(makeSessionExercise({ id: 'se-row', sessionId: 'session-1' }));
    await sessionExercises.insert(makeSessionExercise({ id: 'se-other-session', sessionId: 'session-2' }));

    await repo.create(makeSetLog({ id: 'log-1', sessionExerciseId: 'se-bench' }));
    await repo.create(makeSetLog({ id: 'log-2', sessionExerciseId: 'se-row' }));
    await repo.create(makeSetLog({ id: 'log-3', sessionExerciseId: 'se-other-session' }));

    const result = await repo.listBySessionId('session-1');

    expect(result.map((log) => log.id).sort()).toEqual(['log-1', 'log-2']);
  });

  test('listByExerciseId sorts by completedAt descending by default and honors limit and order', async () => {
    const repo = new InMemorySetLogRepository(new InMemoryStore());
    const oldest = makeSetLog({ id: 'log-1', completedAt: '2026-08-01T08:00:00.000Z' });
    const middle = makeSetLog({ id: 'log-2', completedAt: '2026-08-15T08:00:00.000Z' });
    const newest = makeSetLog({ id: 'log-3', completedAt: '2026-08-26T08:00:00.000Z' });
    await repo.create(oldest);
    await repo.create(middle);
    await repo.create(newest);

    await expect(repo.listByExerciseId('exercise-bench-press')).resolves.toEqual([
      newest,
      middle,
      oldest,
    ]);
    await expect(
      repo.listByExerciseId('exercise-bench-press', { order: 'asc' }),
    ).resolves.toEqual([oldest, middle, newest]);
    await expect(
      repo.listByExerciseId('exercise-bench-press', { limit: 2 }),
    ).resolves.toEqual([newest, middle]);
  });

  test('listByExerciseId returns an empty array when the exercise has never been logged', async () => {
    const repo = new InMemorySetLogRepository(new InMemoryStore());
    await repo.create(makeSetLog());

    await expect(repo.listByExerciseId('exercise-never-logged')).resolves.toEqual([]);
  });

  test('listByExerciseId spans every mesocycle the exercise was logged in', async () => {
    const repo = new InMemorySetLogRepository(new InMemoryStore());
    const fromFirstMeso = makeSetLog({
      id: 'log-meso-1',
      sessionExerciseId: 'se-meso-1',
      completedAt: '2026-06-01T08:00:00.000Z',
    });
    const fromSecondMeso = makeSetLog({
      id: 'log-meso-2',
      sessionExerciseId: 'se-meso-2',
      completedAt: '2026-08-01T08:00:00.000Z',
    });
    await repo.create(fromFirstMeso);
    await repo.create(fromSecondMeso);

    const history = await repo.listByExerciseId('exercise-bench-press');

    expect(history).toEqual([fromSecondMeso, fromFirstMeso]);
  });

  test('getLastByExerciseId returns the most recent set, or null when there is no history', async () => {
    const repo = new InMemorySetLogRepository(new InMemoryStore());
    await expect(repo.getLastByExerciseId('exercise-bench-press')).resolves.toBeNull();

    const older = makeSetLog({ id: 'log-1', completedAt: '2026-08-01T08:00:00.000Z' });
    const newer = makeSetLog({ id: 'log-2', completedAt: '2026-08-26T08:00:00.000Z' });
    await repo.create(older);
    await repo.create(newer);

    await expect(repo.getLastByExerciseId('exercise-bench-press')).resolves.toEqual(newer);
  });

  test('create, update, and deleteById round-trip a set log by its domain-generated id', async () => {
    const repo = new InMemorySetLogRepository(new InMemoryStore());
    const setLog = makeSetLog();
    await repo.create(setLog);

    const updated = await repo.update({ ...setLog, weight: 65 });
    await expect(repo.getLastByExerciseId(setLog.exerciseId)).resolves.toEqual(updated);

    await repo.deleteById(setLog.id);
    await expect(repo.listBySessionExerciseId(setLog.sessionExerciseId)).resolves.toEqual([]);
  });
});
