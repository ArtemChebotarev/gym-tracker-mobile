import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MesocycleDetailRoute from '@app/meso/[id]';

import { seedWorkoutFixture, WORKOUT_FIXTURE_IDS } from '../fixtures/workoutFixture';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

// "Мезоцикл (деталь)" (08.9, task 129) over the fixture's active block: Upper/Lower, 5 × 4, week 1
// day 1 completed with 3 bench + 3 row sets, week 2 day 1 in progress with 2 bench sets. Where each
// entry point pushes this route with the block's id is covered by MesocyclesRoute.test.tsx (08.3's
// Completed row) and TodayRouteMenu.test.tsx (the workout's `Mesocycle history`).
//
// Mocked expo-router rather than renderRouter, for the reason TodayRoute.test.tsx gives: its fake
// timers also fake the microtasks every storage call resolves through.
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
  mockParams = { id: WORKOUT_FIXTURE_IDS.mesocycle };
  mockBack.mockClear();
  mockPush.mockClear();
});

function renderRoute() {
  return renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <MesocycleDetailRoute />
    </SafeAreaProvider>,
  );
}

async function stopFixtureBlock() {
  const mesocycle = await repositories().mesocycleRepo.getById(WORKOUT_FIXTURE_IDS.mesocycle);
  if (!mesocycle) {
    throw new Error('The fixture has no mesocycle.');
  }
  await repositories().mesocycleRepo.update({
    ...mesocycle,
    status: 'abandoned',
    completedAt: new Date().toISOString(),
  });
}

function pickMenuItem(key: string) {
  const button = screen.queryByTestId(`action-menu-${key}`);
  if (button === null) {
    throw new Error(`The header menu has no "${key}"`);
  }
  fireEvent(button, 'buttonPress');
}

describe('Mesocycle detail route', () => {
  test('an active block: badge, week by workouts, the summary read from storage', async () => {
    renderRoute();

    expect(await screen.findByText('Upper/Lower')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText(/^Week 2 of 5 · started /)).toBeTruthy();
    // 1 completed of 5 × 4; 6 + 2 sets; weeks 1 and 2 of 5.
    expect(screen.getByText('1 / 20')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('2 / 5')).toBeTruthy();
    expect(screen.getByTestId('weekly-sets')).toBeTruthy();
    expect(screen.getByText('Chest')).toBeTruthy();
    expect(screen.getByText('Back')).toBeTruthy();
  });

  test('an active block offers Rename only', async () => {
    renderRoute();
    await screen.findByText('Upper/Lower');

    expect(screen.queryByTestId('action-menu-rename')).toBeTruthy();
    expect(screen.queryByTestId('action-menu-copy')).toBeNull();
  });

  test('a stopped block: Stopped badge, no workouts denominator, Copy opens Flow C on it', async () => {
    await stopFixtureBlock();
    renderRoute();

    expect(await screen.findByText('Stopped')).toBeTruthy();
    expect(screen.getByText(/^Stopped in week 2 · /)).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.queryByText('1 / 20')).toBeNull();
    expect(screen.getByText('2 / 5')).toBeTruthy();

    pickMenuItem('copy');

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/meso-editor/copy',
      params: { sourceMesoId: WORKOUT_FIXTURE_IDS.mesocycle },
    });
  });

  test('Rename opens prefilled and the title follows the saved name', async () => {
    renderRoute();
    await screen.findByText('Upper/Lower');

    pickMenuItem('rename');
    const field = await screen.findByLabelText('Mesocycle name');
    expect(field.props.value).toBe('Upper/Lower');
    fireEvent.changeText(field, 'Autumn block');
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Autumn block')).toBeTruthy();
    await waitFor(async () => {
      expect(
        (await repositories().mesocycleRepo.getById(WORKOUT_FIXTURE_IDS.mesocycle))?.name,
      ).toBe('Autumn block');
    });
  });

  test('a missing mesocycle shows the not-found state, and Go back leaves', async () => {
    mockParams = { id: 'missing' };
    renderRoute();

    expect(await screen.findByText('Mesocycle not found')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Go back' }));

    expect(mockBack).toHaveBeenCalled();
  });

  test('never shows tonnage', async () => {
    renderRoute();
    await screen.findByText('Upper/Lower');

    expect(screen.queryByText(/tonnage|volume, kg|\bkg\b|\bt\b/i)).toBeNull();
  });
});
