import { SqliteSettingsRepository } from '@storage/sqlite/settings';
import { markOnboardingSeen, readOnboardingFlags } from '@usecases/onboarding';

import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

function setUp() {
  const settingsRepo = new SqliteSettingsRepository(db());
  return { deps: { settingsRepo }, settingsRepo };
}

describe('onboarding flags', () => {
  test('a fresh store has shown nothing yet', async () => {
    const { deps } = setUp();

    await expect(readOnboardingFlags(deps)).resolves.toEqual({
      welcomeSeen: false,
      coachmarksSeen: false,
      deloadIntroSeen: false,
    });
  });

  test('DoD: a flag survives the next read — a restart reads the same store', async () => {
    const { deps } = setUp();

    await markOnboardingSeen('welcomeSeen', deps);

    // A second repository over the same database stands for the app opened again.
    const reopened = { settingsRepo: new SqliteSettingsRepository(db()) };
    await expect(readOnboardingFlags(reopened)).resolves.toEqual({
      welcomeSeen: true,
      coachmarksSeen: false,
      deloadIntroSeen: false,
    });
  });

  test('marking one flag leaves the others and the rest of the settings alone', async () => {
    const { deps, settingsRepo } = setUp();
    await settingsRepo.write({ ...(await settingsRepo.read()), weightUnit: 'lb' });

    await markOnboardingSeen('coachmarksSeen', deps);
    const flags = await markOnboardingSeen('deloadIntroSeen', deps);

    expect(flags).toEqual({ welcomeSeen: false, coachmarksSeen: true, deloadIntroSeen: true });
    expect((await settingsRepo.read()).weightUnit).toBe('lb');
  });

  test('marking a flag twice changes nothing', async () => {
    const { deps } = setUp();

    await markOnboardingSeen('welcomeSeen', deps);
    const flags = await markOnboardingSeen('welcomeSeen', deps);

    expect(flags.welcomeSeen).toBe(true);
  });
});
