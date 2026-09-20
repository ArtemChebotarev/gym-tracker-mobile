// One test per row of 03 · Progression Engine, "Граничные случаи", run through the engine's
// public entry points. The row "Упражнение добавлено или заменено в середине мезоцикла" is
// rule 6 and is covered in progressionHistory.test.ts (task 084), not repeated here.

import type { Session, SessionStatus, SetLog, SetTarget } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import {
  validateMesocycleDaysPerWeek,
  validateMesocycleLengthWeeks,
} from '@domain/mesocycleValidators';
import type { SourceExercise } from '@domain/progression';
import { prescribeNextSession } from '@domain/progressionPlan';
import { resolveBaseSession } from '@domain/progressionSource';
import { STAMPS } from '../fixtures/stamps';

const LENGTH_WEEKS = 5;

const startTargets: SetTarget[] = [
  { setNumber: 1, targetReps: 10, suggestedWeight: 60 },
  { setNumber: 2, targetReps: 10, suggestedWeight: 60 },
  { setNumber: 3, targetReps: 10, suggestedWeight: 60 },
];

function session(weekNumber: number, status: SessionStatus): Session {
  return {
    ...STAMPS,
    id: `w${weekNumber}`,
    mesoId: 'meso-1',
    weekNumber,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status,
  };
}

function bench(id: string, setTargets: SetTarget[] = startTargets): SourceExercise {
  return {
    sessionExercise: { id, exerciseId: 'exercise-bench', order: 1, setTargets },
    muscleGroup: 'chest',
  };
}

function log(sessionExerciseId: string, setNumber: number, weight: number, reps: number): SetLog {
  return {
    ...STAMPS,
    id: `${sessionExerciseId}-log-${setNumber}`,
    sessionExerciseId,
    exerciseId: 'exercise-bench',
    setNumber,
    weight,
    reps,
    completedAt: '2026-09-10T08:00:00.000Z',
  };
}

/** Plans the week after `source` from its one bench press and its logs. */
function planAfter(source: SourceExercise, logs: SetLog[], weekNumber = 2) {
  const [plan] = prescribeNextSession({
    exercises: [source],
    logs,
    weekNumber,
    lengthWeeks: LENGTH_WEEKS,
    settings: defaultProgressionSettings,
  });
  return plan;
}

describe('Progression engine edge cases (03 · Граничные случаи)', () => {
  test('lengthWeeks outside 3..8 is rejected', () => {
    expect(() => validateMesocycleLengthWeeks(2)).toThrow();
    expect(() => validateMesocycleLengthWeeks(9)).toThrow();
    expect(() =>
      prescribeNextSession({
        exercises: [bench('w1-bench')],
        logs: [],
        weekNumber: 2,
        lengthWeeks: 9,
        settings: defaultProgressionSettings,
      }),
    ).toThrow();
  });

  test('daysPerWeek outside 1..7 is rejected', () => {
    expect(() => validateMesocycleDaysPerWeek(0)).toThrow();
    expect(() => validateMesocycleDaysPerWeek(8)).toThrow();
  });

  test('source session not finished: the next week is not generated', () => {
    const week1 = session(1, 'in_progress');
    expect(resolveBaseSession(week1, [week1])).toEqual({ status: 'awaiting_source' });
  });

  test('week 1 skipped: the base is its start values', () => {
    const week1 = session(1, 'skipped');
    const resolution = resolveBaseSession(week1, [week1]);
    expect(resolution).toEqual({ status: 'ready', base: week1 });
    // A skipped session has no SetLogs, so every row carries over unchanged.
    expect(planAfter(bench('w1-bench'), [])?.setTargets).toEqual(startTargets);
  });

  test('several weeks skipped in a row: the base is the last completed session of that day', () => {
    const week1 = session(1, 'completed');
    const week2 = session(2, 'skipped');
    const week3 = session(3, 'skipped');
    expect(resolveBaseSession(week3, [week1, week2, week3])).toEqual({
      status: 'ready',
      base: week1,
    });
    // Week 4 progresses from week 1's fact, at week 4's RIR.
    const plan = planAfter(
      bench('w1-bench'),
      [log('w1-bench', 1, 60, 10), log('w1-bench', 2, 60, 9), log('w1-bench', 3, 60, 8)],
      4,
    );
    expect(plan?.setTargets.map((target) => target.targetReps)).toEqual([11, 10, 9]);
    expect(plan?.targetRir).toBe(0);
  });

  test('0 sets logged for an exercise: carried over with its last targets and set count', () => {
    const plan = planAfter(bench('w1-bench'), []);
    expect(plan?.setTargets).toEqual(startTargets);
  });

  test('exercise skipped after some sets: every row kept, logged ones progress', () => {
    const plan = planAfter(bench('w1-bench'), [log('w1-bench', 1, 62.5, 12)]);
    expect(plan?.setTargets).toEqual([
      { setNumber: 1, targetReps: 13, suggestedWeight: 62.5 },
      { setNumber: 2, targetReps: 10, suggestedWeight: 60 },
      { setNumber: 3, targetReps: 10, suggestedWeight: 60 },
    ]);
  });

  test('reps already at 30: the target stays 30 with a hint to raise the weight', () => {
    const plan = planAfter(bench('w1-bench', [{ setNumber: 1 }]), [log('w1-bench', 1, 20, 30)]);
    expect(plan?.setTargets).toEqual([
      { setNumber: 1, targetReps: 30, suggestedWeight: 20, weightHint: 'increase' },
    ]);
  });

  test('reps below 5: the target is 5 with a hint to lower the weight', () => {
    const plan = planAfter(bench('w1-bench', [{ setNumber: 1 }]), [log('w1-bench', 1, 140, 3)]);
    expect(plan?.setTargets).toEqual([
      { setNumber: 1, targetReps: 5, suggestedWeight: 140, weightHint: 'decrease' },
    ]);
  });
});
