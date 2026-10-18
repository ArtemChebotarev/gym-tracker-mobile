import type { SetLog, SetTarget } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { ReferenceResolution, SourceExercise } from '@domain/progression';
import { POWER_MAX_REPS, POWER_MIN_REPS } from '@domain/progressionCorridor';
import { powerPolicy } from '@domain/progressionPolicyPower';
import { strengthPolicy } from '@domain/progressionPolicyStrength';
import { prescribeNextSession } from '@domain/progressionPlan';
import { targetRir } from '@domain/progressionRir';
import { STAMPS } from '../fixtures/stamps';

const LENGTH_WEEKS = 6;

function log(setNumber: number, weight: number, reps: number): SetLog {
  return {
    ...STAMPS,
    id: `log-${setNumber}`,
    sessionExerciseId: 'se-1',
    exerciseId: 'exercise-medball',
    setNumber,
    weight,
    reps,
    completedAt: '2026-10-01T08:00:00.000Z',
  };
}

function medball(setTargets: SetTarget[]): SourceExercise {
  return {
    sessionExercise: { id: 'se-1', exerciseId: 'exercise-medball', order: 1, setTargets },
    muscleGroup: 'fullBody',
    type: 'power',
  };
}

/** Plans `weekNumber` from the sets logged in the week before it. */
function plan(source: SetTarget[], logs: SetLog[], weekNumber: number) {
  const [prescription] = prescribeNextSession({
    exercises: [medball(source)],
    logs,
    weekNumber,
    lengthWeeks: LENGTH_WEEKS,
    settings: defaultProgressionSettings,
  });
  if (prescription === undefined) {
    throw new Error('No prescription');
  }
  return prescription;
}

const rows = (n: number): SetTarget[] =>
  Array.from({ length: n }, (_, i) => ({ setNumber: i + 1 }));
const reps = (targets: SetTarget[]) => targets.map((t) => t.targetReps);

describe('power progression (10.2)', () => {
  test('the corridor is 2–6', () => {
    expect([POWER_MIN_REPS, POWER_MAX_REPS]).toEqual([2, 6]);
  });

  test('medicine ball: 4/4/3 → 5/5/4 → 6/6/5 → 7/7/6 — the corridor does not cap the target', () => {
    const week2 = plan(rows(3), [log(1, 4, 4), log(2, 4, 4), log(3, 4, 3)], 2);
    expect(reps(week2.setTargets)).toEqual([5, 5, 4]);

    const week3 = plan(week2.setTargets, [log(1, 4, 5), log(2, 4, 5), log(3, 4, 4)], 3);
    expect(reps(week3.setTargets)).toEqual([6, 6, 5]);

    const week4 = plan(week3.setTargets, [log(1, 4, 6), log(2, 4, 6), log(3, 4, 5)], 4);
    expect(reps(week4.setTargets)).toEqual([7, 7, 6]);
    expect(week4.setTargets.every((t) => t.suggestedWeight === 4)).toBe(true);
  });

  test('only the top of the corridor raises a hint — a low fact never says lighter', () => {
    const next = plan(rows(3), [log(1, 4, 6), log(2, 4, 1), log(3, 4, 4)], 2);
    expect(next.setTargets).toEqual([
      { setNumber: 1, targetReps: 7, suggestedWeight: 4, weightHint: 'increase' },
      { setNumber: 2, targetReps: 2, suggestedWeight: 4 },
      { setNumber: 3, targetReps: 5, suggestedWeight: 4 },
    ]);
  });

  test('sets with different weights each progress from their own fact', () => {
    const next = plan(rows(3), [log(1, 4, 5), log(2, 5, 3), log(3, 6, 2)], 2);
    expect(next.setTargets).toEqual([
      { setNumber: 1, targetReps: 6, suggestedWeight: 4 },
      { setNumber: 2, targetReps: 4, suggestedWeight: 5 },
      { setNumber: 3, targetReps: 3, suggestedWeight: 6 },
    ]);
  });

  test('a drop after a heavier weight is not lifted to the minimum', () => {
    const next = plan(rows(3), [log(1, 5, 3), log(2, 5, 3), log(3, 5, 2)], 2);
    expect(reps(next.setTargets)).toEqual([4, 4, 3]);
  });

  test('a fact of 0 reps still gives 1, and a sum of 0 or less gives no numbers', () => {
    expect(reps(plan(rows(1), [log(1, 5, 0)], 2).setTargets)).toEqual([1]);
    expect(plan(rows(1), [log(1, 5, -1)], 2).setTargets).toEqual([{ setNumber: 1 }]);
  });

  test('a set not logged carries over with no increment; the row count is copied', () => {
    const source: SetTarget[] = [
      { setNumber: 1, targetReps: 5, suggestedWeight: 4 },
      { setNumber: 2, targetReps: 5, suggestedWeight: 4 },
    ];
    const next = plan(source, [log(1, 4, 5)], 2);
    expect(next.setTargets).toEqual([
      { setNumber: 1, targetReps: 6, suggestedWeight: 4 },
      { setNumber: 2, targetReps: 5, suggestedWeight: 4 },
    ]);
  });

  test("still writes the week's RIR, which the next block's Start reads back", () => {
    expect(plan(rows(1), [log(1, 4, 4)], 2).targetRir).toBe(targetRir(LENGTH_WEEKS, 2));
  });
});

