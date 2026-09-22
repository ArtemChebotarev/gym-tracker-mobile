import type { TargetIndicator } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { targetIndicator, targetIndicatorAtWeight } from '@domain/progressionTargetIndicator';
import { buildWeightSwap } from '@domain/weightSwapRules';

describe('targetIndicator', () => {
  test('hit when the logged reps match the target', () => {
    expect(targetIndicator({ targetReps: 10 }, { reps: 10 })).toEqual<TargetIndicator>({
      kind: 'hit',
    });
  });

  test('over with the rep surplus when more reps were done', () => {
    expect(targetIndicator({ targetReps: 10 }, { reps: 12 })).toEqual<TargetIndicator>({
      kind: 'over',
      diff: 2,
    });
  });

  test('under with the rep shortfall when fewer reps were done', () => {
    expect(targetIndicator({ targetReps: 10 }, { reps: 7 })).toEqual<TargetIndicator>({
      kind: 'under',
      diff: 3,
    });
  });

  test('no indicator when the set has no target reps', () => {
    expect(targetIndicator({}, { reps: 10 })).toBeUndefined();
  });
});

describe('targetIndicatorAtWeight', () => {
  const settings = defaultProgressionSettings;
  const swap = buildWeightSwap({
    target: { targetReps: 10, suggestedWeight: 15 },
    settings,
    isDeload: false,
    equipment: 'dumbbell',
  });

  test('the target weight is judged against the target reps', () => {
    expect(
      targetIndicatorAtWeight({ targetReps: 10 }, { reps: 10, weight: 15 }, swap),
    ).toEqual<TargetIndicator>({ kind: 'hit' });
  });

  test('a close weight is judged against what that weight was worth', () => {
    // 14 kg is worth 12 reps against a 15 kg × 10 target, so 12 is a hit and 10 is three under.
    expect(
      targetIndicatorAtWeight({ targetReps: 10 }, { reps: 12, weight: 14 }, swap),
    ).toEqual<TargetIndicator>({ kind: 'hit' });
    expect(
      targetIndicatorAtWeight({ targetReps: 10 }, { reps: 10, weight: 14 }, swap),
    ).toEqual<TargetIndicator>({ kind: 'under', diff: 2 });
  });

  test('no marker once the weight is only an estimate, or off the corridor', () => {
    expect(
      targetIndicatorAtWeight({ targetReps: 10 }, { reps: 19, weight: 10 }, swap),
    ).toBeUndefined();
    expect(
      targetIndicatorAtWeight({ targetReps: 10 }, { reps: 3, weight: 20 }, swap),
    ).toBeUndefined();
  });

  test('without a swap the plain comparison stands — a deload or pure bodyweight set', () => {
    expect(
      targetIndicatorAtWeight({ targetReps: 10 }, { reps: 11, weight: 83 }, undefined),
    ).toEqual<TargetIndicator>({ kind: 'over', diff: 1 });
  });

  test('a weighted bodyweight set is judged on the body weight it was logged with', () => {
    const dip = buildWeightSwap({
      target: { targetReps: 7, suggestedWeight: 16 },
      settings,
      isDeload: false,
      equipment: 'bodyweight-weighted',
      bodyWeight: 83,
    });

    // +10 on 83 kg is worth 9 reps; the same +10 on 90 kg is a heavier load, worth 7.
    expect(
      targetIndicatorAtWeight({ targetReps: 7 }, { reps: 9, weight: 10, bodyWeight: 83 }, dip),
    ).toEqual<TargetIndicator>({ kind: 'hit' });
    expect(
      targetIndicatorAtWeight({ targetReps: 7 }, { reps: 9, weight: 10, bodyWeight: 90 }, dip),
    ).toEqual<TargetIndicator>({ kind: 'over', diff: 2 });
  });
});
