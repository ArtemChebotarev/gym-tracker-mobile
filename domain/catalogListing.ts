// Exercise-library listing — grouping, search, and filtering behind the Exercises list screen.
// See 08.6 · Библиотека упражнений ("Exercises — список"). Kept separate from `domain/catalog.ts`
// (types only) per the single-responsibility rule in AGENTS.md.

import { MUSCLE_GROUPS, type Exercise, type ExerciseSource, type MuscleGroup } from './catalog';
import type { SetLog } from './execution';

export type ExerciseListQuery = {
  /** Case-insensitive substring match against `Exercise.name`. */
  search?: string;
  /** Keep only these muscle groups. Empty or omitted means every group. */
  muscleGroups?: readonly MuscleGroup[];
  /** Keep only these sources. Empty or omitted means both. */
  sources?: readonly ExerciseSource[];
  /** Keep only exercises with at least one set log. */
  performedOnly?: boolean;
};

export type ExerciseListEntry = {
  exercise: Exercise;
  /** The exercise's most recent set log, or `null` if it has never been performed. */
  lastSetLog: SetLog | null;
};

export type ExerciseListGroup = {
  muscleGroup: MuscleGroup;
  entries: ExerciseListEntry[];
};

/**
 * Builds the grouped, filtered, and searched exercise list for the library screen.
 *
 * - `isHidden` exercises are excluded unconditionally, regardless of `query` (08.6, "Правила":
 *   "Упражнения с isHidden = true не показываются никогда и ни при каких фильтрах").
 * - Groups are ordered by `MUSCLE_GROUPS`'s declaration order (the catalog's fixed sortOrder,
 *   see `domain/catalog.ts`) and omitted entirely when they end up empty.
 * - Exercises within a group are sorted alphabetically by `name`.
 */
export function buildExerciseListGroups(
  exercises: readonly Exercise[],
  lastSetLogByExerciseId: ReadonlyMap<string, SetLog | null>,
  query: ExerciseListQuery = {},
): ExerciseListGroup[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const muscleGroupFilter = query.muscleGroups?.length ? new Set(query.muscleGroups) : null;
  const sourceFilter = query.sources?.length ? new Set(query.sources) : null;

  const entriesByGroup = new Map<MuscleGroup, ExerciseListEntry[]>();

  for (const exercise of exercises) {
    if (exercise.isHidden) {
      continue;
    }
    if (search && !exercise.name.toLowerCase().includes(search)) {
      continue;
    }
    if (muscleGroupFilter && !muscleGroupFilter.has(exercise.muscleGroup)) {
      continue;
    }
    if (sourceFilter && !sourceFilter.has(exercise.source)) {
      continue;
    }

    const lastSetLog = lastSetLogByExerciseId.get(exercise.id) ?? null;
    if (query.performedOnly && !lastSetLog) {
      continue;
    }

    const entry: ExerciseListEntry = { exercise, lastSetLog };
    const bucket = entriesByGroup.get(exercise.muscleGroup);
    if (bucket) {
      bucket.push(entry);
    } else {
      entriesByGroup.set(exercise.muscleGroup, [entry]);
    }
  }

  return MUSCLE_GROUPS.filter((muscleGroup) => entriesByGroup.has(muscleGroup)).map(
    (muscleGroup) => ({
      muscleGroup,
      entries: [...(entriesByGroup.get(muscleGroup) ?? [])].sort((a, b) =>
        a.exercise.name.localeCompare(b.exercise.name),
      ),
    }),
  );
}
