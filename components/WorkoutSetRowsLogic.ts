// Pure helpers behind components/WorkoutSetRows.tsx — the Weight fields of one exercise while it is
// on screen (task 106). See the code-style skill.

import type { Equipment } from '@domain/catalog';
import type { WorkoutSetRow } from '@usecases/workoutSession';

import { carryForward, type CarriedField } from './RowCarryLogic';
import { formatRowWeight, initialWeightText } from './WorkoutSetRowLogic';

/**
 * One Weight field of an exercise while nothing has been logged from it yet (task 106).
 * `isManual` marks a value the user put there themselves — by typing, or by un-logging a set, which
 * brings the logged weight back. Carry-over leaves those alone and only replaces what it or
 * `suggestedWeight` had supplied.
 */
export type WeightField = CarriedField & { text: string };

/**
 * What the exercise's Weight fields hold, keyed by set number. A set with no entry hasn't been
 * touched: its field shows its own `suggestedWeight` (`weightFieldText`) and carry-over may replace
 * it. Typed-but-unlogged values are never saved (05, "Сохранение данных") — this lives in the card
 * for as long as it's mounted, and a replaced exercise starts over with empty edits.
 */
export type WeightEdits = Readonly<Record<number, WeightField>>;

/**
 * The text a row's Weight field shows: the edit made to it, else what the row starts with —
 * its suggested weight, or the block's body weight on a pure bodyweight exercise (task 105).
 */
export function weightFieldText(
  edits: WeightEdits,
  row: Pick<WorkoutSetRow, 'setNumber' | 'suggestedWeight'>,
  equipment?: Equipment,
  bodyWeight?: number,
): string {
  return edits[row.setNumber]?.text ?? initialWeightText(row, equipment, bodyWeight);
}

/** Typing in a Weight field — the value becomes the user's own, so later carry-overs skip it. */
export function editWeightText(edits: WeightEdits, setNumber: number, text: string): WeightEdits {
  return { ...edits, [setNumber]: { text, isManual: true } };
}

/**
 * Un-logging a set brings the logged weight back into its field (05, "Снять отметку") — as a value
 * the user stands behind, so carry-over won't overwrite it either.
 */
export function holdLoggedWeight(
  edits: WeightEdits,
  setNumber: number,
  weight: number,
): WeightEdits {
  return { ...edits, [setNumber]: { text: formatRowWeight(weight), isManual: true } };
}

/**
 * The weight entered in one set carries into the rest of the exercise (task 106): when the cursor
 * leaves a Weight field the user typed in, its text fills every **later** set that is still
 * unlogged and still holds what `suggestedWeight` or an earlier carry-over put there — the rule is
 * `carryForward`'s. Leaving a field nobody typed in changes nothing, so tabbing through the rows
 * carries nothing.
 */
export function carryWeightForward(
  edits: WeightEdits,
  rows: readonly Pick<WorkoutSetRow, 'setNumber' | 'suggestedWeight' | 'log'>[],
  setNumber: number,
): WeightEdits {
  return carryForward(
    edits,
    rows.map((row) => ({ number: row.setNumber, logged: row.log !== undefined })),
    setNumber,
    (field) => ({ text: field.text, isManual: false }),
  );
}
