import { type Exercise, toExerciseId } from '@domain/catalog';
import { isConflictError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';
import { skipWorkout, type WorkoutSkipDeps } from '@usecases/workoutSkip';
import { ANY_STAMPS, STAMPS } from '../fixtures/stamps';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const mesocycle: Mesocycle = {
  ...STAMPS,
  id: 'meso',
  name: 'Full body',
  lengthWeeks: 4,
  daysPerWeek: 1,
  startDate: '2026-09-11T08:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  createdAt: '2026-09-10T08:00:00.000Z',
};

const weekOne: Session = {
  ...STAMPS,
  id: 'session-w1',
  mesoId: 'meso',
  weekNumber: 1,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'planned',
};

const bench: SessionExercise = {
  ...STAMPS,
  id: 'session-exercise-bench',
  sessionId: 'session-w1',
  exerciseId: 'bench',
  order: 1,
  setTargets: [{ setNumber: 1 }, { setNumber: 2 }, { setNumber: 3 }],
  targetRir: 2,
  status: 'planned',
};

const log: SetLog = {
  ...STAMPS,
  id: 'log-1',
  sessionExerciseId: 'session-exercise-bench',
  exerciseId: 'bench',
  setNumber: 1,
  weight: 60,
  reps: 10,
  completedAt: '2026-09-18T09:30:00.000Z',
};

const row: SessionExercise = {
  ...bench,
  id: 'session-exercise-row',
  exerciseId: 'bench',
  order: 2,
  setTargets: [{ setNumber: 1 }],
};

async function setUp(
  options: { session?: Session; exercises?: SessionExercise[]; logs?: SetLog[] } = {},
): Promise<WorkoutSkipDeps> {
  const store = new InMemoryStore();
  const workout = createInMemoryWorkoutStore(store);
  const mesocycleRepo = new InMemoryMesocycleRepository(store);
  const exerciseRepo = new InMemoryExerciseRepository(store);
  await mesocycleRepo.create(mesocycle);
  const catalogBench: Exercise = {
    ...STAMPS,
    id: toExerciseId('bench'),
    name: 'Bench Press',
    muscleGroup: 'chest',
    source: 'catalog',
    isHidden: false,
  };
  await exerciseRepo.seedCatalog([catalogBench]);
  await workout.repos.sessionRepo.create(options.session ?? weekOne);
  await workout.repos.sessionExerciseRepo.createMany(options.exercises ?? [bench]);
  for (const setLog of options.logs ?? []) {
    await workout.repos.setLogRepo.create(setLog);
  }
  return { workout, mesocycleRepo, exerciseRepo };
}

async function sessionsOf(deps: WorkoutSkipDeps) {
  const sessions = await deps.workout.repos.sessionRepo.listByMesoId('meso');
  return [...sessions].sort((a, b) => a.weekNumber - b.weekNumber);
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('skipWorkout', () => {
  test('DoD: skipping the workout triggers next week’s generation', async () => {
    const deps = await setUp();

    const result = await skipWorkout('session-w1', deps);

    expect(result.session).toEqual({ ...weekOne, ...ANY_STAMPS, status: 'skipped' });
    expect(result.nextSession).toMatchObject({
      weekNumber: 2,
      dayNumber: 1,
      status: 'planned',
      sourceSessionId: 'session-w1',
    });
    await expect(sessionsOf(deps)).resolves.toEqual([result.session, result.nextSession]);
    const [planned] = await deps.workout.repos.sessionExerciseRepo.listBySessionId(
      result.nextSession?.id ?? '',
    );
    expect(planned?.setTargets).toEqual(bench.setTargets);
  });

  test('skips every exercise, and a session with nothing logged becomes skipped', async () => {
    const deps = await setUp({ exercises: [bench, row] });

    await skipWorkout('session-w1', deps);

    const exercises = await deps.workout.repos.sessionExerciseRepo.listBySessionId('session-w1');
    expect(exercises.map((exercise) => exercise.status)).toEqual(['skipped', 'skipped']);
  });

  test('with sets logged: unfinished exercises are skipped, logs kept, the session completed', async () => {
    const inProgress: Session = {
      ...weekOne,
      status: 'in_progress',
      startedAt: '2026-09-18T09:00:00.000Z',
    };
    // The row is fully logged; bench has one of its three sets.
    const rowLog: SetLog = {
      ...log,
      id: 'log-row',
      sessionExerciseId: 'session-exercise-row',
    };
    const deps = await setUp({
      session: inProgress,
      exercises: [bench, { ...row, status: 'completed' }],
      logs: [log, rowLog],
    });

    const result = await skipWorkout('session-w1', deps, '2026-09-18T10:00:00.000Z');

    expect(result.session).toEqual({
      ...inProgress,
      ...ANY_STAMPS,
      status: 'completed',
      completedAt: '2026-09-18T10:00:00.000Z',
    });
    const exercises = await deps.workout.repos.sessionExerciseRepo.listBySessionId('session-w1');
    expect(Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise.status]))).toEqual(
      { 'session-exercise-bench': 'skipped', 'session-exercise-row': 'completed' },
    );
    await expect(deps.workout.repos.setLogRepo.listBySessionId('session-w1')).resolves.toHaveLength(
      2,
    );
    expect(result.nextSession).toMatchObject({ weekNumber: 2, dayNumber: 1 });
  });

  test('rejected for an awaiting_source session', async () => {
    const awaiting: Session = { ...weekOne, prescriptionStatus: 'awaiting_source' };
    const deps = await setUp({ session: awaiting });

    expect(isConflictError(await rejectionOf(skipWorkout('session-w1', deps)))).toBe(true);
    await expect(sessionsOf(deps)).resolves.toEqual([awaiting]);
  });

  test('rejected for a session that is already final', async () => {
    const deps = await setUp({ session: { ...weekOne, status: 'skipped' } });

    expect(isConflictError(await rejectionOf(skipWorkout('session-w1', deps)))).toBe(true);
  });

  test('skipping a deload session generates nothing', async () => {
    const deload: Session = { ...weekOne, weekNumber: 4, isDeload: true };
    const deps = await setUp({ session: deload });

    const result = await skipWorkout('session-w1', deps);

    expect(result.session.status).toBe('skipped');
    expect(result.nextSession).toBeNull();
  });
});
