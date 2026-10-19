// Session start use case — task 044 (05 · Workout Execution & Logging, "Жизненный цикл сессии").
// There's no Start button on a session: logging its first set starts it. The set-logging scenario
// (045) calls this inside its own transaction, before writing the set log, and writes nothing
// when the answer is a conflict. Orchestration only — the lifecycle rule itself is
// `decideSessionStart` in `domain/sessionLifecycle.ts`.

import { NotFoundError } from '@domain/errors';
import type { Session } from '@domain/execution';
import { decideSessionStart, type SessionStartDecision } from '@domain/sessionLifecycle';
import { nowAsUtcIso } from '@domain/time';
import type { WorkoutRepositories } from '@repositories/workout';

/**
 * Starts session `sessionId` on its first logged set: a `planned` session moves to `in_progress`
 * with `startedAt = now` and is saved; one already `in_progress` is left untouched. If another
 * session is `in_progress`, nothing is written and the result names that session.
 *
 * Rejects with `NotFoundError` if the session doesn't exist, and with `ConflictError` if it's
 * final (`completed` / `skipped`) or still `awaiting_source`.
 */
export async function startSessionOnFirstSet(
  sessionId: string,
  repos: Pick<WorkoutRepositories, 'sessionRepo'>,
  now: string = nowAsUtcIso(),
): Promise<SessionStartDecision> {
  const session = await repos.sessionRepo.getById(sessionId);
  if (!session) {
    throw new NotFoundError(`Session "${sessionId}" does not exist.`);
  }
  const decision = decideSessionStart(session, await repos.sessionRepo.getCurrentInProgress(), now);
  if (decision.kind === 'started') {
    await repos.sessionRepo.update(decision.session);
  }
  return decision;
}

/**
 * Another session is `in_progress`, so nothing was logged — the screen names it (`Finish Week W
 * Day D first`) and offers to open it.
 */
export type InProgressConflict = {
  kind: 'conflict';
  inProgressSessionId: string;
  weekNumber: number;
  dayNumber: number;
};

/**
 * The first step of logging a row — a set or a round: starts session `sessionId` on its first log
 * (`startSessionOnFirstSet`) and hands back the session to log into, or the conflict with the one
 * already `in_progress`, with its week and day for the alert.
 */
export async function startSessionForLog(
  sessionId: string,
  repos: Pick<WorkoutRepositories, 'sessionRepo'>,
  now: string,
): Promise<{ kind: 'open'; session: Session } | InProgressConflict> {
  const start = await startSessionOnFirstSet(sessionId, repos, now);
  if (start.kind !== 'conflict') {
    return { kind: 'open', session: start.session };
  }
  const inProgress = await repos.sessionRepo.getById(start.inProgressSessionId);
  if (!inProgress) {
    throw new NotFoundError(`Session "${start.inProgressSessionId}" does not exist.`);
  }
  return {
    kind: 'conflict',
    inProgressSessionId: inProgress.id,
    weekNumber: inProgress.weekNumber,
    dayNumber: inProgress.dayNumber,
  };
}
