import type { MuscleGroup } from '@domain/catalog';
import type { SetLog, SetTarget } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { SourceExercise } from '@domain/progression';
import { isDeloadWeek, prescribeNextSession, type NextSessionInput } from '@domain/progressionPlan';
import { STAMPS } from '../fixtures/stamps';

const threeSets: SetTarget[] = [
  { setNumber: 1, targetReps: 10, suggestedWeight: 60 },
  { setNumber: 2, targetReps: 10, suggestedWeight: 60 },
  { setNumber: 3, targetReps: 10, suggestedWeight: 60 },
];

function sourceExercise(
  id: string,
  exerciseId: string,
  order: number,
  muscleGroup: MuscleGroup = 'chest',
  setTargets: SetTarget[] = threeSets,
): SourceExercise {
  return { sessionExercise: { id, exerciseId, order, setTargets }, muscleGroup };
}

function log(sessionExerciseId: string, setNumber: number, weight: number, reps: number): SetLog {
  return {
    ...STAMPS,
    id: `${sessionExerciseId}-log-${setNumber}`,
    sessionExerciseId,
    exerciseId: `exercise-${sessionExerciseId}`,
    setNumber,
    weight,
    reps,
    completedAt: '2026-09-10T08:00:00.000Z',
  };
}

function input(overrides: Partial<NextSessionInput>): NextSessionInput {
  return {
    exercises: [],
    logs: [],
    weekNumber: 2,
    lengthWeeks: 5,
    settings: defaultProgressionSettings,
    ...overrides,
  };
}

describe('isDeloadWeek', () => {
  test('is the last week of the block', () => {
    expect(isDeloadWeek(5, 5)).toBe(true);
    expect(isDeloadWeek(5, 4)).toBe(false);
  });
});

