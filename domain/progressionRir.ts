// Progression engine, rule 4 — target RIR per working week. See 03 · Progression Engine,
// "Правило 4 — целевой RIR". Pure: the same RIR for every set and exercise within a week, with no
// manual start/end RIR.
//
// The curve is a table, one row per block length, rather than a formula: it is what the block
// does, read at a glance. A block whose length never changed reads its week straight from the row;
// a week planned from the week before it (`clampedTargetRir`) is also kept within one step of that
// week — which is a no-op on an unchanged block, and what keeps the RIR from jumping once the
// length is changed mid-block (GT-240).

import type { SessionExercise } from '@domain/execution';
import { validateMesocycleLengthWeeks } from '@domain/mesocycleValidators';

/** Hard ceiling on the starting RIR (03 · Progression Engine, Правило 4). */
export const MAX_START_RIR = 3;

/**
 * Target RIR of each working week, week 1 first, by block length — the deload (the last week) is
 * not in it; its RIR is `progressionSettings.deloadRir` (Правило 5). Every row starts at most at
 * `MAX_START_RIR`, never rises, drops by at most 1 a week and ends on 0. The 3-week row stays for
 * blocks created before the editor's floor became 4 (GT-45).
 */
const RIR_BY_LENGTH: Readonly<Record<number, readonly number[]>> = {
  3: [1, 0],
  4: [2, 1, 0],
  5: [3, 2, 1, 0],
  6: [3, 3, 2, 1, 0],
  7: [3, 3, 2, 2, 1, 0],
  8: [3, 3, 2, 2, 1, 1, 0],
};

/** Number of working weeks in a block — every week except the trailing deload week. */
export function workingWeekCount(lengthWeeks: number): number {
  validateMesocycleLengthWeeks(lengthWeeks);
  return lengthWeeks - 1;
}

/** The whole RIR breakdown for a block's working weeks, week 1 first (deload excluded). */
export function rirSchedule(lengthWeeks: number): number[] {
  validateMesocycleLengthWeeks(lengthWeeks);
  return [...(RIR_BY_LENGTH[lengthWeeks] as readonly number[])];
}

/** Week 1's RIR — the block's starting RIR. */
export function startRir(lengthWeeks: number): number {
  return targetRir(lengthWeeks, 1);
}

/**
 * The table's RIR for working week `weekNumber` (1-based) of a `lengthWeeks`-week block. Throws for
 * the deload week — its RIR comes from `progressionSettings.deloadRir` (Правило 5), not from here.
 */
export function targetRir(lengthWeeks: number, weekNumber: number): number {
  const schedule = rirSchedule(lengthWeeks);
  const rir = Number.isInteger(weekNumber) ? schedule[weekNumber - 1] : undefined;
  if (rir === undefined) {
    throw new Error(
      `Working week must be an integer between 1 and ${schedule.length} for a ${lengthWeeks}-week mesocycle, got ${weekNumber}.`,
    );
  }
  return rir;
}

/**
 * The RIR of working week `weekNumber` planned from the week before it, whose RIR was
 * `previousRir`: the table's value, kept between `previousRir − 1` and `previousRir`. On a block
 * whose length never changed the table already is — so this is the table. After a length change
 * (GT-240) it is what stops the curve from jumping: a longer block never climbs back up, a
 * shorter one never drops by more than 1 a week. Without a previous week (week 1, or nothing to
 * read it from) it is the table.
 */
export function clampedTargetRir(
  lengthWeeks: number,
  weekNumber: number,
  previousRir: number | undefined,
): number {
  const table = targetRir(lengthWeeks, weekNumber);
  if (previousRir === undefined) {
    return table;
  }
  return Math.min(previousRir, Math.max(previousRir - 1, table));
}

/**
 * The target RIR a session was planned at — every exercise of a week carries the same one; the
 * highest is taken should they ever disagree. `undefined` for a session with no exercises.
 */
export function weekRirOf(
  exercises: readonly Pick<SessionExercise, 'targetRir'>[],
): number | undefined {
  return exercises.length === 0 ? undefined : Math.max(...exercises.map((e) => e.targetRir));
}
