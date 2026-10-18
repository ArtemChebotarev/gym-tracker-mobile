// The rest timer of strength exercises, a global setting (10.1 FR-5, GT-87): on or off, and how
// long. Part of `Settings`, so it is read and written through `SettingsRepository` like the rest of
// it. Power, interval and mobility keep their rest on the exercise; this never touches them, and
// it never feeds the progression.

import type { StrengthRestTimer } from '@domain/restTimer';
import { assertStrengthRestTimer } from '@domain/restTimerValidators';
import type { SettingsRepository } from '@repositories/settings';

export type RestTimerSettingsDeps = {
  settingsRepo: SettingsRepository;
};

export async function readStrengthRestTimer(
  deps: RestTimerSettingsDeps,
): Promise<StrengthRestTimer> {
  return (await deps.settingsRepo.read()).strengthRestTimer;
}

/**
 * Saves the strength rest timer, leaving every other setting as it was. Throws, writing nothing,
 * if the rest is not one the setting may hold (`assertStrengthRestTimer`). A rest already running
 * keeps the length it started with; the next set logged takes the new one.
 */
export async function setStrengthRestTimer(
  setting: StrengthRestTimer,
  deps: RestTimerSettingsDeps,
): Promise<StrengthRestTimer> {
  assertStrengthRestTimer(setting);
  const settings = await deps.settingsRepo.read();
  const written = await deps.settingsRepo.write({ ...settings, strengthRestTimer: setting });
  return written.strengthRestTimer;
}
