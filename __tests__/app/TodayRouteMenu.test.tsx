import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TodayScreen from '@app/(tabs)/index';
import { mesocycleDetailHref } from '@components/historyRoutes';
import { STOP_MESOCYCLE_PHRASE } from '@components/StopMesocycleSheetLogic';
import {
  SKIP_WORKOUT_WARNING,
  type WorkoutMenuItem,
} from '@components/WorkoutHeaderMenuLogic';

import {
  seedFixtureDay,
  seedWorkoutFixture,
  WORKOUT_FIXTURE_IDS,
} from '../fixtures/workoutFixture';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
// Aliased with a `mock` prefix so the hoisted `jest.mock` factory below may refer to it.
import { tabNavigation as mockTabNavigation } from '../fixtures/tabNavigation';

// The header menu (096) on the Today tab, over the fixture sessions. Its own file, apart from
// TodayRoute.test.tsx: skipping and adding change the shared fixture sessions for good, and a
// separate file gets a fresh store. Mocked expo-router, for the reason TodayRoute.test.tsx gives.
//
// The menu is a native one since 117: its items are always mounted (iOS opens the plate itself,
// which nothing here can drive), so a test picks one straight off by its `action-menu-<key>`
// testID rather than opening a sheet first.
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
  // Called rather than passed: the factory runs while this file's imports are still being
  // evaluated, so the fixture has to be dereferenced at render time, not now. It writes this
  // route's params, which is how the screen pins the day it is on (see `TodayTabNavigation`).
  useNavigation: () =>
    mockTabNavigation((params) => {
      mockParams = { ...mockParams, ...params };
    }),
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

let alertSpy: jest.SpyInstance;

const repositories = withRepositories();
beforeEach(async () => {
  await seedWorkoutFixture(repositories());
  mockParams = {};
  mockNavigate.mockClear();
  mockPush.mockClear();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  alertSpy.mockRestore();
});

function renderToday() {
  return renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <TodayScreen />
    </SafeAreaProvider>,
  );
}

/** The header menu's item for an action of `workoutMenuItems`, or null when it isn't offered. */
function menuItem(item: WorkoutMenuItem) {
  return screen.queryByTestId(`action-menu-${item}`);
}

