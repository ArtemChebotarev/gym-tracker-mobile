import { isConflictError, isNotFoundError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { archiveMesocycle, deleteMesocycle, listMesocycles } from '@usecases/mesocycleList';
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
    weightUnit: 'kg',
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

describe('deleteMesocycle', () => {
  test('deletes a planned mesocycle', async () => {
    const deps = makeDeps();
    await deps.mesocycleRepo.create(makeMesocycle({ id: 'p' }));

    await deleteMesocycle('p', deps);

    await expect(deps.mesocycleRepo.getById('p')).resolves.toBeNull();
  });

  // GT-268: a finished block can go too, history and all — what goes with it is the repository's
  // cascade (`deleteWithChildren`, mesocycleContract / exerciseHistoryContract).
  test.each(['completed', 'abandoned'] as const)('deletes a %s mesocycle', async (status) => {
    const deps = makeDeps();
    await deps.mesocycleRepo.create(makeMesocycle({ id: 'f', status }));

    await deleteMesocycle('f', deps);

    await expect(deps.mesocycleRepo.getById('f')).resolves.toBeNull();
  });

  test('deletes an archived block too', async () => {
    const deps = makeDeps();
    await deps.mesocycleRepo.create(
      makeMesocycle({ id: 'f', status: 'completed', archivedAt: '2026-09-25T10:00:00.000Z' }),
    );

    await deleteMesocycle('f', deps);

    await expect(deps.mesocycleRepo.getById('f')).resolves.toBeNull();
  });

  test('refuses to delete the active mesocycle and deletes nothing', async () => {
    const deps = makeDeps();
    await deps.mesocycleRepo.create(makeMesocycle({ id: 'a', status: 'active' }));

    const error = await deleteMesocycle('a', deps).catch((e: unknown) => e);

    expect(isConflictError(error)).toBe(true);
    await expect(deps.mesocycleRepo.getById('a')).resolves.not.toBeNull();
  });

  test('rejects an unknown id with NotFoundError', async () => {
    const error = await deleteMesocycle('missing', makeDeps()).catch((e: unknown) => e);

    expect(isNotFoundError(error)).toBe(true);
  });
});

describe('archiveMesocycle', () => {
  const NOW = '2026-09-25T10:00:00.000Z';

  test('stamps archivedAt on a finished block, leaving it otherwise untouched', async () => {
    const deps = makeDeps();
    const stored = await deps.mesocycleRepo.create(
      makeMesocycle({ id: 'c', status: 'completed', completedAt: '2026-09-20T08:00:00.000Z' }),
    );

    const archived = await archiveMesocycle('c', deps, NOW);

    expect(archived).toEqual({ ...stored, archivedAt: NOW, updatedAt: archived.updatedAt });
    await expect(deps.mesocycleRepo.getById('c')).resolves.toEqual(archived);
  });

  test('archives a stopped block too — both ways out of a block leave one to hide', async () => {
    const deps = makeDeps();
    await deps.mesocycleRepo.create(makeMesocycle({ id: 'a', status: 'abandoned' }));

    await expect(archiveMesocycle('a', deps, NOW)).resolves.toMatchObject({
      status: 'abandoned',
      archivedAt: NOW,
    });
  });

  test('is a soft delete: the row stays and listMesocycles still returns it', async () => {
    const deps = makeDeps();
    await deps.mesocycleRepo.create(makeMesocycle({ id: 'c', status: 'completed' }));

    await archiveMesocycle('c', deps, NOW);

    // Hiding is the screen's job (`finishedMesocyclesNewestFirst`) — storage keeps everything.
    await expect(listMesocycles(deps)).resolves.toHaveLength(1);
  });

  test.each(['planned', 'active'] as const)(
    'refuses a %s block and writes nothing',
    async (status) => {
      const deps = makeDeps();
      const stored = await deps.mesocycleRepo.create(makeMesocycle({ id: 'm', status }));

      const error = await archiveMesocycle('m', deps, NOW).catch((e: unknown) => e);

      expect(isConflictError(error)).toBe(true);
      await expect(deps.mesocycleRepo.getById('m')).resolves.toEqual(stored);
    },
  );

  test('refuses a second archive, so the original date survives', async () => {
    const deps = makeDeps();
    await deps.mesocycleRepo.create(makeMesocycle({ id: 'c', status: 'completed' }));
    await archiveMesocycle('c', deps, NOW);

    const error = await archiveMesocycle('c', deps, '2026-10-01T10:00:00.000Z').catch(
      (e: unknown) => e,
    );

    expect(isConflictError(error)).toBe(true);
    await expect(deps.mesocycleRepo.getById('c')).resolves.toMatchObject({ archivedAt: NOW });
  });

  test('rejects an unknown id with a NotFoundError', async () => {
    const deps = makeDeps();

    const error = await archiveMesocycle('missing', deps, NOW).catch((e: unknown) => e);

    expect(isNotFoundError(error)).toBe(true);
  });
});
