import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TodayScreen from '@app/(tabs)/index';
import type { TodayWorkout } from '@usecases/todayWorkout';

// The pick itself (every branch) is covered by __tests__/usecases/todayWorkout.test.ts; this only
// checks how the tab renders the two outcomes that have no session, with the pick mocked so each
// one is reached directly rather than set up in the app-wide store.
let mockToday: TodayWorkout = { kind: 'noActiveMesocycle' };

jest.mock('@usecases/todayWorkout', () => ({
  getTodayWorkout: () => Promise.resolve(mockToday),
}));

const mockNavigate = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, push: mockPush }),
  useLocalSearchParams: () => ({}),
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
  mockNavigate.mockClear();
  mockPush.mockClear();
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

describe('Today tab — no session to show', () => {
  test('without an active mesocycle, invites creating one', async () => {
    mockToday = { kind: 'noActiveMesocycle' };
    renderToday();

    fireEvent.press(await screen.findByRole('button', { name: 'Create mesocycle' }));

    expect(mockPush).toHaveBeenCalledWith('/meso-editor/new');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  test('once the active mesocycle has nothing left, leads to the mesocycles', async () => {
    mockToday = { kind: 'allDone', mesoId: 'active' };
    renderToday();

    expect(await screen.findByText('Block complete')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Open mesocycles' }));

    expect(mockNavigate).toHaveBeenCalledWith('/mesocycles');
  });
});
