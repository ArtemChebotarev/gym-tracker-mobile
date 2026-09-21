import type { Session, SetLog } from '@domain/execution';
import type { ExerciseHistoryPerformance } from '@domain/exerciseHistory';
import type { ExerciseHistoryRepository } from '@repositories/exerciseHistory';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';

import type { SqliteDatabase } from './db';
import { runQuery } from './errors';
import { rowToMesocycle, rowToSession, rowToSetLog } from './mappers';
import { mesocycles, sessionExercises, sessions, setLogs } from './schema';

/**
 * One performance as the database returns it: the set logs of a single session exercise, and the
 * session they belong to.
 *
 * `session` is not optional: the join is an inner one over enforced foreign keys, so a set log
 * whose session exercise no longer resolves is not a state the database can be in, and the type
 * says so. A medium without foreign keys would have to answer `Session | undefined` here, which
 * is why the repository contract (task 109) states nothing about an unresolvable reference.
 */
export type StoredExercisePerformance = {
  sessionExerciseId: string;
  session: Session;
  /** Sorted by `setNumber`. */
  setLogs: SetLog[];
};

/**
 * Every performance of `exerciseId`, newest first — the SetLog → SessionExercise → Session join
 * of rule 4 (07 · Persistence Layer Contract), done in SQL.
 *
 * `SetLog` carries only `sessionExerciseId` (02 · Domain Model), so "which session was this?" is
 * a two-hop join. Both the exercise's history (08.6, 06) and the progression engine's reference
 * lookup (03, rule 6) start from exactly that, so it lives here once and they narrow it
 * differently.
 */
export async function readExercisePerformances(
  db: SqliteDatabase,
  exerciseId: string,
  options: { excludeSessionExerciseId?: string } = {},
): Promise<StoredExercisePerformance[]> {
  const excluded = options.excludeSessionExerciseId;
  const rows = await runQuery(() =>
    db
      .select({ setLog: setLogs, session: sessions })
      .from(setLogs)
      .innerJoin(sessionExercises, eq(setLogs.sessionExerciseId, sessionExercises.id))
      .innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
      .where(
        excluded === undefined
          ? eq(setLogs.exerciseId, exerciseId)
          : and(eq(setLogs.exerciseId, exerciseId), ne(setLogs.sessionExerciseId, excluded)),
      )
      .orderBy(asc(setLogs.sessionExerciseId), asc(setLogs.setNumber))
      .all(),
  );

  const performances = new Map<string, StoredExercisePerformance>();
  for (const { setLog, session } of rows) {
    const performance = performances.get(setLog.sessionExerciseId) ?? {
      sessionExerciseId: setLog.sessionExerciseId,
      session: rowToSession(session),
      setLogs: [],
    };
    performance.setLogs.push(rowToSetLog(setLog));
    performances.set(performance.sessionExerciseId, performance);
  }
  return [...performances.values()];
}

/** When a performance happened: the last set of it that was logged. */
export function performedAt(performance: StoredExercisePerformance): string {
  return performance.setLogs.reduce(
    (latest, setLog) => (setLog.completedAt > latest ? setLog.completedAt : latest),
    '',
  );
}

// See repositories/exerciseHistory.ts for the contract. The set-log side is
// `readExercisePerformances` above; this adds the last hop — each session's `Mesocycle`, which the
// History tab groups and names its sections by.
export class SqliteExerciseHistoryRepository implements ExerciseHistoryRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async listByExerciseId(exerciseId: string): Promise<ExerciseHistoryPerformance[]> {
    const performances = await readExercisePerformances(this.db, exerciseId);
    const mesoIds = [...new Set(performances.map(({ session }) => session.mesoId))];
    if (mesoIds.length === 0) {
      return [];
    }
    const rows = await runQuery(() =>
      this.db.select().from(mesocycles).where(inArray(mesocycles.id, mesoIds)).all(),
    );
    const byId = new Map(rows.map((row) => [row.id, rowToMesocycle(row)]));

    return performances.flatMap(({ session, setLogs: logs }) => {
      const mesocycle = byId.get(session.mesoId);
      return mesocycle ? [{ session, mesocycle, setLogs: logs }] : [];
    });
  }
}
