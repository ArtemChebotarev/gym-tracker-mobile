import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import WorkoutRoute from '@app/workout/[sessionId]';
import { toExerciseId } from '@domain/catalog';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { appStore } from '@state/appStore';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemoryMesocycleRepository } from '@storage/mesocycle';
import { createInMemoryWorkoutStore } from '@storage/workoutStore';

// Mocked rather than driven through expo-router's renderRouter: that turns on jest's fake timers,
// which also fake the `queueMicrotask` every storage call resolves through (storage/async.ts), so
// the query would never settle. The href itself is covered by workoutRoutes.test.ts.
const mockBack = jest.fn();
let mockSessionId = '';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ sessionId: mockSessionId }),
}));

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

beforeAll(async () => {
  await new InMemoryMesocycleRepository(appStore).create({
    id: 'route-meso',
    name: 'Route meso',
    lengthWeeks: 4,
    daysPerWeek: 1,
    startDate: '2026-09-01T08:00:00.000Z',
    status: 'active',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    createdAt: '2026-09-01T08:00:00.000Z',
  });
  await new InMemoryExerciseRepository(appStore).createCustom({
    id: toExerciseId('route-exercise'),
    name: 'Route press',
    muscleGroup: 'chest',
    source: 'custom',
    isHidden: false,
  });
  const { repos } = createInMemoryWorkoutStore(appStore);
  await repos.sessionRepo.create({
    id: 'route-session',
    mesoId: 'route-meso',
    weekNumber: 2,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'planned',
  });
  await repos.sessionExerciseRepo.create({
    id: 'route-session-exercise',
    sessionId: 'route-session',
    exerciseId: 'route-exercise',
    order: 1,
    setTargets: [{ setNumber: 1 }],
    targetRir: 3,
    status: 'planned',
  });
});

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  mockBack.mockClear();
});

afterEach(() => {
  client.clear();
  client.unmount();
});

function renderRoute(sessionId: string) {
  mockSessionId = sessionId;
  render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <QueryClientProvider client={client}>
        <WorkoutRoute />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

describe('workout route', () => {
  test('shows the session addressed by sessionId', async () => {
    renderRoute('route-session');

    expect(await screen.findByText('Week 2 Day 1')).toBeTruthy();
    expect(screen.getByText('Route meso')).toBeTruthy();
    expect(screen.getByText('Route press')).toBeTruthy();
  });

  test('offers a way back from a session that does not exist', async () => {
    renderRoute('missing-session');

    fireEvent.press(await screen.findByRole('button', { name: 'Go back' }));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
