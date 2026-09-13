// Muscle-group display labels — see 08.6 · Библиотека упражнений ("Заголовок секции: ...
// название группы"). `MuscleGroup` values are lowercase domain ids (`chest`, `traps`, ...);
// this is the single place that turns one into the capitalized label a screen shows, mirroring
// design/muscleGroupColor.ts's pattern of keeping a `Record<MuscleGroup, T>` so a new muscle
// group fails to compile here until it's given a label.

import type { MuscleGroup } from '@domain/catalog';

const LABEL_BY_MUSCLE_GROUP: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  shoulders: 'Shoulders',
  quads: 'Quads',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  abs: 'Abs',
  traps: 'Traps',
};

export function getMuscleGroupLabel(muscleGroup: MuscleGroup): string {
  return LABEL_BY_MUSCLE_GROUP[muscleGroup];
}
