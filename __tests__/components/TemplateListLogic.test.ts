import { formatDayCount, templateBadge } from '@components/TemplateListLogic';

function week(count: number) {
  return {
    weekPlan: {
      days: Array.from({ length: count }, (_, index) => ({
        dayNumber: index + 1,
        name: '',
        exercises: [],
      })),
    },
  };
}

describe('formatDayCount', () => {
  test('says "1 day" for a single day and "N days" otherwise', () => {
    expect(formatDayCount(week(1))).toBe('1 day');
    expect(formatDayCount(week(3))).toBe('3 days');
  });
});

describe('templateBadge', () => {
  test('marks a custom template', () => {
    expect(templateBadge({ source: 'custom' })).toEqual({ label: 'Custom' });
  });

  test('leaves a catalog template unbadged', () => {
    expect(templateBadge({ source: 'catalog' })).toBeUndefined();
  });
});
