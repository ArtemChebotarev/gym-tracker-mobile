// Mesocycle overview sheet — 08.7 · Тренировка, "Лист «Обзор мезоцикла»" (task 095). Opened by the
// workout header's grid button: the mesocycle's name, `Week N of M · K days a week`, and the week ×
// day grid from `useMesoGrid` (089).
//
// The grid itself is `MesoGrid` (task 127) — the mesocycle detail screen (08.9) draws the same one,
// so the cells, their looks and what a tap does live there. This file is the sheet around it: the
// title, the subtitle, the Cycle length stepper under the grid (GT-240) and the state before the
// grid arrives.
//
// Presentational: the grid and what a tap does come in as props from the Today tab
// (app/(tabs)/index.tsx). JSX/rendering only — styles live in MesoOverviewSheetStyles.ts and pure
// helpers in MesoOverviewSheetLogic.ts, per the code-style skill.

import { Text, View } from 'react-native';

import { MesoGrid as MesoGridBody } from '@components/MesoGrid';
import { BottomSheet } from '@design/components/BottomSheet';
import { Stepper } from '@design/components/Stepper';
import type { MesoGrid, MesoGridCell } from '@domain/mesoGrid';

import { formatMesocycleLengthValue } from './MesoEditorBasicsStepLogic';
import { formatCycleLengthCaption, formatMesoOverviewSubtitle } from './MesoOverviewSheetLogic';
import { styles } from './MesoOverviewSheetStyles';

export type MesoOverviewSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** `undefined` while the grid loads. */
  grid: MesoGrid | undefined;
  /** The session the workout screen has open — its cell gets the accent outline. */
  openSessionId?: string;
  /** A cell was tapped — the caller closes the sheet and opens that day. */
  onOpenCell: (cell: MesoGridCell) => void;
  /**
   * A tap of the Cycle length stepper (GT-240) — the caller changes the block's length. Without
   * it, or for a block that isn't active (no `grid.lengthBounds`), the stepper isn't shown.
   */
  onChangeLength?: (lengthWeeks: number) => void;
  /** A length change is being saved: both stepper buttons hold still until the grid re-reads. */
  lengthChanging?: boolean;
};

export function MesoOverviewSheet({
  visible,
  onClose,
  grid,
  openSessionId,
  onOpenCell,
  onChangeLength,
  lengthChanging = false,
}: MesoOverviewSheetProps) {
  if (grid === undefined) {
    return (
      <BottomSheet visible={visible} onClose={onClose} title="Training cycle">
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
      <MesoGridBody grid={grid} openSessionId={openSessionId} onCellPress={onOpenCell} />
      {grid.lengthBounds !== undefined && onChangeLength !== undefined && (
        <View style={styles.length}>
          <Stepper
            label="Cycle length"
            value={grid.lengthWeeks}
            onChange={onChangeLength}
            // While a change saves, the bounds collapse onto the value, which greys out both buttons.
            min={lengthChanging ? grid.lengthWeeks : grid.lengthBounds.min}
            max={lengthChanging ? grid.lengthWeeks : grid.lengthBounds.max}
            formatValue={formatMesocycleLengthValue}
            caption={formatCycleLengthCaption(grid.lengthWeeks, grid.lengthBounds)}
          />
        </View>
      )}
    </BottomSheet>
  );
}
