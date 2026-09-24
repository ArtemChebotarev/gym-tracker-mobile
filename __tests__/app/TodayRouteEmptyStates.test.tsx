import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TodayScreen from '@app/(tabs)/index';
import { PLAN_MESOCYCLE_LABEL } from '@components/MesocyclesScreenLogic';
import { FINISH_MESOCYCLE_CONFIRMATION } from '@components/TodayScreenLogic';
import type { TodayWorkout } from '@usecases/todayWorkout';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
// Aliased with a `mock` prefix so the hoisted `jest.mock` factory below may refer to it.
import { tabNavigation as mockTabNavigation } from '../fixtures/tabNavigation';
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
const mockSetParams = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, push: mockPush, setParams: mockSetParams }),
  useLocalSearchParams: () => ({}),
  // Called rather than passed: the factory runs while this file's imports are still being
  // evaluated, so the fixture has to be dereferenced at render time, not now.
  useNavigation: () => mockTabNavigation(),
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
  mockSetParams.mockClear();
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

/** The fixture's block with every session final — which is what `allDone` means. */
async function seedFinishableBlock(): Promise<string> {
  await seedWorkoutFixture(repositories());
  const { repos } = repositories().workoutStore;
  for (const id of [WORKOUT_FIXTURE_IDS.completed, WORKOUT_FIXTURE_IDS.live]) {
    const session = await repos.sessionRepo.getById(id);
    await repos.sessionRepo.update({ ...session!, status: 'completed' });
  }
  return WORKOUT_FIXTURE_IDS.mesocycle;
}

function renderToday() {
  renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <TodayScreen />
    </SafeAreaProvider>,
  );
}

describe('Today tab — no session to show', () => {
  test('without an active mesocycle, invites planning one through the creation-method sheet', async () => {
    mockToday = { kind: 'noActiveMesocycle' };
    renderToday();

    // The same sheet the `+` on 08.3 raises, not Flow A directly: no block is running, but
    // finished ones may exist to copy, which is the usual way the next one starts.
    fireEvent.press(await screen.findByRole('button', { name: PLAN_MESOCYCLE_LABEL }));
    fireEvent.press(await screen.findByRole('button', { name: 'From scratch' }));

    expect(mockPush).toHaveBeenCalledWith('/meso-editor/new');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  test('the sheet’s second row leads to Flow C when there is a finished block to copy', async () => {
    await seedWorkoutFixture(repositories());
    const mesocycle = await repositories().mesocycleRepo.getById(WORKOUT_FIXTURE_IDS.mesocycle);
    await repositories().mesocycleRepo.update({
      ...mesocycle!,
      status: 'completed',
      completedAt: '2026-09-20T00:00:00.000Z',
    });
    mockToday = { kind: 'noActiveMesocycle' };
    renderToday();

    fireEvent.press(await screen.findByRole('button', { name: PLAN_MESOCYCLE_LABEL }));
    const copy = await screen.findByRole('button', { name: 'Copy a mesocycle' });
    await waitFor(() => expect(copy).not.toBeDisabled());
    fireEvent.press(copy);

    expect(mockPush).toHaveBeenCalledWith('/meso-editor/copy');
  });

  test('DoD: once the active mesocycle has nothing left, it is finished from here (052)', async () => {
    mockToday = { kind: 'allDone', mesoId: await seedFinishableBlock() };
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
