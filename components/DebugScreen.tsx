// The screen behind the door (task 070): five taps on the Library title open it. Not a designed
// screen — 08 · Screens & Navigation puts export on Settings, which does not exist yet, and this
// exists so a backup can be taken today rather than after Settings is drawn. When it is, export
// moves there and this goes.
//
// Import (task 123) sits next to export, so a backup taken on one build can be put into the next
// (dev build → TestFlight). It does not restore on press: the route asks which file and then
// "are you sure" before anything is written.

import { Text, View } from 'react-native';

import { Button } from '@design/components/Button';
import { RootScreen } from '@design/components/RootScreen';

import { styles } from './DebugScreenStyles';

export type DebugScreenProps = {
  onExport: () => void;
  isExporting: boolean;
  /** Set when the last export failed — what to do about it, in plain words. */
  error?: string;
  /** Opens the file picker; the route confirms before it restores. */
  onImport: () => void;
  isImporting: boolean;
  onExportLogs: () => void;
  isExportingLogs: boolean;
  /** Set when the last log export failed. */
  logsError?: string;
  /** Puts a demo rest timer in the floating capsule, to see it over the tabs (GT-85). */
  onShowTimerCapsule: () => void;
  onBack: () => void;
};

export function DebugScreen({
  onExport,
  isExporting,
  error,
  onImport,
  isImporting,
  onExportLogs,
  isExportingLogs,
  logsError,
  onShowTimerCapsule,
  onBack,
}: DebugScreenProps) {
  return (
    <RootScreen
      title="Debug"
      trailing={<Button label="Done" variant="secondary" onPress={onBack} />}
    >
      <View style={styles.body}>
        <Text style={styles.description}>
          Writes everything in this app — exercises, mesocycles, sessions and logged sets — to a
          JSON file and hands it to the share sheet. It is the only backup there is.
        </Text>
        <Button
          label={isExporting ? 'Exporting…' : 'Export backup'}
          onPress={onExport}
          disabled={isExporting}
        />
        {error !== undefined && <Text style={styles.error}>{error}</Text>}
        <Text style={styles.description}>
          Puts a backup file back into this app. Only works in an app with no data of its own —
          restoring never merges with what is already here.
        </Text>
        <Button
          label={isImporting ? 'Restoring…' : 'Import backup'}
          variant="secondary"
          onPress={onImport}
          disabled={isImporting}
        />
        <Text style={styles.description}>
          A record of what went wrong in the app — failures and expected business conflicts, ids
          only, nothing you typed. Kept in a file, so it is there even when the data would not open.
        </Text>
        <Button
          label={isExportingLogs ? 'Exporting…' : 'Export logs'}
          variant="secondary"
          onPress={onExportLogs}
          disabled={isExportingLogs}
        />
        {logsError !== undefined && <Text style={styles.error}>{logsError}</Text>}
        <Text style={styles.description}>
          Shows the floating timer capsule with a made-up rest, until the rest timer drives it.
        </Text>
        <Button label="Show timer capsule" variant="secondary" onPress={onShowTimerCapsule} />
      </View>
    </RootScreen>
  );
}
