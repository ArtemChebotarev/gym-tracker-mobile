import { createInMemoryRepositories } from '@storage/repositories';
import { repositories, setRepositories } from '@state/repositories';

// jest.setup.ts installs the in-memory engine for every test file, so these put it back when
// they are done taking it away.
afterEach(() => {
  setRepositories(createInMemoryRepositories());
});

describe('state/repositories', () => {
  test('reading storage before it is installed throws rather than answering', () => {
    setRepositories(null);

    // The gate is what makes this unreachable (components/StorageGate.tsx). If it ever is
    // reached, a screen must fail loudly: an empty answer here would render as "you have no
    // mesocycles", which is a lie about the user's data.
    expect(() => repositories()).toThrow(/before it was initialized/);
  });

  test('installing a set makes it the one every composition root reads', () => {
    const installed = createInMemoryRepositories();

    setRepositories(installed);

    expect(repositories()).toBe(installed);
  });
});
