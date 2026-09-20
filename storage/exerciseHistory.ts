import type { Session, SessionExercise, SetLog } from '@domain/execution';
import type { ExercisePerformance } from '@domain/exerciseOverview';
import type { ExerciseHistoryRepository } from '@repositories/exerciseHistory';

import {
  SESSION_COLLECTION,
  SESSION_EXERCISE_COLLECTION,
  SET_LOG_COLLECTION,
} from './collectionNames';
import type { InMemoryStore } from './store';

// The in-memory stand-in for a backend's JOIN (07 · Persistence Layer Contract, rule 4), the same
// shape InMemorySessionTreeRepository takes: read the exercise's own set logs, group them by the
// session exercise they belong to, and resolve each group's Session by id.
//
// The scan over every set log is the sanctioned stand-in for the first months (07, "Критичные по
// производительности запросы" — a real adapter keeps an `exerciseId -> set log ids` index), the
// same note InMemorySetLogRepository.listByExerciseId carries.
export class InMemoryExerciseHistoryRepository implements ExerciseHistoryRepository {
  constructor(private readonly store: InMemoryStore) {}

  async listByExerciseId(exerciseId: string): Promise<ExercisePerformance[]> {
    const setLogs = await this.store
      .collection<SetLog>(SET_LOG_COLLECTION)
      .find((log) => log.exerciseId === exerciseId);
    if (setLogs.length === 0) {
      return [];
    }

    const logsBySessionExerciseId = new Map<string, SetLog[]>();
    for (const log of setLogs) {
      const group = logsBySessionExerciseId.get(log.sessionExerciseId) ?? [];
      group.push(log);
      logsBySessionExerciseId.set(log.sessionExerciseId, group);
    }

    const sessionExercises = await this.store
      .collection<SessionExercise>(SESSION_EXERCISE_COLLECTION)
      .listByIds([...logsBySessionExerciseId.keys()]);
    const sessions = await this.store
      .collection<Session>(SESSION_COLLECTION)
      .listByIds([...new Set(sessionExercises.map((exercise) => exercise.sessionId))]);
    const sessionsById = new Map(sessions.map((session) => [session.id, session]));

    const performances: ExercisePerformance[] = [];
    for (const sessionExercise of sessionExercises) {
      const session = sessionsById.get(sessionExercise.sessionId);
      const logs = logsBySessionExerciseId.get(sessionExercise.id);
      if (!session || !logs) {
        continue;
      }
      performances.push({
        session,
        setLogs: [...logs].sort((a, b) => a.setNumber - b.setNumber),
      });
    }
    return performances;
  }
}
