import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TodayScreen from '@app/(tabs)/index';
import type { ExerciseMenuItem } from '@components/WorkoutExerciseMenuLogic';

import { seedWorkoutFixture, WORKOUT_FIXTURE_IDS } from '../fixtures/workoutFixture';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
// Aliased with a `mock` prefix so the hoisted `jest.mock` factory below may refer to it.
import { tabNavigation as mockTabNavigation } from '../fixtures/tabNavigation';

// The exercise menu (097) on the Today tab, over the fixture session in progress: Bench Press (2 of
// 3 sets logged), then Barbell Row (nothing logged). Its own file, apart from TodayRoute.test.tsx:
// the actions change the shared fixture session for good, and a separate file gets a fresh store.
// Tests run in order on the same session. Mocked expo-router, for the reason TodayRoute.test.tsx
// gives.
//
// The menu is a native one since 117: a card's items are always mounted (iOS opens the plate
// itself, which nothing here can drive), so a test picks one straight off by the card's own
// `exercise-menu-<session exercise id>-<item>` testID rather than opening a sheet first.
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
  // Called rather than passed: the factory runs while this file's imports are still being
  // evaluated, so the fixture has to be dereferenced at render time, not now. It writes this
  // route's params, which is how the screen pins the day it is on (see `TodayTabNavigation`).
  useNavigation: () =>
    mockTabNavigation((params) => {
      mockParams = { ...mockParams, ...params };
    }),
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

const BENCH = `${WORKOUT_FIXTURE_IDS.live}-bench-press-barbell`;
const ROW = `${WORKOUT_FIXTURE_IDS.live}-barbell-row-barbell`;

let alertSpy: jest.SpyInstance;

const repositories = withRepositories();
beforeEach(async () => {
  await seedWorkoutFixture(repositories());
  mockParams = {};
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  alertSpy.mockRestore();
});

async function renderToday() {
  renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <TodayScreen />
    </SafeAreaProvider>,
  );
  await screen.findByText('Week 2 Day 1');
}

/** A card's menu item, or null when the card doesn't offer it. */
function menuItem(sessionExerciseId: string, item: ExerciseMenuItem) {
  return screen.queryByTestId(`exercise-menu-${sessionExerciseId}-${item}`);
}

