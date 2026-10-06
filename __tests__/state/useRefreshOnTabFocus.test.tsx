import { useQuery } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react-native';

import { useRefreshOnTabFocus } from '@state/useRefreshOnTabFocus';

import { renderHookWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

withRepositories();

// GT-38 · a tab switch is a refresh. A query that is mounted and was read once is read again when
// a tab comes into focus, so a change made elsewhere shows up without restarting the app.
describe('useRefreshOnTabFocus', () => {
  test('a focus event re-reads a query that is already on screen', async () => {
    let stored = 'before';
    const { result } = renderHookWithRepositories(() => ({
      query: useQuery({ queryKey: ['anything'], queryFn: async () => stored }),
      listeners: useRefreshOnTabFocus(),
    }));
    await waitFor(() => expect(result.current.query.data).toBe('before'));

    stored = 'after';
    act(() => result.current.listeners.focus());

    await waitFor(() => expect(result.current.query.data).toBe('after'));
  });

  test('without a focus event the query keeps what it read', async () => {
    let stored = 'before';
    const { result } = renderHookWithRepositories(() => ({
      query: useQuery({ queryKey: ['anything'], queryFn: async () => stored }),
    }));
    await waitFor(() => expect(result.current.query.data).toBe('before'));

    stored = 'after';

    expect(result.current.query.data).toBe('before');
  });
});
