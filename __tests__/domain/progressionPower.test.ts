import type { SetLog, SetTarget } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { ReferenceResolution, SourceExercise } from '@domain/progression';
import { POWER_MAX_REPS, POWER_MIN_REPS } from '@domain/progressionCorridor';
import { prescribeFromHistory } from '@domain/progressionHistory';
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
  test('the hint corridor is 2–6', () => {
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

  test('the corridor edges raise the hint, the sum is unchanged', () => {
    const next = plan(rows(3), [log(1, 4, 6), log(2, 4, 1), log(3, 4, 4)], 2);
    expect(next.setTargets).toEqual([
      { setNumber: 1, targetReps: 7, suggestedWeight: 4, weightHint: 'increase' },
      { setNumber: 2, targetReps: 2, suggestedWeight: 4, weightHint: 'decrease' },
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

  test('adds one with no clamp, and hints at the corridor edges', () => {
    expect(prescribeFromHistory(resolution(4), 1, 2, settings, undefined, 'power')).toEqual([
      { setNumber: 1, targetReps: 5, suggestedWeight: 4 },
    ]);
    expect(prescribeFromHistory(resolution(7), 1, 2, settings, undefined, 'power')).toEqual([
      { setNumber: 1, targetReps: 8, suggestedWeight: 4, weightHint: 'increase' },
    ]);
    expect(prescribeFromHistory(resolution(1), 1, 2, settings, undefined, 'power')).toEqual([
      { setNumber: 1, targetReps: 2, suggestedWeight: 4, weightHint: 'decrease' },
    ]);
  });

  test('a sum of 0 or less leaves the row with no numbers', () => {
    expect(prescribeFromHistory(resolution(-1), 1, 2, settings, undefined, 'power')).toEqual([
      { setNumber: 1 },
    ]);
  });

  test('strength keeps the mesocycle corridor and its hints', () => {
    const [row] = prescribeFromHistory(resolution(4), 1, 2, settings);
    // 4 reps is below the default corridor (minReps 5): the target is lifted and rule 3 says lighter.
    expect(row).toEqual({
      setNumber: 1,
      targetReps: settings.minReps,
      suggestedWeight: 4,
      weightHint: 'decrease',
    });
  });
});
