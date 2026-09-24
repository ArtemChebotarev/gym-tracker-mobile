// Flow C end to end, over the same SQLite storage the app runs on — task 124 (08.8 · Редактор
// мезоцикла — Flow C). Covers the DoD items that only exist once the step, the draft and Save are
// wired together: entering with a known block, the draft the source week leaves behind, and the
// `copyWeek` origin Save records.
//
// The rules about *which* weeks may be copied are tested where they live — `buildSourceWeekOptions`
// (__tests__/domain/sourceWeekBuilders.test.ts) and `listSourceWeeks`
// (__tests__/usecases/mesocycleCreation.test.ts).

import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import CopyMesocycleRoute from '@app/meso-editor/copy';
import { EXERCISE_CATALOG } from '@domain/exerciseCatalog';
import type { Session, SessionExercise } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { Unsaved } from '@domain/timestamps';
import { DEFAULT_MESO_BUILDER_DRAFT, useDraftStore } from '@state/draftStore';
import { seedExerciseCatalog } from '../fixtures/appStorage';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

const mockBack = jest.fn();
const mockDismissTo = jest.fn();
// `mock`-prefixed so jest.mock's factory may reference it — the hoisted factory can't close over
// an ordinary out-of-scope variable.
let mockSearchParams: { sourceMesoId?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, dismissTo: mockDismissTo }),
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

const [BENCH, SQUAT, ROW] = EXERCISE_CATALOG;

const NEWEST_ID = 'meso-newest';
const OLDER_ID = 'meso-older';

function block(id: string, name: string, completedAt: string) {
  return {
    id,
    name,
    lengthWeeks: 4,
    daysPerWeek: 2,
    startDate: '2026-06-01T00:00:00.000Z',
    status: 'completed' as const,
    origin: { type: 'scratch' as const },
    progressionSettings: defaultProgressionSettings,
    completedAt,
  };
}

function session(
  mesoId: string,
  weekNumber: number,
  dayNumber: number,
  status: Session['status'],
): Unsaved<Session> {
  return {
    id: `session-${mesoId}-w${weekNumber}-d${dayNumber}`,
    mesoId,
    weekNumber,
    dayNumber,
    name: '',
    isDeload: weekNumber === 4,
    prescriptionStatus: 'ready',
    status,
  };
}

function sessionExercise(
  sessionId: string,
  exerciseId: string,
  order: number,
  sets: number,
): Unsaved<SessionExercise> {
  return {
    id: `sx-${sessionId}-${exerciseId}`,
    sessionId,
    exerciseId,
    // Every target filled in, so a draft that kept one would be caught.
    setTargets: Array.from({ length: sets }, (_, index) => ({
      setNumber: index + 1,
      targetReps: 10,
      suggestedWeight: 60,
    })),
    order,
    targetRir: 1,
    status: 'completed',
  };
}

const repositories = withRepositories();

beforeEach(async () => {
  const repos = repositories();
  await seedExerciseCatalog(repos);

  await repos.mesocycleRepo.create(block(OLDER_ID, 'Push/Pull', '2026-07-15T00:00:00.000Z'));
  await repos.mesocycleRepo.create(block(NEWEST_ID, 'Upper/Lower', '2026-08-20T00:00:00.000Z'));

  // The newest block: week 2 fully trained, week 3 generated but untouched, week 4 its deload.
  await repos.sessionRepo.createMany([
    session(NEWEST_ID, 2, 1, 'completed'),
    session(NEWEST_ID, 2, 2, 'completed'),
    session(NEWEST_ID, 3, 1, 'planned'),
    session(NEWEST_ID, 3, 2, 'planned'),
    session(NEWEST_ID, 4, 1, 'completed'),
  ]);
  await repos.sessionExerciseRepo.createMany([
    // Week 3, day 1 ends with the squat before the bench — the order the week really finished in.
    sessionExercise(`session-${NEWEST_ID}-w3-d1`, SQUAT!.id, 2, 4),
    sessionExercise(`session-${NEWEST_ID}-w3-d1`, BENCH!.id, 1, 3),
    sessionExercise(`session-${NEWEST_ID}-w3-d2`, ROW!.id, 1, 2),
    sessionExercise(`session-${NEWEST_ID}-w2-d1`, BENCH!.id, 1, 5),
    sessionExercise(`session-${NEWEST_ID}-w2-d2`, ROW!.id, 1, 5),
    sessionExercise(`session-${NEWEST_ID}-w4-d1`, BENCH!.id, 1, 1),
  ]);

  // The older block, so the dropdown has a second entry and a default that could be got wrong.
  await repos.sessionRepo.createMany([session(OLDER_ID, 1, 1, 'completed')]);
  await repos.sessionExerciseRepo.createMany([
    sessionExercise(`session-${OLDER_ID}-w1-d1`, BENCH!.id, 1, 2),
  ]);

  mockSearchParams = {};
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
      <CopyMesocycleRoute />
    </SafeAreaProvider>,
  );
}

/** Waits for step S to resolve both its defaults, i.e. for Continue to become usable. */
async function readyToContinue() {
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled).toBe(
      false,
    ),
  );
}

