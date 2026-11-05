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
// The row itself — chip, active values, Reset — is design/components/FilterRow (GT-217, shared
// with the template list); this file only names the exercise filters' active values.

import { FilterRow, type FilterRowChip } from '@design/components/FilterRow';
import { getExerciseTypeLabel } from '@design/exerciseTypeLabel';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';

import type { ExerciseLibraryFilters } from './ExerciseLibraryScreen';
import { sectionDotColor, sourceLabel } from './ExerciseLibraryScreenLogic';

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
  const chips: FilterRowChip[] = [
    ...(filters.muscleGroups ?? []).map((muscleGroup) => ({
      key: `muscle-group-${muscleGroup}`,
      label: getMuscleGroupLabel(muscleGroup),
      dotColor: sectionDotColor(muscleGroup),
    })),
    ...(filters.types ?? []).map((type) => ({
      key: `type-${type}`,
      label: getExerciseTypeLabel(type),
    })),
    ...(filters.sources ?? []).map((source) => ({
      key: `source-${source}`,
      label: sourceLabel(source),
    })),
    ...(filters.performedOnly ? [{ key: 'performed-only', label: 'Performed only' }] : []),
  ];

  return (
    <FilterRow
      chips={chips}
      resultCount={resultCount}
      onRequestFilters={onRequestFilters}
      onReset={onResetFilters}
    />
  );
}
