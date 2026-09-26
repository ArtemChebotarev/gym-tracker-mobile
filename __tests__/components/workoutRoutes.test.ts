import {
  historySessionHref,
  mesoGridCellHref,
  workoutHref,
  workoutPickFromParams,
  workoutSlotHref,
} from '@components/workoutRoutes';

describe('workoutRoutes', () => {
  test('historySessionHref pushes the session as its own page, outside the Today tab', () => {
    expect(historySessionHref('session-1')).toEqual({
      pathname: '/session/[id]',
      params: { id: 'session-1' },
    });
  });

  test('workoutHref opens the session inside the Today tab', () => {
    expect(workoutHref('session-1')).toEqual({
      pathname: '/',
      params: { sessionId: 'session-1' },
    });
  });

  test('workoutSlotHref opens a day by mesocycle, week and day inside the Today tab', () => {
    expect(workoutSlotHref({ mesoId: 'meso-1', weekNumber: 3, dayNumber: 2 })).toEqual({
      pathname: '/',
      params: { mesoId: 'meso-1', week: '3', day: '2' },
    });
  });

  test('mesoGridCellHref opens a cell by its session, else by its slot', () => {
    expect(
      mesoGridCellHref('meso-1', {
        weekNumber: 1,
        dayNumber: 1,
        status: 'completed',
        sessionId: 'session-1',
      }),
    ).toEqual(workoutHref('session-1'));
    expect(mesoGridCellHref('meso-1', { weekNumber: 3, dayNumber: 2, status: 'awaiting' })).toEqual(
      workoutSlotHref({ mesoId: 'meso-1', weekNumber: 3, dayNumber: 2 }),
    );
  });

  describe('workoutPickFromParams', () => {
    test('reads back what the hrefs put in', () => {
      expect(workoutPickFromParams({ sessionId: 'session-1' })).toEqual({ sessionId: 'session-1' });
      expect(workoutPickFromParams({ mesoId: 'meso-1', week: '3', day: '2' })).toEqual({
        slot: { mesoId: 'meso-1', weekNumber: 3, dayNumber: 2 },
      });
    });

    test('prefers the session id when a slot was pinned to its session', () => {
      expect(
        workoutPickFromParams({ sessionId: 'session-1', mesoId: 'meso-1', week: '3', day: '2' }),
      ).toEqual({ sessionId: 'session-1' });
    });

    test('picks nothing without params, or with incomplete or malformed slot params', () => {
      expect(workoutPickFromParams({})).toBeUndefined();
      expect(workoutPickFromParams({ mesoId: 'meso-1', week: '3' })).toBeUndefined();
      expect(workoutPickFromParams({ mesoId: 'meso-1', week: 'x', day: '2' })).toBeUndefined();
      expect(workoutPickFromParams({ mesoId: 'meso-1', week: '0', day: '2' })).toBeUndefined();
    });
  });
});
