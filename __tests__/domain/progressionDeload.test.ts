import type { MuscleGroup } from '@domain/catalog';
import type { SetLog, SetTarget } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { ExercisePrescription, SourceExercise } from '@domain/progression';
import { deloadSetCount, deloadWeight, prescribeDeloadDay } from '@domain/progressionDeload';

function sourceExercise(
  id: string,
  order: number,
  muscleGroup: MuscleGroup,
  setTargets: SetTarget[] = [
    { setNumber: 1, targetReps: 10, suggestedWeight: 60 },
    { setNumber: 2, targetReps: 10, suggestedWeight: 60 },
    { setNumber: 3, targetReps: 10, suggestedWeight: 60 },
  ],
): SourceExercise {
  return {
    sessionExercise: { id, exerciseId: `exercise-${id}`, order, setTargets },
    muscleGroup,
  };
}

function log(sessionExerciseId: string, setNumber: number, weight: number, reps = 10): SetLog {
  return {
    id: `${sessionExerciseId}-log-${setNumber}`,
    sessionExerciseId,
    exerciseId: `exercise-${sessionExerciseId}`,
    setNumber,
    weight,
    reps,
    completedAt: '2026-09-10T08:00:00.000Z',
  };
}

describe('deloadSetCount', () => {
  test('2 sets for the only exercise of a muscle group', () => {
    expect(deloadSetCount(1)).toBe(2);
  });

  test.each([2, 3])('1 set each when the group has %i exercises', (count) => {
    expect(deloadSetCount(count)).toBe(1);
  });
});

describe('deloadWeight', () => {
  const bench = sourceExercise('bench', 1, 'chest');

  test('is half the logged weight of the first set', () => {
    const logs = [log('bench', 1, 80), log('bench', 2, 70), log('bench', 3, 65)];
    expect(deloadWeight(bench.sessionExercise, logs, defaultProgressionSettings)).toBe(40);
  });

  test('falls back to the first set’s last known weight when set 1 was not logged', () => {
    const logs = [log('bench', 2, 70)];
    expect(deloadWeight(bench.sessionExercise, logs, defaultProgressionSettings)).toBe(30);
  });

  test('ignores logs of other session exercises', () => {
    const logs = [log('row', 1, 100)];
    expect(deloadWeight(bench.sessionExercise, logs, defaultProgressionSettings)).toBe(30);
  });

  test('is unknown when set 1 has neither a log nor a suggested weight', () => {
    const noWeight = sourceExercise('curl', 1, 'biceps', [{ setNumber: 1 }]);
    expect(deloadWeight(noWeight.sessionExercise, [], defaultProgressionSettings)).toBeUndefined();
  });

  test('follows the mesocycle’s own weight factor', () => {
    const logs = [log('bench', 1, 80)];
    expect(deloadWeight(bench.sessionExercise, logs, { deloadWeightFactor: 0.6 })).toBe(48);
  });
});

describe('prescribeDeloadDay', () => {
  test('one exercise per group gets 2 sets at half weight, RIR 8, no target reps', () => {
    const day = prescribeDeloadDay(
      [sourceExercise('bench', 1, 'chest'), sourceExercise('squat', 2, 'quads')],
      [log('bench', 1, 80), log('squat', 1, 120)],
      defaultProgressionSettings,
    );

    expect(day).toEqual<ExercisePrescription[]>([
      {
        exerciseId: 'exercise-bench',
        order: 1,
        setTargets: [
          { setNumber: 1, suggestedWeight: 40 },
          { setNumber: 2, suggestedWeight: 40 },
        ],
        targetRir: 8,
      },
      {
        exerciseId: 'exercise-squat',
        order: 2,
        setTargets: [
          { setNumber: 1, suggestedWeight: 60 },
          { setNumber: 2, suggestedWeight: 60 },
        ],
        targetRir: 8,
      },
    ]);
  });

  test('two exercises of one group get 1 set each', () => {
    const day = prescribeDeloadDay(
      [sourceExercise('bench', 1, 'chest'), sourceExercise('fly', 2, 'chest')],
      [],
      defaultProgressionSettings,
    );

    expect(day.map((exercise) => exercise.setTargets.length)).toEqual([1, 1]);
  });

  test('three exercises of one group get 1 set each — 3 sets, none dropped', () => {
    const day = prescribeDeloadDay(
      [
        sourceExercise('bench', 1, 'chest'),
        sourceExercise('curl', 2, 'biceps'),
        sourceExercise('incline', 3, 'chest'),
        sourceExercise('fly', 4, 'chest'),
      ],
      [],
      defaultProgressionSettings,
    );

    expect(day.map((exercise) => exercise.exerciseId)).toEqual([
      'exercise-bench',
      'exercise-curl',
      'exercise-incline',
      'exercise-fly',
    ]);
    expect(day.map((exercise) => exercise.setTargets.length)).toEqual([1, 2, 1, 1]);
  });

  test('keeps the source order and leaves the weight empty when it is unknown', () => {
    const day = prescribeDeloadDay(
      [sourceExercise('row', 2, 'back', [{ setNumber: 1 }]), sourceExercise('bench', 1, 'chest')],
      [],
      defaultProgressionSettings,
    );

    expect(day.map((exercise) => exercise.order)).toEqual([1, 2]);
    expect(day[1]?.setTargets).toEqual<SetTarget[]>([{ setNumber: 1 }, { setNumber: 2 }]);
  });

  test('uses the mesocycle’s deload RIR', () => {
    const day = prescribeDeloadDay([sourceExercise('bench', 1, 'chest')], [], {
      deloadRir: 6,
      deloadWeightFactor: 0.5,
    });

    expect(day[0]?.targetRir).toBe(6);
  });
});

describe('deload and the bodyweight exercises (task 105)', () => {
  test('DoD: a pure bodyweight exercise gets no deload weight — half a body weight is no target', () => {
    const pullUp: SourceExercise = {
      ...sourceExercise('pull-up', 0, 'back'),
      equipment: 'bodyweight',
    };

    const [prescription] = prescribeDeloadDay([pullUp], [], defaultProgressionSettings);

    expect(prescription?.setTargets).toEqual([{ setNumber: 1 }, { setNumber: 2 }]);
    expect(prescription?.targetRir).toBe(defaultProgressionSettings.deloadRir);
  });

  test('DoD: a weighted bodyweight exercise halves its added weight like any other', () => {
    const weighted: SourceExercise = {
      ...sourceExercise('pull-up-weighted', 0, 'back', [
        { setNumber: 1, targetReps: 8, suggestedWeight: 10 },
      ]),
      equipment: 'bodyweight-weighted',
    };

    const [prescription] = prescribeDeloadDay([weighted], [], defaultProgressionSettings);

    expect(prescription?.setTargets).toEqual([
      { setNumber: 1, suggestedWeight: 5 },
      { setNumber: 2, suggestedWeight: 5 },
    ]);
  });
});
