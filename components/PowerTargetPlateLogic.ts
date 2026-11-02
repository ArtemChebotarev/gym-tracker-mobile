// The power ⓘ's plate once the set has a target — 08.11, "Power: Load ⓘ". The target, the corridor
// it sits in and the two rules of a power set. The corridor is power's own, 2–6
// (`domain/progressionCorridor.ts`). No numbers at another weight: rule 7's formula works from a set
// near failure, and a power set stops at the speed.

import type { PlateTextPart } from '@design/components/PlateText';
import type { PowerLoad } from '@domain/exerciseConfig';
import { POWER_MAX_REPS, POWER_MIN_REPS } from '@domain/progressionCorridor';
import type { WorkoutSetRow } from '@usecases/workoutSession';

import { type RepCorridorTrack, repCorridorTrack } from './CorridorStepsPlateLogic';
import { formatRowWeight } from './WorkoutSetRowLogic';

export type PowerTargetPlate = {
  title: string;
  subtitle?: string;
  corridor: RepCorridorTrack;
  /** The dot on the corridor: the target's reps. */
  marker: number;
  rows: readonly PlateTextPart[][];
};

/** What the target reads as in its own load: `20 kg × 4`, `Level 2 × 4`, or just `4 reps`. */
function formatPowerTarget(
  load: PowerLoad,
  weight: number | undefined,
  reps: number,
): string {
  if (load === 'none' || weight === undefined) {
    return `${reps} reps`;
  }
  return load === 'level'
    ? `Level ${formatRowWeight(weight)} × ${reps}`
    : `${formatRowWeight(weight)} kg × ${reps}`;
}

const POWER_TARGET_SUBTITLE: Record<PowerLoad, string | undefined> = {
  weight: 'Heavier means fewer fast reps. Stay in the range.',
  level: 'Higher load means fewer fast reps. Stay in the range.',
  none: undefined,
};

/**
 * The corridor with the target on it. A target may leave the corridor — it is a trigger for a hint,
 * not a limit (10.2) — so the scale stretches rather than pin the dot to the track's end.
 */
function powerCorridor(target: number): RepCorridorTrack {
  const track = repCorridorTrack(
    POWER_MIN_REPS,
    POWER_MAX_REPS,
    `Fast reps per set: ${POWER_MIN_REPS} to ${POWER_MAX_REPS}, target ${target}`,
  );
  const bounds = [POWER_MIN_REPS, POWER_MAX_REPS];
  return {
    ...track,
    outer: { min: track.outer.min, max: Math.max(track.outer.max, target + 1) },
    labels: [...new Set([...bounds, target])]
      .sort((a, b) => a - b)
      .map((value) => ({
        value,
        text: value === POWER_MAX_REPS ? `${value} fast reps` : `${value}`,
      })),
  };
}

/**
 * `undefined` while the set has no target to speak of: the ⓘ then opens the "Finding your load"
 * plate instead (08.11, "Правило ⓘ"). Always the set's own target, whatever is in the fields.
 */
export function powerTargetPlate(
  row: Pick<WorkoutSetRow, 'targetReps' | 'suggestedWeight' | 'estimate'> | undefined,
  load: PowerLoad,
): PowerTargetPlate | undefined {
  if (row?.targetReps === undefined) {
    return undefined;
  }
  const subtitle = POWER_TARGET_SUBTITLE[load];
  const label = row.estimate === undefined ? 'target' : 'estimate';
  return {
    title: `Current set ${label}: ${formatPowerTarget(load, row.suggestedWeight, row.targetReps)}`,
    ...(subtitle === undefined ? {} : { subtitle }),
    corridor: powerCorridor(row.targetReps),
    marker: row.targetReps,
    rows: [
      ['Stop when ', { strong: 'the speed drops' }, '. Count only the fast reps.'],
      ['Next time: ', { strong: '+1 rep' }, ' on each set.'],
    ],
  };
}
