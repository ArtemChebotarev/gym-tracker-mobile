// Pure, non-JSX logic behind MesoEditorAddExerciseSheet.tsx — see the code-style skill, "Screens
// keep the same split, one level up".

import type { ExerciseId } from '@domain/catalog';

/** Adds `id` to the selection if absent, removes it if present — the sheet's own checkbox toggle
 * (08.5, "Шаг 2a": "чекбокс слева у каждой строки"). */
export function toggleExerciseSelection(
  selectedIds: readonly ExerciseId[],
  id: ExerciseId,
): ExerciseId[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((selectedId) => selectedId !== id)
    : [...selectedIds, id];
}

/** Confirm-button copy (task 077: `Add N exercises`, disabled — not relabeled — at zero). */
export function confirmButtonLabel(count: number): string {
  return `Add ${count} exercise${count === 1 ? '' : 's'}`;
}
