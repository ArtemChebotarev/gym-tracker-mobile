import type { MesoTemplate, WeekPlanDay } from '@domain/plan';
import { groupTemplatesByDayCount, listTemplates, templateDayCount } from '@domain/templateListing';
import { STAMPS } from '../fixtures/stamps';

function days(count: number): WeekPlanDay[] {
  return Array.from({ length: count }, (_, index) => ({
    dayNumber: index + 1,
    name: '',
    exercises: [],
  }));
}

function template(
  name: string,
  dayCount: number,
  overrides: Partial<MesoTemplate> = {},
): MesoTemplate {
  return {
    ...STAMPS,
    id: name,
    name,
    source: 'catalog',
    defaultLengthWeeks: 5,
    isHidden: false,
    weekPlan: { days: days(dayCount) },
    ...overrides,
  };
}

const names = (templates: MesoTemplate[]) => templates.map((entry) => entry.name);

describe('templateDayCount', () => {
  test("counts the template's week days", () => {
    expect(templateDayCount(template('Full Body', 3))).toBe(3);
  });
});

describe('listTemplates', () => {
  const all = [
    template('Upper / Lower', 4),
    template('Full Body', 3),
    template('Push Pull Legs', 6),
    template('Arnold Split', 6),
    template('Retired', 2, { isHidden: true }),
  ];

  test('never shows hidden templates', () => {
    expect(names(listTemplates(all))).not.toContain('Retired');
  });

  test('orders by number of days, then by name', () => {
    expect(names(listTemplates(all))).toEqual([
      'Full Body',
      'Upper / Lower',
      'Arnold Split',
      'Push Pull Legs',
    ]);
  });

  test('filters by name as you type, case-insensitive', () => {
    expect(names(listTemplates(all, 'LOW'))).toEqual(['Upper / Lower']);
    expect(names(listTemplates(all, ' split '))).toEqual(['Arnold Split']);
  });

  test('a hidden template stays hidden even when the search names it', () => {
    expect(listTemplates(all, 'Retired')).toEqual([]);
  });

  test('does not reorder the array it was given', () => {
    const before = names(all);
    listTemplates(all);
    expect(names(all)).toEqual(before);
  });
});

describe('groupTemplatesByDayCount', () => {
  test('groups by days a week, fewest first, keeping the order within a group', () => {
    const groups = groupTemplatesByDayCount([
      template('PPL', 6),
      template('Arnold Split', 6),
      template('Full Body', 3),
    ]);

    expect(groups.map(({ dayCount, templates }) => [dayCount, names(templates)])).toEqual([
      [3, ['Full Body']],
      [6, ['PPL', 'Arnold Split']],
    ]);
  });

  test('no templates, no groups', () => {
    expect(groupTemplatesByDayCount([])).toEqual([]);
  });
});
