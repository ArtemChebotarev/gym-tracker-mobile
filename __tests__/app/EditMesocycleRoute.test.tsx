import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import EditMesocycleRoute from '@app/meso-editor/edit/[id]';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { EXERCISE_CATALOG } from '@domain/exerciseCatalog';
import { DEFAULT_MESO_BUILDER_DRAFT, toMesoBuilderDraft, useDraftStore } from '@state/draftStore';
import { ANY_STAMPS, STAMPS } from '../fixtures/stamps';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

const mockBack = jest.fn();
let mockId = '';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ id: mockId }),
}));

// Same fixture as MesoEditorRoute.test.tsx: WizardScreen's own nested SafeAreaProvider inherits
// these, so SafeAreaView renders synchronously instead of waiting on a native onLayout.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

const [FIRST_EXERCISE, SECOND_EXERCISE] = EXERCISE_CATALOG;

function makePlanned(id: string): Mesocycle {
  return {
    ...STAMPS,
    id,
    name: 'Edit Route Block',
    lengthWeeks: 6,
    daysPerWeek: 2,
    status: 'planned',
    origin: { type: 'template', templateId: 'template-1' },
    progressionSettings: defaultProgressionSettings,
    weekPlan: {
      days: [
        {
          dayNumber: 1,
          name: '',
          exercises: [{ exerciseId: FIRST_EXERCISE!.id, order: 0, sets: 3 }],
        },
        {
          dayNumber: 2,
          name: '',
          exercises: [{ exerciseId: SECOND_EXERCISE!.id, order: 0, sets: 2 }],
        },
      ],
    },
    createdAt: '2026-09-01T12:00:00.000Z',
  };
}

const repositories = withRepositories();
beforeEach(() => {
  mockBack.mockClear();
});

afterEach(() => {
  useDraftStore.setState({ mesoBuilder: DEFAULT_MESO_BUILDER_DRAFT });
});

// Mirrors app/(tabs)/mesocycles.tsx's Edit: load the mesocycle into the draft, then open the route.
async function openEditorOn(mesocycle: Mesocycle) {
  await repositories().mesocycleRepo.create(mesocycle);
  mockId = mesocycle.id;
  useDraftStore.getState().setMesoBuilder(toMesoBuilderDraft(mesocycle));
  renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <EditMesocycleRoute />
    </SafeAreaProvider>,
  );
}

async function goToReviewStep() {
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.press(await screen.findByRole('button', { name: 'Continue' }));
  await screen.findByRole('button', { name: 'Save mesocycle' });
}

describe('EditMesocycleRoute', () => {
  test('opens the editor titled Edit mesocycle, prefilled with the saved mesocycle', async () => {
    await openEditorOn(makePlanned('edit-route-prefill'));

    expect(screen.getByText('Edit mesocycle')).toBeTruthy();
    expect(screen.getByDisplayValue('Edit Route Block')).toBeTruthy();
  });

  test('Save mesocycle writes the edited draft over the same mesocycle and closes', async () => {
    const planned = makePlanned('edit-route-save');
    await openEditorOn(planned);

    fireEvent.changeText(screen.getByDisplayValue('Edit Route Block'), 'Renamed Block');
    await goToReviewStep();
    fireEvent.press(screen.getByRole('button', { name: 'Save mesocycle' }));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());

    await expect(repositories().mesocycleRepo.getById(planned.id)).resolves.toEqual({
      ...planned,
      ...ANY_STAMPS,
      name: 'Renamed Block',
    });
    expect(useDraftStore.getState().mesoBuilder).toEqual(DEFAULT_MESO_BUILDER_DRAFT);
  });

  test('a rejected save (mesocycle no longer planned) shows a try-again alert and stays open', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const planned = makePlanned('edit-route-started');
    await openEditorOn(planned);
    await repositories().mesocycleRepo.update({
      ...planned,
      status: 'active',
      startDate: '2026-09-02T08:00:00.000Z',
    });

    await goToReviewStep();
    fireEvent.press(screen.getByRole('button', { name: 'Save mesocycle' }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't save mesocycle",
        'Something went wrong. Please try again.',
      ),
    );
    expect(mockBack).not.toHaveBeenCalled();
  });
});
