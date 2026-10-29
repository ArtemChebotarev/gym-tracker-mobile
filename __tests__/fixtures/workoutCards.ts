import type { WorkoutExercise, WorkoutSetRow } from '@usecases/workoutSession';

/**
 * The set rows of a workout card the test expects to be a strength or power one — an interval card
 * has rounds instead. Throws for anything else, so a test never passes on an empty list.
 */
export function rowsOf(card: WorkoutExercise | undefined): WorkoutSetRow[] {
  if (card === undefined || !('rows' in card)) {
    throw new Error(`Expected a card of set rows, got ${card === undefined ? 'none' : card.type}.`);
  }
  return card.rows;
}
