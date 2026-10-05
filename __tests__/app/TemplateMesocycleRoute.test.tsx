// Flow B end to end, over the same SQLite storage the app runs on — GT-6 (08.10 · Редактор
// мезоцикла — Flow B). Covers what only exists once step T, the preview, the draft and Save are
// wired together: the step's chrome, `Use this template` filling Basics, Back/Close, and the
// `template` origin Save records — and that Start then makes week 1 with nothing more to set up.
//
// The rules a template is applied by are tested where they live — `applyTemplate`
// (__tests__/domain/templateConverters.test.ts) and `prepareTemplateDraft`
// (__tests__/usecases/mesocycleCreation.test.ts).

import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TemplateMesocycleRoute from '@app/meso-editor/template';
import type { MesoTemplate } from '@domain/plan';
import type { Incoming } from '@domain/timestamps';
import { DEFAULT_MESO_BUILDER_DRAFT, useDraftStore } from '@state/draftStore';
import { startMesocycle } from '@usecases/mesocycleStart';
import { seedExerciseCatalog } from '../fixtures/appStorage';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

const mockBack = jest.fn();
const mockDismissTo = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, dismissTo: mockDismissTo }),
}));

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function template(
  id: string,
  name: string,
  days: { exerciseId: string; sets: number }[][],
): Incoming<MesoTemplate> {
  return {
    id,
    name,
    source: 'catalog',
    defaultLengthWeeks: 5,
    isHidden: false,
    weekPlan: {
      days: days.map((exercises, index) => ({
        dayNumber: index + 1,
        name: `Day ${index + 1} name`,
        exercises: exercises.map((exercise, order) => ({ ...exercise, order: order + 1 })),
      })),
    },
  };
}

const UPPER_LOWER = template('upper-lower', 'Upper / Lower', [
  [
    { exerciseId: 'bench-press-barbell', sets: 4 },
    { exerciseId: 'barbell-row-barbell', sets: 3 },
  ],
  [{ exerciseId: 'squat-barbell', sets: 5 }],
]);
const FULL_BODY = template('full-body', 'Full Body', [
  [{ exerciseId: 'deadlift-barbell', sets: 2 }],
]);

const repositories = withRepositories();

beforeEach(async () => {
  const repos = repositories();
  await seedExerciseCatalog(repos);
  await repos.templateRepo.create(UPPER_LOWER);
  await repos.templateRepo.create(FULL_BODY);

  mockBack.mockClear();
  mockDismissTo.mockClear();
  useDraftStore.setState({ mesoBuilder: DEFAULT_MESO_BUILDER_DRAFT });
});

afterEach(() => {
  useDraftStore.setState({ mesoBuilder: DEFAULT_MESO_BUILDER_DRAFT });
});

/** See MesoEditorRoute.test.tsx — lets the save mutation's settled state land inside act(). */
async function flushQueryNotifications() {
  await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
}

function renderRoute() {
  renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <TemplateMesocycleRoute />
    </SafeAreaProvider>,
  );
}

/** Opens `title`'s preview from the list and presses `Use this template`. */
async function useTemplate(title: string) {
  fireEvent.press(await screen.findByText(title));
  fireEvent.press(await screen.findByRole('button', { name: 'Use this template' }));
  await screen.findByText('Step 2 of 4');
}

describe('TemplateMesocycleRoute — step T', () => {
  test('opens as Step 1 of 4, titled, with Close and no Continue', async () => {
    renderRoute();

    expect(await screen.findByText('Upper / Lower')).toBeTruthy();
    expect(screen.getByText('2 days a week')).toBeTruthy();
    expect(screen.getByText('Step 1 of 4')).toBeTruthy();
    expect(screen.getByText('Choose a template')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  });

  test('a row opens its preview; Close leaves the wizard and drops the draft', async () => {
    renderRoute();

    fireEvent.press(await screen.findByText('Upper / Lower'));
    expect(await screen.findByRole('button', { name: 'Use this template' })).toBeTruthy();
    expect(await screen.findByText('Bench Press · Barbell')).toBeTruthy();

    // The sheet's backdrop — the last `Close`, over the wizard's own — closes the preview and
    // leaves the wizard where it was.
    const closes = screen.getAllByRole('button', { name: 'Close' });
    fireEvent.press(closes[closes.length - 1]!);
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Use this template' })).toBeNull(),
    );
    expect(mockBack).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(useDraftStore.getState().mesoBuilder).toEqual(DEFAULT_MESO_BUILDER_DRAFT);
  });
});

