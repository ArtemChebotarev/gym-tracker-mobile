import type { RoundLog, SetLog, SetTarget } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { ExercisePerformance, SourceExercise } from '@domain/progression';
import { PROGRESSION_POLICIES } from '@domain/progressionPolicies';
import { prescribeNextSession } from '@domain/progressionPlan';
import { mobilityPolicy } from '@domain/progressionPolicyMobility';
import { strengthPolicy } from '@domain/progressionPolicyStrength';
import { targetRir } from '@domain/progressionRir';
import { usesTargetIndicator } from '@domain/progressionTargetIndicator';
import { STAMPS } from '../fixtures/stamps';

// GT-106: a mobility exercise sits in the day's plan like any other, and the engine leaves it be —
// no progression, no deload, no weight swap (10 · Hybrid Exercises, "Mobility").

const tenMinutes: SetTarget[] = [{ setNumber: 1, targetWorkSec: 600 }];

function stretch(setTargets: SetTarget[] = tenMinutes): SourceExercise {
  return {
    sessionExercise: { id: 'se-stretch', exerciseId: 'stretch', order: 4, setTargets },
    muscleGroup: 'hamstrings',
    type: 'mobility',
  };
}

function block(workSec: number, overrides: Partial<RoundLog> = {}): RoundLog {
  return {
    ...STAMPS,
    id: 'rl-1',
    sessionExerciseId: 'se-stretch',
    exerciseId: 'stretch',
    roundNumber: 1,
    workSec,
    restSkipped: false,
    completed: true,
    completedAt: '2026-10-20T09:00:00.000Z',
    ...overrides,
  };
}

const context = {
  logs: [],
  roundLogs: [],
  weekNumber: 2,
  lengthWeeks: 5,
  settings: defaultProgressionSettings,
};

describe('mobility policy', () => {
  test('mobility has a policy of its own, sharing no job with strength', () => {
    expect(PROGRESSION_POLICIES.mobility).toBe(mobilityPolicy);
    for (const job of [
      'prescribeWorkingWeek',
      'prescribeDeload',
      'prescribeFromReference',
      'prescribeBlockStart',
    ] as const) {
      expect(mobilityPolicy[job]).not.toBe(strengthPolicy[job]);
    }
    expect(mobilityPolicy.sourceFacts(undefined)).toEqual({});
  });

  test('working week: the block as it was, with no increment', () => {
    const plan = mobilityPolicy.prescribeWorkingWeek(stretch(), context);
    expect(plan).toEqual({
      exerciseId: 'stretch',
      order: 4,
      setTargets: tenMinutes,
      targetRir: targetRir(5, 2),
    });
  });

  test('working week: the length it was done with is next week’s', () => {
    const plan = mobilityPolicy.prescribeWorkingWeek(stretch(), {
      ...context,
      roundLogs: [block(480), block(900, { sessionExerciseId: 'other' })],
    });
    expect(plan.setTargets).toEqual([{ setNumber: 1, targetWorkSec: 480 }]);
  });

  test('working week: a block with no length stays without one', () => {
    const plan = mobilityPolicy.prescribeWorkingWeek(stretch([{ setNumber: 1 }]), context);
    expect(plan.setTargets).toEqual([{ setNumber: 1 }]);
  });

  test('working week: reps and loads logged as sets are not carried (before its card, GT-107)', () => {
    const asSets = stretch([{ setNumber: 1, targetReps: 10, suggestedWeight: 20 }]);
    const log: SetLog = {
      ...STAMPS,
      id: 'sl-1',
      sessionExerciseId: 'se-stretch',
      exerciseId: 'stretch',
      setNumber: 1,
      weight: 20,
      reps: 12,
      completedAt: '2026-10-20T09:00:00.000Z',
    };
    const plan = mobilityPolicy.prescribeWorkingWeek(asSets, { ...context, logs: [log] });
    expect(plan.setTargets).toEqual([{ setNumber: 1 }]);
  });

  test('deload: the block unchanged, at the deload RIR', () => {
    const [plan] = mobilityPolicy.prescribeDeload([stretch()], {
      ...context,
      weekNumber: 5,
      roundLogs: [block(480)],
    });
    expect(plan).toEqual({
      exerciseId: 'stretch',
      order: 4,
      setTargets: [{ setNumber: 1, targetWorkSec: 480 }],
      targetRir: defaultProgressionSettings.deloadRir,
    });
  });

  describe('rule 6 and a copied block’s start', () => {
    const performance: ExercisePerformance = {
      mesoId: 'meso',
      weekNumber: 3,
      dayNumber: 1,
      isDeload: false,
      targetRir: 2,
      performedAt: '2026-10-20T09:00:00.000Z',
      setLogs: [],
      roundLogs: [block(540)],
      roundTargets: tenMinutes,
    };
    const input = { rowCount: 1, settings: defaultProgressionSettings };

    test('the length of the reference, as it ended', () => {
      const resolution = { kind: 'target', reference: performance } as const;
      expect(mobilityPolicy.prescribeFromReference({ ...input, resolution, weekRir: 2 })).toEqual(
        [{ setNumber: 1, targetWorkSec: 540 }],
      );
      expect(mobilityPolicy.prescribeBlockStart({ ...input, resolution, startRir: 3 })).toEqual([
        { setNumber: 1, targetWorkSec: 540 },
      ]);
    });

    test('a block past the reference’s last takes the last one’s length', () => {
      const resolution = { kind: 'target', reference: performance } as const;
      expect(
        mobilityPolicy.prescribeFromReference({ ...input, rowCount: 2, resolution, weekRir: 2 }),
      ).toEqual([
        { setNumber: 1, targetWorkSec: 540 },
        { setNumber: 2, targetWorkSec: 540 },
      ]);
    });

    test('with no reference, no length — it is picked on the card', () => {
      expect(
        mobilityPolicy.prescribeBlockStart({ ...input, resolution: { kind: 'none' }, startRir: 3 }),
      ).toEqual([{ setNumber: 1 }]);
    });
  });

  test('a deload day plans strength without the mobility exercise in its muscle groups', () => {
    const curl: SourceExercise = {
      sessionExercise: {
        id: 'se-curl',
        exerciseId: 'curl',
        order: 1,
        setTargets: [{ setNumber: 1 }, { setNumber: 2 }, { setNumber: 3 }, { setNumber: 4 }],
      },
      muscleGroup: 'hamstrings',
    };
    const plan = prescribeNextSession({
      ...context,
      weekNumber: 5,
      exercises: [curl, stretch()],
    });
    // Strength's deload halves the group's sets by itself; the stretch keeps its one block.
    expect(plan.map((p) => [p.exerciseId, p.setTargets.length])).toEqual([
      ['curl', 2],
      ['stretch', 1],
    ]);
    expect(plan[1]?.setTargets).toEqual(tenMinutes);
  });

  test('no weight swap and no hit marker on a mobility exercise', () => {
    expect(usesTargetIndicator('mobility', undefined)).toBe(false);
    expect(usesTargetIndicator('strength', undefined)).toBe(true);
  });
});
