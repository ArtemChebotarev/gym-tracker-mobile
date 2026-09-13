import { StyleSheet, Text } from 'react-native';

import { RootScreen } from '@design/components/RootScreen';
import { COLORS } from '@design/tokens';

export default function MesocyclesScreen() {
  return (
    <RootScreen title="Mesocycles">
      <Text style={styles.placeholder}>Mesocycles</Text>
    </RootScreen>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    color: COLORS['text/faint'],
  },
});
