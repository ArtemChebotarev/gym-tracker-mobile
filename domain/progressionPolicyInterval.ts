// Progression policy for `interval` exercises — 10 · Hybrid Exercises, "Interval: рычаги
// прогрессии". An interval exercise's unit is the round, not a set of reps, and what it progresses
// on is a lever chosen per exercise in its cycle (`rest`, `workTime`, `rounds`, `none`).
//
// The next working week is the interval's own: the structure is inherited from the fact (GT-93;
// 03, "Структура наследуется от факта") — one round per round of the source, so rounds added or
// removed in the workout stay, each with the times it was done with (`roundTimesOf`). On top of
// that the lever steps when every round was done, and the plan repeats when one was not (GT-100,
// `domain/progressionLever.ts`). An exercise whose lever the engine wasn't given repeats its plan:
// with nothing to go by, nothing is recommended (03, "Не уверен — не рекомендуй"). A deload day,
// rule 6 and a copied block's start still run strength's, as the type did before the engine
// dispatched by type.
//
// It has a file of its own on purpose: what an interval does for each of the policy's four jobs is
// replaced here one by one, exactly as power's was, without a branch on the type anywhere else.

import type { RoundLog } from '@domain/execution';
import { allRoundsDone, stepLever } from '@domain/progressionLever';
import type { ProgressionPolicy } from '@domain/progressionPolicy';
import { strengthPolicy } from '@domain/progressionPolicyStrength';
import { targetRir } from '@domain/progressionRir';
import { roundTimesOf } from '@domain/roundTimes';

export const intervalPolicy: ProgressionPolicy = {
  prescribeWorkingWeek(
    { sessionExercise, intervalProgression },
    { roundLogs, weekNumber, lengthWeeks },
  ) {
    const logByRound = new Map<number, RoundLog>();
    for (const log of roundLogs) {
      if (log.sessionExerciseId === sessionExercise.id && !logByRound.has(log.roundNumber)) {
        logByRound.set(log.roundNumber, log);
      }
    }
    const rounds = sessionExercise.setTargets.map((round) => ({
      setNumber: round.setNumber,
      ...roundTimesOf(round, logByRound.get(round.setNumber)),
    }));
    const steps =
      intervalProgression !== undefined && allRoundsDone(sessionExercise.setTargets, logByRound);
    return {
      exerciseId: sessionExercise.exerciseId,
      order: sessionExercise.order,
      setTargets: steps ? stepLever(rounds, intervalProgression) : rounds,
      // An interval has no RIR on screen, but every session exercise carries the week's.
      targetRir: targetRir(lengthWeeks, weekNumber),
    };
  },
  prescribeDeload: strengthPolicy.prescribeDeload,
  prescribeFromReference: strengthPolicy.prescribeFromReference,
  prescribeBlockStart: strengthPolicy.prescribeBlockStart,
};
