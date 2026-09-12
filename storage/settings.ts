import { defaultProgressionSettings } from '@domain/mesocycle';
import type { Settings, SettingsRepository } from '@repositories/settings';

import { runAsync } from './async';
import { deepClone } from './clone';

// Returned by `read()` until the first `write()` — see 02 · Domain Model DoD for this task:
// reading settings before anything has been written must produce usable defaults, not an
// error. `catalogVersion: 0` means "no catalog has been seeded yet"; a real seed always
// applies version 1 or higher.
const DEFAULT_SETTINGS: Settings = {
  defaultProgressionSettings,
  weightUnit: 'kg',
  schemaVersion: 1,
  catalogVersion: 0,
};

// Settings is a single global record, not a table (07 · Persistence Layer Contract,
// "SettingsRepository": "Читать · Писать") — it has no `id` and so cannot live in an
// InMemoryCollection, which requires one. This repository just holds the one document.
export class InMemorySettingsRepository implements SettingsRepository {
  private current: Settings | null = null;

  async read(): Promise<Settings> {
    return runAsync(() => deepClone(this.current ?? DEFAULT_SETTINGS));
  }

  async write(settings: Settings): Promise<Settings> {
    return runAsync(() => {
      this.current = deepClone(settings);
      return deepClone(this.current);
    });
  }
}
