import type { Session, SessionExercise, SetLog } from '@domain/execution';
import type { ExerciseHistoryPerformance } from '@domain/exerciseHistory';
import type { Mesocycle } from '@domain/mesocycle';
import type { ExerciseHistoryRepository } from '@repositories/exerciseHistory';

import {
  MESOCYCLE_COLLECTION,
  SESSION_COLLECTION,
  SESSION_EXERCISE_COLLECTION,
  SET_LOG_COLLECTION,
} from './collectionNames';
import type { InMemoryStore } from './store';

/**
 * One performance straight out of the store, before anyone decides what it means: the set logs of
 * a single session exercise, and the session they belong to — `undefined` when that session (or
 * the session exercise itself) can't be resolved.
 *
 * Whether an unresolved session is an omission or a hard stop differs by caller, so this shape
 * hands the fact over instead of picking for them: exercise history drops such a performance,
 * while rule 6's reference lookup treats it as "no trustworthy reference" — see the two consumers
 * below and in setLogRepository.ts.
 */
export type StoredExercisePerformance = {
  sessionExerciseId: string;
  session: Session | undefined;
  /** Sorted by `setNumber`. */
  setLogs: SetLog[];
};

/**
 * Every performance of `exerciseId`, in no particular order — the in-memory stand-in for a
 * backend's JOIN (07 · Persistence Layer Contract, rule 4).
 *
 * `SetLog` carries only `sessionExerciseId` (02 · Domain Model), so "which session was this?" is a
 * two-hop join: group the logs by session exercise, then resolve each one's `Session`. Both the
 * exercise's history (08.6, 06) and the progression engine's reference lookup (03, rule 6) start
 * from exactly that, so it lives here once and they narrow it differently.
 *
 * The scan over every set log is the sanctioned stand-in for the first months (07, "Критичные по
 * производительности запросы" — a real adapter keeps an `exerciseId -> set log ids` index).
 */
export async function readExercisePerformances(
  store: InMemoryStore,
  exerciseId: string,
  options: { excludeSessionExerciseId?: string } = {},
): Promise<StoredExercisePerformance[]> {
  const setLogs = await store
    .collection<SetLog>(SET_LOG_COLLECTION)
    .find(
      (log) =>
        log.exerciseId === exerciseId &&
        log.sessionExerciseId !== options.excludeSessionExerciseId,
    );
  if (setLogs.length === 0) {
    return [];
  }

  const logsBySessionExerciseId = new Map<string, SetLog[]>();
  for (const log of setLogs) {
    const group = logsBySessionExerciseId.get(log.sessionExerciseId) ?? [];
    group.push(log);
    logsBySessionExerciseId.set(log.sessionExerciseId, group);
  }

  const sessionExercises = await store
    .collection<SessionExercise>(SESSION_EXERCISE_COLLECTION)
    .listByIds([...logsBySessionExerciseId.keys()]);
  const sessions = await store
    .collection<Session>(SESSION_COLLECTION)
    .listByIds([...new Set(sessionExercises.map((exercise) => exercise.sessionId))]);
  const sessionIdBySessionExerciseId = new Map(
    sessionExercises.map((exercise) => [exercise.id, exercise.sessionId]),
  );
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));

  // Walks the groups, not the resolved session exercises: a set log whose SessionExercise row is
  // missing is as unresolved as one whose Session is, and has to reach the caller as such rather
  // than disappearing here.
  return [...logsBySessionExerciseId].map(([sessionExerciseId, logs]) => ({
    sessionExerciseId,
    session: sessionsById.get(sessionIdBySessionExerciseId.get(sessionExerciseId) ?? ''),
    setLogs: [...logs].sort((a, b) => a.setNumber - b.setNumber),
  }));
}

// See repositories/exerciseHistory.ts for the contract. The set-log side is
// `readExercisePerformances` above; this adds the last hop — each session's `Mesocycle`, which the
// History tab groups and names its sections by — and drops whatever it couldn't resolve: without a
// session there is no week to show, and without a mesocycle no section to show it under.
export class InMemoryExerciseHistoryRepository implements ExerciseHistoryRepository {
  constructor(private readonly store: InMemoryStore) {}

  async listByExerciseId(exerciseId: string): Promise<ExerciseHistoryPerformance[]> {
    const performances = await readExercisePerformances(this.store, exerciseId);
    const mesocycles = await this.store
      .collection<Mesocycle>(MESOCYCLE_COLLECTION)
      .listByIds([
        ...new Set(
          performances.flatMap(({ session }) => (session ? [session.mesoId] : [])),
        ),
      ]);
    const mesocyclesById = new Map(mesocycles.map((mesocycle) => [mesocycle.id, mesocycle]));

    return performances.flatMap(({ session, setLogs }) => {
      const mesocycle = session && mesocyclesById.get(session.mesoId);
      return session && mesocycle ? [{ session, mesocycle, setLogs }] : [];
    });
  }
}
