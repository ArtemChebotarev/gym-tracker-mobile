// Custom-exercise input validators — see 08.6 · Библиотека упражнений ("New exercise — лист").
// Kept separate from `domain/catalog.ts` (types only) per the single-responsibility rule in
// AGENTS.md.

import { EQUIPMENT_OPTIONS, MUSCLE_GROUPS, type Equipment, type MuscleGroup } from './catalog';

/**
 * Trims `name` and throws if the result is empty. Backs the "New exercise" sheet's Name field
 * (08.6: "Обрезается по краям, не может быть пустым") — the sheet's `Create`/`Save` button is
 * already disabled until the field is filled, this is the domain-side guarantee behind that
 * rule.
 */
export function normalizeExerciseName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error('Exercise name is required.');
  }
  return trimmed;
}

/**
 * Throws if `muscleGroup` is not one of the fixed catalog values (`MUSCLE_GROUPS`). Defends the
 * "New exercise" sheet's required Muscle group field at the domain boundary, independent of
 * whatever already constrains the UI's Dropdown.
 */
export function validateExerciseMuscleGroup(muscleGroup: MuscleGroup): void {
  if (!MUSCLE_GROUPS.includes(muscleGroup)) {
    throw new Error(`Unknown muscle group: "${muscleGroup}".`);
  }
}

/**
 * Throws if `equipment` is given but is not one of the fixed catalog values
 * (`EQUIPMENT_OPTIONS`). Unlike muscle group, equipment is optional (02 · Domain Model:
 * `equipment?: Equipment`) — `undefined` is always valid.
 */
export function validateExerciseEquipment(equipment: Equipment | undefined): void {
  if (equipment !== undefined && !EQUIPMENT_OPTIONS.includes(equipment)) {
    throw new Error(`Unknown equipment: "${equipment}".`);
  }
}
