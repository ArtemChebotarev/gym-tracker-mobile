import { templateBadge } from '@components/TemplateListLogic';

describe('templateBadge', () => {
  test('marks a custom template', () => {
    expect(templateBadge({ source: 'custom' })).toEqual({ label: 'Custom' });
  });

  test('leaves a catalog template unbadged', () => {
    expect(templateBadge({ source: 'catalog' })).toBeUndefined();
  });
});
