import type { Exercise } from '@domain/catalog';
import { ConflictError } from '@domain/errors';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemoryStore } from '@storage/store';

const benchPress: Exercise = {
  id: 'exercise-bench-press',
  name: 'Bench Press',
  muscleGroup: 'chest',
  source: 'catalog',
  equipment: 'barbell',
  isHidden: false,
};

const legPress: Exercise = {
  id: 'exercise-leg-press',
  name: 'Leg Press',
  muscleGroup: 'quads',
  source: 'catalog',
  equipment: 'machine',
  isHidden: false,
};

const customCurl: Exercise = {
  id: 'exercise-custom-curl',
  name: 'Cable Curl Variation',
  muscleGroup: 'biceps',
  source: 'custom',
  equipment: 'cable',
  isHidden: false,
};

describe('InMemoryExerciseRepository', () => {
  async function seeded(...exercises: Exercise[]): Promise<InMemoryExerciseRepository> {
    const repo = new InMemoryExerciseRepository(new InMemoryStore());
    for (const exercise of exercises) {
      await repo.createCustom(exercise);
    }
    return repo;
  }

  test('getAll and getById round-trip inserted exercises', async () => {
    const repo = await seeded(benchPress, legPress);

    await expect(repo.getAll()).resolves.toEqual(expect.arrayContaining([benchPress, legPress]));
    await expect(repo.getById(benchPress.id)).resolves.toEqual(benchPress);
    await expect(repo.getById('missing')).resolves.toBeNull();
  });

  test('listByIds returns matches and silently skips ids that do not resolve', async () => {
    const repo = await seeded(benchPress, legPress);

    const found = await repo.listByIds([legPress.id, 'missing', benchPress.id]);

    expect(found.map((exercise) => exercise.id).sort()).toEqual([benchPress.id, legPress.id].sort());
  });

  test('filterByMuscleGroup returns only exercises for that group', async () => {
    const repo = await seeded(benchPress, legPress, customCurl);

    await expect(repo.filterByMuscleGroup('chest')).resolves.toEqual([benchPress]);
    await expect(repo.filterByMuscleGroup('calves')).resolves.toEqual([]);
  });

  test('toggleHidden flips isHidden and works for both catalog and custom exercises', async () => {
    const repo = await seeded(benchPress, customCurl);

    const hiddenCatalog = await repo.toggleHidden(benchPress.id);
    expect(hiddenCatalog.isHidden).toBe(true);

    const hiddenCustom = await repo.toggleHidden(customCurl.id);
    expect(hiddenCustom.isHidden).toBe(true);

    const shownAgain = await repo.toggleHidden(benchPress.id);
    expect(shownAgain.isHidden).toBe(false);
  });

  test('updateCustom replaces a custom exercise', async () => {
    const repo = await seeded(customCurl);

    const updated = await repo.updateCustom({ ...customCurl, name: 'Renamed Curl' });

    expect(updated.name).toBe('Renamed Curl');
    await expect(repo.getById(customCurl.id)).resolves.toEqual(updated);
  });

  test('updateCustom rejects editing a catalog exercise, leaving it untouched', async () => {
    const repo = await seeded(benchPress);

    await expect(
      repo.updateCustom({ ...benchPress, name: 'Hacked Bench Press' }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(repo.getById(benchPress.id)).resolves.toEqual(benchPress);
  });

  test('seedCatalog inserts only the catalog exercises missing by id, leaving existing records untouched', async () => {
    const repo = await seeded(benchPress, customCurl);

    await repo.seedCatalog(2, [benchPress, legPress]);

    const all = await repo.getAll();
    expect(all).toHaveLength(3);
    await expect(repo.getById(benchPress.id)).resolves.toEqual(benchPress);
    await expect(repo.getById(legPress.id)).resolves.toEqual(legPress);
  });

  test('createCustom rejects a duplicate id', async () => {
    const repo = await seeded(customCurl);

    await expect(repo.createCustom(customCurl)).rejects.toBeInstanceOf(ConflictError);
  });
});
