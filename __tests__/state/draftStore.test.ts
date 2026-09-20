import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import {
  DEFAULT_MESO_BUILDER_DRAFT,
  toMesoBuilderDraft,
  toScratchMesocycleDraftInput,
  useDraftStore,
} from '@state/draftStore';
import { STAMPS } from '../fixtures/stamps';

describe('draftStore', () => {
  afterEach(() => {
    useDraftStore.setState({ mesoBuilder: DEFAULT_MESO_BUILDER_DRAFT });
  });

  test('starts with the default mesocycle builder draft', () => {
    expect(useDraftStore.getState().mesoBuilder).toEqual(DEFAULT_MESO_BUILDER_DRAFT);
  });

  test('setMesoBuilder replaces the draft', () => {
    useDraftStore.getState().setMesoBuilder({
      name: 'Block 6',
      lengthWeeks: 8,
      daysPerWeek: 5,
      exercisesByDay: { 1: [{ exerciseId: 'bench-press', order: 0, sets: 3 }] },
    });

    expect(useDraftStore.getState().mesoBuilder).toEqual({
      name: 'Block 6',
      lengthWeeks: 8,
      daysPerWeek: 5,
      exercisesByDay: { 1: [{ exerciseId: 'bench-press', order: 0, sets: 3 }] },
    });
  });

  test('setMesoBuilder accepts an updater function that reads the store\'s current draft', () => {
    useDraftStore.getState().setMesoBuilder({
      name: 'Block 6',
      lengthWeeks: 8,
      daysPerWeek: 5,
      exercisesByDay: {},
    });

    useDraftStore.getState().setMesoBuilder((current) => ({ ...current, name: 'Block 7' }));

    expect(useDraftStore.getState().mesoBuilder).toEqual({
      name: 'Block 7',
      lengthWeeks: 8,
      daysPerWeek: 5,
      exercisesByDay: {},
    });
  });

  test('the updater form reads the store\'s state at call time, not a value captured earlier', () => {
    useDraftStore.getState().setMesoBuilder({ ...DEFAULT_MESO_BUILDER_DRAFT, name: 'Original' });
    const staleUpdater = (current: typeof DEFAULT_MESO_BUILDER_DRAFT) => ({ ...current, lengthWeeks: 10 });

    // A second, unrelated change happens after `staleUpdater` was defined but before it runs —
    // the scenario this form exists for (MesoEditorDaysStep.tsx's cached drag responder calling
    // back after other draft edits have already landed).
    useDraftStore.getState().setMesoBuilder((current) => ({ ...current, name: 'Changed in between' }));
    useDraftStore.getState().setMesoBuilder(staleUpdater);

    expect(useDraftStore.getState().mesoBuilder).toEqual({
      ...DEFAULT_MESO_BUILDER_DRAFT,
      name: 'Changed in between',
      lengthWeeks: 10,
    });
  });

  test('resetMesoBuilder restores the default draft', () => {
    useDraftStore.getState().setMesoBuilder({
      name: 'Block 6',
      lengthWeeks: 8,
      daysPerWeek: 5,
      exercisesByDay: {},
    });

    useDraftStore.getState().resetMesoBuilder();

    expect(useDraftStore.getState().mesoBuilder).toEqual(DEFAULT_MESO_BUILDER_DRAFT);
  });
});

describe('toScratchMesocycleDraftInput', () => {
  test('builds one week plan day per day of the week, carrying name/length/days through', () => {
    const input = toScratchMesocycleDraftInput({
      name: 'Block 6',
      lengthWeeks: 5,
      daysPerWeek: 2,
      exercisesByDay: {
        1: [{ exerciseId: 'bench-press', order: 0, sets: 3 }],
        2: [{ exerciseId: 'squat', order: 0, sets: 2 }],
      },
    });

    expect(input).toEqual({
      name: 'Block 6',
      lengthWeeks: 5,
      daysPerWeek: 2,
      weekPlan: {
        days: [
          { dayNumber: 1, name: '', exercises: [{ exerciseId: 'bench-press', order: 0, sets: 3 }] },
          { dayNumber: 2, name: '', exercises: [{ exerciseId: 'squat', order: 0, sets: 2 }] },
        ],
      },
    });
  });

  test('turns a day with no entry into an empty day', () => {
    const input = toScratchMesocycleDraftInput({ ...DEFAULT_MESO_BUILDER_DRAFT, daysPerWeek: 2 });

    expect(input.weekPlan.days).toEqual([
      { dayNumber: 1, name: '', exercises: [] },
      { dayNumber: 2, name: '', exercises: [] },
    ]);
  });

  test('drops entries for days beyond daysPerWeek', () => {
    const input = toScratchMesocycleDraftInput({
      ...DEFAULT_MESO_BUILDER_DRAFT,
      daysPerWeek: 1,
      exercisesByDay: {
        1: [{ exerciseId: 'bench-press', order: 0, sets: 3 }],
        3: [{ exerciseId: 'squat', order: 0, sets: 2 }],
      },
    });

    expect(input.weekPlan.days).toHaveLength(1);
    expect(input.weekPlan.days[0]?.dayNumber).toBe(1);
  });
});

describe('toMesoBuilderDraft', () => {
  const planned: Mesocycle = {
    ...STAMPS,
    id: 'meso-1',
    name: 'Push/Pull',
    lengthWeeks: 5,
    daysPerWeek: 2,
    status: 'planned',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    weekPlan: {
      days: [
        { dayNumber: 1, name: '', exercises: [{ exerciseId: 'bench-press', order: 0, sets: 3 }] },
        { dayNumber: 2, name: '', exercises: [{ exerciseId: 'squat', order: 0, sets: 4 }] },
      ],
    },
    createdAt: '2026-09-01T12:00:00.000Z',
  };

  test('loads name, length, days, and each day\'s exercises keyed by dayNumber', () => {
    expect(toMesoBuilderDraft(planned)).toEqual({
      name: 'Push/Pull',
      lengthWeeks: 5,
      daysPerWeek: 2,
      exercisesByDay: {
        1: [{ exerciseId: 'bench-press', order: 0, sets: 3 }],
        2: [{ exerciseId: 'squat', order: 0, sets: 4 }],
      },
    });
  });

  test('round-trips through toScratchMesocycleDraftInput back to the same weekPlan', () => {
    expect(toScratchMesocycleDraftInput(toMesoBuilderDraft(planned)).weekPlan).toEqual(
      planned.weekPlan,
    );
  });

  test('loads a mesocycle without a weekPlan with no exercises', () => {
    expect(toMesoBuilderDraft({ ...planned, weekPlan: undefined }).exercisesByDay).toEqual({});
  });
});
