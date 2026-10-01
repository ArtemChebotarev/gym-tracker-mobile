// The log as two JSONL files (task 141.1). A file and not a table because the log matters most
// when the database did not open — a migration that failed, a base written by a newer build —
// and a log that lives in the database is unreadable exactly then. It also needs no migration.
//
// When the current file would outgrow `maxBytes` it becomes the previous one (replacing it) and a
// new one starts, so the log never takes more than about twice the limit and always holds the
// most recent entries.

import type { LogEntry, LogSink } from '@domain/logging';

/** The two operations the sink needs from a file, so a test does not need a phone's disk. */
export interface LogFile {
  /** Size in bytes, 0 when the file does not exist yet. */
  size(): number;
  /** Creates the file (and its folder) if need be. */
  append(text: string): void;
  read(): string;
  /** Replaces the content. */
  overwrite(text: string): void;
  delete(): void;
}

export const DEFAULT_MAX_LOG_FILE_BYTES = 500 * 1024;

export type FileLogSink = LogSink & {
  /** Previous file then current one, oldest entry first — what “Export logs” hands over. */
  readAll(): string;
};

export function createFileLogSink(
  current: LogFile,
  previous: LogFile,
  maxBytes: number = DEFAULT_MAX_LOG_FILE_BYTES,
): FileLogSink {
  return {
    write(entry: LogEntry) {
      const line = `${JSON.stringify(entry)}\n`;
      if (current.size() + line.length > maxBytes && current.size() > 0) {
        previous.overwrite(current.read());
        current.delete();
      }
      current.append(line);
    },
    readAll() {
      return previous.read() + current.read();
    },
  };
}
