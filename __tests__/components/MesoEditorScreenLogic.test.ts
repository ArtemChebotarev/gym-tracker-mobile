import { hasUnsavedDraft } from '@components/MesoEditorScreenLogic';
import { DEFAULT_MESO_BUILDER_DRAFT, type MesoBuilderDraft } from '@state/draftStore';

const EXERCISE = { exerciseId: 'ex-1' as never, order: 0, sets: 2 };

describe('hasUnsavedDraft (GT-52)', () => {
  test('a fresh draft has nothing to lose, and neither does one with only a stepper moved', () => {
    expect(hasUnsavedDraft(DEFAULT_MESO_BUILDER_DRAFT)).toBe(false);
    expect(hasUnsavedDraft({ ...DEFAULT_MESO_BUILDER_DRAFT, lengthWeeks: 8, daysPerWeek: 2 })).toBe(
      false,
    );
  });

  test('a name, even one with spaces around it, is something; spaces alone are not', () => {
    expect(hasUnsavedDraft({ ...DEFAULT_MESO_BUILDER_DRAFT, name: ' Push ' })).toBe(true);
    expect(hasUnsavedDraft({ ...DEFAULT_MESO_BUILDER_DRAFT, name: '   ' })).toBe(false);
  });

  test('an exercise on any day is something; days left empty are not', () => {
    const withExercise: MesoBuilderDraft = {
      ...DEFAULT_MESO_BUILDER_DRAFT,
      exercisesByDay: { 3: [EXERCISE] },
    };
    expect(hasUnsavedDraft(withExercise)).toBe(true);
    expect(hasUnsavedDraft({ ...DEFAULT_MESO_BUILDER_DRAFT, exercisesByDay: { 1: [] } })).toBe(
      false,
    );
  });

  test('an applied template or a copied week is something', () => {
    expect(hasUnsavedDraft({ ...DEFAULT_MESO_BUILDER_DRAFT, templateId: 'tpl' })).toBe(true);
    expect(
      hasUnsavedDraft({ ...DEFAULT_MESO_BUILDER_DRAFT, source: { mesoId: 'm', weekNumber: 2 } }),
    ).toBe(true);
  });
});
