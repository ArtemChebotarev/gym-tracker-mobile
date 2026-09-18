import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { SESSION_COLLECTION, SESSION_EXERCISE_COLLECTION } from '@storage/collectionNames';
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

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    mesoId: 'meso-current',
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'completed',
    ...overrides,
  };
}

// `since` = now − 30 days, with "now" pinned to 2026-09-18.
const SINCE = '2026-08-19T00:00:00.000Z';
const OLDER_THAN_SINCE = '2026-07-01T08:00:00.000Z';
const NEWER_THAN_SINCE = '2026-09-01T08:00:00.000Z';

type Performance = {
  sessionExerciseId: string;
  session: Partial<Session>;
  completedAt: string;
  setNumbers?: number[];
};

// Seeds one Session + SessionExercise per performance and one SetLog per set number, so each
// test reads as a list of past performances rather than three collections of rows.
async function seedPerformances(performances: Performance[]) {
  const store = new InMemoryStore();
  const repo = new InMemorySetLogRepository(store);
  const sessions = store.collection<Session>(SESSION_COLLECTION);
  const sessionExercises = store.collection<SessionExercise>(SESSION_EXERCISE_COLLECTION);
  for (const performance of performances) {
    const sessionId = `session-${performance.sessionExerciseId}`;
    await sessions.insert(makeSession({ id: sessionId, ...performance.session }));
    await sessionExercises.insert(
      makeSessionExercise({ id: performance.sessionExerciseId, sessionId }),
    );
    for (const setNumber of performance.setNumbers ?? [1]) {
      await repo.create(
        makeSetLog({
          id: `${performance.sessionExerciseId}-set-${setNumber}`,
          sessionExerciseId: performance.sessionExerciseId,
          setNumber,
          completedAt: performance.completedAt,
        }),
      );
    }
  }
  return repo;
}

function findBenchReference(
  repo: InMemorySetLogRepository,
  excludeSessionExerciseId?: string,
): Promise<SetLog[]> {
  return repo.findLastPerformance({
    exerciseId: 'exercise-bench-press',
    mesoId: 'meso-current',
    since: SINCE,
    excludeSessionExerciseId,
  });
}

function sessionExerciseIdsOf(logs: SetLog[]): string[] {
  return [...new Set(logs.map((log) => log.sessionExerciseId))];
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
    await sessionExercises.insert(
      makeSessionExercise({ id: 'se-other-session', sessionId: 'session-2' }),
    );

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
    await expect(repo.listByExerciseId('exercise-bench-press', { order: 'asc' })).resolves.toEqual([
      oldest,
      middle,
      newest,
    ]);
    await expect(repo.listByExerciseId('exercise-bench-press', { limit: 2 })).resolves.toEqual([
      newest,
      middle,
    ]);
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

  describe('findLastPerformance', () => {
    test('finds a performance in the current mesocycle even when it is older than since', async () => {
      const repo = await seedPerformances([
        { sessionExerciseId: 'se-current-old', session: {}, completedAt: OLDER_THAN_SINCE },
      ]);

      expect(sessionExerciseIdsOf(await findBenchReference(repo))).toEqual(['se-current-old']);
    });

    test('finds a performance in a past mesocycle that is newer than since', async () => {
      const repo = await seedPerformances([
        {
          sessionExerciseId: 'se-past-recent',
          session: { mesoId: 'meso-past' },
          completedAt: NEWER_THAN_SINCE,
        },
      ]);

      expect(sessionExerciseIdsOf(await findBenchReference(repo))).toEqual(['se-past-recent']);
    });

    test('ignores a performance in a past mesocycle that is older than since', async () => {
      const repo = await seedPerformances([
        {
          sessionExerciseId: 'se-past-old',
          session: { mesoId: 'meso-past' },
          completedAt: OLDER_THAN_SINCE,
        },
      ]);

      await expect(findBenchReference(repo)).resolves.toEqual([]);
    });

    test('excludes the session exercise asking for the reference', async () => {
      const repo = await seedPerformances([
        { sessionExerciseId: 'se-previous', session: {}, completedAt: '2026-09-10T08:00:00.000Z' },
        { sessionExerciseId: 'se-today', session: {}, completedAt: '2026-09-18T08:00:00.000Z' },
      ]);

      expect(sessionExerciseIdsOf(await findBenchReference(repo, 'se-today'))).toEqual([
        'se-previous',
      ]);
    });

    test('takes the most recent of several qualifying performances, sorted by setNumber', async () => {
      const repo = await seedPerformances([
        {
          sessionExerciseId: 'se-older',
          session: {},
          completedAt: '2026-09-01T08:00:00.000Z',
          setNumbers: [1, 2],
        },
        {
          sessionExerciseId: 'se-newest',
          session: { mesoId: 'meso-past' },
          completedAt: '2026-09-15T08:00:00.000Z',
          setNumbers: [3, 1, 2],
        },
        {
          sessionExerciseId: 'se-middle',
          session: {},
          completedAt: '2026-09-08T08:00:00.000Z',
          setNumbers: [1],
        },
      ]);

      const result = await findBenchReference(repo);

      expect(result.map((log) => log.id)).toEqual([
        'se-newest-set-1',
        'se-newest-set-2',
        'se-newest-set-3',
      ]);
    });

    test('skips a deload performance even when it is newer, falling back to the previous working one', async () => {
      const repo = await seedPerformances([
        { sessionExerciseId: 'se-working', session: {}, completedAt: '2026-09-01T08:00:00.000Z' },
        {
          sessionExerciseId: 'se-deload',
          session: { isDeload: true },
          completedAt: '2026-09-15T08:00:00.000Z',
        },
      ]);

      expect(sessionExerciseIdsOf(await findBenchReference(repo))).toEqual(['se-working']);
    });

    test('returns an empty list when only deload performances fall in the window', async () => {
      const repo = await seedPerformances([
        {
          sessionExerciseId: 'se-deload-current',
          session: { isDeload: true },
          completedAt: OLDER_THAN_SINCE,
        },
        {
          sessionExerciseId: 'se-deload-past',
          session: { mesoId: 'meso-past', isDeload: true },
          completedAt: NEWER_THAN_SINCE,
        },
      ]);

      await expect(findBenchReference(repo)).resolves.toEqual([]);
    });

    test('ignores sets of other exercises logged under the same session exercise', async () => {
      // After a mid-session swap the earlier sets keep the old exerciseId (task 047).
      const repo = await seedPerformances([
        { sessionExerciseId: 'se-swapped', session: {}, completedAt: NEWER_THAN_SINCE },
      ]);
      await repo.create(
        makeSetLog({
          id: 'se-swapped-row-set-2',
          sessionExerciseId: 'se-swapped',
          exerciseId: 'exercise-row',
          setNumber: 2,
          completedAt: NEWER_THAN_SINCE,
        }),
      );

      expect((await findBenchReference(repo)).map((log) => log.id)).toEqual(['se-swapped-set-1']);
    });
  });
});
