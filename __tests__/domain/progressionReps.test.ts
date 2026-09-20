import type { SessionExercise, SetLog, SetTarget } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { nextSetTarget, nextSetTargets, nextTargetReps } from '@domain/progressionReps';
import { STAMPS } from '../fixtures/stamps';

const SOURCE_ID = 'session-exercise-bench-press';

function source(setTargets: SetTarget[]): Pick<SessionExercise, 'id' | 'setTargets'> {
  return { id: SOURCE_ID, setTargets };
}

function log(setNumber: number, reps: number, weight = 60): SetLog {
  return {
    ...STAMPS,
    id: `set-log-${setNumber}`,
    sessionExerciseId: SOURCE_ID,
    exerciseId: 'exercise-bench-press',
    setNumber,
    weight,
    reps,
    completedAt: '2026-08-26T08:00:00.000Z',
  };
}

describe('nextTargetReps', () => {
  test('adds one rep inside the corridor', () => {
    expect(nextTargetReps(10, defaultProgressionSettings)).toBe(11);
  });

  test('stays at 30 when the fact is already 30', () => {
    expect(nextTargetReps(30, defaultProgressionSettings)).toBe(30);
  });

  test('clamps up to 5 when the fact is 3', () => {
    expect(nextTargetReps(3, defaultProgressionSettings)).toBe(5);
  });
});

describe('nextSetTargets', () => {
  test('10 / 9 / 8 progresses to 11 / 10 / 9, set by set', () => {
    const next = nextSetTargets(
      source([
        { setNumber: 1, targetReps: 10 },
        { setNumber: 2, targetReps: 10 },
        { setNumber: 3, targetReps: 10 },
      ]),
      [log(1, 10), log(2, 9), log(3, 8)],
      defaultProgressionSettings,
    );

    expect(next.map((target) => target.targetReps)).toEqual([11, 10, 9]);
  });

  test('plan 11 / 10 / 9 with only set 1 logged at 12 gives 13 / 10 / 9', () => {
    const next = nextSetTargets(
      source([
        { setNumber: 1, targetReps: 11, suggestedWeight: 60 },
        { setNumber: 2, targetReps: 10, suggestedWeight: 60 },
        { setNumber: 3, targetReps: 9, suggestedWeight: 57.5 },
      ]),
      [log(1, 12, 62.5)],
      defaultProgressionSettings,
    );

    expect(next).toEqual<SetTarget[]>([
      { setNumber: 1, targetReps: 13, suggestedWeight: 62.5 },
      { setNumber: 2, targetReps: 10, suggestedWeight: 60 },
      { setNumber: 3, targetReps: 9, suggestedWeight: 57.5 },
    ]);
  });

  test('keeps one row per source row even when nothing was logged', () => {
    const next = nextSetTargets(
      source([
        { setNumber: 1, targetReps: 8 },
        { setNumber: 2, targetReps: 8 },
      ]),
      [],
      defaultProgressionSettings,
    );

    expect(next.map((target) => target.targetReps)).toEqual([8, 8]);
  });

  test('ignores logs of other session exercises', () => {
    const foreignLog: SetLog = { ...log(1, 20), sessionExerciseId: 'session-exercise-row' };
    const next = nextSetTargets(
      source([{ setNumber: 1, targetReps: 10 }]),
      [foreignLog],
      defaultProgressionSettings,
    );

    expect(next[0]?.targetReps).toBe(10);
  });

  test('attaches a weight hint to each set from its own fact', () => {
    const next = nextSetTargets(
      source([
        { setNumber: 1, targetReps: 30 },
        { setNumber: 2, targetReps: 12 },
        { setNumber: 3, targetReps: 5 },
      ]),
      [log(1, 30), log(2, 12), log(3, 3)],
      defaultProgressionSettings,
    );

    expect(next.map((target) => target.weightHint)).toEqual(['increase', undefined, 'decrease']);
    expect(next.map((target) => target.targetReps)).toEqual([30, 13, 5]);
  });
});

describe('nextSetTarget', () => {
  test('an unlogged row drops its previous weight hint — there is no new fact to judge', () => {
    expect(
      nextSetTarget(
        { setNumber: 2, targetReps: 30, suggestedWeight: 40, weightHint: 'increase' },
        undefined,
        defaultProgressionSettings,
      ),
    ).toEqual<SetTarget>({ setNumber: 2, targetReps: 30, suggestedWeight: 40 });
  });
});

describe('a pure bodyweight exercise progresses on reps alone (task 105)', () => {
  const settings = { minReps: 5, maxReps: 30 };

  test('DoD: a logged set gets next week’s reps but no weight and no hint', () => {
    const next = nextSetTarget(
      { setNumber: 1, targetReps: 10, suggestedWeight: 80 },
      { reps: 30, weight: 80 },
      settings,
      'bodyweight',
    );

    expect(next).toEqual({ setNumber: 1, targetReps: 30 });
  });

  test('DoD: an unlogged set carries its reps over and drops the weight', () => {
    const next = nextSetTarget(
      { setNumber: 2, targetReps: 12, suggestedWeight: 80 },
      undefined,
      settings,
      'bodyweight',
    );

    expect(next).toEqual({ setNumber: 2, targetReps: 12 });
  });

  test('DoD: a weighted bodyweight exercise keeps progressing on its added weight', () => {
    const next = nextSetTarget(
      { setNumber: 1, targetReps: 8, suggestedWeight: 10 },
      { reps: 8, weight: 10 },
      settings,
      'bodyweight-weighted',
    );

    expect(next).toEqual({ setNumber: 1, targetReps: 9, suggestedWeight: 10 });
  });

  test('DoD: an ordinary exercise is untouched by any of this', () => {
    expect(nextSetTarget({ setNumber: 1 }, { reps: 8, weight: 60 }, settings, 'barbell')).toEqual({
      setNumber: 1,
      targetReps: 9,
      suggestedWeight: 60,
    });
    expect(nextSetTarget({ setNumber: 1 }, { reps: 8, weight: 60 }, settings)).toEqual({
      setNumber: 1,
      targetReps: 9,
      suggestedWeight: 60,
    });
  });
});
