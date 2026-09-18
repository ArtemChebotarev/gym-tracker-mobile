// Styles behind components/PlaceholderScreen.tsx — see the `code-style` skill.

import { StyleSheet } from 'react-native';

import { COLORS } from '@design/tokens';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: COLORS['surface/page'],
  },
});
