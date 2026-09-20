// The labelled card the Exercise screen is built out of — 08.6 · Библиотека упражнений and its
// mockup 02-exercise-detail.html. A section label (with an optional right-hand meta line) over a
// filled card of `label ↔ value` rows separated by hairlines.
//
// Three callers, one look: Overview's `Last session` (a row per set), Overview's `Earlier` (a row
// per session) and every session of the History tab (a row per set again). Shared rather than
// re-styled per tab so a change to the card is one change — and so the History tab reads as the
// same object as the block on Overview it grew out of.
//
// Not a design/components primitive: it carries this screen family's composition (label row over
// card, value with a quieter tail), not a general-purpose SDK component — see design/README.md.

import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { styles } from './ExerciseDetailCardStyles';

export type ExerciseDetailCardProps = {
  /** The section label — uppercased by the type token. */
  label: string;
  /** The right-hand side of the label row, e.g. `Week 3 · Day 1 · 10 Aug`. */
  meta?: string;
  testID?: string;
  children: ReactNode;
};

export function ExerciseDetailCard({ label, meta, testID, children }: ExerciseDetailCardProps) {
  return (
    <View testID={testID} style={styles.block}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {meta !== undefined && <Text style={styles.meta}>{meta}</Text>}
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export type ExerciseDetailCardRowProps = {
  label: string;
  /** `counter` for `Set 1`, `fact` for a date — a counter reads a step quieter than a fact. */
  labelTone: 'counter' | 'fact';
  value: string;
  /** Rendered inside the value, a step quieter — ` · 2 RIR`, ` · 3 sets`. */
  tail?: string;
  /** The last row of a card drops its hairline. */
  isLast: boolean;
};

export function ExerciseDetailCardRow({
  label,
  labelTone,
  value,
  tail,
  isLast,
}: ExerciseDetailCardRowProps) {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <Text
        style={[
          styles.rowLabel,
          labelTone === 'counter' ? styles.rowLabelMuted : styles.rowLabelStrong,
        ]}
      >
        {label}
      </Text>
      <Text style={styles.rowValue}>
        {value}
        {tail !== undefined && <Text style={styles.rowValueTail}>{tail}</Text>}
      </Text>
    </View>
  );
}
