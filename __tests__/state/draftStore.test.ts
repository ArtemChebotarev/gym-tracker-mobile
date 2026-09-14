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
