// The Fast reps ⓘ plate's copy — what a power set is, in the shape the strength Reps plate has: the
// rule first, the corridor drawn under it, then the rest as steps (08.7.1, "no history"). The
// corridor is power's own, 2–6 (`domain/progressionCorridor.ts`), and the plate says what it means:
// a recommendation up to where speed is still the point, not a ceiling anyone is stopped at.

import type { PlateTextPart } from '@design/components/PlateRow';
import type { RangeTrackLabel, RangeTrackRange } from '@design/components/RangeTrack';
import { POWER_MAX_REPS, POWER_MIN_REPS } from '@domain/progressionCorridor';

export type FastRepsPlate = {
  title: string;
  steps: PlateTextPart[][];
  corridor: {
    outer: RangeTrackRange;
    inner: RangeTrackRange;
    labels: RangeTrackLabel[];
    accessibilityLabel: string;
  };
};

export function fastRepsPlate(): FastRepsPlate {
  return {
    title: 'Fast reps',
    steps: [
      ['Do every rep ', { strong: 'as fast as you can' }, '.'],
      ['Stop the set when ', { strong: 'the speed drops' }, ' — count only the fast reps.'],
      [
        'Recommended: ',
        { strong: `up to ${POWER_MAX_REPS} fast reps` },
        ' per set. Past that it trains endurance more than power.',
      ],
      ['Next time: ', { strong: '+1 rep' }, ' on each set.'],
    ],
    // Dashes a little wider than the corridor either side, so the accent bar reads as a stretch
    // inside a longer scale and its two ends have room for their numbers (as the strength plate).
    corridor: {
      outer: { min: 0, max: POWER_MIN_REPS + POWER_MAX_REPS },
      inner: { min: POWER_MIN_REPS, max: POWER_MAX_REPS },
      labels: [
        { value: POWER_MIN_REPS, text: `${POWER_MIN_REPS}` },
        { value: POWER_MAX_REPS, text: `${POWER_MAX_REPS}` },
      ],
      accessibilityLabel: `Fast reps per set: ${POWER_MIN_REPS} to ${POWER_MAX_REPS}`,
    },
  };
}
