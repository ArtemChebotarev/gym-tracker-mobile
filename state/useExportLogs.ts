// Hands the log files to the share sheet (task 141.1), next to the backup on the debug screen. The
// log lives in files rather than the database (see storage/fileLogSink.ts), so it can be exported
// even when the database would not open.

import { useMutation } from '@tanstack/react-query';

import { getFileLogSink } from './defaultLogSinks';
import { shareTextFile } from './shareFile';

/** `hybro-log-2026-10-01.jsonl` — the date is the export's own, in UTC like every stamp. */
export function logFileName(now: Date = new Date()): string {
  return `hybro-log-${now.toISOString().slice(0, 10)}.jsonl`;
}

export function useExportLogs() {
  return useMutation({
    meta: { operation: 'exportLogs' },
    mutationFn: () =>
      shareTextFile({
        fileName: logFileName(),
        content: getFileLogSink().readAll(),
        mimeType: 'text/plain',
        uti: 'public.plain-text',
        dialogTitle: 'Hybro log',
      }),
  });
}
