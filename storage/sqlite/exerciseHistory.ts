import type { RoundLog, Session, SetLog } from '@domain/execution';
import type { ExerciseHistoryPerformance } from '@domain/exerciseHistory';
import type { ExerciseHistoryRepository } from '@repositories/exerciseHistory';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';

import type { SqliteDatabase } from './db';
import { runQuery } from './errors';
import { rowToMesocycle, rowToRoundLog, rowToSession, rowToSetLog } from './mappers';
import { mesocycles, roundLogs, sessionExercises, sessions, setLogs } from './schema';

/**
 * One performance as the database returns it: the set logs and rounds of a single session
 * exercise, and the session they belong to.
 *
 * A strength or power exercise has set logs and no rounds, an interval or mobility one the
 * reverse; the performance is one of them either way.
 *
 * `session` is not optional: the join is an inner one over enforced foreign keys, so a set log
 * whose session exercise no longer resolves is not a state the database can be in, and the type
 * says so. A medium without foreign keys would have to answer `Session | undefined` here, which
 * is why the repository contract (task 109) states nothing about an unresolvable reference.
 */
export type StoredExercisePerformance = {
  sessionExerciseId: string;
  session: Session;
  /**
   * The RIR this performance was planned at (`SessionExercise.targetRir`). Already on the middle
   * table of the join, so reading it costs nothing; Flow C's start targets need it (task 122) and
   * a `SetLog` carries no RIR of its own.
   */
  targetRir: number;
  /** Sorted by `setNumber`. */
  setLogs: SetLog[];
  /** Sorted by `roundNumber`. */
  roundLogs: RoundLog[];
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
      .select({ setLog: setLogs, session: sessions, targetRir: sessionExercises.targetRir })
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

  // The rounds of the same exercise, through the same two hops. An exercise logs sets or rounds
  // (10 · Hybrid Exercises), so the two result sets rarely share a session exercise, but a
  // performance is keyed by it either way and nothing here assumes they don't.
  const roundRows = await runQuery(() =>
    db
      .select({ roundLog: roundLogs, session: sessions, targetRir: sessionExercises.targetRir })
      .from(roundLogs)
      .innerJoin(sessionExercises, eq(roundLogs.sessionExerciseId, sessionExercises.id))
      .innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
      .where(
        excluded === undefined
          ? eq(roundLogs.exerciseId, exerciseId)
          : and(eq(roundLogs.exerciseId, exerciseId), ne(roundLogs.sessionExerciseId, excluded)),
      )
      .orderBy(asc(roundLogs.sessionExerciseId), asc(roundLogs.roundNumber))
      .all(),
  );

  const performances = new Map<string, StoredExercisePerformance>();
  const performanceOf = (
    sessionExerciseId: string,
    session: typeof sessions.$inferSelect,
    targetRir: number,
  ): StoredExercisePerformance => {
    const existing = performances.get(sessionExerciseId) ?? {
      sessionExerciseId,
      session: rowToSession(session),
      targetRir,
      setLogs: [],
      roundLogs: [],
    };
    performances.set(sessionExerciseId, existing);
    return existing;
  };
  for (const { setLog, session, targetRir } of rows) {
    performanceOf(setLog.sessionExerciseId, session, targetRir).setLogs.push(rowToSetLog(setLog));
  }
  for (const { roundLog, session, targetRir } of roundRows) {
    performanceOf(roundLog.sessionExerciseId, session, targetRir).roundLogs.push(
      rowToRoundLog(roundLog),
    );
  }
  return [...performances.values()];
}

/** When a performance happened: the last set or round of it that was logged. */
export function performedAt(performance: StoredExercisePerformance): string {
  const completions = [
    ...performance.setLogs.map((setLog) => setLog.completedAt),
    ...performance.roundLogs.map((roundLog) => roundLog.completedAt),
  ];
  return completions.reduce((latest, at) => (at > latest ? at : latest), '');
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
      // A performance made of rounds has no sets to show or to aggregate; the History tab reads
      // them when it gets its interval rows (10.1, FR-12).
      if (logs.length === 0) {
        return [];
      }
      const mesocycle = byId.get(session.mesoId);
      return mesocycle ? [{ session, mesocycle, setLogs: logs }] : [];
    });
  }
}
