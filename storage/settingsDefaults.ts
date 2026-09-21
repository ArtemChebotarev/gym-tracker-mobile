import { defaultProgressionSettings } from '@domain/mesocycle';
import type { Settings } from '@repositories/settings';

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
};
