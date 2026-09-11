// Task 021 · "Абстракция транзакции" — see 07 · Persistence Layer Contract, rule 6:
// "There is a mechanism to run a set of writes atomically." Needed by mesocycle creation
// and next-session generation, both of which write several related records that must
// either all land or none do.
//
// This is a contract, not an implementation — implementations live in `storage` (see
// `storage/store.ts`'s `InMemoryStore`, and later a SQLite/HTTP-backed adapter).
export interface TransactionalStore<Store> {
  /**
   * Runs `work` as a single atomic operation against this store.
   *
   * `work` receives a handle of type `Store` — whatever medium-specific writer the
   * concrete adapter provides (the in-memory engine passes itself back, so `work` can
   * reach any of its collections through it) — and performs its writes through that
   * handle.
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
   * running `work` and restoring it on failure, the way the in-memory adapter does.
   * Callers must never be able to observe a partially-written state, no matter how the
   * medium underneath achieves that guarantee.
   */
  transaction<T>(work: (store: Store) => Promise<T> | T): Promise<T>;
}
