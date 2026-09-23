// Mesocycle invariant validators — see 02 · Domain Model ("Mesocycle") and
// 03 · Progression Engine ("Граничные случаи"). Kept separate from
// `domain/mesocycle.ts` (types only) per the single-responsibility rule in
// AGENTS.md.

import { ConflictError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import type { WeekPlan } from '@domain/plan';
import { isDeloadWeek } from '@domain/progressionPlan';

// Exported so callers that need the same bounds (e.g. the mesocycle editor's Stepper props —
// see 08.5 · Редактор мезоцикла — Flow A, "Шаг 1 — Basics") reuse them instead of hand-copying
// the numbers.
export const MIN_LENGTH_WEEKS = 3;
export const MAX_LENGTH_WEEKS = 8;
export const MIN_DAYS_PER_WEEK = 1;
export const MAX_DAYS_PER_WEEK = 7;

/**
 * Throws if `lengthWeeks` is outside the 3..8 range (03 · Progression Engine,
 * "Граничные случаи").
 */
export function validateMesocycleLengthWeeks(lengthWeeks: number): void {
  if (lengthWeeks < MIN_LENGTH_WEEKS || lengthWeeks > MAX_LENGTH_WEEKS) {
    throw new Error(
      `Mesocycle lengthWeeks must be between ${MIN_LENGTH_WEEKS} and ${MAX_LENGTH_WEEKS}, got ${lengthWeeks}.`,
    );
  }
}

/**
 * Throws if `daysPerWeek` is outside the 1..7 range (03 · Progression Engine,
 * "Граничные случаи").
 */
export function validateMesocycleDaysPerWeek(daysPerWeek: number): void {
  if (daysPerWeek < MIN_DAYS_PER_WEEK || daysPerWeek > MAX_DAYS_PER_WEEK) {
    throw new Error(
      `Mesocycle daysPerWeek must be between ${MIN_DAYS_PER_WEEK} and ${MAX_DAYS_PER_WEEK}, got ${daysPerWeek}.`,
    );
  }
}

/**
 * Throws if `weekPlan` doesn't have exactly one `WeekPlanDay` per day of the week (04 · Meso
 * Creation Flows, Flow A, step 1: `daysPerWeek` and the days added on step 2 must agree —
 * used by `buildScratchMesocycleDraft` in `domain/mesocycleBuilders.ts` before a draft is
 * allowed to become a `Mesocycle`).
 */
export function validateWeekPlanDayCount(weekPlan: WeekPlan, daysPerWeek: number): void {
  if (weekPlan.days.length !== daysPerWeek) {
    throw new Error(
      `WeekPlan must have exactly ${daysPerWeek} day(s) to match daysPerWeek, got ${weekPlan.days.length}.`,
    );
  }
}

/**
 * Throws if `next` changes `lengthWeeks` or `daysPerWeek` relative to `current`
 * (02 · Domain Model, "Mesocycle", invariants: "После Start нельзя менять
 * lengthWeeks и daysPerWeek"). Applies to a mesocycle that has been started
 * (`active` and later) — a `planned` one is still fully editable, see
 * `applyPlannedMesocycleEdit` in `domain/mesocycleBuilders.ts`.
 */
export function validateMesocycleImmutableFields(current: Mesocycle, next: Mesocycle): void {
  if (current.lengthWeeks !== next.lengthWeeks) {
    throw new Error(
      `Mesocycle lengthWeeks is immutable after Start: was ${current.lengthWeeks}, got ${next.lengthWeeks}.`,
    );
  }
  if (current.daysPerWeek !== next.daysPerWeek) {
    throw new Error(
      `Mesocycle daysPerWeek is immutable after Start: was ${current.daysPerWeek}, got ${next.daysPerWeek}.`,
    );
  }
}

/**
 * Throws if week `weekNumber` of `source` can't be copied as Flow C's source week (04 · Meso
 * Creation Flows, "Запрет копирования deload-недели"). The deload week is the only one barred:
 * it carries an artificially cut volume and half the weight, so as a starting point it says
 * nothing.
 *
 * Nothing else is checked here. A week with no finished session at all copies like any other
 * (решение 22.09.2026) — structure is there whether or not it was trained — and a week lazy
 * generation never reached has no sessions, so it can't be offered in the first place.
 */
export function validateCopyableSourceWeek(
  source: Pick<Mesocycle, 'lengthWeeks'>,
  weekNumber: number,
): void {
  if (isDeloadWeek(source.lengthWeeks, weekNumber)) {
    throw new Error(
      `Week ${weekNumber} is the deload week of a ${source.lengthWeeks}-week mesocycle and cannot be copied.`,
    );
  }
}

/** A mesocycle that has passed `validateMesocycleCanStart` — its draft week 1 is there to build. */
export type StartableMesocycle = Mesocycle & { weekPlan: WeekPlan };

/**
 * Throws `ConflictError` unless `mesocycle` can be started right now (04 · Meso Creation Flows,
 * "Запуск (Start)"): it must be `planned`, it must still carry its draft week 1, and no other
 * mesocycle may be `active` — at most one runs at a time (02 · Domain Model).
 *
 * Its own guard so Start can ask before doing any work: a `copyWeek` block reads every exercise's
 * history to price week 1 (task 122), and there is no reason to read any of it for a launch that
 * was never going to happen. `buildMesocycleStart` asks again — it is a public function and stays
 * safe on its own — but the answer costs nothing, so the two calls are the same check, not a
 * second copy of it.
 */
export function validateMesocycleCanStart(
  mesocycle: Mesocycle,
  active: Mesocycle | null,
): asserts mesocycle is StartableMesocycle {
  if (mesocycle.status !== 'planned') {
    throw new ConflictError(
      `Mesocycle "${mesocycle.id}" is ${mesocycle.status}; only planned ones can be started.`,
    );
  }
  if (active !== null) {
    throw new ConflictError(
      `Mesocycle "${active.id}" is still active; finish it before starting "${mesocycle.id}".`,
    );
  }
  if (mesocycle.weekPlan === undefined) {
    throw new ConflictError(`Mesocycle "${mesocycle.id}" has no week plan to start.`);
  }
}
