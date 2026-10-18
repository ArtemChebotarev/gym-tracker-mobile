// GT-92 through the editor's own route, over SQLite: a hybrid row's chip opens its plan sheet,
// an edit there changes the chip and the draft, Reset to defaults brings the library back, and
// the library exercise itself is never written.

import { fireEvent, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MesoEditorRoute from '@app/meso-editor/new';
import { DEFAULT_MESO_BUILDER_DRAFT, useDraftStore } from '@state/draftStore';
import { HEAVY_BAG, HEAVY_BAG_CONFIG } from '../fixtures/hybridExercises';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), dismissTo: jest.fn() }),
}));

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

const repositories = withRepositories();

beforeEach(async () => {
  await repositories().exerciseRepo.createCustom(HEAVY_BAG);
  useDraftStore.setState({
    mesoBuilder: {
      ...DEFAULT_MESO_BUILDER_DRAFT,
      name: 'Hybrid',
      exercisesByDay: { 1: [{ exerciseId: HEAVY_BAG.id, order: 0, sets: 2 }] },
      exerciseSettings: { [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG, rounds: 3 } },
    },
  });
});

afterEach(() => {
  useDraftStore.setState({ mesoBuilder: DEFAULT_MESO_BUILDER_DRAFT });
});

async function openPlanSheet() {
  renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <MesoEditorRoute />
    </SafeAreaProvider>,
  );
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.press(await screen.findByRole('button', { name: 'Heavy bag plan: 3 × 2:00, 0:45 rest' }));
  expect(screen.getByText('Plan for this training cycle · Day 1')).toBeTruthy();
}

describe('the plan sheet in the editor (GT-92)', () => {
  test('an edit reaches the chip and the draft; the library exercise is left alone', async () => {
    await openPlanSheet();

    fireEvent.press(screen.getByLabelText('Increase Rounds'));
    fireEvent.press(screen.getByText('More work'));

    expect(useDraftStore.getState().mesoBuilder.exerciseSettings?.[HEAVY_BAG.id]).toEqual({
      ...HEAVY_BAG_CONFIG,
      rounds: 4,
      lever: 'workTime',
    });
    fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('button', { name: 'Heavy bag plan: 4 × 2:00, 0:45 rest' })).toBeTruthy();
    expect((await repositories().exerciseRepo.getById(HEAVY_BAG.id))?.config).toEqual(HEAVY_BAG_CONFIG);
  });

  test('Reset to defaults brings back the library’s values', async () => {
    await openPlanSheet();
    fireEvent.press(screen.getByLabelText('Increase Rounds'));
    fireEvent.press(screen.getByLabelText('Decrease Rest'));

    fireEvent.press(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(useDraftStore.getState().mesoBuilder.exerciseSettings?.[HEAVY_BAG.id]).toEqual({
      ...HEAVY_BAG_CONFIG,
      rounds: 3,
    });
  });
});
