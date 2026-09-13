// Pure, non-JSX logic behind ExerciseFormSheet.tsx — see the code-style skill, "Screens keep the
// same split, one level up".

import type { Exercise, MuscleGroup } from '@domain/catalog';

/**
 * A catalog exercise is immutable (02 · Domain Model: "Записи с source = catalog неизменяемы") —
 * this sheet only ever creates or edits custom exercises (08.6: "Каталожное упражнение открыть
 * в этом листе нельзя").
 */
export function isExerciseEditableInSheet(exercise: Exercise): boolean {
  return exercise.source === 'custom';
}

/** Name and muscle group are the two required fields (08.6, "New exercise — лист"); equipment
 * is optional and never gates the Create/Save button. */
export function canSubmitExerciseForm(name: string, muscleGroup: MuscleGroup | undefined): boolean {
  return name.trim().length > 0 && muscleGroup !== undefined;
}
