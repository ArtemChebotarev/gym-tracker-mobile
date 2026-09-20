import type { Timestamps } from './timestamps';

/**
 * A single exercise slot within a `WeekPlanDay`.
 *
 * `reps` is intentionally optional: it is only filled in by Flow C ("copy
 * previous week"). In Flow A and B there is no per-exercise `reps` — the
 * week's target RIR is shown instead. See 02 · Domain Model, "WeekPlan".
 */
export type WeekPlanExercise = {
  exerciseId: string;
  order: number;
  sets: number;
  reps?: number;
};

export type WeekPlanDay = {
  dayNumber: number;
  name: string;
  exercises: WeekPlanExercise[];
};

export type WeekPlan = {
  days: WeekPlanDay[];
};

/**
 * Mirrors `ExerciseSource` (`'catalog' | 'custom'`) but is kept as its own
 * type to keep `MesoTemplate` decoupled from `domain/catalog.ts`, the same
 * way `SessionStatus` / `SessionExerciseStatus` are kept separate from each
 * other in `domain/execution.ts` despite the shared shape.
 */
export type MesoTemplateSource = 'catalog' | 'custom';

/**
 * A reusable mesocycle blueprint: a `WeekPlan` plus the metadata needed to
 * offer it for selection. Templates carry no execution state — no statuses,
 * no dates, no actual performance data — only `createdAt`.
 *
 * Like exercises, templates come from two origins (see 02 · Domain Model):
 * `source: 'catalog'` ones ship with the app, are immutable, and can only be
 * hidden; `source: 'custom'` ones are saved by the user from their own
 * mesocycles and are freely editable.
 */
export type MesoTemplate = Timestamps & {
  id: string;
  name: string;
  source: MesoTemplateSource;
  /** 3..8, inclusive of the deload week. */
  defaultLengthWeeks: number;
  weekPlan: WeekPlan;
  isHidden: boolean;
};
