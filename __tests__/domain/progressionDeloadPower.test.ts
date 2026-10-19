import type { SetLog, SetTarget } from '@domain/execution';
import type { PowerLoad } from '@domain/exerciseConfig';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { SourceExercise } from '@domain/progression';
import {
  POWER_DELOAD_SETS,
  powerDeloadSetCount,
  powerDeloadWeight,
  prescribePowerDeloadDay,
} from '@domain/progressionDeloadPower';
import { PROGRESSION_POLICIES } from '@domain/progressionPolicies';
import { STAMPS } from '../fixtures/stamps';

const settings = defaultProgressionSettings;

function medball(
  setTargets: SetTarget[],
  powerLoad?: PowerLoad,
  overrides: Partial<SourceExercise> = {},
): SourceExercise {
  return {
    sessionExercise: { id: 'se-1', exerciseId: 'medball', order: 1, setTargets },
    muscleGroup: 'fullBody',
    type: 'power',
    ...(powerLoad === undefined ? {} : { powerLoad }),
    ...overrides,
  };
}

const planned = (weights: (number | undefined)[]): SetTarget[] =>
  weights.map((weight, index) =>
    weight === undefined
      ? { setNumber: index + 1, targetReps: 6 }
      : { setNumber: index + 1, targetReps: 6, suggestedWeight: weight },
  );

function log(setNumber: number, weight: number, reps = 6): SetLog {
  return {
    ...STAMPS,
    id: `log-${setNumber}`,
    sessionExerciseId: 'se-1',
    exerciseId: 'medball',
    setNumber,
    weight,
    reps,
    completedAt: '2026-10-01T08:00:00.000Z',
  };
}

describe('powerDeloadSetCount (GT-83)', () => {
  test('two sets for an exercise that had two or more, the single one otherwise', () => {
    expect(POWER_DELOAD_SETS).toBe(2);
    expect([1, 2, 3, 4].map(powerDeloadSetCount)).toEqual([1, 2, 2, 2]);
  });
});

describe('prescribePowerDeloadDay', () => {
  test('kilograms: the first two sets, each at half its own weight, no target reps', () => {
    const [plan] = prescribePowerDeloadDay(
      [medball(planned([6, 8, 10]), 'weight')],
      [log(1, 6), log(2, 8), log(3, 10)],
      settings,
    );

    expect(plan?.setTargets).toEqual([
      { setNumber: 1, suggestedWeight: 3 },
      { setNumber: 2, suggestedWeight: 4 },
    ]);
    expect(plan?.setTargets.some((target) => target.targetReps !== undefined)).toBe(false);
  });

  test('a power exercise with no stated load reads as kilograms', () => {
    const [plan] = prescribePowerDeloadDay(
      [medball(planned([10, 10]))],
      [log(1, 10), log(2, 10)],
      settings,
    );

    expect(plan?.setTargets.map((target) => target.suggestedWeight)).toEqual([5, 5]);
  });

  test('a level stays the level — it cannot be halved', () => {
    const [plan] = prescribePowerDeloadDay(
      [medball(planned([3, 3, 3]), 'level')],
      [log(1, 3), log(2, 3), log(3, 3)],
      settings,
    );

    expect(plan?.setTargets).toEqual([
      { setNumber: 1, suggestedWeight: 3 },
      { setNumber: 2, suggestedWeight: 3 },
    ]);
  });

  test('its own load keeps what it had; only the sets are cut', () => {
    const [plan] = prescribePowerDeloadDay(
      [medball(planned([10, 10, 10]), 'none')],
      [log(1, 10), log(2, 10), log(3, 10)],
      settings,
    );

    expect(plan?.setTargets).toEqual([
      { setNumber: 1, suggestedWeight: 10 },
      { setNumber: 2, suggestedWeight: 10 },
    ]);
  });

  test('a single set stays a single set', () => {
    const [plan] = prescribePowerDeloadDay(
      [medball(planned([8]), 'weight')],
      [log(1, 8)],
      settings,
    );

    expect(plan?.setTargets).toEqual([{ setNumber: 1, suggestedWeight: 4 }]);
  });

  test('a set that was not logged takes its own suggested weight, and none when it had none', () => {
    const [plan] = prescribePowerDeloadDay(
      [medball(planned([8, undefined]), 'weight')],
      [log(1, 8)],
      settings,
    );

    expect(plan?.setTargets).toEqual([{ setNumber: 1, suggestedWeight: 4 }, { setNumber: 2 }]);
  });

  test('a pure bodyweight exercise gets no weight at all', () => {
    const [plan] = prescribePowerDeloadDay(
      [medball(planned([70, 70]), 'none', { equipment: 'bodyweight' })],
      [log(1, 70), log(2, 70)],
      settings,
    );

    expect(plan?.setTargets).toEqual([{ setNumber: 1 }, { setNumber: 2 }]);
  });

  test('writes the deload RIR, in the order of the exercises, without grouping by muscle group', () => {
    const second = medball(planned([6, 6]), 'weight', {
      sessionExercise: { id: 'se-2', exerciseId: 'slam', order: 2, setTargets: planned([6, 6]) },
    });
    const plans = prescribePowerDeloadDay(
      [second, medball(planned([6, 6]), 'weight')],
      [],
      settings,
    );

    expect(plans.map((plan) => [plan.exerciseId, plan.setTargets.length, plan.targetRir])).toEqual([
      ['medball', 2, settings.deloadRir],
      ['slam', 2, settings.deloadRir],
    ]);
  });
});

describe('powerDeloadWeight', () => {
  test('is undefined for a set with no fact and no suggested weight', () => {
    expect(powerDeloadWeight(medball(planned([undefined])), 1, [], settings)).toBeUndefined();
  });
});

test('the power policy plans its deload day this way, not strength’s', () => {
  const plans = PROGRESSION_POLICIES.power.prescribeDeload(
    [medball(planned([10, 10, 10]), 'weight')],
    {
      logs: [log(1, 10), log(2, 10), log(3, 10)],
      roundLogs: [],
      weekNumber: 5,
      lengthWeeks: 5,
      settings,
    },
  );

  // Strength would give a lone exercise of its group two sets at half the first set's weight; here
  // it is the same two, but by the exercise's own sets — and the weight halves per set.
  expect(plans[0]?.setTargets).toHaveLength(2);
  expect(plans[0]?.setTargets.map((target) => target.suggestedWeight)).toEqual([5, 5]);
});
