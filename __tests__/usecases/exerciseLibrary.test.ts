import type { Exercise } from '@domain/catalog';
import { toExerciseId } from '@domain/catalog';
import { isConflictError, isNotFoundError } from '@domain/errors';
import type { IntervalConfig } from '@domain/exerciseConfig';
import { defaultExerciseConfig } from '@domain/exerciseConfigBuilders';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { SqliteExerciseRepository } from '@storage/sqlite/exerciseRepository';
import { SqliteRoundLogRepository } from '@storage/sqlite/roundLogRepository';
import { SqliteSessionExerciseRepository } from '@storage/sqlite/sessionExercise';
import { SqliteSessionRepository } from '@storage/sqlite/session';
import { SqliteSetLogRepository } from '@storage/sqlite/setLogRepository';
import {
  createCustomExercise,
  hideExercise,
  listExerciseGroups,
  listExercisesByIds,
  updateCustomExercise,
} from '@usecases/exerciseLibrary';
import { seedReferences } from '../fixtures/references';
import { ANY_STAMPS, STAMPS } from '../fixtures/stamps';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    ...STAMPS,
    id: toExerciseId('exercise-bench-press'),
    name: 'Bench Press',
    muscleGroup: 'chest',
    source: 'catalog',
    isHidden: false,
    ...overrides,
  };
}

function makeSetLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
    ...STAMPS,
    id: 'set-log-1',
    sessionExerciseId: 'session-exercise-1',
    exerciseId: 'exercise-bench-press',
    setNumber: 1,
    weight: 60,
    reps: 8,
    completedAt: '2026-08-26T08:00:00.000Z',
    ...overrides,
  };
}

function makeDeps() {
  const store = db();
  return {
    exerciseRepo: new SqliteExerciseRepository(store),
    setLogRepo: new SqliteSetLogRepository(store),
    roundLogRepo: new SqliteRoundLogRepository(store),
  };
}

/**
 * The session exercise every `makeSetLog` hangs off, with the session and the block above it. A
 * set log needs one to be writable at all (task 118), and which workout the sets were logged in
 * is not what any test here is about — only that they were logged.
 *
 * Call it after the test has seeded the exercises it asserts on: the references are filled in
 * only where nothing is there yet, so an exercise the test already created keeps its own name.
 */
async function seedLogHost(): Promise<void> {
  const session: Session = {
    ...STAMPS,
    id: 'session-1',
    mesoId: 'meso',
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'completed',
    completedAt: '2026-08-26T09:00:00.000Z',
  };
  const sessionExercise: SessionExercise = {
    ...STAMPS,
    id: 'session-exercise-1',
    sessionId: session.id,
    exerciseId: 'exercise-bench-press',
    order: 1,
    setTargets: [{ setNumber: 1 }],
    targetRir: 2,
    status: 'completed',
  };
  await seedReferences(db(), { sessions: [session], sessionExercises: [sessionExercise] });
  await new SqliteSessionRepository(db()).create(session);
  await new SqliteSessionExerciseRepository(db()).create(sessionExercise);
}

async function expectRejectsWithKind(
  promise: Promise<unknown>,
  isExpectedKind: (error: unknown) => boolean,
): Promise<void> {
  expect.assertions(1);
  try {
    await promise;
  } catch (error) {
    expect(isExpectedKind(error)).toBe(true);
  }
}

describe('createCustomExercise', () => {
  test('creates a custom exercise with a generated id and the system-assigned fields', async () => {
    const deps = makeDeps();

    const created = await createCustomExercise(
      { name: '  Garage Press  ', muscleGroup: 'chest' },
      deps,
    );

    expect(created.name).toBe('Garage Press');
    expect(created.muscleGroup).toBe('chest');
    expect(created.source).toBe('custom');
    expect(created.isHidden).toBe(false);
    expect(created.equipment).toBeUndefined();
    expect(created.id).toBeTruthy();
    await expect(deps.exerciseRepo.getById(created.id)).resolves.toEqual(created);
  });

  test('rejects a blank name', async () => {
    const deps = makeDeps();

    await expect(createCustomExercise({ name: '   ', muscleGroup: 'chest' }, deps)).rejects.toThrow(
      /Exercise name is required/,
    );
  });

  test('persists the given equipment when provided', async () => {
    const deps = makeDeps();

    const created = await createCustomExercise(
      { name: 'Garage Press', muscleGroup: 'chest', equipment: 'dumbbell' },
      deps,
    );

    expect(created.equipment).toBe('dumbbell');
  });

  test('rejects an unknown equipment value', async () => {
    const deps = makeDeps();

    await expect(
      createCustomExercise(
        { name: 'Garage Press', muscleGroup: 'chest', equipment: 'not-equipment' as never },
        deps,
      ),
    ).rejects.toThrow(/Unknown equipment/);
  });
});

