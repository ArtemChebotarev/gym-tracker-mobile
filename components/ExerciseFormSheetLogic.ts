// Pure, non-JSX logic behind ExerciseFormSheet.tsx — see the code-style skill, "Screens keep the
// same split, one level up".

import { FULL_BODY, type Exercise, type ExerciseType, type MuscleGroup } from '@domain/catalog';
import { POWER_LOADS, type PowerLoad } from '@domain/exerciseConfig';
import { defaultExerciseConfig } from '@domain/exerciseConfigBuilders';

import type { ExerciseFormValues } from './ExerciseFormSheet';

/**
 * A catalog exercise is immutable (02 · Domain Model: "Записи с source = catalog неизменяемы") —
 * this sheet only ever creates or edits custom exercises (08.6: "Каталожное упражнение открыть
 * в этом листе нельзя").
 */
export function isExerciseEditableInSheet(exercise: Exercise): boolean {
  return exercise.source === 'custom';
}

/**
 * Name is always required. The muscle group is required only for `strength` — the others may have
 * none (10.1 FR-1: "Мышечная группа у не-strength необязательна"), which is stored as `fullBody`.
 * Equipment is optional and never gates the Create/Save button.
 */
export function canSubmitExerciseForm(
  name: string,
  muscleGroup: MuscleGroup | undefined,
  type: ExerciseType,
): boolean {
  if (name.trim().length === 0) {
    return false;
  }
  return type !== 'strength' || (muscleGroup !== undefined && muscleGroup !== FULL_BODY);
}

/**
 * The values after the user picks `type` in the sheet's first step: the type's system defaults
 * (10.1 FR-9), and a muscle group that is legal for it — `fullBody` is not a choice for `strength`,
 * and a non-strength exercise starts without one.
 */
export function valuesForType(values: ExerciseFormValues, type: ExerciseType): ExerciseFormValues {
  const muscleGroup =
    type === 'strength'
      ? values.muscleGroup === FULL_BODY
        ? undefined
        : values.muscleGroup
      : (values.muscleGroup ?? FULL_BODY);
  return { ...values, type, config: defaultExerciseConfig(type), muscleGroup };
}

/** `m:ss` for a number of seconds — the shape every duration in the hybrid sheets is shown in. */
export function formatClock(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** What each power load is called where it is picked (10.1 FR-2). */
export const POWER_LOAD_LABEL: Record<PowerLoad, string> = {
  weight: 'Kg',
  level: 'Level',
  none: 'None',
};

/** The segments of the load control, in the order of FR-2. */
export const POWER_LOAD_OPTIONS = POWER_LOADS.map((load) => ({
  value: load,
  label: POWER_LOAD_LABEL[load],
}));

/** The line under the load control: what the picked load means, with an example from FR-2. */
export function describePowerLoad(load: PowerLoad): string {
  switch (load) {
    case 'weight':
      return 'A medicine ball or a kettlebell: you log the kilograms.';
    case 'level':
      return 'A box with several heights: you log the level, 1, 2 or 3.';
    case 'none':
      return 'A broad jump or a clap push-up: the exercise is its own load.';
  }
}

/** The power load a form value names; `weight` for anything else, so a stray value still shows. */
export function powerLoadFromValue(value: string): PowerLoad {
  return POWER_LOADS.find((load) => load === value) ?? 'weight';
}
