// Filters sheet for the Exercises list — see 08.6 · Библиотека упражнений, "Filters — лист".
//
// Fully controlled, the same way ExerciseLibraryScreen.tsx is: the caller owns the in-progress
// filter selection (the "draft", seeded from the applied filters when the sheet opens) and the
// live result count for that draft (recomputed by the caller via useExerciseLibrary against the
// draft query — see app/(tabs)/library.tsx), so this component is plain props in, plain
// callbacks out, and testable without a QueryProvider.
//
// JSX/rendering only — styles live in ExerciseFiltersSheetStyles.ts and pure helpers in
// ExerciseFiltersSheetLogic.ts, per the code-style skill.

import { Pressable, Text, View } from 'react-native';

import { MUSCLE_GROUPS, type ExerciseSource } from '@domain/catalog';
import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { Chip } from '@design/components/Chip';
import { fieldStyles } from '@design/components/fieldStyles';
import { Toggle } from '@design/components/Toggle';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';

import type { ExerciseLibraryFilters } from './ExerciseLibraryScreen';
import { sourceLabel } from './ExerciseLibraryScreenLogic';
import { applyButtonLabel, toggleMuscleGroup, toggleSource } from './ExerciseFiltersSheetLogic';
import { styles } from './ExerciseFiltersSheetStyles';

// Source has exactly two values (domain/catalog.ts's ExerciseSource), so both buttons are just
// spelled out rather than pulled from a MUSCLE_GROUPS-style constant array.
const SOURCES: readonly ExerciseSource[] = ['catalog', 'custom'];

export type ExerciseFiltersSheetProps = {
  visible: boolean;
  filters: ExerciseLibraryFilters;
  onChangeFilters: (filters: ExerciseLibraryFilters) => void;
  resultCount: number;
  onReset: () => void;
  onApply: () => void;
  onClose: () => void;
};

export function ExerciseFiltersSheet({
  visible,
  filters,
  onChangeFilters,
  resultCount,
  onReset,
  onApply,
  onClose,
}: ExerciseFiltersSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      action={
        <Pressable accessibilityRole="button" onPress={onReset}>
          <Text style={styles.reset}>Reset</Text>
        </Pressable>
      }
      footer={
        <Button label={applyButtonLabel(resultCount)} onPress={onApply} disabled={resultCount === 0} />
      }
    >
      <View style={styles.section}>
        <Text style={fieldStyles.label}>Muscle group</Text>
        <View style={styles.chipRow}>
          {MUSCLE_GROUPS.map((muscleGroup) => (
            <Chip
              key={muscleGroup}
              variant="selectable"
              label={getMuscleGroupLabel(muscleGroup)}
              selected={filters.muscleGroups?.includes(muscleGroup) ?? false}
              onPress={() => onChangeFilters(toggleMuscleGroup(filters, muscleGroup))}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={fieldStyles.label}>Source</Text>
        <View style={styles.chipRow}>
          {SOURCES.map((source) => (
            <Chip
              key={source}
              variant="selectable"
              label={sourceLabel(source)}
              selected={filters.sources?.includes(source) ?? false}
              onPress={() => onChangeFilters(toggleSource(filters, source))}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Toggle
          label="Performed only"
          description="Only show exercises with at least one logged set."
          value={filters.performedOnly ?? false}
          onValueChange={(value) => onChangeFilters({ ...filters, performedOnly: value })}
        />
      </View>
    </BottomSheet>
  );
}
