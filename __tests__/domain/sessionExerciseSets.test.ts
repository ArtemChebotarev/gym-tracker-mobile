import { isConflictError } from '@domain/errors';
import type { SetTarget } from '@domain/execution';
import { withAddedSet, withoutLastSet } from '@domain/sessionExerciseSets';

const rows: SetTarget[] = [
  { setNumber: 1, targetReps: 11, suggestedWeight: 60, weightHint: 'increase' },
  { setNumber: 2, targetReps: 10, suggestedWeight: 62.5, weightHint: 'increase' },
];

describe('withAddedSet', () => {
  test('appends the next row with the last row’s targetReps and suggestedWeight, without its hint', () => {
    expect(withAddedSet(rows)).toEqual([
      ...rows,
      { setNumber: 3, targetReps: 10, suggestedWeight: 62.5 },
    ]);
  });

  test('a last row with no targets (only RIR) adds a row with none either', () => {
    expect(withAddedSet([{ setNumber: 1 }])).toEqual([{ setNumber: 1 }, { setNumber: 2 }]);
  });

  test('does not mutate the input', () => {
    const input = [...rows];

    withAddedSet(input);

    expect(input).toEqual(rows);
  });
});

describe('withoutLastSet', () => {
  test('drops the last row and returns it', () => {
    expect(withoutLastSet(rows)).toEqual({ setTargets: [rows[0]], removed: rows[1] });
  });

  test('rejects removing the only row', () => {
    let error: unknown;
    try {
      withoutLastSet([{ setNumber: 1 }]);
    } catch (caught) {
      error = caught;
    }

    expect(isConflictError(error)).toBe(true);
  });
});
