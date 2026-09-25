import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { MesoGrid as MesoGridBody, type MesoGridProps } from '@components/MesoGrid';
import { BORDER_WIDTHS, COLORS, OPACITY } from '@design/tokens';
import type { MesoGrid } from '@domain/mesoGrid';

// Every cell look at once: week 1 trained but for a skipped day, week 2 in progress with a ready
// day after it, and the deload week not programmed yet but for its first day.
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

// A block stopped mid-week 2 (08.9): everything the Stop closed is `skipped`, and the days after it
// never got a session at all.
const STOPPED_GRID: MesoGrid = {
  ...GRID,
  weeks: [
    GRID.weeks[0] as MesoGrid['weeks'][number],
    {
      weekNumber: 2,
      isDeload: false,
      cells: [
        { weekNumber: 2, dayNumber: 1, status: 'completed', sessionId: 's-2-1' },
        { weekNumber: 2, dayNumber: 2, status: 'skipped', sessionId: 's-2-2' },
        { weekNumber: 2, dayNumber: 3, status: 'awaiting' },
      ],
    },
    {
      weekNumber: 3,
      isDeload: true,
      cells: [
        { weekNumber: 3, dayNumber: 1, status: 'awaiting' },
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

function cellStyle(week: number, day: number) {
  return flatStyle(screen.getByTestId(`meso-grid-cell-${week}-${day}`));
}

function makeProps(overrides: Partial<MesoGridProps> = {}): MesoGridProps {
  return {
    grid: GRID,
    openSessionId: 's-2-1',
    onCellPress: jest.fn(),
    ...overrides,
  };
}

describe('MesoGrid', () => {
  test('DoD 127: matches the snapshot of a grid with all four cell states', () => {
    render(<MesoGridBody {...makeProps()} />);

    expect(screen.toJSON()).toMatchSnapshot();
  });

  test('DoD 127: matches the snapshot with Open over a Done cell', () => {
    render(<MesoGridBody {...makeProps({ openSessionId: 's-1-1' })} />);

    expect(screen.toJSON()).toMatchSnapshot();
  });

  test('DoD 127: matches the snapshot of a stopped block — a Skip tail and dimmed empty cells', () => {
    render(<MesoGridBody {...makeProps({ grid: STOPPED_GRID, openSessionId: undefined, dimsEmptyCells: true })} />);

    expect(screen.toJSON()).toMatchSnapshot();
  });

  test('labels only the deload week with Deload', () => {
    render(<MesoGridBody {...makeProps()} />);

    expect(within(screen.getByTestId('meso-grid-week-3')).getByText('Deload')).toBeTruthy();
    expect(screen.getAllByText('Deload')).toHaveLength(1);
  });

  test('DoD 127: a trained day is an accent fill with a check', () => {
    render(<MesoGridBody {...makeProps()} />);

    for (const [week, day] of [
      [1, 1],
      [1, 3],
    ] as const) {
      expect(cellStyle(week, day)).toMatchObject({
        backgroundColor: COLORS['accent/bg'],
        borderColor: COLORS['accent/border'],
        borderWidth: BORDER_WIDTHS['border/default'],
      });
      expect(within(screen.getByTestId(`meso-grid-cell-${week}-${day}`)).queryByText(/./)).toBeNull();
    }
  });

  test('DoD 127: a completed session with only some sets logged is still Done', () => {
    // The grid only ever sees `completed` for such a session (08.7) — there is no half-done look.
    render(
      <MesoGridBody
        {...makeProps({
          grid: {
            ...GRID,
            weeks: [
              {
                weekNumber: 1,
                isDeload: false,
                cells: [{ weekNumber: 1, dayNumber: 1, status: 'completed', sessionId: 'partial' }],
              },
            ],
          },
          openSessionId: undefined,
        })}
      />,
    );

    expect(cellStyle(1, 1)).toMatchObject({ backgroundColor: COLORS['accent/bg'] });
    expect(screen.queryByText('Skip')).toBeNull();
  });

  test('DoD 127: a skipped day says Skip, struck through, with no fill and no outline', () => {
    render(<MesoGridBody {...makeProps()} />);

    const skipped = screen.getByTestId('meso-grid-cell-1-2');
    expect(within(skipped).getByText('Skip')).toBeTruthy();
    expect(screen.getAllByText('Skip')).toHaveLength(1);

    expect(flatStyle(within(skipped).getByText('Skip'))).toMatchObject({
      color: COLORS['text/muted'],
      textDecorationLine: 'line-through',
    });

    const frame = cellStyle(1, 2);
    expect(frame.backgroundColor).toBeUndefined();
    expect(frame.borderColor).toBe('transparent');
  });

  test('DoD 127: everything left to do is a plain outline, programmed or not', () => {
    render(<MesoGridBody {...makeProps()} />);

    for (const [week, day] of [
      [2, 2],
      [2, 3],
      [3, 1],
      [3, 2],
    ] as const) {
      expect(cellStyle(week, day)).toMatchObject({
        borderColor: COLORS['border/cell-quiet'],
        borderWidth: BORDER_WIDTHS['border/default'],
      });
      expect(cellStyle(week, day).backgroundColor).toBeUndefined();
    }
  });

  test('DoD 127: Open is the cell’s own accent outline, over Done and over Left to do alike', () => {
    render(<MesoGridBody {...makeProps({ openSessionId: 's-1-1' })} />);

    expect(cellStyle(1, 1)).toMatchObject({
      backgroundColor: COLORS['accent/bg'],
      borderColor: COLORS.accent,
      borderWidth: BORDER_WIDTHS['border/emphasis'],
    });

    screen.rerender(<MesoGridBody {...makeProps({ openSessionId: 's-2-2' })} />);

    expect(cellStyle(2, 2)).toMatchObject({
      borderColor: COLORS.accent,
      borderWidth: BORDER_WIDTHS['border/emphasis'],
    });
    expect(cellStyle(2, 2).backgroundColor).toBeUndefined();
  });

  test('DoD 127: only one cell is open, and it is the one whose session is open', () => {
    render(<MesoGridBody {...makeProps()} />);

    const open = screen
      .getAllByRole('button')
      .filter((cell) => cell.props.accessibilityState?.selected === true);
    expect(open).toHaveLength(1);
    expect(open[0]).toBe(screen.getByTestId('meso-grid-cell-2-1'));
  });

  test('DoD 127: taking Open away leaves the cell exactly the same size', () => {
    // A React Native border is drawn inside the box, so the 1pt → 2pt swap moves nothing. The
    // replaced design hung a ring outside the cell, which did.
    render(<MesoGridBody {...makeProps({ openSessionId: 's-2-2' })} />);
    const { borderColor: _open, borderWidth: __open, ...openGeometry } = cellStyle(2, 2);

    screen.rerender(<MesoGridBody {...makeProps({ openSessionId: undefined })} />);
    const { borderColor: _closed, borderWidth: __closed, ...closedGeometry } = cellStyle(2, 2);

    expect(openGeometry).toEqual(closedGeometry);
    // And the swap really is only the outline, not a second element laid over the cell.
    expect(within(screen.getByTestId('meso-grid-cell-2-2')).queryByText(/./)).toBeNull();
  });

  test('DoD 127: no cell carries a day number — the column header says the day', () => {
    render(<MesoGridBody {...makeProps()} />);

    for (const [week, day] of [
      [1, 1],
      [2, 1],
      [2, 2],
      [3, 2],
    ] as const) {
      expect(
        within(screen.getByTestId(`meso-grid-cell-${week}-${day}`)).queryByText(/./),
      ).toBeNull();
    }
    expect(screen.getByText('Day 2')).toBeTruthy();
  });

  test('DoD 107: every status still reaches a screen reader', () => {
    render(<MesoGridBody {...makeProps()} />);

    for (const name of [
      'Week 1 Day 1, completed',
      'Week 1 Day 2, skipped',
      'Week 2 Day 1, in progress',
      'Week 2 Day 2, ready',
      'Week 3 Day 2, not programmed yet',
    ]) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
  });

  test('DoD 107: no legend — three looks this far apart need no key', () => {
    render(<MesoGridBody {...makeProps()} />);

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
    const onCellPress = jest.fn();
    render(<MesoGridBody {...makeProps({ onCellPress })} />);

    fireEvent.press(screen.getByRole('button', { name: 'Week 3 Day 2, not programmed yet' }));
    fireEvent.press(screen.getByRole('button', { name: 'Week 1 Day 1, completed' }));

    expect(onCellPress).toHaveBeenNthCalledWith(1, GRID.weeks[2]?.cells[1]);
    expect(onCellPress).toHaveBeenNthCalledWith(2, GRID.weeks[0]?.cells[0]);
  });

  test('DoD 127: a stopped block dims the days with no session and does not open them', () => {
    const onCellPress = jest.fn();
    render(
      <MesoGridBody
        {...makeProps({
          grid: STOPPED_GRID,
          openSessionId: undefined,
          dimsEmptyCells: true,
          onCellPress,
        })}
      />,
    );

    expect(cellStyle(3, 1)).toMatchObject({ opacity: OPACITY['opacity/dimmed'] });
    expect(screen.getByTestId('meso-grid-cell-3-1').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    fireEvent.press(screen.getByTestId('meso-grid-cell-3-1'));
    expect(onCellPress).not.toHaveBeenCalled();

    // The days the Stop closed still open — they were trained, or skipped with the block.
    expect(cellStyle(2, 2).opacity).toBeUndefined();
    fireEvent.press(screen.getByTestId('meso-grid-cell-2-2'));
    expect(onCellPress).toHaveBeenCalledWith(STOPPED_GRID.weeks[1]?.cells[1]);
  });
});
