// Which sinks the running app writes to (task 141.1): the log file always, and the console as
// well in development, where it is the quickest place to see a failure. A remote store is one more
// entry in this list.

import type { LogSink } from '@domain/logging';
import { createExpoLogFiles } from '@storage/expoLogFiles';
import { createFileLogSink, type FileLogSink } from '@storage/fileLogSink';

import { setLogSinks } from './logger';

let fileSink: FileLogSink | undefined;

/** The file sink, made on first use — it is also what “Export logs” reads. */
export function getFileLogSink(): FileLogSink {
  if (fileSink === undefined) {
    const { current, previous } = createExpoLogFiles();
    fileSink = createFileLogSink(current, previous);
  }
  return fileSink;
}

const consoleSink: LogSink = {
  write(entry) {
    const print = entry.level === 'error' ? console.error : console.warn;
    print(`[${entry.event}]`, entry.message ?? '', entry.context ?? '');
  },
};

export function installDefaultLogSinks(): void {
  setLogSinks(__DEV__ ? [getFileLogSink(), consoleSink] : [getFileLogSink()]);
}
