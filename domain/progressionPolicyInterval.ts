// Progression policy for `interval` exercises — 10 · Hybrid Exercises, "Interval: рычаги
// прогрессии". An interval exercise's unit is the round, not a set of reps, and what it progresses
// on is a lever chosen per exercise (`rest`, `workTime`, `rounds`, `none`): every round done → step
// the lever, else repeat the plan. That rule is GT-100.
//
// The next working week is the interval's own already (GT-93): the structure is inherited from the
// fact (03, "Структура наследуется от факта") — one round per round of the source, so rounds added
// or removed in the workout stay, each with the times it was done with (`roundTimesOf`). GT-100
// steps the lever on top of that. A deload day, rule 6 and a copied block's start still run
// strength's, as the type did before the engine dispatched by type.
//
// It has a file of its own on purpose: what an interval does for each of the policy's four jobs is
// replaced here one by one, exactly as power's was, without a branch on the type anywhere else.

import type { RoundLog } from '@domain/execution';
import type { ProgressionPolicy } from '@domain/progressionPolicy';
import { strengthPolicy } from '@domain/progressionPolicyStrength';
import { targetRir } from '@domain/progressionRir';
import { roundTimesOf } from '@domain/roundTimes';

export const intervalPolicy: ProgressionPolicy = {
  prescribeWorkingWeek({ sessionExercise }, { roundLogs, weekNumber, lengthWeeks }) {
    const logByRound = new Map<number, RoundLog>();
    for (const log of roundLogs) {
      if (log.sessionExerciseId === sessionExercise.id && !logByRound.has(log.roundNumber)) {
        logByRound.set(log.roundNumber, log);
      }
    }
    return {
      exerciseId: sessionExercise.exerciseId,
      order: sessionExercise.order,
      setTargets: sessionExercise.setTargets.map((round) => ({
        setNumber: round.setNumber,
        ...roundTimesOf(round, logByRound.get(round.setNumber)),
      })),
      // An interval has no RIR on screen, but every session exercise carries the week's.
      targetRir: targetRir(lengthWeeks, weekNumber),
    };
  },
  prescribeDeload: strengthPolicy.prescribeDeload,
  prescribeFromReference: strengthPolicy.prescribeFromReference,
  prescribeBlockStart: strengthPolicy.prescribeBlockStart,
};
