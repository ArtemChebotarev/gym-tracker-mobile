import { isConflictError, isNotFoundError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { deletePlannedMesocycle, listMesocycles } from '@usecases/mesocycleList';
import { STAMPS } from '../fixtures/stamps';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

function makeMesocycle(overrides: Partial<Mesocycle>): Mesocycle {
  return {
    ...STAMPS,
    id: 'meso',
    name: 'Meso',
    lengthWeeks: 5,
    daysPerWeek: 3,
    status: 'planned',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    createdAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  };
}

function makeDeps() {
  return { mesocycleRepo: new SqliteMesocycleRepository(db()) };
}

describe('listMesocycles', () => {
  test('returns every mesocycle regardless of status', async () => {
    const deps = makeDeps();
    await deps.mesocycleRepo.create(makeMesocycle({ id: 'p', status: 'planned' }));
    await deps.mesocycleRepo.create(makeMesocycle({ id: 'a', status: 'active' }));

    const result = await listMesocycles(deps);

    expect(result.map((m) => m.id).sort()).toEqual(['a', 'p']);
  });
});

describe('deletePlannedMesocycle', () => {
  test('deletes a planned mesocycle', async () => {
    const deps = makeDeps();
    await deps.mesocycleRepo.create(makeMesocycle({ id: 'p' }));

    await deletePlannedMesocycle('p', deps);

    await expect(deps.mesocycleRepo.getById('p')).resolves.toBeNull();
  });

  test('refuses to delete a mesocycle that is not planned', async () => {
    const deps = makeDeps();
    await deps.mesocycleRepo.create(makeMesocycle({ id: 'c', status: 'completed' }));

    const error = await deletePlannedMesocycle('c', deps).catch((e: unknown) => e);

    expect(isConflictError(error)).toBe(true);
    await expect(deps.mesocycleRepo.getById('c')).resolves.not.toBeNull();
  });

  test('rejects an unknown id with NotFoundError', async () => {
    const error = await deletePlannedMesocycle('missing', makeDeps()).catch((e: unknown) => e);

    expect(isNotFoundError(error)).toBe(true);
  });
});
