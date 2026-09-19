import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TodayScreen from '@app/(tabs)/index';
import { mesocycleDetailHref } from '@components/historyRoutes';
import { MOCK_MESOCYCLE_IDS } from '@domain/mesocycleMocks';
import { MOCK_SESSION_IDS } from '@domain/workoutMocks';
import { SKIP_WORKOUT_WARNING } from '@components/WorkoutMenuSheetLogic';
import { ensureWorkoutMocksSeeded, workoutStore } from '@state/workoutStore';

// The header menu (096) on the Today tab, over the stub sessions. Its own file, apart from
// TodayRoute.test.tsx: skipping and adding change the shared stub sessions for good, and a
// separate file gets a fresh store. Mocked expo-router, for the reason TodayRoute.test.tsx gives.
let mockParams: Record<string, string | undefined> = {};
const mockNavigate = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: mockNavigate,
    push: mockPush,
    setParams: (params: { sessionId?: string }) => {
      mockParams = { ...mockParams, ...params };
    },
  }),
  useLocalSearchParams: () => mockParams,
}));

// expo-crypto's native module isn't available under Jest; added exercises and generated sessions
// each need an id of their own.
jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

let client: QueryClient;
let alertSpy: jest.SpyInstance;

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  mockParams = {};
  mockNavigate.mockClear();
  mockPush.mockClear();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  alertSpy.mockRestore();
  client.clear();
  client.unmount();
});

