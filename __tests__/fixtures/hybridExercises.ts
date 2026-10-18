// One exercise of each hybrid type, without a muscle group — the cycle editor's rows and Review
// read them (GT-157). Their configs differ from the system defaults where it matters, so a test
// can tell the library's value from a default one.

import { FULL_BODY, toExerciseId, type Exercise } from '@domain/catalog';

import { STAMPS } from './stamps';

export const MEDBALL_THROW: Exercise = {
  ...STAMPS,
  id: toExerciseId('medball-straight-punch-throw'),
  name: 'Medball straight punch throw',
  muscleGroup: FULL_BODY,
  source: 'custom',
  isHidden: false,
  type: 'power',
  config: { type: 'power', load: 'weight', restSec: 75, noHeavierAvailable: false },
};

export const HEAVY_BAG: Exercise = {
  ...STAMPS,
  id: toExerciseId('heavy-bag'),
  name: 'Heavy bag',
  muscleGroup: FULL_BODY,
  source: 'custom',
  isHidden: false,
  type: 'interval',
  config: { type: 'interval', workSec: 120, restSec: 45, getReadySec: 5, lever: 'rest', stepSec: 15 },
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
