import { buildScratchMesocycleDraft } from '@domain/mesocycleBuilders';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { WeekPlan } from '@domain/plan';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'generated-id-1' }));

const UTC_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const twoDayWeekPlan: WeekPlan = {
  days: [
    { dayNumber: 1, name: '', exercises: [{ exerciseId: 'exercise-bench-press', order: 1, sets: 3 }] },
    { dayNumber: 2, name: '', exercises: [{ exerciseId: 'exercise-squat', order: 1, sets: 4 }] },
  ],
};

describe('buildScratchMesocycleDraft', () => {
  test('builds a planned draft with no startDate and the given weekPlan attached', () => {
    const draft = buildScratchMesocycleDraft({
      name: 'Push/Pull/Legs',
      lengthWeeks: 6,
      daysPerWeek: 2,
      weekPlan: twoDayWeekPlan,
    });

    expect(draft.status).toBe('planned');
    expect(draft.startDate).toBeUndefined();
    expect(draft.weekPlan).toEqual(twoDayWeekPlan);
    expect(draft.origin).toEqual({ type: 'scratch' });
    expect(draft.progressionSettings).toEqual(defaultProgressionSettings);
    expect(draft.id).toBe('generated-id-1');
    expect(draft.createdAt).toMatch(UTC_ISO_PATTERN);
  });

  test('carries the given name, lengthWeeks, and daysPerWeek through unchanged', () => {
    const draft = buildScratchMesocycleDraft({
      name: 'Upper/Lower',
      lengthWeeks: 4,
      daysPerWeek: 2,
      weekPlan: twoDayWeekPlan,
    });

    expect(draft.name).toBe('Upper/Lower');
    expect(draft.lengthWeeks).toBe(4);
    expect(draft.daysPerWeek).toBe(2);
  });

  // DoD (task 038): "у всех SetTarget отсутствует targetReps" — carried forward from the
  // original 038 into the new planned-draft model as "no WeekPlanExercise carries reps", since
  // SetTarget doesn't exist yet at this stage — it's only materialized by Start.
  test('does not require reps on any weekPlan exercise (Flow A never sets it)', () => {
    const draft = buildScratchMesocycleDraft({
      name: 'Push/Pull/Legs',
      lengthWeeks: 6,
      daysPerWeek: 2,
      weekPlan: twoDayWeekPlan,
    });

    for (const day of draft.weekPlan?.days ?? []) {
      for (const exercise of day.exercises) {
        expect(exercise.reps).toBeUndefined();
      }
    }
  });

  test('rejects a weekPlan whose day count does not match daysPerWeek', () => {
    expect(() =>
      buildScratchMesocycleDraft({
        name: 'Push/Pull/Legs',
        lengthWeeks: 6,
        daysPerWeek: 3,
        weekPlan: twoDayWeekPlan,
      }),
    ).toThrow(/WeekPlan must have exactly 3 day\(s\)/);
  });

  test('rejects an out-of-range lengthWeeks', () => {
    expect(() =>
      buildScratchMesocycleDraft({
        name: 'Push/Pull/Legs',
        lengthWeeks: 9,
        daysPerWeek: 2,
        weekPlan: twoDayWeekPlan,
      }),
    ).toThrow(/lengthWeeks must be between 3 and 8/);
  });

  test('rejects an out-of-range daysPerWeek', () => {
    expect(() =>
      buildScratchMesocycleDraft({
        name: 'Push/Pull/Legs',
        lengthWeeks: 6,
        daysPerWeek: 8,
        weekPlan: twoDayWeekPlan,
      }),
    ).toThrow(/daysPerWeek must be between 1 and 7/);
  });
});
