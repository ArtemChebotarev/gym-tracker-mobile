// Progression policy for `power` exercises — 10.2 · Power progression, as amended on 17.10.2026.
// Set by set: set N of the next week is the fact of set N + 1, with no clamp — the 2–6 corridor
// is the trigger of rule 3's hint, not a limit on the sum (P3). The weight is the one logged on
// that set (P4), sets are copied (P2), a set not logged is carried over. A sum of 0 or less gives
// the row no numbers (`N RIR`). `targetRir` is still written: the next block's Start reads it
// back as the reference's RIR (P14). Deload is the strength policy's until GT-83 (P15).

import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { SetLog, SetTarget } from '@domain/execution';
import { POWER_CORRIDOR, usableReps } from '@domain/progressionCorridor';
import type { ProgressionPolicy } from '@domain/progressionPolicy';
import { hintForReps } from '@domain/progressionWeightHint';
import { targetRir } from '@domain/progressionRir';
import { strengthPolicy } from '@domain/progressionPolicyStrength';

export const powerPolicy: ProgressionPolicy = {
  prescribeWorkingWeek({ sessionExercise, equipment }, { logs, weekNumber, lengthWeeks }) {
    const logBySet = new Map<number, SetLog>();
    for (const log of logs) {
      if (log.sessionExerciseId === sessionExercise.id && !logBySet.has(log.setNumber)) {
        logBySet.set(log.setNumber, log);
      }
    }
    const carriesWeight = !isPureBodyWeight(equipment);
    const setTargets = sessionExercise.setTargets.map((source): SetTarget => {
      const log = logBySet.get(source.setNumber);
      const target: SetTarget = { setNumber: source.setNumber };
      if (log === undefined) {
        // Not logged: carried over as it was, with no increment. An estimate isn't carried.
        if (source.estimate !== undefined) {
          return target;
        }
        target.targetReps = source.targetReps;
        if (carriesWeight && source.suggestedWeight !== undefined) {
          target.suggestedWeight = source.suggestedWeight;
        }
        return target;
      }
      const reps = usableReps(log.reps + 1);
      if (reps === undefined) {
        return target;
      }
      target.targetReps = reps;
      if (carriesWeight) {
        target.suggestedWeight = log.weight;
      }
      const hint = hintForReps(log.reps, POWER_CORRIDOR, equipment);
      if (hint !== undefined) {
        target.weightHint = hint;
      }
      return target;
    });
    return {
      exerciseId: sessionExercise.exerciseId,
      order: sessionExercise.order,
      setTargets,
      targetRir: targetRir(lengthWeeks, weekNumber),
    };
  },
  prescribeDeload: strengthPolicy.prescribeDeload,
};
