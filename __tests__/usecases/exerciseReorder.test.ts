import { isConflictError } from '@domain/errors';
import type { Session, SessionExercise } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { prescribeNextSession } from '@domain/progressionPlan';
import type { WorkoutStore } from '@repositories/workout';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';
import { moveExercise } from '@usecases/exerciseReorder';
import { STAMPS } from '../fixtures/stamps';

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

function makeExercise(exerciseId: string, order: number): SessionExercise {
  return {
    ...STAMPS,
    id: `session-exercise-${exerciseId}`,
    sessionId: 'session-w2',
    exerciseId,
    order,
    setTargets: [{ setNumber: 1, targetReps: 10, suggestedWeight: 60 }],
    targetRir: 2,
    status: 'planned',
  };
}

const bench = makeExercise('bench', 1);
const row = makeExercise('row', 2);
const curl = makeExercise('curl', 3);

async function workoutWith(stored: Session = session) {
  const workout = createInMemoryWorkoutStore(new InMemoryStore());
  await workout.repos.sessionRepo.create(stored);
  await workout.repos.sessionExerciseRepo.createMany([bench, row, curl]);
  return workout;
}

function refTo(sessionExercise: SessionExercise) {
  return { sessionId: 'session-w2', sessionExerciseId: sessionExercise.id };
}

async function storedOrder(workout: WorkoutStore) {
  const exercises = await workout.repos.sessionExerciseRepo.listBySessionId('session-w2');
  return [...exercises].sort((a, b) => a.order - b.order).map((exercise) => exercise.exerciseId);
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('moveExercise', () => {
  test('DoD: moving swaps order with the neighbour, and the next week inherits it (with 035)', async () => {
    const workout = await workoutWith();

    const reordered = await moveExercise(refTo(curl), 'up', workout);

    expect(reordered.map((exercise) => exercise.exerciseId)).toEqual(['bench', 'curl', 'row']);
    await expect(storedOrder(workout)).resolves.toEqual(['bench', 'curl', 'row']);
    const nextWeek = prescribeNextSession({
      exercises: reordered.map((sessionExercise) => ({ sessionExercise, muscleGroup: 'chest' })),
      logs: [],
      weekNumber: 3,
      lengthWeeks: 5,
      settings: defaultProgressionSettings,
    });
    expect(nextWeek.map(({ exerciseId, order }) => [exerciseId, order])).toEqual([
      ['bench', 1],
      ['curl', 2],
      ['row', 3],
    ]);
  });

  test('moving down swaps with the next exercise', async () => {
    const workout = await workoutWith();

    await moveExercise(refTo(bench), 'down', workout);

    await expect(storedOrder(workout)).resolves.toEqual(['row', 'bench', 'curl']);
  });

  test('DoD: Move up on the first exercise is rejected', async () => {
    const workout = await workoutWith();

    expect(isConflictError(await rejectionOf(moveExercise(refTo(bench), 'up', workout)))).toBe(
      true,
    );
    await expect(storedOrder(workout)).resolves.toEqual(['bench', 'row', 'curl']);
  });

  test('Move down on the last exercise is rejected', async () => {
    const workout = await workoutWith();

    expect(isConflictError(await rejectionOf(moveExercise(refTo(curl), 'down', workout)))).toBe(
      true,
    );
  });

  test('rejected in a final session', async () => {
    const workout = await workoutWith({ ...session, status: 'completed' });

    expect(isConflictError(await rejectionOf(moveExercise(refTo(row), 'up', workout)))).toBe(true);
    await expect(storedOrder(workout)).resolves.toEqual(['bench', 'row', 'curl']);
  });
});
