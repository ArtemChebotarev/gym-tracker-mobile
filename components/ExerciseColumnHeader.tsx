// The column header over an exercise card's rows — 08.7 · Тренировка, "Карточка упражнения"; 10.1
// FR-14. One label per value column, each optionally with an ⓘ beside it, then the hit indicator's
// column when the rows have one, then `Log`. The columns are the type's: `Weight, kg` · `Reps` for
// strength, `Load, kg` · `Fast reps` for power, and an interval's `Round` · `Work` · `Rest` later.
// It sits on the rows' grid (WorkoutSetRowStyles.ts), so a label stands over its field.

import type { Ref } from 'react';
import { Text, View } from 'react-native';

import { InfoGlyphButton } from '@design/components/InfoGlyphButton';

import { styles } from './ExerciseColumnHeaderStyles';

/** The ⓘ beside a column's label — the caller holds its popover and anchors it by `buttonRef`. */
export type ExerciseColumnInfo = {
  accessibilityLabel: string;
  open: boolean;
  onPress: () => void;
  buttonRef: Ref<View>;
  /** What a first-workout coachmark rings (GT-42) — see `InfoGlyphButton`. */
  discRef?: Ref<View>;
};

export type ExerciseColumn = { label: string; info?: ExerciseColumnInfo };

export type ExerciseColumnHeaderProps = {
  columns: readonly ExerciseColumn[];
  /** Leave room for the rows' hit indicator — not on guided rows (10.2 P11). */
  indicatorColumn: boolean;
};

export function ExerciseColumnHeader({ columns, indicatorColumn }: ExerciseColumnHeaderProps) {
  return (
    <View style={styles.headerRow}>
      {columns.map((column) => (
        <View key={column.label} style={[styles.valueColumn, styles.infoHeader]}>
          <Text style={styles.columnLabel}>{column.label}</Text>
          {column.info !== undefined && (
            <InfoGlyphButton
              buttonRef={column.info.buttonRef}
              {...(column.info.discRef !== undefined ? { discRef: column.info.discRef } : {})}
              accessibilityLabel={column.info.accessibilityLabel}
              open={column.info.open}
              onPress={column.info.onPress}
            />
          )}
        </View>
      ))}
      {indicatorColumn && <View style={styles.indicatorColumn} />}
      <Text style={[styles.logColumn, styles.columnLabel]}>Log</Text>
    </View>
  );
}
