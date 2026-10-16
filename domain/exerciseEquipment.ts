// Which equipment an exercise of each type can have (10.1 FR-1). One list of values lives in
// `EQUIPMENT_OPTIONS`; this says which of them a type offers, so a power exercise is not asked
// whether it is a barbell one and a strength exercise is not offered a heavy bag.
//
// `bodyweight`, `resistance-band` and `other` are common to the three hybrid types; a `strength`
// exercise keeps the list it always had, with the kettlebell added.

import type { Equipment, ExerciseType } from './catalog';

const HYBRID_COMMON: readonly Equipment[] = ['bodyweight', 'resistance-band', 'other'];

const EQUIPMENT_BY_TYPE: Record<ExerciseType, readonly Equipment[]> = {
  strength: [
    'barbell',
    'dumbbell',
    'machine',
    'cable',
    'kettlebell',
    'bodyweight',
    'bodyweight-weighted',
    'resistance-band',
    'other',
  ],
  power: ['medicine-ball', 'slam-ball', 'sandbag', 'kettlebell', 'plyo-box', ...HYBRID_COMMON],
  interval: ['heavy-bag', 'jump-rope', 'rowing-machine', 'battle-rope', ...HYBRID_COMMON],
  mobility: ['foam-roller', 'yoga-mat', ...HYBRID_COMMON],
};

/** The equipment an exercise of `type` can have, in the order a picker shows it. */
export function equipmentOptionsFor(type: ExerciseType): readonly Equipment[] {
  return EQUIPMENT_BY_TYPE[type];
}
