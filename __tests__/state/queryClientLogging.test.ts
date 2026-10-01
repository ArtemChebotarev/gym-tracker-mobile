import { ConflictError, NotFoundError } from '@domain/errors';
import type { Logger } from '@domain/logging';
import { createQueryClient } from '@state/queryClient';

// gcTime: 0 leaves no garbage-collection timer open past the test.
const NO_GC = { queries: { gcTime: 0 }, mutations: { gcTime: 0 } };

function fakeLogger(): Logger & { calls: [string, unknown][] } {
  const calls: [string, unknown][] = [];
  return {
    calls,
    report: (event, error) => void calls.push([event, error]),
    error: jest.fn(),
    warn: jest.fn(),
  };
}

describe('createQueryClient logging', () => {
  test('a failed mutation is logged under the operation its hook names', async () => {
    const log = fakeLogger();
    const client = createQueryClient(log, NO_GC);
    const error = new ConflictError('already running');

    await client
      .getMutationCache()
      .build(client, {
        meta: { operation: 'startMesocycle' },
        mutationFn: () => Promise.reject(error),
      })
      .execute(undefined)
      .catch(() => undefined);

    expect(log.calls).toEqual([['mutation.startMesocycle', error]]);
    client.clear();
  });

  test('a mutation that names no operation is still logged', async () => {
    const log = fakeLogger();
    const client = createQueryClient(log, NO_GC);

    await client
      .getMutationCache()
      .build(client, { mutationFn: () => Promise.reject(new Error('x')) })
      .execute(undefined)
      .catch(() => undefined);

    expect(log.calls[0]?.[0]).toBe('mutation.unnamed');
    client.clear();
  });

  test('a failed read is logged under the first element of its key', async () => {
    const log = fakeLogger();
    const client = createQueryClient(log, NO_GC);
    const error = new NotFoundError('gone');

    await client
      .fetchQuery({
        queryKey: ['mesocycles', 'm1'],
        queryFn: () => Promise.reject(error),
        retry: false,
      })
      .catch(() => undefined);

    expect(log.calls).toEqual([['query.mesocycles', error]]);
    client.clear();
  });

  test('a successful read and write log nothing', async () => {
    const log = fakeLogger();
    const client = createQueryClient(log, NO_GC);

    await client.fetchQuery({ queryKey: ['ok'], queryFn: () => Promise.resolve(1) });
    await client
      .getMutationCache()
      .build(client, { mutationFn: () => Promise.resolve(1) })
      .execute(undefined);

    expect(log.calls).toEqual([]);
    client.clear();
  });
});
