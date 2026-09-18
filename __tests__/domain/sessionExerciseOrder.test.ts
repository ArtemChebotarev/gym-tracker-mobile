import { isConflictError, isNotFoundError } from '@domain/errors';
import { nextOrder, renumbered, swappedWithNeighbour } from '@domain/sessionExerciseOrder';

describe('renumbered', () => {
  test('sorts by order and closes gaps, 1-based', () => {
    const exercises = [
      { id: 'c', order: 5 },
      { id: 'a', order: 1 },
      { id: 'b', order: 3 },
    ];

    expect(renumbered(exercises)).toEqual([
      { id: 'a', order: 1 },
      { id: 'b', order: 2 },
      { id: 'c', order: 3 },
    ]);
  });

  test('an already contiguous list is unchanged, and the input is not mutated', () => {
    const exercises = [
      { id: 'a', order: 1 },
      { id: 'b', order: 2 },
    ];

    expect(renumbered(exercises)).toEqual(exercises);
    expect(exercises).toEqual([
      { id: 'a', order: 1 },
      { id: 'b', order: 2 },
    ]);
  });

  test('an empty list stays empty', () => {
    expect(renumbered([])).toEqual([]);
  });
});

describe('swappedWithNeighbour', () => {
  const exercises = [
    { id: 'c', order: 3 },
    { id: 'a', order: 1 },
    { id: 'b', order: 2 },
  ];

  function errorFrom(run: () => unknown): unknown {
    try {
      run();
    } catch (error) {
      return error;
    }
    throw new Error('Expected the call to throw.');
  }

  test('up swaps order with the previous exercise', () => {
    expect(swappedWithNeighbour(exercises, 'b', 'up')).toEqual([
      { id: 'b', order: 1 },
      { id: 'a', order: 2 },
    ]);
  });

  test('down swaps order with the next exercise', () => {
    expect(swappedWithNeighbour(exercises, 'b', 'down')).toEqual([
      { id: 'b', order: 3 },
      { id: 'c', order: 2 },
    ]);
  });

  test('the first exercise cannot move up, the last cannot move down', () => {
    expect(isConflictError(errorFrom(() => swappedWithNeighbour(exercises, 'a', 'up')))).toBe(true);
    expect(isConflictError(errorFrom(() => swappedWithNeighbour(exercises, 'c', 'down')))).toBe(
      true,
    );
  });

  test('an unknown exercise is NotFound', () => {
    expect(isNotFoundError(errorFrom(() => swappedWithNeighbour(exercises, 'x', 'up')))).toBe(true);
  });
});

describe('nextOrder', () => {
  test('one past the highest order', () => {
    expect(nextOrder([{ order: 2 }, { order: 1 }])).toBe(3);
  });

  test('1 for an empty session', () => {
    expect(nextOrder([])).toBe(1);
  });
});
