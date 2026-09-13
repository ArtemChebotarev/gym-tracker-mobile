import { Text } from 'react-native';

import { RootScreen } from '@design/components/RootScreen';
import { styles } from '@components/TodayScreenStyles';

export default function TodayScreen() {
  return (
    <RootScreen title="Today">
      <Text style={styles.placeholder}>Today</Text>
    </RootScreen>
  );
}
