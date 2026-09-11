import { type Identifiable, InMemoryCollection } from './collection';

// The in-memory storage engine — see 07 · Persistence Layer Contract, task 022. Holds a
// set of named collections ("tables") and the transaction mechanism required by rule 6:
// "There is a mechanism to run a set of writes atomically" (used by mesocycle creation and
// next-session generation). This class is repository-agnostic on purpose: it does not know
// about `MuscleGroup`, `Exercise`, `Session`, or any other domain entity. Concrete
// repositories (built in later tasks) get a typed handle onto the collection(s) they need
// via `collection()` and compose it with domain logic — the engine itself has none.
export class InMemoryStore {
  private readonly collections = new Map<string, InMemoryCollection<Identifiable>>();

  /**
   * Returns the named collection, creating it empty on first access. The same name always
   * returns the same underlying collection instance.
   */
  collection<T extends Identifiable>(name: string): InMemoryCollection<T> {
    let existing = this.collections.get(name);
    if (!existing) {
      existing = new InMemoryCollection<T>(name);
      this.collections.set(name, existing);
    }
    return existing as unknown as InMemoryCollection<T>;
  }

  /**
   * Runs `work` against this store atomically: if it throws (synchronously) or its
   * returned promise rejects, every collection is rolled back to exactly the state it was
   * in before `work` started, and the original error is re-thrown. Otherwise `work`'s
   * writes are kept and its result is returned.
   *
   * Implemented via snapshot and restore, per the task's Definition of Done — not via undo
   * logs or command replay: before running `work`, every existing collection's rows are
   * deep-cloned aside; on failure they're copied back wholesale.
   */
  async transaction<T>(work: (store: InMemoryStore) => Promise<T> | T): Promise<T> {
    const snapshot = this.snapshot();
    try {
      return await work(this);
    } catch (error) {
      this.restore(snapshot);
      throw error;
    }
  }

  private snapshot(): Map<string, unknown[]> {
    const snapshot = new Map<string, unknown[]>();
    for (const [name, collection] of this.collections) {
      snapshot.set(name, collection.snapshotRows());
    }
    return snapshot;
  }

  private restore(snapshot: Map<string, unknown[]>): void {
    for (const [name, collection] of this.collections) {
      // A collection created during the failed transaction has no entry in the snapshot —
      // it did not exist beforehand, so rolling back means emptying it, not leaving it as
      // `work` left it.
      collection.restoreRows((snapshot.get(name) ?? []) as Identifiable[]);
    }
  }
}
