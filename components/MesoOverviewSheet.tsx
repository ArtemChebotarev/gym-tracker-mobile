// Mesocycle overview sheet — 08.7 · Тренировка, "Лист «Обзор мезоцикла»" (task 095). Opened by the
// workout header's grid button: the mesocycle's name, `Week N of M · K days a week`, and the week ×
// day grid from `useMesoGrid` (089).
//
// The grid itself is `MesoGrid` (task 127) — the mesocycle detail screen (08.9) draws the same one,
// so the cells, their looks and what a tap does live there. This file is the sheet around it: the
// title, the subtitle, and the state before the grid arrives.
//
// Presentational: the grid and what a tap does come in as props from the Today tab
// (app/(tabs)/index.tsx). JSX/rendering only — styles live in MesoOverviewSheetStyles.ts and pure
// helpers in MesoOverviewSheetLogic.ts, per the code-style skill.

import { Text } from 'react-native';

import { MesoGrid as MesoGridBody } from '@components/MesoGrid';
import { BottomSheet } from '@design/components/BottomSheet';
import type { MesoGrid, MesoGridCell } from '@domain/mesoGrid';

import { formatMesoOverviewSubtitle } from './MesoOverviewSheetLogic';
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
};

export function MesoOverviewSheet({
  visible,
  onClose,
  grid,
  openSessionId,
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
      <MesoGridBody grid={grid} openSessionId={openSessionId} onCellPress={onOpenCell} />
    </BottomSheet>
  );
}
