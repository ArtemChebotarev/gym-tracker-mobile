import type { RoundLog } from '@domain/execution';
import type { Incoming } from '@domain/timestamps';

// RoundLogRepository — the slice of the execution repositories for interval rounds and the
// mobility block (10 · Hybrid Exercises, 10.1 FR-7). It is `SetLogRepository`'s counterpart for the
// exercises whose fact is time rather than weight and reps, and it follows the same hard rules
// (07 · Persistence Layer Contract): every operation is async, no business logic, the domain
// generates the id before `create`, and an adapter normalizes its own errors into the domain's.
//
// What `SetLogRepository` has beyond this — `listPerformances` — is not repeated here: a round's
// place in a block is read through `SetLogRepository.listPerformances`, which attaches the rounds
// to the session exercise they belong to.

export type RoundLogSortOrder = 'asc' | 'desc';

export type ListRoundLogsByExerciseIdOptions = {
  /** Maximum number of results to return. Omit for no limit. */
  limit?: number;
  /** Sort direction by `completedAt`. Defaults to `desc` (most recent first) when omitted. */
  order?: RoundLogSortOrder;
};

export interface RoundLogRepository {
  /** All rounds logged for one session exercise, by `roundNumber`. */
  listBySessionExerciseId(sessionExerciseId: string): Promise<RoundLog[]>;

  /** All rounds across every exercise of one session. */
  listBySessionId(sessionId: string): Promise<RoundLog[]>;

  /**
   * Rounds of one exercise across every mesocycle, sorted by `completedAt`, optionally limited.
   * Reads the `(exercise_id, completed_at)` index, like the set-log query it mirrors.
   */
  listByExerciseId(
    exerciseId: string,
    options?: ListRoundLogsByExerciseIdOptions,
  ): Promise<RoundLog[]>;

  /** Most recent round of an exercise, or `null` when it has never been logged. */
  getLastByExerciseId(exerciseId: string): Promise<RoundLog | null>;

  /** Persists a round that already carries its domain-generated id. */
  create(roundLog: Incoming<RoundLog>): Promise<RoundLog>;

  /** Persists changes to an existing round, addressed by its id. */
  update(roundLog: RoundLog): Promise<RoundLog>;

  /** Removes a round by id. */
  deleteById(id: string): Promise<void>;
}
