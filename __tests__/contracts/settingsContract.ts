import { defaultProgressionSettings } from '@domain/mesocycle';
import type { Settings } from '@repositories/settings';

import { type RepositoryHarness, useRepositories } from './harness';

// SettingsRepository — a single global record rather than a table (07 · Persistence Layer
// Contract, "SettingsRepository"). It holds the defaults new mesocycles are stamped with, the
// display unit, the schema version and the applied catalog version.

export function describeSettingsContract(harness: RepositoryHarness): void {
  describe('SettingsRepository', () => {
    const repositories = useRepositories(harness);

    test('read before any write returns usable defaults, not an error', async () => {
      const settings = await repositories().settingsRepo.read();

      expect(settings.defaultProgressionSettings).toEqual(defaultProgressionSettings);
      expect(settings.weightUnit).toBe('kg');
      // Nothing has been seeded yet; a real seed applies version 1 or higher (067(2)).
      expect(settings.catalogVersion).toBe(0);
      // Which version a fresh store starts at is the adapter's business — that it has one is not.
      expect(settings.schemaVersion).toBeGreaterThanOrEqual(1);
    });

    test('write persists settings that a later read returns', async () => {
      const { settingsRepo } = repositories();
      const written: Settings = {
        defaultProgressionSettings: { ...defaultProgressionSettings, minReps: 6 },
        weightUnit: 'lb',
        schemaVersion: 2,
        catalogVersion: 3,
      };

      await settingsRepo.write(written);

      await expect(settingsRepo.read()).resolves.toEqual(written);
    });

    test('mutating a previously written object does not affect what is stored', async () => {
      const { settingsRepo } = repositories();
      const written: Settings = {
        defaultProgressionSettings: { ...defaultProgressionSettings },
        weightUnit: 'kg',
        schemaVersion: 1,
        catalogVersion: 1,
      };

      await settingsRepo.write(written);
      written.weightUnit = 'lb';
      written.defaultProgressionSettings.minReps = 999;

      await expect(settingsRepo.read()).resolves.toEqual({
        defaultProgressionSettings: { ...defaultProgressionSettings },
        weightUnit: 'kg',
        schemaVersion: 1,
        catalogVersion: 1,
      });
    });

    test('settings written without historyLookbackDays read back with the spec default', async () => {
      const { settingsRepo } = repositories();
      const { historyLookbackDays: _omitted, ...legacyProgressionSettings } =
        defaultProgressionSettings;

      await settingsRepo.write({
        defaultProgressionSettings:
          legacyProgressionSettings as Settings['defaultProgressionSettings'],
        weightUnit: 'kg',
        schemaVersion: 1,
        catalogVersion: 1,
      });

      const settings = await settingsRepo.read();

      expect(settings.defaultProgressionSettings.historyLookbackDays).toBe(
        defaultProgressionSettings.historyLookbackDays,
      );
    });
  });
}
