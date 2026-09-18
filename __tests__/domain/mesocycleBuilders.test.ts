import { isConflictError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import { applyPlannedMesocycleEdit, buildScratchMesocycleDraft } from '@domain/mesocycleBuilders';
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

  test('copies the given progressionSettings as a snapshot rather than referencing them', () => {
    const globalSettings = { ...defaultProgressionSettings, historyLookbackDays: 45 };

    const draft = buildScratchMesocycleDraft(
      { name: 'Push/Pull/Legs', lengthWeeks: 6, daysPerWeek: 2, weekPlan: twoDayWeekPlan },
      globalSettings,
    );
    globalSettings.historyLookbackDays = 90;

    expect(draft.progressionSettings.historyLookbackDays).toBe(45);
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

describe('applyPlannedMesocycleEdit', () => {
  const plannedMesocycle: Mesocycle = {
    id: 'meso-1',
    name: 'Push/Pull/Legs',
    lengthWeeks: 6,
    daysPerWeek: 2,
    status: 'planned',
    origin: { type: 'template', templateId: 'template-1' },
    progressionSettings: { ...defaultProgressionSettings, maxReps: 20 },
    weekPlan: twoDayWeekPlan,
    createdAt: '2026-09-01T12:00:00.000Z',
  };

  const threeDayWeekPlan: WeekPlan = {
    days: [
      { dayNumber: 1, name: 'Push', exercises: [{ exerciseId: 'exercise-bench-press', order: 1, sets: 5 }] },
      { dayNumber: 2, name: 'Pull', exercises: [] },
      { dayNumber: 3, name: 'Legs', exercises: [{ exerciseId: 'exercise-squat', order: 1, sets: 2 }] },
    ],
  };

  test('takes name, lengthWeeks, daysPerWeek, and weekPlan from the edit', () => {
    const edited = applyPlannedMesocycleEdit(plannedMesocycle, {
      name: 'PPL v2',
      lengthWeeks: 8,
      daysPerWeek: 3,
      weekPlan: threeDayWeekPlan,
    });

    expect(edited.name).toBe('PPL v2');
    expect(edited.lengthWeeks).toBe(8);
    expect(edited.daysPerWeek).toBe(3);
    expect(edited.weekPlan).toEqual(threeDayWeekPlan);
  });

  test('keeps id, status, origin, progressionSettings, and createdAt, and sets no startDate', () => {
    const edited = applyPlannedMesocycleEdit(plannedMesocycle, {
      name: 'PPL v2',
      lengthWeeks: 8,
      daysPerWeek: 3,
      weekPlan: threeDayWeekPlan,
    });

    expect(edited.id).toBe(plannedMesocycle.id);
    expect(edited.status).toBe('planned');
    expect(edited.origin).toEqual(plannedMesocycle.origin);
    expect(edited.progressionSettings).toEqual(plannedMesocycle.progressionSettings);
    expect(edited.createdAt).toBe(plannedMesocycle.createdAt);
    expect(edited.startDate).toBeUndefined();
  });

  test.each(['active', 'completed', 'abandoned'] as const)(
    'rejects a %s mesocycle with a ConflictError',
    (status) => {
      const edit = { name: 'PPL v2', lengthWeeks: 6, daysPerWeek: 2, weekPlan: twoDayWeekPlan };
      let thrown: unknown;
      try {
        applyPlannedMesocycleEdit({ ...plannedMesocycle, status, weekPlan: undefined }, edit);
      } catch (error) {
        thrown = error;
      }
      expect(isConflictError(thrown)).toBe(true);
    },
  );

  test('rejects a weekPlan whose day count does not match daysPerWeek', () => {
    expect(() =>
      applyPlannedMesocycleEdit(plannedMesocycle, {
        name: 'PPL v2',
        lengthWeeks: 6,
        daysPerWeek: 3,
        weekPlan: twoDayWeekPlan,
      }),
    ).toThrow(/WeekPlan must have exactly 3 day\(s\)/);
  });

  test('rejects an out-of-range lengthWeeks', () => {
    expect(() =>
      applyPlannedMesocycleEdit(plannedMesocycle, {
        name: 'PPL v2',
        lengthWeeks: 2,
        daysPerWeek: 2,
        weekPlan: twoDayWeekPlan,
      }),
    ).toThrow(/lengthWeeks must be between 3 and 8/);
  });
});
