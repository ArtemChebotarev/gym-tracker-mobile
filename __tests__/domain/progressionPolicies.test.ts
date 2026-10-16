import { EXERCISE_TYPES } from '@domain/catalog';
import type { SetTarget } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { SourceExercise } from '@domain/progression';
import { PROGRESSION_POLICIES, policyFor } from '@domain/progressionPolicies';
import { prescribeNextSession } from '@domain/progressionPlan';
import type { ProgressionPolicy } from '@domain/progressionPolicy';
import { strengthPolicy } from '@domain/progressionPolicyStrength';

const threeSets: SetTarget[] = [{ setNumber: 1 }, { setNumber: 2 }, { setNumber: 3 }];

function source(order: number, type?: SourceExercise['type']): SourceExercise {
  return {
    sessionExercise: { id: `se-${order}`, exerciseId: `ex-${order}`, order, setTargets: threeSets },
    muscleGroup: 'chest',
    ...(type === undefined ? {} : { type }),
  };
}

const base = { logs: [], lengthWeeks: 5, settings: defaultProgressionSettings };

describe('PROGRESSION_POLICIES', () => {
  test('has a policy for every exercise type', () => {
    expect(Object.keys(PROGRESSION_POLICIES).sort()).toEqual([...EXERCISE_TYPES].sort());
  });
});

describe('policyFor', () => {
  test('an exercise with no type is strength', () => {
    expect(policyFor(source(1))).toBe(PROGRESSION_POLICIES.strength);
    expect(PROGRESSION_POLICIES.strength).toBe(strengthPolicy);
  });
});

describe('prescribeNextSession dispatch', () => {
  const spy: ProgressionPolicy = {
    prescribeWorkingWeek: jest.fn(({ sessionExercise }) => ({
      exerciseId: sessionExercise.exerciseId,
      order: sessionExercise.order,
      setTargets: [],
      targetRir: 99,
    })),
    prescribeDeload: jest.fn((exercises) =>
      exercises.map(({ sessionExercise }) => ({
        exerciseId: sessionExercise.exerciseId,
        order: sessionExercise.order,
        setTargets: [],
        targetRir: 98,
      })),
    ),
  };
  const original = PROGRESSION_POLICIES.power;

  beforeEach(() => {
    PROGRESSION_POLICIES.power = spy;
    jest.clearAllMocks();
  });
  afterAll(() => {
    PROGRESSION_POLICIES.power = original;
  });

  test('plans each exercise of a working week with its own type policy', () => {
    const plan = prescribeNextSession({
      ...base,
      weekNumber: 2,
      exercises: [source(2, 'power'), source(1, 'strength')],
    });
    expect(plan.map((p) => [p.order, p.targetRir])).toEqual([
      [1, 2],
      [2, 99],
    ]);
  });

  test('hands each policy only its own type on a deload day, merged back in order', () => {
    const plan = prescribeNextSession({
      ...base,
      weekNumber: 5,
      exercises: [source(3, 'power'), source(2), source(1, 'strength')],
    });
    expect(spy.prescribeDeload).toHaveBeenCalledTimes(1);
    expect((spy.prescribeDeload as jest.Mock).mock.calls[0][0]).toHaveLength(1);
    expect(plan.map((p) => p.order)).toEqual([1, 2, 3]);
    // The two strength exercises share chest between them: one set each, not two.
    expect(plan[0]?.setTargets).toHaveLength(1);
    expect(plan[1]?.setTargets).toHaveLength(1);
  });
});
