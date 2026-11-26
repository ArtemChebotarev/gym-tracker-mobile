// The unit a new mesocycle is counted in unless the user picks another (GT-269). Part of
// `Settings`, so it is read and written through `SettingsRepository` like the rest of it. It moves
// no block that already exists: each one keeps the unit it was created with (`Mesocycle.weightUnit`).

import type { WeightUnit } from '@domain/weightUnit';
import { assertWeightUnit } from '@domain/weightUnitValidators';
import type { SettingsRepository } from '@repositories/settings';

export type WeightUnitSettingDeps = {
  settingsRepo: SettingsRepository;
};

export async function readDefaultWeightUnit(deps: WeightUnitSettingDeps): Promise<WeightUnit> {
  return (await deps.settingsRepo.read()).weightUnit;
}

/**
 * Saves the unit new cycles start in, leaving every other setting as it was. Throws, writing
 * nothing, if it is not a unit (`assertWeightUnit`).
 */
export async function setDefaultWeightUnit(
  weightUnit: WeightUnit,
  deps: WeightUnitSettingDeps,
): Promise<WeightUnit> {
  assertWeightUnit(weightUnit);
  const settings = await deps.settingsRepo.read();
  return (await deps.settingsRepo.write({ ...settings, weightUnit })).weightUnit;
}
