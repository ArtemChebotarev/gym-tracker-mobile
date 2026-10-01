import { MutationCache, QueryCache, QueryClient, type DefaultOptions } from '@tanstack/react-query';

import type { Logger } from '@domain/logging';

import { logger } from './logger';

/** What was being done, from the `meta.operation` a hook names itself with. */
function operationOf(meta: Record<string, unknown> | undefined): string {
  return typeof meta?.operation === 'string' ? meta.operation : 'unnamed';
}

/**
 * Every failed read and write ends up in the log from here (task 141.1) — one place instead of an
 * `onError` in each hook. This only records: showing the user what happened is the screen's job,
 * through the `onError` it passes to `mutate` and the `isError` of its query.
 */
export function createQueryClient(log: Logger, defaultOptions?: DefaultOptions): QueryClient {
  return new QueryClient({
    defaultOptions,
    queryCache: new QueryCache({
      onError: (error, query) => {
        // A key's first element is the hook's own name by convention (`['mesocycles', ...]`).
        const name =
          typeof query.queryKey[0] === 'string' ? query.queryKey[0] : operationOf(query.meta);
        log.report(`query.${name}`, error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _onMutateResult, mutation) => {
        log.report(`mutation.${operationOf(mutation.options.meta)}`, error);
      },
    }),
  });
}

export const queryClient = createQueryClient(logger);
