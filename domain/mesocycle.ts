import type { Timestamps } from './timestamps';

// Mesocycle — a training block. See 02 · Domain Model ("Mesocycle") and
// 03 · Progression Engine ("progressionSettings").

import type { WeekPlan } from '@domain/plan';

/**
 * `planned` — saved by Confirm (071), fully editable, not yet running: no `startDate`, and
 * `weekPlan` carries its draft week 1. `active` / `completed` / `abandoned` are unchanged from
 * before task 038 — see 04 · Meso Creation Flows, "Сохранение при подтверждении (Confirm)" and
 * "Запуск (Start)".
 */
export type MesocycleStatus = 'planned' | 'active' | 'completed' | 'abandoned';

/**
 * How a mesocycle came into being, as a discriminated union on `type`:
 * - `scratch` — built from nothing.
 * - `template` — built from a saved template (`templateId`).
 * - `copyWeek` — built by copying a single week (`sourceWeekNumber`) out of
 *   another mesocycle (`sourceMesoId`).
 *
 * Narrow on `origin.type` to access the variant-specific fields without a cast.
 */
export type MesocycleOrigin =
  | { type: 'scratch' }
  | { type: 'template'; templateId: string }
  | { type: 'copyWeek'; sourceMesoId: string; sourceWeekNumber: number };

/**
 * Snapshot of the progression engine's settings, copied into a mesocycle at
 * creation time. See 03 · Progression Engine: "Снимок настроек, копируемый в
 * каждый мезоцикл при создании. Изменение глобальных настроек не влияет на
 * уже созданные блоки." — i.e. once copied in, this value is independent of
 * whatever the global settings say later.
 */
export type ProgressionSettings = {
  /** Lower bound of the rep corridor. */
  minReps: number;
  /** Upper bound of the rep corridor. */
  maxReps: number;
  /** Target RIR for the deload week. */
  deloadRir: number;
  /** Fraction of the last working week's weight used during deload. */
  deloadWeightFactor: number;
  /**
   * How many days back rule 6 looks for a reference performance outside the current mesocycle
   * (03 · Progression Engine, "Правило 6"). The use case layer turns it into
   * `since = now − historyLookbackDays`; the engine itself never sees time.
   */
  historyLookbackDays: number;
};

/** Default `ProgressionSettings`, per 03 · Progression Engine. */
export const defaultProgressionSettings: ProgressionSettings = {
  minReps: 5,
  maxReps: 30,
  deloadRir: 8,
  deloadWeightFactor: 0.5,
  historyLookbackDays: 30,
};

/**
 * A training block.
 *
 * Invariants (not enforced by the type system, see 02 · Domain Model):
 * - Deload is always the block's last week — there is no separate
 *   `deloadWeek` field.
 * - At most one mesocycle has `status: 'active'` at a time.
 * - `lengthWeeks` and `daysPerWeek` are immutable once Start runs (`status` leaves `planned`);
 *   while `planned`, the whole mesocycle is editable (04 · Meso Creation Flows).
 * - `progressionSettings` is a snapshot copied in at creation, not read live
 *   from global settings.
 * - `startDate` and `weekPlan` are mutually exclusive over the mesocycle's lifetime: while
 *   `status: 'planned'`, `startDate` is absent and `weekPlan` carries the draft week 1; once
 *   Start runs, `startDate` is set, `weekPlan` is cleared, and week 1 lives on as `Session` /
 *   `SessionExercise` rows instead (04 · Meso Creation Flows, "Запуск (Start)"; 09 · Open
 *   Questions & Decisions Log, "Planned-мезоцикл хранит свой черновичный weekPlan прямо на
 *   себе" — a deliberate, temporary exception to 02 · Domain Model's "WeekPlan — не таблица").
 */
export type Mesocycle = Timestamps & {
  id: string;
  name: string;
  /** 3..8, deload week included. */
  lengthWeeks: number;
  /** 1..7. */
  daysPerWeek: number;
  /** Absent while `status: 'planned'`; set by Start to the moment the mesocycle launches. */
  startDate?: string;
  status: MesocycleStatus;
  origin: MesocycleOrigin;
  progressionSettings: ProgressionSettings;
  /**
   * Body weight in kg, for the block's bodyweight exercises (task 105). Asked for the first time
   * one of them comes up and then filled into every later one, so it isn't retyped set after set.
   * Absent until then. Changing it moves only the sets still to come — a logged set keeps what it
   * was logged with (05, "История неизменяема").
   */
  bodyWeight?: number;
  /**
   * Draft week 1, present only while `status: 'planned'`. Start materializes it into `Session` /
   * `SessionExercise` and this field goes back to absent — it is never read once the mesocycle
   * is `active`.
   */
  weekPlan?: WeekPlan;
  completedAt?: string;
  /**
   * When the block was archived — put out of sight without being deleted. Absent for every block
   * still on the list, which is all of them until the user archives one.
   *
   * A soft delete and nothing more: no cascade, no status change. The block keeps being
   * `completed` or `abandoned`, and every session, exercise and set log under it stays exactly as
   * it was — archiving is about the list being long, not about the training being wrong. What it
   * changes is where the block is offered: `finishedMesocyclesNewestFirst` skips it, so it leaves
   * both 08.3's Completed group and Flow C's source dropdown at once.
   */
  archivedAt?: string;
};
