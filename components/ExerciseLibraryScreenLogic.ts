// Pure, non-JSX logic behind ExerciseLibraryScreen.tsx — see AGENTS.md, "Code organization"
// ("Screens keep the same split, one level up.").

import type { Exercise, ExerciseType, MuscleGroup } from '@domain/catalog';
import type { ExerciseListEntry, ExerciseListGroup } from '@domain/catalogListing';
import type { RoundLog, SetLog } from '@domain/execution';
import type { PowerLoad } from '@domain/exerciseConfig';
import { exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import { parseUtcIso } from '@domain/time';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { getExerciseTypeLabel } from '@design/exerciseTypeLabel';
import { formatClock } from '@design/formatClock';
import { formatRelativeDate } from '@design/formatDate';
import { getCategoryColor, getMuscleGroupCategory } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';

import { formatSetValue, powerLoadOf } from './ExerciseDetailScreenLogic';
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

/**
 * What the exercise was last done as, and when: a set — `85 kg × 8`, or `Level 2 × 3` for a power
 * exercise on levels — or a round of an interval or mobility one, by its work: `2:00` (10.1 FR-12).
 */
export function formatSubtitle(
  lastLog: SetLog | RoundLog | null,
  type: ExerciseType = 'strength',
  powerLoad?: PowerLoad,
): string {
  const last = lastLog
    ? `${formatLastLog(lastLog, powerLoad)} · ${formatRelativeDate(parseUtcIso(lastLog.completedAt))}`
    : NEVER_PERFORMED;
  // The type is said for the hybrid ones; Strength is the library's default and goes unsaid.
  return type === 'strength' ? last : `${getExerciseTypeLabel(type)} · ${last}`;
}

/** The subtitle of a library row: what it was last done as, led by the type unless Strength. */
export function rowSubtitle(entry: ExerciseListEntry): string {
  return formatSubtitle(
    entry.lastSetLog ?? entry.lastRoundLog,
    exerciseTypeOf(entry.exercise),
    powerLoadOf(entry.exercise),
  );
}

function formatLastLog(lastLog: SetLog | RoundLog, powerLoad?: PowerLoad): string {
  return 'roundNumber' in lastLog
    ? formatClock(lastLog.workSec)
    : formatSetValue(lastLog, undefined, powerLoad);
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
