import { isConflictError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { prescribeNextSession } from '@domain/progressionPlan';
import type { WorkoutStore } from '@repositories/workout';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';
import { skipExercise, unskipExercise } from '@usecases/exerciseSkipping';

const session: Session = {
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
  id: 'session-exercise-bench',
  sessionId: 'session-w2',
  exerciseId: 'exercise-bench',
  order: 1,
  setTargets: [
    { setNumber: 1, targetReps: 11, suggestedWeight: 60 },
    { setNumber: 2, targetReps: 10, suggestedWeight: 60 },
    { setNumber: 3, targetReps: 9, suggestedWeight: 60 },
  ],
  targetRir: 2,
  status: 'planned',
};

const ref = { sessionId: 'session-w2', sessionExerciseId: 'session-exercise-bench' };

function logFor(setNumber: number, reps = 12): SetLog {
  return {
    id: `log-${setNumber}`,
    sessionExerciseId: 'session-exercise-bench',
    exerciseId: 'exercise-bench',
    setNumber,
    weight: 60,
    reps,
    completedAt: '2026-09-18T09:30:00.000Z',
  };
}

async function workoutWith(
  options: { session?: Session; exercise?: SessionExercise; logs?: SetLog[] } = {},
) {
  const workout = createInMemoryWorkoutStore(new InMemoryStore());
  await workout.repos.sessionRepo.create(options.session ?? session);
  await workout.repos.sessionExerciseRepo.create(options.exercise ?? bench);
  for (const log of options.logs ?? []) {
    await workout.repos.setLogRepo.create(log);
  }
  return workout;
}

async function stored(workout: WorkoutStore) {
  const [exercise] = await workout.repos.sessionExerciseRepo.listBySessionId('session-w2');
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

describe('skipExercise', () => {
  test('DoD: an exercise with no sets logged is skipped', async () => {
    const workout = await workoutWith();

    const skipped = await skipExercise(ref, workout);

    expect(skipped).toEqual({ ...bench, status: 'skipped' });
    await expect(stored(workout)).resolves.toEqual(skipped);
  });

  test('DoD: skipping after 1 of 3 sets keeps the set log and all 3 rows', async () => {
    const workout = await workoutWith({ logs: [logFor(1)] });

    const skipped = await skipExercise(ref, workout);

    expect(skipped.setTargets).toHaveLength(3);
    await expect(
      workout.repos.setLogRepo.listBySessionExerciseId('session-exercise-bench'),
    ).resolves.toEqual([logFor(1)]);
  });

  test('with 035: next week keeps 3 sets — the logged one progresses, the rest carry over', async () => {
    const workout = await workoutWith({ logs: [logFor(1, 12)] });

    const skipped = await skipExercise(ref, workout);
    const [nextWeek] = prescribeNextSession({
      exercises: [{ sessionExercise: skipped, muscleGroup: 'chest' }],
      logs: [logFor(1, 12)],
      weekNumber: 3,
      lengthWeeks: 5,
      settings: defaultProgressionSettings,
    });

    expect(nextWeek?.setTargets.map((target) => target.targetReps)).toEqual([13, 10, 9]);
  });

  test('rejected in a final session', async () => {
    const workout = await workoutWith({ session: { ...session, status: 'completed' } });

    expect(isConflictError(await rejectionOf(skipExercise(ref, workout)))).toBe(true);
    await expect(stored(workout)).resolves.toEqual(bench);
  });
});

describe('unskipExercise', () => {
  test('DoD: returns a partly logged exercise to planned', async () => {
    const workout = await workoutWith({
      exercise: { ...bench, status: 'skipped' },
      logs: [logFor(1)],
    });

    await expect(unskipExercise(ref, workout)).resolves.toMatchObject({ status: 'planned' });
    await expect(stored(workout)).resolves.toMatchObject({ status: 'planned' });
  });

  test('DoD: returns a fully logged exercise to completed', async () => {
    const workout = await workoutWith({
      exercise: { ...bench, status: 'skipped' },
      logs: [logFor(1), logFor(2), logFor(3)],
    });

    await expect(unskipExercise(ref, workout)).resolves.toMatchObject({ status: 'completed' });
  });

  test('an exercise that is not skipped is left as it is', async () => {
    const workout = await workoutWith();

    await expect(unskipExercise(ref, workout)).resolves.toEqual(bench);
  });

  test('rejected in a final session', async () => {
    const skipped = { ...bench, status: 'skipped' as const };
    const workout = await workoutWith({
      session: { ...session, status: 'completed' },
      exercise: skipped,
    });

    expect(isConflictError(await rejectionOf(unskipExercise(ref, workout)))).toBe(true);
    await expect(stored(workout)).resolves.toEqual(skipped);
  });
});
