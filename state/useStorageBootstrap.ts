// The bootstrap (state/bootstrap.ts) as something a component can render — see
// components/StorageGate.tsx, task 111.

import { useEffect, useState } from 'react';

import type { RepositorySet } from '@repositories/repositorySet';

import { bootstrapStorage } from './bootstrap';

/**
 * Nothing has been read yet · storage is ready, and here it is · storage cannot be opened at all.
 * `ready` carries the set rather than installing it somewhere (task 115): the gate puts it into
 * context, and only what renders below the gate can reach it.
 */
export type StorageBootstrap =
  | { status: 'loading' }
  | { status: 'ready'; repositories: RepositorySet }
  | { status: 'failed' };

// Started once per app process rather than once per mount: opening and migrating a database is
// not something to redo because a component remounted (Fast Refresh in development, a re-render
// of the tree above the gate). A run that failed is kept too — retrying it would only fail the
// same way, and "restart the app" is the answer the screen gives.
let run: Promise<RepositorySet> | null = null;

function startOnce(): Promise<RepositorySet> {
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
export function useStorageBootstrap(): StorageBootstrap {
  const [state, setState] = useState<StorageBootstrap>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;
    startOnce().then(
      (repositories) => {
        if (mounted) {
          setState({ status: 'ready', repositories });
        }
      },
      (error: unknown) => {
        console.error('Storage could not be initialized.', error);
        if (mounted) {
          setState({ status: 'failed' });
        }
      },
    );
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
