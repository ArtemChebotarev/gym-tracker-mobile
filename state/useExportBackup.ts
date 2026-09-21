// Writes the backup to a file and hands it to the system share sheet (task 070) — AirDrop, Files,
// mail, whatever the phone offers. On a local-only app this is the only way a backup leaves the
// device, and after a release build there is no expo-sqlite inspector to fall back on.
//
// The file goes to the cache directory: it exists to be handed over, and the OS may reclaim it
// afterwards. Its name carries the date so several backups don't read as the same file once they
// are side by side in Files.

import { useMutation } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { exportBackupJson } from '@usecases/backup';

import { backupDeps } from './backupStore';

/** `gymtracker-backup-2026-09-21.json` — the date is the file's own, in UTC like every stamp. */
export function backupFileName(now: Date = new Date()): string {
  return `gymtracker-backup-${now.toISOString().slice(0, 10)}.json`;
}

async function shareBackup(): Promise<void> {
  const json = await exportBackupJson(backupDeps());
  const file = new File(Paths.cache, backupFileName());
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(json);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'GymTracker backup',
  });
}

export function useExportBackup() {
  return useMutation({ mutationFn: shareBackup });
}
