export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'shoulders'
  | 'quads'
  | 'glutes'
  | 'hamstrings'
  | 'calves'
  | 'abs';

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
