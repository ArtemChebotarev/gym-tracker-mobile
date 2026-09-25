// Where the Mesocycles tab's two Copy entry points lead (task 124; 04 · Meso Creation Flows,
// "Точки входа"), and where a Completed row's tap goes (117). components/MesocyclesScreen.test.tsx
// already covers that each one fires its callback; this covers what the route does with it, which
// is the one link a wrong path or a misspelled param would break silently — step S would then open
// on the newest block rather than the one whose `⋯` was used, and nothing else would look wrong.

import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MesocyclesRoute from '@app/(tabs)/mesocycles';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

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
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  alertSpy.mockRestore();
});

let alertSpy: jest.SpyInstance;

/** Presses the named button of the most recent Alert.alert call. */
function pressAlertButton(text: string) {
  const buttons = alertSpy.mock.calls.at(-1)?.[2] as AlertButton[] | undefined;
  const button = buttons?.find((candidate) => candidate.text === text);
  if (!button) {
    throw new Error(`No "${text}" button in the last alert`);
  }
  act(() => button.onPress?.());
}

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

    fireEvent(screen.getByTestId(`mesocycle-menu-${FINISHED_ID}-copy`), 'buttonPress');

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/meso-editor/copy',
      params: { sourceMesoId: FINISHED_ID },
    });
  });

  // The History screen is still a stub (098), but it is a screen with this block's id — the row's
  // tap goes there rather than raising a "not available yet" popup.
  test('tapping a finished row opens that mesocycle’s history', async () => {
    await renderRoute();

    fireEvent.press(screen.getByRole('button', { name: 'Upper/Lower' }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/meso/[id]',
      params: { id: FINISHED_ID },
    });
  });

  test('From scratch still goes to Flow A, not the copy route', async () => {
    await renderRoute();

    fireEvent.press(screen.getByRole('button', { name: 'New mesocycle' }));
    fireEvent.press(screen.getByRole('button', { name: 'From scratch' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/meso-editor/new'));
  });
});

describe('MesocyclesRoute — Archive', () => {
  test('archiving a finished block takes it off the list without deleting anything', async () => {
    await renderRoute();

    fireEvent(screen.getByTestId(`mesocycle-menu-${FINISHED_ID}-archive`), 'buttonPress');
    expect(alertSpy).toHaveBeenCalledWith(
      'Archive mesocycle?',
      expect.stringContaining('Upper/Lower'),
      expect.any(Array),
    );

    pressAlertButton('Archive');

    // Off the screen...
    await waitFor(() => expect(screen.queryByText('Upper/Lower')).toBeNull());
    // ...but still in storage, stamped rather than deleted — a soft delete, no cascade.
    const stored = await repositories().mesocycleRepo.getById(FINISHED_ID);
    expect(stored).toMatchObject({ status: 'completed' });
    expect(stored?.archivedAt).toEqual(expect.any(String));
  });

  test('cancelling the confirmation leaves the block where it was', async () => {
    await renderRoute();

    fireEvent(screen.getByTestId(`mesocycle-menu-${FINISHED_ID}-archive`), 'buttonPress');
    pressAlertButton('Cancel');

    expect(screen.getByText('Upper/Lower')).toBeTruthy();
    const stored = await repositories().mesocycleRepo.getById(FINISHED_ID);
    expect(stored?.archivedAt).toBeUndefined();
  });
});
