import { type Exercise, type MuscleGroup, toExerciseId } from '@domain/catalog';
import { isConflictError } from '@domain/errors';
import type { RoundLog, Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import type { WorkoutStore } from '@repositories/workout';
import { SqliteExerciseRepository } from '@storage/sqlite/exerciseRepository';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { createSqliteWorkoutStore } from '@storage/sqlite/workoutStore';
import { generateNextSession } from '@usecases/nextSessionGeneration';
import { logRound } from '@usecases/roundLogging';
import { setRoundTime } from '@usecases/roundTimes';
import { HEAVY_BAG, HEAVY_BAG_CONFIG } from '../fixtures/hybridExercises';
import { STAMPS } from '../fixtures/stamps';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

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
  const store = db();
  const workout = createSqliteWorkoutStore(store);
  const mesocycleRepo = new SqliteMesocycleRepository(store);
  const exerciseRepo = new SqliteExerciseRepository(store);
  await mesocycleRepo.create(mesocycle);
  await exerciseRepo.seedCatalog(
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

  // GT-83, 10.2 P15: a power exercise's deload day keeps its own weights and the load's meaning.
  test('the last working week plans a power deload: two sets, kilograms halved per set', async () => {
    const slam = makeExercise(4, 'slam', 1);
    const trigger = makeSession(4);
    await new SqliteExerciseRepository(db()).createCustom({
      ...STAMPS,
      id: toExerciseId('slam'),
      name: 'Medball slam',
      muscleGroup: 'fullBody',
      source: 'custom',
      isHidden: false,
      type: 'power',
      config: { type: 'power', load: 'weight', noHeavierAvailable: false },
    });

    const { workout, deps } = await setUp(
      [trigger],
      [slam],
      [{ ...logsFor(slam, [6], 8)[0]! }, { ...logsFor(slam, [6, 6], 10)[1]! }],
    );
    const next = await generateNextSession(trigger, workout.repos, deps);

    const [planned] = await exercisesOf(workout, next);
    expect(planned?.setTargets).toEqual([
      { setNumber: 1, suggestedWeight: 4 },
      { setNumber: 2, suggestedWeight: 5 },
    ]);
    expect(planned?.targetRir).toBe(8);
  });

  // GT-83: a power exercise that is its own load is a bodyweight one for the engine: no weight target.
  test('a power exercise whose load is none gets no weight targets', async () => {
    const jump = makeExercise(3, 'jump', 1);
    const trigger = makeSession(3);
    await new SqliteExerciseRepository(db()).createCustom({
      ...STAMPS,
      id: toExerciseId('jump'),
      name: 'Box jump',
      muscleGroup: 'quads',
      source: 'custom',
      isHidden: false,
      type: 'power',
      equipment: 'plyo-box',
      config: { type: 'power', load: 'none', noHeavierAvailable: false },
    });
    const { workout, deps } = await setUp([trigger], [jump], logsFor(jump, [5, 5], 10));

    const next = await generateNextSession(trigger, workout.repos, deps);

    const [planned] = await exercisesOf(workout, next);
    expect(planned?.setTargets).toEqual([
      { setNumber: 1, targetReps: 6 },
      { setNumber: 2, targetReps: 6 },
    ]);
  });

  // GT-93: an interval's rounds are inherited from the fact — how many, and the times each was
  // done with (03, "Структура наследуется от факта").
  test('an interval plans next week’s rounds from the fact: rounds added stay, logged times carry', async () => {
    await new SqliteExerciseRepository(db()).createCustom(HEAVY_BAG);
    const trigger = makeSession(1);
    // Planned as 3 × 2:00 / 0:45; a 4th round was added in the workout.
    const bag: SessionExercise = {
      ...makeExercise(1, HEAVY_BAG.id, 1),
      setTargets: [
        { setNumber: 1, targetWorkSec: 120, targetRestSec: 45 },
        { setNumber: 2, targetWorkSec: 120, targetRestSec: 45 },
        { setNumber: 3, targetWorkSec: 120, targetRestSec: 45 },
        { setNumber: 4, targetWorkSec: 120, targetRestSec: 45 },
      ],
    };
    const round = (roundNumber: number, overrides: Partial<RoundLog> = {}): RoundLog => ({
      ...STAMPS,
      id: `round-${roundNumber}`,
      sessionExerciseId: bag.id,
      exerciseId: bag.exerciseId,
      roundNumber,
      workSec: 135,
      restSec: 30,
      restSkipped: false,
      completed: true,
      completedAt: '2026-09-01T09:30:00.000Z',
      ...overrides,
    });
    const { workout, deps } = await setUp([trigger], [bag]);
    for (const log of [
      round(1),
      round(2, { restSec: 5, restSkipped: true }),
      round(3, { workSec: 40, completed: false }),
    ]) {
      await workout.repos.roundLogRepo.create(log);
    }

    const next = await generateNextSession(trigger, workout.repos, deps);

    const [planned] = await exercisesOf(workout, next);
    expect(planned?.setTargets).toEqual([
      { setNumber: 1, targetWorkSec: 135, targetRestSec: 30 },
      // A skipped rest is a one-off: the planned rest stays.
      { setNumber: 2, targetWorkSec: 135, targetRestSec: 45 },
      // A round ended early is too: the planned work stays.
      { setNumber: 3, targetWorkSec: 120, targetRestSec: 30 },
      // Not logged: as it was planned.
      { setNumber: 4, targetWorkSec: 120, targetRestSec: 45 },
    ]);
  });

  // GT-187: an interval done for the first time has no times; they're picked on the card, saved as
  // the rounds' plan, logged — and next week starts from them, like any planned time.
  test('DoD: a first interval — times picked, rounds logged — plans next week with those times', async () => {
    await new SqliteExerciseRepository(db()).createCustom(HEAVY_BAG);
    const live = makeSession(1, { status: 'in_progress', completedAt: undefined });
    const bag: SessionExercise = {
      ...makeExercise(1, HEAVY_BAG.id, 1),
      setTargets: [{ setNumber: 1 }, { setNumber: 2 }],
    };
    const { workout, deps } = await setUp([live], [bag]);
    const ref = { sessionId: live.id, sessionExerciseId: bag.id };

    await setRoundTime(ref, 'work', [1, 2], 30, workout);
    await setRoundTime(ref, 'rest', [1, 2], 60, workout);
    await logRound({ ...ref, roundNumber: 1 }, { workSec: 30, restSec: 60 }, workout);
    // Round 2 ends early: the plan repeats, so no lever step muddies what is checked here.
    await workout.repos.roundLogRepo.create({
      ...STAMPS,
      id: 'round-2',
      sessionExerciseId: bag.id,
      exerciseId: bag.exerciseId,
      roundNumber: 2,
      workSec: 12,
      restSec: 60,
      restSkipped: false,
      completed: false,
      completedAt: '2026-09-01T09:30:00.000Z',
    });
    const trigger = makeSession(1);
    await workout.repos.sessionRepo.update(trigger);

    const next = await generateNextSession(trigger, workout.repos, deps);

    const [planned] = await exercisesOf(workout, next);
    expect(planned?.setTargets).toEqual([
      { setNumber: 1, targetWorkSec: 30, targetRestSec: 60 },
      { setNumber: 2, targetWorkSec: 30, targetRestSec: 60 },
    ]);
  });

  // GT-100: every round done → one step by the lever the cycle holds, not the library's default.
  test('an interval with every round done steps by the cycle’s lever', async () => {
    await new SqliteExerciseRepository(db()).createCustom(HEAVY_BAG);
    const trigger = makeSession(1);
    const bag: SessionExercise = {
      ...makeExercise(1, HEAVY_BAG.id, 1),
      setTargets: [
        { setNumber: 1, targetWorkSec: 120, targetRestSec: 45 },
        { setNumber: 2, targetWorkSec: 120, targetRestSec: 45 },
      ],
    };
    const { workout, deps } = await setUp([trigger], [bag]);
    // The library says `rest` by 15 s; the cycle changed it to `workTime` by 10 s.
    await deps.mesocycleRepo.update({
      ...mesocycle,
      exerciseSettings: {
        [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG, rounds: 2, lever: 'workTime', stepSec: 10 },
      },
    });
    for (const roundNumber of [1, 2]) {
      await workout.repos.roundLogRepo.create({
        ...STAMPS,
        id: `round-${roundNumber}`,
        sessionExerciseId: bag.id,
        exerciseId: bag.exerciseId,
        roundNumber,
        workSec: 120,
        restSec: 45,
        restSkipped: false,
        completed: true,
        completedAt: '2026-09-01T09:30:00.000Z',
      });
    }

    const next = await generateNextSession(trigger, workout.repos, deps);

    const [planned] = await exercisesOf(workout, next);
    expect(planned?.setTargets).toEqual([
      { setNumber: 1, targetWorkSec: 130, targetRestSec: 45 },
      { setNumber: 2, targetWorkSec: 130, targetRestSec: 45 },
    ]);
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
});
