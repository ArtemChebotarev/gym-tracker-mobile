import type { WeightUnit } from '@domain/weightUnit';
import { SqliteSettingsRepository } from '@storage/sqlite/settings';
import { readDefaultWeightUnit, setDefaultWeightUnit } from '@usecases/weightUnitSetting';

import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

function setUp() {
  const settingsRepo = new SqliteSettingsRepository(db());
  return { deps: { settingsRepo }, settingsRepo };
}

// GT-269: the unit new cycles start in.
describe('the default weight unit', () => {
  test('ships as kilograms — every weight before it was', async () => {
    const { deps } = setUp();

    await expect(readDefaultWeightUnit(deps)).resolves.toBe('kg');
  });

  test('changes, leaving every other setting as it was', async () => {
    const { deps, settingsRepo } = setUp();
    const before = await settingsRepo.read();

    await expect(setDefaultWeightUnit('lb', deps)).resolves.toBe('lb');

    await expect(settingsRepo.read()).resolves.toEqual({ ...before, weightUnit: 'lb' });
  });

  test('refuses what is not a unit, writing nothing', async () => {
    const { deps } = setUp();

    await expect(setDefaultWeightUnit('stone' as WeightUnit, deps)).rejects.toThrow(
      'Weight unit must be one of kg, lb',
    );
    await expect(readDefaultWeightUnit(deps)).resolves.toBe('kg');
  });
});
