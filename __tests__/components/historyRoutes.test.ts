import { exerciseHistoryHref, mesocycleDetailHref } from '@components/historyRoutes';

describe('historyRoutes', () => {
  test('exerciseHistoryHref points at exercise/[id]/history with the exercise id', () => {
    expect(exerciseHistoryHref('exercise-bench-press')).toEqual({
      pathname: '/exercise/[id]/history',
      params: { id: 'exercise-bench-press' },
    });
  });

  test('mesocycleDetailHref points at meso/[id] with the mesocycle id', () => {
    expect(mesocycleDetailHref('meso-upper-lower')).toEqual({
      pathname: '/meso/[id]',
      params: { id: 'meso-upper-lower' },
    });
  });
});
