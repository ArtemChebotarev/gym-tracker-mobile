import type { Exercise } from '@domain/catalog';
import { toExerciseId } from '@domain/catalog';
import { isConflictError, isNotFoundError } from '@domain/errors';
import type { SetLog } from '@domain/execution';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemorySetLogRepository } from '@storage/setLogRepository';
import { InMemoryStore } from '@storage/store';
import {
  createCustomExercise,
  hideExercise,
  listExerciseGroups,
  listExercisesByIds,
  updateCustomExercise,
} from '@usecases/exerciseLibrary';
import { ANY_STAMPS, STAMPS } from '../fixtures/stamps';

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
  const store = new InMemoryStore();
  return {
    exerciseRepo: new InMemoryExerciseRepository(store),
    setLogRepo: new InMemorySetLogRepository(store),
  };
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

    const created = await createCustomExercise({ name: '  Garage Press  ', muscleGroup: 'chest' }, deps);

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
    const created = await createCustomExercise({ name: 'Garage Press', muscleGroup: 'chest' }, deps);

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
      { id: created.id, name: created.name, muscleGroup: created.muscleGroup, equipment: 'barbell' },
      deps,
    );

    expect(updated.equipment).toBe('barbell');
  });

  test('rejects editing a catalog exercise', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog(1, [makeExercise({ source: 'catalog' })]);

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
    await deps.exerciseRepo.seedCatalog(1, [makeExercise({ source: 'catalog' })]);

    const hidden = await hideExercise(toExerciseId('exercise-bench-press'), deps);

    expect(hidden.isHidden).toBe(true);
  });

  test('is idempotent for an already-hidden exercise', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog(1, [makeExercise({ source: 'catalog', isHidden: true })]);

    const result = await hideExercise(toExerciseId('exercise-bench-press'), deps);

    expect(result.isHidden).toBe(true);
  });

  test('rejects an unknown exercise id', async () => {
    const deps = makeDeps();

    await expectRejectsWithKind(hideExercise(toExerciseId('does-not-exist'), deps), isNotFoundError);
  });
});

describe('listExerciseGroups', () => {
  test('never includes a hidden exercise, under any filter combination', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog(1, [makeExercise({ isHidden: true })]);

    await expect(listExerciseGroups({}, deps)).resolves.toEqual([]);
    await expect(listExerciseGroups({ search: 'bench' }, deps)).resolves.toEqual([]);
    await expect(listExerciseGroups({ muscleGroups: ['chest'] }, deps)).resolves.toEqual([]);
    await expect(listExerciseGroups({ performedOnly: false }, deps)).resolves.toEqual([]);
  });

  test('omits groups left with no matching exercises', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog(1, [
      makeExercise({ id: toExerciseId('e-chest'), muscleGroup: 'chest' }),
      makeExercise({ id: toExerciseId('e-back'), muscleGroup: 'back', isHidden: true }),
    ]);

    const groups = await listExerciseGroups({}, deps);

    expect(groups.map((group) => group.muscleGroup)).toEqual(['chest']);
  });

  test('search is case-insensitive', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog(1, [makeExercise({ name: 'Incline Dumbbell Press' })]);

    const groups = await listExerciseGroups({ search: 'DUMBBELL' }, deps);

    expect(groups[0]?.entries).toHaveLength(1);
  });

  test('performedOnly keeps only exercises with a logged set', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog(1, [
      makeExercise({ id: toExerciseId('e-performed') }),
      makeExercise({ id: toExerciseId('e-never'), name: 'Never Done' }),
    ]);
    await deps.setLogRepo.create(makeSetLog({ exerciseId: 'e-performed' }));

    const groups = await listExerciseGroups({ performedOnly: true }, deps);

    expect(groups[0]?.entries.map((entry) => entry.exercise.id)).toEqual(['e-performed']);
  });

  test('attaches each exercise\'s last set log for the row caption', async () => {
    const deps = makeDeps();
    await deps.exerciseRepo.seedCatalog(1, [makeExercise()]);
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
    const legPress = makeExercise({ id: toExerciseId('e-leg-press'), name: 'Leg Press', muscleGroup: 'quads' });
    await deps.exerciseRepo.seedCatalog(1, [benchPress, legPress]);

    const found = await listExercisesByIds(
      [legPress.id, toExerciseId('e-missing'), benchPress.id],
      deps,
    );

    expect(found).toEqual(expect.arrayContaining([benchPress, legPress]));
    expect(found).toHaveLength(2);
  });
});
