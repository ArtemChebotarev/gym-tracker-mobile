import type { SetLog } from '@domain/execution';

import { makeSession, makeSessionExercise, makeSetLog, seedParents } from './fixtures';
import { type RepositoryHarness, type RepositorySet, useRepositories } from './harness';

// SetLogRepository — see 07 · Persistence Layer Contract, "SetLogRepository", and
// repositories/setLogRepository.ts. `findLastPerformance` backs rule 6 of 03 · Progression
// Engine: the reference performance an added or swapped exercise takes its targets from.

const BENCH_PRESS = 'exercise-bench-press';
const DUMBBELL_PRESS = 'exercise-dumbbell-press';
const CURRENT_MESO = 'meso-a';
const PAST_MESO = 'meso-past';

// `since` = now − historyLookbackDays, with "now" pinned to 2026-09-18.
const SINCE = '2026-08-19T00:00:00.000Z';
const OLDER_THAN_SINCE = '2026-07-01T08:00:00.000Z';
const NEWER_THAN_SINCE = '2026-09-01T08:00:00.000Z';

type Performance = {
  sessionExerciseId: string;
  completedAt: string;
  mesoId?: string;
  isDeload?: boolean;
  exerciseId?: string;
  setNumbers?: number[];
};

/**
 * Seeds one session and one session exercise per performance, plus a set log per set number, so
 * a test reads as a list of past performances rather than as rows of three collections. Written
 * entirely through the repositories — the join `findLastPerformance` walks is the thing under
 * test, so the data it walks has to arrive the way the app would write it.
 */
async function seedPerformances(
  repositories: RepositorySet,
  performances: Performance[],
): Promise<void> {
  for (const performance of performances) {
    const sessionId = `session-${performance.sessionExerciseId}`;
    const exerciseId = performance.exerciseId ?? BENCH_PRESS;
    await repositories.sessionRepo.create(
      makeSession({
        id: sessionId,
        mesoId: performance.mesoId ?? CURRENT_MESO,
        isDeload: performance.isDeload ?? false,
        status: 'completed',
        completedAt: performance.completedAt,
      }),
    );
    await repositories.sessionExerciseRepo.create(
      makeSessionExercise({
        id: performance.sessionExerciseId,
        sessionId,
        exerciseId,
        status: 'completed',
      }),
    );
    for (const setNumber of performance.setNumbers ?? [1]) {
      await repositories.setLogRepo.create(
        makeSetLog({
          id: `${performance.sessionExerciseId}-set-${setNumber}`,
          sessionExerciseId: performance.sessionExerciseId,
          exerciseId,
          setNumber,
          completedAt: performance.completedAt,
        }),
      );
    }
  }
}

function sessionExerciseIdsOf(setLogs: SetLog[]): string[] {
  return [...new Set(setLogs.map((setLog) => setLog.sessionExerciseId))];
}

