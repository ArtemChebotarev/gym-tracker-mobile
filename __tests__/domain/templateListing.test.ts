import type { MesoTemplate, WeekPlanDay } from '@domain/plan';
import {
  groupTemplatesByDayCount,
  hasActiveTemplateFilters,
  knownTemplateTags,
  listTemplates,
  matchesTemplateFilters,
  templateDayCount,
  templateDayCountOptions,
} from '@domain/templateListing';
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

describe('template filters (GT-217)', () => {
  const all = [
    template('Full Body Starter', 2, { tags: ['full-body'] }),
    template('Full Body Lower Focus', 2, { tags: ['full-body', 'lower'] }),
    template('Upper / Lower', 4, { tags: ['full-body'] }),
    template('Boxing Hybrid', 4, { tags: ['full-body', 'hybrid'] }),
    template('Push / Pull / Legs', 5, { tags: ['upper'] }),
    template('My Own', 3),
    template('Retired', 4, { tags: ['hybrid'], isHidden: true }),
  ];

  test('no filters let every visible template through', () => {
    expect(listTemplates(all, '', {})).toHaveLength(6);
    expect(hasActiveTemplateFilters({})).toBe(false);
    expect(hasActiveTemplateFilters({ tags: [], dayCounts: [] })).toBe(false);
  });

  test('days a week: any of the selected counts', () => {
    expect(names(listTemplates(all, '', { dayCounts: [2, 5] }))).toEqual([
      'Full Body Lower Focus',
      'Full Body Starter',
      'Push / Pull / Legs',
    ]);
  });

  test('tags of one group: any of them', () => {
    expect(names(listTemplates(all, '', { tags: ['upper', 'lower'] }))).toEqual([
      'Full Body Lower Focus',
      'Push / Pull / Legs',
    ]);
  });

  test('tags of different groups: every group', () => {
    expect(names(listTemplates(all, '', { tags: ['full-body', 'hybrid'] }))).toEqual([
      'Boxing Hybrid',
    ]);
  });

  test('days, tags and search all narrow together', () => {
    expect(names(listTemplates(all, 'full', { dayCounts: [2], tags: ['lower'] }))).toEqual([
      'Full Body Lower Focus',
    ]);
  });

  test('a template with no tags passes no tag filter, but still a day filter', () => {
    expect(matchesTemplateFilters(template('My Own', 3), { tags: ['full-body'] })).toBe(false);
    expect(matchesTemplateFilters(template('My Own', 3), { dayCounts: [3] })).toBe(true);
  });

  test('a filter nothing matches leaves an empty list, not every template', () => {
    expect(listTemplates(all, '', { dayCounts: [2], tags: ['hybrid'] })).toEqual([]);
  });

  test('the Days options are the counts visible templates train, fewest first', () => {
    expect(templateDayCountOptions(all)).toEqual([2, 3, 4, 5]);
  });

  test('a tag this build does not know is dropped, the rest kept in TEMPLATE_TAGS order', () => {
    expect(knownTemplateTags(['hybrid', 'beginner', 'upper'])).toEqual(['upper', 'hybrid']);
  });
});
