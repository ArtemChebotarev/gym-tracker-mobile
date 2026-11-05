import { defaultProgressionSettings } from '@domain/mesocycle';
import { weightHintForReps } from '@domain/progressionWeightHint';

describe('weightHintForReps', () => {
  test.each([30, 31, 45])('suggests increasing the weight at %i reps (upper bound inclusive)', (reps) => {
    expect(weightHintForReps(reps, defaultProgressionSettings)).toBe('increase');
  });

  test.each([4, 1, 0])('suggests decreasing the weight at %i reps (below the lower bound)', (reps) => {
    expect(weightHintForReps(reps, defaultProgressionSettings)).toBe('decrease');
  });

  test.each([5, 12, 29])('gives no hint at %i reps (inside the corridor)', (reps) => {
    expect(weightHintForReps(reps, defaultProgressionSettings)).toBeUndefined();
  });

  test('follows the mesocycle’s own corridor, not the defaults', () => {
    const settings = { minReps: 8, maxReps: 20 };
    expect(weightHintForReps(20, settings)).toBe('increase');
    expect(weightHintForReps(7, settings)).toBe('decrease');
    expect(weightHintForReps(8, settings)).toBeUndefined();
  });
});