/** Picks one — a native menu button, so a native press rather than `fireEvent.press`. */
function pickMenuItem(sessionExerciseId: string, item: ExerciseMenuItem) {
  const button = menuItem(sessionExerciseId, item);
  if (button === null) {
    throw new Error(`No "${item}" in the menu of ${sessionExerciseId}`);
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

async function sessionExercises() {
  const exercises = await repositories().workoutStore.repos.sessionExerciseRepo.listBySessionId(
    WORKOUT_FIXTURE_IDS.live,
  );
  return [...exercises].sort((a, b) => a.order - b.order);
}

describe('Today tab — exercise menu', () => {
  test("lists the card's own actions, with what isn't available left disabled", async () => {
    await renderToday();

    // Bench Press is first, so Move up stays listed but can't be picked — greyed, with no reason
    // crammed into the row.
    expect(menuItem(BENCH, 'moveUp')?.props.label).toBe('Move up');
    expect(menuItem(BENCH, 'moveUp')?.props.modifiers).toEqual([
      expect.objectContaining({ $type: 'disabled' }),
    ]);
    expect(menuItem(BENCH, 'moveDown')?.props.label).toBe('Move down');
    expect(menuItem(BENCH, 'moveDown')?.props.modifiers).toBeUndefined();
  });

  test('Add set adds a row, Remove last set takes it away', async () => {
    await renderToday();

    pickMenuItem(BENCH, 'addSet');
    await waitFor(async () => expect((await sessionExercises())[0]?.setTargets).toHaveLength(4));
    expect(await screen.findByRole('checkbox', { name: 'Log set 4' })).toBeTruthy();

    pickMenuItem(BENCH, 'removeLastSet');
    await waitFor(async () => expect((await sessionExercises())[0]?.setTargets).toHaveLength(3));
  });

  test('Move down swaps the exercise with the next one', async () => {
    await renderToday();

    pickMenuItem(BENCH, 'moveDown');

    await waitFor(async () =>
      expect((await sessionExercises()).map((exercise) => exercise.id)).toEqual([ROW, BENCH]),
    );
  });

  test('Skip exercise, then Unskip exercise', async () => {
    await renderToday();

    pickMenuItem(ROW, 'skip');
    expect(alertSpy).toHaveBeenCalledWith(
      'Skip exercise?',
      'All 3 sets will be skipped.',
      expect.any(Array),
    );
    pressAlertButton('Skip');
    await waitFor(async () =>
      expect((await sessionExercises()).find((e) => e.id === ROW)?.status).toBe('skipped'),
    );

    await waitFor(() => expect(menuItem(ROW, 'unskip')).not.toBeNull());
    pickMenuItem(ROW, 'unskip');
    await waitFor(async () =>
      expect((await sessionExercises()).find((e) => e.id === ROW)?.status).toBe('planned'),
    );
  });

  test('a skipped exercise shows its logged rows, the rest as Skipped rows — one line if none', async () => {
    await renderToday();
    const card = (id: string) => within(screen.getByTestId(`exercise-card-${id}`));

    // Bench: 2 of 3 logged.
    pickMenuItem(BENCH, 'skip');
    pressAlertButton('Skip');
    // Waits on what appears: a failing assertion on an element pretty-prints its whole fiber on
    // every poll, slow enough to starve the re-read it's waiting for.
    expect(await card(BENCH).findByText('Skipped')).toBeTruthy();
    expect(card(BENCH).getByTestId('set-row-3')).toHaveTextContent('Skipped');
    expect(card(BENCH).getByTestId('set-row-1')).not.toHaveTextContent('Skipped');
    expect(card(BENCH).getByTestId('set-row-2')).not.toHaveTextContent('Skipped');

    // Row: nothing logged.
    pickMenuItem(ROW, 'skip');
    pressAlertButton('Skip');
    expect(await card(ROW).findByText('Skipped')).toBeTruthy();
    expect(card(ROW).queryByTestId('set-row-1')).toBeNull();
    expect(card(ROW).getAllByText('Skipped')).toHaveLength(1);

    for (const id of [BENCH, ROW]) {
      await waitFor(() => expect(menuItem(id, 'unskip')).not.toBeNull());
      pickMenuItem(id, 'unskip');
    }
    await waitFor(async () =>
      expect((await sessionExercises()).map((exercise) => exercise.status)).toEqual([
        'planned',
        'planned',
      ]),
    );
    expect(await screen.findByRole('checkbox', { name: 'Log set 1' })).toBeTruthy();
    for (const id of [BENCH, ROW]) {
      expect(card(id).queryByText('Skipped')).toBeNull();
    }
  });

  test('Replace exercise with sets logged warns first, then swaps to the pick', async () => {
    await renderToday();

    pickMenuItem(BENCH, 'replace');

    // The warning comes before the picker.
    expect(alertSpy).toHaveBeenCalledWith(
      'Replace exercise?',
      'The 2 sets logged for Bench Press will be deleted.',
      expect.any(Array),
    );
    expect(screen.queryByRole('button', { name: 'Squat' })).toBeNull();
    pressAlertButton('Replace');

    fireEvent.press(await screen.findByRole('button', { name: 'Squat' }));
    expect(alertSpy).toHaveBeenCalledTimes(1);

    await waitFor(async () =>
      expect((await sessionExercises()).find((e) => e.id === BENCH)?.exerciseId).toBe(
        'squat-barbell',
      ),
    );
    await expect(
      repositories().workoutStore.repos.setLogRepo.listBySessionExerciseId(BENCH),
    ).resolves.toEqual([]);
  });

  test('Delete exercise removes it once confirmed', async () => {
    await renderToday();

    pickMenuItem(ROW, 'delete');
    pressAlertButton('Delete');

    await waitFor(async () =>
      expect((await sessionExercises()).map((exercise) => exercise.id)).toEqual([BENCH]),
    );
    // A count, not the element: a failing check on an element prints its whole fiber on every poll.
    await waitFor(() => expect(screen.queryAllByText('Barbell Row').length).toBe(0));
  });
});
