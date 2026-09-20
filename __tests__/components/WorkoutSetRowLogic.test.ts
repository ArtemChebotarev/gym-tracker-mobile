import {
  formatIndicator,
  formatLoggedWeight,
  formatRowWeight,
  initialWeightText,
  isRirPlaceholder,
  isStrongIndicator,
  parseReps,
  parseWeight,
  repsPlaceholder,
  resolveSetEntry,
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

describe('resolveSetEntry', () => {
  const TARGETED = { targetReps: 10 };

  test('both fields filled — the entry to log', () => {
    expect(resolveSetEntry('62,5', '8', TARGETED)).toEqual({ weight: 62.5, reps: 8 });
  });

  test('an empty Reps field takes the target reps — one tap logs a row left as recommended', () => {
    expect(resolveSetEntry('62.5', '', TARGETED)).toEqual({ weight: 62.5, reps: 10 });
    expect(resolveSetEntry('62.5', '  ', TARGETED)).toEqual({ weight: 62.5, reps: 10 });
  });

  test('DoD 104: in a deload an empty Reps field takes the reference reps — the same one tap', () => {
    expect(resolveSetEntry('30', '', { referenceReps: 9 })).toEqual({ weight: 30, reps: 9 });
    expect(resolveSetEntry('30', '  ', { referenceReps: 9 })).toEqual({ weight: 30, reps: 9 });
  });

  test('DoD 104: target reps win over the deload reference, as the placeholder does', () => {
    expect(resolveSetEntry('62.5', '', { targetReps: 10, referenceReps: 9 })).toEqual({
      weight: 62.5,
      reps: 10,
    });
  });

  test('DoD 104: typed reps win over both', () => {
    expect(resolveSetEntry('30', '7', { referenceReps: 9 })).toEqual({ weight: 30, reps: 7 });
  });

  test('DoD 104: with neither, an empty Reps field keeps Log inactive — `N RIR` is not a rep count', () => {
    expect(resolveSetEntry('62.5', '', {})).toBeNull();
  });

  test('an empty Weight field is never filled in', () => {
    expect(resolveSetEntry('', '10', TARGETED)).toBeNull();
    expect(resolveSetEntry('', '', TARGETED)).toBeNull();
  });

  test('typed reps that are not a whole number are not replaced by the target', () => {
    expect(resolveSetEntry('62.5', '8.5', TARGETED)).toBeNull();
  });

  test("the domain's rules decide what's valid: 0 kg is fine, 0 reps isn't", () => {
    expect(resolveSetEntry('0', '12', {})).toEqual({ weight: 0, reps: 12 });
    expect(resolveSetEntry('60', '0', TARGETED)).toBeNull();
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

describe('the Weight column on a bodyweight exercise (task 105)', () => {
  describe('formatLoggedWeight', () => {
    test('DoD: a weighted set reads as the body weight and what was added, kept apart', () => {
      expect(formatLoggedWeight({ weight: 10, bodyWeight: 80 }, 'bodyweight-weighted')).toBe(
        '80 (+10)',
      );
      expect(formatLoggedWeight({ weight: 5, bodyWeight: 83 }, 'bodyweight-weighted')).toBe(
        '83 (+5)',
      );
    });

    test('DoD: a pure bodyweight set is a plain number — its weight is already the load', () => {
      expect(formatLoggedWeight({ weight: 80 }, 'bodyweight')).toBe('80');
    });

    test('DoD: an ordinary exercise is unchanged', () => {
      expect(formatLoggedWeight({ weight: 62.5 }, 'barbell')).toBe('62.5');
      expect(formatLoggedWeight({ weight: 62.5 }, undefined)).toBe('62.5');
    });

    test('with no body weight recorded there is only the added weight to show', () => {
      expect(formatLoggedWeight({ weight: 10 }, 'bodyweight-weighted')).toBe('(+10)');
    });
  });

  describe('initialWeightText', () => {
    test("DoD: a pure bodyweight field starts at the block's body weight", () => {
      expect(initialWeightText({}, 'bodyweight', 80)).toBe('80');
    });

    test('empty until the body weight has been asked for', () => {
      expect(initialWeightText({}, 'bodyweight', undefined)).toBe('');
    });

    test("a pure bodyweight exercise has no suggested weight to prefer anyway", () => {
      expect(initialWeightText({ suggestedWeight: 62.5 }, 'bodyweight', 80)).toBe('80');
    });

    test('DoD: a weighted one starts at its suggested added weight, not the body weight', () => {
      expect(initialWeightText({ suggestedWeight: 10 }, 'bodyweight-weighted', 80)).toBe('10');
    });

    test('an ordinary exercise ignores the body weight entirely', () => {
      expect(initialWeightText({ suggestedWeight: 60 }, 'barbell', 80)).toBe('60');
    });
  });
});
