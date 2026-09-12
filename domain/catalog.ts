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

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type ExerciseSource = 'catalog' | 'custom';

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'other';

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

export type Exercise = {
  id: ExerciseId;
  name: string;
  muscleGroup: MuscleGroup;
  source: ExerciseSource;
  equipment?: Equipment;
  isHidden: boolean;
};
