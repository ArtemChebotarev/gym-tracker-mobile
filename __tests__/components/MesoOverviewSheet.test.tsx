import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { MesoOverviewSheet, type MesoOverviewSheetProps } from '@components/MesoOverviewSheet';
import type { MesoGrid } from '@domain/mesoGrid';

// BottomSheet's SafeAreaView throws without a SafeAreaProvider ancestor.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

// The cells themselves belong to `MesoGrid` (task 127) and are covered by its own test; what this
// sheet still owns is the chrome around them and the wiring into it.
const GRID: MesoGrid = {
  mesoId: 'meso-1',
  name: 'Upper/lower',
  lengthWeeks: 3,
  daysPerWeek: 3,
  currentWeekNumber: 2,
  weeks: [
    {
      weekNumber: 1,
      isDeload: false,
      cells: [
        { weekNumber: 1, dayNumber: 1, status: 'completed', sessionId: 's-1-1' },
        { weekNumber: 1, dayNumber: 2, status: 'skipped', sessionId: 's-1-2' },
        { weekNumber: 1, dayNumber: 3, status: 'completed', sessionId: 's-1-3' },
      ],
    },
    {
      weekNumber: 2,
      isDeload: false,
      cells: [
        { weekNumber: 2, dayNumber: 1, status: 'in_progress', sessionId: 's-2-1' },
        { weekNumber: 2, dayNumber: 2, status: 'ready', sessionId: 's-2-2' },
        { weekNumber: 2, dayNumber: 3, status: 'awaiting', sessionId: 's-2-3' },
      ],
    },
    {
      weekNumber: 3,
      isDeload: true,
      cells: [
        { weekNumber: 3, dayNumber: 1, status: 'ready', sessionId: 's-3-1' },
        { weekNumber: 3, dayNumber: 2, status: 'awaiting' },
        { weekNumber: 3, dayNumber: 3, status: 'awaiting' },
      ],
    },
  ],
};

function makeProps(overrides: Partial<MesoOverviewSheetProps> = {}): MesoOverviewSheetProps {
  return {
    visible: true,
    onClose: jest.fn(),
    grid: GRID,
    openSessionId: 's-2-1',
    onOpenCell: jest.fn(),
    ...overrides,
  };
}

describe('MesoOverviewSheet', () => {
  test('DoD: matches the snapshot of a grid with every cell state', () => {
    renderWithSafeArea(<MesoOverviewSheet {...makeProps()} />);

    expect(screen.toJSON()).toMatchSnapshot();
  });

  test('titles the sheet with the mesocycle and its current week', () => {
    renderWithSafeArea(<MesoOverviewSheet {...makeProps()} />);

    expect(screen.getByText('Upper/lower')).toBeTruthy();
    expect(screen.getByText('Week 2 of 3 · 3 days a week')).toBeTruthy();
  });

  test('DoD 127: draws the shared grid, and marks the open session in it', () => {
    renderWithSafeArea(<MesoOverviewSheet {...makeProps()} />);

    expect(screen.getByTestId('meso-grid-week-3')).toBeTruthy();
    expect(screen.getByTestId('meso-grid-cell-2-1').props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByTestId('meso-grid-cell-2-2').props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  test('DoD 127: every cell stays pressable here — a day not programmed yet opens in preview', () => {
    const onOpenCell = jest.fn();
    renderWithSafeArea(<MesoOverviewSheet {...makeProps({ onOpenCell })} />);

    fireEvent.press(screen.getByRole('button', { name: 'Week 3 Day 2, not programmed yet' }));

    expect(onOpenCell).toHaveBeenCalledWith(GRID.weeks[2]?.cells[1]);
  });

  test('says it is loading until the grid arrives', () => {
    renderWithSafeArea(<MesoOverviewSheet {...makeProps({ grid: undefined })} />);

    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByTestId('meso-grid-week-1')).toBeNull();
  });
});
