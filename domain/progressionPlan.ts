// Progression engine — next-session assembly. See 03 · Progression Engine, "Роль движка" and
// "Структура наследуется от факта". The engine's entry point: it takes the finished source
// session (week W, day D) and plans the same day of week W + 1 by composing rules 1–5. Pure —
// no storage, no clock, no randomness; the use case layer reads the inputs, assigns ids and
// persists the result.

import type { ExerciseType } from '@domain/catalog';
import type { SetLog } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import { isDeloadWeek } from '@domain/mesocycleWeeks';
import type { ExercisePrescription, SourceExercise } from '@domain/progression';
import { policyFor } from '@domain/progressionPolicies';

export type NextSessionInput = {
  /**
   * Every exercise of the source session at Finish, as actually performed: exercises added or
   * swapped in mid-session (rule 6) are already ordinary rows here, and removed ones are simply
   * absent. Any order — `order` decides.
   */
  exercises: readonly SourceExercise[];
  /** The source session's `SetLog`s; logs of other session exercises are ignored. */
  logs: readonly SetLog[];
  /** Week number of the session being planned (the source's week + 1). */
  weekNumber: number;
  lengthWeeks: number;
  settings: ProgressionSettings;
};

/**
 * The next session's exercises. The structure is inherited from the source's fact — its
 * exercises, their order after any reordering, and the `exerciseId` actually performed after
 * any swap; nothing removed comes back. What each exercise is then planned with is its type's
 * policy (`domain/progressionPolicies.ts`); for `strength`, per exercise:
 *
 * - Working week: one row per source row (rule 1), each progressed from its own source set
 *   (rule 2) with its own weight hint (rule 3), at the week's `targetRir` (rule 4).
 * - Deload week: the whole day is planned by rule 5.
 */
export function prescribeNextSession(input: NextSessionInput): ExercisePrescription[] {
  const { exercises, logs, weekNumber, lengthWeeks, settings } = input;
  assertWeekInBlock(weekNumber, lengthWeeks);
  const context = { logs, weekNumber, lengthWeeks, settings };

  if (isDeloadWeek(lengthWeeks, weekNumber)) {
    const byType = new Map<ExerciseType, SourceExercise[]>();
    for (const exercise of exercises) {
      const type = exercise.type ?? 'strength';
      byType.set(type, [...(byType.get(type) ?? []), exercise]);
    }
    return [...byType]
      .flatMap(([type, own]) => policyFor({ type }).prescribeDeload(own, context))
      .sort((a, b) => a.order - b.order);
  }

  return [...exercises]
    .sort((a, b) => a.sessionExercise.order - b.sessionExercise.order)
    .map((exercise) => policyFor(exercise).prescribeWorkingWeek(exercise, context));
}

function assertWeekInBlock(weekNumber: number, lengthWeeks: number): void {
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > lengthWeeks) {
    throw new Error(
      `Week must be an integer between 1 and ${lengthWeeks} for a ${lengthWeeks}-week mesocycle, got ${weekNumber}.`,
    );
  }
}
