// Builds the log entry for a failure — see `domain/logging.ts` for what an entry holds and why.

import { isConflictError, isNotFoundError, isStorageUnavailableError } from './errors';
import type { LogContext, LogEntry, LogErrorKind, LogLevel } from './logging';

/** Long enough for a driver's message, short enough that one entry cannot fill the file. */
export const MAX_LOG_MESSAGE_LENGTH = 500;

export function errorKindOf(error: unknown): LogErrorKind {
  if (isStorageUnavailableError(error)) {
    return 'storage-unavailable';
  }
  if (isConflictError(error)) {
    return 'conflict';
  }
  if (isNotFoundError(error)) {
    return 'not-found';
  }
  return 'unknown';
}

/** The app expects a conflict and a missing record, so they are warnings; everything else is not. */
export function levelOfErrorKind(kind: LogErrorKind): LogLevel {
  return kind === 'conflict' || kind === 'not-found' ? 'warn' : 'error';
}

function messageOf(value: unknown): string {
  const text = value instanceof Error ? value.message : String(value);
  return text.length > MAX_LOG_MESSAGE_LENGTH ? `${text.slice(0, MAX_LOG_MESSAGE_LENGTH)}…` : text;
}

export type EntryMeta = { appVersion: string; sessionId: string; ts: string };

export function buildFailureEntry(
  level: LogLevel,
  event: string,
  error: unknown,
  meta: EntryMeta,
  context?: LogContext,
): LogEntry {
  const cause = error instanceof Error ? error.cause : undefined;
  return {
    ...meta,
    level,
    event,
    errorKind: errorKindOf(error),
    message: messageOf(error),
    ...(cause !== undefined && { cause: messageOf(cause) }),
    ...(context !== undefined && { context }),
  };
}

export function buildWarningEntry(event: string, meta: EntryMeta, context?: LogContext): LogEntry {
  return { ...meta, level: 'warn', event, ...(context !== undefined && { context }) };
}

/**
 * The log file is JSON Lines — one entry per line, so appending never rewrites anything. As a
 * whole it is not valid JSON, and previews and tools that expect JSON refuse it, so an export
 * turns it into one array. A line that does not parse (a write cut off when the app died) is
 * skipped rather than failing the whole export.
 */
export function logLinesToJsonArray(lines: string): string {
  const entries: unknown[] = [];
  for (const line of lines.split('\n')) {
    if (line.trim() === '') {
      continue;
    }
    try {
      entries.push(JSON.parse(line));
    } catch {
      // A torn last line; the entries before it are still worth handing over.
    }
  }
  return JSON.stringify(entries, null, 2);
}
