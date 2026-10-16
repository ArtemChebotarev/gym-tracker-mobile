// Exercise-library listing — grouping, search, and filtering behind the Exercises list screen.
// See 08.6 · Библиотека упражнений ("Exercises — список"). Kept separate from `domain/catalog.ts`
// (types only) per the single-responsibility rule in AGENTS.md.

import {
  FULL_BODY,
  MUSCLE_GROUPS,
  type Exercise,
  type ExerciseSource,
  type ExerciseType,
  type MuscleGroup,
} from './catalog';
import type { SetLog } from './execution';
import { exerciseTypeOf } from './exerciseConfigBuilders';
import { nameMatchesSearch } from './names';

export type ExerciseListQuery = {
  /** Case-insensitive substring match against `Exercise.name`. */
  search?: string;
  /** Keep only these muscle groups. Empty or omitted means every group. */
  muscleGroups?: readonly MuscleGroup[];
  /** Keep only these types. Empty or omitted means every type. */
  types?: readonly ExerciseType[];
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
  /**
   * Set on the sections of exercises that have no one muscle group (`fullBody`): they are filed by
   * their type instead — Power, Intervals, Mobility (10.1 FR-1). Absent on a muscle-group section.
   */
  type?: ExerciseType;
  entries: ExerciseListEntry[];
};

/** The types an exercise without a group is filed under, in the order of their sections. */
const UNGROUPED_TYPE_ORDER: readonly ExerciseType[] = ['power', 'interval', 'mobility', 'strength'];

/**
 * Builds the grouped, filtered, and searched exercise list for the library screen.
 *
 * - `isHidden` exercises are excluded unconditionally, regardless of `query` (08.6, "Правила":
 *   "Упражнения с isHidden = true не показываются никогда и ни при каких фильтрах").
 * - Groups are ordered by `MUSCLE_GROUPS`'s declaration order (the catalog's fixed sortOrder,
 *   see `domain/catalog.ts`) and omitted entirely when they end up empty. Exercises without a
 *   group follow them, one section per type (Power, Intervals, Mobility).
 * - Exercises within a group are sorted alphabetically by `name`.
 */
export function buildExerciseListGroups(
  exercises: readonly Exercise[],
  lastSetLogByExerciseId: ReadonlyMap<string, SetLog | null>,
  query: ExerciseListQuery = {},
): ExerciseListGroup[] {
  const search = query.search ?? '';
  const muscleGroupFilter = query.muscleGroups?.length ? new Set(query.muscleGroups) : null;
  const typeFilter = query.types?.length ? new Set(query.types) : null;
  const sourceFilter = query.sources?.length ? new Set(query.sources) : null;

  // A muscle group, or — for an exercise without one — its type.
  const entriesByKey = new Map<MuscleGroup | ExerciseType, ExerciseListEntry[]>();

  for (const exercise of exercises) {
    if (exercise.isHidden) {
      continue;
    }
    if (!nameMatchesSearch(exercise.name, search)) {
      continue;
    }
    if (muscleGroupFilter && !muscleGroupFilter.has(exercise.muscleGroup)) {
      continue;
    }
    if (typeFilter && !typeFilter.has(exerciseTypeOf(exercise))) {
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
    const key =
      exercise.muscleGroup === FULL_BODY ? exerciseTypeOf(exercise) : exercise.muscleGroup;
    const bucket = entriesByKey.get(key);
    if (bucket) {
      bucket.push(entry);
    } else {
      entriesByKey.set(key, [entry]);
    }
  }

  function sortedEntries(key: MuscleGroup | ExerciseType): ExerciseListEntry[] {
    return [...(entriesByKey.get(key) ?? [])].sort((a, b) =>
      a.exercise.name.localeCompare(b.exercise.name),
    );
  }

  // The twelve groups in their fixed order, then the exercises without a group by type — so none
  // of them silently drops out of the list. (A `strength` one without a group cannot be created;
  // it would be filed last rather than lost.)
  const muscleSections = MUSCLE_GROUPS.filter((muscleGroup) => entriesByKey.has(muscleGroup)).map(
    (muscleGroup): ExerciseListGroup => ({ muscleGroup, entries: sortedEntries(muscleGroup) }),
  );
  const typeSections = UNGROUPED_TYPE_ORDER.filter((type) => entriesByKey.has(type)).map(
    (type): ExerciseListGroup => ({ muscleGroup: FULL_BODY, type, entries: sortedEntries(type) }),
  );
  return [...muscleSections, ...typeSections];
}
