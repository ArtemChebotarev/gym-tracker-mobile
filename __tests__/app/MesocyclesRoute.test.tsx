// Where the Mesocycles tab's two Copy entry points lead (task 124; 04 · Meso Creation Flows,
// "Точки входа"). components/MesocyclesScreen.test.tsx already covers that each one fires its
// callback; this covers what the route does with it, which is the one link a wrong path or a
// misspelled param would break silently — step S would then open on the newest block rather than
// the one whose row was swiped, and nothing else would look wrong.

import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MesocyclesRoute from '@app/(tabs)/mesocycles';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
import { pressSwipeAction } from '../fixtures/swipeActions';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, navigate: jest.fn(), back: jest.fn() }),
}));

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

const FINISHED_ID = 'meso-finished';

const repositories = withRepositories();

beforeEach(async () => {
  await repositories().mesocycleRepo.create({
    id: FINISHED_ID,
    name: 'Upper/Lower',
    lengthWeeks: 4,
    daysPerWeek: 2,
    startDate: '2026-06-01T00:00:00.000Z',
    status: 'completed',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    completedAt: '2026-08-20T00:00:00.000Z',
  });
  mockPush.mockClear();
});

async function renderRoute() {
  renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <MesocyclesRoute />
    </SafeAreaProvider>,
  );
  await screen.findByText('Upper/Lower');
}

describe('MesocyclesRoute — entry points into Flow C', () => {
  test('`+` → Copy a mesocycle opens step S knowing nothing', async () => {
    await renderRoute();

    fireEvent.press(screen.getByRole('button', { name: 'New mesocycle' }));
    fireEvent.press(screen.getByRole('button', { name: 'Copy a mesocycle' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/meso-editor/copy'));
  });

  // DoD: entering from a known block opens that block's weeks — which starts here, with the row
  // passing its own id rather than letting the step fall back to the newest one.
  test('DoD: Copy on a finished row opens step S on that block', async () => {
    await renderRoute();

    pressSwipeAction(`mesocycle-row-${FINISHED_ID}-copy`);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/meso-editor/copy',
      params: { sourceMesoId: FINISHED_ID },
    });
  });

  test('From scratch still goes to Flow A, not the copy route', async () => {
    await renderRoute();

    fireEvent.press(screen.getByRole('button', { name: 'New mesocycle' }));
    fireEvent.press(screen.getByRole('button', { name: 'From scratch' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/meso-editor/new'));
  });
});
