// Task 021 · "Абстракция транзакции" — see 07 · Persistence Layer Contract, rule 6:
// "There is a mechanism to run a set of writes atomically." Needed by mesocycle creation
// and next-session generation, both of which write several related records that must
// either all land or none do.
//
// This is the contract the four transactional stores of `RepositorySet` are stated on —
// `WorkoutStore`, `MesocycleStartStore`, `MesocycleClosingStore`, `BackupStore` — each binding
// `Store` to the repositories its scenario writes through. The implementations live in
// `storage/sqlite/`, where `runInTransaction` issues the BEGIN/COMMIT/ROLLBACK.
export interface TransactionalStore<Store> {
  /**
   * Runs `work` as a single atomic operation against this store.
   *
   * `work` receives a handle of type `Store` — the repositories bound to this transaction —
   * and performs its writes through it.
   *
   * - If `work` throws synchronously, or the promise it returns rejects, none of the
   *   writes attempted during `work` may be observable afterwards: every one of them is
   *   rolled back, the store is left exactly as it was before the call, and the original
   *   error propagates to the caller.
   * - If `work` resolves, all of its writes are kept and its result is returned.
   *
   * A storage medium with no native transaction support (e.g. a plain key-value store, or
   * an HTTP API without a batched-write endpoint) must still satisfy this contract by
   * emulating atomicity itself — for example by snapshotting the affected state before
   * running `work` and restoring it on failure. Callers must never be able to observe a
   * partially-written state, no matter how the medium underneath achieves that guarantee.
   */
  transaction<T>(work: (store: Store) => Promise<T> | T): Promise<T>;
}
