import {
  ConflictError,
  NotFoundError,
  StorageError,
  StorageUnavailableError,
} from '@storage/errors';

describe('storage errors', () => {
  test('NotFoundError is a StorageError with its own name and message', () => {
    const error = new NotFoundError('Exercise with id "1" was not found.');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(StorageError);
    expect(error.name).toBe('NotFoundError');
    expect(error.message).toBe('Exercise with id "1" was not found.');
  });

  test('ConflictError is a StorageError with its own name and message', () => {
    const error = new ConflictError('Exercise with id "1" already exists.');

    expect(error).toBeInstanceOf(StorageError);
    expect(error.name).toBe('ConflictError');
    expect(error.message).toBe('Exercise with id "1" already exists.');
  });

  test('StorageUnavailableError is a StorageError with its own name and message', () => {
    const error = new StorageUnavailableError('The store is unreachable.');

    expect(error).toBeInstanceOf(StorageError);
    expect(error.name).toBe('StorageUnavailableError');
    expect(error.message).toBe('The store is unreachable.');
  });

  test('the three error types are distinguishable from one another', () => {
    const notFound = new NotFoundError('not found');
    const conflict = new ConflictError('conflict');
    const unavailable = new StorageUnavailableError('unavailable');

    expect(notFound).not.toBeInstanceOf(ConflictError);
    expect(notFound).not.toBeInstanceOf(StorageUnavailableError);
    expect(conflict).not.toBeInstanceOf(NotFoundError);
    expect(conflict).not.toBeInstanceOf(StorageUnavailableError);
    expect(unavailable).not.toBeInstanceOf(NotFoundError);
    expect(unavailable).not.toBeInstanceOf(ConflictError);
  });
});
