import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { View } from 'react-native';

import ExerciseHistoryRoute from '@app/exercise/[id]/history';
import MesocycleDetailRoute from '@app/meso/[id]';
import { exerciseHistoryHref, mesocycleDetailHref } from '@components/historyRoutes';

// The workout screen's exercise card (history button) and header menu (`Mesocycle history`) will
// navigate with exactly these hrefs (08.7 · Тренировка); the index route stands in for that screen
// until it exists.
function renderApp() {
  return renderRouter(
    {
      index: () => <View />,
      'exercise/[id]/history': ExerciseHistoryRoute,
      'meso/[id]': MesocycleDetailRoute,
    },
    { initialUrl: '/' },
  );
}

describe('history stub routes', () => {
  test("exerciseHistoryHref opens the exercise history stub with the exercise's id", () => {
    const app = renderApp();

    act(() => router.push(exerciseHistoryHref('exercise-bench-press')));

    expect(app.getPathname()).toBe('/exercise/exercise-bench-press/history');
    expect(app.getSegments()).toEqual(['exercise', '[id]', 'history']);
    expect(app.getSearchParams()).toEqual({ id: 'exercise-bench-press' });
    expect(screen.getByText('Exercise history')).toBeTruthy();
  });

  test("mesocycleDetailHref opens the mesocycle detail stub with the mesocycle's id", () => {
    const app = renderApp();

    act(() => router.push(mesocycleDetailHref('meso-upper-lower')));

    expect(app.getPathname()).toBe('/meso/meso-upper-lower');
    expect(app.getSegments()).toEqual(['meso', '[id]']);
    expect(app.getSearchParams()).toEqual({ id: 'meso-upper-lower' });
    expect(screen.getByText('Mesocycle history')).toBeTruthy();
  });

  test('Go back on a stub returns to the screen that opened it', () => {
    const app = renderApp();
    act(() => router.push(exerciseHistoryHref('exercise-squat')));

    fireEvent.press(screen.getByRole('button', { name: 'Go back' }));

    expect(app.getPathname()).toBe('/');
  });
});
