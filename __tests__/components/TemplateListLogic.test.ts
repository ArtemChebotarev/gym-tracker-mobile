import {
  formatTemplateSubtitle,
  formatTemplateTitle,
  templateBadge,
} from '@components/TemplateListLogic';

/** A week of `days`, each day holding exercises with these set counts. */
function week(...days: number[][]) {
  return {
    weekPlan: {
      days: days.map((sets, index) => ({
        dayNumber: index + 1,
        name: '',
        exercises: sets.map((count, order) => ({
          exerciseId: `e${order}`,
          order: order + 1,
          sets: count,
        })),
      })),
    },
  };
}

describe('formatTemplateTitle', () => {
  test('appends the day count to the name', () => {
    expect(formatTemplateTitle({ name: 'Full Body', ...week([3], [3], [3]) })).toBe(
      'Full Body · 3 days',
    );
  });

  test('says "1 day" for a single day', () => {
    expect(formatTemplateTitle({ name: 'Minimal', ...week([3]) })).toBe('Minimal · 1 day');
  });
});

describe('formatTemplateSubtitle', () => {
  test("sums the week's exercises and sets", () => {
    expect(formatTemplateSubtitle(week([4, 3], [5]))).toBe('3 exercises · 12 sets a week');
  });

  test('uses the singular for one', () => {
    expect(formatTemplateSubtitle(week([1]))).toBe('1 exercise · 1 set a week');
  });

  test('is never empty, even for a week with no exercises', () => {
    expect(formatTemplateSubtitle(week([], []))).toBe('0 exercises · 0 sets a week');
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
