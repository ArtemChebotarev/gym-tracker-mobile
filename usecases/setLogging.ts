// Set logging use cases — task 045 (05 · Workout Execution & Logging, "Записать подход", "Снять
// отметку", "Статус упражнения"). Every call is one transaction that lands in storage right away:
// the app can be killed at any moment and must reopen the session exactly as it was (05,
// "Сохранение данных"). Orchestration only — the rules live in `domain/sessionLifecycle.ts`,
// `domain/sessionExerciseStatus.ts` and `domain/executionValidators.ts`.

import { ConflictError, NotFoundError } from '@domain/errors';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { type SetEntry, validateSetEntry } from '@domain/executionValidators';
import { generateId } from '@domain/id';
import { statusFromLogs } from '@domain/sessionExerciseStatus';
import { nowAsUtcIso } from '@domain/time';
import type { WorkoutRepositories, WorkoutStore } from '@repositories/workout';
import { openSessionExercise, type SessionExerciseRef } from '@usecases/openSession';
import { startSessionOnFirstSet } from '@usecases/sessionStart';

/** One set row of an exercise in a session. */
export type SetRowRef = SessionExerciseRef & { setNumber: number };

export type LogSetResult =
  | { kind: 'logged'; setLog: SetLog; sessionExercise: SessionExercise; session: Session }
  /** Another session is `in_progress` — nothing was written; the screen offers to open it. */
  | { kind: 'conflict'; inProgressSessionId: string };

export type UnlogSetResult = { sessionExercise: SessionExercise };

type OpenSetRow = {
  sessionExercise: SessionExercise;
  logs: SetLog[];
  loggedSet: SetLog | undefined;
};

/**
 * Reads the row `ref` points at and checks it can be changed: the session exists and isn't final
 * or `awaiting_source`, the exercise belongs to it and isn't skipped (its rows are read-only until
 * Unskip, 05 "Пропустить упражнение"), and the row exists.
 */
async function openSetRow(ref: SetRowRef, repos: WorkoutRepositories): Promise<OpenSetRow> {
  const { sessionExercise } = await openSessionExercise(ref, repos);
  if (sessionExercise.status === 'skipped') {
    throw new ConflictError(
      `Session exercise "${sessionExercise.id}" is skipped; unskip it before changing its sets.`,
    );
  }
  if (!sessionExercise.setTargets.some((target) => target.setNumber === ref.setNumber)) {
    throw new NotFoundError(
      `Session exercise "${sessionExercise.id}" has no set ${ref.setNumber}.`,
    );
  }

  const logs = await repos.setLogRepo.listBySessionExerciseId(sessionExercise.id);
  const loggedSet = logs.find((log) => log.setNumber === ref.setNumber);
  return { sessionExercise, logs, loggedSet };
}

/** Saves `sessionExercise` with the status its logs call for, if that changed it. */
async function syncStatus(
  sessionExercise: SessionExercise,
  logs: readonly SetLog[],
  repos: WorkoutRepositories,
): Promise<SessionExercise> {
  const status = statusFromLogs(sessionExercise, logs);
  if (status === sessionExercise.status) {
    return sessionExercise;
  }
  return repos.sessionExerciseRepo.update({ ...sessionExercise, status });
}

/**
 * Logs set row `ref` with the entered weight and reps: a `SetLog` for the exercise the row
 * currently belongs to, `completedAt = now`. No actual RIR is recorded. Logging the last open row
 * marks the exercise `completed`, and the first set of a `planned` session starts it (044).
 *
 * If another session is `in_progress`, nothing is written and the result names it. Throws — also
 * writing nothing — if weight or reps is missing or invalid, the row is already logged (un-log it
 * first: that's the only way to correct a set), or `openSetRow`'s checks fail.
 */
export async function logSet(
  ref: SetRowRef,
  entry: SetEntry,
  store: WorkoutStore,
  now: string = nowAsUtcIso(),
): Promise<LogSetResult> {
  validateSetEntry(entry);
  return store.transaction(async (repos) => {
    const { sessionExercise, logs, loggedSet } = await openSetRow(ref, repos);
    if (loggedSet) {
      throw new ConflictError(
        `Set ${ref.setNumber} of session exercise "${sessionExercise.id}" is already logged.`,
      );
    }

    const start = await startSessionOnFirstSet(ref.sessionId, repos, now);
    if (start.kind === 'conflict') {
      return start;
    }

    const setLog = await repos.setLogRepo.create({
      id: generateId(),
      sessionExerciseId: sessionExercise.id,
      exerciseId: sessionExercise.exerciseId,
      setNumber: ref.setNumber,
      weight: entry.weight,
      reps: entry.reps,
      completedAt: now,
    });
    return {
      kind: 'logged',
      setLog,
      sessionExercise: await syncStatus(sessionExercise, [...logs, setLog], repos),
      session: start.session,
    };
  });
}

/**
 * Un-logs set row `ref` — a second tap on a logged set: its `SetLog` is deleted and the row is
 * editable again. An exercise that was `completed` goes back to `planned`. The session stays
 * `in_progress` even if no logs are left.
 *
 * Throws `NotFoundError` if the row isn't logged, and whatever `openSetRow`'s checks throw.
 */
export async function unlogSet(ref: SetRowRef, store: WorkoutStore): Promise<UnlogSetResult> {
  return store.transaction(async (repos) => {
    const { sessionExercise, logs, loggedSet } = await openSetRow(ref, repos);
    if (!loggedSet) {
      throw new NotFoundError(
        `Set ${ref.setNumber} of session exercise "${sessionExercise.id}" is not logged.`,
      );
    }

    await repos.setLogRepo.deleteById(loggedSet.id);
    const remaining = logs.filter((log) => log.id !== loggedSet.id);
    return { sessionExercise: await syncStatus(sessionExercise, remaining, repos) };
  });
}
