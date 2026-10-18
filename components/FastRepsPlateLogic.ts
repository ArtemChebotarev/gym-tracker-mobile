// The Fast reps ⓘ plate's copy — what a power set is, in the shape the strength Reps plate has: the
// rule first, the corridor drawn under it, then the rest as steps (08.7.1, "no history"). The
// corridor is power's own, 2–6 (`domain/progressionCorridor.ts`), and the plate says what it means:
// a recommendation up to where speed is still the point, not a ceiling anyone is stopped at.

import { POWER_MAX_REPS, POWER_MIN_REPS } from '@domain/progressionCorridor';

import { type CorridorStepsPlate, repCorridorTrack } from './CorridorStepsPlateLogic';

export function fastRepsPlate(): CorridorStepsPlate {
  return {
    title: 'Fast reps',
    steps: [
      [
        'Pick a load you can move for ',
        { strong: `${POWER_MIN_REPS}–${POWER_MAX_REPS} fast reps` },
        '.',
      ],
      ['Do every rep ', { strong: 'as fast as you can' }, '.'],
      ['Stop the set when ', { strong: 'the speed drops' }, ' — count only the fast reps.'],
      [
        'Recommended: ',
        { strong: `up to ${POWER_MAX_REPS} fast reps` },
        ' per set. Past that it trains endurance more than power.',
      ],
      ['Next time: ', { strong: '+1 rep' }, ' on each set.'],
    ],
    corridor: repCorridorTrack(
      POWER_MIN_REPS,
      POWER_MAX_REPS,
      `Fast reps per set: ${POWER_MIN_REPS} to ${POWER_MAX_REPS}`,
    ),
  };
}
