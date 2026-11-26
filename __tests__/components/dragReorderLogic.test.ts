import { dragTargetIndex, moveIndex, rowShiftUnits } from '@components/dragReorderLogic';

describe('dragTargetIndex', () => {
  const ROW_HEIGHT = 58;

  test('stays put when the drag distance is under half a row', () => {
    expect(dragTargetIndex(1, 20, 4, ROW_HEIGHT)).toBe(1);
    expect(dragTargetIndex(1, -20, 4, ROW_HEIGHT)).toBe(1);
  });

  test('moves down one row past the halfway point', () => {
    expect(dragTargetIndex(0, ROW_HEIGHT, 4, ROW_HEIGHT)).toBe(1);
  });

  test('moves up one row past the halfway point', () => {
    expect(dragTargetIndex(2, -ROW_HEIGHT, 4, ROW_HEIGHT)).toBe(1);
  });

  test('clamps to the last row rather than overshooting past the end', () => {
    expect(dragTargetIndex(0, ROW_HEIGHT * 10, 4, ROW_HEIGHT)).toBe(3);
  });

  test('clamps to the first row rather than going negative', () => {
    expect(dragTargetIndex(2, -ROW_HEIGHT * 10, 4, ROW_HEIGHT)).toBe(0);
  });

  test('is always computed from the total distance, not incrementally, so it cannot drift', () => {
    // Two calls with the same (fromIndex, distance) always agree, regardless of how many times
    // the caller re-evaluated it in between — there is no running state to get out of sync.
    expect(dragTargetIndex(0, ROW_HEIGHT * 2, 5, ROW_HEIGHT)).toBe(
      dragTargetIndex(0, ROW_HEIGHT * 2, 5, ROW_HEIGHT),
    );
  });
});

describe('moveIndex', () => {
  test('moves an item later, shifting the ones in between back by one', () => {
    expect(moveIndex(4, 0, 2)).toEqual([1, 2, 0, 3]);
  });

  test('moves an item earlier, shifting the ones in between forward by one', () => {
    expect(moveIndex(4, 3, 1)).toEqual([0, 3, 1, 2]);
  });

  test('is a no-op permutation when fromIndex equals toIndex', () => {
    expect(moveIndex(3, 1, 1)).toEqual([0, 1, 2]);
  });

  test('handles a single-item list', () => {
    expect(moveIndex(1, 0, 0)).toEqual([0]);
  });
});

describe('rowShiftUnits', () => {
  test('dragging down pulls the rows it passes up by one', () => {
    expect([0, 1, 2, 3].map((row) => rowShiftUnits(row, 0, 2))).toEqual([0, -1, -1, 0]);
  });

  test('dragging up pushes the rows it passes down by one', () => {
    expect([0, 1, 2, 3].map((row) => rowShiftUnits(row, 3, 1))).toEqual([0, 1, 1, 0]);
  });

  test('nothing moves while the drag is over its own slot', () => {
    expect([0, 1, 2].map((row) => rowShiftUnits(row, 1, 1))).toEqual([0, 0, 0]);
  });
});
