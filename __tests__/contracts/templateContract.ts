import { makeTemplate } from './fixtures';
import { type RepositoryHarness, useRepositories } from './harness';

// TemplateRepository — see 07 · Persistence Layer Contract, "TemplateRepository", and
// repositories/template.ts.

export function describeTemplateContract(harness: RepositoryHarness): void {
  describe('TemplateRepository', () => {
    const repositories = useRepositories(harness);

    test('create, getById and getAll round-trip a template', async () => {
      const { templateRepo } = repositories();

      const template = await templateRepo.create(makeTemplate());

      await expect(templateRepo.getById(template.id)).resolves.toEqual(template);
      // Relative, not exact: a migrated store already holds the catalog templates.
      await expect(templateRepo.getAll()).resolves.toContainEqual(template);
      await expect(templateRepo.getById('missing')).resolves.toBeNull();
    });

    test('round-trips its tags, and a template without tags reads back without them (GT-217)', async () => {
      const { templateRepo } = repositories();

      const tagged = await templateRepo.create(
        makeTemplate({ id: 'template-tagged', tags: ['full-body', 'hybrid'] }),
      );
      const untagged = await templateRepo.create(makeTemplate({ id: 'template-untagged' }));

      await expect(templateRepo.getById(tagged.id)).resolves.toEqual(tagged);
      const read = await templateRepo.getById(untagged.id);
      expect(read).toEqual(untagged);
      expect(read).not.toHaveProperty('tags');
    });

    test('update replaces the stored template', async () => {
      const { templateRepo } = repositories();
      const stored = await templateRepo.create(makeTemplate());

      const updated = await templateRepo.update({
        ...stored,
        name: 'Upper Lower',
        isHidden: true,
      });

      await expect(templateRepo.getById('template-ppl')).resolves.toEqual(updated);
    });

    test('deleteById removes a template', async () => {
      const { templateRepo } = repositories();
      await templateRepo.create(makeTemplate());

      await templateRepo.deleteById('template-ppl');

      await expect(templateRepo.getById('template-ppl')).resolves.toBeNull();
      const remaining = await templateRepo.getAll();
      expect(remaining.map((entry) => entry.id)).not.toContain('template-ppl');
    });
  });
}
