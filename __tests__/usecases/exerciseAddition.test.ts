import { isConflictError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { SqliteExerciseRepository } from '@storage/sqlite/exerciseRepository';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { createSqliteWorkoutStore } from '@storage/sqlite/workoutStore';
import { addExercises, type ExerciseAdditionDeps } from '@usecases/exerciseAddition';
import { STAMPS } from '../fixtures/stamps';
import { seedReferences } from '../fixtures/references';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const NOW = '2026-09-18T10:00:00.000Z';
const CURL = 'exercise-curl';
const LATERAL_RAISE = 'exercise-lateral-raise';

/** 5 weeks: working weeks at RIR 3, 2, 1, 0 — week 2 is RIR 2. */
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

const session: Session = {
  ...STAMPS,
  id: 'session-w2',
  mesoId: 'meso',
  weekNumber: 2,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'in_progress',
  startedAt: '2026-09-18T09:00:00.000Z',
};

const bench: SessionExercise = {
  ...STAMPS,
  id: 'session-exercise-bench',
  sessionId: 'session-w2',
  exerciseId: 'exercise-bench',
  order: 1,
  setTargets: [{ setNumber: 1 }, { setNumber: 2 }, { setNumber: 3 }],
  targetRir: 2,
  status: 'planned',
};

async function setUp(stored: Session = session): Promise<ExerciseAdditionDeps> {
  const store = db();
  const workout = createSqliteWorkoutStore(store);
  const mesocycleRepo = new SqliteMesocycleRepository(store);
  await mesocycleRepo.create(mesocycle);
  await seedReferences(db(), {
    sessions: [stored],
    sessionExercises: [bench],
    exerciseIds: [CURL, LATERAL_RAISE],
  });
  await workout.repos.sessionRepo.create(stored);
  await workout.repos.sessionExerciseRepo.create(bench);
  // The library carries these exercises with no equipment on them, so `equipment` stays undefined
  // — the ordinary, non-bodyweight path.
  return { workout, mesocycleRepo, exerciseRepo: new SqliteExerciseRepository(store) };
}

/** A past performance of the curl: its own session and session exercise, plus the logs. */
async function curlPerformedIn(
  deps: ExerciseAdditionDeps,
  mesoId: string,
  loggedAt: string,
  reps: number[],
) {
  const pastSession: Session = {
    ...session,
    id: `session-past-${mesoId}`,
    mesoId,
    weekNumber: 1,
    status: 'completed',
    completedAt: loggedAt,
  };
  const pastExercise: SessionExercise = {
    ...bench,
    id: `session-exercise-past-${mesoId}`,
    sessionId: pastSession.id,
    exerciseId: CURL,
    status: 'completed',
  };
  await seedReferences(db(), { sessions: [pastSession], sessionExercises: [pastExercise] });
  await deps.workout.repos.sessionRepo.create(pastSession);
  await deps.workout.repos.sessionExerciseRepo.create(pastExercise);
  for (const [index, rep] of reps.entries()) {
    const log: SetLog = {
      ...STAMPS,
      id: `log-${mesoId}-${index + 1}`,
      sessionExerciseId: pastExercise.id,
      exerciseId: CURL,
      setNumber: index + 1,
      weight: 14,
      reps: rep,
      completedAt: loggedAt,
    };
    await deps.workout.repos.setLogRepo.create(log);
  }
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('addExercises', () => {
  test('appends each picked exercise at the end with 2 rows and the week’s targetRir', async () => {
    const deps = await setUp();

    const added = await addExercises(
      { sessionId: 'session-w2', exerciseIds: [CURL, 'exercise-lateral-raise'] },
      deps,
      NOW,
    );

    expect(
      added.map(({ exerciseId, order, targetRir, status }) => [
        exerciseId,
        order,
        targetRir,
        status,
      ]),
    ).toEqual([
      [CURL, 2, 2, 'planned'],
      ['exercise-lateral-raise', 3, 2, 'planned'],
    ]);
    expect(added.every((exercise) => exercise.setTargets.length === 2)).toBe(true);
    const stored = await deps.workout.repos.sessionExerciseRepo.listBySessionId('session-w2');
    expect(stored).toHaveLength(3);
  });

  test('DoD: history in this mesocycle → reps + 1 and its weight', async () => {
    const deps = await setUp();
    await curlPerformedIn(deps, 'meso', '2026-06-01T10:00:00.000Z', [12, 10]);

    const [added] = await addExercises({ sessionId: 'session-w2', exerciseIds: [CURL] }, deps, NOW);

    expect(added?.setTargets).toEqual([
      { setNumber: 1, targetReps: 13, suggestedWeight: 14 },
      { setNumber: 2, targetReps: 11, suggestedWeight: 14 },
    ]);
  });

  test('DoD: history 20 days ago in a past mesocycle → targets too', async () => {
    const deps = await setUp();
    await curlPerformedIn(deps, 'meso-past', '2026-08-29T10:00:00.000Z', [12, 10]);

    const [added] = await addExercises({ sessionId: 'session-w2', exerciseIds: [CURL] }, deps, NOW);

    expect(added?.setTargets.map((target) => target.targetReps)).toEqual([13, 11]);
  });

  test('DoD: history 40 days ago in a past mesocycle → only RIR', async () => {
    const deps = await setUp();
    await curlPerformedIn(deps, 'meso-past', '2026-08-09T10:00:00.000Z', [12, 10]);

    const [added] = await addExercises({ sessionId: 'session-w2', exerciseIds: [CURL] }, deps, NOW);

    expect(added?.setTargets).toEqual([{ setNumber: 1 }, { setNumber: 2 }]);
    expect(added?.targetRir).toBe(2);
  });

  test('rejected in a deload session', async () => {
    const deps = await setUp({ ...session, weekNumber: 5, isDeload: true });

    const error = await rejectionOf(
      addExercises({ sessionId: 'session-w2', exerciseIds: [CURL] }, deps, NOW),
    );

    expect(isConflictError(error)).toBe(true);
  });

  test('rejected in a final session', async () => {
    const deps = await setUp({ ...session, status: 'completed', completedAt: NOW });

    const error = await rejectionOf(
      addExercises({ sessionId: 'session-w2', exerciseIds: [CURL] }, deps, NOW),
    );

    expect(isConflictError(error)).toBe(true);
    await expect(
      deps.workout.repos.sessionExerciseRepo.listBySessionId('session-w2'),
    ).resolves.toEqual([bench]);
  });
});
