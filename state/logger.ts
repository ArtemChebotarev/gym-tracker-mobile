// The app's one logger (task 141.1). It starts with no sinks: a test that runs through code which
// logs writes nowhere and prints nothing, and the real ones are installed once at startup by
// `installDefaultLogSinks` (state/defaultLogSinks.ts). A failure before that — the module scope
// of the root layout runs first — would be lost, so nothing may log ahead of the install.

import Constants from 'expo-constants';

import { createLogger } from '@domain/logger';
import type { LogSink, Logger } from '@domain/logging';
import { generateId } from '@domain/id';

let sinks: readonly LogSink[] = [];

export function setLogSinks(next: readonly LogSink[]): void {
  sinks = next;
}

export const logger: Logger = createLogger({
  appVersion: Constants.expoConfig?.version ?? 'unknown',
  sessionId: generateId(),
  getSinks: () => sinks,
});
