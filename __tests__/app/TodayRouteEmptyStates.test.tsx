import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TodayScreen from '@app/(tabs)/index';
import { FINISH_MESOCYCLE_CONFIRMATION } from '@components/TodayScreenLogic';
import type { TodayWorkout } from '@usecases/todayWorkout';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
import { seedWorkoutFixture, WORKOUT_FIXTURE_IDS } from '../fixtures/workoutFixture';

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

let alertSpy: jest.SpyInstance;

const repositories = withRepositories();
beforeEach(() => {
  mockNavigate.mockClear();
  mockPush.mockClear();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  alertSpy.mockRestore();
});

/** Presses the named button of the most recent Alert.alert call. */
function pressAlertButton(text: string) {
  const buttons = alertSpy.mock.calls.at(-1)?.[2] as AlertButton[] | undefined;
  const button = buttons?.find((candidate) => candidate.text === text);
  if (!button) {
    throw new Error(`No "${text}" button in the last alert`);
  }
  act(() => button.onPress?.());
}

function renderToday() {
  renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <TodayScreen />
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

  test('DoD: once the active mesocycle has nothing left, it is finished from here (052)', async () => {
    await seedWorkoutFixture(repositories());
    mockToday = { kind: 'allDone', mesoId: WORKOUT_FIXTURE_IDS.mesocycle };
    // Nothing is left to train, which is what `allDone` means — the fixture's two sessions final.
    const { repos } = repositories().workoutStore;
    for (const id of [WORKOUT_FIXTURE_IDS.completed, WORKOUT_FIXTURE_IDS.live]) {
      const session = await repos.sessionRepo.getById(id);
      await repos.sessionRepo.update({ ...session!, status: 'completed' });
    }
    renderToday();

    expect(await screen.findByText('Block complete')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Finish mesocycle' }));

    expect(alertSpy).toHaveBeenCalledWith(
      'Finish mesocycle?',
      FINISH_MESOCYCLE_CONFIRMATION,
      expect.any(Array),
    );
    pressAlertButton('Finish');

    await waitFor(async () => {
      expect(
        (await repositories().mesocycleRepo.getById(WORKOUT_FIXTURE_IDS.mesocycle))?.status,
      ).toBe('completed');
    });
    expect(await repositories().mesocycleRepo.getActive()).toBeNull();
  });
});
