import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TodayScreen from '@app/(tabs)/index';
import { MOCK_SESSION_IDS } from '@domain/workoutMocks';
import { workoutStore } from '@state/workoutStore';

// The exercise menu (097) on the Today tab, over the stub session in progress: Bench Press (2 of 3
// sets logged), then Barbell Row (nothing logged). Its own file, apart from TodayRoute.test.tsx:
// the actions change the shared stub session for good, and a separate file gets a fresh store.
// Tests run in order on the same session. Mocked expo-router, for the reason TodayRoute.test.tsx
// gives.
let mockParams: Record<string, string | undefined> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn(),
    setParams: (params: { sessionId?: string }) => {
      mockParams = { ...mockParams, ...params };
    },
  }),
  useLocalSearchParams: () => mockParams,
}));

// expo-crypto's native module isn't available under Jest; every set log needs an id of its own.
jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

const BENCH = `${MOCK_SESSION_IDS.live}-bench-press-barbell`;
const ROW = `${MOCK_SESSION_IDS.live}-barbell-row-barbell`;

let client: QueryClient;
let alertSpy: jest.SpyInstance;

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  mockParams = {};
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  alertSpy.mockRestore();
  client.clear();
  client.unmount();
});

async function renderToday() {
  render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <QueryClientProvider client={client}>
        <TodayScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  await screen.findByText('Week 2 Day 1');
}

function openMenu(exerciseName: string) {
  fireEvent.press(screen.getByRole('button', { name: `${exerciseName} menu` }));
}

/** Presses the named button of the most recent Alert.alert call. */
function pressAlertButton(text: string) {
  const buttons = alertSpy.mock.calls.at(-1)?.[2] as AlertButton[] | undefined;
  const button = buttons?.find((candidate) => candidate.text === text);
  if (!button) {
    throw new Error(`No "${text}" button in the last alert`);
  }
  act(() => button.onPress?.());
}

async function sessionExercises() {
  const exercises = await workoutStore.repos.sessionExerciseRepo.listBySessionId(
    MOCK_SESSION_IDS.live,
  );
  return [...exercises].sort((a, b) => a.order - b.order);
}

describe('Today tab — exercise menu', () => {
  test("opens on the tapped exercise, with its sets and what's not available", async () => {
    await renderToday();

    openMenu('Bench Press');

    expect(screen.getByText('3 sets planned · 2 logged')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Move up' })).toBeDisabled();
    expect(screen.getByText('Already first')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Move down' })).toBeEnabled();
  });

  test('Add set adds a row, Remove last set takes it away', async () => {
    await renderToday();

    openMenu('Bench Press');
    fireEvent.press(screen.getByRole('button', { name: 'Add set' }));
    await waitFor(async () => expect((await sessionExercises())[0]?.setTargets).toHaveLength(4));
    expect(await screen.findByRole('checkbox', { name: 'Log set 4' })).toBeTruthy();

    openMenu('Bench Press');
    fireEvent.press(screen.getByRole('button', { name: 'Remove last set' }));
    await waitFor(async () => expect((await sessionExercises())[0]?.setTargets).toHaveLength(3));
  });

  test('Move down swaps the exercise with the next one', async () => {
    await renderToday();

    openMenu('Bench Press');
    fireEvent.press(screen.getByRole('button', { name: 'Move down' }));

    await waitFor(async () =>
      expect((await sessionExercises()).map((exercise) => exercise.id)).toEqual([ROW, BENCH]),
    );
  });

  test('Skip exercise, then Unskip exercise', async () => {
    await renderToday();

    openMenu('Barbell Row');
    fireEvent.press(screen.getByRole('button', { name: 'Skip exercise' }));
    await waitFor(async () =>
      expect((await sessionExercises()).find((e) => e.id === ROW)?.status).toBe('skipped'),
    );

    openMenu('Barbell Row');
    await screen.findByRole('button', { name: 'Unskip exercise' });
    fireEvent.press(screen.getByRole('button', { name: 'Unskip exercise' }));
    await waitFor(async () =>
      expect((await sessionExercises()).find((e) => e.id === ROW)?.status).toBe('planned'),
    );
  });

  test('Replace exercise with sets logged swaps it only after the danger confirmation', async () => {
    await renderToday();

    openMenu('Bench Press');
    fireEvent.press(screen.getByRole('button', { name: 'Replace exercise' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Squat' }));

    expect(alertSpy).toHaveBeenCalledWith(
      'Replace exercise?',
      'The 2 sets logged for Bench Press will be deleted.',
      expect.any(Array),
    );
    expect((await sessionExercises()).find((e) => e.id === BENCH)?.exerciseId).toBe(
      'bench-press-barbell',
    );

    pressAlertButton('Replace');

    await waitFor(async () =>
      expect((await sessionExercises()).find((e) => e.id === BENCH)?.exerciseId).toBe(
        'squat-barbell',
      ),
    );
    await expect(workoutStore.repos.setLogRepo.listBySessionExerciseId(BENCH)).resolves.toEqual([]);
  });

  test('Delete exercise removes it once confirmed', async () => {
    await renderToday();

    openMenu('Barbell Row');
    fireEvent.press(screen.getByRole('button', { name: 'Delete exercise' }));
    pressAlertButton('Delete');

    await waitFor(async () =>
      expect((await sessionExercises()).map((exercise) => exercise.id)).toEqual([BENCH]),
    );
    await waitFor(() => expect(screen.queryByText('Barbell Row')).toBeNull());
  });
});
