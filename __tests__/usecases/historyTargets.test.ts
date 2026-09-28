import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { createSqliteWorkoutStore } from '@storage/sqlite/workoutStore';
import { targetsFromHistory } from '@usecases/historyTargets';
import { STAMPS } from '../fixtures/stamps';
import { seedReferences } from '../fixtures/references';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

const NOW = '2026-09-18T10:00:00.000Z';
const BARBELL = 'exercise-barbell-bench-press';

/** Week 2, day 1 — the day every seeded performance of week 1 lands on first. */
const currentSession: Pick<Session, 'mesoId' | 'weekNumber' | 'dayNumber' | 'isDeload'> = {
  mesoId: 'meso-now',
  weekNumber: 2,
  dayNumber: 1,
  isDeload: false,
};

type Performance = {
  key: string;
  mesoId: string;
  loggedAt: string;
  reps: number[];
  weight: number;
  isDeload?: boolean;
  /** Week 1 unless given. */
  weekNumber?: number;
  /** A day of its own (`index + 1`) unless given. */
  dayNumber?: number;
  /** The RIR it was planned at; 2 unless given. */
  targetRir?: number;
};

/**
 * One past session per performance, each with one session exercise of `BARBELL` and its logs.
 * Each lands on a day of its own unless it names one — `(mesoId, weekNumber, dayNumber)`
 * identifies a session (02 · Domain Model).
 */
async function setLogRepoWith(performances: Performance[]) {
  const workout = createSqliteWorkoutStore(db());
  for (const [index, performance] of performances.entries()) {
    const session: Session = {
      ...STAMPS,
      id: `session-${performance.key}`,
      mesoId: performance.mesoId,
      weekNumber: performance.weekNumber ?? 1,
      dayNumber: performance.dayNumber ?? index + 1,
      isDeload: performance.isDeload ?? false,
      prescriptionStatus: 'ready',
      status: 'completed',
      completedAt: performance.loggedAt,
    };
    const sessionExercise: SessionExercise = {
      ...STAMPS,
      id: `session-exercise-${performance.key}`,
      sessionId: session.id,
      exerciseId: BARBELL,
      order: 1,
      setTargets: performance.reps.map((_, index) => ({ setNumber: index + 1 })),
      targetRir: performance.targetRir ?? 2,
      status: 'completed',
    };
    const logs: SetLog[] = performance.reps.map((reps, index) => ({
      ...STAMPS,
      id: `log-${performance.key}-${index + 1}`,
      sessionExerciseId: sessionExercise.id,
      exerciseId: BARBELL,
      setNumber: index + 1,
      weight: performance.weight,
      reps,
      completedAt: performance.loggedAt,
    }));
    await seedReferences(db(), {
      sessions: [session],
      sessionExercises: [sessionExercise],
      setLogs: logs,
    });
    await workout.repos.sessionRepo.create(session);
    await workout.repos.sessionExerciseRepo.create(sessionExercise);
    for (const log of logs) {
      await workout.repos.setLogRepo.create(log);
    }
  }
  return workout.repos.setLogRepo;
}

function query(overrides: Partial<Parameters<typeof targetsFromHistory>[0]> = {}) {
  return {
    exerciseId: BARBELL,
    session: currentSession,
    rowCount: 3,
    weekRir: 2,
    settings: defaultProgressionSettings,
    now: NOW,
    ...overrides,
  };
}

