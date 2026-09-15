import { DEFAULT_MESO_BUILDER_DRAFT, useDraftStore } from '@state/draftStore';

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
