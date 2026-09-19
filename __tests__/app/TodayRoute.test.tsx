import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TodayScreen from '@app/(tabs)/index';
import { MOCK_MESOCYCLE_IDS } from '@domain/mesocycleMocks';
import { MOCK_SESSION_IDS } from '@domain/workoutMocks';
import { workoutHref } from '@components/workoutRoutes';
import { ensureWorkoutMocksSeeded, workoutStore } from '@state/workoutStore';

// Mocked rather than driven through expo-router's renderRouter: that turns on jest's fake timers,
// which also fake the `queueMicrotask` every storage call resolves through (storage/async.ts), so
// the query would never settle. The href itself is covered by workoutRoutes.test.ts.
let mockParams: { sessionId?: string } = {};
const mockNavigate = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
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
  mockNavigate.mockClear();
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

describe('Today tab — set logging', () => {
  const benchCard = () => screen.getByTestId('exercise-card-mock-session-w2d1-bench-press-barbell');

  test('logs a set and un-logs it, the row coming back with the logged values', async () => {
    renderToday();
    await screen.findByText('Week 2 Day 1');

    fireEvent.changeText(within(benchCard()).getByLabelText('Set 3 reps'), '9');
    fireEvent.press(within(benchCard()).getByRole('checkbox', { name: 'Log set 3' }));

    const logged = await within(benchCard()).findByRole('checkbox', { name: 'Set 3 logged' });
    expect(within(benchCard()).getByText('−1')).toBeTruthy();

    fireEvent.press(logged);

    await within(benchCard()).findByRole('checkbox', { name: 'Log set 3' });
    expect(within(benchCard()).getByLabelText('Set 3 weight').props.value).toBe('62.5');
    expect(within(benchCard()).getByLabelText('Set 3 reps').props.value).toBe('9');
  });

  test('one tap logs a row left as recommended, with its target reps', async () => {
    renderToday();
    await screen.findByText('Week 2 Day 1');
    const rowCard = () => screen.getByTestId('exercise-card-mock-session-w2d1-barbell-row-barbell');

    fireEvent.press(within(rowCard()).getByRole('checkbox', { name: 'Log set 1' }));

    const logged = await within(rowCard()).findByRole('checkbox', { name: 'Set 1 logged' });
    expect(within(rowCard()).getByText('✓')).toBeTruthy();

    // Put the shared stub session back the way the other tests expect it.
    fireEvent.press(logged);
    await within(rowCard()).findByRole('checkbox', { name: 'Log set 1' });
  });

  test('DoD: another session in progress — nothing is logged, the alert names it and opens it', async () => {
    // A ready day of the same mesocycle, while the stub Week 2 Day 1 is in progress.
    await ensureWorkoutMocksSeeded();
    await workoutStore.repos.sessionRepo.createMany([
      {
        id: 'ready-w2d2',
        mesoId: MOCK_MESOCYCLE_IDS.active,
        weekNumber: 2,
        dayNumber: 2,
        isDeload: false,
        prescriptionStatus: 'ready',
        status: 'planned',
      },
    ]);
    await workoutStore.repos.sessionExerciseRepo.createMany([
      {
        id: 'ready-w2d2-bench',
        sessionId: 'ready-w2d2',
        exerciseId: 'bench-press-barbell',
        order: 1,
        setTargets: [{ setNumber: 1, targetReps: 10, suggestedWeight: 60 }],
        targetRir: 3,
        status: 'planned',
      },
    ]);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockParams = { sessionId: 'ready-w2d2' };
    renderToday();
    await screen.findByText('Week 2 Day 2');

    fireEvent.changeText(screen.getByLabelText('Set 1 reps'), '10');
    fireEvent.press(screen.getByRole('checkbox', { name: 'Log set 1' }));

    await waitFor(() => expect(alert).toHaveBeenCalled());
    const [title, , buttons] = alert.mock.calls[0] ?? [];
    expect(title).toBe('Finish Week 2 Day 1 first');
    expect(buttons?.map((button: AlertButton) => button.text)).toEqual(['Cancel', 'Open']);
    await expect(workoutStore.repos.setLogRepo.listBySessionId('ready-w2d2')).resolves.toEqual([]);
    expect(screen.getByRole('checkbox', { name: 'Log set 1' })).toBeTruthy();

    buttons?.find((button: AlertButton) => button.text === 'Open')?.onPress?.();
    expect(mockNavigate).toHaveBeenCalledWith(workoutHref(MOCK_SESSION_IDS.live));
    alert.mockRestore();
  });
});
