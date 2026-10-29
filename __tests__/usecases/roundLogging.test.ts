import { isConflictError, isNotFoundError } from '@domain/errors';
import type { RoundLog, Session, SessionExercise } from '@domain/execution';
import { createSqliteWorkoutStore } from '@storage/sqlite/workoutStore';
import { logRound, logTimerRound, type RoundRowRef, unlogRound } from '@usecases/roundLogging';
import { ANY_STAMPS, STAMPS } from '../fixtures/stamps';
import { seedReferences } from '../fixtures/references';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const FIRST_LOG_AT = '2026-09-18T10:00:00.000Z';

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

/** Two rounds of 2:00 with 0:45 after each — an interval's rounds are its set targets. */
const heavyBag: SessionExercise = {
  ...STAMPS,
  id: 'session-exercise-heavy-bag',
  sessionId: 'session-w1-d1',
  exerciseId: 'exercise-heavy-bag',
  order: 1,
  setTargets: [
    { setNumber: 1, targetWorkSec: 120, targetRestSec: 45 },
    { setNumber: 2, targetWorkSec: 120, targetRestSec: 45 },
  ],
  targetRir: 2,
  status: 'planned',
};

function round(roundNumber: number): RoundRowRef {
  return { sessionId: session.id, sessionExerciseId: heavyBag.id, roundNumber };
}

async function workoutWith(sessions: Session[] = [session], exercises = [heavyBag]) {
  const workout = createSqliteWorkoutStore(db());
  await seedReferences(db(), { sessions, sessionExercises: exercises });
  await workout.repos.sessionRepo.createMany(sessions);
  await workout.repos.sessionExerciseRepo.createMany(exercises);
  return workout;
}

