// Task 115 · the storage a test renders over, one set per test.
//
// Until 115 `jest.setup.ts` installed a single in-memory set on a module global, which made the
// storage of a test file shared: a `beforeEach` that seeded it seeded it again on top of the
// previous test's rows, and three tests (`useMesocycles`, `useMesoGrid`, `useStartMesocycle`)
// had to move their seeding to `beforeAll` to stop duplicating it. Here each test builds its own
// store and its own query client, so seeding belongs in `beforeEach` again and no test can be
// read as depending on another's rows.
//
// A test that needs nothing of React — a use case over hand-made fakes, a repository contract —
// doesn't import this at all; those build their own set and always did (`__tests__/contracts/`).
//
// Not a test file itself — see `testPathIgnorePatterns` in jest.config.js.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  render,
  renderHook,
  type RenderHookResult,
  type RenderResult,
} from '@testing-library/react-native';
import type { PropsWithChildren, ReactElement } from 'react';

import type { RepositorySet } from '@repositories/repositorySet';
import { RepositoriesProvider } from '@state/repositories';
import { createInMemoryRepositories } from '@storage/repositories';

// One test runs at a time and Jest gives each file its own module registry, so the current test's
// storage and query client live here rather than being threaded through every call below.
let current: { repositories: RepositorySet; client: QueryClient } | null = null;

function active(): { repositories: RepositorySet; client: QueryClient } {
  if (!current) {
    throw new Error(
      'No storage for this test — call withRepositories() at the top level of the file, and render from inside a test.',
    );
  }
  return current;
}

// The providers a screen reads through, in the order app/_layout.tsx renders them: storage above
// the query client, because what a query calls reads storage out of context.
function providers({ children }: PropsWithChildren) {
  const { repositories, client } = active();
  return (
    <RepositoriesProvider repositories={repositories}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </RepositoriesProvider>
  );
}

/**
 * Gives every test in the file its own empty in-memory storage and its own query client, and
 * hands back a getter for the storage — for seeding it in a `beforeEach` and reading it back in
 * an assertion. Call once, at the top level of the file and before any `beforeEach` that seeds:
 * hooks run in the order they were registered.
 */
export function withRepositories(): () => RepositorySet {
  beforeEach(() => {
    current = {
      repositories: createInMemoryRepositories(),
      // `gcTime: 0` so nothing this test cached outlives it — see __tests__/state/queryClient.test.tsx.
      client: new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
      }),
    };
  });

  afterEach(() => {
    current?.client.clear();
    current?.client.unmount();
    current = null;
  });

  return () => active().repositories;
}

/**
 * The query client of the current test — for a test that drives the cache itself, e.g. by
 * invalidating a key to check that a hook re-reads storage.
 */
export function queryClient(): QueryClient {
  return active().client;
}

/** Renders `ui` over this test's storage — `render` plus the providers a screen reads through. */
export function renderWithRepositories(ui: ReactElement): RenderResult {
  return render(ui, { wrapper: providers });
}

/** The `renderHook` counterpart — what a `state/` hook's own test uses. */
export function renderHookWithRepositories<Result>(
  hook: () => Result,
): RenderHookResult<Result, never> {
  return renderHook(hook, { wrapper: providers });
}
