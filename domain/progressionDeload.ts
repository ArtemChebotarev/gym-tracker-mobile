// Progression engine, rule 5 — the deload week. See 03 · Progression Engine, "Правило 5 —
// deload". The last week of a block follows its own rules instead of the general
// progression: fewer sets, a fraction of the weight, a fixed RIR, and no target reps.

import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { MuscleGroup } from '@domain/catalog';
import type { SetLog } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import type { ExercisePrescription, SourceExercise } from '@domain/progression';

/** Sets for an exercise that is the only one of its muscle group within the day. */
export const DELOAD_SETS_SOLE_EXERCISE = 2;
/** Sets for each exercise when its muscle group has two or more exercises within the day. */
export const DELOAD_SETS_SHARED_GROUP = 1;

type DeloadSettings = Pick<ProgressionSettings, 'deloadRir' | 'deloadWeightFactor'>;

/**
 * 2 sets when the exercise is alone in its muscle group for the day, 1 set each otherwise. No
 * exercise is ever dropped, so three exercises of one group still give 3 sets in total.
 */
export function deloadSetCount(exercisesInGroup: number): number {
  return exercisesInGroup > 1 ? DELOAD_SETS_SHARED_GROUP : DELOAD_SETS_SOLE_EXERCISE;
}

/**
 * `deloadWeightFactor` × the weight of the exercise's first set in the last working week: the
 * logged weight when set 1 was logged, otherwise set 1's `suggestedWeight` (the last known
 * weight, as for a source exercise with no logged sets — "Граничные случаи"). `undefined` when
 * neither is known.
 */
export function deloadWeight(
  source: SourceExercise['sessionExercise'],
  logs: readonly SetLog[],
  settings: Pick<DeloadSettings, 'deloadWeightFactor'>,
): number | undefined {
  const firstTarget = source.setTargets[0];
  if (firstTarget === undefined) {
    return undefined;
  }
  const firstLog = logs.find(
    (log) => log.sessionExerciseId === source.id && log.setNumber === firstTarget.setNumber,
  );
  const baseWeight = firstLog?.weight ?? firstTarget.suggestedWeight;
  return baseWeight === undefined ? undefined : baseWeight * settings.deloadWeightFactor;
}

/**
 * The deload day planned from the same day of the last working week: every source exercise,
 * in order, with its set count by muscle group, the reduced weight on every set, the deload
 * RIR from settings, and no `targetReps` (the target is working to the deload RIR, not a rep
 * count). No rep increment and no weight hint apply. A pure bodyweight exercise gets no weight
 * at all — see `domain/bodyWeightLoad.ts`.
 */
export function prescribeDeloadDay(
  exercises: readonly SourceExercise[],
  logs: readonly SetLog[],
  settings: DeloadSettings,
): ExercisePrescription[] {
  const exercisesPerGroup = new Map<MuscleGroup, number>();
  for (const { muscleGroup } of exercises) {
    exercisesPerGroup.set(muscleGroup, (exercisesPerGroup.get(muscleGroup) ?? 0) + 1);
  }

  return [...exercises]
    .sort((a, b) => a.sessionExercise.order - b.sessionExercise.order)
    .map(({ sessionExercise, muscleGroup, equipment }) => {
      const setCount = deloadSetCount(exercisesPerGroup.get(muscleGroup) ?? 1);
      // A pure bodyweight exercise deloads on reps and RIR alone (task 105): half a body weight
      // is not a weight anyone can load, and the body weight itself hasn't changed.
      const suggestedWeight = isPureBodyWeight(equipment)
        ? undefined
        : deloadWeight(sessionExercise, logs, settings);
      return {
        exerciseId: sessionExercise.exerciseId,
        order: sessionExercise.order,
        setTargets: Array.from({ length: setCount }, (_, index) =>
          suggestedWeight === undefined
            ? { setNumber: index + 1 }
            : { setNumber: index + 1, suggestedWeight },
        ),
        targetRir: settings.deloadRir,
      };
    });
}
