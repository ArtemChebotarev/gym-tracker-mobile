// Pure math behind `useDragReorder` (useDragReorder.ts) — the hand-rolled drag-to-reorder shared
// by the editor's exercise rows (task 080) and the Reorder days sheet (GT-270). Moved here from
// MesoEditorDaysStepLogic.ts when the second list arrived; see useDragReorder.ts for why the drag
// is hand-rolled on PanResponder/Animated rather than a library.

import type { Animated } from 'react-native';

/**
 * Which slot a drag starting at `fromIndex` and moving `dragDistance` points (positive = down)
 * lands on, given `itemCount` same-height rows. Deliberately stateless — always computed from the
 * *total* distance since the gesture started, not incrementally — so it can't drift the way a
 * running "current position" tally could.
 */
export function dragTargetIndex(
  fromIndex: number,
  dragDistance: number,
  itemCount: number,
  rowHeight: number,
): number {
  const rawIndex = fromIndex + Math.round(dragDistance / rowHeight);
  return Math.max(0, Math.min(itemCount - 1, rawIndex));
}

/**
 * How many rows a *non-dragged* row at `rowIndex` should shift, in row-height units (-1, 0, or
 * +1), to visually make room for a drag currently previewing a move from `fromIndex` to
 * `hoverIndex` — the "other rows slide out of the way while you drag" effect. Dragging down
 * pushes the rows strictly between the origin and the hover slot up by one; dragging up pushes
 * the rows between the hover slot and the origin down by one. Rows outside that span, and the
 * dragged row itself (rowIndex === fromIndex), never shift.
 */
export function rowShiftUnits(rowIndex: number, fromIndex: number, hoverIndex: number): number {
  if (fromIndex === hoverIndex) {
    return 0;
  }
  if (fromIndex < hoverIndex) {
    return rowIndex > fromIndex && rowIndex <= hoverIndex ? -1 : 0;
  }
  return rowIndex >= hoverIndex && rowIndex < fromIndex ? 1 : 0;
}

/** The permutation of original indices produced by moving the item at `fromIndex` to `toIndex` —
 * what `useDragReorder` hands its `onReorder` (e.g. `reorderDayExercises`'s `newOrder`). */
export function moveIndex(itemCount: number, fromIndex: number, toIndex: number): number[] {
  const order = Array.from({ length: itemCount }, (_, index) => index);
  const moved = order.splice(fromIndex, 1)[0];
  if (moved === undefined) {
    return order;
  }
  order.splice(toIndex, 0, moved);
  return order;
}

/**
 * Ends a drag: cancels each row's in-flight push-preview spring (started by
 * useDragReorder's effect on the row's *previous* hoverIndex) before snapping every
 * offset back to 0. `setValue()` alone isn't enough — it doesn't stop an animation already
 * running via `.start()`, so a spring still mid-flight from the last `onPanResponderMove` kept
 * emitting its own frames afterward and stomped a plain reset a moment later, producing a brief
 * "two rows swap, then settle back" flash on-device before this fix.
 */
export function resetRowShiftAnimations(rowShiftAnimations: readonly Animated.Value[]): void {
  rowShiftAnimations.forEach((animation) => {
    animation.stopAnimation();
    animation.setValue(0);
  });
}
