// The icon of each exercise type — see exerciseTypeLabel.ts for its name. A `Record` so a new type
// fails to compile here until it is given one.

import type { ExerciseType } from '@domain/catalog';

import type { IconComponent } from './icons/IconFrame';
import { PowerIcon } from './icons/PowerIcon';
import { StrengthIcon } from './icons/StrengthIcon';
import { StretchIcon } from './icons/StretchIcon';
import { TimerIcon } from './icons/TimerIcon';

const ICON_BY_TYPE: Record<ExerciseType, IconComponent> = {
  strength: StrengthIcon,
  power: PowerIcon,
  interval: TimerIcon,
  mobility: StretchIcon,
};

export function getExerciseTypeIcon(type: ExerciseType): IconComponent {
  return ICON_BY_TYPE[type];
}
