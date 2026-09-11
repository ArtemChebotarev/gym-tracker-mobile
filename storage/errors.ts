// Normalized storage errors — see 07 · Persistence Layer Contract, "Hard rules", rule 5:
// adapters must not leak their own storage-specific errors, only these domain types.
// Every concrete repository implementation (local storage now, HTTP later) throws one of
// these instead of whatever its underlying mechanism raises.

/** Base type for every error a storage adapter is allowed to throw. */
export abstract class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** The requested record does not exist in the store. */
export class NotFoundError extends StorageError {}

/** The write conflicts with the current state of the store (e.g. a duplicate id). */
export class ConflictError extends StorageError {}

/**
 * The store cannot currently serve the request. Not raised by the in-memory engine
 * itself — reserved for adapters backed by a real medium (disk, network) that can fail
 * independently of the data they hold.
 */
export class StorageUnavailableError extends StorageError {}
