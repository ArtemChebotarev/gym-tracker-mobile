import {
  formatMesocycleDetailSubtitle,
  formatSummaryCount,
  mesocycleDetailBadge,
  mesocycleDetailMenuItems,
  weekColumnLabels,
  weeklyExerciseRowViews,
  weeklySetsRowViews,
  weeklyTableViews,
} from '@components/MesocycleDetailScreenLogic';
import {
  getCategoryColor,
  getCategoryVolumeFill,
  getNeutralVolumeFill,
} from '@design/muscleGroupColor';
import type { MesoSummary } from '@domain/mesoSummary';

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
      key: 'chest',
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

describe('weeklyExerciseRowViews', () => {
  test('names the exercise; one without a group is drawn in the neutral fill', () => {
    const [slam, throwRow] = weeklyExerciseRowViews([
      { exerciseId: 'slam', name: 'Medball slam', muscleGroup: 'fullBody', counts: [2, 4, 0] },
      { exerciseId: 'throw', name: 'Medball throw', muscleGroup: 'chest', counts: [4, 0, 0] },
    ]);

    expect(slam).toEqual({
      key: 'slam',
      label: 'Medball slam',
      dotColor: undefined,
      cells: [
        { weekNumber: 1, label: '2', fill: getNeutralVolumeFill(0.5) },
        { weekNumber: 2, label: '4', fill: getNeutralVolumeFill(1) },
        { weekNumber: 3, label: '–' },
      ],
    });
    expect(throwRow?.dotColor).toBe(getCategoryColor('chest'));
    expect(throwRow?.cells[0]?.fill).toBe(getCategoryVolumeFill('chest', 1));
  });
});

describe('weeklyTableViews', () => {
  const base: MesoSummary = {
    workouts: { value: 1, total: 8 },
    strengthSets: 0,
    weeks: { value: 1, total: 4 },
    weeklySets: [],
    hybridTables: [],
  };
  const bag = {
    exerciseId: 'bag',
    name: 'Heavy bag',
    muscleGroup: 'fullBody',
    counts: [3],
  } as const;

  test('Strength first, then a card per hybrid type, titled by the type', () => {
    const tables = weeklyTableViews({
      ...base,
      weeklySets: [{ muscleGroup: 'chest', sets: [3] }],
      hybridTables: [{ type: 'interval', rows: [{ ...bag, counts: [...bag.counts] }] }],
    });

    expect(tables.map((table) => table.title)).toEqual(['Strength', 'Timed work']);
  });

  test('a block of hybrid work only has no Strength card', () => {
    const tables = weeklyTableViews({
      ...base,
      hybridTables: [{ type: 'interval', rows: [{ ...bag, counts: [...bag.counts] }] }],
    });

    expect(tables.map((table) => table.title)).toEqual(['Timed work']);
  });

  test('a block with nothing logged keeps an empty Strength card for its empty-state line', () => {
    expect(weeklyTableViews(base)).toEqual([{ key: 'strength', title: 'Strength', rows: [] }]);
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
      expect(items.map((item) => item.label)).toEqual(['Rename cycle', 'Copy', 'Archive']);
      // Nothing logged goes — not red.
      expect(items[2]?.destructive).toBeUndefined();

      items[1]?.onPress();
      items[2]?.onPress();
      expect(handlers.onCopy).toHaveBeenCalled();
      expect(handlers.onArchive).toHaveBeenCalled();
    },
  );
});
