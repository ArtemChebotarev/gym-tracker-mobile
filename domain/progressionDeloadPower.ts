// Rule 5 for `power` — the deload day. See 10.2 · Power progression (P15) and 03, "Правило 5". The
// week is for recovery, not for progression: fewer sets and, where the load is kilograms, half the
// weight — and nothing else. No target reps (last week's reps are shown as a guide, as for strength),
// the week's RIR written as for any exercise although a power card doesn't show it.
//
// Unlike strength's, it doesn't group by muscle group — that is secondary for power — and it
// doesn't give every set the first set's weight: sets may carry different weights (P4), and each
// keeps its own.

import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { SetLog, SetTarget } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import type { ExercisePrescription, SourceExercise } from '@domain/progression';

/** Sets a power exercise keeps on a deload day when it had two or more (17.10.2026). */
export const POWER_DELOAD_SETS = 2;

type DeloadSettings = Pick<ProgressionSettings, 'deloadRir' | 'deloadWeightFactor'>;

/** 2 sets for an exercise that had two or more, the single one otherwise. */
export function powerDeloadSetCount(plannedSets: number): number {
  return Math.min(plannedSets, POWER_DELOAD_SETS);
}

/**
 * The weight of set `setNumber` on the deload day, from that set's own fact last week — or its own
 * suggested weight when it wasn't logged. Kilograms are cut by `deloadWeightFactor`; a level stays
 * the level (it can't be halved), and an exercise that is its own load keeps what it had. `undefined`
 * when the set had no weight at all.
 */
export function powerDeloadWeight(
  source: SourceExercise,
  setNumber: number,
  logs: readonly SetLog[],
  settings: Pick<DeloadSettings, 'deloadWeightFactor'>,
): number | undefined {
  const { sessionExercise } = source;
  const log = logs.find(
    (candidate) =>
      candidate.sessionExerciseId === sessionExercise.id && candidate.setNumber === setNumber,
  );
  const target = sessionExercise.setTargets.find((candidate) => candidate.setNumber === setNumber);
  const weight = log?.weight ?? target?.suggestedWeight;
  if (weight === undefined) {
    return undefined;
  }
  return (source.powerLoad ?? 'weight') === 'weight'
    ? weight * settings.deloadWeightFactor
    : weight;
}

/**
 * The deload day planned from the same day of the last working week: every power exercise, in
 * order, its first `powerDeloadSetCount` sets, each with its own weight (cut for kilograms only),
 * the deload RIR from settings and no target reps. A pure bodyweight exercise gets no weight at all.
 */
export function prescribePowerDeloadDay(
  exercises: readonly SourceExercise[],
  logs: readonly SetLog[],
  settings: DeloadSettings,
): ExercisePrescription[] {
  return [...exercises]
    .sort((a, b) => a.sessionExercise.order - b.sessionExercise.order)
    .map((source): ExercisePrescription => {
      const { sessionExercise, equipment } = source;
      const rows = [...sessionExercise.setTargets]
        .sort((a, b) => a.setNumber - b.setNumber)
        .slice(0, powerDeloadSetCount(sessionExercise.setTargets.length));
      const setTargets = rows.map((row, index): SetTarget => {
        const weight = isPureBodyWeight(equipment)
          ? undefined
          : powerDeloadWeight(source, row.setNumber, logs, settings);
        return weight === undefined
          ? { setNumber: index + 1 }
          : { setNumber: index + 1, suggestedWeight: weight };
      });
      return {
        exerciseId: sessionExercise.exerciseId,
        order: sessionExercise.order,
        setTargets,
        targetRir: settings.deloadRir,
      };
    });
}