export function describeSetLogContract(harness: RepositoryHarness): void {
  describe('SetLogRepository', () => {
    const repositories = useRepositories(harness);

    function findBenchReference(excludeSessionExerciseId?: string): Promise<SetLog[]> {
      return repositories().setLogRepo.findLastPerformance({
        exerciseId: BENCH_PRESS,
        mesoId: CURRENT_MESO,
        since: SINCE,
        excludeSessionExerciseId,
      });
    }

    beforeEach(async () => {
      await seedParents(repositories(), {
        mesoIds: [CURRENT_MESO, PAST_MESO],
        exerciseIds: [BENCH_PRESS, DUMBBELL_PRESS],
      });
    });

    test('listBySessionExerciseId returns only the sets of that session exercise', async () => {
      const { setLogRepo } = repositories();
      await seedPerformances(repositories(), [
        { sessionExerciseId: 'se-bench', completedAt: NEWER_THAN_SINCE },
        {
          sessionExerciseId: 'se-dumbbell',
          completedAt: NEWER_THAN_SINCE,
          exerciseId: DUMBBELL_PRESS,
        },
      ]);

      const setLogs = await setLogRepo.listBySessionExerciseId('se-dumbbell');

      expect(setLogs.map((setLog) => setLog.id)).toEqual(['se-dumbbell-set-1']);
    });

    test('listBySessionId joins through SessionExercise to assemble every set of a session', async () => {
      const { sessionRepo, sessionExerciseRepo, setLogRepo } = repositories();
      await sessionRepo.createMany([
        makeSession({ id: 'session-1' }),
        makeSession({ id: 'session-2', dayNumber: 2 }),
      ]);
      await sessionExerciseRepo.createMany([
        makeSessionExercise({ id: 'se-bench', sessionId: 'session-1' }),
        makeSessionExercise({ id: 'se-dumbbell', sessionId: 'session-1', order: 2 }),
        makeSessionExercise({ id: 'se-other-session', sessionId: 'session-2' }),
      ]);
      await setLogRepo.create(makeSetLog({ id: 'log-1', sessionExerciseId: 'se-bench' }));
      await setLogRepo.create(makeSetLog({ id: 'log-2', sessionExerciseId: 'se-dumbbell' }));
      await setLogRepo.create(makeSetLog({ id: 'log-3', sessionExerciseId: 'se-other-session' }));

      const setLogs = await setLogRepo.listBySessionId('session-1');

      expect(setLogs.map((setLog) => setLog.id).sort()).toEqual(['log-1', 'log-2']);
    });

    test('listByExerciseId sorts by completedAt descending by default and honours limit and order', async () => {
      const { sessionRepo, sessionExerciseRepo, setLogRepo } = repositories();
      await sessionRepo.create(makeSession());
      await sessionExerciseRepo.create(makeSessionExercise());
      const oldest = makeSetLog({ id: 'log-1', completedAt: '2026-08-01T08:00:00.000Z' });
      const middle = makeSetLog({ id: 'log-2', completedAt: '2026-08-15T08:00:00.000Z' });
      const newest = makeSetLog({ id: 'log-3', completedAt: '2026-08-26T08:00:00.000Z' });
      await setLogRepo.create(oldest);
      await setLogRepo.create(middle);
      await setLogRepo.create(newest);

      await expect(setLogRepo.listByExerciseId(BENCH_PRESS)).resolves.toEqual([
        newest,
        middle,
        oldest,
      ]);
      await expect(setLogRepo.listByExerciseId(BENCH_PRESS, { order: 'asc' })).resolves.toEqual([
        oldest,
        middle,
        newest,
      ]);
      await expect(setLogRepo.listByExerciseId(BENCH_PRESS, { limit: 2 })).resolves.toEqual([
        newest,
        middle,
      ]);
    });

    test('listByExerciseId spans every mesocycle, and is empty for an exercise never logged', async () => {
      await seedPerformances(repositories(), [
        { sessionExerciseId: 'se-first-meso', completedAt: '2026-06-01T08:00:00.000Z' },
        {
          sessionExerciseId: 'se-second-meso',
          completedAt: '2026-08-01T08:00:00.000Z',
          mesoId: PAST_MESO,
        },
      ]);

      const history = await repositories().setLogRepo.listByExerciseId(BENCH_PRESS);

      expect(history.map((setLog) => setLog.id)).toEqual([
        'se-second-meso-set-1',
        'se-first-meso-set-1',
      ]);
      await expect(
        repositories().setLogRepo.listByExerciseId('exercise-never-logged'),
      ).resolves.toEqual([]);
    });

    test('getLastByExerciseId returns the most recent set, or null when there is no history', async () => {
      const { sessionRepo, sessionExerciseRepo, setLogRepo } = repositories();
      await expect(setLogRepo.getLastByExerciseId(BENCH_PRESS)).resolves.toBeNull();

      await sessionRepo.create(makeSession());
      await sessionExerciseRepo.create(makeSessionExercise());
      const newer = makeSetLog({ id: 'log-2', completedAt: '2026-08-26T08:00:00.000Z' });
      await setLogRepo.create(makeSetLog({ id: 'log-1', completedAt: '2026-08-01T08:00:00.000Z' }));
      await setLogRepo.create(newer);

      await expect(setLogRepo.getLastByExerciseId(BENCH_PRESS)).resolves.toEqual(newer);
    });

    test('create, update and deleteById round-trip a set log by its domain-generated id', async () => {
      const { sessionRepo, sessionExerciseRepo, setLogRepo } = repositories();
      await sessionRepo.create(makeSession());
      await sessionExerciseRepo.create(makeSessionExercise());
      const setLog = makeSetLog();
      await setLogRepo.create(setLog);

      const updated = await setLogRepo.update({ ...setLog, weight: 65 });
      await expect(setLogRepo.getLastByExerciseId(setLog.exerciseId)).resolves.toEqual(updated);

      await setLogRepo.deleteById(setLog.id);
      await expect(setLogRepo.listBySessionExerciseId(setLog.sessionExerciseId)).resolves.toEqual(
        [],
      );
    });

    describe('findLastPerformance', () => {
      test('finds a performance in the current mesocycle even when it is older than since', async () => {
        await seedPerformances(repositories(), [
          { sessionExerciseId: 'se-current-old', completedAt: OLDER_THAN_SINCE },
        ]);

        expect(sessionExerciseIdsOf(await findBenchReference())).toEqual(['se-current-old']);
      });

      test('finds a performance in a past mesocycle that is newer than since', async () => {
        await seedPerformances(repositories(), [
          {
            sessionExerciseId: 'se-past-recent',
            completedAt: NEWER_THAN_SINCE,
            mesoId: PAST_MESO,
          },
        ]);

        expect(sessionExerciseIdsOf(await findBenchReference())).toEqual(['se-past-recent']);
      });

      test('ignores a performance in a past mesocycle that is older than since', async () => {
        await seedPerformances(repositories(), [
          { sessionExerciseId: 'se-past-old', completedAt: OLDER_THAN_SINCE, mesoId: PAST_MESO },
        ]);

        await expect(findBenchReference()).resolves.toEqual([]);
      });

      test('excludes the session exercise asking for the reference', async () => {
        await seedPerformances(repositories(), [
          { sessionExerciseId: 'se-previous', completedAt: '2026-09-10T08:00:00.000Z' },
          { sessionExerciseId: 'se-today', completedAt: '2026-09-18T08:00:00.000Z' },
        ]);

        expect(sessionExerciseIdsOf(await findBenchReference('se-today'))).toEqual(['se-previous']);
      });

      test('takes the most recent of several qualifying performances, sorted by setNumber', async () => {
        await seedPerformances(repositories(), [
          {
            sessionExerciseId: 'se-older',
            completedAt: '2026-09-01T08:00:00.000Z',
            setNumbers: [1, 2],
          },
          {
            sessionExerciseId: 'se-newest',
            completedAt: '2026-09-15T08:00:00.000Z',
            mesoId: PAST_MESO,
            setNumbers: [3, 1, 2],
          },
          { sessionExerciseId: 'se-middle', completedAt: '2026-09-08T08:00:00.000Z' },
        ]);

        const reference = await findBenchReference();

        expect(reference.map((setLog) => setLog.id)).toEqual([
          'se-newest-set-1',
          'se-newest-set-2',
          'se-newest-set-3',
        ]);
      });

      test('skips a deload performance even when it is newer, falling back to the working one', async () => {
        await seedPerformances(repositories(), [
          { sessionExerciseId: 'se-working', completedAt: '2026-09-01T08:00:00.000Z' },
          {
            sessionExerciseId: 'se-deload',
            completedAt: '2026-09-15T08:00:00.000Z',
            isDeload: true,
          },
        ]);

        expect(sessionExerciseIdsOf(await findBenchReference())).toEqual(['se-working']);
      });

      test('returns an empty list when only deload performances fall in the window', async () => {
        await seedPerformances(repositories(), [
          {
            sessionExerciseId: 'se-deload-current',
            completedAt: OLDER_THAN_SINCE,
            isDeload: true,
          },
          {
            sessionExerciseId: 'se-deload-past',
            completedAt: NEWER_THAN_SINCE,
            mesoId: PAST_MESO,
            isDeload: true,
          },
        ]);

        await expect(findBenchReference()).resolves.toEqual([]);
      });

      test('references the exercise performed last, not whatever filled the same slot', async () => {
        // Week 1: dumbbell press; week 2: the slot swapped to barbell bench press.
        await seedPerformances(repositories(), [
          {
            sessionExerciseId: 'se-week-1-dumbbell',
            completedAt: '2026-08-25T08:00:00.000Z',
            exerciseId: DUMBBELL_PRESS,
          },
          { sessionExerciseId: 'se-week-2-bench', completedAt: NEWER_THAN_SINCE },
        ]);

        expect(sessionExerciseIdsOf(await findBenchReference())).toEqual(['se-week-2-bench']);
      });
    });
  });
}
