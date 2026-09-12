import type { MesoTemplate } from '@domain/plan';
import { InMemoryTemplateRepository } from '@storage/template';
import { InMemoryStore } from '@storage/store';

function makeTemplate(overrides: Partial<MesoTemplate> = {}): MesoTemplate {
  return {
    id: 'template-ppl',
    name: 'Push Pull Legs',
    source: 'custom',
    defaultLengthWeeks: 6,
    weekPlan: { days: [] },
    isHidden: false,
    createdAt: '2026-08-26T08:00:00.000Z',
    ...overrides,
  };
}

describe('InMemoryTemplateRepository', () => {
  test('create, getById, and getAll round-trip a template', async () => {
    const repo = new InMemoryTemplateRepository(new InMemoryStore());
    const template = makeTemplate();

    await repo.create(template);

    await expect(repo.getById(template.id)).resolves.toEqual(template);
    await expect(repo.getAll()).resolves.toEqual([template]);
    await expect(repo.getById('missing')).resolves.toBeNull();
  });

  test('update replaces the stored template', async () => {
    const repo = new InMemoryTemplateRepository(new InMemoryStore());
    await repo.create(makeTemplate());

    const updated = await repo.update(makeTemplate({ name: 'Upper Lower', isHidden: true }));

    await expect(repo.getById('template-ppl')).resolves.toEqual(updated);
  });

  test('deleteById removes a template', async () => {
    const repo = new InMemoryTemplateRepository(new InMemoryStore());
    await repo.create(makeTemplate());

    await repo.deleteById('template-ppl');

    await expect(repo.getById('template-ppl')).resolves.toBeNull();
    await expect(repo.getAll()).resolves.toEqual([]);
  });
});
