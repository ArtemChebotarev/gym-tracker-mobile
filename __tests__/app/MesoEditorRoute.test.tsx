import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MesoEditorRoute from '@app/meso-editor/new';
import { EXERCISE_CATALOG } from '@domain/exerciseCatalog';
import { seedExerciseCatalog } from '../fixtures/appStorage';
import {
  DEFAULT_MESO_BUILDER_DRAFT,
  useDraftStore,
  type MesoBuilderDraft,
} from '@state/draftStore';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

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

const repositories = withRepositories();

beforeEach(async () => {
  await seedExerciseCatalog(repositories());
  useDraftStore.setState({ mesoBuilder: FILLED_DRAFT });
  mockBack.mockClear();
});

afterEach(() => {
  useDraftStore.setState({ mesoBuilder: DEFAULT_MESO_BUILDER_DRAFT });
});

/**
 * Lets TanStack Query deliver the save mutation's settled state to the screen inside act(). The
 * per-call `onSuccess` / `onError` (router.back, the alert) run first, and the observer's own
 * re-render is batched onto a `setTimeout(0)` scheduled right after them — a test that ended on
 * the callback let that re-render land after it, outside act(), and log a warning once the
 * console guard in jest.setup.ts was already restored. A zero-delay timer queued now fires after
 * the one already pending.
 */
async function flushQueryNotifications() {
  await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
}

async function renderAtReviewStep() {
  renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <MesoEditorRoute />
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
    await flushQueryNotifications();

    const saved = (await repositories().mesocycleRepo.getAll()).find(
      (mesocycle) => mesocycle.name === 'Route Test Block',
    );
    expect(saved?.status).toBe('planned');
    await expect(repositories().sessionRepo.listByMesoId(saved!.id)).resolves.toEqual([]);
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
      .spyOn(repositories().mesocycleRepo, 'create')
      .mockRejectedValueOnce(new Error('storage down'));
    await renderAtReviewStep();

    fireEvent.press(screen.getByRole('button', { name: 'Save mesocycle' }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't save mesocycle",
        'Something went wrong. Please try again.',
      ),
    );
    await flushQueryNotifications();
    expect(mockBack).not.toHaveBeenCalled();
    expect(useDraftStore.getState().mesoBuilder).toEqual(FILLED_DRAFT);
  });
});
