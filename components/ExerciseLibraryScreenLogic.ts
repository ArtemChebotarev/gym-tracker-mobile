// Pure, non-JSX logic behind ExerciseLibraryScreen.tsx — see AGENTS.md, "Code organization"
// ("Screens keep the same split, one level up.").

import type { Exercise, MuscleGroup } from '@domain/catalog';
import type { ExerciseListEntry, ExerciseListGroup } from '@domain/catalogListing';
import type { SetLog } from '@domain/execution';
import { parseUtcIso } from '@domain/time';
import { formatRelativeDate } from '@design/formatDate';
import { getCategoryColor, getMuscleGroupCategory } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';

import type { ExerciseLibraryFilters } from './ExerciseLibraryScreen';

export type ExerciseSection = {
  muscleGroup: MuscleGroup;
  title: string;
  data: ExerciseListEntry[];
};

const NEVER_PERFORMED = 'Never performed';

export function hasActiveFilters(filters: ExerciseLibraryFilters): boolean {
  return Boolean(filters.muscleGroups?.length || filters.sources?.length || filters.performedOnly);
}

export function countEntries(groups: ExerciseListGroup[]): number {
  return groups.reduce((total, group) => total + group.entries.length, 0);
}

export function formatSubtitle(lastSetLog: SetLog | null): string {
  if (!lastSetLog) {
    return NEVER_PERFORMED;
  }
  const when = formatRelativeDate(parseUtcIso(lastSetLog.completedAt));
  return `${lastSetLog.weight} kg × ${lastSetLog.reps} · ${when}`;
}

export function sectionDotColor(muscleGroup: MuscleGroup): string | undefined {
  const category = getMuscleGroupCategory(muscleGroup);
  return category ? getCategoryColor(category) : undefined;
}

export function sourceLabel(source: Exercise['source']): string {
  return source === 'custom' ? 'Custom' : 'Catalog';
}

export function buildSections(groups: readonly ExerciseListGroup[]): ExerciseSection[] {
  return groups.map((group) => ({
    muscleGroup: group.muscleGroup,
    title: getMuscleGroupLabel(group.muscleGroup),
    data: group.entries,
  }));
}
