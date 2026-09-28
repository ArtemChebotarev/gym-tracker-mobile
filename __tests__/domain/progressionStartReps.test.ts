import type { SetLog } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { EstimateSource, ReferenceResolution } from '@domain/progression';
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
  test('DoD: the spec’s example — 10 reps at RIR 0, new startRir 3, gives 8', () => {
    expect(startTargetReps(10, 0, 3, defaultProgressionSettings)).toBe(8);
  });

  test('DoD: a reference that wasn’t at RIR 0 — 10 at RIR 2 with startRir 3 gives 10', () => {
    expect(startTargetReps(10, 2, 3, defaultProgressionSettings)).toBe(10);
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

  test('a reference already at the new block’s RIR gains the single rep (task 125)', () => {
    expect(startTargetReps(12, 3, 3, defaultProgressionSettings)).toBe(13);
  });

  test('a reference at a higher RIR than the block’s start moves the reps up further', () => {
    expect(startTargetReps(10, 4, 3, defaultProgressionSettings)).toBe(12);
  });

  test('task 125: copying the block that just ended does not repeat its first week', () => {
    // 3 weeks → 2 working weeks, startRir 1: week 1 was 10 reps at RIR 1, week 2 was 11 at RIR 0.
    // Re-pricing that week 2 for the new block's startRir 1 has to beat the 10 it started from.
    expect(startTargetReps(11, 0, 1, defaultProgressionSettings)).toBe(11);
  });
});

/** The resolver's answer around `setLogs`, performed at `targetRir`. */
function performance(setLogs: SetLog[], targetRir: number) {
  return {
    mesoId: 'meso-past',
    weekNumber: 3,
    dayNumber: 1,
    isDeload: false,
    targetRir,
    performedAt: '2026-09-10T08:00:00.000Z',
    setLogs,
  };
}

function target(setLogs: SetLog[], targetRir: number): ReferenceResolution {
  return { kind: 'target', reference: performance(setLogs, targetRir) };
}

function estimate(
  setLogs: SetLog[],
  targetRir: number,
  source: EstimateSource = 'other_block',
): ReferenceResolution {
  return {
    kind: 'estimate',
    reference: performance(setLogs, targetRir),
    reason: 'other_slot',
    source,
  };
}

const NONE: ReferenceResolution = { kind: 'none' };

describe('prescribeBlockStart', () => {
  test('DoD: each set is re-priced on its own — 10/9/8 at RIR 0 with startRir 3 give 8/7/6', () => {
    expect(
      prescribeBlockStart(
        target([log(1, 60, 10), log(2, 60, 9), log(3, 55, 8)], 0),
        3,
        3,
        defaultProgressionSettings,
      ),
    ).toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 7, suggestedWeight: 60 },
      { setNumber: 3, targetReps: 6, suggestedWeight: 55 },
    ]);
  });

  test('the reference weight is carried over as is', () => {
    expect(
      prescribeBlockStart(target([log(1, 62.5, 12)], 1), 3, 1, defaultProgressionSettings),
    ).toEqual([{ setNumber: 1, targetReps: 11, suggestedWeight: 62.5 }]);
  });

  test('no reference: rows carry neither target reps nor weight', () => {
    expect(prescribeBlockStart(NONE, 3, 2, defaultProgressionSettings)).toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
    ]);
  });

  test('task 134.2: set on set — a row the reference has no set for stays bare', () => {
    expect(
      prescribeBlockStart(
        target([log(1, 60, 10), log(2, 60, 9)], 0),
        3,
        4,
        defaultProgressionSettings,
      ),
    ).toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 7, suggestedWeight: 60 },
      { setNumber: 3 },
      { setNumber: 4 },
    ]);
  });

  test('task 134.2: reference sets past the row count are left out', () => {
    expect(
      prescribeBlockStart(
        target([log(1, 60, 10), log(2, 60, 9), log(3, 55, 8)], 0),
        3,
        2,
        defaultProgressionSettings,
      ),
    ).toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 7, suggestedWeight: 60 },
    ]);
  });

  test('matches rows to reference sets by set number, not by position', () => {
    // Set 2 was never logged: row 2 has nothing to go by, row 3 takes set 3.
    expect(
      prescribeBlockStart(
        target([log(3, 55, 8), log(1, 60, 10)], 0),
        3,
        3,
        defaultProgressionSettings,
      ),
    ).toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 60 },
      { setNumber: 2 },
      { setNumber: 3, targetReps: 6, suggestedWeight: 55 },
    ]);
  });

  describe('an estimate', () => {
    test('has the same numbers as a target — + 1 and the RIR gap — and says it is an estimate', () => {
      // 10 at RIR 2, new startRir 3: 10 + 1 − (3 − 2) = 10.
      expect(
        prescribeBlockStart(estimate([log(1, 60, 10)], 2), 3, 1, defaultProgressionSettings),
      ).toEqual([{ setNumber: 1, targetReps: 10, suggestedWeight: 60, estimate: 'other_slot' }]);
    });

    test.each<EstimateSource>(['earlier_week', 'other_block', 'current_week'])(
      'is priced the same whatever the resolver named its source (%s)',
      (source) => {
        expect(
          prescribeBlockStart(
            estimate([log(1, 60, 10)], 0, source),
            3,
            1,
            defaultProgressionSettings,
          ),
        ).toEqual([{ setNumber: 1, targetReps: 8, suggestedWeight: 60, estimate: 'other_slot' }]);
      },
    );

    test('goes set on set too: a row past the reference is bare, not an estimate', () => {
      expect(
        prescribeBlockStart(estimate([log(1, 60, 10)], 0), 3, 2, defaultProgressionSettings),
      ).toEqual([
        { setNumber: 1, targetReps: 8, suggestedWeight: 60, estimate: 'other_slot' },
        { setNumber: 2 },
      ]);
    });
  });

  test('no weight hint is carried, at either end of the corridor', () => {
    expect(
      prescribeBlockStart(target([log(1, 100, 4)], 0), 0, 1, defaultProgressionSettings),
    ).toEqual([{ setNumber: 1, targetReps: 5, suggestedWeight: 100 }]);
    expect(
      prescribeBlockStart(target([log(1, 10, 30)], 0), 0, 1, defaultProgressionSettings),
    ).toEqual([{ setNumber: 1, targetReps: 30, suggestedWeight: 10 }]);
  });

  test('zero rows give an empty plan', () => {
    expect(
      prescribeBlockStart(target([log(1, 60, 10)], 0), 3, 0, defaultProgressionSettings),
    ).toEqual([]);
  });

  test('is deterministic and leaves its input untouched', () => {
    const resolution = target([log(3, 55, 8), log(1, 60, 10), log(2, 60, 9)], 0);
    const snapshot = structuredClone(resolution);
    const first = prescribeBlockStart(resolution, 3, 4, defaultProgressionSettings);
    const second = prescribeBlockStart(resolution, 3, 4, defaultProgressionSettings);
    expect(second).toEqual(first);
    expect(resolution).toEqual(snapshot);
  });

  test('a pure bodyweight exercise takes the reps and no weight (task 105)', () => {
    expect(
      prescribeBlockStart(
        target([log(1, 80, 12), log(2, 80, 12)], 0),
        3,
        2,
        defaultProgressionSettings,
        'bodyweight',
      ),
    ).toEqual([
      { setNumber: 1, targetReps: 10 },
      { setNumber: 2, targetReps: 10 },
    ]);
  });
});
