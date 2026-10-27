import type { SetTarget } from '@domain/execution';
import { isConflictError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import {
  applyPlannedMesocycleEdit,
  buildCopyWeekMesocycleDraft,
  buildMesocycleStart,
  buildScratchMesocycleDraft,
  buildTemplateMesocycleDraft,
  renamedMesocycle,
  weekPlanSlotKey,
} from '@domain/mesocycleBuilders';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { WeekPlan } from '@domain/plan';
import { COOLDOWN, HEAVY_BAG, HEAVY_BAG_CONFIG, MEDBALL_THROW } from '../fixtures/hybridExercises';
import { STAMPS } from '../fixtures/stamps';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'generated-id-1' }));


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
  // original 038 into the new planned-draft model as "the draft's week plan is structure only",
  // since SetTarget doesn't exist yet at this stage — it's only materialized by Start. Since 041
  // there is no `reps` field left to carry, in any flow.
  test('the draft week plan carries structure only — exercise, order and sets', () => {
    const draft = buildScratchMesocycleDraft({
      name: 'Push/Pull/Legs',
      lengthWeeks: 6,
      daysPerWeek: 2,
      weekPlan: twoDayWeekPlan,
    });

    for (const day of draft.weekPlan?.days ?? []) {
      for (const exercise of day.exercises) {
        expect(Object.keys(exercise).sort()).toEqual(['exerciseId', 'order', 'sets']);
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

describe('buildTemplateMesocycleDraft', () => {
  const input = {
    name: 'Upper/Lower',
    lengthWeeks: 6,
    daysPerWeek: 2,
    weekPlan: twoDayWeekPlan,
    templateId: 'template-upper-lower',
  };

  test('records the template as a template origin', () => {
    expect(buildTemplateMesocycleDraft(input).origin).toEqual({
      type: 'template',
      templateId: 'template-upper-lower',
    });
  });

  test('is otherwise the same planned draft Flow A builds', () => {
    const draft = buildTemplateMesocycleDraft(input);

    expect(draft).toEqual({
      ...buildScratchMesocycleDraft(input),
      origin: { type: 'template', templateId: 'template-upper-lower' },
    });
    expect(draft).not.toHaveProperty('templateId');
  });

  test('validates the draft the same way Flow A does', () => {
    expect(() => buildTemplateMesocycleDraft({ ...input, daysPerWeek: 3 })).toThrow(
      /exactly 3 day/,
    );
  });
});

describe('buildCopyWeekMesocycleDraft', () => {
  // A 6-week source block: 5 working weeks, deload on week 6.
  const source = { id: 'meso-previous', lengthWeeks: 6 };
  const input = {
    name: 'Push/Pull 2',
    lengthWeeks: 6,
    daysPerWeek: 2,
    weekPlan: twoDayWeekPlan,
    sourceWeekNumber: 4,
  };

  // DoD (task 041): the draft gets a copyWeek origin carrying the week number.
  test('records where the week came from as a copyWeek origin', () => {
    const draft = buildCopyWeekMesocycleDraft(input, source);

    expect(draft.origin).toEqual({
      type: 'copyWeek',
      sourceMesoId: 'meso-previous',
      sourceWeekNumber: 4,
    });
  });

  test('is otherwise the same planned draft Flow A builds', () => {
    const draft = buildCopyWeekMesocycleDraft(input, source);

    expect(draft.status).toBe('planned');
    expect(draft.startDate).toBeUndefined();
    expect(draft.name).toBe('Push/Pull 2');
    expect(draft.weekPlan).toEqual(twoDayWeekPlan);
    expect(draft.progressionSettings).toEqual(defaultProgressionSettings);
  });

  // DoD (task 041): Flow C refuses the deload week.
  test('rejects the source block’s deload week', () => {
    expect(() =>
      buildCopyWeekMesocycleDraft({ ...input, sourceWeekNumber: 6 }, source),
    ).toThrow(/deload week/);
  });

  test('takes the new block’s length from the draft, not from the source', () => {
    const draft = buildCopyWeekMesocycleDraft({ ...input, lengthWeeks: 4 }, source);

    expect(draft.lengthWeeks).toBe(4);
    // Week 4 is a working week of the 6-week source, so it stays copyable.
    expect(draft.origin).toEqual(expect.objectContaining({ sourceWeekNumber: 4 }));
  });

  test('validates the draft the same way Flow A does', () => {
    expect(() => buildCopyWeekMesocycleDraft({ ...input, daysPerWeek: 3 }, source)).toThrow(
      /exactly 3 day/,
    );
  });

  test('copies the given progressionSettings as a snapshot rather than referencing them', () => {
    const globalSettings = { ...defaultProgressionSettings, historyLookbackDays: 45 };

    const draft = buildCopyWeekMesocycleDraft(input, source, globalSettings);
    globalSettings.historyLookbackDays = 90;

    expect(draft.progressionSettings.historyLookbackDays).toBe(45);
  });
});

describe('applyPlannedMesocycleEdit', () => {
  const plannedMesocycle: Mesocycle = {
    ...STAMPS,
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

describe('renamedMesocycle', () => {
  const mesocycle: Mesocycle = {
    ...STAMPS,
    id: 'meso-1',
    name: 'Push/Pull/Legs',
    lengthWeeks: 6,
    daysPerWeek: 2,
    startDate: '2026-09-02T08:00:00.000Z',
    status: 'active',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    createdAt: '2026-09-01T12:00:00.000Z',
  };

  test('replaces the name, trimmed, and leaves everything else as it was', () => {
    expect(renamedMesocycle(mesocycle, '  Autumn block  ')).toEqual({
      ...mesocycle,
      name: 'Autumn block',
    });
  });

  test.each(['planned', 'active', 'completed', 'abandoned'] as const)(
    'renames a %s mesocycle — a name is editable in any status',
    (status) => {
      expect(renamedMesocycle({ ...mesocycle, status }, 'Autumn block').name).toBe('Autumn block');
    },
  );

  test('rejects a name that is empty after trimming', () => {
    expect(() => renamedMesocycle(mesocycle, '   ')).toThrow(/Mesocycle name is required/);
  });
});

describe('buildMesocycleStart', () => {
  const NOW = '2026-09-19T09:00:00.000Z';

  // Orders as the editor writes them: from 0, and out of array order on day 1.
  const plannedMesocycle: Mesocycle = {
    ...STAMPS,
    id: 'meso-1',
    name: 'Upper/Lower',
    lengthWeeks: 6,
    daysPerWeek: 2,
    status: 'planned',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    weekPlan: {
      days: [
        {
          dayNumber: 1,
          name: 'Upper',
          exercises: [
            { exerciseId: 'exercise-row', order: 1, sets: 2 },
            { exerciseId: 'exercise-bench-press', order: 0, sets: 3 },
          ],
        },
        { dayNumber: 2, name: '', exercises: [{ exerciseId: 'exercise-squat', order: 0, sets: 4 }] },
      ],
    },
    createdAt: '2026-09-01T12:00:00.000Z',
  };

  test('makes the mesocycle active from now and drops its week plan, keeping the rest', () => {
    const { mesocycle } = buildMesocycleStart(plannedMesocycle, null, NOW);

    expect(mesocycle.status).toBe('active');
    expect(mesocycle.startDate).toBe(NOW);
    expect(mesocycle).not.toHaveProperty('weekPlan');
    const { weekPlan: _weekPlan, ...unchanged } = plannedMesocycle;
    expect(mesocycle).toEqual({ ...unchanged, status: 'active', startDate: NOW });
  });

  test('materializes one planned, ready week 1 session per day of the plan', () => {
    const { week } = buildMesocycleStart(plannedMesocycle, null, NOW);

    expect(week.map(({ session }) => session)).toEqual([
      expect.objectContaining({
        mesoId: 'meso-1',
        weekNumber: 1,
        dayNumber: 1,
        name: 'Upper',
        isDeload: false,
        prescriptionStatus: 'ready',
        status: 'planned',
      }),
      expect.objectContaining({ mesoId: 'meso-1', weekNumber: 1, dayNumber: 2 }),
    ]);
    for (const { session, exercises } of week) {
      expect(exercises.every((exercise) => exercise.sessionId === session.id)).toBe(true);
    }
  });

  test("gives every exercise week 1's RIR and one set target per startSets, without reps", () => {
    const { week } = buildMesocycleStart(plannedMesocycle, null, NOW);
    const exercises = week.flatMap((day) => day.exercises);

    // 6 weeks: 5 working weeks, startRir = min(3, 5 − 1) = 3 on week 1.
    expect(exercises.map((exercise) => exercise.targetRir)).toEqual([3, 3, 3]);
    expect(exercises.map((exercise) => exercise.status)).toEqual(['planned', 'planned', 'planned']);
    expect(exercises.find((e) => e.exerciseId === 'exercise-bench-press')?.setTargets).toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
      { setNumber: 3 },
    ]);
  });

  // Since 041 this holds for a `copyWeek` block too: its week 1 reps are computed at Start from
  // the exercise's history (122), never carried in the plan.
  test('a copied-week mesocycle starts with bare set targets all the same', () => {
    const copied: Mesocycle = {
      ...plannedMesocycle,
      daysPerWeek: 1,
      origin: { type: 'copyWeek', sourceMesoId: 'meso-previous', sourceWeekNumber: 3 },
      weekPlan: {
        days: [
          { dayNumber: 1, name: '', exercises: [{ exerciseId: 'exercise-squat', order: 0, sets: 2 }] },
        ],
      },
    };

    const [day] = buildMesocycleStart(copied, null, NOW).week;

    expect(day?.exercises[0]?.setTargets).toEqual([{ setNumber: 1 }, { setNumber: 2 }]);
  });

  test("renumbers each session's exercises 1..n, in the plan's order", () => {
    const { week } = buildMesocycleStart(plannedMesocycle, null, NOW);

    expect(
      week.map(({ exercises }) => exercises.map(({ exerciseId, order }) => [exerciseId, order])),
    ).toEqual([
      [
        ['exercise-bench-press', 1],
        ['exercise-row', 2],
      ],
      [['exercise-squat', 1]],
    ]);
  });

  test.each(['active', 'completed', 'abandoned'] as const)(
    'rejects a %s mesocycle with a ConflictError',
    (status) => {
      let thrown: unknown;
      try {
        buildMesocycleStart({ ...plannedMesocycle, status }, null, NOW);
      } catch (error) {
        thrown = error;
      }
      expect(isConflictError(thrown)).toBe(true);
    },
  );

  test('rejects with a ConflictError while another mesocycle is active', () => {
    const active: Mesocycle = {
      ...plannedMesocycle,
      id: 'meso-active',
      status: 'active',
      startDate: '2026-09-01T12:00:00.000Z',
      weekPlan: undefined,
    };
    let thrown: unknown;
    try {
      buildMesocycleStart(plannedMesocycle, active, NOW);
    } catch (error) {
      thrown = error;
    }
    expect(isConflictError(thrown)).toBe(true);
  });

  test('rejects a planned mesocycle without a week plan with a ConflictError', () => {
    let thrown: unknown;
    try {
      buildMesocycleStart({ ...plannedMesocycle, weekPlan: undefined }, null, NOW);
    } catch (error) {
      thrown = error;
    }
    expect(isConflictError(thrown)).toBe(true);
  });
});

describe('buildMesocycleStart with ready week 1 targets (task 122)', () => {
  const NOW = '2026-09-19T09:00:00.000Z';

  const copied: Mesocycle = {
    ...STAMPS,
    id: 'meso-copy',
    name: 'Upper/Lower 2',
    lengthWeeks: 6,
    daysPerWeek: 2,
    status: 'planned',
    progressionSettings: defaultProgressionSettings,
    createdAt: '2026-09-01T12:00:00.000Z',
    origin: { type: 'copyWeek', sourceMesoId: 'meso-previous', sourceWeekNumber: 3 },
    weekPlan: {
      days: [
        {
          dayNumber: 1,
          name: '',
          exercises: [
            { exerciseId: 'exercise-bench-press', order: 0, sets: 2 },
            { exerciseId: 'exercise-row', order: 1, sets: 1 },
          ],
        },
        { dayNumber: 2, name: '', exercises: [{ exerciseId: 'exercise-squat', order: 0, sets: 1 }] },
      ],
    },
  };

  test('writes the targets given for a slot and leaves the rest bare', () => {
    const targets = new Map([
      [
        weekPlanSlotKey(1, 'exercise-bench-press'),
        () => [
          { setNumber: 1, targetReps: 7, suggestedWeight: 60 },
          { setNumber: 2, targetReps: 6, suggestedWeight: 60 },
        ],
      ],
      [
        weekPlanSlotKey(2, 'exercise-squat'),
        () => [{ setNumber: 1, targetReps: 9, suggestedWeight: 100 }],
      ],
    ]);

    const { week } = buildMesocycleStart(copied, null, NOW, targets);
    const byExercise = new Map(
      week.flatMap(({ exercises }) => exercises.map((e) => [e.exerciseId, e.setTargets])),
    );

    expect(byExercise.get('exercise-bench-press')).toEqual([
      { setNumber: 1, targetReps: 7, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 6, suggestedWeight: 60 },
    ]);
    expect(byExercise.get('exercise-squat')).toEqual([
      { setNumber: 1, targetReps: 9, suggestedWeight: 100 },
    ]);
    // No entry for day 1's second slot — nothing to price it from.
    expect(byExercise.get('exercise-row')).toEqual([{ setNumber: 1 }]);
  });

  test('keys targets by day and exercise, so a shared order takes nothing from a neighbour', () => {
    // GT-148: two rows of day 1 carry the same `order`. Only the bench press has a reference.
    const sharedOrder: Mesocycle = {
      ...copied,
      weekPlan: {
        days: [
          {
            dayNumber: 1,
            name: '',
            exercises: [
              { exerciseId: 'exercise-bench-press', order: 1, sets: 2 },
              { exerciseId: 'exercise-row', order: 1, sets: 2 },
            ],
          },
        ],
      },
    };
    const targets = new Map([
      [
        weekPlanSlotKey(1, 'exercise-bench-press'),
        () => [{ setNumber: 1, targetReps: 12, suggestedWeight: 20 }],
      ],
    ]);

    const { week } = buildMesocycleStart(sharedOrder, null, NOW, targets);
    const [day1] = week;
    const byExercise = new Map(day1!.exercises.map((e) => [e.exerciseId, e.setTargets]));

    expect(byExercise.get('exercise-bench-press')).toEqual([
      { setNumber: 1, targetReps: 12, suggestedWeight: 20 },
    ]);
    expect(byExercise.get('exercise-row')).toEqual([{ setNumber: 1 }, { setNumber: 2 }]);
  });

  test('prices each row of an exercise placed twice in a day by its own set count', () => {
    const twice: Mesocycle = {
      ...copied,
      weekPlan: {
        days: [
          {
            dayNumber: 1,
            name: '',
            exercises: [
              { exerciseId: 'exercise-bench-press', order: 0, sets: 2 },
              { exerciseId: 'exercise-bench-press', order: 1, sets: 3 },
            ],
          },
        ],
      },
    };
    const targets = new Map([
      [
        weekPlanSlotKey(1, 'exercise-bench-press'),
        (rowCount: number) =>
          Array.from({ length: rowCount }, (_, index) => ({
            setNumber: index + 1,
            targetReps: 10,
          })),
      ],
    ]);

    const { week } = buildMesocycleStart(twice, null, NOW, targets);

    expect(week[0]!.exercises.map((e) => e.setTargets.length)).toEqual([2, 3]);
    expect(week[0]!.exercises.every((e) => e.setTargets.every((t) => t.targetReps === 10))).toBe(
      true,
    );
  });

  test('without targets every row stays bare, as Flow A and B start', () => {
    const { week } = buildMesocycleStart(copied, null, NOW);

    expect(week.flatMap(({ exercises }) => exercises.flatMap((e) => e.setTargets))).toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
      { setNumber: 1 },
      { setNumber: 1 },
    ]);
  });
});

describe('exerciseSettings on the draft (GT-158)', () => {
  const settings = {
    'heavy-bag': {
      type: 'interval' as const,
      workSec: 120,
      restSec: 45,
      getReadySec: 5,
      lever: 'rest' as const,
      stepSec: 15 as const,
      rounds: 3,
    },
  };
  const input = { name: 'Hybrid', lengthWeeks: 6, daysPerWeek: 2, weekPlan: twoDayWeekPlan };

  test('every flow saves the cycle’s own copy with it', () => {
    expect(buildScratchMesocycleDraft({ ...input, exerciseSettings: settings }).exerciseSettings).toEqual(settings);
    expect(
      buildTemplateMesocycleDraft({ ...input, exerciseSettings: settings, templateId: 't' }).exerciseSettings,
    ).toEqual(settings);
    expect(
      buildCopyWeekMesocycleDraft(
        { ...input, exerciseSettings: settings, sourceWeekNumber: 1 },
        { id: 'source', lengthWeeks: 6 },
      ).exerciseSettings,
    ).toEqual(settings);
  });

  test('a cycle with nothing to keep has no exerciseSettings at all', () => {
    expect(buildScratchMesocycleDraft(input)).not.toHaveProperty('exerciseSettings');
    expect(buildScratchMesocycleDraft({ ...input, exerciseSettings: {} })).not.toHaveProperty('exerciseSettings');
  });

  test('the saved settings are a copy of the input, not the same object', () => {
    const draft = buildScratchMesocycleDraft({ ...input, exerciseSettings: settings });

    expect(draft.exerciseSettings).not.toBe(settings);
  });

  test('an edit replaces the stored settings, and one left with none drops the field', () => {
    const planned: Mesocycle = {
      ...STAMPS,
      ...buildScratchMesocycleDraft({ ...input, exerciseSettings: settings }),
    };
    const edited = { 'heavy-bag': { ...settings['heavy-bag'], restSec: 30 } };

    expect(applyPlannedMesocycleEdit(planned, { ...input, exerciseSettings: edited }).exerciseSettings).toEqual(
      edited,
    );
    expect(applyPlannedMesocycleEdit(planned, input)).not.toHaveProperty('exerciseSettings');
  });
});

describe('buildMesocycleStart: rows by exercise type (GT-160)', () => {
  const mixed: Mesocycle = {
    ...STAMPS,
    id: 'meso-hybrid',
    name: 'Hybrid',
    lengthWeeks: 4,
    daysPerWeek: 1,
    status: 'planned',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    weekPlan: {
      days: [
        {
          dayNumber: 1,
          name: '',
          exercises: [
            { exerciseId: 'bench', order: 0, sets: 3 },
            { exerciseId: MEDBALL_THROW.id, order: 1, sets: 3 },
            { exerciseId: HEAVY_BAG.id, order: 2, sets: 2 },
            { exerciseId: COOLDOWN.id, order: 3, sets: 2 },
          ],
        },
      ],
    },
    // The cycle's own interval plan; Cooldown has no copy and takes the library's length.
    exerciseSettings: { [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG, lever: 'none' } },
    createdAt: '2026-09-01T12:00:00.000Z',
  };
  const exercisesById = new Map([
    [MEDBALL_THROW.id as string, MEDBALL_THROW],
    [HEAVY_BAG.id as string, HEAVY_BAG],
    [COOLDOWN.id as string, COOLDOWN],
  ]);

  function rowsOf(weekOneTargets?: Parameters<typeof buildMesocycleStart>[3]) {
    const { week } = buildMesocycleStart(mixed, null, '2026-10-18T09:00:00.000Z', weekOneTargets, exercisesById);
    return new Map(week[0]!.exercises.map((exercise) => [exercise.exerciseId, exercise]));
  }

  test('each type gets its own rows; every one carries the week’s RIR', () => {
    const rows = rowsOf();

    expect(rows.get('bench')?.setTargets).toEqual([{ setNumber: 1 }, { setNumber: 2 }, { setNumber: 3 }]);
    expect(rows.get(MEDBALL_THROW.id)?.setTargets).toHaveLength(3);
    // The cycle's rounds, not its times: those are history's (GT-185).
    expect(rows.get(HEAVY_BAG.id)?.setTargets).toEqual([{ setNumber: 1 }, { setNumber: 2 }]);
    expect(rows.get(COOLDOWN.id)?.setTargets).toEqual([{ setNumber: 1 }]);
    const rirs = new Set([...rows.values()].map((exercise) => exercise.targetRir));
    expect(rirs.size).toBe(1);
  });

  test('a copied block’s history prices sets and an interval’s rounds, not a mobility block (GT-185)', () => {
    const priced = () => [{ setNumber: 1, targetReps: 8, suggestedWeight: 40 }];
    const timed = (rowCount: number) =>
      Array.from({ length: rowCount }, (_, index) => ({
        setNumber: index + 1,
        targetWorkSec: 75,
        targetRestSec: 20,
      }));
    const rows = rowsOf(
      new Map<string, (rowCount: number) => SetTarget[]>([
        [weekPlanSlotKey(1, MEDBALL_THROW.id), priced],
        [weekPlanSlotKey(1, HEAVY_BAG.id), timed],
        [weekPlanSlotKey(1, COOLDOWN.id), priced],
      ]),
    );

    expect(rows.get(MEDBALL_THROW.id)?.setTargets).toEqual(priced());
    // As many rounds as the cycle plans, priced by history.
    expect(rows.get(HEAVY_BAG.id)?.setTargets).toEqual(timed(2));
    expect(rows.get(COOLDOWN.id)?.setTargets).toEqual([{ setNumber: 1 }]);
  });

  test('without exercise records every exercise is laid out as sets, as before', () => {
    const { week } = buildMesocycleStart(mixed, null, '2026-10-18T09:00:00.000Z');

    expect(week[0]!.exercises.find((exercise) => exercise.exerciseId === HEAVY_BAG.id)?.setTargets).toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
    ]);
  });
});
