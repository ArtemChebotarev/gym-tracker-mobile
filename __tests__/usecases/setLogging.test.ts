import { isConflictError, isNotFoundError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { createSqliteWorkoutStore } from '@storage/sqlite/workoutStore';
import { logSet, type SetRowRef, unlogSet } from '@usecases/setLogging';
import { ANY_STAMPS, STAMPS } from '../fixtures/stamps';
import { seedReferences } from '../fixtures/references';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const FIRST_SET_AT = '2026-09-18T10:00:00.000Z';
const LATER_SET_AT = '2026-09-18T10:05:00.000Z';

const session: Session = {
  ...STAMPS,
  id: 'session-w1-d1',
  mesoId: 'meso',
  weekNumber: 1,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'planned',
};

const benchPress: SessionExercise = {
  ...STAMPS,
  id: 'session-exercise-bench-press',
  sessionId: 'session-w1-d1',
  exerciseId: 'exercise-bench-press',
  order: 1,
  setTargets: [
    { setNumber: 1, targetReps: 10, suggestedWeight: 60 },
    { setNumber: 2, targetReps: 9, suggestedWeight: 60 },
  ],
  targetRir: 2,
  status: 'planned',
};

function row(setNumber: number, sessionExerciseId = benchPress.id): SetRowRef {
  return { sessionId: session.id, sessionExerciseId, setNumber };
}

async function workoutWith(sessions: Session[] = [session], exercises = [benchPress]) {
  const workout = createSqliteWorkoutStore(db());
  await seedReferences(db(), { sessions, sessionExercises: exercises });
  await workout.repos.sessionRepo.createMany(sessions);
  await workout.repos.sessionExerciseRepo.createMany(exercises);
  return workout;
}

async function storedExercise(
  workout: Awaited<ReturnType<typeof workoutWith>>,
): Promise<SessionExercise | undefined> {
  const exercises = await workout.repos.sessionExerciseRepo.listBySessionId(session.id);
  return exercises.find((exercise) => exercise.id === benchPress.id);
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('logSet', () => {
  test('DoD: the set log is saved right away, with the row’s exercise and completedAt', async () => {
    const workout = await workoutWith();

    const result = await logSet(row(1), { weight: 62.5, reps: 11 }, workout, FIRST_SET_AT);

    const expectedLog: SetLog = {
      ...ANY_STAMPS,
      id: expect.any(String) as string,
      sessionExerciseId: benchPress.id,
      exerciseId: 'exercise-bench-press',
      setNumber: 1,
      weight: 62.5,
      reps: 11,
      completedAt: FIRST_SET_AT,
    };
    expect(result).toMatchObject({ kind: 'logged', setLog: expectedLog });
    await expect(workout.repos.setLogRepo.listBySessionId(session.id)).resolves.toEqual([
      expectedLog,
    ]);
    const stored = await workout.repos.setLogRepo.listBySessionId(session.id);
    expect(stored[0]).not.toHaveProperty('rir');
  });

  test('the first set starts the session (044)', async () => {
    const workout = await workoutWith();

    await logSet(row(1), { weight: 60, reps: 10 }, workout, FIRST_SET_AT);

    await expect(workout.repos.sessionRepo.getById(session.id)).resolves.toMatchObject({
      status: 'in_progress',
      startedAt: FIRST_SET_AT,
    });
  });

  test('DoD: rejects a set without reps and writes nothing', async () => {
    const workout = await workoutWith();

    await expect(logSet(row(1), { weight: 60, reps: null }, workout, FIRST_SET_AT)).rejects.toThrow(
      /both weight and reps/,
    );

    await expect(workout.repos.setLogRepo.listBySessionId(session.id)).resolves.toEqual([]);
    await expect(workout.repos.sessionRepo.getById(session.id)).resolves.toEqual(session);
  });

  test('DoD: logging the last open row marks the exercise completed', async () => {
    const workout = await workoutWith();

    const first = await logSet(row(1), { weight: 60, reps: 10 }, workout, FIRST_SET_AT);
    expect(first).toMatchObject({ sessionExercise: { status: 'planned' } });

    const last = await logSet(row(2), { weight: 60, reps: 9 }, workout, LATER_SET_AT);

    expect(last).toMatchObject({ sessionExercise: { status: 'completed' } });
    await expect(storedExercise(workout)).resolves.toMatchObject({ status: 'completed' });
  });

  test('another in_progress session is a conflict, and nothing is written', async () => {
    const other: Session = {
      ...session,
      id: 'session-w1-d2',
      dayNumber: 2,
      status: 'in_progress',
      startedAt: '2026-09-18T09:00:00.000Z',
    };
    const workout = await workoutWith([session, other]);

    const result = await logSet(row(1), { weight: 60, reps: 10 }, workout, FIRST_SET_AT);

    expect(result).toEqual({
      kind: 'conflict',
      inProgressSessionId: 'session-w1-d2',
      weekNumber: 1,
      dayNumber: 2,
    });
    await expect(workout.repos.setLogRepo.listBySessionId(session.id)).resolves.toEqual([]);
    await expect(workout.repos.sessionRepo.getById(session.id)).resolves.toEqual(session);
  });

  test('rejects a row that is already logged', async () => {
    const workout = await workoutWith();
    await logSet(row(1), { weight: 60, reps: 10 }, workout, FIRST_SET_AT);

    const error = await rejectionOf(logSet(row(1), { weight: 65, reps: 8 }, workout, LATER_SET_AT));

    expect(isConflictError(error)).toBe(true);
    await expect(workout.repos.setLogRepo.listBySessionId(session.id)).resolves.toHaveLength(1);
  });

  test('rejects a set on a skipped exercise', async () => {
    const workout = await workoutWith([session], [{ ...benchPress, status: 'skipped' }]);

    const error = await rejectionOf(logSet(row(1), { weight: 60, reps: 10 }, workout));

    expect(isConflictError(error)).toBe(true);
  });

  test('rejects a row or an exercise that is not part of the session', async () => {
    const workout = await workoutWith();

    const missingRow = await rejectionOf(logSet(row(3), { weight: 60, reps: 10 }, workout));
    const missingExercise = await rejectionOf(
      logSet(row(1, 'session-exercise-other'), { weight: 60, reps: 10 }, workout),
    );

    expect(isNotFoundError(missingRow)).toBe(true);
    expect(isNotFoundError(missingExercise)).toBe(true);
  });

  test('DoD: rejects a set in a completed session', async () => {
    const completed: Session = { ...session, status: 'completed', completedAt: FIRST_SET_AT };
    const workout = await workoutWith([completed]);

    const error = await rejectionOf(logSet(row(1), { weight: 60, reps: 10 }, workout));

    expect(isConflictError(error)).toBe(true);
    await expect(workout.repos.setLogRepo.listBySessionId(session.id)).resolves.toEqual([]);
  });
});

describe('unlogSet', () => {
  test('DoD: deletes the set log and returns a completed exercise to planned', async () => {
    const workout = await workoutWith();
    await logSet(row(1), { weight: 60, reps: 10 }, workout, FIRST_SET_AT);
    await logSet(row(2), { weight: 60, reps: 9 }, workout, LATER_SET_AT);

    const result = await unlogSet(row(2), workout);

    expect(result.sessionExercise.status).toBe('planned');
    await expect(storedExercise(workout)).resolves.toMatchObject({ status: 'planned' });
    const remaining = await workout.repos.setLogRepo.listBySessionId(session.id);
    expect(remaining.map((log) => log.setNumber)).toEqual([1]);
  });

  test('the session stays in_progress after its last log is removed', async () => {
    const workout = await workoutWith();
    await logSet(row(1), { weight: 60, reps: 10 }, workout, FIRST_SET_AT);

    await unlogSet(row(1), workout);

    await expect(workout.repos.sessionRepo.getById(session.id)).resolves.toMatchObject({
      status: 'in_progress',
      startedAt: FIRST_SET_AT,
    });
  });

  test('rejects a row that is not logged', async () => {
    const workout = await workoutWith();

    const error = await rejectionOf(unlogSet(row(1), workout));

    expect(isNotFoundError(error)).toBe(true);
  });

  test('DoD: rejects un-logging in a completed session and keeps the log', async () => {
    const workout = await workoutWith();
    await logSet(row(1), { weight: 60, reps: 10 }, workout, FIRST_SET_AT);
    await workout.repos.sessionRepo.update({
      ...session,
      status: 'completed',
      startedAt: FIRST_SET_AT,
      completedAt: LATER_SET_AT,
    });

    const error = await rejectionOf(unlogSet(row(1), workout));

    expect(isConflictError(error)).toBe(true);
    await expect(workout.repos.setLogRepo.listBySessionId(session.id)).resolves.toHaveLength(1);
  });
});
