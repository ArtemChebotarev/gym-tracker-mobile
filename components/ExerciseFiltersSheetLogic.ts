// Pure, non-JSX logic behind ExerciseFiltersSheet.tsx — see the code-style skill, "Screens keep
// the same split, one level up".

import {
  MUSCLE_GROUPS,
  type ExerciseSource,
  type ExerciseType,
  type MuscleGroup,
} from '@domain/catalog';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';
import type { ExerciseLibraryFilters } from './ExerciseLibraryScreen';

/**
 * The sheet's muscle-group chips, alphabetical by label (GT-150): `MUSCLE_GROUPS` is in body-region
 * order with later groups appended, which read as random here. `MUSCLE_GROUPS` itself stays as it
 * is — the exercise list and the cycle summary are ordered by it.
 */
export const FILTER_MUSCLE_GROUPS: readonly MuscleGroup[] = [...MUSCLE_GROUPS].sort((a, b) =>
  getMuscleGroupLabel(a).localeCompare(getMuscleGroupLabel(b)),
);

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

export function toggleType(
  filters: ExerciseLibraryFilters,
  type: ExerciseType,
): ExerciseLibraryFilters {
  const current = filters.types ?? [];
  const next = current.includes(type)
    ? current.filter((value) => value !== type)
    : [...current, type];
  return { ...filters, types: next.length > 0 ? next : undefined };
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
