import { isConflictError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import type { WorkoutStore } from '@repositories/workout';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';
import { addSet, removeLastSet } from '@usecases/setRows';
import { STAMPS } from '../fixtures/stamps';

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
  const workout = createInMemoryWorkoutStore(new InMemoryStore());
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
  test('DoD: the new row copies the last row’s targetReps and suggestedWeight', async () => {
    const workout = await workoutWith();

    const updated = await addSet(ref, workout);

    expect(updated.setTargets).toEqual([
      ...benchPress.setTargets,
      { setNumber: 3, targetReps: 10, suggestedWeight: 62.5 },
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
