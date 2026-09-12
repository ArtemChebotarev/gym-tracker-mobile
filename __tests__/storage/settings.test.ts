import { defaultProgressionSettings } from '@domain/mesocycle';
import type { Settings } from '@repositories/settings';
import { InMemorySettingsRepository } from '@storage/settings';

describe('InMemorySettingsRepository', () => {
  test('read before any write returns usable defaults, not an error', async () => {
    const repo = new InMemorySettingsRepository();

    await expect(repo.read()).resolves.toEqual({
      defaultProgressionSettings,
      weightUnit: 'kg',
      schemaVersion: 1,
      catalogVersion: 0,
    });
  });

  test('write persists settings that a later read returns', async () => {
    const repo = new InMemorySettingsRepository();
    const written: Settings = {
      defaultProgressionSettings: { ...defaultProgressionSettings, minReps: 6 },
      weightUnit: 'lb',
      schemaVersion: 2,
      catalogVersion: 3,
    };

    await repo.write(written);

    await expect(repo.read()).resolves.toEqual(written);
  });

  test('mutating a previously written object does not affect what is stored', async () => {
    const repo = new InMemorySettingsRepository();
    const written: Settings = {
      defaultProgressionSettings: { ...defaultProgressionSettings },
      weightUnit: 'kg',
      schemaVersion: 1,
      catalogVersion: 1,
    };

    await repo.write(written);
    written.weightUnit = 'lb';
    written.defaultProgressionSettings.minReps = 999;

    await expect(repo.read()).resolves.toEqual({
      defaultProgressionSettings: { ...defaultProgressionSettings },
      weightUnit: 'kg',
      schemaVersion: 1,
      catalogVersion: 1,
    });
  });
});
