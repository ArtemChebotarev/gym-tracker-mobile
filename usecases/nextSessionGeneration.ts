// Next-session generation — the trigger half of task 050 (05 · Workout Execution & Logging,
// "Завершение как триггер генерации"; 03 · Progression Engine, "Ленивая генерация по дням").
// Finishing (050) or skipping (049) week W, day D creates week W + 1, day D. Always runs inside
// the caller's transaction, so the trigger's final status and the new session land together.
// Orchestration only: the base is picked by `resolveBaseSession`, the plan by
// `prescribeNextSession`, the records by `buildNextSession`.

import { toExerciseId } from '@domain/catalog';
import { ConflictError, NotFoundError } from '@domain/errors';
import type { Session } from '@domain/execution';
import { buildNextSession, nextWeekNumber } from '@domain/nextSessionBuilders';
import type { SourceExercise } from '@domain/progression';
import { prescribeNextSession } from '@domain/progressionPlan';
import { resolveBaseSession } from '@domain/progressionSource';
import type { ExerciseRepository } from '@repositories/catalog';
import type { MesocycleRepository } from '@repositories/mesocycle';
import type { WorkoutRepositories } from '@repositories/workout';

export type NextSessionGenerationDeps = {
  mesocycleRepo: MesocycleRepository;
  /** Resolves each exercise's muscle group, which the deload rule groups sets by (03, rule 5). */
  exerciseRepo: ExerciseRepository;
};

/**
 * Creates the session after `trigger` — which must already carry its final status — through
 * `repos`, and resolves to it; `null` when `trigger` is a deload session and the block has no
 * next week. The plan is built from the trigger's fact if it was completed, or from the last
 * completed session of the same day if it was skipped (week 1's plan when there is none).
 *
 * Rejects with `ConflictError` if `trigger` isn't final or its next-week session already exists,
 * and with `NotFoundError` if the mesocycle or one of the base's exercises is missing — nothing is
 * planned from data that doesn't add up.
 */
export async function generateNextSession(
  trigger: Session,
  repos: WorkoutRepositories,
  deps: NextSessionGenerationDeps,
): Promise<Session | null> {
  const mesocycle = await deps.mesocycleRepo.getById(trigger.mesoId);
  if (!mesocycle) {
    throw new NotFoundError(`Mesocycle "${trigger.mesoId}" does not exist.`);
  }
  const weekNumber = nextWeekNumber(trigger, mesocycle.lengthWeeks);
  if (weekNumber === null) {
    return null;
  }

  const mesoSessions = await repos.sessionRepo.listByMesoId(trigger.mesoId);
  if (
    mesoSessions.some(
      (session) => session.weekNumber === weekNumber && session.dayNumber === trigger.dayNumber,
    )
  ) {
    throw new ConflictError(
      `Week ${weekNumber}, day ${trigger.dayNumber} of mesocycle "${trigger.mesoId}" already exists.`,
    );
  }
  const resolution = resolveBaseSession(trigger, mesoSessions);
  if (resolution.status === 'awaiting_source') {
    throw new ConflictError(
      `Session "${trigger.id}" is ${trigger.status}; only a finished session plans the next week.`,
    );
  }
  const { base } = resolution;

  const baseExercises = await repos.sessionExerciseRepo.listBySessionId(base.id);
  const catalog = await deps.exerciseRepo.listByIds(
    baseExercises.map((sessionExercise) => toExerciseId(sessionExercise.exerciseId)),
  );
  const exercises = baseExercises.map((sessionExercise): SourceExercise => {
    const exercise = catalog.find((candidate) => candidate.id === sessionExercise.exerciseId);
    if (!exercise) {
      throw new NotFoundError(`Exercise "${sessionExercise.exerciseId}" does not exist.`);
    }
    return { sessionExercise, muscleGroup: exercise.muscleGroup };
  });

  const draft = buildNextSession({
    trigger,
    base,
    weekNumber,
    lengthWeeks: mesocycle.lengthWeeks,
    prescriptions: prescribeNextSession({
      exercises,
      logs: await repos.setLogRepo.listBySessionId(base.id),
      weekNumber,
      lengthWeeks: mesocycle.lengthWeeks,
      settings: mesocycle.progressionSettings,
    }),
  });
  await repos.sessionRepo.create(draft.session);
  await repos.sessionExerciseRepo.createMany(draft.sessionExercises);
  return draft.session;
}
