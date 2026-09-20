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
      await expect(templateRepo.getAll()).resolves.toEqual([template]);
      await expect(templateRepo.getById('missing')).resolves.toBeNull();
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
      await expect(templateRepo.getAll()).resolves.toEqual([]);
    });
  });
}
