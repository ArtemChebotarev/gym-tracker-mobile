import {
  makeCatalogExercise,
  makeMesocycle,
  makeRoundLog,
  makeSession,
  makeSessionExercise,
  makeSetLog,
} from './fixtures';
import { type RepositoryHarness, type RepositorySet, useRepositories } from './harness';

// ExerciseHistoryRepository — one exercise's performances across every mesocycle, each joined to
// the session and mesocycle it belongs to (repositories/exerciseHistory.ts; 06 · History &
// Analytics, Сценарий 2). Grouping set logs into performances and resolving those joins is the
// repository's job, not the use case layer's (07 · Persistence Layer Contract, rule 4).

const BENCH_PRESS = 'exercise-bench-press';
const SQUAT = 'exercise-squat';
const HEAVY_BAG = 'exercise-heavy-bag';

async function seedHistory(repositories: RepositorySet): Promise<void> {
  const {
    mesocycleRepo,
    exerciseRepo,
    sessionRepo,
    sessionExerciseRepo,
    setLogRepo,
    roundLogRepo,
  } = repositories;
  await mesocycleRepo.create(makeMesocycle({ id: 'meso-1', name: 'Upper/Lower' }));
  await mesocycleRepo.create(
    makeMesocycle({ id: 'meso-2', name: 'Full body', status: 'completed' }),
  );
  await exerciseRepo.seedCatalog([
    makeCatalogExercise(BENCH_PRESS),
    makeCatalogExercise(SQUAT),
    makeCatalogExercise(HEAVY_BAG),
  ]);

  await sessionRepo.create(makeSession({ id: 'session-1', mesoId: 'meso-1', status: 'completed' }));
  await sessionRepo.create(
    makeSession({ id: 'session-2', mesoId: 'meso-2', weekNumber: 2, status: 'completed' }),
  );
  await sessionExerciseRepo.createMany([
    makeSessionExercise({ id: 'se-1', sessionId: 'session-1', exerciseId: BENCH_PRESS }),
    makeSessionExercise({ id: 'se-2', sessionId: 'session-1', exerciseId: SQUAT, order: 2 }),
    makeSessionExercise({ id: 'se-3', sessionId: 'session-2', exerciseId: BENCH_PRESS }),
    makeSessionExercise({ id: 'se-bag', sessionId: 'session-2', exerciseId: HEAVY_BAG, order: 2 }),
  ]);
  // Rounds out of order too: the repository sorts them by round number.
  await roundLogRepo.create(
    makeRoundLog({
      id: 'round-2',
      sessionExerciseId: 'se-bag',
      exerciseId: HEAVY_BAG,
      roundNumber: 2,
    }),
  );
  await roundLogRepo.create(
    makeRoundLog({
      id: 'round-1',
      sessionExerciseId: 'se-bag',
      exerciseId: HEAVY_BAG,
      roundNumber: 1,
    }),
  );
  // Set logs of one performance are written out of order on purpose: the repository sorts them.
  await setLogRepo.create(
    makeSetLog({ id: 'log-2', sessionExerciseId: 'se-1', exerciseId: BENCH_PRESS, setNumber: 2 }),
  );
  await setLogRepo.create(
    makeSetLog({ id: 'log-1', sessionExerciseId: 'se-1', exerciseId: BENCH_PRESS, setNumber: 1 }),
  );
  await setLogRepo.create(
    makeSetLog({ id: 'log-squat', sessionExerciseId: 'se-2', exerciseId: SQUAT, setNumber: 1 }),
  );
  await setLogRepo.create(
    makeSetLog({ id: 'log-3', sessionExerciseId: 'se-3', exerciseId: BENCH_PRESS, setNumber: 1 }),
  );
}

export function describeExerciseHistoryContract(harness: RepositoryHarness): void {
  describe('ExerciseHistoryRepository', () => {
    const repositories = useRepositories(harness);

    beforeEach(async () => {
      await seedHistory(repositories());
    });

    test('groups the exercise’s set logs by performance and joins each to its session', async () => {
      const performances = await repositories().exerciseHistoryRepo.listByExerciseId(BENCH_PRESS);

      expect(performances).toHaveLength(2);
      expect(performances.map((performance) => performance.session.id).sort()).toEqual([
        'session-1',
        'session-2',
      ]);
    });

    test('sorts each performance’s set logs by set number', async () => {
      const performances = await repositories().exerciseHistoryRepo.listByExerciseId(BENCH_PRESS);

      const first = performances.find((performance) => performance.session.id === 'session-1');
      expect(first?.setLogs.map((setLog) => setLog.id)).toEqual(['log-1', 'log-2']);
    });

    test('carries the mesocycle each session belongs to', async () => {
      const performances = await repositories().exerciseHistoryRepo.listByExerciseId(BENCH_PRESS);

      expect(performances.map((performance) => performance.mesocycle.name).sort()).toEqual([
        'Full body',
        'Upper/Lower',
      ]);
    });

    test('leaves out another exercise’s sets', async () => {
      const performances = await repositories().exerciseHistoryRepo.listByExerciseId(BENCH_PRESS);

      expect(
        performances.flatMap((performance) => performance.setLogs).map((setLog) => setLog.id),
      ).not.toContain('log-squat');
    });

    test('lists an interval exercise’s rounds as a performance, sorted by round number', async () => {
      const performances = await repositories().exerciseHistoryRepo.listByExerciseId(HEAVY_BAG);

      expect(performances).toHaveLength(1);
      expect(performances[0]?.session.id).toBe('session-2');
      expect(performances[0]?.mesocycle.name).toBe('Full body');
      expect(performances[0]?.setLogs).toEqual([]);
      expect(performances[0]?.roundLogs.map((roundLog) => roundLog.id)).toEqual([
        'round-1',
        'round-2',
      ]);
    });

    test('gives a set-logging exercise no rounds', async () => {
      const performances = await repositories().exerciseHistoryRepo.listByExerciseId(BENCH_PRESS);

      expect(performances.flatMap((performance) => performance.roundLogs)).toEqual([]);
    });

    test('returns nothing for an exercise that was never logged', async () => {
      await expect(
        repositories().exerciseHistoryRepo.listByExerciseId('exercise-deadlift'),
      ).resolves.toEqual([]);
    });
  });
}
