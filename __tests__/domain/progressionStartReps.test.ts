import type { SetLog } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { prescribeBlockStart, startTargetReps } from '@domain/progressionStartReps';
import { STAMPS } from '../fixtures/stamps';

function log(setNumber: number, weight: number, reps: number): SetLog {
  return {
    ...STAMPS,
    id: `ref-log-${setNumber}`,
    sessionExerciseId: 'ref',
    exerciseId: 'exercise-bench-press',
    setNumber,
    weight,
    reps,
    completedAt: '2026-09-10T08:00:00.000Z',
  };
}

describe('startTargetReps', () => {
  test('DoD: the spec’s example — 10 reps at RIR 0, new startRir 3, gives 7', () => {
    expect(startTargetReps(10, 0, 3, defaultProgressionSettings)).toBe(7);
  });

  test('DoD: a reference that wasn’t at RIR 0 — 10 at RIR 2 with startRir 3 gives 9', () => {
    expect(startTargetReps(10, 2, 3, defaultProgressionSettings)).toBe(9);
  });

  test('DoD: clamps to the corridor’s floor', () => {
    expect(startTargetReps(6, 0, 3, defaultProgressionSettings)).toBe(
      defaultProgressionSettings.minReps,
    );
  });

  test('DoD: clamps to the corridor’s ceiling', () => {
    expect(startTargetReps(30, 0, 0, defaultProgressionSettings)).toBe(
      defaultProgressionSettings.maxReps,
    );
  });

  test('no +1: a reference already at the new block’s RIR keeps its reps', () => {
    expect(startTargetReps(12, 3, 3, defaultProgressionSettings)).toBe(12);
  });

  test('a reference at a higher RIR than the block’s start moves the reps up', () => {
    expect(startTargetReps(10, 4, 3, defaultProgressionSettings)).toBe(11);
  });
});

describe('prescribeBlockStart', () => {
  test('DoD: each set is re-priced on its own — 10/9/8 at RIR 0 with startRir 3 give 7/6/5', () => {
    expect(
      prescribeBlockStart(
        [log(1, 60, 10), log(2, 60, 9), log(3, 55, 8)],
        0,
        3,
        3,
        defaultProgressionSettings,
      ),
    ).toEqual([
      { setNumber: 1, targetReps: 7, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 6, suggestedWeight: 60 },
      { setNumber: 3, targetReps: 5, suggestedWeight: 55 },
    ]);
  });

  test('the reference weight is carried over as is', () => {
    expect(prescribeBlockStart([log(1, 62.5, 12)], 1, 3, 1, defaultProgressionSettings)).toEqual([
      { setNumber: 1, targetReps: 10, suggestedWeight: 62.5 },
    ]);
  });

  test.each([
    ['null', null],
    ['empty', []],
  ])('no reference (%s): rows carry neither target reps nor weight', (_, logs) => {
    expect(prescribeBlockStart(logs, 0, 3, 2, defaultProgressionSettings)).toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
    ]);
  });

  test('more rows than reference sets: extra rows repeat the last reference set', () => {
    expect(
      prescribeBlockStart([log(1, 60, 10), log(2, 60, 9)], 0, 3, 4, defaultProgressionSettings),
    ).toEqual([
      { setNumber: 1, targetReps: 7, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 6, suggestedWeight: 60 },
      { setNumber: 3, targetReps: 6, suggestedWeight: 60 },
      { setNumber: 4, targetReps: 6, suggestedWeight: 60 },
    ]);
  });

  test('no weight hint is carried, at either end of the corridor', () => {
    expect(prescribeBlockStart([log(1, 100, 4)], 0, 0, 1, defaultProgressionSettings)).toEqual([
      { setNumber: 1, targetReps: 5, suggestedWeight: 100 },
    ]);
    expect(prescribeBlockStart([log(1, 10, 30)], 0, 0, 1, defaultProgressionSettings)).toEqual([
      { setNumber: 1, targetReps: 30, suggestedWeight: 10 },
    ]);
  });

  test('zero rows give an empty plan', () => {
    expect(prescribeBlockStart([log(1, 60, 10)], 0, 3, 0, defaultProgressionSettings)).toEqual([]);
  });

  test('is deterministic and leaves its input untouched', () => {
    const logs = [log(3, 55, 8), log(1, 60, 10), log(2, 60, 9)];
    const snapshot = structuredClone(logs);
    const first = prescribeBlockStart(logs, 0, 3, 4, defaultProgressionSettings);
    const second = prescribeBlockStart(logs, 0, 3, 4, defaultProgressionSettings);
    expect(second).toEqual(first);
    expect(logs).toEqual(snapshot);
  });

  test('a pure bodyweight exercise takes the reps and no weight (task 105)', () => {
    expect(
      prescribeBlockStart([log(1, 80, 12)], 0, 3, 2, defaultProgressionSettings, 'bodyweight'),
    ).toEqual([
      { setNumber: 1, targetReps: 9 },
      { setNumber: 2, targetReps: 9 },
    ]);
  });
});
