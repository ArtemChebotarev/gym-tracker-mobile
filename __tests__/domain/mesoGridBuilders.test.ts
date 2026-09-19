import type { Session } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import {
  buildMesoGrid,
  currentSession,
  currentWeekNumber,
  mesoGridCellStatus,
} from '@domain/mesoGridBuilders';

const mesocycle: Mesocycle = {
  id: 'meso',
  name: 'Upper/lower',
  lengthWeeks: 3,
  daysPerWeek: 2,
  startDate: '2026-09-01T08:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  createdAt: '2026-09-01T08:00:00.000Z',
};

function session(week: number, day: number, overrides: Partial<Session> = {}): Session {
  return {
    id: `w${week}d${day}`,
    mesoId: 'meso',
    weekNumber: week,
    dayNumber: day,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'planned',
    ...overrides,
  };
}

describe('mesoGridCellStatus', () => {
  test.each([
    [{ status: 'completed', prescriptionStatus: 'ready' }, 'completed'],
    [{ status: 'in_progress', prescriptionStatus: 'ready' }, 'in_progress'],
    [{ status: 'skipped', prescriptionStatus: 'ready' }, 'skipped'],
    [{ status: 'planned', prescriptionStatus: 'ready' }, 'ready'],
    [{ status: 'planned', prescriptionStatus: 'awaiting_source' }, 'awaiting'],
  ] as const)('%o is %s', (state, status) => {
    expect(mesoGridCellStatus(state)).toBe(status);
  });

  test('a cell with no session is awaiting', () => {
    expect(mesoGridCellStatus(undefined)).toBe('awaiting');
  });
});

describe('currentSession', () => {
  test('the session in progress, even ahead of an earlier ready one', () => {
    const inProgress = session(2, 2, { status: 'in_progress' });

    expect(currentSession([session(2, 1), inProgress])).toBe(inProgress);
  });

  test('otherwise the earliest ready session, by week then day', () => {
    const earliest = session(2, 1);

    expect(
      currentSession([
        session(3, 1),
        session(2, 2),
        earliest,
        session(1, 1, { status: 'completed' }),
        session(1, 2, { prescriptionStatus: 'awaiting_source' }),
      ]),
    ).toBe(earliest);
  });

  test('none once everything is final', () => {
    expect(
      currentSession([
        session(1, 1, { status: 'completed' }),
        session(1, 2, { status: 'skipped' }),
      ]),
    ).toBeUndefined();
  });
});

describe('currentWeekNumber', () => {
  test('moves with the workouts done, not the calendar', () => {
    // Week 1 has a day left — however long ago it was planned, the block is still on week 1.
    expect(
      currentWeekNumber([session(1, 1, { status: 'completed' }), session(1, 2), session(2, 1)]),
    ).toBe(1);
  });

  test('the week of the session in progress', () => {
    expect(
      currentWeekNumber([
        session(1, 2),
        session(2, 1, { status: 'in_progress' }),
        session(1, 1, { status: 'completed' }),
      ]),
    ).toBe(2);
  });

  test('otherwise the week of the earliest ready session', () => {
    expect(
      currentWeekNumber([
        session(1, 1, { status: 'completed' }),
        session(2, 1),
        session(1, 2, { status: 'skipped' }),
        session(3, 1, { prescriptionStatus: 'awaiting_source' }),
      ]),
    ).toBe(2);
  });

  test('once everything is final, the latest week with a session', () => {
    expect(
      currentWeekNumber([
        session(3, 1, { status: 'completed' }),
        session(2, 1, { status: 'completed' }),
      ]),
    ).toBe(3);
  });

  test('week 1 without any session', () => {
    expect(currentWeekNumber([])).toBe(1);
  });
});

describe('buildMesoGrid', () => {
  test('lays every week × day cell out with its session, and flags the deload week', () => {
    const grid = buildMesoGrid(mesocycle, [
      session(1, 1, { status: 'completed' }),
      session(1, 2, { status: 'in_progress' }),
      session(2, 1),
      session(9, 1),
      session(1, 1, { id: 'other-meso', mesoId: 'other' }),
    ]);

    expect(grid).toEqual({
      mesoId: 'meso',
      name: 'Upper/lower',
      lengthWeeks: 3,
      daysPerWeek: 2,
      currentWeekNumber: 1,
      weeks: [
        {
          weekNumber: 1,
          isDeload: false,
          cells: [
            { weekNumber: 1, dayNumber: 1, status: 'completed', sessionId: 'w1d1' },
            { weekNumber: 1, dayNumber: 2, status: 'in_progress', sessionId: 'w1d2' },
          ],
        },
        {
          weekNumber: 2,
          isDeload: false,
          cells: [
            { weekNumber: 2, dayNumber: 1, status: 'ready', sessionId: 'w2d1' },
            { weekNumber: 2, dayNumber: 2, status: 'awaiting' },
          ],
        },
        {
          weekNumber: 3,
          isDeload: true,
          cells: [
            { weekNumber: 3, dayNumber: 1, status: 'awaiting' },
            { weekNumber: 3, dayNumber: 2, status: 'awaiting' },
          ],
        },
      ],
    });
  });

  test('an awaiting_source session keeps its id', () => {
    const grid = buildMesoGrid(mesocycle, [
      session(2, 2, { prescriptionStatus: 'awaiting_source' }),
    ]);

    expect(grid.weeks[1]?.cells[1]).toEqual({
      weekNumber: 2,
      dayNumber: 2,
      status: 'awaiting',
      sessionId: 'w2d2',
    });
  });
});
