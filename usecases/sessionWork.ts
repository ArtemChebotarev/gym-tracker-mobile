// Whether anything was trained in a session — the line between `completed` and `skipped` /
// `abandoned` when it is closed (`closedSession`). Work is a logged set of a strength or power
// exercise, or a logged round of an interval or mobility one (10 · Hybrid Exercises): a day of
// only intervals is as trained as a day of sets. Called inside the caller's transaction.

import type { WorkoutRepositories } from '@repositories/workout';

/** True when session `sessionId` has at least one logged set or round. */
export async function hasLoggedWork(
  sessionId: string,
  repos: Pick<WorkoutRepositories, 'setLogRepo' | 'roundLogRepo'>,
): Promise<boolean> {
  const [sets, rounds] = await Promise.all([
    repos.setLogRepo.listBySessionId(sessionId),
    repos.roundLogRepo.listBySessionId(sessionId),
  ]);
  return sets.length > 0 || rounds.length > 0;
}
