import { fireEvent, render, screen, within } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { MesoOverviewSheet, type MesoOverviewSheetProps } from '@components/MesoOverviewSheet';
import { COLORS } from '@design/tokens';
import type { MesoGrid } from '@domain/mesoGrid';

// BottomSheet's SafeAreaView throws without a SafeAreaProvider ancestor.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

// Every cell state at once: week 1 done but for a skipped day, week 2 in progress with a ready day
// after it, and the deload week not programmed yet but for its first day.
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

function flatStyle(element: ReturnType<typeof screen.getByTestId>) {
  const { style } = element.props;
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

function makeProps(overrides: Partial<MesoOverviewSheetProps> = {}): MesoOverviewSheetProps {
  return {
    visible: true,
    onClose: jest.fn(),
    grid: GRID,
    openDay: { weekNumber: 2, dayNumber: 1 },
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

  test('labels only the deload week with Deload', () => {
    renderWithSafeArea(<MesoOverviewSheet {...makeProps()} />);

    expect(within(screen.getByTestId('meso-grid-week-3')).getByText('Deload')).toBeTruthy();
    expect(screen.getAllByText('Deload')).toHaveLength(1);
  });

  test('DoD 107: a finished day is filled, everything left to do is an outline', () => {
    renderWithSafeArea(<MesoOverviewSheet {...makeProps()} />);

    const frame = (week: number, day: number) =>
      flatStyle(screen.getByTestId(`meso-grid-cell-${week}-${day}`));

    // Completed and skipped look alike — both are behind you.
    for (const [week, day] of [
      [1, 1],
      [1, 2],
      [1, 3],
    ]) {
      expect(frame(week as number, day as number)).toMatchObject({
        backgroundColor: COLORS['surface/cell-done'],
      });
    }

    // in_progress, ready and awaiting look alike — all still to do.
    for (const [week, day] of [
      [2, 1],
      [2, 2],
      [2, 3],
      [3, 2],
    ]) {
      expect(frame(week as number, day as number)).toMatchObject({
        borderColor: COLORS['border/cell-quiet'],
      });
      expect(frame(week as number, day as number).backgroundColor).toBeUndefined();
    }
  });

  test('DoD 107: no cell carries a day number — the column header says the day', () => {
    renderWithSafeArea(<MesoOverviewSheet {...makeProps()} />);

    for (const [week, day] of [
      [1, 1],
      [2, 1],
      [2, 2],
      [3, 2],
    ]) {
      expect(
        within(screen.getByTestId(`meso-grid-cell-${week}-${day}`)).queryByText(/./),
      ).toBeNull();
    }
    expect(screen.getByText('Day 2')).toBeTruthy();
  });

  test('DoD 107: every status still reaches a screen reader', () => {
    renderWithSafeArea(<MesoOverviewSheet {...makeProps()} />);

    for (const name of [
      'Week 1 Day 2, skipped',
      'Week 2 Day 1, in progress',
      'Week 2 Day 2, ready',
      'Week 3 Day 2, not programmed yet',
    ]) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
  });

  test('rings only the day the workout screen has open', () => {
    renderWithSafeArea(<MesoOverviewSheet {...makeProps()} />);

    const rings = screen.getAllByTestId('meso-grid-open-ring');
    expect(rings).toHaveLength(1);
    expect(
      within(screen.getByTestId('meso-grid-cell-2-1')).getByTestId('meso-grid-open-ring'),
    ).toBe(rings[0]);
  });

  test('DoD 107: no legend — three looks this far apart need no key', () => {
    renderWithSafeArea(<MesoOverviewSheet {...makeProps()} />);

    for (const gone of [
      'Done',
      'Left to do',
      'Open now',
      'Completed',
      'In progress',
      'Ready',
      'Not programmed yet',
      'Skipped',
    ]) {
      expect(screen.queryByText(gone)).toBeNull();
    }
  });

  test('every cell is pressable and hands itself over', () => {
    const onOpenCell = jest.fn();
    renderWithSafeArea(<MesoOverviewSheet {...makeProps({ onOpenCell })} />);

    fireEvent.press(screen.getByRole('button', { name: 'Week 3 Day 2, not programmed yet' }));
    fireEvent.press(screen.getByRole('button', { name: 'Week 1 Day 1, completed' }));

    expect(onOpenCell).toHaveBeenNthCalledWith(1, GRID.weeks[2]?.cells[1]);
    expect(onOpenCell).toHaveBeenNthCalledWith(2, GRID.weeks[0]?.cells[0]);
  });

  test('says it is loading until the grid arrives', () => {
    renderWithSafeArea(<MesoOverviewSheet {...makeProps({ grid: undefined })} />);

    expect(screen.getByText('Loading…')).toBeTruthy();
  });
});
