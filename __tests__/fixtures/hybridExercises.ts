// One exercise of each hybrid type, without a muscle group — the cycle editor's rows and Review
// read them (GT-157). Their configs differ from the system defaults where it matters, so a test
// can tell the library's value from a default one.

import { FULL_BODY, toExerciseId, type Exercise } from '@domain/catalog';
import type { IntervalConfig } from '@domain/exerciseConfig';

import { STAMPS } from './stamps';

export const MEDBALL_THROW: Exercise = {
  ...STAMPS,
  id: toExerciseId('medball-straight-punch-throw'),
  name: 'Medball straight punch throw',
  muscleGroup: FULL_BODY,
  source: 'custom',
  isHidden: false,
  type: 'power',
  config: { type: 'power', load: 'weight', noHeavierAvailable: false },
};

/** `HEAVY_BAG`'s config, typed as what it is, for a test that spreads it into an edited copy. */
export const HEAVY_BAG_CONFIG: IntervalConfig = {
  type: 'interval',
  workSec: 120,
  restSec: 45,
  lever: 'rest',
  stepSec: 15,
};

export const HEAVY_BAG: Exercise = {
  ...STAMPS,
  id: toExerciseId('heavy-bag'),
  name: 'Heavy bag',
  muscleGroup: FULL_BODY,
  source: 'custom',
  isHidden: false,
  type: 'interval',
  config: HEAVY_BAG_CONFIG,
};

export const COOLDOWN: Exercise = {
  ...STAMPS,
  id: toExerciseId('cooldown'),
  name: 'Cooldown',
  muscleGroup: FULL_BODY,
  source: 'custom',
  isHidden: false,
  type: 'mobility',
  config: { type: 'mobility', durationSec: 600 },
};
