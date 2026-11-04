import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TodayScreen from '@app/(tabs)/index';
import { EDIT_COACHMARK } from '@components/EditCoachmarkLogic';
import type { ExerciseMenuItem } from '@components/WorkoutExerciseMenuLogic';
import type { OnboardingFlag } from '@repositories/settings';
import { markOnboardingSeen, readOnboardingFlags } from '@usecases/onboarding';

import { seedWorkoutFixture, WORKOUT_FIXTURE_IDS } from '../fixtures/workoutFixture';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
// Aliased with a `mock` prefix so the hoisted `jest.mock` factory below may refer to it.
import { tabNavigation as mockTabNavigation } from '../fixtures/tabNavigation';

// The edit coachmark (GT-224) on the Today tab, over the fixture's live Week 2 Day 1 of a 5-week
// block — a working week with another after it. Its own file: the edits change the fixture session,
// and a separate file gets a fresh store. Mocked expo-router, for the reason TodayRoute.test.tsx
// gives. The Welcome dialog, the tour and the ranges coachmark are marked seen first, so the edit
// coachmark is the only one that can come up.
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
  useNavigation: () => mockTabNavigation(),
}));

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

const BENCH = `${WORKOUT_FIXTURE_IDS.live}-bench-press-barbell`;
const OTHER_COACHMARKS: OnboardingFlag[] = ['welcomeSeen', 'coachmarksSeen', 'rangesCoachmarkSeen'];

let alertSpy: jest.SpyInstance;

const repositories = withRepositories();
beforeEach(async () => {
  await seedWorkoutFixture(repositories());
  await markOnboardingSeen(OTHER_COACHMARKS, { settingsRepo: repositories().settingsRepo });
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

function pickMenuItem(sessionExerciseId: string, item: ExerciseMenuItem) {
  const button = screen.queryByTestId(`exercise-menu-${sessionExerciseId}-${item}`);
  if (button === null) {
    throw new Error(`No "${item}" in the menu of ${sessionExerciseId}`);
  }
  fireEvent(button, 'buttonPress');
}

async function editCoachmarkSeen() {
  return (await readOnboardingFlags({ settingsRepo: repositories().settingsRepo }))
    .editCoachmarkSeen;
}

/** Long enough for the coachmark's delay and its measuring, so its absence means something. */
async function settle() {
  await act(() => new Promise((resolve) => setTimeout(resolve, 800)));
}

describe('Today tab — edit coachmark', () => {
  test('GT-224: the first edit that carries over brings it up; Got it closes it for good', async () => {
    await renderToday();

    pickMenuItem(BENCH, 'addSet');

    // The edit lands, the session and the grid are read again, then the coachmark's own beat: more
    // than findBy's default second on a slow CI runner (it failed there at 1 s).
    expect(await screen.findByText(EDIT_COACHMARK.title, {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByText('Add, remove, replace or move:')).toBeTruthy();
    expect(screen.getByText('Skip:')).toBeTruthy();
    // One step: no counter, no Skip.
    expect(screen.queryByText('1 of 1')).toBeNull();

    fireEvent.press(screen.getByText('Got it'));
    await waitFor(async () => expect(await editCoachmarkSeen()).toBe(true));
    await waitFor(() => expect(screen.queryByText(EDIT_COACHMARK.title)).toBeNull());
  });

  test('Skip exercise is not an edit that carries over: nothing comes up', async () => {
    await renderToday();

    pickMenuItem(BENCH, 'skip');
    // Skip asks first.
    const buttons = alertSpy.mock.calls.at(-1)?.[2] as { text: string; onPress?: () => void }[];
    act(() => buttons.find((button) => button.text === 'Skip')?.onPress?.());
    await waitFor(() => expect(screen.getAllByText('Skipped').length).toBeGreaterThan(0));
    await settle();

    expect(screen.queryByText(EDIT_COACHMARK.title)).toBeNull();
    expect(await editCoachmarkSeen()).toBe(false);
  });

  test('once seen, an edit brings nothing up', async () => {
    await markOnboardingSeen('editCoachmarkSeen', { settingsRepo: repositories().settingsRepo });
    await renderToday();

    pickMenuItem(BENCH, 'addSet');
    expect(await screen.findByRole('checkbox', { name: 'Log set 4' })).toBeTruthy();
    await settle();

    expect(screen.queryByText(EDIT_COACHMARK.title)).toBeNull();
  });
});
