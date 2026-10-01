// The logger itself (task 141.1): turns a failure into an entry and hands it to every sink. The
// sinks are read on each write, so one installed after the logger was created still gets the
// entries that follow.

import type { LogSink, Logger } from './logging';
import {
  buildFailureEntry,
  buildWarningEntry,
  errorKindOf,
  levelOfErrorKind,
  type EntryMeta,
} from './loggingBuilders';
import { nowAsUtcIso } from './time';

export type LoggerConfig = {
  appVersion: string;
  sessionId: string;
  getSinks: () => readonly LogSink[];
  now?: () => string;
};

export function createLogger({ appVersion, sessionId, getSinks, now = nowAsUtcIso }: LoggerConfig): Logger {
  const meta = (): EntryMeta => ({ appVersion, sessionId, ts: now() });

  function dispatch(entry: Parameters<LogSink['write']>[0]): void {
    for (const sink of getSinks()) {
      try {
        sink.write(entry);
      } catch {
        // Nowhere left to report to: the sink that failed is the way out.
      }
    }
  }

  return {
    report(event, error, context) {
      dispatch(buildFailureEntry(levelOfErrorKind(errorKindOf(error)), event, error, meta(), context));
    },
    error(event, error, context) {
      dispatch(buildFailureEntry('error', event, error, meta(), context));
    },
    warn(event, context) {
      dispatch(buildWarningEntry(event, meta(), context));
    },
  };
}
