import { NotFoundError } from '@domain/errors';
import { loadErrorOf } from '@state/loadError';

function query(overrides: Partial<Parameters<typeof loadErrorOf>[0]> = {}) {
  return { isError: false, error: null, data: undefined, refetch: jest.fn(), ...overrides };
}

describe('loadErrorOf', () => {
  test('is undefined while the read has not failed', () => {
    expect(loadErrorOf(query())).toBeUndefined();
  });

  test('is set when the read failed and there is nothing to show', () => {
    expect(loadErrorOf(query({ isError: true, error: new Error('storage down') }))).toBeDefined();
  });

  test('is undefined when a refetch failed behind data already on screen', () => {
    const failed = query({ isError: true, error: new Error('storage down'), data: [] });

    expect(loadErrorOf(failed)).toBeUndefined();
  });

  test('is undefined for a missing record — that is the answer, not a failure', () => {
    expect(loadErrorOf(query({ isError: true, error: new NotFoundError('gone') }))).toBeUndefined();
  });

  test('retry refetches the queries that failed and only those', () => {
    const failed = query({ isError: true, error: new Error('x') });
    const fine = query({ data: 1 });

    loadErrorOf(failed, fine)?.onRetry();

    expect(failed.refetch).toHaveBeenCalledTimes(1);
    expect(fine.refetch).not.toHaveBeenCalled();
  });
});
