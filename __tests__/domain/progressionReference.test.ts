import type { SetLog } from '@domain/execution';
import type { ExercisePerformance, ReferenceSlot } from '@domain/progression';
import { areIdentical, resolveReference } from '@domain/progressionReference';
import { STAMPS } from '../fixtures/stamps';

// Task 134.1 — the reference resolver, case by case. R1–R9 are the rule 6 cases of 03 ·
// Progression Engine, "Резолвер референса"; each test names the one it covers.

const OWN_MESO = 'meso-upper-lower';
const OTHER_MESO = 'meso-arms-shoulders';

type Sets = readonly (readonly [weight: number, reps: number])[];

let nextId = 0;

/** One performance: `sets` as `[weight, reps]` in set order, at `performedAt`. */
function performance(
  slot: { mesoId?: string; weekNumber: number; dayNumber: number },
  sets: Sets,
  overrides: Partial<ExercisePerformance> = {},
): ExercisePerformance {
  const performedAt =
    overrides.performedAt ??
    `2026-09-${String(slot.weekNumber * 7 + slot.dayNumber).padStart(2, '0')}T10:00:00.000Z`;
  const id = `se-${(nextId += 1)}`;
  const setLogs: SetLog[] = sets.map(([weight, reps], index) => ({
    ...STAMPS,
    id: `${id}-set-${index + 1}`,
    sessionExerciseId: id,
    exerciseId: 'exercise-triceps-pushdown',
    setNumber: index + 1,
    weight,
    reps,
    completedAt: performedAt,
  }));
  return {
    mesoId: slot.mesoId ?? OWN_MESO,
    weekNumber: slot.weekNumber,
    dayNumber: slot.dayNumber,
    isDeload: false,
    targetRir: 2,
    performedAt,
    setLogs,
    ...overrides,
  };
}

/** Rule 6: an exercise placed into `dayNumber` of week `weekNumber` of the own mesocycle. */
function ruleSix(weekNumber: number, dayNumber: number): ReferenceSlot {
  return { mesoId: OWN_MESO, dayNumber, currentWeek: { mesoId: OWN_MESO, weekNumber } };
}

const LATERAL_DAY_1: Sets = [
  [10, 25],
  [10, 24],
  [10, 21],
];
const LATERAL_DAY_3: Sets = [
  [10, 27],
  [10, 23],
  [10, 20],
];
const TRICEPS: Sets = [
  [4.5, 15],
  [4.5, 13],
];

