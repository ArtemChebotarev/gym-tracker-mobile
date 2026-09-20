import type { SessionTree, SessionTreeRepository } from '@repositories/sessionTree';
import { asc, eq, inArray } from 'drizzle-orm';

import { NotFoundError } from '../errors';
import type { SqliteDatabase } from './db';
import { runQuery } from './errors';
import {
  rowToExercise,
  rowToMesocycle,
  rowToSession,
  rowToSessionExercise,
  rowToSetLog,
} from './mappers';
import { exercises, mesocycles, sessionExercises, sessions, setLogs } from './schema';

// A whole session in one shape (07 · Persistence Layer Contract, rule 4): Session → Mesocycle,
// Session → SessionExercise → Exercise and SessionExercise → SetLog, joined here so the use case
// layer only maps the result.
export class SqliteSessionTreeRepository implements SessionTreeRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async getBySessionId(sessionId: string): Promise<SessionTree | null> {
    const row = await runQuery(() =>
      this.db
        .select({ session: sessions, mesocycle: mesocycles })
        .from(sessions)
        .innerJoin(mesocycles, eq(sessions.mesoId, mesocycles.id))
        .where(eq(sessions.id, sessionId))
        .get(),
    );
    if (!row) {
      // Either the session isn't there — the answer the contract asks for — or its mesocycle
      // isn't, which the foreign key makes impossible, so the two cannot be confused.
      const exists = await runQuery(() =>
        this.db.select({ id: sessions.id }).from(sessions).where(eq(sessions.id, sessionId)).get(),
      );
      if (exists) {
        throw new NotFoundError(`Mesocycle of session "${sessionId}" does not exist.`);
      }
      return null;
    }

    const planned = await runQuery(() =>
      this.db
        .select({ sessionExercise: sessionExercises, exercise: exercises })
        .from(sessionExercises)
        .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
        .where(eq(sessionExercises.sessionId, sessionId))
        .orderBy(asc(sessionExercises.order))
        .all(),
    );
    const sessionExerciseIds = planned.map(({ sessionExercise }) => sessionExercise.id);
    const logs =
      sessionExerciseIds.length === 0
        ? []
        : await runQuery(() =>
            this.db
              .select()
              .from(setLogs)
              .where(inArray(setLogs.sessionExerciseId, sessionExerciseIds))
              .orderBy(asc(setLogs.setNumber))
              .all(),
          );

    return {
      session: rowToSession(row.session),
      mesocycle: rowToMesocycle(row.mesocycle),
      exercises: planned.map(({ sessionExercise, exercise }) => ({
        sessionExercise: rowToSessionExercise(sessionExercise),
        exercise: rowToExercise(exercise),
        setLogs: logs
          .filter((log) => log.sessionExerciseId === sessionExercise.id)
          .map(rowToSetLog),
      })),
    };
  }
}
