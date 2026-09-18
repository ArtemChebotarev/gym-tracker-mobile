import type { TargetIndicator } from '@domain/execution';
import { targetIndicator } from '@domain/progressionTargetIndicator';

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
