// The one place the app decides which storage engine it is running on, and the reason a screen
// never has to know (07 · Persistence Layer Contract, rule 9).
//
// Until task 111 this file built an `InMemoryStore` at import time and every composition root
// below took its repositories straight from it. A persistent store cannot be built that way: the
// database file has to be opened and migrated before anything can read from it, which is
// asynchronous, while module evaluation is not — and expo-router imports every route, and with
// them every composition root, before the first screen renders. So the set is installed rather
// than constructed: `bootstrapStorage` (state/bootstrap.ts) opens SQLite, migrates it and calls
// `setRepositories`, and the UI gate holds the splash until it has (components/StorageGate.tsx).
//
// Which is also what makes the switch reversible: an engine is a `RepositorySet`, and handing
// the app a different one — the in-memory engine in tests, see jest.setup.ts — is this call and
// nothing else.

import type { RepositorySet } from '@repositories/repositorySet';

let installed: RepositorySet | null = null;

/**
 * Hands the app the storage it runs on. Called by the bootstrap once storage is ready, and by
 * tests to install the in-memory engine. `null` puts it back to having none.
 */
export function setRepositories(next: RepositorySet | null): void {
  installed = next;
}

/**
 * The storage the app is running on. Throws when nothing has been installed yet, which is a bug
 * rather than a state to render: the gate does not mount a screen until the bootstrap has
 * finished, so a query that gets here always has a store to read. Failing loudly is the point —
 * the alternative is a screen quietly showing an empty list that means "not loaded yet".
 */
export function repositories(): RepositorySet {
  if (!installed) {
    throw new Error(
      'Storage was read before it was initialized — see state/bootstrap.ts and components/StorageGate.tsx.',
    );
  }
  return installed;
}
