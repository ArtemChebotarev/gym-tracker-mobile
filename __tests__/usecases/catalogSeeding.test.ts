import { toExerciseId } from '@domain/catalog';
import { CATALOG_VERSION, EXERCISE_CATALOG } from '@domain/exerciseCatalog';
import type { Unsaved } from '@domain/timestamps';
import type { Exercise } from '@domain/catalog';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemorySettingsRepository } from '@storage/settings';
import { InMemoryStore } from '@storage/store';
import {
  seedExerciseCatalog,
  type CatalogRelease,
  type CatalogSeedingDeps,
} from '@usecases/catalogSeeding';

// Task 067(2). The repository's own seeding — which ids it inserts and what it refuses to touch —
// is the repository contract's business (__tests__/contracts/catalogContract.ts) and holds for
// every adapter. What is checked here is the procedure on top: whether it runs at all.

function catalogExercise(
  id: string,
  overrides: Partial<Unsaved<Exercise>> = {},
): Unsaved<Exercise> {
  return {
    id: toExerciseId(id),
    name: id,
    muscleGroup: 'chest',
    source: 'catalog',
    isHidden: false,
    ...overrides,
  };
}

const BENCH = catalogExercise('bench-press');
const ROW = catalogExercise('row', { muscleGroup: 'back' });

const VERSION_1: CatalogRelease = { version: 1, exercises: [BENCH] };
const VERSION_2: CatalogRelease = { version: 2, exercises: [BENCH, ROW] };

function setUp(): CatalogSeedingDeps {
  return {
    exerciseRepo: new InMemoryExerciseRepository(new InMemoryStore()),
    settingsRepo: new InMemorySettingsRepository(),
  };
}

async function catalogIdsOf(deps: CatalogSeedingDeps): Promise<string[]> {
  const exercises = await deps.exerciseRepo.getAll();
  return exercises.map((exercise) => exercise.id).sort();
}

describe('seedExerciseCatalog', () => {
  test('DoD: the first launch fills the catalog and records the version', async () => {
    const deps = setUp();

    await expect(seedExerciseCatalog(VERSION_1, deps)).resolves.toBe(true);

    await expect(catalogIdsOf(deps)).resolves.toEqual(['bench-press']);
    await expect(deps.settingsRepo.read()).resolves.toMatchObject({ catalogVersion: 1 });
  });

  test('DoD: a second launch on the same version duplicates nothing and does no work', async () => {
    const deps = setUp();
    await seedExerciseCatalog(VERSION_1, deps);

    await expect(seedExerciseCatalog(VERSION_1, deps)).resolves.toBe(false);

    await expect(catalogIdsOf(deps)).resolves.toEqual(['bench-press']);
  });

  test('DoD: a new version adds what is missing and touches neither custom exercises nor isHidden', async () => {
    const deps = setUp();
    await seedExerciseCatalog(VERSION_1, deps);
    const custom = await deps.exerciseRepo.createCustom(
      catalogExercise('my-own-curl', { source: 'custom', muscleGroup: 'biceps' }),
    );
    // The user hid a catalog exercise before the update shipped.
    await deps.exerciseRepo.toggleHidden(BENCH.id);

    await expect(seedExerciseCatalog(VERSION_2, deps)).resolves.toBe(true);

    await expect(catalogIdsOf(deps)).resolves.toEqual(['bench-press', 'my-own-curl', 'row']);
    await expect(deps.exerciseRepo.getById(BENCH.id)).resolves.toMatchObject({ isHidden: true });
    await expect(deps.exerciseRepo.getById(custom.id)).resolves.toEqual(custom);
    await expect(deps.settingsRepo.read()).resolves.toMatchObject({ catalogVersion: 2 });
  });

  test('a catalog from a newer build is left alone, not rolled back to this one', async () => {
    // The user updated the app, used it, then rolled back to this build.
    const deps = setUp();
    await seedExerciseCatalog(VERSION_2, deps);

    await expect(seedExerciseCatalog(VERSION_1, deps)).resolves.toBe(false);

    await expect(catalogIdsOf(deps)).resolves.toEqual(['bench-press', 'row']);
    await expect(deps.settingsRepo.read()).resolves.toMatchObject({ catalogVersion: 2 });
  });

  test('the version is recorded only after the catalog is actually written', async () => {
    const deps = setUp();
    const failing: CatalogSeedingDeps = {
      ...deps,
      exerciseRepo: Object.assign(Object.create(deps.exerciseRepo) as typeof deps.exerciseRepo, {
        seedCatalog: async () => {
          throw new Error('storage went away mid-seed');
        },
      }),
    };

    await expect(seedExerciseCatalog(VERSION_1, failing)).rejects.toThrow('storage went away');

    // Nothing claims to have been seeded, so the next launch tries again.
    await expect(deps.settingsRepo.read()).resolves.toMatchObject({ catalogVersion: 0 });
    await expect(seedExerciseCatalog(VERSION_1, deps)).resolves.toBe(true);
  });

  test('the catalog this build ships seeds in full', async () => {
    const deps = setUp();

    await seedExerciseCatalog({ version: CATALOG_VERSION, exercises: EXERCISE_CATALOG }, deps);

    await expect(deps.exerciseRepo.getAll()).resolves.toHaveLength(EXERCISE_CATALOG.length);
    await expect(deps.settingsRepo.read()).resolves.toMatchObject({
      catalogVersion: CATALOG_VERSION,
    });
  });
});
