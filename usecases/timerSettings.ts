// The timer settings (10.1 FR-5, FR-6): the rest between sets of strength and power exercises —
// on or off, and how long (GT-87) — and the Get ready of interval rounds (GT-188). Part of
// `Settings`, so they are read and written through `SettingsRepository` like the rest of it. They
// never feed the progression.

import { assertGetReadySec } from '@domain/intervalTimerValidators';
import type { RestBetweenSets } from '@domain/restTimer';
import { assertRestBetweenSets } from '@domain/restTimerValidators';
import type { Settings, SettingsRepository } from '@repositories/settings';

export type TimerSettingsDeps = {
  settingsRepo: SettingsRepository;
};

/** What the Settings tab's timer section shows. */
export type TimerSettings = Pick<Settings, 'restBetweenSets' | 'getReadySec'>;

function timerSettingsOf({ restBetweenSets, getReadySec }: Settings): TimerSettings {
  return { restBetweenSets, getReadySec };
}

export async function readTimerSettings(deps: TimerSettingsDeps): Promise<TimerSettings> {
  return timerSettingsOf(await deps.settingsRepo.read());
}

/**
 * Saves the rest between sets, leaving every other setting as it was. Throws, writing nothing, if
 * the rest is not one the setting may hold (`assertRestBetweenSets`). A rest already running keeps
 * the length it started with; the next set logged takes the new one.
 */
export async function setRestBetweenSets(
  setting: RestBetweenSets,
  deps: TimerSettingsDeps,
): Promise<TimerSettings> {
  assertRestBetweenSets(setting);
  const settings = await deps.settingsRepo.read();
  return timerSettingsOf(await deps.settingsRepo.write({ ...settings, restBetweenSets: setting }));
}

/**
 * Saves Get ready, leaving every other setting as it was. Throws, writing nothing, if it is not one
 * the setting may hold (`assertGetReadySec`). A timer already running keeps the Get ready it
 * started with.
 */
export async function setGetReadySec(
  getReadySec: number,
  deps: TimerSettingsDeps,
): Promise<TimerSettings> {
  assertGetReadySec(getReadySec);
  const settings = await deps.settingsRepo.read();
  return timerSettingsOf(await deps.settingsRepo.write({ ...settings, getReadySec }));
}
