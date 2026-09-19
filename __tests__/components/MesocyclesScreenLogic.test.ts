import type { Mesocycle } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import {
  formatActiveCaption,
  formatCompletedCaption,
  formatPlannedCaption,
  getWeekDots,
  groupMesocycles,
  isEmptyGroups,
} from '@components/MesocyclesScreenLogic';

function makeMesocycle(overrides: Partial<Mesocycle>): Mesocycle {
  return {
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
  test('splits by status, drops abandoned, and orders completed newest-finished first', () => {
    const active = makeMesocycle({ id: 'a', status: 'active' });
    const planned = makeMesocycle({ id: 'p', status: 'planned' });
    const abandoned = makeMesocycle({ id: 'x', status: 'abandoned' });
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

    const groups = groupMesocycles([older, abandoned, planned, newer, active]);

    expect(groups.active).toBe(active);
    expect(groups.planned).toEqual([planned]);
    expect(groups.completed.map((m) => m.id)).toEqual(['c2', 'c1']);
  });

  test('isEmptyGroups is true only when nothing renders', () => {
    expect(isEmptyGroups(groupMesocycles([]))).toBe(true);
    expect(isEmptyGroups(groupMesocycles([makeMesocycle({ status: 'abandoned' })]))).toBe(true);
    expect(isEmptyGroups(groupMesocycles([makeMesocycle({ status: 'planned' })]))).toBe(false);
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
