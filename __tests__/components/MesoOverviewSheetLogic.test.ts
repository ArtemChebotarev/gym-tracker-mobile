import {
  formatMesoOverviewSubtitle,
  isOpenMesoGridCell,
  mesoGridCellAccessibilityLabel,
  mesoGridCellText,
} from '@components/MesoOverviewSheetLogic';

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

describe('mesoGridCellText', () => {
  test.each([
    ['in_progress', 'Now'],
    ['ready', 'D3'],
    ['skipped', 'Skip'],
    ['awaiting', '—'],
  ] as const)('a %s cell reads %s', (status, text) => {
    expect(mesoGridCellText({ status, dayNumber: 3 })).toBe(text);
  });

  test('a completed cell has no text — it shows a check', () => {
    expect(mesoGridCellText({ status: 'completed', dayNumber: 3 })).toBeUndefined();
  });
});

describe('mesoGridCellAccessibilityLabel', () => {
  test('names the day and its state', () => {
    expect(
      mesoGridCellAccessibilityLabel({ weekNumber: 3, dayNumber: 1, status: 'awaiting' }),
    ).toBe('Week 3 Day 1, not programmed yet');
    expect(
      mesoGridCellAccessibilityLabel({ weekNumber: 2, dayNumber: 4, status: 'in_progress' }),
    ).toBe('Week 2 Day 4, in progress');
  });
});

describe('isOpenMesoGridCell', () => {
  test('matches the open day by week and day', () => {
    const openDay = { weekNumber: 2, dayNumber: 1 };
    expect(isOpenMesoGridCell({ weekNumber: 2, dayNumber: 1 }, openDay)).toBe(true);
    expect(isOpenMesoGridCell({ weekNumber: 2, dayNumber: 2 }, openDay)).toBe(false);
    expect(isOpenMesoGridCell({ weekNumber: 1, dayNumber: 1 }, openDay)).toBe(false);
  });

  test('matches nothing when no day is open', () => {
    expect(isOpenMesoGridCell({ weekNumber: 2, dayNumber: 1 }, undefined)).toBe(false);
  });
});
