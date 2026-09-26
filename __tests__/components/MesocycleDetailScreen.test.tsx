import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import {
  MesocycleDetailScreen,
  type MesocycleDetailScreenProps,
} from '@components/MesocycleDetailScreen';
import { mesocycleDetailMenuItems } from '@components/MesocycleDetailScreenLogic';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
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

function detail(overrides: Partial<MesocycleDetail> = {}): MesocycleDetail {
  return { mesocycle, summary, weekNumber: 4, ...overrides };
}

function renderScreen(props: Partial<MesocycleDetailScreenProps> = {}) {
  const shown = props.detail === undefined ? detail() : props.detail;
  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <MesocycleDetailScreen
        detail={shown}
        isPending={false}
        onBack={jest.fn()}
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
        mesocycle: { ...mesocycle, status: 'abandoned', completedAt: '2026-08-20T12:00:00.000Z' },
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
});
