// Pure helpers behind components/WorkoutExerciseCard.tsx — see the code-style skill.

import type { WorkoutMode } from '@domain/workoutView';
import type { ExerciseWeightHint } from '@domain/workoutViewRules';
import type { WorkoutExercise, WorkoutSetRow } from '@usecases/workoutSession';

import { formatRowWeight, initialWeightText } from './WorkoutSetRowLogic';

/**
 * What a card shows (08.7, "Карточка упражнения"). The four variants come from the screen mode
 * plus the exercise's own status:
 * - live — everything, including `⋯`;
 * - read-only — no `⋯`;
 * - skipped (either mode) — the card at 50% opacity. With sets logged, every row shows: the logged
 *   ones as usual, the rest as `Skipped` rows. With nothing logged, one `Skipped` line in place of
 *   the rows;
 * - preview — no RIR badge, no set rows, the `Not programmed yet` plate instead.
 * The history button is there in every variant.
 */
export type ExerciseCardView = {
  showMenu: boolean;
  /** `2 RIR`, or `undefined` when the badge isn't shown. */
  rirLabel: string | undefined;
  isSkipped: boolean;
  /** The column header and set rows — everything but preview and a skipped card with nothing logged. */
  showSets: boolean;
  /** Skipped with nothing logged: one `Skipped` line instead of the rows. */
  showSkippedNote: boolean;
  showNotProgrammed: boolean;
};

export function exerciseCardView(
  mode: WorkoutMode,
  exercise: Pick<WorkoutExercise, 'status' | 'targetRir' | 'rows'>,
): ExerciseCardView {
  const isPreview = mode === 'preview';
  const isSkipped = !isPreview && exercise.status === 'skipped';
  const skippedWhole = isSkipped && exercise.rows.every((row) => row.isSkipped === true);
  return {
    showMenu: mode === 'live',
    rirLabel:
      !isPreview && exercise.targetRir !== undefined ? formatRir(exercise.targetRir) : undefined,
    isSkipped,
    showSets: !isPreview && !skippedWhole && exercise.rows.length > 0,
    showSkippedNote: skippedWhole,
    showNotProgrammed: isPreview,
  };
}

/** `2 RIR` — the chip, and the reps placeholder of a row with no `targetReps`. */
export function formatRir(rir: number): string {
  return `${rir} RIR`;
}

/**
 * The group chip sits above a card only when its muscle group differs from the previous card's
 * (08.7, "Список упражнений") — so the first card always gets one.
 */
export function showsGroupChip(
  exercises: readonly Pick<WorkoutExercise, 'muscleGroup'>[],
  index: number,
): boolean {
  const current = exercises[index];
  if (current === undefined) {
    return false;
  }
  return index === 0 || exercises[index - 1]?.muscleGroup !== current.muscleGroup;
}

/** The card's weight hint line: `Go heavier — 30+ reps last week` / `Go lighter — under 5 reps…`. */
export function formatWeightHint(hint: ExerciseWeightHint): string {
  return hint.direction === 'increase'
    ? `Go heavier — ${hint.reps}+ reps last week`
    : `Go lighter — under ${hint.reps} reps last week`;
}

/**
 * One Weight field of an exercise while nothing has been logged from it yet (task 106).
 * `isManual` marks a value the user put there themselves — by typing, or by un-logging a set, which
 * brings the logged weight back. Carry-over leaves those alone and only replaces what it or
 * `suggestedWeight` had supplied.
 */
export type WeightField = {
  text: string;
  isManual: boolean;
};

/**
 * What the exercise's Weight fields hold, keyed by set number. A set with no entry hasn't been
 * touched: its field shows its own `suggestedWeight` (`weightFieldText`) and carry-over may replace
 * it. Typed-but-unlogged values are never saved (05, "Сохранение данных") — this lives in the card
 * for as long as it's mounted, and a replaced exercise starts over with empty edits.
 */
export type WeightEdits = Readonly<Record<number, WeightField>>;

/** The text a row's Weight field shows: the edit made to it, else its suggested weight. */
export function weightFieldText(
  edits: WeightEdits,
  row: Pick<WorkoutSetRow, 'setNumber' | 'suggestedWeight'>,
): string {
  return edits[row.setNumber]?.text ?? initialWeightText(row);
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
 * unlogged and still holds what `suggestedWeight` or an earlier carry-over put there. Logged sets
 * never change ("История неизменяема"), and neither does a field the user typed in themselves —
 * correcting set 2 leaves a set 3 you already set by hand alone.
 *
 * Leaving a field nobody typed in changes nothing, so tabbing through the rows carries nothing.
 */
export function carryWeightForward(
  edits: WeightEdits,
  rows: readonly Pick<WorkoutSetRow, 'setNumber' | 'suggestedWeight' | 'log'>[],
  setNumber: number,
): WeightEdits {
  const index = rows.findIndex((row) => row.setNumber === setNumber);
  if (index === -1 || edits[setNumber]?.isManual !== true) {
    return edits;
  }
  const { text } = edits[setNumber];
  const carried: Record<number, WeightField> = {};
  for (const row of rows.slice(index + 1)) {
    if (row.log === undefined && edits[row.setNumber]?.isManual !== true) {
      carried[row.setNumber] = { text, isManual: false };
    }
  }
  return { ...edits, ...carried };
}
