// Closing a mesocycle — task 052 (04 · Meso Creation Flows, "Завершение мезоцикла"; 05 · Workout
// Execution & Logging, "Остановить мезоцикл"). Two ways out of an active block, and no third: it
// never closes itself (see domain/mesocycleLifecycle.ts).
//
// - `finishMesocycle` — the block is done. Offered only once every session of it is final, so
//   there is nothing left to close along with it: status and `completedAt`, and that's all.
// - `stopMesocycle` — the block is called off mid-way. It ends every session that still had
//   training left in it, in the same transaction, and generates nothing: the next week would be
//   planned from a block that no longer exists.
//
// Orchestration only, per usecases/README.md — the rules are in `domain/mesocycleLifecycle.ts` and
// `domain/sessionLifecycle.ts`.

import { ConflictError, NotFoundError } from '@domain/errors';
import type { Session } from '@domain/execution';
import type { Mesocycle } from '@domain/mesocycle';
import {
  assertMesocycleActive,
  canFinishMesocycle,
  closedMesocycle,
  unfinishedSessions,
} from '@domain/mesocycleLifecycle';
import { closedSession } from '@domain/sessionLifecycle';
import { nowAsUtcIso } from '@domain/time';
import type {
  MesocycleClosingRepositories,
  MesocycleClosingStore,
} from '@repositories/mesocycleClosing';

export type MesocycleClosingDeps = {
  store: MesocycleClosingStore;
};

async function activeMesocycle(
  id: string,
  repos: MesocycleClosingRepositories,
): Promise<Mesocycle> {
  const mesocycle = await repos.mesocycleRepo.getById(id);
  if (!mesocycle) {
    throw new NotFoundError(`Mesocycle "${id}" does not exist.`);
  }
  assertMesocycleActive(mesocycle);
  return mesocycle;
}

/**
 * Finishes mesocycle `id`: `completed` with `completedAt = now`. Nothing else is written — every
 * session is already final, which is the condition for offering Finish at all.
 *
 * Rejects with `NotFoundError` if `id` doesn't exist, and with `ConflictError` if it isn't
 * `active` or still has a session to train — that block is left through Stop, which says what it
 * throws away. Nothing is written then.
 */
export async function finishMesocycle(
  id: string,
  deps: MesocycleClosingDeps,
  now: string = nowAsUtcIso(),
): Promise<Mesocycle> {
  return deps.store.transaction(async (repos) => {
    const mesocycle = await activeMesocycle(id, repos);
    const sessions = await repos.sessionRepo.listByMesoId(id);
    if (!canFinishMesocycle(mesocycle, sessions)) {
      throw new ConflictError(
        `Mesocycle "${id}" has ${unfinishedSessions(mesocycle, sessions).length} unfinished session(s); stop it instead.`,
      );
    }
    return repos.mesocycleRepo.update(closedMesocycle(mesocycle, 'completed', now));
  });
}

export type MesocycleStopResult = {
  mesocycle: Mesocycle;
  /** The sessions Stop ended, in the state it left them. Empty when there was nothing left. */
  closedSessions: Session[];
};

/**
 * Stops mesocycle `id`, in one transaction (05, "Остановить мезоцикл"): the block becomes
 * `abandoned` with `completedAt = now`, and each of its sessions that wasn't final ends the way
 * Skip workout ends one — every `planned` exercise becomes `skipped`, and the session itself
 * becomes `completed` with `completedAt = now` if it has a logged set and `skipped` otherwise.
 * Every set log is kept: what was trained stays trained (05, "История неизменяема").
 *
 * Next week's sessions are deliberately not generated — there is no next week in a block that has
 * been called off.
 *
 * Rejects with `NotFoundError` if `id` doesn't exist and with `ConflictError` if it isn't
 * `active`; nothing is written then.
 */
export async function stopMesocycle(
  id: string,
  deps: MesocycleClosingDeps,
  now: string = nowAsUtcIso(),
): Promise<MesocycleStopResult> {
  return deps.store.transaction(async (repos) => {
    const mesocycle = await activeMesocycle(id, repos);
    const sessions = await repos.sessionRepo.listByMesoId(id);

    const closed: Session[] = [];
    for (const session of unfinishedSessions(mesocycle, sessions)) {
      const exercises = await repos.sessionExerciseRepo.listBySessionId(session.id);
      for (const exercise of exercises) {
        if (exercise.status === 'planned') {
          await repos.sessionExerciseRepo.update({ ...exercise, status: 'skipped' });
        }
      }
      const logs = await repos.setLogRepo.listBySessionId(session.id);
      closed.push(await repos.sessionRepo.update(closedSession(session, logs.length > 0, now)));
    }

    return {
      mesocycle: await repos.mesocycleRepo.update(closedMesocycle(mesocycle, 'abandoned', now)),
      closedSessions: closed,
    };
  });
}
