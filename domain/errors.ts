// Domain error types — see 07 · Persistence Layer Contract, "Hard rules", rule 5: an
// adapter must never leak its own storage-specific errors, only one of these three
// normalized types. Every concrete repository implementation (local storage now, HTTP
// later) throws one of these instead of whatever its underlying mechanism raises.

/**
 * Discriminant carried by every domain error, in addition to its class. Prefer checking
 * `kind` (via the `isNotFoundError` / `isConflictError` / `isStorageUnavailableError`
 * helpers below) over `instanceof`.
 *
 * `instanceof` only holds when the caller and the thrower share the exact same class
 * definition. That is not guaranteed once an error crosses a real module boundary — two
 * bundles that each pull in their own copy of this module (duplicate packages in a
 * monorepo, a test that reloads the module registry) end up with two distinct
 * `NotFoundError` classes that fail `instanceof` against one another even though both
 * represent the same domain error. Once a networked adapter starts reconstructing errors
 * from a JSON response body, `instanceof` stops working at all — a plain string field
 * survives that boundary, a prototype chain does not.
 */
export type DomainErrorKind = 'not-found' | 'conflict' | 'storage-unavailable';

/** Base type for every error a storage adapter is allowed to throw. */
abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** The requested record does not exist in the store. */
export class NotFoundError extends DomainError {
  readonly kind = 'not-found' as const;
}

/** The write conflicts with the current state of the store (e.g. a duplicate id). */
export class ConflictError extends DomainError {
  readonly kind = 'conflict' as const;
}

/**
 * The store cannot currently serve the request. Not raised by the in-memory engine
 * itself — reserved for adapters backed by a real medium (disk, network) that can fail
 * independently of the data they hold.
 */
export class StorageUnavailableError extends DomainError {
  readonly kind = 'storage-unavailable' as const;
}

function hasKind(error: unknown, kind: DomainErrorKind): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    (error as { kind: unknown }).kind === kind
  );
}

/** True if `error` is a `NotFoundError` — checked by discriminant, not `instanceof`. */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return hasKind(error, 'not-found');
}

/** True if `error` is a `ConflictError` — checked by discriminant, not `instanceof`. */
export function isConflictError(error: unknown): error is ConflictError {
  return hasKind(error, 'conflict');
}

/**
 * True if `error` is a `StorageUnavailableError` — checked by discriminant, not
 * `instanceof`.
 */
export function isStorageUnavailableError(error: unknown): error is StorageUnavailableError {
  return hasKind(error, 'storage-unavailable');
}
