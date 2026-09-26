import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import {
  MesocycleDetailScreen,
  type MesocycleDetailScreenProps,
} from '@components/MesocycleDetailScreen';
import { mesocycleDetailMenuItems } from '@components/MesocycleDetailScreenLogic';
import type { Session } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { buildMesoGrid } from '@domain/mesoGridBuilders';
import type { MesoSummary } from '@domain/mesoSummary';
import type { MesocycleDetail } from '@usecases/mesocycleDetail';
import { STAMPS } from '../fixtures/stamps';

// SafeAreaView (the screen's own top inset) throws without a provider; initialMetrics resolves it
// synchronously instead of waiting on an onLayout jest never fires.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

// Midday UTC, so the dates read the same in any time zone the tests run in.
const mesocycle: Mesocycle = {
  ...STAMPS,
  id: 'meso',
  name: 'Upper/lower',
  lengthWeeks: 4,
  daysPerWeek: 2,
  startDate: '2026-08-03T12:00:00.000Z',
  completedAt: '2026-08-30T12:00:00.000Z',
  status: 'completed',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
};

const summary: MesoSummary = {
  workouts: { value: 7, total: 8 },
  strengthSets: 96,
  weeks: { value: 4, total: 4 },
  weeklySets: [
    { muscleGroup: 'chest', sets: [10, 12, 13, 6] },
    { muscleGroup: 'back', sets: [12, 14, 15, 8] },
    { muscleGroup: 'hamstrings', sets: [2, 0, 4, 0] },
  ],
};

function session(week: number, day: number, status: Session['status']): Session {
  return {
    ...STAMPS,
    id: `w${week}d${day}`,
    mesoId: 'meso',
    weekNumber: week,
    dayNumber: day,
    isDeload: week === 4,
    prescriptionStatus: 'ready',
    status,
  };
}

// Every day of the block trained but week 3 day 2, which was skipped.
const allSessions = [1, 2, 3, 4].flatMap((week) =>
  [1, 2].map((day) => session(week, day, week === 3 && day === 2 ? 'skipped' : 'completed')),
);

// Stopped in week 3: day 1 trained, day 2 closed as skipped by the Stop; week 4 never came.
const stoppedSessions = [
  ...allSessions.filter((one) => one.weekNumber < 3),
  session(3, 1, 'completed'),
  session(3, 2, 'skipped'),
];

function detail(overrides: Partial<MesocycleDetail> = {}): MesocycleDetail {
  const shown = overrides.mesocycle ?? mesocycle;
  const sessions = shown.status === 'abandoned' ? stoppedSessions : allSessions;
  return {
    mesocycle: shown,
    summary,
    weekNumber: 4,
    grid: buildMesoGrid(shown, sessions),
    ...overrides,
  };
}

const stopped = { ...mesocycle, status: 'abandoned' as const, completedAt: '2026-08-20T12:00:00.000Z' };

function renderScreen(props: Partial<MesocycleDetailScreenProps> = {}) {
  const shown = props.detail === undefined ? detail() : props.detail;
  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <MesocycleDetailScreen
        detail={shown}
        isPending={false}
        onBack={jest.fn()}
        onOpenSession={jest.fn()}
        menuItems={mesocycleDetailMenuItems(shown?.mesocycle.status ?? 'completed', {
          onRename: jest.fn(),
          onCopy: jest.fn(),
        })}
        {...props}
      />
    </SafeAreaProvider>,
  );
}

