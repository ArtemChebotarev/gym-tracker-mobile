import { StyleSheet, Text } from 'react-native';

import { RootScreen } from '@design/components/RootScreen';
import { COLORS } from '@design/tokens';

export default function TodayScreen() {
  return (
    <RootScreen title="Today">
      <Text style={styles.placeholder}>Today</Text>
    </RootScreen>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    color: COLORS['text/faint'],
  },
});
