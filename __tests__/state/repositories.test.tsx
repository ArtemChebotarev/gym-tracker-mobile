import { render, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { Text } from 'react-native';

import { RepositoriesProvider, useRepositories } from '@state/repositories';
import { createSqliteRepositories } from '@storage/sqlite/repositories';

import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

// Task 115 · storage reaches a screen through context, so what this file states is the two ends
// of that: what a component below a provider gets, and what one rendered without a provider does.

function MesocycleName() {
  const { mesocycleRepo } = useRepositories();
  return <Text>{mesocycleRepo.constructor.name}</Text>;
}

describe('state/repositories', () => {
  test('a component below the provider reads the set it was given', () => {
    const installed = createSqliteRepositories(db());
    function wrapper({ children }: PropsWithChildren) {
      return <RepositoriesProvider repositories={installed}>{children}</RepositoriesProvider>;
    }

    const { result } = renderHook(() => useRepositories(), { wrapper });

    expect(result.current).toBe(installed);
  });

  test('a screen rendered without a provider fails loudly instead of showing nothing', () => {
    // The gate is what makes this unreachable in the app (components/StorageGate.tsx). If it ever
    // is reached, it must fail: an empty answer here would render as "you have no mesocycles",
    // which is a lie about the user's data. React logs the error it rethrows, and that log is what
    // the run's console check would fail on, so it is silenced for this test.
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<MesocycleName />)).toThrow(/outside a RepositoriesProvider/);
  });
});
