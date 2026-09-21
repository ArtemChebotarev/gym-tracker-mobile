import { sql } from 'drizzle-orm';

import type { SqliteDatabase } from './db';
import { runQuery } from './errors';

// Rule 6 of 07 · Persistence Layer Contract, on a medium that has transactions of its own. A
// medium without them has to emulate the same guarantee — see `repositories/transaction.ts`.
//
// Drizzle's own `db.transaction()` is not usable here: on a synchronous driver it runs the
// callback synchronously and commits the moment it returns, so a callback that `await`s — which
// every repository method does, rule 1 — would have its later writes land outside the
// transaction. The statements are therefore issued by hand, which is also all Drizzle does
// underneath.
//
// Nesting goes through savepoints. `deleteWithChildren` runs its cascade in a transaction of its
// own, and calling it from inside a store's transaction must not commit the outer one early;
// SQLite has no nested BEGIN, so an inner level becomes a savepoint instead.

const openLevels = new WeakMap<SqliteDatabase, number>();

function execute(db: SqliteDatabase, statement: string): Promise<void> {
  return runQuery(() => {
    db.run(sql.raw(statement));
  });
}

/**
 * Runs `work` atomically: every write it makes through `db` is kept if it resolves, and none of
 * them are observable afterwards if it throws or rejects. `work` may be synchronous — the
 * contract allows it (`TransactionalStore`), even though every store here hands over an async one. The original failure is what reaches
 * the caller — a rollback that fails too is reported as the cause of nothing, it just cannot be
 * allowed to hide what actually went wrong.
 */
export async function runInTransaction<T>(
  db: SqliteDatabase,
  work: () => Promise<T> | T,
): Promise<T> {
  const level = openLevels.get(db) ?? 0;
  const savepoint = level === 0 ? null : `repository_tx_${level}`;

  await execute(db, savepoint ? `SAVEPOINT ${savepoint}` : 'BEGIN');
  openLevels.set(db, level + 1);
  try {
    const result = await work();
    await execute(db, savepoint ? `RELEASE ${savepoint}` : 'COMMIT');
    return result;
  } catch (error) {
    try {
      await execute(db, savepoint ? `ROLLBACK TO ${savepoint}` : 'ROLLBACK');
      if (savepoint) {
        await execute(db, `RELEASE ${savepoint}`);
      }
    } catch {
      // Swallowed on purpose: the caller is owed the error that caused the rollback, not the
      // one raised while undoing it.
    }
    throw error;
  } finally {
    openLevels.set(db, level);
  }
}
