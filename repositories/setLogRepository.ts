import type { SetLog } from '@domain/execution';

// SetLogRepository — contract for the SetLog slice of the execution repositories.
//
// See 07 · Persistence Layer Contract, "Репозитории и их операции" (SetLogRepository row) and
// 06 · History & Analytics, "Запросы, которые должен поддерживать слой чтения" for the two
// exercise-history queries this repository backs.
//
// Scope note: task 020 also calls for MesocycleRepository, SessionRepository, and
// SessionExerciseRepository, but those are deliberately deferred to a later task because that
// part of the domain model isn't ready yet — this file defines SetLogRepository only.
//
// Hard rules this contract follows (07 · Persistence Layer Contract, "Жёсткие правила"):
// - Rule 1: every operation is async, even though today's adapter is synchronous local storage.
// - Rule 2: no business logic here — reading, writing, and filtering by simple criteria only.
// - Rule 3: the domain generates ids before calling create(); the repository never mints one.
// - Rule 5: adapters normalize their own errors into NotFound / ConflictError /
//   StorageUnavailable (domain error types, introduced by task 018) instead of leaking
//   storage-specific failures.

export type SetLogSortOrder = 'asc' | 'desc';

export type ListSetLogsByExerciseIdOptions = {
  /** Maximum number of results to return. Omit for no limit. */
  limit?: number;
  /** Sort direction by `completedAt`. Defaults to `desc` (most recent first) when omitted. */
  order?: SetLogSortOrder;
};

export interface SetLogRepository {
  /** All set logs for one session exercise (a single exercise instance within a session). */
  listBySessionExerciseId(sessionExerciseId: string): Promise<SetLog[]>;

  /** All set logs across every exercise of one session — used to assemble a full session. */
  listBySessionId(sessionId: string): Promise<SetLog[]>;

  /**
   * Set logs for one exercise across every mesocycle, sorted by `completedAt`, optionally
   * limited. Backs exercise history (06, Сценарий 2) and is called on every workout-screen
   * open to prefill weight — the adapter must keep an `exerciseId -> set log ids` index rather
   * than scanning every set log (07, "Критичные по производительности запросы").
   */
  listByExerciseId(exerciseId: string, options?: ListSetLogsByExerciseIdOptions): Promise<SetLog[]>;

  /** Most recent set log for an exercise, or `null` when it has never been logged. */
  getLastByExerciseId(exerciseId: string): Promise<SetLog | null>;

  /** Persists a set log that already carries its domain-generated id. */
  create(setLog: SetLog): Promise<SetLog>;

  /** Persists changes to an existing set log, addressed by its id. */
  update(setLog: SetLog): Promise<SetLog>;

  /** Removes a set log by id. */
  deleteById(id: string): Promise<void>;
}