describe('TemplateMesocycleRoute — prefilled draft', () => {
  test('Use this template fills the draft and opens Basics on it, with Back rather than Close', async () => {
    renderRoute();

    await useTemplate('Upper / Lower');

    expect(useDraftStore.getState().mesoBuilder).toEqual({
      name: 'Upper / Lower',
      lengthWeeks: DEFAULT_MESO_BUILDER_DRAFT.lengthWeeks,
      daysPerWeek: 2,
      exercisesByDay: {
        1: [
          { exerciseId: 'bench-press-barbell', order: 1, sets: 4 },
          { exerciseId: 'barbell-row-barbell', order: 2, sets: 3 },
        ],
        2: [{ exerciseId: 'squat-barbell', order: 1, sets: 5 }],
      },
      templateId: 'upper-lower',
    });
    expect(screen.getByDisplayValue('Upper / Lower')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  test('Back returns to the template list', async () => {
    renderRoute();
    await useTemplate('Upper / Lower');

    fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(await screen.findByText('Choose a template')).toBeTruthy();
    expect(screen.getByText('Full Body')).toBeTruthy();
  });

  test('using the same template again keeps what was edited in between', async () => {
    renderRoute();
    await useTemplate('Upper / Lower');
    fireEvent.changeText(screen.getByDisplayValue('Upper / Lower'), 'Block 7');
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    await useTemplate('Upper / Lower');

    expect(screen.getByDisplayValue('Block 7')).toBeTruthy();
  });

  test('using a different template replaces the draft, edits and all', async () => {
    renderRoute();
    await useTemplate('Upper / Lower');
    fireEvent.changeText(screen.getByDisplayValue('Upper / Lower'), 'Block 7');
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    await useTemplate('Full Body');

    expect(screen.getByDisplayValue('Full Body')).toBeTruthy();
    expect(useDraftStore.getState().mesoBuilder).toEqual(
      expect.objectContaining({
        daysPerWeek: 1,
        exercisesByDay: { 1: [{ exerciseId: 'deadlift-barbell', order: 1, sets: 2 }] },
        templateId: 'full-body',
      }),
    );
  });
});

describe('TemplateMesocycleRoute — Save and Start', () => {
  // DoD: the flow ends in a saved planned cycle with `origin.type = template`, and Start makes
  // week 1 with nothing left to set up.
  test('DoD: saves a planned cycle from the template, and Start makes week 1 from it', async () => {
    renderRoute();
    await useTemplate('Upper / Lower');

    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Continue' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Save cycle' }));

    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith('/mesocycles'));
    await flushQueryNotifications();

    const repos = repositories();
    const saved = (await repos.mesocycleRepo.getAll()).find(
      (mesocycle) => mesocycle.name === 'Upper / Lower',
    );
    expect(saved?.status).toBe('planned');
    expect(saved?.origin).toEqual({ type: 'template', templateId: 'upper-lower' });
    expect(useDraftStore.getState().mesoBuilder).toEqual(DEFAULT_MESO_BUILDER_DRAFT);

    await startMesocycle(
      saved!.id,
      { store: repos.mesocycleStartStore },
      '2026-10-05T09:00:00.000Z',
    );

    const sessions = await repos.sessionRepo.listByMesoId(saved!.id);
    expect(sessions.map((session) => session.dayNumber).sort()).toEqual([1, 2]);
    const day1 = sessions.find((session) => session.dayNumber === 1)!;
    const exercises = await repos.sessionExerciseRepo.listBySessionId(day1.id);
    expect(
      [...exercises]
        .sort((a, b) => a.order - b.order)
        .map(({ exerciseId, setTargets }) => [exerciseId, setTargets.length]),
    ).toEqual([
      ['bench-press-barbell', 4],
      ['barbell-row-barbell', 3],
    ]);
    expect(exercises.every((exercise) => exercise.targetRir !== undefined)).toBe(true);
    expect(
      exercises
        .flatMap((exercise) => exercise.setTargets)
        .every((target) => target.targetReps === undefined && target.suggestedWeight === undefined),
    ).toBe(true);
  });
});
