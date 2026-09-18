// Stored-record → current-shape converters for `Mesocycle` and `ProgressionSettings`. Kept
// separate from `domain/mesocycle.ts` (types only) per the single-responsibility rule in
// AGENTS.md. A record saved before a field was added to `ProgressionSettings` (e.g.
// `historyLookbackDays`, task 083) comes back without it; these fill the gap with the spec
// default (03 · Progression Engine, "progressionSettings") so nothing downstream has to.

import {
  defaultProgressionSettings,
  type Mesocycle,
  type ProgressionSettings,
} from '@domain/mesocycle';

/**
 * Returns `stored` with every field it lacks taken from `defaultProgressionSettings`. Fields it
 * does carry are kept as they are — a legacy snapshot keeps its own `minReps` etc., only the
 * missing ones are filled in.
 */
export function withProgressionSettingsDefaults(
  stored: Partial<ProgressionSettings>,
): ProgressionSettings {
  return { ...defaultProgressionSettings, ...stored };
}

/** Returns `stored` with its `progressionSettings` snapshot filled in by `withProgressionSettingsDefaults`. */
export function normalizeStoredMesocycle(stored: Mesocycle): Mesocycle {
  return {
    ...stored,
    progressionSettings: withProgressionSettingsDefaults(stored.progressionSettings),
  };
}
