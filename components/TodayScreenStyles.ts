// Styles behind app/(tabs)/index.tsx's TodayScreen — see the `code-style` skill and
// components/LibraryScreenLogic.ts for why this lives here rather than beside the route file.

import { StyleSheet } from 'react-native';

import { COLORS } from '@design/tokens';

export const styles = StyleSheet.create({
  placeholder: {
    color: COLORS['text/faint'],
  },
});
