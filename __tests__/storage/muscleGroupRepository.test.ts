import { InMemoryMuscleGroupRepository } from '@storage/muscleGroupRepository';

describe('InMemoryMuscleGroupRepository', () => {
  test('getAll returns every muscle group in the fixed catalog', async () => {
    const repo = new InMemoryMuscleGroupRepository();

    const groups = await repo.getAll();

    expect(groups).toContain('chest');
    expect(groups).toContain('abs');
    expect(groups).toHaveLength(11);
  });

  test('getById resolves a valid muscle group and null for one outside the catalog', async () => {
    const repo = new InMemoryMuscleGroupRepository();

    await expect(repo.getById('back')).resolves.toBe('back');
    await expect(repo.getById('not-a-muscle-group' as never)).resolves.toBeNull();
  });
});
