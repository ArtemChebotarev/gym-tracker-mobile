// What a screen shows in place of its content when reading it failed (task 141.2; 08.0.2 · Error
// handling). The read side of a failure used to look exactly like an empty or missing record —
// a query that errored has no data, and a screen with no data says "not found" or "nothing here",
// which is a lie the user can't tell from the truth. This says what happened and offers the one
// thing that may help. It is an EmptyState, so it sits the way every other empty state sits.

import { EmptyState } from '@design/components/EmptyState';
import { InfoIcon } from '@design/icons/InfoIcon';
import type { LoadError } from '@state/loadError';

export type LoadErrorStateProps = {
  loadError: LoadError;
  /** Room to leave at the bottom — the tab bar's clearance on a tab screen. */
  bottomInset?: number;
};

export function LoadErrorState({ loadError, bottomInset }: LoadErrorStateProps) {
  return (
    <EmptyState
      icon={InfoIcon}
      title="Couldn't load this screen"
      description="Your data is safe. Try again."
      actionLabel="Try again"
      onAction={loadError.onRetry}
      bottomInset={bottomInset}
    />
  );
}
