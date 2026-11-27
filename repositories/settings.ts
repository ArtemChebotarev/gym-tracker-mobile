import type { ProgressionSettings } from '@domain/mesocycle';
import type { RestBetweenSets } from '@domain/restTimer';
import type { Signals } from '@domain/signals';
import type { WeightUnit } from '@domain/weightUnit';

/**
 * Which of the first-run windows of 08.11 · Onboarding the user has already closed. Each flag
 * is set when its own window is closed (`Got it`, or `Skip` for the coachmarks), not when it is
 * shown, so an app killed with a window open shows it again.
 */
export type OnboardingFlags = {
  /** The Welcome dialog over the first Today. */
  welcomeSeen: boolean;
  /**
   * The whole first-workout tour is behind the user: `Skip`, or the tour as it was before it kept
   * its steps apart (GT-214), so whoever passed that one is not shown the new one.
   */
  coachmarksSeen: boolean;
  /** The tour's step on the ⓘ in a first column. A step with nothing to ring in a day waits. */
  tourInfoSeen: boolean;
  /** The tour's step on the `N RIR` badge. */
  tourRirSeen: boolean;
  /** The tour's step on the grid button. */
  tourGridSeen: boolean;
  /** The one-step coachmark on the weight ranges — closed, or the plate found without it (GT-215). */
  rangesCoachmarkSeen: boolean;
  /** The one-step coachmark on the capsule of the first rest, closed either way (GT-219). */
  restCoachmarkSeen: boolean;
  /** The one-step coachmark on the card of the first edit that carries over (GT-224). */
  editCoachmarkSeen: boolean;
  /** The Review step's `How your cycle progresses` block, put away by its cross (GT-225). */
  reviewProgressionHidden: boolean;
  /** The `Rest notifications` plate in Settings, put away for good by its cross (GT-219). */
  restNotificationsPlateHidden: boolean;
  /** The popup on the first deload session. */
  deloadIntroSeen: boolean;
  /** The one-step coachmark on `Start` of the first Planned cycle (GT-50). */
  startCycleSeen: boolean;
  /** The one-step coachmark on the editor's ⇅ (Reorder days), for a cycle from a template or a copy (GT-270). */
  reorderDaysCoachmarkSeen: boolean;
};

/** One of the {@link OnboardingFlags}. */
export type OnboardingFlag = keyof OnboardingFlags;

/**
 * Global, app-wide settings. A single record — there is exactly one `Settings`
 * document, not a collection.
 *
 * See 07 · Persistence Layer Contract ("SettingsRepository": "Дефолтные
 * progressionSettings, единицы измерения, версия схемы").
 *
 * Neither version lives here. The schema's is kept by the migration runner, in the journal of
 * migrations a database has had applied (storage/sqlite/migrations.ts, task 069); the exercise
 * catalog's is the same journal, because the catalog ships as a migration too (067(2)). A number
 * maintained by hand beside them could only ever disagree with what actually ran.
 */
export type Settings = {
  /**
   * The `ProgressionSettings` copied into every newly created mesocycle.
   * Changing this does not retroactively affect mesocycles created earlier —
   * see `Mesocycle.progressionSettings` in `domain/mesocycle.ts`.
   */
  defaultProgressionSettings: ProgressionSettings;
  /**
   * The unit a new mesocycle is counted in unless the user picks another (GT-269). Copied onto the
   * block when it is created, like `defaultProgressionSettings`: changing it moves no block that
   * already exists — see `Mesocycle.weightUnit`.
   */
  weightUnit: WeightUnit;
  /**
   * First-run windows already dismissed (08.11 · Onboarding, "Хранение"). Lives with the rest of
   * the user's data on purpose: wiping the data brings the onboarding back, and a backup carries it.
   */
  onboarding: OnboardingFlags;
  /**
   * The rest timer between sets of strength and power exercises (10.1 FR-5, GT-87, GT-188): on or
   * off, and how long.
   */
  restBetweenSets: RestBetweenSets;
  /**
   * Get ready before an interval round started by a tap, and the last seconds of every rest
   * between rounds (10.1 FR-6, GT-176, GT-188), seconds — the same for every interval exercise.
   */
  getReadySec: number;
  /**
   * How the timers signal — the end of a rest, the start of work and rest in an interval (10.1
   * FR-5, FR-6, GT-172): the sound and the vibration, each on or off.
   */
  signals: Signals;
};

/**
 * Access to the single global `Settings` record.
 *
 * See 07 · Persistence Layer Contract, "Hard rules" and "SettingsRepository".
 * All methods are asynchronous per hard rule 1, even though the current
 * (local SQLite) adapter has no real I/O to await.
 */
export interface SettingsRepository {
  /** Reads the current settings. */
  read(): Promise<Settings>;

  /** Persists the given settings, replacing whatever was stored before. */
  write(settings: Settings): Promise<Settings>;
}
