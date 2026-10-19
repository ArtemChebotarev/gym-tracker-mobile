import { validateRoundEntry, validateSetEntry } from '@domain/executionValidators';

describe('validateSetEntry', () => {
  test('accepts entered weight and reps, including bodyweight at 0', () => {
    expect(() => validateSetEntry({ weight: 62.5, reps: 10 })).not.toThrow();
    expect(() => validateSetEntry({ weight: 0, reps: 12 })).not.toThrow();
  });

  test('rejects a missing weight or reps — a placeholder is not a value', () => {
    expect(() => validateSetEntry({ weight: 60, reps: null })).toThrow(/both weight and reps/);
    expect(() => validateSetEntry({ weight: null, reps: 10 })).toThrow(/both weight and reps/);
  });

  test.each([-2.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects weight %p', (weight) => {
    expect(() => validateSetEntry({ weight, reps: 10 })).toThrow(/Weight/);
  });

  test.each([0, -1, 8.5, Number.NaN])('rejects reps %p', (reps) => {
    expect(() => validateSetEntry({ weight: 60, reps })).toThrow(/Reps/);
  });
});

describe('validateRoundEntry', () => {
  test('takes whole seconds: work of at least 1, rest of at least 0 or none', () => {
    expect(() => validateRoundEntry({ workSec: 120, restSec: 45 })).not.toThrow();
    expect(() => validateRoundEntry({ workSec: 30, restSec: 0 })).not.toThrow();
    expect(() => validateRoundEntry({ workSec: 30 })).not.toThrow();
  });

  test('rejects no work, a fraction, or a negative rest', () => {
    expect(() => validateRoundEntry({ workSec: 0 })).toThrow(/Work/);
    expect(() => validateRoundEntry({ workSec: 12.5 })).toThrow(/Work/);
    expect(() => validateRoundEntry({ workSec: 30, restSec: -5 })).toThrow(/Rest/);
  });
});
