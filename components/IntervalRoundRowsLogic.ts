// Pure helpers behind components/IntervalRoundRows.tsx — a round's Work and Rest fields while the
// card is on screen (10.1 FR-9, GT-90, GT-187; canvas 8.1, 8.2). A time is picked on two wheels, and
// the rounds below that aren't logged yet follow it, the way a typed weight carries into the later
// sets (task 106, `carryForward`). With no history a round's fields start empty, and the first pick
// fills them. See the code-style skill.

import { ROUND_TIME_BOUNDS, type RoundTimeColumn } from '@domain/roundTimes';
import type { WorkoutRoundRow } from '@usecases/workoutSession';

import { carryForward, type CarriedField } from './RowCarryLogic';

export type { RoundTimeColumn } from '@domain/roundTimes';

/**
 * One time field the user has touched on this visit. `isManual` marks a time the user picked — or
 * brought back by un-logging the round; carry-over only replaces what the plan or an earlier
 * carry-over put there.
 */
export type RoundTimeField = CarriedField & { sec: number };

/**
 * What the round fields hold beyond the model, by column and round number. A picked time is saved
 * as the rounds' plan when the picker closes (`roundTimeToSave`, GT-187), and the model comes back
 * with it; this keeps the screen from waiting on that, and remembers which times were picked by
 * hand while the card is mounted, so a later carry-over passes them by.
 */
export type RoundTimeEdits = Readonly<
  Record<RoundTimeColumn, Readonly<Record<number, RoundTimeField>>>
>;

export const NO_ROUND_TIME_EDITS: RoundTimeEdits = { work: {}, rest: {} };

/** What the picker of each column may be set to, and its step — the round time's own bounds. */
export const ROUND_TIME_PICKER = ROUND_TIME_BOUNDS;

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
 * The rest a round's Rest field shows. A logged round shows the rest it took — but a skipped rest
 * shows the planned one, and so does a round logged without a rest (the last one the timer ran):
 * Skip rest is a here-and-now call that changes neither the plan nor next week (Artem, 20.10.2026):
 * the planned rest is what un-logging brings back and where the picker starts. The field itself
 * reads `Skipped` (GT-102). An unlogged round shows its planned rest.
 */
export function shownRestSec(round: WorkoutRoundRow): number | undefined {
  const log = round.log;
  if (log === undefined || log.restSkipped || log.restSec === undefined) {
    return round.restSec;
  }
  return log.restSec;
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
  const restSec = shownRestSec(round);
  return restSec === undefined ? held : editRoundTime(held, 'rest', round.roundNumber, restSec);
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
 * The edits once the rounds change under the card — Add round, Remove last round (GT-91). A round
 * added after the last one is one more of it: while that one is unlogged, whatever its fields hold
 * beyond the plan — picked or carried — fills the new round too, as a carry-over (the stored round
 * copies a logged one's times itself, `withAddedRound`). A removed round's edits go with it, so a
 * round added back in its place starts from the plan, not from what was picked for the old one.
 */
export function followRoundChanges(
  edits: RoundTimeEdits,
  previous: readonly WorkoutRoundRow[],
  rounds: readonly WorkoutRoundRow[],
): RoundTimeEdits {
  const present = new Set(rounds.map((round) => round.roundNumber));
  const last = previous.at(-1);
  const added = rounds.filter(
    (round) => last !== undefined && round.roundNumber > last.roundNumber,
  );
  const removed = previous.some((round) => !present.has(round.roundNumber));
  if (added.length === 0 && !removed) {
    return edits;
  }
  const follow = (column: RoundTimeColumn) => {
    const kept = Object.fromEntries(
      Object.entries(edits[column]).filter(([roundNumber]) => present.has(Number(roundNumber))),
    );
    const source =
      last?.log === undefined && last !== undefined ? kept[last.roundNumber] : undefined;
    if (source !== undefined) {
      for (const round of added) {
        kept[round.roundNumber] = { sec: source.sec, isManual: false };
      }
    }
    return kept;
  };
  return { work: follow('work'), rest: follow('rest') };
}

/**
 * The rounds as their fields show them: an unlogged round with the times picked or carried into it,
 * a logged one as it was logged. Log, the Start timer label and the timer itself read these.
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
    if (rest !== undefined) {
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

/**
 * Where the picker's wheels stand when it opens on round `roundNumber` (GT-187): the time the field
 * holds; an empty one starts from the nearest round above that has a time in this column, else from
 * the column's least time. Not a default — nothing is kept until the picker closes.
 */
export function pickerStartSec(
  rounds: readonly WorkoutRoundRow[],
  column: RoundTimeColumn,
  roundNumber: number,
): number {
  const secOf = (round: WorkoutRoundRow) =>
    column === 'work' ? (round.log?.workSec ?? round.workSec) : shownRestSec(round);
  const index = rounds.findIndex((round) => round.roundNumber === roundNumber);
  const upToOwn = index === -1 ? [] : rounds.slice(0, index + 1);
  const sec = upToOwn
    .map(secOf)
    .reverse()
    .find((each) => each !== undefined);
  return sec ?? ROUND_TIME_PICKER[column].minSec;
}

/**
 * What to save once the picker of round `roundNumber` closes (GT-187): the time it holds, for that
 * round and every round below it the carry-over changed (`before` → `after`, see
 * `carryRoundTimeForward`). `undefined` when nothing was picked there.
 */
export function roundTimeToSave(
  before: RoundTimeEdits,
  after: RoundTimeEdits,
  column: RoundTimeColumn,
  roundNumber: number,
): { sec: number; roundNumbers: number[] } | undefined {
  const picked = after[column][roundNumber];
  if (picked === undefined) {
    return undefined;
  }
  const followers = Object.keys(after[column])
    .map(Number)
    .filter((n) => n !== roundNumber && after[column][n] !== before[column][n]);
  return { sec: picked.sec, roundNumbers: [roundNumber, ...followers.sort((a, b) => a - b)] };
}
