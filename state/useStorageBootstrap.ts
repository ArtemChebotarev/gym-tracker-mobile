// The bootstrap (state/bootstrap.ts) as something a component can render — see
// components/StorageGate.tsx, task 111.

import { useEffect, useState } from 'react';

import { bootstrapStorage } from './bootstrap';

/** Nothing has been read yet · storage is ready · storage cannot be opened at all. */
export type StorageBootstrapStatus = 'loading' | 'ready' | 'failed';

// Started once per app process rather than once per mount: opening and migrating a database is
// not something to redo because a component remounted (Fast Refresh in development, a re-render
// of the tree above the gate). A run that failed is kept too — retrying it would only fail the
// same way, and "restart the app" is the answer the screen gives.
let run: Promise<void> | null = null;

function startOnce(): Promise<void> {
  if (!run) {
    run = bootstrapStorage();
  }
  return run;
}

/** For tests: forget the run so the next mount starts a fresh one. */
export function resetStorageBootstrap(): void {
  run = null;
}

/**
 * Runs the bootstrap and reports where it got to. `failed` is terminal: the error is not shown to
 * the user (there is nothing they could do with it) but it is logged, because a migration that
 * fails on a phone is otherwise invisible.
 */
export function useStorageBootstrap(): StorageBootstrapStatus {
  const [status, setStatus] = useState<StorageBootstrapStatus>('loading');

  useEffect(() => {
    let mounted = true;
    startOnce().then(
      () => {
        if (mounted) {
          setStatus('ready');
        }
      },
      (error: unknown) => {
        console.error('Storage could not be initialized.', error);
        if (mounted) {
          setStatus('failed');
        }
      },
    );
    return () => {
      mounted = false;
    };
  }, []);

  return status;
}
