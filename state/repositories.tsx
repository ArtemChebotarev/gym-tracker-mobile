// The one place the app decides which storage engine it is running on, and the reason a screen
// never has to know (07 · Persistence Layer Contract, rule 9).
//
// Until task 111 this file built an `InMemoryStore` at import time and every composition root
// below took its repositories straight from it. A persistent store cannot be built that way: the
// database file has to be opened and migrated before anything can read from it, which is
// asynchronous, while module evaluation is not. Task 111 solved that with a module global the
// bootstrap wrote into — which worked, but let any module reach storage without saying it
// depended on it, and gave every test in a file one shared store.
//
// Since task 115 the set travels down the tree instead. `components/StorageGate.tsx` owns the
// bootstrap's result and does not mount its children until it has one, so it is also the natural
// place to put the set into context; everything below reads it with `useRepositories`. Nothing
// can read storage without a provider above it, and a test renders its own set — one per test,
// not one per file (`__tests__/fixtures/renderWithRepositories.tsx`).
//
// Which is also what makes the engine switch reversible: an engine is a `RepositorySet`, and
// handing the app a different one — the in-memory engine in tests — is what is passed here and
// nothing else.

import { createContext, useContext, type PropsWithChildren } from 'react';

import type { RepositorySet } from '@repositories/repositorySet';

const RepositoriesContext = createContext<RepositorySet | null>(null);

/** Hands everything below it the storage to read through. */
export function RepositoriesProvider({
  repositories,
  children,
}: PropsWithChildren<{ repositories: RepositorySet }>) {
  return (
    <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>
  );
}

/**
 * The storage this part of the tree runs on. Throws when there is no provider above, which is a
 * bug rather than a state to render: the gate does not mount a screen until the bootstrap has
 * finished, so a query that gets here always has a store to read. Failing loudly is the point —
 * the alternative is a screen quietly showing an empty list that means "not loaded yet".
 */
export function useRepositories(): RepositorySet {
  const repositories = useContext(RepositoriesContext);
  if (!repositories) {
    throw new Error(
      'Storage was read outside a RepositoriesProvider — see components/StorageGate.tsx, which puts one above every screen, and __tests__/fixtures/renderWithRepositories.tsx for tests.',
    );
  }
  return repositories;
}