async function storedExercise(workout: Awaited<ReturnType<typeof workoutWith>>) {
  const exercises = await workout.repos.sessionExerciseRepo.listBySessionId(session.id);
  return exercises.find((exercise) => exercise.id === heavyBag.id);
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('logRound (GT-89)', () => {
  test('DoD: one tap logs the round with the times in its fields, done, rest not skipped', async () => {
    const workout = await workoutWith();

    const result = await logRound(round(1), { workSec: 110, restSec: 45 }, workout, FIRST_LOG_AT);

    const expectedLog: RoundLog = {
      ...ANY_STAMPS,
      id: expect.any(String) as string,
      sessionExerciseId: heavyBag.id,
      exerciseId: 'exercise-heavy-bag',
      roundNumber: 1,
      workSec: 110,
      restSec: 45,
      restSkipped: false,
      completed: true,
      completedAt: FIRST_LOG_AT,
    };
    expect(result).toMatchObject({ kind: 'logged', roundLog: expectedLog });
    await expect(workout.repos.roundLogRepo.listBySessionExerciseId(heavyBag.id)).resolves.toEqual([
      expectedLog,
    ]);
  });

  test('a round with no rest logs none', async () => {
    const workout = await workoutWith();

    await logRound(round(2), { workSec: 120 }, workout, FIRST_LOG_AT);

    const [log] = await workout.repos.roundLogRepo.listBySessionExerciseId(heavyBag.id);
    expect(log).not.toHaveProperty('restSec');
  });

  test('the first round starts the session', async () => {
    const workout = await workoutWith();

    await logRound(round(1), { workSec: 120, restSec: 45 }, workout, FIRST_LOG_AT);

    await expect(workout.repos.sessionRepo.getById(session.id)).resolves.toMatchObject({
      status: 'in_progress',
      startedAt: FIRST_LOG_AT,
    });
  });

  test('DoD: the exercise is completed once every round is logged', async () => {
    const workout = await workoutWith();

    const first = await logRound(round(1), { workSec: 120, restSec: 45 }, workout, FIRST_LOG_AT);
    expect(first).toMatchObject({ sessionExercise: { status: 'planned' } });
    const last = await logRound(round(2), { workSec: 120, restSec: 45 }, workout, FIRST_LOG_AT);

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

    const result = await logRound(round(1), { workSec: 120 }, workout, FIRST_LOG_AT);

    expect(result).toEqual({
      kind: 'conflict',
      inProgressSessionId: 'session-w1-d2',
      weekNumber: 1,
      dayNumber: 2,
    });
    await expect(workout.repos.roundLogRepo.listBySessionExerciseId(heavyBag.id)).resolves.toEqual(
      [],
    );
  });

  test('rejects a round that is already logged, one that does not exist, and bad times', async () => {
    const workout = await workoutWith();
    await logRound(round(1), { workSec: 120 }, workout, FIRST_LOG_AT);

    expect(isConflictError(await rejectionOf(logRound(round(1), { workSec: 120 }, workout)))).toBe(
      true,
    );
    expect(isNotFoundError(await rejectionOf(logRound(round(3), { workSec: 120 }, workout)))).toBe(
      true,
    );
    await expect(logRound(round(2), { workSec: 0 }, workout)).rejects.toThrow(/Work/);
  });

  test('rejects a round of a skipped exercise', async () => {
    const workout = await workoutWith([session], [{ ...heavyBag, status: 'skipped' }]);

    expect(isConflictError(await rejectionOf(logRound(round(1), { workSec: 120 }, workout)))).toBe(
      true,
    );
  });
});

describe('unlogRound (GT-89)', () => {
  test('DoD: a second tap deletes the round and returns a completed exercise to planned', async () => {
    const workout = await workoutWith();
    await logRound(round(1), { workSec: 120, restSec: 45 }, workout, FIRST_LOG_AT);
    await logRound(round(2), { workSec: 120, restSec: 45 }, workout, FIRST_LOG_AT);

    const result = await unlogRound(round(2), workout);

    expect(result.sessionExercise.status).toBe('planned');
    const logs = await workout.repos.roundLogRepo.listBySessionExerciseId(heavyBag.id);
    expect(logs.map((log) => log.roundNumber)).toEqual([1]);
    await expect(workout.repos.sessionRepo.getById(session.id)).resolves.toMatchObject({
      status: 'in_progress',
    });
  });

  test('rejects a round that is not logged', async () => {
    const workout = await workoutWith();

    expect(isNotFoundError(await rejectionOf(unlogRound(round(1), workout)))).toBe(true);
  });
});

describe('logTimerRound (GT-98)', () => {
  const LATER = '2026-09-18T10:03:00.000Z';

  test('a round is logged as its work ends, its rest added when that ends', async () => {
    const workout = await workoutWith();

    const afterWork = await logTimerRound(
      round(1),
      { roundNumber: 1, workSec: 120, restSkipped: false, completed: true },
      workout,
      FIRST_LOG_AT,
    );
    expect(afterWork).toMatchObject({ kind: 'logged', session: { status: 'in_progress' } });
    await expect(workout.repos.roundLogRepo.listBySessionExerciseId(heavyBag.id)).resolves.toEqual([
      expect.not.objectContaining({ restSec: expect.anything() }),
    ]);

    await logTimerRound(
      round(1),
      { roundNumber: 1, workSec: 120, restSec: 45, restSkipped: false, completed: true },
      workout,
      LATER,
    );
    const logs = await workout.repos.roundLogRepo.listBySessionExerciseId(heavyBag.id);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      roundNumber: 1,
      workSec: 120,
      restSec: 45,
      restSkipped: false,
      completed: true,
      completedAt: LATER,
    });
  });

  test('a skipped rest is marked; a round ended early is not done, with the time it ran', async () => {
    const workout = await workoutWith();

    await logTimerRound(
      round(1),
      { roundNumber: 1, workSec: 120, restSec: 20, restSkipped: true, completed: true },
      workout,
      FIRST_LOG_AT,
    );
    await logTimerRound(
      round(2),
      { roundNumber: 2, workSec: 100, restSkipped: false, completed: false },
      workout,
      LATER,
    );

    const logs = await workout.repos.roundLogRepo.listBySessionExerciseId(heavyBag.id);
    expect(logs).toEqual([
      expect.objectContaining({ roundNumber: 1, restSec: 20, restSkipped: true, completed: true }),
      expect.objectContaining({ roundNumber: 2, workSec: 100, completed: false }),
    ]);
    // Every round has a log, so the exercise is complete — the one cut short repeats next week (FR-6).
    expect(await storedExercise(workout)).toMatchObject({ status: 'completed' });
  });

  test("DoD: the timer's log and the hand's sit together — and un-log alike", async () => {
    const workout = await workoutWith();

    await logRound(round(1), { workSec: 120, restSec: 45 }, workout, FIRST_LOG_AT);
    await logTimerRound(
      round(2),
      { roundNumber: 2, workSec: 120, restSkipped: false, completed: true },
      workout,
      LATER,
    );
    expect(await storedExercise(workout)).toMatchObject({ status: 'completed' });

    await unlogRound(round(2), workout);
    const logs = await workout.repos.roundLogRepo.listBySessionExerciseId(heavyBag.id);
    expect(logs.map((log) => log.roundNumber)).toEqual([1]);
    expect(await storedExercise(workout)).toMatchObject({ status: 'planned' });
  });

  test('refuses times that are no whole seconds, writing nothing', async () => {
    const workout = await workoutWith();
    await expect(
      logTimerRound(
        round(1),
        { roundNumber: 1, workSec: 0, restSkipped: false, completed: false },
        workout,
      ),
    ).rejects.toThrow(/Work/);
    await expect(workout.repos.roundLogRepo.listBySessionExerciseId(heavyBag.id)).resolves.toEqual(
      [],
    );
  });
});
