import { Text } from 'react-native';

import { RootScreen } from '@design/components/RootScreen';
import { styles } from '@components/MesocyclesScreenStyles';

export default function MesocyclesScreen() {
  return (
    <RootScreen title="Mesocycles">
      <Text style={styles.placeholder}>Mesocycles</Text>
    </RootScreen>
  );
}
