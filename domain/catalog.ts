import type { ExerciseConfig } from './exerciseConfig';
import type { Timestamps } from './timestamps';

// The single source of truth for the fixed muscle group catalog (02 · Domain Model:
// "Группа мышц — фиксированный enum прямо на упражнении, не отдельная сущность"). The type
// is derived from this array — rather than hand-written separately — so a repository that
// needs to enumerate every muscle group (e.g. MuscleGroupRepository.getAll()) reuses this
// constant instead of re-listing the same values.
export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'biceps',
  'triceps',
  'forearms',
  'shoulders',
  'quads',
  'glutes',
  'hamstrings',
  'calves',
  'abs',
  'traps',
] as const;

// What a non-strength exercise holds when it has no one priority group — a medball slam or a row
// on the ergometer works the whole body (10 · Hybrid Exercises). A value of its own rather than a
// nullable `muscleGroup`, so every reader of the field still gets a value.
//
// It is deliberately in the `MuscleGroup` type but *not* in `MUSCLE_GROUPS`: that list is the
// fixed set a strength exercise is filed under, volume is counted by, and the filters and the
// exercise form offer. A strength exercise may not be `fullBody`
// (`validateExerciseMuscleGroupFor`), and what enumerates `MUSCLE_GROUPS` stays as it was.
export const FULL_BODY = 'fullBody' as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number] | typeof FULL_BODY;

/** Whether `value` is one of the twelve `MUSCLE_GROUPS` — a real group, so not `fullBody`. */
export function isCatalogMuscleGroup(value: string): value is (typeof MUSCLE_GROUPS)[number] {
  return (MUSCLE_GROUPS as readonly string[]).includes(value);
}

// What an exercise is, which decides what a set of it logs and which progression rules apply
// (10 · Hybrid Exercises, "Типы упражнений"). Same shape as MUSCLE_GROUPS above: the array is the
// single list, the type is derived from it.
export const EXERCISE_TYPES = ['strength', 'power', 'interval', 'mobility'] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export type ExerciseSource = 'catalog' | 'custom';

// Same reasoning as MUSCLE_GROUPS above: an array of the fixed values, with the type derived
// from it, so a repository or UI that needs to enumerate every equipment value (e.g. the New/Edit
// exercise sheet's dropdown) reuses this constant instead of re-listing the same values.
export const EQUIPMENT_OPTIONS = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  // Task 105: a bodyweight movement you hang extra weight on (weighted pull-ups, dips). It is its
  // own equipment rather than a flag on `Exercise` because the two load differently — a pure
  // bodyweight set is the body weight and nothing else, so it has no weight to progress, while a
  // weighted one progresses on the added weight alone. Keeping it here means the filters and the
  // New exercise sheet pick it up for free.
  'bodyweight-weighted',
  'other',
] as const;

export type Equipment = (typeof EQUIPMENT_OPTIONS)[number];

// Branded so an ExerciseId can't be passed where another entity's id is expected (both are
// plain strings otherwise). Zero runtime cost — the brand only exists at the type level, and
// an ExerciseId serializes/compares exactly like the string it wraps.
export type ExerciseId = string & { readonly __brand: 'ExerciseId' };

// The only way to obtain an ExerciseId: wrap a hand-picked catalog slug (02 · Domain Model,
// "Идентификаторы каталога прошиты в приложение") or a generateId() result for a custom
// exercise. Never generate catalog ids at runtime — see domain/exerciseCatalog.ts.
export function toExerciseId(id: string): ExerciseId {
  return id as ExerciseId;
}

export type Exercise = Timestamps & {
  id: ExerciseId;
  name: string;
  muscleGroup: MuscleGroup;
  source: ExerciseSource;
  equipment?: Equipment;
  isHidden: boolean;
  /**
   * Absent means `strength` — every exercise that predates the hybrid types, and every one the
   * app still creates by default. Read it through `exerciseTypeOf` rather than `?? 'strength'`
   * at the call site. Never changes once the exercise has a logged set (`assertTypeUnchanged`).
   */
  type?: ExerciseType;
  /**
   * The defaults that belong to the exercise's type (see `ExerciseConfig`). Absent for
   * `strength`, which has none; present for the other three, with its own `type` matching this
   * exercise's.
   */
  config?: ExerciseConfig;
};
