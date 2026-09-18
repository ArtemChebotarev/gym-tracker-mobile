import type { SetLog } from '@domain/execution';
import type {
  ListSetLogsByExerciseIdOptions,
  SetLogRepository,
} from '@repositories/setLogRepository';

const benchSetOne: SetLog = {
  id: 'set-log-1',
  sessionExerciseId: 'session-exercise-bench',
  exerciseId: 'exercise-bench-press',
  setNumber: 1,
  weight: 60,
  reps: 8,
  rir: 2,
  completedAt: '2026-08-26T08:00:00.000Z',
};

const benchSetTwo: SetLog = {
  id: 'set-log-2',
  sessionExerciseId: 'session-exercise-bench',
  exerciseId: 'exercise-bench-press',
  setNumber: 2,
  weight: 62.5,
  reps: 6,
  completedAt: '2026-09-02T08:00:00.000Z',
};

const rowSet: SetLog = {
  id: 'set-log-3',
  sessionExerciseId: 'session-exercise-row',
  exerciseId: 'exercise-row',
  setNumber: 1,
  weight: 40,
  reps: 10,
  completedAt: '2026-08-26T08:10:00.000Z',
};

// A session-exercise -> session lookup, standing in for the join a real adapter would need in
// order to answer listBySessionId — see 07 · Persistence Layer Contract, rule 4 (assembling a
// tree of related entities is the repository's job, not the use-case layer's).
const sessionExerciseToSession: Record<string, string> = {
  'session-exercise-bench': 'session-1',
  'session-exercise-row': 'session-1',
};

const sessionsById: Record<string, { mesoId: string; isDeload: boolean }> = {
  'session-1': { mesoId: 'meso-1', isDeload: false },
};

function createFakeSetLogRepository(seed: SetLog[]): SetLogRepository {
  const logs = [...seed];

  return {
    async listBySessionExerciseId(sessionExerciseId) {
      return logs.filter((log) => log.sessionExerciseId === sessionExerciseId);
    },
    async listBySessionId(sessionId) {
      return logs.filter((log) => sessionExerciseToSession[log.sessionExerciseId] === sessionId);
    },
    async listByExerciseId(exerciseId, options?: ListSetLogsByExerciseIdOptions) {
      const matches = logs.filter((log) => log.exerciseId === exerciseId);
      const sorted = [...matches].sort((a, b) =>
        options?.order === 'asc'
          ? a.completedAt.localeCompare(b.completedAt)
          : b.completedAt.localeCompare(a.completedAt),
      );
      return options?.limit !== undefined ? sorted.slice(0, options.limit) : sorted;
    },
    async getLastByExerciseId(exerciseId) {
      const matches = [...logs]
        .filter((log) => log.exerciseId === exerciseId)
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
      return matches[0] ?? null;
    },
    async findLastPerformance({ exerciseId, mesoId, since, excludeSessionExerciseId }) {
      const candidates = logs.filter((log) => {
        const session = sessionsById[sessionExerciseToSession[log.sessionExerciseId] ?? ''];
        return (
          log.exerciseId === exerciseId &&
          log.sessionExerciseId !== excludeSessionExerciseId &&
          session !== undefined &&
          !session.isDeload &&
          (session.mesoId === mesoId || log.completedAt >= since)
        );
      });
      const [latest] = [...candidates].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
      return candidates
        .filter((log) => log.sessionExerciseId === latest?.sessionExerciseId)
        .sort((a, b) => a.setNumber - b.setNumber);
    },
    async create(setLog) {
      logs.push(setLog);
      return setLog;
    },
    async update(setLog) {
      const index = logs.findIndex((log) => log.id === setLog.id);
      if (index !== -1) {
        logs[index] = setLog;
      }
      return setLog;
    },
    async deleteById(id) {
      const index = logs.findIndex((log) => log.id === id);
      if (index !== -1) {
        logs.splice(index, 1);
      }
    },
  };
}

describe('SetLogRepository contract', () => {
  test('listBySessionExerciseId returns only sets for that session exercise', async () => {
    const repo = createFakeSetLogRepository([benchSetOne, benchSetTwo, rowSet]);

    await expect(repo.listBySessionExerciseId('session-exercise-row')).resolves.toEqual([rowSet]);
  });

  test('listBySessionId assembles sets across every exercise of a session', async () => {
    const repo = createFakeSetLogRepository([benchSetOne, benchSetTwo, rowSet]);

    const result = await repo.listBySessionId('session-1');

    expect(result).toHaveLength(3);
  });

  test('listByExerciseId sorts by completedAt descending by default and honors limit and order', async () => {
    const repo = createFakeSetLogRepository([benchSetOne, benchSetTwo, rowSet]);

    await expect(repo.listByExerciseId('exercise-bench-press')).resolves.toEqual([
      benchSetTwo,
      benchSetOne,
    ]);
    await expect(repo.listByExerciseId('exercise-bench-press', { order: 'asc' })).resolves.toEqual([
      benchSetOne,
      benchSetTwo,
    ]);
    await expect(repo.listByExerciseId('exercise-bench-press', { limit: 1 })).resolves.toEqual([
      benchSetTwo,
    ]);
  });

  test('getLastByExerciseId returns the most recent set, or null when there is no history', async () => {
    const repo = createFakeSetLogRepository([benchSetOne, benchSetTwo]);

    await expect(repo.getLastByExerciseId('exercise-bench-press')).resolves.toEqual(benchSetTwo);
    await expect(repo.getLastByExerciseId('exercise-never-logged')).resolves.toBeNull();
  });

  test('findLastPerformance returns one session exercise sorted by setNumber, or an empty list', async () => {
    const repo = createFakeSetLogRepository([benchSetTwo, benchSetOne, rowSet]);
    const query = {
      exerciseId: 'exercise-bench-press',
      mesoId: 'meso-1',
      since: '2026-09-01T00:00:00.000Z',
    };

    await expect(repo.findLastPerformance(query)).resolves.toEqual([benchSetOne, benchSetTwo]);
    await expect(
      repo.findLastPerformance({ ...query, excludeSessionExerciseId: 'session-exercise-bench' }),
    ).resolves.toEqual([]);
  });

  test('create, update, and deleteById round-trip a set log by its domain-generated id', async () => {
    const repo = createFakeSetLogRepository([]);

    await repo.create(benchSetOne);
    await expect(repo.listBySessionExerciseId('session-exercise-bench')).resolves.toEqual([
      benchSetOne,
    ]);

    const updated: SetLog = { ...benchSetOne, weight: 65 };
    await repo.update(updated);
    await expect(repo.getLastByExerciseId('exercise-bench-press')).resolves.toEqual(updated);

    await repo.deleteById(updated.id);
    await expect(repo.listBySessionExerciseId('session-exercise-bench')).resolves.toEqual([]);
  });
});
