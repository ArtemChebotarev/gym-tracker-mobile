// The hidden developer door (task 070) — reached by five taps on the Library screen's title, not
// by any link. See components/DebugScreen.tsx for why it exists and when it goes away.
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import {
  exportErrorMessage,
  IMPORT_CONFIRM_TITLE,
  IMPORT_ERROR_TITLE,
  IMPORT_SUCCESS_MESSAGE,
  IMPORT_SUCCESS_TITLE,
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

  const showImportFailure = () => Alert.alert(IMPORT_ERROR_TITLE, importErrorMessage());

  // Pick, then ask, then write: nothing is changed until the user confirms the file they chose.
  // The outcome is an Alert, like the other action results in the app — a line of text under the
  // button was easy to miss.
  const handleImport = () => {
    importBackup.pick.mutate(undefined, {
      onSuccess: (backup) => {
        if (backup === null) {
          return;
        }
        Alert.alert(IMPORT_CONFIRM_TITLE, importConfirmMessage(backup.fileName), [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: () =>
              importBackup.restore.mutate(backup, {
                onSuccess: () => Alert.alert(IMPORT_SUCCESS_TITLE, IMPORT_SUCCESS_MESSAGE),
                onError: showImportFailure,
              }),
          },
        ]);
      },
      onError: showImportFailure,
    });
  };

  return (
    <DebugScreen
      onExport={() => exportBackup.mutate()}
      isExporting={exportBackup.isPending}
      error={exportBackup.error ? exportErrorMessage(exportBackup.error, 'data') : undefined}
      onImport={handleImport}
      isImporting={importBackup.pick.isPending || importBackup.restore.isPending}
      onExportLogs={() => exportLogs.mutate()}
      isExportingLogs={exportLogs.isPending}
      logsError={exportLogs.error ? exportErrorMessage(exportLogs.error, 'log') : undefined}
      onBack={() => router.back()}
    />
  );
}
