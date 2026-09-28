import type { SetLog } from '@domain/execution';
import type { EstimateSource, ReferenceResolution } from '@domain/progression';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { prescribeFromHistory, referenceSetFor } from '@domain/progressionHistory';
import { STAMPS } from '../fixtures/stamps';

function log(setNumber: number, weight: number, reps: number): SetLog {
  return {
    ...STAMPS,
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

function performance(setLogs: SetLog[]) {
  return {
    mesoId: 'meso-a',
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    targetRir: 2,
    performedAt: '2026-09-10T08:00:00.000Z',
    setLogs,
  };
}

/** The resolver found `setLogs` in the exercise's own slot. */
function target(setLogs: SetLog[]): ReferenceResolution {
  return { kind: 'target', reference: performance(setLogs) };
}

/** The week the rows are for runs at RIR 2. */
const WEEK_RIR = 2;

/** The resolver found `setLogs`, but in another day or block — by default this week's. */
function estimate(
  setLogs: SetLog[],
  source: EstimateSource = 'current_week',
  targetRir = 2,
): ReferenceResolution {
  return {
    kind: 'estimate',
    reference: { ...performance(setLogs), targetRir },
    reason: 'other_slot',
    source,
  };
}

const NONE: ReferenceResolution = { kind: 'none' };

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
    expect(
      prescribeFromHistory(target(reference), 3, WEEK_RIR, defaultProgressionSettings),
    ).toEqual([
      { setNumber: 1, targetReps: 13, suggestedWeight: 20 },
      { setNumber: 2, targetReps: 11, suggestedWeight: 20 },
      { setNumber: 3, targetReps: 10, suggestedWeight: 17.5 },
    ]);
  });

  test.each([
    ['none', NONE],
    ['a reference with no sets', target([])],
  ])('no reference (%s): rows carry neither target reps nor weight', (_, resolution) => {
    expect(prescribeFromHistory(resolution, 2, WEEK_RIR, defaultProgressionSettings)).toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
    ]);
  });

  test('more rows than reference sets: extra rows repeat the last reference set', () => {
    expect(
      prescribeFromHistory(target(reference.slice(0, 2)), 4, WEEK_RIR, defaultProgressionSettings),
    ).toEqual([
      { setNumber: 1, targetReps: 13, suggestedWeight: 20 },
      { setNumber: 2, targetReps: 11, suggestedWeight: 20 },
      { setNumber: 3, targetReps: 11, suggestedWeight: 20 },
      { setNumber: 4, targetReps: 11, suggestedWeight: 20 },
    ]);
  });

  test('fewer rows than reference sets: only the first rows are used', () => {
    expect(
      prescribeFromHistory(target(reference), 1, WEEK_RIR, defaultProgressionSettings),
    ).toEqual([{ setNumber: 1, targetReps: 13, suggestedWeight: 20 }]);
  });

  test('clamps up to 5 and hints to lower the weight below the corridor', () => {
    expect(
      prescribeFromHistory(target([log(1, 100, 3)]), 1, WEEK_RIR, defaultProgressionSettings),
    ).toEqual([{ setNumber: 1, targetReps: 5, suggestedWeight: 100, weightHint: 'decrease' }]);
  });

  test('clamps down to 30 and hints to raise the weight at the top of the corridor', () => {
    expect(
      prescribeFromHistory(target([log(1, 10, 30)]), 1, WEEK_RIR, defaultProgressionSettings),
    ).toEqual([{ setNumber: 1, targetReps: 30, suggestedWeight: 10, weightHint: 'increase' }]);
  });

  test('zero rows give an empty plan', () => {
    expect(
      prescribeFromHistory(target(reference), 0, WEEK_RIR, defaultProgressionSettings),
    ).toEqual([]);
  });

  test('is deterministic and leaves its input untouched', () => {
    const logs = [set3, set1, set2];
    const snapshot = structuredClone(logs);
    const first = prescribeFromHistory(target(logs), 4, WEEK_RIR, defaultProgressionSettings);
    const second = prescribeFromHistory(target(logs), 4, WEEK_RIR, defaultProgressionSettings);
    expect(second).toEqual(first);
    expect(logs).toEqual(snapshot);
  });
});