describe('MesocycleDetailScreen', () => {
  test('Completed: no badge, both denominators, the weekly sets card', () => {
    renderScreen();

    expect(screen.getByText('Upper/lower')).toBeTruthy();
    expect(screen.queryByText('Active')).toBeNull();
    expect(screen.queryByText('Stopped')).toBeNull();
    expect(screen.getByText('4 weeks · 3 Aug – 30 Aug')).toBeTruthy();
    expect(screen.getByText('7 / 8')).toBeTruthy();
    expect(screen.getByText('96')).toBeTruthy();
    expect(screen.getByText('4 / 4')).toBeTruthy();
    expect(screen.getByText('Hamstrings')).toBeTruthy();
    expect(screen.toJSON()).toMatchSnapshot();
  });

  test('Stopped: the Stopped badge and no workouts denominator', () => {
    renderScreen({
      detail: detail({
        mesocycle: stopped,
        summary: { ...summary, workouts: { value: 5 }, weeks: { value: 3, total: 4 } },
        weekNumber: 3,
      }),
    });

    expect(screen.getByText('Stopped')).toBeTruthy();
    expect(screen.getByText('Stopped in week 3 · 3 Aug – 20 Aug')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('3 / 4')).toBeTruthy();
    expect(screen.toJSON()).toMatchSnapshot();
  });

  test('Active: the Active badge and the week by workouts', () => {
    renderScreen({
      detail: detail({
        mesocycle: { ...mesocycle, status: 'active', completedAt: undefined },
        summary: { ...summary, workouts: { value: 4, total: 8 }, weeks: { value: 3, total: 4 } },
        weekNumber: 3,
      }),
    });

    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Week 3 of 4 · started 3 Aug')).toBeTruthy();
    expect(screen.getByText('4 / 8')).toBeTruthy();
    expect(screen.toJSON()).toMatchSnapshot();
  });

  test('a block without a single set says so instead of the card', () => {
    renderScreen({
      detail: detail({
        mesocycle: { ...mesocycle, status: 'abandoned' },
        summary: {
          workouts: { value: 0 },
          strengthSets: 0,
          weeks: { value: 1, total: 4 },
          weeklySets: [],
        },
        weekNumber: 1,
      }),
    });

    expect(screen.getByText('No sets logged in this block')).toBeTruthy();
    expect(screen.queryByTestId('weekly-sets')).toBeNull();
  });

  test('never shows tonnage', () => {
    renderScreen();

    expect(screen.queryByText(/tonnage|\bkg\b/i)).toBeNull();
  });

  test('a missing mesocycle: EmptyState whose action goes back', () => {
    const onBack = jest.fn();
    renderScreen({ detail: null, onBack });

    expect(screen.getByText('Mesocycle not found')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(onBack).toHaveBeenCalled();
  });

  test('while loading, only the back button and a loading line', () => {
    renderScreen({ detail: undefined, isPending: true });

    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByText('Upper/lower')).toBeNull();
  });

  describe('the workout grid (130)', () => {
    test.each([
      ['completed', mesocycle],
      ['abandoned', stopped],
    ] as const)('a %s block has it', (_status, shown) => {
      renderScreen({ detail: detail({ mesocycle: shown }) });

      // The tile and the section share the name.
      expect(screen.getAllByText('Workouts')).toHaveLength(2);
      expect(screen.getByText('tap to open')).toBeTruthy();
      expect(screen.getByTestId('meso-grid-cell-1-1')).toBeTruthy();
    });

    test('an active block has none — its workout screen carries it', () => {
      renderScreen({
        detail: detail({ mesocycle: { ...mesocycle, status: 'active', completedAt: undefined } }),
      });

      expect(screen.queryByText('tap to open')).toBeNull();
      expect(screen.queryByTestId('meso-grid-cell-1-1')).toBeNull();
    });

    test('a cell with a session opens that session — a skipped one included', () => {
      const onOpenSession = jest.fn();
      renderScreen({ detail: detail({ mesocycle: stopped }), onOpenSession });

      fireEvent.press(screen.getByTestId('meso-grid-cell-2-1'));
      fireEvent.press(screen.getByTestId('meso-grid-cell-3-2'));

      expect(onOpenSession.mock.calls).toEqual([['w2d1'], ['w3d2']]);
    });

    test('a cell without a session opens nothing', () => {
      const onOpenSession = jest.fn();
      renderScreen({ detail: detail({ mesocycle: stopped }), onOpenSession });

      fireEvent.press(screen.getByTestId('meso-grid-cell-4-1'));

      expect(onOpenSession).not.toHaveBeenCalled();
    });
  });
});