describe('CopyMesocycleRoute — step S', () => {
  test('opens unnumbered, titled, with a four-segment bar in front of a three-step editor', async () => {
    renderRoute();
    await readyToContinue();

    expect(screen.getByText('Select a week to copy')).toBeTruthy();
    expect(screen.queryByText(/^Step /)).toBeNull();

    // Continue past it and the numbering starts, counting step S among the four.
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Step 2 of 4')).toBeTruthy();
  });

  test('defaults to the newest finished block and its last working week', async () => {
    renderRoute();
    await readyToContinue();

    expect(screen.getByText('Upper/Lower')).toBeTruthy();
    // Week 4 is the deload and week 3 is the last working week with sessions — untrained, and
    // chosen all the same.
    expect(screen.getByText('Week 3 · 0 of 2 workouts')).toBeTruthy();
  });

  // DoD: an entry point that already knows the block opens on its weeks straight away.
  test('DoD: opens on the block it was given, not the newest one', async () => {
    mockSearchParams = { sourceMesoId: OLDER_ID };
    renderRoute();
    await readyToContinue();

    expect(screen.getByText('Push/Pull')).toBeTruthy();
    expect(screen.getByText('Week 1 · 1 of 1 workout')).toBeTruthy();
  });

  test('switching the block resets the week to that block’s own default', async () => {
    renderRoute();
    await readyToContinue();

    fireEvent.press(screen.getByRole('button', { name: 'Mesocycle' }));
    fireEvent.press(screen.getByRole('button', { name: 'Push/Pull' }));

    expect(await screen.findByText('Week 1 · 1 of 1 workout')).toBeTruthy();
    expect(screen.queryByText(/Week 3/)).toBeNull();
  });
});

describe('CopyMesocycleRoute — prefilled draft', () => {
  // DoD: after choosing a week the draft holds that week's days, exercises and set counts.
  test('DoD: Continue fills the draft from the chosen week', async () => {
    renderRoute();
    await readyToContinue();

    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Step 2 of 4');

    expect(useDraftStore.getState().mesoBuilder).toEqual({
      name: 'Upper/Lower 2',
      lengthWeeks: 4,
      daysPerWeek: 2,
      exercisesByDay: {
        1: [
          { exerciseId: BENCH!.id, order: 1, sets: 3 },
          { exerciseId: SQUAT!.id, order: 2, sets: 4 },
        ],
        2: [{ exerciseId: ROW!.id, order: 1, sets: 2 }],
      },
      source: { mesoId: NEWEST_ID, weekNumber: 3 },
    });
  });

  test('Basics opens on the copied values, with Back to the source week rather than Close', async () => {
    renderRoute();
    await readyToContinue();

    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Step 2 of 4');

    expect(screen.getByDisplayValue('Upper/Lower 2')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  test('stepping back and continuing again keeps what was edited in between', async () => {
    renderRoute();
    await readyToContinue();
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Step 2 of 4');

    fireEvent.changeText(screen.getByDisplayValue('Upper/Lower 2'), 'Block 7');
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Continue' }));

    expect(await screen.findByDisplayValue('Block 7')).toBeTruthy();
  });

  test('picking a different week replaces the draft, edits and all', async () => {
    renderRoute();
    await readyToContinue();
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Step 2 of 4');
    fireEvent.changeText(screen.getByDisplayValue('Upper/Lower 2'), 'Block 7');
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    fireEvent.press(await screen.findByRole('button', { name: 'Week' }));
    const weekTwo = screen.getAllByRole('button', { name: 'Week 2 · 2 of 2 workouts' });
    fireEvent.press(weekTwo[weekTwo.length - 1]!);
    await readyToContinue();
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    await screen.findByDisplayValue('Upper/Lower 2');
    expect(useDraftStore.getState().mesoBuilder.source).toEqual({
      mesoId: NEWEST_ID,
      weekNumber: 2,
    });
    expect(useDraftStore.getState().mesoBuilder.exercisesByDay).toEqual({
      1: [{ exerciseId: BENCH!.id, order: 1, sets: 5 }],
      2: [{ exerciseId: ROW!.id, order: 1, sets: 5 }],
    });
  });
});

describe('CopyMesocycleRoute — Save', () => {
  // DoD: Save creates a mesocycle with a copyWeek origin carrying the week number.
  test('DoD: saves a planned block whose origin records the copied week', async () => {
    renderRoute();
    await readyToContinue();

    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Continue' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Continue' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Save mesocycle' }));

    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith('/mesocycles'));
    await flushQueryNotifications();

    const saved = (await repositories().mesocycleRepo.getAll()).find(
      (mesocycle) => mesocycle.name === 'Upper/Lower 2',
    );
    expect(saved?.status).toBe('planned');
    expect(saved?.origin).toEqual({
      type: 'copyWeek',
      sourceMesoId: NEWEST_ID,
      sourceWeekNumber: 3,
    });
    // Week 1's targets are Start's job, not the editor's — the saved plan carries structure only.
    expect(saved?.weekPlan?.days[0]?.exercises).toEqual([
      { exerciseId: BENCH!.id, order: 1, sets: 3 },
      { exerciseId: SQUAT!.id, order: 2, sets: 4 },
    ]);
    await expect(repositories().sessionRepo.listByMesoId(saved!.id)).resolves.toEqual([]);
    expect(useDraftStore.getState().mesoBuilder).toEqual(DEFAULT_MESO_BUILDER_DRAFT);
  });
});
