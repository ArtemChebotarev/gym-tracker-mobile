import { isConflictError } from '@domain/errors';
import type { SetTarget } from '@domain/execution';
import {
  withAddedRound,
  withAddedSet,
  withoutLastRound,
  withoutLastSet,
} from '@domain/sessionExerciseSets';

const rows: SetTarget[] = [
  { setNumber: 1, targetReps: 11, suggestedWeight: 60, weightHint: 'increase' },
  { setNumber: 2, targetReps: 10, suggestedWeight: 62.5, weightHint: 'increase' },
];

describe('withAddedSet', () => {
  test('appends the next row with the last row’s suggestedWeight only — no targetReps, no hint', () => {
    expect(withAddedSet(rows)).toEqual([
      ...rows,
      { setNumber: 3, suggestedWeight: 62.5 },
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

const rounds: SetTarget[] = [
  { setNumber: 1, targetWorkSec: 120, targetRestSec: 45 },
  { setNumber: 2, targetWorkSec: 135, targetRestSec: 30 },
];

describe('withAddedRound', () => {
  test('appends the next round with the last round’s work and rest', () => {
    expect(withAddedRound(rounds)).toEqual([
      ...rounds,
      { setNumber: 3, targetWorkSec: 135, targetRestSec: 30 },
    ]);
  });

  test('a logged last round passes on the times it was done with', () => {
    const log = { workSec: 150, restSec: 20, restSkipped: false, completed: true };

    expect(withAddedRound(rounds, log).at(-1)).toEqual({
      setNumber: 3,
      targetWorkSec: 150,
      targetRestSec: 20,
    });
  });

  test('a round ended early or a skipped rest is a one-off: the plan stays', () => {
    const log = { workSec: 40, restSec: 5, restSkipped: true, completed: false };

    expect(withAddedRound(rounds, log).at(-1)).toEqual({
      setNumber: 3,
      targetWorkSec: 135,
      targetRestSec: 30,
    });
  });

  test('a last round with no times of its own adds one with none — the plan fills them', () => {
    expect(withAddedRound([{ setNumber: 1 }])).toEqual([{ setNumber: 1 }, { setNumber: 2 }]);
  });
});

describe('withoutLastRound', () => {
  test('drops the last round and returns it', () => {
    expect(withoutLastRound(rounds)).toEqual({ setTargets: [rounds[0]], removed: rounds[1] });
  });

  test('rejects removing the only round', () => {
    let error: unknown;
    try {
      withoutLastRound([{ setNumber: 1, targetWorkSec: 120 }]);
    } catch (caught) {
      error = caught;
    }

    expect(isConflictError(error)).toBe(true);
    expect((error as Error).message).toMatch(/only round/);
  });
});
