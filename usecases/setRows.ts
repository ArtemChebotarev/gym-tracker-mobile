// Add set / Remove last set — task 046 (05 · Workout Execution & Logging, "Добавить подход",
// "Удалить последний подход"). The fact may differ from the plan both ways. Adding a set changes
// only this session's plan; removing one also lowers the set count of later weeks, since they
// copy the row count at Finish (03, rule 1). An interval's rounds are set rows too, and Add round /
// Remove last round (GT-91; 10.1, "Меню ⋯ — как у силовых") follow the same rules. Orchestration
// only — the row edits live in `domain/sessionExerciseSets.ts`, the status rule in
// `domain/sessionExerciseStatus.ts`.

import type { SessionExercise } from '@domain/execution';
import {
  withAddedRound,
  withAddedSet,
  withoutLastRound,
  withoutLastSet,
} from '@domain/sessionExerciseSets';
import {
  isNotDone,
  roundRowLogs,
  type RowLog,
  statusFromLogs,
} from '@domain/sessionExerciseStatus';
import type { WorkoutRepositories, WorkoutStore } from '@repositories/workout';
import { openSessionExercise, type SessionExerciseRef } from '@usecases/openSession';

/**
 * Saves `sessionExercise` with the status its rows and logs now call for. A skipped exercise stays
 * skipped — changing its row count only shapes later weeks' volume, it doesn't unskip it. The same
 * holds for an abandoned one (136), though no open session ever has it.
 */
async function saveWithStatus(
  sessionExercise: SessionExercise,
  logs: readonly RowLog[],
  repos: WorkoutRepositories,
): Promise<SessionExercise> {
  const status = isNotDone(sessionExercise.status)
    ? sessionExercise.status
    : statusFromLogs(sessionExercise, logs);
  return repos.sessionExerciseRepo.update({ ...sessionExercise, status });
}

/**
 * Appends a set row to the exercise `ref` points at, copying the last row's `suggestedWeight`
 * only — no `targetReps`, the row has no history to aim at. A `completed` exercise goes back to
 * `planned` — the new row isn't logged.
 *
 * Rejects with `NotFoundError` / `ConflictError` as `openSessionExercise` does (missing, or the
 * session is final or `awaiting_source`).
 */
export async function addSet(
  ref: SessionExerciseRef,
  store: WorkoutStore,
): Promise<SessionExercise> {
  return store.transaction(async (repos) => {
    const { sessionExercise } = await openSessionExercise(ref, repos);
    const logs = await repos.setLogRepo.listBySessionExerciseId(sessionExercise.id);
    return saveWithStatus(
      { ...sessionExercise, setTargets: withAddedSet(sessionExercise.setTargets) },
      logs,
      repos,
    );
  });
}

/**
 * Removes the last set row of the exercise `ref` points at, along with its set log if it was
 * logged. If every remaining row is logged, the exercise becomes `completed`.
 *
 * Rejects with `ConflictError` when the exercise has a single row, and as `openSessionExercise`
 * does otherwise.
 */
export async function removeLastSet(
  ref: SessionExerciseRef,
  store: WorkoutStore,
): Promise<SessionExercise> {
  return store.transaction(async (repos) => {
    const { sessionExercise } = await openSessionExercise(ref, repos);
    const { setTargets, removed } = withoutLastSet(sessionExercise.setTargets);

    const logs = await repos.setLogRepo.listBySessionExerciseId(sessionExercise.id);
    const removedLog = logs.find((log) => log.setNumber === removed.setNumber);
    if (removedLog) {
      await repos.setLogRepo.deleteById(removedLog.id);
    }
    return saveWithStatus(
      { ...sessionExercise, setTargets },
      logs.filter((log) => log !== removedLog),
      repos,
    );
  });
}

/**
 * Appends a round to the interval exercise `ref` points at, with the last round's work and rest —
 * the ones it was logged with, if it is (`withAddedRound`). A `completed` exercise goes back to
 * `planned` — the new round isn't logged. A time picked on the card is stored already
 * (`setRoundTime`, GT-187), so the last round's plan carries it.
 *
 * Rejects as `openSessionExercise` does.
 */
export async function addRound(
  ref: SessionExerciseRef,
  store: WorkoutStore,
): Promise<SessionExercise> {
  return store.transaction(async (repos) => {
    const { sessionExercise } = await openSessionExercise(ref, repos);
    const logs = await repos.roundLogRepo.listBySessionExerciseId(sessionExercise.id);
    const last = sessionExercise.setTargets.at(-1);
    const lastLog = logs.find((log) => log.roundNumber === last?.setNumber);
    return saveWithStatus(
      { ...sessionExercise, setTargets: withAddedRound(sessionExercise.setTargets, lastLog) },
      roundRowLogs(logs),
      repos,
    );
  });
}

/**
 * Removes the last round of the interval exercise `ref` points at, along with its round log if it
 * was logged. If every remaining round is logged, the exercise becomes `completed`.
 *
 * Rejects with `ConflictError` when the exercise has a single round, and as `openSessionExercise`
 * does otherwise.
 */
export async function removeLastRound(
  ref: SessionExerciseRef,
  store: WorkoutStore,
): Promise<SessionExercise> {
  return store.transaction(async (repos) => {
    const { sessionExercise } = await openSessionExercise(ref, repos);
    const { setTargets, removed } = withoutLastRound(sessionExercise.setTargets);

    const logs = await repos.roundLogRepo.listBySessionExerciseId(sessionExercise.id);
    const removedLog = logs.find((log) => log.roundNumber === removed.setNumber);
    if (removedLog) {
      await repos.roundLogRepo.deleteById(removedLog.id);
    }
    return saveWithStatus(
      { ...sessionExercise, setTargets },
      roundRowLogs(logs.filter((log) => log !== removedLog)),
      repos,
    );
  });
}
