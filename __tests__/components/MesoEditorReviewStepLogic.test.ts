import { toExerciseId, type Exercise } from '@domain/catalog';
import { formatReviewPlan, formatReviewSummary } from '@components/MesoEditorReviewStepLogic';
import { COOLDOWN, HEAVY_BAG, MEDBALL_THROW } from '../fixtures/hybridExercises';
import { STAMPS } from '../fixtures/stamps';

const BENCH_PRESS: Exercise = {
  ...STAMPS,
  id: toExerciseId('bench-press'),
  name: 'Bench Press',
  muscleGroup: 'chest',
  source: 'catalog',
  isHidden: false,
};

describe('formatReviewPlan', () => {
  const exercisesById = {
    [BENCH_PRESS.id]: BENCH_PRESS,
    [MEDBALL_THROW.id]: MEDBALL_THROW,
    [HEAVY_BAG.id]: HEAVY_BAG,
    [COOLDOWN.id]: COOLDOWN,
  };

  test('a strength exercise shows its sets', () => {
    expect(formatReviewPlan(exercisesById, { exerciseId: BENCH_PRESS.id, order: 0, sets: 1 })).toBe('1 set');
    expect(formatReviewPlan(exercisesById, { exerciseId: BENCH_PRESS.id, order: 0, sets: 3 })).toBe('3 sets');
  });

  test('a power and an interval exercise show their plan on one line', () => {
    expect(formatReviewPlan(exercisesById, { exerciseId: MEDBALL_THROW.id, order: 0, sets: 3 })).toBe(
      '3 sets · 1:15 rest',
    );
    expect(formatReviewPlan(exercisesById, { exerciseId: HEAVY_BAG.id, order: 1, sets: 2 })).toBe(
      '3 × 2:00 · 0:45 rest',
    );
  });

  test('a mobility exercise shows its length alone', () => {
    expect(formatReviewPlan(exercisesById, { exerciseId: COOLDOWN.id, order: 0, sets: 2 })).toBe('10:00');
  });

  test('an exercise not loaded yet falls back to its sets', () => {
    expect(formatReviewPlan(exercisesById, { exerciseId: 'missing', order: 0, sets: 2 })).toBe('2 sets');
  });
});

describe('formatReviewSummary', () => {
  test('combines length and days per week', () => {
    expect(formatReviewSummary(6, 4)).toBe('6 weeks · 4 days per week');
    expect(formatReviewSummary(3, 1)).toBe('3 weeks · 1 day per week');
  });
});
