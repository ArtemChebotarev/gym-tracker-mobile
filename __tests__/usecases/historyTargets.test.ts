import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';
import { targetsFromHistory } from '@usecases/historyTargets';

const NOW = '2026-09-18T10:00:00.000Z';
const BARBELL = 'exercise-barbell-bench-press';

const currentSession: Pick<Session, 'mesoId' | 'isDeload'> = {
  mesoId: 'meso-now',
  isDeload: false,
};

type Performance = {
  key: string;
  mesoId: string;
  loggedAt: string;
  reps: number[];
  weight: number;
  isDeload?: boolean;
};

/** One past session per performance, each with one session exercise of `BARBELL` and its logs. */
async function setLogRepoWith(performances: Performance[]) {
  const workout = createInMemoryWorkoutStore(new InMemoryStore());
  for (const performance of performances) {
    const session: Session = {
      id: `session-${performance.key}`,
      mesoId: performance.mesoId,
      weekNumber: 1,
      dayNumber: 1,
      isDeload: performance.isDeload ?? false,
      prescriptionStatus: 'ready',
      status: 'completed',
      completedAt: performance.loggedAt,
    };
    const sessionExercise: SessionExercise = {
      id: `session-exercise-${performance.key}`,
      sessionId: session.id,
      exerciseId: BARBELL,
      order: 1,
      setTargets: performance.reps.map((_, index) => ({ setNumber: index + 1 })),
      targetRir: 2,
      status: 'completed',
    };
    const logs: SetLog[] = performance.reps.map((reps, index) => ({
      id: `log-${performance.key}-${index + 1}`,
      sessionExerciseId: sessionExercise.id,
      exerciseId: BARBELL,
      setNumber: index + 1,
      weight: performance.weight,
      reps,
      completedAt: performance.loggedAt,
    }));
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
    settings: defaultProgressionSettings,
    now: NOW,
    ...overrides,
  };
}

describe('targetsFromHistory', () => {
  test('a performance in this mesocycle counts however old it is', async () => {
    const setLogRepo = await setLogRepoWith([
      {
        key: 'old',
        mesoId: 'meso-now',
        loggedAt: '2026-06-01T10:00:00.000Z',
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

  test('a performance in a past mesocycle 20 days ago counts', async () => {
    const setLogRepo = await setLogRepoWith([
      {
        key: 'recent',
        mesoId: 'meso-past',
        loggedAt: '2026-08-29T10:00:00.000Z',
        reps: [10],
        weight: 70,
      },
    ]);

    await expect(targetsFromHistory(query({ rowCount: 1 }), setLogRepo)).resolves.toEqual([
      { setNumber: 1, targetReps: 11, suggestedWeight: 70 },
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
