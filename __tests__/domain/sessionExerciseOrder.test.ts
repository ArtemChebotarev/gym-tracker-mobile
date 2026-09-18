import { renumbered } from '@domain/sessionExerciseOrder';

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
