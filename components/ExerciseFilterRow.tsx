// The Filters chip row — see 08.6 · Библиотека упражнений, "Exercises — список", "Строка
// фильтров": a `Filters` button (an action chip with the sliders icon; with a filter on, the
// accent wash and the number of exercises left, `Filters (9)` — GT-150), one static chip per
// active filter value, and a `Reset` action shown only while a filter is active.
//
// Extracted out of ExerciseLibraryScreen.tsx (task 079 · Рефакторинг: общий Exercise picker) so
// the same row — same chips, same Reset behavior — is shared with ExercisePickerSheet.tsx rather
// than growing a second copy of this exact JSX for the "Add exercise" / "Replace exercise" sheets.
//
// Fully controlled, the same way the screens that render it are: no local state, just the active
// filters and a live result count in, callbacks out.
//
// JSX/rendering only — styles live in ExerciseFilterRowStyles.ts and pure helpers in
// ExerciseLibraryScreenLogic.ts (this row has none of its own beyond what that file already
// exports), per the code-style skill.

import { Pressable, Text, View } from 'react-native';

import { Chip } from '@design/components/Chip';
import { getExerciseTypeLabel } from '@design/exerciseTypeLabel';
import { SlidersIcon } from '@design/icons/SlidersIcon';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';
import { tapTargetSlop } from '@design/shapes';
import { SIZES } from '@design/tokens';

import type { ExerciseLibraryFilters } from './ExerciseLibraryScreen';
import {
  filtersButtonLabel,
  hasActiveFilters,
  sectionDotColor,
  sourceLabel,
} from './ExerciseLibraryScreenLogic';
import { styles } from './ExerciseFilterRowStyles';

export type ExerciseFilterRowProps = {
  filters: ExerciseLibraryFilters;
  resultCount: number;
  onRequestFilters: () => void;
  onResetFilters: () => void;
};

export function ExerciseFilterRow({
  filters,
  resultCount,
  onRequestFilters,
  onResetFilters,
}: ExerciseFilterRowProps) {
  const filtersActive = hasActiveFilters(filters);

  return (
    <View style={styles.filterRow}>
      <Chip
        variant="action"
        label={filtersButtonLabel(filters, resultCount)}
        icon={SlidersIcon}
        active={filtersActive}
        onPress={onRequestFilters}
      />
      {filters.muscleGroups?.map((muscleGroup) => (
        <Chip
          key={`muscle-group-${muscleGroup}`}
          variant="static"
          label={getMuscleGroupLabel(muscleGroup)}
          dotColor={sectionDotColor(muscleGroup)}
        />
      ))}
      {filters.types?.map((type) => (
        <Chip key={`type-${type}`} variant="static" label={getExerciseTypeLabel(type)} />
      ))}
      {filters.sources?.map((source) => (
        <Chip key={`source-${source}`} variant="static" label={sourceLabel(source)} />
      ))}
      {filters.performedOnly && <Chip variant="static" label="Performed only" />}
      {filtersActive && (
        <Pressable
          accessibilityRole="button"
          hitSlop={tapTargetSlop(SIZES['size/chip'])}
          style={styles.resetChip}
          onPress={onResetFilters}
        >
          <Text style={styles.resetChipLabel}>Reset</Text>
        </Pressable>
      )}
    </View>
  );
}
