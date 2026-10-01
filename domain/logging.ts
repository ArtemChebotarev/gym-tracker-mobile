// What the app writes down about its own failures (task 141.1). Two levels only: `error` for what
// should not happen, `warn` for the business situations that are expected but worth seeing — a
// conflict the user was told about, a screen opened for a record that is gone. There is no info
// level on purpose: a log that records every step buries the three lines somebody opens it for.
//
// A record carries ids and the kind of event, never what the user typed or trained with —
// exercise names, weights and free text stay out. The same entries are meant to reach a remote
// store later, and that is easier to open up than to take back.

import type { DomainErrorKind } from './errors';

export type LogLevel = 'error' | 'warn';

/** `unknown` is anything that is not one of the domain's own errors. */
export type LogErrorKind = DomainErrorKind | 'unknown';

/** Flat on purpose: ids, counts, flags. Nothing the user wrote. */
export type LogContext = Readonly<Record<string, string | number | boolean | null>>;

export type LogEntry = {
  /** UTC ISO instant. */
  ts: string;
  level: LogLevel;
  /** Dotted name of what was being done, e.g. `mutation.startMesocycle`. */
  event: string;
  errorKind?: LogErrorKind;
  message?: string;
  /** The message of the failure an adapter normalized away (`Error.cause`), when there is one. */
  cause?: string;
  /** The build that wrote the entry. */
  appVersion: string;
  /** One per app launch — entries of the same run share it. */
  sessionId: string;
  context?: LogContext;
};

/**
 * Where entries go. A sink must not throw into the app, and the logger swallows it if one does:
 * a log that breaks what it was watching is worse than no log. Writing is synchronous because the
 * file sink is — a remote sink queues internally.
 */
export interface LogSink {
  write(entry: LogEntry): void;
}

export interface Logger {
  /**
   * Records a failure, choosing the level by what failed: a conflict or a missing record is a
   * `warn` (the app expects those), anything else an `error`.
   */
  report(event: string, error: unknown, context?: LogContext): void;
  /** Records a failure as an `error` whatever it is. */
  error(event: string, error: unknown, context?: LogContext): void;
  /** Records a business situation that is not a failure. */
  warn(event: string, context?: LogContext): void;
}
