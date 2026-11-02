// The first-run windows' "already seen" flags — GT-36 (08.11 · Onboarding, "Хранение"). They are
// part of `Settings`, so they are read and written through `SettingsRepository` like the rest of
// it; nothing about them is kept anywhere else, and a screen asks here rather than remembering.

import type { OnboardingFlag, OnboardingFlags, SettingsRepository } from '@repositories/settings';

export type OnboardingDeps = {
  settingsRepo: SettingsRepository;
};

export async function readOnboardingFlags(deps: OnboardingDeps): Promise<OnboardingFlags> {
  return (await deps.settingsRepo.read()).onboarding;
}

/**
 * Records that the user closed the window `flags` belong to — several at once for a tour that
 * showed several steps, in one write so that none is lost to another. Called when it is closed,
 * never when it is shown, so an app killed with the window open shows it again. Idempotent, and
 * leaves every other setting — and the other flags — as they were.
 */
export async function markOnboardingSeen(
  flags: OnboardingFlag | readonly OnboardingFlag[],
  deps: OnboardingDeps,
): Promise<OnboardingFlags> {
  const settings = await deps.settingsRepo.read();
  const seen = [flags].flat().map((flag) => [flag, true]);
  const written = await deps.settingsRepo.write({
    ...settings,
    onboarding: { ...settings.onboarding, ...Object.fromEntries(seen) },
  });
  return written.onboarding;
}
