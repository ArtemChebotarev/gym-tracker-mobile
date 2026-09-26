import {
  isMesoGridCellPressable,
  isOpenMesoGridCell,
  mesoGridCellAccessibilityLabel,
  mesoGridCellLook,
} from '@components/MesoGridLogic';

describe('mesoGridCellLook', () => {
  test('a trained day is Done — a session with only some sets logged included', () => {
    // The grid reads the session's status, and a session that finished with part of its rows
    // logged is `completed` (08.7, the cell-state table). Nothing about the grid changes for it.
    expect(mesoGridCellLook({ status: 'completed' })).toBe('done');
  });

  test('DoD 127: a skipped day is its own look, not a trained one', () => {
    expect(mesoGridCellLook({ status: 'skipped' })).toBe('skip');
  });

  test('an abandoned day is empty — not a Skip: the user never passed on it (136)', () => {
    expect(mesoGridCellLook({ status: 'abandoned' })).toBe('left');
  });

  test.each(['ready', 'in_progress', 'awaiting'] as const)(
    'a %s day is still to do — the grid draws them alike',
    (status) => {
      expect(mesoGridCellLook({ status })).toBe('left');
    },
  );
});

describe('mesoGridCellAccessibilityLabel', () => {
  // The grid draws three looks, but a screen reader still gets the real status (task 107).
  test('names the day and its state', () => {
    expect(
      mesoGridCellAccessibilityLabel({ weekNumber: 3, dayNumber: 1, status: 'awaiting' }),
    ).toBe('Week 3 Day 1, not programmed yet');
    expect(
      mesoGridCellAccessibilityLabel({ weekNumber: 2, dayNumber: 4, status: 'in_progress' }),
    ).toBe('Week 2 Day 4, in progress');
    expect(
      mesoGridCellAccessibilityLabel({ weekNumber: 3, dayNumber: 3, status: 'skipped' }),
    ).toBe('Week 3 Day 3, skipped');
    expect(
      mesoGridCellAccessibilityLabel({ weekNumber: 4, dayNumber: 2, status: 'abandoned' }),
    ).toBe('Week 4 Day 2, abandoned');
  });
});

describe('isOpenMesoGridCell', () => {
  test('matches the open day by its session', () => {
    expect(isOpenMesoGridCell({ sessionId: 's-1' }, 's-1')).toBe(true);
    expect(isOpenMesoGridCell({ sessionId: 's-2' }, 's-1')).toBe(false);
  });

  test('a day with no session is never the open one', () => {
    expect(isOpenMesoGridCell({ sessionId: undefined }, 's-1')).toBe(false);
    // Nor when nothing is open: two cells without a session must not match each other.
    expect(isOpenMesoGridCell({ sessionId: undefined }, undefined)).toBe(false);
  });

  test('matches nothing when no day is open', () => {
    expect(isOpenMesoGridCell({ sessionId: 's-1' }, undefined)).toBe(false);
  });
});

describe('isMesoGridCellPressable', () => {
  test('every cell opens something in the overview sheet', () => {
    expect(isMesoGridCellPressable({ sessionId: undefined }, false)).toBe(true);
    expect(isMesoGridCellPressable({ sessionId: 's-1' }, false)).toBe(true);
  });

  test('DoD 127: a stopped block only opens the days that have a session', () => {
    expect(isMesoGridCellPressable({ sessionId: 's-1' }, true)).toBe(true);
    expect(isMesoGridCellPressable({ sessionId: undefined }, true)).toBe(false);
  });
});