/** Picks one — a native menu button, so a native press rather than `fireEvent.press`. */
function pickMenuItem(item: WorkoutMenuItem) {
  const button = menuItem(item);
  if (button === null) {
    throw new Error(`The header menu has no "${item}"`);
  }
  fireEvent(button, 'buttonPress');
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
  screen.getByTestId(`exercise-card-${WORKOUT_FIXTURE_IDS.live}-${exerciseId}`);

describe('Today tab — header menu', () => {
  test('a read-only session keeps only the mesocycle actions', async () => {
    mockParams = { sessionId: WORKOUT_FIXTURE_IDS.completed };
    renderToday();
    await screen.findByText('Week 1 Day 1');

    expect(menuItem('renameMesocycle')).toBeTruthy();
    expect(menuItem('mesocycleHistory')).toBeTruthy();
    expect(menuItem('stopMesocycle')).toBeTruthy();
    expect(menuItem('addExercise')).toBeNull();
    expect(menuItem('skipWorkout')).toBeNull();
  });

  test("Mesocycle history opens the shown session's mesocycle", async () => {
    renderToday();
    await screen.findByText('Week 2 Day 1');

    pickMenuItem('mesocycleHistory');

    expect(mockPush).toHaveBeenCalledWith(mesocycleDetailHref(WORKOUT_FIXTURE_IDS.mesocycle));
  });

  test('Rename mesocycle explains it is not available yet', async () => {
    renderToday();
    await screen.findByText('Week 2 Day 1');

    pickMenuItem('renameMesocycle');

    expect(alertSpy).toHaveBeenCalledWith('Not available yet', expect.any(String));
  });

  test('DoD: Stop mesocycle waits for the phrase, then abandons the block (052)', async () => {
    renderToday();
    await screen.findByText('Week 2 Day 1');

    pickMenuItem('stopMesocycle');

    // The sheet's own button — it stays inert until the phrase has been typed into it.
    const confirm = await screen.findByRole('button', { name: 'Stop mesocycle' });
    expect(confirm.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(confirm);
    expect(
      (await repositories().mesocycleRepo.getById(WORKOUT_FIXTURE_IDS.mesocycle))?.status,
    ).toBe('active');

    fireEvent.changeText(
      screen.getByLabelText(`Type ${STOP_MESOCYCLE_PHRASE} to confirm`),
      STOP_MESOCYCLE_PHRASE,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Stop mesocycle' }));

    await waitFor(async () => {
      expect(await repositories().mesocycleRepo.getActive()).toBeNull();
    });
    const mesocycle = await repositories().mesocycleRepo.getById(WORKOUT_FIXTURE_IDS.mesocycle);
    expect(mesocycle?.status).toBe('abandoned');
    // The live session had two sets logged, so it is completed rather than skipped, and they stay.
    const live = await repositories().workoutStore.repos.sessionRepo.getById(
      WORKOUT_FIXTURE_IDS.live,
    );
    expect(live?.status).toBe('completed');
    await expect(
      repositories().workoutStore.repos.setLogRepo.listBySessionId(WORKOUT_FIXTURE_IDS.live),
    ).resolves.toHaveLength(2);
    // With no active mesocycle left, the tab invites planning the next one.
    expect(await screen.findByText('Plan your training block')).toBeTruthy();
  });

  test('a day of a block that is no longer active has nothing to stop (052)', async () => {
    const mesocycle = await repositories().mesocycleRepo.getById(WORKOUT_FIXTURE_IDS.mesocycle);
    await repositories().mesocycleRepo.update({ ...mesocycle!, status: 'abandoned' });
    mockParams = { sessionId: WORKOUT_FIXTURE_IDS.completed };
    renderToday();
    await screen.findByText('Week 1 Day 1');

    expect(menuItem('stopMesocycle')).toBeNull();
    expect(menuItem('mesocycleHistory')).toBeTruthy();
  });

  test('Add exercise adds the picked exercises to the end of the session', async () => {
    renderToday();
    await screen.findByText('Week 2 Day 1');

    pickMenuItem('addExercise');
    expect(await screen.findByText('Squat')).toBeTruthy();
    fireEvent.press(screen.getByRole('checkbox', { name: 'Squat' }));
    fireEvent.press(screen.getByRole('button', { name: 'Add 1 exercise' }));

    await waitFor(async () => {
      const exercises = await repositories().workoutStore.repos.sessionExerciseRepo.listBySessionId(
        WORKOUT_FIXTURE_IDS.live,
      );
      expect(exercises.map((exercise) => exercise.exerciseId)).toEqual([
        'bench-press-barbell',
        'barbell-row-barbell',
        'squat-barbell',
      ]);
    });
    const exercises = await repositories().workoutStore.repos.sessionExerciseRepo.listBySessionId(
      WORKOUT_FIXTURE_IDS.live,
    );
    const added = exercises.at(-1);
    expect(await screen.findByTestId(`exercise-card-${added?.id}`)).toBeTruthy();
    expect(added?.setTargets).toHaveLength(2);
  });

  test('DoD: Skip workout with sets logged warns, skips what is unfinished, and completes the session', async () => {
    renderToday();
    await screen.findByText('Week 2 Day 1');
    // Bench done (its last set logged here); the row left untouched.
    fireEvent.press(
      within(liveCard('bench-press-barbell')).getByRole('checkbox', { name: 'Log set 3' }),
    );
    await within(liveCard('bench-press-barbell')).findByRole('checkbox', {
      name: 'Set 3 logged',
    });

    pickMenuItem('skipWorkout');
    expect(alertSpy).toHaveBeenCalledWith('Skip workout?', SKIP_WORKOUT_WARNING, expect.any(Array));
    pressAlertButton('Skip');

    // Logged sets make it a completed session — still this one, now read-only.
    expect(await screen.findByTestId('workout-completed-check')).toBeTruthy();
    expect(screen.getByText('Week 2 Day 1')).toBeTruthy();
    const exercises = await repositories().workoutStore.repos.sessionExerciseRepo.listBySessionId(
      WORKOUT_FIXTURE_IDS.live,
    );
    expect(exercises.map((exercise) => [exercise.exerciseId, exercise.status])).toEqual([
      ['bench-press-barbell', 'completed'],
      ['barbell-row-barbell', 'skipped'],
    ]);
    await expect(
      repositories().workoutStore.repos.setLogRepo.listBySessionId(WORKOUT_FIXTURE_IDS.live),
    ).resolves.toHaveLength(3);
  });

  test('Skip workout, once confirmed, skips the session and leaves it read-only', async () => {
    await seedFixtureDay(repositories(), { id: 'ready-w1d2', weekNumber: 1, dayNumber: 2 });
    mockParams = { sessionId: 'ready-w1d2' };
    renderToday();
    await screen.findByText('Week 1 Day 2');

    pickMenuItem('skipWorkout');
    pressAlertButton('Skip');

    // Still this session, now read-only: its one exercise skipped with nothing logged — the
    // `Skipped` note in place of the rows, no Log boxes.
    expect(await screen.findByText('Skipped')).toBeTruthy();
    expect(screen.getByText('Week 1 Day 2')).toBeTruthy();
    expect(screen.queryByRole('checkbox', { name: 'Log set 1' })).toBeNull();
    const session = await repositories().workoutStore.repos.sessionRepo.getById('ready-w1d2');
    expect(session?.status).toBe('skipped');
    // Next week's Day 2 is generated, as after Finish.
    const week2 = await repositories().workoutStore.repos.sessionRepo.listByMesoIdAndWeekNumber(
      WORKOUT_FIXTURE_IDS.mesocycle,
      2,
    );
    expect(week2.map((next) => next.dayNumber).sort()).toEqual([1, 2]);
  });

  test('no Skip workout once every exercise is done — Finish takes its place', async () => {
    await seedFixtureDay(repositories(), { id: 'ready-w1d3', weekNumber: 1, dayNumber: 3 });
    // Logging a set anywhere needs no other session in progress (045) — the fixture's Week 2
    // Day 1 is, so it is closed first.
    const { repos } = repositories().workoutStore;
    await repos.sessionRepo.update({
      ...(await repos.sessionRepo.getById(WORKOUT_FIXTURE_IDS.live))!,
      status: 'completed',
    });
    mockParams = { sessionId: 'ready-w1d3' };
    renderToday();
    await screen.findByText('Week 1 Day 3');

    fireEvent.press(screen.getByRole('checkbox', { name: 'Log set 1' }));
    expect(await screen.findByRole('button', { name: 'Finish workout' })).toBeTruthy();

    expect(menuItem('skipWorkout')).toBeNull();
    expect(menuItem('addExercise')).toBeTruthy();
  });
});

// Finishing a block leaves the screen on the workout it was on, and `Copy current meso` takes
// `Finish mesocycle`'s place there (Artem, 24.09.2026). The screen used to be sent away to an
// empty state, which is a poor place to decide what comes next from — and no place at all for the
// block-level actions meant to join that button.
describe('Today tab — Finish mesocycle, then plan the next one', () => {
  /** Every session of the fixture block final, so the shown one offers to close the block. */
  async function finishEveryWorkout() {
    const { repos } = repositories().workoutStore;
    for (const id of [WORKOUT_FIXTURE_IDS.completed, WORKOUT_FIXTURE_IDS.live]) {
      const session = await repos.sessionRepo.getById(id);
      await repos.sessionRepo.update({ ...session!, status: 'completed' });
    }
  }

  test('the screen stays on the workout, and the button becomes Copy current meso', async () => {
    await finishEveryWorkout();
    mockParams = { sessionId: WORKOUT_FIXTURE_IDS.live };
    renderToday();
    await screen.findByText('Week 2 Day 1');

    fireEvent.press(await screen.findByRole('button', { name: 'Finish mesocycle' }));
    pressAlertButton('Finish');

    expect(await screen.findByRole('button', { name: 'Copy current meso' })).toBeTruthy();
    // Still the same workout — nothing navigated, and the pin was not released.
    expect(screen.getByText('Week 2 Day 1')).toBeTruthy();
    expect(mockParams.sessionId).toBe(WORKOUT_FIXTURE_IDS.live);
  });

  test('Copy current meso opens Flow C on the block that just ended', async () => {
    await finishEveryWorkout();
    mockParams = { sessionId: WORKOUT_FIXTURE_IDS.live };
    renderToday();
    await screen.findByText('Week 2 Day 1');
    fireEvent.press(await screen.findByRole('button', { name: 'Finish mesocycle' }));
    pressAlertButton('Finish');

    fireEvent.press(await screen.findByRole('button', { name: 'Copy current meso' }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/meso-editor/copy',
      params: { sourceMesoId: WORKOUT_FIXTURE_IDS.mesocycle },
    });
  });
});
