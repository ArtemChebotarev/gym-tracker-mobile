import type { SetTarget } from '@domain/execution';
import { targetSetCount } from '@domain/progressionSets';

function rows(count: number): SetTarget[] {
  return Array.from({ length: count }, (_, index) => ({ setNumber: index + 1, targetReps: 10 }));
}

describe('targetSetCount', () => {
  test('copies the planned number of rows when the plan was done as is', () => {
    expect(targetSetCount({ setTargets: rows(3) })).toBe(3);
  });

  test('Add set in the source session adds one set next week', () => {
    // Planned 3, one row added mid-workout → the source finished with 4 rows.
    expect(targetSetCount({ setTargets: rows(4) })).toBe(4);
  });

  test('Remove last set in the source session removes one set next week', () => {
    // Planned 3, the last row removed mid-workout → the source finished with 2 rows.
    expect(targetSetCount({ setTargets: rows(2) })).toBe(2);
  });

  test('skipping the exercise after 1 of 3 logged sets keeps all 3 sets', () => {
    // Set logs are not an input: unlogged rows of a skipped exercise still count.
    expect(targetSetCount({ setTargets: rows(3) })).toBe(3);
  });

  test('skipping the exercise with no logged sets keeps all 3 sets', () => {
    expect(targetSetCount({ setTargets: rows(3) })).toBe(3);
  });
});
