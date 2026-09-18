import { isConflictError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { prescribeNextSession } from '@domain/progressionPlan';
import type { SessionExerciseRepository } from '@repositories/sessionExercise';
import type { WorkoutStore } from '@repositories/workout';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';
import { removeExercise } from '@usecases/exerciseRemoval';

function makeSession(weekNumber: number, overrides: Partial<Session> = {}): Session {
  return {
    id: `session-w${weekNumber}`,
    mesoId: 'meso',
    weekNumber,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'in_progress',
    startedAt: '2026-09-18T09:00:00.000Z',
    ...overrides,
  };
}

function makeExercise(weekNumber: number, exerciseId: string, order: number): SessionExercise {
  return {
    id: `session-exercise-w${weekNumber}-${exerciseId}`,
    sessionId: `session-w${weekNumber}`,
    exerciseId,
    order,
    setTargets: [
      { setNumber: 1, targetReps: 10, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 9, suggestedWeight: 60 },
    ],
    targetRir: 2,
    status: 'planned',
  };
}

function logsFor(sessionExercise: SessionExercise, reps: number[]): SetLog[] {
  return reps.map((rep, index) => ({
    id: `log-${sessionExercise.id}-${index + 1}`,
    sessionExerciseId: sessionExercise.id,
    exerciseId: sessionExercise.exerciseId,
    setNumber: index + 1,
    weight: 60,
    reps: rep,
    completedAt: '2026-09-18T09:30:00.000Z',
  }));
}

const weekOneBench = makeExercise(1, 'bench', 1);
const weekOneLogs = logsFor(weekOneBench, [10, 9]);
const bench = makeExercise(2, 'bench', 1);
const row = makeExercise(2, 'row', 2);
const curl = makeExercise(2, 'curl', 3);

async function workoutWith(options: { session?: Session; logs?: SetLog[] } = {}) {
  const workout = createInMemoryWorkoutStore(new InMemoryStore());
  await workout.repos.sessionRepo.createMany([
    makeSession(1, { status: 'completed', completedAt: '2026-09-11T10:00:00.000Z' }),
    options.session ?? makeSession(2),
  ]);
  await workout.repos.sessionExerciseRepo.createMany([weekOneBench, bench, row, curl]);
  for (const log of [...weekOneLogs, ...(options.logs ?? [])]) {
    await workout.repos.setLogRepo.create(log);
  }
  return workout;
}

function refTo(sessionExercise: SessionExercise) {
  return { sessionId: 'session-w2', sessionExerciseId: sessionExercise.id };
}

async function storedWeekTwo(workout: WorkoutStore) {
  const exercises = await workout.repos.sessionExerciseRepo.listBySessionId('session-w2');
  return [...exercises].sort((a, b) => a.order - b.order);
}

/** A workout store whose session exercise deletions fail inside a transaction. */
function failingExerciseDeletes(workout: WorkoutStore): WorkoutStore {
  return {
    repos: workout.repos,
    transaction: (work) =>
      workout.transaction((repos) => {
        const sessionExerciseRepo: SessionExerciseRepository = Object.assign(
          Object.create(repos.sessionExerciseRepo) as SessionExerciseRepository,
          {
            deleteById: async () => {
              throw new Error('session exercise delete failed');
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

describe('removeExercise', () => {
  test('DoD: removes an exercise with no sets and renumbers the rest without gaps', async () => {
    const workout = await workoutWith();

    const remaining = await removeExercise(refTo(row), workout);

    const expected = [bench, { ...curl, order: 2 }];
    expect(remaining).toEqual(expected);
    await expect(storedWeekTwo(workout)).resolves.toEqual(expected);
  });

  test('DoD: removing a started exercise deletes its set logs in this session; past weeks are untouched', async () => {
    const workout = await workoutWith({ logs: logsFor(bench, [11]) });

    await removeExercise(refTo(bench), workout);

    await expect(workout.repos.setLogRepo.listBySessionExerciseId(bench.id)).resolves.toEqual([]);
    await expect(
      workout.repos.setLogRepo.listBySessionExerciseId(weekOneBench.id),
    ).resolves.toEqual(weekOneLogs);
    await expect(storedWeekTwo(workout)).resolves.toEqual([
      { ...row, order: 1 },
      { ...curl, order: 2 },
    ]);
  });

  test('DoD: a failure partway through rolls everything back', async () => {
    const startedLogs = logsFor(bench, [11]);
    const workout = await workoutWith({ logs: startedLogs });

    await expect(removeExercise(refTo(bench), failingExerciseDeletes(workout))).rejects.toThrow(
      'session exercise delete failed',
    );

    await expect(storedWeekTwo(workout)).resolves.toEqual([bench, row, curl]);
    await expect(workout.repos.setLogRepo.listBySessionExerciseId(bench.id)).resolves.toEqual(
      startedLogs,
    );
  });

  test('DoD: rejected in a completed session', async () => {
    const workout = await workoutWith({
      session: makeSession(2, { status: 'completed', completedAt: '2026-09-18T10:00:00.000Z' }),
    });

    const error = await rejectionOf(removeExercise(refTo(row), workout));

    expect(isConflictError(error)).toBe(true);
    await expect(storedWeekTwo(workout)).resolves.toEqual([bench, row, curl]);
  });

  test('DoD (with 035): a removed exercise does not come back in the next week', async () => {
    const workout = await workoutWith();

    const remaining = await removeExercise(refTo(row), workout);
    const nextWeek = prescribeNextSession({
      exercises: remaining.map((sessionExercise) => ({ sessionExercise, muscleGroup: 'chest' })),
      logs: await workout.repos.setLogRepo.listBySessionId('session-w2'),
      weekNumber: 3,
      lengthWeeks: 5,
      settings: defaultProgressionSettings,
    });

    expect(nextWeek.map(({ exerciseId, order }) => ({ exerciseId, order }))).toEqual([
      { exerciseId: 'bench', order: 1 },
      { exerciseId: 'curl', order: 2 },
    ]);
  });
});
