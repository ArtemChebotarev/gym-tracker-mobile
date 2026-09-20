import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { View } from 'react-native';

import MesocycleDetailRoute from '@app/meso/[id]';
import { mesocycleDetailHref } from '@components/historyRoutes';

// The workout header menu's `Mesocycle history` navigates with exactly this href (08.7 ·
// Тренировка); the index route stands in for that screen. The exercise side of this pair is no
// longer a stub — see __tests__/app/ExerciseDetailRoute.test.tsx (task 065).
function renderApp() {
  return renderRouter({ index: () => <View />, 'meso/[id]': MesocycleDetailRoute }, {
    initialUrl: '/',
  });
}

describe('mesocycle history stub route', () => {
  test("mesocycleDetailHref opens the mesocycle detail stub with the mesocycle's id", () => {
    const app = renderApp();

    act(() => router.push(mesocycleDetailHref('meso-upper-lower')));

    expect(app.getPathname()).toBe('/meso/meso-upper-lower');
    expect(app.getSegments()).toEqual(['meso', '[id]']);
    expect(app.getSearchParams()).toEqual({ id: 'meso-upper-lower' });
    expect(screen.getByText('Mesocycle history')).toBeTruthy();
  });

  test('Go back on the stub returns to the screen that opened it', () => {
    const app = renderApp();
    act(() => router.push(mesocycleDetailHref('meso-upper-lower')));

    fireEvent.press(screen.getByRole('button', { name: 'Go back' }));

    expect(app.getPathname()).toBe('/');
  });
});
