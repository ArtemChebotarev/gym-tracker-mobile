// Mesocycle creation-flow builders — see 04 · Meso Creation Flows. Kept separate from
// `domain/mesocycle.ts` (types only) and `domain/mesocycleValidators.ts` (standalone invariant
// checks) per the single-responsibility rule in AGENTS.md: this file's functions actually
// construct a `Mesocycle`, one per flow — plus Start, which turns a planned one into an active one.

import { ConflictError } from '@domain/errors';
import { generateId } from '@domain/id';
import type { Mesocycle, ProgressionSettings } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import {
  validateMesocycleDaysPerWeek,
  validateMesocycleLengthWeeks,
  validateWeekPlanDayCount,
} from '@domain/mesocycleValidators';
import type { WeekPlan } from '@domain/plan';
import { materializeWeekPlan, type SessionWithExercises } from '@domain/planConverters';
import { targetRir } from '@domain/progressionRir';
import { renumbered } from '@domain/sessionExerciseOrder';
import type { Unsaved } from '@domain/timestamps';

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
 *
 * `progressionSettings` is the snapshot copied onto the mesocycle — Confirm passes the global
 * `Settings.defaultProgressionSettings` read at that moment (03 · Progression Engine,
 * "progressionSettings": "Снимок настроек, копируемый в каждый мезоцикл при создании"). It is
 * copied, not referenced, so a later change to the object passed in doesn't reach the draft.
 */
export function buildScratchMesocycleDraft(
  input: ScratchMesocycleDraftInput,
  progressionSettings: ProgressionSettings = defaultProgressionSettings,
): Unsaved<Mesocycle> {
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
    progressionSettings: { ...progressionSettings },
    weekPlan: input.weekPlan,
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

/** What Start writes: the launched mesocycle, and week 1 as sessions with their exercises. */
export type MesocycleStart = {
  mesocycle: Mesocycle;
  week: SessionWithExercises[];
};

/**
 * Launches a planned mesocycle — task 042 (04 · Meso Creation Flows, "Запуск (Start)"). Pure:
 * returns what to write without saving it; the use case persists it in one transaction.
 *
 * The mesocycle becomes `active` with `startDate = now`, and its `weekPlan` is dropped — week 1
 * lives on as sessions from here (see `Mesocycle`'s invariants). Every day of the plan becomes a
 * `planned`, `ready` week 1 session whose exercises carry week 1's `targetRir` and one set target
 * per `startSets`, with `targetReps` only where the plan has reps (Flow C). Exercise `order` is
 * renumbered 1..n: the editor numbers a plan's exercises from 0, a session's start at 1
 * (05 · Workout Execution & Logging, see `renumbered`). Weeks 2+ aren't created — each day of the
 * next week is generated when the same day of this one is finished.
 *
 * Throws `ConflictError` if `mesocycle` isn't `planned`, has no week plan, or another mesocycle —
 * `active` — is already running: at most one is active at a time (02 · Domain Model).
 */
export function buildMesocycleStart(
  mesocycle: Mesocycle,
  active: Mesocycle | null,
  now: string,
): MesocycleStart {
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
  const { weekPlan, ...rest } = mesocycle;
  if (weekPlan === undefined) {
    throw new ConflictError(`Mesocycle "${mesocycle.id}" has no week plan to start.`);
  }

  const week = materializeWeekPlan(weekPlan, {
    mesoId: mesocycle.id,
    weekNumber: 1,
    isDeload: false,
    targetRir: targetRir(mesocycle.lengthWeeks, 1),
  }).map(({ session, exercises }) => ({ session, exercises: renumbered(exercises) }));

  return { mesocycle: { ...rest, status: 'active', startDate: now }, week };
}
