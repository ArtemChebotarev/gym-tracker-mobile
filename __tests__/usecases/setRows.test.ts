import { isConflictError } from '@domain/errors';
import type { RoundLog, Session, SessionExercise, SetLog } from '@domain/execution';
import type { WorkoutStore } from '@repositories/workout';
import { createSqliteWorkoutStore } from '@storage/sqlite/workoutStore';
import { setRoundTime } from '@usecases/roundTimes';
import { addRound, addSet, removeLastRound, removeLastSet } from '@usecases/setRows';
import { STAMPS } from '../fixtures/stamps';
import { seedReferences } from '../fixtures/references';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

const session: Session = {
  ...STAMPS,
  id: 'session-1',
  mesoId: 'meso',
  weekNumber: 2,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'in_progress',
  startedAt: '2026-09-18T09:00:00.000Z',
};

const benchPress: SessionExercise = {
  ...STAMPS,
  id: 'session-exercise-1',
  sessionId: 'session-1',
  exerciseId: 'exercise-bench-press',
  order: 1,
  setTargets: [
    { setNumber: 1, targetReps: 11, suggestedWeight: 60 },
    { setNumber: 2, targetReps: 10, suggestedWeight: 62.5 },
  ],
  targetRir: 2,
  status: 'planned',
};

const ref = { sessionId: 'session-1', sessionExerciseId: 'session-exercise-1' };

function logFor(setNumber: number): SetLog {
  return {
    ...STAMPS,
    id: `log-${setNumber}`,
    sessionExerciseId: 'session-exercise-1',
    exerciseId: 'exercise-bench-press',
    setNumber,
    weight: 60,
    reps: 10,
    completedAt: '2026-09-18T09:30:00.000Z',
  };
}

async function workoutWith(
  options: { session?: Session; exercise?: SessionExercise; logs?: SetLog[] } = {},
) {
  const workout = createSqliteWorkoutStore(db());
  await seedReferences(db(), {
    sessions: [options.session ?? session],
    sessionExercises: [options.exercise ?? benchPress],
    setLogs: options.logs,
  });
  await workout.repos.sessionRepo.create(options.session ?? session);
  await workout.repos.sessionExerciseRepo.create(options.exercise ?? benchPress);
  for (const log of options.logs ?? []) {
    await workout.repos.setLogRepo.create(log);
  }
  return workout;
}

