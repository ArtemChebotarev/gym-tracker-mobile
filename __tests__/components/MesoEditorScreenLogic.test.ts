import {
  addExercisesToDraft,
  hasUnsavedDraft,
  rememberSelectedExercises,
  removeExerciseFromDraft,
} from '@components/MesoEditorScreenLogic';
import { toExerciseId, type Exercise } from '@domain/catalog';
import type { ExerciseListGroup } from '@domain/catalogListing';
import { DEFAULT_INTERVAL_ROUNDS } from '@domain/exerciseConfigBuilders';
import { COOLDOWN, HEAVY_BAG, HEAVY_BAG_CONFIG, MEDBALL_THROW } from '../fixtures/hybridExercises';
import { STAMPS } from '../fixtures/stamps';
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

describe('the cycle’s own exercise settings (GT-158)', () => {
  const BENCH_PRESS: Exercise = {
    ...STAMPS,
    id: toExerciseId('bench-press'),
    name: 'Bench Press',
    muscleGroup: 'chest',
    source: 'catalog',
    isHidden: false,
  };
  const records = {
    [BENCH_PRESS.id]: BENCH_PRESS,
    [HEAVY_BAG.id]: HEAVY_BAG,
    [COOLDOWN.id]: COOLDOWN,
    [MEDBALL_THROW.id]: MEDBALL_THROW,
  };
  const groupOf = (...exercises: Exercise[]): ExerciseListGroup[] => [
    { muscleGroup: 'fullBody', entries: exercises.map((exercise) => ({ exercise, lastSetLog: null })) },
  ];

  test('adding copies each hybrid exercise’s library config into the draft, none for strength', () => {
    const draft = addExercisesToDraft(
      DEFAULT_MESO_BUILDER_DRAFT,
      1,
      [BENCH_PRESS.id, HEAVY_BAG.id, COOLDOWN.id],
      records,
    );

    expect(draft.exercisesByDay[1]?.map((entry) => entry.exerciseId)).toEqual([
      BENCH_PRESS.id,
      HEAVY_BAG.id,
      COOLDOWN.id,
    ]);
    expect(draft.exerciseSettings).toEqual({
      [HEAVY_BAG.id]: { ...HEAVY_BAG.config, rounds: DEFAULT_INTERVAL_ROUNDS },
      [COOLDOWN.id]: COOLDOWN.config,
    });
  });

  test('adding the same exercise to another day keeps the copy the cycle already edited', () => {
    const edited = { [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG, restSec: 30, rounds: 5 } };
    const draft = addExercisesToDraft(
      { ...DEFAULT_MESO_BUILDER_DRAFT, daysPerWeek: 2, exerciseSettings: edited },
      2,
      [HEAVY_BAG.id],
      records,
    );

    expect(draft.exerciseSettings).toEqual(edited);
  });

  test('an id without a record still gets its row', () => {
    const draft = addExercisesToDraft(DEFAULT_MESO_BUILDER_DRAFT, 1, [HEAVY_BAG.id], {});

    expect(draft.exercisesByDay[1]).toHaveLength(1);
    expect(draft.exerciseSettings).toEqual({});
  });

  test('removing an exercise from its last day drops its settings; from one of two days keeps them', () => {
    let draft = addExercisesToDraft({ ...DEFAULT_MESO_BUILDER_DRAFT, daysPerWeek: 2 }, 1, [HEAVY_BAG.id], records);
    draft = addExercisesToDraft(draft, 2, [HEAVY_BAG.id, COOLDOWN.id], records);

    draft = removeExerciseFromDraft(draft, 1, 0);
    expect(Object.keys(draft.exerciseSettings ?? {}).sort()).toEqual([COOLDOWN.id, HEAVY_BAG.id].sort());

    draft = removeExerciseFromDraft(draft, 2, 0);
    expect(draft.exerciseSettings).toEqual({ [COOLDOWN.id]: COOLDOWN.config });
  });

  test('a record is remembered when ticked, survives a new search, and goes when unticked', () => {
    let remembered = rememberSelectedExercises({}, groupOf(HEAVY_BAG), [HEAVY_BAG.id]);
    // A new search lists something else; the bag is still selected.
    remembered = rememberSelectedExercises(remembered, groupOf(COOLDOWN), [HEAVY_BAG.id, COOLDOWN.id]);
    expect(remembered).toEqual({ [HEAVY_BAG.id]: HEAVY_BAG, [COOLDOWN.id]: COOLDOWN });

    remembered = rememberSelectedExercises(remembered, groupOf(COOLDOWN), [COOLDOWN.id]);
    expect(remembered).toEqual({ [COOLDOWN.id]: COOLDOWN });
  });
});
