import { defaultProgressionSettings } from '@domain/mesocycle';
import { STRENGTH_REST_SEC, type StrengthRestTimer } from '@domain/restTimer';
import type { OnboardingFlags, Settings } from '@repositories/settings';

/** Nothing dismissed yet: what a fresh store, and a settings row that predates a flag, reads as. */
export const DEFAULT_ONBOARDING: OnboardingFlags = {
  welcomeSeen: false,
  coachmarksSeen: false,
  deloadIntroSeen: false,
  startCycleSeen: false,
};

/** The strength rest timer as it ships: on, 2:00 — the same as the column defaults of migration 0006. */
export const DEFAULT_STRENGTH_REST_TIMER: StrengthRestTimer = {
  enabled: true,
  restSec: STRENGTH_REST_SEC,
};

/**
 * What `SettingsRepository.read()` answers until the first `write()` — reading settings before
 * anything has been written must produce usable defaults, not an error (task 022's DoD, and the
 * shared repository contract).
 *
 * Shared by every adapter so an empty store answers the same whatever medium it sits on — a
 * fresh SQLite database has no settings row either.
 */
export const DEFAULT_SETTINGS: Settings = {
  defaultProgressionSettings,
  weightUnit: 'kg',
  onboarding: DEFAULT_ONBOARDING,
  strengthRestTimer: DEFAULT_STRENGTH_REST_TIMER,
};
