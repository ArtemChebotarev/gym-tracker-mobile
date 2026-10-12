// Restores a backup from a file the user picks (task 123) — the calling side of `importBackupJson`
// (task 070). Two steps, because the screen has to ask "are you sure" between them: picking reads
// the file and changes nothing; restoring is what writes.
//
// The picker is the system's own (`File.pickFileAsync`), so no native module is added. On iOS it
// hands back a temporary copy, leaving the original untouched.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { File } from 'expo-file-system';
import { importBackupJson } from '@usecases/backup';

import { useBackupDeps } from './backupStore';

export type PickedBackup = {
  fileName: string;
  /** The file's text, not yet parsed — `importBackupJson` is what refuses a file it cannot read. */
  json: string;
};

/** `null` when the user dismissed the picker, which is an answer rather than a failure. */
export async function pickBackupFile(): Promise<PickedBackup | null> {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json'] });
  if (picked.canceled) {
    return null;
  }
  return { fileName: picked.result.name, json: await picked.result.text() };
}

export function useImportBackup() {
  const deps = useBackupDeps();
  const queryClient = useQueryClient();

  const pick = useMutation({ meta: { operation: 'pickBackup' }, mutationFn: pickBackupFile });
  const restore = useMutation({
    meta: { operation: 'importBackup' },
    mutationFn: (backup: PickedBackup) => importBackupJson(backup.json, deps),
    // Everything on screen was read from a store that has just been replaced.
    onSuccess: () => queryClient.invalidateQueries(),
  });

  return { pick, restore };
}
