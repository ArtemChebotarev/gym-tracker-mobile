import { makeSession, makeSessionExercise, makeSetLog, seedParents } from './fixtures';
import { type RepositoryHarness, type RepositorySet, useRepositories } from './harness';

// SetLogRepository — see 07 · Persistence Layer Contract, "SetLogRepository", and
// repositories/setLogRepository.ts. `listPerformances` is the history window the reference
// resolver of 03 · Progression Engine reads — for rule 6 and for Flow C's start targets.

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
  /** The RIR the performance was planned at; `makeSessionExercise`'s default (2) when omitted. */
  targetRir?: number;
};

/**
 * Seeds one session and one session exercise per performance, plus a set log per set number, so
 * a test reads as a list of past performances rather than as rows of three collections. Written
 * entirely through the repositories — the join `listPerformances` walks is the thing under
 * test, so the data it walks has to arrive the way the app would write it.
 *
 * Each performance lands on a day of its own: `(mesoId, weekNumber, dayNumber)` identifies a
 * session (02 · Domain Model), and which day a past performance happened on is not what any test
 * here is about — it just must not be the same one twice.
 */
async function seedPerformances(
  repositories: RepositorySet,
  performances: Performance[],
): Promise<void> {
  for (const [index, performance] of performances.entries()) {
    const sessionId = `session-${performance.sessionExerciseId}`;
    const exerciseId = performance.exerciseId ?? BENCH_PRESS;
    await repositories.sessionRepo.create(
      makeSession({
        id: sessionId,
        mesoId: performance.mesoId ?? CURRENT_MESO,
        dayNumber: index + 1,
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
        ...(performance.targetRir === undefined ? {} : { targetRir: performance.targetRir }),
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

export function describeSetLogContract(harness: RepositoryHarness): void {
  describe('SetLogRepository', () => {
    const repositories = useRepositories(harness);

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
      const oldest = await setLogRepo.create(
        makeSetLog({ id: 'log-1', completedAt: '2026-08-01T08:00:00.000Z' }),
      );
      const middle = await setLogRepo.create(
        makeSetLog({ id: 'log-2', completedAt: '2026-08-15T08:00:00.000Z' }),
      );
      const newest = await setLogRepo.create(
        makeSetLog({ id: 'log-3', completedAt: '2026-08-26T08:00:00.000Z' }),
      );

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
      await setLogRepo.create(makeSetLog({ id: 'log-1', completedAt: '2026-08-01T08:00:00.000Z' }));
      const newer = await setLogRepo.create(
        makeSetLog({ id: 'log-2', completedAt: '2026-08-26T08:00:00.000Z' }),
      );

      await expect(setLogRepo.getLastByExerciseId(BENCH_PRESS)).resolves.toEqual(newer);
    });

    test('create, update and deleteById round-trip a set log by its domain-generated id', async () => {
      const { sessionRepo, sessionExerciseRepo, setLogRepo } = repositories();
      await sessionRepo.create(makeSession());
      await sessionExerciseRepo.create(makeSessionExercise());
      const setLog = await setLogRepo.create(makeSetLog());

      const updated = await setLogRepo.update({ ...setLog, weight: 65 });
      await expect(setLogRepo.getLastByExerciseId(setLog.exerciseId)).resolves.toEqual(updated);

      await setLogRepo.deleteById(setLog.id);
      await expect(setLogRepo.listBySessionExerciseId(setLog.sessionExerciseId)).resolves.toEqual(
        [],
      );
    });

    // Task 134.1: the reference resolver's window — every performance since `since`, with where
    // its session stood. Which of them count is the resolver's business.
    describe('listPerformances', () => {
      test('returns every performance since the window opened, newest first, with its slot', async () => {
        await seedPerformances(repositories(), [
          { sessionExerciseId: 'se-too-old', completedAt: OLDER_THAN_SINCE },
          {
            sessionExerciseId: 'se-older',
            completedAt: '2026-09-01T08:00:00.000Z',
            mesoId: PAST_MESO,
            setNumbers: [2, 1],
            targetRir: 1,
          },
          {
            sessionExerciseId: 'se-deload',
            completedAt: '2026-09-15T08:00:00.000Z',
            isDeload: true,
          },
        ]);

        const performances = await repositories().setLogRepo.listPerformances({
          exerciseId: BENCH_PRESS,
          since: SINCE,
        });

        expect(
          performances.map(({ setLogs, ...rest }) => ({
            ...rest,
            setLogIds: setLogs.map((setLog) => setLog.id),
          })),
        ).toEqual([
          {
            mesoId: CURRENT_MESO,
            weekNumber: 1,
            dayNumber: 3,
            isDeload: true,
            targetRir: 2,
            performedAt: '2026-09-15T08:00:00.000Z',
            setLogIds: ['se-deload-set-1'],
          },
          {
            mesoId: PAST_MESO,
            weekNumber: 1,
            dayNumber: 2,
            isDeload: false,
            targetRir: 1,
            performedAt: '2026-09-01T08:00:00.000Z',
            setLogIds: ['se-older-set-1', 'se-older-set-2'],
          },
        ]);
      });

      test('the window binds the current mesocycle too, and the asking exercise is left out', async () => {
        await seedPerformances(repositories(), [
          { sessionExerciseId: 'se-current-old', completedAt: OLDER_THAN_SINCE },
          { sessionExerciseId: 'se-today', completedAt: NEWER_THAN_SINCE },
          {
            sessionExerciseId: 'se-dumbbell',
            completedAt: NEWER_THAN_SINCE,
            exerciseId: DUMBBELL_PRESS,
          },
        ]);

        await expect(
          repositories().setLogRepo.listPerformances({
            exerciseId: BENCH_PRESS,
            since: SINCE,
            excludeSessionExerciseId: 'se-today',
          }),
        ).resolves.toEqual([]);
      });
    });
  });
}
