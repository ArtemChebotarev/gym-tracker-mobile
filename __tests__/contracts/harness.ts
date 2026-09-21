import type { RepositorySet } from '@repositories/repositorySet';

// Task 109 · the seam between the repository contract suite and the implementation under test.
//
// The bundle itself is the app's own `RepositorySet` (repositories/repositorySet.ts), not a
// shape this suite invented: the contract states what the app actually holds, so an
// implementation that passes it can be handed straight to `state/repositories.ts`.

export type { RepositorySet };

/**
 * How a runner plugs its implementation into the contract: one call that produces empty
 * storage, and an optional counterpart that releases whatever it opened.
 *
 * `create` is called before *every* test rather than once per suite, because a contract test
 * states what an implementation does from a known starting point — sharing storage between
 * tests would let one test's rows decide another's outcome. An implementation with real
 * resources (an open database file, a connection) releases them in `destroy`.
 */
export type RepositoryHarness = {
  create(): Promise<RepositorySet>;
  destroy?(repositories: RepositorySet): Promise<void>;
};

/**
 * Binds `harness` to Jest's per-test lifecycle and returns a getter for the current set.
 * Call it inside the `describe` of a contract suite, then read the repositories through the
 * getter from within each test — never at describe-evaluation time, when no set exists yet.
 */
export function useRepositories(harness: RepositoryHarness): () => RepositorySet {
  let current: RepositorySet | null = null;

  beforeEach(async () => {
    current = await harness.create();
  });

  afterEach(async () => {
    if (current && harness.destroy) {
      await harness.destroy(current);
    }
    current = null;
  });

  return () => {
    if (!current) {
      throw new Error('Repositories are only available inside a test — call the getter in one.');
    }
    return current;
  };
}
