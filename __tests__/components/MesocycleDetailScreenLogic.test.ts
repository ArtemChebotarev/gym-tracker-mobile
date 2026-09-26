import {
  formatMesocycleDetailSubtitle,
  formatSummaryCount,
  mesocycleDetailBadge,
  mesocycleDetailMenuItems,
  weekColumnLabels,
  weeklySetsRowViews,
} from '@components/MesocycleDetailScreenLogic';
import { getCategoryColor, getCategoryVolumeFill } from '@design/muscleGroupColor';

// Midday UTC, so the dates read the same in any time zone the tests run in.
const START = '2026-08-03T12:00:00.000Z';
const END = '2026-09-20T12:00:00.000Z';

describe('mesocycleDetailBadge', () => {
  test.each([
    ['active', { label: 'Active', variant: 'accent' }],
    ['abandoned', { label: 'Stopped', variant: 'neutral' }],
    ['completed', undefined],
  ] as const)('%s → %o', (status, badge) => {
    expect(mesocycleDetailBadge(status)).toEqual(badge);
  });
});

describe('formatMesocycleDetailSubtitle', () => {
  test('Completed: length and span', () => {
    expect(
      formatMesocycleDetailSubtitle(
        { status: 'completed', lengthWeeks: 7, startDate: START, completedAt: END },
        7,
      ),
    ).toBe('7 weeks · 3 Aug – 20 Sep');
  });

  test('Stopped: the week it stopped in, and the span', () => {
    expect(
      formatMesocycleDetailSubtitle(
        {
          status: 'abandoned',
          lengthWeeks: 7,
          startDate: START,
          completedAt: '2026-08-27T12:00:00.000Z',
        },
        4,
      ),
    ).toBe('Stopped in week 4 · 3 Aug – 27 Aug');
  });

  test('Active: the week by workouts, and the start', () => {
    expect(
      formatMesocycleDetailSubtitle({ status: 'active', lengthWeeks: 7, startDate: START }, 4),
    ).toBe('Week 4 of 7 · started 3 Aug');
  });

  test('drops the dates it has none of', () => {
    expect(formatMesocycleDetailSubtitle({ status: 'active', lengthWeeks: 7 }, 1)).toBe(
      'Week 1 of 7',
    );
  });
});

describe('formatSummaryCount', () => {
  test('with and without a denominator', () => {
    expect(formatSummaryCount({ value: 26, total: 28 })).toEqual({ value: '26', total: '28' });
    expect(formatSummaryCount({ value: 13 })).toEqual({ value: '13' });
  });
});

describe('weekColumnLabels', () => {
  test('W1…Wn', () => {
    expect(weekColumnLabels(3)).toEqual(['W1', 'W2', 'W3']);
  });
});

describe('weeklySetsRowViews', () => {
  test('labels the group, colors its dot, scales each cell to the busiest one', () => {
    const [chest, back] = weeklySetsRowViews([
      { muscleGroup: 'chest', sets: [5, 10, 0] },
      { muscleGroup: 'back', sets: [2, 0, 0] },
    ]);

    expect(chest).toEqual({
      muscleGroup: 'chest',
      label: 'Chest',
      dotColor: getCategoryColor('chest'),
      cells: [
        { weekNumber: 1, label: '5', fill: getCategoryVolumeFill('chest', 0.5) },
        { weekNumber: 2, label: '10', fill: getCategoryVolumeFill('chest', 1) },
        { weekNumber: 3, label: '–' },
      ],
    });
    expect(back?.cells[0]).toEqual({
      weekNumber: 1,
      label: '2',
      fill: getCategoryVolumeFill('back', 0.2),
    });
  });
});

describe('mesocycleDetailMenuItems', () => {
  const handlers = { onRename: jest.fn(), onCopy: jest.fn(), onArchive: jest.fn() };

  test('an active block: Rename only — Stop stays in the workout menu', () => {
    expect(mesocycleDetailMenuItems('active', handlers).map((item) => item.key)).toEqual([
      'rename',
    ]);
  });

  test.each(['completed', 'abandoned'] as const)(
    'a %s block: Rename, then Copy and Archive as on its Completed row',
    (status) => {
      const items = mesocycleDetailMenuItems(status, handlers);
      expect(items.map((item) => item.label)).toEqual(['Rename mesocycle', 'Copy', 'Archive']);
      // Nothing logged goes — not red.
      expect(items[2]?.destructive).toBeUndefined();

      items[1]?.onPress();
      items[2]?.onPress();
      expect(handlers.onCopy).toHaveBeenCalled();
      expect(handlers.onArchive).toHaveBeenCalled();
    },
  );
});
