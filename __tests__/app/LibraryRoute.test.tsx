// What the Library tab does when storage fails under it (task 141.2; 08.0.2 · Error handling):
// a failed read must not look like an empty library, and a failed save must say so and keep the
// form open with what was typed (see ExerciseCreateRoute.test.tsx). The happy paths live in ExerciseLibraryScreen.test.tsx.

import { fireEvent, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import LibraryRoute from '@app/(tabs)/library';

import { createCustomExercise } from '@usecases/exerciseLibrary';

import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

const repositories = withRepositories();

beforeEach(async () => {
  await createCustomExercise({ name: 'Seed Row', muscleGroup: 'back' }, repositories());
});

function renderRoute() {
  return renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <LibraryRoute />
    </SafeAreaProvider>,
  );
}

describe('Library route under storage failures', () => {
  test('a failed read says so and retries, instead of showing an empty library', async () => {
    const read = jest
      .spyOn(repositories().exerciseRepo, 'getAll')
      .mockRejectedValue(new Error('storage down'));
    renderRoute();

    expect(await screen.findByText("Couldn't load this screen")).toBeTruthy();

    read.mockRestore();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Seed Row')).toBeTruthy();
    expect(screen.queryByText("Couldn't load this screen")).toBeNull();
  });

  test('Add exercise opens the type sheet, and Next opens the New exercise page for the chosen type', async () => {
    renderRoute();
    await screen.findByText('Seed Row');

    fireEvent.press(screen.getByRole('button', { name: 'Add exercise' }));
    fireEvent.press(await screen.findByRole('radio', { name: 'Power' }));
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/exercise/new',
      params: { type: 'power', name: '' },
    });
  });
});
