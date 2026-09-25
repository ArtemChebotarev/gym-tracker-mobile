// Mesocycle grid — 08.7 · Тренировка, "Лист «Обзор мезоцикла»" (task 127). The week × day body of
// the grid: column headers, week labels with the deload row's `Deload`, and the cells themselves.
//
// It lives on its own because two screens draw it (task 127): the overview sheet opened from the
// workout header (095), and the mesocycle detail screen of a closed block (08.9). Nothing here
// knows about a `BottomSheet` — the sheet keeps its own title, subtitle and loading state.
//
// The grid answers four questions and no more (08.7, tasks 107 and 127): which days are behind you,
// which were skipped, which are left, and which one you have open. Telling `ready` from `awaiting`
// is not one of them, and neither is a day number — the column header above already says the day.
// Every status still reaches a screen reader through the cell's accessibility label. There is no
// legend: three looks this far apart need no key, and the six grey swatches this used to carry were
// as unreadable as the cells they explained (Artem's call on 107).
//
// Every cell is pressable — a day not programmed yet opens in preview. The one exception is
// `dimsEmptyCells`, for a stopped block on 08.9: the days after the Stop have no session and never
// will, so they are dimmed and inert rather than offering a tap that leads nowhere.
//
// Presentational: the grid and what a tap does come in as props. JSX/rendering only — styles live
// in MesoGridStyles.ts and pure helpers in MesoGridLogic.ts, per the code-style skill.

import { Pressable, Text, View } from 'react-native';

import { CheckIcon } from '@design/icons/CheckIcon';
import { COLORS, ICON_SIZES } from '@design/tokens';
// The component takes the mesocycle's own name; its data model is aliased to keep both readable.
import type { MesoGrid as MesoGridModel, MesoGridCell } from '@domain/mesoGrid';

import {
  isMesoGridCellPressable,
  isOpenMesoGridCell,
  mesoGridCellAccessibilityLabel,
  mesoGridCellLook,
} from './MesoGridLogic';
import { CELL_LOOK_STYLES, SKIP_LABEL_STYLE, styles } from './MesoGridStyles';

export type MesoGridProps = {
  /** The grid from `useMesoGrid` (089). */
  grid: MesoGridModel;
  /** The session the caller has open — its cell's outline goes `accent`, 2pt. */
  openSessionId?: string;
  /** A cell was tapped — the caller opens that day. */
  onCellPress: (cell: MesoGridCell) => void;
  /** Days with no session are dimmed and don't respond (a stopped block on 08.9). */
  dimsEmptyCells?: boolean;
};

export function MesoGrid({
  grid,
  openSessionId,
  onCellPress,
  dimsEmptyCells = false,
}: MesoGridProps) {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <View style={styles.weekColumn} />
        {grid.weeks[0]?.cells.map((cell) => (
          <Text key={cell.dayNumber} style={styles.dayHeader}>
            Day {cell.dayNumber}
          </Text>
        ))}
      </View>
      {grid.weeks.map((week) => (
        <View
          key={week.weekNumber}
          testID={`meso-grid-week-${week.weekNumber}`}
          style={styles.row}
        >
          <View style={styles.weekColumn}>
            <Text style={styles.weekLabel}>Week {week.weekNumber}</Text>
            {week.isDeload && <Text style={styles.deloadLabel}>Deload</Text>}
          </View>
          {week.cells.map((cell) => (
            <MesoGridCellButton
              key={cell.dayNumber}
              cell={cell}
              isOpen={isOpenMesoGridCell(cell, openSessionId)}
              isPressable={isMesoGridCellPressable(cell, dimsEmptyCells)}
              onPress={() => onCellPress(cell)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

type MesoGridCellButtonProps = {
  cell: MesoGridCell;
  isOpen: boolean;
  isPressable: boolean;
  onPress: () => void;
};

function MesoGridCellButton({ cell, isOpen, isPressable, onPress }: MesoGridCellButtonProps) {
  const look = mesoGridCellLook(cell);
  return (
    <Pressable
      testID={`meso-grid-cell-${cell.weekNumber}-${cell.dayNumber}`}
      accessibilityRole="button"
      accessibilityLabel={mesoGridCellAccessibilityLabel(cell)}
      accessibilityState={{ selected: isOpen, disabled: !isPressable }}
      disabled={!isPressable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        CELL_LOOK_STYLES[look],
        isOpen && styles.cellOpen,
        !isPressable && styles.cellInert,
        pressed && styles.cellPressed,
      ]}
    >
      {look === 'done' && <CheckIcon size={ICON_SIZES['icon/inline']} color={COLORS.accent} />}
      {look === 'skip' && <Text style={SKIP_LABEL_STYLE}>Skip</Text>}
    </Pressable>
  );
}
