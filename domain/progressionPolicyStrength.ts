// Progression policy for `strength` exercises — rules 1–5 of 03 · Progression Engine as they
// were before the engine dispatched by type. Rule 4 (RIR) and rule 5's grouping by muscle group
// belong to this policy alone (10 · Hybrid Exercises); the rules themselves stay in their own
// `domain/progression<Rule>.ts` files, which a policy of another type is free to reuse.

import { prescribeDeloadDay } from '@domain/progressionDeload';
import type { ProgressionPolicy } from '@domain/progressionPolicy';
import { nextSetTargets } from '@domain/progressionReps';
import { targetRir } from '@domain/progressionRir';

export const strengthPolicy: ProgressionPolicy = {
  prescribeWorkingWeek({ sessionExercise, equipment }, { logs, weekNumber, lengthWeeks, settings }) {
    return {
      exerciseId: sessionExercise.exerciseId,
      order: sessionExercise.order,
      setTargets: nextSetTargets(sessionExercise, logs, settings, equipment),
      targetRir: targetRir(lengthWeeks, weekNumber),
    };
  },
  prescribeDeload: (exercises, { logs, settings }) => prescribeDeloadDay(exercises, logs, settings),
};
