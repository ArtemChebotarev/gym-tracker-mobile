import { type Equipment, type MuscleGroup, toExerciseId } from '@domain/catalog';
import { NotFoundError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { InMemorySessionRepository } from '@storage/session';
import { InMemorySessionTreeRepository } from '@storage/sessionTree';
import { InMemoryStore } from '@storage/store';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';
import { skipExercise } from '@usecases/exerciseSkipping';
import { moveExercise } from '@usecases/exerciseReorder';
import { logSet, unlogSet } from '@usecases/setLogging';
import { addSet } from '@usecases/setRows';
import {
  getWorkoutSession,
  getWorkoutSlot,
  type WorkoutSessionDeps,
} from '@usecases/workoutSession';
import { STAMPS } from '../fixtures/stamps';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const NOW = '2026-09-18T11:00:00.000Z';

const mesocycle: Mesocycle = {
  ...STAMPS,
  id: 'meso',
  name: 'Upper/lower',
  lengthWeeks: 4,
  daysPerWeek: 2,
  startDate: '2026-09-01T08:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  createdAt: '2026-09-01T08:00:00.000Z',
};

const CATALOG: [string, string, MuscleGroup, Equipment | undefined][] = [
  ['bench', 'Bench press', 'chest', 'barbell'],
  ['row', 'Cable row', 'back', 'cable'],
  ['squat', 'Back squat', 'quads', 'barbell'],
  ['curl', 'Leg curl', 'hamstrings', undefined],
];

function slotSession(week: number, day: number, overrides: Partial<Session> = {}): Session {
  return {
    ...STAMPS,
    id: `w${week}d${day}`,
    mesoId: 'meso',
    weekNumber: week,
    dayNumber: day,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'planned',
    ...overrides,
  };
}

function planned(
  sessionId: string,
  exerciseId: string,
  order: number,
  targetReps: (number | undefined)[],
  overrides: Partial<SessionExercise> = {},
): SessionExercise {
  return {
    ...STAMPS,
    id: `${sessionId}-${exerciseId}`,
    sessionId,
    exerciseId,
    order,
    setTargets: targetReps.map((reps, index) =>
      reps === undefined
        ? { setNumber: index + 1, suggestedWeight: 60 }
        : { setNumber: index + 1, targetReps: reps, suggestedWeight: 60 },
    ),
    targetRir: 2,
    status: 'planned',
    ...overrides,
  };
}

function logOf(sessionExercise: SessionExercise, setNumber: number, reps: number): SetLog {
  return {
    ...STAMPS,
    id: `${sessionExercise.id}-log-${setNumber}`,
    sessionExerciseId: sessionExercise.id,
    exerciseId: sessionExercise.exerciseId,
    setNumber,
    weight: 60,
    reps,
    completedAt: NOW,
  };
}

// Week 1 is done; week 2 day 1 is in progress, week 2 day 2 is ready and gained a leg curl.
const w1d1 = slotSession(1, 1, { status: 'completed', completedAt: '2026-09-01T10:00:00.000Z' });
const w1d2 = slotSession(1, 2, { status: 'completed', completedAt: '2026-09-03T10:00:00.000Z' });
const w2d1 = slotSession(2, 1, { status: 'in_progress', startedAt: '2026-09-18T10:00:00.000Z' });
const w2d2 = slotSession(2, 2);

const w1Bench = planned('w1d1', 'bench', 1, [10, 10], { status: 'completed' });
const w1Squat = planned('w1d2', 'squat', 1, [8], { status: 'completed' });
const bench = planned('w2d1', 'bench', 1, [11, 10, 9]);
const row = planned('w2d1', 'row', 2, [undefined, undefined]);
const w2Squat = planned('w2d2', 'squat', 1, [9]);
const w2Curl = planned('w2d2', 'curl', 2, [12, 12]);

type Setup = { sessions?: Session[]; exercises?: SessionExercise[]; logs?: SetLog[] };

async function setUp(setup: Setup = {}) {
  const store = new InMemoryStore();
  await new InMemoryMesocycleRepository(store).create(mesocycle);
  const catalog = new InMemoryExerciseRepository(store);
  for (const [id, name, muscleGroup, equipment] of CATALOG) {
    await catalog.createCustom({
      id: toExerciseId(id),
      name,
      muscleGroup,
      source: 'catalog',
      isHidden: false,
      ...(equipment ? { equipment } : {}),
    });
  }
  const workout = createInMemoryWorkoutStore(store);
  await workout.repos.sessionRepo.createMany(setup.sessions ?? [w1d1, w1d2, w2d1, w2d2]);
  await workout.repos.sessionExerciseRepo.createMany(
    setup.exercises ?? [w1Bench, w1Squat, bench, row, w2Squat, w2Curl],
  );
  for (const log of setup.logs ?? [logOf(w1Bench, 1, 10), logOf(w1Squat, 1, 8)]) {
    await workout.repos.setLogRepo.create(log);
  }
  return { store, workout, deps: depsOver(store) };
}

function depsOver(store: InMemoryStore): WorkoutSessionDeps {
  return {
    sessionTreeRepo: new InMemorySessionTreeRepository(store),
    sessionRepo: new InMemorySessionRepository(store),
  };
}

describe('getWorkoutSession — live', () => {
  test('maps header, exercises, rows and flags of a session in progress', async () => {
    const { deps } = await setUp({
      logs: [logOf(bench, 1, 12), logOf(bench, 2, 10)],
    });

    const model = await getWorkoutSession('w2d1', deps);

    expect(model.mode).toBe('live');
    expect(model.sessionId).toBe('w2d1');
    expect(model.header).toEqual({
      weekNumber: 2,
      dayNumber: 1,
      date: '2026-09-18T10:00:00.000Z',
      mesocycleName: 'Upper/lower',
      isDeload: false,
      isCompleted: false,
    });
    expect(model.progress).toBeCloseTo(2 / 5);
    expect(model.showFinish).toBe(false);
    // A set is logged, but an exercise is left to do — Skip workout skips it.
    expect(model.actions).toEqual({
      canAddExercise: true,
      canSkipWorkout: true,
      canStopMesocycle: true,
    });

    const [benchCard, rowCard] = model.exercises;
    expect(benchCard).toMatchObject({
      sessionExerciseId: 'w2d1-bench',
      name: 'Bench press',
      muscleGroup: 'chest',
      equipment: 'barbell',
      targetRir: 2,
      status: 'planned',
      plannedSetCount: 3,
      loggedSetCount: 2,
      hasLoggedSets: true,
    });
    expect(benchCard?.rows).toEqual([
      {
        setNumber: 1,
        targetReps: 11,
        suggestedWeight: 60,
        log: { weight: 60, reps: 12 },
        indicator: { kind: 'over', diff: 1 },
        isFirstUnlogged: false,
      },
      {
        setNumber: 2,
        targetReps: 10,
        suggestedWeight: 60,
        log: { weight: 60, reps: 10 },
        indicator: { kind: 'hit' },
        isFirstUnlogged: false,
      },
      { setNumber: 3, targetReps: 9, suggestedWeight: 60, isFirstUnlogged: true },
    ]);
    expect(rowCard?.equipment).toBe('cable');
    expect(rowCard?.rows[0]).toEqual({ setNumber: 1, suggestedWeight: 60, isFirstUnlogged: true });
    expect(rowCard?.rows[1]?.isFirstUnlogged).toBe(false);
  });

  test('exercise menu flags follow position and row count', async () => {
    const { deps } = await setUp({
      exercises: [bench, planned('w2d1', 'row', 2, [10])],
    });

    const [first, last] = (await getWorkoutSession('w2d1', deps)).exercises;

    expect(first?.actions).toEqual({
      canReplace: true,
      canAddSet: true,
      canRemoveLastSet: true,
      canMoveUp: false,
      canMoveDown: true,
      canSkip: true,
      canUnskip: false,
      canDelete: true,
    });
    expect(last?.actions).toMatchObject({
      canRemoveLastSet: false,
      canMoveUp: true,
      canMoveDown: false,
    });
  });

  test('DoD: Skip and Delete are both available once the exercise has a SetLog', async () => {
    const { deps } = await setUp({ logs: [logOf(bench, 1, 11)] });

    const [benchCard] = (await getWorkoutSession('w2d1', deps)).exercises;

    expect(benchCard?.hasLoggedSets).toBe(true);
    expect(benchCard?.actions.canSkip).toBe(true);
    expect(benchCard?.actions.canDelete).toBe(true);
  });

  test('a skipped exercise keeps every row and flags the unlogged ones as skipped', async () => {
    const { deps } = await setUp({
      exercises: [{ ...bench, status: 'skipped' }, row],
      logs: [logOf(bench, 1, 11)],
    });

    const [benchCard] = (await getWorkoutSession('w2d1', deps)).exercises;

    expect(benchCard?.rows.map((setRow) => [setRow.setNumber, setRow.isSkipped ?? false])).toEqual([
      [1, false],
      [2, true],
      [3, true],
    ]);
    expect(benchCard?.rows.some((setRow) => setRow.isFirstUnlogged)).toBe(false);
    expect(benchCard?.actions).toMatchObject({ canSkip: false, canUnskip: true, canDelete: true });
  });

  test('a skipped exercise with every row logged has no skipped rows', async () => {
    const { deps } = await setUp({
      exercises: [{ ...row, status: 'skipped' }],
      logs: [logOf(row, 1, 10), logOf(row, 2, 10)],
    });

    const [rowCard] = (await getWorkoutSession('w2d1', deps)).exercises;

    expect(rowCard?.rows).toHaveLength(2);
    expect(rowCard?.rows.some((setRow) => setRow.isSkipped)).toBe(false);
  });

  test('a ready session not started yet has no date and can be skipped', async () => {
    const { deps } = await setUp();

    const model = await getWorkoutSession('w2d2', deps);

    expect(model.mode).toBe('live');
    expect(model.header.date).toBeUndefined();
    expect(model.actions.canSkipWorkout).toBe(true);
    expect(model.progress).toBe(0);
  });

  test('nothing can be added to a deload session', async () => {
    const { deps } = await setUp({
      sessions: [slotSession(4, 1, { isDeload: true })],
      exercises: [planned('w4d1', 'bench', 1, [undefined])],
      logs: [],
    });

    const model = await getWorkoutSession('w4d1', deps);

    expect(model.header.isDeload).toBe(true);
    expect(model.actions.canAddExercise).toBe(false);
  });

  test("deload rows carry last working week's actual reps of the same exercise and set", async () => {
    const w3d1 = slotSession(3, 1, {
      status: 'completed',
      completedAt: '2026-09-15T10:00:00.000Z',
    });
    const w3Bench = planned('w3d1', 'bench', 1, [10, 10, 10], { status: 'completed' });
    const w3Row = planned('w3d1', 'row', 2, [10], { status: 'completed' });
    const deloadBench = planned('w4d1', 'bench', 1, [undefined, undefined]);
    const deloadCurl = planned('w4d1', 'curl', 2, [undefined]);
    const { deps } = await setUp({
      sessions: [w3d1, slotSession(4, 1, { isDeload: true, sourceSessionId: 'w3d1' })],
      exercises: [w3Bench, w3Row, deloadBench, deloadCurl],
      logs: [logOf(w3Bench, 1, 11), logOf(w3Bench, 3, 8), logOf(w3Row, 1, 12)],
    });

    const [benchModel, curlModel] = (await getWorkoutSession('w4d1', deps)).exercises;

    // Set 2 wasn't logged last week — no guide for it rather than a guess.
    expect(benchModel?.rows.map((r) => r.referenceReps)).toEqual([11, undefined]);
    // The curl wasn't in last week's session at all.
    expect(curlModel?.rows.map((r) => r.referenceReps)).toEqual([undefined]);
  });

  test('rows of a session that is not a deload carry no reference reps', async () => {
    const { deps } = await setUp();

    const model = await getWorkoutSession('w2d1', deps);

    expect(model.exercises.flatMap((e) => e.rows).some((r) => 'referenceReps' in r)).toBe(false);
  });
});

describe('getWorkoutSession — Finish', () => {
  test('DoD: Finish shows only once every exercise is completed or skipped', async () => {
    const notYet = await setUp({
      exercises: [{ ...bench, status: 'completed' }, row],
    });
    const notYetModel = await getWorkoutSession('w2d1', notYet.deps);
    expect(notYetModel.showFinish).toBe(false);
    expect(notYetModel.actions.canSkipWorkout).toBe(true);

    const done = await setUp({
      exercises: [
        { ...bench, status: 'completed' },
        { ...row, status: 'skipped' },
      ],
    });
    const doneModel = await getWorkoutSession('w2d1', done.deps);
    expect(doneModel.showFinish).toBe(true);
    // Nothing left to skip: Skip workout gives way to Finish.
    expect(doneModel.actions.canSkipWorkout).toBe(false);
  });

  test('DoD: Finish never shows outside live mode', async () => {
    const { deps } = await setUp();

    expect((await getWorkoutSession('w1d1', deps)).showFinish).toBe(false);
  });
});

describe('getWorkoutSession — Finish mesocycle', () => {
  test('DoD: a read-only session with nothing left in the block offers to finish it (052)', async () => {
    const { deps } = await setUp({
      sessions: [w1d1, { ...w1d2, status: 'skipped' }],
      exercises: [w1Bench, w1Squat],
    });

    const model = await getWorkoutSession('w1d1', deps);

    expect(model.showFinishMesocycle).toBe(true);
    // Nothing to move on to — Finish mesocycle stands where `Next workout` would.
    expect(model.nextSessionId).toBeUndefined();
  });

  test('not while a workout is still to be trained', async () => {
    const { deps } = await setUp();

    const model = await getWorkoutSession('w1d1', deps);

    expect(model.showFinishMesocycle).toBe(false);
    expect(model.nextSessionId).toBe('w2d1');
  });

  test('never from a live session — that session is itself what is left', async () => {
    const { deps } = await setUp({ sessions: [w2d1], exercises: [bench, row] });

    expect((await getWorkoutSession('w2d1', deps)).showFinishMesocycle).toBe(false);
  });

  test('not once the block itself is closed — and Stop mesocycle goes with it', async () => {
    const { store, deps } = await setUp({
      sessions: [w1d1, { ...w1d2, status: 'skipped' }],
      exercises: [w1Bench, w1Squat],
    });
    const mesocycleRepo = new InMemoryMesocycleRepository(store);
    await mesocycleRepo.update({ ...mesocycle, status: 'completed', completedAt: NOW });

    const model = await getWorkoutSession('w1d1', deps);

    expect(model.showFinishMesocycle).toBe(false);
    expect(model.actions.canStopMesocycle).toBe(false);
  });
});

describe('getWorkoutSession — read-only', () => {
  test('a completed session is full, dated by completedAt, checked, with no actions', async () => {
    const { deps } = await setUp();

    const model = await getWorkoutSession('w1d1', deps);

    expect(model.mode).toBe('readonly');
    expect(model.header).toMatchObject({ date: '2026-09-01T10:00:00.000Z', isCompleted: true });
    expect(model.progress).toBe(1);
    expect(model.actions).toEqual({
      canAddExercise: false,
      canSkipWorkout: false,
      canStopMesocycle: true,
    });
    expect(model.exercises[0]?.actions).toEqual({
      canReplace: false,
      canAddSet: false,
      canRemoveLastSet: false,
      canMoveUp: false,
      canMoveDown: false,
      canSkip: false,
      canUnskip: false,
      canDelete: false,
    });
    expect(model.exercises[0]?.rows.every((setRow) => !setRow.isFirstUnlogged)).toBe(true);
  });

  test('points Next workout at the session in progress, else the earliest ready one', async () => {
    const { deps } = await setUp();
    expect((await getWorkoutSession('w1d1', deps)).nextSessionId).toBe('w2d1');

    const noneInProgress = await setUp({
      sessions: [w1d1, w1d2, slotSession(2, 2), slotSession(2, 1)],
      exercises: [w1Bench, w1Squat, bench, w2Squat],
    });
    expect((await getWorkoutSession('w1d2', noneInProgress.deps)).nextSessionId).toBe('w2d1');
  });

  test('no Next workout once nothing is left, nor outside read-only mode', async () => {
    const done = await setUp({ sessions: [w1d1, w1d2], exercises: [w1Bench, w1Squat] });
    expect((await getWorkoutSession('w1d2', done.deps)).nextSessionId).toBeUndefined();

    const { deps } = await setUp();
    expect((await getWorkoutSession('w2d2', deps)).nextSessionId).toBeUndefined();
  });

  test('a skipped session is read-only without the check', async () => {
    const { deps } = await setUp({
      sessions: [slotSession(2, 2, { status: 'skipped' })],
      exercises: [w2Squat],
      logs: [],
    });

    const model = await getWorkoutSession('w2d2', deps);

    expect(model.mode).toBe('readonly');
    expect(model.header.isCompleted).toBe(false);
    expect(model.actions.canSkipWorkout).toBe(false);
  });
});

describe('getWorkoutSession — preview', () => {
  test('DoD: an awaiting_source session previews the latest programmed session of its day', async () => {
    const { deps } = await setUp({
      sessions: [
        w1d1,
        w1d2,
        w2d1,
        slotSession(2, 2, { status: 'completed', completedAt: NOW }),
        slotSession(3, 2, { prescriptionStatus: 'awaiting_source' }),
      ],
    });

    const model = await getWorkoutSession('w3d2', deps);

    expect(model.mode).toBe('preview');
    expect(model.sessionId).toBe('w3d2');
    expect(model.header).toEqual({
      weekNumber: 3,
      dayNumber: 2,
      mesocycleName: 'Upper/lower',
      isDeload: false,
      isCompleted: false,
    });
    expect(model.exercises.map((exercise) => exercise.name)).toEqual(['Back squat', 'Leg curl']);
    expect(model.unlocksAfter).toEqual({ weekNumber: 2, dayNumber: 2 });
    expect(model.showFinish).toBe(false);
    expect(model.progress).toBe(0);
  });

  test('preview exercises carry no rows, targets or actions', async () => {
    const { deps } = await setUp();

    const [squat, curl] = (
      await getWorkoutSlot({ mesoId: 'meso', weekNumber: 3, dayNumber: 2 }, deps)
    ).exercises;

    expect(squat).toEqual({
      sessionExerciseId: 'w2d2-squat',
      exerciseId: 'squat',
      name: 'Back squat',
      muscleGroup: 'quads',
      equipment: 'barbell',
      status: 'planned',
      rows: [],
      plannedSetCount: 0,
      loggedSetCount: 0,
      hasLoggedSets: false,
      actions: expect.objectContaining({ canSkip: false, canDelete: false }),
    });
    expect(squat?.targetRir).toBeUndefined();
    expect(curl?.equipment).toBeUndefined();
  });
});

describe('getWorkoutSlot', () => {
  test('DoD: a day with no session yet previews the latest session of the same day', async () => {
    const { deps } = await setUp();

    const model = await getWorkoutSlot({ mesoId: 'meso', weekNumber: 3, dayNumber: 2 }, deps);

    expect(model.mode).toBe('preview');
    expect(model.sessionId).toBeUndefined();
    expect(model.exercises.map((exercise) => exercise.sessionExerciseId)).toEqual([
      'w2d2-squat',
      'w2d2-curl',
    ]);
    expect(model.unlocksAfter).toEqual({ weekNumber: 2, dayNumber: 2 });
  });

  test('the deload week preview is flagged as deload', async () => {
    const { deps } = await setUp();

    const model = await getWorkoutSlot({ mesoId: 'meso', weekNumber: 4, dayNumber: 1 }, deps);

    expect(model.header.isDeload).toBe(true);
    expect(model.exercises.map((exercise) => exercise.exerciseId)).toEqual(['bench', 'row']);
  });

  test('a day whose session exists opens that session', async () => {
    const { deps } = await setUp();

    const model = await getWorkoutSlot({ mesoId: 'meso', weekNumber: 2, dayNumber: 1 }, deps);

    expect(model.mode).toBe('live');
    expect(model.sessionId).toBe('w2d1');
  });
});

describe('errors', () => {
  test('rejects with NotFoundError for a missing session', async () => {
    const { deps } = await setUp();

    await expect(getWorkoutSession('missing', deps)).rejects.toBeInstanceOf(NotFoundError);
  });

  test('rejects with NotFoundError when a preview has nothing to show', async () => {
    const { deps } = await setUp();

    await expect(
      getWorkoutSlot({ mesoId: 'meso', weekNumber: 3, dayNumber: 5 }, deps),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('storage is the source of truth', () => {
  test('DoD: reloading after mutations restores the same state (simulated restart)', async () => {
    const { store, workout, deps } = await setUp();
    const benchRef = { sessionId: 'w2d1', sessionExerciseId: 'w2d1-bench' };
    const rowRef = { sessionId: 'w2d1', sessionExerciseId: 'w2d1-row' };

    await logSet({ ...benchRef, setNumber: 1 }, { weight: 62.5, reps: 11 }, workout, NOW);
    await logSet({ ...benchRef, setNumber: 2 }, { weight: 62.5, reps: 9 }, workout, NOW);
    await unlogSet({ ...benchRef, setNumber: 2 }, workout);
    await addSet(benchRef, workout);
    await logSet({ ...rowRef, setNumber: 1 }, { weight: 50, reps: 12 }, workout, NOW);
    await skipExercise(rowRef, workout);
    await moveExercise(rowRef, 'up', workout);

    const before = await getWorkoutSession('w2d1', deps);
    // A restart drops every in-memory object but storage: fresh repositories over the same data.
    const after = await getWorkoutSession('w2d1', depsOver(store));

    expect(after).toEqual(before);
    expect(after.exercises.map((exercise) => exercise.sessionExerciseId)).toEqual([
      'w2d1-row',
      'w2d1-bench',
    ]);
    const [rowCard, benchCard] = after.exercises;
    expect(rowCard).toMatchObject({ status: 'skipped', loggedSetCount: 1 });
    expect(rowCard?.rows.map((setRow) => setRow.isSkipped ?? false)).toEqual([false, true]);
    expect(benchCard?.plannedSetCount).toBe(4);
    expect(benchCard?.rows.map((setRow) => setRow.log?.weight)).toEqual([
      62.5,
      undefined,
      undefined,
      undefined,
    ]);
    expect(benchCard?.rows.find((setRow) => setRow.isFirstUnlogged)?.setNumber).toBe(2);
    expect(after.progress).toBeCloseTo((1 + 2) / 6);
  });
});

describe('getWorkoutSession — weight hints', () => {
  const hinted = (sessionId: string, status: SessionExercise['status'] = 'planned') =>
    planned(sessionId, 'bench', 1, [30, 30, 5], {
      status,
      setTargets: [
        { setNumber: 1, targetReps: 30, suggestedWeight: 1, weightHint: 'increase' },
        { setNumber: 2, targetReps: 30, suggestedWeight: 1, weightHint: 'increase' },
        { setNumber: 3, targetReps: 5, suggestedWeight: 13, weightHint: 'decrease' },
      ],
    });

  test("live: each direction once, with the mesocycle's rep bounds", async () => {
    const { deps } = await setUp({ exercises: [hinted('w2d1'), row], logs: [] });

    const model = await getWorkoutSession('w2d1', deps);

    expect(model.exercises[0]?.weightHints).toEqual([
      { direction: 'increase', reps: defaultProgressionSettings.maxReps },
      { direction: 'decrease', reps: defaultProgressionSettings.minReps },
    ]);
    expect(model.exercises[1]).not.toHaveProperty('weightHints');
  });

  test('none on a skipped exercise', async () => {
    const { deps } = await setUp({ exercises: [hinted('w2d1', 'skipped'), row], logs: [] });

    const model = await getWorkoutSession('w2d1', deps);

    expect(model.exercises[0]).not.toHaveProperty('weightHints');
  });

  test('none outside live mode', async () => {
    const { deps } = await setUp({ exercises: [hinted('w1d1', 'completed')], logs: [] });

    const model = await getWorkoutSession('w1d1', deps);

    expect(model.mode).toBe('readonly');
    expect(model.exercises[0]).not.toHaveProperty('weightHints');
  });
});

describe('the block body weight on the workout model (task 105)', () => {
  test('DoD: the model carries the mesocycle body weight, so the rows can fill it in', async () => {
    const { store, deps } = await setUp();
    await new InMemoryMesocycleRepository(store).update({ ...mesocycle, bodyWeight: 80 });

    const model = await getWorkoutSession('w2d1', deps);

    expect(model.bodyWeight).toBe(80);
  });

  test('absent until it has been asked for', async () => {
    const { deps } = await setUp();

    expect((await getWorkoutSession('w2d1', deps)).bodyWeight).toBeUndefined();
  });

  test('DoD: a logged set keeps the body weight it was logged with', async () => {
    const { store, deps } = await setUp({
      logs: [{ ...logOf(bench, 1, 12), weight: 10, bodyWeight: 80 }],
    });
    // The block weighs more today than when the set was logged (05, "История неизменяема").
    await new InMemoryMesocycleRepository(store).update({ ...mesocycle, bodyWeight: 82 });

    const model = await getWorkoutSession('w2d1', deps);

    expect(model.exercises[0]?.rows[0]?.log).toEqual({ weight: 10, reps: 12, bodyWeight: 80 });
  });
});
