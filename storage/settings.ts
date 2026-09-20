import { withProgressionSettingsDefaults } from '@domain/mesocycleConverters';
import type { Settings, SettingsRepository } from '@repositories/settings';

import { runAsync } from './async';
import { deepClone } from './clone';
import { DEFAULT_SETTINGS } from './settingsDefaults';

// Settings is a single global record, not a table (07 · Persistence Layer Contract,
// "SettingsRepository": "Читать · Писать") — it has no `id` and so cannot live in an
// InMemoryCollection, which requires one. This repository just holds the one document.
export class InMemorySettingsRepository implements SettingsRepository {
  private current: Settings | null = null;

  // Settings written before a `ProgressionSettings` field existed (e.g. `historyLookbackDays`,
  // task 083) read back with the spec default for it filled in.
  async read(): Promise<Settings> {
    return runAsync(() => {
      const stored = deepClone(this.current ?? DEFAULT_SETTINGS);
      return {
        ...stored,
        defaultProgressionSettings: withProgressionSettingsDefaults(stored.defaultProgressionSettings),
      };
    });
  }

  async write(settings: Settings): Promise<Settings> {
    return runAsync(() => {
      this.current = deepClone(settings);
      return deepClone(this.current);
    });
  }
}
