import type { Timestamps } from './timestamps';

/**
 * A single exercise slot within a `WeekPlanDay`: which exercise, in what position, for how
 * many sets. Structure only — a `WeekPlan` carries no reps, no weights and no execution state
 * in any flow (04 · Meso Creation Flows, "Что копируется").
 *
 * It used to carry an optional `reps`, filled in by Flow C. Flow C no longer copies the
 * source week's numbers: its week 1 targets are computed at Start, from the exercise's own
 * history rather than from the copied week (task 122), so the field had nothing left to hold
 * (task 041). No migration was needed — `WeekPlan` lives inside the `week_plan` JSON column
 * and no stored record ever carried it.
 */
export type WeekPlanExercise = {
  exerciseId: string;
  order: number;
  sets: number;
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
