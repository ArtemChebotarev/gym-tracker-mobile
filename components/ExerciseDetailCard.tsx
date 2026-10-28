// The labelled card the Exercise screen is built out of — 08.6 · Библиотека упражнений and its
// mockup 02-exercise-detail.html. A section label (with an optional right-hand meta line) over a
// filled card of `label ↔ value` rows separated by hairlines.
//
// Every session of the History tab is one, a row per set. The label over it is
// `ExerciseDetailSection`, which Overview also puts over a block that isn't a card of rows —
// `How to perform` (GT-195) — so every section label on the screen sits in the same place.
//
// Not a design/components primitive: it carries this screen family's composition (label row over
// card, value with a quieter tail), not a general-purpose SDK component — see design/README.md.

import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { styles } from './ExerciseDetailCardStyles';

export type ExerciseDetailSectionProps = {
  /** The section label — uppercased by the type token. */
  label: string;
  /** The right-hand side of the label row, e.g. `Week 3 · Day 1 · 10 Aug`. */
  meta?: string;
  testID?: string;
  children: ReactNode;
};

/** A section label over whatever the section holds. */
export function ExerciseDetailSection({
  label,
  meta,
  testID,
  children,
}: ExerciseDetailSectionProps) {
  return (
    <View testID={testID} style={styles.block}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {meta !== undefined && <Text style={styles.meta}>{meta}</Text>}
      </View>
      {children}
    </View>
  );
}

export type ExerciseDetailCardProps = ExerciseDetailSectionProps;

/** A section whose content is a card of rows. */
export function ExerciseDetailCard({ children, ...section }: ExerciseDetailCardProps) {
  return (
    <ExerciseDetailSection {...section}>
      <View style={styles.card}>{children}</View>
    </ExerciseDetailSection>
  );
}

export type ExerciseDetailCardRowProps = {
  label: string;
  value: string;
  /** Rendered inside the value, a step quieter — ` · 2 RIR`, ` · 3 sets`. */
  tail?: string;
  /** The last row of a card drops its hairline. */
  isLast: boolean;
};

export function ExerciseDetailCardRow({ label, value, tail, isLast }: ExerciseDetailCardRowProps) {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>
        {value}
        {tail !== undefined && <Text style={styles.rowValueTail}>{tail}</Text>}
      </Text>
    </View>
  );
}
