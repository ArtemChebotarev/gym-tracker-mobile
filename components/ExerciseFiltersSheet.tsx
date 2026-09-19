// Filters sheet for the Exercises list — see 08.6 · Библиотека упражнений, "Filters — лист", and
// its mockup 04-exercise-filters.html.
//
// Fully controlled, the same way ExerciseLibraryScreen.tsx is: the caller owns the in-progress
// filter selection (the "draft", seeded from the applied filters when the sheet opens) and the
// live result count for that draft (recomputed by the caller via useExerciseLibrary against the
// draft query — see app/(tabs)/library.tsx), so this component is plain props in, plain
// callbacks out, and testable without a QueryProvider.
//
// Muscle group and Source are *not* built from design/components/Chip — the mockup gives each of
// them its own selected treatment (a per-family tint with a dot for muscle group; two full-width
// options, not wrapping pills, for source) that doesn't fit Chip's single generic selected style
// (see Chip.tsx's own comment on why that stayed a solid accent fill rather than growing more
// variants). MuscleGroupChip and SourceOption below are composed locally instead, the same way
// this screen composes any other design/ primitive — just with the color/shape resolved here
// rather than inside a shared component.
//
// JSX/rendering only — styles live in ExerciseFiltersSheetStyles.ts and pure helpers in
// ExerciseFiltersSheetLogic.ts, per the code-style skill.

import { Pressable, Text, View } from 'react-native';

import { MUSCLE_GROUPS, type ExerciseSource, type MuscleGroup } from '@domain/catalog';
import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { fieldStyles } from '@design/components/fieldStyles';
import { Toggle } from '@design/components/Toggle';
import { getMuscleGroupChipColors } from '@design/muscleGroupColor';
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
  /** Forwarded to BottomSheet — see its own doc on this prop. Not currently set by any caller
   * (both app/(tabs)/library.tsx and app/meso-editor/new.tsx leave it at the default). */
  animated?: boolean;
};

export function ExerciseFiltersSheet({
  visible,
  filters,
  onChangeFilters,
  resultCount,
  onReset,
  onApply,
  onClose,
  animated,
}: ExerciseFiltersSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      animated={animated}
      action={
        <Pressable accessibilityRole="button" onPress={onReset}>
          <Text style={styles.reset}>Reset</Text>
        </Pressable>
      }
      footer={
        <View style={styles.footerButton}>
          <Button
            label={applyButtonLabel(resultCount)}
            onPress={onApply}
            disabled={resultCount === 0}
          />
        </View>
      }
    >
      <View style={styles.section}>
        <Text style={fieldStyles.label}>Muscle group</Text>
        <View style={styles.chipRow}>
          {MUSCLE_GROUPS.map((muscleGroup) => (
            <MuscleGroupChip
              key={muscleGroup}
              muscleGroup={muscleGroup}
              selected={filters.muscleGroups?.includes(muscleGroup) ?? false}
              onPress={() => onChangeFilters(toggleMuscleGroup(filters, muscleGroup))}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={fieldStyles.label}>Source</Text>
        <View style={styles.sourceRow}>
          {SOURCES.map((source) => (
            <SourceOption
              key={source}
              source={source}
              selected={filters.sources?.includes(source) ?? false}
              onPress={() => onChangeFilters(toggleSource(filters, source))}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Toggle
          label="Performed only"
          description="Has at least one logged set"
          value={filters.performedOnly ?? false}
          onValueChange={(value) => onChangeFilters({ ...filters, performedOnly: value })}
        />
      </View>
    </BottomSheet>
  );
}

type MuscleGroupChipProps = {
  muscleGroup: MuscleGroup;
  selected: boolean;
  onPress: () => void;
};

function MuscleGroupChip({ muscleGroup, selected, onPress }: MuscleGroupChipProps) {
  const colors = getMuscleGroupChipColors(muscleGroup);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.muscleGroupChip,
        selected
          ? { backgroundColor: colors.tint, borderColor: colors.border }
          : styles.muscleGroupChipUnselected,
        pressed && styles.pressed,
      ]}
    >
      {colors.dot !== undefined && (
        <View style={[styles.muscleGroupDot, { backgroundColor: colors.dot }]} />
      )}
      <Text
        style={[
          styles.muscleGroupChipLabel,
          selected ? { color: colors.text } : styles.muscleGroupChipLabelUnselected,
        ]}
      >
        {getMuscleGroupLabel(muscleGroup)}
      </Text>
    </Pressable>
  );
}

type SourceOptionProps = {
  source: ExerciseSource;
  selected: boolean;
  onPress: () => void;
};

function SourceOption({ source, selected, onPress }: SourceOptionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.sourceOption,
        selected ? styles.sourceOptionSelected : styles.sourceOptionUnselected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.sourceOptionLabel,
          selected ? styles.sourceOptionLabelSelected : styles.sourceOptionLabelUnselected,
        ]}
      >
        {sourceLabel(source)}
      </Text>
    </Pressable>
  );
}
