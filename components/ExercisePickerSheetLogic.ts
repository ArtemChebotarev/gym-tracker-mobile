// Pure, non-JSX logic behind ExercisePickerSheet.tsx — see the code-style skill, "Screens keep
// the same split, one level up".
//
// Moved here from the old MesoEditorAddExerciseSheetLogic.ts (task 077) as part of task 079's
// exercise-picker refactor — these two helpers back the `multi` mode's checkbox selection and
// footer copy, and are no longer specific to the mesocycle editor's day sheet.

import type { ExerciseId } from '@domain/catalog';

/** Adds `id` to the selection if absent, removes it if present — `multi` mode's own checkbox
 * toggle (08.5, "Шаг 2a": "чекбокс слева у каждой строки"). */
export function toggleExerciseSelection(
  selectedIds: readonly ExerciseId[],
  id: ExerciseId,
): ExerciseId[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((selectedId) => selectedId !== id)
    : [...selectedIds, id];
}

/** Confirm-button copy for `multi` mode (task 077: `Add N exercises`, disabled — not relabeled —
 * at zero). */
export function confirmButtonLabel(count: number): string {
  return `Add ${count} exercise${count === 1 ? '' : 's'}`;
}
