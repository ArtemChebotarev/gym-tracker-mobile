// Exercise type display labels — see 10 · Hybrid Exercises, 10.1 FR-11 and FR-16. `ExerciseType`
// values are the data keys (`strength`, `power`, `interval`, `mobility`); this is the single place
// that turns one into what a screen shows. `interval` reads "Timed work" to the user (FR-16): the
// key stays, only its label differs. A `Record<ExerciseType, T>` so a new type fails to compile
// here until it is given a label, like equipmentLabel.ts.

import type { ExerciseType } from '@domain/catalog';

const LABEL_BY_TYPE: Record<ExerciseType, string> = {
  strength: 'Strength',
  power: 'Power',
  interval: 'Timed work',
  mobility: 'Mobility',
};

// One line under the label in the type step of the New exercise sheet (canvas 4.x, "CreateType").
const DESCRIPTION_BY_TYPE: Record<ExerciseType, string> = {
  strength: 'Weight × reps with RIR. Grows reps, then weight.',
  power: 'Explosive. Fast reps only, stop when you slow down.',
  interval: 'Rounds of work and rest, run by a timer.',
  mobility: 'Cooldown or stretching. A timer, no progress.',
};

export function getExerciseTypeLabel(type: ExerciseType): string {
  return LABEL_BY_TYPE[type];
}

export function getExerciseTypeDescription(type: ExerciseType): string {
  return DESCRIPTION_BY_TYPE[type];
}