async function stored(workout: WorkoutStore) {
  const [exercise] = await workout.repos.sessionExerciseRepo.listBySessionId('session-1');
  return exercise;
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('addSet', () => {
  test('DoD: the new row copies the last row’s suggestedWeight, with no targetReps', async () => {
    const workout = await workoutWith();

    const updated = await addSet(ref, workout);

    expect(updated.setTargets).toEqual([
      ...benchPress.setTargets,
      { setNumber: 3, suggestedWeight: 62.5 },
    ]);
    await expect(stored(workout)).resolves.toEqual(updated);
  });

  test('DoD: a completed exercise goes back to planned', async () => {
    const workout = await workoutWith({
      exercise: { ...benchPress, status: 'completed' },
      logs: [logFor(1), logFor(2)],
    });

    const updated = await addSet(ref, workout);

    expect(updated.status).toBe('planned');
  });

  test('a skipped exercise stays skipped', async () => {
    const workout = await workoutWith({ exercise: { ...benchPress, status: 'skipped' } });

    await expect(addSet(ref, workout)).resolves.toMatchObject({ status: 'skipped' });
  });

  test('DoD: rejected in a final session', async () => {
    const workout = await workoutWith({ session: { ...session, status: 'completed' } });

    expect(isConflictError(await rejectionOf(addSet(ref, workout)))).toBe(true);
    await expect(stored(workout)).resolves.toEqual(benchPress);
  });
});

describe('removeLastSet', () => {
  test('DoD: removing a logged last row deletes its set log too', async () => {
    const workout = await workoutWith({ logs: [logFor(1), logFor(2)] });

    const updated = await removeLastSet(ref, workout);

    expect(updated.setTargets).toEqual([benchPress.setTargets[0]]);
    await expect(
      workout.repos.setLogRepo.listBySessionExerciseId('session-exercise-1'),
    ).resolves.toEqual([logFor(1)]);
  });

  test('removing an unlogged last row leaves the other logs alone', async () => {
    const workout = await workoutWith({ logs: [logFor(1)] });

    await removeLastSet(ref, workout);

    await expect(
      workout.repos.setLogRepo.listBySessionExerciseId('session-exercise-1'),
    ).resolves.toEqual([logFor(1)]);
  });

  test('DoD: when every remaining row is logged, the exercise becomes completed', async () => {
    const workout = await workoutWith({ logs: [logFor(1)] });

    const updated = await removeLastSet(ref, workout);

    expect(updated.status).toBe('completed');
    await expect(stored(workout)).resolves.toMatchObject({ status: 'completed' });
  });

  test('DoD: rejects removing the only set', async () => {
    const single = { ...benchPress, setTargets: [{ setNumber: 1 }] };
    const workout = await workoutWith({ exercise: single });

    expect(isConflictError(await rejectionOf(removeLastSet(ref, workout)))).toBe(true);
    await expect(stored(workout)).resolves.toEqual(single);
  });

  test('DoD: rejected in a final session', async () => {
    const workout = await workoutWith({
      session: { ...session, status: 'skipped' },
      logs: [logFor(1), logFor(2)],
    });

    expect(isConflictError(await rejectionOf(removeLastSet(ref, workout)))).toBe(true);
    await expect(stored(workout)).resolves.toEqual(benchPress);
    await expect(
      workout.repos.setLogRepo.listBySessionExerciseId('session-exercise-1'),
    ).resolves.toHaveLength(2);
  });
});

/** Two rounds of 2:00 — the second with a shorter rest. An interval's rounds are its set targets. */
const heavyBag: SessionExercise = {
  ...benchPress,
  exerciseId: 'exercise-heavy-bag',
  setTargets: [
    { setNumber: 1, targetWorkSec: 120, targetRestSec: 45 },
    { setNumber: 2, targetWorkSec: 120, targetRestSec: 30 },
  ],
};

function roundLogFor(roundNumber: number): RoundLog {
  return {
    ...STAMPS,
    id: `round-log-${roundNumber}`,
    sessionExerciseId: 'session-exercise-1',
    exerciseId: 'exercise-heavy-bag',
    roundNumber,
    workSec: 120,
    restSec: 45,
    restSkipped: false,
    completed: true,
    completedAt: '2026-09-18T09:30:00.000Z',
  };
}

async function intervalWorkoutWith(
  options: { exercise?: SessionExercise; roundLogs?: RoundLog[] } = {},
) {
  const workout = await workoutWith({ exercise: options.exercise ?? heavyBag });
  for (const log of options.roundLogs ?? []) {
    await workout.repos.roundLogRepo.create(log);
  }
  return workout;
}

function storedRoundLogs(workout: WorkoutStore) {
  return workout.repos.roundLogRepo.listBySessionExerciseId('session-exercise-1');
}

describe('addRound (GT-91)', () => {
  test('the new round copies the last round’s work and rest', async () => {
    const workout = await intervalWorkoutWith();

    const updated = await addRound(ref, workout);

    expect(updated.setTargets).toEqual([
      ...heavyBag.setTargets,
      { setNumber: 3, targetWorkSec: 120, targetRestSec: 30 },
    ]);
    await expect(stored(workout)).resolves.toEqual(updated);
  });

  test('a logged last round passes on the times it was done with', async () => {
    const workout = await intervalWorkoutWith({
      roundLogs: [{ ...roundLogFor(2), workSec: 135, restSec: 25 }],
    });

    const updated = await addRound(ref, workout);

    expect(updated.setTargets.at(-1)).toEqual({
      setNumber: 3,
      targetWorkSec: 135,
      targetRestSec: 25,
    });
  });

  test('a completed exercise goes back to planned', async () => {
    const workout = await intervalWorkoutWith({
      exercise: { ...heavyBag, status: 'completed' },
      roundLogs: [roundLogFor(1), roundLogFor(2)],
    });

    await expect(addRound(ref, workout)).resolves.toMatchObject({ status: 'planned' });
  });

  test('a skipped exercise stays skipped', async () => {
    const workout = await intervalWorkoutWith({ exercise: { ...heavyBag, status: 'skipped' } });

    await expect(addRound(ref, workout)).resolves.toMatchObject({ status: 'skipped' });
  });
});

describe('removeLastRound (GT-91)', () => {
  test('removing a logged last round deletes its round log too', async () => {
    const workout = await intervalWorkoutWith({ roundLogs: [roundLogFor(1), roundLogFor(2)] });

    const updated = await removeLastRound(ref, workout);

    expect(updated.setTargets).toEqual([heavyBag.setTargets[0]]);
    await expect(storedRoundLogs(workout)).resolves.toEqual([roundLogFor(1)]);
  });

  test('when every remaining round is logged, the exercise becomes completed', async () => {
    const workout = await intervalWorkoutWith({ roundLogs: [roundLogFor(1)] });

    const updated = await removeLastRound(ref, workout);

    expect(updated.status).toBe('completed');
    await expect(storedRoundLogs(workout)).resolves.toEqual([roundLogFor(1)]);
  });

  test('rejects removing the only round', async () => {
    const single = { ...heavyBag, setTargets: [{ setNumber: 1, targetWorkSec: 120 }] };
    const workout = await intervalWorkoutWith({ exercise: single });

    expect(isConflictError(await rejectionOf(removeLastRound(ref, workout)))).toBe(true);
    await expect(stored(workout)).resolves.toEqual(single);
  });

  test('rejected in a final session', async () => {
    const workout = await intervalWorkoutWith({ roundLogs: [roundLogFor(1), roundLogFor(2)] });
    await workout.repos.sessionRepo.update({ ...session, status: 'completed' });

    expect(isConflictError(await rejectionOf(removeLastRound(ref, workout)))).toBe(true);
    await expect(stored(workout)).resolves.toEqual(heavyBag);
    await expect(storedRoundLogs(workout)).resolves.toHaveLength(2);
  });
});

// Lives beside Add round: the same interval fixture, and the same kind of write — the rounds' plan.
describe('setRoundTime (GT-187)', () => {
  const timeless: SessionExercise = {
    ...heavyBag,
    setTargets: [{ setNumber: 1 }, { setNumber: 2 }, { setNumber: 3 }],
  };

  test('DoD: a time picked on an empty round is saved as the plan of it and the rounds that followed', async () => {
    const workout = await intervalWorkoutWith({ exercise: timeless });

    await setRoundTime(ref, 'work', [1, 2, 3], 30, workout);
    const updated = await setRoundTime(ref, 'rest', [2, 3], 60, workout);

    expect(updated.setTargets).toEqual([
      { setNumber: 1, targetWorkSec: 30 },
      { setNumber: 2, targetWorkSec: 30, targetRestSec: 60 },
      { setNumber: 3, targetWorkSec: 30, targetRestSec: 60 },
    ]);
    await expect(stored(workout)).resolves.toEqual(updated);
  });

  test('it neither starts the session nor changes the exercise’s status', async () => {
    const workout = await intervalWorkoutWith({ exercise: timeless });

    const updated = await setRoundTime(ref, 'work', [1], 30, workout);

    expect(updated.status).toBe('planned');
    await expect(workout.repos.sessionRepo.getById('session-1')).resolves.toMatchObject({
      status: session.status,
    });
  });

  test('a logged round is refused — un-log it first — and nothing is written', async () => {
    const workout = await intervalWorkoutWith({ roundLogs: [roundLogFor(1)] });

    const error = await rejectionOf(setRoundTime(ref, 'rest', [1, 2], 20, workout));

    expect(isConflictError(error)).toBe(true);
    await expect(stored(workout)).resolves.toMatchObject({ setTargets: heavyBag.setTargets });
  });

  test('a skipped exercise is refused', async () => {
    const workout = await intervalWorkoutWith({ exercise: { ...heavyBag, status: 'skipped' } });

    expect(isConflictError(await rejectionOf(setRoundTime(ref, 'work', [1], 30, workout)))).toBe(
      true,
    );
  });

  test('a rest under 0:10 or a round the exercise lacks is refused', async () => {
    const workout = await intervalWorkoutWith();

    await expect(setRoundTime(ref, 'rest', [1], 5, workout)).rejects.toThrow();
    await expect(setRoundTime(ref, 'work', [3], 30, workout)).rejects.toThrow();
    await expect(stored(workout)).resolves.toMatchObject({ setTargets: heavyBag.setTargets });
  });
});
