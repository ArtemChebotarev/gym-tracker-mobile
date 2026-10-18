import { defaultProgressionSettings } from '@domain/mesocycle';
import type { Settings } from '@repositories/settings';

import { type RepositoryHarness, useRepositories } from './harness';

// SettingsRepository — a single global record rather than a table (07 · Persistence Layer
// Contract, "SettingsRepository"). It holds the defaults new mesocycles are stamped with and the
// display unit — no version of anything: neither the schema's nor the catalog's, both of which
// the migration journal keeps (069, 067(2)).

// Nothing dismissed yet — spelled out here because a contract names the behaviour, not an adapter's
// constant for it.
const DEFAULT_ONBOARDING: Settings['onboarding'] = {
  welcomeSeen: false,
  coachmarksSeen: false,
  deloadIntroSeen: false,
  startCycleSeen: false,
};

// The strength rest timer as it ships (10.1 FR-5, GT-87): on, 2:00.
const DEFAULT_STRENGTH_REST_TIMER: Settings['strengthRestTimer'] = { enabled: true, restSec: 120 };

export function describeSettingsContract(harness: RepositoryHarness): void {
  describe('SettingsRepository', () => {
    const repositories = useRepositories(harness);

    test('read before any write returns usable defaults, not an error', async () => {
      const settings = await repositories().settingsRepo.read();

      expect(settings.defaultProgressionSettings).toEqual(defaultProgressionSettings);
      expect(settings.weightUnit).toBe('kg');
      expect(settings.onboarding).toEqual(DEFAULT_ONBOARDING);
      expect(settings.strengthRestTimer).toEqual(DEFAULT_STRENGTH_REST_TIMER);
    });

    test('write persists settings that a later read returns', async () => {
      const { settingsRepo } = repositories();
      const written: Settings = {
        defaultProgressionSettings: { ...defaultProgressionSettings, minReps: 6 },
        weightUnit: 'lb',
        onboarding: {
          welcomeSeen: true,
          coachmarksSeen: false,
          deloadIntroSeen: true,
          startCycleSeen: false,
        },
        strengthRestTimer: { enabled: false, restSec: 90 },
      };

      await settingsRepo.write(written);

      await expect(settingsRepo.read()).resolves.toEqual(written);
    });

    test('mutating a previously written object does not affect what is stored', async () => {
      const { settingsRepo } = repositories();
      const written: Settings = {
        defaultProgressionSettings: { ...defaultProgressionSettings },
        weightUnit: 'kg',
        onboarding: { ...DEFAULT_ONBOARDING },
        strengthRestTimer: { ...DEFAULT_STRENGTH_REST_TIMER },
      };

      await settingsRepo.write(written);
      written.weightUnit = 'lb';
      written.onboarding.welcomeSeen = true;
      written.defaultProgressionSettings.minReps = 999;
      written.strengthRestTimer.restSec = 5;

      await expect(settingsRepo.read()).resolves.toEqual({
        defaultProgressionSettings: { ...defaultProgressionSettings },
        weightUnit: 'kg',
        onboarding: DEFAULT_ONBOARDING,
        strengthRestTimer: DEFAULT_STRENGTH_REST_TIMER,
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
        onboarding: DEFAULT_ONBOARDING,
        strengthRestTimer: DEFAULT_STRENGTH_REST_TIMER,
      });

      const settings = await settingsRepo.read();

      expect(settings.defaultProgressionSettings.historyLookbackDays).toBe(
        defaultProgressionSettings.historyLookbackDays,
      );
    });

    test('onboarding flags written without a newer flag read back with that flag unset', async () => {
      const { settingsRepo } = repositories();
      const { deloadIntroSeen: _omitted, ...legacyOnboarding } = DEFAULT_ONBOARDING;

      await settingsRepo.write({
        ...(await settingsRepo.read()),
        onboarding: { ...legacyOnboarding, welcomeSeen: true } as Settings['onboarding'],
      });

      await expect(settingsRepo.read()).resolves.toMatchObject({
        onboarding: {
          welcomeSeen: true,
          coachmarksSeen: false,
          deloadIntroSeen: false,
          startCycleSeen: false,
        },
      });
    });

    test('settings without the strength rest timer — a backup from before it — write it as it ships', async () => {
      const { settingsRepo } = repositories();
      const { strengthRestTimer: _omitted, ...legacy } = await settingsRepo.read();

      await settingsRepo.write({ ...legacy, weightUnit: 'lb' } as Settings);

      await expect(settingsRepo.read()).resolves.toMatchObject({
        weightUnit: 'lb',
        strengthRestTimer: DEFAULT_STRENGTH_REST_TIMER,
      });
    });
  });
}
