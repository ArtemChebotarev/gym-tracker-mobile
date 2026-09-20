import { nowAsUtcIso } from '@domain/time';
import type { Incoming, Timestamps } from '@domain/timestamps';

// Who writes `createdAt` / `updatedAt` — see domain/timestamps.ts for why it is the adapter and
// not the domain. Stamping happens here, in JavaScript, rather than through a storage-native
// default (`DEFAULT CURRENT_TIMESTAMP` and friends): every adapter then produces the same format
// from the same clock, a test can pin that clock, and the stamps don't silently change meaning
// when the medium does.

/**
 * An entity on its way in. Both stamps are the moment it is stored — `updatedAt` equals
 * `createdAt` until something updates the record — unless the caller brought stamps of its own,
 * which a restore does (see `Incoming` in domain/timestamps.ts).
 */
export function stampCreated<T extends Timestamps>(entity: Incoming<T>): T {
  const now = nowAsUtcIso();
  const createdAt = entity.createdAt ?? now;
  // TypeScript can't see that `Incoming<T>` plus both stamps is exactly `T` — `Omit` loses that
  // relation — so the assertion stands in for what the spread actually produces.
  return { ...entity, createdAt, updatedAt: entity.updatedAt ?? createdAt } as T;
}

/**
 * An entity on its way back out after an update: `updatedAt` moves, and `createdAt` is taken
 * from the stored record rather than from the caller, which has no say over when the record was
 * first written.
 */
export function stampUpdated<T extends Timestamps>(stored: T, next: T): T {
  return { ...next, createdAt: stored.createdAt, updatedAt: nowAsUtcIso() };
}
