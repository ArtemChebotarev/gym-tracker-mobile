import { runAsync } from '../async';
import {
  ConflictError,
  isConflictError,
  isNotFoundError,
  isStorageUnavailableError,
  StorageUnavailableError,
} from '../errors';

// Rule 5 of 07 · Persistence Layer Contract: an adapter never leaks its own storage-specific
// errors. A database throws its own, and this is where they stop.
//
// The split is by what the caller can do about it:
// - a uniqueness or foreign key violation is the write disagreeing with what is already stored,
//   which is exactly `ConflictError` — a duplicate id on `create`, a reference to a row that
//   isn't there;
// - anything else — a disk error, a closed connection, a NOT NULL the adapter itself got wrong —
//   is not something a caller can resolve, so it becomes `StorageUnavailableError`.
//
// Matched on the message rather than on a driver-specific error code: expo-sqlite and
// better-sqlite3 are two different bindings over the same engine, and SQLite's own wording
// ("UNIQUE constraint failed: exercise.id") is what both of them carry.

const CONFLICT_MESSAGE = /(UNIQUE|PRIMARY KEY|FOREIGN KEY) constraint failed/i;

/** True for the errors this layer is allowed to let through untouched. */
function isDomainError(error: unknown): boolean {
  return isNotFoundError(error) || isConflictError(error) || isStorageUnavailableError(error);
}

/**
 * The domain error standing for `error`. The original is kept as `cause`: which constraint
 * failed, and where, is the first thing worth knowing when one of these shows up in a log.
 */
export function toDomainError(error: unknown): unknown {
  if (isDomainError(error)) {
    return error;
  }
  const message = error instanceof Error ? error.message : String(error);
  return CONFLICT_MESSAGE.test(message)
    ? new ConflictError(`The write conflicts with what is stored: ${message}`, { cause: error })
    : new StorageUnavailableError(`The database could not serve the request: ${message}`, {
        cause: error,
      });
}

/**
 * Runs one piece of synchronous database work as an asynchronous repository operation: deferred
 * through a microtask like every other adapter (rule 1 — see `storage/async.ts`), with whatever
 * the driver throws normalized on the way out.
 */
export function runQuery<T>(operation: () => T): Promise<T> {
  return runAsync(() => {
    try {
      return operation();
    } catch (error) {
      throw toDomainError(error);
    }
  });
}
