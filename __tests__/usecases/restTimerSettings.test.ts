import { SqliteSettingsRepository } from '@storage/sqlite/settings';
import { readStrengthRestTimer, setStrengthRestTimer } from '@usecases/restTimerSettings';

import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

function setUp() {
  const settingsRepo = new SqliteSettingsRepository(db());
  return { deps: { settingsRepo }, settingsRepo };
}

describe('strength rest timer setting', () => {
  test('ships on, at 2:00', async () => {
    const { deps } = setUp();

    await expect(readStrengthRestTimer(deps)).resolves.toEqual({ enabled: true, restSec: 120 });
  });

  test('a change is kept — a restart reads the same store — and the rest of Settings is untouched', async () => {
    const { deps, settingsRepo } = setUp();
    const before = await settingsRepo.read();

    await setStrengthRestTimer({ enabled: false, restSec: 150 }, deps);

    const reopened = new SqliteSettingsRepository(db());
    await expect(reopened.read()).resolves.toEqual({
      ...before,
      strengthRestTimer: { enabled: false, restSec: 150 },
    });
  });

  test('a rest the setting may not hold is refused, and nothing is written', async () => {
    const { deps } = setUp();

    await expect(setStrengthRestTimer({ enabled: true, restSec: 7 }, deps)).rejects.toThrow();
    await expect(readStrengthRestTimer(deps)).resolves.toEqual({ enabled: true, restSec: 120 });
  });
});
