import type { MesoTemplate, WeekPlan, WeekPlanDay, WeekPlanExercise } from '@domain/plan';

const benchPress: WeekPlanExercise = { exerciseId: 'exercise-bench-press', order: 1, sets: 3 };

const row: WeekPlanExercise = { exerciseId: 'exercise-row', order: 2, sets: 3 };

const squatWithReps: WeekPlanExercise = {
  exerciseId: 'exercise-squat',
  order: 1,
  sets: 4,
  reps: 8,
};

const dayOne: WeekPlanDay = {
  dayNumber: 1,
  name: 'Push',
  exercises: [benchPress, row],
};

const dayTwo: WeekPlanDay = {
  dayNumber: 2,
  name: 'Legs',
  exercises: [squatWithReps],
};

const weekPlanFixture: WeekPlan = {
  days: [dayOne, dayTwo],
};

const templateFixture: MesoTemplate = {
  id: 'template-1',
  name: 'Push/Legs Starter',
  source: 'catalog',
  defaultLengthWeeks: 6,
  weekPlan: weekPlanFixture,
  isHidden: false,
  createdAt: '2026-08-26T08:00:00.000Z',
};

const customTemplateFixture: MesoTemplate = {
  id: 'template-custom-1',
  name: 'My Custom Meso',
  source: 'custom',
  defaultLengthWeeks: 4,
  weekPlan: weekPlanFixture,
  isHidden: false,
  createdAt: '2026-08-26T08:00:00.000Z',
};

describe('plan domain types', () => {
  test('a two-day, three-exercise week plan fixture typechecks', () => {
    expect(weekPlanFixture.days).toHaveLength(2);
    const exerciseCount = weekPlanFixture.days.reduce((sum, day) => sum + day.exercises.length, 0);
    expect(exerciseCount).toBe(3);
  });

  test('reps is optional and only set by Flow C', () => {
    expect(benchPress.reps).toBeUndefined();
    expect(row.reps).toBeUndefined();
    expect(squatWithReps.reps).toBe(8);
  });

  test('meso template fixtures carry their source and embed the week plan', () => {
    expect(templateFixture.source).toBe('catalog');
    expect(customTemplateFixture.source).toBe('custom');
    expect(templateFixture.weekPlan.days).toBe(weekPlanFixture.days);
    expect(templateFixture.isHidden).toBe(false);
  });
});
