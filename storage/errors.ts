// Re-exports the normalized error vocabulary from the domain layer (task 018 · "Доменные
// типы ошибок") so adapters in this directory can keep importing it as `@storage/errors`.
// See `domain/errors.ts` for the actual definitions, and 07 · Persistence Layer Contract,
// "Hard rules", rule 5.
export {
  ConflictError,
  isConflictError,
  isNotFoundError,
  isStorageUnavailableError,
  NotFoundError,
  StorageUnavailableError,
  type DomainErrorKind,
} from '@domain/errors';
