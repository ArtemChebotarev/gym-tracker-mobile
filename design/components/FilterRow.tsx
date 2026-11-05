// FilterRow — the row under a list's search field that opens and sums up its filters (08.6,
// "Строка фильтров"; GT-150): a `Filters` action chip with the sliders icon — with a filter on,
// the accent wash and the number of results left, `Filters (9)` — one static chip per active
// filter value, and a `Reset` link shown only while a filter is on.
//
// Lifted out of components/ExerciseFilterRow.tsx when the template list got filters too (GT-217),
// so both lists draw the same row from the same code. It knows nothing about what is filtered:
// the caller names the active values (`chips`) and says how many results are left.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { tapTargetSlop } from '../shapes';
import { SlidersIcon } from '../icons/SlidersIcon';
import { Chip } from './Chip';

/** One active filter value, shown as a static chip. */
export type FilterRowChip = {
  key: string;
  label: string;
  /** A category dot in front of the label (a muscle group's). */
  dotColor?: string;
};

export type FilterRowProps = {
  /** The active values, in the order the row shows them. Empty means no filter is on. */
  chips: readonly FilterRowChip[];
  /** How many results the filters leave — `Filters (9)` while a filter is on. */
  resultCount: number;
  onRequestFilters: () => void;
  onReset: () => void;
};

/** `Filters`, and with a filter on, how many results it leaves — `Filters (9)`. */
export function filterRowLabel(active: boolean, resultCount: number): string {
  return active ? `Filters (${resultCount})` : 'Filters';
}

export function FilterRow({ chips, resultCount, onRequestFilters, onReset }: FilterRowProps) {
  const active = chips.length > 0;

  return (
    <View style={styles.filterRow}>
      <Chip
        variant="action"
        label={filterRowLabel(active, resultCount)}
        icon={SlidersIcon}
        active={active}
        onPress={onRequestFilters}
      />
      {chips.map((chip) => (
        <Chip key={chip.key} variant="static" label={chip.label} dotColor={chip.dotColor} />
      ))}
      {active && (
        <Pressable
          accessibilityRole="button"
          hitSlop={tapTargetSlop(SIZES['size/chip'])}
          style={styles.resetChip}
          onPress={onReset}
        >
          <Text style={styles.resetChipLabel}>Reset</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  // Sits inline with the row's chips, so it's sized like their own label (`type/caption`, the same
  // scale Chip uses) rather than the Filters sheet's larger header Reset — plain accent-colored
  // text, not a filled chip, so it still stands out against the row's muted chips without
  // reading larger than its neighbors.
  resetChip: {
    minHeight: SIZES['size/chip'],
    justifyContent: 'center',
    paddingHorizontal: SPACING['space/gap-tight'],
    paddingVertical: SPACING['space/gap-tight'],
  },
  resetChipLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS.accent,
  },
});