describe('targetsFromHistory', () => {
  test('last week’s same day in this mesocycle gives targets, reps + 1', async () => {
    const setLogRepo = await setLogRepoWith([
      {
        key: 'last-week',
        mesoId: 'meso-now',
        loggedAt: '2026-09-11T10:00:00.000Z',
        reps: [8, 7, 6],
        weight: 80,
      },
    ]);

    await expect(targetsFromHistory(query(), setLogRepo)).resolves.toEqual([
      { setNumber: 1, targetReps: 9, suggestedWeight: 80 },
      { setNumber: 2, targetReps: 8, suggestedWeight: 80 },
      { setNumber: 3, targetReps: 7, suggestedWeight: 80 },
    ]);
  });

  // Task 134.1: the window is the whole of what the resolver sees, the own mesocycle included.
  test('a performance in this mesocycle older than the window doesn’t count', async () => {
    const setLogRepo = await setLogRepoWith([
      {
        key: 'old',
        mesoId: 'meso-now',
        loggedAt: '2026-06-01T10:00:00.000Z',
        reps: [8, 7, 6],
        weight: 80,
      },
    ]);

    await expect(targetsFromHistory(query({ rowCount: 1 }), setLogRepo)).resolves.toEqual([
      { setNumber: 1 },
    ]);
  });

  // DoD (task 134.1): the 26.09.2026 case — the triceps done on day 1 this week, added to day 3.
  test('one performance earlier this week gives an estimate: 4.5 × 15, not × 16', async () => {
    const setLogRepo = await setLogRepoWith([
      {
        key: 'day-1',
        mesoId: 'meso-now',
        loggedAt: '2026-09-16T10:00:00.000Z',
        reps: [15, 13],
        weight: 4.5,
        weekNumber: 1,
        dayNumber: 1,
      },
    ]);

    await expect(
      targetsFromHistory(
        query({ session: { ...currentSession, weekNumber: 1, dayNumber: 3 }, rowCount: 2 }),
        setLogRepo,
      ),
    ).resolves.toEqual([
      { setNumber: 1, targetReps: 15, suggestedWeight: 4.5, estimate: 'other_slot' },
      { setNumber: 2, targetReps: 13, suggestedWeight: 4.5, estimate: 'other_slot' },
    ]);
  });

  test('a performance in a past mesocycle 20 days ago gives an estimate', async () => {
    const setLogRepo = await setLogRepoWith([
      {
        key: 'recent',
        mesoId: 'meso-past',
        loggedAt: '2026-08-29T10:00:00.000Z',
        reps: [10],
        weight: 70,
      },
    ]);

    // Carried over as Flow C carries a block: + 1, and no RIR gap — both at RIR 2.
    await expect(targetsFromHistory(query({ rowCount: 1 }), setLogRepo)).resolves.toEqual([
      { setNumber: 1, targetReps: 11, suggestedWeight: 70, estimate: 'other_slot' },
    ]);
  });

  // The review case of task 134.1: bench 10 × 13 at the end of the last block (RIR 0), 10 × 14 on
  // day 1 of this one (RIR 1), then added to day 2. The earlier week wins, so the estimate comes
  // from the last block, re-priced to this week's RIR: 13 + 1 − (1 − 0) — what Flow C gave day 1.
  test('an earlier week in another block beats this week, re-priced for the RIR gap', async () => {
    const setLogRepo = await setLogRepoWith([
      {
        key: 'last-block',
        mesoId: 'meso-past',
        loggedAt: '2026-09-10T10:00:00.000Z',
        reps: [13],
        weight: 10,
        weekNumber: 4,
        targetRir: 0,
      },
      {
        key: 'this-week',
        mesoId: 'meso-now',
        loggedAt: '2026-09-17T10:00:00.000Z',
        reps: [14],
        weight: 10,
        weekNumber: 1,
        dayNumber: 1,
        targetRir: 1,
      },
    ]);

    await expect(
      targetsFromHistory(
        query({
          session: { ...currentSession, weekNumber: 1, dayNumber: 2 },
          rowCount: 1,
          weekRir: 1,
        }),
        setLogRepo,
      ),
    ).resolves.toEqual([
      { setNumber: 1, targetReps: 13, suggestedWeight: 10, estimate: 'other_slot' },
    ]);
  });

  test('a performance in a past mesocycle 40 days ago does not — rows get no targets', async () => {
    const setLogRepo = await setLogRepoWith([
      {
        key: 'stale',
        mesoId: 'meso-past',
        loggedAt: '2026-08-09T10:00:00.000Z',
        reps: [10],
        weight: 70,
      },
    ]);

    await expect(targetsFromHistory(query({ rowCount: 2 }), setLogRepo)).resolves.toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
    ]);
  });

  test('rows beyond the reference’s set count take its last set', async () => {
    const setLogRepo = await setLogRepoWith([
      {
        key: 'short',
        mesoId: 'meso-now',
        loggedAt: '2026-09-11T10:00:00.000Z',
        reps: [10, 9],
        weight: 60,
      },
    ]);

    const targets = await targetsFromHistory(query({ rowCount: 3 }), setLogRepo);

    expect(targets.map((target) => target.targetReps)).toEqual([11, 10, 10]);
  });

  test('a deload session gets no targets, even with a reference', async () => {
    const setLogRepo = await setLogRepoWith([
      {
        key: 'recent',
        mesoId: 'meso-now',
        loggedAt: '2026-09-11T10:00:00.000Z',
        reps: [10],
        weight: 60,
      },
    ]);

    await expect(
      targetsFromHistory(
        query({ session: { ...currentSession, isDeload: true }, rowCount: 2 }),
        setLogRepo,
      ),
    ).resolves.toEqual([{ setNumber: 1 }, { setNumber: 2 }]);
  });

  test('the asking session exercise is never its own reference', async () => {
    const setLogRepo = await setLogRepoWith([
      {
        key: 'earlier',
        mesoId: 'meso-now',
        loggedAt: '2026-09-11T10:00:00.000Z',
        reps: [10],
        weight: 60,
      },
      {
        key: 'asking',
        mesoId: 'meso-now',
        loggedAt: '2026-09-18T09:00:00.000Z',
        reps: [6],
        weight: 90,
      },
    ]);

    const targets = await targetsFromHistory(
      query({ rowCount: 1, sessionExerciseId: 'session-exercise-asking' }),
      setLogRepo,
    );

    expect(targets).toEqual([{ setNumber: 1, targetReps: 11, suggestedWeight: 60 }]);
  });
});