describe('updateCustomExercise', () => {
  test('updates the name and muscle group of an existing custom exercise', async () => {
    const deps = makeDeps();
    const created = await createCustomExercise(
      { name: 'Garage Press', muscleGroup: 'chest' },
      deps,
    );

    const updated = await updateCustomExercise(
      { id: created.id, name: '  Renamed Press  ', muscleGroup: 'shoulders' },
      deps,
    );

    expect(updated).toEqual({
      ...created,
      ...ANY_STAMPS,
      name: 'Renamed Press',
      muscleGroup: 'shoulders',
    });
  });

  test('updates the equipment of an existing custom exercise', async () => {
    const deps = makeDeps();
    const created = await createCustomExercise(
      { name: 'Garage Press', muscleGroup: 'chest', equipment: 'dumbbell' },
      deps,
    );

    const updated = await updateCustomExercise(
      {
        id: created.id,
        name: created.name,
        muscleGroup: created.muscleGroup,
        equipment: 'barbell',
      },
      deps,
    );

    expect(updated.equipment).toBe('barbell');
  });

  test('rejects editing a catalog exercise', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog([makeExercise({ source: 'catalog' })]);

    const result = updateCustomExercise(
      { id: toExerciseId('exercise-bench-press'), name: 'New Name', muscleGroup: 'chest' },
      deps,
    );

    await expectRejectsWithKind(result, isConflictError);
  });

  test('rejects an unknown exercise id', async () => {
    const deps = makeDeps();

    const result = updateCustomExercise(
      { id: toExerciseId('does-not-exist'), name: 'New Name', muscleGroup: 'chest' },
      deps,
    );

    await expectRejectsWithKind(result, isNotFoundError);
  });
});

describe('hideExercise', () => {
  test('sets isHidden to true on a catalog exercise', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog([makeExercise({ source: 'catalog' })]);

    const hidden = await hideExercise(toExerciseId('exercise-bench-press'), deps);

    expect(hidden.isHidden).toBe(true);
  });

  test('is idempotent for an already-hidden exercise', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog([makeExercise({ source: 'catalog', isHidden: true })]);

    const result = await hideExercise(toExerciseId('exercise-bench-press'), deps);

    expect(result.isHidden).toBe(true);
  });

  test('rejects an unknown exercise id', async () => {
    const deps = makeDeps();

    await expectRejectsWithKind(
      hideExercise(toExerciseId('does-not-exist'), deps),
      isNotFoundError,
    );
  });
});

describe('listExerciseGroups', () => {
  test('never includes a hidden exercise, under any filter combination', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog([makeExercise({ isHidden: true })]);

    await expect(listExerciseGroups({}, deps)).resolves.toEqual([]);
    await expect(listExerciseGroups({ search: 'bench' }, deps)).resolves.toEqual([]);
    await expect(listExerciseGroups({ muscleGroups: ['chest'] }, deps)).resolves.toEqual([]);
    await expect(listExerciseGroups({ performedOnly: false }, deps)).resolves.toEqual([]);
  });

  test('omits groups left with no matching exercises', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog([
      makeExercise({ id: toExerciseId('e-chest'), muscleGroup: 'chest' }),
      makeExercise({ id: toExerciseId('e-back'), muscleGroup: 'back', isHidden: true }),
    ]);

    const groups = await listExerciseGroups({}, deps);

    expect(groups.map((group) => group.muscleGroup)).toEqual(['chest']);
  });

  test('search is case-insensitive', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog([makeExercise({ name: 'Incline Dumbbell Press' })]);

    const groups = await listExerciseGroups({ search: 'DUMBBELL' }, deps);

    expect(groups[0]?.entries).toHaveLength(1);
  });

  test('performedOnly keeps only exercises with a logged set', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog([
      makeExercise({ id: toExerciseId('e-performed') }),
      makeExercise({ id: toExerciseId('e-never'), name: 'Never Done' }),
    ]);
    await seedLogHost();
    await deps.setLogRepo.create(makeSetLog({ exerciseId: 'e-performed' }));

    const groups = await listExerciseGroups({ performedOnly: true }, deps);

    expect(groups[0]?.entries.map((entry) => entry.exercise.id)).toEqual(['e-performed']);
  });

  test("attaches each exercise's last set log for the row caption", async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog([makeExercise()]);
    await seedLogHost();
    const older = makeSetLog({ id: 'log-1', completedAt: '2026-08-01T08:00:00.000Z' });
    const newer = makeSetLog({ id: 'log-2', completedAt: '2026-08-26T08:00:00.000Z' });
    await deps.setLogRepo.create(older);
    await deps.setLogRepo.create(newer);

    const groups = await listExerciseGroups({}, deps);

    expect(groups[0]?.entries[0]?.lastSetLog).toEqual(newer);
  });
});

