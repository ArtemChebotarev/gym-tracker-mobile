import type { Session, SessionExercise } from '@domain/execution';
import type { WeekPlan, WeekPlanDay, WeekPlanExercise } from '@domain/plan';
import type { SessionWithExercises } from '@domain/planConverters';
import { extractWeekPlan, materializeWeekPlan } from '@domain/planConverters';
import { STAMPS } from '../fixtures/stamps';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const benchPress: WeekPlanExercise = { exerciseId: 'exercise-bench-press', order: 1, sets: 3 };

const row: WeekPlanExercise = { exerciseId: 'exercise-row', order: 2, sets: 3 };

const squat: WeekPlanExercise = { exerciseId: 'exercise-squat', order: 1, sets: 4 };

const dayOne: WeekPlanDay = {
  dayNumber: 1,
  name: 'Push',
  exercises: [benchPress, row],
};

const dayTwo: WeekPlanDay = {
  dayNumber: 2,
  name: 'Legs',
  exercises: [squat],
};

const weekPlanFixture: WeekPlan = {
  days: [dayOne, dayTwo],
};

describe('materializeWeekPlan / extractWeekPlan', () => {
  test('round-trips a week plan through materialization and extraction without data loss', () => {
    const materialized = materializeWeekPlan(weekPlanFixture, {
      mesoId: 'meso-1',
      weekNumber: 1,
      isDeload: false,
      targetRir: 2,
    });

    expect(extractWeekPlan(materialized)).toEqual(weekPlanFixture);
  });

  test('materializes one session per day, carrying the day name, week number, and isDeload', () => {
    const materialized = materializeWeekPlan(weekPlanFixture, {
      mesoId: 'meso-1',
      weekNumber: 3,
      isDeload: true,
      targetRir: 0,
    });

    expect(materialized).toHaveLength(2);
    for (const { session } of materialized) {
      expect(session.mesoId).toBe('meso-1');
      expect(session.weekNumber).toBe(3);
      expect(session.isDeload).toBe(true);
      expect(session.prescriptionStatus).toBe('ready');
      expect(session.status).toBe('planned');
    }
    expect(materialized[0]?.session.name).toBe('Push');
    expect(materialized[1]?.session.name).toBe('Legs');
  });

  test('materializes one bare setTarget per set, and a shared targetRir per exercise', () => {
    const materialized = materializeWeekPlan(weekPlanFixture, {
      mesoId: 'meso-1',
      weekNumber: 1,
      isDeload: false,
      targetRir: 2,
    });

    const legsDayExercises = materialized[1]?.exercises ?? [];
    expect(legsDayExercises).toHaveLength(1);
    expect(legsDayExercises[0]?.targetRir).toBe(2);
    expect(legsDayExercises[0]?.setTargets).toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
      { setNumber: 3 },
      { setNumber: 4 },
    ]);

    const pushDayExercises = materialized[0]?.exercises ?? [];
    const benchPressSessionExercise = pushDayExercises.find(
      (exercise) => exercise.exerciseId === benchPress.exerciseId,
    );
    expect(benchPressSessionExercise?.setTargets).toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
      { setNumber: 3 },
    ]);
  });

  test('preserves exercise order and composition through extraction, sorted by day/order', () => {
    const materialized = materializeWeekPlan(weekPlanFixture, {
      mesoId: 'meso-1',
      weekNumber: 1,
      isDeload: false,
      targetRir: 2,
    });

    // Shuffle both the day order and the exercise order within a day — extraction must
    // still restore the original structure by `dayNumber` and `order`, not input order.
    const shuffled: SessionWithExercises[] = [
      { ...materialized[1]!, exercises: [...materialized[1]!.exercises] },
      { ...materialized[0]!, exercises: [...materialized[0]!.exercises].reverse() },
    ];

    expect(extractWeekPlan(shuffled)).toEqual(weekPlanFixture);
  });

  // DoD (task 041): a copied week carries no sets logged, no targets and no statuses — only the
  // structure. This is the same source session shape Flow C reads.
  test('drops execution and prescription fields when extracting back to a week plan', () => {
    const completedSession: Session = {
      ...STAMPS,
      id: 'session-completed',
      mesoId: 'meso-1',
      weekNumber: 1,
      dayNumber: 1,
      name: 'Push',
      isDeload: false,
      prescriptionStatus: 'ready',
      status: 'completed',
      sourceSessionId: 'session-source',
      plannedDate: '2026-08-24T00:00:00.000Z',
      startedAt: '2026-08-24T08:00:00.000Z',
      completedAt: '2026-08-24T09:00:00.000Z',
    };

    const completedExercise: SessionExercise = {
      ...STAMPS,
      id: 'session-exercise-completed',
      sessionId: completedSession.id,
      exerciseId: benchPress.exerciseId,
      order: benchPress.order,
      setTargets: [
        { setNumber: 1, targetReps: 8, suggestedWeight: 60, weightHint: 'increase' },
        { setNumber: 2, targetReps: 8, suggestedWeight: 60 },
        { setNumber: 3, targetReps: 8, suggestedWeight: 60 },
      ],
      targetRir: 2,
      status: 'completed',
    };

    const extracted = extractWeekPlan([
      { session: completedSession, exercises: [completedExercise] },
    ]);

    expect(extracted).toEqual<WeekPlan>({
      days: [
        {
          dayNumber: 1,
          name: 'Push',
          exercises: [{ exerciseId: benchPress.exerciseId, order: 1, sets: 3 }],
        },
      ],
    });
  });
});
