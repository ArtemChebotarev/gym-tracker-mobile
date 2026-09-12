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
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type ExerciseSource = 'catalog' | 'custom';

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'other';

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  source: ExerciseSource;
  equipment?: Equipment;
  isHidden: boolean;
};
