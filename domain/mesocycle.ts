// Mesocycle — a training block. See 02 · Domain Model ("Mesocycle") and
// 03 · Progression Engine ("progressionSettings").

export type MesocycleStatus = 'active' | 'completed' | 'abandoned';

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
};

/** Default `ProgressionSettings`, per 03 · Progression Engine. */
export const defaultProgressionSettings: ProgressionSettings = {
  minReps: 5,
  maxReps: 30,
  deloadRir: 8,
  deloadWeightFactor: 0.5,
};

/**
 * A training block.
 *
 * Invariants (not enforced by the type system, see 02 · Domain Model):
 * - Deload is always the block's last week — there is no separate
 *   `deloadWeek` field.
 * - At most one mesocycle has `status: 'active'` at a time.
 * - `lengthWeeks` and `daysPerWeek` are immutable after creation.
 * - `progressionSettings` is a snapshot copied in at creation, not read live
 *   from global settings.
 */
export type Mesocycle = {
  id: string;
  name: string;
  /** 3..8, deload week included. */
  lengthWeeks: number;
  /** 1..7. */
  daysPerWeek: number;
  startDate: string;
  status: MesocycleStatus;
  origin: MesocycleOrigin;
  progressionSettings: ProgressionSettings;
  createdAt: string;
  completedAt?: string;
};
