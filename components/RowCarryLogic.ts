// The carry-over of a field's value into the later rows of the same exercise (task 106): a weight
// typed in one set of a strength or power card (WorkoutSetRowsLogic.ts), a time picked for one
// round of an interval card (IntervalRoundRowsLogic.ts, GT-90). One rule for both — see the
// code-style skill.

/** A field the carry-over may write. `isManual` marks a value the user put there themselves. */
export type CarriedField = { isManual: boolean };

/** A row as the carry-over reads it: its number, and whether it is logged. */
export type CarryRow = { number: number; logged: boolean };

/**
 * The value the user put in row `rowNumber` fills every **later** row that is still unlogged and
 * still holds what the plan or an earlier carry-over put there (`asCarried` makes that copy). Logged
 * rows never change ("История неизменяема"), and neither does a field the user set themselves —
 * correcting row 2 leaves a row 3 you already set by hand alone. A row nobody edited carries
 * nothing.
 */
export function carryForward<F extends CarriedField>(
  edits: Readonly<Record<number, F>>,
  rows: readonly CarryRow[],
  rowNumber: number,
  asCarried: (field: F) => F,
): Readonly<Record<number, F>> {
  const index = rows.findIndex((row) => row.number === rowNumber);
  const field = edits[rowNumber];
  if (index === -1 || field === undefined || !field.isManual) {
    return edits;
  }
  const carried: Record<number, F> = {};
  for (const row of rows.slice(index + 1)) {
    if (!row.logged && edits[row.number]?.isManual !== true) {
      carried[row.number] = asCarried(field);
    }
  }
  return { ...edits, ...carried };
}
