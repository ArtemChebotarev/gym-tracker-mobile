import {
  exerciseDetailHref,
  exerciseHistoryHref,
  mesocycleDetailHref,
} from '@components/historyRoutes';

describe('historyRoutes', () => {
  test('exerciseDetailHref points at exercise/[id] with the exercise id', () => {
    expect(exerciseDetailHref('exercise-bench-press')).toEqual({
      pathname: '/exercise/[id]',
      params: { id: 'exercise-bench-press' },
    });
  });

  test('exerciseHistoryHref points at the same screen, on its History tab', () => {
    expect(exerciseHistoryHref('exercise-bench-press')).toEqual({
      pathname: '/exercise/[id]',
      params: { id: 'exercise-bench-press', tab: 'history' },
    });
  });

  test('mesocycleDetailHref points at meso/[id] with the mesocycle id', () => {
    expect(mesocycleDetailHref('meso-upper-lower')).toEqual({
      pathname: '/meso/[id]',
      params: { id: 'meso-upper-lower' },
    });
  });
});
