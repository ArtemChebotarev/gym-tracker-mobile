import { defaultProgressionSettings } from '@domain/mesocycle';
import type { WeightSwap, WeightSwapTarget } from '@domain/weightSwap';
import { buildWeightSwap, evaluateWeightSwap } from '@domain/weightSwapRules';

const settings = defaultProgressionSettings;

/** An ordinary exercise's set: the weight entered is the weight lifted. */
function swapFor(targetReps: number, suggestedWeight: number): WeightSwapTarget {
  const swap = buildWeightSwap({
    target: { targetReps, suggestedWeight },
    settings,
    isDeload: false,
    equipment: 'dumbbell',
  });
  if (swap === undefined || 'unavailable' in swap) {
    throw new Error('expected a weight swap target');
  }
  return swap;
}

/** A `bodyweight-weighted` set: the weight entered is what's hung on the body weight. */
function dipSwap(): WeightSwapTarget {
  const swap = buildWeightSwap({
    target: { targetReps: 7, suggestedWeight: 16 },
    settings,
    isDeload: false,
    equipment: 'bodyweight-weighted',
    bodyWeight: 83,
  });
  if (swap === undefined || 'unavailable' in swap) {
    throw new Error('expected a weight swap target');
  }
  return swap;
}

function repsAt(swap: WeightSwap, weight: number): number | undefined {
  const evaluation = evaluateWeightSwap(swap, weight);
  return evaluation !== undefined && evaluation.zone !== 'out' ? evaluation.reps : undefined;
}

function zoneAt(swap: WeightSwap, weight: number): string | undefined {
  return evaluateWeightSwap(swap, weight)?.zone;
}

// The reference table of 03 · Progression Engine, rule 7 — the formula stays the authority, these
// are the numbers it gives for the sets the spec worked through.
describe('evaluateWeightSwap — the spec’s reference examples', () => {
  test('15 kg × 10 (biceps curl)', () => {
    const swap = swapFor(10, 15);

    expect(repsAt(swap, 14)).toBe(12);
    expect(repsAt(swap, 12)).toBe(15);
    expect(zoneAt(swap, 14)).toBe('close');
    expect(zoneAt(swap, 12)).toBe('close');

    expect(repsAt(swap, 10)).toBe(19);
    expect(repsAt(swap, 8)).toBe(23);
    expect(zoneAt(swap, 10)).toBe('estimate');
    expect(zoneAt(swap, 8)).toBe('estimate');

    expect(evaluateWeightSwap(swap, 20)).toEqual({
      zone: 'out',
      direction: 'tooHeavy',
      bound: 17.5,
    });
    expect(swap.closeRange).toEqual({ min: 12, max: 17.5 });
    expect(swap.estimateRange).toEqual({ min: 4, max: 17.5 });
  });

  test('15 kg × 9 — the same weight, one rep less in the third set', () => {
    const swap = swapFor(9, 15);

    expect(repsAt(swap, 10)).toBe(18);
    expect(zoneAt(swap, 10)).toBe('estimate');
    expect(swap.closeRange).toEqual({ min: 12, max: 17 });
  });

  test('5 kg × 25 (lateral raise)', () => {
    const swap = swapFor(25, 5);

    expect(repsAt(swap, 4)).toBe(27);
    expect(repsAt(swap, 6)).toBe(23);
    // Exactly 20% away, on both sides — still a target, not an estimate.
    expect(zoneAt(swap, 4)).toBe('close');
    expect(zoneAt(swap, 6)).toBe('close');

    expect(repsAt(swap, 7)).toBe(20);
    expect(repsAt(swap, 3)).toBe(30);
    expect(zoneAt(swap, 7)).toBe('estimate');
    expect(zoneAt(swap, 3)).toBe('estimate');

    expect(swap.closeRange).toEqual({ min: 4, max: 6 });
    expect(swap.estimateRange).toEqual({ min: 3, max: 13 });
  });

  test('70 kg × 10 (row)', () => {
    const swap = swapFor(10, 70);

    expect(repsAt(swap, 65)).toBe(12);
    expect(repsAt(swap, 75)).toBe(8);
    expect(repsAt(swap, 60)).toBe(14);
    expect(repsAt(swap, 80)).toBe(6);
    for (const weight of [65, 75, 60, 80]) {
      expect(zoneAt(swap, weight)).toBe('close');
    }
    // The heavy end of ±20% is 84 kg, which is worth 4.6 reps — under the corridor, so the
    // range stops at the heaviest weight still worth 5.
    expect(swap.closeRange).toEqual({ min: 56, max: 82.5 });
  });

  test('dip +16 × 7 at 83 kg of body weight — counted on the full load', () => {
    const swap = dipSwap();

    expect(swap.baseWeight).toBe(99);
    expect(swap.bodyWeight).toBe(83);
    expect(repsAt(swap, 10)).toBe(9);
    expect(repsAt(swap, 20)).toBe(6);
    expect(repsAt(swap, 0)).toBe(12);
    for (const added of [10, 20, 0]) {
      expect(zoneAt(swap, added)).toBe('close');
    }
    // Ranges come back in added weight, and never go below +0 — there is no assisted dip.
    expect(swap.closeRange).toEqual({ min: 0, max: 22.5 });
    expect(swap.estimateRange).toEqual({ min: 0, max: 22.5 });
    expect(evaluateWeightSwap(swap, 25)).toEqual({
      zone: 'out',
      direction: 'tooHeavy',
      bound: 22.5,
    });
  });
});

