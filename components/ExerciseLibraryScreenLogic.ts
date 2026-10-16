// Pure, non-JSX logic behind ExerciseLibraryScreen.tsx — see AGENTS.md, "Code organization"
// ("Screens keep the same split, one level up.").

import type { Exercise, ExerciseType, MuscleGroup } from '@domain/catalog';
import type { ExerciseListEntry, ExerciseListGroup } from '@domain/catalogListing';
import type { SetLog } from '@domain/execution';
import { exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import { parseUtcIso } from '@domain/time';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { getExerciseTypeLabel } from '@design/exerciseTypeLabel';
import { formatRelativeDate } from '@design/formatDate';
import { getCategoryColor, getMuscleGroupCategory } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';

import type { ExerciseLibraryFilters } from './ExerciseLibraryScreen';

export type ExerciseSection = {
  /** Unique per section: the muscle group, or `type:<type>` for a type's section. */
  key: string;
  muscleGroup: MuscleGroup;
  title: string;
  data: ExerciseListEntry[];
};

const NEVER_PERFORMED = 'Never performed';

export function hasActiveFilters(filters: ExerciseLibraryFilters): boolean {
  return Boolean(
    filters.muscleGroups?.length ||
    filters.types?.length ||
    filters.sources?.length ||
    filters.performedOnly,
  );
}

export function countEntries(groups: ExerciseListGroup[]): number {
  return groups.reduce((total, group) => total + group.entries.length, 0);
}

export function formatSubtitle(lastSetLog: SetLog | null, type: ExerciseType = 'strength'): string {
  const last = lastSetLog
    ? `${lastSetLog.weight} kg × ${lastSetLog.reps} · ${formatRelativeDate(parseUtcIso(lastSetLog.completedAt))}`
    : NEVER_PERFORMED;
  // The type is said for the hybrid ones; Strength is the library's default and goes unsaid.
  return type === 'strength' ? last : `${getExerciseTypeLabel(type)} · ${last}`;
}

/** The subtitle of a library row: what it was last done as, led by the type unless Strength. */
export function rowSubtitle(entry: ExerciseListEntry): string {
  return formatSubtitle(entry.lastSetLog, exerciseTypeOf(entry.exercise));
}

/** Title-line qualifier telling same-named exercises apart (task 081: `Bench Press · Dumbbell`).
 * `undefined` when the exercise has no equipment, so the row shows no suffix at all. */
export function equipmentSuffix(exercise: Exercise): string | undefined {
  return exercise.equipment === undefined ? undefined : getEquipmentLabel(exercise.equipment);
}

export function sectionDotColor(muscleGroup: MuscleGroup): string | undefined {
  const category = getMuscleGroupCategory(muscleGroup);
  return category ? getCategoryColor(category) : undefined;
}

export function sourceLabel(source: Exercise['source']): string {
  return source === 'custom' ? 'Custom' : 'Catalog';
}

/** What a section of exercises without a group is called (10.1 FR-1): Power, Intervals, Mobility. */
const TYPE_SECTION_TITLE: Record<ExerciseType, string> = {
  strength: 'Strength',
  power: 'Power',
  interval: 'Intervals',
  mobility: 'Mobility',
};

export function buildSections(groups: readonly ExerciseListGroup[]): ExerciseSection[] {
  return groups.map((group) => ({
    key: group.type === undefined ? group.muscleGroup : `type:${group.type}`,
    muscleGroup: group.muscleGroup,
    title:
      group.type === undefined
        ? getMuscleGroupLabel(group.muscleGroup)
        : TYPE_SECTION_TITLE[group.type],
    data: group.entries,
  }));
}
