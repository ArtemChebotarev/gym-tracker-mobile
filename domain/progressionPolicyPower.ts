// Progression policy for `power` exercises — 10.2 · Power progression. The strength rules in a
// short rep corridor, set by set: set N of the next week is `clamp(fact of set N + 1, 2, 6)`
// (P3), the weight is the one logged on that set (P4), sets are copied (P2). No weight hint and
// no RIR-based target (P5): `targetRir` is still written, because the next block's Start reads
// it back as the reference's RIR (P14). Deload is the strength policy's until GT-83 (P15).

import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { SetLog, SetTarget } from '@domain/execution';
import { POWER_CORRIDOR } from '@domain/progressionCorridor';
import type { ProgressionPolicy } from '@domain/progressionPolicy';
import { nextTargetReps } from '@domain/progressionReps';
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
      target.targetReps = nextTargetReps(log.reps, POWER_CORRIDOR);
      if (carriesWeight) {
        target.suggestedWeight = log.weight;
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