describe('prescribeFromHistory with an estimate (task 134.1)', () => {
  test('from the current week: reps and weight as they were, marked with the reason', () => {
    expect(
      prescribeFromHistory(estimate(reference), 4, WEEK_RIR, defaultProgressionSettings),
    ).toEqual([
      { setNumber: 1, targetReps: 12, suggestedWeight: 20, estimate: 'other_slot' },
      { setNumber: 2, targetReps: 10, suggestedWeight: 20, estimate: 'other_slot' },
      { setNumber: 3, targetReps: 9, suggestedWeight: 17.5, estimate: 'other_slot' },
      { setNumber: 4, targetReps: 9, suggestedWeight: 17.5, estimate: 'other_slot' },
    ]);
  });

  test('from an earlier week of the own block: + 1, as a week of progression', () => {
    expect(
      prescribeFromHistory(
        estimate(reference.slice(0, 2), 'earlier_week'),
        2,
        WEEK_RIR,
        defaultProgressionSettings,
      ),
    ).toEqual([
      { setNumber: 1, targetReps: 13, suggestedWeight: 20, estimate: 'other_slot' },
      { setNumber: 2, targetReps: 11, suggestedWeight: 20, estimate: 'other_slot' },
    ]);
  });

  test.each([
    ['done at RIR 0, placed at RIR 2 → + 1 − 2', 0, 11],
    ['done at RIR 2, placed at RIR 2 → + 1', 2, 13],
    ['done at RIR 3, placed at RIR 2 → + 1 + 1', 3, 14],
  ])('from another block, as Flow C carries a block over: %s', (_, referenceRir, reps) => {
    expect(
      prescribeFromHistory(
        estimate([log(1, 20, 12)], 'other_block', referenceRir),
        1,
        WEEK_RIR,
        defaultProgressionSettings,
      ),
    ).toEqual([{ setNumber: 1, targetReps: reps, suggestedWeight: 20, estimate: 'other_slot' }]);
  });

  test('no weight hint — a guide doesn’t say which way to move the weight', () => {
    expect(
      prescribeFromHistory(estimate([log(1, 100, 3)]), 1, WEEK_RIR, defaultProgressionSettings),
    ).toEqual([{ setNumber: 1, targetReps: 3, suggestedWeight: 100, estimate: 'other_slot' }]);
  });

  test('a pure bodyweight exercise takes the estimated reps and no weight', () => {
    expect(
      prescribeFromHistory(
        estimate([log(1, 80, 12)]),
        1,
        WEEK_RIR,
        defaultProgressionSettings,
        'bodyweight',
      ),
    ).toEqual([{ setNumber: 1, targetReps: 12, estimate: 'other_slot' }]);
  });
});

describe('rule 6 and the bodyweight exercises (task 105)', () => {
  test('DoD: a pure bodyweight exercise takes the reps and no weight', () => {
    const targets = prescribeFromHistory(
      target([log(1, 80, 12)]),
      2,
      WEEK_RIR,
      defaultProgressionSettings,
      'bodyweight',
    );

    expect(targets).toEqual([
      { setNumber: 1, targetReps: 13 },
      { setNumber: 2, targetReps: 13 },
    ]);
  });

  test('DoD: a weighted bodyweight exercise takes the added weight as its suggestion', () => {
    const targets = prescribeFromHistory(
      target([log(1, 10, 8)]),
      1,
      WEEK_RIR,
      defaultProgressionSettings,
      'bodyweight-weighted',
    );

    expect(targets).toEqual([{ setNumber: 1, targetReps: 9, suggestedWeight: 10 }]);
  });
});
