import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { toExerciseId, type Exercise } from '@domain/catalog';
import type { SetLog } from '@domain/execution';
import type { ExerciseOverview } from '@domain/exerciseOverview';
import {
  ExerciseDetailScreen,
  type ExerciseDetailScreenProps,
} from '@components/ExerciseDetailScreen';

// SafeAreaView (the screen's own top inset) throws without a provider; initialMetrics resolves it
// synchronously instead of waiting on an onLayout jest never fires.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: toExerciseId('bench-press'),
    name: 'Bench Press',
    muscleGroup: 'chest',
    source: 'catalog',
    isHidden: false,
    ...overrides,
  };
}

function setLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
    id: 'log-1',
    sessionExerciseId: 'se-1',
    exerciseId: 'bench-press',
    setNumber: 1,
    weight: 85,
    reps: 8,
    completedAt: '2026-09-17T11:30:00.000Z',
    ...overrides,
  };
}

function overview(overrides: Partial<ExerciseOverview> = {}): ExerciseOverview {
  return {
    exercise: exercise(),
    stats: {
      bestSet: { weight: 90, reps: 6 },
      sessionCount: 12,
      lastDoneAt: '2026-09-17T11:30:00.000Z',
      setCount: 124,
      mesocycleCount: 3,
    },
    lastSession: {
      weekNumber: 3,
      dayNumber: 2,
      completedAt: '2026-09-17T12:00:00.000Z',
      setLogs: [setLog({ rir: 2 }), setLog({ id: 'log-2', setNumber: 2, reps: 7, rir: 1 })],
    },
    actions: ['hide'],
    ...overrides,
  };
}

function renderScreen(overrides: Partial<ExerciseDetailScreenProps> = {}) {
  const props: ExerciseDetailScreenProps = {
    overview: overview(),
    isPending: false,
    onBack: jest.fn(),
    onOpenMenu: jest.fn(),
    ...overrides,
  };
  const view = render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <ExerciseDetailScreen {...props} />
    </SafeAreaProvider>,
  );
  return { props, view };
}

describe('ExerciseDetailScreen', () => {
  test('heads the screen with the name, its muscle group and the source badge', () => {
    renderScreen();

    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('Chest')).toBeTruthy();
    expect(screen.getByText('Catalog')).toBeTruthy();
  });

  test('a custom exercise is badged as such', () => {
    renderScreen({ overview: overview({ exercise: exercise({ source: 'custom' }) }) });

    expect(screen.getByText('Custom')).toBeTruthy();
  });

  test('shows the three tiles', () => {
    renderScreen();

    expect(screen.getByText('Best set')).toBeTruthy();
    expect(screen.getByText('90×6')).toBeTruthy();
    expect(screen.getByText('Sessions')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('Last done')).toBeTruthy();
  });

  test("lists the last session's sets, each with its RIR", () => {
    renderScreen();

    expect(screen.getByText('Week 3 · Day 2 · 17 Sep')).toBeTruthy();
    expect(screen.getByText('85 kg × 8 · 2 RIR')).toBeTruthy();
    expect(screen.getByText('85 kg × 7 · 1 RIR')).toBeTruthy();
  });

  test('a set with no RIR renders without the tail', () => {
    renderScreen({
      overview: overview({
        lastSession: {
          weekNumber: 1,
          dayNumber: 1,
          completedAt: '2026-09-17T12:00:00.000Z',
          setLogs: [setLog()],
        },
      }),
    });

    expect(screen.getByText('85 kg × 8')).toBeTruthy();
    expect(screen.queryByText(/RIR/)).toBeNull();
  });

  test('carries the all-time counts into the History link', () => {
    renderScreen();

    expect(screen.getByText('Used in 3 mesocycles')).toBeTruthy();
    expect(screen.getByText('124 sets logged all-time')).toBeTruthy();
  });

  test('with nothing logged, the tiles and the last session give way to the empty state', () => {
    renderScreen({ overview: overview({ stats: null, lastSession: null }) });

    expect(screen.getByText('No sets logged yet')).toBeTruthy();
    expect(screen.queryByText('Best set')).toBeNull();
    expect(screen.queryByText('Sessions')).toBeNull();
    expect(screen.queryByTestId('exercise-last-session')).toBeNull();
    expect(screen.queryByText(/sets logged all-time/)).toBeNull();
  });

  test('hides the last-session block when no completed session holds a set', () => {
    renderScreen({ overview: overview({ lastSession: null }) });

    expect(screen.queryByTestId('exercise-last-session')).toBeNull();
    expect(screen.getByText('Best set')).toBeTruthy();
  });

  test('opens on Overview and switches to History on the segmented control', () => {
    renderScreen();

    expect(screen.getByText('Best set')).toBeTruthy();

    fireEvent.press(screen.getByText('History'));

    expect(screen.queryByText('Best set')).toBeNull();
  });

  test('the History link switches to the History tab', () => {
    renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Used in 3 mesocycles' }));

    expect(screen.queryByText('Best set')).toBeNull();
  });

  test('re-entering the screen opens Overview again — the tab is never remembered', () => {
    const { view } = renderScreen();
    fireEvent.press(screen.getByText('History'));
    expect(screen.queryByText('Best set')).toBeNull();

    view.unmount();
    renderScreen();

    expect(screen.getByText('Best set')).toBeTruthy();
  });

  test('back and the menu call their handlers', () => {
    const { props } = renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    fireEvent.press(screen.getByRole('button', { name: 'Exercise menu' }));

    expect(props.onBack).toHaveBeenCalled();
    expect(props.onOpenMenu).toHaveBeenCalled();
  });

  test('shows a loading line while the overview loads', () => {
    renderScreen({ overview: undefined, isPending: true });

    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  test('offers a way back when the exercise does not exist', () => {
    const { props } = renderScreen({ overview: null, isPending: false });

    expect(screen.getByText('Exercise not found')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(props.onBack).toHaveBeenCalled();
  });
});