describe('resolveReference — rule 6', () => {
  test('R1: nothing in the window → none', () => {
    expect(resolveReference([], ruleSix(2, 3))).toEqual({ kind: 'none' });
  });

  test('R2: an earlier week with the same day → target from that day, whatever else it holds', () => {
    const day3 = performance({ weekNumber: 1, dayNumber: 3 }, LATERAL_DAY_3);
    const performances = [performance({ weekNumber: 1, dayNumber: 1 }, LATERAL_DAY_1), day3];

    expect(resolveReference(performances, ruleSix(2, 3))).toEqual({
      kind: 'target',
      reference: day3,
    });
  });

  test('R3: an earlier week, no same day, several identical → target', () => {
    const day1 = performance({ weekNumber: 1, dayNumber: 1 }, TRICEPS);
    const day3 = performance({ weekNumber: 1, dayNumber: 3 }, TRICEPS);

    expect(resolveReference([day1, day3], ruleSix(2, 2))).toEqual({
      kind: 'target',
      reference: day3,
    });
  });

  test('R4: an earlier week, no same day, one performance → estimate', () => {
    const day1 = performance({ weekNumber: 1, dayNumber: 1 }, TRICEPS);

    expect(resolveReference([day1], ruleSix(2, 3))).toEqual({
      kind: 'estimate',
      reference: day1,
      reason: 'other_slot',
      source: 'earlier_week',
    });
  });

  test('R5: an earlier week, no same day, several that differ → none', () => {
    const performances = [
      performance({ weekNumber: 1, dayNumber: 1 }, LATERAL_DAY_1),
      performance({ weekNumber: 1, dayNumber: 3 }, LATERAL_DAY_3),
    ];

    expect(resolveReference(performances, ruleSix(2, 2))).toEqual({ kind: 'none' });
  });

  test('R5: a conflict in the earlier week doesn’t fall back onto the current week', () => {
    const performances = [
      performance({ weekNumber: 1, dayNumber: 1 }, LATERAL_DAY_1),
      performance({ weekNumber: 1, dayNumber: 3 }, LATERAL_DAY_3),
      performance({ weekNumber: 2, dayNumber: 1 }, TRICEPS),
    ];

    expect(resolveReference(performances, ruleSix(2, 2))).toEqual({ kind: 'none' });
  });

  test('R6 (case 26.09.2026): no earlier week, one performance this week → estimate', () => {
    const day1 = performance({ weekNumber: 1, dayNumber: 1 }, TRICEPS);

    expect(resolveReference([day1], ruleSix(1, 3))).toEqual({
      kind: 'estimate',
      reference: day1,
      reason: 'other_slot',
      source: 'current_week',
    });
  });

  test('R7: no earlier week, several identical this week → estimate, no +1 inside a week', () => {
    const day1 = performance({ weekNumber: 1, dayNumber: 1 }, TRICEPS);
    const day2 = performance({ weekNumber: 1, dayNumber: 2 }, TRICEPS);

    expect(resolveReference([day1, day2], ruleSix(1, 3))).toEqual({
      kind: 'estimate',
      reference: day2,
      reason: 'other_slot',
      source: 'current_week',
    });
  });

  test('R7: the same day this week is still a parallel performance, not a target', () => {
    const day3 = performance({ weekNumber: 1, dayNumber: 3 }, TRICEPS);

    expect(resolveReference([day3], ruleSix(1, 3))).toEqual({
      kind: 'estimate',
      reference: day3,
      reason: 'other_slot',
      source: 'current_week',
    });
  });

  test('R8: no earlier week, several that differ this week → none', () => {
    const performances = [
      performance({ weekNumber: 1, dayNumber: 1 }, LATERAL_DAY_1),
      performance({ weekNumber: 1, dayNumber: 2 }, LATERAL_DAY_3),
    ];

    expect(resolveReference(performances, ruleSix(1, 3))).toEqual({ kind: 'none' });
  });

  test('an earlier week wins over a newer performance in the current one', () => {
    const lastWeek = performance({ weekNumber: 1, dayNumber: 1 }, TRICEPS);
    const thisWeek = performance({ weekNumber: 2, dayNumber: 1 }, LATERAL_DAY_1);

    expect(resolveReference([thisWeek, lastWeek], ruleSix(2, 3))).toEqual({
      kind: 'estimate',
      reference: lastWeek,
      reason: 'other_slot',
      source: 'earlier_week',
    });
  });

  test('the latest earlier week is the reference, not an older one with the same day', () => {
    const olderSameDay = performance({ weekNumber: 1, dayNumber: 3 }, LATERAL_DAY_3);
    const newerOtherDay = performance({ weekNumber: 2, dayNumber: 1 }, TRICEPS);

    expect(resolveReference([olderSameDay, newerOtherDay], ruleSix(3, 3))).toEqual({
      kind: 'estimate',
      reference: newerOtherDay,
      reason: 'other_slot',
      source: 'earlier_week',
    });
  });

  describe('R9: the reference week is from another mesocycle', () => {
    test('one performance → estimate, even on the same day number', () => {
      const other = performance({ mesoId: OTHER_MESO, weekNumber: 4, dayNumber: 3 }, TRICEPS);

      expect(resolveReference([other], ruleSix(1, 3))).toEqual({
        kind: 'estimate',
        reference: other,
        reason: 'other_slot',
        source: 'other_block',
      });
    });

    test('several identical → estimate, not a target', () => {
      const day1 = performance({ mesoId: OTHER_MESO, weekNumber: 4, dayNumber: 1 }, TRICEPS);
      const day2 = performance({ mesoId: OTHER_MESO, weekNumber: 4, dayNumber: 2 }, TRICEPS);

      expect(resolveReference([day1, day2], ruleSix(1, 3))).toEqual({
        kind: 'estimate',
        reference: day2,
        reason: 'other_slot',
        source: 'other_block',
      });
    });

    test('several that differ → none', () => {
      const performances = [
        performance({ mesoId: OTHER_MESO, weekNumber: 4, dayNumber: 1 }, LATERAL_DAY_1),
        performance({ mesoId: OTHER_MESO, weekNumber: 4, dayNumber: 3 }, LATERAL_DAY_3),
      ];

      expect(resolveReference(performances, ruleSix(1, 3))).toEqual({ kind: 'none' });
    });
  });

  describe('what counts as a performance', () => {
    test('deload performances don’t count', () => {
      const working = performance({ weekNumber: 1, dayNumber: 3 }, TRICEPS);
      const deload = performance({ weekNumber: 2, dayNumber: 3 }, LATERAL_DAY_1, {
        isDeload: true,
      });

      expect(resolveReference([working, deload], ruleSix(3, 3))).toEqual({
        kind: 'target',
        reference: working,
      });
    });

    test('a performance with no set logged doesn’t count or take part in the comparison', () => {
      const logged = performance({ weekNumber: 1, dayNumber: 1 }, TRICEPS);
      const empty = performance({ weekNumber: 1, dayNumber: 3 }, []);

      expect(resolveReference([logged, empty], ruleSix(2, 3))).toEqual({
        kind: 'estimate',
        reference: logged,
        reason: 'other_slot',
        source: 'earlier_week',
      });
    });

    test('an unfinished reference week goes by what was logged in it', () => {
      const partial = performance({ weekNumber: 1, dayNumber: 1 }, [[4.5, 15]]);

      expect(resolveReference([partial], ruleSix(2, 1))).toEqual({
        kind: 'target',
        reference: partial,
      });
    });
  });
});

