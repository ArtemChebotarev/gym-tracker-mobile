import { isDeloadWeek } from '@domain/mesocycleWeeks';

describe('isDeloadWeek', () => {
  test('is the last week of the block', () => {
    expect(isDeloadWeek(5, 5)).toBe(true);
    expect(isDeloadWeek(5, 4)).toBe(false);
  });

  test.each([3, 4, 6, 7, 8])('holds for a %i-week block', (lengthWeeks) => {
    expect(isDeloadWeek(lengthWeeks, lengthWeeks)).toBe(true);
    expect(isDeloadWeek(lengthWeeks, lengthWeeks - 1)).toBe(false);
    expect(isDeloadWeek(lengthWeeks, 1)).toBe(false);
  });

  // It answers the question it was asked rather than guarding the block's length: that is checked
  // where a mesocycle is built, and a predicate that throws is one every caller has to gate.
  test('does not validate the block length', () => {
    expect(() => isDeloadWeek(99, 1)).not.toThrow();
  });
});