describe('rule 6 for power (P13)', () => {
  const resolution = (reps: number): ReferenceResolution => ({
    kind: 'target',
    reference: {
      mesoId: 'meso-a',
      weekNumber: 1,
      dayNumber: 1,
      isDeload: false,
      targetRir: 2,
      performedAt: '2026-10-01T08:00:00.000Z',
      setLogs: [log(1, 4, reps)],
      roundLogs: [],
    },
  });
  const settings = defaultProgressionSettings;
  const rule6 = (reps: number) =>
    powerPolicy.prescribeFromReference({
      resolution: resolution(reps),
      rowCount: 1,
      weekRir: 2,
      settings,
    });

  test('adds one with no clamp, and hints only from the top of the corridor', () => {
    expect(rule6(4)).toEqual([{ setNumber: 1, targetReps: 5, suggestedWeight: 4 }]);
    expect(rule6(7)).toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 4, weightHint: 'increase' },
    ]);
    expect(rule6(1)).toEqual([{ setNumber: 1, targetReps: 2, suggestedWeight: 4 }]);
  });

  test('a sum of 0 or less leaves the row with no numbers', () => {
    expect(rule6(-1)).toEqual([{ setNumber: 1 }]);
  });

  test('strength still goes through its own rule 6, with the mesocycle corridor and its hints', () => {
    const [row] = strengthPolicy.prescribeFromReference({
      resolution: resolution(4),
      rowCount: 1,
      weekRir: 2,
      settings,
    });
    // 4 reps is below the default corridor (minReps 5): the target is lifted and rule 3 says lighter.
    expect(row).toEqual({
      setNumber: 1,
      targetReps: settings.minReps,
      suggestedWeight: 4,
      weightHint: 'decrease',
    });
  });
});

describe('Flow C start for power (P14)', () => {
  const reference = (
    reps: number,
    targetRirOfRef: number,
    ...more: SetLog[]
  ): ReferenceResolution => ({
    kind: 'target',
    reference: {
      mesoId: 'meso-a',
      weekNumber: 4,
      dayNumber: 1,
      isDeload: false,
      targetRir: targetRirOfRef,
      performedAt: '2026-10-01T08:00:00.000Z',
      setLogs: [log(1, 10, reps), ...more],
      roundLogs: [],
    },
  });
  const start = (resolution: ReferenceResolution, rowCount = 1, startRir = 3) =>
    powerPolicy.prescribeBlockStart({
      resolution,
      startRir,
      rowCount,
      settings: defaultProgressionSettings,
    });

  test('the reference plus one, less the RIR gap, with the reference weight', () => {
    // 6 + 1 − (3 − 0) = 4: the same sum strength uses, with no clamp to a corridor.
    expect(start(reference(6, 0))).toEqual([{ setNumber: 1, targetReps: 4, suggestedWeight: 10 }]);
  });

  test('10 kg × 1 rep gives no recommendation instead of a lifted minimum', () => {
    // 1 + 1 − (3 − 0) = −1: strength would raise it to its minReps (5); power has nothing to say.
    expect(start(reference(1, 0))).toEqual([{ setNumber: 1 }]);
  });

  test('above the old ceiling the target is not cut', () => {
    expect(start(reference(9, 2), 1, 2)).toEqual([
      { setNumber: 1, targetReps: 10, suggestedWeight: 10 },
    ]);
  });

  test('a row the reference has no set for stays bare, and no reference leaves every row bare', () => {
    expect(start(reference(6, 0), 2)[1]).toEqual({ setNumber: 2 });
    expect(start({ kind: 'none' }, 2)).toEqual([{ setNumber: 1 }, { setNumber: 2 }]);
  });

  test('an estimate carries its reason', () => {
    const estimate: ReferenceResolution = {
      kind: 'estimate',
      reason: 'other_slot',
      source: 'other_block',
      reference: (reference(6, 0) as Extract<ReferenceResolution, { kind: 'target' }>).reference,
    };
    expect(start(estimate)).toEqual([
      { setNumber: 1, targetReps: 4, suggestedWeight: 10, estimate: 'other_slot' },
    ]);
  });
});
