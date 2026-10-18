// The shape of a Reps ⓘ plate (08.7.1, "no history"): a few numbered steps with the rep corridor
// drawn under the first. The strength plate with no history to read a range from
// (WeightSwapLogic.ts), power's Fast reps plate (FastRepsPlateLogic.ts) and a band's
// (StrengthExerciseCardLogic.ts) all have it; CorridorStepsPopover draws it.

import type { PlateTextPart } from '@design/components/PlateRow';
import type { RangeTrackLabel, RangeTrackRange } from '@design/components/RangeTrack';

/**
 * The corridor a set has to land in, drawn as the Reps plate always draws a span: dashes with the
 * accent bar over the part to aim for.
 */
export type RepCorridorTrack = {
  outer: RangeTrackRange;
  inner: RangeTrackRange;
  labels: RangeTrackLabel[];
  /** Said by assistive technology; nothing is written under the track. */
  accessibilityLabel: string;
};

export type CorridorStepsPlate = {
  title: string;
  corridor: RepCorridorTrack;
  steps: PlateTextPart[][];
};

/**
 * The track of a `min`–`max` corridor. It dashes a corridor-width of margin either side, so the
 * accent bar reads as a stretch inside a longer scale and its two ends have room for their numbers.
 */
export function repCorridorTrack(
  min: number,
  max: number,
  accessibilityLabel: string,
): RepCorridorTrack {
  return {
    outer: { min: 0, max: min + max },
    inner: { min, max },
    labels: [
      { value: min, text: `${min}` },
      { value: max, text: `${max}` },
    ],
    accessibilityLabel,
  };
}
