// Pure, non-JSX logic behind ExerciseFormScreen.tsx — see the code-style skill, "Screens keep the
// same split, one level up".

import { FULL_BODY, type Exercise, type ExerciseType, type MuscleGroup } from '@domain/catalog';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { equipmentOptionsFor } from '@domain/exerciseEquipment';
import { POWER_LOADS, type PowerLoad } from '@domain/exerciseConfig';
import { defaultExerciseConfig } from '@domain/exerciseConfigBuilders';

import type { ExerciseFormValues } from './ExerciseFormValues';

/**
 * A catalog exercise is immutable (02 · Domain Model: "Записи с source = catalog неизменяемы") —
 * the form only ever creates or edits custom exercises (08.6: "Каталожное упражнение открыть
 * в этом листе нельзя").
 */
export function isExerciseEditable(exercise: Exercise): boolean {
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
      return 'You log the kilograms, e.g. a medicine ball or a kettlebell.';
    case 'level':
      return 'You log a level, 1, 2 or 3, e.g. a box with several heights.';
    case 'none':
      return 'No load to log, e.g. a broad jump or a clap push-up.';
  }
}

/** The power load a form value names; `weight` for anything else, so a stray value still shows. */
export function powerLoadFromValue(value: string): PowerLoad {
  return POWER_LOADS.find((load) => load === value) ?? 'weight';
}

/** `options` by label, A to Z, so a long list can be scanned; the caller's array is left alone. */
export function sortedByLabel<T extends { label: string }>(options: readonly T[]): T[] {
  return [...options].sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * The equipment dropdown's options for `type`: its own list (10.1 FR-1), not every value there is,
 * by name with `Other` last — the catch-all is the last thing to look for, not the 14th letter.
 */
export function equipmentDropdownOptions(type: ExerciseType) {
  const options = equipmentOptionsFor(type)
    .filter((equipment) => equipment !== 'other')
    .map((equipment) => ({ value: equipment, label: getEquipmentLabel(equipment) }));
  const hasOther = equipmentOptionsFor(type).includes('other');
  return [
    ...sortedByLabel(options),
    ...(hasOther ? [{ value: 'other' as const, label: getEquipmentLabel('other') }] : []),
  ];
}
