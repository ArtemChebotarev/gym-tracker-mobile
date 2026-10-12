// The hidden developer door (task 070) — reached by five taps on the Library screen's title, not
// by any link. See components/DebugScreen.tsx for why it exists and when it goes away.
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import {
  exportErrorMessage,
  IMPORT_CONFIRM_TITLE,
  IMPORT_SUCCESS_MESSAGE,
  importConfirmMessage,
  importErrorMessage,
} from '@components/DebugRouteLogic';
import { DebugScreen } from '@components/DebugScreen';
import { useExportBackup } from '@state/useExportBackup';
import { useExportLogs } from '@state/useExportLogs';
import { useImportBackup } from '@state/useImportBackup';

export default function DebugRoute() {
  const router = useRouter();
  const exportBackup = useExportBackup();
  const exportLogs = useExportLogs();
  const importBackup = useImportBackup();

  // Pick, then ask, then write: nothing is changed until the user confirms the file they chose.
  const handleImport = () => {
    importBackup.restore.reset();
    importBackup.pick.mutate(undefined, {
      onSuccess: (backup) => {
        if (backup === null) {
          return;
        }
        Alert.alert(IMPORT_CONFIRM_TITLE, importConfirmMessage(backup.fileName), [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Restore', style: 'destructive', onPress: () => importBackup.restore.mutate(backup) },
        ]);
      },
    });
  };
  const importFailed = importBackup.pick.isError || importBackup.restore.isError;

  return (
    <DebugScreen
      onExport={() => exportBackup.mutate()}
      isExporting={exportBackup.isPending}
      error={exportBackup.error ? exportErrorMessage(exportBackup.error, 'data') : undefined}
      onImport={handleImport}
      isImporting={importBackup.pick.isPending || importBackup.restore.isPending}
      importError={importFailed ? importErrorMessage() : undefined}
      importDone={importBackup.restore.isSuccess ? IMPORT_SUCCESS_MESSAGE : undefined}
      onExportLogs={() => exportLogs.mutate()}
      isExportingLogs={exportLogs.isPending}
      logsError={exportLogs.error ? exportErrorMessage(exportLogs.error, 'log') : undefined}
      onBack={() => router.back()}
    />
  );
}
