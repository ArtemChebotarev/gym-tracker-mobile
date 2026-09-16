import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MesoEditorRoute from '@app/meso-editor/new';
import { EXERCISE_CATALOG } from '@domain/exerciseCatalog';
import { InMemorySessionRepository } from '@storage/session';
import { appStore } from '@state/appStore';
import {
  DEFAULT_MESO_BUILDER_DRAFT,
  useDraftStore,
  type MesoBuilderDraft,
} from '@state/draftStore';
import { mesocycleCreationDeps } from '@state/mesocycleStore';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

// Same fixture as WizardScreen.test.tsx: WizardScreen's own nested SafeAreaProvider inherits
// these, so SafeAreaView renders synchronously instead of waiting on a native onLayout.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

const [FIRST_EXERCISE, SECOND_EXERCISE] = EXERCISE_CATALOG;

const FILLED_DRAFT: MesoBuilderDraft = {
  name: 'Route Test Block',
  lengthWeeks: 6,
  daysPerWeek: 2,
  exercisesByDay: {
    1: [{ exerciseId: FIRST_EXERCISE!.id, order: 0, sets: 3 }],
    2: [{ exerciseId: SECOND_EXERCISE!.id, order: 0, sets: 2 }],
  },
};

let client: QueryClient;

beforeEach(() => {
  // mutations.gcTime: 0 too — a mutation's default 5-minute GC timer otherwise keeps jest alive.
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  useDraftStore.setState({ mesoBuilder: FILLED_DRAFT });
  mockBack.mockClear();
});

afterEach(() => {
  client.clear();
  client.unmount();
  useDraftStore.setState({ mesoBuilder: DEFAULT_MESO_BUILDER_DRAFT });
});

async function renderAtReviewStep() {
  render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <QueryClientProvider client={client}>
        <MesoEditorRoute />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.press(await screen.findByRole('button', { name: 'Continue' }));
  await screen.findByText(FIRST_EXERCISE!.name);
}

describe('MesoEditorRoute — step 3 (Review & confirm)', () => {
  test('Save mesocycle saves a planned mesocycle via Confirm, creates no Session, and closes', async () => {
    await renderAtReviewStep();

    fireEvent.press(screen.getByRole('button', { name: 'Save mesocycle' }));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());

    const saved = (await mesocycleCreationDeps.mesocycleRepo.getAll()).find(
      (mesocycle) => mesocycle.name === 'Route Test Block',
    );
    expect(saved?.status).toBe('planned');
    await expect(new InMemorySessionRepository(appStore).listByMesoId(saved!.id)).resolves.toEqual(
      [],
    );
    expect(useDraftStore.getState().mesoBuilder).toEqual(DEFAULT_MESO_BUILDER_DRAFT);
  });

  test('a day chevron returns to step 2 on that day, with every other day left intact', async () => {
    await renderAtReviewStep();

    fireEvent.press(screen.getByRole('button', { name: 'Edit Day 2' }));

    const dayTwoTab = await screen.findByRole('button', { name: 'Day 2' });
    expect(dayTwoTab.props.accessibilityState.selected).toBe(true);
    expect(screen.getByText(SECOND_EXERCISE!.name)).toBeTruthy();
    expect(useDraftStore.getState().mesoBuilder).toEqual(FILLED_DRAFT);
  });

  test('a failed save shows a try-again alert and keeps the draft', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest
      .spyOn(mesocycleCreationDeps.mesocycleRepo, 'create')
      .mockRejectedValueOnce(new Error('storage down'));
    await renderAtReviewStep();

    fireEvent.press(screen.getByRole('button', { name: 'Save mesocycle' }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't save mesocycle",
        'Something went wrong. Please try again.',
      ),
    );
    expect(mockBack).not.toHaveBeenCalled();
    expect(useDraftStore.getState().mesoBuilder).toEqual(FILLED_DRAFT);
  });
});
