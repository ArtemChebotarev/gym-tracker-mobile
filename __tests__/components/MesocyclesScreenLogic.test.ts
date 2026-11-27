import type { Mesocycle } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import {
  completedMenuItems,
  formatActiveCaption,
  formatArchiveConfirmMessage,
  formatCompletedCaption,
  formatDeleteConfirmMessage,
  formatPlannedCaption,
  getWeekDots,
  groupMesocycles,
  isEmptyGroups,
  mesocycleStoppedBadge,
  plannedMenuItems,
  showStartCoachmark,
} from '@components/MesocyclesScreenLogic';
import { STAMPS } from '../fixtures/stamps';

function makeMesocycle(overrides: Partial<Mesocycle>): Mesocycle {
  return {
    ...STAMPS,
    id: 'meso',
    name: 'Meso',
    lengthWeeks: 5,
    daysPerWeek: 3,
    status: 'planned',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    weightUnit: 'kg',
    createdAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('groupMesocycles', () => {
  test('splits by status and orders completed newest-finished first', () => {
    const active = makeMesocycle({ id: 'a', status: 'active' });
    const planned = makeMesocycle({ id: 'p', status: 'planned' });
    const older = makeMesocycle({
      id: 'c1',
      status: 'completed',
      completedAt: '2026-05-01T00:00:00.000Z',
    });
    const newer = makeMesocycle({
      id: 'c2',
      status: 'completed',
      completedAt: '2026-08-01T00:00:00.000Z',
    });

    const groups = groupMesocycles([older, planned, newer, active]);

    expect(groups.active).toBe(active);
    expect(groups.planned).toEqual([planned]);
    expect(groups.completed.map((m) => m.id)).toEqual(['c2', 'c1']);
  });

  test('a stopped block is listed with the completed ones, by when it ended (052)', () => {
    const stopped = makeMesocycle({
      id: 'x',
      status: 'abandoned',
      completedAt: '2026-07-01T00:00:00.000Z',
    });
    const finished = makeMesocycle({
      id: 'c1',
      status: 'completed',
      completedAt: '2026-05-01T00:00:00.000Z',
    });

    expect(groupMesocycles([finished, stopped]).completed.map((m) => m.id)).toEqual(['x', 'c1']);
  });

  test('isEmptyGroups is true only when nothing renders', () => {
    expect(isEmptyGroups(groupMesocycles([]))).toBe(true);
    expect(isEmptyGroups(groupMesocycles([makeMesocycle({ status: 'abandoned' })]))).toBe(false);
    expect(isEmptyGroups(groupMesocycles([makeMesocycle({ status: 'planned' })]))).toBe(false);
  });
});

describe('mesocycleStoppedBadge', () => {
  test('DoD: a stopped block is marked, a finished one is not (052)', () => {
    expect(mesocycleStoppedBadge(makeMesocycle({ status: 'abandoned' }))).toEqual({
      label: 'Stopped',
    });
    expect(mesocycleStoppedBadge(makeMesocycle({ status: 'completed' }))).toBeUndefined();
  });
});

test('getWeekDots marks weeks before, at, and after the current one', () => {
  expect(getWeekDots(4, 2)).toEqual(['done', 'current', 'upcoming', 'upcoming']);
});

describe('captions', () => {
  test('active — the week is given, not derived from the start date', () => {
    const mesocycle = makeMesocycle({ status: 'active', startDate: '2026-09-06T12:00:00.000Z' });
    expect(formatActiveCaption(mesocycle, 1)).toBe('Week 1 of 5 · started 6 Sep');
    expect(formatActiveCaption(mesocycle, 3)).toBe('Week 3 of 5 · started 6 Sep');
  });

  test('planned', () => {
    expect(formatPlannedCaption(makeMesocycle({ lengthWeeks: 6, daysPerWeek: 4 }))).toBe(
      '6 weeks · 4 days/week',
    );
  });

  test('planned, singular day', () => {
    expect(formatPlannedCaption(makeMesocycle({ lengthWeeks: 3, daysPerWeek: 1 }))).toBe(
      '3 weeks · 1 day/week',
    );
  });

  test('completed', () => {
    const mesocycle = makeMesocycle({
      status: 'completed',
      lengthWeeks: 4,
      startDate: '2026-07-18T12:00:00.000Z',
      completedAt: '2026-08-15T12:00:00.000Z',
    });
    expect(formatCompletedCaption(mesocycle)).toBe('4 weeks · 18 Jul – 15 Aug');
  });
});

describe('plannedMenuItems', () => {
  const mesocycle = makeMesocycle({ id: 'p', status: 'planned' });

  test('offers Delete alone, destructive and with the handler for that mesocycle', () => {
    const onDelete = jest.fn();
    const items = plannedMenuItems(mesocycle, { onDelete });

    expect(items.map((item) => item.key)).toEqual(['delete']);
    expect(items[0]?.label).toBe('Delete');
    expect(items[0]?.destructive).toBe(true);

    items[0]?.onPress();
    expect(onDelete).toHaveBeenCalledWith(mesocycle);
  });

  test('Edit and Start are not in it — the row tap opens the editor, the pill starts the block', () => {
    const items = plannedMenuItems(mesocycle, { onDelete: jest.fn() });

    expect(items.map((item) => item.key)).not.toContain('edit');
    expect(items.map((item) => item.key)).not.toContain('start');
  });
});

describe('completedMenuItems', () => {
  const mesocycle = makeMesocycle({ id: 'c', status: 'completed' });

  test('offers Copy, Archive and Delete, each calling its handler with that mesocycle', () => {
    const onCopy = jest.fn();
    const onArchive = jest.fn();
    const onDelete = jest.fn();
    const items = completedMenuItems(mesocycle, { onCopy, onArchive, onDelete });

    expect(items.map((item) => item.key)).toEqual(['copy', 'archive', 'delete']);
    expect(items.map((item) => item.label)).toEqual(['Copy', 'Archive', 'Delete']);

    items[0]?.onPress();
    items[1]?.onPress();
    items[2]?.onPress();
    expect(onCopy).toHaveBeenCalledWith(mesocycle);
    expect(onArchive).toHaveBeenCalledWith(mesocycle);
    expect(onDelete).toHaveBeenCalledWith(mesocycle);
  });

  test('only Delete is destructive — Archive keeps everything logged (GT-268)', () => {
    const items = completedMenuItems(mesocycle, {
      onCopy: jest.fn(),
      onArchive: jest.fn(),
      onDelete: jest.fn(),
    });

    expect(items.filter((item) => item.destructive).map((item) => item.key)).toEqual(['delete']);
  });
});

describe('formatDeleteConfirmMessage', () => {
  test('a planned block has nothing logged: only that there is no way back', () => {
    expect(formatDeleteConfirmMessage({ status: 'planned' })).toBe("This can't be undone.");
  });

  test.each(['completed', 'abandoned'] as const)(
    'a %s block: says its workouts and history go too, in one short line',
    (status) => {
      expect(formatDeleteConfirmMessage({ status })).toBe(
        "Its workouts and exercise history will be deleted too. This can't be undone.",
      );
    },
  );
});

describe('formatArchiveConfirmMessage', () => {
  test('says the history stays, unlike Delete', () => {
    expect(formatArchiveConfirmMessage()).toBe("Its exercise history is kept. This can't be undone.");
  });
});

describe('showStartCoachmark (GT-50)', () => {
  const planned = makeMesocycle({ id: 'p', status: 'planned' });
  const active = makeMesocycle({ id: 'a', status: 'active' });

  test('a Planned cycle, nothing active, the hint not yet closed', () => {
    expect(showStartCoachmark(groupMesocycles([planned]), false)).toBe(true);
  });

  test('never once closed, and not before the flags are read', () => {
    expect(showStartCoachmark(groupMesocycles([planned]), true)).toBe(false);
    expect(showStartCoachmark(groupMesocycles([planned]), undefined)).toBe(false);
  });

  test('not without a Planned cycle, nor while one is active (Start would refuse)', () => {
    expect(showStartCoachmark(groupMesocycles([]), false)).toBe(false);
    expect(showStartCoachmark(groupMesocycles([active, planned]), false)).toBe(false);
  });
});
