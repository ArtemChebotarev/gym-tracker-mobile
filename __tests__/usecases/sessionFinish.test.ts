import { type Exercise, toExerciseId } from '@domain/catalog';
import { isConflictError, isNotFoundError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';
import { finishSession, type SessionFinishDeps } from '@usecases/sessionFinish';
import { ANY_STAMPS, STAMPS } from '../fixtures/stamps';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const NOW = '2026-09-18T11:00:00.000Z';

const mesocycle: Mesocycle = {
  ...STAMPS,
  id: 'meso',
  name: 'Full body',
  lengthWeeks: 4,
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
  startedAt: '2026-09-18T10:00:00.000Z',
};

function makeExercise(
  exerciseId: string,
  order: number,
  status: SessionExercise['status'],
): SessionExercise {
  return {
    ...STAMPS,
    id: `session-exercise-${exerciseId}`,
    sessionId: 'session-w2',
    exerciseId,
    order,
    setTargets: [{ setNumber: 1, targetReps: 10, suggestedWeight: 60 }],
    targetRir: 1,
    status,
  };
}

function logFor(sessionExercise: SessionExercise): SetLog {
  return {
    ...STAMPS,
    id: `log-${sessionExercise.id}`,
    sessionExerciseId: sessionExercise.id,
    exerciseId: sessionExercise.exerciseId,
    setNumber: 1,
    weight: 60,
    reps: 11,
    completedAt: '2026-09-18T10:30:00.000Z',
  };
}

async function setUp(
  options: { session?: Session; exercises: SessionExercise[]; logs?: SetLog[] },
  libraryIds: string[] = ['bench', 'row'],
): Promise<SessionFinishDeps> {
  const store = new InMemoryStore();
  const workout = createInMemoryWorkoutStore(store);
  const mesocycleRepo = new InMemoryMesocycleRepository(store);
  const exerciseRepo = new InMemoryExerciseRepository(store);
  await mesocycleRepo.create(mesocycle);
  await exerciseRepo.seedCatalog(
    1,
    libraryIds.map((id): Exercise => ({
      ...STAMPS,
      id: toExerciseId(id),
      name: id,
      muscleGroup: 'chest',
      source: 'catalog',
      isHidden: false,
    })),
  );
  await workout.repos.sessionRepo.create(options.session ?? session);
  await workout.repos.sessionExerciseRepo.createMany(options.exercises);
  for (const log of options.logs ?? []) {
    await workout.repos.setLogRepo.create(log);
  }
  return { workout, mesocycleRepo, exerciseRepo };
}

async function sessionsOf(deps: SessionFinishDeps) {
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

describe('finishSession', () => {
  test('DoD: rejects while an exercise is still planned, and writes nothing', async () => {
    const bench = makeExercise('bench', 1, 'completed');
    const deps = await setUp({
      exercises: [bench, makeExercise('row', 2, 'planned')],
      logs: [logFor(bench)],
    });

    const error = await rejectionOf(finishSession('session-w2', deps, NOW));

    expect(isConflictError(error)).toBe(true);
    await expect(sessionsOf(deps)).resolves.toEqual([session]);
  });

  test('DoD: finishing completes the session and creates week 3 of the same day', async () => {
    const bench = makeExercise('bench', 1, 'completed');
    const deps = await setUp({
      exercises: [bench, makeExercise('row', 2, 'skipped')],
      logs: [logFor(bench)],
    });

    const result = await finishSession('session-w2', deps, NOW);

    expect(result.session).toEqual({
      ...session,
      ...ANY_STAMPS,
      status: 'completed',
      completedAt: NOW,
    });
    expect(result.nextSession).toMatchObject({
      weekNumber: 3,
      dayNumber: 1,
      status: 'planned',
      sourceSessionId: 'session-w2',
    });
    await expect(sessionsOf(deps)).resolves.toEqual([result.session, result.nextSession]);
    const nextExercises = await deps.workout.repos.sessionExerciseRepo.listBySessionId(
      result.nextSession?.id ?? '',
    );
    expect(nextExercises.map((exercise) => exercise.exerciseId).sort()).toEqual(['bench', 'row']);
  });

  test('DoD: the new session is written in the same transaction — a generation failure keeps the session open', async () => {
    const bench = makeExercise('bench', 1, 'completed');
    const deps = await setUp({ exercises: [bench], logs: [logFor(bench)] }, []);

    const error = await rejectionOf(finishSession('session-w2', deps, NOW));

    expect(isNotFoundError(error)).toBe(true);
    await expect(sessionsOf(deps)).resolves.toEqual([session]);
  });

  test('DoD: every exercise skipped with no logs → the session is skipped', async () => {
    const deps = await setUp({
      session: { ...session, status: 'planned', startedAt: undefined },
      exercises: [makeExercise('bench', 1, 'skipped'), makeExercise('row', 2, 'skipped')],
    });
    // A skipped session plans from the last completed one of the same day (03, "Пропуск сессии").
    const weekOne: Session = {
      ...session,
      id: 'session-w1',
      weekNumber: 1,
      status: 'completed',
      completedAt: '2026-09-11T10:00:00.000Z',
    };
    await deps.workout.repos.sessionRepo.create(weekOne);
    await deps.workout.repos.sessionExerciseRepo.create({
      ...makeExercise('bench', 1, 'completed'),
      id: 'session-exercise-w1-bench',
      sessionId: 'session-w1',
    });

    const result = await finishSession('session-w2', deps, NOW);

    expect(result.session.status).toBe('skipped');
    expect(result.session).not.toHaveProperty('completedAt');
    expect(result.nextSession).toMatchObject({ weekNumber: 3, sourceSessionId: 'session-w1' });
  });

  test('DoD: every exercise skipped but one set logged → the session is completed', async () => {
    const bench = makeExercise('bench', 1, 'skipped');
    const deps = await setUp({
      exercises: [bench, makeExercise('row', 2, 'skipped')],
      logs: [logFor(bench)],
    });

    const result = await finishSession('session-w2', deps, NOW);

    expect(result.session).toMatchObject({ status: 'completed', completedAt: NOW });
  });

  test('DoD: finishing a deload session generates nothing', async () => {
    const deloadSession: Session = { ...session, id: 'session-w4', weekNumber: 4, isDeload: true };
    const bench = { ...makeExercise('bench', 1, 'completed'), sessionId: 'session-w4' };
    const deps = await setUp({
      session: deloadSession,
      exercises: [bench],
      logs: [logFor(bench)],
    });

    const result = await finishSession('session-w4', deps, NOW);

    expect(result.session.status).toBe('completed');
    expect(result.nextSession).toBeNull();
    await expect(sessionsOf(deps)).resolves.toEqual([result.session]);
  });

  test('DoD: finishing again is rejected', async () => {
    const bench = makeExercise('bench', 1, 'completed');
    const deps = await setUp({ exercises: [bench], logs: [logFor(bench)] });
    await finishSession('session-w2', deps, NOW);

    const error = await rejectionOf(finishSession('session-w2', deps, '2026-09-18T12:00:00.000Z'));

    expect(isConflictError(error)).toBe(true);
    await expect(sessionsOf(deps)).resolves.toHaveLength(2);
  });
});
