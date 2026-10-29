import {
  bandRepsPlate,
  formatWeightHint,
  strengthRepsInfo,
  strengthWeightColumnLabel,
} from '@components/StrengthExerciseCardLogic';
import { weightSwapPopover } from '@components/WeightSwapLogic';

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

// Artem's review (18.10.2026): a band's Reps ⓘ — the strength plate's shape, a band's words.
describe('bandRepsPlate', () => {
  test('the 5–30 corridor, which band to take, and what to do at the top', () => {
    const plate = bandRepsPlate();

    expect(plate.corridor.inner).toEqual({ min: 5, max: 30 });
    expect(plate.steps[0]).toEqual(['Pick a band you can do ', { strong: '5–30 reps' }, ' with.']);
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

describe('strengthRepsInfo', () => {
  const swap = weightSwapPopover(
    { setNumber: 1, weightSwap: { unavailable: 'no_history' } },
    2,
  );

  test('a band always has its own plate', () => {
    expect(strengthRepsInfo('resistance-band', undefined)?.kind).toBe('band');
  });

  test('any other exercise has the weight swap’s, while the card offers one', () => {
    expect(strengthRepsInfo('barbell', swap)?.kind).toBe('swap');
    expect(strengthRepsInfo('barbell', undefined)).toBeUndefined();
  });
});
