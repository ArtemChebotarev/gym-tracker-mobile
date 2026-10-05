import type { Exercise, MuscleGroup } from '@domain/catalog';
import { toExerciseId } from '@domain/catalog';
import type { MesoTemplate } from '@domain/plan';
import { applyTemplate } from '@domain/templateConverters';
import { STAMPS } from '../fixtures/stamps';

function exercise(
  id: string,
  muscleGroup: MuscleGroup,
  overrides: Partial<Exercise> = {},
): Exercise {
  return {
    ...STAMPS,
    id: toExerciseId(id),
    name: id,
    muscleGroup,
    source: 'catalog',
    isHidden: false,
    ...overrides,
  };
}

const library: Exercise[] = [
  exercise('bench', 'chest'),
  exercise('incline-bench', 'chest'),
  exercise('row', 'back'),
  exercise('squat', 'quads'),
  exercise('curl', 'biceps'),
];

const template: MesoTemplate = {
  ...STAMPS,
  id: 'template-upper-lower',
  name: 'Upper/Lower',
  source: 'catalog',
  defaultLengthWeeks: 5,
  isHidden: false,
  weekPlan: {
    days: [
      {
        dayNumber: 1,
        name: 'Upper',
        exercises: [
          { exerciseId: 'bench', order: 1, sets: 4 },
          { exerciseId: 'row', order: 2, sets: 3 },
          { exerciseId: 'curl', order: 3, sets: 2 },
        ],
      },
      { dayNumber: 2, name: 'Lower', exercises: [{ exerciseId: 'squat', order: 1, sets: 5 }] },
    ],
  },
};

/** The day's `[exerciseId, order, sets]` rows — what the draft actually shows. */
function rows(weekPlan: MesoTemplate['weekPlan'], dayNumber: number) {
  return weekPlan.days
    .find((day) => day.dayNumber === dayNumber)!
    .exercises.map(({ exerciseId, order, sets }) => [exerciseId, order, sets]);
}

describe('applyTemplate', () => {
  test("copies the template's days, exercises, order and sets into the draft", () => {
    const draft = applyTemplate(template, library, []);

    expect(draft.daysPerWeek).toBe(2);
    expect(draft.weekPlan.days.map((day) => day.dayNumber)).toEqual([1, 2]);
    expect(rows(draft.weekPlan, 1)).toEqual([
      ['bench', 1, 4],
      ['row', 2, 3],
      ['curl', 3, 2],
    ]);
    expect(rows(draft.weekPlan, 2)).toEqual([['squat', 1, 5]]);
  });

  test('records the template it came from', () => {
    expect(applyTemplate(template, library, []).templateId).toBe('template-upper-lower');
  });

  test('does not carry day names over — days are Day 1…N', () => {
    const draft = applyTemplate(template, library, []);

    expect(draft.weekPlan.days.map((day) => day.name)).toEqual(['', '']);
  });

  test('numbers days 1..N in dayNumber order, whatever order the template lists them in', () => {
    const shuffled: MesoTemplate = {
      ...template,
      weekPlan: { days: [...template.weekPlan.days].reverse() },
    };

    const draft = applyTemplate(shuffled, library, []);

    expect(rows(draft.weekPlan, 1)[0]).toEqual(['bench', 1, 4]);
    expect(rows(draft.weekPlan, 2)).toEqual([['squat', 1, 5]]);
  });

  describe('deep copy', () => {
    test('editing the draft does not touch the template', () => {
      const before = structuredClone(template);
      const draft = applyTemplate(template, library, []);

      draft.weekPlan.days[0]!.exercises[0]!.sets = 9;
      draft.weekPlan.days[0]!.exercises.push({ exerciseId: 'squat', order: 4, sets: 1 });
      draft.weekPlan.days.pop();

      expect(template).toEqual(before);
    });

    test('changing the template afterwards does not touch the draft', () => {
      const source = structuredClone(template);
      const draft = applyTemplate(source, library, []);
      const before = structuredClone(draft);

      source.weekPlan.days[0]!.exercises[0]!.sets = 9;
      source.weekPlan.days[1]!.exercises.push({ exerciseId: 'bench', order: 2, sets: 1 });

      expect(draft).toEqual(before);
    });
  });

  describe('name', () => {
    test("is the template's when no mesocycle has it", () => {
      expect(applyTemplate(template, library, [{ name: 'Push/Pull' }]).name).toBe('Upper/Lower');
    });

    test('gets the first free suffix when a mesocycle already has it', () => {
      const mesocycles = [{ name: 'Upper/Lower' }, { name: 'Upper/Lower 2' }];

      expect(applyTemplate(template, library, mesocycles).name).toBe('Upper/Lower 3');
    });

    test('ignores archived mesocycles — they are out of sight', () => {
      const mesocycles = [{ name: 'Upper/Lower', archivedAt: '2026-09-30T09:00:00.000Z' }];

      expect(applyTemplate(template, library, mesocycles).name).toBe('Upper/Lower');
    });
  });

  describe('hidden suggestions', () => {
    test('a hidden suggestion is replaced by the first visible catalog exercise of its group', () => {
      const withHiddenBench = [
        exercise('bench', 'chest', { isHidden: true }),
        exercise('cable-fly', 'chest', { isHidden: true }),
        exercise('my-press', 'chest', { source: 'custom' }),
        exercise('incline-bench', 'chest'),
        exercise('dumbbell-bench', 'chest'),
        ...library.filter((entry) => entry.muscleGroup !== 'chest'),
      ];

      const draft = applyTemplate(template, withHiddenBench, []);

      // Skips the other hidden one and the custom one, keeps the slot's order and sets.
      expect(rows(draft.weekPlan, 1)[0]).toEqual(['incline-bench', 1, 4]);
    });

    test("the row is dropped when its group has no visible catalog exercise, and the day's order closes up", () => {
      const withHiddenRow = library.map((entry) =>
        entry.id === 'row' ? { ...entry, isHidden: true } : entry,
      );

      const draft = applyTemplate(template, withHiddenRow, []);

      expect(rows(draft.weekPlan, 1)).toEqual([
        ['bench', 1, 4],
        ['curl', 2, 2],
      ]);
    });

    test('a day emptied by dropped rows stays in the plan, empty', () => {
      const withHiddenSquat = library.map((entry) =>
        entry.id === 'squat' ? { ...entry, isHidden: true } : entry,
      );

      const draft = applyTemplate(template, withHiddenSquat, []);

      expect(draft.daysPerWeek).toBe(2);
      expect(rows(draft.weekPlan, 2)).toEqual([]);
    });

    test('an exercise the library does not know is dropped rather than left dangling', () => {
      const withoutCurl = library.filter((entry) => entry.id !== 'curl');

      const draft = applyTemplate(template, withoutCurl, []);

      expect(rows(draft.weekPlan, 1)).toEqual([
        ['bench', 1, 4],
        ['row', 2, 3],
      ]);
    });
  });
});
