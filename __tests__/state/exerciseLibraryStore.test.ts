import { ensureExerciseCatalogSeeded, exerciseLibraryDeps } from '@state/exerciseLibraryStore';

describe('exerciseLibraryStore', () => {
  test('seeds the stub catalog into the shared store', async () => {
    await ensureExerciseCatalogSeeded();

    const all = await exerciseLibraryDeps.exerciseRepo.getAll();

    expect(all.length).toBeGreaterThan(0);
    expect(all.every((exercise) => exercise.source === 'catalog')).toBe(true);
  });

  test('seeding again does not duplicate entries', async () => {
    await ensureExerciseCatalogSeeded();
    const before = (await exerciseLibraryDeps.exerciseRepo.getAll()).length;

    await ensureExerciseCatalogSeeded();
    const after = (await exerciseLibraryDeps.exerciseRepo.getAll()).length;

    expect(after).toBe(before);
  });
});
