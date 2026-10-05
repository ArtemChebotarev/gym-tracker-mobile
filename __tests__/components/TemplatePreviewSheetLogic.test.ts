import { buildPreviewRows, templateDayNumbers } from '@components/TemplatePreviewSheetLogic';
import { toExerciseId, type Exercise, type MuscleGroup } from '@domain/catalog';
import type { MesoTemplate } from '@domain/plan';
import { STAMPS } from '../fixtures/stamps';

function exercise(
  id: string,
  name: string,
  muscleGroup: MuscleGroup,
  equipment?: Exercise['equipment'],
): Exercise {
  return {
    ...STAMPS,
    id: toExerciseId(id),
    name,
    muscleGroup,
    equipment,
    source: 'catalog',
    isHidden: false,
  };
}

const library = [
  exercise('bench', 'Bench Press', 'chest', 'barbell'),
  exercise('pulldown', 'Lat Pulldown', 'back', 'cable'),
  exercise('pushup', 'Push Up', 'chest'),
];

const template: Pick<MesoTemplate, 'weekPlan'> = {
  weekPlan: {
    days: [
      {
        dayNumber: 2,
        name: '',
        exercises: [{ exerciseId: 'pushup', order: 1, sets: 1 }],
      },
      {
        dayNumber: 1,
        name: '',
        exercises: [
          { exerciseId: 'pulldown', order: 2, sets: 3 },
          { exerciseId: 'bench', order: 1, sets: 4 },
        ],
      },
    ],
  },
};

describe('templateDayNumbers', () => {
  test('lists the days ascending', () => {
    expect(templateDayNumbers(template)).toEqual([1, 2]);
  });
});

describe('buildPreviewRows', () => {
  test("takes each row's group from the exercise's own muscleGroup, in the template's order", () => {
    expect(
      buildPreviewRows(template, 1, library).map(({ number, muscleGroup, exerciseName, sets }) => [
        number,
        muscleGroup,
        exerciseName,
        sets,
      ]),
    ).toEqual([
      [1, 'Chest', 'Bench Press · Barbell', '4 sets'],
      [2, 'Back', 'Lat Pulldown · Cable', '3 sets'],
    ]);
  });

  test('a group dot comes with the group', () => {
    expect(buildPreviewRows(template, 1, library)[0]!.dotColor).toEqual(expect.any(String));
  });

  test('an exercise without equipment is shown by name alone, and one set reads "1 set"', () => {
    expect(buildPreviewRows(template, 2, library)[0]).toEqual(
      expect.objectContaining({ exerciseName: 'Push Up', sets: '1 set' }),
    );
  });

  test('leaves out a slot whose exercise the library does not know, and numbers what is left', () => {
    const rows = buildPreviewRows(
      template,
      1,
      library.filter((entry) => entry.id !== 'bench'),
    );

    expect(rows.map(({ number, muscleGroup }) => [number, muscleGroup])).toEqual([[1, 'Back']]);
  });

  test('a day the template does not have has no rows', () => {
    expect(buildPreviewRows(template, 5, library)).toEqual([]);
  });
});
