import type { Mesocycle } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import {
  completedLeadingAction,
  completedRowActions,
  formatActiveCaption,
  formatCompletedCaption,
  formatPlannedCaption,
  getWeekDots,
  groupMesocycles,
  isEmptyGroups,
  mesocycleStoppedBadge,
  plannedLeadingAction,
  plannedRowActions,
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

describe('plannedRowActions', () => {
  const mesocycle = makeMesocycle({ id: 'p', status: 'planned' });

  test('offers Edit and Delete, with Delete last and destructive', () => {
    const items = plannedRowActions(mesocycle, { onEdit: jest.fn(), onDelete: jest.fn() });

    expect(items.map((item) => item.key)).toEqual(['edit', 'delete']);
    expect(items.map((item) => item.label)).toEqual(['Edit', 'Delete']);
    // Last in the list is furthest right — under the thumb the swipe came from.
    expect(items.at(-1)?.destructive).toBe(true);
    expect(items[0]?.destructive).toBeUndefined();
  });

  test('each action calls its handler with that mesocycle', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const items = plannedRowActions(mesocycle, { onEdit, onDelete });

    items.find((item) => item.key === 'edit')?.onPress();
    items.find((item) => item.key === 'delete')?.onPress();

    expect(onEdit).toHaveBeenCalledWith(mesocycle);
    expect(onDelete).toHaveBeenCalledWith(mesocycle);
  });

  test('Start is not among them — it is the leading pull, not a trailing button', () => {
    const items = plannedRowActions(mesocycle, { onEdit: jest.fn(), onDelete: jest.fn() });

    expect(items.map((item) => item.key)).not.toContain('start');
  });
});

describe('leading actions', () => {
  const planned = makeMesocycle({ id: 'p', status: 'planned' });
  const completed = makeMesocycle({ id: 'c', status: 'completed' });

  test('a Planned row pulls to Start, a Completed one to Copy', () => {
    const onStart = jest.fn();
    const onCopy = jest.fn();

    const start = plannedLeadingAction(planned, { onStart });
    const copy = completedLeadingAction(completed, { onCopy });

    expect([start.key, copy.key]).toEqual(['start', 'copy']);
    expect([start.label, copy.label]).toEqual(['Start', 'Copy']);
    start.onPress();
    copy.onPress();
    expect(onStart).toHaveBeenCalledWith(planned);
    expect(onCopy).toHaveBeenCalledWith(completed);
  });

  test('neither is destructive — a pull that fires one must never be the red kind', () => {
    expect(plannedLeadingAction(planned, { onStart: jest.fn() }).destructive).toBeUndefined();
    expect(completedLeadingAction(completed, { onCopy: jest.fn() }).destructive).toBeUndefined();
  });
});

describe('completedRowActions', () => {
  const mesocycle = makeMesocycle({ id: 'c', status: 'completed' });

  test('offers History alone — a finished block is neither edited nor deleted', () => {
    const onOpenHistory = jest.fn();
    const items = completedRowActions(mesocycle, { onOpenHistory });

    expect(items.map((item) => item.key)).toEqual(['history']);
    expect(items[0]?.destructive).toBeUndefined();

    items[0]?.onPress();
    expect(onOpenHistory).toHaveBeenCalledWith(mesocycle);
  });
});
