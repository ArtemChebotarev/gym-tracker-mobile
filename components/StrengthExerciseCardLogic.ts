// Pure helpers behind components/StrengthExerciseCard.tsx — see the code-style skill.
//
// A resistance band is a strength exercise (10.1 FR-15) and keeps this card; what sets it apart is
// gathered here rather than branched on across the card: no RIR (`targetRirOf`), `Bodyweight, kg`
// over its Weight column, its own Reps ⓘ, and its own words at the top of the corridor.

import { isResistanceBand, usesAddedWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { ExerciseWeightHint } from '@domain/workoutViewRules';

import { type CorridorStepsPlate, repCorridorTrack } from './CorridorStepsPlateLogic';
import type { WeightSwapPopover } from './WeightSwapLogic';

/**
 * The Weight column's header: `Weight, kg`, `Added, kg` on a weighted bodyweight exercise, and
 * `Bodyweight, kg` on a band — its field holds the body weight (`isPureBodyWeight`), as a power
 * exercise with no load does.
 */
export function strengthWeightColumnLabel(equipment: Equipment | undefined): string {
  if (isResistanceBand(equipment)) {
    return 'Bodyweight, kg';
  }
  return usesAddedWeight(equipment) ? 'Added, kg' : 'Weight, kg';
}

/** The card's weight hint line: `Go heavier — 30+ reps last week` / `Go lighter — under 5 reps…`. */
export function formatWeightHint(hint: ExerciseWeightHint, equipment?: Equipment): string {
  if (hint.direction === 'increase' && isResistanceBand(equipment)) {
    return 'Try tighter band or slow down tempo';
  }
  return hint.direction === 'increase'
    ? `Go heavier — ${hint.reps}+ reps last week`
    : `Go lighter — under ${hint.reps} reps last week`;
}

/**
 * The plate behind a band's Reps ⓘ — the strength plate's shape (the step, the corridor under it,
 * the rest) with a band's words: there is no weight to pick and no reserve to aim at (10.1 FR-15),
 * so it says which band to take and what to do at the top of the corridor.
 */
export function bandRepsPlate(): CorridorStepsPlate {
  const { minReps, maxReps } = defaultProgressionSettings;
  return {
    title: 'Reps with a band',
    corridor: repCorridorTrack(minReps, maxReps, `Reps per set: ${minReps} to ${maxReps}`),
    steps: [
      ['Pick a band you can do ', { strong: `${minReps}–${maxReps} reps` }, ' with.'],
      ['Stop each set with ', { strong: 'a few reps in reserve' }, '.'],
      [
        'At ',
        { strong: `${maxReps} reps` },
        ', take a tighter band or slow down the tempo.',
      ],
    ],
  };
}

/**
 * What the Reps ⓘ opens on a strength card: the weight swap's plate for the next set (08.7.1) while
 * the card offers it, or — on a band, which has no swap — the band's plate, always.
 */
export type StrengthRepsInfo =
  | { kind: 'swap'; popover: WeightSwapPopover }
  | { kind: 'band'; plate: CorridorStepsPlate };

export function strengthRepsInfo(
  equipment: Equipment | undefined,
  swap: WeightSwapPopover | undefined,
): StrengthRepsInfo | undefined {
  if (isResistanceBand(equipment)) {
    return { kind: 'band', plate: bandRepsPlate() };
  }
  return swap === undefined ? undefined : { kind: 'swap', popover: swap };
}
