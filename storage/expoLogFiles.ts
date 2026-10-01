// The log files on the phone (task 141.1): the app's document directory, which the OS does not
// reclaim the way it does the cache. See `fileLogSink.ts` for why they are files at all.

import { Directory, File, Paths } from 'expo-file-system';

import type { LogFile } from './fileLogSink';

function expoLogFile(directory: Directory, name: string): LogFile {
  const file = new File(directory, name);
  return {
    size: () => (file.exists ? (file.size ?? 0) : 0),
    append(text) {
      if (!file.exists) {
        directory.create({ intermediates: true, idempotent: true });
        file.create();
      }
      file.write(text, { append: true });
    },
    read: () => (file.exists ? file.textSync() : ''),
    overwrite(text) {
      if (!file.exists) {
        directory.create({ intermediates: true, idempotent: true });
        file.create();
      }
      file.write(text);
    },
    delete() {
      if (file.exists) {
        file.delete();
      }
    },
  };
}

export function createExpoLogFiles(): { current: LogFile; previous: LogFile } {
  const directory = new Directory(Paths.document, 'logs');
  return {
    current: expoLogFile(directory, 'hybro-log.jsonl'),
    previous: expoLogFile(directory, 'hybro-log.1.jsonl'),
  };
}
