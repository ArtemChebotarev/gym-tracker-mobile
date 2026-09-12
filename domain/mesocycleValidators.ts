// Mesocycle invariant validators — see 02 · Domain Model ("Mesocycle") and
// 03 · Progression Engine ("Граничные случаи"). Kept separate from
// `domain/mesocycle.ts` (types only) per the single-responsibility rule in
// AGENTS.md.

import type { Mesocycle } from '@domain/mesocycle';

const MIN_LENGTH_WEEKS = 3;
const MAX_LENGTH_WEEKS = 8;
const MIN_DAYS_PER_WEEK = 1;
const MAX_DAYS_PER_WEEK = 7;

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
 * Throws if more than one of `mesocycles` has `status: 'active'` (02 · Domain
 * Model, "Mesocycle", invariants: "Активным может быть только один мезоцикл
 * одновременно"). Callers validate the resulting collection after adding or
 * activating a mesocycle, before persisting it.
 */
export function validateSingleActiveMesocycle(mesocycles: readonly Mesocycle[]): void {
  const activeCount = mesocycles.filter((mesocycle) => mesocycle.status === 'active').length;
  if (activeCount > 1) {
    throw new Error(`Only one mesocycle may be active at a time, found ${activeCount}.`);
  }
}

/**
 * Throws if `next` changes `lengthWeeks` or `daysPerWeek` relative to `current`
 * (02 · Domain Model, "Mesocycle", invariants: "После создания нельзя менять
 * lengthWeeks и daysPerWeek").
 */
export function validateMesocycleImmutableFields(current: Mesocycle, next: Mesocycle): void {
  if (current.lengthWeeks !== next.lengthWeeks) {
    throw new Error(
      `Mesocycle lengthWeeks is immutable after creation: was ${current.lengthWeeks}, got ${next.lengthWeeks}.`,
    );
  }
  if (current.daysPerWeek !== next.daysPerWeek) {
    throw new Error(
      `Mesocycle daysPerWeek is immutable after creation: was ${current.daysPerWeek}, got ${next.daysPerWeek}.`,
    );
  }
}