function renderToday() {
  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <QueryClientProvider client={client}>
        <TodayScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

function openMenu() {
  fireEvent.press(screen.getByRole('button', { name: 'Workout menu' }));
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

const liveCard = (exerciseId: string) =>
  screen.getByTestId(`exercise-card-${MOCK_SESSION_IDS.live}-${exerciseId}`);

describe('Today tab — header menu', () => {
  test('a read-only session keeps only the mesocycle actions', async () => {
    mockParams = { sessionId: MOCK_SESSION_IDS.completed };
    renderToday();
    await screen.findByText('Week 1 Day 1');

    openMenu();

    expect(screen.getByRole('button', { name: 'Rename mesocycle' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mesocycle history' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Stop mesocycle' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add exercise' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Skip workout' })).toBeNull();
  });

  test("Mesocycle history opens the shown session's mesocycle", async () => {
    renderToday();
    await screen.findByText('Week 2 Day 1');

    openMenu();
    fireEvent.press(screen.getByRole('button', { name: 'Mesocycle history' }));

    expect(mockPush).toHaveBeenCalledWith(mesocycleDetailHref(MOCK_MESOCYCLE_IDS.active));
  });

  test.each(['Rename mesocycle', 'Stop mesocycle'])(
    '%s explains it is not available yet',
    async (label) => {
      renderToday();
      await screen.findByText('Week 2 Day 1');

      openMenu();
      fireEvent.press(screen.getByRole('button', { name: label }));

      expect(alertSpy).toHaveBeenCalledWith('Not available yet', expect.any(String));
    },
  );

  test('Add exercise adds the picked exercises to the end of the session', async () => {
    renderToday();
    await screen.findByText('Week 2 Day 1');

    openMenu();
    fireEvent.press(screen.getByRole('button', { name: 'Add exercise' }));
    expect(await screen.findByText('Squat')).toBeTruthy();
    fireEvent.press(screen.getByRole('checkbox', { name: 'Squat' }));
    fireEvent.press(screen.getByRole('button', { name: 'Add 1 exercise' }));

    await waitFor(async () => {
      const exercises = await workoutStore.repos.sessionExerciseRepo.listBySessionId(
        MOCK_SESSION_IDS.live,
      );
      expect(exercises.map((exercise) => exercise.exerciseId)).toEqual([
        'bench-press-barbell',
        'barbell-row-barbell',
        'squat-barbell',
      ]);
    });
    const exercises = await workoutStore.repos.sessionExerciseRepo.listBySessionId(
      MOCK_SESSION_IDS.live,
    );
    const added = exercises.at(-1);
    expect(await screen.findByTestId(`exercise-card-${added?.id}`)).toBeTruthy();
    expect(added?.setTargets).toHaveLength(2);
  });

  test('DoD: Skip workout with sets logged warns, skips what is unfinished, and completes the session', async () => {
    renderToday();
    await screen.findByText('Week 2 Day 1');
    // Bench done (its last set logged here); the row and the squat added above untouched.
    fireEvent.press(
      within(liveCard('bench-press-barbell')).getByRole('checkbox', { name: 'Log set 3' }),
    );
    await within(liveCard('bench-press-barbell')).findByRole('checkbox', {
      name: 'Set 3 logged',
    });

    openMenu();
    fireEvent.press(screen.getByRole('button', { name: 'Skip workout' }));
    expect(alertSpy).toHaveBeenCalledWith('Skip workout?', SKIP_WORKOUT_WARNING, expect.any(Array));
    pressAlertButton('Skip');

    // Logged sets make it a completed session — still this one, now read-only.
    expect(
      await screen.findByTestId('workout-completed-check', {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByText('Week 2 Day 1')).toBeTruthy();
    const exercises = await workoutStore.repos.sessionExerciseRepo.listBySessionId(
      MOCK_SESSION_IDS.live,
    );
    expect(exercises.map((exercise) => [exercise.exerciseId, exercise.status])).toEqual([
      ['bench-press-barbell', 'completed'],
      ['barbell-row-barbell', 'skipped'],
      ['squat-barbell', 'skipped'],
    ]);
    await expect(
      workoutStore.repos.setLogRepo.listBySessionId(MOCK_SESSION_IDS.live),
    ).resolves.toHaveLength(3);
  });

  test('Skip workout, once confirmed, skips the session and leaves it read-only', async () => {
    await ensureWorkoutMocksSeeded();
    await workoutStore.repos.sessionRepo.createMany([
      {
        id: 'ready-w1d2',
        mesoId: MOCK_MESOCYCLE_IDS.active,
        weekNumber: 1,
        dayNumber: 2,
        isDeload: false,
        prescriptionStatus: 'ready',
        status: 'planned',
      },
    ]);
    await workoutStore.repos.sessionExerciseRepo.createMany([
      {
        id: 'ready-w1d2-bench',
        sessionId: 'ready-w1d2',
        exerciseId: 'bench-press-barbell',
        order: 1,
        setTargets: [{ setNumber: 1, targetReps: 10, suggestedWeight: 60 }],
        targetRir: 3,
        status: 'planned',
      },
    ]);
    mockParams = { sessionId: 'ready-w1d2' };
    renderToday();
    await screen.findByText('Week 1 Day 2');

    openMenu();
    fireEvent.press(screen.getByRole('button', { name: 'Skip workout' }));
    pressAlertButton('Skip');

    // Skipping also generates next week's day in the same transaction, which can take over
    // waitFor's default second when the whole suite runs in parallel.
    await waitFor(
      async () =>
        expect((await workoutStore.repos.sessionRepo.getById('ready-w1d2'))?.status).toBe(
          'skipped',
        ),
      { timeout: 5000 },
    );
    // Still this session, now read-only: no Log boxes.
    await waitFor(() => expect(screen.queryByRole('checkbox', { name: 'Log set 1' })).toBeNull());
    expect(screen.getByText('Week 1 Day 2')).toBeTruthy();
    // Next week's Day 2 is generated, as after Finish.
    const week2 = await workoutStore.repos.sessionRepo.listByMesoIdAndWeekNumber(
      MOCK_MESOCYCLE_IDS.active,
      2,
    );
    expect(week2.map((next) => next.dayNumber).sort()).toEqual([1, 2]);
  });

  test('no Skip workout once every exercise is done — Finish takes its place', async () => {
    await workoutStore.repos.sessionRepo.createMany([
      {
        id: 'ready-w1d3',
        mesoId: MOCK_MESOCYCLE_IDS.active,
        weekNumber: 1,
        dayNumber: 3,
        isDeload: false,
        prescriptionStatus: 'ready',
        status: 'planned',
      },
    ]);
    await workoutStore.repos.sessionExerciseRepo.createMany([
      {
        id: 'ready-w1d3-bench',
        sessionId: 'ready-w1d3',
        exerciseId: 'bench-press-barbell',
        order: 1,
        setTargets: [{ setNumber: 1, targetReps: 10, suggestedWeight: 60 }],
        targetRir: 3,
        status: 'planned',
      },
    ]);
    mockParams = { sessionId: 'ready-w1d3' };
    renderToday();
    await screen.findByText('Week 1 Day 3');

    fireEvent.press(screen.getByRole('checkbox', { name: 'Log set 1' }));
    expect(await screen.findByRole('button', { name: 'Finish workout' })).toBeTruthy();

    openMenu();
    expect(screen.queryByRole('button', { name: 'Skip workout' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Add exercise' })).toBeTruthy();
  });
});
