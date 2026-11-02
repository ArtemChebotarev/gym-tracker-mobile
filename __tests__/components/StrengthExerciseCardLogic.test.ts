import {
  bandRepsPlate,
  showsBandInfo,
  formatWeightHint,
  strengthWeightColumnLabel,
} from '@components/StrengthExerciseCardLogic';

describe('formatWeightHint on a resistance band', () => {
  test('says tighter band or slower tempo instead of going heavier', () => {
    expect(formatWeightHint({ direction: 'increase', reps: 30 }, 'resistance-band')).toBe(
      'Try tighter band or slow down tempo',
    );
  });
});

describe('formatWeightHint', () => {
  test('go heavier names the upper bound reached', () => {
    expect(formatWeightHint({ direction: 'increase', reps: 30 })).toBe(
      'Go heavier — 30+ reps last week',
    );
  });

  test('go lighter names the lower bound missed', () => {
    expect(formatWeightHint({ direction: 'decrease', reps: 5 })).toBe(
      'Go lighter — under 5 reps last week',
    );
  });
});

// GT-82; 10.1 FR-15 and Artem's review (18.10.2026): what the Weight column holds.
describe('strengthWeightColumnLabel', () => {
  test('Weight, or Added on a weighted bodyweight exercise', () => {
    expect(strengthWeightColumnLabel(undefined)).toBe('Weight, kg');
    expect(strengthWeightColumnLabel('bodyweight-weighted')).toBe('Added, kg');
  });

  test('a band holds the body weight, so its column says so', () => {
    expect(strengthWeightColumnLabel('resistance-band')).toBe('Bodyweight, kg');
  });
});

// 08.11, "Правило ⓘ": the same rule as the Weight ⓘ, on the band's own condition.
describe('showsBandInfo', () => {
  test('a band in a live workout', () => {
    expect(showsBandInfo('live', false, 'resistance-band')).toBe(true);
  });

  test('not on a deload, not outside a live workout', () => {
    expect(showsBandInfo('live', true, 'resistance-band')).toBe(false);
    expect(showsBandInfo('readonly', false, 'resistance-band')).toBe(false);
  });

  test('only a band', () => {
    expect(showsBandInfo('live', false, 'bodyweight')).toBe(false);
    expect(showsBandInfo('live', false, undefined)).toBe(false);
  });
});

// 08.11, "Резина: ⓘ в первой колонке" — the plate behind a band's ⓘ.
describe('bandRepsPlate', () => {
  test('the range to stay in, its 5–30 corridor, and what to do at the top', () => {
    const plate = bandRepsPlate();

    expect(plate.corridor.inner).toEqual({ min: 5, max: 30 });
    expect(plate.steps[0]).toEqual(['Stay in the ', { strong: '5–30 reps' }, ' range.']);
    expect(plate.steps[1]).toEqual(['Stop each set with ', { strong: 'a few reps in reserve' }, '.']);
    expect(plate.steps[2]).toEqual([
      'At ',
      { strong: '30 reps' },
      ', take a tighter band or slow down the tempo.',
    ]);
  });

  test('says nothing about RIR — a band has none (10.1 FR-15)', () => {
    expect(JSON.stringify(bandRepsPlate())).not.toMatch(/RIR/);
  });
});
