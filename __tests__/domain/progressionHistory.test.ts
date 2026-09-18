import type { SetLog } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { prescribeFromHistory, referenceSetFor } from '@domain/progressionHistory';

function log(setNumber: number, weight: number, reps: number): SetLog {
  return {
    id: `ref-log-${setNumber}`,
    sessionExerciseId: 'ref',
    exerciseId: 'exercise-curl',
    setNumber,
    weight,
    reps,
    completedAt: '2026-09-10T08:00:00.000Z',
  };
}

const set1 = log(1, 20, 12);
const set2 = log(2, 20, 10);
const set3 = log(3, 17.5, 9);
const reference = [set1, set2, set3];

describe('referenceSetFor', () => {
  test('row N takes the reference’s set N', () => {
    expect(referenceSetFor(reference, 2)).toBe(set2);
  });

  test('rows past the reference take its last set', () => {
    expect(referenceSetFor(reference, 5)).toBe(set3);
  });

  test('goes by set order, not by the order logs were passed in', () => {
    const shuffled = [set3, set1, set2];
    expect(referenceSetFor(shuffled, 1)).toBe(set1);
    expect(referenceSetFor(shuffled, 4)).toBe(set3);
  });

  test('is undefined without a reference', () => {
    expect(referenceSetFor([], 1)).toBeUndefined();
  });
});

describe('prescribeFromHistory', () => {
  test('reference found: reps + 1 and the reference weight per row', () => {
    expect(prescribeFromHistory(reference, 3, defaultProgressionSettings)).toEqual([
      { setNumber: 1, targetReps: 13, suggestedWeight: 20 },
      { setNumber: 2, targetReps: 11, suggestedWeight: 20 },
      { setNumber: 3, targetReps: 10, suggestedWeight: 17.5 },
    ]);
  });

  test.each([
    ['null', null],
    ['empty', []],
  ])('no reference (%s): rows carry neither target reps nor weight', (_, logs) => {
    expect(prescribeFromHistory(logs, 2, defaultProgressionSettings)).toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
    ]);
  });

  test('more rows than reference sets: extra rows repeat the last reference set', () => {
    expect(prescribeFromHistory(reference.slice(0, 2), 4, defaultProgressionSettings)).toEqual([
      { setNumber: 1, targetReps: 13, suggestedWeight: 20 },
      { setNumber: 2, targetReps: 11, suggestedWeight: 20 },
      { setNumber: 3, targetReps: 11, suggestedWeight: 20 },
      { setNumber: 4, targetReps: 11, suggestedWeight: 20 },
    ]);
  });

  test('fewer rows than reference sets: only the first rows are used', () => {
    expect(prescribeFromHistory(reference, 1, defaultProgressionSettings)).toEqual([
      { setNumber: 1, targetReps: 13, suggestedWeight: 20 },
    ]);
  });

  test('clamps up to 5 and hints to lower the weight below the corridor', () => {
    expect(prescribeFromHistory([log(1, 100, 3)], 1, defaultProgressionSettings)).toEqual([
      { setNumber: 1, targetReps: 5, suggestedWeight: 100, weightHint: 'decrease' },
    ]);
  });

  test('clamps down to 30 and hints to raise the weight at the top of the corridor', () => {
    expect(prescribeFromHistory([log(1, 10, 30)], 1, defaultProgressionSettings)).toEqual([
      { setNumber: 1, targetReps: 30, suggestedWeight: 10, weightHint: 'increase' },
    ]);
  });

  test('zero rows give an empty plan', () => {
    expect(prescribeFromHistory(reference, 0, defaultProgressionSettings)).toEqual([]);
  });

  test('is deterministic and leaves its input untouched', () => {
    const logs = [set3, set1, set2];
    const snapshot = structuredClone(logs);
    const first = prescribeFromHistory(logs, 4, defaultProgressionSettings);
    const second = prescribeFromHistory(logs, 4, defaultProgressionSettings);
    expect(second).toEqual(first);
    expect(logs).toEqual(snapshot);
  });
});
