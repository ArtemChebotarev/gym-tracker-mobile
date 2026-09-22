// Mesocycle invariant validators — see 02 · Domain Model ("Mesocycle") and
// 03 · Progression Engine ("Граничные случаи"). Kept separate from
// `domain/mesocycle.ts` (types only) per the single-responsibility rule in
// AGENTS.md.

import type { Mesocycle } from '@domain/mesocycle';
import type { WeekPlan } from '@domain/plan';

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
