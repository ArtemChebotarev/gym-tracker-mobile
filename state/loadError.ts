// The `loadError` a screen takes (components/LoadErrorState.tsx), from the query it reads through.
// Defined only when the read failed and there is nothing to show: a refetch that failed behind
// data already on screen is not worth replacing the screen for. A `NotFoundError` is not a failure
// to load but the answer — the record is gone — and the screen's own “not found” says it better.

import { isNotFoundError } from '@domain/errors';

/** Passed to a screen only when its data failed to load and there is none to show. */
export type LoadError = {
  onRetry: () => void;
};

type ReadQuery = {
  isError: boolean;
  error: unknown;
  data: unknown;
  refetch: () => Promise<unknown>;
};

export function loadErrorOf(...queries: ReadQuery[]): LoadError | undefined {
  const failed = queries.filter(
    (query) => query.isError && query.data === undefined && !isNotFoundError(query.error),
  );
  if (failed.length === 0) {
    return undefined;
  }
  return { onRetry: () => failed.forEach((query) => void query.refetch()) };
}
