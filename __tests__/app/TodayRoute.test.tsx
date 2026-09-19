import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TodayScreen from '@app/(tabs)/index';
import { MOCK_SESSION_IDS } from '@domain/workoutMocks';

// Mocked rather than driven through expo-router's renderRouter: that turns on jest's fake timers,
// which also fake the `queueMicrotask` every storage call resolves through (storage/async.ts), so
// the query would never settle. The href itself is covered by workoutRoutes.test.ts.
let mockParams: { sessionId?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  mockParams = {};
});

afterEach(() => {
  client.clear();
  client.unmount();
});

function renderToday() {
  render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <QueryClientProvider client={client}>
        <TodayScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

describe('Today tab', () => {
  test('is the workout screen on the current (stub) session, not a list of days', async () => {
    renderToday();

    expect(await screen.findByText('Week 2 Day 1')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Workout progress' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mesocycle overview' })).toBeTruthy();
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.queryByTestId('workout-completed-check')).toBeNull();
  });

  test('shows a picked day — a completed one read-only — in the same tab', async () => {
    mockParams = { sessionId: MOCK_SESSION_IDS.completed };
    renderToday();

    expect(await screen.findByText('Week 1 Day 1')).toBeTruthy();
    expect(screen.getByTestId('workout-completed-check')).toBeTruthy();
  });

  test('offers a way out when the picked session does not exist', async () => {
    mockParams = { sessionId: 'missing-session' };
    renderToday();

    expect(await screen.findByRole('button', { name: 'Open mesocycles' })).toBeTruthy();
  });
});
