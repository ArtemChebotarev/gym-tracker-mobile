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
        roundLogs: [],
        setLogs: [setLog({ rir: 2 }), setLog({ id: 'log-2', setNumber: 2, reps: 7, rir: 1 })],
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
    onWatchHowTo: jest.fn(),
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

  test('a strength exercise has no type chip and no settings, as on canvas 4.5', () => {
    renderScreen();

    expect(screen.queryByText('Strength')).toBeNull();
    expect(screen.queryByText('Settings')).toBeNull();
  });

  test('a non-strength exercise names its type between the group and the equipment', () => {
    renderScreen({
      overview: overview({
        exercise: exercise({
          name: 'Medball slam',
          muscleGroup: 'fullBody',
          type: 'power',
          config: { type: 'power', load: 'weight', noHeavierAvailable: false },
          equipment: 'medicine-ball',
        }),
      }),
    });

    const rendered = JSON.stringify(screen.toJSON());
    const order = ['Full body', 'Power', 'Medicine ball', 'Catalog'].map((label) =>
      rendered.indexOf(`"${label}"`),
    );
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  test('the equipment chip shows for every type with equipment, and only then', () => {
    renderScreen({ overview: overview({ exercise: exercise({ equipment: 'barbell' }) }) });
    expect(screen.getByText('Barbell')).toBeTruthy();
  });

  test("does not repeat any session — Last session and Earlier are History's now", () => {
    renderScreen();

    expect(screen.queryByText('Last session')).toBeNull();
    expect(screen.queryByText('Earlier')).toBeNull();
    expect(screen.queryByText('Set 1')).toBeNull();
  });

  test('History keeps what Last session showed: every set with its RIR', () => {
    renderScreen();

    fireEvent.press(screen.getByText('History'));

    expect(screen.getByText('Set 1')).toBeTruthy();
    expect(screen.getByText('Set 2')).toBeTruthy();
    // The RIR is its own quieter Text inside the value's — a query sees the two as one line.
    expect(screen.getByText('85 kg × 8 · 2 RIR')).toBeTruthy();
    expect(screen.getByText('85 kg × 7 · 1 RIR')).toBeTruthy();
  });

  test('an interval exercise drops the Best set tile', () => {
    renderScreen({
      overview: overview({
        exercise: exercise({ type: 'interval' }),
        stats: { bestSet: null, sessionCount: 2, lastDoneAt: '2026-09-17T11:30:00.000Z' },
      }),
    });

    expect(screen.queryByText('Best set')).toBeNull();
    expect(screen.getByText('Sessions')).toBeTruthy();
    expect(screen.getByText('Last done')).toBeTruthy();
  });

  test('with nothing logged, the tiles give way to the framed empty state', () => {
    renderScreen({ overview: overview({ stats: null }), history: [] });

    expect(screen.getByText('No sets logged yet')).toBeTruthy();
    expect(screen.getByText('Highlights show up after your first workout.')).toBeTruthy();
    expect(screen.queryByText('Best set')).toBeNull();
    expect(screen.queryByText('Sessions')).toBeNull();
  });

  test('the empty state answers the History tab too — no sets means no history', () => {
    renderScreen({
      overview: overview({ stats: null }),
      history: [],
    });

    fireEvent.press(screen.getByText('History'));

    expect(screen.getByText('No sets logged yet')).toBeTruthy();
  });

  test('opens on Overview and switches to History on the segmented control', () => {
    renderScreen();

    expect(screen.getByText('Best set')).toBeTruthy();

    fireEvent.press(screen.getByText('History'));

    expect(screen.queryByText('Best set')).toBeNull();
    expect(screen.getByText('Upper/Lower')).toBeTruthy();
  });

  test('has no See full history link — the History tab is right there', () => {
    renderScreen();

    expect(screen.queryByText('See full history')).toBeNull();
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

  test('offers Watch how to perform exercise on Overview, and pressing it reports so', () => {
    const { props } = renderScreen();

    fireEvent.press(screen.getByText('Watch how to perform exercise'));

    expect(props.onWatchHowTo).toHaveBeenCalledTimes(1);
  });

  test('offers Watch how to perform exercise on the empty state too', () => {
    const { props } = renderScreen({
      overview: overview({ stats: null }),
      history: [],
    });

    fireEvent.press(screen.getByText('Watch how to perform exercise'));

    expect(props.onWatchHowTo).toHaveBeenCalledTimes(1);
  });

  test("on the empty state the note keeps the tiles' place, How to perform under it", () => {
    renderScreen({ overview: overview({ stats: null }), history: [] });

    const rendered = JSON.stringify(screen.toJSON());

    expect(rendered.indexOf('No sets logged yet')).toBeGreaterThan(-1);
    expect(rendered.indexOf('No sets logged yet')).toBeLessThan(rendered.indexOf('How to perform'));
    expect(rendered.indexOf('How to perform')).toBeLessThan(
      rendered.indexOf('Watch how to perform exercise'),
    );
  });

  test('has no Watch how to perform exercise on the History tab, populated or empty', () => {
    const populated = renderScreen();
    fireEvent.press(screen.getByText('History'));
    expect(screen.queryByText('Watch how to perform exercise')).toBeNull();
    populated.view.unmount();

    renderScreen({ overview: overview({ stats: null }), history: [] });
    fireEvent.press(screen.getByText('History'));
    expect(screen.queryByText('Watch how to perform exercise')).toBeNull();
  });
});
