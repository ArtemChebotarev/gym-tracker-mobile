// Pure, non-JSX logic behind ExerciseFiltersSheet.tsx — see the code-style skill, "Screens keep
// the same split, one level up".

import type { ExerciseSource, MuscleGroup } from '@domain/catalog';
import {
  getCategoryColor,
  getCategoryTextOnTint,
  getCategoryTint,
  getMuscleGroupCategory,
} from '@design/muscleGroupColor';

import type { ExerciseLibraryFilters } from './ExerciseLibraryScreen';

export type MuscleGroupChipColors = {
  dot: string | undefined;
  tint: string | undefined;
  border: string | undefined;
  text: string | undefined;
};

// A muscle-group filter chip's selected state is tinted by its own family color (04 ·
// Экран-мокап "Filters — лист": each option carries a family dot, and the selected one takes on
// that family's tint), not the generic accent used elsewhere — muscle group color carries
// meaning, it doesn't decorate (08.0 · Design SDK, "Цвет группы мышц несёт значение"). No
// dedicated "border" derivation exists in design/muscleGroupColor.ts, so the raw category color
// (already exported, already used for the static dot elsewhere) doubles as the border.
export function muscleGroupChipColors(muscleGroup: MuscleGroup): MuscleGroupChipColors {
  const category = getMuscleGroupCategory(muscleGroup);
  if (!category) {
    return { dot: undefined, tint: undefined, border: undefined, text: undefined };
  }
  const color = getCategoryColor(category);
  return { dot: color, tint: getCategoryTint(category), border: color, text: getCategoryTextOnTint(category) };
}

// Deselecting the last value clears the field to `undefined` rather than leaving `[]` — matches
// `ExerciseListQuery`'s own contract ("empty or omitted means every group/source") so an empty
// selection reads as "everything" exactly the way the domain filter already treats it.
export function toggleMuscleGroup(
  filters: ExerciseLibraryFilters,
  muscleGroup: MuscleGroup,
): ExerciseLibraryFilters {
  const current = filters.muscleGroups ?? [];
  const next = current.includes(muscleGroup)
    ? current.filter((value) => value !== muscleGroup)
    : [...current, muscleGroup];
  return { ...filters, muscleGroups: next.length > 0 ? next : undefined };
}

export function toggleSource(
  filters: ExerciseLibraryFilters,
  source: ExerciseSource,
): ExerciseLibraryFilters {
  const current = filters.sources ?? [];
  const next = current.includes(source)
    ? current.filter((value) => value !== source)
    : [...current, source];
  return { ...filters, sources: next.length > 0 ? next : undefined };
}

/** Confirm-button copy (08.6, "Filters — лист": `Show 12 exercises`, or `No matches` at zero). */
export function applyButtonLabel(resultCount: number): string {
  if (resultCount === 0) {
    return 'No matches';
  }
  return `Show ${resultCount} exercise${resultCount === 1 ? '' : 's'}`;
}
