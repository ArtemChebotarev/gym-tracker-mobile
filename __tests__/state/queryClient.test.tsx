import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text } from 'react-native';

// Proves the state layer's Query provider works end to end: a hook backed by
// useQuery renders all three states a real repository-backed hook will hit.
function useSmokeQuery(queryFn: () => Promise<string>) {
  return useQuery({ queryKey: ['smoke'], queryFn });
}

function SmokeComponent({ queryFn }: { queryFn: () => Promise<string> }) {
  const query = useSmokeQuery(queryFn);

  if (query.isPending) {
    return <Text>loading</Text>;
  }
  if (query.isError) {
    return <Text>error: {query.error.message}</Text>;
  }
  return <Text>success: {query.data}</Text>;
}

let client: QueryClient;

beforeEach(() => {
  // gcTime: 0 avoids leaving a garbage-collection timer open past the test.
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});

afterEach(() => {
  client.clear();
  client.unmount();
});

function renderWithClient(ui: ReactElement) {
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('state layer: TanStack Query provider', () => {
  test('renders the loading state before the query settles', async () => {
    // Never resolves, so the query stays pending for the lifetime of the test —
    // no later update can leak into the next test outside of act().
    renderWithClient(<SmokeComponent queryFn={() => new Promise(() => {})} />);
    expect(await screen.findByText('loading')).toBeTruthy();
  });

  test('renders the success state once the query resolves', async () => {
    renderWithClient(<SmokeComponent queryFn={() => Promise.resolve('smoke query ok')} />);
    expect(await screen.findByText('success: smoke query ok')).toBeTruthy();
  });

  test('renders the error state once the query rejects', async () => {
    renderWithClient(
      <SmokeComponent queryFn={() => Promise.reject(new Error('smoke query failed'))} />
    );
    expect(await screen.findByText('error: smoke query failed')).toBeTruthy();
  });
});