// Task 134.2 — Flow C: the slot is a day of the block being copied, and there is no current
// week, so the reference week is simply the latest one in the window. C1–C7 are the cases of 03,
// rule 6, "Резолвер референса" for Flow C.
describe('resolveReference — no current week (Flow C’s shape)', () => {
  /** Flow C: week 1 of a block copied from `OWN_MESO`, day `dayNumber`. */
  function flowC(dayNumber: number): ReferenceSlot {
    return { mesoId: OWN_MESO, dayNumber };
  }

  test('C1: nothing in the window → none', () => {
    expect(resolveReference([], flowC(1))).toEqual({ kind: 'none' });
  });

  test('C2: same day in the copied block → target from that day, whatever the other day says', () => {
    const day1 = performance({ weekNumber: 3, dayNumber: 1 }, LATERAL_DAY_1);
    const day3 = performance({ weekNumber: 3, dayNumber: 3 }, LATERAL_DAY_3);

    expect(resolveReference([day1, day3], flowC(1))).toEqual({ kind: 'target', reference: day1 });
    expect(resolveReference([day1, day3], flowC(3))).toEqual({ kind: 'target', reference: day3 });
  });

  test('C2: the latest week of the copied block is the reference, not an earlier one', () => {
    const week2 = performance({ weekNumber: 2, dayNumber: 1 }, TRICEPS);
    const week3 = performance({ weekNumber: 3, dayNumber: 1 }, [[4.5, 16]]);

    expect(resolveReference([week2, week3], flowC(1))).toEqual({
      kind: 'target',
      reference: week3,
    });
  });

  test('C3: no same day, several identical in the copied block → target', () => {
    const day1 = performance({ weekNumber: 3, dayNumber: 1 }, TRICEPS);
    const day3 = performance({ weekNumber: 3, dayNumber: 3 }, TRICEPS);

    expect(resolveReference([day1, day3], flowC(2))).toEqual({ kind: 'target', reference: day3 });
  });

  test('C4: no same day, one performance in the copied block → estimate', () => {
    const day1 = performance({ weekNumber: 3, dayNumber: 1 }, TRICEPS);

    expect(resolveReference([day1], flowC(3))).toEqual({
      kind: 'estimate',
      reference: day1,
      reason: 'other_slot',
      source: 'earlier_week',
    });
  });

  test('C4: the latest week decides even when an earlier one had the same day', () => {
    const week2Day1 = performance({ weekNumber: 2, dayNumber: 1 }, TRICEPS);
    const week3Day2 = performance({ weekNumber: 3, dayNumber: 2 }, [[4.5, 16]]);

    expect(resolveReference([week2Day1, week3Day2], flowC(1))).toEqual({
      kind: 'estimate',
      reference: week3Day2,
      reason: 'other_slot',
      source: 'earlier_week',
    });
  });

  test('C5: no same day, several that differ in the copied block → none', () => {
    const day1 = performance({ weekNumber: 3, dayNumber: 1 }, LATERAL_DAY_1);
    const day3 = performance({ weekNumber: 3, dayNumber: 3 }, LATERAL_DAY_3);

    expect(resolveReference([day1, day3], flowC(2))).toEqual({ kind: 'none' });
  });

  describe('C6: the latest week is from another block (the split changed)', () => {
    test('one performance → estimate, and the day number isn’t compared across blocks', () => {
      const other = performance({ mesoId: OTHER_MESO, weekNumber: 4, dayNumber: 1 }, TRICEPS);

      expect(resolveReference([other], flowC(1))).toEqual({
        kind: 'estimate',
        reference: other,
        reason: 'other_slot',
        source: 'other_block',
      });
    });

    test('several identical → estimate from the newest', () => {
      const day1 = performance({ mesoId: OTHER_MESO, weekNumber: 4, dayNumber: 1 }, TRICEPS);
      const day2 = performance({ mesoId: OTHER_MESO, weekNumber: 4, dayNumber: 2 }, TRICEPS);

      expect(resolveReference([day1, day2], flowC(1))).toEqual({
        kind: 'estimate',
        reference: day2,
        reason: 'other_slot',
        source: 'other_block',
      });
    });

    test('several that differ → none', () => {
      const day1 = performance({ mesoId: OTHER_MESO, weekNumber: 4, dayNumber: 1 }, LATERAL_DAY_1);
      const day2 = performance({ mesoId: OTHER_MESO, weekNumber: 4, dayNumber: 2 }, LATERAL_DAY_3);

      expect(resolveReference([day1, day2], flowC(1))).toEqual({ kind: 'none' });
    });

    test('an older same-day performance in the copied block doesn’t win over the newer week', () => {
      const copied = performance({ weekNumber: 3, dayNumber: 1 }, TRICEPS, {
        performedAt: '2026-09-01T10:00:00.000Z',
      });
      const other = performance({ mesoId: OTHER_MESO, weekNumber: 1, dayNumber: 1 }, [[5, 12]], {
        performedAt: '2026-09-15T10:00:00.000Z',
      });

      expect(resolveReference([copied, other], flowC(1))).toEqual({
        kind: 'estimate',
        reference: other,
        reason: 'other_slot',
        source: 'other_block',
      });
    });
  });

  test('C7: an exercise added to the draft by hand goes through the same resolver', () => {
    // Not in the copied week at all, but done on day 2 of the copied block: placed on day 1 of
    // the new one, it is a C4 like any other.
    const day2 = performance({ weekNumber: 3, dayNumber: 2 }, TRICEPS);

    expect(resolveReference([day2], flowC(1))).toEqual({
      kind: 'estimate',
      reference: day2,
      reason: 'other_slot',
      source: 'earlier_week',
    });
  });

  test('deload performances don’t count here either', () => {
    const working = performance({ weekNumber: 3, dayNumber: 1 }, TRICEPS);
    const deload = performance({ weekNumber: 4, dayNumber: 1 }, [[2, 10]], { isDeload: true });

    expect(resolveReference([working, deload], flowC(1))).toEqual({
      kind: 'target',
      reference: working,
    });
  });
});

describe('areIdentical', () => {
  test('same count, and weight and reps together in every position', () => {
    expect(
      areIdentical([
        performance({ weekNumber: 1, dayNumber: 1 }, TRICEPS),
        performance({ weekNumber: 1, dayNumber: 2 }, TRICEPS),
      ]),
    ).toBe(true);
  });

  test.each<[string, Sets]>([
    ['another set count', [[4.5, 15]]],
    [
      'another weight',
      [
        [5, 15],
        [4.5, 13],
      ],
    ],
    [
      'other reps',
      [
        [4.5, 15],
        [4.5, 12],
      ],
    ],
  ])('%s → not identical', (_, other) => {
    expect(
      areIdentical([
        performance({ weekNumber: 1, dayNumber: 1 }, TRICEPS),
        performance({ weekNumber: 1, dayNumber: 2 }, other),
      ]),
    ).toBe(false);
  });
});
