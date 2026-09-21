// The hidden developer door (task 070) — reached by five taps on the Library screen's title, not
// by any link. See components/DebugScreen.tsx for why it exists and when it goes away.
import { useRouter } from 'expo-router';

import { DebugScreen } from '@components/DebugScreen';
import { useExportBackup } from '@state/useExportBackup';

export default function DebugRoute() {
  const router = useRouter();
  const exportBackup = useExportBackup();

  return (
    <DebugScreen
      onExport={() => exportBackup.mutate()}
      isExporting={exportBackup.isPending}
      error={exportBackup.error?.message}
      onBack={() => router.back()}
    />
  );
}
