import { defaultProgressionSettings } from '@domain/mesocycle';
import type { Settings } from '@repositories/settings';

/**
 * What `SettingsRepository.read()` answers until the first `write()` — reading settings before
 * anything has been written must produce usable defaults, not an error (task 022's DoD, and the
 * shared repository contract).
 *
 * `catalogVersion: 0` means "no catalog has been seeded yet"; a real seed always applies version
 * 1 or higher (067(2)). Shared by every adapter so an empty store answers the same whatever
 * medium it sits on — a fresh SQLite database has no settings row either.
 */
export const DEFAULT_SETTINGS: Settings = {
  defaultProgressionSettings,
  weightUnit: 'kg',
  schemaVersion: 1,
  catalogVersion: 0,
};
