import { formatCycleLengthCaption, formatMesoOverviewSubtitle } from '@components/MesoOverviewSheetLogic';

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

describe('formatCycleLengthCaption (GT-240)', () => {
  test('says how short the block may go', () => {
    expect(formatCycleLengthCaption(7, { min: 5, max: 8 })).toBe('Shortest now: 5 weeks');
  });

  test('says the length is fixed once the deload has started', () => {
    expect(formatCycleLengthCaption(6, { min: 6, max: 6 })).toBe('The deload has started');
  });
});
