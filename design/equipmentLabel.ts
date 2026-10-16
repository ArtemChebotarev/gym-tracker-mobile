// Equipment display labels — see 08.6 · Библиотека упражнений ("New exercise — лист").
// `Equipment` values are lowercase domain ids (`barbell`, `bodyweight`, ...); this is the single
// place that turns one into the capitalized label a screen shows, mirroring
// design/muscleGroupLabel.ts's `Record<Equipment, T>` pattern so a new equipment value fails to
// compile here until it's given a label.

import type { Equipment } from '@domain/catalog';

const LABEL_BY_EQUIPMENT: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
  'bodyweight-weighted': 'Bodyweight (weighted)',
  'resistance-band': 'Resistance band',
  kettlebell: 'Kettlebell',
  'medicine-ball': 'Medicine ball',
  'plyo-box': 'Plyo box',
  'slam-ball': 'Slam ball',
  sandbag: 'Sandbag',
  'heavy-bag': 'Heavy bag',
  'jump-rope': 'Jump rope',
  'rowing-machine': 'Rowing machine',
  'battle-rope': 'Battle rope',
  'foam-roller': 'Foam roller',
  'yoga-mat': 'Yoga mat',
  other: 'Other',
};

export function getEquipmentLabel(equipment: Equipment): string {
  return LABEL_BY_EQUIPMENT[equipment];
}
