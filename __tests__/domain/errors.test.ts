import {
  ConflictError,
  isConflictError,
  isNotFoundError,
  isStorageUnavailableError,
  NotFoundError,
  StorageUnavailableError,
} from '@domain/errors';

describe('domain errors', () => {
  test('NotFoundError is an Error with the "not-found" kind, its own name, and the given message', () => {
    const error = new NotFoundError('Exercise with id "1" was not found.');

    expect(error).toBeInstanceOf(Error);
    expect(error.kind).toBe('not-found');
    expect(error.name).toBe('NotFoundError');
    expect(error.message).toBe('Exercise with id "1" was not found.');
  });

  test('ConflictError is an Error with the "conflict" kind, its own name, and the given message', () => {
    const error = new ConflictError('Exercise with id "1" already exists.');

    expect(error).toBeInstanceOf(Error);
    expect(error.kind).toBe('conflict');
    expect(error.name).toBe('ConflictError');
    expect(error.message).toBe('Exercise with id "1" already exists.');
  });

  test('StorageUnavailableError is an Error with the "storage-unavailable" kind, its own name, and the given message', () => {
    const error = new StorageUnavailableError('The store is unreachable.');

    expect(error).toBeInstanceOf(Error);
    expect(error.kind).toBe('storage-unavailable');
    expect(error.name).toBe('StorageUnavailableError');
    expect(error.message).toBe('The store is unreachable.');
  });

  test('the three error types are distinguishable from one another by kind', () => {
    const notFound = new NotFoundError('not found');
    const conflict = new ConflictError('conflict');
    const unavailable = new StorageUnavailableError('unavailable');

    expect(notFound.kind).not.toBe(conflict.kind);
    expect(notFound.kind).not.toBe(unavailable.kind);
    expect(conflict.kind).not.toBe(unavailable.kind);
  });

  describe('type guards', () => {
    const notFound = new NotFoundError('not found');
    const conflict = new ConflictError('conflict');
    const unavailable = new StorageUnavailableError('unavailable');

    test('isNotFoundError matches only NotFoundError', () => {
      expect(isNotFoundError(notFound)).toBe(true);
      expect(isNotFoundError(conflict)).toBe(false);
      expect(isNotFoundError(unavailable)).toBe(false);
    });

    test('isConflictError matches only ConflictError', () => {
      expect(isConflictError(conflict)).toBe(true);
      expect(isConflictError(notFound)).toBe(false);
      expect(isConflictError(unavailable)).toBe(false);
    });

    test('isStorageUnavailableError matches only StorageUnavailableError', () => {
      expect(isStorageUnavailableError(unavailable)).toBe(true);
      expect(isStorageUnavailableError(notFound)).toBe(false);
      expect(isStorageUnavailableError(conflict)).toBe(false);
    });

    test('the guards reject values that are not domain errors, including a plain Error', () => {
      expect(isNotFoundError(new Error('not found'))).toBe(false);
      expect(isNotFoundError(null)).toBe(false);
      expect(isNotFoundError(undefined)).toBe(false);
      expect(isNotFoundError('not found')).toBe(false);
      expect(isNotFoundError({})).toBe(false);
    });
  });

  test('kind is determined correctly even when instanceof fails across a module boundary', () => {
    // Forces a second, independent evaluation of `@domain/errors` — as if it had been
    // loaded from a duplicate package copy, or reconstructed from a serialized HTTP
    // response by a future networked adapter. `NotFoundError` from this second copy is a
    // structurally identical but distinct class from the one imported above.
    let errorFromDuplicateModule!: NotFoundError;
    jest.isolateModules(() => {
      const duplicate = jest.requireActual<typeof import('@domain/errors')>('@domain/errors');
      errorFromDuplicateModule = new duplicate.NotFoundError('not found');
    });

    // The two `NotFoundError` classes are distinct objects — instanceof correctly fails,
    // which is exactly the trap this discriminant exists to avoid.
    expect(errorFromDuplicateModule).not.toBeInstanceOf(NotFoundError);

    // The discriminant survives the boundary: the helper from the *original* module still
    // recognizes an error thrown by the *duplicate* module's class as a NotFoundError.
    expect(isNotFoundError(errorFromDuplicateModule)).toBe(true);
  });
});
