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
  test('the corridor is 2–6', () => {
    expect([POWER_MIN_REPS, POWER_MAX_REPS]).toEqual([2, 6]);
  });

  test('medicine ball example: 4/4/3 → 5/5/4 → 6/6/5 → 6/6/6 → the ceiling holds', () => {
    const week2 = plan(rows(3), [log(1, 4, 4), log(2, 4, 4), log(3, 4, 3)], 2);
    expect(reps(week2.setTargets)).toEqual([5, 5, 4]);

    const week3 = plan(week2.setTargets, [log(1, 4, 5), log(2, 4, 5), log(3, 4, 4)], 3);
    expect(reps(week3.setTargets)).toEqual([6, 6, 5]);

    const week4 = plan(week3.setTargets, [log(1, 4, 6), log(2, 4, 6), log(3, 4, 5)], 4);
    expect(reps(week4.setTargets)).toEqual([6, 6, 6]);

    const week5 = plan(week4.setTargets, [log(1, 4, 6), log(2, 4, 6), log(3, 4, 6)], 5);
    expect(reps(week5.setTargets)).toEqual([6, 6, 6]);
    expect(week5.setTargets.every((t) => t.suggestedWeight === 4)).toBe(true);
  });

  test('sets with different weights each progress from their own fact', () => {
    const next = plan(rows(3), [log(1, 4, 5), log(2, 5, 3), log(3, 6, 2)], 2);
    expect(next.setTargets).toEqual([
      { setNumber: 1, targetReps: 6, suggestedWeight: 4 },
      { setNumber: 2, targetReps: 4, suggestedWeight: 5 },
      { setNumber: 3, targetReps: 3, suggestedWeight: 6 },
    ]);
  });

  test('a drop after a heavier weight pulls the target to the minimum and never punishes', () => {
    const next = plan(rows(3), [log(1, 5, 1), log(2, 5, 1), log(3, 5, 0)], 2);
    expect(reps(next.setTargets)).toEqual([2, 2, 2]);
    expect(next.setTargets.some((t) => t.weightHint !== undefined)).toBe(false);
  });

  test('gives no weight hint at the ceiling, and none below the corridor', () => {
    const next = plan(rows(2), [log(1, 4, 6), log(2, 4, 1)], 2);
    expect(next.setTargets.map((t) => t.weightHint)).toEqual([undefined, undefined]);
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

  test('prices in the 2–6 corridor with no hint', () => {
    expect(prescribeFromHistory(resolution(4), 1, 2, settings, undefined, 'power')).toEqual([
      { setNumber: 1, targetReps: 5, suggestedWeight: 4 },
    ]);
    expect(prescribeFromHistory(resolution(6), 1, 2, settings, undefined, 'power')).toEqual([
      { setNumber: 1, targetReps: 6, suggestedWeight: 4 },
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
