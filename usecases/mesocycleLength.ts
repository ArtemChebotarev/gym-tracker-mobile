// Changing a running block's length — GT-240 (08.7, "Лист «Обзор мезоцикла»"; 03 · Progression
// Engine, rule 4, "Смена длины запущенного цикла"). Orchestration only: the rules — the bounds, the
// new RIR curve, what an untouched session becomes — are in `domain/mesocycleLength.ts`.
//
// Runs through the closing store: it writes exactly what closing does — the mesocycle and the
// sessions and session exercises under it — from the same place, the workout screen.

import { NotFoundError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import type { Session } from '@domain/execution';
import {
  lastStartedWeek,
  mesocycleWithLength,
  replannedSessionExercises,
} from '@domain/mesocycleLength';
import { isDeloadWeek } from '@domain/mesocycleWeeks';
import { clampedTargetRir, weekRirOf } from '@domain/progressionRir';
import type { ExerciseRepository } from '@repositories/catalog';
import type { MesocycleClosingStore } from '@repositories/mesocycleClosing';
import { prescribeFromBase } from '@usecases/nextSessionGeneration';

export type MesocycleLengthDeps = {
  store: MesocycleClosingStore;
  /** Resolves each exercise's muscle group and type, which a re-planned deload groups sets by. */
  exerciseRepo: ExerciseRepository;
};

/**
 * Sets active mesocycle `id` to `lengthWeeks` weeks and resolves to it. In one transaction: the
 * block gets its new length, and every already generated session of a week after the last started
 * one (and after week 1, which keeps what Start planned) is planned again, week by week, as generation would plan it now — its `targetRir` (the new
 * length's table within one step of the week before, `clampedTargetRir`), and, when its week became
 * the deload or stopped being it, `isDeload` and its targets from its source session.
 *
 * Rejects with `NotFoundError` if `id` doesn't exist, and with `ConflictError` if it isn't active
 * or `lengthWeeks` is outside what the block allows now (`mesocycleLengthBounds`). Nothing is
 * written then.
 */
export async function changeMesocycleLength(
  id: string,
  lengthWeeks: number,
  deps: MesocycleLengthDeps,
): Promise<Mesocycle> {
  return deps.store.transaction(async (repos) => {
    const mesocycle = await repos.mesocycleRepo.getById(id);
    if (!mesocycle) {
      throw new NotFoundError(`Mesocycle "${id}" does not exist.`);
    }
    const sessions = await repos.sessionRepo.listByMesoId(id);
    const changed = mesocycleWithLength(mesocycle, sessions, lengthWeeks);
    const startedWeek = lastStartedWeek(sessions);

    // Week order, so a re-planned week is what the one after it steps from.
    const weekRir = new Map<string, number | undefined>();
    const rirOf = async (session: Session | undefined) => {
      if (session === undefined) {
        return undefined;
      }
      if (!weekRir.has(session.id)) {
        weekRir.set(
          session.id,
          weekRirOf(await repos.sessionExerciseRepo.listBySessionId(session.id)),
        );
      }
      return weekRir.get(session.id);
    };
    const replanned = sessions
      // Week 1 is never re-planned, started or not: it was planned at Start for its RIR — and
      // Flow C priced its reps and weights for it.
      .filter(
        (session) => session.status === 'planned' && session.weekNumber > Math.max(1, startedWeek),
      )
      .sort((a, b) => a.weekNumber - b.weekNumber);

    for (const session of replanned) {
      const isDeload = isDeloadWeek(lengthWeeks, session.weekNumber);
      const weekBefore = sessions.find(
        (candidate) =>
          candidate.weekNumber === session.weekNumber - 1 &&
          candidate.dayNumber === session.dayNumber,
      );
      const previousRir = await rirOf(weekBefore);
      const targetRir = isDeload
        ? changed.progressionSettings.deloadRir
        : clampedTargetRir(lengthWeeks, session.weekNumber, previousRir);
      const exercises = await repos.sessionExerciseRepo.listBySessionId(session.id);
      const roleChanged = isDeload !== session.isDeload;
      const prescriptions =
        roleChanged && session.sourceSessionId !== undefined && exercises.length > 0
          ? await prescribeFromBase(
              { id: session.sourceSessionId },
              changed,
              session.weekNumber,
              repos,
              deps,
              { previousRir },
            )
          : undefined;
      await repos.sessionExerciseRepo.updateMany(
        replannedSessionExercises(exercises, {
          targetRir,
          isDeload,
          ...(prescriptions === undefined ? {} : { prescriptions }),
        }),
      );
      weekRir.set(session.id, targetRir);
      if (roleChanged) {
        await repos.sessionRepo.update({ ...session, isDeload });
      }
    }
    return repos.mesocycleRepo.update(changed);
  });
}
