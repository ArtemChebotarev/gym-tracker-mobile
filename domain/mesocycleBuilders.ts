// Mesocycle creation-flow builders — see 04 · Meso Creation Flows. Kept separate from
// `domain/mesocycle.ts` (types only) and `domain/mesocycleValidators.ts` (standalone invariant
// checks) per the single-responsibility rule in AGENTS.md: this file's functions actually
// construct a `Mesocycle`, one per flow.

import { ConflictError } from '@domain/errors';
import { generateId } from '@domain/id';
import type { Mesocycle } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import {
  validateMesocycleDaysPerWeek,
  validateMesocycleLengthWeeks,
  validateWeekPlanDayCount,
} from '@domain/mesocycleValidators';
import type { WeekPlan } from '@domain/plan';
import { nowAsUtcIso } from '@domain/time';

export type ScratchMesocycleDraftInput = {
  name: string;
  /** 3..8, deload week included — see `validateMesocycleLengthWeeks`. */
  lengthWeeks: number;
  /** 1..7 — see `validateMesocycleDaysPerWeek`. Must match `weekPlan.days.length`. */
  daysPerWeek: number;
  /**
   * The week 1 structure assembled on step 2 of the editor (08.5, "Шаг 2"). No `WeekPlanExercise`
   * carries `reps` in Flow A — the week's target RIR is shown instead (04 · Meso Creation Flows,
   * "Почему повторы задаются только в Flow C") — but that is a property of what step 2 collects,
   * not something this function enforces.
   */
  weekPlan: WeekPlan;
};

/**
 * Builds a Flow A ("с нуля") planned-mesocycle draft — task 038. Pure: no repository access, no
 * `Session`/`SessionExercise` created. The result is `status: 'planned'` with no `startDate`,
 * carrying `weekPlan` as its draft week 1 until Start materializes it (04 · Meso Creation Flows,
 * "Сохранение при подтверждении (Confirm)"; the actual save-through-Confirm is task 071, which
 * calls this and then `MesocycleRepository.create`).
 */
export function buildScratchMesocycleDraft(input: ScratchMesocycleDraftInput): Mesocycle {
  validateMesocycleLengthWeeks(input.lengthWeeks);
  validateMesocycleDaysPerWeek(input.daysPerWeek);
  validateWeekPlanDayCount(input.weekPlan, input.daysPerWeek);

  return {
    id: generateId(),
    name: input.name,
    lengthWeeks: input.lengthWeeks,
    daysPerWeek: input.daysPerWeek,
    status: 'planned',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    weekPlan: input.weekPlan,
    createdAt: nowAsUtcIso(),
  };
}

/**
 * Applies an editor draft to an existing planned mesocycle — task 072. Pure: returns the updated
 * `Mesocycle` without saving it. A planned mesocycle is fully editable until Start (04 · Meso
 * Creation Flows, "Сохранение при подтверждении (Confirm)": "дни, упражнения, `startSets` можно
 * менять как угодно"), so `name`, `lengthWeeks`, `daysPerWeek`, and `weekPlan` all come from
 * `input`. 02 · Domain Model's "`lengthWeeks` and `daysPerWeek` are immutable after Start"
 * (`validateMesocycleImmutableFields`) only kicks in once the mesocycle is started. `id`, `origin`, `progressionSettings`, `status`, and `createdAt` are kept as they were.
 *
 * Throws `ConflictError` if `current` isn't `planned` — active and completed mesocycles can't go
 * back through the editor. Exercise-level changes to an active one (add / replace / skip / reorder
 * during a workout, 05 · Workout Execution & Logging) are separate operations, not this one.
 */
export function applyPlannedMesocycleEdit(
  current: Mesocycle,
  input: ScratchMesocycleDraftInput,
): Mesocycle {
  if (current.status !== 'planned') {
    throw new ConflictError(
      `Mesocycle "${current.id}" is ${current.status}; only planned ones can be edited.`,
    );
  }
  validateMesocycleLengthWeeks(input.lengthWeeks);
  validateMesocycleDaysPerWeek(input.daysPerWeek);
  validateWeekPlanDayCount(input.weekPlan, input.daysPerWeek);

  return {
    ...current,
    name: input.name,
    lengthWeeks: input.lengthWeeks,
    daysPerWeek: input.daysPerWeek,
    weekPlan: input.weekPlan,
  };
}
