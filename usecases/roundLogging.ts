// Round logging use cases — GT-89 (10.1 FR-7, "запасной путь"): an interval's round logged by hand
// when the timer wasn't run — one tap on its Log box takes the Work and Rest fields — and un-logged
// by a second tap. The same rules as a set (05, "Записать подход", "Снять отметку", "Статус
// упражнения"): one transaction each, the first log starts the session, the exercise is
// `completed` once every round is logged. The timer logs rounds by itself later (its own story).

import { ConflictError, NotFoundError } from '@domain/errors';
import type { RoundLog, Session, SessionExercise } from '@domain/execution';
import { type RoundEntry, validateRoundEntry } from '@domain/executionValidators';
import { generateId } from '@domain/id';
import { roundRowLogs, statusFromLogs } from '@domain/sessionExerciseStatus';
import { nowAsUtcIso } from '@domain/time';
import type { Unsaved } from '@domain/timestamps';
import type { WorkoutRepositories, WorkoutStore } from '@repositories/workout';
import { openSessionExercise, type SessionExerciseRef } from '@usecases/openSession';
import { type InProgressConflict, startSessionForLog } from '@usecases/sessionStart';

/** One round row of an interval exercise in a session. */
export type RoundRowRef = SessionExerciseRef & { roundNumber: number };

export type LogRoundResult =
  | { kind: 'logged'; roundLog: RoundLog; sessionExercise: SessionExercise; session: Session }
  | InProgressConflict;

export type UnlogRoundResult = { sessionExercise: SessionExercise };

type OpenRoundRow = {
  sessionExercise: SessionExercise;
  logs: RoundLog[];
  loggedRound: RoundLog | undefined;
};

/**
 * Reads the round `ref` points at and checks it can be changed, as a set row is: the session is
 * open, the exercise belongs to it and isn't skipped, and the round exists — a round is planned as
 * a `SetTarget` numbered by the round.
 */
async function openRoundRow(ref: RoundRowRef, repos: WorkoutRepositories): Promise<OpenRoundRow> {
  const { sessionExercise } = await openSessionExercise(ref, repos);
  if (sessionExercise.status === 'skipped') {
    throw new ConflictError(
      `Session exercise "${sessionExercise.id}" is skipped; unskip it before changing its rounds.`,
    );
  }
  if (!sessionExercise.setTargets.some((target) => target.setNumber === ref.roundNumber)) {
    throw new NotFoundError(
      `Session exercise "${sessionExercise.id}" has no round ${ref.roundNumber}.`,
    );
  }
  const logs = await repos.roundLogRepo.listBySessionExerciseId(sessionExercise.id);
  const loggedRound = logs.find((log) => log.roundNumber === ref.roundNumber);
  return { sessionExercise, logs, loggedRound };
}

/** Saves `sessionExercise` with the status its rounds call for, if that changed it. */
async function syncStatus(
  sessionExercise: SessionExercise,
  logs: readonly RoundLog[],
  repos: WorkoutRepositories,
): Promise<SessionExercise> {
  const status = statusFromLogs(sessionExercise, roundRowLogs(logs));
  if (status === sessionExercise.status) {
    return sessionExercise;
  }
  return repos.sessionExerciseRepo.update({ ...sessionExercise, status });
}

/**
 * Logs round `ref` by hand with the times in its fields: a done round (`completed`), its rest not
 * skipped, `completedAt = now`. Logging the last open round marks the exercise `completed`, and the
 * first log of a `planned` session starts it.
 *
 * If another session is `in_progress`, nothing is written and the result names it. Throws — also
 * writing nothing — if a time is invalid, the round is already logged (un-log it first), or
 * `openRoundRow`'s checks fail.
 */
export async function logRound(
  ref: RoundRowRef,
  entry: RoundEntry,
  store: WorkoutStore,
  now: string = nowAsUtcIso(),
): Promise<LogRoundResult> {
  validateRoundEntry(entry);
  return store.transaction(async (repos) => {
    const { sessionExercise, logs, loggedRound } = await openRoundRow(ref, repos);
    if (loggedRound) {
      throw new ConflictError(
        `Round ${ref.roundNumber} of session exercise "${sessionExercise.id}" is already logged.`,
      );
    }

    const start = await startSessionForLog(ref.sessionId, repos, now);
    if (start.kind === 'conflict') {
      return start;
    }

    const draft: Unsaved<RoundLog> = {
      id: generateId(),
      sessionExerciseId: sessionExercise.id,
      exerciseId: sessionExercise.exerciseId,
      roundNumber: ref.roundNumber,
      workSec: entry.workSec,
      restSkipped: false,
      completed: true,
      completedAt: now,
    };
    if (entry.restSec !== undefined) {
      draft.restSec = entry.restSec;
    }
    const roundLog = await repos.roundLogRepo.create(draft);
    return {
      kind: 'logged',
      roundLog,
      sessionExercise: await syncStatus(sessionExercise, [...logs, roundLog], repos),
      session: start.session,
    };
  });
}

/**
 * Un-logs round `ref` — a second tap on its filled Log box: its `RoundLog` is deleted and the
 * round is open again. An exercise that was `completed` goes back to `planned`; the session stays
 * `in_progress`.
 *
 * Throws `NotFoundError` if the round isn't logged, and whatever `openRoundRow`'s checks throw.
 */
export async function unlogRound(ref: RoundRowRef, store: WorkoutStore): Promise<UnlogRoundResult> {
  return store.transaction(async (repos) => {
    const { sessionExercise, logs, loggedRound } = await openRoundRow(ref, repos);
    if (!loggedRound) {
      throw new NotFoundError(
        `Round ${ref.roundNumber} of session exercise "${sessionExercise.id}" is not logged.`,
      );
    }

    await repos.roundLogRepo.deleteById(loggedRound.id);
    const remaining = logs.filter((log) => log.id !== loggedRound.id);
    return { sessionExercise: await syncStatus(sessionExercise, remaining, repos) };
  });
}
