import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { HideIcon } from '@design/icons/HideIcon';
import { toExerciseId, type Exercise } from '@domain/catalog';
import type { SetLog } from '@domain/execution';
import type { ExerciseHistoryMesocycle } from '@domain/exerciseHistory';
import type { ExerciseOverview } from '@domain/exerciseOverview';
import {
  ExerciseDetailScreen,
  type ExerciseDetailScreenProps,
} from '@components/ExerciseDetailScreen';
import { STAMPS } from '../fixtures/stamps';

// SafeAreaView (the screen's own top inset) throws without a provider; initialMetrics resolves it
// synchronously instead of waiting on an onLayout jest never fires.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    ...STAMPS,
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
    ...STAMPS,
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
      sessionCount: 14,
      lastDoneAt: '2026-09-17T11:30:00.000Z',
    },
    lastSession: {
      weekNumber: 3,
      dayNumber: 2,
      completedAt: '2026-09-17T12:00:00.000Z',
      setLogs: [setLog({ rir: 2 }), setLog({ id: 'log-2', setNumber: 2, reps: 7, rir: 1 })],
    },
    earlierSessions: [
      {
        weekNumber: 2,
        dayNumber: 1,
        completedAt: '2026-08-03T12:00:00.000Z',
        bestSet: { weight: 80, reps: 8 },
        setCount: 3,
      },
    ],
    actions: ['hide'],
    ...overrides,
  };
}

const HISTORY: ExerciseHistoryMesocycle[] = [
  {
    mesoId: 'meso-1',
    name: 'Upper/Lower',
    sessions: [
      {
        id: 'log-1',
        weekNumber: 3,
        dayNumber: 2,
        completedAt: '2026-09-17T12:00:00.000Z',
        setLogs: [setLog({ rir: 2 })],
      },
    ],
  },
];

function renderScreen(overrides: Partial<ExerciseDetailScreenProps> = {}) {
  const props: ExerciseDetailScreenProps = {
    overview: overview(),
    isPending: false,
    history: HISTORY,
    isHistoryPending: false,
    onBack: jest.fn(),
    menuItems: [],
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
    expect(screen.getByText('14')).toBeTruthy();
    expect(screen.getByText('Last done')).toBeTruthy();
  });

  test("labels the last session's block with its week, day and date", () => {
    renderScreen();

    expect(screen.getByText('Last session')).toBeTruthy();
    expect(screen.getByText('Week 3 · Day 2 · 17 Sep')).toBeTruthy();
  });

  test("lists the last session's sets, each with its RIR", () => {
    renderScreen();

    expect(screen.getByText('Set 1')).toBeTruthy();
    expect(screen.getByText('Set 2')).toBeTruthy();
    // The RIR is its own quieter Text inside the value's — a query sees the two as one line.
    expect(screen.getByText('85 kg × 8 · 2 RIR')).toBeTruthy();
    expect(screen.getByText('85 kg × 7 · 1 RIR')).toBeTruthy();
  });

  test('lists the earlier sessions by their heaviest set and set count', () => {
    renderScreen();

    expect(screen.getByText('Earlier')).toBeTruthy();
    expect(screen.getByText('W2 · D1 · 3 Aug')).toBeTruthy();
    expect(screen.getByText('80 × 8 · 3 sets')).toBeTruthy();
  });

  test('hides the Earlier block when the exercise was only ever done once', () => {
    renderScreen({ overview: overview({ earlierSessions: [] }) });

    expect(screen.queryByTestId('exercise-earlier-sessions')).toBeNull();
    expect(screen.getByTestId('exercise-last-session')).toBeTruthy();
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
        earlierSessions: [],
      }),
    });

    expect(screen.getByText('85 kg × 8')).toBeTruthy();
    expect(screen.queryByText(/RIR/)).toBeNull();
  });

  test('with nothing logged, the tiles and the last session give way to the empty state', () => {
    renderScreen({
      overview: overview({ stats: null, lastSession: null, earlierSessions: [] }),
      history: [],
    });

    expect(screen.getByText('No sets logged yet')).toBeTruthy();
    expect(screen.queryByText('Best set')).toBeNull();
    expect(screen.queryByText('Sessions')).toBeNull();
    expect(screen.queryByTestId('exercise-last-session')).toBeNull();
    expect(screen.queryByTestId('exercise-earlier-sessions')).toBeNull();
    expect(screen.queryByText('See full history')).toBeNull();
  });

  test('the empty state answers the History tab too — no sets means no history', () => {
    renderScreen({
      overview: overview({ stats: null, lastSession: null, earlierSessions: [] }),
      history: [],
    });

    fireEvent.press(screen.getByText('History'));

    expect(screen.getByText('No sets logged yet')).toBeTruthy();
  });

  test('hides the last-session block when no completed session holds a set', () => {
    renderScreen({ overview: overview({ lastSession: null, earlierSessions: [] }) });

    expect(screen.queryByTestId('exercise-last-session')).toBeNull();
    expect(screen.getByText('Best set')).toBeTruthy();
  });

  test('opens on Overview and switches to History on the segmented control', () => {
    renderScreen();

    expect(screen.getByText('Best set')).toBeTruthy();

    fireEvent.press(screen.getByText('History'));

    expect(screen.queryByText('Best set')).toBeNull();
    expect(screen.getByText('Upper/Lower')).toBeTruthy();
  });

  test('See full history switches to the History tab', () => {
    renderScreen();

    fireEvent.press(screen.getByText('See full history'));

    expect(screen.queryByText('Best set')).toBeNull();
    expect(screen.getByText('Upper/Lower')).toBeTruthy();
  });

  test('reports the switch so the caller can start loading the history', () => {
    const onTabChange = jest.fn();
    renderScreen({ onTabChange });

    fireEvent.press(screen.getByText('History'));
    expect(onTabChange).toHaveBeenCalledWith('history');

    fireEvent.press(screen.getByText('Overview'));
    expect(onTabChange).toHaveBeenLastCalledWith('overview');
  });

  test('the History tab waits on its own read', () => {
    renderScreen({ history: undefined, isHistoryPending: true });

    fireEvent.press(screen.getByText('History'));

    expect(screen.getByText('Loading…')).toBeTruthy();
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
    const onPress = jest.fn();
    const { props } = renderScreen({
      menuItems: [
        { key: 'hide', label: 'Hide', icon: HideIcon, systemImage: 'eye.slash', onPress },
      ],
    });

    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    fireEvent(screen.getByTestId('action-menu-hide'), 'buttonPress');

    expect(props.onBack).toHaveBeenCalled();
    expect(onPress).toHaveBeenCalled();
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
