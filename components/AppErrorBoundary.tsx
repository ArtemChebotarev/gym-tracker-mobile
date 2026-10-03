// The root error boundary (task 141.2; 08.0.2 · Error handling). Expo Router renders the
// `ErrorBoundary` a layout exports in place of that layout when something below it throws while
// rendering — without one a release build just closes. It says what is true (the data is not
// touched: a render that failed wrote nothing), offers the one thing that can help, and writes
// the cause to the log, which is where it can be read afterwards.

import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';

import { Button } from '@design/components/Button';
import { logger } from '@state/logger';

import { FullScreenMessage } from './FullScreenMessage';

export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    logger.error('render.boundary', error);
  }, [error]);

  return (
    <FullScreenMessage
      testID="app-error-boundary"
      title="Something went wrong"
      description="Your data is safe. Try again, or restart the app."
    >
      <Button label="Try again" onPress={() => void retry()} />
    </FullScreenMessage>
  );
}
