// Mesocycle overview sheet — 08.7 · Тренировка, "Лист «Обзор мезоцикла»" (task 095). Opened by the
// workout header's grid button: the mesocycle's name, `Week N of M · K days a week`, and the week ×
// day grid from `useMesoGrid` (089) — the deload week's row labelled `Deload`, each cell styled by
// its state, and the day the workout screen has open ringed. A legend sits under the grid.
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
  isOpenMesoGridCell,
  mesoGridCellAccessibilityLabel,
  mesoGridCellText,
} from './MesoOverviewSheetLogic';
import {
  CELL_STATUS_STYLES,
  CELL_TEXT_STATUS_STYLES,
  LEGEND_ITEMS,
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
      <View style={styles.legend}>
        {LEGEND_ITEMS.map(({ label, swatch }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.swatch, swatch]} />
            <Text style={styles.legendLabel}>{label}</Text>
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
  const text = mesoGridCellText(cell);
  return (
    <Pressable
      testID={`meso-grid-cell-${cell.weekNumber}-${cell.dayNumber}`}
      accessibilityRole="button"
      accessibilityLabel={mesoGridCellAccessibilityLabel(cell)}
      accessibilityState={{ selected: isOpen }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        CELL_STATUS_STYLES[cell.status],
        pressed && styles.cellPressed,
      ]}
    >
      {text === undefined ? (
        <CheckIcon size={ICON_SIZES['icon/inline']} color={COLORS['text/primary']} />
      ) : (
        <Text style={[styles.cellText, CELL_TEXT_STATUS_STYLES[cell.status]]}>{text}</Text>
      )}
      {isOpen && <View testID="meso-grid-open-ring" style={styles.openRing} />}
    </Pressable>
  );
}
