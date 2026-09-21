import { isConflictError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { prescribeNextSession } from '@domain/progressionPlan';
import type { SessionExerciseRepository } from '@repositories/sessionExercise';
import type { WorkoutStore } from '@repositories/workout';
import { SqliteExerciseRepository } from '@storage/sqlite/exerciseRepository';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { createSqliteWorkoutStore } from '@storage/sqlite/workoutStore';
import { swapExercise } from '@usecases/exerciseSwap';
import { STAMPS } from '../fixtures/stamps';
import { seedReferences } from '../fixtures/references';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

const NOW = '2026-09-18T10:00:00.000Z';
const DUMBBELL = 'exercise-dumbbell-bench-press';
const BARBELL = 'exercise-barbell-bench-press';

const mesocycle: Mesocycle = {
  ...STAMPS,
  id: 'meso',
  name: 'Upper/Lower',
  lengthWeeks: 5,
  daysPerWeek: 1,
  startDate: '2026-09-04T08:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  createdAt: '2026-09-01T08:00:00.000Z',
};

function makeSession(weekNumber: number, overrides: Partial<Session> = {}): Session {
  return {
    ...STAMPS,
    id: `session-w${weekNumber}`,
    mesoId: 'meso',
    weekNumber,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'planned',
    ...overrides,
  };
}

function makeExercise(
  weekNumber: number,
  overrides: Partial<SessionExercise> = {},
): SessionExercise {
  return {
    ...STAMPS,
    id: `session-exercise-w${weekNumber}`,
    sessionId: `session-w${weekNumber}`,
    exerciseId: DUMBBELL,
    order: 1,
    setTargets: [
      { setNumber: 1, targetReps: 13, suggestedWeight: 24 },
      { setNumber: 2, targetReps: 12, suggestedWeight: 24 },
      { setNumber: 3, targetReps: 11, suggestedWeight: 24 },
    ],
    targetRir: 2,
    status: 'planned',
    ...overrides,
  };
}

function logsFor(
  sessionExercise: SessionExercise,
  reps: number[],
  weight: number,
  completedAt: string,
): SetLog[] {
  return reps.map((rep, index) => ({
    ...STAMPS,
    id: `log-${sessionExercise.id}-${sessionExercise.exerciseId}-${index + 1}`,
    sessionExerciseId: sessionExercise.id,
    exerciseId: sessionExercise.exerciseId,
    setNumber: index + 1,
    weight,
    reps: rep,
    completedAt,
  }));
}

const weekOneSession = makeSession(1, {
  status: 'completed',
  completedAt: '2026-09-11T09:00:00.000Z',
});
const weekOneExercise = makeExercise(1, {
  setTargets: [{ setNumber: 1 }, { setNumber: 2 }, { setNumber: 3 }],
  targetRir: 3,
  status: 'completed',
});
const weekOneLogs = logsFor(weekOneExercise, [12, 11, 10], 24, '2026-09-11T08:30:00.000Z');
const weekTwoSession = makeSession(2);
const weekTwoExercise = makeExercise(2);

async function setUp(
  current: { session: Session; exercise: SessionExercise; logs?: SetLog[] } = {
    session: weekTwoSession,
    exercise: weekTwoExercise,
  },
) {
  const workout = createSqliteWorkoutStore(db());
  const mesocycleRepo = new SqliteMesocycleRepository(db());
  await mesocycleRepo.create(mesocycle);
  await seedReferences(db(), {
    sessions: [weekOneSession, current.session],
    sessionExercises: [weekOneExercise, current.exercise],
    setLogs: [...weekOneLogs, ...(current.logs ?? [])],
    exerciseIds: [DUMBBELL, BARBELL],
  });
  await workout.repos.sessionRepo.createMany([weekOneSession, current.session]);
  await workout.repos.sessionExerciseRepo.createMany([weekOneExercise, current.exercise]);
  for (const log of [...weekOneLogs, ...(current.logs ?? [])]) {
    await workout.repos.setLogRepo.create(log);
  }
  // The library carries these exercises with no equipment on them, so `equipment` stays undefined
  // — which is exactly the non-bodyweight path these tests exercise.
  return { workout, mesocycleRepo, exerciseRepo: new SqliteExerciseRepository(db()) };
}

const swapToBarbell = {
  sessionId: 'session-w2',
  sessionExerciseId: 'session-exercise-w2',
  exerciseId: BARBELL,
};

async function storedExercise(workout: WorkoutStore, sessionId = 'session-w2') {
  const [exercise] = await workout.repos.sessionExerciseRepo.listBySessionId(sessionId);
  return exercise;
}

/** A workout store whose session exercise writes fail inside a transaction. */
function failingExerciseWrites(workout: WorkoutStore): WorkoutStore {
  return {
    repos: workout.repos,
    transaction: (work) =>
      workout.transaction((repos) => {
        const sessionExerciseRepo: SessionExerciseRepository = Object.assign(
          Object.create(repos.sessionExerciseRepo) as SessionExerciseRepository,
          {
            update: async () => {
              throw new Error('session exercise write failed');
            },
          },
        );
        return work({ ...repos, sessionExerciseRepo });
      }),
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

describe('swapExercise', () => {
  test('DoD: the session exercise points to the new exercise; past weeks’ set logs are untouched', async () => {
    const deps = await setUp();

    const swapped = await swapExercise(swapToBarbell, deps, NOW);

    expect(swapped.exerciseId).toBe(BARBELL);
    await expect(storedExercise(deps.workout)).resolves.toEqual(swapped);
    await expect(
      deps.workout.repos.setLogRepo.listBySessionExerciseId('session-exercise-w1'),
    ).resolves.toEqual(weekOneLogs);
  });

  test('DoD: swapping a started exercise deletes its set logs in this session and returns it to planned', async () => {
    const started = makeExercise(2, { status: 'completed' });
    const deps = await setUp({
      session: makeSession(2, { status: 'in_progress', startedAt: '2026-09-18T09:00:00.000Z' }),
      exercise: started,
      logs: logsFor(started, [13, 12, 11], 24, '2026-09-18T09:30:00.000Z'),
    });

    const swapped = await swapExercise(swapToBarbell, deps, NOW);

    expect(swapped.status).toBe('planned');
    await expect(
      deps.workout.repos.setLogRepo.listBySessionExerciseId('session-exercise-w2'),
    ).resolves.toEqual([]);
    await expect(
      deps.workout.repos.setLogRepo.listBySessionExerciseId('session-exercise-w1'),
    ).resolves.toEqual(weekOneLogs);
  });

  test('DoD: a failure partway through rolls back both the log deletion and the exerciseId change', async () => {
    const started = makeExercise(2);
    const startedLogs = logsFor(started, [13], 24, '2026-09-18T09:30:00.000Z');
    const deps = await setUp({
      session: makeSession(2, { status: 'in_progress', startedAt: '2026-09-18T09:00:00.000Z' }),
      exercise: started,
      logs: startedLogs,
    });

    await expect(
      swapExercise(swapToBarbell, { ...deps, workout: failingExerciseWrites(deps.workout) }, NOW),
    ).rejects.toThrow('session exercise write failed');

    await expect(storedExercise(deps.workout)).resolves.toEqual(started);
    await expect(
      deps.workout.repos.setLogRepo.listBySessionExerciseId('session-exercise-w2'),
    ).resolves.toEqual(startedLogs);
  });

  test.each(['completed', 'skipped'] as const)(
    'DoD: rejects a swap in a %s session',
    async (status) => {
      const deps = await setUp({
        session: makeSession(2, { status, completedAt: '2026-09-18T09:00:00.000Z' }),
        exercise: weekTwoExercise,
      });

      const error = await rejectionOf(swapExercise(swapToBarbell, deps, NOW));

      expect(isConflictError(error)).toBe(true);
      await expect(storedExercise(deps.workout)).resolves.toEqual(weekTwoExercise);
    },
  );

  test('DoD: rows get targets from the new exercise’s history; row count and targetRir stay', async () => {
    const deps = await setUp();
    const pastBarbell = makeExercise(1, {
      id: 'session-exercise-past-barbell',
      sessionId: 'session-past',
      exerciseId: BARBELL,
    });
    const pastSession = makeSession(1, {
      id: 'session-past',
      mesoId: 'meso-past',
      status: 'completed',
    });
    await seedReferences(db(), { sessions: [pastSession], sessionExercises: [pastBarbell] });
    await deps.workout.repos.sessionRepo.create(pastSession);
    await deps.workout.repos.sessionExerciseRepo.create(pastBarbell);
    for (const log of logsFor(pastBarbell, [8, 8, 6], 80, '2026-09-01T10:00:00.000Z')) {
      await deps.workout.repos.setLogRepo.create(log);
    }

    const swapped = await swapExercise(swapToBarbell, deps, NOW);

    expect(swapped.targetRir).toBe(2);
    expect(swapped.setTargets).toEqual([
      { setNumber: 1, targetReps: 9, suggestedWeight: 80 },
      { setNumber: 2, targetReps: 9, suggestedWeight: 80 },
      { setNumber: 3, targetReps: 7, suggestedWeight: 80 },
    ]);
  });

  test('DoD: with no history the targets are cleared — only RIR is left', async () => {
    const deps = await setUp();

    const swapped = await swapExercise(swapToBarbell, deps, NOW);

    expect(swapped.setTargets).toEqual([{ setNumber: 1 }, { setNumber: 2 }, { setNumber: 3 }]);
    expect(swapped.targetRir).toBe(2);
  });

  test('DoD (with 035): dumbbell press in week 1, swapped to barbell in week 2 → week 3 inherits barbell, planned from week 2', async () => {
    const deps = await setUp();

    const swapped = await swapExercise(swapToBarbell, deps, NOW);
    const weekTwoLogs = logsFor(swapped, [8, 8, 7], 80, '2026-09-18T10:30:00.000Z');
    const weekThree = prescribeNextSession({
      exercises: [{ sessionExercise: swapped, muscleGroup: 'chest' }],
      logs: [...weekOneLogs, ...weekTwoLogs],
      weekNumber: 3,
      lengthWeeks: mesocycle.lengthWeeks,
      settings: mesocycle.progressionSettings,
    });

    expect(weekThree).toHaveLength(1);
    expect(weekThree[0]?.exerciseId).toBe(BARBELL);
    expect(weekThree[0]?.setTargets).toEqual([
      { setNumber: 1, targetReps: 9, suggestedWeight: 80 },
      { setNumber: 2, targetReps: 9, suggestedWeight: 80 },
      { setNumber: 3, targetReps: 8, suggestedWeight: 80 },
    ]);
  });

  test('in a deload session the new exercise gets no targets', async () => {
    const deps = await setUp({
      session: makeSession(2, { isDeload: true }),
      exercise: weekTwoExercise,
    });

    const swapped = await swapExercise(swapToBarbell, deps, NOW);

    expect(swapped.exerciseId).toBe(BARBELL);
    expect(swapped.setTargets).toEqual([{ setNumber: 1 }, { setNumber: 2 }, { setNumber: 3 }]);
  });

  test('swapping to the exercise it already is changes nothing', async () => {
    const deps = await setUp();

    const result = await swapExercise({ ...swapToBarbell, exerciseId: DUMBBELL }, deps, NOW);

    expect(result).toEqual(weekTwoExercise);
    await expect(storedExercise(deps.workout)).resolves.toEqual(weekTwoExercise);
  });
});