describe('listExercisesByIds', () => {
  test('resolves the requested ids and silently skips ones that do not exist', async () => {
    const deps = makeDeps();
    const benchPress = makeExercise({ id: toExerciseId('e-bench-press') });
    const legPress = makeExercise({
      id: toExerciseId('e-leg-press'),
      name: 'Leg Press',
      muscleGroup: 'quads',
    });
    await deps.exerciseRepo.seedCatalog([benchPress, legPress]);

    const found = await listExercisesByIds(
      [legPress.id, toExerciseId('e-missing'), benchPress.id],
      deps,
    );

    expect(found).toEqual(expect.arrayContaining([benchPress, legPress]));
    expect(found).toHaveLength(2);
  });
});

describe('hybrid exercise types', () => {
  test('create a power exercise with its type, a fullBody group and the default config', async () => {
    const deps = makeDeps();

    const created = await createCustomExercise(
      { name: 'Medball Slam', muscleGroup: 'fullBody', type: 'power' },
      deps,
    );

    const stored = await deps.exerciseRepo.getById(created.id);
    expect(stored).toMatchObject({
      type: 'power',
      muscleGroup: 'fullBody',
      config: { type: 'power', load: 'weight', restSec: 60, noHeavierAvailable: false },
    });
  });

  test('keep a strength exercise exactly as before — no type and no config on it', async () => {
    const deps = makeDeps();
    const created = await createCustomExercise(
      { name: 'Garage Press', muscleGroup: 'chest' },
      deps,
    );

    const stored = await deps.exerciseRepo.getById(created.id);

    expect(stored).not.toHaveProperty('type');
    expect(stored).not.toHaveProperty('config');
  });

  test('refuse a strength exercise filed under fullBody', async () => {
    await expect(
      createCustomExercise({ name: 'Press', muscleGroup: 'fullBody' }, makeDeps()),
    ).rejects.toThrow('needs a muscle group');
  });

  test('refuse a config that belongs to another type', async () => {
    await expect(
      createCustomExercise(
        {
          name: 'Heavy Bag',
          muscleGroup: 'fullBody',
          type: 'interval',
          config: { type: 'mobility', durationSec: 600 },
        },
        makeDeps(),
      ),
    ).rejects.toThrow('cannot carry a mobility config');
  });

  test('change the type of an exercise nothing has been logged for, taking the new defaults', async () => {
    const deps = makeDeps();
    const created = await createCustomExercise({ name: 'Heavy Bag', muscleGroup: 'back' }, deps);

    await updateCustomExercise(
      { id: created.id, name: 'Heavy Bag', muscleGroup: 'fullBody', type: 'interval' },
      deps,
    );

    expect(await deps.exerciseRepo.getById(created.id)).toMatchObject({
      type: 'interval',
      muscleGroup: 'fullBody',
      config: { type: 'interval', workSec: 120, lever: 'rest' },
    });
  });

  test('refuse to change the type of an exercise that has a logged set', async () => {
    const deps = makeDeps();
    const created = await createCustomExercise({ name: 'Slam', muscleGroup: 'back' }, deps);
    await seedLogHost();
    await deps.setLogRepo.create(makeSetLog({ exerciseId: created.id }));

    await expectRejectsWithKind(
      updateCustomExercise(
        { id: created.id, name: 'Slam', muscleGroup: 'fullBody', type: 'power' },
        deps,
      ),
      isConflictError,
    );
  });

  test('refuse to change the type of an interval exercise that has a logged round', async () => {
    const deps = makeDeps();
    const created = await createCustomExercise(
      { name: 'Heavy Bag', muscleGroup: 'fullBody', type: 'interval' },
      deps,
    );
    await seedLogHost();
    await deps.roundLogRepo.create({
      id: 'round-1',
      sessionExerciseId: 'session-exercise-1',
      exerciseId: created.id,
      roundNumber: 1,
      workSec: 120,
      restSec: 60,
      restSkipped: false,
      completed: true,
      completedAt: '2026-08-26T08:00:00.000Z',
    });

    await expectRejectsWithKind(
      updateCustomExercise(
        { id: created.id, name: 'Heavy Bag', muscleGroup: 'fullBody', type: 'mobility' },
        deps,
      ),
      isConflictError,
    );
  });

  test('keep the config of an exercise whose type is not changing, even with history', async () => {
    const deps = makeDeps();
    const created = await createCustomExercise(
      {
        name: 'Rope',
        muscleGroup: 'fullBody',
        type: 'interval',
        config: { ...(defaultExerciseConfig('interval') as IntervalConfig), workSec: 90 },
      },
      deps,
    );

    await updateCustomExercise(
      { id: created.id, name: 'Jump Rope', muscleGroup: 'fullBody' },
      deps,
    );

    expect(await deps.exerciseRepo.getById(created.id)).toMatchObject({
      name: 'Jump Rope',
      type: 'interval',
      config: { workSec: 90 },
    });
  });
});
