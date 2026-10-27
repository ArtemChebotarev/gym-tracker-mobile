import { SqliteSettingsRepository } from '@storage/sqlite/settings';
import {
  readTimerSettings,
  setGetReadySec,
  setRestBetweenSets,
  setSignals,
} from '@usecases/timerSettings';

import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

function setUp() {
  const settingsRepo = new SqliteSettingsRepository(db());
  return { deps: { settingsRepo }, settingsRepo };
}

const AS_SHIPPED = {
  restBetweenSets: { enabled: true, restSec: 120 },
  getReadySec: 5,
  signals: { sound: true, vibration: true },
};

describe('timer settings', () => {
  test('ship with the rest timer on at 2:00, Get ready at 0:05 and both signals on', async () => {
    const { deps } = setUp();

    await expect(readTimerSettings(deps)).resolves.toEqual(AS_SHIPPED);
  });

  test('a change of the rest is kept — a restart reads the same store — and the rest of Settings is untouched', async () => {
    const { deps, settingsRepo } = setUp();
    const before = await settingsRepo.read();

    await setRestBetweenSets({ enabled: false, restSec: 150 }, deps);

    const reopened = new SqliteSettingsRepository(db());
    await expect(reopened.read()).resolves.toEqual({
      ...before,
      restBetweenSets: { enabled: false, restSec: 150 },
    });
  });

  test('a change of Get ready is kept, and the rest of Settings is untouched (GT-188)', async () => {
    const { deps, settingsRepo } = setUp();
    const before = await settingsRepo.read();

    await expect(setGetReadySec(8, deps)).resolves.toEqual({ ...AS_SHIPPED, getReadySec: 8 });

    const reopened = new SqliteSettingsRepository(db());
    await expect(reopened.read()).resolves.toEqual({ ...before, getReadySec: 8 });
  });

  test('a change of the signals is kept — a restart reads the same store — and the rest of Settings is untouched (GT-172)', async () => {
    const { deps, settingsRepo } = setUp();
    const before = await settingsRepo.read();
    const signals = { sound: false, vibration: true };

    await expect(setSignals(signals, deps)).resolves.toEqual({ ...AS_SHIPPED, signals });

    const reopened = new SqliteSettingsRepository(db());
    await expect(reopened.read()).resolves.toEqual({ ...before, signals });
  });

  test('a value the setting may not hold is refused, and nothing is written', async () => {
    const { deps } = setUp();

    await expect(setRestBetweenSets({ enabled: true, restSec: 7 }, deps)).rejects.toThrow();
    await expect(setGetReadySec(11, deps)).rejects.toThrow();
    await expect(readTimerSettings(deps)).resolves.toEqual(AS_SHIPPED);
  });
});
