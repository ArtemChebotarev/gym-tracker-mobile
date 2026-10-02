// The hidden developer door (task 070) — reached by five taps on the Library screen's title, not
// by any link. See components/DebugScreen.tsx for why it exists and when it goes away.
import { useRouter } from 'expo-router';

import { DebugScreen } from '@components/DebugScreen';
import { useExportBackup } from '@state/useExportBackup';
import { useExportLogs } from '@state/useExportLogs';

export default function DebugRoute() {
  const router = useRouter();
  const exportBackup = useExportBackup();
  const exportLogs = useExportLogs();

  return (
    <DebugScreen
      onExport={() => exportBackup.mutate()}
      isExporting={exportBackup.isPending}
      error={exportBackup.error?.message}
      onExportLogs={() => exportLogs.mutate()}
      isExportingLogs={exportLogs.isPending}
      logsError={exportLogs.error?.message}
      onBack={() => router.back()}
    />
  );
}
