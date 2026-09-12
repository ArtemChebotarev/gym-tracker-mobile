import {
  ConflictError,
  isConflictError,
  isNotFoundError,
  isStorageUnavailableError,
  NotFoundError,
  StorageUnavailableError,
} from '@storage/errors';

// `@storage/errors` is a re-export of `@domain/errors` (task 018 · "Доменные типы
// ошибок") kept so adapters in this directory can keep importing it under this path.
// See `__tests__/domain/errors.test.ts` for the actual behavior coverage.
describe('storage errors re-export', () => {
  test('re-exports the same error classes and type guards as @domain/errors', () => {
    const notFound = new NotFoundError('not found');
    const conflict = new ConflictError('conflict');
    const unavailable = new StorageUnavailableError('unavailable');

    expect(isNotFoundError(notFound)).toBe(true);
    expect(isConflictError(conflict)).toBe(true);
    expect(isStorageUnavailableError(unavailable)).toBe(true);
  });
});
