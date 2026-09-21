// The screen behind the door (task 070): five taps on the Library title open it. Not a designed
// screen — 08 · Screens & Navigation puts export on Settings, which does not exist yet, and this
// exists so a backup can be taken today rather than after Settings is drawn. When it is, export
// moves there and this goes.
//
// Export only. Import is deliberately absent: restoring replaces everything, and a button that
// does that has no business sitting one tap away from a button that doesn't, on a screen with no
// confirmation flow. The use case exists and is tested; it gets a caller when it gets a screen
// that can ask "are you sure" properly.

import { Text, View } from 'react-native';

import { Button } from '@design/components/Button';
import { RootScreen } from '@design/components/RootScreen';

import { styles } from './DebugScreenStyles';

export type DebugScreenProps = {
  onExport: () => void;
  isExporting: boolean;
  /** Set when the last export failed — the reason, as plainly as it can be put. */
  error?: string;
  onBack: () => void;
};

export function DebugScreen({ onExport, isExporting, error, onBack }: DebugScreenProps) {
  return (
    <RootScreen title="Debug" trailing={<Button label="Done" variant="secondary" onPress={onBack} />}>
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
      </View>
    </RootScreen>
  );
}
