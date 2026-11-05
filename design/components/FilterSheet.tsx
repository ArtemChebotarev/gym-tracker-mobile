// FilterSheet — the frame of a list's Filters sheet (08.6, "Filters — лист"): titled `Filters`, a
// `Reset` in the header, and one confirm button across the footer that says how many results the
// selection leaves (`Show 12 exercises`) and is disabled when it leaves none. What the sheet
// filters by is the caller's children.
//
// Lifted out of components/ExerciseFiltersSheet.tsx when the template list got a sheet of its own
// (GT-217), so both sheets are framed — and reset and confirmed — the same way. `FilterSection` is
// one titled group inside it.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { tapTargetSlop } from '../shapes';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { fieldStyles } from './fieldStyles';

/**
 * The confirm button's copy (08.6, "Filters — лист"): `Show 12 exercises`, `Show 1 template`, or
 * `No matches` at zero. `noun` is the singular of what the list holds.
 */
export function filterApplyLabel(resultCount: number, noun: string): string {
  if (resultCount === 0) {
    return 'No matches';
  }
  return `Show ${resultCount} ${noun}${resultCount === 1 ? '' : 's'}`;
}

export type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  /** The confirm button's label — `Show 12 exercises`, or `No matches` at zero. */
  applyLabel: string;
  /** Nothing to show for the selection: the button is disabled. */
  applyDisabled: boolean;
  onApply: () => void;
  /** Forwarded to BottomSheet — see its own doc on this prop. */
  animated?: boolean;
  children: ReactNode;
};

export function FilterSheet({
  visible,
  onClose,
  onReset,
  applyLabel,
  applyDisabled,
  onApply,
  animated,
  children,
}: FilterSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      animated={animated}
      action={
        <Pressable
          accessibilityRole="button"
          onPress={onReset}
          hitSlop={tapTargetSlop(SIZES['size/chip'])}
          style={styles.resetButton}
        >
          <Text style={styles.reset}>Reset</Text>
        </Pressable>
      }
      footer={
        <View style={styles.footerButton}>
          <Button label={applyLabel} onPress={onApply} disabled={applyDisabled} />
        </View>
      }
    >
      {children}
    </BottomSheet>
  );
}

export type FilterSectionProps = {
  /** The group's label. Left out for a group that labels itself — a Toggle. */
  title?: string;
  children: ReactNode;
};

/** One group of a Filters sheet, under its label, a section's space above the next. */
export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <View style={styles.section}>
      {title !== undefined && <Text style={fieldStyles.label}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING['space/section'],
  },
  resetButton: {
    minHeight: SIZES['size/chip'],
    justifyContent: 'center',
  },
  reset: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS.accent,
  },
  // Stretches the single confirm Button to the sheet's full width inside BottomSheet's
  // flex-row, flex-end footer.
  footerButton: {
    flex: 1,
  },
});
