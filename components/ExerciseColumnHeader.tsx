// The column header over an exercise card's rows — 08.7 · Тренировка, "Карточка упражнения"; 10.1
// FR-14. One label per value column, each optionally with an ⓘ beside it, then the hit indicator's
// column, then `Log`. The columns are the type's: `Weight, kg` · `Reps` for strength, `Load, kg` ·
// `Fast reps` for power, `Work` · `Rest` for an interval, `Duration` for mobility. It sits on the rows'
// grid (WorkoutSetRowStyles.ts), so a label stands over its field.
//
// It reads the same on every card (Artem's review, 18.10.2026). A label is centred over its field
// whether or not it has an ⓘ: it sits between two equal halves of the column, with the ⓘ in the
// right one, so the button never pulls it off centre. And the indicator's column is there over
// guided rows too, which leave it empty, so the fields of every card line up.

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
};

export function ExerciseColumnHeader({ columns }: ExerciseColumnHeaderProps) {
  return (
    <View style={styles.headerRow}>
      {columns.map((column) => (
        <View key={column.label} style={styles.valueColumn}>
          <View style={styles.half} />
          <Text style={styles.columnLabel}>{column.label}</Text>
          <View style={[styles.half, styles.infoHalf]}>
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
        </View>
      ))}
      <View style={styles.indicatorColumn} />
      <Text style={[styles.logColumn, styles.columnLabel]}>Log</Text>
    </View>
  );
}
