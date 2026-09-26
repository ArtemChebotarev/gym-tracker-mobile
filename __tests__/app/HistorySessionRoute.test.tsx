import { fireEvent, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import HistorySessionRoute from '@app/session/[id]';
import { exerciseDetailHref } from '@components/historyRoutes';

import { seedWorkoutFixture, WORKOUT_FIXTURE_IDS } from '../fixtures/workoutFixture';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

// `session/[id]` (08.9, task 130): a day of a closed block, pushed over its detail screen. The
// fixture's block is closed here the way Stop leaves it — `abandoned` — so its week 1 day 1 opens in
// History. Mocked expo-router, for the reason TodayRoute.test.tsx gives.
let mockParams: Record<string, string | undefined> = {};
const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useLocalSearchParams: () => mockParams,
}));

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

const repositories = withRepositories();
beforeEach(async () => {
  await seedWorkoutFixture(repositories());
  const mesocycle = await repositories().mesocycleRepo.getById(WORKOUT_FIXTURE_IDS.mesocycle);
  if (!mesocycle) {
    throw new Error('The fixture has no mesocycle.');
  }
  await repositories().mesocycleRepo.update({
    ...mesocycle,
    status: 'abandoned',
    completedAt: new Date().toISOString(),
  });
  mockParams = { id: WORKOUT_FIXTURE_IDS.completed };
  mockBack.mockClear();
  mockPush.mockClear();
});

function renderRoute() {
  return renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <HistorySessionRoute />
    </SafeAreaProvider>,
  );
}

describe('History session route', () => {
  test('DoD: opens the session the id names, in History mode', async () => {
    renderRoute();

    expect(await screen.findByText('Week 1 Day 1')).toBeTruthy();
    expect(screen.getByLabelText('Completed')).toBeTruthy();
    // History: no grid button, no header menu, no Next workout.
    expect(screen.queryByLabelText('Mesocycle overview')).toBeNull();
    expect(screen.queryByLabelText('Workout menu')).toBeNull();
    expect(screen.queryByText('Next workout')).toBeNull();
    expect(screen.queryByLabelText('Bench Press menu')).toBeNull();
  });

  test('DoD: Back returns to the detail screen it was pushed from', async () => {
    renderRoute();
    await screen.findByText('Week 1 Day 1');

    fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(mockBack).toHaveBeenCalled();
  });

  test("an exercise's history button still opens its own screen", async () => {
    renderRoute();
    await screen.findByText('Week 1 Day 1');

    fireEvent.press(screen.getByLabelText('Bench Press history'));

    expect(mockPush).toHaveBeenCalledWith(exerciseDetailHref('bench-press-barbell'));
  });

  test('a missing session: the fallback leads back', async () => {
    mockParams = { id: 'missing' };
    renderRoute();

    expect(await screen.findByText('Workout not found')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(mockBack).toHaveBeenCalled();
  });
});