describe('prescribeNextSession', () => {
  test('progresses every set of every exercise and sets the week’s RIR', () => {
    const plan = prescribeNextSession(
      input({
        exercises: [sourceExercise('bench', 'exercise-bench', 1)],
        logs: [log('bench', 1, 60, 10), log('bench', 2, 60, 9), log('bench', 3, 57.5, 8)],
        weekNumber: 2,
        lengthWeeks: 5,
      }),
    );
    expect(plan).toEqual([
      {
        exerciseId: 'exercise-bench',
        order: 1,
        setTargets: [
          { setNumber: 1, targetReps: 11, suggestedWeight: 60 },
          { setNumber: 2, targetReps: 10, suggestedWeight: 60 },
          { setNumber: 3, targetReps: 9, suggestedWeight: 57.5 },
        ],
        targetRir: 2,
      },
    ]);
  });

  test('a reordering in the source carries over', () => {
    const plan = prescribeNextSession(
      input({
        exercises: [
          sourceExercise('squat', 'exercise-squat', 1, 'quads'),
          sourceExercise('bench', 'exercise-bench', 3),
          sourceExercise('row', 'exercise-row', 2, 'back'),
        ],
      }),
    );
    expect(plan.map((exercise) => [exercise.order, exercise.exerciseId])).toEqual([
      [1, 'exercise-squat'],
      [2, 'exercise-row'],
      [3, 'exercise-bench'],
    ]);
  });

  test('a swap carries over — the exercise actually performed, with its own fact', () => {
    // Planned bench press, swapped for dumbbell press in the source session.
    const swapped = sourceExercise('press', 'exercise-db-press', 1, 'chest', [
      { setNumber: 1, targetReps: 12, suggestedWeight: 24 },
      { setNumber: 2, targetReps: 12, suggestedWeight: 24 },
    ]);
    const [plan] = prescribeNextSession(
      input({ exercises: [swapped], logs: [log('press', 1, 26, 12), log('press', 2, 26, 11)] }),
    );
    expect(plan?.exerciseId).toBe('exercise-db-press');
    expect(plan?.setTargets).toEqual([
      { setNumber: 1, targetReps: 13, suggestedWeight: 26 },
      { setNumber: 2, targetReps: 12, suggestedWeight: 26 },
    ]);
  });

  test('an exercise added in the source (rule 6) progresses like any other', () => {
    const added = sourceExercise('curl', 'exercise-curl', 2, 'biceps', [
      { setNumber: 1, targetReps: 13, suggestedWeight: 12 },
      { setNumber: 2, targetReps: 13, suggestedWeight: 12 },
    ]);
    const plan = prescribeNextSession(
      input({
        exercises: [sourceExercise('bench', 'exercise-bench', 1), added],
        logs: [log('curl', 1, 12, 14), log('curl', 2, 12, 12)],
      }),
    );
    expect(plan[1]).toEqual({
      exerciseId: 'exercise-curl',
      order: 2,
      setTargets: [
        { setNumber: 1, targetReps: 15, suggestedWeight: 12 },
        { setNumber: 2, targetReps: 13, suggestedWeight: 12 },
      ],
      targetRir: 2,
    });
  });

  test('an exercise removed from the source does not come back', () => {
    // The plan had bench, row and curl; curl was removed mid-session (086), so the source at
    // Finish holds only bench and row.
    const plan = prescribeNextSession(
      input({
        exercises: [
          sourceExercise('bench', 'exercise-bench', 1),
          sourceExercise('row', 'exercise-row', 2, 'back'),
        ],
      }),
    );
    expect(plan.map((exercise) => exercise.exerciseId)).toEqual(['exercise-bench', 'exercise-row']);
  });

  test('added and removed set rows set next week’s count (rule 1)', () => {
    const fiveSets = sourceExercise('bench', 'exercise-bench', 1, 'chest', [
      ...threeSets,
      { setNumber: 4, targetReps: 10, suggestedWeight: 60 },
      { setNumber: 5, targetReps: 10, suggestedWeight: 60 },
    ]);
    const twoSets = sourceExercise('row', 'exercise-row', 2, 'back', threeSets.slice(0, 2));
    const plan = prescribeNextSession(input({ exercises: [fiveSets, twoSets] }));
    expect(plan.map((exercise) => exercise.setTargets.length)).toEqual([5, 2]);
  });

  test('every exercise shares the week’s RIR (rule 4)', () => {
    const exercises = [
      sourceExercise('bench', 'exercise-bench', 1),
      sourceExercise('row', 'exercise-row', 2, 'back'),
    ];
    expect(
      prescribeNextSession(input({ exercises, weekNumber: 4, lengthWeeks: 5 })).map(
        (exercise) => exercise.targetRir,
      ),
    ).toEqual([0, 0]);
    expect(
      prescribeNextSession(input({ exercises, weekNumber: 3, lengthWeeks: 7 })).map(
        (exercise) => exercise.targetRir,
      ),
    ).toEqual([2, 2]);
  });

  test('carries a weight hint per set (rule 3)', () => {
    const [plan] = prescribeNextSession(
      input({
        exercises: [sourceExercise('bench', 'exercise-bench', 1)],
        logs: [log('bench', 1, 40, 31), log('bench', 2, 60, 12), log('bench', 3, 100, 4)],
      }),
    );
    expect(plan?.setTargets.map((target) => target.weightHint)).toEqual([
      'increase',
      undefined,
      'decrease',
    ]);
  });

  test('the last week is planned as deload (rule 5)', () => {
    const plan = prescribeNextSession(
      input({
        exercises: [
          sourceExercise('bench', 'exercise-bench', 1),
          sourceExercise('fly', 'exercise-fly', 2),
          sourceExercise('row', 'exercise-row', 3, 'back'),
        ],
        logs: [log('bench', 1, 80, 8), log('fly', 1, 20, 12), log('row', 1, 70, 10)],
        weekNumber: 5,
        lengthWeeks: 5,
      }),
    );
    expect(plan).toEqual([
      {
        exerciseId: 'exercise-bench',
        order: 1,
        setTargets: [{ setNumber: 1, suggestedWeight: 40 }],
        targetRir: 8,
      },
      {
        exerciseId: 'exercise-fly',
        order: 2,
        setTargets: [{ setNumber: 1, suggestedWeight: 10 }],
        targetRir: 8,
      },
      {
        exerciseId: 'exercise-row',
        order: 3,
        setTargets: [
          { setNumber: 1, suggestedWeight: 35 },
          { setNumber: 2, suggestedWeight: 35 },
        ],
        targetRir: 8,
      },
    ]);
  });

  test('follows the mesocycle’s own settings snapshot', () => {
    const [plan] = prescribeNextSession(
      input({
        exercises: [sourceExercise('bench', 'exercise-bench', 1, 'chest', [{ setNumber: 1 }])],
        logs: [log('bench', 1, 60, 15)],
        settings: { ...defaultProgressionSettings, maxReps: 15 },
      }),
    );
    expect(plan?.setTargets).toEqual([
      { setNumber: 1, targetReps: 15, suggestedWeight: 60, weightHint: 'increase' },
    ]);
  });

  test('rejects a week past the end of the block', () => {
    expect(() => prescribeNextSession(input({ weekNumber: 6, lengthWeeks: 5 }))).toThrow();
  });

  test('is deterministic and leaves its input untouched', () => {
    const source = input({
      exercises: [
        sourceExercise('row', 'exercise-row', 2, 'back'),
        sourceExercise('bench', 'exercise-bench', 1),
      ],
      logs: [log('bench', 1, 60, 10), log('row', 2, 50, 12)],
    });
    const snapshot = structuredClone(source);
    const first = prescribeNextSession(source);
    const second = prescribeNextSession(source);
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(source).toEqual(snapshot);
  });
});
