// Mesocycle overview sheet — 08.7 · Тренировка, "Лист «Обзор мезоцикла»" (task 095). Opened by the
// workout header's grid button: the mesocycle's name, `Week N of M · K days a week`, and the week ×
// day grid from `useMesoGrid` (089) — the deload week's row labelled `Deload`.
//
// The grid answers three questions and no more (task 107, Artem's call): which days are behind you
// — trained or skipped alike, a filled cell with a check; which are still to come — a plain
// outline, whether or not they're programmed yet; and which day you have open — a white ring
// over either. There's no legend: three looks this far apart explain themselves, and the one the
// sheet used to carry was six rows of grey swatches nobody could match to a cell (Artem's call).
// Telling `ready` from `awaiting`, or a skipped day from a trained one, was detail he
// didn't want on the grid, and six near-identical greys made none of it readable anyway. A cell
// carries no day number — the column header above it already says the day. Every status still
// reaches a screen reader through the cell's accessibility label.
//
// Every cell is pressable, whatever its state: the caller closes the sheet and opens that day in
// the mode its session calls for — live, read-only, or preview for a day not programmed yet.
//
// Presentational: the grid and what a tap does come in as props from the Today tab
// (app/(tabs)/index.tsx). JSX/rendering only — styles live in MesoOverviewSheetStyles.ts and pure
// helpers in MesoOverviewSheetLogic.ts, per the code-style skill.

import { Pressable, Text, View } from 'react-native';

import { BottomSheet } from '@design/components/BottomSheet';
import { CheckIcon } from '@design/icons/CheckIcon';
import { COLORS, ICON_SIZES } from '@design/tokens';
import type { MesoGrid, MesoGridCell } from '@domain/mesoGrid';

import {
  formatMesoOverviewSubtitle,
  isFinishedMesoGridCell,
  isOpenMesoGridCell,
  mesoGridCellAccessibilityLabel,
} from './MesoOverviewSheetLogic';
import {
  CELL_FINISHED_STYLE,
  CELL_LEFT_STYLE,
  styles,
} from './MesoOverviewSheetStyles';

export type MesoOverviewSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** `undefined` while the grid loads. */
  grid: MesoGrid | undefined;
  /** The day the workout screen has open — its cell gets the inner ring. */
  openDay?: { weekNumber: number; dayNumber: number };
  /** A cell was tapped — the caller closes the sheet and opens that day. */
  onOpenCell: (cell: MesoGridCell) => void;
};

export function MesoOverviewSheet({
  visible,
  onClose,
  grid,
  openDay,
  onOpenCell,
}: MesoOverviewSheetProps) {
  if (grid === undefined) {
    return (
      <BottomSheet visible={visible} onClose={onClose} title="Mesocycle">
        <Text style={styles.status}>Loading…</Text>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={grid.name}
      subtitle={formatMesoOverviewSubtitle(grid)}
    >
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
                isOpen={isOpenMesoGridCell(cell, openDay)}
                onPress={() => onOpenCell(cell)}
              />
            ))}
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

type MesoGridCellButtonProps = {
  cell: MesoGridCell;
  isOpen: boolean;
  onPress: () => void;
};

function MesoGridCellButton({ cell, isOpen, onPress }: MesoGridCellButtonProps) {
  const isFinished = isFinishedMesoGridCell(cell);
  return (
    <Pressable
      testID={`meso-grid-cell-${cell.weekNumber}-${cell.dayNumber}`}
      accessibilityRole="button"
      accessibilityLabel={mesoGridCellAccessibilityLabel(cell)}
      accessibilityState={{ selected: isOpen }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        isFinished ? CELL_FINISHED_STYLE : CELL_LEFT_STYLE,
        pressed && styles.cellPressed,
      ]}
    >
      {isFinished && (
        <CheckIcon size={ICON_SIZES['icon/inline']} color={COLORS['text/on-light']} />
      )}
      {isOpen && <View testID="meso-grid-open-ring" style={styles.openRing} />}
    </Pressable>
  );
}

