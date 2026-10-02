// Hands the log to the share sheet (task 141.1) as one JSON array, next to the backup on the debug
// screen. The
// log lives in files rather than the database (see storage/fileLogSink.ts), so it can be exported
// even when the database would not open.

import { useMutation } from '@tanstack/react-query';

import { logLinesToJsonArray } from '@domain/loggingBuilders';

import { getFileLogSink } from './defaultLogSinks';
import { shareTextFile } from './shareFile';

/** `hybro-log-2026-10-01.json` — the date is the export's own, in UTC like every stamp. */
export function logFileName(now: Date = new Date()): string {
  return `hybro-log-${now.toISOString().slice(0, 10)}.json`;
}

export function useExportLogs() {
  return useMutation({
    meta: { operation: 'exportLogs' },
    mutationFn: () =>
      shareTextFile({
        fileName: logFileName(),
        content: logLinesToJsonArray(getFileLogSink().readAll()),
        mimeType: 'application/json',
        uti: 'public.json',
        dialogTitle: 'Hybro log',
      }),
  });
}
