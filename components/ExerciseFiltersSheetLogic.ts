// Pure, non-JSX logic behind ExerciseFiltersSheet.tsx — see the code-style skill, "Screens keep
// the same split, one level up".

import type { ExerciseSource, MuscleGroup } from '@domain/catalog';
import type { ExerciseLibraryFilters } from './ExerciseLibraryScreen';

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
