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
 * What a template can be filtered by besides its number of days (GT-217, 08.10 "Шаг T"). One list
 * rather than a field per filter: a tag added later — a level, a place — is a value here and a
 * catalog migration, never a new column (Artem, 05.11.2026). A value is never renamed or removed
 * once shipped: databases already hold it.
 */
export const TEMPLATE_TAGS = ['full-body', 'upper', 'lower', 'hybrid'] as const;

export type TemplateTag = (typeof TEMPLATE_TAGS)[number];

/**
 * The filter a tag belongs to. Within one filter any selected tag lets a template through (Upper
 * *or* Lower); across filters every one has to (Lower *and* Hybrid) — see `matchesTemplateFilters`.
 */
export type TemplateTagGroup = 'focus' | 'style';

export const TEMPLATE_TAG_GROUP: Readonly<Record<TemplateTag, TemplateTagGroup>> = {
  'full-body': 'focus',
  upper: 'focus',
  lower: 'focus',
  hybrid: 'style',
};

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
  /**
   * One line shown under the name in the template list (08.10, "Step T"). Absent for a template
   * that has none — the list then falls back to the summary of its week.
   */
  description?: string;
  /** What the template is filtered by (GT-217). Absent means none — a template saved by the user. */
  tags?: readonly TemplateTag[];
  weekPlan: WeekPlan;
  isHidden: boolean;
};
