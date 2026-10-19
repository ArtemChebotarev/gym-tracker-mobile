// Pure helpers behind components/IntervalRoundRows.tsx — a round's Work and Rest fields while the
// card is on screen (10.1 FR-9, GT-90; canvas 8.1, 8.2). A time is picked on two wheels, and the
// rounds below that aren't logged yet follow it, the way a typed weight carries into the later sets
// (task 106, `carryForward`). See the code-style skill.

import { CONFIG_TIME_RANGE_SEC, CONFIG_TIME_STEP_SEC } from '@domain/exerciseConfig';
import type { WorkoutRoundRow } from '@usecases/workoutSession';

import { carryForward, type CarriedField } from './RowCarryLogic';

/** The two times of a round the user can change in a workout. */
export type RoundTimeColumn = 'work' | 'rest';

/**
 * One time field while nothing has been logged from it. `isManual` marks a time the user picked —
 * or brought back by un-logging the round; carry-over only replaces what the plan or an earlier
 * carry-over put there.
 */
export type RoundTimeField = CarriedField & { sec: number };

/**
 * What the round fields hold beyond the plan, by column and round number. Picked-but-unlogged times
 * are never saved (05, "Сохранение данных") — this lives in the card while it's mounted, and a
 * replaced exercise starts over with none.
 */
export type RoundTimeEdits = Readonly<
  Record<RoundTimeColumn, Readonly<Record<number, RoundTimeField>>>
>;

export const NO_ROUND_TIME_EDITS: RoundTimeEdits = { work: {}, rest: {} };

/** What the picker of each column may be set to, and its step — the exercise config's own bounds. */
export const ROUND_TIME_PICKER: Record<
  RoundTimeColumn,
  { minSec: number; maxSec: number; stepSec: number }
> = {
  work: {
    minSec: CONFIG_TIME_RANGE_SEC.workSec.min,
    maxSec: CONFIG_TIME_RANGE_SEC.workSec.max,
    stepSec: CONFIG_TIME_STEP_SEC,
  },
  rest: {
    minSec: CONFIG_TIME_RANGE_SEC.restSec.min,
    maxSec: CONFIG_TIME_RANGE_SEC.restSec.max,
    stepSec: CONFIG_TIME_STEP_SEC,
  },
};

/** A time picked for round `roundNumber` — the user's own, so later carry-overs skip it. */
export function editRoundTime(
  edits: RoundTimeEdits,
  column: RoundTimeColumn,
  roundNumber: number,
  sec: number,
): RoundTimeEdits {
  return { ...edits, [column]: { ...edits[column], [roundNumber]: { sec, isManual: true } } };
}

/**
 * Un-logging a round brings its logged times back into its fields (05, "Снять отметку") — as
 * times the user stands behind, so carry-over won't overwrite them either.
 */
export function holdLoggedRound(edits: RoundTimeEdits, round: WorkoutRoundRow): RoundTimeEdits {
  if (round.log === undefined) {
    return edits;
  }
  const held = editRoundTime(edits, 'work', round.roundNumber, round.log.workSec);
  return round.log.restSec === undefined
    ? held
    : editRoundTime(held, 'rest', round.roundNumber, round.log.restSec);
}

/**
 * The time picked for round `roundNumber` fills the same column of every later round still unlogged
 * and not set by hand (canvas 8.1, "Rounds below follow") — `carryForward`'s rule. Called when the
 * picker closes.
 */
export function carryRoundTimeForward(
  edits: RoundTimeEdits,
  column: RoundTimeColumn,
  rounds: readonly WorkoutRoundRow[],
  roundNumber: number,
): RoundTimeEdits {
  const carried = carryForward(
    edits[column],
    rounds.map((round) => ({ number: round.roundNumber, logged: round.log !== undefined })),
    roundNumber,
    (field) => ({ sec: field.sec, isManual: false }),
  );
  return carried === edits[column] ? edits : { ...edits, [column]: carried };
}

/**
 * The rounds as their fields show them: an unlogged round with the times picked or carried into it,
 * a logged one as it was logged. A round with no rest planned keeps none — its Rest cell is `–` and
 * has nothing to pick. Log, the Start timer label and the timer itself read these.
 */
export function roundsWithEdits(
  rounds: readonly WorkoutRoundRow[],
  edits: RoundTimeEdits,
): WorkoutRoundRow[] {
  return rounds.map((round) => {
    if (round.log !== undefined) {
      return round;
    }
    const work = edits.work[round.roundNumber];
    const rest = edits.rest[round.roundNumber];
    const shown: WorkoutRoundRow = { ...round };
    if (work !== undefined) {
      shown.workSec = work.sec;
    }
    if (rest !== undefined && round.restSec !== undefined) {
      shown.restSec = rest.sec;
    }
    return shown;
  });
}

/** The picker's title (canvas 8.2): `Rest · round 1`. */
export function roundTimePickerTitle(column: RoundTimeColumn, roundNumber: number): string {
  return `${column === 'work' ? 'Work' : 'Rest'} · round ${roundNumber}`;
}

/**
 * The line under the picker's title (canvas 8.2), while a round below is still open to follow the
 * change; `undefined` for the last round left.
 */
export function roundTimePickerSubtitle(
  rounds: readonly WorkoutRoundRow[],
  roundNumber: number,
): string | undefined {
  const index = rounds.findIndex((round) => round.roundNumber === roundNumber);
  const followers = rounds.slice(index + 1).some((round) => round.log === undefined);
  return index !== -1 && followers ? 'Rounds below follow until you log them' : undefined;
}
