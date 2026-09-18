import { isConflictError, isNotFoundError } from '@domain/errors';
import type { Session, SessionExercise } from '@domain/execution';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';
import { openSession, openSessionExercise } from '@usecases/openSession';

const session: Session = {
  id: 'session-1',
  mesoId: 'meso',
  weekNumber: 1,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'in_progress',
  startedAt: '2026-09-18T09:00:00.000Z',
};

const benchPress: SessionExercise = {
  id: 'session-exercise-1',
  sessionId: 'session-1',
  exerciseId: 'exercise-bench-press',
  order: 1,
  setTargets: [{ setNumber: 1 }],
  targetRir: 2,
  status: 'planned',
};

async function reposWith(stored: Session = session) {
  const workout = createInMemoryWorkoutStore(new InMemoryStore());
  await workout.repos.sessionRepo.create(stored);
  await workout.repos.sessionExerciseRepo.create(benchPress);
  return workout.repos;
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('openSession', () => {
  test('returns the session with its exercises', async () => {
    const repos = await reposWith();

    await expect(openSession('session-1', repos)).resolves.toEqual({
      session,
      sessionExercises: [benchPress],
    });
  });

  test('rejects a missing session with NotFoundError', async () => {
    const repos = await reposWith();

    expect(isNotFoundError(await rejectionOf(openSession('missing', repos)))).toBe(true);
  });

  test('rejects a final session with ConflictError', async () => {
    const repos = await reposWith({ ...session, status: 'completed' });

    expect(isConflictError(await rejectionOf(openSession('session-1', repos)))).toBe(true);
  });
});

describe('openSessionExercise', () => {
  test('returns the exercise the ref points at', async () => {
    const repos = await reposWith();

    const open = await openSessionExercise(
      { sessionId: 'session-1', sessionExerciseId: 'session-exercise-1' },
      repos,
    );

    expect(open.sessionExercise).toEqual(benchPress);
  });

  test('rejects an exercise that is not part of the session with NotFoundError', async () => {
    const repos = await reposWith();

    const error = await rejectionOf(
      openSessionExercise({ sessionId: 'session-1', sessionExerciseId: 'other' }, repos),
    );

    expect(isNotFoundError(error)).toBe(true);
  });
});
