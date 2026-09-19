import {
  formatIndicator,
  formatRowWeight,
  initialWeightText,
  isRirPlaceholder,
  isStrongIndicator,
  parseReps,
  parseSetEntry,
  parseWeight,
  repsPlaceholder,
} from '@components/WorkoutSetRowLogic';

describe('formatRowWeight', () => {
  test('a plain number, no unit', () => {
    expect(formatRowWeight(60)).toBe('60');
    expect(formatRowWeight(62.5)).toBe('62.5');
  });
});

describe('repsPlaceholder', () => {
  test('the target reps when the set has them', () => {
    expect(repsPlaceholder({ targetReps: 10 }, 2)).toBe('10');
  });

  test("in a deload, last week's actual reps when the set has no target reps", () => {
    expect(repsPlaceholder({ referenceReps: 8 }, 8)).toBe('8');
  });

  test('target reps win over the deload reference', () => {
    expect(repsPlaceholder({ targetReps: 10, referenceReps: 8 }, 2)).toBe('10');
  });

  test("the exercise's target RIR when the set has no target reps", () => {
    expect(repsPlaceholder({}, 3)).toBe('3 RIR');
  });

  test('a dash with neither', () => {
    expect(repsPlaceholder({}, undefined)).toBe('–');
  });
});

describe('formatIndicator', () => {
  test('✓ on target, +N over, −N under', () => {
    expect(formatIndicator({ kind: 'hit' })).toBe('✓');
    expect(formatIndicator({ kind: 'over', diff: 2 })).toBe('+2');
    expect(formatIndicator({ kind: 'under', diff: 1 })).toBe('−1');
  });
});

describe('initialWeightText', () => {
  test('the value of the suggested weight', () => {
    expect(initialWeightText({ suggestedWeight: 62.5 })).toBe('62.5');
  });

  test('empty without one — the field shows its placeholder instead', () => {
    expect(initialWeightText({})).toBe('');
  });
});

describe('parseWeight', () => {
  test('whole and decimal numbers, with a point or a comma', () => {
    expect(parseWeight('60')).toBe(60);
    expect(parseWeight('62.5')).toBe(62.5);
    expect(parseWeight('62,5')).toBe(62.5);
    expect(parseWeight(' 0 ')).toBe(0);
  });

  test('null for empty or non-numeric text', () => {
    expect(parseWeight('')).toBeNull();
    expect(parseWeight('.')).toBeNull();
    expect(parseWeight('6o')).toBeNull();
    expect(parseWeight('-5')).toBeNull();
  });
});

describe('parseReps', () => {
  test('a whole number', () => {
    expect(parseReps('10')).toBe(10);
  });

  test('null for empty, decimal or non-numeric text', () => {
    expect(parseReps('')).toBeNull();
    expect(parseReps('8.5')).toBeNull();
    expect(parseReps('ten')).toBeNull();
  });
});

describe('parseSetEntry', () => {
  test('both fields filled — the entry to log', () => {
    expect(parseSetEntry('62,5', '10')).toEqual({ weight: 62.5, reps: 10 });
  });

  test('DoD: a placeholder is not a value — an empty field keeps Log inactive', () => {
    // The Reps field shows `10` (or `2 RIR`) as a placeholder but holds nothing.
    expect(parseSetEntry('62.5', '')).toBeNull();
    expect(parseSetEntry('', '10')).toBeNull();
  });

  test("the domain's rules decide what's valid: 0 kg is fine, 0 reps isn't", () => {
    expect(parseSetEntry('0', '12')).toEqual({ weight: 0, reps: 12 });
    expect(parseSetEntry('60', '0')).toBeNull();
  });
});

describe('isRirPlaceholder', () => {
  test('only when the placeholder falls back to `N RIR`', () => {
    expect(isRirPlaceholder({}, 2)).toBe(true);
    expect(isRirPlaceholder({ targetReps: 10 }, 2)).toBe(false);
    expect(isRirPlaceholder({ referenceReps: 8 }, 8)).toBe(false);
    expect(isRirPlaceholder({}, undefined)).toBe(false);
  });
});

describe('isStrongIndicator', () => {
  test('on target and over it read brighter than under it', () => {
    expect(isStrongIndicator({ kind: 'hit' })).toBe(true);
    expect(isStrongIndicator({ kind: 'over', diff: 1 })).toBe(true);
    expect(isStrongIndicator({ kind: 'under', diff: 1 })).toBe(false);
  });
});
