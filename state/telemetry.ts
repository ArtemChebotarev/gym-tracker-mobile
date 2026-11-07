// The app's one way to send a telemetry event (GT-246). Like the logger it starts with no client,
// so tests and development builds send nothing; `installDefaultTelemetry` (defaultTelemetry.ts)
// gives it the real one in a build that carries the analytics key.
//
// Telemetry never gets in the way of training: a client that throws is logged and forgotten, and
// the event is lost rather than retried.

import type { TelemetryArgs, TelemetryClient, TelemetryEventName } from '@domain/telemetry';

import { logger } from './logger';

let client: TelemetryClient | undefined;

export function setTelemetryClient(next: TelemetryClient | undefined): void {
  client = next;
}

/** Whether events go anywhere — so an event that needs a read to describe it can skip the read. */
export function isTelemetryEnabled(): boolean {
  return client !== undefined;
}

export function track<E extends TelemetryEventName>(event: E, ...args: TelemetryArgs<E>): void {
  if (client === undefined) return;
  try {
    client.capture(event, args[0]);
  } catch (error) {
    logger.error('telemetry.capture', error, { event });
  }
}
