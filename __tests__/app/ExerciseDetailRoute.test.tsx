import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ExerciseDetailRoute from '@app/exercise/[id]/index';
import { exerciseLibraryDeps } from '@state/exerciseLibraryStore';
import { createCustomExercise } from '@usecases/exerciseLibrary';

import { seedWorkoutFixture } from '../fixtures/workoutFixture';

// Mocked rather than driven through expo-router's renderRouter, for the reason TodayRoute.test.tsx
// gives: renderRouter turns on fake timers, which also fake the `queueMicrotask` every storage call
// resolves through, so the query would never settle. The href itself is covered by
// historyRoutes.test.ts.
let mockParams: Record<string, string | undefined> = {};
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

let client: QueryClient;

beforeEach(async () => {
  await seedWorkoutFixture();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  mockParams = {};
  mockBack.mockClear();
});

afterEach(() => {
  client.clear();
  client.unmount();
});

function renderRoute() {
  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <QueryClientProvider client={client}>
        <ExerciseDetailRoute />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

/** Presses the confirming button of the last Alert raised. */
function confirmAlert(spy: jest.SpyInstance, label: string) {
  const buttons = spy.mock.calls.at(-1)?.[2] as AlertButton[] | undefined;
  buttons?.find((button) => button.text === label)?.onPress?.();
}

describe('Exercise screen route', () => {
  test('opens on Overview with the exercise the id names', async () => {
    mockParams = { id: 'bench-press-barbell' };
    renderRoute();

    expect(await screen.findByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('Catalog')).toBeTruthy();
    expect(screen.getByText('Best set')).toBeTruthy();
  });

  test('shows the last completed session the fixture logged', async () => {
    mockParams = { id: 'bench-press-barbell' };
    renderRoute();

    expect(await screen.findByTestId('exercise-last-session')).toBeTruthy();
  });

  test('an exercise that was never performed shows the empty state instead of tiles', async () => {
    mockParams = { id: 'deadlift-barbell' };
    renderRoute();

    expect(await screen.findByText('No sets logged yet')).toBeTruthy();
    expect(screen.queryByText('Best set')).toBeNull();
  });

  test('the History tab loads on the first switch and lists the mesocycle', async () => {
    mockParams = { id: 'bench-press-barbell' };
    renderRoute();
    await screen.findByText('Bench Press');

    fireEvent.press(screen.getByText('History'));

    expect(await screen.findByText('Upper/Lower')).toBeTruthy();
    expect(screen.getByText('Week 1 · Day 1')).toBeTruthy();
  });

  test("a catalog exercise's menu offers only Hide", async () => {
    mockParams = { id: 'bench-press-barbell' };
    renderRoute();
    await screen.findByText('Bench Press');

    fireEvent.press(screen.getByRole('button', { name: 'Exercise menu' }));

    expect(await screen.findByRole('button', { name: 'Hide' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  });

  test('a custom exercise can be edited, and hiding it pops the screen', async () => {
    const custom = await createCustomExercise(
      { name: 'Route Test Cable Fly', muscleGroup: 'chest' },
      exerciseLibraryDeps(),
    );
    mockParams = { id: custom.id };
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    renderRoute();
    await screen.findByText('Route Test Cable Fly');

    fireEvent.press(screen.getByRole('button', { name: 'Exercise menu' }));
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Hide' }));
    confirmAlert(alert, 'Hide');

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    await expect(exerciseLibraryDeps().exerciseRepo.getById(custom.id)).resolves.toMatchObject({
      isHidden: true,
    });

    alert.mockRestore();
  });

  test('says so when the id names no exercise', async () => {
    mockParams = { id: 'no-such-exercise' };
    renderRoute();

    expect(await screen.findByText('Exercise not found')).toBeTruthy();
  });
});
