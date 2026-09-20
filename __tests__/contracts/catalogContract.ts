import { MUSCLE_GROUPS, toExerciseId } from '@domain/catalog';
import { ConflictError } from '@domain/errors';

import { makeCatalogExercise, makeCustomExercise } from './fixtures';
import { type RepositoryHarness, useRepositories } from './harness';
import { withoutStamps } from '../fixtures/stamps';

// MuscleGroupRepository and ExerciseRepository — see 07 · Persistence Layer Contract,
// "Репозитории и их операции", and repositories/catalog.ts for the contracts themselves.

export function describeCatalogContract(harness: RepositoryHarness): void {
  describe('MuscleGroupRepository', () => {
    const repositories = useRepositories(harness);

    test('getAll returns every muscle group of the fixed catalog', async () => {
      const groups = await repositories().muscleGroupRepo.getAll();

      expect([...groups].sort()).toEqual([...MUSCLE_GROUPS].sort());
    });

    test('getById resolves a group of the catalog, and null for one outside it', async () => {
      const { muscleGroupRepo } = repositories();

      await expect(muscleGroupRepo.getById('back')).resolves.toBe('back');
      await expect(muscleGroupRepo.getById('not-a-muscle-group' as never)).resolves.toBeNull();
    });
  });

  describe('ExerciseRepository', () => {
    const repositories = useRepositories(harness);

    const benchPress = makeCatalogExercise('exercise-bench-press', { muscleGroup: 'chest' });
    const legPress = makeCatalogExercise('exercise-leg-press', {
      muscleGroup: 'quads',
      equipment: 'machine',
    });
    const customCurl = makeCustomExercise('exercise-custom-curl', { muscleGroup: 'biceps' });

    test('getAll and getById round-trip catalog and custom exercises alike', async () => {
      const { exerciseRepo } = repositories();
      await exerciseRepo.seedCatalog(1, [benchPress, legPress]);
      await exerciseRepo.createCustom(customCurl);

      expect(withoutStamps(await exerciseRepo.getAll())).toEqual(
        expect.arrayContaining([benchPress, legPress, customCurl]),
      );
      expect(withoutStamps((await exerciseRepo.getById(benchPress.id))!)).toEqual(benchPress);
      await expect(exerciseRepo.getById(toExerciseId('missing'))).resolves.toBeNull();
    });

    test('listByIds returns matches and silently skips ids that do not resolve', async () => {
      const { exerciseRepo } = repositories();
      await exerciseRepo.seedCatalog(1, [benchPress, legPress]);

      const found = await exerciseRepo.listByIds([
        legPress.id,
        toExerciseId('missing'),
        benchPress.id,
      ]);

      expect(found.map((exercise) => exercise.id).sort()).toEqual(
        [benchPress.id, legPress.id].sort(),
      );
    });

    test('filterByMuscleGroup returns only exercises of that group', async () => {
      const { exerciseRepo } = repositories();
      await exerciseRepo.seedCatalog(1, [benchPress, legPress]);
      await exerciseRepo.createCustom(customCurl);

      expect(withoutStamps(await exerciseRepo.filterByMuscleGroup('chest'))).toEqual([benchPress]);
      await expect(exerciseRepo.filterByMuscleGroup('calves')).resolves.toEqual([]);
    });

    test('toggleHidden flips isHidden for catalog and custom exercises alike', async () => {
      const { exerciseRepo } = repositories();
      await exerciseRepo.seedCatalog(1, [benchPress]);
      await exerciseRepo.createCustom(customCurl);

      await expect(exerciseRepo.toggleHidden(benchPress.id)).resolves.toMatchObject({
        isHidden: true,
      });
      await expect(exerciseRepo.toggleHidden(customCurl.id)).resolves.toMatchObject({
        isHidden: true,
      });
      await expect(exerciseRepo.toggleHidden(benchPress.id)).resolves.toMatchObject({
        isHidden: false,
      });
    });

    test('updateCustom replaces a custom exercise', async () => {
      const { exerciseRepo } = repositories();
      const stored = await exerciseRepo.createCustom(customCurl);

      const updated = await exerciseRepo.updateCustom({ ...stored, name: 'Renamed Curl' });

      expect(updated.name).toBe('Renamed Curl');
      await expect(exerciseRepo.getById(customCurl.id)).resolves.toEqual(updated);
    });

    test('updateCustom rejects editing a catalog exercise, leaving it untouched', async () => {
      const { exerciseRepo } = repositories();
      await exerciseRepo.seedCatalog(1, [benchPress]);
      const stored = (await exerciseRepo.getById(benchPress.id))!;

      await expect(
        exerciseRepo.updateCustom({ ...stored, name: 'Hacked Bench Press' }),
      ).rejects.toBeInstanceOf(ConflictError);
      expect(withoutStamps((await exerciseRepo.getById(benchPress.id))!)).toEqual(benchPress);
    });

    test('createCustom rejects a duplicate id', async () => {
      const { exerciseRepo } = repositories();
      await exerciseRepo.createCustom(customCurl);

      await expect(exerciseRepo.createCustom(customCurl)).rejects.toBeInstanceOf(ConflictError);
    });

    test('seedCatalog inserts only the ids that are missing and touches nothing else', async () => {
      const { exerciseRepo } = repositories();
      await exerciseRepo.seedCatalog(1, [benchPress]);
      await exerciseRepo.createCustom(customCurl);
      // The user hid a catalog exercise before the update shipped; re-seeding must not undo that.
      await exerciseRepo.toggleHidden(benchPress.id);

      await exerciseRepo.seedCatalog(2, [benchPress, legPress]);

      await expect(exerciseRepo.getAll()).resolves.toHaveLength(3);
      await expect(exerciseRepo.getById(benchPress.id)).resolves.toMatchObject({ isHidden: true });
      expect(withoutStamps((await exerciseRepo.getById(legPress.id))!)).toEqual(legPress);
      expect(withoutStamps((await exerciseRepo.getById(customCurl.id))!)).toEqual(customCurl);
    });
  });
}
