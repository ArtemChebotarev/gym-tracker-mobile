// Writes the backup to a file and hands it to the system share sheet (task 070). On a local-only
// app this is the only way a backup leaves the device, and after a release build there is no
// expo-sqlite inspector to fall back on. The sharing itself is `shareTextFile`.
//
// The file's name carries the date so several backups don't read as the same file once they are
// side by side in Files.

import { useMutation } from '@tanstack/react-query';
import { exportBackupJson, type BackupDeps } from '@usecases/backup';

import { useBackupDeps } from './backupStore';
import { shareTextFile } from './shareFile';

/** `hybro-backup-2026-09-21.json` — the date is the file's own, in UTC like every stamp. */
export function backupFileName(now: Date = new Date()): string {
  return `hybro-backup-${now.toISOString().slice(0, 10)}.json`;
}

async function shareBackup(deps: BackupDeps): Promise<void> {
  await shareTextFile({
    fileName: backupFileName(),
    content: await exportBackupJson(deps),
    mimeType: 'application/json',
    uti: 'public.json',
    dialogTitle: 'Hybro backup',
  });
}

export function useExportBackup() {
  const deps = useBackupDeps();

  return useMutation({ meta: { operation: 'exportBackup' }, mutationFn: () => shareBackup(deps) });
}
