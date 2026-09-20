import { type Exercise, type MuscleGroup, toExerciseId } from '@domain/catalog';
import { isConflictError, isNotFoundError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import type { WorkoutStore } from '@repositories/workout';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';
import { generateNextSession } from '@usecases/nextSessionGeneration';
import { STAMPS } from '../fixtures/stamps';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

/** 5 weeks: working weeks 1–4 at RIR 3, 2, 1, 0; week 5 is deload. */
const mesocycle: Mesocycle = {
  ...STAMPS,
  id: 'meso',
  name: 'Upper/Lower',
  lengthWeeks: 5,
  daysPerWeek: 1,
  startDate: '2026-09-01T08:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  createdAt: '2026-08-30T08:00:00.000Z',
};

const catalog: [string, MuscleGroup][] = [
  ['bench', 'chest'],
  ['fly', 'chest'],
  ['row', 'back'],
];

function makeSession(weekNumber: number, overrides: Partial<Session> = {}): Session {
  return {
    ...STAMPS,
    id: `session-w${weekNumber}`,
    mesoId: 'meso',
    weekNumber,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'completed',
    completedAt: `2026-09-0${weekNumber}T10:00:00.000Z`,
    ...overrides,
  };
}

function makeExercise(weekNumber: number, exerciseId: string, order: number): SessionExercise {
  return {
    ...STAMPS,
    id: `session-exercise-w${weekNumber}-${exerciseId}`,
    sessionId: `session-w${weekNumber}`,
    exerciseId,
    order,
    setTargets: [
      { setNumber: 1, targetReps: 10, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 9, suggestedWeight: 60 },
    ],
    targetRir: 3,
    status: 'completed',
  };
}

function logsFor(sessionExercise: SessionExercise, reps: number[], weight: number): SetLog[] {
  return reps.map((rep, index) => ({
    ...STAMPS,
    id: `log-${sessionExercise.id}-${index + 1}`,
    sessionExerciseId: sessionExercise.id,
    exerciseId: sessionExercise.exerciseId,
    setNumber: index + 1,
    weight,
    reps: rep,
    completedAt: '2026-09-01T09:30:00.000Z',
  }));
}

async function setUp(
  sessions: Session[],
  exercises: SessionExercise[],
  logs: SetLog[] = [],
): Promise<{ workout: WorkoutStore; deps: Parameters<typeof generateNextSession>[2] }> {
  const store = new InMemoryStore();
  const workout = createInMemoryWorkoutStore(store);
  const mesocycleRepo = new InMemoryMesocycleRepository(store);
  const exerciseRepo = new InMemoryExerciseRepository(store);
  await mesocycleRepo.create(mesocycle);
  await exerciseRepo.seedCatalog(
    1,
    catalog.map(([id, muscleGroup]): Exercise => ({
      ...STAMPS,
      id: toExerciseId(id),
      name: id,
      muscleGroup,
      source: 'catalog',
      isHidden: false,
    })),
  );
  await workout.repos.sessionRepo.createMany(sessions);
  await workout.repos.sessionExerciseRepo.createMany(exercises);
  for (const log of logs) {
    await workout.repos.setLogRepo.create(log);
  }
  return { workout, deps: { mesocycleRepo, exerciseRepo } };
}

async function exercisesOf(workout: WorkoutStore, session: Session | null) {
  const exercises = await workout.repos.sessionExerciseRepo.listBySessionId(session?.id ?? '');
  return [...exercises].sort((a, b) => a.order - b.order);
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('generateNextSession', () => {
  test('a completed session plans the same day next week from its own fact', async () => {
    const bench = makeExercise(1, 'bench', 1);
    const trigger = makeSession(1);
    const { workout, deps } = await setUp([trigger], [bench], logsFor(bench, [11, 9], 62.5));

    const next = await generateNextSession(trigger, workout.repos, deps);

    expect(next).toMatchObject({
      weekNumber: 2,
      dayNumber: 1,
      isDeload: false,
      status: 'planned',
      prescriptionStatus: 'ready',
      sourceSessionId: 'session-w1',
    });
    await expect(workout.repos.sessionRepo.getById(next?.id ?? '')).resolves.toEqual(next);
    const [planned] = await exercisesOf(workout, next);
    expect(planned).toMatchObject({
      exerciseId: 'bench',
      order: 1,
      targetRir: 2,
      status: 'planned',
    });
    expect(
      planned?.setTargets.map(({ targetReps, suggestedWeight }) => [targetReps, suggestedWeight]),
    ).toEqual([
      [12, 62.5],
      [10, 62.5],
    ]);
  });

  test('a skipped session plans from the last completed session of the same day', async () => {
    const weekOneBench = makeExercise(1, 'bench', 1);
    const trigger = makeSession(2, { status: 'skipped', completedAt: undefined });
    const { workout, deps } = await setUp(
      [makeSession(1), trigger],
      [weekOneBench, makeExercise(2, 'bench', 1)],
      logsFor(weekOneBench, [11, 9], 62.5),
    );

    const next = await generateNextSession(trigger, workout.repos, deps);

    expect(next).toMatchObject({ weekNumber: 3, sourceSessionId: 'session-w1' });
    const [planned] = await exercisesOf(workout, next);
    expect(planned?.targetRir).toBe(1);
    expect(planned?.setTargets.map((target) => target.targetReps)).toEqual([12, 10]);
  });

  test('a skipped week 1 carries week 1’s plan over unchanged', async () => {
    const trigger = makeSession(1, { status: 'skipped', completedAt: undefined });
    const { workout, deps } = await setUp([trigger], [makeExercise(1, 'bench', 1)]);

    const next = await generateNextSession(trigger, workout.repos, deps);

    const [planned] = await exercisesOf(workout, next);
    expect(planned?.setTargets).toEqual(makeExercise(1, 'bench', 1).setTargets);
  });

  test('the last working week plans the deload week by muscle group', async () => {
    const bench = makeExercise(4, 'bench', 1);
    const fly = makeExercise(4, 'fly', 2);
    const row = makeExercise(4, 'row', 3);
    const trigger = makeSession(4);
    const { workout, deps } = await setUp(
      [trigger],
      [bench, fly, row],
      [...logsFor(bench, [8, 8], 80), ...logsFor(fly, [12, 12], 20), ...logsFor(row, [10, 10], 70)],
    );

    const next = await generateNextSession(trigger, workout.repos, deps);

    expect(next).toMatchObject({ weekNumber: 5, isDeload: true });
    const planned = await exercisesOf(workout, next);
    expect(planned.map((exercise) => [exercise.exerciseId, exercise.setTargets.length])).toEqual([
      ['bench', 1],
      ['fly', 1],
      ['row', 2],
    ]);
    expect(planned.every((exercise) => exercise.targetRir === 8)).toBe(true);
    expect(planned[0]?.setTargets[0]?.suggestedWeight).toBe(40);
  });

  test('a deload session generates nothing', async () => {
    const trigger = makeSession(5, { isDeload: true });
    const { workout, deps } = await setUp([trigger], [makeExercise(5, 'bench', 1)]);

    await expect(generateNextSession(trigger, workout.repos, deps)).resolves.toBeNull();
    await expect(workout.repos.sessionRepo.listByMesoId('meso')).resolves.toEqual([trigger]);
  });

  test('rejects a trigger that is not final', async () => {
    const trigger = makeSession(1, { status: 'in_progress', completedAt: undefined });
    const { workout, deps } = await setUp([trigger], [makeExercise(1, 'bench', 1)]);

    const error = await rejectionOf(generateNextSession(trigger, workout.repos, deps));

    expect(isConflictError(error)).toBe(true);
  });

  test('rejects when the next week’s session of that day already exists', async () => {
    const trigger = makeSession(1);
    const { workout, deps } = await setUp(
      [trigger, makeSession(2, { status: 'planned', completedAt: undefined })],
      [makeExercise(1, 'bench', 1)],
    );

    const error = await rejectionOf(generateNextSession(trigger, workout.repos, deps));

    expect(isConflictError(error)).toBe(true);
  });

  test('rejects when an exercise of the base is missing from the library', async () => {
    const trigger = makeSession(1);
    const { workout, deps } = await setUp([trigger], [makeExercise(1, 'unknown', 1)]);

    const error = await rejectionOf(generateNextSession(trigger, workout.repos, deps));

    expect(isNotFoundError(error)).toBe(true);
  });
});
