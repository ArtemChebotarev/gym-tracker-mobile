// The in-progress values of the New / Edit exercise page, and what it hands over on submit.

import type { Equipment, ExerciseType, MuscleGroup } from '@domain/catalog';
import type { ExerciseConfig } from '@domain/exerciseConfig';

export type ExerciseFormValues = {
  name: string;
  muscleGroup: MuscleGroup | undefined;
  equipment: Equipment | undefined;
  /** What the exercise is (10.1 FR-1). Picked on the type sheet when creating. */
  type: ExerciseType;
  /** The type's defaults (FR-9); `undefined` exactly when `type` is `strength`. */
  config: ExerciseConfig | undefined;
};

export const EMPTY_EXERCISE_FORM_VALUES: ExerciseFormValues = {
  name: '',
  muscleGroup: undefined,
  equipment: undefined,
  type: 'strength',
  config: undefined,
};

export type ExerciseFormSubmitInput = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: Equipment;
  type: ExerciseType;
  config?: ExerciseConfig;
};
