import { formatMesoOverviewSubtitle } from '@components/MesoOverviewSheetLogic';

describe('formatMesoOverviewSubtitle', () => {
  test('names the current week, the length, and the days a week', () => {
    expect(
      formatMesoOverviewSubtitle({ currentWeekNumber: 6, lengthWeeks: 7, daysPerWeek: 4 }),
    ).toBe('Week 6 of 7 · 4 days a week');
  });

  test('says "day" for a single day a week', () => {
    expect(
      formatMesoOverviewSubtitle({ currentWeekNumber: 1, lengthWeeks: 4, daysPerWeek: 1 }),
    ).toBe('Week 1 of 4 · 1 day a week');
  });
});