describe('evaluateWeightSwap — zones', () => {
  test('the weight the target was issued for gives the target itself back', () => {
    expect(evaluateWeightSwap(swapFor(10, 15), 15)).toEqual({ zone: 'target', reps: 10 });
  });

  test('a weight too light for the corridor points back at the lightest one that works', () => {
    expect(evaluateWeightSwap(swapFor(10, 15), 2)).toEqual({
      zone: 'out',
      direction: 'tooLight',
      bound: 4,
    });
  });

  test('both range bounds are weights the corridor still answers for', () => {
    const swap = swapFor(10, 15);

    // 17.5 kg is worth exactly 5.5 reps here — the half rounds up, as it would on paper.
    expect(repsAt(swap, swap.estimateRange.max)).toBe(6);
    expect(repsAt(swap, swap.estimateRange.min)).toBe(30);
    expect(zoneAt(swap, swap.closeRange.max)).toBe('close');
    expect(zoneAt(swap, swap.closeRange.min)).toBe('close');
  });

  test('no weight, no answer', () => {
    const swap = swapFor(10, 15);

    expect(evaluateWeightSwap(swap, 0)).toBeUndefined();
    expect(evaluateWeightSwap(undefined, 12)).toBeUndefined();
    expect(evaluateWeightSwap({ unavailable: 'no_history' }, 12)).toBeUndefined();
  });

  test('a logged set is judged by the body weight it was logged with', () => {
    const swap = dipSwap();

    // The block now says 83 kg, but this set went up on 90 — a heavier load for the same +10.
    expect(evaluateWeightSwap(swap, 10, 90)).toEqual({ zone: 'close', reps: 7 });
    expect(evaluateWeightSwap(swap, 10)).toEqual({ zone: 'close', reps: 9 });
  });
});

describe('buildWeightSwap — when the rule applies at all', () => {
  const target = { targetReps: 10, suggestedWeight: 15 };

  test('a deload set has no swap: its weight is a fraction of a working one', () => {
    expect(buildWeightSwap({ target, settings, isDeload: true })).toBeUndefined();
  });

  test('a pure bodyweight set has no swap: there is no weight to change', () => {
    expect(
      buildWeightSwap({
        target: { targetReps: 10 },
        settings,
        isDeload: false,
        equipment: 'bodyweight',
      }),
    ).toBeUndefined();
  });

  test('a weighted bodyweight set has no swap until the block knows the body weight', () => {
    expect(
      buildWeightSwap({
        target: { targetReps: 7, suggestedWeight: 16 },
        settings,
        isDeload: false,
        equipment: 'bodyweight-weighted',
      }),
    ).toBeUndefined();
  });

  test('half a target is no target — week 1 of Flow A/B, or no reference under rule 6', () => {
    expect(buildWeightSwap({ target: {}, settings, isDeload: false })).toEqual({
      unavailable: 'no_history',
    });
    expect(buildWeightSwap({ target: { targetReps: 10 }, settings, isDeload: false })).toEqual({
      unavailable: 'no_history',
    });
    expect(buildWeightSwap({ target: { suggestedWeight: 15 }, settings, isDeload: false })).toEqual(
      { unavailable: 'no_history' },
    );
  });

  test('a pair that doesn’t add up gives no numbers either', () => {
    expect(
      buildWeightSwap({
        target: { targetReps: 10, suggestedWeight: 0 },
        settings,
        isDeload: false,
      }),
    ).toEqual({ unavailable: 'no_history' });
    expect(
      buildWeightSwap({
        target: { targetReps: 31, suggestedWeight: 15 },
        settings,
        isDeload: false,
      }),
    ).toEqual({ unavailable: 'no_history' });
  });

  test('the corridor comes from the block’s settings, not from the module', () => {
    const swap = buildWeightSwap({
      target,
      settings: { minReps: 8, maxReps: 20 },
      isDeload: false,
    });

    expect(swap).toMatchObject({ corridor: { minReps: 8, maxReps: 20 } });
    // 8 kg is worth 23 reps against this target — over a corridor that stops at 20.
    expect(evaluateWeightSwap(swap, 8)).toEqual({
      zone: 'out',
      direction: 'tooLight',
      bound: 9.5,
    });
  });
});
