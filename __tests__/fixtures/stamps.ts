import type { Timestamps, Unsaved } from '@domain/timestamps';

/**
 * The record-keeping stamps a stored entity carries (domain/timestamps.ts), pinned to one
 * instant so a test can spread them into a literal instead of restating them.
 *
 * A literal stamped with these stands for an entity that came out of storage — the shape the
 * domain, the use cases and the screens work with. When the test actually writes through a
 * repository, the stamps it gets back are the adapter's own, not these: compare against what
 * the repository returned, or assert on the fields the test is about.
 */
export const STAMPS: Timestamps = {
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

/**
 * The entity as the domain states it, with the adapter's stamps removed — for comparing what a
 * repository returned against a literal that only says what the test is about. Stamps are the
 * storage layer's business (domain/timestamps.ts) and move on every write, so a test that isn't
 * about them shouldn't have to restate them.
 */
export function withoutStamps<T extends Timestamps>(entity: T): Unsaved<T>;
export function withoutStamps<T extends Timestamps>(entities: readonly T[]): Unsaved<T>[];
export function withoutStamps<T extends Timestamps>(
  value: T | readonly T[],
): Unsaved<T> | Unsaved<T>[] {
  if (Array.isArray(value)) {
    return value.map((entity) => withoutStamps(entity));
  }
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = value as T;
  return rest;
}

/**
 * Stamps a test doesn't care about: for asserting on an entity that a repository wrote during
 * the test, where the exact instants are the adapter's own and the test is about the rest of
 * the record. Spread into the expected object, after the fixture it builds on.
 */
export const ANY_STAMPS = {
  createdAt: expect.any(String) as unknown as string,
  updatedAt: expect.any(String) as unknown as string,
};
